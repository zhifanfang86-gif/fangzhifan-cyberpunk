import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const source = fs.readFileSync(new URL('../worker-script.js', import.meta.url), 'utf8');
function setup() {
  let records = [{name:'Existing', email:'private@example.invalid', message:'Kept', time:'test', timestamp:1}];
  const kv = new Map();
  const ctx = vm.createContext({
    addEventListener(){}, Request, Response, URL, Date, console, TextDecoder, crypto:webcrypto,
    GUESTBOOK_KV: {
      get: async (key) => Array.isArray(key) ? new Map(key.map(k=>[k,kv.get(k)])) : key === 'messages' ? JSON.stringify(records) : kv.get(key),
      put: async (key, value) => {assert.notEqual(key,'messages'); kv.set(key,value);},
      list: async () => ({keys:[...kv.keys()].filter(k=>k.startsWith('guestbook:')).sort().map(name=>({name})),list_complete:true})
    }
  });
  vm.runInContext(source, ctx);
  return {ctx, records:()=>records, kv};
}
for (const [name, payload] of [
  ['GET', null],
  ['honeypot', {website:'bot'}],
  ['duplicate', {name:'Existing', message:'Kept'}],
  ['new entry', {name:'New', email:'new@example.invalid', message:'Hello'}]
]) {
  test('public guestbook excludes email: '+name, async()=>{
    const {ctx,records,kv} = setup();
    const response = await ctx.handleRequest(new Request('https://evafang.com/messages', payload ? {
      method:'POST', headers:{'Content-Type':'application/json',Origin:'https://evafang.com'}, body:JSON.stringify(payload)
    } : {}));
    assert.equal(response.status,200);
    const result=await response.json();
    assert.equal(result.success,true);
    for(const entry of result.data) assert.deepEqual(Object.keys(entry).sort(), ['message','name','time','timestamp']);
    assert.equal(records().find(r=>r.name==='Existing').email,'private@example.invalid');
    if(name==='new entry') assert.equal(JSON.parse([...kv.entries()].find(([k])=>k.startsWith('guestbook:'))[1]).email,'new@example.invalid');
  });
}
