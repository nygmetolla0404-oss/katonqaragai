/* Әр нысанның ішкі 3D көрінісі (аралап жүруге болады) */
(function () {
  'use strict';
  const K = window.K, T = K.T;
  const { box, cyl, cone, sph, G, at, R, mesh } = K;
  const HTTP = location.protocol !== 'file:';
  const invis = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  window.buildScene = function (site, era) {
    const sc = new T.Scene(), ups = [], hots = [];
    const ctx = { sc, ups, hots, era, fut: era === 'future', bounds: { r: 27 }, start: [0, 15, 0] };
    K.setSeed(site.id.length * 97 + 13);

    ctx.env = function (o) {
      const sky = new T.Color(ctx.fut ? (o.fsky || 0xa6e8f5) : (o.sky || 0x9fd8ff));
      sc.background = sky; sc.fog = new T.Fog(sky, o.interior ? 200 : 70, o.interior ? 400 : 260);
      sc.add(new T.HemisphereLight(0xffffff, o.ground || 0x79c267, o.interior ? .72 : .62));
      const d = new T.DirectionalLight(0xfff4d6, o.interior ? .35 : .6); d.position.set(30, 50, 25); sc.add(d); if (!o.interior) { ctx.sun = d; d.castShadow = true; d.shadow.mapSize.set(2048, 2048); const sc2 = d.shadow.camera; sc2.left = -46; sc2.right = 46; sc2.top = 46; sc2.bottom = -46; sc2.near = 1; sc2.far = 160; d.shadow.bias = -.0005; d.shadow.normalBias = .05; }
      if (o.interior) return;
      const gr = mesh(new T.CircleGeometry(190, 48), new T.Color(o.ground || 0x79c267).lerp(new T.Color(0xc3dd9a), .4).getHex(), 0, 0, 0); gr.rotation.x = -Math.PI / 2; gr.userData.ground = 1; sc.add(gr);
      const mc = o.mcol || [0x6f8f7a, 0x7d8a96, 0x5f7f6a, 0x8794a0];
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * 6.283 + R(-.1, .1), r = R(105, 150);
        if (o.gap && o.gap(a)) continue;
        sc.add(at(K.mountain(R(26, 44), R(28, 66), mc[i % mc.length], o.snow !== false && rndSnow(i)), Math.cos(a) * r, -1, Math.sin(a) * r));
      }
      for (let i = 0; i < (o.trees == null ? 70 : o.trees); i++) {
        const a = R(0, 6.283), r = R(31, 100), x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (o.clear && o.clear(x, z)) continue;
        sc.add(at(rndTree(o), x, 0, z, R(0, 6), R(.8, 1.7)));
      }
      for (let i = 0; i < (o.rocks == null ? 10 : o.rocks); i++) { const a = R(0, 6.283), r = R(8, 30); sc.add(at(K.rock(R(.3, .9), o.rockc), Math.cos(a) * r, .2, Math.sin(a) * r)); }
      if (o.flowers !== false) for (let i = 0; i < 14; i++) { const a = R(0, 6.283), r = R(4, 28); sc.add(at(K.flowers(7, 1.6), Math.cos(a) * r, 0, Math.sin(a) * r)); }
      for (let i = 0; i < 7; i++) { const c = at(K.cloud(), R(-120, 120), R(45, 70), R(-120, 60), 0, R(3, 6)); sc.add(c); ups.push(dt => { c.position.x += dt * 1.5; if (c.position.x > 150) c.position.x = -150; }); }
      if (ctx.fut && o.kit !== false) sc.add(K.futureKit(ups));
    };
    function rndSnow(i) { return i % 3 !== 1; }
    function rndTree(o) { return (o.birch && K.rnd() < o.birch) ? K.birch() : K.pine(); }

    ctx.add = function () { for (let i = 0; i < arguments.length; i++) if (arguments[i]) sc.add(arguments[i]); };
    ctx.hot = function (i, obj, x, z, ry) {
      const g = new T.Group(); g.position.set(x, 0, z); if (ry) obj.rotation.y = ry; g.add(obj); sc.add(g); g.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(obj); const top = Math.max(bb.max.y, 1.4);
      const mk = mesh(new T.OctahedronGeometry(.42), 0xffc93c, 0, top + 1, 0, { emissive: 0x996600 });
      const ring = mesh(new T.TorusGeometry(Math.max(1.5, (bb.max.x - bb.min.x) * .45), .04, 6, 40), 0xffdc7a, 0, .06, 0, { emissive: 0x8a6a10 }); ring.rotation.x = Math.PI / 2;
      const hit = new T.Mesh(new T.SphereGeometry(Math.max(1.7, top * .62), 8, 6), invis); hit.position.y = top / 2; hit.userData.hot = i;
      const mhit = new T.Mesh(new T.SphereGeometry(.9, 6, 5), invis); mhit.position.y = top + 1; mhit.userData.hot = i;
      g.add(mk, ring, hit, mhit);
      hots[i] = { g, obj, mk, baseY: obj.position.y, baseRy: obj.rotation.y, top };
    };
    ctx.frame = function (key, w, h) {
      let m;
      if (HTTP && key) { const tx = new T.TextureLoader().load('img/' + key + '.jpg'); m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx })); }
      else m = K.sign(['Фотосурет'], w, h, { bg: '#cfe8f5', font: 40 });
      m.position.z = .08; return G(box(w + .3, h + .3, .12, 0x6b4a2b), m);
    };
    ctx.room = function (w, d, h, wall, floor) {
      sc.add(box(w, .2, d, floor, 0, -.1, 0), box(w, .2, d, 0xfdfbf3, 0, h + .1, 0), box(w, h, .3, wall, 0, h / 2, -d / 2), box(.3, h, d, wall, -w / 2, h / 2, 0), box(.3, h, d, wall, w / 2, h / 2, 0));
      sc.add(box(w / 2 - 1.2, h, .3, wall, -w / 4 - .6, h / 2, d / 2), box(w / 2 - 1.2, h, .3, wall, w / 4 + .6, h / 2, d / 2), box(2.4, h - 2.6, .3, wall, 0, h - (h - 2.6) / 2, d / 2));
      const p = new T.PointLight(0xfff0d0, .35, 60); p.position.set(0, h - .6, 0); sc.add(p);
      ctx.bounds = { hx: w / 2 - 1, hz: d / 2 - 1 };
    };

    (BUILD[site.id] || BUILD.district)(ctx, site);
    if (ctx.sun) { sc.updateMatrixWorld(true); const wp = new T.Vector3(); sc.traverse(m => { if (!m.isMesh || m.material === invis || m.material.transparent || m.material.isMeshBasicMaterial || m.userData.nc) return; if (m.userData.ground) { m.receiveShadow = true; return; } m.getWorldPosition(wp); if (wp.length() > 75) return; m.castShadow = true; m.receiveShadow = true; }); }
    ups.push((dt, t) => hots.forEach((h, i) => { if (!h) return; h.mk.rotation.y += dt * 2; h.mk.position.y = h.top + 1 + Math.sin(t * 2.4 + i) * .15; }));
    return ctx;
  };

  const BUILD = {};

  BUILD.district = function (c) {
    c.env({ ground: 0x79c267, trees: 60, birch: .3, clear: (x, z) => Math.abs(z - 12) < 5 || (Math.abs(x) < 8 && z < -18) });
    c.add(box(190, .06, 4.4, 0x6f7780, 0, .03, 12));
    for (let i = -12; i <= 12; i++) c.add(box(1.6, .02, .16, 0xffffff, i * 6, .08, 12));
    [[-17, -6, 0xf3e2c0, 0xb5432a], [-10, -11, 0xdfeaf2, 0x3d7ea6], [17, -9, 0xf7d9c4, 0x8e5a3c], [21, 2, 0xe9f0d8, 0x4d8b57], [-21, 3, 0xf5ecd0, 0xa8442f]].forEach((h, i) => c.add(at(K.house({ wall: h[2], roof: h[3], solar: c.fut }), h[0], 0, h[1], i * .4 - .6)));
    c.add(at(K.house({ w: 10, d: 6, h: 4.2, rh: 2.4, wall: 0xfaf3dd, roof: 0x2f6fa8, chimney: false, solar: c.fut }), 0, 0, -9), at(K.flag(0x00afca, 7), 6.5, 0, -5));
    c.add(at(K.sign(['ӘКІМДІК'], 3.4, .8, { font: 70, h: 128 }), 0, 3.5, -5.9));
    c.add(box(9, .05, 46, 0x59616b, 0, .03, -42)); for (let i = 0; i < 6; i++) c.add(box(.4, .02, 3, 0xffffff, 0, .08, -24 - i * 7));
    c.hot(0, G(box(1.9, 2.8, .5, 0xd9d3c7, 0, 1.4, 0), at(K.sign(['1871', 'Катонқарағай'], 1.6, 1.2, { font: 90, bg: '#ffe9a8' }), 0, 1.7, .27), box(2.4, .3, .9, 0xbfb8a8, 0, .15, 0)), -7, 2);
    const jar = G(cyl(.42, .42, .8, 0xf2a516, 0, 1.3, 0, 12), cyl(.3, .3, .14, 0xfff5d6, 0, 1.76, 0, 12));
    c.hot(1, G(K.table(), jar, at(K.hive(), -2, 0, -.6), at(K.hive(0xff9a56), 2, 0, -.8), at(K.hive(0x9fdb6a), 2.4, 0, .9)), 8, 1);
    c.hot(2, at(K.plane(c.ups), 0, 1.5, 0, 0, .8), 0, -19, Math.PI);
    c.hot(3, G(K.yurt(), at(K.person(0x2f6fa8), 3.2, 0, 1.6, -.6), at(K.person(0xc0392b, { hat: 0xffffff }), 3.9, 0, .4, -1.2)), 13, 3, -.5);
    const bus = at(c.fut ? K.bus(0x16c79a, true) : K.bus(0xffc93c), -60, 0, 11, Math.PI / 2), cr = at(c.fut ? K.car(0xffffff, true) : K.car(0xe4572e), 50, 0, 13, -Math.PI / 2);
    c.add(bus, cr); c.ups.push(dt => { bus.position.x += dt * 6; if (bus.position.x > 90) bus.position.x = -90; cr.position.x -= dt * 9; if (cr.position.x < -90) cr.position.x = 90; });
    c.add(at(K.fence(10), -17, 0, -1), at(K.fence(8), 18, 0, -3.5), at(K.horse(), -14, 0, 5, 1), at(K.horse({ color: 0x3b2a20 }), -17, 0, 7, 2.2));
  };

  BUILD.park = function (c) {
    c.env({ ground: 0x5fae62, trees: 150, clear: (x, z) => Math.abs(x) < 4 && z > 0, mcol: [0x4f7f5c, 0x6f8f7a, 0x7d8a96] });
    for (let i = 0; i < 26; i++) { const a = R(0, 6.28), r = R(15, 30); if (Math.abs(Math.cos(a) * r) < 7 && Math.sin(a) > 0) continue; c.add(at(K.pine(), Math.cos(a) * r, 0, Math.sin(a) * r, 0, R(1, 2))); }
    c.add(cyl(.3, .3, 5, 0x7a5230, -3.5, 2.5, 14), cyl(.3, .3, 5, 0x7a5230, 3.5, 2.5, 14), box(8.4, 1.3, .3, 0x8a5a2b, 0, 5, 14), at(K.sign(['КАТОНҚАРАҒАЙ', 'ұлттық паркі'], 7.6, 1.1, { w: 1024, h: 160, font: 70, bg: '#fff3c9', border: false }), 0, 5, 14.17));
    c.hot(0, G(at(K.rock(1.6, 0x8f9aa3), 0, .8, 0), at(K.rock(1.1, 0x9aa5ad), 1.4, .5, .6), at(K.leopard(), 0, 1.75, 0, .5)), -10, -5, .6);
    c.hot(1, at(K.bear(), 0, 0, 0, 0, 1.25), 9, -9, -.6);
    c.hot(2, G(K.pine(3), at(cone(.25, .5, 0x8a5a2b, 0, 0, 0, 6), 1.2, .3, 1.2), at(cone(.25, .5, 0x8a5a2b), -1, .3, 1.4)), 0, -15);
    c.hot(3, G(box(2.2, 3, .5, 0xe9eef2, 0, 1.5, 0), at(K.sign(['UNESCO', 'Биосфералық', 'резерват · 2014'], 1.9, 2.2, { w: 400, h: 460, font: 58, bg: '#e8f4ff' }), 0, 1.6, .27)), -5, 6, .3);
    const eg = K.eagle(c.ups);
    c.hot(4, G(cyl(.2, .3, 3.4, 0x7a5230, 0, 1.7, 0), at(eg, 0, 3.75, 0)), 11, 3, -.8);
    c.add(at(K.deer(), 16, 0, -3, 2), at(K.deer({ antlers: false, color: 0xb98550 }), 18, 0, -1, 2.6, .85));
    const fl = at(K.eagle(c.ups), 0, 22, 0, 0, 1.6); c.add(fl); c.ups.push((dt, t) => { fl.position.set(Math.cos(t * .3) * 30, 22, Math.sin(t * .3) * 30); fl.rotation.y = -t * .3; });
    if (c.fut) { const dr = at(K.flyingCar(c.ups, 0x16c79a), 0, 12, 0, 0, .5); c.add(dr); c.ups.push((dt, t) => { dr.position.set(Math.cos(-t * .4) * 18, 12, Math.sin(-t * .4) * 18); dr.rotation.y = t * .4; }); }
  };

  BUILD.berel = function (c) {
    c.env({ ground: 0x9fbf6a, trees: 40, rocks: 4, clear: (x, z) => z < -18 && Math.abs(x) < 50 });
    [[-34, -34, 9], [-12, -40, 12], [14, -38, 10], [36, -32, 8], [0, -58, 14]].forEach(k => {
      const m = sph(k[2], 0x9aa39a, k[0], -k[2] * .45, k[1]); m.scale.y = .62; c.add(m);
      for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; c.add(at(K.rock(.7, 0xb7beb7), k[0] + Math.cos(a) * k[2] * .93, .2, k[1] + Math.sin(a) * k[2] * .93)); }
    });
    [[-5, -8], [5, -8], [-5, 0], [5, 0]].forEach(p => c.add(cyl(.2, .2, 4.4, 0x7a5230, p[0], 2.2, p[1])));
    c.add(box(11.5, .25, 9.5, 0xb5432a, 0, 4.5, -4), box(10.4, .15, 8.4, 0x6f6a5c, 0, .02, -4));
    const log = cyl(.75, .75, 3.6, 0x8a5a2b, 0, .95, 0, 10); log.rotation.z = Math.PI / 2;
    const lid = cyl(.78, .78, 3.7, 0x6b4423, 0, 1.25, 0, 10, { transparent: true, opacity: .55 }); lid.rotation.z = Math.PI / 2; lid.scale.y = .5;
    const sar = G(log, lid, box(4.2, .3, 1.9, 0x5d5346, 0, .15, 0));
    [[-1.5, .5], [1.5, .5], [-1.5, -.5], [1.5, -.5]].forEach(p => sar.add(G(cone(.16, .4, 0xd9a521, p[0], 1.95, p[1], 5), box(.3, .05, .16, 0xd9a521, p[0], 1.85, p[1]))));
    c.hot(0, sar, 0, -5);
    const hs = G(); for (let i = 0; i < 13; i++) hs.add(at(K.horse({ color: [0x9b5a2e, 0xa8632f, 0x8a4c26][i % 3], mask: true }), (i % 7) * 1.25 - (i < 7 ? 3.75 : 3.1), 0, i < 7 ? 0 : -2.3, 0, .55));
    c.hot(1, hs, -11, -2, .5);
    const gr = G(K.pedestal(1.1), box(.35, .5, .9, 0xf2c744, 0, 1.6, 0), sph(.26, 0xf2c744, 0, 2.0, .45), cone(.12, .35, 0xd9a521, 0, 1.98, .78, 5), box(1.5, .06, .5, 0xf2c744, 0, 1.95, -.1), cone(.12, .5, 0xf2c744, .12, 2.4, .4, 4), cone(.12, .5, 0xf2c744, -.12, 2.4, .4, 4));
    gr.children[3].rotation.x = Math.PI / 2;
    c.hot(2, gr, 9, -1, -.6);
    const ice = G(box(3.4, 1.5, 2.4, 0x9fdcf5, 0, .75, 0, { transparent: true, opacity: .7 }), box(3.6, .3, 2.6, 0x7a6248, 0, 1.65, 0));
    for (let i = 0; i < 12; i++) ice.add(at(K.rock(.42, 0xaab1aa), R(-1.5, 1.5), 2 + R(0, .5), R(-1, 1)));
    ice.add(at(K.horse({ mask: true }), 0, .25, 0, 1.57, .38));
    c.hot(3, ice, 11, -11, -.3);
    c.hot(4, G(K.board(['1865 · В. Радлов', '1998 · З. Самашев', '№11 қорған'], { pw: 4, ph: 2.2, w: 640, h: 352, font: 56 }), at(K.person(0x8e6b3e, { hat: 0xe9dcc0 }), 3, 0, .6, -.5), at(box(.08, 1.4, .08, 0x7a5230), 3.6, .7, .9), at(box(.3, .35, .05, 0x888888), 3.6, .15, .9)), -6, 7, .35);
    c.add(at(K.yurt(), -19, 0, 6, 1), at(K.yurt(), 20, 0, 4, -1));
    if (c.fut) { const holo = at(K.horse({ mask: true }), 0, 5.4, -4, 0, 1.1); holo.traverse(m => { if (m.isMesh) m.material = K.M(0x39e6ff, { transparent: true, opacity: .45, emissive: 0x0a8fb0 }); }); c.add(holo); c.ups.push((dt, t) => { holo.rotation.y = t * .6; holo.position.y = 5.6 + Math.sin(t * 2) * .2; }); }
  };

  BUILD.muztau = function (c) {
    c.env({ ground: 0xeaf4fb, sky: 0x86c8ff, trees: 0, flowers: false, rocks: 22, rockc: 0x6f7c88, mcol: [0xb9c7d4, 0xa3b3c2, 0xcbd7e2], kit: false, gap: a => a > 3.9 && a < 5.5 });
    const p1 = at(K.mountain(48, 86, 0xc5d3df, false), 14, -2, -110), p2 = at(K.mountain(44, 74, 0xbccbd8, false), -30, -2, -105);
    c.add(p1, p2, at(cone(30, 52, 0xffffff, 0, 0, 0, 7), 14, 58, -110), at(cone(27, 44, 0xffffff, 0, 0, 0, 7), -30, 50, -105), box(50, 30, 30, 0xd5e1ea, -8, 14, -112));
    const gl = box(14, 1.2, 60, 0xbfe6fb, -6, .5, -52); gl.rotation.x = -.09; c.add(gl);
    for (let i = 0; i < 16; i++) c.add(at(box(R(1, 2.4), R(1, 3), R(1, 2.4), 0xa8dcf7), R(-12, 0), .8, R(-40, -22), R(0, 3)));
    c.add(box(2.4, .05, 44, 0xf4fbff, -5, .05, 0), box(3.2, .05, 12, 0xe2f3fb, -5, .04, -20));
    const mini = G(K.pedestal(.9), cone(.9, 1.5, 0xc5d3df, .35, 1.75, 0, 6), cone(.42, .7, 0xffffff, .35, 2.16, 0, 6), cone(.8, 1.25, 0xbccbd8, -.5, 1.62, 0, 6), cone(.36, .58, 0xffffff, -.5, 1.96, 0, 6), at(K.sign(['4506 м'], 1, .4, { h: 128, w: 320, font: 80 }), .35, 2.9, 0), at(K.sign(['4435 м'], .9, .36, { h: 128, w: 320, font: 80 }), -.9, 2.5, 0));
    c.hot(0, mini, -7, 3, .3);
    const ser = G(); for (let i = 0; i < 7; i++) ser.add(at(box(R(.7, 1.3), R(1.2, 3), R(.7, 1.3), 0x8fd4f5, 0, 0, 0, { transparent: true, opacity: .85 }), R(-1.6, 1.6), 1, R(-1.2, 1.2), R(0, 3)));
    c.hot(1, ser, 1, -12);
    c.hot(2, G(at(K.tent(0xff7a3d), -1.6, 0, -.6), at(K.tent(0xffc93c), 1.2, 0, -1.4, .5), at(K.person(0xe4572e, { pack: 0x2f6fa8, hat: 0x16324f }), .4, 0, 1), at(K.flag(0x00afca, 3.2), 1.4, 0, 1.2)), 9, -3, -.4);
    const obo = G(); for (let i = 0; i < 16; i++) obo.add(at(K.rock(R(.3, .6), 0x7c8792), R(-.9, .9) * (1 - i / 22), .2 + i * .11, R(-.9, .9) * (1 - i / 22)));
    obo.add(cyl(.05, .05, 2.6, 0x7a5230, 0, 2.4, 0)); [0xffffff, 0x3fb5e8, 0xffc93c, 0xe4572e].forEach((cl, i) => obo.add(box(.9, .14, .02, cl, .5, 3.4 - i * .28, 0)));
    c.hot(3, obo, -11, -8);
    c.add(at(K.rock(2.5, 0x6f7c88), 16, 1, -14), at(K.rock(3, 0x7c8792), -18, 1.2, -6), at(K.rock(2, 0x6f7c88), 20, .8, 6));
    if (c.fut) { const s = G(box(.6, .6, .9, 0xf4f6f8), box(2.2, .04, .7, 0x1b4f9c, -1.5, 0, 0), box(2.2, .04, .7, 0x1b4f9c, 1.5, 0, 0)); s.position.set(0, 26, -30); c.add(s); c.ups.push((dt, t) => { s.position.x = Math.sin(t * .2) * 40; }); c.add(at(K.flyingCar(c.ups), 16, 2, 14, -1)); c.ups.push(() => { }); }
  };

  function lakeScene(c, o) {
    c.env(Object.assign({ ground: 0x6dbb63, trees: 120, clear: (x, z) => { const dx = x / 34, dz = (z + 38) / 22; return dx * dx + dz * dz < 1.15; } }, o));
    c.add(at(K.lake(32, 19, o.water || 0x3fb5e8), 0, 0, -38));
    c.add(box(2.2, .25, 12, 0x9a6b3c, 0, .45, -20)); for (let i = 0; i < 5; i++) c.add(cyl(.14, .14, 1.4, 0x7a5230, -1, .1, -15 - i * 2.6), cyl(.14, .14, 1.4, 0x7a5230, 1, .1, -15 - i * 2.6));
    c.bounds = { r: 27, pier: true };
  }

  BUILD.rakhman = function (c) {
    lakeScene(c, {});
    c.hot(0, G(at(K.rock(1.2, 0x9aa5ad), -1.2, .5, 0), cyl(1, 1, .1, 0x7fe0f5, .6, .06, .2, 14), K.steam(c.ups, 5, .5).translateX(.6), at(K.deer(), 1.4, 0, -1.5, -.8)), -10, 2, .4);
    const drop = G(K.pedestal(.8), sph(.55, 0x3fb5e8, 0, 1.55, 0, { transparent: true, opacity: .85 }), cone(.4, .8, 0x3fb5e8, 0, 2.2, 0, 10));
    c.hot(1, drop, 0, -12);
    const sq = G(sph(.22, 0xb5651d, 0, 0, 0), sph(.15, 0xb5651d, 0, .25, .12), cyl(.08, .14, .5, 0xc97a2b, 0, .25, -.25, 6));
    c.hot(2, G(K.pine(2.2), at(sq, .9, 3.2, .9)), 11, 3);
    c.hot(3, at(K.boat(0xe4572e), 0, .1, 0), 7, -14, .7);
    const b2 = at(K.boat(c.fut ? 0xffffff : 0x2f6fa8), 0, .1, -36); c.add(b2); if (c.fut) b2.add(box(1, .06, 1.4, 0x1b4f9c, 0, .9, -.4), box(.06, .5, .06, 0x888888, 0, .65, -.4));
    c.ups.push((dt, t) => { b2.position.x = Math.sin(t * .15) * 18; b2.position.z = -38 + Math.cos(t * .15) * 8; b2.rotation.y = Math.atan2(Math.cos(t * .15), -Math.sin(t * .15) * .45); });
    c.add(at(K.house({ wall: 0xf5ecd0, roof: 0x3d8b63, solar: c.fut }), 20, 0, -6, -.7), at(K.house({ wall: 0xfaf3dd, roof: 0x3d8b63, solar: c.fut }), 24, 0, 4, -1.1));
  };

  BUILD.yazevoe = function (c) {
    lakeScene(c, { gap: a => a > 4.2 && a < 5.2, water: 0x45b9d9 });
    c.add(at(K.mountain(40, 70, 0xc5d3df, false), 12, -2, -150), at(K.mountain(36, 60, 0xbccbd8, false), -22, -2, -146), at(cone(25, 42, 0xffffff), 12, 47, -150), at(cone(22, 36, 0xffffff), -22, 41, -146));
    const tri = (x, w, h) => { const s = new T.Shape(); s.moveTo(-w, 0); s.lineTo(w, 0); s.lineTo(0, h); const m = new T.Mesh(new T.ShapeGeometry(s), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .08, -54); return m; };
    c.add(tri(5, 9, 22), tri(-9, 8, 18));
    const cam = G(box(.06, 1.5, .06, 0x333333, -.3, .75, .2), box(.06, 1.5, .06, 0x333333, .3, .75, .2), box(.06, 1.5, .06, 0x333333, 0, .75, -.3), box(.6, .4, .35, 0x222222, 0, 1.65, 0), cyl(.14, .16, .35, 0x444444, 0, 1.65, -.3, 10));
    cam.children[4].rotation.x = Math.PI / 2;
    c.hot(0, G(cam, at(K.person(0x2f6fa8, { hat: 0xe4572e }), 1, 0, .6, 3.3)), 4, -11);
    c.hot(1, G(K.pedestal(.7), at(K.fish(), 0, 1.6, 0, 1.57, 1.2)), -8, -10);
    const cas = G(at(K.rock(1.5, 0x8f9aa3), 0, 1, -1), at(K.rock(1.1, 0x9aa5ad), -1, .5, 0), at(K.rock(1, 0x8f9aa3), 1.1, .5, .2), box(.8, 1.4, .1, 0xdff4ff, 0, 1.1, .05), box(1, .7, .1, 0xdff4ff, .1, .35, .9), cyl(1.2, 1.2, .06, 0x7fd0f5, .1, .05, 1.6, 12));
    c.hot(2, cas, 11, -2, -.5);
    c.hot(3, G(at(K.tent(0x16c79a), -1.4, 0, -.5, .4), at(K.campfire(c.ups), 1, 0, .8), at(box(1.4, .3, .35, 0x8a5a2b), 1, .15, 2)), -9, 4, .5);
    c.add(at(K.house({ w: 6, wall: 0xa8743d, roof: 0x3d6b4a, log: true, solar: c.fut }), 22, 0, -4, -.9));
  };

  BUILD.kokkol = function (c) {
    c.env({ ground: 0x6fb866, trees: 80, rocks: 16, clear: (x, z) => z < -14, mcol: [0x6f8f7a, 0x7d8a96] });
    for (let i = -5; i <= 5; i++) c.add(at(box(11, R(30, 42), R(8, 12), i % 2 ? 0x77838f : 0x6b7783), i * 10, 16, -32 + Math.abs(i) * 1.2, R(-.1, .1)));
    c.add(box(5, 34, .6, 0xe8f7ff, 0, 17, -26.2), box(3.4, 34, .3, 0xffffff, .4, 17, -25.9, { transparent: true, opacity: .8 }));
    c.add(at(K.lake(9, 5.5, 0x7fd0f5), 0, .02, -21), box(4, .05, 30, 0xdff1fb, 14, .04, -12).rotateY(.9));
    const ps = []; for (let i = 0; i < 70; i++) { const p = sph(R(.18, .4), 0xffffff, R(-2.2, 2.6), R(0, 34), -25.4 + R(0, .8)); p.userData.v = R(14, 24); c.add(p); ps.push(p); }
    const mist = K.steam(c.ups, 12, 3.5); mist.position.set(0, 0, -23); mist.scale.setScalar(1.6); c.add(mist);
    c.ups.push(dt => ps.forEach(p => { p.position.y -= dt * p.userData.v; if (p.position.y < 0) p.position.y = 34; }));
    const drop = G(K.fence(5), at(K.sign(['≈ 80 м'], 1.6, .7, { h: 160, w: 360, font: 90, bg: '#e8f7ff' }), 0, 2, 0), cyl(.06, .06, 1.7, 0x7a5230, 0, .85, 0));
    c.hot(0, drop, 0, -11);
    const rb = G(); [0xe4572e, 0xffc93c, 0x3fa86b, 0x3a7bd5, 0x8a5fd3].forEach((cl, i) => { const t = mesh(new T.TorusGeometry(3.2 - i * .22, .11, 6, 24, Math.PI), cl, 0, 0, 0, { transparent: true, opacity: .8 }); rb.add(t); });
    c.hot(1, rb, 8, -13, -.5);
    c.hot(2, G(cyl(.08, .08, 2.6, 0x7a5230, 0, 1.3, 0), at(K.sign(['Көккөл →'], 1.7, .5, { h: 128, w: 420, font: 70, bg: '#ffe9a8' }), .6, 2.3, 0), at(K.horse({ saddle: true }), 2, 0, .5, .6), at(K.person(0x16c79a, { pack: 0xe4572e }), -1.2, 0, .6)), -9, 3, .4);
    const st = G(box(3.4, .12, 1.4, 0xf2f8fb, 0, .08, 0)); for (let i = 0; i < 7; i++) st.add(at(K.rock(R(.25, .5), 0xffffff), R(-1.6, 1.6), .2, R(-.8, .8))); st.add(at(K.sign(['Ақ Берел'], 1.6, .5, { h: 128, w: 420, font: 70 }), 0, 1.5, -.7), cyl(.06, .06, 1.4, 0x7a5230, 0, .7, -.72));
    c.hot(3, st, 10, 2, -.4);
    if (c.fut) { const cab = at(box(2, 1.6, 2.6, 0xffffff), -30, 16, -18); cab.add(box(2.02, .7, 2.2, 0x9ff3ff, 0, .2, 0)); c.add(cab, box(.08, .08, 90, 0x444444, -30, 17.2, -5), cyl(.4, .6, 18, 0xbfc8cf, -30, 9, 30)); c.ups.push((dt, t) => { cab.position.z = -5 + Math.sin(t * .25) * 30; }); }
  };

  BUILD.mine = function (c) {
    c.env({ ground: 0x8d8478, sky: 0x9ccbee, trees: 0, flowers: false, rocks: 30, rockc: 0x76706a, mcol: [0x7a756e, 0x8a8f96, 0x6f6a64] });
    for (let i = -4; i <= 4; i++) c.add(at(K.mountain(16, R(26, 40), 0x7a756e, true), i * 13, -1, -34 + Math.abs(i) * 2));
    for (let i = 0; i < 9; i++) c.add(at(mesh(new T.CircleGeometry(R(2, 5), 9), 0xffffff), R(-26, 26), .03, R(-14, 20)).rotateX(-Math.PI / 2));
    c.add(box(4.4, 3.8, 2, 0x15120f, 0, 1.9, -21.5), box(.5, 4, .5, 0x7a5230, -2.3, 2, -20.3), box(.5, 4, .5, 0x7a5230, 2.3, 2, -20.3), box(5.6, .5, .5, 0x7a5230, 0, 4.1, -20.3));
    c.add(box(.12, .12, 16, 0x555555, -.6, .1, -13), box(.12, .12, 16, 0x555555, .6, .1, -13)); for (let i = 0; i < 9; i++) c.add(box(1.8, .1, .25, 0x5d3d22, 0, .05, -20 + i * 1.9));
    const cart = G(box(1.5, .9, 2, 0x6b6f75, 0, .95, 0), box(1.3, .3, 1.8, 0x3d3a36, 0, 1.45, 0));
    [[-.6, .7], [.6, .7], [-.6, -.7], [.6, -.7]].forEach(p => { const w = cyl(.3, .3, .16, 0x333333, p[0], .32, p[1], 10); w.rotation.z = 1.57; cart.add(w); });
    for (let i = 0; i < 6; i++) cart.add(at(K.rock(.28, 0x9aa7b8), R(-.5, .5), 1.65, R(-.7, .7)));
    c.hot(0, cart, 0, -12);
    const ore = G(K.pedestal(.8), at(K.rock(.7, 0x5c5f66), 0, 1.4, 0));
    for (let i = 0; i < 7; i++) ore.add(at(mesh(new T.OctahedronGeometry(R(.14, .28)), i % 2 ? 0xbfd0e6 : 0x8ea2c2, 0, 0, 0, { shininess: 90, flatShading: true }), R(-.5, .5), 1.75 + R(0, .35), R(-.5, .5)));
    c.hot(1, ore, 8, -4);
    const bar = G(); for (let i = 0; i < 5; i++) [box(7, .45, .45, 0x6b4a2b, 0, .25 + i * .47, -2), box(.45, .45, 4.4, 0x6b4a2b, -3.3, .25 + i * .47, 0), i < 3 ? box(.45, .45, 4.4, 0x6b4a2b, 3.3, .25 + i * .47, 0) : null, i < 2 ? box(7, .45, .45, 0x6b4a2b, 0, .25 + i * .47, 2) : null].forEach(m => m && bar.add(m));
    const bm = box(6, .3, .3, 0x5d3d22, -.4, 1.9, .4); bm.rotation.z = .35; bar.add(bm);
    c.hot(2, bar, -11, -4, .4);
    c.hot(3, K.board(['Көккөл кеніші', '1938–1954', 'Тарих ескерткіші'], { pw: 3.6, ph: 2, w: 600, h: 340, font: 58, bg: '#efe6d2' }), 5, 7, -.3);
    c.add(at(box(3, 5, 3, 0x6b4a2b), -20, 2.5, -14), at(box(8, .3, 1, 0x6b4a2b), -17, 4, -14, 0).rotateZ(-.5));
    if (c.fut) { const h = at(K.person(0x39e6ff), 3, 0, -12); h.traverse(m => { if (m.isMesh) m.material = K.M(0x39e6ff, { transparent: true, opacity: .5, emissive: 0x0a8fb0 }); }); c.add(h); c.ups.push((dt, t) => { h.position.z = -12 + Math.sin(t) * 2; }); }
  };

  BUILD.berelv = function (c) {
    c.env({ ground: 0x7cc46a, trees: 70, birch: .35, clear: (x, z) => Math.abs(z + 16) < 7 });
    c.add(box(190, .06, 5, 0x3fb5e8, 0, .04, -18.5), box(190, .06, 5, 0xf2f8fb, 0, .05, -13.5), box(190, .04, 1.2, 0xbfe6f7, 0, .07, -16));
    c.add(at(K.bridge(14, 3.4), 0, .2, -16));
    [[-18, -4, 0xa8743d, 0x8e3b2a, true], [-12, 6, 0xf3e2c0, 0x4d8b57], [16, -5, 0xdfeaf2, 0xb5432a], [20, 6, 0xa8743d, 0x3d6b8f, true], [-24, 9, 0xf5ecd0, 0x8e5a3c]].forEach((h, i) => c.add(at(K.house({ wall: h[2], roof: h[3], log: h[4], solar: c.fut }), h[0], 0, h[1], i * .5 - 1)));
    c.add(at(K.fence(12), -15, 0, 0), at(K.fence(10), 18, 0, 0));
    c.hot(0, G(K.board(['Бұқтырма', '+ Ақ Берел'], { pw: 3, ph: 1.5, font: 64 }), at(sph(.4, 0x3fb5e8), -1, .4, .8), at(sph(.4, 0xffffff), 1, .4, .8)), -4, -8, .2);
    const post = G(cyl(.18, .18, 3, 0xffffff, 0, 1.5, 0)); for (let i = 0; i < 4; i++) post.add(cyl(.19, .19, .38, i % 2 ? 0xffc93c : 0x00afca, 0, .5 + i * .7, 0)); post.add(box(2, 2.4, 2, 0x4d8b57, 2, 1.2, 0), box(2.3, .2, 2.3, 0x3a6b44, 2, 2.5, 0), box(.8, .8, .05, 0x7fd0ff, 2, 1.5, 1.02), at(K.person(0x4d6b3a, { hat: 0x3a5230 }), -1.2, 0, .5));
    c.hot(1, post, -10, 0, .5);
    c.hot(2, G(at(K.horse({ saddle: true }), 0, 0, 0, .5), at(K.horse({ saddle: true, color: 0x3b2a20 }), 2, 0, -.6, .2), at(K.person(0xc0392b, { hat: 0x8a5a2b }), -1.4, 0, .8)), 9, -3, -.5);
    const tb = K.table(); [-.6, 0, .6].forEach(x => tb.add(cyl(.2, .12, .14, 0xffffff, x, .92, .1, 10))); tb.add(cyl(.25, .3, .5, 0xd9a521, 0, 1.1, -.25, 10), sph(.16, 0xd9a521, 0, 1.45, -.25));
    c.hot(3, G(tb, at(K.person(0x8a5fd3, { hat: 0xffffff }), 0, 0, -1.2)), 5, 8, -.3);
    if (c.fut) c.add(at(K.hydro(), -30, 0, -16, 0), at(cyl(3, 3, .1, 0x16c79a, 0, .05, 0, 20), 26, 0, -4), at(K.flyingCar(c.ups), 26, .9, -4, .6));
  };

  BUILD.korobikha = function (c) {
    c.env({ ground: 0x74c063, trees: 80, birch: .5, clear: (x, z) => z < -24 });
    c.add(box(190, .06, 9, 0x3fb5e8, 0, .04, -32));
    const frames = [0x2f8fd6, 0xe4572e, 0x16c79a, 0xffc93c, 0xb07cff];
    [[-17, -6], [-10, 5], [15, -8], [20, 3], [-24, 4], [26, -6]].forEach((p, i) => c.add(at(K.house({ wall: 0xa8743d, roof: [0x5a6b7a, 0x7a4a3a, 0x4d6b4a][i % 3], log: true, frame: frames[i % 5], solar: c.fut && i % 2 === 0 }), p[0], 0, p[1], i * .7 - 1.2)));
    const bk = G(box(1.2, 1.1, .8, 0x8a5a2b, 0, .55, 0), box(1.3, .12, 1, 0x5a2d0c, 0, 1.2, 0), box(1.2, .1, .9, 0xf4ecd8, 0, 1.3, 0), box(.5, .02, .7, 0x5a2d0c, -.3, 1.36, 0), box(.5, .02, .7, 0x5a2d0c, .3, 1.36, 0));
    bk.children[1].rotation.x = bk.children[2].rotation.x = bk.children[3].rotation.x = bk.children[4].rotation.x = .25;
    c.hot(0, G(bk, at(K.person(0x6b4a8a, { hat: 0x333333 }), 1.6, 0, 0, -.5)), -8, -1, .5);
    c.hot(1, K.church(), 0, -15);
    const ap = G(at(K.hive(), -1.4, 0, 0), at(K.hive(0xff9a56), 0, 0, -.6), at(K.hive(0x9fdb6a), 1.4, 0, .2), at(K.hive(0xb07cff), .2, 0, 1.2));
    const bees = []; for (let i = 0; i < 8; i++) { const b = sph(.07, 0xffc93c, 0, 1.8, 0); ap.add(b); bees.push(b); }
    c.ups.push((dt, t) => bees.forEach((b, i) => b.position.set(Math.sin(t * 2 + i * 1.7) * 1.8, 1.7 + Math.sin(t * 3 + i) * .4, Math.cos(t * 1.6 + i * 2.3) * 1.4)));
    c.hot(2, ap, 10, -2);
    const hh = K.house({ wall: 0xb07a43, roof: 0x4f6d8f, log: true, frame: 0xffffff, w: 5.5 });
    [-1, 1].forEach(s => hh.add(box(.12, .5, .1, 0x2f8fd6, 1.1 + s * .72, 1.5, 2.06), box(.12, .5, .1, 0x2f8fd6, 1.1 + s * .72, 1.5, 2.06))); hh.add(box(1.5, .14, .1, 0xe4572e, 1.1, 2.25, 2.06), box(1.5, .14, .1, 0xe4572e, 1.1, .78, 2.06));
    c.hot(3, hh, -5, 9, .4);
    c.add(at(K.fence(14), 8, 0, 6), at(K.horse(), 16, 0, 9, 2), at(K.deer({ velvet: true }), -20, 0, -12, 1));
    if (c.fut) { const b = at(K.bus(0x16c79a, true), 0, 0, 16, 1.57); c.add(b); c.ups.push(dt => { b.position.x += dt * 5; if (b.position.x > 80) b.position.x = -80; }); }
  };

  BUILD.sanatorium = function (c) {
    c.env({ ground: 0x6dbb63, trees: 110, clear: (x, z) => z < -26 && Math.abs(x) < 40 });
    c.add(at(K.lake(40, 14, 0x3fb5e8), 0, 0, -44));
    c.add(at(K.house({ w: 12, d: 6, h: 5, rh: 2.4, wall: 0xfaf3dd, roof: 0x3d8b63, solar: c.fut }), -18, 0, -10, .5), at(K.house({ w: 9, d: 5, h: 3.4, wall: 0xf5ecd0, roof: 0x3d8b63, solar: c.fut }), 19, 0, -10, -.5), at(K.house({ wall: 0xa8743d, roof: 0x8e3b2a, log: true }), 22, 0, 4, -1.1));
    const pool = G(cyl(2.2, 2.2, .12, 0x58d9e8, 0, .12, 0, 16)); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; pool.add(at(K.rock(.55, 0xb3a89a), Math.cos(a) * 2.5, .3, Math.sin(a) * 2.5)); }
    pool.add(K.steam(c.ups, 9, 1.4), at(K.rock(1.4, 0x9a9088), -2.4, .8, -2), box(.3, .8, .1, 0xdff4ff, -1.7, .7, -1.3));
    c.hot(0, pool, 0, -8);
    const bath = G(box(4, 2.6, 3.4, 0xa8743d, 0, 1.3, -1.6), box(4.6, .25, 4, 0x7a4a3a, 0, 2.75, -1.6), at(K.barrelTub(), 0, 0, 1.6), K.steam(c.ups, 5, .5).translateZ(1.6).translateY(1));
    c.hot(1, bath, -9, -2, .5);
    const tb = K.table(); tb.add(cyl(.28, .34, .55, 0xd9a521, 0, 1.13, 0, 10), sph(.17, 0xd9a521, 0, 1.5, 0), cyl(.12, .09, .12, 0xffffff, -.55, .91, .2, 8), cyl(.12, .09, .12, 0xffffff, .55, .91, .2, 8), at(K.bush(0x4fae62), -.75, .78, -.25, 0, .35), cyl(.16, .16, .25, 0xf2a516, .7, .98, -.25, 8));
    c.hot(2, G(tb, at(K.person(0xe07a9a, { hat: 0xffffff }), 0, 0, -1.3)), 9, -2, -.4);
    c.hot(3, K.board(['Табиғатты аяла!', 'Шулама · Қоқыс тастама'], { pw: 4, ph: 1.8, w: 720, h: 320, font: 60, bg: '#e6f7e0' }), 5, 7, -.3);
    c.add(at(K.boat(0x2f6fa8), 8, .1, -31, 1));
    if (c.fut) { c.add(cyl(.5, .5, 3, 0xbfc8cf, 3, 1.5, -6), box(.3, .3, 14, 0xe4572e, -8, 2.8, -8).rotateY(1.2)); }
  };

  BUILD.maral = function (c) {
    c.env({ ground: 0x82c765, trees: 70, birch: .3 });
    for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283, a2 = (i + .5) / 20 * 6.283; if (Math.abs(a - 1.57) < .25) continue; c.add(at(K.fence(8.6), Math.cos(a2) * 27.6, 0, Math.sin(a2) * 27.6, -a2 + Math.PI / 2 + Math.PI)); }
    const herd = []; for (let i = 0; i < 7; i++) { const d = at(K.deer({ antlers: i % 3 !== 2, velvet: true, color: [0xa9713c, 0xb98550, 0x9a6233][i % 3] }), 0, 0, 0, 0, i % 3 === 2 ? .8 : 1); d.userData = { r: R(14, 23), s: R(.05, .12) * (i % 2 ? 1 : -1), p: R(0, 6.28) }; c.add(d); herd.push(d); }
    c.ups.push((dt, t) => herd.forEach(d => { const u = d.userData, a = u.p + t * u.s; d.position.set(Math.cos(a) * u.r, 0, Math.sin(a) * u.r - 2); d.rotation.y = -a + (u.s > 0 ? 0 : Math.PI); }));
    c.hot(0, G(at(K.rock(1.5, 0x9aa5ad), 0, .7, 0), at(K.deer({ color: 0x9a6233 }), 0, 1.3, 0, 0, 1.25)), 0, -11, .5);
    const ant = G(K.pedestal(.9));
    [-1, 1].forEach(s => { const a = box(.16, 1.1, .16, 0x8a6a4a, s * .3, 1.6, 0); a.rotation.z = -s * .35; const b = box(.13, .6, .13, 0x8a6a4a, s * .62, 2.05, 0); b.rotation.z = -s * .9; const d = box(.13, .5, .13, 0x8a6a4a, s * .4, 2.3, 0); d.rotation.z = s * .2; ant.add(a, b, d, sph(.12, 0x9c7a58, s * .86, 2.2, 0), sph(.12, 0x9c7a58, s * .36, 2.56, 0)); });
    c.hot(1, ant, -8, -3, .3);
    c.hot(2, G(at(K.barrelTub(), 0, 0, 1.2), K.steam(c.ups, 6, .5).translateZ(1.2).translateY(1), box(4.4, 2.6, 3, 0xa8743d, 0, 1.3, -1.8), box(5, .25, 3.6, 0x7a4a3a, 0, 2.75, -1.8), at(K.sign(['ПАНТА', 'ваннасы'], 2.2, .9, { h: 220, font: 80, bg: '#ffe9a8' }), 0, 1.9, -.28)), 9, -4, -.5);
    const hay = G(cyl(1.3, 1.5, 1.6, 0xe3c35a, 0, .8, 0, 10), cone(1.5, 1, 0xd9b84a, 0, 2.1, 0, 10));
    c.hot(3, G(at(K.house({ wall: 0xa8743d, roof: 0x8e3b2a, log: true, solar: c.fut }), 0, 0, -1.5), at(hay, 4.2, 0, .5), at(K.person(0x4d8b57, { hat: 0x8a5a2b }), -1.6, 0, 1.6)), -7, 8, .4);
  };

  BUILD.shyngystai = function (c, site) {
    c.env({ interior: true, sky: 0xcfe8f5, fsky: 0xcfe8f5, ground: 0xb58a5a });
    c.room(24, 16, 4.6, 0xf7efd8, 0xb58a5a);
    c.start = [0, 5.5, 0];
    for (let i = -2; i <= 2; i++) c.add(box(2.2, 1.8, .1, 0xbfe6ff, i * 4.4, 2.6, -7.8).translateZ(0), box(2.5, .12, .16, 0x8a5a2b, i * 4.4, 3.55, -7.75), box(2.5, .12, .16, 0x8a5a2b, i * 4.4, 1.65, -7.75));
    c.add(box(7, .04, 4.4, 0xb5432a, 0, .02, 0), box(6.2, .05, 3.6, 0xe9c46a, 0, .03, 0), box(5, .06, 2.6, 0xb5432a, 0, .04, 0));
    const pt = new T.Mesh(new T.PlaneGeometry(1.8, 2.4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(K.portraitTex(site.person.name, site.person.years)) })); pt.position.z = .1;
    c.hot(0, at(G(box(2.1, 2.7, .14, 0xd9a521), pt), 0, 2.5, 0), 0, -7.55);
    const desk = G(box(2.6, .12, 1.3, 0x7a4a2a, 0, 1, 0), box(.9, .95, 1.2, 0x8a5a36, -.8, .48, 0), box(.12, .95, 1.2, 0x8a5a36, 1.2, .48, 0));
    desk.add(box(.8, .28, .6, 0x2f3b45, .2, 1.2, -.1), box(.7, .06, .3, 0x1c242b, .2, 1.3, .25), box(.7, .5, .04, 0xffffff, .2, 1.6, -.36), cyl(.05, .05, .7, 0x888888, -1, 1.4, -.4), cone(.3, .35, 0x3d8b63, -1, 1.85, -.4, 10), box(.5, .03, .7, 0xffffff, .95, 1.08, .1), box(.03, .03, .4, 0x16324f, 1.05, 1.11, .15));
    desk.add(box(.7, 1, .1, 0x7a4a2a, 0, 1.2, 1.25), box(.7, .1, .7, 0x7a4a2a, 0, .7, .95), box(.08, .7, .08, 0x6b4226, -.3, .35, 1.25), box(.08, .7, .08, 0x6b4226, .3, .35, 1.25), box(.08, .7, .08, 0x6b4226, -.3, .35, .65), box(.08, .7, .08, 0x6b4226, .3, .35, .65));
    c.hot(1, desk, -6, -4.5, .4);
    const sh = G(box(3.4, 3.4, .5, 0x6b4a2b, 0, 1.7, 0)); const bc = [0xe4572e, 0x2f6fa8, 0xffc93c, 0x16c79a, 0x8a5fd3, 0xf4f1ea, 0xc0392b, 0x3d8b63];
    for (let r = 0; r < 4; r++) { sh.add(box(3.2, .08, .56, 0x8a6a45, 0, .35 + r * .8, .05)); let x = -1.5; let k = r; while (x < 1.4) { const w = R(.12, .24), h = R(.5, .68); sh.add(box(w, h, .36, bc[k++ % 8], x + w / 2, .4 + r * .8 + h / 2, .12)); x += w + .02; } }
    c.hot(2, sh, 10.5, -3, -Math.PI / 2);
    const aw = G(box(2, 1, 1, 0x7a4a2a, 0, .5, 0), box(2, .9, 1, 0xcfeaff, 0, 1.45, 0, { transparent: true, opacity: .35 }), box(1.7, .06, .8, 0x8e2f3f, 0, 1.05, 0));
    [-.5, 0, .5].forEach((x, i) => { const m = cyl(.2, .2, .04, i === 1 ? 0xf2c744 : 0xcfd6dd, x, 1.25, 0, 14); m.rotation.x = 1.2; aw.add(m, box(.14, .22, .02, i === 1 ? 0xc0392b : 0x2f6fa8, x, 1.48, -.1)); });
    c.hot(3, aw, 6, -6, -.2);
    const dom = G(sph(.42, 0xb5763a, 0, .6, 0), box(.1, 1.5, .06, 0x8a5a2b, 0, 1.55, 0), box(.2, .2, .08, 0x6b4226, 0, 2.35, 0)); dom.children[0].scale.set(.8, 1.1, .45);
    c.hot(4, G(at(dom, 0, .9, .3), at(c.frame('district1', 2.6, 1.7), 2.6, 2.4, 0), box(.5, .9, .5, 0x8a5a36, 0, .45, .3)), -11.5, 1.5, Math.PI / 2);
    const bust = G(box(1, 1.5, 1, 0x6b6f75, 0, .75, 0), box(1.2, .14, 1.2, 0x555a60, 0, 1.55, 0), box(.95, .55, .5, 0x9a7b4f, 0, 1.9, 0), sph(.36, 0x9a7b4f, 0, 2.5, 0), sph(.37, 0x7d6340, 0, 2.6, -.06), at(K.sign(['Оралхан Бөкей', '1943–1993'], .9, .5, { h: 280, font: 54, bg: '#3a3d42', fg: '#f2c744', border: false }), 0, .9, .51));
    bust.children[4].scale.set(1, .75, 1);
    c.hot(5, bust, 7, 4, -.6);
    c.add(at(c.frame('bokei_street', 2.8, 2), -6, 2.5, -7.6), at(c.frame('muztau1', 2.8, 2), 6.5, 2.5, -7.6), at(c.frame('yazevoe1', 2.4, 1.6), -11.6, 2.5, -3.5, Math.PI / 2));
    c.add(at(K.sign(['«Адам — табиғаттың төл баласы»'], 9, .8, { w: 1280, h: 120, font: 62, bg: '#f7efd8', border: false }), 0, 4.05, -7.6));
    const ch = G(box(1.6, .4, .8, 0x8e2f3f, 0, .5, 0), box(1.6, .7, .16, 0x8e2f3f, 0, 1, -.32), box(.1, .5, .1, 0x6b4226, -.7, .15, .3), box(.1, .5, .1, 0x6b4226, .7, .15, .3));
    c.add(at(ch, -9, 0, 5.5, 2.2), at(ch.clone(), 10, 0, 5, -2.4));
    if (c.fut) { const b = at(box(.8, 1.1, .12, 0x39e6ff, 0, 0, 0, { transparent: true, opacity: .55, emissive: 0x0a8fb0 }), -2.5, 2, -2); c.add(b, cyl(.4, .5, .12, 0x16324f, -2.5, .06, -2, 14)); c.ups.push((dt, t) => { b.rotation.y = t; b.position.y = 1.7 + Math.sin(t * 2) * .12; }); }
  };

  BUILD.austria = function (c) {
    c.env({ ground: 0x86b565, trees: 90, rocks: 18, mcol: [0x6f8f7a, 0x7d8a96, 0x8a8f7a], clear: (x, z) => Math.abs(x - Math.sin(z * .09) * 14) < 5 });
    for (let z = -90; z < 60; z += 3) { const x = Math.sin(z * .09) * 14, x2 = Math.sin((z + 3) * .09) * 14; const s = box(4, .08, 3.6, 0xb59f7a, x, .04, z); s.rotation.y = Math.atan2(x2 - x, 3); c.add(s); if (z % 6 === 0 && Math.abs(z + 4) > 6) c.add(at(K.rock(.55, 0x9aa09a), x + (Math.cos(z * .09) > 0 ? 2.6 : -2.6), .25, z)); }
    c.add(box(190, .06, 3.4, 0x5fc1ec, 0, .05, -4).rotateY(.25));
    const bx = Math.sin(-4 * .09) * 14;
    c.hot(2, K.bridge(8, 4.2), bx, -4, -.3);
    c.hot(0, G(box(1.5, 2, .6, 0x9aa09a, 0, 1, 0), at(K.sign(['1914–1916'], 1.3, .6, { h: 180, w: 420, font: 84, bg: '#c9cfc9' }), 0, 1.35, .31), box(.08, 1.5, .08, 0x7a5230, 1.4, .75, .3).rotateZ(.3), box(.5, .12, .1, 0x555555, 1.15, 1.45, .3), box(.08, 1.4, .08, 0x7a5230, -1.3, .7, .3).rotateZ(-.25), box(.3, .4, .05, 0x777777, -1.1, .1, .3)), -9, 4, .4);
    c.hot(1, G(cyl(.09, .09, 3.2, 0x7a5230, 0, 1.6, 0), at(K.sign(['Бұрқат асуы', '2141 м'], 2.6, 1.2, { h: 240, font: 74, bg: '#ffe9a8' }), 0, 2.7, .1), at(K.rock(.8, 0x9aa09a), .9, .4, 0)), -1, -15, .2);
    c.hot(3, G(cyl(.08, .08, 2.6, 0x7a5230, 0, 1.3, 0), at(K.sign(['Марқакөл →'], 2, .55, { h: 128, w: 460, font: 70, bg: '#d9f1ff' }), .7, 2.3, 0), K.pedestal(.5).translateX(1.8), at(K.fish(0xd98a6a), 1.8, 1.1, 0, 1.57, .9)), 10, 6, -.5);
    c.add(at(c.fut ? K.flyingCar(c.ups, 0xffffff) : K.jeep(0x4d8b57), Math.sin(8 * .09) * 14 + .5, c.fut ? .9 : 0, 8, .9));
    c.add(at(K.person(0xe4572e, { pack: 0x2f6fa8 }), 4, 0, 12, 2.6), at(K.person(0xffc93c, { pack: 0x16c79a, hat: 0xffffff }), 5.2, 0, 12.6, 2.9));
    for (let i = 0; i < 9; i++) c.add(at(box(1.1, .7, .8, 0x9aa09a), -15 + i * 1.15, .35, -22 + i * .3, .1), i < 8 ? at(box(1.1, .7, .8, 0xa9afa9), -14.4 + i * 1.15, 1.05, -21.8 + i * .3, .1) : null);
  };
})();
