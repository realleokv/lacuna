export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const icon = (name, cls = '') => {
  const shapes = {
    arrow:'<path d="M4 12h15M13 6l6 6-6 6"/>', back:'<path d="M20 12H5m6-6-6 6 6 6"/>',
    check:'<path d="m5 12 4 4L19 6"/>', spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    chart:'<path d="M4 4v16h16M8 15v-4m5 4V7m5 8v-6"/>', book:'<path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zM12 6v15"/>',
    bulb:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9z"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', reset:'<path d="M4 9a8 8 0 1 1 0 6M4 3v6h6"/>',
    trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>', eye:'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>', close:'<path d="m6 6 12 12M6 18 18 6"/>',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.spark}</svg>`;
};
export async function api(path, data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api/${path}`, {signal:controller.signal, method:data ? 'POST':'GET', headers:data ? {'Content-Type':'application/json'} : {}, body:data ? JSON.stringify(data):undefined});
    let json; try { json=await response.json(); } catch { throw new Error('O servidor não respondeu como esperado. Tente novamente.'); }
    if (!response.ok) throw new Error(json.error || 'Não foi possível concluir a solicitação.');
    return json;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('O servidor está demorando. Tente novamente em instantes.');
    if (error instanceof TypeError) throw new Error('Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.');
    throw error;
  } finally { clearTimeout(timeout); }
}
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export const dateLabel = iso => { const date=new Date(iso); return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}); };
export const pct = (n,d) => d ? Math.round(100*n/d) : 0;
