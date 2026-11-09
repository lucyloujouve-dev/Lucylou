/* GLOWMIE — base de données partagée site ↔ CRM.
   Prototype : persistance localStorage. En production, chaque méthode correspond
   à un appel Supabase (voir supabase/schema.sql). */
window.GlowDB = (function () {
  const KEY = 'glowmie_db_v1';
  const DAY = 86400000;
  const listeners = [];
  let db;

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const round = (n) => Math.round(n * 100) / 100;
  // hash de démonstration (en production : Supabase Auth gère les mots de passe)
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return 'h' + (h >>> 0).toString(16); };

  function safeGet() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function load() {
    const raw = safeGet();
    if (raw) { try { db = JSON.parse(raw); } catch (e) { db = null; } }
    if (!db || db.version !== window.GLOW_SEED.version) {
      db = clone(window.GLOW_SEED);
      db.cart = []; db.session = null; db.promoApplied = null; db.adminSession = false;
      save(true);
    }
    return db;
  }
  function save(silent) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* stockage indisponible : on reste en mémoire */ }
    if (!silent) listeners.forEach((fn) => fn());
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} db = null; load(); listeners.forEach((fn) => fn()); }
  window.addEventListener('storage', (e) => { if (e.key === KEY) { db = null; load(); listeners.forEach((fn) => fn()); } });

  /* ---------- produits ---------- */
  const products = (all) => db.products.filter((p) => all || p.active);
  const product = (id) => db.products.find((p) => p.id === id);
  const variant = (p, vid) => (p.variants.find((v) => v.id === vid) || p.variants[0]);
  const stockOf = (p) => p.variants.reduce((s, v) => s + Number(v.stock || 0), 0);
  function saveProduct(p) {
    const i = db.products.findIndex((x) => x.id === p.id);
    if (i >= 0) db.products[i] = p; else db.products.push(p);
    save();
  }

  /* ---------- événements & automatisations ---------- */
  function track(type, customerId, data) {
    const ev = { id: uid('e'), type, customerId: customerId || null, at: Date.now(), data: data || {} };
    db.events.push(ev);
    runTriggers(ev);
    return ev;
  }
  function canEmail(c) { return c && c.consent && c.consent.newsletter; }
  function runTriggers(ev) {
    const c = customer(ev.customerId);
    if (!c) return;
    db.automations.filter((a) => a.active && a.trigger === ev.type).forEach((a) => {
      const needsConsent = a.id !== 'quiz' || !(c && c.consent.quiz);
      if (!c || (needsConsent && !canEmail(c))) {
        db.logs.push({ id: uid('l'), automationId: a.id, customerId: ev.customerId, at: Date.now(), status: 'ignore', reason: 'Pas de consentement' });
        return;
      }
      db.logs.push({ id: uid('l'), automationId: a.id, customerId: c.id, orderId: ev.data.orderId, at: Date.now() + a.delayDays * DAY, status: a.delayDays ? 'planifie' : 'envoye', opened: false, clicked: false });
    });
  }
  // exécute les envois planifiés dont la date est passée (option : avancer le temps)
  function runScheduled(advanceDays) {
    const limit = Date.now() + (advanceDays || 0) * DAY;
    let n = 0;
    db.logs.forEach((l) => {
      if (l.status !== 'planifie' || l.at > limit) return;
      if (l.automationId === 'abandoned') {
        const ordered = db.orders.some((o) => o.customerId === l.customerId && o.createdAt > l.at - DAY);
        if (ordered) { l.status = 'annule'; l.reason = 'Commande passée entre-temps'; return; }
      }
      l.status = 'envoye'; l.sentAt = Date.now(); n++;
    });
    save();
    return n;
  }

  /* ---------- clients & session ---------- */
  const customers = () => db.customers;
  const customer = (id) => db.customers.find((c) => c.id === id);
  const byEmail = (email) => db.customers.find((c) => c.email.toLowerCase() === String(email).trim().toLowerCase());
  function createCustomer(data) {
    const c = {
      id: uid('c'), firstName: data.firstName || '', lastName: data.lastName || '', email: data.email.trim().toLowerCase(),
      phone: data.phone || '', city: data.city || '', createdAt: Date.now(), role: 'customer', pwd: data.password ? hash(data.password) : null,
      consent: { newsletter: !!data.newsletter, quiz: !!data.quizConsent, date: Date.now() }, points: 0, notes: '', favorites: [], addresses: []
    };
    db.customers.push(c);
    track('account_created', c.id);
    if (c.consent.newsletter) track('newsletter_signup', c.id);
    save();
    return c;
  }
  function signup(data) {
    const existing = byEmail(data.email);
    if (existing && existing.pwd) throw new Error('Un compte existe déjà avec cet email.');
    let c = existing;
    if (c) { Object.assign(c, { firstName: data.firstName, lastName: data.lastName, pwd: hash(data.password) }); if (data.newsletter && !c.consent.newsletter) setConsent(c.id, 'newsletter', true); }
    else c = createCustomer(data);
    db.session = c.id; save();
    return c;
  }
  function login(email, password) {
    const c = byEmail(email);
    if (!c || !c.pwd || c.pwd !== hash(password)) throw new Error('Email ou mot de passe incorrect.');
    db.session = c.id; save();
    return c;
  }
  const logout = () => { db.session = null; save(); };
  const me = () => (db.session ? customer(db.session) : null);
  function updateCustomer(id, patch) { Object.assign(customer(id), patch); save(); }
  function setConsent(id, kind, value) {
    const c = customer(id); c.consent[kind] = value; c.consent.date = Date.now();
    track(value ? (kind === 'newsletter' ? 'newsletter_signup' : 'consent_given') : 'consent_withdrawn', id, { kind });
    save();
  }
  function deleteCustomer(id) {
    // RGPD : anonymisation (on garde les commandes pour la comptabilité)
    const c = customer(id);
    Object.assign(c, { firstName: 'Client', lastName: 'supprimé', email: 'anonyme-' + c.id + '@supprime.invalid', phone: '', city: '', pwd: null, notes: '', addresses: [], consent: { newsletter: false, quiz: false, date: Date.now() }, deleted: true });
    db.quizResults = db.quizResults.filter((q) => q.customerId !== id);
    if (db.session === id) db.session = null;
    save();
  }
  function exportCustomer(id) {
    return { client: customer(id), commandes: ordersFor(id), quiz: db.quizResults.filter((q) => q.customerId === id), evenements: db.events.filter((e) => e.customerId === id) };
  }
  function toggleFavorite(pid) {
    const c = me(); if (!c) return false;
    const i = c.favorites.indexOf(pid);
    if (i >= 0) c.favorites.splice(i, 1); else c.favorites.push(pid);
    save(); return i < 0;
  }

  /* ---------- panier ---------- */
  const cart = () => db.cart;
  function addToCart(pid, vid, qty) {
    const p = product(pid); const v = variant(p, vid);
    const line = db.cart.find((l) => l.productId === pid && l.variantId === v.id);
    if (line) line.qty = Math.min(line.qty + (qty || 1), 10);
    else db.cart.push({ productId: pid, variantId: v.id, qty: qty || 1 });
    track('add_to_cart', db.session, { productId: pid });
    save();
  }
  function setQty(i, q) { if (q <= 0) db.cart.splice(i, 1); else db.cart[i].qty = Math.min(q, 10); save(); }
  function applyPromo(code) {
    const p = db.promos.find((x) => x.active && x.code === String(code).trim().toUpperCase());
    if (!p) throw new Error('Code promo invalide.');
    db.promoApplied = p.code; save(); return p;
  }
  const removePromo = () => { db.promoApplied = null; save(); };
  function totals() {
    const lines = db.cart.map((l) => { const p = product(l.productId); const v = variant(p, l.variantId); return { ...l, product: p, variant: v, price: v.price, total: v.price * l.qty }; });
    const subtotal = round(lines.reduce((s, l) => s + l.total, 0));
    const promo = db.promos.find((x) => x.code === db.promoApplied);
    const discount = promo && promo.type === 'percent' ? round(subtotal * promo.value / 100) : 0;
    const shipping = !lines.length || subtotal - discount >= 35 || (promo && promo.type === 'shipping') ? 0 : 4.9;
    return { lines, subtotal, discount, shipping, total: round(subtotal - discount + shipping), promo, count: lines.reduce((s, l) => s + l.qty, 0) };
  }

  /* ---------- commandes ---------- */
  const orders = () => db.orders;
  const order = (id) => db.orders.find((o) => o.id === id);
  const ordersFor = (cid) => db.orders.filter((o) => o.customerId === cid).sort((a, b) => b.createdAt - a.createdAt);
  function placeOrder(info) {
    const t = totals();
    if (!t.lines.length) throw new Error('Ton panier est vide.');
    for (const l of t.lines) if (l.variant.stock < l.qty) throw new Error('Stock insuffisant pour ' + l.product.name + '.');
    let c = me() || byEmail(info.email);
    if (!c) c = createCustomer({ firstName: info.firstName, lastName: info.lastName, email: info.email, newsletter: info.newsletter });
    if (!db.session && info.password) { c.pwd = hash(info.password); }
    if (!c.pwd && !db.session) { /* commande invitée : rattachée à l'email */ }
    const address = { label: 'Livraison', line: info.address, zip: info.zip, city: info.city };
    if (!c.addresses.length) c.addresses.push(address);
    const num = Math.max(1000, ...db.orders.map((x) => parseInt(String(x.number).replace(/\D/g, ''), 10) || 0)) + 1;
    const o = {
      id: uid('o'), number: 'GLW-' + num, customerId: c.id,
      items: t.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.product.name, variant: l.variant.label, qty: l.qty, price: l.price })),
      subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, total: t.total, promo: db.promoApplied, status: 'payee', createdAt: Date.now(),
      payment: { provider: 'stripe_test', status: 'reussi', last4: info.last4 || '4242', ref: 'pi_test_' + Math.random().toString(36).slice(2, 12) },
      shippingInfo: { carrier: 'Colissimo', tracking: null, address }
    };
    t.lines.forEach((l) => { l.variant.stock -= l.qty; });
    db.orders.push(o);
    c.points += Math.round(o.total * 10);
    db.cart = []; db.promoApplied = null;
    if (info.password || db.session) db.session = c.id;
    track('order_placed', c.id, { orderId: o.id });
    if (ordersFor(c.id).filter((x) => x.status !== 'annulee').length === 2) track('second_order', c.id, { orderId: o.id });
    save();
    return o;
  }
  function setOrderStatus(id, status) {
    const o = order(id); const prev = o.status; o.status = status;
    if (status === 'expediee' && !o.shippingInfo.tracking) o.shippingInfo.tracking = 'FR' + Math.floor(Math.random() * 1e9);
    if ((status === 'annulee' || status === 'remboursee') && prev !== 'annulee' && prev !== 'remboursee') {
      o.payment.status = 'rembourse';
      const c = customer(o.customerId); if (c) c.points = Math.max(0, c.points - Math.round(o.total * 10));
    }
    track('order_status', o.customerId, { orderId: id, from: prev, to: status });
    save();
  }

  /* ---------- quiz, avis, newsletter ---------- */
  function saveQuiz(answers, productIds, contact) {
    const cur = me();
    let cid = cur && (cur.consent.quiz || (contact && contact.quizConsent)) ? cur.id : null;
    if (!cid && contact && contact.email) {
      let c = byEmail(contact.email);
      if (!c) c = createCustomer({ firstName: contact.firstName, email: contact.email, newsletter: contact.newsletter, quizConsent: contact.quizConsent });
      else if (contact.quizConsent) c.consent.quiz = true;
      cid = c.id;
    }
    if (cid && contact && contact.quizConsent) customer(cid).consent.quiz = true;
    const q = { id: uid('q'), customerId: cid || null, at: Date.now(), answers, products: productIds };
    // sans compte ni consentement, on ne conserve qu'un résultat anonyme
    db.quizResults.push(q);
    track('quiz_completed', cid, { quizId: q.id });
    save();
    return q;
  }
  function newsletter(email) {
    let c = byEmail(email);
    if (!c) c = createCustomer({ email, newsletter: true });
    else if (!c.consent.newsletter) setConsent(c.id, 'newsletter', true);
    save(); return c;
  }
  function addReview(r) { db.reviews.push({ id: uid('r'), at: Date.now(), status: 'en_attente', ...r }); save(); }
  function moderateReview(id, status) { db.reviews.find((r) => r.id === id).status = status; save(); }

  /* ---------- segments & stats ---------- */
  function segmentOf(c) {
    const os = ordersFor(c.id).filter((o) => o.status !== 'annulee' && o.status !== 'remboursee');
    if (!os.length) return 'prospect';
    const spent = os.reduce((s, o) => s + o.total, 0);
    if (Date.now() - os[0].createdAt > 90 * DAY) return 'inactif';
    if (os.length >= 4 || spent >= 150) return 'vip';
    if (os.length >= 2) return 'fidele';
    return 'primo';
  }
  function clientStats(c) {
    const os = ordersFor(c.id).filter((o) => o.status !== 'annulee' && o.status !== 'remboursee');
    return { count: os.length, spent: round(os.reduce((s, o) => s + o.total, 0)), last: os[0] ? os[0].createdAt : null };
  }
  function tier(points) { return points >= 5000 ? { id: 'superstar', label: 'Superstar', next: null } : points >= 2000 ? { id: 'shine', label: 'Shine', next: 5000 } : { id: 'glow', label: 'Glow', next: 2000 }; }
  function stats(from, to) {
    const valid = (o) => o.status !== 'annulee' && o.status !== 'remboursee';
    const os = db.orders.filter((o) => o.createdAt >= from && o.createdAt < to);
    const ok = os.filter(valid);
    const revenue = round(ok.reduce((s, o) => s + o.total, 0));
    let visits = 0;
    for (let t = from; t < to; t += DAY) visits += db.visits[new Date(t).toISOString().slice(0, 10)] || 0;
    const newCustomers = db.customers.filter((c) => c.createdAt >= from && c.createdAt < to).length;
    return { orders: ok.length, all: os.length, revenue, aov: ok.length ? round(revenue / ok.length) : 0, newCustomers, visits, conversion: visits ? (ok.length / visits) * 100 : 0, list: ok };
  }
  function trackVisit() { const d = new Date().toISOString().slice(0, 10); db.visits[d] = (db.visits[d] || 0) + 1; save(true); }

  load();
  return {
    DAY, get raw() { return db; }, save, reset, onChange: (fn) => listeners.push(fn), uid, round,
    products, product, variant, stockOf, saveProduct,
    customers, customer, byEmail, signup, login, logout, me, updateCustomer, setConsent, deleteCustomer, exportCustomer, toggleFavorite,
    cart, addToCart, setQty, applyPromo, removePromo, totals,
    orders, order, ordersFor, placeOrder, setOrderStatus,
    saveQuiz, newsletter, addReview, moderateReview, track, runScheduled,
    segmentOf, clientStats, tier, stats, trackVisit,
    adminLogin(code) { if (code !== 'glowmie-admin') throw new Error('Code administrateur incorrect.'); db.adminSession = true; save(true); },
    adminLogout() { db.adminSession = false; save(true); },
    isAdmin: () => !!db.adminSession
  };
})();
