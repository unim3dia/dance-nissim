const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({window:{},localStorage:{getItem:key=>key==='nissim-favorites'?JSON.stringify(['בדם אהבת','בפונדק קטן::Nissim Ben-Ami','דבקה כייף::Moshe Eskayo','דבקה כייף::Mali & Moshe Lipson']):null,setItem:()=>{}}});
for(const file of ['catalog.js','credits.js','research-data.js','pairing-data.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
vm.runInContext(app.slice(0,app.indexOf('const t='))+';window.dances=dances;window.saved=[...saved];window.featured=featuredRecordings;',context);
const {CATALOG:catalog,ARCHIVE_PAIRING_REVIEW:review,dances}=context.window;
const videos=new Map(catalog.map(v=>[v.id,v])),groupFor=new Map(dances.flatMap(g=>g.records.map(v=>[v.id,g])));
for(const [id,type] of Object.entries(review.typeCorrections))assert.equal(videos.get(id).type,type);
for(const rule of [...review.titleMatches,...review.creditMatches])for(const id of rule.ids){
  assert.equal(groupFor.get(id).key,groupFor.get(rule.sourceId).key,`Reviewed companion is still split: ${id}`);
  assert.ok(rule.reason,'Pairing correction needs an evidence explanation');
}
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'audit/channel-recordings-2026-10-21.json'),'utf8'));
assert.equal(new Set(snapshot.recordings.map(v=>v.id)).size,catalog.length,'Public source snapshot must cover every retained recording');
const sourceKind=title=>/\b(?:learn|teaching)\b|לימוד|(?:^|\s)ל\s*[מזש](?:\s|$)/i.test(title)?'teaching':/\bdance\b/i.test(title)?'watch':null;
for(const entry of snapshot.recordings){
  const video=videos.get(entry.id);assert.ok(video,`Unknown source recording: ${entry.id}`);
  const kind=sourceKind(entry.title);
  if(kind)assert.equal(video.type==='teaching'?'teaching':'watch',kind,`Public source video type disagrees: ${entry.id}`);
}
assert.ok(context.window.saved.includes('בדם אהבתי'),'Renamed dance favorite was lost');
assert.ok(context.window.saved.includes('בפונדק קטן'),'Split-credit favorite was lost');
for(const pair of [['dw75Ye_bb38','ZHM0OrPRaeo'],['k8i8BbJxm74','UwHpDm7mAxo'],['46LyH27fA0A','AGJ7wQlPJyQ'],['wwkBw7Ld7BU','Yx9IaA2_cNo']]){
  const group=groupFor.get(pair[0]),featured=context.window.featured(group);
  assert.equal(group.key,groupFor.get(pair[1]).key);
  assert.ok(featured.some(v=>v.type==='teaching')&&featured.some(v=>v.type!=='teaching'),`Watch/Learn pair missing: ${group.key}`);
}
// Similar titles are not enough to collapse different dances.
for(const [a,b] of [['pvz3C7j7eZ0','UpzC4tR7nQU'],['Ayg3kfn42pM','0W1Wp5VGThI'],['vcD45583LWY','JmpeNvE6Fb4']])assert.notEqual(groupFor.get(a).key,groupFor.get(b).key,'Distinct choreographies were merged');
assert.ok(!/Teaching available|כולל לימוד|\$\{featuredRecordings\(g\)\.length\} recordings/.test(app),'Redundant availability/count badges returned');
const paired=dances.filter(g=>g.records.some(v=>v.type!=='teaching')&&g.records.some(v=>v.type==='teaching'));
const debka=dances.filter(g=>g.main.he==='דבקה כייף');
assert.equal(debka.length,1,'Debka Keff is split across cards');
assert.ok(context.window.saved.includes(debka[0].key),'Debka Keff favorite was lost');
assert.ok(!context.window.saved.some(key=>key.startsWith('דבקה כייף::')),'Old split Debka Keff favorites remain');
assert.equal(debka[0].records.length,6,'Debka Keff archival recording lost');
for(const v of debka[0].records){assert.equal(v.choreoEn,'Moshe Eskayo');assert.equal(v.choreoHe,'משה אסקיו')}
const debkaChoices=context.window.featured(debka[0]);
assert.equal(debkaChoices.find(v=>v.type==='dance')?.id,'lP1GCJi2Qaw');
assert.equal(debkaChoices.find(v=>v.type==='live')?.id,'_YVMBD_QDWM');
assert.ok(debkaChoices.some(v=>v.type==='teaching'));
assert.equal(debkaChoices.length,3);
assert.equal(dances.length,796);
assert.equal(paired.length,592);
console.log(`Verified all ${catalog.length} public source titles, ${review.titleMatches.length+review.creditMatches.length} reviewed merge rules, 592 Watch/Learn cards, favorite migration, and distinct-dance safeguards.`);
