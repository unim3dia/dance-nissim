const $=id=>document.getElementById(id);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem('nissim-'+key))??fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem('nissim-'+key,JSON.stringify(value))}catch{}};
let lang=read('language','he'),tab='all',limit=18,current=null,trail=[];
const saved=new Set(read('favorites',[]));let recent=read('recent',[]);
const researchedCredits=window.RESEARCHED_VIDEO_CREDITS||{};
const titleCorrections=window.VIDEO_TITLE_CORRECTIONS||{};
for(const v of window.CATALOG){
  const correction=titleCorrections[v.id];
  if(!correction)continue;
  v.previousTitle=v.he;
  v.he=correction.he;v.en=correction.en;v.rom=correction.en;
  if(correction.year!==undefined)v.year=correction.year;
  if(correction.style!==undefined)v.style=correction.style;
  if(correction.type!==undefined)v.type=correction.type;
  v.searchText=`${v.he} ${v.en} ${v.rom||''} ${v.rawHe||''} ${v.rawEn||''}`;
}
const groups=new Map();
const videoCredits=window.ARCHIVE_VIDEO_CREDITS||{};
// Corrections confirmed by the archive curator take precedence when a video row has no credit.
const manualCredits={'אדון עולם':'Gadi Bitton'};
const creditCorrections={
  'AVI PERETZ':'Avi Peretz','Avi Perez':'Avi Peretz','AVNER NAIM':'Avner Naim','BENTZY TIRAM':'Bentzi Tiram','BENTZI TIRAM':'Bentzi Tiram',
  'Dassa Danni':'Danni Dassa','David Dasa':'David Dassa','dudu barzel':'Dudu Barzilay','DUDU BARZILAY':'Dudu Barzilay',
  'ELIAHU GAMLIEL':'Eliyahu Gamliel','GADI BITON':'Gadi Bitton','KOBI MICHAELI':'Kobi Michaeli','Meir Shem-Tov':'Meir Shem Tov',
  'Moti Alfasi':'Moti Elfasi','Moti Elfassy':'Moti Elfasi','Mottie Alfassi':'Moti Elfasi','Naftali Kadish':'Naftali Kadosh',
  'Ohad Atia':'Ohad Atiya','Ohad Atiya & Gadi Bitton':'Gadi Bitton & Ohad Atiya','Raff Ziv':'Rafi Ziv','Raffi Ziv':'Rafi Ziv','RAFFI ZIV':'Rafi Ziv','RAFI ZIV':'Rafi Ziv',
  'Gadi Bitton + Ilan Benedict':'Ilan Benedict & Gadi Bitton',
  'Raya Spivak':'Ra\'aya Spivak','Riva Shturman':'Rivka Shturman','Rivka Sturman':'Rivka Shturman','Roni Siman-Tov':'Roni Siman Tov',
  'Shlomo Arusi':'Shlomo Arussi','Shoshana Kapolovich':'Shoshana Koplovitz','Siman-Tov Sfaradi':'Siman Tov Sefardi',
  'Tuvia Tshler':'Tuvia Tishler','Tuvya Tishler':'Tuvia Tishler','VICTOR GABAI':'Victor Gabai','VICTOR GABBAI':'Victor Gabai',
  'Victor Gabbai':'Victor Gabai','Victor Gabbay':'Victor Gabai','Yankele Levy':'Yankale Levy','Yankale\' Ziv':'Yankale Ziv',
  'Yaron Ben-Simchon':'Yaron Ben Simchon','Yo\'av Ashriel':'Yoav Ashriel','YONATAN GABAI':'Yonatan Gabai','Yonatan Gabay':'Yonatan Gabai',
  'Yoram Sason':'Yoram Sasson','Israel Yaakovi':'Israel Yakovee','Itzchak Sa\'ada':'Itzik Saada','Itzhak Saada':'Itzik Saada',
  'Itzik Sa\'ada':'Itzik Saada','Itzik Ben Dahan':'Itzhak Ben Dahan','Itzik Ben-Dahan':'Itzhak Ben Dahan','Levy Bargil':'Levi Bar Gil',
  'Levy Barzil':'Levi Bar Gil','Marko Ben Shime\'on':'Marco Ben Shimon','Nurit Grinfeld & Marko Ben Shimon':'Nurit Grinfeld & Marco Ben Shimon','Mishel & Gil':'Gil & Michel Cohen','Michelle Gil':'Gil & Michel Cohen',
  'מ בן שמעון':'Moshe Ben-Shimon','ישראל שיקר':'Israel Shiker','משה סקיו':'Moshe Eskayo','ניסים ומאור':'Nissim & Maor Ben-Ami',
  'איצק סעדה':'Itzik Saada','גיל ומישל כהן':'Gil & Michel Cohen','ISRAEL SHIKER':'Israel Shiker','SHMULIK GOV ARI':'Shmulik Gov-Ari',
  'MOSHE SKAYO':'Moshe Eskayo','EYAL OZERI':'Eyal Ozeri','NAFTALI KADOSH':'Naftali Kadosh'
};
const creditHebrew={
  'Alberto':'אלברטו','Ami Ben Shoshan':'עמי בן שושן','Amir Katz':'אמיר כץ','Amnon Amram':'אמנון עמרם','Amnon Shauli':'אמנון שאולי',
  'Amnon Shauli, Yehuda Emanuel, Musa Ashkenazi, Moshe Telem':'אמנון שאולי, יהודה עמנואל, מוסא אשכנזי ומשה תלם',
  'Asher Oshri':'אשר אושרי','Avi Amsalam':'אבי אמסלם','Avi Amsalem':'אבי אמסלם','Avi Levy':'אבי לוי','Avi Peretz':'אבי פרץ',
  'Avner Naim':'אבנר נעים','Bentzi Tiram':'בנצי תירם','Chaim Shireon':'חיים שיריון','Chaim Shiryon':'חיים שיריון','Danni Dassa':'דני דסה',
  'David Ben Naim':'דוד בן נעים','David Dassa':'דוד דסה','David Dassa & Alisha Selah':'דוד דסה ואלישה סלע','David Elfasi':'דוד אלפסי',
  'David Swisa':'דוד סויסה','Didi Dosh':'דידי דוש','Dudu Barzilay':'דודו ברזילי','Dudu Barzilay & Edo Israeli':'דודו ברזילי ועידו ישראלי',
  'Efrayim Weinburg':'אפרים ויינברג','Eileen Weinstock':'איילין ויינסטוק','Elad Shtamer':'אלעד שטמר','Elan Benedict':'אילן בנדיקט',
  'Eli Ronen':'אלי רונן','Eli Segal':'אלי סגל','Eliyahu Gamliel':'אליהו גמליאל','Eran Bitton':'ערן ביטון','Eyal Eliyahu':'אייל אליהו',
  'Eyal Levi':'אייל לוי','Eyal Ozeri':'אייל עוזרי','Gadi Biton & Avi Levi':'גדי ביטון ואבי לוי','Gadi Bitton':'גדי ביטון','Gila Paz':'גילה פז',
  'Hanan Dadon':'חנן דדון','Ira Weisburd':'איירה ויסברד','Israel Shabtay':'ישראל שבתאי','Israel Shiker':'ישראל שיקר',
  'Israel Shiker & Avner Naim':'ישראל שיקר ואבנר נעים','Israel Yakovee':'ישראל יעקובי','Itzhak Ben Dahan':'יצחק בן דהן','Itzik Ben-Ami':'איציק בן עמי',
  'Itzik Saada':'איציק סעדה','Kobi Michaeli':'קובי מיכאלי','Leah Bergstein':'לאה ברגשטיין','Levi Bar Gil':'לוי בר גיל',
  'Levy Bar Gil & Eli Segal':'לוי בר גיל ואלי סגל','Levy Bar Gil and Gadi Bitton':'לוי בר גיל וגדי ביטון','Mali & Moshe Lipson':'מלי ומשה ליפסון',
  'Mali Lipson':'מלי ליפסון','Mali Lipson & Moshe':'מלי ליפסון ומשה','Marco Ben Shimon':'מרקו בן שמעון','Meir Shem Tov':'מאיר שם טוב',
  'Michel Cohen':'מישל כהן','Gil & Michel Cohen':'גיל ומישל כהן','Moshe Ben-Shimon':'משה בן שמעון','Moshe Eskayo':'משה אסקיו',
  'Moshe Shem-Tov':'משה שם טוב','MOSHE TWILI':'משה טוילי','Moshe Twili & Gadi Bitton':'משה טוילי וגדי ביטון','Moshiko HaLevy':'מושיקו הלוי',
  'Moti Elfasi':'מוטי אלפסי','Naftali Kadosh':'נפתלי קדוש','Nir Dor':'ניר דור','Nissim Ben-Ami':'ניסים בן עמי',
  'Nissim & Maor Ben-Ami':'ניסים ומאור בן עמי','Maor Ben-Ami':'מאור בן עמי','Nona Malki':'נונה מלכי','Nurit Grinfeld':'נורית גרינפלד',
  'Nurit Grinfeld & Marco Ben Shimon':'נורית גרינפלד ומרקו בן שמעון','Nurit Melamed':'נורית מלמד','Ohad Atiya':'אוהד עטיה',
  'Oren Ashkenazi':'אורן אשכנזי','Oren Ashkenazi & Shlomi Mordechai':'אורן אשכנזי ושלומי מרדכי','Oren Shmuel':'אורן שמואל',
  'Ra\'aya Spivak':'רעיה ספיבק','Rafi Ziv':'רפי זיו','Rivka Shturman':'רבקה שטורמן','Roni Siman Tov':'רוני סימן טוב',
  'Saadia Amishi':'סעדיה עמישי','Sagi Azran':'שגיא עזרן','Sefi Aviv':'ספי אביב','Shalom Amar':'שלום עמר','Shimon David':'שמעון דוד',
  'Shlomo Arussi':'שלמה ארוסי','Shlomo Bachar':'שלמה בכר','Shlomo Maman':'שלמה ממן','Shmulik Gov-Ari':'שמוליק גוב-ארי',
  'Shoshana Koplovitz':'שושנה קופלוביץ','Siman Tov Sefardi':'סימן טוב ספרדי','Tamar Elyagor':'תמר אליגור',
  'Tea Ve Orez Rivka Shturman':'תה ואורז, רבקה שטורמן','Tuvia Tishler':'טוביה טישלר','Tzlil Hillman':'צליל הילמן','Tzlil Shuker':'צליל שוקר',
  'Vicky Cohen':'ויקי כהן','Victor Gabai':'ויקטור גבאי','Yair Binu':'יאיר בינו','Yankale Levy':'יענקל׳ה לוי','Yankale Ziv':'יענקל׳ה זיו',
  'Yaron Ben Simchon':'ירון בן שמחון','Yaron Malichi':'ירון מליחי','Yehonatan Karmon':'יהונתן כרמון','Yoav Ashriel':'יואב אשריאל',
  'Yom Tov Ohayon':'יום טוב אוחיון','Yonatan Gabai':'יונתן גבאי','Yoram Sasson':'יורם ששון','Yossi Azani':'יוסי עזאני',
  'Ze\'ev Nissim':'זאב ניסים','Zeev Benedict':'זאב בנדיקט','Zehev Bendiket':'זאב בנדיקט','Zev Maluch':'זאב מלוך','Zvi Friedhaber':'צבי פרידהבר'
};
const canonicalCredit=value=>creditCorrections[value]||value;
const catalogHebrew=new Map();
for(const v of window.CATALOG){if(v.choreoEn&&v.choreoHe&&/[א-ת]/.test(v.choreoHe))catalogHebrew.set(canonicalCredit(v.choreoEn),v.choreoHe)}
const assignCredit=(v,value)=>{const en=canonicalCredit(value),he=creditHebrew[en]||catalogHebrew.get(en);v.choreoKey=en;v.choreoEn=en;v.choreoHe=he||''};
const assignLocalizedCredit=(v,credit)=>{const en=canonicalCredit(credit.en);v.choreoKey=en;v.choreoEn=credit.displayEn||en;v.choreoHe=credit.he};
// Resolve credits before grouping so different choreographies with the same title stay separate.
for(const v of window.CATALOG){const researched=researchedCredits[v.id],credit=videoCredits[v.id];if(researched)assignLocalizedCredit(v,researched);else if(credit)assignCredit(v,credit);if(manualCredits[v.he])assignCredit(v,manualCredits[v.he])}
const titleCredits=new Map();
for(const v of window.CATALOG){if(!titleCredits.has(v.he))titleCredits.set(v.he,new Set());if(v.choreoKey)titleCredits.get(v.he).add(canonicalCredit(v.choreoKey))}
for(const v of window.CATALOG){const key=titleCredits.get(v.he).size>1?`${v.he}::${canonicalCredit(v.choreoKey)||v.id}`:v.he;if(!groups.has(key))groups.set(key,{key,records:[]});groups.get(key).records.push(v)}
// Carry a verified credit across the same dance's demo and teaching records.
const creditHints=[
  [/אשכנזי|ashkenazi/i,'Oren Ashkenazi','אורן אשכנזי'],[/אשריאל|ashriel/i,'Yoav Ashriel','יואב אשריאל'],
  [/גבאי|gabai/i,'Victor Gabai','ויקטור גבאי'],[/שיקר|shiker/i,'Israel Shiker','ישראל שיקר'],
  [/רונן|ronen/i,'Eli Ronen','אלי רונן'],[/בן נעים|ben naim/i,'Avner Naim','אבנר נעים'],
  [/ביטון|bitton/i,'Gadi Bitton','גדי ביטון'],[/בן עמי|ben-?ami/i,'Maor Ben-Ami','מאור בן עמי'],
  [/בן שמעון|ben shimon/i,'Moshe Ben-Shimon','משה בן שמעון'],[/ממן|maman/i,'Shlomo Maman','שלמה ממן']
];
for(const group of groups.values()){
  const manualCredit=manualCredits[group.records[0].he];
  const verified=[...new Set(group.records.map(v=>researchedCredits[v.id]?.en||videoCredits[v.id]).filter(Boolean).map(canonicalCredit))];
  let groupCredit=manualCredit||(verified.length===1?verified[0]:null);
  if(!groupCredit){const existing=[...new Set(group.records.map(v=>v.choreoKey).filter(Boolean))];if(existing.length===1)groupCredit=existing[0]}
  if(groupCredit){const source=group.records.find(v=>v.choreoKey===canonicalCredit(groupCredit)&&v.choreoHe);for(const v of group.records){if(source){v.choreoKey=source.choreoKey;v.choreoEn=source.choreoEn;v.choreoHe=source.choreoHe}else assignCredit(v,groupCredit)}}
  const known=groupCredit?group.records[0]:null;
  for(const v of group.records){
    if(known&&!v.choreoKey){v.choreoKey=known.choreoKey;v.choreoEn=known.choreoEn;v.choreoHe=known.choreoHe}
    if(!v.choreoKey){const hint=creditHints.find(([pattern])=>pattern.test(`${v.rawHe||''} ${v.rawEn||''}`));if(hint){v.choreoKey=hint[1];v.choreoEn=hint[1];v.choreoHe=hint[2]}}
  }
}
const renamedKeys=new Map();
for(const g of groups.values())for(const v of g.records){const previous=v.previousTitle==='ללא כותרת'?v.id:v.previousTitle||v.he;if(previous!==g.key){if(!renamedKeys.has(previous))renamedKeys.set(previous,new Set());renamedKeys.get(previous).add(g.key)}}
for(const key of [...saved]){const replacements=renamedKeys.get(key);if(replacements?.size===1){saved.delete(key);saved.add([...replacements][0])}}
recent=[...new Set(recent.map(key=>renamedKeys.get(key)?.size===1?[...renamedKeys.get(key)][0]:key))];write('favorites',[...saved]);write('recent',recent);
const preferredDemo={'אישה על החוף':'3sNhV4J9Awo'};
const dances=[...groups.values()].map(g=>{g.records.sort((a,b)=>b.vn-a.vn);g.main=g.records.find(v=>v.id===preferredDemo[g.records[0].he])||g.records.find(v=>v.type==='dance')||g.records[0];g.search=[...g.records.map(v=>`${v.he} ${v.en} ${v.rom||''}`),g.main.choreoHe,g.main.choreoEn].filter(Boolean).join(' ');return g});
const t=(he,en)=>lang==='he'?he:en;
const title=g=>lang==='he'?g.main.he:g.main.en||g.main.he;
const kind=v=>v.type==='teaching'?t('לימוד צעדים','Learn the steps'):v.type==='live'?t('מההרקדה','From the dance floor'):t('ביצוע הריקוד','Watch the dance');
const shape=v=>({m:t('מעגל','Circle'),c:t('זוגות','Couples'),s:t('שורות','Lines')}[v.style]||'');
const name=v=>lang==='he'?v.choreoHe||v.choreoEn:v.choreoEn||v.choreoHe;
const normalize=s=>s.normalize('NFKD').replace(/[\u0591-\u05BD\u05BF-\u05C7]/g,'').toLowerCase().replace(/[’'"־-]/g,' ').replace(/\s+/g,' ').trim();
function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
function icon(type){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');path.setAttribute('d',type==='heart'?'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z':'m8 5 11 7-11 7Z');svg.append(path);return svg}
function syncFavorites(){document.querySelectorAll('[data-save-key]').forEach(b=>{const active=saved.has(b.dataset.saveKey);b.setAttribute('aria-pressed',active);const label=t(active?'ביטול שמירה: ':'שמירת הריקוד: ',active?'Unsave dance: ':'Save dance: ')+b.dataset.danceTitle;b.setAttribute('aria-label',label);b.title=label});$('navFavorites').setAttribute('aria-label',t('השמורים שלי','My favorites'));$('navFavorites').title=t('השמורים שלי','My favorites')}
function image(v){const img=element('img');img.src=`https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg`;img.alt='';img.loading='lazy';img.addEventListener('error',()=>{img.style.visibility='hidden'},{once:true});return img}
function favorite(g){const b=element('button','favorite icon-button');b.type='button';b.dataset.saveKey=g.key;b.dataset.danceTitle=title(g);b.append(icon('heart'));b.setAttribute('aria-pressed',saved.has(g.key));const label=t('שמירת הריקוד: ','Save dance: ')+title(g);b.setAttribute('aria-label',label);b.title=label;b.onclick=()=>{saved.has(g.key)?saved.delete(g.key):saved.add(g.key);write('favorites',[...saved]);syncFavorites();if(tab==='saved')render()};return b}
function card(g){const article=element('article','card'),b=element('button','card-watch');b.setAttribute('aria-label',t('פתיחת הריקוד: ','Explore dance: ')+title(g));const thumb=element('div','thumb'),play=element('span','play-disc');play.append(icon('play'));thumb.append(image(g.main),play);b.append(thumb);b.onclick=()=>openDance(g);const heading=element('div','card-heading'),h3=element('h3'),titleButton=element('button','card-title',title(g));titleButton.onclick=()=>openDance(g);h3.append(titleButton);heading.append(h3,favorite(g));article.append(b,heading,element('p','',name(g.main)),element('p','kind',[shape(g.main),g.records.some(v=>v.type==='teaching')?t('כולל לימוד','Teaching available'):'',g.records.length>1?t(`${g.records.length} הקלטות`,`${g.records.length} recordings`):''].filter(Boolean).join(' · ')));return article}
function options(id,values){const select=$(id),value=select.value;select.replaceChildren(...values.map(([key,label])=>{const o=element('option','',label);o.value=key;return o}));if([...select.options].some(o=>o.value===value))select.value=value}
function language(){document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';document.querySelectorAll('[data-he]').forEach(el=>el.textContent=el.dataset[lang]);$('language').textContent=lang==='he'?'English':'עברית';$('search').placeholder=t('שם ריקוד או כוריאוגרף','Dance name or choreographer');$('total').textContent=t(`${dances.length.toLocaleString()} כותרי ריקוד · ${CATALOG.length.toLocaleString()} הקלטות`,`${dances.length.toLocaleString()} dance titles · ${CATALOG.length.toLocaleString()} recordings`);options('formation',[['',t('כל הסוגים','All formations')],['m',t('מעגלים','Circles')],['c',t('זוגות','Couples')],['s',t('שורות','Lines')]]);const people=new Map(CATALOG.filter(v=>v.choreoKey).map(v=>[v.choreoKey,name(v)]));options('choreographer',[['',t('כל הכוריאוגרפים','All choreographers')],...[...people].sort((a,b)=>a[1].localeCompare(b[1],lang))]);options('decade',[['',t('כל השנים','All years')],...[...new Set(CATALOG.filter(v=>v.year).map(v=>Math.floor(v.year/10)*10))].sort((a,b)=>b-a).map(y=>[String(y),`${y}–${y+9}`])]);options('sort',[['popular',t('הנצפים ביותר','Most watched')],['az',t('לפי שם','Alphabetical')],['new',t('שנה: חדש לישן','Year: newest first')],['old',t('שנה: ישן לחדש','Year: oldest first')]]);render();spotlight();preferences();if(current)renderDance()}
function filtered(){const query=normalize($('search').value).split(' ').filter(Boolean);let list=dances.filter(g=>{if(tab==='saved'&&!saved.has(g.key))return false;if(tab==='recent'&&!recent.includes(g.key))return false;if(!query.every(q=>normalize(g.search).includes(q)))return false;return g.records.some(v=>(tab!=='learn'||v.type==='teaching')&&(!$('formation').value||v.style===$('formation').value)&&(!$('choreographer').value||v.choreoKey===$('choreographer').value)&&(!$('decade').value||Math.floor(v.year/10)*10===Number($('decade').value)))});const year=g=>g.records.find(v=>v.year)?.year;return list.sort((a,b)=>tab==='recent'?recent.indexOf(a.key)-recent.indexOf(b.key):$('sort').value==='az'?title(a).localeCompare(title(b),lang):$('sort').value==='new'?(year(b)||0)-(year(a)||0):$('sort').value==='old'?(year(a)||9999)-(year(b)||9999):b.main.vn-a.main.vn)}
function render(){const tabs=[['all',t('כל הריקודים','All dances')],['learn',t('ללמוד ריקוד','Learn a dance')],['saved',t('השמורים שלי','My favorites')],['recent',t('נפתחו לאחרונה','Recently opened')]];$('tabs').replaceChildren(...tabs.map(([key,label])=>{const b=element('button','',label);b.setAttribute('aria-pressed',key===tab);b.onclick=()=>{tab=key;limit=18;render()};return b}));const list=filtered();$('grid').replaceChildren(...list.slice(0,limit).map(card));$('resultCount').textContent=t(`מוצגים ${Math.min(limit,list.length)} מתוך ${list.length} ריקודים`,`Showing ${Math.min(limit,list.length)} of ${list.length} dances`);$('more').hidden=limit>=list.length;$('empty').hidden=!!list.length;$('empty').textContent=tab==='saved'?t('לחצו על הלב לצד ריקוד כדי לשמור אותו כאן. השמורים נשמרים בדפדפן הזה.','Select a heart to save a dance here. Favorites are stored in this browser.'):tab==='recent'?t('הריקודים שתפתחו יופיעו כאן.','Dances you open will appear here.'):t('לא נמצאו ריקודים. נסו שם קצר יותר או נקו את הסינון.','No dances found. Try a shorter name or clear the filters.')}
function spotlight(){const g=dances.find(d=>d.main.he==='אדון עולם'&&d.main.choreoKey==='Gadi Bitton'),b=element('button','hero-dance');b.setAttribute('aria-label',t('פתיחת הריקוד אדון עולם','Open Adon Olam'));const caption=element('div','spotlight-caption'),copy=element('div'),play=element('span','play-disc');play.append(icon('play'));copy.append(element('strong','',title(g)),element('small','',name(g.main)+' · '+shape(g.main)));caption.append(copy,play);const img=image(g.main);img.loading='eager';b.append(img,caption);b.onclick=()=>openDance(g);$('spotlight').replaceChildren(b)}
function openDance(g,related=false){if(related&&current)trail.push(current.key);else trail=[];current=g;recent=[g.key,...recent.filter(k=>k!==g.key)].slice(0,40);write('recent',recent);renderDance();if(!$('danceDialog').open){$('danceDialog').showModal();document.body.style.overflow='hidden'}$('danceDialog').scrollTop=0;$('closeDialog').focus()}
function renderDance(){const g=current,root=$('danceContent'),body=element('div','dialog-body'),player=element('div','player');$('danceDialog').setAttribute('aria-label',title(g));$('backDance').hidden=!trail.length;const heading=element('h2','',title(g)),details=element('div','details',[name(g.main),shape(g.main),g.records.find(v=>v.year)?.year].filter(Boolean).join(' · '));const headingRow=element('div','dance-heading');headingRow.append(heading,favorite(g));const recordings=element('div','recordings'),external=element('a','external',t('צפייה ביוטיוב ↗','Watch on YouTube ↗'));external.target='_blank';external.rel='noopener';function select(v){player.replaceChildren();const iframe=element('iframe');iframe.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0`;iframe.title=title(g)+' · '+kind(v);iframe.allow='fullscreen; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;player.append(iframe);external.href=`https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;[...recordings.children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===v.id))}g.records.forEach((v,i)=>{const b=element('button','',kind(v)+(g.records.filter(r=>r.type===v.type).length>1?` · ${i+1}`:''));b.dataset.id=v.id;b.onclick=()=>select(v);recordings.append(b)});body.append(headingRow,details,recordings,external);const related=element('section','related');related.append(element('h3','',t('ממשיכים לגלות','Keep exploring')));const grid=element('div','grid');const ranked=dances.filter(d=>d.key!==g.key).map(d=>({g:d,score:(g.main.choreoKey&&d.main.choreoKey===g.main.choreoKey?5:0)+(g.main.style&&d.main.style===g.main.style?2:0)+(g.main.year&&d.main.year&&Math.abs(d.main.year-g.main.year)<10?1:0)})).sort((a,b)=>b.score-a.score||b.g.main.vn-a.g.main.vn).slice(0,6);ranked.forEach(({g:d})=>{const b=element('button');b.append(image(d.main),element('p','',title(d)));b.onclick=()=>openDance(d,true);grid.append(b)});related.append(grid);body.append(related);root.replaceChildren(player,body);select(tab==='learn'?g.records.find(v=>v.type==='teaching')||g.main:g.main)}
function preferences(){const autoTheme=new Date().getHours()>=7&&new Date().getHours()<19?'light':'dark';document.body.classList.toggle('light',read('theme',autoTheme)==='light');document.body.classList.toggle('large',read('large',false));$('textSize').setAttribute('aria-pressed',read('large',false));$('theme').textContent=document.body.classList.contains('light')?t('תצוגה כהה','Dark theme'):t('תצוגה בהירה','Light theme')}
$('language').onclick=()=>{lang=lang==='he'?'en':'he';write('language',lang);language();syncFavorites();localizeControls()};$('theme').onclick=()=>{write('theme',document.body.classList.contains('light')?'dark':'light');preferences()};$('textSize').onclick=()=>{write('large',!read('large',false));preferences()};$('filterToggle').onclick=()=>{$('filters').hidden=!$('filters').hidden;$('filterToggle').setAttribute('aria-expanded',!$('filters').hidden)};
$('navFavorites').onclick=()=>{tab='saved';limit=18;render();$('collection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})};
function localizeControls(){const summary=$('preferences').querySelector('summary'),label=t('העדפות תצוגה','Display preferences');summary.setAttribute('aria-label',label);summary.title=label;$('closeDialog').setAttribute('aria-label',t('סגירה','Close'));$('closeDialog').title=t('סגירה','Close');$('filterToggle').setAttribute('aria-label',t('סינון','Filters'));$('tabs').setAttribute('aria-label',t('הספרייה','Collection'));$('sort').setAttribute('aria-label',t('סדר תצוגה','Sort by'));document.querySelector('.main-nav').setAttribute('aria-label',t('ניווט','Navigation'));syncFavorites()}
document.addEventListener('click',e=>{if(!$('preferences').contains(e.target))$('preferences').open=false});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('preferences').open){$('preferences').open=false;$('preferences').querySelector('summary').focus()}});localizeControls();
for(const id of ['formation','choreographer','decade','sort'])$(id).onchange=()=>{limit=18;render()};let timer;$('search').oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>{limit=18;render()},180)};$('searchForm').onsubmit=e=>{e.preventDefault();clearTimeout(timer);limit=18;render()};$('reset').onclick=()=>{$('search').value='';for(const id of ['formation','choreographer','decade'])$(id).value='';limit=18;render()};$('more').onclick=()=>{const start=limit;limit+=18;render();$('grid').children[start]?.querySelector('button').focus({preventScroll:true})};$('closeDialog').onclick=()=>$('danceDialog').close();$('danceDialog').addEventListener('close',()=>{$('danceContent').replaceChildren();document.body.style.overflow='';current=null;render()});$('backDance').onclick=()=>{current=groups.get(trail.pop());renderDance();$('danceDialog').scrollTop=0};language();
