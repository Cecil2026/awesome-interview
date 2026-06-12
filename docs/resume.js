(function () {
  "use strict";

  const els = {
    tagline: document.getElementById('tagline'),
    sourceLink: document.getElementById('source-link'),
    navStart: document.getElementById('nav-start'),
    navPicker: document.getElementById('nav-picker'),
    navReader: document.getElementById('nav-reader'),
    navCompare: document.getElementById('nav-compare'),
    navResume: document.getElementById('nav-resume'),
    navPlan: document.getElementById('nav-plan'),
    languageSelect: document.getElementById('language-select'),
    themeSelect: document.getElementById('theme-select'),
    inputLabel: document.getElementById('input-label'),
    textarea: document.getElementById('resume-text'),
    generateBtn: document.getElementById('generate-btn'),
    sampleBtn: document.getElementById('sample-btn'),
    hint: document.getElementById('resume-hint'),
    results: document.getElementById('results'),
    detected: document.getElementById('detected'),
    body: document.getElementById('result-body'),
  };

  let currentLanguage = localStorage.getItem('awesome-interview-language') || 'en';
  let questions = [];

  const translations = {
    en: {
      tagline: 'Paste a resume project and generate tailored interview questions.',
      navPicker: 'Picker',
      navReader: 'Reader',
      navCompare: 'Compare',
      navResume: 'Resume → Q',
      navPlan: 'Plan',
      navStart: 'Start',
      inputLabel: 'Project experience',
      placeholder: 'e.g. Built a real-time chat service with Node.js, WebSocket and Redis, sharded across 3 regions, handling 50k concurrent connections...',
      generate: 'Generate questions',
      sample: 'Load sample',
      hint: 'Runs fully offline — no data leaves your browser.',
      footer: 'Heuristic generator — matches your stack against the local question bank and adds tailored follow-ups.',
      sourceCode: 'Source code (AGPL-3.0)',
      pageTitle: 'Resume → Questions',
      detectedLabel: 'Detected stack:',
      noneDetected: 'No specific technologies detected — generating general project questions. Add concrete tech names (React, Kafka, Kubernetes…) for sharper follow-ups.',
      emptyInput: 'Paste a project description first.',
      secTech: 'Technical deep-dive (from your stack)',
      secProject: 'General project deep-dive',
      secBehavioral: 'Behavioral (STAR)',
      secBank: 'Related practice from the question bank',
      bankMeta: '{category} · #{number}',
      noBank: 'No closely matching bank questions found for this stack.',
      // generic project questions
      gp1: 'Walk me through the end-to-end architecture. What were the main components and how did they interact?',
      gp2: 'What was the scale — QPS, data volume, number of users? Where was the bottleneck and how did you find it?',
      gp3: 'What was the hardest technical trade-off you made, and which alternatives did you reject and why?',
      gp4: 'How did the system behave under failure? What happened if a key component or dependency went down?',
      gp5: 'How did you test, deploy and monitor this? Which metrics told you it was healthy?',
      gp6: 'How would you scale this system 10x? What breaks first?',
      // behavioral
      gb1: 'What was your specific contribution versus the rest of the team?',
      gb2: 'Tell me about the biggest challenge or disagreement during this project and how you resolved it.',
      gb3: 'If you rebuilt this today, what would you do differently and why?',
      gb4: 'How did you decide what to prioritize when you were under time pressure?',
    },
    zh: {
      tagline: '粘贴一段简历项目经历，生成对应的技术面试题。',
      navPicker: '选题',
      navReader: '阅读',
      navCompare: '对比',
      navResume: '简历 → 题',
      navPlan: '计划',
      navStart: '开始',
      inputLabel: '项目经历',
      placeholder: '例如：用 Node.js、WebSocket 和 Redis 构建了一个实时聊天服务，按 3 个区域分片，支撑 5 万并发连接……',
      generate: '生成面试题',
      sample: '载入示例',
      hint: '完全离线运行——数据不会离开你的浏览器。',
      footer: '启发式生成器——将你的技术栈与本地题库匹配，并补充针对性的追问。',
      sourceCode: '源代码（AGPL-3.0）',
      pageTitle: '简历 → 面试题',
      detectedLabel: '识别到的技术栈：',
      noneDetected: '未识别到具体技术——已生成通用项目题。补充具体技术名称（React、Kafka、Kubernetes……）可获得更精准的追问。',
      emptyInput: '请先粘贴一段项目描述。',
      secTech: '技术深挖（基于你的技术栈）',
      secProject: '通用项目深挖',
      secBehavioral: '行为面试（STAR）',
      secBank: '题库中的相关练习题',
      bankMeta: '{category} · 第 {number} 题',
      noBank: '题库中没有与该技术栈高度匹配的题目。',
      gp1: '请完整讲一遍系统的端到端架构。主要组件有哪些，它们如何交互？',
      gp2: '系统规模如何——QPS、数据量、用户数？瓶颈在哪里，你是如何定位的？',
      gp3: '你做过的最难的技术权衡是什么？放弃了哪些备选方案，为什么？',
      gp4: '系统在故障时表现如何？某个关键组件或依赖宕机会发生什么？',
      gp5: '你是如何测试、部署和监控它的？哪些指标能说明它是健康的？',
      gp6: '如果要把这个系统扩展 10 倍，你会怎么做？最先出问题的是什么？',
      gb1: '在这个项目里，你个人的具体贡献与团队其他人的贡献分别是什么？',
      gb2: '讲一次项目中最大的挑战或分歧，以及你是如何解决的。',
      gb3: '如果现在重做这个项目，你会有哪些不同的做法，为什么？',
      gb4: '在时间压力下，你是如何决定优先级的？',
    },
  };

  function t(key, params = {}) {
    let v = (translations[currentLanguage] && translations[currentLanguage][key]) || translations.en[key] || key;
    Object.entries(params).forEach(([k, val]) => { v = v.replace(`{${k}}`, val); });
    return v;
  }

  // Technology catalog shared with plan.js — loaded from tech-catalog.js.
  const { CATALOG, normalize, detectTech } = (window.AwesomeTechCatalog || {});

  function applyLocalization() {
    document.documentElement.lang = currentLanguage;
    if (els.languageSelect) els.languageSelect.value = currentLanguage;
    els.tagline.textContent = t('tagline');
    els.navPicker.textContent = t('navPicker');
    els.navCompare.textContent = t('navCompare');
    els.navReader.textContent = t('navReader');
    if (els.navResume) els.navResume.textContent = t('navResume');
    if (els.navPlan) els.navPlan.textContent = t('navPlan');
    if (els.navStart) els.navStart.textContent = t('navStart');
    els.inputLabel.textContent = t('inputLabel');
    els.textarea.placeholder = t('placeholder');
    els.generateBtn.textContent = t('generate');
    els.sampleBtn.textContent = t('sample');
    els.hint.textContent = t('hint');
    document.getElementById('footer-text').textContent = t('footer');
    if (els.sourceLink) els.sourceLink.textContent = t('sourceCode');
    document.title = `awesome-interview · ${t('pageTitle')}`;
  }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function matchBankQuestions(detected) {
    if (!detected.length || !questions.length) return [];
    const wanted = new Set();
    detected.forEach((e) => e.topics.forEach((tp) => wanted.add(tp)));
    const scored = [];
    questions.forEach((q) => {
      const qt = q.topics || [];
      if (!qt.length) return;
      let score = 0;
      qt.forEach((tp) => { if (wanted.has(tp)) score++; });
      if (score > 0) scored.push({ q, score });
    });
    scored.sort((a, b) => b.score - a.score || (a.q.number - b.q.number));
    return scored.slice(0, 12).map((s) => s.q);
  }

  function bankHref(q) {
    const file = (currentLanguage === 'zh' && q.file_zh) ? q.file_zh : q.file;
    return `reader.html?file=${encodeURIComponent(file)}&n=${q.number}`;
  }

  function bankTitle(q) {
    return (currentLanguage === 'zh' && q.title_zh) ? q.title_zh : q.title;
  }

  function section(title, items, opts = {}) {
    if (!items.length && !opts.emptyText) return '';
    const sec = document.createElement('section');
    sec.className = 'result-section';
    const h = document.createElement('h2');
    h.textContent = title;
    sec.appendChild(h);
    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'empty-note';
      p.textContent = opts.emptyText;
      sec.appendChild(p);
      return sec;
    }
    const ul = document.createElement('ul');
    ul.className = 'q-list';
    items.forEach((item) => {
      const li = document.createElement('li');
      if (item.bank) {
        li.className = 'q-item bank';
        li.innerHTML = `<a href="${bankHref(item.q)}">${esc(bankTitle(item.q))}</a>`
          + `<div class="q-meta">${t('bankMeta', { category: esc(item.q.category), number: item.q.number })}</div>`;
      } else {
        li.className = 'q-item';
        const tag = item.tag ? `<span class="q-tag">${esc(item.tag)}</span>` : '';
        li.innerHTML = `${tag}${esc(item.text)}`;
      }
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    return sec;
  }

  function generate() {
    const text = els.textarea.value.trim();
    els.body.innerHTML = '';
    els.detected.innerHTML = '';
    if (!text) {
      els.results.hidden = false;
      els.detected.innerHTML = `<span class="empty-note">${esc(t('emptyInput'))}</span>`;
      return;
    }

    const detected = detectTech(text);

    // Detected chips
    if (detected.length) {
      const label = document.createElement('span');
      label.className = 'empty-note';
      label.style.width = '100%';
      label.textContent = t('detectedLabel');
      els.detected.appendChild(label);
      detected.forEach((e) => {
        const chip = document.createElement('span');
        chip.className = 'tech-chip';
        chip.textContent = e.label;
        els.detected.appendChild(chip);
      });
    } else {
      els.detected.innerHTML = `<span class="empty-note">${esc(t('noneDetected'))}</span>`;
    }

    // Tech follow-ups
    const techItems = [];
    detected.forEach((e) => {
      const arr = (e.follow[currentLanguage] || e.follow.en);
      arr.forEach((q) => techItems.push({ text: q, tag: e.label }));
    });

    // General project + behavioral
    const projItems = ['gp1', 'gp2', 'gp3', 'gp4', 'gp5', 'gp6'].map((k) => ({ text: t(k) }));
    const behItems = ['gb1', 'gb2', 'gb3', 'gb4'].map((k) => ({ text: t(k) }));

    // Bank matches
    const bankItems = matchBankQuestions(detected).map((q) => ({ bank: true, q }));

    if (techItems.length) els.body.appendChild(section(t('secTech'), techItems));
    els.body.appendChild(section(t('secProject'), projItems));
    els.body.appendChild(section(t('secBehavioral'), behItems));
    els.body.appendChild(section(t('secBank'), bankItems, { emptyText: t('noBank') }));

    els.results.hidden = false;
  }

  const SAMPLE = {
    en: 'Led the backend of a real-time chat platform. Built with Java (Spring Boot) microservices behind a gRPC API gateway, using Redis for presence/caching and Kafka for message fan-out. Messages were stored in Cassandra, sharded by conversation ID and replicated across 3 regions. WebSocket gateways held ~80k concurrent connections per node, deployed on Kubernetes with autoscaling. Added end-to-end encryption and reduced p99 latency from 400ms to 90ms.',
    zh: '负责一个实时聊天平台的后端。基于 Java（Spring Boot）微服务，前置 gRPC API 网关，使用 Redis 做在线状态/缓存，Kafka 做消息扇出。消息存储在 Cassandra，按会话 ID 分片并跨 3 个区域复制。WebSocket 网关每个节点维持约 8 万并发连接，部署在 Kubernetes 上并支持自动扩缩容。增加了端到端加密，并将 p99 延迟从 400ms 降到 90ms。',
  };

  function init() {
    applyLocalization();
    if (window.AwesomeTheme) window.AwesomeTheme.wire(els.themeSelect);
    if (els.languageSelect) {
      els.languageSelect.addEventListener('change', (e) => {
        currentLanguage = translations[e.target.value] ? e.target.value : 'en';
        localStorage.setItem('awesome-interview-language', currentLanguage);
        applyLocalization();
        if (!els.results.hidden) generate();
      });
    }
    els.generateBtn.addEventListener('click', generate);
    els.sampleBtn.addEventListener('click', () => {
      els.textarea.value = SAMPLE[currentLanguage] || SAMPLE.en;
      generate();
    });
    els.textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generate(); }
    });

    fetch('questions.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => { questions = data.questions || []; })
      .catch(() => { questions = []; });
  }

  init();
})();
