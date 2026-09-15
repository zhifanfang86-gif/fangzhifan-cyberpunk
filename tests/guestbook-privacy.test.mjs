import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../worker-script.js', import.meta.url), 'utf8');
function setup() {
  let records = [{name:'Existing', email:'private@example.invalid', message:'Kept', time:'test', timestamp:1}];
  const ctx = vm.createContext({
    addEventListener(){}, Request, Response, URL, Date, console,
    GUESTBOOK_KV: {
      get: async (key) => key === 'messages' ? JSON.stringify(records) : null,
      put: async (key, value) => {if (key === 'messages') records = JSON.parse(value);}
    }
  });
  vm.runInContext(source, ctx);
  return {ctx, records:()=>records};
}
for (const [name, payload] of [
  ['GET', null],
  ['honeypot', {website:'bot'}],
  ['duplicate', {name:'Existing', message:'Kept'}],
  ['new entry', {name:'New', email:'new@example.invalid', message:'Hello'}]
]) {
  test('public guestbook excludes email: '+name, async()=>{
    const {ctx,records} = setup();
    const response = await ctx.handleRequest(new Request('https://evafang.com/messages', payload ? {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    } : {}));
    assert.equal(response.status,200);
    const result=await response.json();
    assert.equal(result.success,true);
    for(const entry of result.data) assert.deepEqual(Object.keys(entry).sort(), ['message','name','time','timestamp']);
    assert.equal(records().find(r=>r.name==='Existing').email,'private@example.invalid');
    if(name==='new entry') assert.equal(records()[0].email,'new@example.invalid');
  });
}
