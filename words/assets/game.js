/* The game world: tap to walk, double tap to jump, search under things, travel left to right. Screens over the world live in app.js. */
window.ArticulationGame = (() => {
  const Art = window.ArticulationArt, Scenes = window.ArticulationScenes, Data = window.ArticulationData;
  const PANEL = 3400, VIEW_W = 1600, VIEW_H = 900, BLEED_X = 250, BLEED_Y = 150, ART_W = 2100, ART_H = 1200;
  const SPEED = 300, TAP_REACH = 112, JUMP_REACH = 130, DOUBLE_TAP_MS = 320, SHAKES_TO_OPEN = 3, HERO_SCALE = .58;
  const DECOR = 2 / 3, HOLDER = .83, COVER = .48, FLAT = new Set(['flower', 'shell']);
  const SWAYING = new Set(['tree', 'pine', 'palm', 'sunflower', 'cactus']);
  const WANDERING = { hen: 28, sheep: 24, crab: 40, cat: 30 };
  const COMMON_PROPS = ['dust', 'spark', 'star', 'marker', 'arrow', 'tap', 'tap2'];
  /* How each ride sits: size on screen, distance from its base to its middle and to the child, and how big the child looks inside. */
  const RIDES = { boat: { size: .95, rise: 63, seat: 30, child: HERO_SCALE, sway: 10, away: 980 }, balloon: { size: 1.13, rise: 76, seat: 30, child: HERO_SCALE, sway: 10, away: 620 }, bus: { size: 1.45, rise: 143, seat: 97, child: .36, sway: 2, away: 1300 }, taxi: { size: 1.3, rise: 118, seat: 59, child: .3, sway: 2, away: 1300 } };
  /* Big sprites get sharper source art: this many times the usual 240px. */
  const RES = { 'boat-back': 3, 'boat-front': 3, 'balloon-back': 3, 'balloon-front': 3, 'bus-back': 3, 'bus-front': 3, 'taxi-back': 3, 'taxi-front': 3, shop1: 2, shop2: 2, shop3: 2, shop4: 2, shop5: 2, shop6: 2, shop7: 2, shop8: 2, windmill: 2, blades: 2, lighthouse: 2, cottage: 2, tent: 2, tree: 2, pine: 2, palm: 2, streetlamp: 2, fruitstand: 2, fountain: 2, swing: 2, slide: 2 };
  const res = key => RES[key] || 1;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const seg = (value, a, b) => clamp((value - a) / (b - a), 0, 1);
  const smooth = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  let game, host, hooks, world, dpr = 1;
  const canvases = new Map(), edges = new Map();

  const raster = (svg, width, height) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      resolve(canvas);
    };
    image.onerror = () => reject(Error('تعذّر تجهيز رسوم اللعبة.'));
    image.src = Art.uri(svg);
  });

  /* Each stage is its own full picture; the journey between them is the boat, balloon, door, bus or taxi. */
  function buildWorld(run) {
    const scene = Scenes[run.scenario], sound = Data.soundById(run.sound);
    const stages = run.positions.map((id, i) => {
      const layout = Art.layout(run.scenario, id), ox = i * PANEL, cx = ox + VIEW_W / 2;
      return { id, ride: layout.ride, layout, ox, cx, cy: VIEW_H / 2, words: sound.words[id], poly: new Phaser.Geom.Polygon(layout.walk.map(([x, y]) => [x + ox, y]).flat()) };
    });
    return { run, scene, stages, width: stages.length * PANEL };
  }
  const stageAt = x => clamp(Math.floor((x + 800) / PANEL), 0, world.stages.length - 1);
  const stageById = id => world.stages.find(stage => stage.id === id);

  function fullZoom() { const rect = host.getBoundingClientRect(); return Math.min(rect.width / VIEW_W, rect.height / VIEW_H); }

  function prepare(run) {
    const jobs = [], keys = new Set(COMMON_PROPS), scale = clamp(fullZoom() * (window.devicePixelRatio || 1), 1, 1.5), wanted = new Set();
    if (run.scenario === 'islands') ['butterfly', 'bird'].forEach(key => keys.add(key));
    if (run.scenario === 'house') keys.add('lock');
    if (run.scenario === 'street') keys.add('car');
    for (const stage of world.stages) {
      const key = `stage-${run.scenario}-${stage.id}`, { layout } = stage;
      wanted.add(key);
      jobs.push([key, () => Art.stage(run.scenario, stage.id), Math.round(ART_W * scale), Math.round(ART_H * scale)]);
      stage.words.forEach(word => jobs.push(['obj-' + word.art, () => Art.wordSVG(word.art), 320, 320]));
      [...layout.high, ...layout.covers].forEach(slot => { if (slot.holder) keys.add(slot.holder); });
      layout.decor.forEach(({ key: decor }) => { keys.add(decor); if (decor === 'windmill') keys.add('blades'); if (decor === 'firelogs') keys.add('flame'); });
      if (RIDES[stage.ride]) { keys.add(`${stage.ride}-back`); keys.add(`${stage.ride}-front`); }
      if (layout.door) { jobs.push(['deco-door-closed', () => Art.door(false), 360, 520]); jobs.push(['deco-door-open', () => Art.door(true), 360, 520]); }
    }
    /* Whole-stage pictures are large: keep only the ones this play needs. */
    for (const key of canvases.keys()) if (key.startsWith('stage-') && !wanted.has(key)) canvases.delete(key);
    for (const key of keys) jobs.push(['deco-' + key, () => Art.decoAt(key, 240 * res(key)), 240 * res(key), 240 * res(key)]);
    const kind = hooks.child().character === 'girl' ? 'girl' : 'boy';
    for (const [key, svg] of Object.entries(Art.character(kind))) jobs.push([`${kind}-${key}`, () => svg, 320, 320]);
    return Promise.all(jobs.map(async ([key, make, w, h]) => {
      if (!canvases.has(key)) canvases.set(key, raster(make(), w, h));
      const canvas = await canvases.get(key);
      if (key.startsWith('deco-') && !edges.has(key)) edges.set(key, measureEdges(canvas));
      return [key, canvas];
    })).catch(error => { canvases.clear(); throw error; });
  }

  /* Where a picture really starts and ends, so things stand on the floor instead of floating above it. */
  function measureEdges(canvas) {
    const { width, height } = canvas, data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const row = y => { for (let x = 0; x < width; x += 2) if (data[(y * width + x) * 4 + 3] > 40) return true; return false; };
    let top = 0, bottom = height - 1;
    while (top < height - 1 && !row(top)) top++;
    while (bottom > 0 && !row(bottom)) bottom--;
    return { top: top / height, bottom: (bottom + 1) / height };
  }

  /* Any tap lands on walkable ground: outside the floor, it comes back to the nearest edge. */
  function insideStage(index, x, y) {
    const stage = world.stages[index];
    if (Phaser.Geom.Polygon.Contains(stage.poly, x, y)) return { x, y };
    const points = stage.poly.points;
    let best = points[0], gap = Infinity;
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length], dx = b.x - a.x, dy = b.y - a.y, t = clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1), px = a.x + dx * t, py = a.y + dy * t, d = Math.hypot(x - px, y - py);
      if (d < gap) { gap = d; best = { x: px, y: py }; }
    });
    const home = { x: stage.ox + stage.layout.hero.x, y: stage.layout.hero.y }, length = Math.hypot(home.x - best.x, home.y - best.y) || 1;
    return { x: best.x + (home.x - best.x) / length * 8, y: best.y + (home.y - best.y) / length * 8 };
  }

  class Stage extends Phaser.Scene {
    constructor() { super('island'); }

    create() {
      const art = this.registry.get('art'), wanted = new Set(art.map(([key]) => key));
      for (const key of this.textures.getTextureKeys()) if (/^(stage|obj|deco|boy|girl)-/.test(key) && !wanted.has(key)) this.textures.remove(key);
      for (const [key, canvas] of art) if (!this.textures.exists(key)) this.textures.addCanvas(key, canvas);
      this.child = hooks.child();
      this.progress = hooks.run();
      Object.assign(this, { busy: false, path: [], target: null, dustClock: 0, lift: 0, jumping: false, lastTap: 0, lastTapAt: null, trail: [], calm: reduced(), hintMark: null, rides: {}, doors: {}, items: [], empties: [], clock: 0, walkPhase: 0, walkBlend: 0, moving: false, stopClock: 99, cheerClock: -1, talking: false, gaze: 0, gazeGoal: 0, nextGlance: 2, blinkAt: 1.2, facingBack: false });
      world.stages.forEach((stage, index) => this.drawStage(stage, index));
      this.placeWords();
      this.makeHero();
      this.input.on('pointerdown', pointer => this.tap(pointer));
      this.input.keyboard?.on('keydown-SPACE', () => this.jump());
      this.measureStages();
      this.focusStage(this.firstOpenIndex());
      this.arrow = this.add.image(0, 0, 'deco-arrow').setDepth(5e6).setVisible(false);
      this.exitMark = this.add.image(0, 0, 'deco-arrow').setDepth(5e6).setAngle(90).setScale(.34).setVisible(false);
      this.events.on('update', this.frame, this);
      this.events.once('shutdown', () => this.events.off('update', this.frame, this));
      hooks.tally(this.zoneCount(this.currentZone()), this.currentZone());
      this.time.delayedCall(250, () => this.resume());
    }

    fit() { if (this.stageIndex !== undefined) this.frameStage(); }

    /* Everything on a stage, including the tops of trees and the place the ride waits, so nothing can fall off the screen. */
    measureStages() {
      this.stageBoxes = world.stages.map((stage, index) => {
        const { layout, ox } = stage, box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }, grow = (l, t, r, b) => { box.left = Math.min(box.left, l); box.top = Math.min(box.top, t); box.right = Math.max(box.right, r); box.bottom = Math.max(box.bottom, b); };
        for (const item of this.children.list) {
          if (!(item instanceof Phaser.GameObjects.Image) || !item.visible || stageAt(item.x) !== index || item.depth <= -100 || item.depth >= 3e6 || item.texture.key === 'deco-car') continue;
          const bounds = item.getBounds();
          grow(bounds.left, bounds.top, bounds.right, bounds.bottom);
        }
        /* The floor, with room for the child's head at its far edge. */
        stage.poly.points.forEach(({ x, y }) => grow(x - 70, y - 190, x + 70, y + 40));
        const dock = layout.dock;
        if (dock && index < world.stages.length - 1) grow(ox + dock.x - 190, dock.y - 345, ox + dock.x + 190, dock.y + 24);
        if (world.run.scenario === 'house') grow(ox + 270, 45, ox + 1320, 865);
        if (world.run.scenario === 'street') grow(ox + 10, 40, ox + VIEW_W - 10, 908);
        return box;
      });
    }

    /* The whole stage always shows, below the top bar, on any screen. */
    frameStage() {
      const camera = this.cameras.main, box = this.stageBoxes[this.stageIndex], area = host.getBoundingClientRect(), hud = host.parentElement.querySelector('.hud'), style = getComputedStyle(hud), side = n => parseFloat(style[n]) || 0;
      const edge = { top: hud.getBoundingClientRect().bottom - area.top + 8, bottom: parseFloat(getComputedStyle(host).paddingBottom) || 12, left: side('paddingLeft'), right: side('paddingRight') };
      const width = box.right - box.left, height = box.bottom - box.top, zoom = Math.min((area.width - edge.left - edge.right) / width, (area.height - edge.top - edge.bottom) / height);
      camera.setZoom(zoom * dpr);
      camera.centerOn((box.left + box.right) / 2 + (edge.right - edge.left) / (2 * zoom), (box.top + box.bottom) / 2 - (edge.top - edge.bottom) / (2 * zoom));
    }

    focusStage(index) {
      const stage = world.stages[index], camera = this.cameras.main;
      camera.setBackgroundColor(Art.background(world.run.scenario, stage.id));
      this.stageIndex = index;
      this.frameStage();
    }

    /* Finish anything left open, such as a stage completed just before the app closed. */
    resume() {
      if (this.progress.finished) { hooks.islandDone(); return; }
      for (const stage of world.stages) if (this.zoneCount(stage.id) === stage.words.length && !this.progress.unlocked[stage.id]) { this.finishZone(stage.id); return; }
    }

    zoneCount(id) { return stageById(id).words.filter(word => this.progress.collected[word.art]).length; }
    firstOpenIndex() { const index = world.stages.findIndex(stage => !this.progress.unlocked[stage.id]); return index < 0 ? world.stages.length - 1 : index; }
    currentZone() { return world.stages[this.firstOpenIndex()].id; }
    heroIndex() { return stageAt(this.hero.x); }
    zoneOf(entry) { return world.stages[stageAt(entry.x)]; }

    /* ---- Stages ---- */
    drawStage(stage, index) {
      const { run } = world, key = `stage-${run.scenario}-${stage.id}`, texture = this.textures.get(key).getSourceImage();
      this.add.image(stage.ox - BLEED_X, -BLEED_Y, key).setOrigin(0).setScale(ART_W / texture.width).setDepth(-100);
      if (run.scenario === 'street') {
        this.add.rectangle(stage.cx, 842, 9000, 124, 0xc9c0b0).setDepth(-102);
        this.add.rectangle(stage.cx, 842, 9000, 100, 0x8b8f95).setDepth(-101);
      }
      stage.layout.decor.forEach(entry => this.addDecor(entry.key, stage.ox + entry.x, entry.y, (entry.s ?? 1) * DECOR));
      if (stage.layout.door) this.makeDoor(stage, index);
      if (run.scenario === 'islands' && !this.calm) this.flyers(stage.id === 'last' ? 'bird' : 'butterfly', stage, stage.id === 'last' ? .2 : .17, 3);
      if (run.scenario === 'street' && !this.calm) this.traffic(stage);
    }

    traffic(stage) {
      const car = this.add.image(stage.ox - 400, 815, 'deco-car').setScale(.62).setDepth(900);
      this.tweens.add({ targets: car, x: stage.ox + 2000, duration: 9000, delay: 1500, repeat: -1, repeatDelay: 5200 });
    }

    flyers(key, stage, size, count) {
      for (let i = 0; i < count; i++) {
        const y = stage.cy - 260 + i * 200, flyer = this.add.image(stage.cx, y, 'deco-' + key).setScale(size).setDepth(3e6);
        this.tweens.add({ targets: flyer, x: { from: stage.cx - 380, to: stage.cx + 380 }, duration: Phaser.Math.Between(11000, 17000), yoyo: true, repeat: -1, ease: 'Sine.inOut', onYoyo: () => flyer.toggleFlipX(), onRepeat: () => flyer.toggleFlipX() });
        this.tweens.add({ targets: flyer, y: y - 70, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.tweens.add({ targets: flyer, scaleY: size * .35, duration: 170, yoyo: true, repeat: -1 });
      }
    }

    groundShadow(x, y, width) { return this.add.image(x, y, 'deco-dust').setTint(0x5a3d2b).setAlpha(.16).setScale(width, width * .28).setDepth(y - 450); }
    edgesOf(key) { return edges.get('deco-' + key) || { top: 0, bottom: .95 }; }
    heightOf(key, size) { const { top, bottom } = this.edgesOf(key); return (bottom - top) * 240 * size; }

    standing(key, x, y, size) { return this.add.image(x, y, 'deco-' + key).setOrigin(.5, this.edgesOf(key).bottom).setScale(size / res(key)).setDepth(y); }

    addTree(key, x, y, size) {
      this.groundShadow(x, y - 4, .62 * size);
      const item = this.standing(key, x, y, size);
      if (!this.calm) this.tweens.add({ targets: item, angle: { from: -1.4, to: 1.4 }, duration: Phaser.Math.Between(2200, 3600), yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return item;
    }

    prop(key, x, y, size) { this.groundShadow(x, y - 3, .6 * size); return this.standing(key, x, y, size); }

    /* Each scene's own life: a turning windmill, a flickering campfire, a blinking lighthouse, wandering animals. */
    addDecor(key, x, y, size = 1) {
      if (FLAT.has(key)) { this.standing(key, x, y, .2).setDepth(y - 400); return; }
      if (SWAYING.has(key)) { this.addTree(key, x, y, size); return; }
      const item = this.prop(key, x, y, size), lifted = dy => y + dy * size + (.95 - this.edgesOf(key).bottom) * 240 * size;
      if (key === 'windmill') {
        const blades = this.add.image(x, lifted(-160.8), 'deco-blades').setScale(size * 1.1 / res('blades')).setDepth(y + 1);
        if (!this.calm) this.tweens.add({ targets: blades, angle: 360, duration: 9000, repeat: -1 });
      }
      if (key === 'firelogs') {
        const flame = this.add.image(x, lifted(-30), 'deco-flame').setOrigin(.5, .95).setScale(size * .8).setDepth(y + 1);
        if (!this.calm) this.tweens.add({ targets: flame, scaleY: size * .95, scaleX: size * .72, duration: 170, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      if (key === 'lighthouse') {
        const glow = this.add.image(x, lifted(-178.8), 'deco-spark').setScale(size * .55).setDepth(y + 1).setAlpha(.9);
        if (!this.calm) this.tweens.add({ targets: glow, scale: size * .95, alpha: .25, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      if (WANDERING[key] && !this.calm) this.wander(item, x, WANDERING[key]);
    }

    wander(item, home, distance) {
      const walk = direction => this.tweens.add({ targets: item, x: home + direction * distance, duration: 2400, hold: 900, ease: 'Sine.inOut', onStart: () => item.setFlipX(direction < 0), onComplete: () => walk(-direction) });
      this.tweens.add({ targets: item, angle: { from: -3, to: 3 }, duration: 260, yoyo: true, repeat: -1 });
      walk(1);
    }

    makeDoor(stage, index) {
      const x = stage.ox + 1130, y = 350, closed = this.add.image(x, y, 'deco-door-closed').setOrigin(0).setScale(.5).setDepth(-50), open = this.add.image(x, y, 'deco-door-open').setOrigin(0).setScale(.5).setDepth(-50).setVisible(false);
      const wanted = index < world.stages.length - 1, unlocked = this.progress.unlocked[stage.id], spot = stage.layout.door.lock;
      this.doors[stage.id] = { closed, open, lock: wanted && !unlocked ? this.add.image(stage.ox + spot.x, spot.y, 'deco-lock').setScale(.42).setDepth(-49) : null };
    }

    /* ---- Words ---- */
    placeWords() {
      world.stages.forEach(stage => {
        const { layout, ox } = stage, slots = [...layout.ground.map(slot => ({ ...slot, kind: 'ground' })), ...layout.high.map(slot => ({ ...slot, kind: 'high' })), ...layout.covers.filter(slot => slot.full).map(slot => ({ ...slot, kind: 'hidden' }))];
        stage.words.forEach((word, i) => {
          const slot = slots[i], x = ox + slot.x, done = this.progress.collected[word.art];
          if (slot.kind === 'high' && slot.holder) { if (SWAYING.has(slot.holder)) this.addTree(slot.holder, x, slot.y, HOLDER); else this.prop(slot.holder, x, slot.y, HOLDER); }
          if (!done) this.items.push(this.makeItem(word, x, slot.y, slot, stage));
        });
        if (this.zoneCount(stage.id) < stage.words.length) layout.covers.filter(slot => !slot.full).forEach(slot => this.empties.push(this.makeCover(slot.holder, ox + slot.x, slot.y)));
      });
    }

    makeCover(key, x, y) {
      const cover = this.standing(key, x, y, COVER).setDepth(y + 2), shadow = this.groundShadow(x, y - 2, .42);
      if (!this.calm) this.time.addEvent({ delay: 3400 + Math.random() * 1800, loop: true, callback: () => { if (cover.active && !this.tweens.isTweening(cover)) this.tweens.add({ targets: cover, angle: 3.5, duration: 90, yoyo: true, repeat: 3 }); } });
      return { x, y, cover, coverShadow: shadow, shakes: 0, covers: true };
    }

    makeItem(word, x, y, slot, stage) {
      const size = world.run.scenario === 'house' ? 100 : 118, { kind, holder } = slot, high = kind === 'high';
      const ground = high && holder ? y - this.heightOf(holder, HOLDER) + 8 : y;
      const item = { word, x, y, kind, size, ground, sparks: [], shakes: 0, stand: high ? { x: stage.ox + slot.stand.x, y: slot.stand.y } : null };
      item.shadow = this.add.image(x, y + 4, 'deco-dust').setTint(0x5a3d2b).setAlpha(.2).setScale(.36, .1).setDepth(y - 300).setVisible(!high && kind !== 'hidden');
      item.image = this.add.image(x, ground - size / 2, 'obj-' + word.art).setScale(size / 320).setDepth(y + 3).setVisible(kind !== 'hidden');
      if (kind === 'hidden') { Object.assign(item, this.makeCover(holder, x, y)); return item; }
      this.animateItem(item);
      return item;
    }

    animateItem(item) {
      if (this.calm) return;
      const { x, ground, size } = item, top = ground - size / 2;
      item.bob = this.tweens.add({ targets: item.image, y: top - 10, duration: 900 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      for (let i = 0; i < 2; i++) {
        const spark = this.add.image(x + (i ? 56 : -52), ground - (i ? 96 : 44), 'deco-spark').setScale(0).setDepth(item.y + 4);
        this.tweens.add({ targets: spark, scale: .13, angle: 90, duration: 700, delay: i * 650 + Math.random() * 500, yoyo: true, repeat: -1, repeatDelay: 500 });
        item.sparks.push(spark);
      }
    }

    /* ---- The child: built from parts, faces the way she walks, never snaps between poses ---- */
    makeHero() {
      const kind = this.child.character === 'girl' ? 'girl' : 'boy', part = (key, x, y, ox = .5, oy = .5, size = 1) => this.add.image(x, y, `${kind}-${key}`).setOrigin(ox, oy).setScale(size * 200 / 320);
      const stage = world.stages[this.firstOpenIndex()], start = { x: stage.ox + stage.layout.hero.x, y: stage.layout.hero.y };
      this.shadow = this.add.image(0, 0, 'deco-dust').setTint(0x5a3d2b).setAlpha(.24).setScale(.46, .13);
      this.legL = part('leg', -24, -88, .5, .05, .56); this.legR = part('leg', 24, -88, .5, .05, .56);
      this.bodyFront = part('body_f', 0, -142); this.bodyBack = part('body_b', 0, -142).setVisible(false);
      this.armL = part('arm', -58, -176, .5, .1, .62); this.armR = part('arm', 58, -176, .5, .1, .62);
      this.hair = part('hair_f', 0, -126, .5, .18); this.headFront = part('head_f', 0, -62); this.headBack = part('head_b', 0, -62).setVisible(false);
      this.eyes = part('face_eyes', 0, -50, .5, .56); this.closed = part('face_closed', 0, -62).setVisible(false); this.happy = part('face_happy', 0, -62).setVisible(false); this.mouth = part('face_mouth', 0, -16, .5, .73).setVisible(false);
      this.headGroup = this.add.container(0, -178, [this.hair, this.headFront, this.headBack, this.eyes, this.closed, this.happy, this.mouth]);
      this.rig = this.add.container(0, 0, [this.legL, this.legR, this.bodyFront, this.bodyBack, this.armL, this.armR, this.headGroup]);
      this.hero = this.add.container(start.x, start.y, [this.shadow, this.rig]).setScale(HERO_SCALE).setDepth(start.y);
      this.partScale = 200 / 320;
    }

    setFacing(back) {
      if (back === this.facingBack) return;
      this.facingBack = back;
      this.bodyFront.setVisible(!back); this.bodyBack.setVisible(back);
      this.headFront.setVisible(!back); this.headBack.setVisible(back); this.hair.setVisible(!back);
      if (back) { this.rig.bringToTop(this.bodyBack); this.rig.bringToTop(this.headGroup); }
      else { this.rig.bringToTop(this.armL); this.rig.bringToTop(this.armR); this.rig.bringToTop(this.headGroup); }
    }

    lidAmount(age) { if (age < 0 || age > .34) return 0; if (age < .11) return smooth(age / .11); if (age < .15) return 1; return 1 - smooth((age - .15) / .19); }

    animateHero(delta) {
      const seconds = delta / 1000, life = this.calm ? 0 : 1;
      this.clock += seconds; this.stopClock += seconds;
      if (this.moving) this.walkPhase += seconds * 13;
      this.walkBlend += clamp((this.moving ? 1 : 0) - this.walkBlend, -seconds * 5, seconds * 5);
      const blend = smooth(this.walkBlend), { clock, walkPhase } = this, swing = Math.sin(walkPhase) * .52 * blend, armSwing = Math.sin(walkPhase - .5) * .42 * blend, bob = Math.abs(Math.cos(walkPhase)) * blend, breath = Math.sin(Math.PI * 2 * clock / 3.8) * (1 - blend) * life;
      this.legL.rotation = swing; this.legR.rotation = -swing;
      let raise = this.jumping ? 1 : 0, hop = this.lift;
      const cheering = this.cheerClock >= 0;
      if (cheering) {
        this.cheerClock += seconds;
        raise = Math.max(raise, smooth(seg(this.cheerClock, .02, .26)) * (1 - smooth(seg(this.cheerClock, 1.05, 1.4))));
        const p = seg(this.cheerClock, .05, .62);
        hop += 4 * p * (1 - p) * 50;
        if (this.cheerClock > 1.45) this.cheerClock = -1;
      }
      const idleArm = Math.sin(Math.PI * 2 * (clock / 3.8 + .1)) * .025 * (1 - blend) * life;
      this.armL.rotation = -armSwing + idleArm + raise * 2.5; this.armR.rotation = armSwing - idleArm - raise * 2.5;
      const body = this.facingBack ? this.bodyBack : this.bodyFront;
      body.y = -142 - bob * 7 - breath * 1.2;
      body.setScale(this.partScale, this.partScale * (1 + .016 * breath));
      this.rig.rotation = .05 * blend;
      this.rig.y = -hop / HERO_SCALE;
      this.shadow.setScale(.46 * (1 - hop / 220), .13 * (1 - hop / 220));
      if (clock > this.nextGlance && life) { this.gazeGoal = [-4, 0, 4][Math.floor(clock * 7) % 3]; this.nextGlance = clock + 2.2 + (clock * 3.7) % 1.8; }
      if (this.moving) this.gazeGoal = 4;
      this.gaze += (this.gazeGoal - this.gaze) * (1 - Math.exp(-seconds * 9));
      this.headGroup.y = -178 - Math.abs(Math.cos(walkPhase - .35)) * 9 * blend - breath * 2.2;
      const tilt = this.gaze * .013;
      this.headGroup.rotation = tilt - .03 * blend + Math.sin(Math.PI * 2 * (clock / 5.3 + .2)) * .012 * (1 - blend) * life;
      const settle = life * .075 * Math.exp(-this.stopClock * 2.6) * Math.sin(this.stopClock * 9);
      this.hair.rotation = -.05 * blend + .05 * Math.sin(walkPhase - .9) * blend + settle + Math.sin(Math.PI * 2 * clock / 4.6) * .018 * (1 - blend) * life - tilt * .5;
      if (clock > this.blinkAt + .34) this.blinkAt = clock + 2.6 + (clock * 2.3) % 1.4;
      const lid = this.lidAmount(clock - this.blinkAt), joyful = cheering && this.cheerClock < 1.2, face = !this.facingBack;
      this.eyes.setVisible(face && !joyful && lid < .97).setX(this.gaze).setScale(this.partScale, this.partScale * (1 - lid * .92));
      this.closed.setVisible(face && !joyful && lid >= .9);
      this.happy.setVisible(face && joyful);
      let open = cheering ? smooth(seg(this.cheerClock, .05, .25)) * (1 - smooth(seg(this.cheerClock, 1, 1.25))) : 0;
      if (this.talking) open = Math.max(open, life ? .6 + .4 * Math.sin(clock * 14) : .8);
      this.mouth.setVisible(face && open > .02).setScale(this.partScale * (.5 + .5 * open), this.partScale * open);
    }

    /* ---- Tapping and walking ---- */
    aimPoint(item) { return { x: item.x, y: item.covers ? item.y - 40 : item.image.y }; }
    pick(x, y) {
      /* On a small screen everything is smaller, so a finger still gets a generous target. */
      let best = null, reach = Math.max(TAP_REACH, 36 / (this.cameras.main.zoom / dpr));
      const here = this.heroIndex();
      const consider = (entry, point, extra = 0) => { const d = Math.hypot(point.x - x, point.y - y) - extra; if (d < reach) { best = entry; reach = d; } };
      for (const item of this.items) if (stageAt(item.x) === here) consider(item, this.aimPoint(item));
      for (const empty of this.empties) if (stageAt(empty.x) === here) consider(empty, { x: empty.x, y: empty.y - 40 });
      for (const ride of Object.values(this.rides)) if (ride.index === here) { consider(ride, { x: ride.x, y: ride.y - (RIDES[ride.kind]?.rise ?? 60) }, 90); consider(ride, ride.stand, 40); }
      return best;
    }

    tap(pointer) {
      if (this.busy) return;
      hooks.unlock();
      const x = pointer.worldX, y = pointer.worldY, now = this.time.now;
      if (this.arrow.visible && Math.hypot(this.arrow.x - x, this.arrow.y - y) < 95 / (this.cameras.main.zoom / dpr)) { const goal = this.nextGoal(); if (goal?.ref) { this.goTo(goal.ref, goal.ref.x, goal.ref.y); return; } }
      const entry = this.pick(x, y);
      if (entry?.covers && this.nearHero(entry, 175)) { this.lastTap = 0; this.path = []; this.moving = false; this.search(entry); return; }
      if (this.lastTapAt && now - this.lastTap < DOUBLE_TAP_MS && Phaser.Math.Distance.Between(pointer.x, pointer.y, this.lastTapAt.x, this.lastTapAt.y) < 70 * dpr) { this.lastTap = 0; this.jumpFromDoubleTap(); return; }
      this.lastTap = now; this.lastTapAt = { x: pointer.x, y: pointer.y };
      this.goTo(entry, x, y);
    }
    nearHero(entry, distance) { return Phaser.Math.Distance.Between(entry.x, entry.y, this.hero.x, this.hero.y) < distance; }
    jumpFromDoubleTap() { this.path = []; this.target = null; this.moving = false; this.clearTrail(); this.jump(); }

    goTo(entry, x, y) {
      this.target = entry;
      this.clearHint();
      if (entry?.isRide) { this.showMarker(entry.stand.x, entry.stand.y); this.setPath(this.routeOnStage(entry.stand)); return; }
      if (entry?.kind === 'high') { this.showMarker(entry.stand.x, entry.stand.y); this.setPath(this.routeOnStage(entry.stand)); return; }
      if (entry) {
        const side = this.hero.x < entry.x ? -92 : 92;
        this.showMarker(entry.x, entry.y);
        this.setPath(this.routeOnStage({ x: entry.x + side, y: entry.y + 12 }));
        return;
      }
      this.showMarker(x, y);
      this.setPath(this.routeOnStage({ x, y }));
    }

    /* A straight walk unless it would leave the floor; then go through the middle. */
    routeOnStage(goal) {
      const index = this.heroIndex(), stage = world.stages[index], hero = this.hero, target = insideStage(index, goal.x, goal.y);
      for (let i = 1; i <= 24; i++) {
        const t = i / 24;
        if (!Phaser.Geom.Polygon.Contains(stage.poly, hero.x + (target.x - hero.x) * t, hero.y + (target.y - hero.y) * t)) return [{ x: stage.ox + stage.layout.hero.x, y: stage.layout.hero.y }, target];
      }
      return [target];
    }

    setPath(points) { this.path = points; this.drawTrail(points); }
    showMarker(x, y) {
      const mark = this.add.image(x, y, 'deco-marker').setScale(.15).setAlpha(.9).setDepth(-1);
      this.tweens.add({ targets: mark, scale: .42, alpha: 0, duration: 480, ease: 'Quad.out', onComplete: () => mark.destroy() });
    }
    clearTrail() { this.trail.forEach(dot => dot.destroy()); this.trail = []; }
    drawTrail(points) {
      this.clearTrail();
      if (this.calm) return;
      let from = this.hero, placed = 0;
      for (const point of points) {
        const length = Phaser.Math.Distance.Between(from.x, from.y, point.x, point.y), count = Math.floor(length / 58);
        for (let i = 1; i <= count && placed < 24; i++, placed++) {
          const t = i / count, dot = this.add.image(from.x + (point.x - from.x) * t, from.y + (point.y - from.y) * t, 'deco-dust').setTint(0x5a3d2b).setScale(.05).setAlpha(.5).setDepth(-2);
          this.trail.push(dot);
        }
        from = point;
      }
    }

    frame(time, delta) {
      this.moveHero(delta);
      this.animateHero(delta);
      this.pointArrow(time);
      if (this.exitMark.visible && !this.calm) this.exitMark.y = this.exitMark.baseY + Math.sin(time * .007) * 9;
    }

    moveHero(delta) {
      const hero = this.hero;
      if (!this.path.length) return;
      const next = this.path[0], dx = next.x - hero.x, dy = next.y - hero.y, gap = Math.hypot(dx, dy), step = SPEED * delta / 1000;
      if (gap <= step) {
        hero.setPosition(next.x, next.y); this.path.shift();
        if (!this.path.length) { this.moving = false; this.stopClock = 0; this.setFacing(false); this.clearTrail(); hero.setDepth(hero.y); this.arrive(); return; }
      } else {
        this.moving = true;
        hero.x += dx / gap * step; hero.y += dy / gap * step;
        if (Math.abs(dx) > 2) hero.scaleX = (dx < 0 ? -1 : 1) * Math.abs(hero.scaleX);
        this.setFacing(dy < -Math.abs(dx) * .35);
        if (this.trail.length && Phaser.Math.Distance.Between(this.trail[0].x, this.trail[0].y, hero.x, hero.y) < 40) this.trail.shift().destroy();
      }
      hero.setDepth(hero.y);
      this.dustClock += delta;
      if (this.dustClock > 170 && !this.calm) {
        this.dustClock = 0;
        const puff = this.add.image(hero.x, hero.y, 'deco-dust').setTint(0xc9b08c).setAlpha(.5).setScale(.09).setDepth(hero.y - 2);
        this.tweens.add({ targets: puff, y: hero.y - 18, scale: .18, alpha: 0, duration: 420, onComplete: () => puff.destroy() });
      }
    }

    arrive() {
      const entry = this.target; this.target = null;
      if (!entry) { this.checkHighHint(); return; }
      if (entry.isRide) { this.leaveStage(entry); return; }
      if (entry.covers) { this.search(entry); return; }
      if (entry.kind === 'high') { this.showJumpHint(); return; }
      this.meet(entry);
    }

    /* ---- Jumping and searching ---- */
    highItemNear() { return this.items.find(item => item.kind === 'high' && stageAt(item.x) === this.heroIndex() && Phaser.Math.Distance.Between(item.stand.x, item.stand.y, this.hero.x, this.hero.y) < JUMP_REACH); }
    checkHighHint() { if (this.highItemNear()) this.showJumpHint(); }
    showJumpHint() {
      this.clearHint();
      hooks.sfx('hint');
      this.hintMark = this.add.image(this.hero.x, this.hero.y - 200, 'deco-tap2').setScale(.42).setDepth(4.2e6);
      if (!this.calm) this.tweens.add({ targets: this.hintMark, scale: .5, duration: 330, yoyo: true, repeat: -1 });
    }
    clearHint() { if (this.hintMark) { this.hintMark.destroy(); this.hintMark = null; } }

    jump() {
      if (this.busy || this.jumping) return;
      this.jumping = true;
      this.clearHint();
      hooks.sfx('jump');
      this.tweens.add({ targets: this, lift: 135, duration: this.calm ? 1 : 240, ease: 'Quad.out', yoyo: true, hold: 40, onYoyo: () => this.catchHigh(), onComplete: () => { this.jumping = false; this.lift = 0; } });
    }

    catchHigh() {
      const item = this.highItemNear();
      if (!item) return;
      item.kind = 'ground';
      this.busy = true;
      this.tweens.killTweensOf(item.image);
      item.bob = null;
      item.sparks.forEach(spark => { this.tweens.killTweensOf(spark); spark.destroy(); });
      item.sparks = [];
      this.burst(item.image.x, item.image.y, 8);
      hooks.sfx('boing');
      const side = this.hero.scaleX < 0 ? -70 : 70, x = this.hero.x + side, y = this.hero.y + 6;
      Object.assign(item, { x, y, ground: y });
      item.shadow.setPosition(x, y + 4).setDepth(y - 300);
      item.image.setDepth(y + 3);
      this.tweens.add({ targets: item.image, x, y: y - item.size / 2, duration: this.calm ? 1 : 520, ease: 'Bounce.out', onComplete: () => { item.shadow.setVisible(true); this.meet(item); } });
    }

    search(entry) {
      if (this.tweens.isTweening(entry.cover) && entry.shakes === 0) this.tweens.killTweensOf(entry.cover);
      entry.shakes++;
      hooks.sfx('rustle');
      this.tweens.add({ targets: entry.cover, angle: 8, duration: 70, yoyo: true, repeat: 2 });
      this.clearHint();
      if (entry.shakes < SHAKES_TO_OPEN) {
        this.hintMark = this.add.image(entry.x, entry.y - 150, 'deco-tap').setScale(.38).setDepth(4.2e6);
        if (!this.calm) this.tweens.add({ targets: this.hintMark, y: entry.y - 130, duration: 300, yoyo: true, repeat: -1 });
        return;
      }
      this.tweens.killTweensOf(entry.cover);
      this.tweens.add({ targets: entry.cover, y: entry.y - 110, alpha: 0, angle: 24, duration: this.calm ? 1 : 420, onComplete: () => entry.cover.destroy() });
      entry.coverShadow.destroy();
      entry.covers = false;
      if (!entry.word) { this.empties = this.empties.filter(item => item !== entry); this.releaseSurprise(entry); return; }
      entry.kind = 'ground';
      this.busy = true;
      entry.image.setVisible(true).setPosition(entry.x, entry.y).setScale(.02);
      entry.shadow.setVisible(true);
      this.burst(entry.x, entry.y - 40, 12);
      hooks.sfx('boing');
      this.tweens.add({ targets: entry.image, y: entry.y - entry.size / 2, scale: entry.size / 320, duration: this.calm ? 1 : 460, ease: 'Back.out', onComplete: () => this.meet(entry) });
    }

    releaseSurprise(entry) {
      if (this.calm) return;
      const flyer = this.add.image(entry.x, entry.y - 30, 'deco-star').setScale(.14).setDepth(4.2e6);
      this.tweens.add({ targets: flyer, x: entry.x + 150, y: entry.y - 380, angle: 300, alpha: 0, duration: 1000, ease: 'Sine.in', onComplete: () => flyer.destroy() });
    }

    async meet(item) {
      this.busy = true;
      this.clearHint();
      this.hero.scaleX = (item.x < this.hero.x ? -1 : 1) * Math.abs(this.hero.scaleX);
      this.talking = true;
      if (item.bob) { item.bob.stop(); item.bob = null; item.image.y = item.ground - item.size / 2; }
      this.tweens.add({ targets: item.image, scale: item.size / 320 * 1.25, duration: 180, yoyo: true, ease: 'Back.out' });
      await hooks.encounter(item.word);
      if (!this.scene.isActive()) return;
      this.talking = false;
      this.collect(item);
      const zone = item.word.zone, count = this.zoneCount(zone);
      hooks.tally(count, zone);
      if (count === stageById(zone).words.length) await this.finishZone(zone);
      this.busy = false;
    }

    /* app.js has already flown the picture into the backpack. */
    collect(item) {
      this.items = this.items.filter(entry => entry !== item);
      this.tweens.killTweensOf([item.image, item.shadow, ...item.sparks]);
      [item.image, item.shadow, ...item.sparks].forEach(part => part.destroy());
      this.burst(item.x, item.y - 50, 12);
      if (!this.calm) this.cheerClock = 0;
    }

    burst(x, y, count) {
      const total = this.calm ? 0 : count, keys = ['deco-star', 'deco-spark'];
      for (let i = 0; i < total; i++) {
        const angle = Math.PI * 2 * i / total, far = 70 + Math.random() * 110;
        const bit = this.add.image(x, y, keys[i % 2]).setScale(.1).setDepth(4.5e6);
        this.tweens.add({ targets: bit, x: x + Math.cos(angle) * far, y: y + Math.sin(angle) * far, angle: 240, scale: 0, duration: 640, ease: 'Cubic.out', onComplete: () => bit.destroy() });
      }
    }

    /* Ten collected: show the board, then the way to the next stage opens. */
    async finishZone(id) {
      this.busy = true; this.path = []; this.moving = false; this.clearHint();
      await new Promise(resolve => this.time.delayedCall(450, resolve));
      await hooks.zoneDone(id);
      if (!this.scene.isActive()) return;
      const index = world.stages.findIndex(stage => stage.id === id);
      this.empties.filter(entry => stageAt(entry.x) === index).forEach(entry => {
        entry.cover.destroy();
        entry.coverShadow.destroy();
        this.empties = this.empties.filter(item => item !== entry);
      });
      this.progress.unlocked[id] = true;
      if (index === world.stages.length - 1) { this.progress.finished = true; hooks.save(); hooks.sfx('fanfare'); this.burst(this.hero.x, this.hero.y - 90, 26); hooks.islandDone(); return; }
      hooks.save();
      await this.summonRide(id);
      this.busy = false;
    }

    /* ---- Getting between stages, always left to right ---- */
    floatParts(kind, x, y) {
      const spec = RIDES[kind], scale = spec.size / res(`${kind}-back`);
      return { rise: spec.rise, back: this.add.image(x, y - spec.rise, `deco-${kind}-back`).setScale(scale).setDepth(2e6), front: this.add.image(x, y - spec.rise, `deco-${kind}-front`).setScale(scale).setDepth(2e6 + 2) };
    }

    showExit(x, y) { this.exitMark.setVisible(true).setPosition(x, y); this.exitMark.baseY = y; }

    summonRide(id) {
      const index = world.stages.findIndex(stage => stage.id === id), stage = world.stages[index], { layout, ox, ride: kind } = stage;
      hooks.sfx('fanfare');
      return new Promise(resolve => {
        const ready = ride => { this.rides[id] = ride; this.burst(ride.x, ride.y - 60, 18); resolve(); };
        const duration = this.calm ? 1 : 1400;
        if (kind === 'door') {
          const spot = layout.door, stand = { x: ox + spot.stand.x, y: spot.stand.y }, door = this.doors[id];
          this.showExit(stand.x, stand.y - 190);
          this.tweens.add({ targets: door.lock, y: door.lock.y + 160, angle: 40, alpha: 0, duration: this.calm ? 1 : 520, ease: 'Quad.in', onComplete: () => { door.lock.destroy(); door.lock = null; door.closed.setVisible(false); door.open.setVisible(true); ready({ isRide: true, index, id, kind, x: stand.x, y: stand.y, stand }); } });
          return;
        }
        const dock = layout.dock, x = ox + dock.x, y = dock.y, parts = this.floatParts(kind, x, y), start = kind === 'balloon' ? { x, y: y - 900 } : kind === 'boat' ? { x: x + 900, y } : { x: x - 1500, y };
        parts.back.setPosition(start.x, start.y - parts.rise); parts.front.setPosition(start.x, start.y - parts.rise);
        this.showExit(x, y - 330);
        this.tweens.add({ targets: [parts.back, parts.front], x, y: y - parts.rise, duration, ease: 'Sine.out', onComplete: () => { this.swayFloat(parts, y, kind); ready({ isRide: true, index, id, kind, x, y, stand: { x: ox + dock.standx, y: dock.standy }, parts }); } });
      });
    }

    swayFloat(parts, y, kind) { if (!this.calm) parts.sway = this.tweens.add({ targets: [parts.back, parts.front], y: y - parts.rise - RIDES[kind].sway, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }

    leaveStage(ride) {
      this.busy = true;
      this.clearHint();
      this.exitMark.setVisible(false);
      hooks.sfx('whoosh');
      const hero = this.hero, done = () => this.travel(ride), quick = ms => this.calm ? 1 : ms;
      hero.scaleX = Math.abs(hero.scaleX);
      if (ride.kind === 'door') { this.setFacing(true); this.tweens.add({ targets: hero, alpha: 0, y: hero.y - 16, duration: quick(420), onComplete: done }); return; }
      const { parts } = ride, spec = RIDES[ride.kind], balloon = ride.kind === 'balloon', boat = ride.kind === 'boat', seat = ride.y - spec.seat;
      parts.sway?.stop();
      hero.setDepth(2e6 + 1);
      this.tweens.add({ targets: hero, x: ride.x, y: seat, scaleX: spec.child, scaleY: spec.child, duration: quick(380), ease: 'Sine.inOut', onComplete: () => {
        const motion = { t: 0 }, fromY = parts.back.y;
        this.tweens.add({ targets: motion, t: 1, duration: quick(balloon ? 1900 : 1600), ease: 'Sine.in', onUpdate: () => {
          const x = ride.x + spec.away * motion.t, lift = balloon ? -720 * motion.t : Math.sin(motion.t * 18) * (boat ? 5 : 1.5);
          parts.back.setPosition(x, fromY + lift); parts.front.setPosition(x, fromY + lift); hero.setPosition(x, seat + lift);
        }, onComplete: () => { parts.back.destroy(); parts.front.destroy(); done(); } });
      } });
    }

    travel(ride) {
      const camera = this.cameras.main, next = ride.index + 1, length = this.calm ? 1 : 280;
      camera.fadeOut(length, 246, 232, 208);
      camera.once('camerafadeoutcomplete', () => {
        const stage = world.stages[next], hero = this.hero;
        hero.setAlpha(1).setScale(HERO_SCALE).setPosition(stage.ox + stage.layout.hero.x, stage.layout.hero.y).setDepth(stage.layout.hero.y);
        this.setFacing(false);
        this.focusStage(next);
        camera.fadeIn(length, 246, 232, 208);
        this.arriveAt(stage, ride.kind);
      });
    }

    arriveAt(stage, kind) {
      const hero = this.hero, settled = () => { this.busy = false; hooks.tally(this.zoneCount(this.currentZone()), this.currentZone()); }, quick = ms => this.calm ? 1 : ms;
      if (RIDES[kind]) {
        const spec = RIDES[kind], spot = stage.layout.arrive, goal = { x: stage.ox + spot.x, y: spot.y }, land = { x: stage.ox + spot.standx, y: spot.standy }, balloon = kind === 'balloon';
        const parts = this.floatParts(kind, goal.x, goal.y), start = { x: goal.x - 760, y: goal.y - (balloon ? 260 : 0) }, motion = { t: 0 }, place = () => {
          const x = start.x + (goal.x - start.x) * motion.t, y = start.y + (goal.y - start.y) * motion.t;
          parts.back.setPosition(x, y - parts.rise); parts.front.setPosition(x, y - parts.rise); hero.setPosition(x, y - spec.seat);
        };
        hero.setDepth(2e6 + 1).setScale(spec.child); place();
        this.tweens.add({ targets: motion, t: 1, duration: quick(1500), ease: 'Sine.out', onUpdate: place, onComplete: () => {
          this.tweens.add({ targets: hero, x: land.x, y: land.y, scaleX: HERO_SCALE, scaleY: HERO_SCALE, duration: quick(380), ease: 'Sine.inOut', onComplete: () => {
            hero.setDepth(land.y);
            const leaving = kind === 'boat' || kind === 'balloon' ? { x: '-=420', alpha: 0 } : { x: '+=1500' };
            this.tweens.add({ targets: [parts.back, parts.front], ...leaving, duration: quick(kind === 'boat' || kind === 'balloon' ? 700 : 1400), ease: 'Sine.in', onComplete: () => { parts.back.destroy(); parts.front.destroy(); } });
            settled();
          } });
        } });
        return;
      }
      hero.setAlpha(0);
      this.tweens.add({ targets: hero, alpha: 1, duration: quick(350), onComplete: settled });
    }

    /* A bouncing arrow at the screen edge leads children to the next thing to reach. Tapping it walks there. */
    pointArrow(time) {
      const goal = this.nextGoal(), view = this.cameras.main.worldView;
      if (!goal || this.busy || view.contains(goal.x, goal.y)) { this.arrow.setVisible(false); return; }
      const scale = 1 / (this.cameras.main.zoom / dpr), inset = 62 * scale, bounce = this.calm ? 0 : Math.sin(time * .007) * 9 * scale;
      const cx = view.centerX, cy = view.centerY + 36 * scale, dx = goal.x - cx, dy = goal.y - cy, angle = Math.atan2(dy, dx);
      const fit = Math.min((view.width / 2 - inset) / Math.max(1, Math.abs(dx)), (view.height / 2 - inset - 36 * scale) / Math.max(1, Math.abs(dy)));
      this.arrow.setVisible(true).setRotation(angle).setScale(.3 * scale).setPosition(cx + dx * fit + Math.cos(angle) * bounce, cy + dy * fit + Math.sin(angle) * bounce);
    }

    nextGoal() {
      const id = this.currentZone(), index = world.stages.findIndex(stage => stage.id === id), here = this.heroIndex();
      if (here < index) { const ride = this.rides[world.stages[here].id]; if (ride) return { x: ride.x, y: ride.y, ref: ride }; }
      const open = this.items.filter(item => item.word.zone === id), rest = open.filter(item => item.kind !== 'hidden' || !item.covers);
      const list = rest.length ? rest : open;
      if (!list.length) return null;
      const nearest = list.reduce((a, b) => (Phaser.Math.Distance.Between(a.x, a.y, this.hero.x, this.hero.y) < Phaser.Math.Distance.Between(b.x, b.y, this.hero.x, this.hero.y) ? a : b));
      return { x: nearest.x, y: nearest.y, ref: nearest };
    }
  }

  function measure() {
    const rect = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    return [Math.max(1, Math.round(rect.width * dpr)), Math.max(1, Math.round(rect.height * dpr))];
  }

  async function open(element, callbacks) {
    host = element; hooks = callbacks;
    world = buildWorld(hooks.run());
    const art = await prepare(world.run);
    if (game) {
      game.registry.set('art', art);
      game.loop.wake();
      resize();
      const scene = game.scene.getScene('island');
      if (scene.scene.isActive() || scene.scene.isPaused()) scene.scene.restart(); else game.scene.start('island');
      return;
    }
    const [width, height] = measure();
    game = new Phaser.Game({
      type: Phaser.AUTO, parent: host, width, height, backgroundColor: Art.background(world.run.scenario, world.stages[0].id), banner: false,
      scale: { mode: Phaser.Scale.NONE, zoom: 1 / dpr }, audio: { noAudio: true }, input: { activePointers: 1 },
      callbacks: { preBoot: instance => instance.registry.set('art', art) }, scene: Stage,
    });
    new ResizeObserver(resize).observe(host);
  }

  function resize() {
    if (!game || !host.offsetWidth) return;
    const [width, height] = measure();
    if (game.scale.width === width && game.scale.height === height) return;
    game.scale.resize(width, height);
    game.scale.setZoom(1 / dpr);
    const scene = game.scene.getScene('island');
    if (scene?.scene.isActive()) scene.fit();
  }

  function hold(on) {
    const scene = game?.scene.getScene('island');
    if (!scene) return;
    if (on && scene.scene.isActive()) scene.scene.pause();
    if (!on && scene.scene.isPaused()) scene.scene.resume();
  }
  function close() { if (game) game.loop.sleep(); }
  return { open, close, hold, scene: () => game?.scene.getScene('island'), world: () => world, ratio: () => dpr };
})();
