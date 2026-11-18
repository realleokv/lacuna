import {uid} from '../utils.js';

export const RULES = Object.freeze({practiceXP:5, lessonXP:10, reviewXP:10, levelXP:60, dayMs:86400000});
export const SHOP = {
  scarf:{name:'Cachecol de explorador',price:3},
  jacket:{name:'Jaleco de laboratório',price:6},
  star:{name:'Estrela para o perfil',price:4},
};
export const labels = {new:'Ainda não avaliado',learning:'Em desenvolvimento',practice:'Precisa praticar',provisional:'Domínio provisório',confirmed:'Domínio reconfirmado'};

export function initialHub(){
  return {version:1, name:'', avatar:'🌱', interests:[], preferences:{theme:'auto',large:false,contrast:false,mute:true,level:'auto',interval:2,view:'map'},
    events:[], runs:{}, resume:null, owned:[], outfit:'', decoration:false, position:0.5};
}
const plain = x => x && typeof x==='object' && !Array.isArray(x);
const eventTypes=new Set(['lesson_started','hint_requested','question_answered','practice_correct','lesson_completed','review_completed','checkpoint_completed','diagnostic_completed','concept_mastery_changed','lumi_interacted','reward_unlocked','lab_experience_started']);
export function validateHub(h){
  const base=initialHub();
  if(h===undefined)return base;
  if(!plain(h)||h.version!==1||!plain(h.preferences)||!plain(h.runs)||!Array.isArray(h.events)
    ||!Array.isArray(h.interests)||!h.interests.every(x=>typeof x==='string')||!Array.isArray(h.owned)||!h.owned.every(x=>Object.hasOwn(SHOP,x))
    ||typeof h.name!=='string'||typeof h.avatar!=='string'||!Number.isFinite(h.position)||h.position<0||h.position>1
    ||h.events.some(x=>!plain(x)||!eventTypes.has(x.type)||typeof x.id!=='string'||typeof x.at!=='number'||typeof x.day!=='string')
    ||Object.entries(h.runs).some(([key,r])=>!plain(r)||r.key!==key||typeof r.id!=='string'||!Array.isArray(r.ids)||!r.ids.every(x=>typeof x==='string')||!Number.isInteger(r.index)||r.index<0||r.index>r.ids.length||!plain(r.answers)
      ||Object.values(r.answers).some(a=>!plain(a)||!Number.isInteger(a.tries)||!Array.isArray(a.hints)||!a.hints.every(x=>typeof x==='string'))))throw Error('Histórico do hub inválido.');
  return {...base,...h,preferences:{...base.preferences,...h.preferences}};
}

export function localDay(now){
  const date=new Date(now);
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
export function emit(h,type,id,fields={},now=Date.now()){
  if(h.events.some(x=>x.id===id))return false;
  h.events.push({...fields,type,id,at:now,day:localDay(now),version:1});
  return true;
}
export function evidence(h,lesson){
  const seen=new Set();
  return h.events.filter(x=>x.type==='question_answered'&&x.lesson===lesson&&!seen.has(x.question)&&seen.add(x.question));
}
export function mastery(h,lesson){
  const rows=evidence(h,lesson).slice(-3);
  if(!rows.length)return 'new';
  if(rows.length===3&&rows.filter(x=>x.independent).length>=2){
    const last=h.events.filter(x=>x.lesson===lesson&&x.type==='review_completed').at(-1);
    if(last?.confirmed&&rows.some(x=>x.question===last.question))return 'confirmed';
    return 'provisional';
  }
  return rows.filter(x=>!x.correct).length>=2?'practice':'learning';
}
export function difficulty(h,lid){
  if(['1','2','3'].includes(h.preferences.level))return Number(h.preferences.level);
  return ({new:1,practice:1,learning:2,provisional:3,confirmed:3})[mastery(h,lid)];
}
export function due(h,lid,now=Date.now(),session=''){
  const completed=h.events.filter(x=>x.lesson===lid&&['lesson_completed','review_completed'].includes(x.type)).at(-1);
  if(!completed)return false;
  const elapsed=now-completed.at;
  return elapsed >= Number(h.preferences.interval)*RULES.dayMs || (elapsed<0&&!!session&&session!==completed.session);
}
export function freshReview(h,lesson){
  const seen=new Set(evidence(h,lesson.id).map(x=>x.question));
  return lesson.questions.find(q=>q.role==='review'&&!seen.has(q.id));
}
export function finished(h,type,target){return h.events.some(x=>x.type===type&&x.target===target);}
export function recommendation(h,lessons,now,session){
  const review=lessons.find(l=>due(h,l.id,now,session)&&freshReview(h,l));
  if(review)return {lesson:review,reason:'Chegou a hora de testar a ideia com uma questão inédita.',review:true};
  const weak=lessons.find(l=>mastery(h,l.id)==='practice')||lessons.find(l=>evidence(h,l.id).some(x=>!x.correct)&&!finished(h,'lesson_completed',l.id));
  if(weak){
    const pre=lessons.find(l=>weak.prerequisites.includes(l.id)&&!['confirmed','provisional'].includes(mastery(h,l.id)));
    return {lesson:pre||weak,reason:pre?'Esta base ajuda na questão que trouxe dificuldade.':'Sua primeira resposta sugere rever este exemplo.'};
  }
  const remaining=lessons.filter(l=>!finished(h,'lesson_completed',l.id));
  const next=remaining.find(l=>h.interests.includes(l.area))||remaining[0]||lessons[0];
  return {lesson:next,reason:h.events.some(x=>x.type==='question_answered')?'Próximo conceito disponível no seu percurso.':'Sugestão inicial. Você também pode escolher qualquer trilha.'};
}
export function startRun(h,mode,target,qs,session,now=Date.now()){
  const key=mode+'~'+target;
  let run=h.runs[key];
  if(!run||run.index>=run.ids.length){
    run={key,id:uid(),mode,target,ids:qs.map(q=>q.id),index:0,answers:{},session,started:now};
    h.runs[key]=run;
    emit(h,'lesson_started',run.id+'.start',{target,mode,session},now);
  }
  h.resume=key;
  return run;
}
export function answerState(run,qid){
  return run.answers[qid]??=( {tries:0,hints:[],draft:'',correct:false,feedback:''} );
}
export function submitResult(h,run,q,value,result,now=Date.now()){
  if(run.ids[run.index]!==q.id)return;
  const a=answerState(run,q.id);
  if(a.correct)return;
  const old=mastery(h,q.concept_id);
  if(a.tries===0){
    a.independent=result.correct&&a.hints.length===0;
    emit(h,'question_answered',run.id+'.first.'+q.id,{lesson:q.concept_id,question:q.id,session:run.session,correct:result.correct,independent:a.independent,first:value,difficulty:q.difficulty},now);
  }
  a.tries++;a.correct=result.correct;a.draft=value;a.feedback=result.text;
  if(result.correct)emit(h,'practice_correct','correct.'+q.id,{lesson:q.concept_id,question:q.id},now);
  const next=mastery(h,q.concept_id);
  if(old!==next)emit(h,'concept_mastery_changed',run.id+'.mastery.'+q.id,{lesson:q.concept_id,from:old,to:next},now);
}
export function advanceRun(h,run,questions,now=Date.now()){
  const q=questions.get(run.ids[run.index]);
  if(!q)return false;
  const a=answerState(run,q.id);
  if(!a.correct&&!(run.mode==='diagnostic'&&a.tries>0))return false;
  run.index++;
  if(run.index<run.ids.length)return true;
  const type=({lesson:'lesson_completed',review:'review_completed',diagnostic:'diagnostic_completed',checkpoint:'checkpoint_completed'})[run.mode];
  const data={target:run.target,lesson:q.concept_id,question:q.id,session:run.session};
  if(run.mode==='review'){
    const before=evidence(h,q.concept_id).filter(x=>x.question!==q.id).slice(-3);
    data.confirmed=before.length===3&&before.filter(x=>x.independent).length>=2&&a.independent&&mastery(h,q.concept_id)==='provisional'&&due(h,q.concept_id,now,run.session);
  }
  emit(h,type,run.mode==='review'?'review.'+q.id:type+'.'+run.target,data,now);
  if(data.confirmed)emit(h,'concept_mastery_changed',run.id+'.confirmed',{lesson:q.concept_id,from:'provisional',to:'confirmed'},now);
  if(h.resume===run.key)h.resume=null;
  return true;
}

export function stats(h,now=Date.now()){
  const count=t=>h.events.filter(x=>x.type===t).length;
  const practices=count('practice_correct'), lessons=count('lesson_completed'), reviews=h.events.filter(x=>x.type==='review_completed'&&x.confirmed).length;
  const xp=practices*RULES.practiceXP+lessons*RULES.lessonXP+reviews*RULES.reviewXP;
  const days=[...new Set(h.events.filter(x=>x.type==='question_answered').map(x=>x.day))].sort();
  const today=localDay(now), daily=h.events.filter(x=>x.type==='practice_correct'&&x.day===today).length;
  let cursor=Date.parse(today+'T00:00:00Z'),streak=0;
  const dayAt=t=>new Date(t).toISOString().slice(0,10);
  if(!days.includes(today))cursor-=RULES.dayMs;
  while(days.includes(dayAt(cursor))){streak++;cursor-=RULES.dayMs;}
  const coins=practices+lessons*2-h.owned.reduce((total,id)=>total+SHOP[id].price,0);
  return {xp,level:1+Math.floor(xp/RULES.levelXP),coins,streak,days,daily,lessons,practices,reviews};
}
export function buy(h,id){
  if(!Object.hasOwn(SHOP,id)||h.owned.includes(id)||stats(h).coins<SHOP[id].price)return false;
  h.owned.push(id);emit(h,'reward_unlocked','buy.'+id,{target:id});return true;
}
