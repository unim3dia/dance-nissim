// A separate, user-paced viewing room keeps exploration distinct from searching.
const room=element('dialog','discovery-room');room.id='discoveryRoom';room.setAttribute('aria-label','Discover a dance');document.body.append(room);
let deck=[],position=-1,roomFilter='',activeRecording=null;
const originalRender=render;render=function(){originalRender();syncEntry();syncFavorites()};
function syncEntry(){document.querySelectorAll('.discover-launch').forEach(b=>b.onclick=startDiscover);room.setAttribute('aria-label',t('לגלות ריקוד','Discover a dance'))}
function newDeck(){deck=dances.filter(g=>g.main.he!=='ללא כותרת'&&(!roomFilter||g.records.some(v=>v.style===roomFilter)));for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}position=0}
function startDiscover(){newDeck();room.showModal();document.body.style.overflow='hidden';showDiscovery();room.querySelector('.room-close').focus()}
function nextDiscovery(){if(!deck.length)return;position=(position+1)%deck.length;showDiscovery();animateDanceCard(room.querySelector('.room-stage'),1)}
function previousDiscovery(){if(!deck.length)return;position=(position-1+deck.length)%deck.length;showDiscovery();animateDanceCard(room.querySelector('.room-stage'),-1)}
function showDiscovery(preserveVideo=false){
const existingScreen=room.querySelector('.room-screen'),reuse=!!existingScreen;
if(!reuse){preserveVideo=false;room.replaceChildren()}
const g=deck[position];const top=element('div','room-top');const mast=element('div','room-mast');mast.append(element('span','eyebrow','DANCE NISSIM / '+t('לגלות','DISCOVER')),element('p','',t('אוסף של חיים. ריקוד אחד עכשיו.','A lifetime of dance. One moment now.')));const close=element('button','room-close',t('חזרה לספרייה ×','Back to library ×'));close.onclick=()=>room.close();const headerControls=element('div','room-header-controls');headerControls.append(languageControl(),close);top.append(mast,headerControls);if(reuse)room.querySelector('.room-top').replaceWith(top);else room.append(top);if(!g){room.append(element('p','',t('אין ריקודים בסינון הזה','No dances in this selection')));return}
if(!preserveVideo){
activeRecording=[g.main,...g.records].find(v=>(!roomFilter||v.style===roomFilter)&&v.type==='dance')||g.main;recent=[g.key,...recent.filter(k=>k!==g.key)].slice(0,40);write('recent',recent);
}
const stage=room.querySelector('.room-stage')||element('div','room-stage'),screen=existingScreen||element('div','room-screen'),video=danceVideo(screen);
const videoChoices=element('div','recordings room-recordings');videoChoices.setAttribute('role','group');videoChoices.setAttribute('aria-label',t('בחירת סרטון','Choose a video'));
const syncVideoChoices=()=>[...videoChoices.children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===activeRecording.id));
const play=v=>{activeRecording=v;video.setRecording(g,v,true);syncVideoChoices()};
for(const v of featuredRecordings(g)){const label=v.type==='teaching'?t('ללמוד את הצעדים','Learn the steps'):t('לצפות בריקוד','Watch the dance');const button=element('button','',label);button.dataset.id=v.id;button.onclick=()=>play(v);videoChoices.append(button)}syncVideoChoices();
const info=element('div','room-info'),heading=element('div','dance-heading'),danceTitle=element('h2','',title(g));danceTitle.tabIndex=-1;heading.append(danceTitle,favorite(g));info.append(heading,element('p','room-meta',[name(activeRecording),shape(activeRecording),activeRecording.year||''].filter(Boolean).join(' · ')));
const actions=element('div','room-actions');actions.append(videoChoices);const auto=createAutoplayControl(()=>video.play());
const navigation=element('nav','dance-navigation');navigation.setAttribute('aria-label',t('דפדוף בספרייה','Browse the collection'));const previous=element('button','',t('הריקוד הקודם','Previous dance'));previous.disabled=!deck.length;previous.onclick=previousDiscovery;const next=element('button','',t('הריקוד הבא','Next dance'));next.onclick=nextDiscovery;navigation.append(previous,auto,next);info.append(actions,navigation);if(reuse)room.querySelector('.room-info').replaceWith(info);else{stage.append(screen,info);room.append(stage)}
bindDanceSwipe(stage,step=>step>0?nextDiscovery():previousDiscovery());
const related=createRelatedDances(g,d=>{position=deck.findIndex(item=>item.key===d.key);showDiscovery();room.querySelector('.room-info h2')?.focus({preventScroll:true})},deck);
if(reuse)room.querySelector('.related').replaceWith(related);else room.append(related);
const foot=element('div','room-bottom');const select=element('select');select.setAttribute('aria-label',t('בחירת סוג ריקוד','Choose formation'));[['',t('כל הריקודים','All dances')],['m',t('מעגלים','Circles')],['c',t('זוגות','Couples')],['s',t('שורות','Lines')]].forEach(([value,label])=>{const o=element('option','',label);o.value=value;select.append(o)});select.value=roomFilter;select.onchange=()=>{roomFilter=select.value;newDeck();showDiscovery()};foot.append(select);if(reuse)room.querySelector('.room-bottom').replaceWith(foot);else room.append(foot);syncFavorites();if(!preserveVideo){room.scrollTop=0;video.setRecording(g,activeRecording,autoPlay)}else video.localize()}
document.addEventListener('nissim-language-change',()=>{if(room.open){showDiscovery(true);room.querySelector('[data-language-switch]').focus({preventScroll:true})}});
room.addEventListener('keydown',e=>{if(['SELECT','INPUT','BUTTON'].includes(e.target.tagName)&&e.target.tagName==='SELECT')return;if(e.key==='ArrowLeft'){e.preventDefault();nextDiscovery()}if(e.key==='ArrowRight'){e.preventDefault();previousDiscovery()}});
room.addEventListener('close',()=>{disposeDanceVideo(room.querySelector('.room-screen'));room.replaceChildren();document.body.style.overflow='';render()});syncEntry();
