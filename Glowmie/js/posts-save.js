/* GLOWMIE — plan de communication : enregistrer les publications.
   Sous chaque maquette : télécharger le visuel en PNG (1080 px de large, format réseaux sociaux)
   et copier la légende. En haut de la section : tout télécharger (visuels + textes). */
(function () {
  const mocks = Array.from(document.querySelectorAll('.mock'));
  if (!mocks.length) return;
  const H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  let loading = null;
  const loadLib = () => loading || (loading = new Promise((ok, ko) => {
    if (window.html2canvas) return ok();
    const s = document.createElement('script'); s.src = H2C; s.onload = ok; s.onerror = () => ko(new Error('html2canvas indisponible')); document.head.appendChild(s);
  }));
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const ICONS = {
    'ic-heart': '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/>',
    'ic-com': '<path d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.5 3.4 6L4.5 21l4.4-2.3c1 .2 2 .3 3.1.3 5.5 0 10-3.6 10-8s-4.5-8-10-8z"/>',
    'ic-send': '<path d="M2 11 22 2l-7 20-3.5-8.5L2 11z"/>'
  };
  const info = (mock, i) => {
    const title = (mock.querySelector('.ph-title') || {}).textContent || 'post';
    const date = (mock.querySelector('.mock-date') || {}).textContent || '';
    const cap = (mock.querySelector('.cap') || {}).textContent || '';
    const goal = (mock.querySelector('.goal') || {}).textContent || '';
    return { name: `glowmie-post-${String(i + 1).padStart(2, '0')}-${slug(title)}`, title: title.trim(), date: date.trim(), cap: cap.trim(), goal: goal.trim() };
  };
  const saveBlob = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };

  async function render(mock) {
    await loadLib();
    const phone = mock.querySelector('.phone');
    const scale = 1080 / phone.getBoundingClientRect().width;
    const canvas = await window.html2canvas(phone, {
      scale, backgroundColor: null, useCORS: true, logging: false,
      onclone: (doc) => {
        // html2canvas ne gère pas les masques CSS : on remplace les icônes par du SVG
        doc.querySelectorAll('.ph-side i').forEach((el) => {
          const k = Object.keys(ICONS).find((c) => el.classList.contains(c));
          el.style.cssText = 'background:none;-webkit-mask:none;mask:none;filter:none';
          el.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="#fff">${ICONS[k] || ''}</svg>`;
        });
        doc.querySelectorAll('.phone').forEach((el) => { el.style.boxShadow = 'none'; el.style.borderRadius = '0'; });
      }
    });
    return new Promise((ok) => canvas.toBlob(ok, 'image/png'));
  }

  // boutons sous chaque maquette
  const css = document.createElement('style');
  css.textContent = `.mock-actions{display:flex;gap:6px;flex-wrap:wrap}
  .mock-actions button,.posts-save-all{border:0;border-radius:99px;padding:8px 12px;font:800 .78rem var(--body,system-ui);cursor:pointer;background:var(--plum,#2A0B22);color:var(--cream,#FFF4EF)}
  .mock-actions button.ghost{background:#fff;color:var(--plum,#2A0B22);border:1px solid var(--line,rgba(42,11,34,.15))}
  .mock-actions button:disabled,.posts-save-all:disabled{opacity:.6;cursor:wait}
  .posts-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:-6px 0 22px}
  .posts-bar p{margin:0;font-size:.85rem;color:var(--muted,#7D5A70)}
  .posts-save-all{padding:11px 18px;font-size:.85rem;background:var(--fuchsia,#E0257A)}`;
  document.head.appendChild(css);

  mocks.forEach((mock, i) => {
    const bar = document.createElement('div'); bar.className = 'mock-actions';
    bar.innerHTML = '<button type="button" data-act="img">⬇ Enregistrer le visuel</button><button type="button" class="ghost" data-act="txt">Copier le texte</button>';
    mock.querySelector('.mock-date').after(bar);
    bar.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const d = info(mock, i), label = b.textContent;
      if (b.dataset.act === 'txt') {
        const text = `${d.cap}`;
        try { await navigator.clipboard.writeText(text); b.textContent = '✓ Texte copié'; }
        catch (err) { saveBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), d.name + '.txt'); b.textContent = '✓ Texte téléchargé'; }
        setTimeout(() => { b.textContent = label; }, 1800);
        return;
      }
      b.disabled = true; b.textContent = 'Préparation…';
      try { saveBlob(await render(mock), d.name + '.png'); b.textContent = '✓ Enregistré'; }
      catch (err) { b.textContent = 'Réessayer'; }
      setTimeout(() => { b.disabled = false; b.textContent = label; }, 1800);
    });
  });

  // tout télécharger : les 9 visuels + un fichier texte avec toutes les légendes
  const grid = document.querySelector('.mocks');
  const top = document.createElement('div'); top.className = 'posts-bar';
  top.innerHTML = '<button type="button" class="posts-save-all">⬇ Tout télécharger (9 visuels + textes)</button><p>Visuels PNG en 1080 px de large, prêts à publier. Les légendes complètes sont dans un fichier texte.</p>';
  grid.before(top);
  const all = top.querySelector('button');
  all.addEventListener('click', async () => {
    all.disabled = true; const label = all.textContent;
    try {
      const lines = ['GLOWMIE · Plan de communication · 9 publications', ''];
      for (let i = 0; i < mocks.length; i++) {
        all.textContent = `Préparation ${i + 1}/${mocks.length}…`;
        const d = info(mocks[i], i);
        saveBlob(await render(mocks[i]), d.name + '.png');
        lines.push(`— Post ${i + 1} · ${d.date}`, `Visuel : ${d.name}.png`, d.cap, d.goal, '');
        await new Promise((r) => setTimeout(r, 350));
      }
      saveBlob(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), 'glowmie-publications-textes.txt');
      all.textContent = '✓ Tout est téléchargé';
    } catch (err) { all.textContent = 'Un souci, réessaie'; }
    setTimeout(() => { all.disabled = false; all.textContent = label; }, 2500);
  });
})();
