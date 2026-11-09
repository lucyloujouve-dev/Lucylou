/* GLOWMIE — application boutique (routeur + vues) */
(function () {
  const DB = window.GlowDB, Art = window.GlowArt;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const date = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- préférences d'animation ---------- */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.GlowMotion = {
    reduced() { const p = store.get('glowmie_motion'); return p ? p === 'off' : mq.matches; },
    set(on) { store.set('glowmie_motion', on ? 'on' : 'off'); applyMotion(); render(); }
  };
  function applyMotion() {
    const r = GlowMotion.reduced();
    document.documentElement.classList.toggle('no-motion', r);
    document.documentElement.classList.toggle('js-motion', !r);
    const b = $('#motionToggle'); if (b) b.innerHTML = r ? '▶︎ Activer les animations' : '⏸ Réduire les animations';
  }
  mq.addEventListener && mq.addEventListener('change', () => { applyMotion(); render(); });

  /* ---------- icônes ---------- */
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  const bgFor = () => 'bg-blush';   // fond rose studio pour tous les produits
  const stars = (r) => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
  const STATUS = { payee: 'Payée', en_preparation: 'En préparation', expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée', remboursee: 'Remboursée' };
  const STATUS_STEP = { payee: 1, en_preparation: 2, expediee: 3, livree: 4 };

  /* ---------- toasts & effets ---------- */
  function toast(msg) {
    const z = $('#toasts'); const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    z.appendChild(t); setTimeout(() => t.remove(), 2800);
  }
  function flyToCart(fromEl) {
    const target = $('#cartBtn'); if (!fromEl || !target || GlowMotion.reduced() || !window.gsap) return;
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'flyer'; f.textContent = '💗'; document.body.appendChild(f);
    gsap.set(f, { left: a.left + a.width / 2 - 14, top: a.top - 10 });
    gsap.to(f, { duration: .8, left: b.left + 8, ease: 'power1.inOut' });
    gsap.to(f, { duration: .8, top: b.top, ease: 'back.in(2)', scale: .6, onComplete: () => f.remove() });
  }
  function confetti() {
    if (GlowMotion.reduced() || !window.gsap) return;
    const colors = ['#F5A9CB', '#C9B5F2', '#F9E49A', '#A72D70', '#fff'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('div'); c.className = 'confetti'; c.style.background = colors[i % 5];
      document.body.appendChild(c);
      gsap.set(c, { left: innerWidth / 2, top: innerHeight / 3, rotation: Math.random() * 360 });
      gsap.to(c, { duration: 1.6 + Math.random(), left: Math.random() * innerWidth, top: innerHeight + 40, rotation: '+=' + (Math.random() * 720), ease: 'power2.in', onComplete: () => c.remove() });
    }
  }

  /* ---------- cartes produits ---------- */
  function card(p) {
    const me = DB.me(); const fav = me && me.favorites.includes(p.id);
    const promo = p.compareAt && p.compareAt > p.price;
    return `<article class="card" data-tilt>
      <a href="#/produit/${p.id}" class="visual ${bgFor(p)}" aria-label="Voir ${esc(p.name)}">${Art.product(p)}${p.photos ? Art.photo(p.photos[1], { cls: 'alt', w: 520, h: 546, sizes: '(max-width: 600px) 50vw, 300px' }) : ''}</a>
      <div class="tags">${p.isNew ? '<span class="tag new">Nouveau</span>' : ''}${promo ? `<span class="tag promo">-${Math.round((1 - p.price / p.compareAt) * 100)} %</span>` : ''}</div>
      <button class="fav ${fav ? 'on' : ''}" data-fav="${p.id}" aria-pressed="${!!fav}" aria-label="${fav ? 'Retirer des' : 'Ajouter aux'} favoris">${I.heart}</button>
      <h3><a href="#/produit/${p.id}" style="text-decoration:none">${esc(p.name)}</a></h3>
      <div class="sub">${esc(p.tagline)} · <span class="stars" aria-label="Note ${p.rating} sur 5">${stars(p.rating)}</span></div>
      <div class="row"><span class="price">${eur(p.price)}${promo ? `<s>${eur(p.compareAt)}</s>` : ''}</span>
      <button class="btn small" data-add="${p.id}" ${DB.stockOf(p) ? '' : 'disabled'}>${DB.stockOf(p) ? 'Ajouter <span class="arrow">→</span>' : 'Épuisé'}</button></div>
    </article>`;
  }

  /* ligne produit éditoriale (shop) */
  function row(p) {
    const me = DB.me(); const fav = me && me.favorites.includes(p.id);
    const promo = p.compareAt && p.compareAt > p.price; const cat = (DB.raw.categories.find((c) => c.id === p.category) || {}).label || '';
    return `<article class="row-p" style="--th:${themeOf(p)}">
      <a href="#/produit/${p.id}" class="rp-img" aria-label="Voir ${esc(p.name)}">${Art.product(p)}</a>
      <div class="rp-main"><span class="rp-cat">${esc(cat)}${p.isNew ? ' · Nouveau' : ''}${promo ? ` · -${Math.round((1 - p.price / p.compareAt) * 100)} %` : ''}</span>
        <h3><a href="#/produit/${p.id}">${esc(p.name)}</a></h3>
        <p>${esc(p.tagline)}<span class="stars" aria-label="Note ${p.rating} sur 5">${stars(p.rating)} (${reviewsOf(p.id)})</span></p></div>
      <div class="rp-side"><span class="price">${eur(p.price)}${promo ? ` <s>${eur(p.compareAt)}</s>` : ''}</span>
        <div class="rp-actions"><button class="fav ${fav ? 'on' : ''}" data-fav="${p.id}" aria-pressed="${!!fav}" aria-label="${fav ? 'Retirer des' : 'Ajouter aux'} favoris">${I.heart}</button>
        <button class="pill-btn" data-add="${p.id}" ${DB.stockOf(p) ? '' : 'disabled'}>${DB.stockOf(p) ? 'Ajouter <span>+</span>' : 'Épuisé'}</button></div></div>
    </article>`;
  }

  /* ================= VUES ================= */
  const views = {};

  /* Univers produits de la page d'accueil (couleur, décor 3D, typographie géante) */
  const UNIVERSES = [
    { id: 'glow-drops', deco: 'glossy', bg: '#FFB9D7', ink: '#C3105D', words: ['GLOW', 'DROPS'], kicker: 'Sérum éclat', line: 'Le flacon rose qui fait briller ta journée. Acide hyaluronique et niacinamide, en gouttes glossy.' },
    { id: 'daily-cloud', deco: 'cloud', bg: '#FFF0BC', ink: '#E0257A', words: ['DAILY', 'CLOUD'], kicker: 'Crème hydratante', line: 'Une texture nuage, douce comme un dimanche matin. Elle fond, elle hydrate, elle reste.' },
    { id: 'clear-crush', deco: 'bubbles', bg: '#DCCBFB', ink: '#6A1FC2', words: ['CLEAR', 'CRUSH'], kicker: 'Sérum anti-imperfections', line: 'Des bulles lilas pour une peau nette, sans jamais la dessécher.' },
    { id: 'sun-sunny', deco: 'sun', bg: '#FFD84D', ink: '#D61F6E', words: ['SUN', 'SUNNY'], kicker: 'Fluide SPF 50', line: 'Ton soleil de poche : invisible, léger, et lumineux tous les jours.' }
  ];
  const THEMES = { 'glow-drops': '#FFB9D7', 'daily-cloud': '#FFF0BC', 'clear-crush': '#DCCBFB', 'sun-sunny': '#FFD84D', 'fresh-start': '#FFC6DF', 'melt-in': '#FFC1D9', 'tone-glow': '#FFCCE0', 'dew-me': '#FFBCD6', 'peel-party': '#E1CFFA', 'night-bloom': '#CDB6F7', 'eye-love': '#FFC9DF', 'jelly-mist': '#E3D3FB', 'mask-up': '#FFC3D2', 'glow-routine': '#FFCFE3' };
  const themeOf = (p) => THEMES[p.id] || '#FFD3E5';
  const reviewsOf = (id) => DB.raw.reviews.filter((r) => r.productId === id && r.status === 'publie').length;

  views.home = () => {
    const posts = DB.raw.articles.slice(0, 3);
    const list = DB.products();
    const words = (w, cls) => `<div class="giant ${cls}" aria-hidden="true">${w.map((x, i) => `<span style="--i:${i}">${x}</span>`).join('')}</div>`;
    return `
    <section class="s-hero" data-scene="hero" data-bg="#FFF4EF">
      <div class="layer back">
        <p class="hero-kicker reveal-up">Skincare fun, doux & glossy<br><em>pour les 18–28 ans</em></p>
        <h1 class="wordmark" aria-label="Glowmie">${'GLOWMIE'.split('').map((l, i) => `<span style="--i:${i}">${l}</span>`).join('')}</h1>
        <img class="still still-hero" src="${DB.product('glow-drops').packshot}" alt="Glow Drops, sérum éclat Glowmie">
        <div class="hero-foot">
          <p class="hero-line"><b>Good skin. Good mood.</b> Des formules douces, des packagings qui donnent envie, des routines qui tiennent en trois gestes.</p>
          <div class="hero-ctas"><a class="pill-btn" href="#/shop">Shop now <span>→</span></a><a class="pill-btn ghost" href="#/quiz">Find your glow ✦</a></div>
        </div>
        <div class="scroll-cue" aria-hidden="true"><span></span>Scroll</div>
      </div>
      <div class="layer front" aria-hidden="true"><div class="wordmark outline">${'GLOWMIE'.split('').map((l, i) => `<span style="--i:${i}">${l}</span>`).join('')}</div></div>
    </section>

    <section class="s-manifesto" data-scene="manifesto" data-bg="#2A0B22">
      <div class="layer back">
        <div class="crawl c1" aria-hidden="true">Your skin · Your mood · Your glow · Your skin · Your mood · Your glow ·</div>
        <div class="manifesto-copy">
          <p class="eyebrow-da">Manifeste</p>
          <h2>On ne traite pas ta peau comme un problème.<br><em>On la chouchoute.</em></h2>
          <p>Treize soins, des textures qu'on a envie de toucher, des prix doux. Le skincare devient le petit moment préféré de ta journée.</p>
        </div>
        <div class="crawl c2" aria-hidden="true">Glossy · Fresh · Cloudy · Sunny · Glossy · Fresh · Cloudy · Sunny ·</div>
      </div>
      <div class="layer front" aria-hidden="true"><div class="crawl c3 outline">Good skin · Good mood · Good skin · Good mood ·</div></div>
    </section>

    ${UNIVERSES.map((u, n) => { const p = DB.product(u.id); const k = p.pack || {}; return `
    <section class="s-universe" data-scene="u:${u.id}:${u.deco}" data-bg="${u.bg}" style="--ink:${u.ink};--uni-bg:${u.bg}">
      <div class="layer back">
        ${words(u.words, 'solid')}
        <img class="still" src="${p.packshot}" alt="${esc(p.name)}, ${esc(p.tagline)}">
      </div>
      <div class="layer front">${words(u.words, 'outline')}
        <article class="u-card">
          <div class="u-card-top"><span class="u-num">0${n + 1} / 0${UNIVERSES.length}</span><span class="stars">★★★★★</span><span class="u-rev">${reviewsOf(p.id)} avis</span></div>
          <p class="u-kicker">${esc(u.kicker)}</p>
          <h2>${esc(p.name)}</h2>
          <p class="u-line">${esc(u.line)}</p>
          ${k.badge ? `<div class="u-tags">${k.badge.split('•').map((b) => `<span>${esc(b.trim())}</span>`).join('')}</div>` : ''}
          <div class="u-buy"><span class="u-price">${eur(p.price)}</span><button class="pill-btn" data-add="${p.id}">Ajouter <span>+</span></button><a class="u-more" href="#/produit/${p.id}">Découvrir →</a></div>
        </article>
      </div>
    </section>`; }).join('')}

    <section class="s-quiz" data-scene="plain" data-bg="#2A0B22">
      <div class="quiz-stage">
        <p class="eyebrow-da">Quiz · 2 minutes</p>
        <h2 class="quiz-giant">Trouve<br><em>ton glow.</em></h2>
        <p>10 questions sur ta peau, ton rythme et ton mood. Une routine expliquée, rien que pour toi.</p>
        <a class="pill-btn light" href="#/quiz">Commencer le quiz <span>→</span></a>
      </div>
    </section>

    <section class="s-bag" data-scene="bag" data-bg="#FFD1E4">
      <div class="layer back">
        <h2 class="bag-title">C'est dans<br>le <em>sac.</em></h2>
        <p class="bag-sub">Livraison offerte dès 35 € · retours gratuits 30 jours</p>
        <div class="bag" aria-hidden="true"><div class="bag-handle"></div><div class="bag-back"></div></div>
        <div class="bag-cta"><a class="pill-btn" href="#/shop">Remplir mon sac <span>→</span></a></div>
      </div>
      <div class="layer front" aria-hidden="true">
        <div class="bag bag-f"><div class="bag-front"><b>GLOWMIE</b><small>good skin · good mood</small></div>
          <div class="gtag"><i></i><div class="tag-card"><b>-10%</b><span>HELLOGLOW</span></div></div></div>
      </div>
    </section>

    <section class="s-index" data-scene="plain" data-bg="#FFF4EF">
      <div class="index-head"><p class="eyebrow-da">La collection</p><h2>Treize soins.<br><em>Zéro prise de tête.</em></h2><a class="pill-btn ghost" href="#/shop">Tout le shop <span>→</span></a></div>
      <ol class="index-list">${list.map((p, i) => `<li><a href="#/produit/${p.id}" data-preview="${p.packshot || ''}" style="--th:${themeOf(p)}">
        <span class="ix-n">${String(i + 1).padStart(2, '0')}</span><span class="ix-name">${esc(p.name)}</span><span class="ix-tag">${esc(p.tagline)}</span><span class="ix-price">${eur(p.price)}</span></a></li>`).join('')}</ol>
    </section>

    <section class="s-journal" data-scene="plain" data-bg="#FFF4EF">
      <div class="index-head"><p class="eyebrow-da">Glow Journal</p><h2>Conseils, décryptages<br><em>& petites astuces.</em></h2><a class="pill-btn ghost" href="#/journal">Tous les articles <span>→</span></a></div>
      <div class="journal-row">${posts.map((a) => `<a href="#/journal/${a.id}" class="j-item"><div class="j-img">${Art.photo(a.photo, { w: 700, h: 860, sizes: '(max-width: 760px) 100vw, 33vw' })}</div><span class="j-tag">${esc(a.tag)} · ${a.minutes} min</span><h3>${esc(a.title)}</h3></a>`).join('')}</div>
    </section>

    <section class="s-news" data-scene="plain" data-bg="#2A0B22">
      <div class="news-inner">
        <h2>Rejoins<br><em>la team.</em></h2>
        <form id="newsletterForm" novalidate>
          <p>Conseils, nouveautés et petites surprises, une à deux fois par mois. Pas de spam, promis.</p>
          <label for="nlEmail" class="sr-only">Ton email</label>
          <div class="inline-form"><input id="nlEmail" type="email" required placeholder="toi@exemple.fr" autocomplete="email"><button class="pill-btn light">Je m'inscris</button></div>
          <label class="check" style="margin-top:14px"><input type="checkbox" id="nlConsent" required> J'accepte de recevoir la newsletter Glowmie. Je peux me désabonner à tout moment depuis mon compte ou via le lien présent dans chaque email.</label>
          <p class="error" id="nlError" aria-live="polite"></p>
        </form>
      </div>
    </section>`;
  };

  function post(a) {
    return `<a href="#/journal/${a.id}" class="post" style="background:${a.color}" data-reveal><div class="post-photo">${Art.photo(a.photo, { w: 640, h: 420, sizes: '(max-width: 760px) 100vw, 33vw' })}<span class="tag">${esc(a.tag)}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p><b>Lire · ${a.minutes} min →</b></a>`;
  }

  /* ---------- shop ---------- */
  const shopState = { cat: 'all', need: 'all', q: '', sort: 'pop', max: 60 };
  views.shop = () => `
    <section class="page-hero"><p class="eyebrow">La boutique</p><h1>Shop</h1><p>Des essentiels doux et joyeux pour une routine qui te ressemble.</p></section>
    <div class="wrap shop-layout">
      <aside class="filters" aria-label="Filtres">
        <label for="search">Rechercher</label><input id="search" type="search" placeholder="Sérum, crème…" value="${esc(shopState.q)}">
        <h4>Catégories</h4><div class="chips" data-group="cat"><button class="chip" data-v="all">Tout</button>${DB.raw.categories.map((c) => `<button class="chip" data-v="${c.id}">${c.label}</button>`).join('')}</div>
        <h4>Mon besoin</h4><div class="chips" data-group="need"><button class="chip" data-v="all">Tous</button><button class="chip" data-v="eclat">Éclat</button><button class="chip" data-v="hydratation">Hydratation</button><button class="chip" data-v="sensible">Confort</button><button class="chip" data-v="imperfections">Grain de peau</button></div>
        <h4><label for="max" style="display:inline">Prix max : <span id="maxOut">${shopState.max} €</span></label></h4><input id="max" type="range" min="5" max="60" step="1" value="${shopState.max}" style="width:100%;accent-color:var(--berry)">
      </aside>
      <div>
        <div class="toolbar"><p id="count" class="muted" aria-live="polite" style="margin:0"></p>
          <label class="sr-only" for="sort">Trier</label><select id="sort"><option value="pop">Populaires</option><option value="new">Nouveautés</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option><option value="rating">Mieux notés</option></select></div>
        <div class="shop-list" id="shopGrid"></div>
      </div>
    </div>`;
  function shopMount() {
    const paint = () => {
      const q = shopState.q.trim().toLowerCase();
      let list = DB.products().filter((p) => (shopState.cat === 'all' || p.category === shopState.cat) && (shopState.need === 'all' || p.needs.includes(shopState.need)) && p.price <= shopState.max &&
        (!q || (p.name + ' ' + p.tagline + ' ' + p.description + ' ' + p.ingredients.join(' ')).toLowerCase().includes(q)));
      const sorters = { pop: (a, b) => (b.featured - a.featured) || (b.rating - a.rating), new: (a, b) => b.isNew - a.isNew, asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating };
      list.sort(sorters[shopState.sort]);
      $('#count').textContent = list.length + ' produit' + (list.length > 1 ? 's' : '');
      $('#shopGrid').innerHTML = list.length ? list.map(row).join('') : '<div class="empty" style="grid-column:1/-1"><h3>Aucun produit 🥲</h3><p>Essaie un autre filtre ou une autre recherche.</p></div>';
      $$('.chips').forEach((g) => $$('.chip', g).forEach((c) => c.classList.toggle('on', c.dataset.v === shopState[g.dataset.group])));
      $$('.chip').forEach((c) => c.setAttribute('aria-pressed', c.classList.contains('on')));
      tilt();
      $$('#shopGrid .row-p').forEach((c, i) => c.style.setProperty('--i', i));
    };
    $('#sort').value = shopState.sort;
    $$('.chips').forEach((g) => g.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (!c) return; shopState[g.dataset.group] = c.dataset.v; paint(); }));
    $('#search').addEventListener('input', (e) => { shopState.q = e.target.value; paint(); });
    $('#sort').addEventListener('change', (e) => { shopState.sort = e.target.value; paint(); });
    $('#max').addEventListener('input', (e) => { shopState.max = +e.target.value; $('#maxOut').textContent = shopState.max + ' €'; paint(); });
    paint();
  }

  /* ---------- fiche produit ---------- */
  views.produit = (id) => {
    const p = DB.product(id);
    if (!p || !p.active) return notFound();
    const rev = DB.raw.reviews.filter((r) => r.productId === p.id && r.status === 'publie');
    const me = DB.me(); const fav = me && me.favorites.includes(p.id);
    const related = DB.products().filter((x) => x.id !== p.id && x.step !== p.step && x.shape !== 'set').slice(0, 4);
    return `<div class="wrap pdp">
      <div class="pdp-media" data-reveal style="--th:${themeOf(p)}"><div class="pdp-stage ${bgFor(p)}" id="pdpStage">
        <div class="stage-photo ${bgFor(p)}" id="stagePhoto" hidden></div>
        <div class="pdp-giant" aria-hidden="true">${esc(p.name)}</div><div class="static">${Art.product(p)}</div>
      </div>
        <div class="thumbs" role="tablist" aria-label="Galerie">
          <button class="thumb-btn on ${bgFor(p)}" data-g="pack" role="tab" aria-selected="true" aria-label="Photo produit">${Art.product(p)}</button>
          ${(p.photos || []).map((k, i) => `<button class="thumb-btn" data-g="${k}" role="tab" aria-selected="false" aria-label="${i ? 'Photo application' : 'Photo texture'}">${Art.photo(k, { w: 160, h: 160, sizes: '80px' })}</button>`).join('')}
        </div>
      </div>
      <div>
        <p><a href="#/shop" class="eyebrow" style="text-decoration:none">← Shop</a> · <span class="eyebrow muted">${esc((DB.raw.categories.find((c) => c.id === p.category) || {}).label || '')}</span></p>
        <div class="tags" style="display:flex;gap:6px">${p.isNew ? '<span class="tag new">Nouveau</span>' : ''}</div>
        <h1>${esc(p.name)}</h1>
        <p class="tagline">${esc(p.tagline)}</p>
        <p><span class="stars">${stars(p.rating)}</span> <b>${p.rating}</b> <a href="#avis" class="muted">(${rev.length} avis)</a></p>
        <p class="price" style="font-size:2rem" id="pdpPrice"></p>
        <p>${esc(p.description)}</p>
        ${p.variants.length > 1 ? `<label>Format</label><div class="chips variants" id="variants">${p.variants.map((v, i) => `<button class="chip ${i ? '' : 'on'}" data-v="${v.id}" aria-pressed="${!i}">${esc(v.label)}</button>`).join('')}</div>` : `<p class="muted" style="font-weight:700">${esc(p.variants[0].label)}</p>`}
        <p class="stock" id="stock"></p>
        <div class="buy-row">
          <div class="qty" aria-label="Quantité"><button id="qMinus" aria-label="Moins">−</button><span id="qVal" aria-live="polite">1</span><button id="qPlus" aria-label="Plus">+</button></div>
          <button class="btn" id="addBtn">Ajouter au panier <span class="arrow">→</span></button>
          <button class="fav ${fav ? 'on' : ''}" style="position:static;box-shadow:var(--shadow-sm)" data-fav="${p.id}" aria-pressed="${!!fav}" aria-label="Favori">${I.heart}</button>
        </div>
        <div class="acc">
          <details open><summary>Composition</summary><div><div class="ingredients">${p.ingredients.map((i) => `<span>${esc(i)}</span>`).join('')}</div><p class="muted" style="margin-top:10px;font-size:.88rem">Composition fictive à but de démonstration.</p></div></details>
          <details><summary>Conseils d'utilisation</summary><div><p>${esc(p.tips)}</p></div></details>
          <details><summary>Livraison & retours</summary><div><p>Livraison offerte dès 35 € (sinon 4,90 €). Expédition sous 48 h. Retours gratuits sous 30 jours.</p></div></details>
        </div>
        <h3 id="avis" style="margin-top:34px">Avis (${rev.length})</h3>
        ${rev.map((r) => `<div class="review"><span class="stars">${stars(r.rating)}</span> <b>${esc(r.author)}</b> <span class="muted">· ${date(r.at)}</span><p style="margin:6px 0 0">${esc(r.text)}</p></div>`).join('') || '<p class="muted">Pas encore d’avis. Sois la première personne à donner le tien !</p>'}
        <details class="panel" style="margin-top:14px"><summary style="cursor:pointer;font-weight:800;color:var(--berry)">Laisser un avis</summary>
          <form id="reviewForm" style="margin-top:14px">
            <div class="fields-2"><div class="field"><label for="rvName">Prénom</label><input id="rvName" type="text" required maxlength="40" value="${esc(me ? me.firstName : '')}"></div>
            <div class="field"><label for="rvRating">Note</label><select id="rvRating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div></div>
            <div class="field"><label for="rvText">Ton avis</label><textarea id="rvText" required maxlength="500" rows="3"></textarea></div>
            <button class="btn small">Envoyer</button> <span class="muted" style="font-size:.85rem">Les avis sont publiés après modération.</span>
          </form></details>
      </div>
    </div>
    <section class="section" style="padding-top:0"><div class="wrap"><div class="section-head"><h2 style="font-size:2.6rem">Complète ta routine</h2></div><div class="grid-products">${related.map(card).join('')}</div></div></section>`;
  };
  function produitMount(id) {
    const p = DB.product(id); if (!p) return;
    let v = p.variants[0], q = 1;
    // parallaxe souris + zoom progressif au scroll sur le packshot
    const st = $('#pdpStage');
    if (st && !GlowMotion.reduced()) {
      st.addEventListener('pointermove', (e) => { const r = st.getBoundingClientRect(); st.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 2); st.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * 2); });
      st.addEventListener('pointerleave', () => { st.style.setProperty('--mx', 0); st.style.setProperty('--my', 0); });
      const onSc = () => st.style.setProperty('--zoom', Math.min(1, scrollY / innerHeight).toFixed(3));
      window.addEventListener('scroll', onSc, { passive: true }); cleanup.push(() => window.removeEventListener('scroll', onSc));
    }
    const paint = () => {
      $('#pdpPrice').innerHTML = eur(v.price) + (p.compareAt && v === p.variants[0] ? ` <s class="muted" style="font-size:.6em">${eur(p.compareAt)}</s>` : '');
      const st = $('#stock'); st.className = 'stock ' + (v.stock <= 15 ? 'low' : 'ok');
      st.textContent = v.stock <= 0 ? 'Épuisé' : v.stock <= 15 ? `Plus que ${v.stock} en stock !` : 'En stock · expédié sous 48 h';
      $('#addBtn').disabled = v.stock <= 0; $('#qVal').textContent = q;
    };
    const vs = $('#variants');
    if (vs) vs.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (!c) return; v = p.variants.find((x) => x.id === c.dataset.v); $$('.chip', vs).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); paint(); });
    $('#qMinus').onclick = () => { q = Math.max(1, q - 1); paint(); };
    $('#qPlus').onclick = () => { q = Math.min(10, Math.min(v.stock, q + 1)); paint(); };
    $('#addBtn').onclick = (e) => { DB.addToCart(p.id, v.id, q); added(e.currentTarget, p); setTimeout(openCart, 500); };
    $('#reviewForm').onsubmit = (e) => { e.preventDefault(); DB.addReview({ productId: p.id, author: $('#rvName').value.trim(), rating: +$('#rvRating').value, text: $('#rvText').value.trim(), customerId: DB.me() ? DB.me().id : null }); e.target.closest('details').innerHTML = '<p class="success">Merci 💗 Ton avis sera publié après modération.</p>'; };
    paint();
    $$('.thumb-btn').forEach((b) => b.onclick = () => {
      $$('.thumb-btn').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      const sp = $('#stagePhoto'), isPack = b.dataset.g === 'pack';
      sp.hidden = isPack;
      if (!isPack) { sp.innerHTML = Art.photo(b.dataset.g, { w: 900, h: 945, eager: true, sizes: '(max-width: 1000px) 100vw, 50vw' }); if (window.gsap && !GlowMotion.reduced()) gsap.from(sp, { opacity: 0, scale: 1.04, duration: .5, ease: 'power2.out' }); }
    });
  }

  /* ---------- quiz ---------- */
  /* Quiz Find Your Glow : 10 questions, choix simples ou multiples (max indiqué),
     recommandation déterministe expliquée produit par produit. */
  const QUESTIONS = [
    { key: 'besoins', multi: 3, q: 'Qu’est-ce qui te ferait le plus plaisir pour ta peau ?', a: [
      ['eclat', '✨', 'Plus d’éclat', 'Un teint frais et lumineux'], ['hydratation', '💧', 'Plus d’hydratation', 'Fini les tiraillements'],
      ['confort', '🌸', 'Plus de douceur', 'Une peau apaisée'], ['imperfections', '🍓', 'Moins d’imperfections', 'Petits boutons, points noirs'],
      ['brillance', '🫧', 'Moins de brillance', 'Un fini plus mat'], ['grain', '🪞', 'Un grain lissé', 'Une texture plus régulière'],
      ['fatigue', '😴', 'Un air reposé', 'Teint terne, mine fatiguée'], ['protection', '☀️', 'La protéger', 'Du soleil et de la pollution']] },
    { key: 'peau', q: 'En fin de journée, ta peau est plutôt…', a: [
      ['seche', '🏜️', 'Sèche', 'Elle réclame du réconfort'], ['mixte', '🌗', 'Mixte', 'Brillante sur la zone T'],
      ['grasse', '✨', 'Brillante', 'Un peu partout'], ['normale', '😌', 'Équilibrée', 'Ni trop, ni trop peu'], ['jsp', '🤷', 'Je ne sais pas', 'On va t’aider']] },
    { key: 'sensibilite', q: 'Ta peau réagit-elle facilement ?', a: [
      ['non', '💪', 'Pas du tout', 'Elle supporte tout'], ['unpeu', '🙂', 'Un peu', 'Parfois des rougeurs'],
      ['tres', '🥀', 'Très facilement', 'Picotements, rougeurs fréquentes']] },
    { key: 'soucis', multi: 4, optional: true, q: 'Tes petits soucis du moment', a: [
      ['tiraille', '😣', 'Ça tiraille', 'Après le nettoyage'], ['zoneT', '🔆', 'Zone T qui brille', 'Front, nez, menton'],
      ['pores', '🔍', 'Pores visibles', 'Surtout sur le nez'], ['cernes', '👀', 'Petite mine', 'Le matin au réveil'],
      ['levres', '💋', 'Lèvres sèches', 'Elles pèlent un peu'], ['rougeurs', '🌹', 'Rougeurs', 'Sur les joues'],
      ['aucun', '🌈', 'Rien de spécial', 'Tout va bien']] },
    { key: 'actuelle', q: 'Ta routine aujourd’hui, c’est…', a: [
      ['rien', '🙈', 'Pas de routine', 'Je débute'], ['nettoyant', '🧼', 'Juste un nettoyant', 'Le strict minimum'],
      ['quelques', '🧴', 'Quelques produits', 'Sans trop savoir'], ['complete', '💅', 'Une vraie routine', 'Je connais bien']] },
    { key: 'routine', q: 'Combien de temps veux-tu y consacrer ?', a: [
      ['mini', '⚡', 'Express', '2 étapes, 2 minutes'], ['equilibree', '🌷', 'Équilibrée', '3 étapes bien choisies'],
      ['complete', '🛁', 'Moment spa', '4 étapes et plus']] },
    { key: 'moment', q: 'Tu prends soin de ta peau…', a: [
      ['matin', '🌞', 'Le matin', 'Avant de filer'], ['soir', '🌙', 'Le soir', 'Mon moment détente'], ['both', '💞', 'Matin et soir', 'Les deux, évidemment']] },
    { key: 'textures', multi: 3, optional: true, q: 'Les textures que tu préfères', a: [
      ['gel', '🧊', 'Gel frais', 'Léger, qui rince bien'], ['creme', '☁️', 'Crème fondante', 'Douce et réconfortante'],
      ['serum', '💧', 'Sérum léger', 'Absorbé en 2 secondes'], ['baume', '🍯', 'Baume', 'Qui fond sur la peau'],
      ['fluide', '🌬️', 'Fluide invisible', 'Zéro effet gras'], ['tout', '🤍', 'Peu importe', 'Tant que ça marche']] },
    { key: 'lifestyle', multi: 4, optional: true, q: 'Ton quotidien, c’est plutôt…', a: [
      ['makeup', '💄', 'Maquillage', 'Presque tous les jours'], ['sport', '🏃‍♀️', 'Sport', 'Je transpire souvent'],
      ['dehors', '🌤️', 'Dehors', 'Beaucoup au soleil'], ['ecrans', '💻', 'Écrans & nuits courtes', 'Vie d’étudiante'],
      ['ville', '🏙️', 'Ville', 'Pollution, transports'], ['calme', '🧘', 'Plutôt cosy', 'Rien de spécial']] },
    { key: 'budget', q: 'Ton budget pour cette routine ?', a: [
      ['petit', '🪙', 'Moins de 40 €', 'Petit prix, grand effet'], ['moyen', '💸', '40 à 80 €', 'Le bon équilibre'], ['plaisir', '🎀', 'Je me fais plaisir', 'C’est mon cadeau']] }
  ];
  const quiz = { i: 0, answers: {} };
  const has = (a, key, v) => [].concat(a[key] || []).includes(v);

  function recommend(a) {
    const P = (id) => DB.product(id);
    const morning = a.moment !== 'soir', evening = a.moment !== 'matin';
    const sensitive = a.sensibilite === 'tres';
    const oily = a.peau === 'grasse' || a.peau === 'mixte' || has(a, 'besoins', 'brillance') || has(a, 'soucis', 'zoneT');
    const dry = a.peau === 'seche' || has(a, 'soucis', 'tiraille') || has(a, 'besoins', 'hydratation');
    const steps = [];
    const add = (label, id, why, prio) => steps.push({ label, p: P(id), why, prio });

    if (evening && (has(a, 'lifestyle', 'makeup') || (a.routine === 'complete' && has(a, 'lifestyle', 'ville'))))
      add('Démaquiller', 'melt-in', has(a, 'lifestyle', 'makeup') ? 'Tu te maquilles souvent : le baume fait fondre maquillage et SPF sans frotter.' : 'En ville, un double nettoyage le soir enlève pollution et SPF en douceur.', 5);
    add('Nettoyer', 'fresh-start', sensitive || dry ? 'Un gel doux aux céramides qui nettoie sans tirailler, même les peaux réactives.' : oily ? 'Il élimine l’excès de sébum sans décaper ta peau.' : 'La base de toute routine : une peau propre et fraîche.', 1);
    if (a.routine !== 'mini' && evening && !sensitive && (has(a, 'besoins', 'imperfections') || has(a, 'besoins', 'grain') || has(a, 'soucis', 'pores') || has(a, 'besoins', 'brillance')))
      add('Tonifier', 'tone-glow', 'Ses acides de fruits doux affinent le grain de peau et resserrent visuellement les pores.', 4);
    const wantsSerum = has(a, 'besoins', 'eclat') || has(a, 'besoins', 'fatigue') || has(a, 'besoins', 'hydratation') || has(a, 'soucis', 'cernes') || has(a, 'lifestyle', 'ecrans') || has(a, 'besoins', 'grain');
    const wantsCream = dry || sensitive || has(a, 'besoins', 'confort') || has(a, 'soucis', 'rougeurs') || !oily;
    if (a.routine === 'mini') {
      if (wantsSerum && !wantsCream) add('Sublimer', 'glow-drops', 'Acide hyaluronique et niacinamide pour un teint frais et lumineux en un geste.', 2);
      else add('Hydrater', 'daily-cloud', 'Une seule crème qui hydrate, apaise et protège : parfait pour une routine express.', 2);
    } else {
      if (wantsSerum || a.routine === 'complete') add('Sublimer', 'glow-drops', has(a, 'lifestyle', 'ecrans') || has(a, 'besoins', 'fatigue') ? 'Contre la mine fatiguée des nuits courtes : il repulpe et redonne de l’éclat.' : 'Acide hyaluronique + niacinamide : hydratation et éclat dès les premières utilisations.', 2);
      add('Hydrater', 'daily-cloud', oily ? 'Une texture fouettée légère : elle hydrate sans faire briller.' : 'Céramides et panthénol pour une peau douce, nourrie et confortable toute la journée.', 2);
    }
    if (morning && (a.routine !== 'mini' || has(a, 'lifestyle', 'dehors') || has(a, 'besoins', 'protection')))
      add('Protéger', 'sun-sunny', has(a, 'lifestyle', 'dehors') ? 'Tu es souvent dehors : un SPF 50 invisible, à mettre chaque matin.' : 'Le geste anti-éclat terni n°1 : un SPF léger, sans trace blanche.', 3);
    if (a.routine !== 'mini' && !sensitive && (has(a, 'besoins', 'imperfections') || has(a, 'soucis', 'zoneT')))
      add('Purifier', 'clear-crush', 'Niacinamide 10 % + zinc : il calme les petites imperfections, resserre les pores et régule la brillance, sans dessécher.', 4);
    if (a.routine !== 'mini' && (has(a, 'soucis', 'cernes') || has(a, 'besoins', 'fatigue') || has(a, 'lifestyle', 'ecrans')))
      add('Regard', 'eye-love', 'Sa bille fraîche à la caféine défroisse les petites mines du matin en 10 secondes.', 5);
    if (evening && a.routine === 'complete' && (dry || has(a, 'besoins', 'fatigue') || has(a, 'besoins', 'eclat')))
      add('Nuit', 'night-bloom', 'Une crème de nuit riche au bakuchiol : tu te réveilles avec une peau repulpée et reposée.', 5);
    if (a.routine === 'complete' && !sensitive && (has(a, 'besoins', 'grain') || has(a, 'besoins', 'eclat')))
      add('Exfolier (1–2×/sem.)', 'peel-party', 'Un gommage tout doux pour lisser le grain de peau et booster l’éclat, une à deux fois par semaine.', 6);
    if (a.routine === 'complete' && (has(a, 'besoins', 'brillance') || has(a, 'soucis', 'pores')))
      add('Masque (1–2×/sem.)', 'mask-up', 'L’argile rose purifie les pores en douceur : ton moment spa de la semaine.', 6);
    if (has(a, 'lifestyle', 'sport') || has(a, 'lifestyle', 'dehors'))
      add('Bonus fraîcheur', 'jelly-mist', 'Après le sport ou au soleil, une brume fraîche qui réhydrate en un pschitt.', 7);
    if (has(a, 'soucis', 'levres') || a.routine === 'complete')
      add('Bonus douceur', 'dew-me', has(a, 'soucis', 'levres') ? 'Pour tes lèvres sèches : un gloss baume qui nourrit et repulpe.' : 'La petite touche gourmande qui complète ta routine.', 6);

    let items = steps.filter((x) => x.p && x.p.active);
    const max = { petit: 40, moyen: 80, plaisir: 999 }[a.budget] || 999;
    while (items.reduce((s, x) => s + x.p.price, 0) > max && items.length > 2) {
      const worst = items.reduce((w, x) => (x.prio > w.prio ? x : w), items[0]); items = items.filter((x) => x !== worst);
    }
    const order = ['Démaquiller', 'Nettoyer', 'Exfolier (1–2×/sem.)', 'Masque (1–2×/sem.)', 'Tonifier', 'Purifier', 'Sublimer', 'Regard', 'Hydrater', 'Nuit', 'Protéger', 'Bonus douceur', 'Bonus fraîcheur'];
    items.sort((x, y) => order.indexOf(x.label) - order.indexOf(y.label));
    const ids = items.map((x) => x.p.id);
    const trio = ['fresh-start', 'glow-drops', 'daily-cloud'].every((id) => ids.includes(id));
    const first = [].concat(a.besoins || [])[0];
    const profiles = { eclat: ['Glow Seeker', 'Tu veux une peau qui rayonne : on mise sur l’éclat et la fraîcheur.'], hydratation: ['Cloud Lover', 'Ta priorité, c’est l’hydratation : textures confort et céramides.'], confort: ['Soft Soul', 'Ta peau a besoin de douceur : formules apaisantes, gestes simples.'], imperfections: ['Fresh Spirit', 'On vise une peau nette sans l’agresser.'], brillance: ['Matte Mood', 'On équilibre ta peau pour un fini frais, sans brillance.'], grain: ['Smooth Operator', 'On affine le grain de peau tout en douceur.'], fatigue: ['Morning Glow', 'Coup d’éclat garanti, même après une nuit courte.'], protection: ['Sun Keeper', 'Tu protèges ta peau au quotidien, et c’est le meilleur réflexe.'] };
    const [profile, intro] = profiles[first] || ['Glow Seeker', 'Une routine équilibrée pour une peau en pleine forme.'];
    const tips = [];
    if (sensitive) tips.push('Peau réactive : introduis un produit à la fois, tous les 3–4 jours.');
    if (has(a, 'lifestyle', 'sport')) tips.push('Après le sport, un passage de Fresh Start évite les petites imperfections.');
    if (has(a, 'lifestyle', 'ecrans')) tips.push('Les nuits courtes se voient : garde Glow Drops le matin pour l’effet bonne mine.');
    if (a.peau === 'jsp') tips.push('Astuce : 1 h après le nettoyage, regarde ton visage sans rien appliquer. Si ça brille sur la zone T seulement, ta peau est mixte.');
    if (has(a, 'besoins', 'protection') || has(a, 'lifestyle', 'dehors')) tips.push('Renouvelle ton SPF toutes les 2 h quand tu es au soleil.');
    if (!tips.length) tips.push('La régularité compte plus que le nombre de produits : 4 semaines pour voir la différence.');
    return { items, trio, profile, intro, tips };
  }

  function answerLabel(Q, v) { const o = Q.a.find((x) => x[0] === v); return o ? o[2] : v; }

  views.quiz = () => `<div class="wrap quiz"><div class="quiz-card" id="quizCard" aria-live="polite"></div></div>`;
  function quizMount() {
    const el = $('#quizCard');
    const next = () => { quiz.i++; paint(1); };
    const paint = (dir) => {
      if (quiz.i >= QUESTIONS.length) return result();
      const Q = QUESTIONS[quiz.i];
      const cur = [].concat(quiz.answers[Q.key] || []);
      el.innerHTML = `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${QUESTIONS.length}" aria-valuenow="${quiz.i + 1}"><span style="width:${(quiz.i + 1) / QUESTIONS.length * 100}%"></span></div>
        <p class="eyebrow">Question ${quiz.i + 1} / ${QUESTIONS.length}</p><h2 style="font-size:clamp(1.8rem,4vw,2.8rem)" tabindex="-1" id="qTitle">${Q.q}</h2>
        ${Q.multi ? `<p class="multi-hint">Plusieurs choix possibles · jusqu’à ${Q.multi} <span id="qCount">${cur.length ? `(${cur.length} sélectionné${cur.length > 1 ? 's' : ''})` : ''}</span></p>` : '<p class="multi-hint">Un seul choix</p>'}
        <div class="answers ${Q.a.length > 5 ? 'many' : ''}" role="${Q.multi ? 'group' : 'radiogroup'}" aria-labelledby="qTitle">${Q.a.map(([v, e, t, s], i) => `<button class="answer ${cur.includes(v) ? 'on' : ''} ${Q.multi ? 'is-multi' : ''}" style="--i:${i}" role="${Q.multi ? 'checkbox' : 'radio'}" aria-checked="${cur.includes(v)}" data-v="${v}"><span class="emo" aria-hidden="true">${e}</span><b>${t}</b><small>${s}</small></button>`).join('')}</div>
        <div class="quiz-nav">${quiz.i ? '<button class="btn ghost small" id="qBack">← Retour</button>' : '<span></span>'}
          ${Q.multi ? `<button class="btn" id="qNext" ${cur.length || Q.optional ? '' : 'disabled'}>${cur.length || !Q.optional ? 'Continuer' : 'Passer'} <span class="arrow">→</span></button>` : ''}</div>
        <p class="muted" style="font-size:.85rem;margin:14px 0 0;text-align:right">Recommandations indicatives, sans valeur médicale.</p>`;
      $('#qTitle').focus({ preventScroll: true });
      el.classList.toggle('back', dir === -1);
      $$('.answer', el).forEach((b) => b.onclick = () => {
        const v = b.dataset.v;
        if (!Q.multi) { quiz.answers[Q.key] = v; $$('.answer', el).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); setTimeout(next, GlowMotion.reduced() ? 0 : 280); return; }
        let sel = [].concat(quiz.answers[Q.key] || []);
        const exclusive = ['aucun', 'tout', 'calme'];
        if (sel.includes(v)) sel = sel.filter((x) => x !== v);
        else if (exclusive.includes(v)) sel = [v];
        else { sel = sel.filter((x) => !exclusive.includes(x)); if (sel.length >= Q.multi) { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); toast(`Maximum ${Q.multi} choix 💗`); return; } sel.push(v); }
        quiz.answers[Q.key] = sel;
        $$('.answer', el).forEach((x) => { const on = sel.includes(x.dataset.v); x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
        $('#qCount').textContent = sel.length ? `(${sel.length} sélectionné${sel.length > 1 ? 's' : ''})` : '';
        const nb = $('#qNext'); nb.disabled = !sel.length && !Q.optional; nb.firstChild.textContent = sel.length || !Q.optional ? 'Continuer ' : 'Passer ';
      });
      const nb = $('#qNext'); if (nb) nb.onclick = next;
      const back = $('#qBack'); if (back) back.onclick = () => { quiz.i--; paint(-1); };
    };
    const result = () => {
      const r = recommend(quiz.answers);
      const total = r.items.reduce((s, x) => s + x.p.price, 0);
      const set = DB.product('glow-routine');
      const saved = DB.saveQuiz(quiz.answers, r.items.map((x) => x.p.id), null);
      const chips = QUESTIONS.filter((Q) => ['besoins', 'peau', 'sensibilite', 'soucis', 'lifestyle'].includes(Q.key)).flatMap((Q) => [].concat(quiz.answers[Q.key] || []).filter((v) => !['aucun', 'calme'].includes(v)).map((v) => answerLabel(Q, v)));
      el.innerHTML = `<div class="progress"><span style="width:100%"></span></div>
        <p class="eyebrow">Ton profil glow</p><h2 style="font-size:clamp(2.2rem,5vw,3.4rem)">${r.profile} ✨</h2>
        <p style="font-weight:700">${r.intro}</p>
        ${chips.length ? `<div class="diag"><span class="muted" style="font-weight:800;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase">Ton diagnostic</span><div class="chips">${chips.map((c) => `<span class="chip on" style="cursor:default">${esc(c)}</span>`).join('')}</div></div>` : ''}
        <h3 style="margin-top:22px">Ta routine en ${r.items.length} étape${r.items.length > 1 ? 's' : ''}</h3>
        <div class="routine">${r.items.map((x, i) => `<div class="routine-item"><div class="${bgFor(x.p)}" style="border-radius:18px;display:grid;place-items:center;height:100px">${Art.product(x.p)}</div><div><span class="stepn">${i + 1}. ${x.label}</span><br><b style="font-family:var(--font-display);color:var(--berry);font-size:1.2rem">${esc(x.p.name)}</b> <span class="muted">· ${eur(x.p.price)}</span><p class="why">${esc(x.why)}</p></div><a class="btn ghost small" href="#/produit/${x.p.id}">Voir</a></div>`).join('')}</div>
        ${r.trio ? `<p class="free-ship">💡 Astuce : le coffret <b>${esc(set.name)}</b> réunit Fresh Start, Glow Drops et Daily Cloud pour ${eur(set.price)}.</p>` : ''}
        <div class="panel tips"><h3 style="font-size:1.1rem;margin-bottom:8px">Nos conseils pour toi</h3><ul>${r.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
        <div class="sum total"><span>Total routine</span><span>${eur(total)}</span></div>
        <div class="buy-row"><button class="btn" id="addRoutine">Ajouter la routine au panier <span class="arrow">→</span></button><button class="btn ghost small" id="redo">Refaire le quiz</button></div>
        <form class="panel" id="quizMail" style="background:var(--cream);box-shadow:none;margin:0" novalidate>
          <h3 style="font-size:1.2rem">Recevoir ma routine par email</h3>
          ${DB.me() ? '' : '<div class="fields-2"><div class="field"><label for="qmName">Prénom</label><input id="qmName" type="text" autocomplete="given-name"></div><div class="field"><label for="qmEmail">Email</label><input id="qmEmail" type="email" required autocomplete="email"></div></div>'}
          <label class="check"><input type="checkbox" id="qmQuiz"> J'accepte que Glowmie conserve mes réponses au quiz pour personnaliser mes recommandations (modifiable dans mon compte).</label>
          <label class="check" style="margin-top:8px"><input type="checkbox" id="qmNews"> Je veux aussi recevoir la newsletter.</label>
          <p class="error" id="qmErr"></p><button class="btn small">Envoyer ma routine</button>
          <p class="muted" style="font-size:.8rem;margin:10px 0 0">Sans consentement, tes réponses ne sont associées à aucun profil et ne servent qu'à afficher ce résultat. <a href="#/legal/confidentialite">En savoir plus</a></p>
        </form>`;
      $('#addRoutine').onclick = (e) => { r.items.forEach((x) => DB.addToCart(x.p.id, x.p.variants[0].id, 1)); added(e.currentTarget); setTimeout(openCart, 500); };
      $('#redo').onclick = () => { quiz.i = 0; quiz.answers = {}; paint(); };
      $('#quizMail').onsubmit = (e) => {
        e.preventDefault();
        const email = DB.me() ? DB.me().email : $('#qmEmail').value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) { $('#qmErr').textContent = 'Indique un email valide.'; return; }
        if (!$('#qmQuiz').checked) { $('#qmErr').textContent = 'Coche la case de consentement pour qu’on puisse t’envoyer ta routine.'; return; }
        // le résultat anonyme est remplacé par un résultat rattaché au profil, avec consentement explicite
        DB.raw.quizResults = DB.raw.quizResults.filter((x) => x.id !== saved.id);
        DB.saveQuiz(quiz.answers, r.items.map((x) => x.p.id), { email, firstName: DB.me() ? '' : $('#qmName').value.trim(), newsletter: $('#qmNews').checked, quizConsent: true });
        if ($('#qmNews').checked) DB.newsletter(email);
        e.target.innerHTML = `<p class="success">C'est envoyé 💌 Ta routine arrive dans ta boîte mail (simulation, visible dans le CRM).</p>`;
      };
      window.scrollTo(0, 0);
      confetti();
    };
    paint(1);
  }

  /* ---------- pages éditoriales ---------- */
  views.story = () => `
    <section class="page-hero"><p class="eyebrow">Our story</p><h1>Hello, on est Glowmie 💗</h1><p>Née d'une envie toute simple : que prendre soin de sa peau devienne le petit moment préféré de ta journée. Des textures qui font du bien, des gestes faciles, et beaucoup de good mood.</p></section>
    <section class="section" style="padding-top:20px"><div class="wrap">
      <div class="story-steps">
        <div class="tier bg-blush" data-reveal><div class="tier-photo">${Art.photo("swatchBeige", { w: 600, h: 400 })}</div><h3>L'idée</h3><p>Tout commence dans une chambre étudiante, devant une étagère trop pleine de produits qu'on ne comprenait pas.</p></div>
        <div class="tier bg-lilac" data-reveal><div class="tier-photo">${Art.photo("serumDrops", { w: 600, h: 400 })}</div><h3>Les formules</h3><p>Huit produits, pas un de plus. Des textures qu'on a envie de retrouver chaque jour et des listes d'ingrédients lisibles.</p></div>
        <div class="tier bg-butter" data-reveal><div class="tier-photo">${Art.photo("maskLaugh", { w: 600, h: 400 })}</div><h3>La communauté</h3><p>Aujourd'hui, la team Glowmie partage ses routines, ses avis et ses fous rires. Bienvenue !</p></div>
      </div>
    </div></section>
    <section class="section" style="padding-top:0"><div class="wrap split">
      <div data-reveal><span class="script" style="font-size:2.2rem">nos engagements</span><h2>Doux pour toi, doux pour la planète</h2>
        <p style="font-weight:600">Formules douces et testées sous contrôle dermatologique, flacons recyclables, recharges en préparation, prix justes et transparents. Et jamais de promesses miracles : ta peau est déjà très bien comme elle est.</p>
        <p class="muted" style="font-size:.9rem">Glowmie est une marque fictive créée pour un projet scolaire. Les engagements présentés sont illustratifs.</p>
        <a class="btn" href="#/shop">Découvrir les produits →</a></div>
      <div class="brand-block" data-reveal style="background:var(--butter);padding:0;overflow:hidden"><div class="story-photo">${Art.photo("collection")}</div><div class="values" style="grid-template-columns:1fr 1fr;padding:24px;margin:0"><div class="value"><b>8</b>produits essentiels</div><div class="value"><b>100 %</b>flacons recyclables</div><div class="value"><b>&lt; 50 €</b>tous nos prix</div><div class="value"><b>3</b>étapes suffisent</div></div></div>
    </div></section>`;

  views.club = () => {
    const me = DB.me();
    return `<section class="page-hero"><p class="eyebrow">Programme de fidélité</p><h1>Glow Club</h1><p>10 points par euro dépensé, des cadeaux, des avant-premières… et beaucoup d'amour.</p></section>
    <div class="wrap">
      ${me ? loyalty(me) : `<div class="panel" style="text-align:center" data-reveal><h3>Rejoindre le club, c'est gratuit</h3><p>Crée ton compte et tes points s'accumulent automatiquement à chaque commande.</p><a class="btn" href="#/compte">Créer mon compte →</a></div>`}
      <div class="tiers" style="margin:30px 0 40px">
        <div class="tier bg-blush" data-reveal><span class="emo">🌸</span><h3>Glow</h3><p class="muted"><b>0 – 1 999 pts</b></p><ul><li>-10 % de bienvenue</li><li>Une surprise le mois de ton anniversaire</li><li>Accès au Glow Journal en avant-première</li></ul></div>
        <div class="tier bg-lilac" data-reveal><span class="emo">💜</span><h3>Shine</h3><p class="muted"><b>2 000 – 4 999 pts</b></p><ul><li>Livraison toujours offerte</li><li>Code GLOWCLUB -15 %</li><li>Miniatures dans chaque commande</li></ul></div>
        <div class="tier bg-butter" data-reveal><span class="emo">👑</span><h3>Superstar</h3><p class="muted"><b>5 000 pts et +</b></p><ul><li>Accès VIP aux nouveautés</li><li>Coffret cadeau chaque saison</li><li>Invitations aux événements Glowmie</li></ul></div>
      </div>
      <div class="panel" data-reveal><h3>Comment ça marche ?</h3><p><b>1.</b> Tu commandes : 1 € = 10 points. <b>2.</b> Ta deuxième commande te fait entrer dans le Glow Club VIP. <b>3.</b> 500 points = 5 € de réduction sur ta prochaine commande (phase 2).</p></div>
    </div>`;
  };
  function loyalty(c) {
    const t = DB.tier(c.points);
    const pct = t.next ? Math.min(100, (c.points / t.next) * 100) : 100;
    return `<div class="loyalty-card" data-reveal><p class="eyebrow" style="color:var(--butter)">Glow Club · niveau ${t.label}</p><h3>Hello ${esc(c.firstName || 'toi')} 💖</h3><div class="pts">${c.points.toLocaleString('fr-FR')} <span style="font-size:1.2rem">points</span></div>
      <div class="meter"><span style="width:${pct}%"></span></div><p style="margin:0;font-weight:700">${t.next ? `Plus que ${(t.next - c.points).toLocaleString('fr-FR')} points avant le niveau suivant` : 'Tu es au niveau maximum, superstar !'}</p></div>`;
  }

  views.journal = (id) => {
    if (id) {
      const a = DB.raw.articles.find((x) => x.id === id); if (!a) return notFound();
      return `<article class="wrap article"><p><a class="eyebrow" href="#/journal" style="text-decoration:none">← Glow Journal</a></p>$1<div class="article-photo">${Art.photo(a.photo, { w: 1100, h: 640, eager: true, sizes: "(max-width: 760px) 100vw, 720px" })}</div>${a.body.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="quiz-teaser" style="margin-top:40px;padding:34px"><h2 style="font-size:2rem">Et toi, c'est quoi ta routine ?</h2><a class="btn light" href="#/quiz">Faire le quiz →</a></div></article>`;
    }
    return `<section class="page-hero"><p class="eyebrow">Blog</p><h1>Glow Journal</h1><p>Conseils skincare, décryptages et petites astuces, sans jargon.</p></section><div class="wrap"><div class="journal-grid">${DB.raw.articles.map(post).join('')}</div></div>`;
  };

  /* ---------- panier (page + tiroir) ---------- */
  function cartHTML(full) {
    const t = DB.totals();
    if (!t.lines.length) return `<div class="empty" style="background:none"><div style="font-size:3rem">🛍️</div><h3>Ton panier est vide</h3><p>Il ne demande qu'à être rempli de bonnes choses.</p><a class="btn" href="#/shop">Aller au shop</a></div>`;
    const left = Math.max(0, 35 - (t.subtotal - t.discount));
    return `<div class="free-ship">${left > 0 ? `Plus que <b>${eur(left)}</b> pour la livraison offerte 🚚` : 'Livraison offerte débloquée 🎉'}<div class="bar"><span style="width:${Math.min(100, (t.subtotal - t.discount) / 35 * 100)}%"></span></div></div>
      ${t.lines.map((l, i) => `<div class="line"><a href="#/produit/${l.productId}" class="thumb ${bgFor(l.product)}">${Art.product(l.product)}</a><div><b>${esc(l.product.name)}</b><br><span class="muted" style="font-size:.85rem">${esc(l.variant.label)} · ${eur(l.price)}</span><br>
        <div class="qty" style="margin-top:6px;transform:scale(.85);transform-origin:left"><button data-q="${i}" data-d="-1" aria-label="Moins">−</button><span>${l.qty}</span><button data-q="${i}" data-d="1" aria-label="Plus">+</button></div></div>
        <div style="text-align:right"><b>${eur(l.total)}</b><br><button class="icon-btn" data-rm="${i}" aria-label="Retirer ${esc(l.product.name)}" style="width:34px;height:34px;margin-left:auto">${I.close}</button></div></div>`).join('')}
      ${full ? '' : ''}`;
  }
  function cartFooter() {
    const t = DB.totals(); if (!t.lines.length) return '';
    return `<form class="promo-form" style="margin-bottom:10px">${t.promo ? `<p class="success" style="margin:0 0 6px">Code <b>${t.promo.code}</b> appliqué · ${esc(t.promo.label)} <button type="button" class="btn ghost small" data-unpromo style="padding:4px 10px">Retirer</button></p>` :
      `<div class="inline-form"><label class="sr-only" for="promoIn">Code promo</label><input id="promoIn" type="text" placeholder="Code promo (ex : HELLOGLOW)" style="padding:10px 14px"><button class="btn small">OK</button></div><p class="error" data-perr></p>`}</form>
      <div class="sum"><span>Sous-total</span><span>${eur(t.subtotal)}</span></div>
      ${t.discount ? `<div class="sum" style="color:#23824f"><span>Réduction</span><span>−${eur(t.discount)}</span></div>` : ''}
      <div class="sum"><span>Livraison</span><span>${t.shipping ? eur(t.shipping) : 'Offerte'}</span></div>
      <div class="sum total"><span>Total</span><span>${eur(t.total)}</span></div>
      <a class="btn block" href="#/checkout" style="margin-top:12px">Passer commande <span class="arrow">→</span></a>`;
  }
  function bindCart(root) {
    root.onclick = (e) => {
      const q = e.target.closest('[data-q]'); const rm = e.target.closest('[data-rm]'); const up = e.target.closest('[data-unpromo]');
      if (q) { const i = +q.dataset.q; DB.setQty(i, DB.cart()[i].qty + +q.dataset.d); }
      if (rm) DB.setQty(+rm.dataset.rm, 0);
      if (up) DB.removePromo();
    };
    root.onsubmit = (e) => {
      if (!e.target.classList.contains('promo-form')) return;
      e.preventDefault();
      try { DB.applyPromo($('#promoIn', root).value); toast('Code appliqué 🎉'); } catch (err) { $('[data-perr]', root).textContent = err.message; }
    };
  }
  function paintDrawer() {
    $('#drawerBody').innerHTML = cartHTML(); $('#drawerFoot').innerHTML = cartFooter();
    $('#drawerFoot').style.display = DB.cart().length ? '' : 'none';
  }
  function openCart() { paintDrawer(); $('#drawer').classList.add('open'); $('#drawerBg').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); setTimeout(() => $('#drawerClose').focus(), 50); }
  function closeCart() { $('#drawer').classList.remove('open'); $('#drawerBg').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true'); }

  views.panier = () => `<section class="page-hero" style="padding-bottom:10px"><h1>Panier</h1></section><div class="wrap" style="max-width:760px"><div class="panel" id="cartPage"><div id="cpBody"></div><div id="cpFoot" style="margin-top:16px"></div></div></div>`;
  function panierMount() { const paint = () => { $('#cpBody').innerHTML = cartHTML(true); $('#cpFoot').innerHTML = cartFooter(); }; bindCart($('#cartPage')); paint(); pageRepaint = paint; }

  /* ---------- checkout ---------- */
  const luhn = (n) => { const d = n.replace(/\D/g, ''); let s = 0; for (let i = 0; i < d.length; i++) { let x = +d[d.length - 1 - i]; if (i % 2) { x *= 2; if (x > 9) x -= 9; } s += x; } return d.length >= 13 && s % 10 === 0; };
  views.checkout = () => {
    const t = DB.totals(); const me = DB.me();
    if (!t.lines.length) return `<div class="wrap confirm"><h1>Ton panier est vide</h1><a class="btn" href="#/shop">Aller au shop</a></div>`;
    return `<section class="page-hero" style="padding-bottom:0"><p class="eyebrow">Paiement sécurisé · mode test</p><h1 style="font-size:clamp(2.6rem,7vw,4.6rem)">Checkout</h1></section>
    <form class="wrap two-col" id="checkoutForm" novalidate>
      <div>
        <div class="panel"><h3>1. Contact</h3>
          ${me ? `<p>Connectée en tant que <b>${esc(me.firstName)} ${esc(me.lastName)}</b> (${esc(me.email)})</p>` : `<p class="muted">Déjà cliente ? <a href="#/compte">Connecte-toi</a> pour retrouver tes points.</p>`}
          <div class="fields-2"><div class="field"><label for="coFirst">Prénom</label><input id="coFirst" type="text" required autocomplete="given-name" value="${esc(me ? me.firstName : '')}"></div><div class="field"><label for="coLast">Nom</label><input id="coLast" type="text" required autocomplete="family-name" value="${esc(me ? me.lastName : '')}"></div></div>
          <div class="field"><label for="coEmail">Email</label><input id="coEmail" type="email" required autocomplete="email" value="${esc(me ? me.email : '')}" ${me ? 'readonly' : ''}></div>
          ${me ? '' : `<div class="field"><label for="coPwd">Créer un mot de passe <span class="muted">(optionnel, pour suivre ta commande)</span></label><input id="coPwd" type="password" minlength="8" autocomplete="new-password" placeholder="8 caractères minimum"></div>`}
        </div>
        <div class="panel"><h3>2. Livraison</h3>
          <div class="field"><label for="coAddr">Adresse</label><input id="coAddr" type="text" required autocomplete="street-address" value="${esc(me && me.addresses[0] ? me.addresses[0].line : '')}"></div>
          <div class="fields-2"><div class="field"><label for="coZip">Code postal</label><input id="coZip" type="text" required inputmode="numeric" pattern="[0-9]{5}" autocomplete="postal-code" value="${esc(me && me.addresses[0] ? me.addresses[0].zip : '')}"></div><div class="field"><label for="coCity">Ville</label><input id="coCity" type="text" required autocomplete="address-level2" value="${esc(me && me.addresses[0] ? me.addresses[0].city : '')}"></div></div>
          <p class="muted" style="margin:0">Colissimo · 48 h · ${t.shipping ? eur(t.shipping) : 'offerte'}</p>
        </div>
        <div class="panel"><h3>3. Paiement</h3>
          <div class="stripe-box"><span class="test">STRIPE · MODE TEST</span>
            <div class="field"><label for="coCard">Numéro de carte</label><input id="coCard" type="text" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" maxlength="23"></div>
            <div class="fields-2"><div class="field"><label for="coExp">Expiration</label><input id="coExp" type="text" placeholder="MM/AA" autocomplete="off" maxlength="5"></div><div class="field"><label for="coCvc">CVC</label><input id="coCvc" type="text" inputmode="numeric" placeholder="123" autocomplete="off" maxlength="4"></div></div>
            <p class="muted" style="font-size:.82rem;margin:0">Simulation : utilise la carte de test <b>4242 4242 4242 4242</b> (paiement accepté) ou <b>4000 0000 0000 0002</b> (paiement refusé). Aucune donnée bancaire réelle n'est traitée ni stockée.</p>
          </div>
          <label class="check" style="margin-top:16px"><input type="checkbox" id="coNews" ${me && me.consent.newsletter ? 'checked disabled' : ''}> Je souhaite recevoir les conseils et nouveautés Glowmie par email (facultatif).</label>
          <label class="check" style="margin-top:8px"><input type="checkbox" id="coCgv" required> J'ai lu et j'accepte les <a href="#/legal/cgv" target="_blank">conditions générales de vente</a>.</label>
        </div>
      </div>
      <aside class="panel" style="position:sticky;top:100px"><h3>Ta commande</h3>
        ${t.lines.map((l) => `<div class="line" style="grid-template-columns:56px 1fr auto"><div class="thumb ${bgFor(l.product)}" style="height:60px">${Art.product(l.product)}</div><div><b>${esc(l.product.name)}</b><br><span class="muted" style="font-size:.85rem">${esc(l.variant.label)} × ${l.qty}</span></div><b>${eur(l.total)}</b></div>`).join('')}
        <div style="margin-top:12px"><div class="sum"><span>Sous-total</span><span>${eur(t.subtotal)}</span></div>${t.discount ? `<div class="sum" style="color:#23824f"><span>Réduction (${t.promo.code})</span><span>−${eur(t.discount)}</span></div>` : ''}<div class="sum"><span>Livraison</span><span>${t.shipping ? eur(t.shipping) : 'Offerte'}</span></div><div class="sum total"><span>Total</span><span>${eur(t.total)}</span></div></div>
        <p class="muted" style="font-size:.85rem">+ ${Math.round(t.total * 10)} points Glow Club</p>
        <p class="error" id="coErr" aria-live="assertive"></p>
        <button class="btn block" id="payBtn">Payer ${eur(t.total)} <span class="arrow">→</span></button>
      </aside>
    </form>`;
  };
  function checkoutMount() {
    const f = $('#checkoutForm'); if (!f) return;
    let done = false;
    $('#coCard').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim(); });
    $('#coExp').addEventListener('input', (e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; });
    cleanup.push(() => {
      // panier abandonné : seulement si on connaît la cliente et qu'elle quitte le checkout sans payer
      if (done || !DB.cart().length) return;
      const email = ($('#coEmail') || {}).value; const c = DB.me() || (email && DB.byEmail(email));
      if (c) DB.track('checkout_abandoned', c.id), DB.save();
    });
    f.onsubmit = (e) => {
      e.preventDefault();
      const err = $('#coErr'); err.textContent = '';
      const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
      const bad = ['coFirst', 'coLast', 'coEmail', 'coAddr', 'coZip', 'coCity'].find((id) => !v(id));
      if (bad) { err.textContent = 'Merci de compléter tous les champs obligatoires.'; $('#' + bad).focus(); return; }
      if (!/^\S+@\S+\.\S+$/.test(v('coEmail'))) { err.textContent = 'Email invalide.'; $('#coEmail').focus(); return; }
      if (!/^\d{5}$/.test(v('coZip'))) { err.textContent = 'Code postal invalide (5 chiffres).'; $('#coZip').focus(); return; }
      if (v('coPwd') && v('coPwd').length < 8) { err.textContent = 'Le mot de passe doit faire au moins 8 caractères.'; $('#coPwd').focus(); return; }
      const card = v('coCard').replace(/\s/g, '');
      if (!luhn(card)) { err.textContent = 'Numéro de carte invalide. Utilise la carte de test 4242 4242 4242 4242.'; $('#coCard').focus(); return; }
      const m = v('coExp').match(/^(\d{2})\/(\d{2})$/);
      if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1]) < new Date()) { err.textContent = 'Date d’expiration invalide.'; $('#coExp').focus(); return; }
      if (!/^\d{3,4}$/.test(v('coCvc'))) { err.textContent = 'CVC invalide.'; $('#coCvc').focus(); return; }
      if (!$('#coCgv').checked) { err.textContent = 'Merci d’accepter les CGV.'; return; }
      const btn = $('#payBtn'); btn.disabled = true; btn.textContent = 'Paiement en cours…';
      setTimeout(() => {
        if (card === '4000000000000002') { btn.disabled = false; btn.innerHTML = 'Réessayer'; err.textContent = 'Paiement refusé par la banque (carte de test refusée). Aucun montant n’a été débité.'; return; }
        try {
          const o = DB.placeOrder({ firstName: v('coFirst'), lastName: v('coLast'), email: v('coEmail'), password: v('coPwd'), address: v('coAddr'), zip: v('coZip'), city: v('coCity'), newsletter: $('#coNews').checked, last4: card.slice(-4) });
          const c = DB.customer(o.customerId);
          if ($('#coNews').checked && !c.consent.newsletter) DB.setConsent(c.id, 'newsletter', true);
          done = true; location.hash = '#/confirmation/' + o.id;
        } catch (ex) { btn.disabled = false; btn.innerHTML = 'Payer'; err.textContent = ex.message; }
      }, 1100);
    };
  }
  views.confirmation = (id) => {
    const o = DB.order(id); if (!o) return notFound();
    const c = DB.customer(o.customerId);
    return `<div class="wrap confirm"><span class="big-heart" aria-hidden="true">💖</span><h1 style="font-size:clamp(2.6rem,7vw,5rem)">Merci ${esc(c.firstName)} !</h1>
      <p style="font-size:1.2rem;font-weight:700">Ta commande <b>${o.number}</b> est confirmée. Un email récapitulatif vient de partir (simulation).</p>
      <div class="panel" style="max-width:560px;margin:24px auto;text-align:left">${o.items.map((i) => `<div class="sum"><span>${esc(i.name)} · ${esc(i.variant)} × ${i.qty}</span><span>${eur(i.qty * i.price)}</span></div>`).join('')}<div class="sum total"><span>Total payé</span><span>${eur(o.total)}</span></div><p class="muted" style="margin:8px 0 0">Paiement test ${o.payment.ref} · carte •••• ${o.payment.last4} · +${Math.round(o.total * 10)} points</p></div>
      ${DB.me() ? '<a class="btn" href="#/compte/commandes">Suivre ma commande →</a>' : '<p>Crée un compte avec le même email pour suivre ta commande et cumuler des points.</p><a class="btn" href="#/compte">Créer mon compte →</a>'} <a class="btn ghost" href="#/shop">Continuer mes achats</a></div>`;
  };

  /* ---------- compte ---------- */
  views.compte = (tab) => {
    const me = DB.me();
    if (!me) return `<section class="page-hero" style="padding-bottom:10px"><p class="eyebrow">Mon compte</p><h1>Hello toi 👋</h1></section>
      <div class="wrap split" style="align-items:start;padding-bottom:80px">
        <form class="panel" id="loginForm" novalidate><h3>J'ai déjà un compte</h3>
          <div class="field"><label for="liEmail">Email</label><input id="liEmail" type="email" required autocomplete="email"></div>
          <div class="field"><label for="liPwd">Mot de passe</label><input id="liPwd" type="password" required autocomplete="current-password"></div>
          <p class="error" id="liErr" aria-live="polite"></p><button class="btn">Se connecter</button></form>
        <form class="panel" id="signupForm" novalidate><h3>Je crée mon compte</h3>
          <div class="fields-2"><div class="field"><label for="suFirst">Prénom</label><input id="suFirst" type="text" required autocomplete="given-name"></div><div class="field"><label for="suLast">Nom</label><input id="suLast" type="text" required autocomplete="family-name"></div></div>
          <div class="field"><label for="suEmail">Email</label><input id="suEmail" type="email" required autocomplete="email"></div>
          <div class="field"><label for="suPwd">Mot de passe</label><input id="suPwd" type="password" required minlength="8" autocomplete="new-password" placeholder="8 caractères minimum"></div>
          <label class="check"><input type="checkbox" id="suNews"> Je souhaite recevoir la newsletter (facultatif).</label>
          <p class="muted" style="font-size:.82rem;margin-top:10px">En créant un compte, tu acceptes notre <a href="#/legal/confidentialite">politique de confidentialité</a>.</p>
          <p class="error" id="suErr" aria-live="polite"></p><button class="btn">Créer mon compte</button></form>
      </div>`;
    const t = tab || 'accueil';
    const tabs = [['accueil', 'Tableau de bord'], ['commandes', 'Mes commandes'], ['favoris', 'Favoris'], ['profil', 'Profil & adresses'], ['donnees', 'Préférences & données']];
    const os = DB.ordersFor(me.id);
    let body = '';
    if (t === 'accueil') body = `${loyalty(me)}<div class="panel" style="margin-top:22px"><h3>Dernière commande</h3>${os[0] ? orderBlock(os[0]) : '<p>Pas encore de commande. <a href="#/shop">Découvrir le shop</a></p>'}</div>`;
    if (t === 'commandes') body = `<div class="panel"><h3>Mes commandes (${os.length})</h3>${os.map(orderBlock).join('') || '<p>Aucune commande pour le moment.</p>'}</div>`;
    if (t === 'favoris') { const fav = me.favorites.map(DB.product).filter(Boolean); body = `<h3>Mes favoris</h3>${fav.length ? `<div class="grid-products">${fav.map(card).join('')}</div>` : '<div class="panel"><p>Clique sur le ♥ d’un produit pour le retrouver ici.</p></div>'}`; }
    if (t === 'profil') body = `<form class="panel" id="profileForm"><h3>Mon profil</h3>
      <div class="fields-2"><div class="field"><label for="pfFirst">Prénom</label><input id="pfFirst" type="text" value="${esc(me.firstName)}"></div><div class="field"><label for="pfLast">Nom</label><input id="pfLast" type="text" value="${esc(me.lastName)}"></div></div>
      <div class="fields-2"><div class="field"><label for="pfPhone">Téléphone</label><input id="pfPhone" type="tel" value="${esc(me.phone)}"></div><div class="field"><label>Email</label><input type="email" value="${esc(me.email)}" readonly></div></div>
      <h3 style="margin-top:10px">Adresse principale</h3>
      <div class="field"><label for="pfAddr">Adresse</label><input id="pfAddr" type="text" value="${esc(me.addresses[0] ? me.addresses[0].line : '')}"></div>
      <div class="fields-2"><div class="field"><label for="pfZip">Code postal</label><input id="pfZip" type="text" value="${esc(me.addresses[0] ? me.addresses[0].zip : '')}"></div><div class="field"><label for="pfCity">Ville</label><input id="pfCity" type="text" value="${esc(me.addresses[0] ? me.addresses[0].city : '')}"></div></div>
      <button class="btn">Enregistrer</button></form>`;
    if (t === 'donnees') body = `<div class="panel"><h3>Mes consentements</h3>
      <label class="check"><input type="checkbox" data-consent="newsletter" ${me.consent.newsletter ? 'checked' : ''}> Recevoir la newsletter et les emails personnalisés (bienvenue, conseils après achat, rappel de panier).</label>
      <label class="check" style="margin-top:10px"><input type="checkbox" data-consent="quiz" ${me.consent.quiz ? 'checked' : ''}> Conserver mes réponses au quiz pour personnaliser mes recommandations.</label>
      <p class="muted" style="font-size:.85rem;margin-top:10px">Dernière mise à jour : ${date(me.consent.date)}</p></div>
      <div class="panel"><h3>Mes données</h3><p>Tu peux télécharger toutes les données que Glowmie conserve sur toi, ou supprimer ton compte.</p>
      <div class="buy-row"><button class="btn ghost small" id="exportBtn">Exporter mes données (JSON)</button><button class="btn small" id="deleteBtn" style="--bg:#c0264f;box-shadow:0 6px 0 #8d1534">Supprimer mon compte</button></div></div>`;
    return `<section class="page-hero" style="padding-bottom:10px"><p class="eyebrow">Mon compte</p><h1>Hello ${esc(me.firstName || '')} 💗</h1></section>
      <div class="wrap account-grid"><nav class="tabs" aria-label="Mon compte">${tabs.map(([k, l]) => `<button class="${k === t ? 'on' : ''}" data-tab="${k}" ${k === t ? 'aria-current="page"' : ''}>${l}</button>`).join('')}<button data-logout>Se déconnecter</button></nav><div>${body}</div></div>`;
  };
  function orderBlock(o) {
    const step = STATUS_STEP[o.status] || 0;
    return `<div class="order-row"><div><b>${o.number}</b> <span class="muted">· ${date(o.createdAt)}</span><br><span class="muted" style="font-size:.88rem">${o.items.map((i) => esc(i.name) + ' × ' + i.qty).join(', ')}</span>
      ${step ? `<div class="timeline" aria-label="Suivi : ${STATUS[o.status]}">${[1, 2, 3, 4].map((s) => `<span class="${s <= step ? 'on' : ''}"></span>`).join('')}</div>` : ''}
      ${o.shippingInfo.tracking ? `<span class="muted" style="font-size:.8rem">Suivi ${o.shippingInfo.carrier} : ${o.shippingInfo.tracking}</span>` : ''}</div>
      <span class="status ${o.status}">${STATUS[o.status]}</span><b>${eur(o.total)}</b></div>`;
  }
  function compteMount() {
    const li = $('#loginForm');
    if (li) {
      li.onsubmit = (e) => { e.preventDefault(); try { DB.login($('#liEmail').value, $('#liPwd').value); toast('Contente de te revoir 💗'); render(); } catch (err) { $('#liErr').textContent = err.message; } };
      $('#signupForm').onsubmit = (e) => {
        e.preventDefault();
        const d = { firstName: $('#suFirst').value.trim(), lastName: $('#suLast').value.trim(), email: $('#suEmail').value.trim(), password: $('#suPwd').value, newsletter: $('#suNews').checked };
        if (!d.firstName || !/^\S+@\S+\.\S+$/.test(d.email)) return ($('#suErr').textContent = 'Prénom et email valide requis.');
        if (d.password.length < 8) return ($('#suErr').textContent = 'Le mot de passe doit faire au moins 8 caractères.');
        try { DB.signup(d); toast('Bienvenue dans la team Glowmie ✨'); confetti(); render(); } catch (err) { $('#suErr').textContent = err.message; }
      };
      return;
    }
    $$('[data-tab]').forEach((b) => b.onclick = () => { location.hash = '#/compte/' + b.dataset.tab; });
    $('[data-logout]').onclick = () => { DB.logout(); toast('À bientôt 👋'); location.hash = '#/'; };
    const pf = $('#profileForm');
    if (pf) pf.onsubmit = (e) => { e.preventDefault(); const me = DB.me(); DB.updateCustomer(me.id, { firstName: $('#pfFirst').value.trim(), lastName: $('#pfLast').value.trim(), phone: $('#pfPhone').value.trim(), addresses: [{ label: 'Maison', line: $('#pfAddr').value.trim(), zip: $('#pfZip').value.trim(), city: $('#pfCity').value.trim() }], city: $('#pfCity').value.trim() }); toast('Profil enregistré ✔︎'); };
    $$('[data-consent]').forEach((c) => c.onchange = () => { DB.setConsent(DB.me().id, c.dataset.consent, c.checked); toast(c.checked ? 'Consentement enregistré' : 'Consentement retiré'); });
    const ex = $('#exportBtn');
    if (ex) ex.onclick = () => { const blob = new Blob([JSON.stringify(DB.exportCustomer(DB.me().id), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mes-donnees-glowmie.json'; a.click(); URL.revokeObjectURL(a.href); };
    const del = $('#deleteBtn');
    if (del) del.onclick = () => { if (confirm('Supprimer ton compte ? Tes données personnelles seront anonymisées (les commandes restent conservées pour la comptabilité).')) { DB.deleteCustomer(DB.me().id); toast('Compte supprimé'); location.hash = '#/'; } };
  }

  /* ---------- pages légales ---------- */
  const LEGAL = {
    mentions: ['Mentions légales', [['Éditeur', 'Glowmie est une marque fictive créée dans le cadre d’un projet scolaire. Aucune activité commerciale réelle n’est exercée.'], ['Hébergement', 'Prototype local. Version cible : Vercel Inc. (hébergement) et Supabase (base de données).'], ['Propriété intellectuelle', 'Les visuels, textes et illustrations de ce site sont réalisés pour le projet.']]],
    confidentialite: ['Politique de confidentialité', [['Données collectées', 'Compte (nom, email, adresse), commandes, réponses au quiz (uniquement avec ton accord), consentements marketing.'], ['Finalités', 'Traiter tes commandes, gérer ton compte et ton programme de fidélité, et, seulement si tu y consens, t’envoyer des emails personnalisés.'], ['Tes droits', 'Accès, rectification, export, suppression et retrait du consentement à tout moment depuis « Mon compte › Préférences & données ».'], ['Durée de conservation', '3 ans après le dernier contact pour les prospects ; durée légale pour les données de facturation.']]],
    cookies: ['Cookies & stockage', [['Essentiels', 'Le panier, la session et tes préférences d’affichage sont stockés localement sur ton appareil. Ils sont nécessaires au fonctionnement du site.'], ['Mesure d’audience', 'Seulement avec ton accord : un simple compteur de visites anonymisé utilisé dans le tableau de bord.'], ['Changer d’avis', '<button class="btn small" id="cookieReset">Modifier mes choix</button>']]],
    cgv: ['Conditions générales de vente', [['Objet', 'Les présentes CGV fictives encadrent les ventes de démonstration réalisées sur la boutique Glowmie.'], ['Prix', 'Prix en euros TTC. Livraison offerte dès 35 € d’achat, sinon 4,90 €.'], ['Paiement', 'Paiement simulé via Stripe en mode test. Aucun débit réel n’est effectué.'], ['Rétractation', '30 jours pour changer d’avis, retours gratuits.']]]
  };
  views.legal = (k) => { const L = LEGAL[k]; if (!L) return notFound(); return `<div class="wrap legal"><p class="eyebrow">Informations</p><h1 style="font-size:clamp(2.4rem,6vw,4rem)">${L[0]}</h1>${L[1].map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join('')}</div>`; };

  function notFound() { return `<div class="wrap confirm"><span class="big-heart">🫧</span><h1>Oups, page introuvable</h1><a class="btn" href="#/">Retour à l'accueil</a></div>`; }

  /* ================= ROUTEUR ================= */
  let cleanup = [], pageRepaint = null, lastRoute = '';
  const mounts = { home: homeMount, shop: shopMount, produit: produitMount, quiz: () => { quiz.i = 0; quiz.answers = {}; quizMount(); }, compte: compteMount, panier: panierMount, checkout: checkoutMount };
  const titles = { home: 'Good skin. Good mood.', shop: 'Shop', produit: 'Produit', quiz: 'Find your glow', story: 'Our story', club: 'Glow Club', journal: 'Glow Journal', compte: 'Mon compte', panier: 'Panier', checkout: 'Paiement', confirmation: 'Merci !', legal: 'Informations' };

  function parse() { const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); return { name: parts[0] || 'home', arg: parts[1] }; }
  function render() {
    const r = parse();
    closeCart();
    cleanup.forEach((fn) => { try { fn(); } catch (e) {} }); cleanup = []; pageRepaint = null;
    if (window.ScrollTrigger) ScrollTrigger.getAll().forEach((t) => t.kill());
    const view = views[r.name] || notFound;
    const main = $('#main');
    main.className = 'view ' + (r.name === 'home' ? 'is-home' : '');
    main.innerHTML = view(r.arg);
    document.title = (r.name === 'produit' && DB.product(r.arg) ? DB.product(r.arg).name : titles[r.name] || 'Glowmie') + ' · glowmie.';
    $$('.nav a, .mobile-nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#/' + r.name));
    const key = r.name + '/' + (r.arg || '');
    if (key !== lastRoute) { window.scrollTo(0, 0); lastRoute = key; }
    (mounts[r.name] || (() => {}))(r.arg);
    afterRender();
  }
  function afterRender() {
    updateBadge();
    tilt();
    if (window.gsap && window.ScrollTrigger && !GlowMotion.reduced()) {
      ScrollTrigger.batch('[data-reveal]', { start: 'top 88%', onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, stagger: .08, duration: .8, ease: 'back.out(1.4)', overwrite: true }) });
      $$('[data-speed]').forEach((el) => gsap.to(el, { y: () => -window.innerHeight * parseFloat(el.dataset.speed), ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
      ScrollTrigger.refresh();
    } else $$('[data-reveal]').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  function homeMount() {
    const reduced = GlowMotion.reduced();
    const host = document.createElement('div'); host.className = 'stage3d'; document.body.appendChild(host);
    const stage = reduced ? null : window.GlowStage && GlowStage.create(host);
    document.documentElement.classList.toggle('no3d', !stage);
    cleanup.push(() => { if (stage) stage.destroy(); host.remove(); document.documentElement.classList.remove('no3d'); document.body.style.backgroundColor = ''; });
    // sans 3D mais avec animations : on garde le défilement des typographies et les couleurs de fond
    if (!stage && !reduced) {
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const vh = innerHeight, secs = $$('[data-scene]');
        secs.forEach((sec) => { const r = sec.getBoundingClientRect(); sec.style.setProperty('--p', Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh))).toFixed(4)); if (r.top <= vh / 2 && r.bottom > vh / 2) document.body.style.backgroundColor = sec.dataset.bg; });
      };
      tick(); cleanup.push(() => cancelAnimationFrame(raf));
    }
    // index : aperçu du packshot qui suit le curseur
    const prev = document.createElement('img'); prev.className = 'ix-preview'; prev.alt = ''; document.body.appendChild(prev);
    cleanup.push(() => prev.remove());
    if (matchMedia('(hover: hover)').matches) {
      $$('.index-list a').forEach((a) => {
        a.addEventListener('pointerenter', () => { if (!a.dataset.preview) return; prev.src = a.dataset.preview; prev.classList.add('on'); });
        a.addEventListener('pointerleave', () => prev.classList.remove('on'));
        a.addEventListener('pointermove', (e) => { prev.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 120}px) rotate(${(e.movementX || 0) * 0.4}deg)`; });
      });
    }
    $('#newsletterForm').onsubmit = (e) => {
      e.preventDefault();
      const em = $('#nlEmail').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(em)) return ($('#nlError').textContent = 'Indique un email valide.');
      if (!$('#nlConsent').checked) return ($('#nlError').textContent = 'Coche la case pour confirmer ton inscription.');
      DB.newsletter(em);
      e.target.innerHTML = '<p class="success" style="font-size:1.2rem;color:var(--butter)">Bienvenue dans la team 💌 Ton email de bienvenue est en route (simulation, visible dans le CRM).</p>';
    };
  }

  /* micro-interaction : inclinaison 3D des cartes */
  function tilt() {
    if (GlowMotion.reduced() || !matchMedia('(hover: hover)').matches) return;
    $$('[data-tilt]').forEach((c) => {
      if (c._t) return; c._t = 1;
      c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`; });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }

  function added(btn, p) {
    flyToCart(btn);
    const old = btn.innerHTML; btn.classList.add('added'); btn.innerHTML = 'Ajouté ♥';
    setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = old; }, 1400);
    toast((p ? p.name : 'Routine') + ' ajouté au panier 🛍️');
  }
  function updateBadge() {
    const n = DB.totals().count; const b = $('#cartCount');
    if (b.textContent !== String(n)) { b.textContent = n; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    b.hidden = !n;
    $('#cartBtn').setAttribute('aria-label', `Panier (${n} article${n > 1 ? 's' : ''})`);
  }

  /* ---------- événements globaux ---------- */
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { e.preventDefault(); const p = DB.product(add.dataset.add); DB.addToCart(p.id, p.variants[0].id, 1); added(add, p); return; }
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      if (!DB.me()) { toast('Connecte-toi pour enregistrer tes favoris 💗'); location.hash = '#/compte'; return; }
      const on = DB.toggleFavorite(fav.dataset.fav);
      $$(`[data-fav="${fav.dataset.fav}"]`).forEach((f) => { f.classList.toggle('on', on); f.setAttribute('aria-pressed', on); });
      if (on && window.gsap && !GlowMotion.reduced()) gsap.fromTo(fav, { scale: 1.6 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
      toast(on ? 'Ajouté aux favoris ♥' : 'Retiré des favoris');
    }
  });
  DB.onChange(() => { updateBadge(); if ($('#drawer').classList.contains('open')) paintDrawer(); if (pageRepaint) pageRepaint(); });

  function initShell() {
    $('#cartBtn').onclick = (e) => { e.preventDefault(); openCart(); };
    $('#drawerClose').onclick = closeCart; $('#drawerBg').onclick = closeCart;
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCart(); $('#mobileNav').classList.remove('open'); } });
    $('#drawer').addEventListener('click', (e) => { if (e.target.closest('a[href^="#/"]')) closeCart(); });
    bindCart($('#drawer'));
    $('#burger').onclick = () => { $('#mobileNav').classList.add('open'); $('#mobileNav').setAttribute('aria-hidden', 'false'); };
    $('#mobileNav').addEventListener('click', (e) => { if (e.target.closest('a, .close')) { $('#mobileNav').classList.remove('open'); $('#mobileNav').setAttribute('aria-hidden', 'true'); } });
    $('#motionToggle').onclick = () => GlowMotion.set(GlowMotion.reduced());
    $('#searchBtn').onclick = () => { location.hash = '#/shop'; setTimeout(() => $('#search') && $('#search').focus(), 80); };
    window.addEventListener('scroll', () => document.body.classList.toggle('scrolled', scrollY > 30), { passive: true });
    // bannière cookies
    const choice = store.get('glowmie_cookies');
    const showCookie = () => {
      const c = $('#cookie'); c.hidden = false;
      c.querySelectorAll('[data-cookie]').forEach((b) => b.onclick = () => { store.set('glowmie_cookies', b.dataset.cookie); c.hidden = true; if (b.dataset.cookie === 'all') DB.trackVisit(); });
    };
    if (!choice) showCookie(); else if (choice === 'all') DB.trackVisit();
    document.addEventListener('click', (e) => { if (e.target.id === 'cookieReset') showCookie(); });
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  }

  applyMotion();
  initShell();
  window.addEventListener('hashchange', render);
  render();
})();
