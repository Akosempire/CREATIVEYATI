import * as THREE from "three";
import { PALETTE, GRID, CLUSTER_LAYOUTS, CLUSTER_W, CLUSTER_H, CROP_ZOOM, CURVE, MOTION, FOCUS, INTRO, ATLAS } from "./config";

// framework-free. talks to react only through the callbacks passed in and the
// handle returned at the bottom.

// ---- small helpers ----
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mod = (a, n) => ((a % n) + n) % n;
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function hexToVec3(hex) {
  const value = parseInt(String(hex).replace("#", ""), 16);
  return new THREE.Vector3(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function validHex(hex) {
  return typeof hex === "string" && /^#[0-9a-f]{6}$/i.test(hex) ? hex : null;
}

// stable pseudo-random from a string + number, so crops don't jump between visits
function hash(str, n) {
  let h = 2166136261 ^ n;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function seededShuffle(list, seed) {
  const out = list.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// average colour of an image, pushed a little more saturated so the hover tint reads
function averageColor(img) {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 8;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 8, 8);
    const d = ctx.getImageData(0, 0, 8, 8).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    r /= n; g /= n; b /= n;
    const grey = (r + g + b) / 3;
    const boost = 1.6;
    const f = (v) => clamp(Math.round(grey + (v - grey) * boost), 0, 255).toString(16).padStart(2, "0");
    return `#${f(r)}${f(g)}${f(b)}`;
  } catch {
    return null;
  }
}

// ---- shaders ----
const BEND = /* glsl */ `
  uniform vec2 uViewport;
  uniform float uCurve;
  uniform vec2 uAngles;
  uniform float uDist;
  uniform float uMaxTheta;
  // plane coords (px, y down, centred) -> curved + projected screen px
  vec2 bend(vec2 p) {
    vec2 halfV = uViewport * 0.5;
    vec2 ang = uAngles * uCurve;
    vec2 q = p;
    float z = 0.0;
    if (ang.x > 1e-3) {
      float R = halfV.x / ang.x;
      float t = clamp(p.x / R, -uMaxTheta, uMaxTheta);
      q.x = R * sin(t);
      z += R * (1.0 - cos(t));
    }
    if (ang.y > 1e-3) {
      float R = halfV.y / ang.y;
      float t = clamp(p.y / R, -uMaxTheta, uMaxTheta);
      q.y = R * sin(t);
      z += R * (1.0 - cos(t));
    }
    return q * uDist / (uDist + z);
  }
  float edgeFade(vec2 ndc) {
    float fy = smoothstep(0.97, 0.56, abs(ndc.y));
    float fx = smoothstep(1.06, 0.8, abs(ndc.x));
    return fy * mix(1.0, fx, 0.7);
  }
`;

const TILE_VERT = /* glsl */ `
  ${BEND}
  attribute vec2 aBase;
  attribute vec2 aSize;
  attribute vec4 aUv;
  attribute vec3 aColor;
  attribute vec2 aCenter;
  attribute float aSlot;
  uniform vec2 uCam;
  uniform float uZoom;
  uniform vec2 uPeriod;
  uniform float uIntro;
  uniform vec2 uVelDir;
  uniform float uFx;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vSlot;
  varying float vVis;
  void main() {
    vec2 local = vec2(position.x + 0.5, 0.5 - position.y);
    // nearest copy of this cluster around the camera (infinite wrap)
    vec2 rel = mod(aCenter - uCam + uPeriod * 0.5, uPeriod) - uPeriod * 0.5;

    // intro: clusters arrive from the centre outward
    float d = length(rel * uZoom / (uViewport * 0.5));
    float appear = clamp((uIntro * 1.6 - d * 0.55) / 0.35, 0.0, 1.0);
    appear = appear * appear * (3.0 - 2.0 * appear);

    vec2 tc = rel + aBase + 0.5 * aSize;
    vec2 offs = (local - 0.5) * aSize * mix(0.86, 1.0, appear);
    // speed stretch along the direction of travel
    offs += uVelDir * dot(offs, uVelDir) * 0.22 * uFx;
    vec2 p = (tc + offs) * uZoom;

    vec2 s = bend(p);
    vec2 ndc = vec2(s.x / (uViewport.x * 0.5), -s.y / (uViewport.y * 0.5));
    gl_Position = vec4(ndc, 0.0, 1.0);

    vUv = vec2(mix(aUv.x, aUv.z, local.x), 1.0 - mix(aUv.y, aUv.w, local.y));
    vColor = aColor;
    vSlot = aSlot;
    vVis = appear * edgeFade(ndc);
  }
`;

const TILE_FRAG = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec3 uPaper;
  uniform float uHoverSlot;
  uniform float uHoverAmt;
  uniform float uFocusSlot;
  uniform float uDim;
  uniform vec2 uSplit;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vSlot;
  varying float vVis;
  void main() {
    float r = texture2D(uAtlas, vUv + uSplit).r;
    vec4 base = texture2D(uAtlas, vUv);
    float b = texture2D(uAtlas, vUv - uSplit).b;
    vec3 col = vec3(r, base.g, b);
    float hov = (1.0 - step(0.5, abs(vSlot - uHoverSlot))) * uHoverAmt;
    col = mix(col, vColor, 0.65 * hov);
    float isFocus = 1.0 - step(0.5, abs(vSlot - uFocusSlot));
    float vis = vVis * (1.0 - 0.7 * uDim * (1.0 - isFocus));
    gl_FragColor = vec4(mix(uPaper, col, vis), 1.0);
  }
`;

const GRID_VERT = /* glsl */ `
  ${BEND}
  uniform vec2 uCam;
  uniform float uZoom;
  uniform vec2 uExtent;
  varying vec2 vWorld;
  varying float vFade;
  void main() {
    vec2 p = vec2(position.x, -position.y) * uExtent;
    vWorld = p / uZoom + uCam;
    vec2 s = bend(p);
    vec2 ndc = vec2(s.x / (uViewport.x * 0.5), -s.y / (uViewport.y * 0.5));
    gl_Position = vec4(ndc, 0.0, 1.0);
    vFade = edgeFade(ndc);
  }
`;

const GRID_FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform float uCell;
  uniform float uAlpha;
  uniform float uAppear;
  uniform vec2 uPitch;
  uniform float uShift;
  uniform vec2 uCluster;
  varying vec2 vWorld;
  varying float vFade;
  void main() {
    vec2 c = vWorld / uCell;
    vec2 g = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), vec2(1e-4));
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    // softer over the work itself
    float row = floor(c.y / uPitch.y);
    float lx = mod(c.x - mod(row, 2.0) * uShift, uPitch.x);
    float ly = c.y - row * uPitch.y;
    float onTile = step(lx, uCluster.x) * step(ly, uCluster.y);
    float a = line * uAlpha * vFade * uAppear * mix(1.0, 0.5, onTile);
    gl_FragColor = vec4(uInk, a);
  }
`;

// ---- engine ----
export function createGridEngine(canvas, opts) {
  const {
    projects,
    reducedMotion = false,
    onHover = () => {},
    onSelect = () => {},
    onFrame = () => {},
    onIntroDone = () => {},
    onRequestClose = () => {},
    onColors = () => {},
  } = opts;

  const N = Math.max(1, projects.length);
  const CELL = GRID.CELL;
  const pitchX = GRID.PITCH_X * CELL;
  const pitchY = GRID.PITCH_Y * CELL;
  const shiftX = GRID.ROW_SHIFT * CELL;

  let W = canvas.clientWidth || window.innerWidth;
  let H = canvas.clientHeight || window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  // phones see the lattice smaller so a cluster doesn't fill the whole screen
  const scaleFor = (w) => (w < 820 ? 0.62 : 1);
  let viewScale = scaleFor(W);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); // unused, shaders write clip space

  // ---- brand colours ----
  const colors = projects.map((p) => validHex(p.brandColor));
  const colorsFixed = colors.map(Boolean);

  // ---- atlas ----
  const uniques = [];
  const uniqueIndex = new Map();
  const projectStills = projects.map((p) => {
    const list = (p.images || []).filter(Boolean);
    const distinct = [...new Set(list.length ? list : ["/img1.png"])];
    return distinct.map((src) => {
      if (!uniqueIndex.has(src)) { uniqueIndex.set(src, uniques.length); uniques.push({ src, owner: projects.indexOf(p) }); }
      return uniqueIndex.get(src);
    });
  });

  const atlasSize = uniques.length <= 28 ? 2048 : 4096;
  const perRow = Math.floor(atlasSize / ATLAS.SLOT_W);
  const maxSlots = perRow * Math.floor(atlasSize / ATLAS.SLOT_H);
  const atlas = document.createElement("canvas");
  atlas.width = atlas.height = atlasSize;
  const actx = atlas.getContext("2d");
  actx.fillStyle = "#e7e3db"; // warm placeholder until the frame arrives
  actx.fillRect(0, 0, atlasSize, atlasSize);
  const texture = new THREE.CanvasTexture(atlas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  let atlasDirty = false;
  let lastUpload = 0;

  function slotRect(u) {
    const i = u % maxSlots;
    const x = (i % perRow) * ATLAS.SLOT_W + ATLAS.PAD;
    const y = Math.floor(i / perRow) * ATLAS.SLOT_H + ATLAS.PAD;
    return { x, y, w: ATLAS.SLOT_W - ATLAS.PAD * 2, h: ATLAS.SLOT_H - ATLAS.PAD * 2 };
  }

  let destroyed = false;
  function loadImages() {
    const queue = uniques.map((u, i) => ({ ...u, i }));
    const sources = (src) => {
      const optimised = `/_next/image?url=${encodeURIComponent(src)}&w=${ATLAS.LOAD_WIDTH}&q=75`;
      return src.startsWith("data:") ? [src] : [optimised, src];
    };
    function drawInto(img, u) {
      const r = slotRect(u.i);
      const s = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      actx.save();
      actx.beginPath();
      actx.rect(r.x - ATLAS.PAD, r.y - ATLAS.PAD, r.w + ATLAS.PAD * 2, r.h + ATLAS.PAD * 2);
      actx.clip();
      // bleed the frame into the padding so mipmaps don't pull in the placeholder
      actx.drawImage(img, r.x + (r.w - dw) / 2 - ATLAS.PAD, r.y + (r.h - dh) / 2 - ATLAS.PAD, dw + ATLAS.PAD * 2, dh + ATLAS.PAD * 2);
      actx.restore();
      atlasDirty = true;
      if (!colorsFixed[u.owner] && !colors[u.owner]) {
        const avg = averageColor(img);
        if (avg) { colors[u.owner] = avg; refreshColors(); }
      }
    }
    function loadOne(u) {
      return new Promise((resolve) => {
        const list = sources(u.src);
        const attempt = (k) => {
          if (destroyed || k >= list.length) return resolve();
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.decoding = "async";
          img.onload = () => { if (!destroyed) drawInto(img, u); resolve(); };
          img.onerror = () => attempt(k + 1);
          img.src = list[k];
        };
        attempt(0);
      });
    }
    let cursor = 0;
    const worker = async () => { while (cursor < queue.length && !destroyed) await loadOne(queue[cursor++]); };
    for (let k = 0; k < ATLAS.CONCURRENCY; k++) worker();
  }

  // ---- lattice block ----
  let cols = 0, rows = 0, period = new THREE.Vector2();
  let slots = []; // { project, r, c, cx, cy }
  let tileMesh = null;
  let tileGeo = null;
  let colorAttr = null;

  function blockSize() {
    // big enough that the wrapped copy never shows inside the zoomed-out intro view
    const needX = (W / (INTRO.ZOOM_FROM * viewScale)) * 1.15 + pitchX * 2;
    const needY = (H / (INTRO.ZOOM_FROM * viewScale)) * 1.6 + pitchY * 2;
    let c = clamp(Math.ceil(needX / pitchX), GRID.MIN_COLS, GRID.MAX_COLS);
    let r = clamp(Math.ceil(needY / pitchY), GRID.MIN_ROWS, GRID.MAX_ROWS);
    if (r % 2) r += 1; // even rows keep the odd-row shift consistent across the wrap
    return [c, r];
  }

  function assignProjects(c, r) {
    const out = new Array(c * r);
    let bag = [];
    let round = 0;
    const draw = (avoid) => {
      if (!bag.length) bag = seededShuffle(projects.map((_, i) => i), 9173 + round++ * 31);
      const k = bag.findIndex((p) => !avoid.has(p));
      const pick = bag.splice(k === -1 ? 0 : k, 1)[0];
      return pick;
    };
    for (let y = 0; y < r; y++) {
      for (let x = 0; x < c; x++) {
        const avoid = new Set();
        if (N > 1) {
          if (x > 0) avoid.add(out[y * c + x - 1]);
          if (y > 0) {
            avoid.add(out[(y - 1) * c + x]);
            if (x > 0) avoid.add(out[(y - 1) * c + x - 1]);
            if (x < c - 1) avoid.add(out[(y - 1) * c + x + 1]);
          }
          if (x === c - 1) avoid.add(out[y * c]); // wrap neighbour
          if (y === r - 1) avoid.add(out[x]);
        }
        if (avoid.size >= N) avoid.clear();
        out[y * c + x] = draw(avoid);
      }
    }
    return out;
  }

  function buildBlock() {
    [cols, rows] = blockSize();
    period.set(cols * pitchX, rows * pitchY);
    const assigned = assignProjects(cols, rows);
    slots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x0 = c * pitchX + (r % 2 ? shiftX : 0);
        const y0 = r * pitchY;
        slots.push({ project: assigned[r * cols + c], r, c, cx: x0 + (CLUSTER_W * CELL) / 2, cy: y0 + (CLUSTER_H * CELL) / 2 });
      }
    }

    const count = slots.length * 6;
    const aBase = new Float32Array(count * 2);
    const aSize = new Float32Array(count * 2);
    const aUv = new Float32Array(count * 4);
    const aColor = new Float32Array(count * 3);
    const aCenter = new Float32Array(count * 2);
    const aSlot = new Float32Array(count);

    slots.forEach((slot, si) => {
      const p = projects[slot.project];
      const stills = projectStills[slot.project];
      const layout = CLUSTER_LAYOUTS[(slot.r + slot.c) % 2];
      const seen = new Set();
      layout.forEach(([tx, ty, tw], ti) => {
        const k = si * 6 + ti;
        const w = tw * CELL - GRID.GAP * 2;
        const h = CELL - GRID.GAP * 2;
        aBase[k * 2] = tx * CELL + GRID.GAP - (CLUSTER_W * CELL) / 2;
        aBase[k * 2 + 1] = ty * CELL + GRID.GAP - (CLUSTER_H * CELL) / 2;
        aSize[k * 2] = w;
        aSize[k * 2 + 1] = h;
        aCenter[k * 2] = slot.cx;
        aCenter[k * 2 + 1] = slot.cy;
        aSlot[k] = si;

        // which still, and which crop window of it
        const u = stills[ti % stills.length];
        const first = !seen.has(u);
        seen.add(u);
        const rect = slotRect(u);
        const sa = rect.w / rect.h;
        const a = w / h;
        const zoom = first ? 1 : CROP_ZOOM[ti];
        const cw = Math.min(1, a / sa) / zoom;
        const ch = Math.min(1, sa / a) / zoom;
        const key = String(p.id || slot.project);
        const fx = first ? 0.5 : cw / 2 + hash(key, ti * 2) * (1 - cw);
        const fy = first ? 0.5 : ch / 2 + hash(key, ti * 2 + 1) * (1 - ch);
        aUv[k * 4] = (rect.x + (fx - cw / 2) * rect.w) / atlasSize;
        aUv[k * 4 + 1] = (rect.y + (fy - ch / 2) * rect.h) / atlasSize;
        aUv[k * 4 + 2] = (rect.x + (fx + cw / 2) * rect.w) / atlasSize;
        aUv[k * 4 + 3] = (rect.y + (fy + ch / 2) * rect.h) / atlasSize;
      });
    });

    if (tileMesh) { scene.remove(tileMesh); tileGeo.dispose(); }
    const plane = new THREE.PlaneGeometry(1, 1, 10, 6);
    tileGeo = new THREE.InstancedBufferGeometry();
    tileGeo.index = plane.index;
    tileGeo.setAttribute("position", plane.getAttribute("position"));
    tileGeo.setAttribute("aBase", new THREE.InstancedBufferAttribute(aBase, 2));
    tileGeo.setAttribute("aSize", new THREE.InstancedBufferAttribute(aSize, 2));
    tileGeo.setAttribute("aUv", new THREE.InstancedBufferAttribute(aUv, 4));
    colorAttr = new THREE.InstancedBufferAttribute(aColor, 3);
    tileGeo.setAttribute("aColor", colorAttr);
    tileGeo.setAttribute("aCenter", new THREE.InstancedBufferAttribute(aCenter, 2));
    tileGeo.setAttribute("aSlot", new THREE.InstancedBufferAttribute(aSlot, 1));
    tileGeo.instanceCount = count;
    tileMesh = new THREE.Mesh(tileGeo, tileMat);
    tileMesh.frustumCulled = false;
    tileMesh.renderOrder = 0;
    scene.add(tileMesh);
    refreshColors();
  }

  function refreshColors() {
    if (!colorAttr) return;
    const fallback = hexToVec3(PALETTE.fallbackBrand);
    const arr = colorAttr.array;
    slots.forEach((slot, si) => {
      const v = colors[slot.project] ? hexToVec3(colors[slot.project]) : fallback;
      for (let t = 0; t < 6; t++) {
        const k = (si * 6 + t) * 3;
        arr[k] = v.x; arr[k + 1] = v.y; arr[k + 2] = v.z;
      }
    });
    colorAttr.needsUpdate = true;
    onColors(colors.map((c) => c || PALETTE.fallbackBrand));
  }

  // ---- materials ----
  const shared = {
    uViewport: { value: new THREE.Vector2(W, H) },
    uCurve: { value: 1 },
    uAngles: { value: new THREE.Vector2(CURVE.ANGLE_X, CURVE.ANGLE_Y) },
    uDist: { value: H * CURVE.DIST },
    uMaxTheta: { value: CURVE.MAX_THETA },
    uCam: { value: new THREE.Vector2() },
    uZoom: { value: 1 },
  };
  const tileMat = new THREE.ShaderMaterial({
    vertexShader: TILE_VERT,
    fragmentShader: TILE_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      ...shared,
      uPeriod: { value: period },
      uIntro: { value: 0 },
      uVelDir: { value: new THREE.Vector2() },
      uFx: { value: 0 },
      uAtlas: { value: texture },
      uPaper: { value: hexToVec3(PALETTE.paper) },
      uHoverSlot: { value: -1 },
      uHoverAmt: { value: 0 },
      uFocusSlot: { value: -1 },
      uDim: { value: 0 },
      uSplit: { value: new THREE.Vector2() },
    },
  });
  const gridMat = new THREE.ShaderMaterial({
    vertexShader: GRID_VERT,
    fragmentShader: GRID_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      ...shared,
      uExtent: { value: new THREE.Vector2() },
      uInk: { value: hexToVec3(PALETTE.ink) },
      uCell: { value: CELL },
      uAlpha: { value: GRID.LINE_ALPHA },
      uAppear: { value: 0 },
      uPitch: { value: new THREE.Vector2(GRID.PITCH_X, GRID.PITCH_Y) },
      uShift: { value: GRID.ROW_SHIFT },
      uCluster: { value: new THREE.Vector2(CLUSTER_W, CLUSTER_H) },
    },
  });
  const gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 96, 64), gridMat);
  gridMesh.frustumCulled = false;
  gridMesh.renderOrder = 1;
  scene.add(gridMesh);

  function sizeGrid() {
    // generous in plane space: the curve compresses the edges toward the horizon
    gridMat.uniforms.uExtent.value.set(Math.max(W * 2.2, (W / INTRO.ZOOM_FROM) * 1.3), Math.max(H * 3, (H / INTRO.ZOOM_FROM) * 1.8));
  }

  // ---- state ----
  const cam = new THREE.Vector2();
  const target = new THREE.Vector2();
  const vel = new THREE.Vector2();
  const prevCam = new THREE.Vector2();
  let zoom = reducedMotion ? 1 : INTRO.ZOOM_FROM;
  let zoomTarget = 1;
  let curveBase = reducedMotion ? 1 : INTRO.CURVE_FROM;
  let curveTarget = 1;
  let fx = 0;
  let curveNow = curveBase;
  let introStart = performance.now();
  let introDone = reducedMotion;
  let fly = null;
  let mode = "browse";
  let focusSlot = -1;
  let dimmed = false;
  let interactive = true;
  let hoverSlot = -1;
  let hoverShown = -1;
  let hoverAmt = 0;
  const pointer = { x: -1, y: -1, inside: false, type: "mouse" };

  buildBlock();
  sizeGrid();
  // start on a cluster near the middle of the block, nudged so the frame isn't dead-centred
  {
    const mid = slots[Math.floor(rows / 2) * cols + Math.floor(cols / 2)];
    cam.set(mid.cx + CELL * 1.5, mid.cy + CELL * 0.5);
    target.copy(cam);
    prevCam.copy(cam);
  }
  if (reducedMotion) {
    tileMat.uniforms.uIntro.value = 1;
    gridMat.uniforms.uAppear.value = 1;
  }

  // ---- projection maths (mirrors the shader) ----
  function bendJS(px, py, curve) {
    let qx = px, qy = py, z = 0;
    const ax = CURVE.ANGLE_X * curve, ay = CURVE.ANGLE_Y * curve;
    if (ax > 1e-3) { const R = W / 2 / ax; const t = clamp(px / R, -CURVE.MAX_THETA, CURVE.MAX_THETA); qx = R * Math.sin(t); z += R * (1 - Math.cos(t)); }
    if (ay > 1e-3) { const R = H / 2 / ay; const t = clamp(py / R, -CURVE.MAX_THETA, CURVE.MAX_THETA); qy = R * Math.sin(t); z += R * (1 - Math.cos(t)); }
    const D = H * CURVE.DIST;
    return [(qx * D) / (D + z), (qy * D) / (D + z)];
  }

  // screen px (centred, y down) -> plane px, by newton steps on bendJS
  function unbend(sx, sy, curve) {
    let px = sx, py = sy;
    for (let i = 0; i < 8; i++) {
      const [fx0, fy0] = bendJS(px, py, curve);
      const ex = sx - fx0, ey = sy - fy0;
      if (Math.abs(ex) + Math.abs(ey) < 0.05) break;
      const h = 0.5;
      const [ax, ay] = bendJS(px + h, py, curve);
      const [bx, by] = bendJS(px, py + h, curve);
      const j11 = (ax - fx0) / h, j21 = (ay - fy0) / h, j12 = (bx - fx0) / h, j22 = (by - fy0) / h;
      const det = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-6) return null; // past the horizon
      px += (j22 * ex - j12 * ey) / det;
      py += (-j21 * ex + j11 * ey) / det;
    }
    return [px, py];
  }

  function slotAtWorld(wx, wy) {
    const y = mod(wy, period.y);
    const r = Math.floor(y / pitchY);
    const x = mod(wx - (r % 2 ? shiftX : 0), period.x);
    const c = Math.floor(x / pitchX);
    const lx = x - c * pitchX;
    const ly = y - r * pitchY;
    if (lx < 0 || lx > CLUSTER_W * CELL || ly < 0 || ly > CLUSTER_H * CELL) return -1;
    return r * cols + c;
  }

  function slotAtScreen(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left - W / 2;
    const sy = clientY - rect.top - H / 2;
    // the faded edges don't count as hits
    if (Math.abs(sy) > H * 0.42) return -1;
    const p = unbend(sx, sy, curveNow);
    if (!p) return -1;
    const z = zoom * viewScale;
    return slotAtWorld(p[0] / z + cam.x, p[1] / z + cam.y);
  }

  // nearest wrapped copy of a slot's centre, relative to the camera
  function relCenter(si, from = cam) {
    const s = slots[si];
    const rx = mod(s.cx - from.x + period.x / 2, period.x) - period.x / 2;
    const ry = mod(s.cy - from.y + period.y / 2, period.y) - period.y / 2;
    return [rx, ry];
  }

  function screenOf(si) {
    const [rx, ry] = relCenter(si);
    const [sx, sy] = bendJS(rx * zoom * viewScale, ry * zoom * viewScale, curveNow);
    return { x: sx + W / 2, y: sy + H / 2 };
  }

  function nearestSlotFor(projectIndex) {
    let best = -1, bestD = Infinity;
    slots.forEach((s, si) => {
      if (s.project !== projectIndex) return;
      const [rx, ry] = relCenter(si);
      const d = rx * rx + ry * ry;
      if (d < bestD) { bestD = d; best = si; }
    });
    return best;
  }

  // ---- fly ----
  function startFly(toX, toY, toZoom, toCurve, duration) {
    vel.set(0, 0);
    if (reducedMotion || duration <= 0) {
      cam.set(toX, toY); target.copy(cam); zoom = zoomTarget = toZoom; curveBase = curveTarget = toCurve;
      fly = null;
      return;
    }
    fly = { t0: performance.now(), dur: duration, fx: cam.x, fy: cam.y, tx: toX, ty: toY, fz: zoom, tz: toZoom, fc: curveBase, tc: toCurve };
  }

  // panel covers the lower part of the screen, so park the project above centre
  function focusOffsetY() {
    return (W < 820 ? H * 0.26 : H * 0.18) / (FOCUS.ZOOM * viewScale);
  }

  function focus(si, notify = true) {
    if (si < 0) return;
    const [rx, ry] = relCenter(si);
    mode = "focus";
    focusSlot = si;
    startFly(cam.x + rx, cam.y + ry + focusOffsetY(), FOCUS.ZOOM, CURVE.FLAT_IN_FOCUS, FOCUS.DURATION);
    setHover(-1);
    if (notify) onSelect(slots[si].project);
  }

  function release() {
    if (mode !== "focus") return;
    mode = "browse";
    focusSlot = -1;
    startFly(cam.x, cam.y - focusOffsetY(), 1, 1, FOCUS.DURATION * 0.85);
  }

  function setHover(si) {
    if (si === hoverSlot) return;
    hoverSlot = si;
    if (si >= 0) { hoverShown = si; hoverAmt = reducedMotion ? 1 : 0; }
    onHover(si >= 0 ? slots[si].project : null);
  }

  // ---- input ----
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let suppressClick = false;

  function canInteract() {
    return interactive && !dimmed;
  }

  function onPointerDown(e) {
    if (!canInteract()) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture?.(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: zoomTarget };
      drag = null;
      return;
    }
    drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0, id: e.pointerId };
    vel.set(0, 0);
    if (fly && mode === "browse") fly = null;
    updateCursor();
  }

  function onPointerMove(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.type = e.pointerType;
    // only the bare canvas counts; ui layers on top block hover
    pointer.inside = e.target === canvas;
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomTarget = clamp((pinch.z0 * d) / Math.max(pinch.d0, 1), MOTION.ZOOM_MIN, MOTION.ZOOM_MAX);
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const now = performance.now();
    const frames = Math.max((now - drag.t) / 16.667, 0.5);
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.t = now;
    drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy));
    if (mode === "focus") {
      if (drag.moved > MOTION.CLICK_SLOP * 3) { onRequestClose(); drag = null; }
      return;
    }
    const z = zoom * viewScale;
    target.x -= dx / z;
    target.y -= dy / z;
    if (reducedMotion) { cam.copy(target); return; }
    // smoothed release velocity, in world px per frame
    vel.x = vel.x * 0.5 + (-dx / z / frames) * 0.5;
    vel.y = vel.y * 0.5 + (-dy / z / frames) * 0.5;
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!drag || drag.id !== e.pointerId) return;
    const slop = e.pointerType === "touch" ? MOTION.CLICK_SLOP * 2 : MOTION.CLICK_SLOP;
    suppressClick = drag.moved > slop;
    // a pause before letting go kills the throw
    if (performance.now() - drag.t > 80 || reducedMotion) vel.set(0, 0);
    drag = null;
    updateCursor();
    if (!suppressClick) handleTap(e.clientX, e.clientY);
  }

  function handleTap(x, y) {
    if (!canInteract()) return;
    const si = slotAtScreen(x, y);
    if (mode === "focus") {
      if (si !== focusSlot) onRequestClose();
      return;
    }
    if (si >= 0) focus(si);
  }

  function onWheel(e) {
    if (!canInteract()) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? H : 1;
    let dx = e.deltaX * unit;
    let dy = e.deltaY * unit;
    if (e.shiftKey && !dx) { dx = dy; dy = 0; }
    if (mode === "focus") {
      if (Math.abs(dx) + Math.abs(dy) > 4) onRequestClose();
      return;
    }
    if (fly) fly = null;
    const z = zoom * viewScale;
    if (reducedMotion) { target.x += dx / z; target.y += dy / z; cam.copy(target); return; }
    // feed the same inertia as a throw: total travel equals the wheel delta
    vel.x += ((dx * MOTION.WHEEL_GAIN) / z) * (1 - MOTION.FRICTION);
    vel.y += ((dy * MOTION.WHEEL_GAIN) / z) * (1 - MOTION.FRICTION);
  }

  function onLeave() {
    pointer.inside = false;
  }

  let cursorState = "";
  function updateCursor() {
    let next = "grab";
    if (drag && drag.moved > MOTION.CLICK_SLOP) next = "grabbing";
    else if (hoverSlot >= 0 && pointer.type !== "touch") next = "none";
    else if (mode === "focus") next = "zoom-out";
    if (!canInteract()) next = "default";
    if (next !== cursorState) { cursorState = next; canvas.style.cursor = next; }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // ---- loop ----
  let raf = 0;
  let last = performance.now();
  let running = true;

  function tick(now) {
    raf = requestAnimationFrame(tick);
    const f = clamp((now - last) / 16.667, 0.25, 3);
    last = now;
    const lerpF = reducedMotion ? 1 : 1 - Math.pow(1 - MOTION.LERP, f);

    // intro
    let introT = 1;
    if (!introDone) {
      introT = clamp((now - introStart) / INTRO.DURATION, 0, 1);
      const e = easeOutCubic(introT);
      zoom = INTRO.ZOOM_FROM + (1 - INTRO.ZOOM_FROM) * e;
      curveBase = INTRO.CURVE_FROM + (1 - INTRO.CURVE_FROM) * e;
      tileMat.uniforms.uIntro.value = introT;
      gridMat.uniforms.uAppear.value = clamp(introT * 2, 0, 1);
      if (introT >= 1) { introDone = true; zoomTarget = 1; curveTarget = 1; onIntroDone(); }
    }

    if (fly) {
      const t = clamp((now - fly.t0) / fly.dur, 0, 1);
      const e = easeOutExpo(t);
      cam.set(fly.fx + (fly.tx - fly.fx) * e, fly.fy + (fly.ty - fly.fy) * e);
      zoom = fly.fz + (fly.tz - fly.fz) * e;
      curveBase = fly.fc + (fly.tc - fly.fc) * e;
      target.copy(cam);
      if (t >= 1) { fly = null; zoomTarget = zoom; curveTarget = curveBase; }
    } else {
      if (!drag && !reducedMotion) {
        target.x += vel.x * f;
        target.y += vel.y * f;
        const fr = Math.pow(MOTION.FRICTION, f);
        vel.multiplyScalar(fr);
        if (vel.lengthSq() < 0.0004) vel.set(0, 0);
      }
      if (dimmed && !reducedMotion) { target.x += MOTION.DRIFT * f; target.y += MOTION.DRIFT * 0.35 * f; }
      cam.x += (target.x - cam.x) * lerpF;
      cam.y += (target.y - cam.y) * lerpF;
      if (introDone) {
        zoom += (zoomTarget - zoom) * lerpF;
        curveBase += (curveTarget - curveBase) * lerpF;
      }
    }

    // speed fx
    const dx = cam.x - prevCam.x;
    const dy = cam.y - prevCam.y;
    prevCam.copy(cam);
    const speed = Math.hypot(dx, dy) / f;
    const fxTarget = reducedMotion || fly || dimmed ? 0 : clamp(speed / MOTION.SPEED_FOR_FULL_FX, 0, 1);
    fx += (fxTarget - fx) * (1 - Math.pow(1 - MOTION.FX_EASE, f));
    curveNow = curveBase * (1 + CURVE.SPEED_BOOST * fx);
    if (speed > 0.01) tileMat.uniforms.uVelDir.value.set(dx, dy).normalize();
    tileMat.uniforms.uFx.value = fx;
    tileMat.uniforms.uSplit.value.copy(tileMat.uniforms.uVelDir.value).multiplyScalar(fx * 0.0022);

    // hover follows the plane moving under a still pointer
    if (pointer.inside && pointer.type !== "touch" && mode === "browse" && canInteract() && introT > 0.6 && !(drag && drag.moved > MOTION.CLICK_SLOP)) {
      setHover(slotAtScreen(pointer.x, pointer.y));
    } else if (hoverSlot !== -1) {
      setHover(-1);
    }
    const hoverTo = hoverSlot >= 0 ? 1 : 0;
    hoverAmt += (hoverTo - hoverAmt) * (reducedMotion ? 1 : 1 - Math.pow(1 - MOTION.HOVER_EASE, f));
    tileMat.uniforms.uHoverSlot.value = hoverShown;
    tileMat.uniforms.uHoverAmt.value = hoverAmt;
    const dimTo = mode === "focus" ? 1 : 0;
    tileMat.uniforms.uDim.value += (dimTo - tileMat.uniforms.uDim.value) * (reducedMotion ? 1 : 1 - Math.pow(0.9, f));
    tileMat.uniforms.uFocusSlot.value = focusSlot;
    updateCursor();

    shared.uCam.value.copy(cam);
    shared.uZoom.value = zoom * viewScale;
    shared.uCurve.value = curveNow;

    if (atlasDirty && now - lastUpload > 200) { texture.needsUpdate = true; atlasDirty = false; lastUpload = now; }

    renderer.render(scene, camera);

    onFrame({
      x: cam.x / CELL,
      y: -cam.y / CELL,
      hover: hoverShown >= 0 && hoverAmt > 0.01 ? { ...screenOf(hoverShown), amount: hoverAmt, project: slots[hoverShown].project } : null,
    });
  }
  raf = requestAnimationFrame(tick);

  function onVisibility() {
    if (document.hidden && running) { cancelAnimationFrame(raf); running = false; }
    else if (!document.hidden && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  document.addEventListener("visibilitychange", onVisibility);

  function resize() {
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewScale = scaleFor(W);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    shared.uViewport.value.set(W, H);
    shared.uDist.value = H * CURVE.DIST;
    const [c, r] = blockSize();
    if (c > cols || r > rows) {
      const focusedProject = focusSlot >= 0 ? slots[focusSlot].project : -1;
      buildBlock();
      if (focusedProject >= 0) focusSlot = nearestSlotFor(focusedProject);
      hoverSlot = hoverShown = -1;
    }
    sizeGrid();
  }

  loadImages();

  return {
    flyToProject(projectIndex, { open = false } = {}) {
      const si = nearestSlotFor(projectIndex);
      if (si < 0) return;
      if (open) { focus(si, true); return; }
      if (mode === "focus") { mode = "browse"; focusSlot = -1; }
      const [rx, ry] = relCenter(si);
      startFly(cam.x + rx, cam.y + ry, 1, 1, FOCUS.DURATION);
    },
    release,
    setDimmed(value) { dimmed = value; if (value) { setHover(-1); vel.set(0, 0); } },
    setInteractive(value) { interactive = value; if (!value) setHover(-1); },
    resize,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
      tileGeo?.dispose();
      gridMesh.geometry.dispose();
      tileMat.dispose();
      gridMat.dispose();
      texture.dispose();
      renderer.dispose();
    },
  };
}
