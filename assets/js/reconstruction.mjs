const COPY = {
  zh: {
    loading: '正在加载本地数据…', error: '交互图加载失败，请使用下方静态预览或刷新重试。',
    reset: '复位', mode: '显示', sparse: '稀疏点云', dense: '稠密点云', mesh: '网格（无贴图）',
    size: '点大小', rotate: '水平旋转', tilt: '俯仰', zoom: '缩放',
    viewerHint: '拖动旋转，滚轮缩放；也可用滑块键盘操作。切换阶段保留视角，便于对比。网格颜色仅用于观察形状。',
    webgl: '当前浏览器无法使用所需的 WebGL 功能，请查看下方静态预览。',
    points: '显示点数', triangles: '三角形', original: '原始稠密点数',
    filter: '匹配集合', inliers: '几何内点', all: '候选匹配（含外点）', rejected: '几何外点',
    amount: '显示连线', track: '观察匹配', featuresHint: '在照片上点击或用滑块选择匹配，下方放大对应的两个 32×32 像素区域。绿色为 F 矩阵 RANSAC 内点，橙色虚线为外点；内点也不保证语义正确。',
    candidate: '候选', accepted: '几何内点', sample: '仅展示部分匹配', selected: '当前匹配',
    step: '优化预算', camera: '观察相机', baHint: '教学合成实验：4 台针孔相机、18 个三维点；固定前两台相机姿态与焦距以锚定坐标和尺度。滑块切换真实最小二乘求解快照，非城堡的优化历史。',
    baLegend: '蓝色圆点：观测位置；橙色十字：当前重投影；线段：误差（实际像素比例）。',
    rms: '全体观测的 RMS 重投影误差', budget: '最大函数评估次数',
    legend: '照片 A · 00004 / 照片 B · 00005', synthetic: '合成束调整实验', photo: '照片',
    region: '参考区域', corner: '门框附近', windows: '重复窗格', sky: '低纹理天空', window: '窗口边长',
    metric: '匹配代价', exposure: '支持图亮度 ×1.2 +20（不截断）', hypothesis: '候选编号', best: '跳到最低代价',
    invDepth: '逆深度（相对单位⁻¹）', cost: '代价（越低越好）', depth: '相对深度', texture: '参考块灰度标准差',
    lowTexture: '低纹理：归一化会放大微小噪声，最低值不应被当作可靠深度。',
    sweepHint: '真实照片的双视图平面扫描：去畸变，重新估计相对位姿，固定正对参考相机的平面法线。黄色为当前候选，蓝色虚线为本曲线最低值。深度以相机基线为相对单位，不是米；它未执行完整 MVS。亮度选项只改变代价计算。',
  },
  en: {
    loading: 'Loading local data…', error: 'The interactive figure could not load. Use the static preview below or refresh to retry.',
    reset: 'Reset', mode: 'Display', sparse: 'Sparse cloud', dense: 'Dense cloud', mesh: 'Mesh (untextured)',
    size: 'Point size', rotate: 'Yaw', tilt: 'Pitch', zoom: 'Zoom',
    viewerHint: 'Drag to orbit; scroll to zoom. Sliders also support keyboard input. Switching stages preserves the view. Mesh colors only reveal shape.',
    webgl: 'Required WebGL features are unavailable. Please use the static preview below.',
    points: 'Displayed points', triangles: 'Triangles', original: 'Original dense points',
    filter: 'Matches', inliers: 'Geometric inliers', all: 'Candidates (including outliers)', rejected: 'Geometric outliers',
    amount: 'Visible links', track: 'Inspect match', featuresHint: 'Click a photo or use the slider to inspect a match. The two crops magnify 32×32 pixel neighborhoods. Green: F-matrix RANSAC inliers. Orange dashed: outliers. Geometric inliers are not guaranteed to be correct.',
    candidate: 'Candidates', accepted: 'Geometric inliers', sample: 'Only a subset is displayed', selected: 'Selected match',
    step: 'Optimization budget', camera: 'Inspect camera', baHint: 'Synthetic teaching example: 4 pinhole cameras and 18 3D points. The first two poses and the focal length are fixed to anchor coordinates and scale. These are actual least-squares snapshots, not the Castle optimization history.',
    baLegend: 'Blue dots: observations. Orange crosses: current reprojections. Segments show errors at actual pixel scale.',
    rms: 'RMS reprojection error across all observations', budget: 'Maximum function evaluations',
    legend: 'Photo A · 00004 / Photo B · 00005', synthetic: 'Synthetic bundle adjustment', photo: 'Photo',
    region: 'Reference region', corner: 'Near the doorway', windows: 'Repeated window panes', sky: 'Low-texture sky', window: 'Window width',
    metric: 'Matching cost', exposure: 'Support intensity ×1.2 +20 (unclipped)', hypothesis: 'Candidate index', best: 'Go to minimum cost',
    invDepth: 'Inverse depth (relative unit⁻¹)', cost: 'Cost (lower is better)', depth: 'Relative depth', texture: 'Reference gray-value std.',
    lowTexture: 'Low texture: normalization amplifies small noise; the minimum is not reliable depth evidence.',
    sweepHint: 'Real-photo two-view plane sweep: undistorted images, independently estimated relative pose, and a fixed fronto-parallel plane normal. Yellow marks the current hypothesis; the blue dashed line marks the curve minimum. Depth uses baseline-relative units, not meters. This is not full MVS. The exposure option changes cost calculations only.',
  },
};

function el(tag, text, attrs = {}) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
function slider(parent, title, min, max, value, step = 1) {
  const label = el('label', title);
  const input = el('input', '', { type: 'range', min, max, value, step });
  const output = el('output', String(value));
  input.addEventListener('input', () => { output.value = input.value; });
  label.append(input, output); parent.append(label);
  return input;
}
function select(parent, title, options) {
  const label = el('label', title), input = el('select');
  for (const [value, text] of options) input.append(el('option', text, { value }));
  label.append(input); parent.append(label); return input;
}
async function get(url, binary = false) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return binary ? r.arrayBuffer() : r.json();
}
function plot(parent, width, height, label) {
  const s = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': label });
  parent.append(s); return s;
}
const number = n => n.toLocaleString('en-US');

async function features(figure, body, status, t) {
  const base = figure.dataset.base, data = await get(base + 'features.json');
  const controls = el('div', '', { class: 'mv-controls' }); body.append(controls);
  const filter = select(controls, t.filter, [['inlier', t.inliers], ['all', t.all], ['outlier', t.rejected]]);
  const amount = slider(controls, t.amount, 4, 80, 24);
  const track = slider(controls, t.track, 1, data.matches.length, 1);
  const w = data.width, h = data.height, gap = 24;
  const svg = plot(body, 2 * w + gap, h, t.legend);
  svg.classList.add('mv-pair');
  const imgs = await Promise.all(['00004', '00005'].map(name => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = base + name + '.webp';
  })));
  for (let i = 0; i < 2; i++) svg.append(svgEl('image', { href: imgs[i].src, x: i * (w + gap), width: w, height: h }));
  const links = svgEl('g'); svg.append(links);
  const patches = el('div', '', { class: 'mv-patches' }); body.append(patches);
  const crops = imgs.map((_, i) => { const c = el('canvas', '', { width: 104, height: 104, role: 'img', 'aria-label': `${t.photo} ${i + 1}` }); patches.append(c); return c; });
  body.append(el('p', t.featuresHint, { class: 'mv-hint' }));
  let subset = [];
  function render() {
    subset = data.matches.filter(m => filter.value === 'all' || m.inlier === (filter.value === 'inlier'));
    track.max = subset.length; track.value = Math.min(+track.value, subset.length);
    track.nextElementSibling.value = track.value;
    const chosen = subset[+track.value - 1];
    const shown = subset.slice(0, +amount.value);
    if (!shown.includes(chosen)) shown.push(chosen);
    links.replaceChildren();
    for (const m of shown) {
      const color = m === chosen ? '#fff04d' : m.inlier ? '#4affbd' : '#ff9f40';
      links.append(svgEl('line', { x1: m.a[0], y1: m.a[1], x2: m.b[0] + w + gap, y2: m.b[1], stroke: color, 'stroke-width': m === chosen ? 3 : 1.5, 'stroke-dasharray': m.inlier ? '' : '8 5', opacity: m === chosen ? 1 : .65 }));
      for (let i = 0; i < 2; i++) { const p = i ? m.b : m.a; links.append(svgEl('circle', { cx: p[0] + i * (w + gap), cy: p[1], r: m === chosen ? 10 : 4, fill: 'none', stroke: color, 'stroke-width': 2 })); }
    }
    [chosen.a, chosen.b].forEach((p, i) => {
      const ctx = crops[i].getContext('2d'); ctx.fillStyle = '#12232f'; ctx.fillRect(0, 0, 104, 104); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(imgs[i], p[0] - 16, p[1] - 16, 32, 32, 0, 0, 104, 104);
      ctx.strokeStyle = '#fff04d'; ctx.strokeRect(48, 48, 8, 8);
    });
    status.textContent = `SIFT: ${data.keypoints.join(' / ')} · ${t.candidate}: ${number(data.candidates)} · ${t.accepted}: ${number(data.inliers)} · ${t.selected}: ${track.value}/${subset.length} (${chosen.inlier ? t.inliers : t.rejected}) · ${t.sample}`;
  }
  svg.addEventListener('click', event => {
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    let best = Infinity, index = 0;
    subset.forEach((m, j) => { for (let i = 0; i < 2; i++) { const q = i ? m.b : m.a, d = (p.x - q[0] - i * (w + gap)) ** 2 + (p.y - q[1]) ** 2; if (d < best) { best = d; index = j; } } });
    track.value = index + 1; render();
  });
  [filter, amount, track].forEach(e => e.addEventListener('input', render)); render();
}

async function bundle(figure, body, status, t) {
  const data = await get(figure.dataset.base + 'bundle.json');
  const controls = el('div', '', { class: 'mv-controls' }); body.append(controls);
  const step = slider(controls, t.step, 0, data.frames.length - 1, 0);
  const camera = select(controls, t.camera, [0, 1, 2, 3].map(i => [i, String(i + 1)])); camera.value = '2';
  const reset = el('button', t.reset, { type: 'button' }); controls.append(reset);
  const svg = plot(body, 480, 340, t.synthetic);
  body.append(el('p', t.baLegend, { class: 'mv-legend' }), el('p', t.baHint, { class: 'mv-hint' }));
  function render() {
    const frame = data.frames[+step.value], c = +camera.value;
    step.nextElementSibling.value = String(frame.budget);
    svg.replaceChildren();
    for (let x = 40; x < 480; x += 80) {
      svg.append(svgEl('line', { x1: x, x2: x, y1: 0, y2: 318, stroke: '#264252' }));
      const label = svgEl('text', { x, y: 334, fill: '#b4c8d6', 'font-size': 11, 'text-anchor': 'middle' }); label.textContent = x; svg.append(label);
    }
    for (let y = 10; y < 330; y += 80) svg.append(svgEl('line', { x1: 0, x2: 480, y1: y, y2: y, stroke: '#264252' }));
    for (const y of [90, 170, 250]) {
      const label = svgEl('text', { x: 7, y: y - 4, fill: '#b4c8d6', 'font-size': 11 }); label.textContent = y; svg.append(label);
    }
    for (const [text, x, y] of [['u (px)', 428, 314], ['v (px)', 7, 25]]) {
      const label = svgEl('text', { x, y, fill: '#b4c8d6', 'font-size': 12 }); label.textContent = text; svg.append(label);
    }
    data.observed[c].forEach((p, i) => {
      const q = frame.projections[c][i];
      svg.append(svgEl('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: '#ffae59', 'stroke-width': 1.4 }),
        svgEl('circle', { cx: p[0], cy: p[1], r: 3, fill: '#51c8ff' }),
        svgEl('path', { d: `M${q[0] - 4},${q[1]}h8 M${q[0]},${q[1] - 4}v8`, stroke: '#ffae59', 'stroke-width': 1.7 }));
    });
    status.textContent = `${t.rms}: ${frame.rms.toFixed(3)} px · ${t.budget}: ${frame.budget}`;
  }
  step.addEventListener('input', render); camera.addEventListener('change', render);
  reset.addEventListener('click', () => { step.value = 0; camera.value = 2; render(); }); render();
}

async function sweep(figure, body, status, t) {
  const base = figure.dataset.base, data = await get(base + 'plane-sweep.json');
  const controls = el('div', '', { class: 'mv-controls' }); body.append(controls);
  const region = select(controls, t.region, ['corner', 'windows', 'sky'].map(k => [k, t[k]]));
  const windowSize = select(controls, t.window, [['11', '11 px'], ['21', '21 px']]);
  const metric = select(controls, t.metric, [['ncc', '1 − ZNCC'], ['ssd', 'SSD / 255²']]);
  const exposureLabel = el('label', t.exposure), exposure = el('input', '', { type: 'checkbox' }); exposureLabel.prepend(exposure); controls.append(exposureLabel);
  const candidate = slider(controls, t.hypothesis, 0, data.inverseDepths.length - 1, 80);
  const best = el('button', t.best, { type: 'button' }); controls.append(best);
  const w = data.width, h = data.height, gap = 24;
  const photos = plot(body, w * 2 + gap, h, t.legend), marks = svgEl('g');
  const images = await Promise.all([0, 1].map(i => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = base + `sweep-${i}.webp`;
  })));
  images.forEach((im, i) => photos.append(svgEl('image', { href: im.src, x: i * (w + gap), width: w, height: h })));
  photos.append(marks);
  const patches = el('div', '', { class: 'mv-patches' }); body.append(patches);
  const crops = images.map((_, i) => { const c = el('canvas', '', { width: 104, height: 104, role: 'img', 'aria-label': `${t.photo} ${i + 1}` }); patches.append(c); return c; });
  const graph = plot(body, 640, 270, `${t.cost}; ${t.invDepth}`); graph.classList.add('mv-cost-plot');
  body.append(el('p', t.sweepHint, { class: 'mv-hint' }));
  let bestIndex = 0;
  function render() {
    const item = data.cases.find(c => c.key === region.value), setting = item.windows[windowSize.value];
    const key = metric.value === 'ssd' && exposure.checked ? 'exposureSsd' : metric.value;
    const values = setting.samples.map(s => s[key]);
    bestIndex = values.reduce((best, v, i) => v !== null && (values[best] === null || v < values[best]) ? i : best, 0);
    const index = +candidate.value, row = setting.samples[index], radius = (+windowSize.value - 1) / 2;
    const x0 = data.inverseDepths[0], x1 = data.inverseDepths.at(-1);
    const max = metric.value === 'ncc' ? 2 : Math.max(.04, ...setting.samples.flatMap(s => [s.ssd || 0, s.exposureSsd || 0])) * 1.1;
    const graphWidth = Math.max(340, Math.min(640, body.clientWidth)), right = graphWidth - 26, plotWidth = right - 64;
    graph.setAttribute('viewBox', `0 0 ${graphWidth} 270`);
    const px = i => 64 + i / (values.length - 1) * plotWidth, py = v => 218 - v / max * 177;
    graph.replaceChildren();
    const text = (value, x, y, anchor = 'start') => { const e = svgEl('text', { x, y, fill: '#c8d9e3', 'font-size': 12, 'text-anchor': anchor }); e.textContent = value; graph.append(e); };
    for (let i = 0; i <= 4; i++) {
      const value = max * i / 4, y = py(value);
      graph.append(svgEl('line', { x1: 64, x2: right, y1: y, y2: y, stroke: '#294556' })); text(value.toFixed(3), 56, y + 4, 'end');
      const x = 64 + i / 4 * plotWidth; text((x0 + i / 4 * (x1 - x0)).toFixed(3), x, 238, 'middle');
    }
    text(t.cost, 64, 23); text(t.invDepth, 64 + plotWidth / 2, 261, 'middle');
    let path = '', drawing = false;
    values.forEach((v, i) => { if (v === null) { drawing = false; return; } path += `${drawing ? 'L' : 'M'}${px(i)},${py(v)}`; drawing = true; });
    graph.append(svgEl('path', { d: path, fill: 'none', stroke: '#67ceff', 'stroke-width': 2 }),
      svgEl('line', { x1: px(bestIndex), x2: px(bestIndex), y1: 40, y2: 218, stroke: '#67ceff', 'stroke-dasharray': '5 4' }),
      svgEl('line', { x1: px(index), x2: px(index), y1: 40, y2: 218, stroke: '#ffda65' }));
    if (values[index] !== null) graph.append(svgEl('circle', { cx: px(index), cy: py(values[index]), r: 4, fill: '#ffda65' }));
    marks.replaceChildren();
    marks.append(svgEl('rect', { x: item.center[0] - radius, y: item.center[1] - radius, width: radius * 2, height: radius * 2, stroke: '#ffda65', 'stroke-width': 3, fill: 'none' }),
      svgEl('polygon', { points: row.outline.map(p => `${p[0] + w + gap},${p[1]}`).join(' '), stroke: '#ffda65', 'stroke-width': 3, fill: 'none' }));
    [item.center, row.center].forEach((p, i) => {
      const ctx = crops[i].getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, 104, 104);
      ctx.drawImage(images[i], p[0] - 16, p[1] - 16, 32, 32, 0, 0, 104, 104);
      ctx.strokeStyle = '#ffda65'; ctx.strokeRect((16 - radius) * 3.25, (16 - radius) * 3.25, radius * 6.5, radius * 6.5);
    });
    candidate.nextElementSibling.value = candidate.value;
    status.textContent = `${t.depth}: ${(1 / data.inverseDepths[index]).toFixed(2)} · ${t.cost}: ${values[index] === null ? '—' : values[index].toFixed(4)} · ${t.texture}: ${setting.referenceStd.toFixed(2)} / 255${setting.referenceStd < 2 ? ` · ${t.lowTexture}` : ''}`;
    figure.dataset.case = region.value; figure.dataset.metric = key;
  }
  [region, windowSize, metric, exposure, candidate].forEach(e => e.addEventListener('input', render));
  best.addEventListener('click', () => { candidate.value = bestIndex; render(); }); render();
  new ResizeObserver(render).observe(body);
}

export function orbitMatrix(yaw, pitch, zoom, aspect) {
  const c = Math.cos(yaw), s = Math.sin(yaw), a = Math.cos(pitch), b = Math.sin(pitch);
  return new Float32Array([c * zoom / aspect, b * s * zoom, a * s * .08, 0,
    0, a * zoom, -b * .08, 0,
    s * zoom / aspect, -b * c * zoom, -a * c * .08, 0, 0, 0, 0, 1]);
}

async function viewer(figure, body, status, t) {
  const controls = el('div', '', { class: 'mv-controls' }); body.append(controls);
  const mode = select(controls, t.mode, [['dense', t.dense], ['sparse', t.sparse], ['mesh', t.mesh]]);
  const size = slider(controls, t.size, 1, 5, 2, .5);
  const yaw = slider(controls, t.rotate, -180, 180, 0);
  const pitch = slider(controls, t.tilt, -80, 80, -8);
  const zoom = slider(controls, t.zoom, .3, 3, 1.15, .05);
  const reset = el('button', t.reset, { type: 'button' }); controls.append(reset);
  const canvas = el('canvas', '', { class: 'mv-viewer', role: 'img', 'aria-label': t.viewerHint }); body.append(canvas);
  const defaultZoom = Math.round(Math.min(1.15, canvas.clientWidth / canvas.clientHeight * .85) * 20) / 20;
  zoom.value = defaultZoom; zoom.nextElementSibling.value = zoom.value;
  body.append(el('p', t.viewerHint, { class: 'mv-hint' }));
  const gl = canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: true });
  if (!gl || !gl.getExtension('OES_element_index_uint')) throw new Error(t.webgl);
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec3 position;attribute vec3 color;uniform mat4 matrix;uniform float size;varying vec3 rgb;void main(){gl_Position=matrix*vec4(position,1.);gl_PointSize=size;rgb=color;}'));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec3 rgb;void main(){gl_FragColor=vec4(rgb,1.);}'));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program); gl.enable(gl.DEPTH_TEST); gl.clearColor(.055, .10, .14, 1);
  const pos = gl.getAttribLocation(program, 'position'), color = gl.getAttribLocation(program, 'color');
  const matrix = gl.getUniformLocation(program, 'matrix'), pointSize = gl.getUniformLocation(program, 'size');
  const manifest = await get(figure.dataset.base + 'manifest.json'), cache = new Map(); let current;
  function render() {
    if (!current || gl.isContextLost()) return;
    const rect = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(matrix, false, orbitMatrix(+yaw.value * Math.PI / 180, +pitch.value * Math.PI / 180, +zoom.value, rect.width / rect.height));
    gl.uniform1f(pointSize, +size.value * ratio);
    gl.bindBuffer(gl.ARRAY_BUFFER, current.buffer);
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(color); gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 24, 12);
    if (current.indices) { gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, current.indices); gl.drawElements(gl.TRIANGLES, current.count, gl.UNSIGNED_INT, 0); }
    else gl.drawArrays(gl.POINTS, 0, current.count);
    figure.dataset.mode = current.mode;
  }
  async function load() {
    const requested = mode.value; status.textContent = t.loading;
    if (!cache.has(requested)) {
      const vertices = new Float32Array(await get(figure.dataset.base + requested + '.bin', true));
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      const item = { buffer, count: vertices.length / 6, mode: requested };
      if (requested === 'mesh') {
        const faces = new Uint32Array(await get(figure.dataset.base + 'faces.bin', true));
        item.indices = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, item.indices); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faces, gl.STATIC_DRAW); item.count = faces.length;
      }
      cache.set(requested, item);
    }
    if (mode.value !== requested) return;
    current = cache.get(requested); render();
    status.textContent = requested === 'mesh' ? `${t.triangles}: ${number(current.count / 3)} · ${t.mesh}` : `${t.points}: ${number(current.count)}${requested === 'dense' ? ` / ${t.original}: ${number(manifest.densePoints)}` : ''}`;
  }
  function update() { for (const i of [yaw, pitch, zoom]) i.nextElementSibling.value = i.value; render(); }
  mode.addEventListener('change', () => load().catch(() => { status.textContent = t.error; }));
  [size, yaw, pitch, zoom].forEach(i => i.addEventListener('input', render));
  reset.addEventListener('click', () => { yaw.value = 0; pitch.value = -8; zoom.value = defaultZoom; size.value = 2; size.nextElementSibling.value = 2; update(); });
  let drag;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: +yaw.value, pitch: +pitch.value }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag) return; yaw.value = Math.max(-180, Math.min(180, drag.yaw + (e.clientX - drag.x) * .4)); pitch.value = Math.max(-80, Math.min(80, drag.pitch + (e.clientY - drag.y) * .3)); update(); });
  canvas.addEventListener('pointerup', () => { drag = null; }); canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom.value = Math.max(.3, Math.min(3, +zoom.value * Math.exp(-e.deltaY * .001))); update(); }, { passive: false });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); status.textContent = t.webgl; figure.dataset.ready = 'error'; });
  canvas.addEventListener('webglcontextrestored', () => { status.textContent = t.error; });
  new ResizeObserver(render).observe(canvas); await load();
}

if (typeof document !== 'undefined') {
  const observer = new IntersectionObserver(entries => entries.forEach(async entry => {
    if (!entry.isIntersecting) return;
    const figure = entry.target; observer.unobserve(figure);
    const t = COPY[figure.dataset.lang] || COPY.zh, status = figure.querySelector('.mv-status');
    status.textContent = t.loading;
    try {
      await ({ features, bundle, viewer, sweep })[figure.dataset.reconstruction](figure, figure.querySelector('.mv-body'), status, t);
      figure.dataset.ready = 'true';
    } catch (error) { status.textContent = error.message === t.webgl ? t.webgl : t.error; figure.dataset.ready = 'error'; }
  }), { rootMargin: '300px' });
  document.querySelectorAll('[data-reconstruction]').forEach(f => observer.observe(f));
}
