/* Катонқарағай саяхаты — карта, маршруттар, экскурсия, интерфейс */
(function () {
  'use strict';
  const K = window.K, T = THREE, D = window.DATA, CR = window.CREDITS || {};
  const { box, cyl, cone, sph, G, at, mesh } = K;
  const $ = s => document.querySelector(s);
  const SITES = D.sites, byId = {}; SITES.forEach(s => byId[s.id] = s);
  const MS = 0.42; // картадағы модель масштабы

  /* ---------- география ---------- */
  const W = (lat, lon) => ({ x: (lon - 84.75) * 71.5, z: -(lat - 49.3) * 111.2 });
  const EY = e => (e - 0.3) * 3.2;
  const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vn(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; }
  const fbm = (x, y) => vn(x, y) * .6 + vn(x * 2.1, y * 2.1) * .3 + vn(x * 4.3, y * 4.3) * .1;
  function dense(geo, n) {
    const v = geo.map(p => { const w = W(p[0], p[1]); return new T.Vector3(w.x, p[2], w.z); });
    return new T.CatmullRomCurve3(v, false, 'catmullrom', .5).getSpacedPoints(n).map(p => ({ x: p.x, z: p.z, e: p.y }));
  }
  const ROAD = dense([[49.95, 82.62, .3], [49.8, 83.0, .45], [49.7, 83.3, .42], [49.73, 83.8, .6], [49.73, 84.27, .5], [49.47, 84.42, .7], [49.21, 84.51, .48], [49.2, 85.05, .78], [49.175, 85.61, 1.0], [49.2, 85.96, 1.1], [49.235, 86.33, 1.1], [49.375, 86.435, 1.15], [49.45, 86.5, 1.45], [49.52, 86.545, 1.76]], 170);
  const BUKH = dense([[49.14, 86.98, 1.5], [49.2, 86.7, 1.3], [49.3, 86.47, 1.12], [49.262, 86.33, 1.06], [49.275, 85.95, 1.0], [49.265, 85.6, .92], [49.33, 85.3, .78], [49.43, 85.08, .64], [49.52, 84.7, .54], [49.6, 84.32, .46], [49.58, 83.98, .42], [49.5, 83.75, .4]], 120);
  const BERR = dense([[49.75, 86.575, 2.6], [49.66, 86.6, 2.0], [49.52, 86.63, 1.55], [49.42, 86.52, 1.25], [49.3, 86.47, 1.12]], 36);
  const IRT = dense([[49.64, 83.33, .4], [49.8, 83.05, .36], [49.93, 82.7, .32], [50.0, 82.36, .3]], 30);
  const TRAIL = dense([[49.375, 86.435, 1.15], [49.47, 86.36, 1.5], [49.57, 86.3, 1.72], [49.65, 86.38, 2.2], [49.7, 86.5, 2.05], [49.745, 86.47, 2.5], [49.775, 86.44, 2.9]], 50);
  const AUS = dense([[49.2, 85.98, 1.1], [49.13, 86.03, 1.7], [49.07, 86.03, 2.14], [48.98, 86.0, 1.65], [48.9, 85.97, 1.95], [48.8, 85.94, 1.5]], 50);
  const FL = [[BUKH, 1.2, 6, -.25], [BERR, .8, 4, -.2], [IRT, 1.6, 7, -.2], [ROAD, 1.0, 5, 0], [AUS, .7, 2.8, 0], [TRAIL, .5, 2.2, 0]];
  const RIDGES = [
    [[[49.8, 86.2], [49.81, 86.59], [49.74, 86.98]], 8, 9, 1], [[[49.5, 85.3], [49.62, 85.9], [49.67, 86.25]], 6.5, 9, 2], [[[50.02, 84.6], [49.92, 85.4], [49.87, 86.1]], 6.5, 10, 3],
    [[[49.02, 85.2], [49.02, 85.9], [49.08, 86.5], [49.2, 87.05]], 7.5, 8, 4], [[[49.03, 83.9], [48.98, 84.7], [49.02, 85.2]], 5, 8, 5], [[[48.58, 85.1], [48.6, 86.3]], 5, 7, 6],
    [[[50.05, 83.1], [50.0, 84.0], [49.98, 84.6]], 5.5, 9, 7], [[[49.35, 86.8], [49.52, 86.86], [49.7, 86.92]], 7.5, 7, 8], [[[49.5, 86.12], [49.63, 86.42]], 5.5, 5, 9], [[[49.62, 82.9], [49.4, 83.2]], 2.2, 7, 10]
  ].map(r => ({ pts: r[0].map(p => W(p[0], p[1])), h: r[1], w: r[2], s: r[3] * 13.7 }));
  const LAKES = [[49.42, 83.75, 34, 8, .76, .4, 'Бұқтырма су қоймасы'], [48.75, 85.75, 19, 7, -.2, 1.45, 'Марқакөл'], [49.555, 86.47, 2.1, 1.05, .5, 1.76], [49.58, 86.27, 2.0, .95, -.4, 1.69]]
    .map(l => Object.assign(W(l[0], l[1]), { rx: l[2], rz: l[3], rot: l[4], e: l[5], name: l[6], c: Math.cos(l[4]), s: Math.sin(l[4]) }));
  const PEAK = W(49.807, 86.59);
  SITES.forEach(s => { s.p = W(s.lat, s.lon); });

  function dPath(pts, x, z) { // жолға дейінгі қашықтық және биіктік
    let best = 1e9, be = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], vx = b.x - a.x, vz = b.z - a.z; let t = ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz + 1e-9); t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = a.x + vx * t - x, dz = a.z + vz * t - z, d = dx * dx + dz * dz; if (d < best) { best = d; be = a.e + (b.e - a.e) * t; }
    }
    return [Math.sqrt(best), be];
  }
  let lastW = 0;
  function H(x, z) {
    let h = .6 + sm(-120, 140, x) * 1.6 + fbm(x * .06 + 7, z * .06 + 3) * 1.6;
    for (let i = 0; i < RIDGES.length; i++) { const r = RIDGES[i]; let dm = 1e9; for (let k = 0; k < r.pts.length - 1; k++) { const a = r.pts[k], b = r.pts[k + 1], vx = b.x - a.x, vz = b.z - a.z; let t = ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz); t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = a.x + vx * t - x, dz = a.z + vz * t - z, d = dx * dx + dz * dz; if (d < dm) dm = d; } if (dm < r.w * r.w * 6) h += r.h * Math.exp(-dm / (r.w * r.w)) * (.55 + .9 * fbm(x * .11 + r.s, z * .11)); }
    const pd = (x - PEAK.x) * (x - PEAK.x) + (z - PEAK.z) * (z - PEAK.z), pd2 = (x - PEAK.x + 3.2) * (x - PEAK.x + 3.2) + (z - PEAK.z - .6) * (z - PEAK.z - .6);
    h += 9.5 * Math.exp(-pd / 16) + 7.5 * Math.exp(-pd2 / 11);
    if (h > 4) h += (vn(x * .45, z * .45) - .5) * 1.4;
    let wm = 0;
    for (let i = 0; i < FL.length; i++) { const f = FL[i], r = dPath(f[0], x, z); if (r[0] < f[2]) { const w = 1 - sm(f[1], f[2], r[0]); h += (EY(r[1]) + f[3] - h) * w; if (w > wm) wm = w; } }
    for (let i = 0; i < SITES.length; i++) { const s = SITES[i]; if (s.id === 'muztau') continue; const d = Math.hypot(x - s.p.x, z - s.p.z); if (d < 5.5) { const w = 1 - sm(s.elev > 1.9 ? 1.4 : 2.2, s.elev > 1.9 ? 4 : 5.5, d); h += (EY(s.elev) - h) * w; if (w > wm) wm = w; } }
    for (let i = 0; i < LAKES.length; i++) { const l = LAKES[i], dx = x - l.x, dz = z - l.z, u = (dx * l.c + dz * l.s) / l.rx, v = (-dx * l.s + dz * l.c) / l.rz, dn = Math.sqrt(u * u + v * v); if (dn < 1.7) { const w = 1 - sm(.95, 1.7, dn); h += (EY(l.e) - .4 - h) * w; if (w > wm) wm = w; } }
    lastW = wm; return h;
  }
  SITES.forEach(s => { s.p.y = H(s.p.x, s.p.z); if (s.id === 'rakhman' || s.id === 'yazevoe') s.p.y = EY(s.elev) - .1; });

  /* ---------- рендерер ---------- */
  const canvas = $('#gl');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const SKY = { now: 0xc4e4f4, future: 0xc6eeee };
  scene.background = new T.Color(SKY.now); scene.fog = new T.Fog(SKY.now, 220, 620);
  scene.add(new T.HemisphereLight(0xffffff, 0xa9c98a, .7));
  const sun = new T.DirectionalLight(0xfff2cf, .55); sun.position.set(-60, 110, 50); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0008; sun.shadow.normalBias = 1.1;
  function sunUpdate(x, y, z, size) { sun.position.set(x - 60, y + 110, z + 50); sun.target.position.set(x, y, z); sun.target.updateMatrixWorld(); const c = sun.shadow.camera; if (c.right !== size) { c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 10; c.far = 330; c.updateProjectionMatrix(); } }
  const camera = new T.PerspectiveCamera(40, 1, 1, 1500);
  const wcam = new T.PerspectiveCamera(58, 1, .1, 600); wcam.rotation.order = 'YXZ';
  const mapUps = [];

  /* ---------- жер бедері ---------- */
  (function terrain() {
    const X0 = -172, X1 = 172, Z0 = -84, Z1 = 84, nx = 215, nz = 105, dx = (X1 - X0) / nx, dz = (Z1 - Z0) / nz, n = (nx + 1) * (nz + 1);
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = [], c = new T.Color(), c2 = new T.Color();
    const P = { snow: 0xf4f8fb, rockA: 0xb7a488, rockB: 0xa59379, forA: 0x7fb866, forB: 0x72aa5c, meaA: 0xa9d67a, meaB: 0xb4dc86, stA: 0xd0e19a, stB: 0xdbe6a8, val: 0xbfe08e };
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = X0 + i * dx, z = Z0 + j * dz, h = H(x, z), w = lastW, m = fbm(x * .15, z * .15) - .5, k = (j * (nx + 1) + i) * 3;
      c.setHex(m > 0 ? P.stA : P.stB); c.lerp(c2.setHex(m > 0 ? P.meaA : P.meaB), sm(1.0, 1.7, h)); c.lerp(c2.setHex(m > 0 ? P.forA : P.forB), sm(3.2 + m * 2.4, 4.6 + m * 2.4, h)); c.lerp(c2.setHex(m > 0 ? P.rockA : P.rockB), sm(7.0 + m * 2, 8.4 + m * 2, h)); c.lerp(c2.setHex(P.snow), sm(10 + m * 2, 11.4 + m * 2, h));
      if (w > .3 && h < 7.5) c.lerp(c2.setHex(P.val), .55 * w);
      pos[k] = x; pos[k + 1] = h; pos[k + 2] = z; col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const tm = new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true })); tm.receiveShadow = true; tm.castShadow = true; tm.userData.keep = 1; scene.add(tm);
    const base = box(X1 - X0 + 2, 6, Z1 - Z0 + 2, 0x9c8a6e, 0, -3.3, 0); base.userData.nc = 1; scene.add(base);
  })();

  function ribbon(pts, wd, color, lift, basic) {
    const n = pts.length, pos = new Float32Array(n * 6), idx = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const c = pts[i], lx = c.x - tz * wd / 2, lz = c.z + tx * wd / 2, rx = c.x + tz * wd / 2, rz = c.z - tx * wd / 2;
      const y = Math.max(H(c.x, c.z), H(lx, lz), H(rx, rz)) + lift;
      pos.set([lx, y, lz, rx, y, rz], i * 6);
      if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new T.MeshLambertMaterial({ color, side: T.DoubleSide });
    const ms = new T.Mesh(g, m); ms.userData.nc = 1; ms.receiveShadow = true; scene.add(ms); return ms;
  }
  ribbon(BUKH, 1.1, 0x5fb0dc, .12); ribbon(BERR, .7, 0xe6f3fa, .14); ribbon(IRT, 1.6, 0x5fb0dc, .12);
  const roadMesh = ribbon(ROAD, .75, 0x66727f, .2); const ausMesh = ribbon(AUS, .5, 0xc9b48f, .2); ribbon(TRAIL, .28, 0xf0e2b8, .18);
  LAKES.forEach(l => { const m = K.lake(l.rx * 1.12, l.rz * 1.12, 0x5fb0dc); m.userData.nc = 1; m.receiveShadow = true; const g = G(m); g.position.set(l.x, EY(l.e) - .12, l.z); g.rotation.y = -l.rot; scene.add(g); });

  (function trees() {
    K.setSeed(4242); const N = 2600, geo = new T.ConeGeometry(.55, 1.7, 9), im = new T.InstancedMesh(geo, new T.MeshLambertMaterial(), N);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), c = new T.Color(); let n = 0, tries = 0;
    while (n < N && tries++ < 40000) {
      const x = K.R(-170, 170), z = K.R(-82, 82), h = H(x, z); if (h < 2 || h > 8.6 || lastW > .04 || fbm(x * .09, z * .09) < .4) continue;
      const s = K.R(.7, 1.5); m4.compose(new T.Vector3(x, h + .8 * s, z), q, new T.Vector3(s, s, s)); im.setMatrixAt(n, m4); im.setColorAt(n, c.setHex([0x3f8f52, 0x4a9a5a, 0x3a8650, 0x57a564][n % 4])); n++;
    }
    im.count = n; im.castShadow = true; im.userData.keep = 1; scene.add(im);
  })();
  for (let i = 0; i < 14; i++) { const c = at(K.cloud(), K.R(-170, 170), K.R(34, 48), K.R(-80, 80), 0, K.R(2.5, 5)); c.userData.v = K.R(1, 2.5); scene.add(c); mapUps.push(dt => { c.position.x += dt * c.userData.v; if (c.position.x > 190) c.position.x = -190; }); }

  /* ---------- нысан белгілері ---------- */
  const hitList = [], labels = [];
  const invis = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  function markerModel(id) {
    const m = {
      district: () => G(at(K.house({ wall: 0xfaf3dd, roof: 0x2f6fa8 }), 0, 0, 0), at(K.house({ roof: 0xb5432a }), -6, 0, 3, .5), at(K.house({ roof: 0x4d8b57 }), 6, 0, 2, -.4), at(K.flag(0x00afca, 7), 3.5, 0, 3), box(3, .1, 14, 0x59616b, -11, .05, -5), at(K.plane(mapUps), -11, 1.2, -5, 0, .6)),
      park: () => G(cyl(.3, .3, 5, 0x7a5230, -2.5, 2.5, 3), cyl(.3, .3, 5, 0x7a5230, 2.5, 2.5, 3), box(6.4, 1.1, .3, 0xffc93c, 0, 5, 3), at(K.pine(1.6), -5, 0, -1), at(K.pine(2), 5, 0, -2), at(K.pine(1.5), 0, 0, -5), at(K.deer(), 0, 0, 0, .5, 1.5)),
      berel: () => { const g = G(); [[-5, 0, 4], [3, -3, 5], [5, 4, 3]].forEach(k => { const s = sph(k[2], 0xa9b0a6, k[0], -k[2] * .35, k[1]); s.scale.y = .62; g.add(s); }); g.add(at(K.horse({ mask: true }), -1, 0, 5, .6, 1.4)); return g; },
      muztau: () => at(K.flag(0xe4572e, 6), 0, 0, 0),
      rakhman: () => G(at(K.boat(0xe4572e), 0, 0, 0, .6, 1.3), at(K.pine(1.4), -6, .3, -3), at(K.pine(1.2), 6, .3, 3)),
      kokkol: () => G(box(9, 9, 4, 0x77838f, 0, 4.5, -2), box(5, 8, 3, 0x6b7783, -6, 4, -2.5), box(5, 7, 3, 0x6b7783, 6, 3.5, -2.5), box(2.4, 9, .4, 0xffffff, 0, 4.5, .1), cyl(3, 3, .2, 0x7fd0f5, 0, .1, 2.5, 12)),
      yazevoe: () => G(at(K.tent(0xff7a3d), -5.5, .3, -1, 0, 1.6), at(K.boat(0x2f6fa8), 1, 0, 0, -.5, 1.2)),
      mine: () => G(box(7, 5, 4, 0x7a756e, 0, 2.5, -2), box(2.2, 2.6, .4, 0x15120f, 0, 1.3, .05), box(.4, 3, .4, 0x7a5230, -1.3, 1.5, .3), box(.4, 3, .4, 0x7a5230, 1.3, 1.5, .3), box(3.2, .4, .4, 0x7a5230, 0, 3, .3), box(1.6, 1, 2, 0x6b6f75, 0, .8, 3.2)),
      berelv: () => G(at(K.house({ wall: 0xa8743d, roof: 0x8e3b2a, log: true }), -4, 0, 0, .3), at(K.house({ roof: 0x4d8b57 }), 3, 0, -3, -.3), at(K.house({ wall: 0xdfeaf2, roof: 0xb5432a }), 4, 0, 4, .8)),
      korobikha: () => G(at(K.church(), 0, 0, -2, 0, .8), at(K.house({ wall: 0xa8743d, roof: 0x5a6b7a, log: true, frame: 0x2f8fd6 }), -6, 0, 2, .4), at(K.house({ wall: 0xa8743d, roof: 0x7a4a3a, log: true, frame: 0xe4572e }), 6, 0, 3, -.5)),
      sanatorium: () => G(at(K.house({ w: 9, d: 5, h: 4.4, rh: 2.2, wall: 0xfaf3dd, roof: 0x3d8b63 }), 0, 0, -2), cyl(2, 2, .2, 0x58d9e8, 0, .1, 4, 12), K.steam(mapUps, 6, 1).translateZ(4)),
      maral: () => G(at(K.fence(10), 0, 0, 5), at(K.fence(10), 0, 0, -5), at(K.fence(10), 5, 0, 0, 1.57), at(K.fence(10), -5, 0, 0, 1.57), at(K.deer(), -1, 0, 0, .7, 1.7), at(K.deer({ antlers: false, color: 0xb98550 }), 2, 0, 2, -.4, 1.3)),
      shyngystai: () => G(at(K.house({ wall: 0xf7efd8, roof: 0x7b4fa3 }), -2, 0, 0, .2), box(3, 3.8, .7, 0xe4572e, 4.5, 2.2, 1), box(2.6, 3.4, .75, 0xffffff, 4.6, 2.2, 1), box(.3, 3.8, .8, 0x8e2f3f, 3.1, 2.2, 1)),
      austria: () => { const g = G(at(K.jeep(0x4d8b57), 0, 0, 0, .8, 1.3), box(1.6, 2.6, .7, 0x9aa09a, -4, 1.3, 1)); for (let i = 0; i < 6; i++) g.add(box(1.2, .8, .9, 0xa9afa9, 3 + i * 1.25, .4, -3 + (i % 2) * .5)); return g; }
    };
    return (m[id] || m.district)();
  }
  const pins = [];
  SITES.forEach((s, i) => {
    const g = new T.Group(); g.position.set(s.p.x, s.p.y, s.p.z);
    const mdl = markerModel(s.id); mdl.scale.multiplyScalar(MS); g.add(mdl);
    const pin = G(sph(.62, s.color, 0, .95, 0), cone(.44, .95, s.color, 0, .3, 0, 8), sph(.26, 0xffffff, 0, .95, .5)); pin.children[1].rotation.x = Math.PI; pin.position.y = 4.3; g.add(pin); pins.push(pin);
    const hit = new T.Mesh(new T.SphereGeometry(2.7, 8, 6), invis); hit.position.y = 2; hit.userData.site = s.id; g.add(hit); hitList.push(hit);
    scene.add(g); s.g = g;
    addLabel(s.short, s.p.x, s.p.y + 6.6, s.p.z, 'site', s.color, () => selectSite(s.id), s.id);
  });
  mapUps.push((dt, t) => pins.forEach((p, i) => { p.position.y = (drive ? 3.2 : 4.3) + Math.sin(t * 2.2 + i) * .28; p.rotation.y += dt * 1.2; p.scale.setScalar(drive ? .5 : 1); }));

  function town(lat, lon, name, big, click) {
    const p = W(lat, lon), y = H(p.x, p.z), g = new T.Group(); g.position.set(p.x, y, p.z);
    if (big) { [[-2, 0, 3], [0, -1.4, 4.4], [1.8, .6, 2.6], [-.6, 1.8, 2], [3.2, -1.2, 1.8]].forEach((b, i) => g.add(box(1.3, b[2], 1.3, [0xf4f1ea, 0xdfeaf2, 0xffe0b8][i % 3], b[0], b[2] / 2, b[1]), box(1.34, .25, 1.34, 0xe4572e, b[0], b[2] + .1, b[1]))); const h = new T.Mesh(new T.SphereGeometry(4.5, 8, 6), invis); h.position.y = 2; h.userData.act = click; g.add(h); hitList.push(h); }
    else { const m = G(at(K.house({ roof: 0xb5432a }), -3, 0, 0, .3), at(K.house({ roof: 0x3d7ea6 }), 3, 0, 1.5, -.4)); m.scale.setScalar(MS * .8); g.add(m); }
    scene.add(g); addLabel(name, p.x, y + (big ? 7 : 2.6), p.z, big ? 'city' : 'town', null, click);
    return { x: p.x, y, z: p.z };
  }
  const OSK = town(49.95, 82.62, 'Өскемен', true, () => openRoutes());
  town(49.73, 84.27, 'Алтай қ.'); town(49.21, 84.51, 'Үлкен Нарын'); town(49.235, 86.33, 'Өрел');
  LAKES.forEach(l => { if (l.name) addLabel(l.name, l.x, EY(l.e) + 1, l.z, 'geo'); });
  [['РЕСЕЙ', 49.97, 85.9], ['ҚЫТАЙ', 48.95, 86.95], ['Бұқтырма өз.', 49.36, 85.25], ['Ертіс өз.', 49.86, 82.98]].forEach(n => { const p = W(n[1], n[2]); addLabel(n[0], p.x, H(p.x, p.z) + 1.5, p.z, n[0] === n[0].toUpperCase() ? 'country' : 'geo'); });

  function addLabel(text, x, y, z, cls, color, onClick, id) {
    const e = document.createElement(onClick ? 'button' : 'div'); e.className = 'lab lab-' + cls; e.textContent = text;
    if (color) e.style.setProperty('--c', color); if (onClick) e.addEventListener('click', onClick);
    $('#labels').appendChild(e); labels.push({ e, v: new T.Vector3(x, y, z), pr: cls === 'site' ? 0 : cls === 'city' ? 1 : 2, w: 0, id });
  }

  /* ---------- көліктер, бүгін және болашақ ---------- */
  const nowG = new T.Group(), futG = new T.Group(); futG.visible = false; scene.add(nowG, futG);
  const vehicles = [];
  function cum(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)); return c; }
  function vehicle(obj, pts, v, o) {
    o = o || {}; obj.scale.multiplyScalar(o.scale || MS); (o.group || nowG).add(obj);
    const vh = { obj, pts, cum: cum(pts), v, s: (o.phase || 0), dir: 1, lift: o.lift == null ? .25 : o.lift, air: o.air, group: o.group || nowG, key: o.key }; vh.L = vh.cum[vh.cum.length - 1]; vh.s *= vh.L; vehicles.push(vh); return vh;
  }
  function placeOn(vh) {
    const c = vh.cum, pts = vh.pts; let i = 1; while (i < c.length - 1 && c[i] < vh.s) i++;
    const a = pts[i - 1], b = pts[i], t = (vh.s - c[i - 1]) / (c[i] - c[i - 1] || 1), x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    const y = vh.air ? a.y + (b.y - a.y) * t : H(x, z) + vh.lift;
    vh.obj.position.set(x, y, z); vh.obj.rotation.y = Math.atan2((b.x - a.x) * vh.dir, (b.z - a.z) * vh.dir);
  }
  mapUps.push(dt => vehicles.forEach(vh => { if (!vh.group.visible) return; vh.s += vh.v * dt * vh.dir; if (vh.s > vh.L) { vh.s = vh.L; vh.dir = -1; } if (vh.s < 0) { vh.s = 0; vh.dir = 1; } placeOn(vh); }));
  const kat = byId.district.p; let iKat = 0, bd = 1e9; ROAD.forEach((p, i) => { const d = Math.hypot(p.x - kat.x, p.z - kat.z); if (d < bd) { bd = d; iKat = i; } });
  const AIR = []; for (let i = 0; i <= 40; i++) { const t = i / 40, x = OSK.x + (kat.x - 4.6 - OSK.x) * t, z = OSK.z + (kat.z + 2 - OSK.z) * t; AIR.push({ x, z, y: OSK.y + 2 + (kat.y + 1 - OSK.y - 2) * t + Math.sin(Math.PI * t) * 17 }); }
  const AIR2 = []; for (let i = 0; i <= 50; i++) { const t = i / 50, e = byId.berelv.p, x = OSK.x + (e.x - OSK.x) * t, z = OSK.z + 3 + (e.z - OSK.z - 3) * t; AIR2.push({ x, z, y: OSK.y + 2 + (e.y + 2 - OSK.y - 2) * t + Math.sin(Math.PI * t) * 13 }); }
  const VEH = {
    car: vehicle(K.car(0xe4572e), ROAD, 7, { key: 'car' }), bus: vehicle(K.bus(0xffc93c), ROAD.slice(0, iKat + 1), 5.5, { phase: .35, key: 'bus' }),
    plane: vehicle(K.plane(mapUps), AIR, 13, { air: true, scale: MS * .7, key: 'plane' }),
    future: vehicle(K.flyingCar(mapUps, 0xffffff), AIR2, 16, { air: true, group: futG, scale: MS * 1.3, key: 'future' })
  };
  vehicle(K.car(0x2f6fa8), ROAD, 6, { phase: .6 }); vehicle(K.jeep(0x4d8b57), AUS, 3, { phase: .2 }); vehicle(K.jeep(0xd9734e), ROAD.slice(iKat), 5, { phase: .5 });
  [0, .3, .62].forEach((ph, i) => vehicle(K.person([0xe4572e, 0xffc93c, 0x2f6fa8][i], { pack: 0x16324f }), TRAIL, .8, { phase: ph, scale: .75, lift: .1 }));
  [0, .3, .62].forEach((ph, i) => vehicle(K.person([0x16c79a, 0xffffff, 0xff7aa2][i], { pack: 0x16324f }), TRAIL, .8, { phase: ph + .1, scale: .75, lift: .1, group: futG }));
  vehicle(K.car(0xffffff, true), ROAD, 8, { group: futG, phase: .1 }); vehicle(K.car(0x9ff3ff, true), ROAD, 7, { group: futG, phase: .55 }); vehicle(K.bus(0x16c79a, true), ROAD.slice(0, iKat + 1), 6.5, { group: futG, phase: .3 }); vehicle(K.car(0xffffff, true), AUS, 3.5, { group: futG, phase: .4 });
  const LOOP = ['berel', 'yazevoe', 'kokkol', 'muztau', 'rakhman', 'berelv', 'berel'].map(id => ({ x: byId[id].p.x, z: byId[id].p.z, y: byId[id].p.y + (id === 'muztau' ? 4 : 7) }));
  vehicle(K.flyingCar(mapUps, 0xffc93c), LOOP, 9, { air: true, group: futG, scale: MS * 1.1 });
  vehicle(K.flyingCar(mapUps, 0x16c79a), AIR.map(p => ({ x: p.x, z: p.z + 3, y: p.y - 4 })), 12, { air: true, group: futG, scale: MS * 1.1, phase: .5 });
  (function futureDecor() {
    const put = (o, lat, lon, ry, s, dx, dz) => { const p = W(lat, lon); p.x += dx || 0; p.z += dz || 0; o.scale.multiplyScalar(s || MS); o.position.set(p.x, H(p.x, p.z), p.z); o.rotation.y = ry || 0; futG.add(o); };
    ['district', 'berelv', 'korobikha', 'shyngystai', 'sanatorium', 'maral'].forEach((id, i) => { const s = byId[id]; put(K.turbine(mapUps, 12), s.lat, s.lon, i, MS, 4.2, -3.2); put(K.turbine(mapUps, 10), s.lat, s.lon, i + 1, MS, 5.6, -1.6); put(K.solar(4, 3), s.lat, s.lon, .4, MS * .8, -4.4, 2.6); put(K.charger(), s.lat, s.lon, 0, MS * 1.5, 2.6, 3.4); });
    for (let i = 0; i < 7; i++) put(K.turbine(mapUps, 13), 49.045 + (i % 2) * .02, 85.2 + i * .07, i, MS);
    for (let i = 0; i < 5; i++) put(K.turbine(mapUps, 13), 49.33 + i * .035, 84.75 + (i % 2) * .05, i, MS);
    put(K.solar(6, 4), 49.24, 84.62, .3, MS * .9); put(K.solar(6, 4), 49.9, 82.78, .3, MS * .9); put(K.turbine(mapUps, 13), 49.9, 82.85, 0, MS); put(K.turbine(mapUps, 13), 49.92, 82.9, 0, MS);
    put(K.hydro(), 49.265, 85.72, .1, MS * .9); put(K.hydro(), 49.3, 86.47, .9, MS * .8);
    [20, 45, 70, 95, 120, 145].forEach(i => { const p = ROAD[i]; const c = K.charger(); c.scale.setScalar(MS * 1.5); c.position.set(p.x + .9, H(p.x + .9, p.z + .9), p.z + .9); futG.add(c); });
  })();

  function shadowize(o) { o.traverse(m => { if (m.isMesh && !m.userData.nc && !m.userData.keep && m.material !== invis && !m.material.transparent && !m.material.isMeshBasicMaterial) m.castShadow = true; }); }
  shadowize(scene);

  /* ---------- камера ---------- */
  const cam = { tx: -30, tz: 0, d: 250, az: 0, pol: .78, ty: 2 };
  let fly = null, follow = null;
  function flyTo(x, z, d, sec) { fly = { fx: cam.tx, fz: cam.tz, fd: cam.d, x, z, d: d || cam.d, k: 0, sec: sec || 1.4 }; }
  function camUpdate(dt) {
    if (fly) { fly.k = Math.min(1, fly.k + dt / fly.sec); const e = fly.k * fly.k * (3 - 2 * fly.k); cam.tx = fly.fx + (fly.x - fly.fx) * e; cam.tz = fly.fz + (fly.z - fly.fz) * e; cam.d = fly.fd + (fly.d - fly.fd) * e; if (fly.k >= 1) fly = null; }
    else if (follow) { const p = follow.position; cam.tx += (p.x - cam.tx) * Math.min(1, dt * 3); cam.tz += (p.z - cam.tz) * Math.min(1, dt * 3); }
    cam.tx = Math.max(-168, Math.min(168, cam.tx)); cam.tz = Math.max(-82, Math.min(82, cam.tz)); cam.d = Math.max(16, Math.min(330, cam.d)); cam.pol = Math.max(.2, Math.min(1.32, cam.pol));
    cam.ty += (H(cam.tx, cam.tz) - cam.ty) * Math.min(1, dt * 4);
    const sp = Math.sin(cam.pol), x = cam.tx + cam.d * sp * Math.sin(cam.az), z = cam.tz + cam.d * sp * Math.cos(cam.az); let y = cam.ty + cam.d * Math.cos(cam.pol);
    if (Math.abs(x) < 172 && Math.abs(z) < 84) y = Math.max(y, H(x, z) + 2.5);
    camera.position.set(x, y, z); camera.lookAt(cam.tx, cam.ty, cam.tz);
    sunUpdate(cam.tx, cam.ty, cam.tz, Math.round(Math.max(30, Math.min(150, cam.d * .55)) / 10) * 10);
  }

  /* ---------- дыбыс ---------- */
  const au = new Audio(); let soundOn = true, auCb = null, auTimer = null, curKey = null;
  function say(key, cb) {
    stopSay(); auCb = cb || null;
    if (!soundOn) { if (cb) auTimer = setTimeout(fin, 7000); return; }
    curKey = key; au.src = 'audio/' + key + '.mp3'; const pr = au.play(); if (pr && pr.catch) pr.catch(() => { curKey = null; syncSay(); if (auCb) auTimer = setTimeout(fin, 7000); });
    syncSay();
  }
  function fin() { const cb = auCb; auCb = null; curKey = null; syncSay(); if (cb) cb(); }
  function stopSay() { try { au.pause(); } catch (e) { } clearTimeout(auTimer); auCb = null; curKey = null; syncSay(); }
  au.addEventListener('ended', fin); au.addEventListener('error', () => { if (curKey) { curKey = null; syncSay(); if (auCb) auTimer = setTimeout(fin, 7000); } });
  function syncSay() { document.querySelectorAll('[data-say]').forEach(b => { const on = b.dataset.say === curKey; b.classList.toggle('on', on); b.textContent = on ? 'Тоқтату' : (b.dataset.label || 'Тыңдау'); }); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (!b) return; if (curKey === b.dataset.say) stopSay(); else { if (!soundOn) setSound(true); say(b.dataset.say); } });
  function setSound(v) { soundOn = v; const b = $('#btn-sound'); b.textContent = v ? 'Дыбыс: қосулы' : 'Дыбыс: өшірулі'; b.setAttribute('aria-pressed', v); if (!v) { const cb = auCb; stopSay(); if (cb) { auCb = cb; auTimer = setTimeout(fin, 7000); } } }

  /* ---------- интерфейс ---------- */
  let era = 'now', mode = 'map', curSite = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function photoHtml(ph) { const c = CR[ph[0]]; return '<figure><img src="img/' + ph[0] + '.jpg" alt="' + esc(ph[1]) + '" loading="lazy"><figcaption><b>' + esc(ph[1]) + '</b>' + (c ? '<span>Фото: ' + esc(c.a || 'Wikimedia Commons') + ' · ' + esc(c.l) + ' · Wikimedia Commons</span>' : '') + '</figcaption></figure>'; }
  function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, ms || 5000); }
  function closePanels() { $('#panel').hidden = true; $('#routes').hidden = true; $('#list').hidden = true; }

  function renderSite(s) {
    const p = $('#panel'); p.style.setProperty('--c', s.color);
    let h = '<header class="p-head"><div><span class="p-type">' + esc(s.type) + '</span><h2>' + esc(s.name) + '</h2></div><button class="x" data-close aria-label="Жабу">✕</button></header><div class="p-body">';
    h += '<div class="gal">' + s.photos.map(photoHtml).join('') + '</div>';
    h += '<div class="acts"><button class="btn" data-say="' + s.id + '">Тыңдау</button><button class="btn primary" data-enter>Ішіне кіру</button></div>';
    h += '<p class="desc">' + esc(s.desc) + '</p><ul class="facts">' + s.facts.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>';
    if (s.person) h += '<section class="person"><img class="ava" alt="' + esc(s.person.name) + '" src="' + K.portraitTex(s.person.name, s.person.years).toDataURL() + '"><div><h3>' + esc(s.person.name) + ' <small>' + s.person.years + '</small></h3><p>' + esc(s.person.bio) + '</p><p class="works"><b>Шығармалары:</b> ' + s.person.works.map(w => '«' + esc(w) + '»').join(', ') + '</p></div></section>';
    h += '<h3 class="sub">Ішінде не бар</h3><div class="hots">' + s.hots.map((x, i) => '<button data-hot="' + i + '">' + esc(x.t) + '</button>').join('') + '</div>';
    if (era === 'future') h += '<section class="fut"><h3>Болашақта</h3><p>' + esc(s.future) + '</p><button class="btn" data-say="' + s.id + '_f">Тыңдау</button></section>';
    h += '</div>'; p.innerHTML = h; p.hidden = false; p.scrollTop = 0; syncSay();
  }
  $('#panel').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { $('#panel').hidden = true; curSite = null; return; }
    if (e.target.closest('[data-enter]')) return enter(curSite);
    const hb = e.target.closest('[data-hot]'); if (hb) enter(curSite, +hb.dataset.hot);
  });
  function selectSite(id, noFly) {
    if (mode !== 'map') return; const s = byId[id]; curSite = s; $('#routes').hidden = true; $('#list').hidden = true; follow = null;
    renderSite(s); if (!noFly) flyTo(s.p.x, s.p.z, 46, 1.3);
    labels.forEach(l => l.e.classList.toggle('sel', l.id === id));
  }

  let curRoute = 'car';
  function openRoutes(k) {
    if (mode !== 'map') return; if (tour) endTour();
    closePanels(); curSite = null; curRoute = k || (era === 'future' ? 'future' : (curRoute === 'future' ? 'car' : curRoute));
    const keys = era === 'future' ? ['future', 'car', 'bus', 'plane'] : ['car', 'bus', 'plane']; const r = D.routes[curRoute];
    let h = '<header class="p-head"><div><span class="p-type">Маршрут</span><h2>Өскемен – Катонқарағай – Берел</h2></div><button class="x" data-close aria-label="Жабу">✕</button></header><div class="p-body">';
    h += '<div class="tabs" role="tablist">' + keys.map(x => '<button role="tab" aria-selected="' + (x === curRoute) + '" data-route="' + x + '">' + esc(D.routes[x].name) + '</button>').join('') + '</div>';
    h += '<ol class="stops">' + D.stops.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
    h += '<div class="stat"><div><b>' + esc(r.stat[0]) + '</b><span>қашықтық</span></div><div><b>' + esc(r.stat[1]) + '</b><span>жол уақыты</span></div></div>';
    h += '<p class="desc">' + esc(r.text) + '</p><div class="acts"><button class="btn" data-say="route_' + curRoute + '">Тыңдау</button><button class="btn primary" data-track>Картадан бақылау</button></div>';
    h += '<h3 class="sub">Саяхатшыға кеңес</h3><ul class="tips">' + D.tips.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><div class="acts"><button class="btn" data-say="tips">Тыңдау</button></div>';
    h += '<div class="gal">' + photoHtml(['oskemen1', 'Өскемен қаласы']) + photoHtml(['road1', 'Катонқарағай жолы']) + '</div></div>';
    const p = $('#routes'); p.innerHTML = h; p.hidden = false; syncSay();
    if (era === 'now' && curRoute === 'future') toast('Ұшатын электрокар «Болашақ» режимінде көрінеді.');
  }
  $('#routes').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { $('#routes').hidden = true; follow = null; return; }
    const rb = e.target.closest('[data-route]'); if (rb) return openRoutes(rb.dataset.route);
    if (e.target.closest('[data-track]')) { endDrive(); let v = VEH[curRoute]; if (era === 'future' && curRoute !== 'future') v = VEH.future; if (!v.group.visible) v = VEH.car; follow = v.obj; fly = null; cam.d = 60; toast('Камера көлікпен бірге жүреді. Картаны сүйресеңіз, бақылау тоқтайды.'); }
  });

  (function listPanel() {
    let h = '<header class="p-head"><div><span class="p-type">14 нысан</span><h2>Туристік нысандар</h2></div><button class="x" data-close aria-label="Жабу">✕</button></header><div class="p-body"><div class="grid">';
    h += SITES.map(s => '<button data-site="' + s.id + '" style="--c:' + s.color + '"><i></i><span>' + esc(s.name) + '</span></button>').join('');
    h += '</div><p class="note">Фотосуреттер: Wikimedia Commons, авторлары әр суреттің астында көрсетілген. Дыбыстау: қазақ тіліндегі нейрондық дауыс.</p></div>';
    const p = $('#list'); p.innerHTML = h;
    p.addEventListener('click', e => { if (e.target.closest('[data-close]')) { p.hidden = true; return; } const b = e.target.closest('[data-site]'); if (b) selectSite(b.dataset.site); });
  })();
  $('#btn-list').addEventListener('click', () => { if (mode !== 'map') exitWalk(); const o = $('#list').hidden; closePanels(); $('#list').hidden = !o; });
  $('#btn-routes').addEventListener('click', () => { if (mode !== 'map') exitWalk(); if (!$('#routes').hidden) { $('#routes').hidden = true; return; } openRoutes(); });
  $('#btn-tour').addEventListener('click', () => { if (mode !== 'map') exitWalk(); tour ? endTour() : startTour(); });
  $('#btn-sound').addEventListener('click', () => setSound(!soundOn));
  document.querySelectorAll('[data-era]').forEach(b => b.addEventListener('click', () => setEra(b.dataset.era)));
  $('#zin').addEventListener('click', () => { cam.d *= .75; }); $('#zout').addEventListener('click', () => { cam.d *= 1.33; });
  $('#rl').addEventListener('click', () => { cam.az -= .4; }); $('#rr').addEventListener('click', () => { cam.az += .4; });
  $('#home').addEventListener('click', () => { follow = null; cam.az = 0; cam.pol = .78; flyTo(102, -12, 135); });

  function setEra(e) {
    if (e === era) return; era = e; document.documentElement.dataset.era = e;
    document.querySelectorAll('[data-era]').forEach(b => b.setAttribute('aria-pressed', b.dataset.era === e));
    nowG.visible = e === 'now'; futG.visible = e === 'future';
    scene.background.setHex(SKY[e]); scene.fog.color.setHex(SKY[e]);
    roadMesh.material.color.setHex(e === 'future' ? 0x3d4b5e : 0x66727f); ausMesh.material.color.setHex(e === 'future' ? 0x7d8794 : 0xc9b48f); if (drive) driveObj();
    $('#btn-tour').textContent = tour ? 'Экскурсияны аяқтау' : tourLabel();
    if (tour) { const paused = tour.paused, i = tour.i; endTour(); startTour(i, paused); }
    if (mode === 'walk') rebuildWalk(); else if (curSite && !$('#panel').hidden) renderSite(curSite); else if (!$('#routes').hidden) openRoutes();
    if (e === 'future') { toast(D.futureIntro, 9000); if (!tour && mode === 'map') say('futureIntro'); } else toast('Бүгінгі Катонқарағай: туристер көлікпен, автобуспен, ұшақпен келеді.');
  }
  const tourLabel = () => era === 'future' ? 'Ұшатын электрокармен экскурсия' : 'Экскурсия';

  /* ---------- экскурсия ---------- */
  const TOUR = ['district', 'maral', 'shyngystai', 'austria', 'berel', 'berelv', 'sanatorium', 'rakhman', 'yazevoe', 'kokkol', 'mine', 'muztau', 'park', 'korobikha'];
  let tour = null;
  function startTour(i0, paused) {
    endDrive(); closePanels(); stopSay(); const futr = era === 'future';
    const obj = futr ? K.flyingCar(mapUps, 0xffc93c) : K.jeep(0xe4572e); obj.scale.setScalar(MS * (futr ? 1.5 : 1.25)); shadowize(obj); scene.add(obj);
    tour = { obj, i: i0 || 0, phase: 'stop', paused: !!paused, futr, k: 0 };
    const s = byId[TOUR[tour.i]]; obj.position.set(s.p.x + 2.4, s.p.y + (futr ? 3 : .3), s.p.z + 2.4);
    follow = obj; fly = null; cam.d = 52; $('#tourbar').hidden = false; $('#btn-tour').textContent = 'Экскурсияны аяқтау'; arrive();
  }
  function arrive() {
    if (!tour) return; tour.phase = 'stop'; const s = byId[TOUR[tour.i]]; selectSite(s.id, true); follow = tour.obj; tourUI();
    if (!tour.paused) say(s.id, () => { if (tour && !tour.paused && mode === 'map') setTimeout(() => { if (tour && !tour.paused && tour.phase === 'stop') nextStop(); }, 900); });
  }
  function nextStop() {
    if (!tour) return; stopSay(); if (tour.i >= TOUR.length - 1) { toast('Экскурсия аяқталды. Катонқарағайға келіңіз!'); return endTour(); }
    const a = tour.obj.position, s = byId[TOUR[++tour.i]]; tour.from = { x: a.x, y: a.y, z: a.z }; tour.to = { x: s.p.x + 2.4, y: s.p.y + (tour.futr ? 3 : .3), z: s.p.z + 2.4 };
    tour.dist = Math.hypot(tour.to.x - a.x, tour.to.z - a.z); tour.k = 0; tour.phase = 'move'; follow = tour.obj; $('#panel').hidden = true; tourUI(); toast('Келесі аялдама: ' + s.name, 3500);
  }
  function endTour() { if (!tour) return; scene.remove(tour.obj); tour = null; follow = null; stopSay(); $('#tourbar').hidden = true; $('#btn-tour').textContent = tourLabel(); }
  function tourUI() { const s = byId[TOUR[tour.i]]; $('#tour-txt').textContent = (tour.i + 1) + ' / ' + TOUR.length + ' · ' + (tour.phase === 'move' ? 'Жолда: ' : '') + s.short; $('#tour-pause').textContent = tour.paused ? 'Жалғастыру' : 'Кідірту'; }
  $('#tour-pause').addEventListener('click', () => { if (!tour) return; tour.paused = !tour.paused; if (tour.paused) stopSay(); else if (tour.phase === 'stop') arrive(); tourUI(); });
  $('#tour-next').addEventListener('click', () => { if (tour) { tour.paused = false; if (tour.phase === 'move') { tour.k = 1; } else nextStop(); } });
  $('#tour-end').addEventListener('click', endTour);
  mapUps.push((dt, t) => {
    if (!tour) return; const o = tour.obj;
    if (tour.phase === 'move' && !tour.paused) {
      tour.k = Math.min(1, tour.k + dt * (tour.futr ? 30 : 20) / Math.max(tour.dist, 1)); const e = tour.k * tour.k * (3 - 2 * tour.k), x = tour.from.x + (tour.to.x - tour.from.x) * e, z = tour.from.z + (tour.to.z - tour.from.z) * e;
      const g = H(x, z), y = tour.futr ? Math.max(g + 4, tour.from.y + (tour.to.y - tour.from.y) * e + Math.sin(Math.PI * e) * 9) : g + .3;
      o.position.set(x, y, z); o.rotation.y = Math.atan2(tour.to.x - tour.from.x, tour.to.z - tour.from.z);
      if (tour.k >= 1) arrive();
    } else if (tour.futr) o.position.y += Math.sin(t * 2) * .004;
  });

  /* ---------- көлікті өзіңіз жүргізу ---------- */
  const keys = {}; let drive = null; const camPos = new T.Vector3();
  function driveObj() {
    if (drive.obj) scene.remove(drive.obj); const f = era === 'future';
    const o = f ? K.flyingCar(mapUps, 0xffffff) : K.jeep(0xf4f6f8); o.scale.setScalar(MS * 1.5); o.rotation.order = 'YXZ'; shadowize(o); scene.add(o); drive.obj = o;
    if (!f) drive.fly = false; $('#drive-fly').hidden = !f; $('#drive-fly').textContent = drive.fly ? 'Жерге қону' : 'Ұшу';
  }
  function startDrive() {
    if (mode !== 'map') exitWalk(); if (tour) endTour(); closePanels(); stopSay(); follow = null; fly = null;
    const p = byId.district.p; drive = { x: p.x + 2.5, z: p.z + 4.2, yaw: Math.PI / 2, v: 0, alt: 0, pitch: 0, near: null, fly: false }; driveObj();
    camPos.set(drive.x - 14, H(drive.x, drive.z) + 8, drive.z);
    document.documentElement.dataset.drive = '1'; $('#drivehud').hidden = false; $('#drivenear').hidden = true; $('#mapctl').hidden = true; $('#btn-drive').textContent = 'Жүргізуді аяқтау';
    toast('Көлікті W, A, S, D пернелерімен немесе бағыттағыштармен жүргізіңіз. Нысанға жақындасаңыз, экскурсия өзі басталады.', 7000);
  }
  function endDrive() {
    if (!drive) return; scene.remove(drive.obj); cam.tx = drive.x; cam.tz = drive.z; cam.d = 70; drive = null; stopSay();
    delete document.documentElement.dataset.drive; $('#drivehud').hidden = true; $('#mapctl').hidden = false; $('#btn-drive').textContent = 'Көлік жүргізу';
  }
  function driveUpdate(dt) {
    const d = drive; let acc = 0, st = 0;
    if (keys.w || keys.arrowup || keys['ц']) acc += 1; if (keys.s || keys.arrowdown || keys['ы']) acc -= 1; if (keys.a || keys.arrowleft || keys['ф']) st += 1; if (keys.d || keys.arrowright || keys['в']) st -= 1;
    const vmax = d.fly ? 24 : 15;
    if (acc > 0) d.v = Math.min(vmax, d.v + dt * 13); else if (acc < 0) d.v = Math.max(-6, d.v - dt * 18); else d.v *= Math.max(0, 1 - dt * 1.6);
    if (Math.abs(d.v) > .3) d.yaw += st * dt * 1.8 * (d.v > 0 ? 1 : -1) * Math.min(1, Math.abs(d.v) / 4);
    const fx = Math.sin(d.yaw), fz = Math.cos(d.yaw); d.x = Math.max(-166, Math.min(166, d.x + fx * d.v * dt)); d.z = Math.max(-80, Math.min(80, d.z + fz * d.v * dt));
    const g = H(d.x, d.z); d.alt += ((d.fly ? 5 : (era === 'future' ? .5 : 0)) - d.alt) * Math.min(1, dt * 2); const y = g + .3 + d.alt;
    const tp = d.fly ? d.v * .012 : -Math.atan2(H(d.x + fx * 1.5, d.z + fz * 1.5) - H(d.x - fx * 1.5, d.z - fz * 1.5), 3); d.pitch += (tp - d.pitch) * Math.min(1, dt * 6);
    d.obj.position.set(d.x, y, d.z); d.obj.rotation.set(d.pitch, d.yaw, 0);
    const cx = d.x - fx * 13, cz = d.z - fz * 13; camPos.lerp(pv.set(cx, y + 6.5, cz), Math.min(1, dt * 3.5)); if (Math.abs(camPos.x) < 172 && Math.abs(camPos.z) < 84) camPos.y = Math.max(camPos.y, H(camPos.x, camPos.z) + 2);
    camera.position.copy(camPos); camera.lookAt(d.x + fx * 5, y + 1.2, d.z + fz * 5); cam.tx = d.x; cam.tz = d.z; cam.d = 40; sunUpdate(d.x, y, d.z, 40);
    let best = null, bd = 1e9; SITES.forEach(s => { const q = Math.hypot(s.p.x - d.x, s.p.z - d.z); if (q < bd) { bd = q; best = s; } });
    const rad = best.id === 'muztau' ? 12 : 7.5;
    if (bd < rad && d.near !== best) { d.near = best; $('#drive-txt').textContent = best.name; $('#drive-say').dataset.say = best.id; $('#drivenear').hidden = false; say(best.id); }
    else if (d.near && Math.hypot(d.near.p.x - d.x, d.near.p.z - d.z) > rad + 4) { d.near = null; $('#drivenear').hidden = true; }
  }
  $('#btn-drive').addEventListener('click', () => { drive ? endDrive() : startDrive(); });
  $('#drive-end').addEventListener('click', endDrive);
  $('#drive-fly').addEventListener('click', () => { if (drive) { drive.fly = !drive.fly; $('#drive-fly').textContent = drive.fly ? 'Жерге қону' : 'Ұшу'; } });
  $('#drive-open').addEventListener('click', () => { if (drive && drive.near) selectSite(drive.near.id, true); });
  $('#drive-enter').addEventListener('click', () => { if (drive && drive.near) { curSite = drive.near; enter(drive.near); } });

  /* ---------- нысан ішінде серуендеу ---------- */
  let WK = null;
  function enter(site, hi) {
    if (!site) return; stopSay(); if (tour) { tour.paused = true; tourUI(); }
    mode = 'walk'; document.documentElement.dataset.mode = 'walk'; closePanels();
    WK = window.buildScene(site, era); WK.site = site; WK.x = WK.start[0]; WK.z = WK.start[1]; WK.yaw = WK.start[2]; WK.pitch = -.08; WK.act = -1; WK.t = 0;
    $('#walk-title').textContent = site.name; $('#walk-chips').innerHTML = site.hots.map((x, i) => '<button data-hot="' + i + '">' + esc(x.t) + '</button>').join('');
    $('#walkhud').hidden = false; $('#card').hidden = true; $('#labels').hidden = true; $('#mapctl').hidden = true; $('#tourbar').hidden = true; $('#drivehud').hidden = true;
    if (hi != null) openHot(hi); else toast('Сүйреп айналаңызға қараңыз, бағыттағыштармен жүріңіз. Сары белгісі бар затты басыңыз.', 6000);
  }
  function rebuildWalk() { const o = WK; WK = window.buildScene(o.site, era); ['site', 'x', 'z', 'yaw', 'pitch', 't'].forEach(k => WK[k] = o[k]); WK.act = -1; $('#card').hidden = true; }
  function exitWalk() {
    if (mode !== 'walk') return; stopSay(); mode = 'map'; document.documentElement.dataset.mode = 'map'; const s = WK.site; WK = null;
    $('#walkhud').hidden = true; $('#card').hidden = true; $('#labels').hidden = false; $('#mapctl').hidden = !!drive; if (tour) { $('#tourbar').hidden = false; follow = tour.obj; }
    if (drive) { $('#drivehud').hidden = false; return; }
    selectSite(s.id, !!tour);
  }
  $('#walk-back').addEventListener('click', exitWalk);
  $('#walk-chips').addEventListener('click', e => { const b = e.target.closest('[data-hot]'); if (b) openHot(+b.dataset.hot); });
  function openHot(i) {
    const h = WK.hots[i], d = WK.site.hots[i]; if (!h) return; WK.act = i;
    const hx = h.g.position.x, hz = h.g.position.z; let dx = WK.x - hx, dz = WK.z - hz; const l = Math.hypot(dx, dz) || 1; const want = Math.max(5.5, h.top * 1.5);
    WK.goal = { x: hx + dx / l * want, z: hz + dz / l * want, yaw: Math.atan2(dx, dz), k: 0, fx: WK.x, fz: WK.z, fy: WK.yaw, fp: WK.pitch, pitch: Math.atan2(h.top * .55 - 1.7, want) };
    let dy = WK.goal.yaw - WK.yaw; while (dy > Math.PI) dy -= 6.2832; while (dy < -Math.PI) dy += 6.2832; WK.goal.yaw = WK.yaw + dy;
    const c = $('#card'); const cr = d.img && CR[d.img];
    c.innerHTML = '<button class="x" data-close aria-label="Жабу">✕</button>' + (d.img ? '<img src="img/' + d.img + '.jpg" alt="' + esc(d.t) + '">' : '') + '<div><h3>' + esc(d.t) + '</h3><p>' + esc(d.x) + '</p>' + (cr ? '<small>Фото: ' + esc(cr.a) + ' · ' + esc(cr.l) + ' · Wikimedia Commons</small>' : '') + '<button class="btn" data-say="' + WK.site.id + '_' + i + '">Тыңдау</button></div>';
    c.hidden = false; document.querySelectorAll('#walk-chips button').forEach((b, k) => b.classList.toggle('on', k === i));
    say(WK.site.id + '_' + i);
  }
  $('#card').addEventListener('click', e => { if (e.target.closest('[data-close]')) { $('#card').hidden = true; stopSay(); if (WK) { WK.act = -1; document.querySelectorAll('#walk-chips button').forEach(b => b.classList.remove('on')); } } });
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === 'Escape') { if (mode === 'walk') exitWalk(); else closePanels(); } });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  document.querySelectorAll('#dpad button').forEach(b => { const k = b.dataset.k, on = e => { e.preventDefault(); keys[k] = true; }, off = () => { keys[k] = false; }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); });
  function walkUpdate(dt) {
    const w = WK; w.t += dt;
    if (w.goal) { const g = w.goal; g.k = Math.min(1, g.k + dt / .9); const e = g.k * g.k * (3 - 2 * g.k); w.x = g.fx + (g.x - g.fx) * e; w.z = g.fz + (g.z - g.fz) * e; w.yaw = g.fy + (g.yaw - g.fy) * e; w.pitch = g.fp + (g.pitch - g.fp) * e; if (g.k >= 1) w.goal = null; }
    let f = 0, s = 0, r = 0; if (keys.w || keys.arrowup || keys['ц']) f += 1; if (keys.s || keys.arrowdown || keys['ы']) f -= 1; if (keys.a || keys['ф']) s -= 1; if (keys.d || keys['в']) s += 1; if (keys.arrowleft) r += 1; if (keys.arrowright) r -= 1;
    if (f || s || r) { w.goal = null; w.yaw += r * dt * 1.8; const sp = 8 * dt, sn = Math.sin(w.yaw), cs = Math.cos(w.yaw); w.x += (-sn * f + cs * s) * sp; w.z += (-cs * f - sn * s) * sp; }
    const b = w.bounds; if (b.hx) { w.x = Math.max(-b.hx, Math.min(b.hx, w.x)); w.z = Math.max(-b.hz, Math.min(b.hz, w.z)); } else { const l = Math.hypot(w.x, w.z); if (l > b.r) { w.x *= b.r / l; w.z *= b.r / l; } }
    wcam.position.set(w.x, 1.7 + (f ? Math.sin(w.t * 9) * .05 : 0), w.z); wcam.rotation.y = w.yaw; wcam.rotation.x = w.pitch;
    w.ups.forEach(u => u(dt, w.t));
    w.hots.forEach((h, i) => { if (!h) return; const on = i === w.act; const ty = h.baseY + (on ? .35 : 0), tr = h.baseRy + (on ? Math.sin(w.t * 1.6) * .45 : 0); h.obj.position.y += (ty - h.obj.position.y) * Math.min(1, dt * 6); h.obj.rotation.y += (tr - h.obj.rotation.y) * Math.min(1, dt * 6); h.mk.visible = !on; });
  }

  /* ---------- басқару (тінтуір, саусақ) ---------- */
  const ptr = new Map(); let moved = 0, pinch = null; const ray = new T.Raycaster(), v2 = new T.Vector2();
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button }); if (ptr.size === 1) moved = 0; pinch = null; });
  canvas.addEventListener('pointermove', e => {
    const p = ptr.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (ptr.size === 1) {
      if (mode === 'map' && drive) return;
      if (mode === 'walk') { WK.goal = null; WK.yaw += dx * .0045; WK.pitch = Math.max(-1.2, Math.min(1.2, WK.pitch + dy * .0035)); return; }
      if (moved > 6) { fly = null; if (!tour || tour.phase === 'stop') follow = null; }
      if (p.b === 2 || e.shiftKey) { cam.az -= dx * .006; cam.pol -= dy * .005; }
      else { const k = cam.d * .0017, ca = Math.cos(cam.az), sa = Math.sin(cam.az); cam.tx -= (ca * dx + sa * dy) * k; cam.tz -= (-sa * dx + ca * dy) * k; }
    } else if (ptr.size === 2 && mode === 'map') {
      const a = [...ptr.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), an = Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x);
      if (pinch) { cam.d *= pinch.d / d; let da = an - pinch.an; if (da > 3) da -= 6.2832; if (da < -3) da += 6.2832; cam.az -= da; } pinch = { d, an }; fly = null;
    }
  });
  function up(e) { const p = ptr.get(e.pointerId); ptr.delete(e.pointerId); pinch = null; if (p && ptr.size === 0 && moved < 7) click(e.clientX, e.clientY); }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', e => { ptr.delete(e.pointerId); pinch = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (mode === 'map') { cam.d *= Math.exp(e.deltaY * .0012); fly = null; } }, { passive: false });
  function click(cx, cy) {
    const r = canvas.getBoundingClientRect(); v2.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
    if (mode === 'map') { ray.setFromCamera(v2, camera); const h = ray.intersectObjects(hitList)[0]; if (h) { const u = h.object.userData; if (u.site) { if (tour) { tour.paused = true; tourUI(); } selectSite(u.site); } else if (u.act) u.act(); } }
    else { ray.setFromCamera(v2, wcam); const hs = ray.intersectObjects(WK.sc.children, true); for (let i = 0; i < hs.length; i++) { const u = hs[i].object.userData; if (u.hot != null) { openHot(u.hot); return; } } }
  }

  /* ---------- цикл ---------- */
  const pv = new T.Vector3(); let frameN = 0;
  function updateLabels(wd, hg) {
    frameN++; const placed = [];
    const zoomFar = cam.d > 200;
    labels.forEach(l => {
      pv.copy(l.v).project(camera); const vis = pv.z < 1 && pv.z > -1 && Math.abs(pv.x) < 1.1 && Math.abs(pv.y) < 1.1 && !(zoomFar && l.pr === 2 && !l.e.classList.contains('lab-country'));
      if (!vis) { l.show = false; return; } l.sx = (pv.x * .5 + .5) * wd; l.sy = (-pv.y * .5 + .5) * hg; l.show = true; if (!l.w || frameN % 90 === 0) { l.w = l.e.offsetWidth || 80; l.h = l.e.offsetHeight || 22; }
    });
    labels.slice().sort((a, b) => (a.e.classList.contains('sel') ? -1 : a.pr) - (b.e.classList.contains('sel') ? -1 : b.pr)).forEach(l => {
      if (l.show) { const r = [l.sx - l.w / 2, l.sy - l.h, l.sx + l.w / 2, l.sy]; if (placed.some(q => r[0] < q[2] + 4 && r[2] > q[0] - 4 && r[1] < q[3] + 2 && r[3] > q[1] - 2)) l.show = false; else placed.push(r); }
      if (l.show) { l.e.style.transform = 'translate(' + Math.round(l.sx - l.w / 2) + 'px,' + Math.round(l.sy - l.h) + 'px)'; l.e.style.visibility = 'visible'; } else l.e.style.visibility = 'hidden';
    });
  }
  let last = performance.now(), time = 0, cw = 0, ch = 0;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w && h && (w !== cw || h !== ch)) { cw = w; ch = h; renderer.setSize(w, h, false); camera.aspect = wcam.aspect = w / h; camera.fov = w < h ? 52 : 40; camera.updateProjectionMatrix(); wcam.updateProjectionMatrix(); }
    if (mode === 'map') { mapUps.forEach(u => u(dt, time)); if (drive) driveUpdate(dt); else camUpdate(dt); renderer.render(scene, camera); updateLabels(w, h); }
    else { walkUpdate(dt); renderer.render(WK.sc, wcam); }
    requestAnimationFrame(frame);
  }
  vehicles.forEach(placeOn); camUpdate(.016);
  requestAnimationFrame(frame);

  $('#start').addEventListener('click', () => { $('#intro').hidden = true; say('welcome'); flyTo(102, -12, 135, 3.2); });
  window.KT = { selectSite, enter, setEra, startTour, startDrive, openRoutes, cam, H, keys };
})();
