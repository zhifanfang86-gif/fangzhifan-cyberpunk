import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../assets/site.js',import.meta.url),'utf8');
const pause=()=>new Promise(r=>setTimeout(r,20));
test('real homepage form routes privately and keeps project text',async()=>{
  const dom=new JSDOM(html,{url:'https://evafang.com/',runScripts:'outside-only'}),w=dom.window,calls=[];
  try {
    w.matchMedia=()=>({matches:true});w.fetch=async(url,opts)=>{calls.push([url,opts]);return Response.json({success:true,data:[]});};w.AbortController=AbortController;
    w.eval(js);await pause();const form=w.document.querySelector('[data-contact-form]');
    form.elements.name.value='Test';form.elements.message.value='Private details '.repeat(50);
    form.dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();
    const post=calls.find(([,opts])=>opts.method==='POST');assert.equal(post[0],'/api/contact');
    assert.ok(JSON.parse(post[1].body).message.length>500);assert.match(form.querySelector('[data-form-status]').textContent,/已发送/);
  } finally {w.close();}
});
test('storage denied still displays fresh public messages; Escape closes menu',async()=>{
  const dom=new JSDOM(html,{url:'https://evafang.com/',runScripts:'outside-only'}),w=dom.window;
  try {
    w.matchMedia=()=>({matches:true});w.AbortController=AbortController;
    Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage denied');}});
    w.fetch=async()=>Response.json({success:true,data:[{name:'Public',message:'Fresh message',time:'now'}]});
    w.eval(js);await pause();assert.match(w.document.querySelector('[data-guestbook-feed]').textContent,/Fresh message/);
    const menu=w.document.querySelector('[data-menu-button]');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'true');
    w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(menu.getAttribute('aria-expanded'),'false');
  } finally {w.close();}
});
