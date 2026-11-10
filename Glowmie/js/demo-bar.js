/* GLOWMIE — bandeau commun à toutes les pages :
   mention obligatoire « Projet étudiant INSEEC, démo sans vente réelle »
   + navigation entre les 4 espaces du site (vente, CRM, stratégie, communication). */
(function () {
  var path = location.pathname;
  var base = /\/marketing\//.test(path) ? '../' : '';
  var current = /admin\.html$/.test(path) ? 'crm' : /dossier\.html$/.test(path) ? 'strategie' : /communication\.html$/.test(path) || /\/marketing\//.test(path) ? 'communication' : 'vente';
  var spaces = [
    ['vente', 'index.html', '1. Vente'],
    ['crm', 'admin.html', '2. CRM'],
    ['strategie', 'dossier.html', '3. Stratégie'],
    ['communication', 'communication.html', '4. Communication']
  ];

  var css = ':root{--demo-h:38px}' +
    '.demo-bar{position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 16px;background:#2A0B22;color:#FFF4EF;font:600 12.5px/1.3 Manrope,Nunito,system-ui,sans-serif;box-sizing:border-box}' +
    '.demo-bar .demo-note{margin:0}.demo-bar .demo-note b{color:#F9E49A;font-weight:800}' +
    '.demo-bar nav{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}.demo-bar nav::-webkit-scrollbar{display:none}' +
    '.demo-bar nav a{color:#FFF4EF;text-decoration:none;padding:5px 11px;border-radius:99px;white-space:nowrap;font-weight:700}' +
    '.demo-bar nav a:hover{background:rgba(255,255,255,.14)}.demo-bar nav a:focus-visible{outline:2px solid #F9E49A;outline-offset:1px}' +
    '.demo-bar nav a[aria-current=page]{background:#F5A9CB;color:#2A0B22}' +
    'body{padding-top:var(--demo-h)!important}' +
    '.site-head,header.top,.mobile-top,.mobile-nav,.drawer{top:var(--demo-h)!important}' +
    '.drawer{height:calc(100% - var(--demo-h))!important}' +
    '.side{top:var(--demo-h)!important;height:calc(100vh - var(--demo-h))!important}' +
    '@media (max-width:760px){.demo-bar{flex-direction:column;align-items:stretch;gap:3px;padding:5px 8px;font-size:11.5px}.demo-bar .demo-note{text-align:center}.demo-bar nav{justify-content:space-between}.demo-bar nav a{padding:4px 8px}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.className = 'demo-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Projet étudiant et espaces du site');
  bar.innerHTML = '<p class="demo-note">🎓 <b>Projet étudiant INSEEC, démo sans vente réelle</b></p>' +
    '<nav aria-label="Les 4 espaces du site">' + spaces.map(function (s) {
      return '<a href="' + base + s[1] + '"' + (s[0] === current ? ' aria-current="page"' : '') + '>' + s[2] + '</a>';
    }).join('') + '</nav>';
  document.body.insertBefore(bar, document.body.firstChild);

  // la hauteur du bandeau change sur mobile (2 lignes) : on la répercute sur la mise en page
  var sync = function () { document.documentElement.style.setProperty('--demo-h', bar.offsetHeight + 'px'); };
  sync();
  if (window.ResizeObserver) new ResizeObserver(sync).observe(bar); else window.addEventListener('resize', sync);
})();
