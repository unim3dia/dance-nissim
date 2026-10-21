const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2),option=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const sourcePath=option('--source'),outputPath=option('--out');
const snapshotPath=path.join(root,'audit','channel-recordings-2026-10-21.json');
function load(review){
  const context=vm.createContext({window:{},localStorage:{getItem:()=>null,setItem:()=>{}}});
  for(const file of ['catalog.js','credits.js','research-data.js','pairing-data.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  if(!review)context.window.ARCHIVE_PAIRING_REVIEW=null;
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  vm.runInContext(app.slice(0,app.indexOf('const t='))+';window.auditDances=dances;',context);
  return context.window;
}
const before=load(false),after=load(true),ids=new Set(after.CATALOG.map(v=>v.id));
const flatten=entries=>entries.flatMap(entry=>entry.entries?flatten(entry.entries):[entry]);
if(sourcePath){
  const raw=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
  const entries=flatten(raw.entries||[]),matched=entries.filter(entry=>ids.has(entry.id));
  if(new Set(matched.map(v=>v.id)).size!==ids.size)throw new Error('Public source does not cover every retained catalog recording');
  const snapshot={checkedAt:'2026-10-21',channel:'https://www.youtube.com/@DanceNissim',scope:'All public channel tabs; short-form clips and curator-excluded recordings are not imported as full dance companions.',recordings:matched.map(entry=>({id:entry.id,title:entry.title,duration:entry.duration??null}))};
  fs.mkdirSync(path.dirname(snapshotPath),{recursive:true});
  fs.writeFileSync(snapshotPath,JSON.stringify(snapshot,null,2)+'\n');
}
const snapshot=JSON.parse(fs.readFileSync(snapshotPath,'utf8')),publicVideos=new Map(snapshot.recordings.map(v=>[v.id,v]));
const has=(g,kind)=>g.records.some(v=>kind==='watch'?v.type==='dance'||v.type==='live':v.type==='teaching');
function stats(groups){
  const paired=groups.filter(g=>has(g,'watch')&&has(g,'learn'));
  return {danceCards:groups.length,pairedCards:paired.length,studioDemoAndLesson:groups.filter(g=>g.records.some(v=>v.type==='dance')&&has(g,'learn')).length,pairedRecordings:paired.reduce((sum,g)=>sum+g.records.length,0),watchOnly:groups.filter(g=>has(g,'watch')&&!has(g,'learn')).length,learnOnly:groups.filter(g=>!has(g,'watch')&&has(g,'learn')).length};
}
const normalize=value=>(value||'').normalize('NFKD').replace(/[\u0591-\u05c7]/g,'').toLowerCase().replace(/[^א-תa-z0-9]/g,'');
const identity=g=>new Set(g.records.flatMap(v=>[v.he,v.en,v.en.replace(/\([^)]*\)/g,''),publicVideos.get(v.id)?.title.split('•')[0]]).map(normalize).filter(Boolean));
const groups=after.auditDances,identities=new Map(groups.map(g=>[g.key,identity(g)]));
const unresolved=groups.filter(g=>!has(g,'watch')||!has(g,'learn')).map(g=>{
  const candidates=groups.filter(other=>other.key!==g.key&&[...identities.get(g.key)].some(alias=>identities.get(other.key).has(alias))&&((!has(g,'watch')&&has(other,'watch'))||(!has(g,'learn')&&has(other,'learn'))));
  return {key:g.key,he:g.main.he,en:g.main.en,choreographer:g.main.choreoEn,missing:!has(g,'watch')?'watch':'learn',reason:candidates.length?'Possible companion has a conflicting choreography credit; not merged without verification.':'No safely matched opposite-type full recording found in the public catalog.',candidates:candidates.map(other=>({key:other.key,choreographer:other.main.choreoEn})),recordings:g.records.map(v=>({id:v.id,type:v.type,url:'https://www.youtube.com/watch?v='+v.id,sourceTitle:publicVideos.get(v.id)?.title||null}))};
});
const report={checkedAt:snapshot.checkedAt,source:snapshot.channel,scope:snapshot.scope,recordings:after.CATALOG.length,before:stats(before.auditDances),after:stats(groups),correctedTypes:Object.keys(after.ARCHIVE_PAIRING_REVIEW.typeCorrections).length,reviewedTitleRules:after.ARCHIVE_PAIRING_REVIEW.titleMatches.length,reviewedCreditRules:after.ARCHIVE_PAIRING_REVIEW.creditMatches.length,unresolved};
if(outputPath)fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,unresolved:unresolved.length},null,2));
