import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const html=fs.readFileSync(new URL('../chat/index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../assets/chat.js',import.meta.url),'utf8');
const pause=()=>new Promise(resolve=>setTimeout(resolve,10));
function setup(fetch) {
  const dom=new JSDOM(html,{url:'https://evafang.com/chat/',runScripts:'outside-only'});
  const w=dom.window;
  w.fetch=fetch;w.AbortController=AbortController;w.TextDecoder=TextDecoder;
  w.matchMedia=()=>({matches:false});
  w.eval(js);
  const el=sel=>w.document.querySelector(sel);
  const send=()=>{el('[data-input]').value='测试';el('[data-form]').dispatchEvent(new w.Event('submit',{cancelable:true}));};
  return {dom,w,el,send};
}
const session=()=>Response.json({token:'test',ttl:1800,mock:false});
test('offline reconnect is visible and succeeds',async()=>{
  let calls=0;const {dom,w,el}=setup(async()=>{if(++calls===1)throw new Error('offline');return session();});
  try {
    await pause();assert.equal(el('[data-error]').hidden,false);
    assert.ok(el('[data-reconnect]'));
    el('[data-reconnect]').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
    await pause();assert.match(el('[data-status-text]').textContent,/READY/);
    assert.equal(el('[data-error]').hidden,true);
  } finally {dom.window.close();}
});
test('401 refresh keeps stream busy until completion, sends same-origin cookies',async()=>{
  let posts=0, sink;
  const {dom,el,send}=setup(async(url,options)=>{
    assert.equal(options.credentials,'same-origin');
    if(url.endsWith('session'))return session();
    if(++posts===1)return Response.json({error:'expired'},{status:401});
    return new Response(new ReadableStream({start(c){sink=c;}}),{headers:{'Content-Type':'text/event-stream'}});
  });
  try {
    await pause();send();await pause();
    assert.equal(posts,2);assert.equal(el('[data-stop]').hidden,false);
    assert.equal(el('[data-input]').disabled,true);
    sink.enqueue(new TextEncoder().encode('data: {"t":"你好"}\n\ndata: {"done":true}\n\n'));
    sink.close();await pause();
    assert.equal(el('[data-stop]').hidden,true);
    assert.equal(el('[data-input]').disabled,false);
    assert.match(el('.is-assistant').textContent,/你好/);
    assert.equal(el('.is-failed'),null);
  } finally {dom.window.close();}
});
test('premature stream EOF is not shown as a successful answer',async()=>{
  const {dom,el,send}=setup(async url=>url.endsWith('session')?session():new Response('data: {"t":"partial"}\n\n',{headers:{'Content-Type':'text/event-stream'}}));
  try {await pause();send();await pause();assert.ok(el('.is-failed'));assert.equal(el('[data-input]').disabled,false);}
  finally {dom.window.close();}
});
test('stop during token refresh cancels without a second POST',async()=>{
  let sessions=0,posts=0;
  const {dom,el,send}=setup(async(url,opts)=>{
    if(url.endsWith('session')) {
      if(++sessions===1)return session();
      return new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));
    }
    posts++;return Response.json({error:'expired'},{status:401});
  });
  try {
    await pause();send();await pause();el('[data-stop]').click();await pause();
    assert.equal(posts,1);assert.equal(el('[data-stop]').hidden,true);
    assert.equal(el('[data-input]').disabled,false);
  } finally {dom.window.close();}
});
