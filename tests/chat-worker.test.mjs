import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const source = fs.readFileSync(new URL('../worker-script.js', import.meta.url), 'utf8');
function setup(overrides={}) {
  const kv = new Map();
  const ctx = vm.createContext({addEventListener(){}, Request, Response, URL, Date,
    TextEncoder, TextDecoder, ReadableStream, AbortController, btoa, crypto:webcrypto,
    setTimeout, clearTimeout,
    GUESTBOOK_KV:{get:async key=>kv.get(key),put:async(key,val)=>kv.set(key,val)},
    fetch:async()=>{throw new Error('Unexpected external request');}, ...overrides});
  vm.runInContext(source,ctx);
  return ctx;
}
async function request(ctx, messages=[{role:'user',content:'你好'}]) {
  const token = await ctx.issueChatToken('192.0.2.1');
  return new Request('https://evafang.com/api/chat', {method:'POST', headers:{
    'User-Agent':'test','Origin':'https://evafang.com','CF-Connecting-IP':'192.0.2.1',
    'Content-Type':'application/json','X-Chat-Token':token}, body:JSON.stringify({messages})});
}
test('token binds IP and rejects altered signature',async()=>{
  const ctx=setup();const token=await ctx.issueChatToken('one');
  assert.equal(await ctx.verifyChatToken(token,'one'),true);
  assert.equal(await ctx.verifyChatToken(token,'two'),false);
  assert.equal(await ctx.verifyChatToken(token+'x','one'),false);
});
test('KV reads and writes fail closed before paid upstream',async()=>{
  for(const operation of ['get','put']) {
    let calls=0;
    const kv={get:async()=>null,put:async()=>{}};
    kv[operation]=async()=>{throw new Error('Unavailable');};
    const ctx=setup({GUESTBOOK_KV:kv,DEEPSEEK_API_KEY:'synthetic',fetch:async()=>{calls++;}});
    assert.equal((await ctx.handleRequest(await request(ctx))).status,503);
    assert.equal(calls,0);
    await assert.rejects(ctx.kvCount('test',6,120));
  }
});
test('message array bound and byte bound reject oversized input',async()=>{
  const ctx=setup();
  assert.equal(ctx.sanitizeChatMessages(Array(13).fill({role:'user',content:'a'})),null);
  const req=await request(ctx,[{role:'user',content:'x'.repeat(100001)}]);
  assert.equal((await ctx.handleRequest(req)).status,413);
});
test('mock stream ends explicitly and has no-store health',async()=>{
  const ctx=setup();
  const resp=await ctx.handleRequest(await request(ctx));
  assert.equal(resp.status,200);
  assert.match(await resp.text(),/"done":true/);
  const health=await ctx.handleRequest(new Request('https://evafang.com/api/health'));
  assert.equal(health.headers.get('Cache-Control'),'no-store');
});
test('relay reports premature EOF and propagates completion and cancellation',async()=>{
  for(const [raw,expected] of [
    ['data: {"choices":[{"delta":{"content":"hi"}}]}\n\n','"error"'],
    ['data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n','"done":true'],
    ['data: {"error":{"message":"private upstream detail"}}\n\n','"error"']]) {
    const ctx=setup();let cleaned=0;
    const result=await new Response(ctx.relayDeepSeekStream(new Response(raw).body,()=>cleaned++)).text();
    assert.ok(result.includes(expected)); assert.equal(cleaned,1);
    assert.ok(!result.includes('private upstream detail'));
  }
  let cancelled=false;
  const ctx=setup();
  const stream=ctx.relayDeepSeekStream(new ReadableStream({cancel(){cancelled=true;}}));
  await stream.cancel();assert.equal(cancelled,true);
});
test('model connection timeout returns a friendly error',async()=>{
  const ctx=setup({DEEPSEEK_API_KEY:'synthetic',fetch:async(_url,opts)=>new Promise((_,reject)=>{
    opts.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')));
  })});
  ctx.CHAT.UPSTREAM_TIMEOUT_MS=10;
  assert.equal((await ctx.handleRequest(await request(ctx))).status,502);
});
