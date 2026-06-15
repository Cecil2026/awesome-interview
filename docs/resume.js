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
      viewAnswer: 'Show talking points',
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
      secBank: '题库里相关的练习题',
      bankMeta: '{category} · 第 {number} 题',
      noBank: '题库里没有和这套技术栈高度匹配的题目。',
      viewAnswer: '查看答案要点',
    },
  };

  function t(key, params = {}) {
    let v = (translations[currentLanguage] && translations[currentLanguage][key]) || translations.en[key] || key;
    Object.entries(params).forEach(([k, val]) => { v = v.replace(`{${k}}`, val); });
    return v;
  }

  // Generic project + behavioral question banks (with talking-point answers).
  const GENERIC_PROJECT = {
    en: [
      { q: 'Walk me through the end-to-end architecture. What were the main components and how did they interact?',
        a: ['Lead with a one-sentence summary, then draw the boxes',
            'Name the synchronous path vs the async / event paths',
            'Call out the data stores and why each one was chosen',
            'Mention what is yours vs what is shared infra'] },
      { q: 'What was the scale — QPS, data volume, number of users? Where was the bottleneck and how did you find it?',
        a: ['Concrete numbers: peak QPS, p50 / p99, data growth per day',
            'Name the bottleneck (DB, network, lock contention) — be specific',
            'How you found it: profiler, flame graph, slow log, RUM',
            'What you measured before vs after to prove the fix'] },
      { q: 'What was the hardest technical trade-off you made, and which alternatives did you reject and why?',
        a: ['Frame the trade-off in 2-3 axes (latency vs cost, consistency vs availability)',
            'State the rejected option fairly — what it would have been good at',
            'Why this fit your constraints (team size, deadline, traffic shape)',
            'What you would revisit if constraints changed'] },
      { q: 'How did the system behave under failure? What happened if a key component or dependency went down?',
        a: ['Walk one failure scenario end-to-end (e.g., DB primary loss)',
            'Detection: alerts, SLO breach, customer report — what fired first',
            'Mitigations in place: retries, circuit breakers, fallback, degraded mode',
            'What was a known weakness that you accepted'] },
      { q: 'How did you test, deploy and monitor this? Which metrics told you it was healthy?',
        a: ['Test pyramid: unit + integration + load + chaos',
            'Deploy: canary / blue-green; auto-rollback signal',
            'Golden signals: latency, traffic, errors, saturation',
            'Plus business KPIs that prove the system is actually working'] },
      { q: 'How would you scale this system 10x? What breaks first?',
        a: ['Identify the current bottleneck and project it linearly',
            'Likely next failure: single-writer DB, cross-region latency, hot key',
            'Sketch the change: shard, cache layer, async path',
            'What this would cost (people + infra) and what risk it adds'] },
    ],
    zh: [
      { q: '完整讲一遍系统的端到端架构。主要组件有哪些,它们怎么交互?',
        a: ['先一句话总结,再画框图',
            '区分同步路径和异步 / 事件路径',
            '点出数据存储,以及为什么选每一个',
            '说明哪些是你自己的,哪些是共用基础设施'] },
      { q: '系统规模怎样——QPS、数据量、用户数?瓶颈在哪里,你怎么定位的?',
        a: ['给具体数字:峰值 QPS、p50 / p99、每天数据增量',
            '点名瓶颈(DB、网络、锁竞争),要具体',
            '怎么发现的:profiler、火焰图、慢日志、RUM',
            '修复前后分别度量哪些指标,证明确实改善'] },
      { q: '你做过最难的技术取舍是什么?放弃了哪些备选方案,为什么?',
        a: ['用 2-3 个维度框定取舍(延迟 vs 成本、一致性 vs 可用)',
            '客观陈述被放弃的方案有什么优势',
            '为什么当前选择更契合你的约束(团队、时限、流量形态)',
            '如果约束变化,哪个会重新考虑'] },
      { q: '系统在故障下表现如何?某个关键组件或依赖挂掉会发生什么?',
        a: ['完整走一个故障场景(比如 DB 主库丢失)',
            '感知:告警、SLO 破线、用户反馈——哪个先出',
            '已有的缓解:重试、熔断、降级、fallback',
            '哪些已知弱点是你主动接受的'] },
      { q: '你怎么测试、部署和监控?哪些指标说明它是健康的?',
        a: ['测试金字塔:单测 + 集成 + 压测 + 混沌',
            '部署:金丝雀 / 蓝绿;自动回滚信号',
            '黄金信号:延迟、流量、错误、饱和度',
            '加上能证明系统真在工作的业务 KPI'] },
      { q: '把这个系统扩展 10 倍你会怎么做?最先坏的是什么?',
        a: ['先识别当前瓶颈,线性外推',
            '下一个故障点通常是:单写 DB、跨地域延迟、热点 key',
            '勾勒改动:分片、加缓存层、改异步',
            '成本(人 + 资源)和带来的风险'] },
    ],
  };

  const GENERIC_BEHAVIORAL = {
    en: [
      { q: 'What was your specific contribution versus the rest of the team?',
        a: ['Use "I" not "we" — own your slice',
            'Be precise: design / code / mentoring / on-call',
            'Acknowledge the team — does not weaken you, it adds credibility',
            'Quantify when possible (lines, commits do not count; outcomes do)'] },
      { q: 'Tell me about the biggest challenge or disagreement during this project and how you resolved it.',
        a: ['STAR: situation, task, action, result — keep each tight',
            'Pick a real disagreement, not a strawman',
            'Show the data / experiment that broke the tie',
            'Close on what you learned about working with that person / team'] },
      { q: 'If you rebuilt this today, what would you do differently and why?',
        a: ['Pick 1-2 things, not a laundry list',
            'Show you understand what was right at the time vs what is right now',
            'Mention what you learned that changed your view',
            'Avoid "we should have used <today\'s buzzword>" without justification'] },
      { q: 'How did you decide what to prioritize when you were under time pressure?',
        a: ['Name the framework (RICE / ICE / impact-effort) — but stay concrete',
            'What you cut and why; what you chose to ship',
            'How you communicated the trade-off to stakeholders',
            'What ended up mattering vs what you over- or under-weighted'] },
    ],
    zh: [
      { q: '这个项目里你的具体贡献,和团队其他人的贡献分别是什么?',
        a: ['用"我"不用"我们"——讲清自己那块',
            '具体一点:设计 / 实现 / 带人 / 值班',
            '承认团队的作用——不会削弱你,反而更可信',
            '能量化就量化(代码行数不算,产出结果才算)'] },
      { q: '讲一次项目中最大的挑战或分歧,以及你怎么解决的。',
        a: ['STAR:情境 / 任务 / 行动 / 结果——每一段都简洁',
            '选真实的分歧,不要立稻草人',
            '说清楚是什么数据 / 实验决定了结果',
            '收尾讲你从中学到了怎么和这类同事 / 团队合作'] },
      { q: '如果现在重做这个项目,你会有哪些不同的做法,为什么?',
        a: ['挑 1-2 件,不要列清单',
            '说明你能分清"当时是对的"和"现在是对的"',
            '提一下你学到的、改变了观点的东西',
            '避免"应该用 <最新流行词>"这种没有论据的话'] },
      { q: '时间紧的时候你怎么决定优先级?',
        a: ['说出你用的框架(RICE / ICE / 影响 vs 投入),但要具体',
            '砍了什么,为什么;选择什么先上',
            '怎么跟干系人沟通这个取舍',
            '最后真正重要的是什么,哪些被你高估或低估了'] },
    ],
  };

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
        let html = `${tag}<div class="q-text">${esc(item.text)}</div>`;
        if (Array.isArray(item.a) && item.a.length) {
          const bullets = item.a.map((b) => `<li>${esc(b)}</li>`).join('');
          html += `<details class="q-answer"><summary>${esc(t('viewAnswer'))}</summary>`
                + `<ul>${bullets}</ul></details>`;
        }
        li.innerHTML = html;
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
      arr.forEach((entry) => {
        // Backwards-compat: entry may be plain string or { q, a }.
        const q = typeof entry === 'string' ? entry : entry.q;
        const a = typeof entry === 'string' ? null : entry.a;
        techItems.push({ text: q, tag: e.label, a });
      });
    });

    // General project + behavioral
    const projBank = GENERIC_PROJECT[currentLanguage] || GENERIC_PROJECT.en;
    const behBank = GENERIC_BEHAVIORAL[currentLanguage] || GENERIC_BEHAVIORAL.en;
    const projItems = projBank.map((e) => ({ text: e.q, a: e.a }));
    const behItems = behBank.map((e) => ({ text: e.q, a: e.a }));

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
