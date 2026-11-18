import {lumiSVG} from '../lumi.js';
import {emit,stats} from './progress.js';

const moodText={
 idle:'Estou por aqui.',happy:'Boa! Vamos guardar essa descoberta.',thinking:'Vamos testar uma ideia de cada vez.',
 resting:'Uma pausa também cabe no estudo.',playful:'Circuitos aquecidos. Curiosidade ligada!',surprised:'Olha o que apareceu!',
 explaining:'Vamos encontrar a pista que explica esse passo.',
};
function speakable(route,h){
 if(route==='atividade')return 'Confira a pergunta e tente primeiro. Posso abrir uma pista se precisar.';
 if(route==='trilha')return 'Os números sugerem uma ordem. Você pode abrir qualquer aula.';
 if(route==='licao')return 'Teste sua previsão no exemplo, depois coloque a ideia em prática.';
 if(route==='laboratorio'||route==='experiencia')return 'Experimente mudar uma coisa por vez e observe o resultado.';
 if(route==='revisoes')return 'Na revisão você encontra questões diferentes em outro momento.';
 if(route==='diagnostico')return 'Você pode pedir uma pista ou continuar depois.';
 return 'Comece pelo que desperta sua curiosidade. O painel guarda o próximo passo.';
}
export function attachCompanion({state,save,hub}){
 const dock=document.querySelector('#lumi-dock'),rail=dock.querySelector('.lumi-rail'),bot=dock.querySelector('#lumi-handle');
 const caption=dock.querySelector('.dock-caption'),dialog=document.querySelector('#lumi-dialog'),reply=dialog.querySelector('[role=status]');
 const snapshot=()=>state().hub;
 let mood='idle',timer,down=null,suppress=false,lastEvent=0,pose=null,lastRoute='';
 function paint(){
   const s=state(),h=s.hub;
   const pct=Math.max(0,Math.min(1,h.position));
   bot.style.left=`calc(${pct*100}% - ${pct*46}px)`;
   bot.innerHTML=lumiSVG(s.lumi,mood)+(h.outfit==='scarf'?'<span class="outfit scarf" aria-hidden="true"></span>':h.outfit==='jacket'?'<span class="outfit jacket" aria-hidden="true"></span>':'');
   bot.setAttribute('aria-label',s.lumi.name+' • conversar e pedir dicas');
 }
 function say(m,text,priority=false){
   if(!priority&&Date.now()-lastEvent<600)return;
   lastEvent=Date.now();clearTimeout(timer);mood=m;caption.textContent=text||moodText[m];paint();
   timer=setTimeout(()=>{mood='idle';paint();},4800);
 }
 function onRoute(){
   const route=location.hash.slice(2).split('/')[0];
   if(lastRoute!==location.hash){clearTimeout(timer);pose?.cancel();pose=null;lastRoute=location.hash;
     mood=route==='atividade'?'thinking':route==='perfil'?'resting':route==='laboratorio'?'playful':'idle';
     caption.textContent=speakable(route,snapshot());
   }
   dock.dataset.focus=String(['licao','atividade','diagnostico'].includes(route));paint();
 }
 function position(x){const rect=rail.getBoundingClientRect();return Math.max(0,Math.min(1,(x-rect.left-23)/Math.max(1,rect.width-46)));}
 bot.addEventListener('pointerdown',ev=>{down={x:ev.clientX,id:ev.pointerId,moved:false};bot.setPointerCapture(ev.pointerId);});
 bot.addEventListener('pointermove',ev=>{
   if(!down||ev.pointerId!==down.id)return;
   if(Math.abs(ev.clientX-down.x)>4)down.moved=true;
   if(down.moved){snapshot().position=position(ev.clientX);paint();}
 });
 function end(ev){
   if(down?.moved){suppress=true;save();setTimeout(()=>suppress=false,160);}
   down=null;
 }
 bot.addEventListener('pointerup',end);bot.addEventListener('pointercancel',end);
 bot.addEventListener('keydown',ev=>{
   if(!['ArrowLeft','ArrowRight','Home'].includes(ev.key))return;
   ev.preventDefault();const h=snapshot();h.position=ev.key==='Home'?.5:Math.min(1,Math.max(0,h.position+(ev.key==='ArrowRight'?.1:-.1)));save();paint();
 });
 function sit(){
   const h=snapshot(),reduced=state().reduced_motion||matchMedia('(prefers-reduced-motion:reduce)').matches;
   if(reduced)return;
   const anchor=document.querySelector('[data-lumi-anchor]');
   if(!anchor||!bot.animate)return;
   const bounds=anchor.getBoundingClientRect();
   if(bounds.top<0||bounds.bottom>innerHeight||bounds.width<65)return;
   // The companion's decorative double occupies a reserved, pointer-inert surface.
   anchor.innerHTML=lumiSVG(state().lumi,'playful');
   pose?.cancel();
   pose=anchor.firstElementChild.animate([{transform:'translate(-12px,16px) rotate(-12deg)'},{transform:'translate(-6px,3px) rotate(5deg)'},{transform:'translate(0,0) rotate(0)'}],{duration:650,easing:'ease-out',fill:'both'});
   anchor.dataset.seated='true';
 }
 bot.addEventListener('click',()=>{
   if(suppress)return;
   const s=state();reply.textContent=speakable(location.hash.slice(2).split('/')[0],s.hub);
   dialog.querySelector('[data-talk=hint]').hidden=!['atividade','diagnostico'].includes(location.hash.slice(2).split('/')[0])||(!document.querySelector('[data-hub=hint]')&&!document.querySelector('[data-action=hint]:not(:disabled)'));
   dialog.querySelector('[data-talk=visit]').hidden=!document.querySelector('[data-lumi-anchor]')||s.reduced_motion||matchMedia('(prefers-reduced-motion:reduce)').matches;
   dialog.showModal();emit(s.hub,'lumi_interacted','lumi.'+hub.session,{target:'dialogue'});save();
 });
 dialog.addEventListener('click',async ev=>{
   const key=ev.target.closest('[data-talk]')?.dataset.talk;if(!key)return;
   if(key==='close'){dialog.close();bot.focus();return;}
   if(key==='hint'){dialog.close();if(location.hash.startsWith('#/atividade'))await hub.hint();else document.querySelector('[data-action=hint]')?.click();return;}
   if(key==='map'){reply.textContent='Cada nó abre uma aula. “Concluída” indica o fim da prática. Para domínio provisório, procure dois acertos independentes nas três últimas questões distintas.';}
   if(key==='next'){reply.textContent=speakable(location.hash.slice(2).split('/')[0],snapshot())+' Abra o painel para sua recomendação atual.';}
   if(key==='xp'){reply.textContent=`Você tem ${stats(snapshot()).xp} XP. Uma prática inédita correta rende 5 XP, mesmo depois de uma pista.`;}
   if(key==='visit'){dialog.close();say('playful','Vou acompanhar o exemplo por aqui.',true);sit();bot.focus();}
 });
 document.addEventListener('lumi-say',ev=>say(ev.detail.mood,ev.detail.text,true));
 return {update:onRoute};
}
