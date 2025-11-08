// /embed/widget.js  — 安定化＆多機能版（置き換えOK）
(function(){
  // ==== 設定（data-* で上書き可）====
  const s = document.currentScript;
  const WORKER_BASE = (s.dataset.worker || 'https://evchecker.crzydn.workers.dev').replace(/\/+$/,'');
  const slug = (s.dataset.box || '').trim();               // 必須
  const theme = (s.dataset.theme || 'light').toLowerCase(); // 'light' | 'dark'
  const compact = s.dataset.compact === '1' || s.dataset.compact === 'true';

  // ==== ラッパ生成 ====
  const wrap = document.createElement('div');
  wrap.setAttribute('role','group');
  wrap.setAttribute('aria-label','トレカ期待値ウィジェット');
  wrap.style.cssText = [
    'font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";',
    'border:1px solid #e5e7eb;',
    'border-radius:12px;',
    'padding:12px;',
    'width:100%;',
    'box-sizing:border-box;',
    theme === 'dark'
      ? 'background:#0f172a;color:#e5e7eb;border-color:#334155;'
      : 'background:#ffffff;color:#111827;border-color:#e5e7eb;',
    compact ? 'max-width:420px;' : 'max-width:640px;'
  ].join('');
  wrap.innerHTML = '<div style="font-weight:600;opacity:.8">Loading…</div>';
  s.parentNode.insertBefore(wrap, s);

  // ==== 早期バリデーション ====
  if (!slug) {
    renderError('ボックス識別子（data-box）が指定されていません。');
    return;
  }

  // ==== 取得関数（タイムアウト＆リトライ）====
  function fetchJsonWithTimeout(url, opts={}){
    const { timeoutMs = 9000, retries = 1 } = opts;
    return new Promise((resolve, reject)=>{
      const controller = new AbortController();
      const id = setTimeout(()=>controller.abort(), timeoutMs);
      fetch(url, { signal: controller.signal, cache:'no-store' })
        .then(r=>{
          clearTimeout(id);
          if(!r.ok) throw new Error('HTTP '+r.status);
          return r.json();
        })
        .then(resolve)
        .catch(err=>{
          clearTimeout(id);
          if(retries>0){
            // 1回だけリトライ
            setTimeout(()=> {
              fetchJsonWithTimeout(url, { timeoutMs, retries: retries-1 }).then(resolve).catch(reject);
            }, 400);
          }else{
            reject(err);
          }
        });
    });
  }

  // ==== XSS 安全なエスケープ ====
  const esc = s => String(s==null?'':s)
                    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // ==== レンダラ ====
  function renderCard(a){
    const title = a.title || '期待値';
    const answer = a.short_answer || a.answer || '-';
    const src = a.source_url || (WORKER_BASE + '/');
    const og = a.og_image || (WORKER_BASE + '/og/box/' + encodeURIComponent(slug));

    const labelStyle = 'font-size:12px;color:'+ (theme==='dark' ? '#94a3b8' : '#6b7280') + ';';
    const btnStyle = [
      'display:inline-block;padding:6px 10px;border-radius:8px;',
      'text-decoration:none;font-size:12px;font-weight:600;',
      theme==='dark'
        ? 'background:linear-gradient(135deg,#1f2937,#334155);color:#e5e7eb;'
        : 'background:linear-gradient(135deg,#111827,#4b5563);color:#fff;'
    ].join('');

    wrap.innerHTML = `
      <div style="display:flex; gap:10px; align-items:flex-start;">
        <img src="${esc(og)}" alt="OG" width="72" height="38" style="border-radius:8px;border:1px solid ${theme==='dark'?'#334155':'#e5e7eb'};object-fit:cover;flex:0 0 72px;">
        <div style="flex:1 1 auto; min-width:0;">
          <div style="font-weight:700; font-size:14px; margin:2px 0 6px;">${esc(title)}</div>
          <div style="font-size:13px; line-height:1.5; white-space:pre-wrap; word-break:break-word;">${esc(answer)}</div>
          <div style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <span style="${labelStyle}">Powered by</span>
            <a href="${esc(src)}" target="_blank" rel="nofollow noopener sponsored" style="${btnStyle}">トレカ期待値チェッカーβ</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderError(msg){
    const fg = (theme==='dark') ? '#e5e7eb' : '#111827';
    const bg = (theme==='dark') ? '#1f2937' : '#fff7ed';
    const bd = (theme==='dark') ? '#334155' : '#fed7aa';
    wrap.innerHTML = `
      <div style="background:${bg}; border:1px solid ${bd}; color:${fg}; padding:10px; border-radius:8px; font-size:13px;">
        データ取得に失敗しました。${esc(msg||'')}
      </div>
    `;
  }

  // ==== 実行 ====
  (async ()=>{
    try{
      const url = `${WORKER_BASE}/api/v1/answercard?box=${encodeURIComponent(slug)}`;
      const a = await fetchJsonWithTimeout(url, { timeoutMs: 9000, retries: 1 });
      if (!a || typeof a !== 'object') throw new Error('Invalid JSON');
      renderCard(a);
    }catch(e){
      renderError(e.message || String(e));
    }
  })();
})();
