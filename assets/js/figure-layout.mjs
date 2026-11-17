// Shared figure layout: readable coordinates, compact controls, and no inner scroll area.
export function plotGeometry(width, viewportHeight = 800) {
  const actualWidth = Math.max(120, Math.round(width || 320));
  const height = Math.round(Math.min(250, Math.max(180, actualWidth * 0.56 + 45),
    Math.max(150, viewportHeight * 0.30)));
  return { width: actualWidth, height, left: actualWidth < 360 ? 48 : 54,
    right: actualWidth - 16, top: 26, bottom: height - 44 };
}

export function chartDimensions(container) {
  const width = container.clientWidth || container.parentElement?.clientWidth || 320;
  return plotGeometry(width, window.visualViewport?.height || window.innerHeight);
}

const layouts = new WeakMap();
let sequence = 0;

function updatePanels(root, state) {
  const compact = root.clientWidth < 620 && state.labels.length > 1;
  root.dataset.figureMode = compact ? 'tabs' : state.labels.length > 1 ? 'columns' : 'single';
  root.dataset.figureView = String(state.selected);
  if (state.tabs) state.tabs.hidden = !compact;
  [...state.target.children].forEach((panel, i) => {
    panel.hidden = compact && state.selected !== i;
    panel.setAttribute('role', compact ? 'tabpanel' : 'group');
    panel.setAttribute('aria-label', state.labels[i]);
  });
  state.buttons.forEach((button, i) => {
    button.setAttribute('aria-selected', String(state.selected === i));
    button.tabIndex = state.selected === i ? 0 : -1;
  });
  root.dispatchEvent(new Event('figureviewchange'));
}

export function figurePanels(root, labels) {
  const target = root.querySelector('.statistics-figure__plots');
  let state = layouts.get(root);
  if (!state) {
    state = { target, labels, selected: 0, buttons: [], tabs: null, id: `figure-view-${sequence++}` };
    layouts.set(root, state);
    if (labels.length > 1) {
      const tabs = document.createElement('div');
      tabs.className = 'statistics-figure__tabs';
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', root.dataset.lang === 'zh' ? '图表视图' : 'Chart views');
      state.tabs = tabs;
      labels.forEach((label, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.setAttribute('role', 'tab');
        button.textContent = label;
        button.id = `${state.id}-tab-${index}`;
        button.setAttribute('aria-controls', `${state.id}-panel-${index}`);
        const select = () => { state.selected = index; updatePanels(root, state); };
        button.addEventListener('click', select);
        button.addEventListener('keydown', event => {
          let next;
          if (event.key === 'ArrowRight') next = (index + 1) % labels.length;
          else if (event.key === 'ArrowLeft') next = (index + labels.length - 1) % labels.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = labels.length - 1;
          else return;
          event.preventDefault(); state.selected = next;
          updatePanels(root, state); state.buttons[next].focus();
        });
        tabs.append(button); state.buttons.push(button);
      });
      root.insertBefore(tabs, target);
    }
  }
  target.replaceChildren();
  const panels = labels.map((label, index) => {
    const panel = document.createElement('div');
    panel.className = 'figure-panel'; panel.id = `${state.id}-panel-${index}`;
    target.append(panel); return panel;
  });
  updatePanels(root, state);
  return panels;
}

export function initializeFigure(root) {
  // Let the caption use both columns instead of competing with its value output.
  for (const label of root.querySelectorAll('.statistics-figure__controls label')) {
    if (label.querySelector('.figure-control__label')) continue;
    const nodes = [...label.childNodes].filter(node => node.nodeType === 3 && node.textContent.trim());
    if (!nodes.length) continue;
    const name = document.createElement('span');
    name.className = 'figure-control__label';
    name.textContent = nodes.map(node => node.textContent.trim()).join(' ');
    nodes.forEach(node => node.remove()); label.prepend(name);
  }
  const hint = root.querySelector('.statistics-figure__hint');
  if (!hint || hint.closest('details')) return;
  const details = document.createElement('details');
  details.className = 'statistics-figure__notes';
  const summary = document.createElement('summary');
  summary.textContent = root.dataset.lang === 'zh' ? '读图说明' : 'How to read this figure';
  details.append(summary); root.insertBefore(details, hint); details.append(hint);
  const motion = root.querySelector('.statistics-figure__motion');
  if (motion) details.append(motion);
}
