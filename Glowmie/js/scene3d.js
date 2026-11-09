/* GLOWMIE — scènes 3D (Three.js r128) : hero et visionneuse produit */
window.GlowScene = (function () {
  const hasGL = (function () { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } })();
  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
  const supported = () => hasGL && !!window.THREE;

  /* ---------- matériaux ---------- */
  function glossy(color, opts) {
    return new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0 }, opts || {}));
  }
  const gold = () => new THREE.MeshStandardMaterial({ color: 0xF2C94C, metalness: 0.85, roughness: 0.22, emissive: 0x3a2a00, emissiveIntensity: 0.15 });

  /* matière soft-touch (plastique mat légèrement satiné), comme les packagings de référence */
  function soft(color, opts) {
    return new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.45 }, opts || {}));
  }

  /* étiquette imprimée : canvas → texture (horizontale ou verticale) */
  /* étiquette imprimée façon packaging Glowmie : GLOWMIE ✦, nom, type de soin, actifs, contenance */
  function labelTexture(p, mode) {
    const vertical = mode === 'vertical';
    const c = document.createElement('canvas'); c.width = vertical ? 384 : 1024; c.height = vertical ? 1024 : 1024;
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
    const star = (g, x, y, s) => { g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x + s * 0.12, y - s * 0.12, x + s, y); g.quadraticCurveTo(x + s * 0.12, y + s * 0.12, x, y + s); g.quadraticCurveTo(x - s * 0.12, y + s * 0.12, x - s, y); g.quadraticCurveTo(x - s * 0.12, y - s * 0.12, x, y - s); g.fill(); };
    const mark = (g, x, y, size) => {
      g.font = `700 ${size}px Fredoka, Nunito, sans-serif`; g.fillText('GLOWMIE', x, y);
      const w = g.measureText('GLOWMIE').width;
      star(g, x + w / 2 + size * 0.26, y - size * 0.66, size * 0.26); star(g, x + w / 2 + size * 0.02, y - size * 0.4, size * 0.13);
    };
    const draw = () => {
      const g = c.getContext('2d');
      g.clearRect(0, 0, c.width, c.height);
      g.fillStyle = p.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (vertical) {
        g.save(); g.translate(c.width / 2, c.height / 2); g.rotate(-Math.PI / 2); mark(g, 0, 0, 150); g.restore();
      } else {
        const k = p.pack || { sub: p.tagline, claim: '' }; const cx = c.width / 2;
        mark(g, cx, 150, 140);
        g.font = '600 112px Fredoka, Nunito, sans-serif'; g.fillText(p.name, cx, 350);
        g.font = '600 64px Nunito, sans-serif'; k.sub.split('|').forEach((l, i) => g.fillText(l, cx, 455 + i * 72));
        if (k.badge) {
          g.font = '600 46px Nunito, sans-serif'; const bw = g.measureText(k.badge).width + 70, by = 650;
          g.lineWidth = 5; g.strokeStyle = p.ink; g.beginPath(); const r = 42, x0 = cx - bw / 2;
          g.moveTo(x0 + r, by - r); g.lineTo(x0 + bw - r, by - r); g.arc(x0 + bw - r, by, r, -Math.PI / 2, Math.PI / 2); g.lineTo(x0 + r, by + r); g.arc(x0 + r, by, r, Math.PI / 2, -Math.PI / 2); g.stroke();
          g.fillText(k.badge, cx, by + 2);
        }
        g.globalAlpha = 0.9; g.font = '600 46px Nunito, sans-serif';
        (k.claim || '').split('|').filter(Boolean).forEach((l, i) => g.fillText(l, cx, 775 + i * 58));
        g.font = '600 48px Nunito, sans-serif';
        g.fillText(((p.variants && p.variants[0]) ? p.variants[0].label.toLowerCase() : '') + '  ℮' + (p.pack && p.pack.oz ? '  ' + p.pack.oz : ''), cx, 950);
      }
      g.globalAlpha = 1; tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    return tex;
  }
  function decal(p, w, h, mode) {
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: labelTexture(p, mode), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  }
  function lathe(points, mat, seg) {
    return new THREE.Mesh(new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), seg || 64), mat);
  }
  /* pavé aux coins arrondis (extrusion verticale d'un carré arrondi, arêtes biseautées) */
  function rbox(w, h, d, r, mat, bevel) {
    const b = Math.max(0.001, bevel == null ? Math.min(r * 0.5, h * 0.22) : bevel);
    const geo = new THREE.BoxGeometry(w, h, d, 20, 12, 20);
    const pos = geo.attributes.position, nor = geo.attributes.normal;
    const hx = w / 2 - r, hy = h / 2 - b, hz = d / 2 - r;
    const v = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const cx = Math.max(-hx, Math.min(hx, v.x)), cy = Math.max(-hy, Math.min(hy, v.y)), cz = Math.max(-hz, Math.min(hz, v.z));
      n.set((v.x - cx) / r, (v.y - cy) / b, (v.z - cz) / r);
      if (n.lengthSq() < 1e-9) n.set(0, 0, 0); else n.normalize();
      pos.setXYZ(i, cx + n.x * r, cy + n.y * b + h / 2, cz + n.z * r);
      const nn = new THREE.Vector3(n.x / r, n.y / b, n.z / r).normalize();
      nor.setXYZ(i, nn.x, nn.y, nn.z);
    }
    pos.needsUpdate = true; nor.needsUpdate = true;
    return new THREE.Mesh(geo, mat);   // base à y = 0, sommet à y = h
  }
  const seam = (w, d, y, color) => { const m = rbox(w + 0.02, 0.025, d + 0.02, 0.3, new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.72), roughness: 0.8 }), 0); m.position.y = y; return m; };
  const wrapUp = (g, y) => { g.position.y = y; const w = new THREE.Group(); w.add(g); return w; };

  /* ---------- modèles ---------- */
  function glass(color, opts) {       // verre teinté brillant
    return new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.86 }, opts || {}));
  }
  function jar(p) {           // pot rond + couvercle (Daily Cloud, Melt In)
    const g = new THREE.Group();
    const body = lathe([[0, 0], [1.42, 0], [1.52, 0.1], [1.55, 0.3], [1.55, 1.45], [0, 1.45]], soft(p.body));
    const lid = lathe([[0, 1.47], [1.6, 1.47], [1.62, 1.55], [1.62, 2.15], [1.56, 2.27], [1.4, 2.32], [0, 2.32]], soft(p.cap, { roughness: 0.35, clearcoat: 0.6 }));
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(1.565, 1.565, 1.3, 64, 1, true, -0.75, 1.5), new THREE.MeshBasicMaterial({ map: labelTexture(p), transparent: true, depthWrite: false }));
    lab.position.y = 0.75;
    g.add(body, lid, lab);
    return wrapUp(g, -1.1);
  }
  function tall(p) {          // flacon lotion en verre teinté
    const g = new THREE.Group();
    const body = rbox(1.6, 2.9, 1.05, 0.38, glass(p.body), 0.3);
    const cap = rbox(0.8, 0.9, 0.8, 0.12, soft(p.cap, { roughness: 0.3, clearcoat: 0.8 }), 0.06); cap.position.y = 2.92;
    const lab = decal(p, 1.4, 1.4, 'pack'); lab.position.set(0, 1.35, 0.535);
    g.add(body, cap, lab);
    return wrapUp(g, -1.9);
  }
  function serum(p) {         // flacon compte-gouttes en verre rose (Glow Drops)
    const g = new THREE.Group();
    const body = lathe([[0, 0], [0.9, 0], [0.98, 0.06], [1, 0.2], [1, 2.15], [0.96, 2.3], [0.6, 2.36], [0, 2.36]], glass(p.body));
    const base = lathe([[0, 0.02], [0.92, 0.02], [0.95, 0.3], [0, 0.3]], glass(new THREE.Color(p.body).multiplyScalar(0.9), { opacity: 0.95 }));
    const collar = lathe([[0, 0], [0.6, 0], [0.62, 0.05], [0.62, 0.8], [0.58, 0.86], [0, 0.86]], soft(p.cap, { roughness: 0.3, clearcoat: 0.8 })); collar.position.y = 2.32;
    const bulb = lathe([[0, 0], [0.36, 0], [0.37, 0.6], [0.34, 0.85], [0.22, 1.02], [0, 1.07]], soft(p.cap, { roughness: 0.35, clearcoat: 0.6 })); bulb.position.y = 3.15;
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(1.012, 1.012, 1.7, 64, 1, true, -0.85, 1.7), new THREE.MeshBasicMaterial({ map: labelTexture(p), transparent: true, depthWrite: false }));
    lab.position.y = 1.15;
    g.add(body, base, collar, bulb, lab);
    return wrapUp(g, -2.05);
  }
  function tube(p) {          // tube souple + capsule à clapet (Fresh Start, Sun Sunny)
    const g = new THREE.Group();
    const geo = new THREE.CylinderGeometry(0.95, 0.75, 3, 48, 24);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + 1.5) / 3;
      pos.setZ(i, pos.getZ(i) * (1 - Math.pow(t, 2.2) * 0.92));
      pos.setX(i, pos.getX(i) * (1 + Math.pow(t, 3) * 0.14));
    }
    geo.computeVertexNormals();
    const body = new THREE.Mesh(geo, soft(p.body, { roughness: 0.4, clearcoat: 0.5 }));
    const crimp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 0.12), soft(new THREE.Color(p.body).multiplyScalar(0.92)));
    crimp.position.y = 1.56;
    const cap = rbox(1.5, 0.75, 1.15, 0.4, soft(p.cap, { roughness: 0.35, clearcoat: 0.6 }), 0.12); cap.position.y = -2.25;
    const lab = decal(p, 1.55, 1.55, 'pack'); lab.position.set(0, -0.05, 0.78);
    g.add(body, crimp, cap, lab);
    return wrapUp(g, 0.45);
  }
  function gloss(p) {         // gloss : long bouchon rose + base transparente
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.5, 48), glass(0xffffff, { opacity: 0.35 }));
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 1.3, 40), glass(p.body, { opacity: 0.9 }));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 2.6, 48), soft(p.cap, { roughness: 0.2, clearcoat: 1 })); cap.position.y = 2.05;
    const lab = decal(p, 0.55, 1.5, 'vertical'); lab.position.set(0, 2.05, 0.445);
    g.add(base, liquid, cap, lab);
    return wrapUp(g, -1.2);
  }
  function set(p) {
    const P = window.GlowDB ? window.GlowDB.product : () => null;
    const g = new THREE.Group();
    const a = build(P('fresh-start') || p); a.scale.setScalar(0.62); a.position.set(-1.6, 0.1, -0.3); a.rotation.y = 0.3;
    const b = build(P('glow-drops') || p); b.scale.setScalar(0.68); b.position.set(0, 0.25, 0.2);
    const c = build(P('daily-cloud') || p); c.scale.setScalar(0.62); c.position.set(1.6, -0.5, 0); c.rotation.y = -0.3;
    g.add(a, b, c); return g;
  }

  /* ---------- vrai produit en 3D à partir du packshot photo ----------
     La silhouette est mesurée ligne par ligne sur le PNG détouré → volume de révolution
     (aplati pour un tube), puis la photo est projetée sur la face avant. Le dos et les côtés
     reprennent les couleurs réelles du bord du produit (pas d'étiquette inversée). */
  const photoCache = {};
  function loadPhoto(src) {
    return photoCache[src] || (photoCache[src] = new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }));
  }
  function photoMesh(im, p) {
    const W = im.width, H = im.height;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;
    const rows = new Array(H); let top = -1, bottom = -1;
    for (let y = 0; y < H; y++) {
      let l = -1, r = -1;
      for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] >= 200) { if (l < 0) l = x; r = x; }
      if (l >= 0) { rows[y] = { c: (l + r) / 2, hw: (r - l) / 2 }; if (top < 0) top = y; bottom = y; }
    }
    // lisse les lignes vides éventuelles
    for (let y = top; y <= bottom; y++) if (!rows[y]) rows[y] = rows[y - 1];
    // pied du produit : on ignore le reflet du sol (largeur plafonnée à celle du corps juste au-dessus)
    const foot = Math.round((bottom - top) * 0.07);
    let ref = 0; for (let y = bottom - foot - 30; y < bottom - foot; y++) if (rows[y]) ref = Math.max(ref, rows[y].hw);
    for (let y = bottom - foot; y <= bottom; y++) if (rows[y].hw > ref * 1.02) rows[y] = { c: rows[y].c, hw: ref * 1.02 };
    const hPx = bottom - top, upp = (p.shape === 'jar' ? 3.2 : 4) / Math.max(hPx, W * 1.05), height = hPx * upp;
    // atlas : moitié gauche = photo (face avant), moitié droite = dos sans étiquette
    //   (dégradé ligne par ligne entre les vraies couleurs des bords gauche et droit)
    const atlas = document.createElement('canvas'); atlas.width = W * 2; atlas.height = H;
    const ag = atlas.getContext('2d'); ag.drawImage(c, 0, 0);
    const avg = (y, x0, x1) => { let r = 0, gg = 0, b = 0, n = 0; for (let x = Math.round(x0); x <= Math.round(x1); x++) { const i = (y * W + x) * 4; if (d[i + 3] < 200) continue; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; } return n ? [r / n, gg / n, b / n] : null; };
    for (let y = top; y <= bottom; y++) {
      const rw = rows[y]; const L = avg(y, rw.c - rw.hw * 0.95, rw.c - rw.hw * 0.82) || [255, 220, 230]; const R = avg(y, rw.c + rw.hw * 0.82, rw.c + rw.hw * 0.95) || L;
      const gr = ag.createLinearGradient(W + rw.c - rw.hw, 0, W + rw.c + rw.hw, 0);
      const col = (a) => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`; const mid = [(L[0] + R[0]) / 2 * 1.03, (L[1] + R[1]) / 2 * 1.03, (L[2] + R[2]) / 2 * 1.03].map((v) => Math.min(255, v));
      gr.addColorStop(0, col(L)); gr.addColorStop(0.5, col(mid)); gr.addColorStop(1, col(R));
      ag.fillStyle = gr; ag.fillRect(W + rw.c - rw.hw - 2, y, rw.hw * 2 + 4, 1);
    }
    const step = Math.max(1, Math.round(hPx / 180));
    const pts = [new THREE.Vector2(0.0005, 0)];
    for (let y = bottom; y >= top; y -= step) pts.push(new THREE.Vector2(Math.max(0.0005, rows[y].hw * upp), (bottom - y) * upp));
    pts.push(new THREE.Vector2(0.0005, height));
    const geo = new THREE.LatheGeometry(pts, 96);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    const flat = p.shape === 'tube';
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const ry = Math.min(bottom, Math.max(top, Math.round(bottom - y / upp))), row = rows[ry];
      const px = x / upp;
      const u = (row.c + (z >= 0 ? px : -px) * 0.985) / (2 * W);   // dos = même face que l'avant (lisible vue de derrière)
      uv.setXY(i, u, 1 - ry / H);
      if (flat) {   // tube : section ovale qui s'aplatit vers la soudure du haut
        const t = y / height;
        pos.setZ(i, z * (t < 0.13 ? 0.78 : 0.68 * (1 - Math.pow((t - 0.13) / 0.87, 2.6) * 0.88)));
      }
    }
    pos.needsUpdate = true; uv.needsUpdate = true;
    geo.translate(0, -height / 2, 0);
    const tex = new THREE.CanvasTexture(atlas); tex.anisotropy = 8;
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }));
  }
  function realModel(p, fallback) {
    const wrap = new THREE.Group();
    loadPhoto(p.packshot)
      .then((im) => wrap.add(photoMesh(im, p)))
      .catch(() => wrap.add(fallback(p)))
      .then(() => window.dispatchEvent(new Event('glow3d-ready')));
    return wrap;
  }
  const builders = { serum, dropper: serum, tube, jar, tall, bottle: tall, gloss, stick: gloss, set };
  const build = (p) => (p.packshot ? realModel(p, builders[p.shape] || serum) : (builders[p.shape] || serum)(p));

  function heartGeo() {
    const s = new THREE.Shape();
    s.moveTo(0, 0.35); s.bezierCurveTo(0, 0.6, -0.55, 0.75, -0.6, 0.3); s.bezierCurveTo(-0.62, 0, -0.3, -0.25, 0, -0.55);
    s.bezierCurveTo(0.3, -0.25, 0.62, 0, 0.6, 0.3); s.bezierCurveTo(0.55, 0.75, 0, 0.6, 0, 0.35);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.14, bevelSegments: 6, curveSegments: 24 });
    g.center(); return g;
  }
  function starGeo() {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.26 : 0.6; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 5 });
    g.center(); return g;
  }

  function studio(scene) {      // éclairage neutre type packshot
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe4dfea, 0.62));
    const key = new THREE.DirectionalLight(0xffffff, 0.72); key.position.set(-4, 6, 7); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.28); fill.position.set(5, 1, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3); rim.position.set(0, 4, -6); scene.add(rim);
  }
  function lights(scene) {
    scene.add(new THREE.HemisphereLight(0xffffff, 0xF5A9CB, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.75); key.position.set(3, 5, 6); scene.add(key);
    const pink = new THREE.PointLight(0xff8fc8, 0.9, 30); pink.position.set(-6, 2, 4); scene.add(pink);
    const lilac = new THREE.PointLight(0xb69cff, 0.8, 30); lilac.position.set(6, -3, 3); scene.add(lilac);
    const rim = new THREE.DirectionalLight(0xfff1c4, 0.6); rim.position.set(-2, 3, -6); scene.add(rim);
  }

  function makeRenderer(container) {
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile(), alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.3 : 1.8));
    renderer.physicallyCorrectLights = false;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    return renderer;
  }

  /* boucle de rendu qui se met en pause hors écran / onglet caché */
  function loop(container, renderer, camera, scene, tick) {
    let visible = true, raf = 0, dead = false;
    let once = null;
    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight || 1;
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (once && window.GlowMotion.reduced()) once();
    };
    resize();
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(container);
    const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) start(); }, { threshold: 0 });
    io.observe(container);
    const clock = new THREE.Clock();
    function frame() {
      raf = 0;
      if (dead || !visible || document.hidden) return;
      tick(clock.getElapsedTime(), Math.min(clock.getDelta(), 0.05));
      renderer.render(scene, camera);
      if (!window.GlowMotion.reduced()) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && !dead) raf = requestAnimationFrame(frame); }
    once = () => { tick(clock.getElapsedTime(), 0); renderer.render(scene, camera); };
    document.addEventListener('visibilitychange', start);
    const ready = () => { start(); if (window.GlowMotion.reduced()) requestAnimationFrame(() => once && once()); };
    window.addEventListener('glow3d-ready', ready);
    start();
    return {
      start, renderOnce: () => { tick(clock.getElapsedTime(), 0); renderer.render(scene, camera); },
      destroy() { dead = true; cancelAnimationFrame(raf); io.disconnect(); if (ro) ro.disconnect(); document.removeEventListener('visibilitychange', start); window.removeEventListener('glow3d-ready', ready); renderer.dispose(); scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); renderer.domElement.remove(); }
    };
  }

  function dragRotate(el, state) {
    let down = false, lx = 0;
    el.addEventListener('pointerdown', (e) => { down = true; lx = e.clientX; state.dragging = true; el.style.cursor = 'grabbing'; });
    window.addEventListener('pointerup', () => { down = false; state.dragging = false; el.style.cursor = 'grab'; });
    window.addEventListener('pointermove', (e) => {
      state.mx = (e.clientX / window.innerWidth) * 2 - 1; state.my = (e.clientY / window.innerHeight) * 2 - 1;
      if (!down) return; state.vel = (e.clientX - lx) * 0.01; state.rot += state.vel; lx = e.clientX; state.loop && state.loop.start();
    });
    el.style.cursor = 'grab'; el.style.touchAction = 'pan-y';
  }

  /* ---------- hero ---------- */
  function hero(container, p) {
    if (!supported()) return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); camera.position.set(0, 0, 11);
    const renderer = makeRenderer(container); lights(scene);
    const bottleObj = build(p); bottleObj.scale.setScalar(isMobile() ? 0.95 : 1.15);
    scene.add(bottleObj);

    const floaters = []; const hg = heartGeo(), sg = starGeo(), bg = new THREE.SphereGeometry(0.5, 32, 24);
    const palette = [0xF5A9CB, 0xC9B5F2, 0xF9E49A, 0xff7eb6, 0xA72D70];
    const count = isMobile() ? 12 : 22;
    for (let i = 0; i < count; i++) {
      const kind = i % 3; let m;
      if (kind === 0) m = new THREE.Mesh(hg, glossy(palette[i % 4 === 3 ? 3 : i % 2], { roughness: 0.12 }));
      else if (kind === 1) m = new THREE.Mesh(sg, glossy(palette[(i + 1) % 3 + (i % 5 === 0 ? 0 : 0)], { roughness: 0.15 }));
      else m = new THREE.Mesh(bg, glossy(0xffffff, { transparent: true, opacity: 0.28, roughness: 0, clearcoat: 1 }));
      const ang = (i / count) * Math.PI * 2;
      const rad = 3 + Math.random() * 3.2;
      m.position.set(Math.cos(ang) * rad * 1.3, Math.sin(ang) * rad * 0.8, -1.5 - Math.random() * 5 + (i % 4 === 0 ? 4 : 0));
      const s = kind === 2 ? 0.3 + Math.random() * 0.6 : 0.35 + Math.random() * 0.45; m.scale.setScalar(s);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      m.userData = { base: m.position.clone(), speed: 0.4 + Math.random() * 0.6, phase: Math.random() * 6, spin: (Math.random() - 0.5) * 0.8 };
      scene.add(m); floaters.push(m);
    }

    const state = { mx: 0, my: 0, rot: 0, vel: 0, scroll: 0, dragging: false };
    dragRotate(renderer.domElement, state);
    const l = loop(container, renderer, camera, scene, (t) => {
      const reduced = window.GlowMotion.reduced();
      if (!state.dragging) { state.vel *= 0.94; state.rot += state.vel + (reduced ? 0 : 0.004); }
      bottleObj.rotation.y = state.rot + state.scroll * Math.PI * 2;
      bottleObj.rotation.z = Math.sin(t * 0.8) * 0.05 + state.scroll * 0.25;
      bottleObj.rotation.x = state.my * 0.12;
      const wide = camera.aspect > 1.1;
      const s0 = wide ? 1.15 : 0.62; bottleObj.scale.setScalar(s0 * (1 - state.scroll * 0.12));
      bottleObj.position.y = Math.sin(t * 1.1) * 0.12 + (wide ? 0 : -0.3) - state.scroll * 0.4;
      bottleObj.position.x = wide ? 2.3 + state.scroll * 0.4 : 1.25 + state.scroll * 0.1;
      floaters.forEach((m) => {
        const u = m.userData;
        m.position.x = u.base.x + Math.sin(t * u.speed + u.phase) * 0.3 + state.mx * (0.4 + m.position.z * 0.05);
        m.position.y = u.base.y + Math.cos(t * u.speed * 0.8 + u.phase) * 0.35 - state.my * 0.3 + state.scroll * (u.base.z + 6) * 0.5;
        m.rotation.y += u.spin * 0.01; m.rotation.x += u.spin * 0.006;
      });
      camera.position.x += (state.mx * 0.5 - camera.position.x) * 0.05;
      camera.lookAt(0, 0, 0);
    });
    state.loop = l;
    return { setScroll(v) { state.scroll = v; l.start(); if (window.GlowMotion.reduced()) l.renderOnce(); }, destroy: l.destroy, renderOnce: l.renderOnce };
  }

  /* ---------- visionneuse produit 360° ---------- */
  function viewer(container, p) {
    if (!supported()) return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, 0.2, { set: 12, jar: 10, stick: 10.5 }[p.shape] || 11.5);
    const renderer = makeRenderer(container); studio(scene);
    const obj = build(p); scene.add(obj);
    const bubbles = [];
    for (let i = 0; i < 0; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.25, 24, 16), glossy(0xffffff, { transparent: true, opacity: 0.35 }));
      b.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, -1 - Math.random() * 2); b.userData.p = Math.random() * 6;
      scene.add(b); bubbles.push(b);
    }
    const state = { mx: 0, my: 0, rot: -0.4, vel: 0, dragging: false };
    dragRotate(renderer.domElement, state);
    const l = loop(container, renderer, camera, scene, (t) => {
      const reduced = window.GlowMotion.reduced();
      if (!state.dragging) { state.vel *= 0.93; state.rot += state.vel + (reduced ? 0 : 0.006); }
      obj.rotation.y = state.rot; obj.position.y = reduced ? 0 : Math.sin(t * 1.2) * 0.1;
      bubbles.forEach((b) => { b.position.y += reduced ? 0 : 0.006; if (b.position.y > 2.8) b.position.y = -2.8; b.position.x += Math.sin(t + b.userData.p) * 0.002; });
    });
    state.loop = l;
    return { destroy: l.destroy, spin(d) { state.vel = d; l.start(); if (window.GlowMotion.reduced()) { state.rot += d * 8; l.renderOnce(); } } };
  }

  return { supported, hero, viewer, build, glossy, heartGeo, starGeo };
})();
