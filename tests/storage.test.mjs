import test from 'node:test';
import assert from 'node:assert/strict';
import {ProgressStore,STORAGE_KEY,apiRecord,recentEvidence} from '../static/js/storage.js';
import {sanitizeLumi,lumiSVG} from '../static/js/lumi.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};};
const sample=(overrides={})=>({record_id:'r1',question_id:'op_001',concept_id:'N1',session_id:'s1',answer:'25',first_answer:'25',attempts:1,hints_used:0,first_correct:true,correct:true,independent:true,finalized:true,...overrides});

test('save and reopen retains preferences, active draft and completed answers',()=>{
 const storage=memory(),a=new ProgressStore(storage);
 a.state.lumi={...a.state.lumi,color:'mint',name:'Luna',accessory:'glasses'};
 a.state.sessions.push({id:'s1',mode:'diagnostic',created_at:'2026-11-10T12:00:00Z'});
 a.state.records.push(sample());
 a.state.active={session_id:'s1',question_id:'eq_001',hints:['Primeiro passo'],answer_draft:'4'};
 assert.equal(a.save(),true);
 const b=new ProgressStore(storage);
 assert.equal(b.state.lumi.color,'mint');assert.equal(b.state.lumi.name,'Luna');
 assert.equal(b.state.records.length,1);assert.equal(b.state.active.answer_draft,'4');assert.equal(b.state.active.hints.length,1);
});
test('malformed storage is preserved and cannot be silently overwritten',()=>{
 const storage=memory();storage.setItem(STORAGE_KEY,'{broken');const s=new ProgressStore(storage);
 assert.equal(s.locked,true);assert.equal(s.save(),false);assert.equal(storage.getItem(STORAGE_KEY),'{broken');
 assert.equal(s.original,'{broken');assert.ok(s.notice);
});
test('unknown schema is preserved for export',()=>{
 const storage=memory(),original='{"schema_version":99}';storage.setItem(STORAGE_KEY,original);
 const s=new ProgressStore(storage);assert.equal(s.locked,true);assert.equal(s.original,original);
});
test('quota failure surfaces warning without losing memory records',()=>{
 const storage=memory();const s=new ProgressStore(storage);storage.setItem=()=>{throw Error('quota');};s.state.records.push(sample());
 assert.equal(s.save(),false);assert.equal(s.state.records.length,1);assert.match(s.notice,/não conseguiu salvar/);
});
test('delete affects only Lacuna data and resets all preferences',()=>{
 const storage=memory(),s=new ProgressStore(storage);storage.setItem('another-app','keep');s.state.records.push(sample());s.save();
 assert.equal(s.reset(),true);assert.equal(storage.getItem(STORAGE_KEY),null);assert.equal(storage.getItem('another-app'),'keep');assert.equal(s.state.records.length,0);
});
test('export contains complete responses and local preferences',()=>{
 const s=new ProgressStore(memory());s.state.records.push(sample());const exported=JSON.parse(s.exportText());
 assert.equal(exported.schema_version,1);assert.equal(exported.records[0].first_answer,'25');assert.ok(exported.exported_at);assert.equal(exported.lumi.name,'Lumi');
});
test('nickname cannot inject SVG and custom choices stay allowlisted',()=>{
 const p=sanitizeLumi({name:'<img src=x onerror=1>',color:'red" onclick="bad',accessory:'bad'});
 const svg=lumiSVG(p);assert.equal(p.color,'lavender');assert.equal(p.accessory,'none');assert.equal(svg.includes('<img'),false);assert.ok(svg.includes('&lt;img'));
 assert.ok(Array.from(sanitizeLumi({name:'A'.repeat(30)}).name).length<=20);
});
test('all 144 minimum appearance combinations produce a valid SVG source',()=>{
 let count=0;
 for(const color of ['lavender','sky','mint','peach'])for(const expression of ['happy','curious','calm'])for(const accessory of ['none','glasses','cap','headphones'])for(const personality of ['patient','funny','direct']){
  assert.match(lumiSVG({color,expression,accessory,personality}),/^<svg/);count++;
 }
 assert.equal(count,144);
});
test('report keeps distinct evidence beyond the mastery window without duplicates',()=>{
 const questions=[1,2,3,4].map(n=>({id:'q'+n,concept_id:'N1'}));
 const records=[1,2,3,4,4].map((n,i)=>sample({record_id:'r'+i,question_id:'q'+n}));
 assert.deepEqual(recentEvidence(records,questions).map(r=>r.question_id),['q1','q2','q3','q4']);
 assert.equal('first_correct' in apiRecord(records[0]),false);
});
