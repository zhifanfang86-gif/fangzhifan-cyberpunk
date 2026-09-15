import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
for(const page of ['index.html','services/index.html','consulting/index.html','daily/index.html','chat/index.html']) {
  test('clear assistant header entry: '+page,()=>{
    const dom=new JSDOM(fs.readFileSync(new URL('../'+page,import.meta.url),'utf8'));
    const d=dom.window.document;
    const entry=d.querySelector('header a.assistant-entry');
    assert.equal(entry?.getAttribute('href'),'/chat/');
    assert.match(entry.textContent,/AI 助手/);
    assert.ok(d.querySelector('link[href="/assets/assistant-entry.css?v=3.6.4"]'));
    if(page==='index.html')assert.equal(entry.closest('[data-menu]'),null);
    if(page==='chat/index.html')assert.equal(entry.getAttribute('aria-current'),'page');
    dom.window.close();
  });
}
test('prompt preserves truthful capability and site boundaries',()=>{
  const worker=fs.readFileSync(new URL('../worker-script.js',import.meta.url),'utf8');
  for(const boundary of ['不是方志凡本人','没有联网搜索','不编造客户','不输出内心独白','只有涉及具体项目报价','/services/','/#guestbook']) assert.ok(worker.includes(boundary),boundary);
});
