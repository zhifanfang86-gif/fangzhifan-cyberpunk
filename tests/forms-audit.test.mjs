import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const source=fs.readFileSync(new URL('../worker-script.js',import.meta.url),'utf8');
function setup(overrides={}) {
  const kv=new Map([['messages',JSON.stringify([{name:'Original',message:'Preserved',timestamp:1,email:'private@example.invalid'}])]]);
  const emails=[];
  const ctx=vm.createContext({addEventListener(){},Request,Response,URL,Date,TextDecoder,AbortSignal,crypto:webcrypto,
    RESEND_API_KEY:'synthetic-only',fetch:async(url,opts)=>{emails.push(JSON.parse(opts.body));return Response.json({id:'test'});},
    GUESTBOOK_KV:{get:async k=>Array.isArray(k)?new Map(k.map(key=>[key,kv.get(key)])):kv.get(k),put:async(k,v)=>kv.set(k,v),list:async({prefix,limit,cursor})=>{
      const names=[...kv.keys()].filter(k=>k.startsWith(prefix)).sort();const start=Number(cursor||0),end=start+limit;
      return {keys:names.slice(start,end).map(name=>({name})),list_complete:end>=names.length,cursor:String(end)};
    }},...overrides});
  vm.runInContext(source,ctx);return {ctx,kv,emails};
}
function request(path,body={name:'Visitor',message:'Hello'},headers={}) {
  return new Request('https://evafang.com'+path,{method:'POST',headers:{Origin:'https://evafang.com','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
}
test('private contact sends mail and never changes public messages',async()=>{
  const {ctx,kv,emails}=setup();const before=kv.get('messages');
  const response=await ctx.handleRequest(request('/api/contact',{name:'Private',email:'person@example.invalid',message:'Private project'}));
  assert.equal(response.status,200);assert.equal(emails.length,1);assert.equal(kv.get('messages'),before);
  assert.equal([...kv.keys()].filter(k=>k.startsWith('guestbook:')).length,0);
});
test('malformed, foreign-origin and oversized forms rejected before writes',async()=>{
  for(const path of ['/api/contact','/messages']) {
    for(const [body,headers,status] of [[null,{},400],[{name:[],message:'x'},{},400],[{name:'N',message:'x'.repeat(17000)},{},413],[{name:'N',message:'X'},{Origin:'https://evil.invalid'},403],[{name:'N',message:'X'},{'Content-Type':'text/plain'},415]]) {
      const {ctx,kv,emails}=setup();assert.equal((await ctx.handleRequest(request(path,body,headers))).status,status);assert.equal(kv.size,1);assert.equal(emails.length,0);
    }
  }
});
test('concurrent guestbook writes preserve both entries and untouched legacy',async()=>{
  const {ctx,kv}=setup();const original=kv.get('messages');
  await Promise.all([ctx.addMessage('A','','First'),ctx.addMessage('B','','Second')]);
  assert.equal(kv.get('messages'),original);const messages=await ctx.getMessages();
  assert.deepEqual(Array.from(messages,m=>m.name).sort(),['A','B','Original']);
});
test('corrupt storage and failed limiter fail closed',async()=>{
  const {ctx,kv}=setup();kv.set('messages','broken');
  assert.equal((await ctx.handleRequest(new Request('https://evafang.com/messages'))).status,503);
  assert.equal((await ctx.handleRequest(request('/messages'))).status,503);assert.equal(kv.get('messages'),'broken');
  ctx.GUESTBOOK_KV.get=async()=>{throw new Error('sensitive storage details');};
  const response=await ctx.handleRequest(request('/api/contact'));
  assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/sensitive/);
});
test('frontend contact uses private endpoint and cache failures cannot turn success into failure',()=>{
  const js=fs.readFileSync(new URL('../assets/site.js',import.meta.url),'utf8');
  assert.match(js,/fetchBounded\('\/api\/contact'/);assert.match(js,/function cacheMessages[\s\S]*?catch \{\}/);
});
