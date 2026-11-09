/* GLOWMIE — packshots studio (SVG, rendu soft-touch réaliste) + photos lifestyle */
window.GlowArt = (function () {
  let n = 0;
  function shade(hex, amt) {
    const h = hex.replace('#', '');
    const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * (amt > 0 ? 255 - v : v))));
    const r = f(num >> 16), g = f((num >> 8) & 255), b = f(num & 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* éclairage studio : volume horizontal + lumière zénithale + reflets flous */
  function defs(id, c, alt) {
    const lit = (gid, col) => `<linearGradient id="${gid}" x1="0" x2="1"><stop offset="0" stop-color="${shade(col, -0.16)}"/><stop offset=".14" stop-color="${shade(col, 0.22)}"/><stop offset=".32" stop-color="${shade(col, 0.1)}"/><stop offset=".72" stop-color="${col}"/><stop offset=".93" stop-color="${shade(col, -0.1)}"/><stop offset="1" stop-color="${shade(col, -0.2)}"/></linearGradient>`;
    return `<defs>${lit(id + 'b', c)}${lit(id + 'c', alt || c)}
      <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient>
      <filter id="${id}s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${id}h" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`;
  }
  const shadow = (id, cx, w) => `<ellipse cx="${cx}" cy="226" rx="${w}" ry="7" fill="#3d1430" opacity=".22" filter="url(#${id}s)"/><ellipse cx="${cx}" cy="224" rx="${w * 0.8}" ry="2.5" fill="#3d1430" opacity=".18" filter="url(#${id}h)"/>`;
  const shine = (id, x, y, w, h, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="#fff" opacity="${o || 0.55}" filter="url(#${id}h)"/>`;
  const T = (x, y, txt, size, color, weight, ls, extra) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${['brand', 'mark', 'title'].includes(weight) ? 'Fredoka, Nunito, sans-serif' : 'Nunito, Helvetica, Arial, sans-serif'}" font-weight="${({ brand: 600, mark: 700, title: 600 })[weight] || weight || 800}" font-size="${size}" letter-spacing="${ls || 0}" fill="${color}" ${extra || ''}>${txt}</text>`;
  const up = (s) => String(s).toUpperCase();
  const vol = (p) => (p.variants && p.variants[0] ? p.variants[0].label : '');

  /* logo packaging : GLOWMIE + étincelle ✦ */
  const sparkle = (x, y, s, c) => `<path transform="translate(${x} ${y})" d="M0 ${-s}Q${s * 0.12} ${-s * 0.12} ${s} 0Q${s * 0.12} ${s * 0.12} 0 ${s}Q${-s * 0.12} ${s * 0.12} ${-s} 0Q${-s * 0.12} ${-s * 0.12} 0 ${-s}Z" fill="${c}"/>`;
  function wordmark(x, y, size, c) {
    const half = size * 2.55;
    return `${T(x, y, 'GLOWMIE', size, c, 'mark', 0.3)}${sparkle(x + half + size * 0.05, y - size * 0.95, size * 0.32, c)}${sparkle(x + half - size * 0.32, y - size * 0.62, size * 0.16, c)}`;
  }
  const pk = (p) => p.pack || { sub: p.tagline, claim: '' };
  /* bloc d'étiquette commun : logo, nom, sous-titre, actifs, contenance */
  function labelBlock(p, cx, y, scale, c) {
    const s = scale || 1, k = pk(p), subs = String(k.sub).split('|');
    let yy = y + 27 * s, out = wordmark(cx, y, 15 * s, c) + T(cx, yy, p.name, 13.5 * s, c, 'title');
    subs.forEach((l) => { yy += 10.5 * s; out += T(cx, yy, l, 7.6 * s, c, 700); });
    if (k.badge) { yy += 15 * s; const bw = k.badge.length * 3.15 * s + 12 * s; out += `<rect x="${cx - bw / 2}" y="${yy - 7.5 * s}" width="${bw}" height="${10.5 * s}" rx="${5.25 * s}" fill="none" stroke="${c}" stroke-width="${0.7 * s}"/>` + T(cx, yy + 0.4 * s, k.badge, 5.4 * s, c, 700); }
    (k.claim ? k.claim.split('|') : []).forEach((l, i) => { yy += (i ? 7.5 : 13) * s; out += T(cx, yy, l, 5.6 * s, c, 600, 0, 'opacity=".9"'); });
    return out;
  }
  const volume = (p, cx, y, s, c) => T(cx, y, vol(p).toLowerCase() + '  ℮' + (p.pack && p.pack.oz ? '  ' + p.pack.oz : ''), 6 * (s || 1), c, 600, 0.3, 'opacity=".85"');

  /* tube souple, capsule à clapet en bas (Fresh Start, Sun Sunny) */
  function tube(p, id) {
    return `${defs(id, p.body, p.cap)}${shadow(id, 100, 46)}
      <path d="M44 22h112l-9 150c-.4 6-3 9-8 9H61c-5 0-7.6-3-8-9z" fill="url(#${id}b)"/>
      <path d="M44 22h112l-9 150c-.4 6-3 9-8 9H61c-5 0-7.6-3-8-9z" fill="url(#${id}t)"/>
      <rect x="42" y="12" width="116" height="15" rx="2" fill="${shade(p.body, -0.08)}"/>
      ${Array.from({ length: 28 }, (_, i) => `<rect x="${45 + i * 4}" y="13.5" width="1.2" height="12" fill="#000" opacity=".07"/>`).join('')}
      <path d="M60 180h80v34c0 6-4 10-10 10H70c-6 0-10-4-10-10z" fill="url(#${id}c)"/>
      <rect x="60" y="180" width="80" height="5" fill="#000" opacity=".06"/>
      <rect x="86" y="196" width="28" height="18" rx="6" fill="#000" opacity=".06"/>
      ${shine(id, 58, 34, 5, 128, 0.5)}
      ${labelBlock(p, 100, 66, 1, p.ink)}${volume(p, 100, 170, 1, p.ink)}`;
  }
  /* flacon sérum en verre teinté + grand bouchon (Glow Drops, Tone & Glow) */
  function serum(p, id) {     // flacon compte-gouttes en verre rose
    return `${defs(id, p.body, p.cap)}${shadow(id, 100, 46)}
      <rect x="84" y="12" width="32" height="54" rx="16" fill="url(#${id}c)"/><rect x="84" y="12" width="32" height="54" rx="16" fill="url(#${id}t)"/>${shine(id, 90, 20, 4, 36, 0.6)}
      <rect x="72" y="58" width="56" height="44" rx="5" fill="url(#${id}c)"/><rect x="72" y="58" width="56" height="44" rx="5" fill="url(#${id}t)"/>${shine(id, 77, 62, 4, 34, 0.55)}
      <path d="M58 112c0-6 4-10 10-10h64c6 0 10 4 10 10v102c0 6-4 10-10 10H68c-6 0-10-4-10-10z" fill="url(#${id}b)" opacity=".9"/>
      <path d="M58 112c0-6 4-10 10-10h64c6 0 10 4 10 10v102c0 6-4 10-10 10H68c-6 0-10-4-10-10z" fill="url(#${id}t)"/>
      <path d="M60 210h80v4c0 6-4 9-9 9H69c-5 0-9-3-9-9z" fill="#fff" opacity=".35"/>
      ${shine(id, 63, 108, 5, 100, 0.65)}${shine(id, 134, 112, 2.5, 90, 0.35)}
      ${labelBlock(p, 100, 138, 0.86, p.ink)}${volume(p, 100, 210, 0.9, p.ink)}`;
  }
  /* pot rond avec couvercle (Daily Cloud, Melt In) */
  function jar(p, id) {
    return `${defs(id, p.body, p.cap)}${shadow(id, 100, 74)}
      <path d="M30 110h140v92c0 12-10 20-22 20H52c-12 0-22-8-22-20z" fill="url(#${id}b)"/>
      <path d="M30 110h140v92c0 12-10 20-22 20H52c-12 0-22-8-22-20z" fill="url(#${id}t)"/>
      <path d="M26 74c0-10 8-16 18-16h112c10 0 18 6 18 16v38H26z" fill="url(#${id}c)"/>
      <path d="M26 74c0-10 8-16 18-16h112c10 0 18 6 18 16v38H26z" fill="url(#${id}t)"/>
      <ellipse cx="100" cy="64" rx="66" ry="6" fill="#fff" opacity=".35" filter="url(#${id}h)"/>
      <rect x="26" y="110" width="148" height="2.2" fill="${shade(p.cap, -0.25)}" opacity=".6"/>
      ${shine(id, 36, 68, 6, 40, 0.5)}${shine(id, 38, 118, 6, 90, 0.4)}
      ${labelBlock(p, 100, 134, 0.86, p.ink)}${volume(p, 100, 213, 0.95, p.ink)}`;
  }
  /* flacon haut (lotion) */
  function tall(p, id) {
    return `${defs(id, p.body, p.cap)}${shadow(id, 100, 44)}
      <rect x="76" y="14" width="48" height="44" rx="8" fill="url(#${id}c)"/>${shine(id, 81, 20, 4, 32, 0.6)}
      <path d="M60 74c0-10 8-18 18-18h44c10 0 18 8 18 18v138c0 7-5 12-12 12H72c-7 0-12-5-12-12z" fill="url(#${id}b)" opacity=".94"/>
      <path d="M60 74c0-10 8-18 18-18h44c10 0 18 8 18 18v138c0 7-5 12-12 12H72c-7 0-12-5-12-12z" fill="url(#${id}t)"/>
      ${shine(id, 66, 70, 5, 140, 0.6)}
      ${labelBlock(p, 100, 116, 0.8, p.ink)}${volume(p, 100, 206, 0.9, p.ink)}`;
  }
  /* gloss / baume lèvres (Dew Me) */
  function gloss(p, id) {
    return `${defs(id, p.body, p.cap)}${shadow(id, 100, 26)}
      <rect x="80" y="16" width="40" height="128" rx="7" fill="url(#${id}c)"/><rect x="80" y="16" width="40" height="128" rx="7" fill="url(#${id}t)"/>
      ${shine(id, 85, 22, 4, 112, 0.6)}
      <rect x="82" y="142" width="36" height="82" rx="6" fill="#fff" opacity=".45"/>
      <rect x="86" y="146" width="28" height="72" rx="5" fill="url(#${id}b)" opacity=".9"/>
      ${shine(id, 88, 148, 3, 64, 0.7)}
      <g transform="rotate(-90 100 80)">${T(100, 86, 'GLOWMIE', 17, '#fff', 'mark', 0.3)}${sparkle(146, 67, 5, '#fff')}</g>`;
  }
  /* coffret : les trois essentiels */
  function set(p, id) {
    const P = (pid) => window.GlowDB && window.GlowDB.product(pid);
    const mini = (fn, pid, tx, ty, s) => { const q = P(pid); return q ? `<g transform="translate(${tx} ${ty}) scale(${s})">${fn(q, id + pid.slice(0, 3))}</g>` : ''; };
    return `${defs(id, p.body, p.cap)}
      ${mini(tube, 'fresh-start', -4, 22, 0.62)}${mini(serum, 'glow-drops', 58, 36, 0.56)}${mini(jar, 'daily-cloud', 92, 84, 0.56)}`;
  }
  const shapes = { tube, serum, dropper: serum, jar, tall, bottle: tall, gloss, stick: gloss, set };

  function product(p, cls) {
    const id = 'ga' + (n++);
    if (p.packshot) {   // vrai packshot photo, avec repli sur le dessin si le fichier est absent
      const fb = `<svg class="${cls || 'pack'}" viewBox="0 0 200 240" role="img" aria-label="${p.name}" xmlns="http://www.w3.org/2000/svg">${(shapes[p.shape] || tube)(p, id)}</svg>`;
      return `<img class="${cls || 'pack'} pack-img${p.packshotFull ? ' pack-full' : ''}" src="${p.packshot}" alt="${p.name} — ${p.tagline}" onerror="this.outerHTML=this.dataset.fb" data-fb="${fb.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
    }
    return `<svg class="${cls || 'pack'}" viewBox="0 0 200 240" role="img" aria-label="${p.name} — ${p.tagline}" xmlns="http://www.w3.org/2000/svg">${(shapes[p.shape] || tube)(p, id)}</svg>`;
  }

  /* photos : visuels de marque locaux (assets/) + lifestyle Unsplash (licence libre) */
  const PH = () => window.GLOW_SEED.photos || {};   // visuels statiques : toujours lus depuis le code
  function src(key, w, h) {
    const ph = PH()[key]; if (!ph) return '';
    if (ph.src) return ph.src;
    return `https://images.unsplash.com/photo-${ph.id}?auto=format&fit=crop&q=72&w=${w}${h ? '&h=' + h : ''}`;
  }
  function photo(key, opts) {
    const o = opts || {}; const ph = PH()[key]; if (!ph) return '';
    const w = o.w || 800;
    if (ph.src) return `<img class="${o.cls || 'photo'}" src="${ph.src}" alt="${ph.alt}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"${ph.pos ? ` style="object-position:${ph.pos}"` : ''}>`;
    return `<img class="${o.cls || 'photo'}" src="${src(key, w, o.h)}" srcset="${src(key, Math.round(w / 2), o.h ? Math.round(o.h / 2) : 0)} ${Math.round(w / 2)}w, ${src(key, w, o.h)} ${w}w, ${src(key, w * 2, o.h ? o.h * 2 : 0)} ${w * 2}w" sizes="${o.sizes || '(max-width: 760px) 100vw, 50vw'}" alt="${ph.alt}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async">`;
  }
  return { product, shade, photo, src };
})();
