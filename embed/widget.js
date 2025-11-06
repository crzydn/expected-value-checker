// /embed/widget.js
(function(){
  const WORKER_BASE = 'https://YOUR-WORKER.workers.dev';
  const s=document.currentScript; const slug=s.dataset.box;
  const wrap=document.createElement('div');
  wrap.style.cssText="border:1px solid #eee;padding:12px;border-radius:12px;font-family:system-ui, sans-serif";
  wrap.innerHTML="<div>Loading…</div>";
  s.parentNode.insertBefore(wrap,s);

  const u = `${WORKER_BASE}/api/v1/answercard?box=${encodeURIComponent(slug)}`;
  fetch(u).then(r=>r.json()).then(j=>{
    const a=j||{};
    wrap.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px">${a.title||'期待値'}</div>
      <div>${a.short_answer||'-'}</div>
      <div style="font-size:12px;color:#666;margin-top:8px">Powered by <a href="${a.source_url}" target="_blank" rel="nofollow">トレカ期待値チェッカーβ</a></div>
    `;
  }).catch(()=>{ wrap.innerHTML="<div>データ取得に失敗しました</div>"; });
})();
