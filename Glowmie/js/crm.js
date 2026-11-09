/* GLOWMIE — CRM privé (même base de données que la boutique) */
(function () {
  const DB = window.GlowDB, Art = window.GlowArt, DAY = DB.DAY;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const eur0 = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const num = (n) => new Intl.NumberFormat('fr-FR').format(n);
  const pct = (n) => (isFinite(n) ? n.toFixed(1).replace('.', ',') : '0') + ' %';
  const d = (t) => new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
  const dt = (t) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const STATUS = { payee: 'Payée', en_preparation: 'En préparation', expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée', remboursee: 'Remboursée' };
  const SEG = { prospect: ['Prospects', 'Inscrits sans commande', '#9aa3b5'], primo: ['Primo-acheteurs', '1 commande', '#F2C94C'], fidele: ['Fidèles', '2 à 3 commandes', '#C9B5F2'], vip: ['VIP', '4+ commandes ou 150 €+', '#A72D70'], inactif: ['Inactifs', 'Aucun achat depuis 90 jours', '#F28BA0'] };
  const EV = { account_created: 'Compte créé', newsletter_signup: 'Inscription newsletter', order_placed: 'Commande passée', quiz_completed: 'Quiz terminé', checkout_abandoned: 'Panier abandonné', add_to_cart: 'Ajout au panier', order_status: 'Statut de commande modifié', consent_withdrawn: 'Consentement retiré', consent_given: 'Consentement donné', second_order: 'Deuxième commande' };
  const bgFor = () => '#f9d3e4';

  const state = { page: 'dashboard', days: 30, clientQ: '', clientSeg: 'all', orderQ: '', orderStatus: 'all', logFilter: 'all', seg: 'vip' };

  function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }
  function download(name, content, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
  const csv = (rows) => rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\n');
  const range = () => { const to = Date.now(); return { from: to - state.days * DAY, to, pfrom: to - 2 * state.days * DAY }; };
  const valid = (o) => o.status !== 'annulee' && o.status !== 'remboursee';
  const name = (c) => c ? `${c.firstName} ${c.lastName}`.trim() || c.email : '—';

  /* ---------- graphiques SVG ---------- */
  function areaChart(points, fmt) {
    const W = 720, H = 230, P = { l: 52, r: 12, t: 14, b: 28 };
    const max = Math.max(1, ...points.map((p) => p.v)) * 1.1;
    const x = (i) => P.l + (i / Math.max(1, points.length - 1)) * (W - P.l - P.r);
    const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const ticks = [0, .25, .5, .75, 1].map((f) => max * f);
    const every = Math.ceil(points.length / 7);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution du chiffre d'affaires">
      <defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#F5A9CB" stop-opacity=".55"/><stop offset="1" stop-color="#F5A9CB" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map((t) => `<line class="grid-line" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${P.l - 8}" y="${y(t) + 4}" text-anchor="end">${eur0(t)}</text>`).join('')}
      <path d="${line}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#ga)"/>
      <path d="${line}" fill="none" stroke="#A72D70" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${points.map((p, i) => `${i % every === 0 ? `<text class="axis" x="${x(i)}" y="${H - 8}" text-anchor="middle">${p.label}</text>` : ''}<rect x="${x(i) - (W / points.length) / 2}" y="${P.t}" width="${W / points.length}" height="${H - P.t - P.b}" fill="transparent" data-tip="${esc(p.label)} · ${fmt(p.v)}${p.n != null ? ' · ' + p.n + ' cmd' : ''}"/>`).join('')}
    </svg>`;
  }
  function bars(rows, fmt) {
    const max = Math.max(1, ...rows.map((r) => r.v));
    return `<div class="bars">${rows.map((r) => `<div class="bar-row" data-tip="${esc(r.label)} · ${fmt(r.v)}"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700">${esc(r.label)}</span><div class="track"><div class="fill" style="width:${(r.v / max) * 100}%;${r.color ? 'background:' + r.color : ''}"></div></div><span class="num" style="text-align:right;font-weight:800">${fmt(r.v)}</span></div>`).join('')}</div>`;
  }
  function donut(rows) {
    const total = rows.reduce((s, r) => s + r.v, 0) || 1; let a = -Math.PI / 2;
    const arcs = rows.map((r) => {
      const a2 = a + (r.v / total) * Math.PI * 2; const large = a2 - a > Math.PI ? 1 : 0;
      const p = (ang, rad) => `${60 + Math.cos(ang) * rad},${60 + Math.sin(ang) * rad}`;
      const path = r.v ? `<path d="M${p(a, 52)}A52,52 0 ${large} 1 ${p(a2 - 0.0001, 52)}L${p(a2 - 0.0001, 32)}A32,32 0 ${large} 0 ${p(a, 32)}Z" fill="${r.color}" data-tip="${esc(r.label)} · ${r.v} (${Math.round(r.v / total * 100)} %)"/>` : '';
      a = a2; return path;
    }).join('');
    return `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 120 120" style="width:150px" role="img" aria-label="Répartition par segment">${arcs}<text x="60" y="58" text-anchor="middle" style="font:700 20px Fredoka;fill:#3D1430">${total}</text><text x="60" y="74" text-anchor="middle" style="font:700 9px Nunito;fill:#8C6A80">clients</text></svg>
      <div class="legend" style="flex-direction:column;gap:6px">${rows.map((r) => `<span><i class="dot" style="background:${r.color}"></i>${esc(r.label)} <b>${r.v}</b></span>`).join('')}</div></div>`;
  }
  function series(from, to) {
    const span = to - from; const step = span > 60 * DAY ? 7 * DAY : DAY; const pts = [];
    for (let t = from; t < to; t += step) {
      const os = DB.orders().filter((o) => valid(o) && o.createdAt >= t && o.createdAt < t + step);
      pts.push({ label: new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), v: Math.round(os.reduce((s, o) => s + o.total, 0)), n: os.length });
    }
    return pts;
  }
  function salesByProduct(from, to) {
    const m = {};
    DB.orders().filter((o) => valid(o) && o.createdAt >= from && o.createdAt < to).forEach((o) => o.items.forEach((i) => { m[i.productId] = m[i.productId] || { qty: 0, ca: 0, orders: 0 }; m[i.productId].qty += i.qty; m[i.productId].ca += i.qty * i.price; m[i.productId].orders++; }));
    return DB.products(true).map((p) => ({ p, ...(m[p.id] || { qty: 0, ca: 0, orders: 0 }) })).sort((a, b) => b.ca - a.ca);
  }

  /* ================= PAGES ================= */
  const pages = {};

  pages.dashboard = () => {
    const r = range(); const cur = DB.stats(r.from, r.to), prev = DB.stats(r.pfrom, r.from);
    const delta = (a, b, money) => { if (!b) return '<span class="delta muted">—</span>'; const v = (a - b) / b * 100; return `<span class="delta ${v >= 0 ? 'up' : 'down'}">${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(1).replace('.', ',')} %</span> <span class="muted" style="font-size:.78rem">vs période préc.</span>`; };
    const kpi = (label, val, a, b) => `<div class="card kpi"><div class="label">${label}</div><div class="value">${val}</div>${delta(a, b)}</div>`;
    const sp = salesByProduct(r.from, r.to).slice(0, 6);
    const segs = Object.keys(SEG).map((k) => ({ label: SEG[k][0], v: DB.customers().filter((c) => !c.deleted && DB.segmentOf(c) === k).length, color: SEG[k][2] }));
    const recent = DB.orders().slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    const low = DB.products(true).flatMap((p) => p.variants.filter((v) => v.stock <= 15).map((v) => `${p.name} (${v.label}) : <b>${v.stock}</b>`));
    const toShip = DB.orders().filter((o) => o.status === 'payee' || o.status === 'en_preparation').length;
    return `
      <div class="grid g-kpi">${kpi('Chiffre d’affaires', eur0(cur.revenue), cur.revenue, prev.revenue)}${kpi('Commandes', num(cur.orders), cur.orders, prev.orders)}${kpi('Panier moyen', eur(cur.aov), cur.aov, prev.aov)}${kpi('Nouveaux clients', num(cur.newCustomers), cur.newCustomers, prev.newCustomers)}${kpi('Conversion', pct(cur.conversion), cur.conversion, prev.conversion)}</div>
      <div class="grid g-2" style="margin-top:18px">
        <div class="card chart"><div class="top" style="margin-bottom:6px"><h2 style="margin:0">Chiffre d'affaires</h2><span class="muted">${state.days > 60 ? 'par semaine' : 'par jour'} · ${num(cur.visits)} visites</span></div>${areaChart(series(r.from, r.to), eur0)}</div>
        <div class="card"><h2>Clients par segment</h2>${donut(segs)}<p style="margin:14px 0 0"><a href="#/segments">Voir les segments →</a></p></div>
      </div>
      <div class="grid g-2" style="margin-top:18px">
        <div class="card"><div class="top" style="margin-bottom:12px"><h2 style="margin:0">Dernières commandes</h2><a href="#/commandes" class="btn ghost sm">Tout voir</a></div>
          <div class="table-wrap"><table><thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Statut</th><th class="num">Total</th></tr></thead><tbody>
          ${recent.map((o) => `<tr class="click" data-order="${o.id}"><td><b>${o.number}</b></td><td>${esc(name(DB.customer(o.customerId)))}</td><td>${dt(o.createdAt)}</td><td><span class="pill s-${o.status}">${STATUS[o.status]}</span></td><td class="num">${eur(o.total)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="grid" style="align-content:start">
          <div class="card"><h2>Top produits</h2>${bars(sp.map((x) => ({ label: x.p.name, v: Math.round(x.ca) })), eur0)}</div>
          <div class="card"><h2>À traiter</h2><p class="alert">📦 ${toShip} commande${toShip > 1 ? 's' : ''} à préparer ou expédier</p>${low.length ? `<p class="alert" style="margin-top:8px;background:#ffe0e5;color:#8d1534">⚠️ Stock faible<br>${low.join('<br>')}</p>` : ''}${DB.raw.reviews.some((x) => x.status === 'en_attente') ? `<p class="alert" style="margin-top:8px;background:#e8e0ff;color:#5333a8">💬 Avis en attente de modération · <a href="#/produits">modérer</a></p>` : ''}</div>
        </div>
      </div>`;
  };

  /* ---------- clients ---------- */
  pages.clients = () => {
    const q = state.clientQ.toLowerCase();
    const list = DB.customers().filter((c) => !c.deleted).map((c) => ({ c, s: DB.clientStats(c), seg: DB.segmentOf(c) }))
      .filter((x) => (state.clientSeg === 'all' || x.seg === state.clientSeg) && (!q || (name(x.c) + ' ' + x.c.email + ' ' + x.c.city).toLowerCase().includes(q)))
      .sort((a, b) => b.c.createdAt - a.c.createdAt);
    return `<div class="card"><div class="filters"><label class="sr-only" for="cq">Rechercher</label><input type="search" id="cq" placeholder="Nom, email, ville…" value="${esc(state.clientQ)}">
      <select id="cseg" aria-label="Segment"><option value="all">Tous les segments</option>${Object.keys(SEG).map((k) => `<option value="${k}" ${state.clientSeg === k ? 'selected' : ''}>${SEG[k][0]}</option>`).join('')}</select>
      <span class="muted">${list.length} client${list.length > 1 ? 's' : ''}</span><span style="flex:1"></span><button class="btn ghost sm" id="cExport">Exporter CSV</button></div>
      <div class="table-wrap"><table><thead><tr><th>Client</th><th>Ville</th><th>Segment</th><th class="num">Cmd</th><th class="num">CA</th><th class="num">Points</th><th>Consent.</th><th>Inscrit</th></tr></thead><tbody>
      ${list.map(({ c, s, seg }) => `<tr class="click" data-client="${c.id}"><td><b>${esc(name(c))}</b><br><span class="muted" style="font-size:.82rem">${esc(c.email)}</span></td><td>${esc(c.city)}</td><td><span class="pill seg-${seg}">${SEG[seg][0]}</span></td><td class="num">${s.count}</td><td class="num">${eur(s.spent)}</td><td class="num">${num(c.points)}</td><td title="Newsletter / Quiz">${c.consent.newsletter ? '📧' : '<span class="muted">—</span>'} ${c.consent.quiz ? '🧪' : ''}</td><td>${d(c.createdAt)}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">Aucun client</td></tr>'}
      </tbody></table></div></div>`;
  };
  function clientSheet(id) {
    const c = DB.customer(id); if (!c) return;
    const s = DB.clientStats(c), seg = DB.segmentOf(c), os = DB.ordersFor(id), t = DB.tier(c.points);
    const evs = DB.raw.events.filter((e) => e.customerId === id).sort((a, b) => b.at - a.at).slice(0, 15);
    const quiz = DB.raw.quizResults.filter((q) => q.customerId === id);
    const logs = DB.raw.logs.filter((l) => l.customerId === id).sort((a, b) => b.at - a.at).slice(0, 8);
    sheet(`<div class="head"><div><h1 style="margin:0">${esc(name(c))}</h1><span class="pill seg-${seg}">${SEG[seg][0]}</span> <span class="pill" style="background:var(--petal);color:var(--berry)">Glow Club · ${t.label}</span></div><button class="x" data-close aria-label="Fermer">×</button></div>
      <div class="grid g-3" style="margin-bottom:14px"><div class="card kpi"><div class="label">Commandes</div><div class="value">${s.count}</div></div><div class="card kpi"><div class="label">Total dépensé</div><div class="value">${eur0(s.spent)}</div></div><div class="card kpi"><div class="label">Points</div><div class="value">${num(c.points)}</div></div></div>
      <div class="card"><h3>Coordonnées</h3><dl class="kv"><dt>Email</dt><dd>${esc(c.email)}</dd><dt>Téléphone</dt><dd>${esc(c.phone) || '—'}</dd><dt>Adresse</dt><dd>${c.addresses[0] ? esc(c.addresses[0].line + ', ' + c.addresses[0].zip + ' ' + c.addresses[0].city) : '—'}</dd><dt>Inscription</dt><dd>${d(c.createdAt)}</dd><dt>Compte</dt><dd>${c.pwd ? 'Compte actif' : 'Sans mot de passe (invitée / prospect)'}</dd></dl></div>
      <div class="card"><h3>Consentements</h3><dl class="kv"><dt>Newsletter</dt><dd>${c.consent.newsletter ? '✅ Accepté' : '❌ Non'}</dd><dt>Données quiz</dt><dd>${c.consent.quiz ? '✅ Accepté' : '❌ Non'}</dd><dt>Mis à jour</dt><dd>${d(c.consent.date)}</dd></dl><p class="muted" style="font-size:.8rem;margin:8px 0 0">Les consentements ne sont modifiables que par la cliente (depuis son compte).</p></div>
      <div class="card"><h3>Fidélité</h3><div class="f2"><div class="field"><label for="ptsAdj">Ajuster les points</label><input id="ptsAdj" type="number" step="10" value="0"></div><div class="field" style="align-self:end"><button class="btn sm" id="ptsBtn">Appliquer</button></div></div></div>
      <div class="card"><h3>Notes internes</h3><textarea id="note" rows="3" style="width:100%">${esc(c.notes)}</textarea><p style="margin:8px 0 0"><button class="btn sm" id="noteBtn">Enregistrer la note</button></p></div>
      <div class="card"><h3>Commandes (${os.length})</h3>${os.length ? `<div class="table-wrap" style="margin-bottom:-20px"><table><tbody>${os.map((o) => `<tr class="click" data-order="${o.id}"><td><b>${o.number}</b></td><td>${d(o.createdAt)}</td><td><span class="pill s-${o.status}">${STATUS[o.status]}</span></td><td class="num">${eur(o.total)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aucune commande.</p>'}</div>
      ${quiz.length ? `<div class="card"><h3>Résultats du quiz</h3>${quiz.map((q) => `<p style="margin:0 0 6px">${d(q.at)} · ${Object.entries(q.answers).map(([k, v]) => `${esc(k)} : <b>${esc([].concat(v).join(', '))}</b>`).join(' · ')} → ${q.products.map((p) => esc((DB.product(p) || {}).name)).join(', ')}</p>`).join('')}</div>` : ''}
      <div class="card"><h3>Emails automatiques</h3>${logs.length ? `<ul class="timeline">${logs.map((l) => `<li><span class="pill l-${l.status}">${l.status}</span> ${esc((DB.raw.automations.find((a) => a.id === l.automationId) || {}).name)} · ${dt(l.at)}${l.opened ? ' · ouvert' : ''}${l.clicked ? ' · cliqué' : ''}</li>`).join('')}</ul>` : '<p class="muted">Aucun email.</p>'}</div>
      <div class="card"><h3>Parcours client</h3><ul class="timeline">${evs.map((e) => `<li><b>${EV[e.type] || e.type}</b> <span class="muted">· ${dt(e.at)}</span></li>`).join('')}</ul></div>
      <div class="card"><h3>RGPD</h3><p class="muted" style="font-size:.88rem">Export complet des données ou anonymisation sur demande de la cliente.</p><button class="btn ghost sm" id="cExp">Exporter (JSON)</button> <button class="btn danger sm" id="cDel">Anonymiser</button></div>`);
    $('#ptsBtn').onclick = () => { const v = parseInt($('#ptsAdj').value, 10) || 0; DB.updateCustomer(id, { points: Math.max(0, c.points + v) }); toast('Points mis à jour'); clientSheet(id); };
    $('#noteBtn').onclick = () => { DB.updateCustomer(id, { notes: $('#note').value }); toast('Note enregistrée'); };
    $('#cExp').onclick = () => download(`client-${id}.json`, JSON.stringify(DB.exportCustomer(id), null, 2), 'application/json');
    $('#cDel').onclick = () => { if (confirm('Anonymiser définitivement les données personnelles de ce client ?')) { DB.deleteCustomer(id); closeSheet(); toast('Client anonymisé'); } };
  }

  /* ---------- commandes ---------- */
  pages.commandes = () => {
    const q = state.orderQ.toLowerCase();
    const list = DB.orders().filter((o) => (state.orderStatus === 'all' || o.status === state.orderStatus) && (!q || (o.number + ' ' + name(DB.customer(o.customerId))).toLowerCase().includes(q))).sort((a, b) => b.createdAt - a.createdAt);
    const counts = Object.keys(STATUS).map((s) => [s, DB.orders().filter((o) => o.status === s).length]);
    return `<div class="card"><div class="filters"><label class="sr-only" for="oq">Rechercher</label><input type="search" id="oq" placeholder="N° de commande, client…" value="${esc(state.orderQ)}">
      <select id="ost" aria-label="Statut"><option value="all">Tous les statuts</option>${counts.map(([s, n]) => `<option value="${s}" ${state.orderStatus === s ? 'selected' : ''}>${STATUS[s]} (${n})</option>`).join('')}</select>
      <span class="muted">${list.length} commande${list.length > 1 ? 's' : ''}</span><span style="flex:1"></span><button class="btn ghost sm" id="oExport">Exporter CSV</button></div>
      <div class="table-wrap"><table><thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Articles</th><th>Paiement</th><th>Statut</th><th class="num">Total</th></tr></thead><tbody>
      ${list.slice(0, 200).map((o) => `<tr class="click" data-order="${o.id}"><td><b>${o.number}</b></td><td>${dt(o.createdAt)}</td><td>${esc(name(DB.customer(o.customerId)))}</td><td>${o.items.reduce((s, i) => s + i.qty, 0)}</td><td><span class="pill" style="background:#ecebff;color:#635bff">Stripe test · ${o.payment.status}</span></td><td><span class="pill s-${o.status}">${STATUS[o.status]}</span></td><td class="num">${eur(o.total)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">Aucune commande</td></tr>'}
      </tbody></table></div></div>`;
  };
  function orderSheet(id) {
    const o = DB.order(id); if (!o) return; const c = DB.customer(o.customerId);
    sheet(`<div class="head"><div><h1 style="margin:0">Commande ${o.number}</h1><span class="muted">${dt(o.createdAt)}</span></div><button class="x" data-close aria-label="Fermer">×</button></div>
      <div class="card"><h3>Statut</h3><div class="filters" style="margin:0"><label class="sr-only" for="stSel">Statut</label><select id="stSel">${Object.keys(STATUS).map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${STATUS[s]}</option>`).join('')}</select><button class="btn sm" id="stBtn">Mettre à jour</button>
        ${o.status === 'payee' ? '<button class="btn ghost sm" data-quick="en_preparation">→ En préparation</button>' : ''}${o.status === 'en_preparation' ? '<button class="btn ghost sm" data-quick="expediee">→ Expédier</button>' : ''}${o.status === 'expediee' ? '<button class="btn ghost sm" data-quick="livree">→ Livrée</button>' : ''}</div>
        <p class="muted" style="font-size:.82rem;margin:8px 0 0">Le changement est visible immédiatement dans l'espace client.</p></div>
      <div class="card"><h3>Client</h3><p style="margin:0"><a href="#" data-client="${c ? c.id : ''}"><b>${esc(name(c))}</b></a> · ${esc(c ? c.email : '')}</p></div>
      <div class="card"><h3>Articles</h3><div class="table-wrap" style="margin-bottom:0"><table><tbody>${o.items.map((i) => `<tr><td>${esc(i.name)} <span class="muted">· ${esc(i.variant)}</span></td><td class="num">× ${i.qty}</td><td class="num">${eur(i.price * i.qty)}</td></tr>`).join('')}
        <tr><td>Sous-total</td><td></td><td class="num">${eur(o.subtotal)}</td></tr>${o.discount ? `<tr><td>Réduction ${esc(o.promo || '')}</td><td></td><td class="num">−${eur(o.discount)}</td></tr>` : ''}<tr><td>Livraison</td><td></td><td class="num">${o.shipping ? eur(o.shipping) : 'Offerte'}</td></tr><tr><td><b>Total</b></td><td></td><td class="num"><b>${eur(o.total)}</b></td></tr></tbody></table></div></div>
      <div class="card"><h3>Paiement (simulé)</h3><dl class="kv"><dt>Prestataire</dt><dd>Stripe · mode test</dd><dt>Référence</dt><dd><code>${esc(o.payment.ref)}</code></dd><dt>Carte</dt><dd>•••• ${esc(o.payment.last4)}</dd><dt>État</dt><dd>${esc(o.payment.status)}</dd></dl></div>
      <div class="card"><h3>Expédition (simulée)</h3><dl class="kv"><dt>Transporteur</dt><dd>${esc(o.shippingInfo.carrier)}</dd><dt>Suivi</dt><dd>${esc(o.shippingInfo.tracking) || '—'}</dd><dt>Adresse</dt><dd>${o.shippingInfo.address ? esc(o.shippingInfo.address.line + ', ' + o.shippingInfo.address.zip + ' ' + o.shippingInfo.address.city) : '—'}</dd></dl></div>`);
    const set = (s) => { DB.setOrderStatus(id, s); toast('Statut : ' + STATUS[s]); orderSheet(id); };
    $('#stBtn').onclick = () => set($('#stSel').value);
    $$('[data-quick]').forEach((b) => b.onclick = () => set(b.dataset.quick));
  }

  /* ---------- produits ---------- */
  pages.produits = () => {
    const pending = DB.raw.reviews.filter((r) => r.status === 'en_attente');
    return `<div class="card"><div class="filters"><span class="muted">${DB.products(true).length} produits</span><span style="flex:1"></span><button class="btn sm" id="newProd">+ Nouveau produit</button></div>
      <div class="table-wrap"><table><thead><tr><th></th><th>Produit</th><th>Catégorie</th><th class="num">Prix</th><th class="num">Prix barré</th><th class="num">Stock</th><th>Badges</th><th>En ligne</th></tr></thead><tbody>
      ${DB.products(true).map((p) => { const st = DB.stockOf(p); return `<tr class="click" data-prod="${p.id}"><td><div class="thumb" style="background:${bgFor(p)}">${Art.product(p)}</div></td><td><b>${esc(p.name)}</b><br><span class="muted" style="font-size:.82rem">${esc(p.tagline)}</span></td><td>${esc((DB.raw.categories.find((c) => c.id === p.category) || {}).label)}</td><td class="num">${eur(p.price)}</td><td class="num">${p.compareAt ? eur(p.compareAt) : '—'}</td><td class="num" style="color:${st <= 15 ? 'var(--bad)' : 'inherit'};font-weight:800">${st}</td><td>${p.isNew ? '<span class="pill" style="background:#fff1c2;color:#8a6400">Nouveau</span> ' : ''}${p.featured ? '<span class="pill" style="background:var(--petal);color:var(--berry)">Best-seller</span>' : ''}</td><td><label class="switch" onclick="event.stopPropagation()"><input type="checkbox" data-active="${p.id}" ${p.active ? 'checked' : ''} aria-label="${esc(p.name)} en ligne"><span></span></label></td></tr>`; }).join('')}
      </tbody></table></div></div>
      <div class="card" style="margin-top:18px"><h2>Modération des avis ${pending.length ? `<span class="pill" style="background:var(--butter);color:var(--berry)">${pending.length}</span>` : ''}</h2>
      ${DB.raw.reviews.slice().sort((a, b) => b.at - a.at).slice(0, 12).map((r) => `<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>${esc(r.author)}</b> · ${'★'.repeat(r.rating)} · <span class="muted">${esc((DB.product(r.productId) || {}).name)} · ${d(r.at)}</span><br>${esc(r.text)}</div><span class="pill ${r.status === 'publie' ? 's-livree' : r.status === 'refuse' ? 's-annulee' : 's-payee'}">${r.status.replace('_', ' ')}</span>${r.status !== 'publie' ? `<button class="btn sm" data-rev="${r.id}" data-to="publie">Publier</button>` : ''}${r.status !== 'refuse' ? `<button class="btn ghost sm" data-rev="${r.id}" data-to="refuse">Refuser</button>` : ''}</div>`).join('')}</div>`;
  };
  function productSheet(id) {
    const isNew = !id;
    const p = isNew ? { id: '', name: '', tagline: '', category: 'soins', shape: 'tube', body: '#F5A9CB', cap: '#C9B5F2', ink: '#A72D70', price: 20, compareAt: null, isNew: true, featured: false, active: false, variants: [{ id: '', label: '50 ml', price: 20, stock: 0 }], description: '', ingredients: [], tips: '', needs: [], step: 'traiter', time: ['matin', 'soir'], rating: 5 } : JSON.parse(JSON.stringify(DB.product(id)));
    const paint = () => sheet(`<div class="head"><div><h1 style="margin:0">${isNew ? 'Nouveau produit' : esc(p.name)}</h1></div><button class="x" data-close aria-label="Fermer">×</button></div>
      <form id="pf">
        <div class="card" style="display:flex;gap:16px;align-items:center"><div class="thumb" id="pvw" style="width:110px;height:130px;background:${bgFor(p)}">${Art.product(p)}</div><p class="muted" style="margin:0;font-size:.88rem">Aperçu du packshot généré à partir de la forme et des couleurs. En production, les photos sont stockées dans Supabase Storage.</p></div>
        <div class="card"><h3>Informations</h3>
          <div class="f2"><div class="field"><label for="pName">Nom</label><input id="pName" type="text" required value="${esc(p.name)}"></div><div class="field"><label for="pTag">Accroche</label><input id="pTag" type="text" value="${esc(p.tagline)}"></div></div>
          <div class="f3"><div class="field"><label for="pCat">Catégorie</label><select id="pCat">${DB.raw.categories.map((c) => `<option value="${c.id}" ${p.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}</select></div>
          <div class="field"><label for="pShape">Packaging</label><select id="pShape">${['tube', 'serum', 'jar', 'tall', 'gloss', 'set'].map((s) => `<option ${p.shape === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Couleurs</label><div style="display:flex;gap:6px"><input type="color" id="pBody" value="${p.body}" aria-label="Couleur flacon"><input type="color" id="pCap" value="${p.cap}" aria-label="Couleur bouchon"><input type="color" id="pInk" value="${p.ink}" aria-label="Couleur texte"></div></div></div>
          <div class="field"><label for="pDesc">Description</label><textarea id="pDesc" rows="3">${esc(p.description)}</textarea></div>
          <div class="field"><label for="pIng">Composition (séparée par des virgules)</label><input id="pIng" type="text" value="${esc(p.ingredients.join(', '))}"></div>
          <div class="field"><label for="pTips">Conseils</label><textarea id="pTips" rows="2">${esc(p.tips)}</textarea></div></div>
        <div class="card"><h3>Prix & promotion</h3><div class="f2"><div class="field"><label for="pPrice">Prix de vente (€)</label><input id="pPrice" type="number" min="0" step="0.5" value="${p.price}"></div><div class="field"><label for="pCmp">Prix barré (€, promo)</label><input id="pCmp" type="number" min="0" step="0.5" value="${p.compareAt || ''}" placeholder="Aucune promo"></div></div></div>
        <div class="card"><h3>Variantes & stock</h3><div id="vars">${p.variants.map((v, i) => `<div class="f3" data-vi="${i}"><div class="field"><label>Format</label><input type="text" data-k="label" value="${esc(v.label)}"></div><div class="field"><label>Prix (€)</label><input type="number" min="0" step="0.5" data-k="price" value="${v.price}"></div><div class="field"><label>Stock</label><input type="number" min="0" data-k="stock" value="${v.stock}"></div></div>`).join('')}</div><button type="button" class="btn ghost sm" id="addVar">+ Variante</button></div>
        <div class="card"><h3>Visibilité</h3><div style="display:flex;gap:22px;flex-wrap:wrap">${[['active', 'En ligne'], ['isNew', 'Badge nouveau'], ['featured', 'Best-seller (accueil)']].map(([k, l]) => `<label style="display:flex;gap:8px;align-items:center;font-size:.9rem"><span class="switch"><input type="checkbox" id="p_${k}" ${p[k] ? 'checked' : ''}><span></span></span>${l}</label>`).join('')}</div></div>
        <p class="muted" id="pErr" style="color:var(--bad);font-weight:700"></p>
        <button class="btn">Enregistrer</button>
      </form>`);
    const collect = () => {
      p.name = $('#pName').value.trim(); p.tagline = $('#pTag').value.trim(); p.category = $('#pCat').value; p.shape = $('#pShape').value;
      p.body = $('#pBody').value; p.cap = $('#pCap').value; p.ink = $('#pInk').value; p.description = $('#pDesc').value.trim();
      p.ingredients = $('#pIng').value.split(',').map((s) => s.trim()).filter(Boolean); p.tips = $('#pTips').value.trim();
      p.price = Math.max(0, parseFloat($('#pPrice').value) || 0); const cmp = parseFloat($('#pCmp').value); p.compareAt = cmp > p.price ? cmp : null;
      $$('#vars [data-vi]').forEach((row) => { const v = p.variants[+row.dataset.vi]; v.label = $('[data-k=label]', row).value.trim() || 'Standard'; v.price = Math.max(0, parseFloat($('[data-k=price]', row).value) || 0); v.stock = Math.max(0, parseInt($('[data-k=stock]', row).value, 10) || 0); });
      ['active', 'isNew', 'featured'].forEach((k) => { p[k] = $('#p_' + k).checked; });
    };
    paint();
    const bind = () => {
      $('#pf').addEventListener('input', () => { collect(); $('#pvw').innerHTML = Art.product(p); $('#pvw').style.background = bgFor(p); });
      $('#addVar').onclick = () => { collect(); p.variants.push({ id: '', label: '', price: p.price, stock: 0 }); paint(); bind(); };
      $('#pf').onsubmit = (e) => {
        e.preventDefault(); collect();
        if (!p.name) return ($('#pErr').textContent = 'Le nom est obligatoire.');
        if (isNew) { p.id = p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || DB.uid('p'); if (DB.product(p.id)) p.id += '-' + Date.now().toString(36).slice(-3); }
        p.variants.forEach((v, i) => { if (!v.id) v.id = p.id + '-' + i + Date.now().toString(36).slice(-3); });
        p.price = p.variants[0].price;
        DB.saveProduct(p); toast('Produit enregistré ✔︎ (visible sur la boutique)'); closeSheet();
      };
    };
    bind();
  }

  /* ---------- segments ---------- */
  pages.segments = () => {
    const all = DB.customers().filter((c) => !c.deleted).map((c) => ({ c, seg: DB.segmentOf(c), s: DB.clientStats(c) }));
    const cards = Object.keys(SEG).map((k) => { const l = all.filter((x) => x.seg === k); const ca = l.reduce((s, x) => s + x.s.spent, 0); const opt = l.filter((x) => x.c.consent.newsletter).length;
      return `<div class="card seg-card ${state.seg === k ? 'on' : ''}" data-seg="${k}" tabindex="0" role="button" aria-pressed="${state.seg === k}"><span class="pill seg-${k}">${SEG[k][0]}</span><div class="big">${l.length}</div><p class="muted" style="margin:0 0 6px;font-size:.85rem">${SEG[k][1]}</p><b>${eur0(ca)}</b> <span class="muted">CA cumulé</span><br><span class="muted" style="font-size:.82rem">${opt} joignables par email</span></div>`; }).join('');
    const sel = all.filter((x) => x.seg === state.seg).sort((a, b) => b.s.spent - a.s.spent);
    const actions = { prospect: 'Relance « HELLOGLOW -10 % » pour déclencher la première commande.', primo: 'Conseils d’utilisation J+7 puis réapprovisionnement J+45.', fidele: 'Invitation au Glow Club VIP et avant-premières.', vip: 'Coffret cadeau saisonnier et accès anticipé aux nouveautés.', inactif: 'Campagne de réactivation avec nouveautés + code GLOWCLUB.' };
    return `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">${cards}</div>
      <div class="card" style="margin-top:18px"><div class="top" style="margin-bottom:10px"><h2 style="margin:0">${SEG[state.seg][0]} · ${sel.length} client${sel.length > 1 ? 's' : ''}</h2><button class="btn ghost sm" id="segExport">Exporter CSV</button></div>
      <p class="alert" style="background:var(--petal);color:var(--berry)">💡 Action suggérée : ${actions[state.seg]}</p>
      <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Client</th><th class="num">Cmd</th><th class="num">CA</th><th>Dernier achat</th><th>Newsletter</th></tr></thead><tbody>
      ${sel.map(({ c, s }) => `<tr class="click" data-client="${c.id}"><td><b>${esc(name(c))}</b> <span class="muted">· ${esc(c.email)}</span></td><td class="num">${s.count}</td><td class="num">${eur(s.spent)}</td><td>${s.last ? d(s.last) : '—'}</td><td>${c.consent.newsletter ? '✅' : '—'}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Aucun client dans ce segment</td></tr>'}</tbody></table></div></div>`;
  };

  /* ---------- automatisations ---------- */
  function autoMetrics(a, from) {
    const l = DB.raw.logs.filter((x) => x.automationId === a.id && (!from || x.at >= from));
    const sent = l.filter((x) => x.status === 'envoye');
    return { sent: sent.length, planned: l.filter((x) => x.status === 'planifie').length, skipped: l.filter((x) => x.status === 'ignore' || x.status === 'annule').length,
      open: sent.length ? sent.filter((x) => x.opened).length / sent.length * 100 : 0, click: sent.length ? sent.filter((x) => x.clicked).length / sent.length * 100 : 0, conv: sent.length ? sent.filter((x) => x.converted).length / sent.length * 100 : 0 };
  }
  pages.automatisations = () => {
    const TRIG = { newsletter_signup: 'Inscription newsletter', quiz_completed: 'Quiz terminé', checkout_abandoned: 'Panier abandonné', order_placed: 'Commande passée', second_order: 'Deuxième commande' };
    const logs = DB.raw.logs.filter((l) => state.logFilter === 'all' || l.status === state.logFilter).sort((a, b) => b.at - a.at).slice(0, 60);
    return `<div class="card" style="margin-bottom:18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:240px"><b>Moteur d'automatisation</b><br><span class="muted" style="font-size:.88rem">Les déclencheurs sont émis par la boutique en temps réel. Aucun email n'est envoyé sans consentement valide. En production : envoi via Resend + tâche planifiée (cron Vercel).</span></div>
      <button class="btn ghost sm" id="runNow">Exécuter les envois dus</button><button class="btn sm" id="run7">Simuler +7 jours</button><button class="btn sm" id="run45">Simuler +45 jours</button></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">${DB.raw.automations.map((a) => { const m = autoMetrics(a); return `<div class="card auto-card"><div class="row"><h2 style="margin:0">${esc(a.name)}</h2><label class="switch"><input type="checkbox" data-auto="${a.id}" ${a.active ? 'checked' : ''} aria-label="Activer ${esc(a.name)}"><span></span></label></div>
        <span class="muted" style="font-size:.85rem">⚡ ${TRIG[a.trigger]}${a.delayDays ? ` · après ${a.delayDays} j` : ' · immédiat'}</span><p style="margin:0;font-size:.9rem">${esc(a.desc)}</p><p style="margin:0;font-size:.85rem"><b>Objet :</b> ${esc(a.subject)}</p>
        <div class="metrics"><div><b>${m.sent}</b><span>Envoyés</span></div><div><b>${m.planned}</b><span>Planifiés</span></div><div><b>${Math.round(m.open)}%</b><span>Ouverture</span></div><div><b>${Math.round(m.click)}%</b><span>Clic</span></div></div></div>`; }).join('')}</div>
      <div class="card" style="margin-top:18px"><div class="filters"><h2 style="margin:0;flex:1">Journal des envois</h2><select id="logF" aria-label="Filtrer"><option value="all">Tous</option>${['envoye', 'planifie', 'ignore', 'annule'].map((s) => `<option ${state.logFilter === s ? 'selected' : ''} value="${s}">${s}</option>`).join('')}</select></div>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Scénario</th><th>Client</th><th>Statut</th><th>Suivi</th></tr></thead><tbody>
      ${logs.map((l) => `<tr ${l.customerId ? `class="click" data-client="${l.customerId}"` : ''}><td>${dt(l.at)}</td><td>${esc((DB.raw.automations.find((a) => a.id === l.automationId) || {}).name)}</td><td>${esc(name(DB.customer(l.customerId)))}</td><td><span class="pill l-${l.status}">${l.status}</span>${l.reason ? ` <span class="muted" style="font-size:.8rem">${esc(l.reason)}</span>` : ''}</td><td>${l.opened ? '👀' : ''}${l.clicked ? ' 👆' : ''}${l.converted ? ' 💰' : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Aucun envoi</td></tr>'}</tbody></table></div></div>`;
  };

  /* ---------- reporting ---------- */
  pages.reporting = () => {
    const r = range(); const sp = salesByProduct(r.from, r.to); const total = sp.reduce((s, x) => s + x.ca, 0) || 1;
    const cats = {}; sp.forEach((x) => { cats[x.p.category] = (cats[x.p.category] || 0) + x.ca; });
    const promos = {}; DB.orders().filter((o) => valid(o) && o.createdAt >= r.from && o.promo).forEach((o) => { promos[o.promo] = promos[o.promo] || { n: 0, disc: 0, ca: 0 }; promos[o.promo].n++; promos[o.promo].disc += o.discount; promos[o.promo].ca += o.total; });
    const st = DB.stats(r.from, r.to);
    const quizN = DB.raw.quizResults.filter((q) => q.at >= r.from).length;
    return `<div class="grid g-kpi"><div class="card kpi"><div class="label">CA période</div><div class="value">${eur0(st.revenue)}</div></div><div class="card kpi"><div class="label">Commandes</div><div class="value">${st.orders}</div></div><div class="card kpi"><div class="label">Articles vendus</div><div class="value">${sp.reduce((s, x) => s + x.qty, 0)}</div></div><div class="card kpi"><div class="label">Quiz complétés</div><div class="value">${quizN}</div></div><div class="card kpi"><div class="label">Visites</div><div class="value">${num(st.visits)}</div></div></div>
      <div class="card" style="margin-top:18px"><div class="top" style="margin-bottom:10px"><h2 style="margin:0">Ventes par produit</h2><button class="btn ghost sm" id="repExport">Exporter CSV</button></div>
      <div class="table-wrap"><table><thead><tr><th>Produit</th><th class="num">Commandes</th><th class="num">Quantité</th><th class="num">CA</th><th class="num">Part</th><th style="width:30%"></th></tr></thead><tbody>
      ${sp.map((x) => `<tr><td><b>${esc(x.p.name)}</b></td><td class="num">${x.orders}</td><td class="num">${x.qty}</td><td class="num">${eur(x.ca)}</td><td class="num">${pct(x.ca / total * 100)}</td><td><div class="bar-row" style="grid-template-columns:1fr"><div class="track"><div class="fill" style="width:${x.ca / sp[0].ca * 100 || 0}%"></div></div></div></td></tr>`).join('')}</tbody></table></div></div>
      <div class="grid g-2e" style="margin-top:18px">
        <div class="card"><h2>Ventes par catégorie</h2>${bars(DB.raw.categories.map((c) => ({ label: c.label, v: Math.round(cats[c.id] || 0) })).sort((a, b) => b.v - a.v), eur0)}</div>
        <div class="card"><h2>Codes promo</h2>${Object.keys(promos).length ? `<div class="table-wrap"><table><thead><tr><th>Code</th><th class="num">Utilisations</th><th class="num">Remise</th><th class="num">CA généré</th></tr></thead><tbody>${Object.entries(promos).map(([k, v]) => `<tr><td><b>${k}</b></td><td class="num">${v.n}</td><td class="num">${eur(v.disc)}</td><td class="num">${eur(v.ca)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aucun code utilisé sur la période.</p>'}</div>
      </div>
      <div class="card" style="margin-top:18px"><h2>Résultats des scénarios (période)</h2><div class="table-wrap"><table><thead><tr><th>Scénario</th><th class="num">Envoyés</th><th class="num">Ouverture</th><th class="num">Clic</th><th class="num">Conversion</th><th class="num">Bloqués / annulés</th></tr></thead><tbody>
      ${DB.raw.automations.map((a) => { const m = autoMetrics(a, r.from); return `<tr><td><b>${esc(a.name)}</b></td><td class="num">${m.sent}</td><td class="num">${pct(m.open)}</td><td class="num">${pct(m.click)}</td><td class="num">${pct(m.conv)}</td><td class="num">${m.skipped}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  };

  /* ================= SHELL ================= */
  const NAV = [['dashboard', '📊', 'Dashboard'], ['clients', '💗', 'Clients'], ['commandes', '📦', 'Commandes'], ['produits', '🧴', 'Produits'], ['segments', '🎯', 'Segments'], ['automatisations', '⚡', 'Automatisations'], ['reporting', '📈', 'Reporting']];
  const TITLES = { dashboard: 'Dashboard', clients: 'Clients', commandes: 'Commandes', produits: 'Produits', segments: 'Segments', automatisations: 'Automatisations', reporting: 'Reporting' };

  function gate() {
    $('#root').innerHTML = `<div class="gate"><form id="gateForm"><div class="logo">glowmie.</div><p class="muted" style="margin-top:0;font-weight:800;letter-spacing:.1em;font-size:.75rem">CRM · ESPACE ADMINISTRATEUR</p>
      <div class="field"><label for="code">Code d'accès administrateur</label><input id="code" type="password" autocomplete="off" required></div>
      <p class="muted" style="font-size:.82rem">Démo : le code est indiqué dans le README. En production, l'accès passe par Supabase Auth avec un rôle <code>admin</code> vérifié côté serveur (RLS).</p>
      <p id="gErr" style="color:var(--bad);font-weight:700"></p><button class="btn">Entrer</button> <a href="index.html" style="margin-left:10px;font-weight:700">← Boutique</a></form></div>`;
    $('#gateForm').onsubmit = (e) => { e.preventDefault(); try { DB.adminLogin($('#code').value); render(); } catch (err) { $('#gErr').textContent = err.message; } };
  }

  function render() {
    if (!DB.isAdmin()) return gate();
    const h = location.hash.replace(/^#\/?/, '').split('/')[0];
    state.page = TITLES[h] ? h : 'dashboard';
    const badge = { commandes: DB.orders().filter((o) => o.status === 'payee').length, produits: DB.raw.reviews.filter((r) => r.status === 'en_attente').length };
    const scrollY = window.scrollY;
    const showPeriod = ['dashboard', 'reporting'].includes(state.page);
    $('#root').innerHTML = `<div class="mobile-top"><button id="menuBtn" aria-label="Menu">☰</button><b>glowmie. CRM</b><span></span></div>
      <div class="app"><aside class="side" id="side"><div class="logo">glowmie.<small>CRM</small></div>
        <nav aria-label="CRM">${NAV.map(([k, i, l]) => `<a href="#/${k}" class="${state.page === k ? 'on' : ''}" ${state.page === k ? 'aria-current="page"' : ''}><span aria-hidden="true">${i}</span>${l}${badge[k] ? `<span class="n">${badge[k]}</span>` : ''}</a>`).join('')}</nav>
        <div class="foot"><a href="index.html" target="_blank">↗ Voir la boutique</a><button id="resetBtn">↺ Réinitialiser la démo</button><button id="logoutBtn">⎋ Déconnexion</button></div></aside>
      <main class="main"><div class="top"><h1>${TITLES[state.page]}</h1><div class="tools">${showPeriod ? `<label class="sr-only" for="period">Période</label><select id="period">${[[7, '7 derniers jours'], [30, '30 derniers jours'], [90, '90 derniers jours'], [180, '6 derniers mois']].map(([v, l]) => `<option value="${v}" ${state.days === v ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}<span class="muted" style="font-size:.82rem">● Données en direct · ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span></div></div>
      <div id="page">${pages[state.page]()}</div></main></div>`;
    window.scrollTo(0, scrollY);
    bind();
  }

  function bind() {
    const per = $('#period'); if (per) per.onchange = () => { state.days = +per.value; render(); };
    $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
    $('#logoutBtn').onclick = () => { DB.adminLogout(); location.hash = ''; render(); };
    $('#resetBtn').onclick = () => { if (confirm('Réinitialiser toutes les données de démonstration (boutique + CRM) ?')) { DB.reset(); DB.adminLogin('glowmie-admin'); toast('Données réinitialisées'); render(); } };
    const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };
    on('#cq', 'input', (e) => { state.clientQ = e.target.value; rerenderPage('#cq'); });
    on('#cseg', 'change', (e) => { state.clientSeg = e.target.value; render(); });
    on('#oq', 'input', (e) => { state.orderQ = e.target.value; rerenderPage('#oq'); });
    on('#ost', 'change', (e) => { state.orderStatus = e.target.value; render(); });
    on('#logF', 'change', (e) => { state.logFilter = e.target.value; render(); });
    on('#newProd', 'click', () => productSheet(null));
    on('#runNow', 'click', () => { const n = DB.runScheduled(0); toast(n + ' email(s) envoyé(s)'); });
    on('#run7', 'click', () => { const n = DB.runScheduled(7); toast(n + ' email(s) envoyé(s) (simulation +7 j)'); });
    on('#run45', 'click', () => { const n = DB.runScheduled(45); toast(n + ' email(s) envoyé(s) (simulation +45 j)'); });
    on('#cExport', 'click', () => download('clients-glowmie.csv', csv([['Prénom', 'Nom', 'Email', 'Ville', 'Segment', 'Commandes', 'CA', 'Points', 'Newsletter']].concat(DB.customers().filter((c) => !c.deleted).map((c) => { const s = DB.clientStats(c); return [c.firstName, c.lastName, c.email, c.city, SEG[DB.segmentOf(c)][0], s.count, s.spent, c.points, c.consent.newsletter ? 'oui' : 'non']; }))), 'text/csv'));
    on('#oExport', 'click', () => download('commandes-glowmie.csv', csv([['Numéro', 'Date', 'Client', 'Statut', 'Total', 'Promo']].concat(DB.orders().map((o) => [o.number, new Date(o.createdAt).toISOString(), name(DB.customer(o.customerId)), STATUS[o.status], o.total, o.promo || '']))), 'text/csv'));
    on('#segExport', 'click', () => download(`segment-${state.seg}.csv`, csv([['Prénom', 'Nom', 'Email', 'Newsletter']].concat(DB.customers().filter((c) => !c.deleted && DB.segmentOf(c) === state.seg).map((c) => [c.firstName, c.lastName, c.email, c.consent.newsletter ? 'oui' : 'non']))), 'text/csv'));
    on('#repExport', 'click', () => { const r = range(); download('ventes-par-produit.csv', csv([['Produit', 'Commandes', 'Quantité', 'CA']].concat(salesByProduct(r.from, r.to).map((x) => [x.p.name, x.orders, x.qty, x.ca.toFixed(2)]))), 'text/csv'); });
  }
  function rerenderPage(focusSel) {
    const pos = $(focusSel).selectionStart;
    $('#page').innerHTML = pages[state.page](); bind();
    const f = $(focusSel); f.focus(); f.setSelectionRange(pos, pos);
  }

  /* panneau latéral */
  let sheetEl = null;
  function sheet(html) {
    if (!sheetEl) {
      const bg = document.createElement('div'); bg.className = 'panel-bg'; bg.onclick = closeSheet;
      sheetEl = document.createElement('aside'); sheetEl.className = 'sheet'; sheetEl.setAttribute('role', 'dialog'); sheetEl.setAttribute('aria-modal', 'true');
      document.body.append(bg, sheetEl); sheetEl._bg = bg;
    }
    sheetEl.innerHTML = html; sheetEl.scrollTop = 0;
    $('[data-close]', sheetEl).onclick = closeSheet;
    $('[data-close]', sheetEl).focus();
  }
  function closeSheet() { if (!sheetEl) return; sheetEl._bg.remove(); sheetEl.remove(); sheetEl = null; render(); }

  /* délégation des clics */
  document.addEventListener('click', (e) => {
    const cl = e.target.closest('[data-client]'); const or = e.target.closest('[data-order]'); const pr = e.target.closest('[data-prod]');
    const sg = e.target.closest('[data-seg]'); const rv = e.target.closest('[data-rev]');
    if (e.target.closest('.switch')) return;
    if (or) { e.preventDefault(); orderSheet(or.dataset.order); return; }
    if (cl && cl.dataset.client) { e.preventDefault(); clientSheet(cl.dataset.client); return; }
    if (pr) { productSheet(pr.dataset.prod); return; }
    if (sg) { state.seg = sg.dataset.seg; render(); return; }
    if (rv) { DB.moderateReview(rv.dataset.rev, rv.dataset.to); toast(rv.dataset.to === 'publie' ? 'Avis publié' : 'Avis refusé'); render(); }
    if (!e.target.closest('#side, #menuBtn')) { const s = $('#side'); if (s) s.classList.remove('open'); }
  });
  document.addEventListener('change', (e) => {
    const a = e.target.closest('[data-auto]'); const p = e.target.closest('[data-active]');
    if (a) { const au = DB.raw.automations.find((x) => x.id === a.dataset.auto); au.active = a.checked; DB.save(); toast(au.name + (a.checked ? ' activé' : ' désactivé')); }
    if (p) { const pr = DB.product(p.dataset.active); pr.active = p.checked; DB.saveProduct(pr); toast(pr.name + (p.checked ? ' en ligne' : ' hors ligne')); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-seg]')) { e.preventDefault(); e.target.click(); }
  });
  /* infobulles des graphiques */
  const tip = $('#tip');
  document.addEventListener('mousemove', (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { tip.style.display = 'none'; return; }
    tip.textContent = t.dataset.tip; tip.style.display = 'block';
    tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + 'px'; tip.style.top = (e.clientY - 36) + 'px';
  });

  // synchronisation temps réel avec la boutique (autre onglet)
  DB.onChange(() => { if (!sheetEl && document.activeElement && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) render(); });
  window.addEventListener('hashchange', () => { closeSheet(); render(); window.scrollTo(0, 0); });
  render();
})();
