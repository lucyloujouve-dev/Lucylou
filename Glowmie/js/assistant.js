/* GLOWMIE — « Glowie », l'assistante beauté du site.
   Assistant de démonstration qui fonctionne entièrement dans le navigateur : il reconnaît
   l'intention de la question (mots-clés) et répond avec les vraies données du site
   (produits, prix, livraison, commandes, points). Aucune IA externe, aucune clé d'API. */
(function () {
  const DB = window.GlowDB;
  if (!DB) return;
  const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');
  const has = (q, words) => words.some((w) => q.includes(w));
  const STATUS = { payee: 'payée, en attente de préparation', en_preparation: 'en préparation', expediee: 'expédiée 🚚', livree: 'livrée ✅', annulee: 'annulée', remboursee: 'remboursée' };
  const NEEDS = {
    eclat: { label: 'un teint terne', words: ['terne', 'eclat', 'glow', 'bonne mine', 'fatigu', 'lumineu', 'cerne'] },
    hydratation: { label: 'une peau sèche ou déshydratée', words: ['seche', 'deshydrat', 'tiraill', 'hydrat', 'sec ', 'secs', 'squame'] },
    sensible: { label: 'une peau sensible', words: ['sensible', 'rougeur', 'reactiv', 'irrit', 'pique', 'apais', 'douce'] },
    imperfections: { label: 'des imperfections', words: ['bouton', 'imperfection', 'pore', 'brillan', 'grasse', 'gras', 'acne', 'mixte', 'point noir', 'points noirs'] }
  };
  const CHIPS = ['Quelle routine pour moi ?', 'J’ai des boutons', 'Peau sèche', 'Livraison et retours', 'Un code promo ?', 'Où en est ma commande ?'];

  /* ---------- réponses ---------- */
  function productCards(list) {
    return `<div class="gw-cards">${list.map((p) => `<div class="gw-card"><a href="#/produit/${p.id}" class="gw-pic">${p.packshot ? `<img src="${esc(p.packshot)}" alt="">` : ''}</a><div><a href="#/produit/${p.id}"><b>${esc(p.name)}</b></a><span>${esc(p.tagline)}</span><b class="gw-price">${eur(p.price)}</b></div><button type="button" class="gw-add" data-gw-add="${p.id}" aria-label="Ajouter ${esc(p.name)} au panier">+</button></div>`).join('')}</div>`;
  }
  function byNeed(need) {
    const order = { nettoyer: 1, traiter: 2, hydrater: 3, proteger: 4 };
    return DB.products().filter((p) => p.shape !== 'set' && p.needs.includes(need)).sort((a, b) => (order[a.step] || 9) - (order[b.step] || 9)).slice(0, 3);
  }
  function answer(raw) {
    const q = ' ' + norm(raw) + ' ';
    const me = DB.me();

    // un produit précis est cité
    const named = DB.products().find((p) => q.includes(norm(p.name)) || q.includes(norm(p.name).replace(/\s+/g, '')));
    if (named && !has(q, ['commande', 'colis'])) {
      return `<p><b>${esc(named.name)}</b> · ${esc(named.tagline)}, ${eur(named.price)} TTC.</p><p>${esc(named.description)}</p>${named.ingredients && named.ingredients.length ? `<p class="gw-small">Composition clé : ${named.ingredients.slice(0, 4).map(esc).join(', ')}.</p>` : ''}${productCards([named])}`;
    }
    if (has(q, ['bonjour', 'salut', 'hello', 'coucou', 'hey ', ' yo '])) {
      return `<p>Hello${me ? ' ' + esc(me.firstName) : ''} 💗 Dis-moi comment est ta peau en ce moment (terne, sèche, sensible, à imperfections…) et je te conseille une routine.</p>`;
    }
    if (has(q, ['commande', 'colis', 'suivi', 'livre quand', 'expedi', 'recu'])) {
      if (!me) return '<p>Pour suivre une commande, connecte-toi à ton compte : tu y verras son statut et son numéro de suivi.</p><p><a class="gw-link" href="#/compte">Me connecter →</a></p>';
      const o = DB.ordersFor(me.id)[0];
      if (!o) return `<p>Tu n'as pas encore passé de commande, ${esc(me.firstName)}. Envie que je te conseille une routine ?</p>`;
      return `<p>Ta dernière commande <b>${esc(o.number)}</b> (${eur(o.total)}) est <b>${STATUS[o.status] || o.status}</b>.${o.shippingInfo && o.shippingInfo.tracking ? ` Suivi ${esc(o.shippingInfo.carrier)} : <b>${esc(o.shippingInfo.tracking)}</b>.` : ''}</p><p><a class="gw-link" href="#/compte">Voir toutes mes commandes →</a></p>`;
    }
    if (has(q, ['point', 'fidelite', 'glow club', 'club', 'niveau'])) {
      if (me) { const t = DB.tier(me.points); return `<p>Tu as <b>${me.points.toLocaleString('fr-FR')} points</b>, niveau <b>${t.label}</b>.${t.next ? ` Plus que ${(t.next - me.points).toLocaleString('fr-FR')} points pour le niveau suivant.` : ''}</p><p>Chaque euro dépensé te rapporte 10 points.</p>`; }
      return '<p>Le Glow Club est gratuit : 10 points par euro dépensé, 3 niveaux (Glow, Shine, Superstar) avec des cadeaux et des avant-premières.</p><p><a class="gw-link" href="#/club">Découvrir le Glow Club →</a></p>';
    }
    if (has(q, ['code', 'promo', 'reduc', 'remise', 'soldes', 'pas cher', 'moins cher'])) {
      return '<p>Code <b>HELLOGLOW</b> : -10 % sur ta première commande 💗<br>Membres du Glow Club : code <b>GLOWCLUB</b>, -15 %.</p><p class="gw-small">Le code se saisit dans le panier, juste au-dessus du total.</p>';
    }
    if (has(q, ['livraison', 'livrer', 'delai', 'frais de port', 'expedition', 'envoi'])) {
      return '<p>Ta commande part sous 24 h et arrive en 48 h environ (Colissimo). Livraison <b>offerte dès 35 €</b>, sinon 4,90 €.</p>';
    }
    if (has(q, ['retour', 'rembours', 'echang', 'pas satisf', 'ne me convient', 'changer d avis'])) {
      return '<p>Tu as <b>30 jours</b> pour changer d\'avis, et le retour est gratuit. Si un soin ne convient pas à ta peau, écris-nous : on t\'aide à trouver une alternative.</p><p><a class="gw-link" href="#/contact">Contacter l\'équipe →</a></p>';
    }
    if (has(q, ['paiement', 'payer', 'carte', 'paypal', 'securis'])) {
      return '<p>Le paiement passe par Stripe. Sur ce site de démonstration, il est simulé : aucune carte n\'est débitée.</p>';
    }
    if (has(q, ['spf', 'solaire', 'soleil', 'protection'])) {
      return `<p>Le geste anti-coup de soleil du matin, même en ville ☀️</p>${productCards(DB.products().filter((p) => p.step === 'proteger'))}`;
    }
    if (has(q, ['coffret', 'cadeau', 'offrir', 'noel'])) {
      const gifts = ['glow-routine', 'dew-me', 'jelly-mist'].map((id) => DB.product(id)).filter((p) => p && p.active);
      return `<p>Pour offrir (ou s'offrir) 🎀 le coffret réunit la routine complète, et les petits soins font de jolis cadeaux à moins de 20 €.</p>${productCards(gifts)}`;
    }
    if (has(q, ['vegan', 'cruelty', 'teste sur', 'naturel', 'ingredient', 'composition', 'enceinte'])) {
      return '<p>Chaque fiche produit détaille la composition et les conseils d\'utilisation. Pour une question médicale (grossesse, allergie, traitement), demande l\'avis d\'un ou d\'une dermatologue : je ne peux pas remplacer un avis médical.</p><p><a class="gw-link" href="#/shop">Voir les fiches produits →</a></p>';
    }
    if (has(q, ['humain', 'conseill', 'contact', 'parler a', 'email', 'telephone', 'sav'])) {
      return '<p>L\'équipe répond sous 48 h ouvrées via le formulaire de contact 💌</p><p><a class="gw-link" href="#/contact">Écrire à l\'équipe →</a></p>';
    }
    if (has(q, ['prix', 'combien', 'budget', 'cher', 'tarif'])) {
      return `<p>Nos soins vont de <b>9 € à 26 €</b> en format standard (Glow Drops existe aussi en 50 ml à 34 €). Le coffret The Glow Routine réunit nettoyant, sérum et crème pour <b>49 €</b> au lieu de 61 €.</p><p class="gw-small">Tous les prix sont en euros TTC.</p>`;
    }
    // besoin de peau
    const need = Object.keys(NEEDS).find((k) => has(q, NEEDS[k].words));
    if (need) return `<p>Pour ${NEEDS[need].label}, voilà ce que je te conseille 💗</p>${productCards(byNeed(need))}<p class="gw-small">Pour une routine 100 % personnalisée, fais le <a href="#/quiz">quiz Find your glow</a> (2 minutes).</p>`;
    if (has(q, ['routine', 'conseil', 'quoi acheter', 'commencer', 'pour moi', 'recommand', 'type de peau'])) {
      const r = ['fresh-start', 'glow-drops', 'daily-cloud', 'sun-sunny'].map((id) => DB.product(id)).filter((p) => p && p.active);
      return `<p>La base, en 3 gestes : <b>nettoyer, traiter, hydrater</b>, et le SPF le matin ☀️</p>${productCards(r)}<p class="gw-small">Dis-moi ton type de peau (sèche, grasse, sensible, terne) pour que j'adapte, ou fais le <a href="#/quiz">quiz Find your glow</a>.</p>`;
    }
    if (has(q, ['merci', 'top', 'parfait', 'super', 'genial'])) return '<p>Avec plaisir 💗 Autre chose ?</p>';
    return '<p>Je n\'ai pas bien compris 🥲 Je peux t\'aider à choisir tes soins selon ta peau, ou répondre sur la livraison, les retours, les codes promo et tes commandes.</p>';
  }

  /* ---------- interface ---------- */
  const css = `
  .gw-fab{position:fixed;right:18px;bottom:18px;z-index:120;display:flex;align-items:center;gap:8px;border:0;border-radius:99px;padding:12px 18px 12px 14px;background:#2A0B22;color:#FFF4EF;font:800 .92rem/1 Manrope,Nunito,system-ui,sans-serif;cursor:pointer;box-shadow:0 14px 30px -12px rgba(42,11,34,.55)}
  .gw-fab .gw-dot{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#F5A9CB;color:#2A0B22;font-size:1rem}
  .gw-fab:focus-visible,.gw-panel button:focus-visible,.gw-panel input:focus-visible{outline:3px solid #E0257A;outline-offset:2px}
  .gw-panel{position:fixed;right:18px;bottom:18px;z-index:121;width:min(380px,calc(100vw - 24px));height:min(580px,calc(100vh - var(--demo-h,38px) - 36px));display:none;flex-direction:column;background:#FFF4EF;border-radius:26px;overflow:hidden;box-shadow:0 30px 70px -24px rgba(42,11,34,.55);border:1px solid rgba(42,11,34,.1);font-family:Manrope,Nunito,system-ui,sans-serif;color:#2A0B22}
  .gw-panel.open{display:flex}
  .gw-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#E0257A;color:#fff}
  .gw-head .gw-dot{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#E0257A;font-weight:800}
  .gw-head b{display:block;font-size:1rem}.gw-head span{font-size:.75rem;opacity:.9}
  .gw-close{margin-left:auto;background:rgba(255,255,255,.2);border:0;color:#fff;width:32px;height:32px;border-radius:50%;font-size:1.2rem;cursor:pointer}
  .gw-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
  .gw-msg{max-width:88%;padding:10px 13px;border-radius:18px;font-size:.9rem;line-height:1.45}
  .gw-msg p{margin:0 0 6px}.gw-msg p:last-child{margin:0}
  .gw-bot{background:#fff;border:1px solid rgba(42,11,34,.08);border-bottom-left-radius:6px;align-self:flex-start}
  .gw-user{background:#2A0B22;color:#FFF4EF;border-bottom-right-radius:6px;align-self:flex-end}
  .gw-small{font-size:.78rem;color:#7D5A70}.gw-msg a{color:#E0257A;font-weight:700}
  .gw-link{display:inline-block;margin-top:2px}
  .gw-cards{display:grid;gap:8px;margin:8px 0}
  .gw-card{display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;background:#FFF4EF;border-radius:14px;padding:6px 8px}
  .gw-card .gw-pic{width:44px;height:44px;border-radius:10px;background:#FFE1EE;display:grid;place-items:center;overflow:hidden}
  .gw-card .gw-pic img{width:100%;height:100%;object-fit:contain}
  .gw-card a{color:#2A0B22;text-decoration:none}.gw-card span{display:block;font-size:.74rem;color:#7D5A70}
  .gw-price{font-size:.8rem;color:#E0257A}
  .gw-add{width:32px;height:32px;border-radius:50%;border:0;background:#E0257A;color:#fff;font-size:1.2rem;font-weight:800;cursor:pointer}
  .gw-chips{display:flex;gap:6px;overflow-x:auto;padding:0 14px 8px;scrollbar-width:none}
  .gw-chips button{flex:none;border:1px solid rgba(42,11,34,.15);background:#fff;color:#2A0B22;border-radius:99px;padding:7px 11px;font:700 .76rem Manrope,system-ui,sans-serif;cursor:pointer}
  .gw-form{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid rgba(42,11,34,.08);background:#fff}
  .gw-form input{flex:1;border:1px solid rgba(42,11,34,.15);border-radius:99px;padding:10px 14px;font:inherit;font-size:.9rem;min-width:0}
  .gw-form button{border:0;border-radius:99px;background:#2A0B22;color:#FFF4EF;padding:0 16px;font-weight:800;cursor:pointer}
  .gw-note{font-size:.68rem;color:#7D5A70;text-align:center;padding:0 12px 8px;background:#fff}
  .gw-typing{display:inline-flex;gap:4px}.gw-typing i{width:6px;height:6px;border-radius:50%;background:#E0257A;opacity:.4;animation:gwb 1s infinite}.gw-typing i:nth-child(2){animation-delay:.15s}.gw-typing i:nth-child(3){animation-delay:.3s}
  @keyframes gwb{50%{opacity:1;transform:translateY(-3px)}}
  @media (max-width:560px){.gw-fab .gw-label{display:none}.gw-fab{padding:10px}.gw-panel{right:12px;left:12px;width:auto;bottom:12px}}
  @media (prefers-reduced-motion:reduce){.gw-typing i{animation:none;opacity:1}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'gw-fab'; fab.setAttribute('aria-label', 'Ouvrir l’assistante beauté Glowie');
  fab.innerHTML = '<span class="gw-dot" aria-hidden="true">✨</span><span class="gw-label">Une question ?</span>';
  const panel = document.createElement('section');
  panel.className = 'gw-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Glowie, assistante beauté');
  panel.innerHTML = `<div class="gw-head"><span class="gw-dot" aria-hidden="true">g.</span><div><b>Glowie</b><span>Ton assistante beauté · répond tout de suite</span></div><button type="button" class="gw-close" aria-label="Fermer">×</button></div>
    <div class="gw-log" aria-live="polite"></div>
    <div class="gw-chips">${CHIPS.map((c) => `<button type="button">${c}</button>`).join('')}</div>
    <form class="gw-form"><label class="sr-only" for="gwInput">Ta question</label><input id="gwInput" type="text" autocomplete="off" placeholder="Pose ta question…" maxlength="300"><button type="submit">Envoyer</button></form>
    <p class="gw-note">Assistante automatique de démonstration, sans IA externe. Elle ne remplace pas un avis médical.</p>`;
  document.body.append(fab, panel);
  const log = panel.querySelector('.gw-log'), input = panel.querySelector('#gwInput');

  const add = (html, who) => { const m = document.createElement('div'); m.className = 'gw-msg ' + (who === 'user' ? 'gw-user' : 'gw-bot'); m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; };
  function ask(text) {
    text = String(text || '').trim(); if (!text) return;
    add(esc(text), 'user');
    const t = add('<span class="gw-typing" aria-label="Glowie écrit"><i></i><i></i><i></i></span>', 'bot');
    setTimeout(() => { t.innerHTML = answer(text); log.scrollTop = log.scrollHeight; }, 550);
  }
  let started = false;
  const open = () => {
    panel.classList.add('open'); fab.style.display = 'none';
    if (!started) { started = true; const me = DB.me(); add(`<p>Hello${me ? ' ' + esc(me.firstName) : ''} 💗 Moi c'est Glowie. Je t'aide à choisir tes soins, et je réponds sur la livraison, les retours, les codes promo ou ta commande.</p>`, 'bot'); }
    setTimeout(() => input.focus(), 50);
  };
  const close = () => { panel.classList.remove('open'); fab.style.display = ''; fab.focus(); };
  fab.addEventListener('click', open);
  panel.querySelector('.gw-close').addEventListener('click', close);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  panel.querySelector('.gw-form').addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); input.value = ''; });
  panel.querySelector('.gw-chips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
  log.addEventListener('click', (e) => {
    const b = e.target.closest('[data-gw-add]');
    if (b) { const p = DB.product(b.dataset.gwAdd); DB.addToCart(p.id, p.variants[0].id, 1); b.textContent = '✓'; b.disabled = true; add(`<p>${esc(p.name)} est dans ton panier 🛍️ <a href="#/panier">Voir le panier →</a></p>`, 'bot'); return; }
    if (e.target.closest('a[href^="#/"]') && window.innerWidth < 560) close();
  });
})();
