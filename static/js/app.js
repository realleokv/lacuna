import {api,escapeHTML as e,icon,uid,pct,dateLabel} from './utils.js';
import {DEFAULT_LUMI,PALETTE,lumiSVG,sanitizeLumi,tone} from './lumi.js';
import {ProgressStore,STORAGE_KEY,sessionRecords,completedRecords,apiRecord,recentEvidence} from './storage.js';
import {dashboard,emptyReport,bars,STATUS,conceptStatus} from './dashboard.js';
import {diagnosticIntro,exercise,lesson} from './diagnostic.js';

let backendStorage;
try{backendStorage=window.localStorage;}catch{backendStorage={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};}
let store=new ProgressStore(backendStorage), content=null, busy=false, toastTimer, reportWarning='';
const main=document.querySelector('#main');
const state=()=>store.state;
const currentRoute=()=>location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
const currentReport=()=>state().last_report||emptyReport(content.concepts);

function notify(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},4000);}
function applyTheme(lumi=state().lumi){document.body.dataset.color=lumi.color;document.body.dataset.reducedMotion=String(state().reduced_motion);}
function storageNotice(){const element=document.querySelector('#storage-warning');element.hidden=!store.notice;element.textContent=store.notice;}
function save(){const saved=store.save();storageNotice();return saved;}
function go(hash){if(location.hash===hash){render();window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}else location.hash=hash;}
async function ask(title,description,confirm='Confirmar'){
 const dialog=document.querySelector('#confirm-dialog');
 document.querySelector('#dialog-title').textContent=title;document.querySelector('#dialog-description').textContent=description;document.querySelector('#dialog-confirm').textContent=confirm;
 dialog.returnValue='';dialog.showModal();
 return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}));
}
function setError(message,id='activity-error'){const target=document.getElementById(id);if(target)target.textContent=message;else notify(message);}
function setBusy(value){busy=value;document.querySelectorAll('[data-action="next-question"],[data-action="hint"],#answer-form button').forEach(button=>{button.setAttribute('aria-busy',String(value));});}
async function refreshReport(){
 try{state().last_report=await api('report',{records:recentEvidence(state().records,content.questions)});reportWarning='';save();}
 catch(error){reportWarning=error.message;}
}

function landing(){
 return `<section class="hero"><div class="hero-copy"><span class="eyebrow"><i class="tiny-star"></i> Um novo jeito de encontrar seu começo</span><h1>Aprender começa<br>por <span class="highlight-word">entender.</span></h1><p class="lead">Às vezes, a dificuldade está um passo atrás. Encontre suas lacunas em matemática e avance com um tutor do seu jeito.</p><div class="button-row"><a href="${state().active||state().onboarded?'#/diagnostico':'#/lumi'}" class="button">${state().active?'Continuar de onde parei':'Encontrar meu ponto de partida'} ${icon('arrow')}</a><button class="text-link" data-action="how-it-works">Como funciona ${icon('arrow')}</button></div><p class="hero-small-note">${icon('check')} Sem conta. Sem pressão. Um passo de cada vez.</p></div><div class="hero-stage"><div class="hero-halo"></div><div class="hero-bubble"><small>Oi, eu sou ${e(state().lumi.name)}!</small>Antes do próximo passo,<br>vamos entender o primeiro?</div>${lumiSVG(state().lumi)}<div class="floating-equation"><small>Toda dúvida tem um caminho</small>3x + 6 = 21</div><span class="floating-tag">${icon('spark')} Seu ritmo faz parte da resposta.</span>${icon('spark','stage-spark')}<div class="stage-dots"></div></div></section><div class="concept-strip"><span>Pequenas bases.<br>Novas possibilidades.</span>${content.concepts.map(c=>`<span class="concept-item"><span class="concept-symbol color-${c.color}">${c.symbol}</span>${e(c.name)}</span>`).join('')}</div><section class="home-section" id="how-it-works"><div class="section-intro"><div><span class="eyebrow">Do “não entendi” ao “agora fez sentido”</span><h2>O próximo passo começa<br>um pouco antes.</h2></div><p>Uma resposta errada pode esconder uma ideia que ainda precisa de atenção. É por aí que começamos.</p></div><div class="how-grid"><article class="how-card"><span class="step-number">01 / DESCUBRA</span><h3>Encontre o ponto de partida</h3><p>Responda algumas questões. O Lumi investiga os conhecimentos que vêm antes da dificuldade.</p><div class="how-art"><div class="mini-graph"><b>N1</b><i></i><b>N2</b><i></i><b>N4</b></div></div></article><article class="how-card"><span class="step-number">02 / ENTENDA</span><h3>Destrave uma ideia por vez</h3><p>Uma aula curta, exemplos claros e pistas graduais. Você escolhe quando precisa de uma mãozinha.</p><div class="how-art">${icon('bulb')}<span>Um passo. Uma descoberta.</span></div></article><article class="how-card"><span class="step-number">03 / CONECTE</span><h3>Veja seu caminho aparecer</h3><p>Tente uma nova questão e acompanhe o que suas próprias respostas revelam sobre o progresso.</p><div class="how-art">${icon('chart')}<span>Seu mapa, suas tentativas.</span></div></article></div></section><section class="home-last"><div class="personal-banner"><div><span class="eyebrow">Pequeno robô. Uma parceria do seu tamanho.</span><h2>Seu Lumi.<br>Seu jeito de aprender.</h2><p>Escolha a cor, a expressão e até o jeito de conversar. Um companheiro curioso para lembrar que toda dúvida é um começo.</p><a class="button button-white" href="#/lumi">Deixar o Lumi do meu jeito ${icon('arrow')}</a></div>${lumiSVG(state().lumi,'happy')}</div></section>`;
}

function creator(){
 const p=state().lumi;
 const choices=(field,items,four=false)=>`<div class="choice-grid ${four?'four':''}">${items.map(([v,label,symbol])=>`<label class="choice"><input type="radio" name="${field}" value="${v}" ${p[field]===v?'checked':''}><span>${symbol?`<em aria-hidden="true">${symbol}</em>`:''}${label}</span></label>`).join('')}</div>`;
 return `<section class="page-shell"><div class="page-heading"><div><span class="eyebrow">Uma parceria começa aqui</span><h1>Conheça o seu novo companheiro<span class="accent-dot">.</span></h1><p>Um pouco da sua personalidade. Um Lumi só seu.</p></div><a class="text-link" href="#/painel">Meu painel ${icon('arrow')}</a></div><div class="creator-grid"><div class="creator-preview"><span class="eyebrow">Do seu jeito, em tempo real</span><div id="lumi-preview">${lumiSVG(p)}</div><h2 id="preview-name">Oi, eu sou ${e(p.name)}.</h2><p id="preview-copy">${e(tone(p.personality,'welcome'))}</p><span class="preview-tag">${icon('spark')} Pronto para aprender com você</span></div><div><form id="lumi-form" class="creator-controls"><fieldset><legend>01 · Uma cor que combina com você</legend><div class="swatches">${Object.entries(PALETTE).map(([key,c])=>`<label class="swatch-option"><input type="radio" name="color" value="${key}" ${p.color===key?'checked':''}><span aria-hidden="true" style="background:${c.hex}"></span><small>${c.name}</small></label>`).join('')}</div></fieldset><fieldset><legend>02 · Um olhar para o mundo</legend>${choices('expression',[['happy','Feliz','⌣'],['curious','Curioso','◕'],['calm','Calmo','−']])}</fieldset><fieldset><legend>03 · O detalhe final</legend>${choices('accessory',[['none','Nenhum'],['glasses','Óculos'],['cap','Boné'],['headphones','Fones']],true)}</fieldset><fieldset><legend>04 · Como vamos conversar?</legend>${choices('personality',[['patient','Paciente'],['funny','Engraçado'],['direct','Direto']])}<p class="field-help">Muda o jeito de falar. A matemática e os critérios continuam iguais.</p></fieldset><label class="form-label" for="lumi-name">05 · Um nome para essa parceria <small>Opcional</small></label><input id="lumi-name" name="name" type="text" maxlength="20" value="${e(p.name)}" placeholder="Lumi" autocomplete="off"><p class="field-help">Até 20 caracteres. Use um apelido, não seu nome completo.</p><button class="button" type="submit">Salvar meu Lumi ${icon('check')}</button></form><div class="creator-bottom"><span>${icon('lock')} Salvo apenas neste navegador.</span><button class="text-link" data-action="reset-lumi">Voltar ao original</button></div></div></div></section>`;
}

function results(sessionId){
 const session=state().sessions.find(s=>s.id===sessionId&&s.completed_at)||[...state().sessions].reverse().find(s=>s.completed_at);
 if(!session)return `<section class="page-shell narrow intro-page"><div class="intro-mascot">${lumiSVG(state().lumi)}</div><span class="eyebrow">Uma página para suas descobertas</span><h1>Seu primeiro resultado ainda está por vir.</h1><p>Conclua uma atividade para ver suas respostas e próximas ações aqui.</p><a href="#/diagnostico" class="button">Começar diagnóstico ${icon('arrow')}</a></section>`;
 const report=currentReport(),records=sessionRecords(state(),session.id),first=records.filter(r=>r.first_correct).length,independent=records.filter(r=>r.independent).length,isPractice=session.mode==='practice';
 const next=content.concepts.find(c=>c.id===(isPractice?session.concept_id:report.recommendation.concept_id));
 const title=isPractice?'Uma ideia ganhou um novo sentido.':session.mode==='reassessment'?'Mais uma tentativa. Novas evidências.':'Seu ponto de partida está aqui.';
 const baseline=session.baseline;
 const comparable=session.mode==='reassessment'&&baseline&&Object.values(baseline.concepts).some(c=>c.total>0);
 return `<section class="page-shell"><div class="results-hero">${lumiSVG(state().lumi,'happy')}<span class="eyebrow">${isPractice?'Microaula concluída':session.mode==='reassessment'?'Reavaliação concluída':'Diagnóstico concluído'} · ${dateLabel(session.completed_at)}</span><h1>${title}</h1><p>${isPractice?'Você terminou a prática. Agora tente questões diferentes para observar o que consegue resolver sem ajuda.':'Estas respostas ajudam a escolher o próximo passo. Elas não definem sua capacidade nem são uma nota escolar.'}</p><div class="results-summary"><div><strong>${records.length}</strong><span>${records.length===1?'questão respondida':'questões respondidas'}</span></div><div><strong>${first}/${records.length}</strong><span>acertos de primeira</span></div><div><strong>${independent}</strong><span>${independent===1?'acerto independente':'acertos independentes'}</span></div></div></div><div class="recommendation-card"><div><span class="eyebrow">Seu próximo passo</span><h2>${isPractice?'Vamos testar a ideia de novo?':e(next.name)}</h2><p>${isPractice?'A reavaliação usa outras questões e inclui uma equação para conectar os conhecimentos.':e(report.recommendation.reason)}</p></div>${isPractice?`<button class="button button-accent" data-action="start-reassessment" data-concept="${session.concept_id}">Reavaliar com novas questões ${icon('arrow')}</button>`:`<a class="button button-accent" href="#/aula/${next.id}">Fazer uma aula curta ${icon('arrow')}</a>`}</div>${reportWarning?`<div class="note-box" role="status"><p>O mapa não pôde ser atualizado agora: ${e(reportWarning)} Os números desta sessão usam as respostas registradas. <button class="text-link" data-action="refresh-report">Tentar novamente</button></p></div>`:''}<div class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><span class="eyebrow">Mapa atual · evidências recentes</span><h2>O que vale observar</h2></div></div>${bars(content.concepts,report)}</article><article class="panel"><div class="panel-heading"><div><span class="eyebrow">Transparência em cada passo</span><h2>${comparable?'Antes e depois':'Suas respostas nesta sessão'}</h2></div></div>${comparable?`<div class="table-wrap"><table class="data-table comparison-table"><caption>Acertos independentes / questões distintas no recorte recente. O “antes” foi salvo ao iniciar esta reavaliação. As questões têm dificuldades diferentes; a comparação não comprova eficácia.</caption><thead><tr><th>Conceito</th><th>Antes</th><th>Agora</th></tr></thead><tbody>${content.concepts.map(c=>{const before=baseline.concepts[c.id],after=conceptStatus(report,c.id);return `<tr><td>${e(c.name)}</td><td>${before?.total?`${before.independent}/${before.total}`:'Não avaliado'}</td><td>${after.total?`${after.independent}/${after.total}`:'Não avaliado'}</td></tr>`;}).join('')}</tbody></table></div>`:`<div class="table-wrap"><table class="data-table"><caption>A primeira resposta permanece registrada, mesmo quando você acerta depois.</caption><thead><tr><th>Questão</th><th>1ª resposta</th><th>Tentativas</th><th>Pistas</th></tr></thead><tbody>${records.map(r=>`<tr><td>${e(content.questions.find(q=>q.id===r.question_id)?.expression||r.question_id)}</td><td>${r.first_correct?'Acerto':'Rever'}</td><td>${r.attempts}</td><td>${r.hints_used}/3</td></tr>`).join('')}</tbody></table></div>`}</article></div><div class="results-bottom"><a class="button button-secondary" href="#/painel">${icon('chart')} Ver meu painel</a><a class="text-link" href="#/diagnostico">Novo diagnóstico ${icon('arrow')}</a></div><div class="note-box">${icon('info')}<p>Precisamos de pelo menos 3 questões distintas recentes por conceito para aplicar a regra de domínio. Um erro isolado sugere investigação, não confirma uma lacuna.</p></div><div id="activity-error" class="inline-error" role="alert"></div></section>`;
}

function settings(){
 const p=state().lumi;
 return `<section class="page-shell"><div class="page-heading"><div><span class="eyebrow">Seu espaço, suas escolhas</span><h1>Configurações<span class="accent-dot">.</span></h1><p>Cuide da sua experiência e dos seus dados.</p></div></div><div class="settings-grid"><article class="panel"><h2>Meu Lumi</h2><div class="settings-lumi-row"><div class="settings-lumi">${lumiSVG(p)}</div><div><strong>${e(p.name)}</strong><small>${PALETTE[p.color].name} · ${{patient:'Paciente',funny:'Engraçado',direct:'Direto'}[p.personality]}</small></div></div><div class="button-row"><a class="button button-secondary" href="#/lumi">Editar meu Lumi</a><button class="text-link" data-action="reset-lumi">Redefinir</button></div><label class="setting-row"><span>Reduzir animações<small>A preferência do seu sistema também é respeitada.</small></span><input id="reduce-motion" type="checkbox" ${state().reduced_motion?'checked':''}></label></article><article class="panel"><h2>Uma cópia do seu caminho</h2><p>Exporte respostas, tentativas, pistas, atividades e preferências em JSON. A cópia pode ser lida fora do site; esta versão não importa arquivos de volta.</p><button class="button button-secondary" data-action="export">${icon('download')} Exportar meus dados</button><p class="field-help">${state().records.length} respostas registradas · ${state().sessions.filter(s=>s.completed_at).length} atividades concluídas.</p>${store.original&&store.locked?'<button class="text-link" data-action="export-original">Baixar os dados antigos preservados</button>':''}</article><article class="panel"><h2>Privacidade, sem letras miúdas</h2><div class="privacy-copy"><ul><li>Sem cadastro, senha, nome completo ou localização. Um identificador aleatório organiza sua experiência local.</li><li>Histórico e personalização ficam no armazenamento deste navegador e endereço do site. Outro dispositivo não terá o mesmo histórico.</li><li>Respostas e um recorte recente são enviados ao servidor do Lacuna para correção e diagnóstico. O aplicativo não mantém banco nem grava esses dados no servidor.</li><li>Sem anúncios, rastreadores ou APIs externas de IA. Fontes e ilustrações são servidas pelo próprio site. A hospedagem pode manter seus próprios registros técnicos de acesso.</li><li>Limpar os dados do navegador ou usar navegação privada pode apagar o progresso. Exporte uma cópia antes.</li><li>O diagnóstico é uma hipótese para orientar prática, nunca laudo, nota ou classificação definitiva.</li></ul></div></article><article class="panel danger-panel"><h2>Recomeçar com uma página em branco</h2><p>Apaga o histórico, as sessões, a personalização e as preferências deste Lacuna. Os dados de outros sites e arquivos exportados não serão apagados.</p><button class="button danger-button" data-action="delete-data">${icon('trash')} Apagar meus dados</button><p class="field-help">Esta ação não pode ser desfeita dentro do aplicativo.</p></article></div></section>`;
}

function render(){
 if(!content)return;
 applyTheme();storageNotice();
 const [route='',param]=currentRoute();
 const pages={'':landing,lumi:creator,diagnostico:()=>state().active?exercise(state(),content):diagnosticIntro(state()),painel:()=>dashboard(state(),content,currentReport())+(reportWarning?`<div class="page-shell"><div class="note-box"><p>O mapa pode estar desatualizado: ${e(reportWarning)} <button class="text-link" data-action="refresh-report">Atualizar mapa</button></p></div></div>`:''),resultados:()=>results(param),configuracoes:settings,aula:()=>{const c=content.concepts.find(c=>c.id===param);return c?lesson(state(),c):'<section class="error-page"><h1>Aula não encontrada.</h1><a class="button" href="#/painel">Voltar ao painel</a></section>';}};
 main.innerHTML=pages[route]?pages[route]():'<section class="error-page"><h1>Esse caminho ainda não existe.</h1><a class="button" href="#/">Voltar ao início</a></section>';
 main.classList.remove('view-enter');void main.offsetWidth;main.classList.add('view-enter');
 document.querySelectorAll('[data-nav]').forEach(el=>{const active=el.dataset.nav===({'':'home',painel:'dashboard',lumi:'lumi'}[route]);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 const title=(main.querySelector('h1')?.innerText||'Aprender começa por entender.').replace(/\s+/g,' ');document.title=`${title} — lacuna.`;
}

async function startSession(mode,conceptId='N1'){
 if(busy)return;
 if(state().active){const replace=await ask('Trocar de atividade?','Seu histórico de respostas será mantido. A atividade em andamento será encerrada para começar esta nova.','Trocar atividade');if(!replace)return;}
 setBusy(true);
 try {
   const next=await api('next',{records:[],mode,concept_id:conceptId});
   if(state().active){const old=state().sessions.find(s=>s.id===state().active.session_id);if(old)old.abandoned_at=new Date().toISOString();const last=state().records.find(r=>r.record_id===state().active.record_id);if(last)last.finalized=true;save();await refreshReport();}
   const session={id:uid(),mode,concept_id:conceptId,created_at:new Date().toISOString(),completed_at:null,baseline:structuredClone(currentReport())};
   state().sessions.push(session);state().active={session_id:session.id,question_id:next.question_id,total:next.total,investigating:next.investigating,hints:[],record_id:null,answer_draft:'',feedback:null};save();
   go('#/diagnostico');
 }catch(error){setError(error.message);}finally{setBusy(false);}
}

async function submitAnswer(form){
 if(busy||!state().active)return;
 const active=state().active,answer=form.elements.answer.value.trim();
 const previous=state().records.find(r=>r.record_id===active.record_id);
 if(previous?.correct)return;
 setError('','question-error');setBusy(true);
 const sessionId=active.session_id,questionId=active.question_id;
 try {
   const payload={question_id:questionId,answer,first_answer:previous?.first_answer??answer,attempts:(previous?.attempts||0)+1,hints_used:active.hints.length,personality:state().lumi.personality};
   const result=await api('diagnose',payload);
   if(state().active?.session_id!==sessionId||state().active?.question_id!==questionId)return;
   const record={...payload,...result,record_id:previous?.record_id||uid(),session_id:sessionId,at:new Date().toISOString(),finalized:false};delete record.personality;
   if(previous)Object.assign(previous,record);else state().records.push(record);
   active.record_id=record.record_id;active.answer_draft=answer;active.feedback=result;save();
   if(currentRoute()[0]==='diagnostico'){render();document.querySelector('#answer-feedback')?.focus({preventScroll:true});}
 }catch(error){setError(error.message,'question-error');}finally{setBusy(false);}
}

async function openHint(){
 if(busy||!state().active||state().active.hints.length>=3)return;
 const active=state().active,record=state().records.find(r=>r.record_id===active.record_id);
 if(record?.correct)return;
 setBusy(true);
 try{
   const hint=await api('hint',{question_id:active.question_id,level:active.hints.length+1});
   if(state().active!==active)return;
   active.hints.push(hint.text);if(record){record.hints_used=active.hints.length;record.independent=false;}save();
   if(currentRoute()[0]==='diagnostico'){render();const h=document.querySelector('.hint-card:last-child');h?.setAttribute('tabindex','-1');h?.focus({preventScroll:true});}
 }catch(error){setError(error.message);}finally{setBusy(false);}
}

async function advance(){
 if(busy||!state().active)return;
 const active=state().active,record=state().records.find(r=>r.record_id===active.record_id),session=state().sessions.find(s=>s.id===active.session_id);
 if(!record||(session.mode==='practice'&&!record.correct))return;
 setBusy(true);record.finalized=true;save();
 try{
   const next=await api('next',{records:sessionRecords(state(),session.id).map(apiRecord),mode:session.mode,concept_id:session.concept_id});
   if(state().active!==active)return;
   if(next.done){
     session.completed_at=new Date().toISOString();state().active=null;
     if(session.mode==='practice')state().lessons.push({concept_id:session.concept_id,completed_at:session.completed_at,session_id:session.id});
     save();await refreshReport();go(`#/resultados/${session.id}`);
   }else{
     state().active={session_id:session.id,question_id:next.question_id,total:next.total,investigating:next.investigating,hints:[],record_id:null,answer_draft:'',feedback:null};save();
     if(currentRoute()[0]==='diagnostico'){render();document.querySelector('#answer')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
   }
 }catch(error){setError(error.message);}finally{setBusy(false);}
}

function formLumi(form){return sanitizeLumi(Object.fromEntries(new FormData(form)));}
function updatePreview(){const form=document.querySelector('#lumi-form');if(!form)return;const p=formLumi(form);document.querySelector('#lumi-preview').innerHTML=lumiSVG(p);document.querySelector('#preview-name').textContent=`Oi, eu sou ${p.name}.`;document.querySelector('#preview-copy').textContent=tone(p.personality,'welcome');applyTheme(p);}
function download(text,filename){const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

main.addEventListener('submit',event=>{
 event.preventDefault();
 if(event.target.id==='answer-form')submitAnswer(event.target);
 if(event.target.id==='lumi-form'){
   const first=!state().onboarded;state().lumi=formLumi(event.target);state().onboarded=true;const persisted=save();notify(persisted?'Seu Lumi está pronto e salvo.':'Seu Lumi foi atualizado nesta sessão. Confira o aviso de armazenamento.');go(first?'#/diagnostico':'#/painel');
 }
});
main.addEventListener('input',event=>{
 if(event.target.closest('#lumi-form'))updatePreview();
 if(event.target.id==='answer'&&state().active){state().active.answer_draft=event.target.value;save();}
 if(event.target.id==='reduce-motion'){state().reduced_motion=event.target.checked;save();applyTheme();}
});

main.addEventListener('click',async event=>{
 const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
 const action=button.dataset.action;
 if(busy&&['hint','next-question','abandon','delete-data','start-diagnostic','start-practice','start-reassessment','restart-practice'].includes(action))return;
 switch(action){
   case 'how-it-works':document.querySelector('#how-it-works')?.scrollIntoView({behavior:state().reduced_motion||matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});break;
   case 'start-diagnostic':await startSession('diagnostic');break;
   case 'start-practice':await startSession('practice',button.dataset.concept);break;
   case 'start-reassessment':await startSession('reassessment',button.dataset.concept);break;
   case 'hint':await openHint();break;
   case 'next-question':await advance();break;
   case 'restart-practice':{const s=state().sessions.find(s=>s.id===state().active?.session_id);if(s)await startSession('practice',s.concept_id);break;}
   case 'refresh-report':await refreshReport();render();notify(reportWarning||'Mapa atualizado com suas respostas.');break;
   case 'reset-lumi':if(await ask('Voltar ao Lumi original?','A aparência e o tom voltarão ao padrão. Seu histórico de aprendizagem será mantido.','Redefinir Lumi')){state().lumi={...DEFAULT_LUMI};save();render();notify('Lumi voltou ao visual original.');}break;
   case 'abandon':if(await ask('Encerrar esta atividade?','As respostas já registradas ficam no histórico. Você poderá iniciar uma nova atividade depois.','Encerrar atividade')){const s=state().sessions.find(s=>s.id===state().active?.session_id);if(s)s.abandoned_at=new Date().toISOString();const r=state().records.find(r=>r.record_id===state().active?.record_id);if(r)r.finalized=true;state().active=null;save();await refreshReport();go('#/painel');}break;
   case 'export':download(store.exportText(),`lacuna-progresso-${new Date().toISOString().slice(0,10)}.json`);notify('A cópia dos seus dados foi preparada.');break;
   case 'export-original':download(store.original||'{}','lacuna-dados-preservados.json');break;
   case 'delete-data':if(await ask('Apagar todos os dados deste Lacuna?','Histórico, sessões e personalização serão apagados deste navegador. Exporte uma cópia antes, se quiser guardar seus registros.','Apagar meus dados')){if(store.reset()){reportWarning='';go('#/');notify('Seus dados locais foram apagados.');}else storageNotice();}break;
   case 'retry-load':await boot();break;
 }
});

document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView({behavior:'instant'});});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY){store=new ProgressStore(backendStorage);render();notify('O progresso foi atualizado em outra aba.');}});
async function boot(){
 try{content=await api('content');await refreshReport();render();}
 catch(error){main.innerHTML=`<section class="error-page">${icon('info')}<h1>Não consegui abrir as atividades.</h1><p>${e(error.message)}</p><button class="button" data-action="retry-load">Tentar novamente ${icon('reset')}</button></section>`;}
}
boot();
