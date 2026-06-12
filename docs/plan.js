(function () {
  "use strict";

  const els = {
    tagline: document.getElementById('tagline'),
    sourceLink: document.getElementById('source-link'),
    navPicker: document.getElementById('nav-picker'),
    navReader: document.getElementById('nav-reader'),
    navCompare: document.getElementById('nav-compare'),
    navResume: document.getElementById('nav-resume'),
    navPlan: document.getElementById('nav-plan'),
    navStart: document.getElementById('nav-start'),
    languageSelect: document.getElementById('language-select'),
    themeSelect: document.getElementById('theme-select'),
    labelRole: document.getElementById('label-role'),
    labelWeeks: document.getElementById('label-weeks'),
    labelCompanies: document.getElementById('label-companies'),
    roleSelect: document.getElementById('role-select'),
    weeksSelect: document.getElementById('weeks-select'),
    companiesSelect: document.getElementById('companies-select'),
    resumeSummary: document.getElementById('resume-summary'),
    resumeText: document.getElementById('resume-text'),
    generateBtn: document.getElementById('generate-btn'),
    sampleBtn: document.getElementById('sample-btn'),
    hint: document.getElementById('plan-hint'),
    results: document.getElementById('results'),
    summaryChips: document.getElementById('summary-chips'),
    body: document.getElementById('result-body'),
    status: document.getElementById('status'),
    footer: document.getElementById('footer-text'),
  };

  const STATE_KEY = 'awesome-interview-plan-inputs';

  let currentLanguage = localStorage.getItem('awesome-interview-language') || 'en';
  let questions = [];
  let roles = [];
  let companies = [];

  // Map STAR question numbers to themes (mirrors the section headers in
  // behavioral/star-questions.md). Drift would be caught by a smoke test.
  const STAR_THEMES = [
    { from: 1, to: 8,  theme: 'Leadership & ownership' },
    { from: 9, to: 16, theme: 'Conflict & disagreement' },
    { from: 17, to: 22, theme: 'Failure & learning' },
    { from: 23, to: 30, theme: 'Collaboration & influence' },
    { from: 31, to: 36, theme: 'Innovation & ambiguity' },
    { from: 37, to: 41, theme: 'Customer / user focus' },
    { from: 42, to: 46, theme: 'Time management & prioritization' },
    { from: 47, to: 50, theme: 'Growth & feedback' },
  ];

  const THEME_LABELS_ZH = {
    'Leadership & ownership': '领导力与 Ownership',
    'Conflict & disagreement': '冲突与分歧',
    'Failure & learning': '失败与学习',
    'Collaboration & influence': '协作与影响力',
    'Innovation & ambiguity': '创新与模糊性',
    'Customer / user focus': '以用户为中心',
    'Time management & prioritization': '时间管理与优先级',
    'Growth & feedback': '成长与反馈',
  };

  const translations = {
    en: {
      tagline: 'Generate a multi-week prep plan tailored to your target company, role, and resume.',
      navPicker: 'Picker',
      navReader: 'Reader',
      navCompare: 'Compare',
      navResume: 'Resume → Q',
      navPlan: 'Plan',
      navStart: 'Start',
      labelRole: 'Role category',
      labelWeeks: 'Time window (weeks)',
      labelCompanies: 'Target companies (optional, multi-select)',
      resumeSummary: 'Add resume / project description (optional)',
      resumeOpenLabel: 'Add resume / project description (optional)',
      placeholder: 'e.g. Built a real-time chat service with Node.js, WebSocket and Redis, sharded across 3 regions, handling 50k concurrent connections...',
      generate: 'Generate plan',
      sample: 'Load sample',
      hint: 'Runs fully offline — no data leaves your browser.',
      footer: 'Heuristic generator — picks bank questions weighted by your role + resume + company focus, then schedules them into weeks.',
      sourceCode: 'Source code (AGPL-3.0)',
      pageTitle: 'Prep Plan',
      statusLoading: 'Loading data…',
      statusReady: 'Pick your inputs and click Generate plan.',
      statusError: 'Failed to load data. Run the local service from the repo root and reload.',
      secPriority: '1. Priority question list',
      secGuidance: '2. Targeted guidance',
      secWeekly: '3. Week-by-week plan',
      secBehavioral: '4. Behavioral (STAR) prep',
      guidanceRole: 'For this role',
      guidanceCompany: 'Per company',
      week: 'Week {n}',
      weekFocus: 'Focus: {focus}',
      weekMilestone: 'Milestone: complete the questions below and record one takeaway per item.',
      bankMeta: '{category} · #{number}',
      noBehavioral: 'No matching STAR questions found for this role\'s behavioral themes.',
      noBank: 'No matching bank questions for these inputs.',
      noResume: 'No resume detected — weighting plan by role + company only.',
      chipRole: 'Role: {x}',
      chipWeeks: 'Window: {x} weeks',
      chipCompanies: 'Companies: {x}',
      chipResume: 'Resume signals: {x}',
      anyCompany: 'any',
      pickedSize: '{n} questions picked',
    },
    zh: {
      tagline: '根据目标公司、岗位与简历生成多周面试备考计划。',
      navPicker: '选题',
      navReader: '阅读',
      navCompare: '对比',
      navResume: '简历 → 题',
      navPlan: '计划',
      navStart: '开始',
      labelRole: '岗位类别',
      labelWeeks: '时间窗（周）',
      labelCompanies: '目标公司（可选，多选）',
      resumeSummary: '添加简历 / 项目描述（可选）',
      resumeOpenLabel: '添加简历 / 项目描述（可选）',
      placeholder: '例如：用 Node.js、WebSocket 和 Redis 构建了一个实时聊天服务，按 3 个区域分片，支撑 5 万并发连接……',
      generate: '生成计划',
      sample: '载入示例',
      hint: '完全离线运行——数据不会离开你的浏览器。',
      footer: '启发式生成器——根据岗位 + 简历 + 公司侧重加权挑题，并切分到每周。',
      sourceCode: '源代码（AGPL-3.0）',
      pageTitle: '备考计划',
      statusLoading: '正在加载数据……',
      statusReady: '选择参数后点击"生成计划"。',
      statusError: '加载数据失败。请从仓库根目录启动本地服务后刷新。',
      secPriority: '1. 优先题清单',
      secGuidance: '2. 针对性指导',
      secWeekly: '3. 周计划',
      secBehavioral: '4. 行为面（STAR）准备',
      guidanceRole: '岗位侧重',
      guidanceCompany: '公司侧重',
      week: '第 {n} 周',
      weekFocus: '主题：{focus}',
      weekMilestone: '里程碑：完成下列题目，并为每题写一句收获。',
      bankMeta: '{category} · 第 {number} 题',
      noBehavioral: '该岗位的行为面主题没有匹配到 STAR 题。',
      noBank: '当前条件下没有匹配的题库题目。',
      noResume: '未提供简历——仅按岗位 + 公司加权。',
      chipRole: '岗位：{x}',
      chipWeeks: '窗口：{x} 周',
      chipCompanies: '公司：{x}',
      chipResume: '简历命中：{x}',
      anyCompany: '任意',
      pickedSize: '共 {n} 题',
    },
  };

  function t(key, params = {}) {
    let v = (translations[currentLanguage] && translations[currentLanguage][key]) || translations.en[key] || key;
    Object.entries(params).forEach(([k, val]) => { v = v.replace(`{${k}}`, val); });
    return v;
  }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function pickN(arr, n) {
    return arr.slice(0, n);
  }

  function classifyKind(q) {
    const topics = new Set((q.topics || []).map((x) => String(x).toLowerCase()));
    const category = (q.category || '').toLowerCase();
    if (category === 'behavioral' || topics.has('behavioral')) return 'behavioral';
    if (topics.has('system-design') || topics.has('design')) return 'system-design';
    if (category === 'knowledge' || topics.has('domain-knowledge')) return 'knowledge';
    return 'algorithm';
  }

  function starThemeFor(q) {
    if (q.file !== 'behavioral/star-questions.md') return null;
    const n = q.number;
    for (const r of STAR_THEMES) {
      if (n >= r.from && n <= r.to) return r.theme;
    }
    return null;
  }

  function selectedRole() {
    return roles.find((r) => r.id === els.roleSelect.value) || roles[0];
  }

  function selectedCompanies() {
    return Array.from(els.companiesSelect.selectedOptions).map((o) => o.value);
  }

  function selectedWeeks() {
    return parseInt(els.weeksSelect.value, 10) || 4;
  }

  function detectResume() {
    const txt = (els.resumeText.value || '').trim();
    if (!txt || !window.AwesomeTechCatalog) return [];
    return window.AwesomeTechCatalog.detectTech(txt);
  }

  function buildTopicWeights(role, resumeHits, companyIds) {
    const w = new Map();
    role.topics.forEach((entry) => {
      w.set(entry.topic, (w.get(entry.topic) || 0) + entry.weight);
    });
    resumeHits.forEach((entry) => {
      (entry.topics || []).forEach((tp) => {
        w.set(tp, (w.get(tp) || 0) + 1);
      });
    });
    // Companies currently colour guidance only — no per-company topic boost.
    void companyIds;
    return w;
  }

  function scoreQuestion(q, weights) {
    let s = 0;
    (q.topics || []).forEach((tp) => {
      const w = weights.get(tp);
      if (w) s += w;
    });
    return s;
  }

  function rankBank(role, resumeHits, companyIds) {
    const weights = buildTopicWeights(role, resumeHits, companyIds);
    const scored = [];
    questions.forEach((q) => {
      const kind = classifyKind(q);
      if (kind === 'behavioral') return;
      const s = scoreQuestion(q, weights);
      if (s > 0) scored.push({ q, score: s, kind });
    });
    scored.sort((a, b) => b.score - a.score
      || (a.q.file || '').localeCompare(b.q.file || '')
      || (a.q.number - b.q.number));
    return scored;
  }

  function targetCount(weeks) {
    // ~12-15 questions per week of dedicated prep, capped at the bank size.
    return Math.min(weeks * 13, 100);
  }

  function bucketIntoWeeks(picks, weeks) {
    // Interleave by kind so each week mixes algorithm + system design + knowledge.
    const byKind = { algorithm: [], 'system-design': [], knowledge: [] };
    picks.forEach((p) => {
      const bucket = byKind[p.kind] ? p.kind : 'algorithm';
      byKind[bucket].push(p);
    });
    const buckets = [];
    for (let i = 0; i < weeks; i++) buckets.push([]);
    let idx = 0;
    const drain = (kind, perWeek) => {
      buckets.forEach((b) => {
        for (let i = 0; i < perWeek && byKind[kind].length; i++) {
          b.push(byKind[kind].shift());
          idx++;
        }
      });
    };
    // Rough weekly mix: 7 algo + 2 system-design + 2 knowledge — adjusted if pool light.
    drain('algorithm', 7);
    drain('system-design', 2);
    drain('knowledge', 2);
    // Spread leftovers evenly.
    let w = 0;
    ['algorithm', 'system-design', 'knowledge'].forEach((k) => {
      while (byKind[k].length) {
        buckets[w % weeks].push(byKind[k].shift());
        w++;
        idx++;
      }
    });
    void idx;
    return buckets;
  }

  function weekFocus(role, weekIdx, totalWeeks) {
    const topicsList = role.topics.slice(0, Math.max(2, Math.ceil(role.topics.length / totalWeeks * 2)));
    if (!topicsList.length) return '';
    const pick = topicsList[weekIdx % topicsList.length];
    return pick ? pick.topic : '';
  }

  function bankHref(q) {
    const file = (currentLanguage === 'zh' && q.file_zh) ? q.file_zh : q.file;
    return `reader.html?file=${encodeURIComponent(file)}&n=${q.number}`;
  }

  function bankTitle(q) {
    return (currentLanguage === 'zh' && q.title_zh) ? q.title_zh : q.title;
  }

  function makeSection(title) {
    const sec = document.createElement('section');
    sec.className = 'result-section';
    const h = document.createElement('h2');
    h.textContent = title;
    sec.appendChild(h);
    return sec;
  }

  function renderPriority(picks) {
    const sec = makeSection(t('secPriority'));
    if (!picks.length) {
      const p = document.createElement('p');
      p.className = 'empty-note';
      p.textContent = t('noBank');
      sec.appendChild(p);
      return sec;
    }
    const meta = document.createElement('p');
    meta.className = 'empty-note';
    meta.textContent = t('pickedSize', { n: picks.length });
    sec.appendChild(meta);
    const ul = document.createElement('ul');
    ul.className = 'q-list';
    picks.slice(0, 25).forEach((p) => {
      const li = document.createElement('li');
      li.className = 'q-item bank';
      li.innerHTML = `<a href="${bankHref(p.q)}">${esc(bankTitle(p.q))}</a>`
        + `<div class="q-meta">${t('bankMeta', { category: esc(p.q.category), number: p.q.number })}`
        + ` · score ${p.score}</div>`;
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    return sec;
  }

  function renderGuidance(role, companyIds) {
    const sec = makeSection(t('secGuidance'));
    const wrap = document.createElement('div');
    wrap.className = 'guidance';
    const roleText = currentLanguage === 'zh' ? role.guidance_zh : role.guidance_en;
    const roleH = document.createElement('p');
    roleH.className = 'gh';
    roleH.textContent = t('guidanceRole');
    wrap.appendChild(roleH);
    (roleText || '').split(/\n+/).forEach((para) => {
      if (!para.trim()) return;
      const p = document.createElement('p');
      p.textContent = para.trim();
      wrap.appendChild(p);
    });
    const picked = companies.filter((c) => companyIds.includes(c.id));
    if (picked.length) {
      const compH = document.createElement('p');
      compH.className = 'gh';
      compH.style.marginTop = '0.9rem';
      compH.textContent = t('guidanceCompany');
      wrap.appendChild(compH);
      picked.forEach((c) => {
        const p = document.createElement('p');
        const focus = currentLanguage === 'zh' ? c.focus_zh : c.focus_en;
        const label = currentLanguage === 'zh' ? c.label_zh : c.label_en;
        p.innerHTML = `<strong>${esc(label)}:</strong> ${esc(focus || '')}`;
        wrap.appendChild(p);
      });
    }
    sec.appendChild(wrap);
    return sec;
  }

  function renderWeekly(role, picks, weeks) {
    const sec = makeSection(t('secWeekly'));
    if (!picks.length) {
      const p = document.createElement('p');
      p.className = 'empty-note';
      p.textContent = t('noBank');
      sec.appendChild(p);
      return sec;
    }
    const buckets = bucketIntoWeeks(picks, weeks);
    buckets.forEach((bucket, idx) => {
      const block = document.createElement('div');
      block.className = 'week-block';
      const h = document.createElement('h3');
      h.textContent = t('week', { n: idx + 1 });
      block.appendChild(h);
      const focus = weekFocus(role, idx, weeks);
      if (focus) {
        const f = document.createElement('div');
        f.className = 'week-focus';
        f.textContent = t('weekFocus', { focus });
        block.appendChild(f);
      }
      const ul = document.createElement('ul');
      bucket.forEach((p) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="li-tag">${esc(p.kind)}</span>`
          + `<a href="${bankHref(p.q)}">${esc(bankTitle(p.q))}</a>`;
        ul.appendChild(li);
      });
      block.appendChild(ul);
      const m = document.createElement('div');
      m.className = 'week-milestone';
      m.textContent = t('weekMilestone');
      block.appendChild(m);
      sec.appendChild(block);
    });
    return sec;
  }

  function renderBehavioral(role) {
    const sec = makeSection(t('secBehavioral'));
    const themes = new Set(role.behavioral_themes || []);
    const matches = questions
      .filter((q) => q.file === 'behavioral/star-questions.md')
      .filter((q) => themes.has(starThemeFor(q)))
      .sort((a, b) => a.number - b.number);
    if (!matches.length) {
      const p = document.createElement('p');
      p.className = 'empty-note';
      p.textContent = t('noBehavioral');
      sec.appendChild(p);
      return sec;
    }
    // Group by theme.
    const byTheme = new Map();
    matches.forEach((q) => {
      const th = starThemeFor(q);
      if (!byTheme.has(th)) byTheme.set(th, []);
      byTheme.get(th).push(q);
    });
    byTheme.forEach((qs, themeKey) => {
      const block = document.createElement('div');
      block.className = 'week-block';
      const h = document.createElement('h3');
      h.textContent = currentLanguage === 'zh' && THEME_LABELS_ZH[themeKey]
        ? THEME_LABELS_ZH[themeKey] : themeKey;
      block.appendChild(h);
      const ul = document.createElement('ul');
      pickN(qs, 4).forEach((q) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${bankHref(q)}">${esc(bankTitle(q))}</a>`;
        ul.appendChild(li);
      });
      block.appendChild(ul);
      sec.appendChild(block);
    });
    return sec;
  }

  function renderSummaryChips(role, weeks, companyIds, resumeHits) {
    els.summaryChips.innerHTML = '';
    const items = [
      t('chipRole', { x: currentLanguage === 'zh' ? role.label_zh : role.label_en }),
      t('chipWeeks', { x: weeks }),
      t('chipCompanies', { x: companyIds.length
        ? companyIds.map((id) => {
            const c = companies.find((x) => x.id === id);
            return c ? (currentLanguage === 'zh' ? c.label_zh : c.label_en) : id;
          }).join(', ')
        : t('anyCompany') }),
    ];
    if (resumeHits.length) {
      items.push(t('chipResume', { x: resumeHits.map((h) => h.label).join(', ') }));
    } else if (els.resumeText.value.trim()) {
      items.push(t('chipResume', { x: '—' }));
    }
    items.forEach((txt) => {
      const span = document.createElement('span');
      span.className = 'chip';
      span.textContent = txt;
      els.summaryChips.appendChild(span);
    });
  }

  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        role: els.roleSelect.value,
        weeks: els.weeksSelect.value,
        companies: selectedCompanies(),
        resume: els.resumeText.value,
      }));
    } catch (e) { /* ignore quota */ }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.role && roles.some((r) => r.id === s.role)) els.roleSelect.value = s.role;
      if (s.weeks) els.weeksSelect.value = String(s.weeks);
      if (Array.isArray(s.companies)) {
        Array.from(els.companiesSelect.options).forEach((o) => {
          o.selected = s.companies.includes(o.value);
        });
      }
      if (typeof s.resume === 'string') els.resumeText.value = s.resume;
    } catch (e) { /* ignore */ }
  }

  function generate() {
    const role = selectedRole();
    if (!role) return;
    const weeks = selectedWeeks();
    const companyIds = selectedCompanies();
    const resumeHits = detectResume();
    persist();

    const ranked = rankBank(role, resumeHits, companyIds);
    const picks = pickN(ranked, targetCount(weeks));

    els.body.innerHTML = '';
    renderSummaryChips(role, weeks, companyIds, resumeHits);
    els.body.appendChild(renderPriority(picks));
    els.body.appendChild(renderGuidance(role, companyIds));
    els.body.appendChild(renderWeekly(role, picks, weeks));
    els.body.appendChild(renderBehavioral(role));
    els.results.hidden = false;
    els.status.textContent = '';
  }

  function populateRoleSelect() {
    els.roleSelect.innerHTML = '';
    roles.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = currentLanguage === 'zh' ? r.label_zh : r.label_en;
      els.roleSelect.appendChild(opt);
    });
  }

  function populateCompaniesSelect() {
    els.companiesSelect.innerHTML = '';
    companies.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = currentLanguage === 'zh' ? c.label_zh : c.label_en;
      els.companiesSelect.appendChild(opt);
    });
  }

  function applyLocalization() {
    document.documentElement.lang = currentLanguage;
    if (els.languageSelect) els.languageSelect.value = currentLanguage;
    if (els.tagline) els.tagline.textContent = t('tagline');
    if (els.navPicker) els.navPicker.textContent = t('navPicker');
    if (els.navReader) els.navReader.textContent = t('navReader');
    if (els.navCompare) els.navCompare.textContent = t('navCompare');
    if (els.navResume) els.navResume.textContent = t('navResume');
    if (els.navPlan) els.navPlan.textContent = t('navPlan');
    if (els.navStart) els.navStart.textContent = t('navStart');
    if (els.labelRole) els.labelRole.textContent = t('labelRole');
    if (els.labelWeeks) els.labelWeeks.textContent = t('labelWeeks');
    if (els.labelCompanies) els.labelCompanies.textContent = t('labelCompanies');
    if (els.resumeSummary) els.resumeSummary.textContent = t('resumeSummary');
    if (els.resumeText) els.resumeText.placeholder = t('placeholder');
    if (els.generateBtn) els.generateBtn.textContent = t('generate');
    if (els.sampleBtn) els.sampleBtn.textContent = t('sample');
    if (els.hint) els.hint.textContent = t('hint');
    if (els.footer) els.footer.textContent = t('footer');
    if (els.sourceLink) els.sourceLink.textContent = t('sourceCode');
    document.title = `awesome-interview · ${t('pageTitle')}`;
    if (roles.length) populateRoleSelect();
    if (companies.length) populateCompaniesSelect();
    if (!els.results.hidden) generate();
  }

  const SAMPLE = {
    en: {
      role: 'big-data-engineer',
      weeks: '4',
      companies: ['bytedance', 'alibaba'],
      resume: 'Built a Flink + Kafka pipeline ingesting 500k events/sec into a Hudi lakehouse on S3. Implemented exactly-once with Kafka transactional producers + Flink checkpoints. Resolved a hot-partition incident on Kafka by re-keying on (user_id, region) and rebalancing online. Authored SQL on Spark/Presto for analyst self-service.',
    },
    zh: {
      role: 'big-data-engineer',
      weeks: '4',
      companies: ['bytedance', 'alibaba'],
      resume: '搭建 Flink + Kafka 流水线,峰值 50 万事件/秒,写入 S3 上的 Hudi 数据湖。基于 Kafka 事务生产者 + Flink checkpoint 实现 exactly-once。处理过一次 Kafka 热点分区事件,通过对 (user_id, region) 重新打 key 并在线再平衡解决。为分析师在 Spark/Presto 上写 SQL 自助查询能力。',
    },
  };

  function loadSample() {
    const s = SAMPLE[currentLanguage] || SAMPLE.en;
    if (roles.some((r) => r.id === s.role)) els.roleSelect.value = s.role;
    els.weeksSelect.value = s.weeks;
    Array.from(els.companiesSelect.options).forEach((o) => {
      o.selected = s.companies.includes(o.value);
    });
    els.resumeText.value = s.resume;
    // Open the resume details so the sample is visible.
    const details = els.resumeText.closest('details');
    if (details) details.open = true;
    generate();
  }

  function init() {
    applyLocalization();
    if (window.AwesomeTheme) window.AwesomeTheme.wire(els.themeSelect);
    if (els.languageSelect) {
      els.languageSelect.addEventListener('change', (e) => {
        currentLanguage = translations[e.target.value] ? e.target.value : 'en';
        localStorage.setItem('awesome-interview-language', currentLanguage);
        applyLocalization();
      });
    }
    els.generateBtn.addEventListener('click', generate);
    els.sampleBtn.addEventListener('click', loadSample);

    Promise.all([
      fetch('questions.json', { cache: 'no-cache' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('questions'))),
      fetch('roles.json', { cache: 'no-cache' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('roles'))),
      fetch('companies.json', { cache: 'no-cache' }).then((r) => r.ok ? r.json() : Promise.reject(new Error('companies'))),
    ]).then(([qj, rj, cj]) => {
      questions = qj.questions || [];
      roles = rj.roles || [];
      companies = cj.companies || [];
      populateRoleSelect();
      populateCompaniesSelect();
      restore();
      els.status.textContent = t('statusReady');
    }).catch((err) => {
      console.error(err);
      els.status.textContent = t('statusError');
    });
  }

  init();
})();
