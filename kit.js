/* Мультфильм стиліндегі 3D модельдер жиынтығы */
(function () {
  'use strict';
  const T = THREE;
  const mats = {};
  function M(c, o) {
    if (c && c.isMaterial) return c;
    const key = c + (o ? JSON.stringify(o) : '');
    if (!mats[key]) mats[key] = (o && (o.shininess || o.flatShading)) ? new T.MeshPhongMaterial(Object.assign({ color: c }, o)) : new T.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
    return mats[key];
  }
  function mesh(g, c, x, y, z, o) { const m = new T.Mesh(g, M(c, o)); m.position.set(x || 0, y || 0, z || 0); return m; }
  const box = (w, h, d, c, x, y, z, o) => mesh(new T.BoxGeometry(w, h, d), c, x, y, z, o);
  const cyl = (rt, rb, h, c, x, y, z, seg, o) => mesh(new T.CylinderGeometry(rt, rb, h, seg || 14), c, x, y, z, o);
  const cone = (r, h, c, x, y, z, seg) => mesh(new T.ConeGeometry(r, h, seg || 10), c, x, y, z);
  const sph = (r, c, x, y, z, o) => mesh(new T.SphereGeometry(r, 18, 12), c, x, y, z, o);
  function G() { const g = new T.Group(); for (let i = 0; i < arguments.length; i++) if (arguments[i]) g.add(arguments[i]); return g; }
  function at(o, x, y, z, ry, s) { o.position.set(x || 0, y || 0, z || 0); if (ry) o.rotation.y = ry; if (s) o.scale.setScalar(s); return o; }
  let seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function setSeed(s) { seed = s; }
  const R = (a, b) => a + (b - a) * rnd();

  function textTex(lines, o) {
    o = o || {};
    const c = document.createElement('canvas'); c.width = o.w || 512; c.height = o.h || 256;
    const g = c.getContext('2d');
    g.fillStyle = o.bg || '#fffdf5'; g.fillRect(0, 0, c.width, c.height);
    if (o.border !== false) { g.strokeStyle = o.fg || '#16324f'; g.lineWidth = 12; g.strokeRect(6, 6, c.width - 12, c.height - 12); }
    g.fillStyle = o.fg || '#16324f'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const fs = o.font || 54; const lh = fs * 1.25; const y0 = c.height / 2 - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => { g.font = (i === 0 ? '800 ' : '600 ') + (i === 0 ? fs : fs * 0.8) + 'px Montserrat, Arial, sans-serif'; g.fillText(l, c.width / 2, y0 + i * lh); });
    return new T.CanvasTexture(c);
  }
  function sign(lines, pw, ph, o) {
    const m = new T.Mesh(new T.PlaneGeometry(pw, ph), new T.MeshBasicMaterial({ map: textTex(lines, o), side: T.DoubleSide }));
    return m;
  }
  function board(lines, o) { // тақтайша: екі бағана + жазу
    o = o || {}; const w = o.pw || 3.2, h = o.ph || 1.6;
    const s = sign(lines, w, h, o); s.position.y = 1.9;
    return G(cyl(.08, .08, 2.6, 0x7a5230, -w / 2 + .15, 1.3, -.05), cyl(.08, .08, 2.6, 0x7a5230, w / 2 - .15, 1.3, -.05), s);
  }
  function portraitTex(name, years) {
    const c = document.createElement('canvas'); c.width = 384; c.height = 512; const g = c.getContext('2d');
    g.fillStyle = '#2f6f7a'; g.fillRect(0, 0, 384, 512);
    g.fillStyle = '#263445'; g.beginPath(); g.moveTo(40, 512); g.quadraticCurveTo(60, 330, 192, 320); g.quadraticCurveTo(324, 330, 344, 512); g.fill();
    g.fillStyle = '#f4f1ea'; g.beginPath(); g.moveTo(160, 330); g.lineTo(192, 400); g.lineTo(224, 330); g.fill();
    g.fillStyle = '#e2b48c'; g.beginPath(); g.ellipse(192, 215, 78, 98, 0, 0, 7); g.fill(); g.fillRect(165, 290, 54, 50);
    g.fillStyle = '#1d1a18'; g.beginPath(); g.ellipse(192, 150, 92, 70, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.ellipse(120, 180, 22, 50, .2, 0, 7); g.fill(); g.beginPath(); g.ellipse(264, 180, 22, 50, -.2, 0, 7); g.fill();
    g.fillRect(150, 205, 30, 6); g.fillRect(204, 205, 30, 6);
    g.beginPath(); g.arc(165, 222, 6, 0, 7); g.arc(219, 222, 6, 0, 7); g.fill();
    g.beginPath(); g.ellipse(192, 268, 34, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#ffc93c'; g.font = '800 34px Montserrat, Arial'; g.textAlign = 'center'; g.fillText(name, 192, 455); g.font = '600 26px Montserrat, Arial'; g.fillText(years, 192, 492);
    return c;
  }

  /* --- табиғат --- */
  function pine(s) {
    s = s || 1; const g = G(cyl(.18, .28, 1.4, 0x7a5230, 0, .7, 0, 6));
    const cols = [0x3f8f52, 0x4c9c5c, 0x5aa866];
    for (let i = 0; i < 3; i++) g.add(cone(1.5 - i * .38, 2.1, cols[i], 0, 2 + i * 1.25, 0, 12));
    g.scale.setScalar(s); return g;
  }
  function birch(s) {
    s = s || 1; const g = G(cyl(.13, .17, 2.6, 0xf2efe6, 0, 1.3, 0, 6), sph(1.25, 0x8bcf5a, 0, 3.3, 0), sph(.9, 0x9fdb6a, .6, 2.8, .3));
    g.scale.setScalar(s); return g;
  }
  function rock(s, c) { const m = mesh(new T.DodecahedronGeometry(s || 1, 0), c || 0x8f9aa3); m.scale.y = .7; m.rotation.set(R(0, 3), R(0, 3), 0); return m; }
  function bush(c) { return G(sph(.6, c || 0x4fae62, 0, .45, 0), sph(.45, c || 0x62bf73, .5, .35, .2)); }
  function flowers(n, r) { const g = G(); const cs = [0xffd23f, 0xff7aa2, 0xffffff, 0xb07cff, 0xff9838]; for (let i = 0; i < n; i++) { const a = R(0, 6.28), d = R(0, r); g.add(sph(.13, cs[i % 5], Math.cos(a) * d, .14, Math.sin(a) * d)); } return g; }
  function mountain(r, h, c, snow) {
    const g = G(cone(r, h, c || 0x7d8a96, 0, h / 2, 0, 7));
    if (snow !== false) g.add(cone(r * .42, h * .42, 0xffffff, 0, h * .79 + .05, 0, 7));
    g.rotation.y = R(0, 6); return g;
  }
  function lake(rx, rz, c) { const m = mesh(new T.CircleGeometry(1, 40), c || 0x5fb0dc, 0, .04, 0); m.rotation.x = -Math.PI / 2; m.scale.set(rx, rz, 1); return m; }
  function cloud() { const g = G(sph(1.6, 0xffffff), sph(1.2, 0xffffff, 1.6, -.2, 0), sph(1.1, 0xffffff, -1.5, -.25, .2), sph(.9, 0xffffff, .5, .5, .4)); g.scale.y = .6; g.traverse(m => { m.userData.nc = 1; }); return g; }

  /* --- құрылыс --- */
  function house(o) {
    o = o || {}; const w = o.w || 5, d = o.d || 4, h = o.h || 2.6;
    const g = G(box(w, h, d, o.wall || 0xf3e2c0, 0, h / 2, 0));
    const rf = mesh(new T.ConeGeometry(Math.max(w, d) * .78, o.rh || 1.8, 4), o.roof || 0xb5432a, 0, h + (o.rh || 1.8) / 2, 0);
    rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 1); g.add(rf);
    g.add(box(.9, 1.7, .1, o.door || 0x6b4226, -w * .22, .85, d / 2 + .03));
    const wc = o.frame || 0xffffff;
    [[w * .2, d / 2 + .03, 0], [-w / 2 - .03, 0, 1], [w / 2 + .03, 0, 1]].forEach(p => {
      const fr = box(p[2] ? .1 : 1.15, 1.15, p[2] ? 1.15 : .1, wc, p[0], h * .58, p[2] ? 0 : p[1]);
      const gl = box(p[2] ? .14 : .8, .8, p[2] ? .8 : .14, 0x7fd0ff, p[0], h * .58, p[2] ? 0 : p[1]);
      g.add(fr, gl);
    });
    if (o.log) for (let i = 1; i < 5; i++) g.add(box(w + .12, .06, d + .12, 0x5d3d22, 0, i * h / 5, 0));
    if (o.chimney !== false) g.add(box(.5, 1.3, .5, 0x9c5a44, w * .25, h + 1.2, 0));
    if (o.solar) { const sp = box(w * .5, .08, 1.3, 0x1b4f9c, -w * .05, h + .95, d * .3); sp.rotation.x = .75; g.add(sp); }
    return g;
  }
  function yurt() {
    const g = G(cyl(2.3, 2.3, 1.7, 0xf7f3e8, 0, .85, 0, 14), cone(2.5, 1.5, 0xf0e9d6, 0, 2.45, 0, 14), cyl(2.34, 2.34, .28, 0xc0392b, 0, 1.55, 0, 14), cyl(.45, .45, .15, 0x8a5a2b, 0, 3.2, 0, 10), box(.9, 1.4, .12, 0xb5432a, 0, .7, 2.3));
    return g;
  }
  function fence(len, c) { const g = G(); const n = Math.max(2, Math.round(len / 2)); for (let i = 0; i <= n; i++) g.add(box(.14, 1.2, .14, c || 0x8a5a2b, -len / 2 + i * len / n, .6, 0)); g.add(box(len, .1, .08, c || 0x8a5a2b, 0, .95, 0), box(len, .1, .08, c || 0x8a5a2b, 0, .5, 0)); return g; }
  function flag(c, h) { h = h || 5; return G(cyl(.06, .06, h, 0xdddddd, 0, h / 2, 0), box(1.6, .95, .04, c || 0x00afca, .85, h - .55, 0), sph(.18, 0xffc93c, .85, h - .55, .04)); }
  function church() {
    const g = G(box(5, 3.4, 7, 0xa8743d, 0, 1.7, 0), box(3, 3, 3, 0xa8743d, 0, 4.9, 1.5));
    for (let i = 1; i < 6; i++) g.add(box(5.1, .06, 7.1, 0x6b4423, 0, i * .56, 0));
    const rf = mesh(new T.ConeGeometry(4.6, 1.6, 4), 0x4f6d8f, 0, 4.2, -1.2); rf.rotation.y = Math.PI / 4; rf.scale.z = 1.1; g.add(rf);
    g.add(cone(2.3, 1.4, 0x4f6d8f, 0, 7.1, 1.5, 4), cyl(.25, .5, .7, 0xe8c34a, 0, 8, 1.5), sph(.75, 0xe8c34a, 0, 8.8, 1.5), cone(.3, .8, 0xe8c34a, 0, 9.7, 1.5));
    g.add(box(.1, 1.2, .1, 0xe8c34a, 0, 10.5, 1.5), box(.6, .1, .1, 0xe8c34a, 0, 10.7, 1.5), box(.4, .1, .1, 0xe8c34a, 0, 10.35, 1.5));
    g.add(box(1.2, 2, .12, 0x5a3a1e, 0, 1, 3.55), box(.8, 1.1, .1, 0x7fd0ff, 0, 5, 3.05));
    return g;
  }
  function bridge(len, w) {
    const g = G(box(w || 3, .25, len, 0x9a6b3c, 0, .5, 0));
    for (let i = -1; i <= 1; i += 2) { g.add(box(.12, .12, len, 0x7a5230, i * (w || 3) / 2, 1.4, 0)); for (let k = 0; k <= 6; k++) g.add(box(.14, 1, .14, 0x7a5230, i * (w || 3) / 2, .95, -len / 2 + k * len / 6)); }
    g.add(box((w || 3) + .4, .7, .5, 0x6b4a2b, 0, .15, -len / 2 + .6), box((w || 3) + .4, .7, .5, 0x6b4a2b, 0, .15, len / 2 - .6));
    return g;
  }
  function tent(c) { const m = mesh(new T.ConeGeometry(1.5, 1.6, 4), c || 0xff7a3d, 0, .8, 0); m.rotation.y = Math.PI / 4; return G(m, box(.5, .9, .05, 0x333333, 0, .45, 1.07)); }
  function campfire(ups) {
    const g = G(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(rock(.22, 0x777777).translateX(Math.cos(a) * .55).translateZ(Math.sin(a) * .55)); }
    const f1 = cone(.3, .9, 0xff8a1e, 0, .5, 0, 5), f2 = cone(.18, .6, 0xffe14a, 0, .45, 0, 5); g.add(f1, f2);
    if (ups) ups.push((dt, t) => { f1.scale.y = 1 + Math.sin(t * 9) * .25; f2.scale.y = 1 + Math.cos(t * 13) * .3; f1.rotation.y += dt * 3; });
    return g;
  }
  function pedestal(h, c) { return G(cyl(.55, .7, h || 1, c || 0xd9d3c7, 0, (h || 1) / 2, 0, 10), cyl(.75, .75, .12, c || 0xcfc8ba, 0, (h || 1) + .06, 0, 10)); }
  function table() { return G(box(2, .1, 1.1, 0x9a6b3c, 0, .8, 0), box(.1, .8, .1, 0x7a5230, -.9, .4, -.45), box(.1, .8, .1, 0x7a5230, .9, .4, -.45), box(.1, .8, .1, 0x7a5230, -.9, .4, .45), box(.1, .8, .1, 0x7a5230, .9, .4, .45)); }
  function hive(c) { return G(box(.7, .5, .7, c || 0xffd23f, 0, .55, 0), box(.7, .5, .7, 0x7fc8f8, 0, 1.05, 0), box(.9, .12, .9, 0x8a5a2b, 0, 1.36, 0), box(.5, .3, .5, 0x8a5a2b, 0, .15, 0)); }
  function barrelTub() { const g = G(cyl(1.15, 1, 1.2, 0x9a6b3c, 0, .6, 0, 12), cyl(1.18, 1.18, .1, 0x555555, 0, .95, 0, 12), cyl(1.05, 1.05, .1, 0x555555, 0, .3, 0, 12)); const w = cyl(1, 1, .06, 0xc98b5a, 0, 1.12, 0, 12); g.add(w); return g; }
  function steam(ups, n, spread) {
    const g = G(); const ps = [];
    for (let i = 0; i < (n || 7); i++) { const p = sph(R(.25, .5), 0xffffff, R(-1, 1) * (spread || .6), R(0, 2.5), R(-1, 1) * (spread || .6), { transparent: true, opacity: .55, depthWrite: false }); p.userData.s = R(.5, 1); g.add(p); ps.push(p); }
    ups.push((dt) => ps.forEach(p => { p.position.y += dt * p.userData.s; p.scale.setScalar(1 + p.position.y * .35); if (p.position.y > 3) p.position.y = 0; }));
    return g;
  }

  /* --- тірі жандар --- */
  function person(shirt, o) {
    o = o || {};
    const g = G(box(.22, .8, .25, o.pants || 0x34495e, -.14, .4, 0), box(.22, .8, .25, o.pants || 0x34495e, .14, .4, 0), cyl(.28, .32, .75, shirt || 0xe4572e, 0, 1.15, 0, 8), sph(.23, 0xf1c9a5, 0, 1.72, 0));
    g.add(box(.14, .6, .16, shirt || 0xe4572e, -.38, 1.15, 0), box(.14, .6, .16, shirt || 0xe4572e, .38, 1.15, 0));
    if (o.hat !== false) g.add(cyl(.26, .28, .14, o.hat || 0xffc93c, 0, 1.93, 0, 8));
    if (o.pack) g.add(box(.45, .6, .28, o.pack, 0, 1.2, -.3));
    return g;
  }
  function quad(c, len, hgt) { // төрт аяқты дене
    const g = G(box(.55, .6, len, c, 0, hgt, 0));
    [[-.2, len / 2 - .15], [.2, len / 2 - .15], [-.2, -len / 2 + .15], [.2, -len / 2 + .15]].forEach(p => g.add(box(.14, hgt - .2, .14, c, p[0], (hgt - .2) / 2, p[1])));
    return g;
  }
  function deer(o) {
    o = o || {}; const c = o.color || 0xa9713c; const g = quad(c, 1.5, 1.05);
    const neck = box(.3, .8, .3, c, 0, 1.6, .75); neck.rotation.x = .5; g.add(neck);
    g.add(box(.3, .32, .55, c, 0, 2.02, 1.12), box(.5, .5, .12, 0xf3e3c3, 0, 1.1, -.78), sph(.05, 0x111111, .16, 2.08, 1.25), sph(.05, 0x111111, -.16, 2.08, 1.25));
    if (o.antlers !== false) {
      const ac = o.velvet ? 0x8a6a4a : 0xe9dcc0;
      [-1, 1].forEach(s => {
        const a = box(.07, .9, .07, ac, s * .22, 2.6, 1.0); a.rotation.z = -s * .45; g.add(a);
        const b = box(.06, .45, .06, ac, s * .5, 2.85, 1.05); b.rotation.z = -s * 1.0; g.add(b);
        const d = box(.06, .4, .06, ac, s * .3, 2.5, 1.2); d.rotation.x = .9; g.add(d);
        const e = box(.06, .4, .06, ac, s * .44, 3.05, .95); e.rotation.z = s * .2; g.add(e);
      });
    }
    return g;
  }
  function horse(o) {
    o = o || {}; const c = o.color || 0x9b5a2e; const g = quad(c, 1.8, 1.25);
    const neck = box(.32, .95, .36, c, 0, 1.85, .95); neck.rotation.x = .55; g.add(neck);
    g.add(box(.3, .36, .7, c, 0, 2.3, 1.45), box(.1, .8, .5, 0x2b1b10, 0, 2.0, .7), box(.12, .9, .12, 0x2b1b10, 0, 1.05, -1.0));
    if (o.mask) { [-1, 1].forEach(s => { const h = box(.08, .9, .08, 0xf2c744, s * .16, 3.0, 1.25); h.rotation.x = -.5; h.rotation.z = -s * .25; g.add(h); }); g.add(box(.36, .2, .5, 0xf2c744, 0, 2.52, 1.4), box(.6, .1, .9, 0xc0392b, 0, 1.6, 0), sph(.1, 0xf2c744, .3, 1.3, .6), sph(.1, 0xf2c744, -.3, 1.3, .6)); }
    if (o.saddle) g.add(box(.62, .14, .7, 0x5a2d0c, 0, 1.62, 0), box(.66, .5, .1, 0xc0392b, 0, 1.35, 0));
    return g;
  }
  function bear() {
    const c = 0x6b4226; const g = quad(c, 1.9, 1.0); g.children[0].scale.set(1.7, 1.5, 1);
    g.add(sph(.5, c, 0, 1.45, 1.15), box(.28, .22, .3, 0x8a5a3a, 0, 1.35, 1.6), sph(.14, c, .3, 1.85, 1.1), sph(.14, c, -.3, 1.85, 1.1), sph(.05, 0x111111, .18, 1.55, 1.58), sph(.05, 0x111111, -.18, 1.55, 1.58));
    return g;
  }
  function leopard() {
    const c = 0xe6e2d8; const g = quad(c, 1.7, .8);
    g.add(sph(.34, c, 0, 1.1, 1.0), sph(.1, c, .2, 1.4, .95), sph(.1, c, -.2, 1.4, .95), sph(.045, 0x1e1e1e, .13, 1.16, 1.3), sph(.045, 0x1e1e1e, -.13, 1.16, 1.3), box(.1, .08, .06, 0xd08a8a, 0, 1.05, 1.33));
    const tail = cyl(.09, .12, 1.6, c, 0, 1.0, -1.5, 6); tail.rotation.x = -1.1; g.add(tail);
    for (let i = 0; i < 14; i++) g.add(sph(.07, 0x4a4a4a, R(-.29, .29), R(.6, 1.12), R(-.8, .8)));
    return g;
  }
  function eagle(ups) {
    const g = G(box(.3, .3, .8, 0x4a3320, 0, 0, 0), sph(.2, 0xf4f1ea, 0, .12, .5), cone(.07, .22, 0xffc93c, 0, .08, .72, 5));
    g.children[2].rotation.x = Math.PI / 2;
    const wl = box(1.5, .06, .55, 0x5a3f28, -.85, 0, 0), wr = box(1.5, .06, .55, 0x5a3f28, .85, 0, 0); g.add(wl, wr, box(.4, .05, .5, 0x4a3320, 0, 0, -.6));
    if (ups) ups.push((dt, t) => { wl.rotation.z = Math.sin(t * 3) * .35; wr.rotation.z = -Math.sin(t * 3) * .35; });
    return g;
  }
  function fish(c) { const g = G(sph(.5, c || 0xc0c7cf), cone(.35, .5, c || 0xaab3bd, 0, 0, -.75, 4), sph(.06, 0x111111, .2, .12, .38), box(.04, .35, .3, 0xd95a3a, 0, .45, 0)); g.children[0].scale.set(.5, .8, 1.5); g.children[1].rotation.x = Math.PI / 2; return g; }

  /* --- көлік --- */
  function wheels(g, hw, zs, r) { zs.forEach(z => [-1, 1].forEach(s => { const w = cyl(r, r, .28, 0x222222, s * hw, r, z, 10); w.rotation.z = Math.PI / 2; g.add(w); })); }
  function car(c, ev) {
    const g = G(box(1.8, .6, 4, c, 0, .7, 0), box(1.6, .6, 2.1, ev ? 0x9ff3ff : 0xcfeaff, 0, 1.25, -.2), box(1.62, .1, 2.12, c, 0, 1.58, -.2), box(.4, .16, .08, 0xfff3a0, -.55, .75, 2.02), box(.4, .16, .08, 0xfff3a0, .55, .75, 2.02));
    wheels(g, .9, [1.25, -1.25], .38);
    if (ev) g.add(box(1.84, .08, 4.04, 0x00e5ff, 0, .45, 0, { emissive: 0x00a5c0 }));
    return g;
  }
  function jeep(c) {
    const g = G(box(1.9, .8, 4, c, 0, .95, 0), box(1.8, .75, 2.4, 0xcfeaff, 0, 1.7, -.4), box(1.9, .1, 2.5, c, 0, 2.1, -.4), box(1.5, .15, 1.8, 0x444444, 0, 2.25, -.4), box(.4, .18, .08, 0xfff3a0, -.6, 1.0, 2.02), box(.4, .18, .08, 0xfff3a0, .6, 1.0, 2.02));
    wheels(g, .98, [1.3, -1.3], .5); const sp = cyl(.5, .5, .25, 0x222222, 0, 1.2, -2.15, 10); sp.rotation.x = Math.PI / 2; g.add(sp);
    return g;
  }
  function bus(c, ev) {
    const g = G(box(2.4, 2.3, 8, c, 0, 1.65, 0), box(2.44, .8, 7, ev ? 0x9ff3ff : 0xcfeaff, 0, 2.05, 0), box(2.2, .9, .08, 0xcfeaff, 0, 2.0, 4.02), box(2.42, .12, 8.02, 0xffffff, 0, 2.85, 0));
    wheels(g, 1.2, [2.6, -2.6], .5);
    if (ev) g.add(box(1.6, .1, 5, 0x1b4f9c, 0, 2.95, 0));
    return g;
  }
  function plane(ups) {
    const body = cyl(.7, .45, 7, 0xffffff, 0, 0, 0, 8); body.rotation.x = Math.PI / 2;
    const g = G(body, box(11, .14, 1.6, 0xe4572e, 0, .75, .8), box(9, .14, 1.4, 0xe4572e, 0, -.55, .8), box(3.4, .12, 1, 0xe4572e, 0, .2, -3.1), box(.12, 1.5, 1.1, 0xe4572e, 0, .9, -3.1), box(1.1, .5, 1.6, 0x7fd0ff, 0, .55, 2.1), cone(.4, .8, 0x333333, 0, 0, 3.8, 6));
    g.children[6].rotation.x = Math.PI / 2;
    [-1, 1].forEach(s => { g.add(box(.08, 1.3, .08, 0x888888, s * 3, .1, .8)); });
    const pr = G(box(2.6, .16, .06, 0x333333), box(.16, 2.6, .06, 0x333333)); pr.position.z = 4.05; g.add(pr);
    if (ups) ups.push(dt => { pr.rotation.z += dt * 25; });
    return g;
  }
  function flyingCar(ups, c) {
    const g = G(box(1.9, .55, 3.6, c || 0xffffff, 0, 0, 0), box(1.92, .12, 3.62, 0x00e5ff, 0, -.3, 0, { emissive: 0x00a5c0 }));
    const cab = sph(1, 0x9ff3ff, 0, .35, .2, { transparent: true, opacity: .75 }); cab.scale.set(.85, .6, 1.4); g.add(cab);
    g.add(box(.3, .1, .08, 0xfff3a0, -.6, 0, 1.82), box(.3, .1, .08, 0xfff3a0, .6, 0, 1.82), box(.08, .5, .6, 0xffc93c, 0, .45, -1.7));
    const rot = [];
    [[-1.9, 1.5], [1.9, 1.5], [-1.9, -1.5], [1.9, -1.5]].forEach(p => {
      const arm = box(Math.abs(p[0]) - .6, .1, .14, 0x555555, p[0] / 2 + Math.sign(p[0]) * .3, .1, p[1]); g.add(arm);
      const ring = mesh(new T.TorusGeometry(.85, .07, 6, 16), 0x16324f, p[0], .22, p[1]); ring.rotation.x = Math.PI / 2; g.add(ring);
      const bl = G(box(1.6, .03, .14, 0xdddddd), box(.14, .03, 1.6, 0xdddddd)); bl.position.set(p[0], .26, p[1]); g.add(bl); rot.push(bl);
    });
    g.add(box(.1, .4, .1, 0x555555, -.7, -.5, 1), box(.1, .4, .1, 0x555555, .7, -.5, 1), box(.1, .4, .1, 0x555555, -.7, -.5, -1), box(.1, .4, .1, 0x555555, .7, -.5, -1), box(.14, .08, 2.6, 0x555555, -.7, -.72, 0), box(.14, .08, 2.6, 0x555555, .7, -.72, 0));
    if (ups) ups.push(dt => rot.forEach(b => { b.rotation.y += dt * 30; }));
    return g;
  }
  function boat(c) { const g = G(box(1.2, .4, 3.2, c || 0xe4572e, 0, .2, 0), box(1, .08, .3, 0x8a5a2b, 0, .42, .4), box(1, .08, .3, 0x8a5a2b, 0, .42, -.6)); const b = cone(.62, 1, c || 0xe4572e, 0, .2, 2.05, 4); b.rotation.x = Math.PI / 2; b.rotation.y = Math.PI / 4; g.add(b); return g; }

  /* --- болашақ --- */
  function turbine(ups, h) {
    h = h || 12; const g = G(cyl(.22, .45, h, 0xf4f6f8, 0, h / 2, 0, 10), box(.7, .7, 1.5, 0xf4f6f8, 0, h, .1));
    const r = G(sph(.38, 0xe4572e));
    for (let i = 0; i < 3; i++) { const b = box(.4, h * .42, .1, 0xffffff, 0, h * .21, 0); const p = new T.Group(); p.add(b); p.rotation.z = i * 2.094; r.add(p); }
    r.position.set(0, h, .95); g.add(r);
    if (ups) ups.push(dt => { r.rotation.z += dt * 1.6; });
    return g;
  }
  function solar(cols, rows) {
    const g = G(); cols = cols || 3; rows = rows || 2;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const p = G(box(1.9, .08, 1.2, 0x1b4f9c, 0, 1, 0), box(1.94, .04, 1.24, 0xdfe8f0, 0, .96, 0), box(.1, 1, .1, 0x888888, 0, .5, .2));
      p.children[0].rotation.x = p.children[1].rotation.x = -.55; p.position.set((i - (cols - 1) / 2) * 2.2, 0, (j - (rows - 1) / 2) * 2); g.add(p);
    }
    return g;
  }
  function charger() { return G(box(.6, 1.6, .4, 0x16c79a, 0, .8, 0), box(.4, .4, .05, 0xffffff, 0, 1.15, .21), box(.12, .34, .06, 0xffc93c, 0, 1.15, .24), cyl(.04, .04, .9, 0x222222, .38, .7, 0)); }
  function hydro() { return G(box(7, 2.2, 1.4, 0xbfc8cf, 0, 1.1, 0), box(2.4, 2.4, 2.6, 0xf4f6f8, 4.2, 1.2, .8), box(2.6, .2, 2.8, 0x16c79a, 4.2, 2.5, .8), box(1, 1.6, .2, 0x7fd0ff, -1.5, .9, .75), box(1, 1.6, .2, 0x7fd0ff, .5, .9, .75)); }
  function futureKit(ups) {
    const g = G(at(turbine(ups, 16), -20, 0, 12), at(turbine(ups, 13), -24, 0, 4), at(solar(4, 2), 18, 0, 13, -.5), at(charger(), 13, 0, 17, -.6));
    const fc = at(flyingCar(ups, 0xffffff), 15, 2.2, 19, -1); g.add(fc);
    ups.push((dt, t) => { fc.position.y = 2.2 + Math.sin(t * 1.5) * .25; });
    const pad = cyl(2.6, 2.6, .08, 0x16c79a, 15, .05, 19, 20); g.add(pad);
    return g;
  }

  window.K = { T, M, mesh, box, cyl, cone, sph, G, at, R, rnd, setSeed, textTex, sign, board, portraitTex, pine, birch, rock, bush, flowers, mountain, lake, cloud, house, yurt, fence, flag, church, bridge, tent, campfire, pedestal, table, hive, barrelTub, steam, person, deer, horse, bear, leopard, eagle, fish, car, jeep, bus, plane, flyingCar, boat, turbine, solar, charger, hydro, futureKit };
})();
