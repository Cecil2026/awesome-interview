// Floating whiteboard timer with phase reminders — the browser twin of tools/timer.py.
// Self-contained: injects its own markup + styles, reads the shared language key,
// and rides the theme CSS variables (--accent / --bg-card / --text / --border),
// which exist on both the shared stylesheet and the reader's inline palette.
(function () {
  if (window.__awesomeTimerLoaded) return;
  window.__awesomeTimerLoaded = true;

  const LANG_KEY = 'awesome-interview-language';
  const PREF_KEY = 'awesome-interview-timer';

  // Fractions + reminder text mirror tools/timer.py CODING_PHASES / SYSTEM_DESIGN_PHASES.
  const PHASES = {
    coding: [
      [0.10, { en: 'Clarify the problem, ask about constraints and edge cases.', zh: '澄清题意，确认约束和边界情况。' }],
      [0.20, { en: 'Sketch one or two approaches out loud, pick one with justification.', zh: '口头勾勒一两种思路，选定其一并说明理由。' }],
      [0.55, { en: "Write the solution. Talk through what you're doing.", zh: '写解法，边写边讲你在做什么。' }],
      [0.85, { en: 'Walk through with an example. Trace variables.', zh: '用一个例子走查，逐步跟踪变量。' }],
      [1.00, { en: "State complexity (time + space). Mention what you'd improve.", zh: '给出复杂度（时间 + 空间），说说还能怎么优化。' }],
    ],
    'system-design': [
      [0.10, { en: 'Clarify requirements. Functional and non-functional.', zh: '澄清需求：功能性与非功能性。' }],
      [0.20, { en: 'Back-of-envelope: QPS, storage, bandwidth.', zh: '粗略估算：QPS、存储、带宽。' }],
      [0.35, { en: 'API design and data model.', zh: 'API 设计与数据模型。' }],
      [0.60, { en: 'High-level architecture. Load balancer, app, cache, DB, queue.', zh: '总体架构：负载均衡、应用、缓存、数据库、队列。' }],
      [0.85, { en: 'Deep dive on one component. Sharding, replication, consistency.', zh: '深入一个组件：分片、复制、一致性。' }],
      [1.00, { en: "Wrap. Trade-offs. What you'd do with more time.", zh: '收尾：权衡取舍，时间更多会怎么做。' }],
    ],
    plain: [],
  };

  const STR = {
    en: {
      open: 'Timer', title: 'Whiteboard timer', mode: 'Mode',
      plain: 'Plain', coding: 'Coding', sd: 'System design',
      start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset',
      done: "Time's up!", close: 'Close', min: 'min',
    },
    zh: {
      open: '计时器', title: '白板计时器', mode: '模式',
      plain: '纯计时', coding: '编码', sd: '系统设计',
      start: '开始', pause: '暂停', resume: '继续', reset: '重置',
      done: '时间到！', close: '关闭', min: '分钟',
    },
  };

  function lang() {
    return localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en';
  }
  function t(key) {
    return (STR[lang()] || STR.en)[key];
  }
  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function loadPref() {
    try {
      const p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      // Timer is hidden by default; only shown once the user flips the nav toggle.
      return { mode: p.mode || 'coding', minutes: p.minutes || 25, visible: p.visible === true };
    } catch (e) {
      return { mode: 'coding', minutes: 25, visible: false };
    }
  }
  function savePref() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({
        mode: state.mode, minutes: state.minutes, visible: state.visible,
      }));
    } catch (e) {}
  }

  const css = `
  #ai-timer-fab{position:fixed;right:18px;bottom:18px;z-index:9998;display:flex;align-items:center;gap:6px;
    padding:10px 14px;border:none;border-radius:999px;cursor:pointer;font:600 14px/1 -apple-system,system-ui,sans-serif;
    color:#fff;background:var(--accent,#2563eb);box-shadow:0 4px 14px rgba(0,0,0,.25)}
  #ai-timer-fab:hover{background:var(--accent-hover,#1d4ed8)}
  #ai-timer-fab.hidden{display:none}
  #ai-timer-toggle{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:8px;
    border:1px solid var(--border,#e2e8f0);background:transparent;color:var(--text,#0f172a);cursor:pointer;
    font:600 13px/1 -apple-system,system-ui,sans-serif}
  #ai-timer-toggle:hover{border-color:var(--accent,#2563eb)}
  #ai-timer-toggle[aria-pressed="true"]{background:var(--accent,#2563eb);color:#fff;border-color:var(--accent,#2563eb)}
  #ai-timer-panel{position:fixed;right:18px;bottom:70px;z-index:9999;width:300px;max-width:calc(100vw - 36px);
    background:var(--bg-card,#fff);color:var(--text,#0f172a);border:1px solid var(--border,#e2e8f0);
    border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:16px;display:none}
  #ai-timer-panel.open{display:block}
  #ai-timer-panel h3{margin:0 0 10px;font-size:15px;display:flex;justify-content:space-between;align-items:center}
  #ai-timer-panel .ai-x{background:none;border:none;color:var(--text-muted,#64748b);font-size:18px;cursor:pointer;line-height:1}
  #ai-timer-time{font:700 44px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-align:center;margin:6px 0}
  #ai-timer-bar{height:6px;border-radius:6px;background:var(--border,#e2e8f0);overflow:hidden;margin:8px 0 12px}
  #ai-timer-bar>i{display:block;height:100%;width:0;background:var(--accent,#2563eb);transition:width .5s linear}
  #ai-timer-panel .ai-row{display:flex;gap:8px;margin:8px 0}
  #ai-timer-panel select,#ai-timer-panel input{flex:1;padding:7px 8px;border-radius:8px;
    border:1px solid var(--border,#e2e8f0);background:var(--bg,#fff);color:var(--text,#0f172a);font-size:14px}
  #ai-timer-presets button{flex:1;padding:6px 0;border-radius:8px;border:1px solid var(--border,#e2e8f0);
    background:transparent;color:var(--text,#0f172a);cursor:pointer;font-size:13px}
  #ai-timer-presets button:hover{border-color:var(--accent,#2563eb)}
  #ai-timer-controls button{flex:1;padding:9px 0;border-radius:8px;border:none;cursor:pointer;font-weight:600;font-size:14px}
  #ai-timer-go{background:var(--accent,#2563eb);color:#fff}
  #ai-timer-reset{background:var(--border,#e2e8f0);color:var(--text,#0f172a)}
  #ai-timer-phase{min-height:34px;font-size:13px;line-height:1.4;padding:8px 10px;border-radius:8px;
    background:var(--badge-bg,#e2e8f0);margin-top:4px}
  #ai-timer-phase.flash{animation:ai-flash 1s ease}
  @keyframes ai-flash{0%,100%{background:var(--badge-bg,#e2e8f0)}30%{background:var(--accent,#2563eb);color:#fff}}
  `;

  let els = null;
  let state = { total: 0, remaining: 0, running: false, tick: null, mode: 'coding', minutes: 25, fired: 0, visible: false };

  function beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.08;
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 220);
    } catch (e) {}
  }

  function showPhase(text, flash) {
    els.phase.textContent = text;
    if (flash) {
      els.phase.classList.remove('flash');
      void els.phase.offsetWidth; // restart animation
      els.phase.classList.add('flash');
      beep();
    }
  }

  function render() {
    els.time.textContent = fmt(state.remaining);
    const frac = state.total ? (state.total - state.remaining) / state.total : 0;
    els.bar.style.width = (frac * 100).toFixed(1) + '%';
  }

  function stopTick() {
    if (state.tick) { clearInterval(state.tick); state.tick = null; }
    state.running = false;
    els.go.textContent = state.remaining > 0 && state.remaining < state.total ? t('resume') : t('start');
  }

  function onTick() {
    state.remaining -= 1;
    if (state.remaining <= 0) {
      state.remaining = 0;
      render();
      stopTick();
      showPhase(t('done'), true);
      document.title = '⏰ ' + t('done');
      return;
    }
    const elapsed = state.total - state.remaining;
    const phases = PHASES[state.mode] || [];
    while (state.fired < phases.length && elapsed >= state.total * phases[state.fired][0]) {
      const msg = phases[state.fired][1];
      showPhase(msg[lang()] || msg.en, true);
      state.fired += 1;
    }
    render();
  }

  function start() {
    if (state.running) { stopTick(); return; }
    if (state.remaining <= 0) reset(false);
    if (state.remaining <= 0) return;
    state.running = true;
    els.go.textContent = t('pause');
    state.tick = setInterval(onTick, 1000);
  }

  function reset(clearPhase) {
    stopTick();
    const minutes = Math.max(0.1, parseFloat(els.minutes.value) || 25);
    state.mode = els.mode.value;
    state.minutes = minutes;
    state.total = Math.round(minutes * 60);
    state.remaining = state.total;
    state.fired = 0;
    savePref();
    render();
    els.go.textContent = t('start');
    if (clearPhase !== false) {
      const phases = PHASES[state.mode] || [];
      showPhase(phases.length ? (phases[0][1][lang()] || phases[0][1].en) : '', false);
    }
  }

  function setVisible(visible, persist) {
    state.visible = visible;
    els.fab.classList.toggle('hidden', !visible);
    if (els.toggle) els.toggle.setAttribute('aria-pressed', visible ? 'true' : 'false');
    if (!visible && els.panel) els.panel.classList.remove('open');
    if (persist) savePref();
  }

  function localize() {
    els.fab.querySelector('span').textContent = t('open');
    if (els.toggle) {
      els.toggle.querySelector('span').textContent = t('open');
      els.toggle.setAttribute('aria-label', t('open'));
      els.toggle.title = t('open');
    }
    els.title.childNodes[0].textContent = t('title') + ' ';
    els.mode.options[0].textContent = t('plain');
    els.mode.options[1].textContent = t('coding');
    els.mode.options[2].textContent = t('sd');
    els.reset.textContent = t('reset');
    els.go.textContent = state.running ? t('pause')
      : (state.remaining > 0 && state.remaining < state.total ? t('resume') : t('start'));
  }

  function build() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const fab = document.createElement('button');
    fab.id = 'ai-timer-fab';
    fab.setAttribute('aria-label', 'Timer');
    fab.innerHTML = '⏱ <span></span>';

    const panel = document.createElement('div');
    panel.id = 'ai-timer-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Whiteboard timer');
    panel.innerHTML = `
      <h3><span></span><button class="ai-x" aria-label="Close">×</button></h3>
      <div id="ai-timer-time">25:00</div>
      <div id="ai-timer-bar"><i></i></div>
      <div class="ai-row"><select id="ai-timer-mode">
        <option value="plain"></option><option value="coding"></option><option value="system-design"></option>
      </select><input id="ai-timer-min" type="number" min="1" step="1" value="25" aria-label="minutes"></div>
      <div class="ai-row" id="ai-timer-presets">
        <button data-m="25">25</button><button data-m="45">45</button><button data-m="60">60</button>
      </div>
      <div class="ai-row" id="ai-timer-controls">
        <button id="ai-timer-go">Start</button><button id="ai-timer-reset">Reset</button>
      </div>
      <div id="ai-timer-phase"></div>`;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    // Nav toggle — the switch that reveals/hides the (default-hidden) timer widget.
    let toggle = null;
    const nav = document.querySelector('header nav');
    if (nav) {
      toggle = document.createElement('button');
      toggle.id = 'ai-timer-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-pressed', 'false');
      toggle.innerHTML = '⏱ <span></span>';
      nav.appendChild(toggle);
    }

    els = {
      fab, panel, toggle,
      title: panel.querySelector('h3'),
      time: panel.querySelector('#ai-timer-time'),
      bar: panel.querySelector('#ai-timer-bar > i'),
      mode: panel.querySelector('#ai-timer-mode'),
      minutes: panel.querySelector('#ai-timer-min'),
      go: panel.querySelector('#ai-timer-go'),
      reset: panel.querySelector('#ai-timer-reset'),
      phase: panel.querySelector('#ai-timer-phase'),
    };

    const pref = loadPref();
    els.mode.value = pref.mode;
    els.minutes.value = pref.minutes;

    fab.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      if (open) { localize(); if (state.total === 0) reset(); }
    });
    if (toggle) {
      toggle.addEventListener('click', () => {
        const next = !state.visible;
        setVisible(next, true);
        // Revealing the timer also pops the panel open so it's immediately usable.
        if (next) { panel.classList.add('open'); localize(); if (state.total === 0) reset(); }
      });
    }
    // The nav toggle is always visible, so keep its label in sync when the
    // page switches language in place (no reload).
    const langSel = document.getElementById('language-select');
    if (langSel) langSel.addEventListener('change', () => localize());
    panel.querySelector('.ai-x').addEventListener('click', () => panel.classList.remove('open'));
    els.go.addEventListener('click', start);
    els.reset.addEventListener('click', () => reset());
    els.mode.addEventListener('change', () => reset());
    els.minutes.addEventListener('change', () => reset());
    panel.querySelectorAll('#ai-timer-presets button').forEach((b) => {
      b.addEventListener('click', () => { els.minutes.value = b.dataset.m; reset(); });
    });

    state.visible = pref.visible;
    localize();
    reset();
    setVisible(pref.visible, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
