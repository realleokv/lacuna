import {sanitizeLumi, DEFAULT_LUMI} from './lumi.js';
import {uid} from './utils.js';
export const STORAGE_KEY='lacuna:v1';
export function emptyState() {
  return {schema_version:1,content_version:'1.0.0',local_id:uid(),lumi:{...DEFAULT_LUMI},onboarded:false,reduced_motion:false,sessions:[],records:[],lessons:[],active:null,last_report:null};
}
export function validateState(value) {
  if (!value || value.schema_version!==1 || !Array.isArray(value.sessions) || !Array.isArray(value.records) || !Array.isArray(value.lessons)) throw new Error('Formato de dados não reconhecido.');
  if (value.records.some(r=>!r || typeof r.record_id!=='string' || typeof r.question_id!=='string' || typeof r.session_id!=='string' || typeof r.answer!=='string' || typeof r.first_answer!=='string' || !Number.isInteger(r.attempts) || r.attempts<1 || r.attempts>20 || !Number.isInteger(r.hints_used) || r.hints_used<0 || r.hints_used>3 || typeof r.first_correct!=='boolean' || typeof r.correct!=='boolean' || typeof r.finalized!=='boolean')) throw new Error('Um registro de resposta está inválido.');
  if (value.sessions.some(s=>!s || typeof s.id!=='string' || !['diagnostic','practice','reassessment'].includes(s.mode))) throw new Error('Uma sessão está inválida.');
  if (value.lessons.some(l=>!l || !['N1','N2','N3','N4'].includes(l.concept_id))) throw new Error('Uma aula está inválida.');
  if (value.active && (!value.sessions.some(s=>s.id===value.active.session_id) || typeof value.active.question_id!=='string' || !Array.isArray(value.active.hints))) throw new Error('A atividade salva está inválida.');
  return {...emptyState(),...value,lumi:sanitizeLumi(value.lumi),reduced_motion:value.reduced_motion===true,onboarded:value.onboarded===true};
}
export class ProgressStore {
  constructor(storage) {
    this.storage=storage; this.notice=''; this.locked=false; this.original=null;
    this.state=emptyState();
    try {
      const raw=storage.getItem(STORAGE_KEY);
      if(raw) {this.original=raw; this.state=validateState(JSON.parse(raw));}
    } catch(error) {
      this.locked=true;
      this.notice='Não foi possível ler o histórico. Os dados antigos foram preservados. Você pode exportá-los ou redefinir em Configurações; esta sessão ficará apenas na memória.';
    }
  }
  save() {
    if(this.locked) return false;
    try {this.storage.setItem(STORAGE_KEY,JSON.stringify(this.state)); this.notice='';return true;}
    catch {this.notice='O navegador não conseguiu salvar o progresso (armazenamento bloqueado ou cheio). Exporte seus dados antes de fechar esta página.';return false;}
  }
  reset() {
    try {this.storage.removeItem(STORAGE_KEY);}
    catch {this.notice='O navegador impediu a exclusão. Apague os dados deste site pelas configurações do navegador.';return false;}
    this.locked=false;this.original=null;this.state=emptyState();this.notice='';return true;
  }
  exportText() {return JSON.stringify({...this.state,exported_at:new Date().toISOString(),notice:'Dados locais de aprendizagem; não são uma avaliação científica.'},null,2);}
}
export function sessionRecords(state, sessionId) { return state.records.filter(r=>r.session_id===sessionId && r.finalized); }
export function completedRecords(state) { return state.records.filter(r=>r.finalized); }
export function apiRecord(r) {return {question_id:r.question_id,answer:r.answer,first_answer:r.first_answer,attempts:r.attempts,hints_used:r.hints_used};}
export function recentEvidence(records, questions) {
  const seen=new Set(), output=[];
  for(const r of [...records].reverse()) {
    const concept=questions.find(q=>q.id===r.question_id)?.concept_id;
    if(!concept || !r.finalized || seen.has(r.question_id)) continue;
    // Keep the latest attempt at each known question. The server applies the
    // three-question mastery window, while older division probes still inform
    // the recommendation until fresh division evidence resolves them.
    seen.add(r.question_id);output.unshift(apiRecord(r));
  }
  return output;
}
