// Keep one YouTube player alive while browsing so taps can control it directly.
let youtubeAPI;
const danceVideoPlayers=new WeakMap();
function loadYouTubeAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(youtubeAPI)return youtubeAPI;
  youtubeAPI=new Promise((resolve,reject)=>{
    const previous=window.onYouTubeIframeAPIReady;
    const timer=setTimeout(()=>{youtubeAPI=null;reject(new Error('YouTube API timed out'))},15000);
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);previous?.();resolve(window.YT)};
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
    script.onerror=()=>{clearTimeout(timer);script.remove();youtubeAPI=null;reject(new Error('YouTube API unavailable'))};
    document.head.append(script);
  });
  return youtubeAPI;
}
function danceVideo(host){
  if(danceVideoPlayers.has(host))return danceVideoPlayers.get(host);
  let api=null,ready=false,starting=false,disposed=false,wantsPlay=false,group,record,problem='';
  const surface=element('div','video-surface'),poster=element('button','video-poster'),mark=element('span','video-poster-play'),message=element('span','video-poster-message');
  poster.type='button';mark.append(icon('play'));message.setAttribute('role','status');
  host.replaceChildren(surface,poster);
  function localize(){
    if(!record)return;
    const label=t('נגינת הריקוד: ','Play dance: ')+title(group);
    poster.setAttribute('aria-label',label);poster.title=label;
    message.textContent=problem==='blocked'?t('לחצו על ▶ כדי להתחיל','Tap ▶ to start playback'):problem==='error'?t('הסרטון אינו זמין כאן. נסו הקלטה אחרת או את הריקוד הבא.','This recording is unavailable here. Try another recording or the next dance.'):problem==='network'?t('לא ניתן להתחבר ליוטיוב. לחצו כדי לנסות שוב.','Could not connect to YouTube. Tap to try again.'):'';
    const frame=surface.querySelector('iframe');if(frame)frame.title=title(group)+' · '+kind(record);
  }
  function showPoster(state='poster'){
    host.dataset.playback=state;surface.hidden=true;poster.hidden=false;localize();
  }
  function showPlayer(state='loading'){
    host.dataset.playback=state;poster.hidden=true;surface.hidden=false;problem='';localize();
  }
  function currentEvent(event){const id=event.target.getVideoData?.().video_id;return !id||id===record?.id}
  function play(){
    if(disposed||!record)return;
    wantsPlay=true;
    showPlayer();
    if(ready){api.playVideo();return}
    if(starting)return;
    starting=true;
    loadYouTubeAPI().then(YT=>{
      if(disposed)return;
      const mount=element('div');surface.replaceChildren(mount);
      api=new YT.Player(mount,{
        host:'https://www.youtube-nocookie.com',videoId:record.id,
        playerVars:{autoplay:0,playsinline:1,rel:0,origin:window.location.origin},
        events:{
          onReady:event=>{
            if(disposed)return;
            api=event.target;ready=true;starting=false;
            const frame=api.getIframe();frame.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';frame.allowFullscreen=true;localize();
            if(wantsPlay){showPlayer();api.loadVideoById(record.id)}
            else{api.cueVideoById(record.id);showPoster()}
          },
          onStateChange:event=>{
            if(disposed||!currentEvent(event))return;
            if(event.data===1)showPlayer('playing');
            else if(event.data===3&&wantsPlay)showPlayer('loading');
            else if(event.data===2)host.dataset.playback='paused';
            else if(event.data===0)host.dataset.playback='ended';
          },
          onAutoplayBlocked:event=>{if(!disposed&&currentEvent(event)){problem='blocked';showPoster('blocked')}},
          onError:event=>{if(!disposed&&currentEvent(event)){problem='error';showPoster('error')}}
        }
      });
    }).catch(()=>{if(!disposed){starting=false;problem='network';showPoster('error')}});
  }
  poster.onclick=play;
  const controller={
    setRecording(g,v,autoplay){
      group=g;record=v;wantsPlay=autoplay;problem='';host.dataset.recordingId=v.id;
      const thumbnail=image(v);thumbnail.loading='eager';poster.replaceChildren(thumbnail,mark,message);localize();
      if(ready){
        if(autoplay){showPlayer();api.loadVideoById(v.id)}
        else{api.pauseVideo();api.cueVideoById(v.id);showPoster()}
      }else if(autoplay)play();else showPoster();
    },
    play,localize,
    destroy(){disposed=true;api?.destroy();danceVideoPlayers.delete(host)}
  };
  danceVideoPlayers.set(host,controller);return controller;
}
function disposeDanceVideo(host){if(host)danceVideoPlayers.get(host)?.destroy()}
