/* GLOWMIE — scène 3D plein écran de la page d'accueil.
   Un seul canvas fixe, placé entre les couches de texte (z-index) : les produits passent
   devant les typographies « pleines » et derrière les typographies « contour ».
   Chaque section [data-scene] pilote les objets selon sa progression de scroll. */
window.GlowStage = (function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  function create(host) {
    if (!window.GlowScene || !GlowScene.supported()) return null;
    const DB = window.GlowDB;
    const mobile = matchMedia('(max-width: 760px)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.4 : 1.8));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100); camera.position.set(0, 0, 14);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xffc2dc, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(3, 5, 6); scene.add(key);
    const pinkL = new THREE.PointLight(0xff7fbf, 0.9, 40); pinkL.position.set(-7, 2, 6); scene.add(pinkL);
    const lilacL = new THREE.PointLight(0xb69cff, 0.7, 40); lilacL.position.set(7, -3, 5); scene.add(lilacL);

    let W = 1, H = 1;
    const resize = () => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      H = Math.tan((camera.fov / 2) * Math.PI / 180) * camera.position.z; W = H * camera.aspect;
    };
    resize(); window.addEventListener('resize', resize);

    /* ---------- objets ---------- */
    const objs = {};
    const add = (k, obj, opts) => {
      const g = new THREE.Group(); g.add(obj); g.visible = false; g.scale.setScalar(0.0001); scene.add(g);
      objs[k] = { g, cur: { x: 0, y: -H * 3, z: 0, rx: 0, ry: 0, rz: 0, s: 0 }, tgt: null, ...(opts || {}) };
      return objs[k];
    };
    ['glow-drops', 'daily-cloud', 'sun-sunny', 'clear-crush', 'melt-in', 'mask-up', 'fresh-start', 'jelly-mist', 'dew-me'].forEach((id) => {
      const p = DB.product(id); if (p) add('p:' + id, GlowScene.build(p));
    });
    const glossy = GlowScene.glossy;
    const sphere = new THREE.SphereGeometry(0.5, 32, 24), hg = GlowScene.heartGeo(), sg = GlowScene.starGeo();
    const N = mobile ? 6 : 10;
    for (let i = 0; i < N; i++) add('bub:' + i, new THREE.Mesh(sphere, glossy(0xffe1ee, { transparent: true, opacity: 0.32, roughness: 0, clearcoat: 1 })));
    for (let i = 0; i < 6; i++) add('heart:' + i, new THREE.Mesh(hg, glossy(i % 2 ? 0xff7fb8 : 0xf5a9cb, { roughness: 0.12 })));
    for (let i = 0; i < 6; i++) add('star:' + i, new THREE.Mesh(sg, glossy(i % 2 ? 0xf9e49a : 0xc9b5f2, { roughness: 0.15 })));
    for (let i = 0; i < N; i++) add('lil:' + i, new THREE.Mesh(sphere, glossy(0xd8c4ff, { transparent: true, opacity: 0.42, roughness: 0, clearcoat: 1 })));
    for (let i = 0; i < 6; i++) add('drop:' + i, (() => { const m = new THREE.Mesh(sphere, glossy(0xff5fa2, { transparent: true, opacity: 0.75, roughness: 0.05 })); m.scale.set(0.8, 1.15, 0.8); return m; })());
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, emissive: 0xfff3d6, emissiveIntensity: 0.25 });
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Group();
      [[0, 0, 0, 0.9], [0.8, -0.15, 0.1, 0.7], [-0.8, -0.2, 0, 0.65], [0.35, 0.45, -0.1, 0.6], [-0.4, 0.35, 0.1, 0.55]].forEach(([x, y, z, s]) => { const m = new THREE.Mesh(sphere, cloudMat); m.position.set(x, y, z); m.scale.setScalar(s * 2); c.add(m); });
      add('cloud:' + i, c);
    }
    const sun = new THREE.Group();
    sun.add(new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), new THREE.MeshBasicMaterial({ color: 0xffe066 })));
    const halo = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.05, 64), new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0.6 })); sun.add(halo);
    for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.9), new THREE.MeshBasicMaterial({ color: 0xff9f43 })); const a = (i / 12) * Math.PI * 2; r.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0); r.rotation.z = a - Math.PI / 2; sun.add(r); }
    add('sun', sun);

    /* ---------- entrées ---------- */
    let mx = 0, my = 0;
    const onMove = (e) => { mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1; };
    window.addEventListener('pointermove', onMove, { passive: true });
    const t0 = performance.now() / 1000;
    let tgts = {};
    const set = (k, v) => { if (objs[k]) tgts[k] = v; };
    const scatter = (prefix, n, t, q, opts) => {
      for (let i = 0; i < n; i++) {
        const a = i * 2.39996, rad = 0.45 + ((i * 37) % 10) / 18;
        const depth = ((i * 53) % 7) - 3;
        set(prefix + ':' + i, {
          x: Math.cos(a) * W * rad * (opts.spread || 1) + Math.sin(t * 0.4 + i) * 0.25,
          y: Math.sin(a) * H * rad * 0.9 + (q - 0.5) * H * (opts.lift || 1.2) * (1 + depth * 0.15) + Math.cos(t * 0.6 + i) * 0.2,
          z: depth * 0.7, rx: t * 0.3 + i, ry: t * 0.4 + i * 2, rz: i,
          s: (opts.size || 0.6) * (0.6 + ((i * 29) % 10) / 14)
        });
      }
    };

    /* ---------- scènes ---------- */
    const scenes = {
      hero(p, q, t) {
        const T = t - t0;
        const drop = (i) => (1 - easeOutBack(clamp((T - 0.35 - i * 0.22) / 1.2))) * H * 2.4;
        const sp = mobile ? 0.5 : 0.95;
        set('p:glow-drops', { x: lerp(mobile ? 0 : 0.02 * W, -W * 0.38, easeOut(p)), y: (mobile ? 0.02 : -0.12) * H + drop(0) - p * H * 0.1, z: 2, rx: -my * 0.08, ry: Math.sin(t * 0.55) * 0.38 + p * 1.1 + mx * 0.25, rz: Math.sin(t * 0.8) * 0.04 - p * 0.15, s: sp * (1 - p * 0.12) });
        set('p:daily-cloud', { x: (mobile ? -0.42 : -0.5) * W - easeOut(p) * W * 0.9, y: (mobile ? -0.3 : -0.42) * H + drop(1), z: 1, ry: Math.sin(t * 0.5 + 1) * 0.3 + mx * 0.2, rz: 0.08, s: mobile ? 0.28 : 0.52 });
        set('p:sun-sunny', { x: (mobile ? 0.42 : 0.5) * W + easeOut(p) * W * 0.9, y: (mobile ? -0.26 : -0.3) * H + drop(2), z: 1.2, ry: Math.sin(t * 0.55 + 2) * 0.3 + mx * 0.2, rz: -0.12, s: mobile ? 0.28 : 0.56 });
        scatter('heart', 4, t, 0.5 - p * 0.6, { spread: 1.05, size: 0.42 });
        scatter('star', 4, t, 0.5 - p * 0.6, { spread: 1.15, size: 0.42 });
        scatter('bub', N, t, 0.5 - p * 0.8, { spread: 1.1, size: 0.8 });
      },
      manifesto(p, q, t) {
        ['melt-in', 'mask-up', 'jelly-mist', 'dew-me', 'fresh-start'].forEach((id, i) => {
          const bx = [-0.8, 0.74, -0.62, 0.86, 0.6][i], sp = [1.1, 0.8, 1.35, 1, 0.9][i];
          set('p:' + id, { x: bx * W * (mobile ? 0.8 : 1), y: lerp(-H * 1.7, H * 1.7, clamp(q * sp - 0.05 * i)), z: [0, -1.5, 1.5, -2.5, 0.5][i], rx: q * 1.2, ry: q * 3 * (i % 2 ? -1 : 1) * 0.6, rz: Math.sin(q * 6 + i) * 0.4, s: mobile ? 0.3 : 0.42 });
        });
        scatter('star', 6, t, q, { spread: 1.1, size: 0.4, lift: 2.2 });
        scatter('heart', 6, t, q, { spread: 1, size: 0.38, lift: 2.6 });
      },
      universe(id, deco, p, q, t) {
        const enter = 1 - easeOut(clamp(q / 0.24)), exit = easeOut(clamp((q - 0.76) / 0.24));
        const y = -enter * H * 1.9 + exit * H * 1.9 + Math.sin(t * 0.9) * 0.08;
        const base = { 'daily-cloud': 0.62, 'glow-drops': 0.82, 'clear-crush': 0.82, 'sun-sunny': 0.8 }[id] || 0.8;
        set('p:' + id, { x: (mobile ? 0 : -W * 0.24) + Math.sin(p * Math.PI) * W * 0.04, y: y + (mobile ? 0.12 * H : 0), z: 2.2, rx: -my * 0.06, ry: -0.45 + p * 0.9 + Math.sin(t * 0.45) * 0.06 + mx * 0.18, rz: Math.sin(p * Math.PI * 2) * 0.06, s: base * (mobile ? 0.72 : 1) * (0.82 + easeOut(p) * 0.5) });
        const lift = (p - 0.5) * 1.6;
        if (deco === 'glossy') { scatter('drop', 6, t, 0.5 + lift * 0.4, { spread: 0.95, size: 0.42, lift: 2 }); scatter('bub', N, t, 0.5 + lift * 0.3, { spread: 1.15, size: 1.1, lift: 2.4 }); scatter('heart', 3, t, 0.5 + lift * 0.5, { spread: 0.9, size: 0.4 }); }
        if (deco === 'cloud') for (let i = 0; i < 5; i++) set('cloud:' + i, { x: [-0.75, 0.7, -0.35, 0.45, 0.05][i] * W + Math.sin(t * 0.2 + i) * 0.3, y: [0.55, 0.5, -0.6, -0.5, 0.8][i] * H - lift * H * [0.3, 0.5, 0.8, 0.6, 0.4][i], z: [-3, -2, 1, -1, -4][i], ry: Math.sin(t * 0.2 + i) * 0.2, s: [1.1, 0.9, 0.7, 0.8, 1.3][i] * (mobile ? 0.6 : 1) });
        if (deco === 'bubbles') { scatter('lil', N, t, 0.5 + lift * 0.6, { spread: 1.1, size: 1.2, lift: 3 }); scatter('star', 3, t, 0.5 + lift * 0.3, { spread: 1, size: 0.35 }); }
        if (deco === 'sun') { set('sun', { x: (mobile ? 0.2 : 0.18) * W, y: H * 0.38 - lift * H * 0.3, z: -6, rz: t * 0.15, s: mobile ? 1.1 : 1.6 }); scatter('star', 6, t, 0.5 + lift * 0.4, { spread: 1, size: 0.45, lift: 2 }); }
      },
      bag(p, q, t) {
        const k = easeOut(clamp(p * 1.4));
        set('p:glow-drops', { x: mobile ? -0.08 * W : -0.05 * W, y: lerp(H * 1.4, -H * 0.18, k), z: 0, ry: p * 2.4, rz: lerp(0.6, 0.12, k), s: mobile ? 0.36 : 0.5 });
        const k2 = easeOut(clamp(p * 1.4 - 0.25));
        set('p:sun-sunny', { x: mobile ? 0.1 * W : 0.07 * W, y: lerp(H * 1.6, -H * 0.2, k2), z: -0.3, ry: -p * 2, rz: lerp(-0.8, -0.18, k2), s: mobile ? 0.3 : 0.42 });
        if (!mobile) scatter('heart', 4, t, 0.6 - p * 0.4, { spread: 0.8, size: 0.36 });
      }
    };

    /* ---------- couleurs de fond (fondu entre sections) ---------- */
    const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;

    /* ---------- boucle ---------- */
    let raf = 0, dead = false, last = performance.now();
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = now / 1000, vh = innerHeight;
      tgts = {};
      const secs = document.querySelectorAll('[data-scene]');
      let bgA = null, bgB = null, bgT = 0;
      secs.forEach((sec, i) => {
        const r = sec.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(1, r.height - vh)), q = clamp((vh - r.top) / (r.height + vh));
        sec.style.setProperty('--p', p.toFixed(4)); sec.style.setProperty('--q', q.toFixed(4));
        if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) {
          bgA = sec.dataset.bg; const nxt = secs[i + 1];
          const rest = r.bottom - vh * 0.5;
          if (nxt && rest < vh * 0.35) { bgB = nxt.dataset.bg; bgT = 1 - rest / (vh * 0.35); }
        }
        if (q <= 0 || q >= 1) return;
        const s = sec.dataset.scene;
        if (s === 'hero') scenes.hero(p, q, t);
        else if (s === 'manifesto') scenes.manifesto(p, q, t);
        else if (s === 'bag') scenes.bag(p, q, t);
        else if (s.startsWith('u:')) { const [, id, deco] = s.split(':'); scenes.universe(id, deco, p, q, t); }
      });
      if (bgA) document.body.style.backgroundColor = bgB ? mix(hex(bgA), hex(bgB), bgT) : bgA;
      const k = 1 - Math.pow(0.0025, dt);
      Object.keys(objs).forEach((key) => {
        const o = objs[key], c = o.cur, tg = tgts[key];
        if (tg) { ['x', 'y', 'z', 'rx', 'ry', 'rz'].forEach((a) => { if (tg[a] != null) c[a] += (tg[a] - c[a]) * k; }); c.s += ((tg.s || 0) - c.s) * k; }
        else c.s += (0 - c.s) * k;
        o.g.visible = c.s > 0.01;
        if (!o.g.visible) return;
        o.g.position.set(c.x, c.y, c.z); o.g.rotation.set(c.rx, c.ry, c.rz); o.g.scale.setScalar(c.s);
      });
      camera.position.x += (mx * 0.35 - camera.position.x) * 0.05; camera.position.y += (-my * 0.22 - camera.position.y) * 0.05; camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove);
        document.body.style.backgroundColor = '';
        renderer.dispose(); scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); renderer.domElement.remove();
        void dead;
      }
    };
  }
  return { create };
})();
