(function () {
  "use strict";

  const REPO_BLOB_BASE = ""; // optionally set to "https://github.com/<owner>/<repo>/blob/main/"

  const els = {
    category: document.getElementById("category"),
    difficulty: document.getElementById("difficulty"),
    topic: document.getElementById("topic"),
    topicSelect: document.getElementById("topic-select"),
    pick: document.getElementById("pick"),
    result: document.getElementById("result"),
    rCategory: document.getElementById("r-category"),
    rDifficulty: document.getElementById("r-difficulty"),
    rTitle: document.getElementById("r-title"),
    rTopics: document.getElementById("r-topics"),
    rSource: document.getElementById("r-source"),
    status: document.getElementById("status"),
    languageSelect: document.getElementById('language-select'),
    themeSelect: document.getElementById('theme-select'),
    labelCategory: document.getElementById('label-category'),
    labelDifficulty: document.getElementById('label-difficulty'),
    labelTopic: document.getElementById('label-topic'),
    labelTopicSelect: document.getElementById('label-topic-select'),
    labelSource: document.getElementById('label-source'),
    optionAll: document.getElementById('option-all'),
    optionAny: document.getElementById('option-any'),
    optionEasy: document.getElementById('option-easy'),
    optionMedium: document.getElementById('option-medium'),
    optionHard: document.getElementById('option-hard'),
    navGitHub: document.getElementById('nav-github'),
    navPicker: document.getElementById('nav-picker'),
    navReader: document.getElementById('nav-reader'),
    navKnowledge: document.getElementById('nav-knowledge'),
    navInterviews: document.getElementById('nav-interviews'),
    navMock: document.getElementById('nav-mock'),
    navBehavioral: document.getElementById('nav-behavioral'),
    navRoadmap: document.getElementById('nav-roadmap'),
    navBrowse: document.getElementById('nav-browse'),
    navCompare: document.getElementById('nav-compare'),
    navResume: document.getElementById('nav-resume'),
    tagline: document.getElementById('tagline'),
    footerText: document.getElementById('footer-text'),
    sourceLink: document.getElementById('source-link'),
    sectionsHeading: document.getElementById('sections-heading'),
    cardKnowledgeTitle: document.getElementById('card-knowledge-title'),
    cardKnowledgeDesc: document.getElementById('card-knowledge-desc'),
    cardInterviewsTitle: document.getElementById('card-interviews-title'),
    cardInterviewsDesc: document.getElementById('card-interviews-desc'),
    cardMockTitle: document.getElementById('card-mock-title'),
    cardMockDesc: document.getElementById('card-mock-desc'),
    cardBehavioralTitle: document.getElementById('card-behavioral-title'),
    cardBehavioralDesc: document.getElementById('card-behavioral-desc'),
    cardRoadmapTitle: document.getElementById('card-roadmap-title'),
    cardRoadmapDesc: document.getElementById('card-roadmap-desc'),
    cardReadmeTitle: document.getElementById('card-readme-title'),
    cardReadmeDesc: document.getElementById('card-readme-desc'),
    dashboard: document.getElementById('dashboard'),
    statTotal: document.getElementById('stat-total'),
    statSolved: document.getElementById('stat-solved'),
    statStreak: document.getElementById('stat-streak'),
    statProgressFill: document.getElementById('stat-progress-fill'),
    statTotalLabel: document.getElementById('stat-total-label'),
    statSolvedLabel: document.getElementById('stat-solved-label'),
    statStreakLabel: document.getElementById('stat-streak-label'),
    statProgressLabel: document.getElementById('stat-progress-label'),
    browse: document.getElementById('browse'),
    browseHeading: document.getElementById('browse-heading'),
    hideSolved: document.getElementById('hide-solved'),
    hideSolvedLabel: document.getElementById('hide-solved-label'),
    browseCount: document.getElementById('browse-count'),
    cardGrid: document.getElementById('card-grid'),
    loadMore: document.getElementById('load-more'),
    palette: document.getElementById('palette'),
    paletteInput: document.getElementById('palette-input'),
    paletteResults: document.getElementById('palette-results'),
    paletteHint: document.getElementById('palette-hint'),
  };

  let questions = [];
  let lastQuestion = null;
  let currentLanguage = localStorage.getItem('awesome-interview-language') || 'en';

  function rerenderIfActive() {
    if (lastQuestion) render(lastQuestion);
    if (typeof renderGrid === 'function' && questions.length) renderGrid();
  }

  const translations = {
    en: {
      tagline: 'Pick a random question from the bank and start drilling.',
      github: 'README',
      knowledge: 'Knowledge',
      interviews: 'Interviews',
      mock: 'Mock interviews',
      behavioral: 'Behavioral',
      roadmap: 'Roadmap',
      browse: 'Browse',
      picker: 'Picker',
      readerNav: 'Reader',
      compare: 'Compare',
      resume: 'Resume → Q',
      sectionsHeading: 'Explore',
      cardKnowledgeDesc: 'Topic-organized Q&A banks',
      cardInterviewsDesc: 'Real company question banks',
      cardMockDesc: 'Full transcript-style sessions',
      cardBehavioralDesc: 'STAR questions & principles',
      cardRoadmapDesc: 'Week-by-week study plans',
      cardReadmeDesc: 'Project overview & usage',
      category: 'Category',
      all: 'All',
      difficulty: 'Difficulty',
      any: 'Any',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      topicContains: 'Topic contains',
      topicPlaceholder: 'e.g. graph, caching, conflict',
      topicLabel: 'Topic',
      topicAll: 'All',
      pickQuestion: 'Pick a question',
      sourceLabel: 'Source:',
      topicsPrefix: 'Topics:',
      statusLoaded: '{count} questions loaded across {categories} categories.',
      statusLoadError: 'Could not load questions.json — {message}. Run "python tools/build_index.py" to generate it.',
      statusNoMatch: 'No questions match those filters. Loosen them and try again.',
      statusPicked: 'Picked from {count} matching question{plural}.',
      footer: 'Powered by docs/questions.json — rebuilt on each push via .github/workflows/build-questions-json.yml.',
      sourceCode: 'Source code (AGPL-3.0)',
      pageTitle: 'Random Question Picker',
      languageSelectAria: 'Select language',
      themeSelectAria: 'Select theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      statTotal: 'Questions',
      statSolved: 'Solved',
      statStreak: 'Day streak',
      statProgress: '{pct}% complete',
      browseHeading: 'Browse questions',
      hideSolved: 'Hide solved',
      browseCount: '{shown} of {total}',
      loadMore: 'Show more',
      palettePlaceholder: 'Jump to a question…',
      paletteHint: '↑↓ navigate · Enter open · Esc close',
      paletteEmpty: 'No matching questions.',
      markSolved: 'Mark as solved',
    },
    zh: {
      tagline: '从题库中随机抽题，开始练习。',
      github: '项目说明',
      knowledge: '知识库',
      interviews: '面试题',
      mock: '模拟面试',
      behavioral: '行为面试',
      roadmap: '路线图',
      browse: '浏览',
      picker: '选题',
      readerNav: '阅读',
      compare: '对比',
      resume: '简历 → 题',
      sectionsHeading: '探索板块',
      cardKnowledgeDesc: '按主题组织的问答题库',
      cardInterviewsDesc: '真实公司面试题库',
      cardMockDesc: '完整对话脚本式模拟',
      cardBehavioralDesc: 'STAR 题目与领导力准则',
      cardRoadmapDesc: '逐周学习计划',
      cardReadmeDesc: '项目概览与使用说明',
      category: '类别',
      all: '全部',
      difficulty: '难度',
      any: '不限',
      easy: '简单',
      medium: '中等',
      hard: '困难',
      topicContains: '主题包含',
      topicPlaceholder: '例如 graph、caching、conflict',
      topicLabel: '主题',
      topicAll: '全部',
      pickQuestion: '抽取一道题',
      sourceLabel: '来源：',
      topicsPrefix: '主题：',
      statusLoaded: '已加载 {count} 道题，覆盖 {categories} 个类别。',
      statusLoadError: '无法加载 questions.json — {message}。请运行 "python tools/build_index.py" 生成它。',
      statusNoMatch: '没有题目符合这些筛选条件。放宽条件再试一次。',
      statusPicked: '从 {count} 道匹配题中抽取。',
      footer: '由 docs/questions.json 提供支持 — 每次推送后通过 .github/workflows/build-questions-json.yml 重新生成。',
      sourceCode: '源代码（AGPL-3.0）',
      pageTitle: '随机题目选择器',
      languageSelectAria: '选择语言',
      themeSelectAria: '选择主题',
      themeLight: '浅色',
      themeDark: '深色',
      statTotal: '题目总数',
      statSolved: '已完成',
      statStreak: '连续天数',
      statProgress: '完成 {pct}%',
      browseHeading: '浏览题目',
      hideSolved: '隐藏已完成',
      browseCount: '{total} 道中的 {shown} 道',
      loadMore: '显示更多',
      palettePlaceholder: '跳转到某道题……',
      paletteHint: '↑↓ 导航 · Enter 打开 · Esc 关闭',
      paletteEmpty: '没有匹配的题目。',
      markSolved: '标记为已完成',
    },
  };

  function t(key, params = {}) {
    const template = translations[currentLanguage][key] || translations.en[key] || key;
    return Object.entries(params).reduce((value, [name, param]) => value.replace(`{${name}}`, param), template);
  }

  function applyLocalization() {
    document.documentElement.lang = currentLanguage;
    if (els.languageSelect) els.languageSelect.value = currentLanguage;
    if (els.tagline) els.tagline.textContent = t('tagline');
    if (els.navGitHub) els.navGitHub.textContent = t('github');
    if (els.navKnowledge) els.navKnowledge.textContent = t('knowledge');
    if (els.navInterviews) els.navInterviews.textContent = t('interviews');
    if (els.navMock) els.navMock.textContent = t('mock');
    if (els.navBehavioral) els.navBehavioral.textContent = t('behavioral');
    if (els.navRoadmap) els.navRoadmap.textContent = t('roadmap');
    if (els.navBrowse) els.navBrowse.textContent = t('browse');
    if (els.navPicker) els.navPicker.textContent = t('picker');
    if (els.navReader) els.navReader.textContent = t('readerNav');
    if (els.navCompare) els.navCompare.textContent = t('compare');
    if (els.navResume) els.navResume.textContent = t('resume');
    if (els.sectionsHeading) els.sectionsHeading.textContent = t('sectionsHeading');
    if (els.cardKnowledgeTitle) els.cardKnowledgeTitle.textContent = t('knowledge');
    if (els.cardKnowledgeDesc) els.cardKnowledgeDesc.textContent = t('cardKnowledgeDesc');
    if (els.cardInterviewsTitle) els.cardInterviewsTitle.textContent = t('interviews');
    if (els.cardInterviewsDesc) els.cardInterviewsDesc.textContent = t('cardInterviewsDesc');
    if (els.cardMockTitle) els.cardMockTitle.textContent = t('mock');
    if (els.cardMockDesc) els.cardMockDesc.textContent = t('cardMockDesc');
    if (els.cardBehavioralTitle) els.cardBehavioralTitle.textContent = t('behavioral');
    if (els.cardBehavioralDesc) els.cardBehavioralDesc.textContent = t('cardBehavioralDesc');
    if (els.cardRoadmapTitle) els.cardRoadmapTitle.textContent = t('roadmap');
    if (els.cardRoadmapDesc) els.cardRoadmapDesc.textContent = t('cardRoadmapDesc');
    if (els.cardReadmeTitle) els.cardReadmeTitle.textContent = t('github');
    if (els.cardReadmeDesc) els.cardReadmeDesc.textContent = t('cardReadmeDesc');
    if (els.languageSelect) els.languageSelect.setAttribute('aria-label', t('languageSelectAria'));
    if (els.themeSelect) {
      els.themeSelect.setAttribute('aria-label', t('themeSelectAria'));
      const options = els.themeSelect.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].value === 'light') options[i].textContent = t('themeLight');
        if (options[i].value === 'dark') options[i].textContent = t('themeDark');
      }
    }
    if (els.labelCategory) els.labelCategory.textContent = t('category');
    if (els.optionAll) els.optionAll.textContent = t('all');
    if (els.labelDifficulty) els.labelDifficulty.textContent = t('difficulty');
    if (els.optionAny) els.optionAny.textContent = t('any');
    if (els.optionEasy) els.optionEasy.textContent = t('easy');
    if (els.optionMedium) els.optionMedium.textContent = t('medium');
    if (els.optionHard) els.optionHard.textContent = t('hard');
    if (els.labelTopic) els.labelTopic.textContent = t('topicContains');
    if (els.topic) els.topic.placeholder = t('topicPlaceholder');
    if (els.labelTopicSelect) els.labelTopicSelect.textContent = t('topicLabel');
    if (els.topicSelect && els.topicSelect.options[0]) els.topicSelect.options[0].textContent = t('topicAll');
    if (els.pick) els.pick.textContent = t('pickQuestion');
    if (els.labelSource) els.labelSource.textContent = t('sourceLabel');
    if (els.footerText) els.footerText.textContent = t('footer');
    if (els.sourceLink) els.sourceLink.textContent = t('sourceCode');
    if (els.statTotalLabel) els.statTotalLabel.textContent = t('statTotal');
    if (els.statSolvedLabel) els.statSolvedLabel.textContent = t('statSolved');
    if (els.statStreakLabel) els.statStreakLabel.textContent = t('statStreak');
    if (els.browseHeading) els.browseHeading.textContent = t('browseHeading');
    if (els.hideSolvedLabel) els.hideSolvedLabel.textContent = t('hideSolved');
    if (els.loadMore) els.loadMore.textContent = t('loadMore');
    if (els.paletteInput) els.paletteInput.placeholder = t('palettePlaceholder');
    if (els.paletteHint) els.paletteHint.textContent = t('paletteHint');
    document.title = `awesome-interview · ${t('pageTitle')}`;
  }

  function setLanguage(lang) {
    currentLanguage = translations[lang] ? lang : 'en';
    localStorage.setItem('awesome-interview-language', currentLanguage);
    applyLocalization();
    rerenderIfActive();
  }

  async function load() {
    try {
      const resp = await fetch("questions.json", { cache: "no-cache" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      questions = data.questions || [];
      els.status.textContent = t('statusLoaded', { count: data.total, categories: data.categories.length });
      populateCategories(data.categories || []);
      populateTopics();
      els.pick.disabled = false;
      renderDashboard();
      resetGrid();
    } catch (err) {
      els.status.textContent = t('statusLoadError', { message: err.message });
      els.pick.disabled = true;
    }
  }

  function populateCategories(cats) {
    for (const c of cats) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      els.category.appendChild(opt);
    }
  }

  function populateTopics() {
    if (!els.topicSelect) return;
    const counts = new Map();
    for (const q of questions) {
      for (const tp of q.topics || []) {
        const key = tp.trim();
        if (!key || /[*<>]/.test(key)) continue;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    for (const [topic, count] of sorted) {
      const opt = document.createElement("option");
      opt.value = topic;
      opt.textContent = `${topic} (${count})`;
      els.topicSelect.appendChild(opt);
    }
  }

  function filter() {
    const cat = els.category.value;
    const diff = els.difficulty.value;
    const topicExact = els.topicSelect ? els.topicSelect.value : "";
    const topic = els.topic ? els.topic.value.trim().toLowerCase() : "";
    return questions.filter((q) => {
      if (cat && q.category !== cat) return false;
      if (diff && q.difficulty !== diff) return false;
      if (topicExact && !(q.topics || []).includes(topicExact)) return false;
      if (topic) {
        const titleText = (q.title || "") + " " + (q.title_zh || "");
        const hay = (q.topics || []).join(",").toLowerCase() + " " + titleText.toLowerCase();
        if (!hay.includes(topic)) return false;
      }
      return true;
    });
  }

  function pick() {
    const pool = filter();
    if (pool.length === 0) {
      els.status.textContent = t('statusNoMatch');
      els.result.classList.add("hidden");
      return;
    }
    const q = pool[Math.floor(Math.random() * pool.length)];
    lastQuestion = q;
    render(q);
    const plural = pool.length === 1 ? '' : 's';
    els.status.textContent = t('statusPicked', { count: pool.length, plural });
  }

  function render(q) {
    const useZh = currentLanguage === 'zh';
    els.rTitle.textContent = useZh && q.title_zh ? q.title_zh : q.title;
    els.rCategory.textContent = q.category;
    if (q.difficulty) {
      const difficultyKey = q.difficulty.toLowerCase();
      els.rDifficulty.textContent = t(difficultyKey) || q.difficulty;
      els.rDifficulty.className = "badge " + difficultyKey;
      els.rDifficulty.style.display = "";
    } else {
      els.rDifficulty.style.display = "none";
    }
    els.rTopics.textContent = (q.topics || []).length ? `${t('topicsPrefix')} ${q.topics.join(', ')}` : "";
    const sourceFile = useZh && q.file_zh ? q.file_zh : q.file;
    const href = REPO_BLOB_BASE
      ? `${REPO_BLOB_BASE}${sourceFile}#L${q.line}`
      : `reader.html?file=${encodeURIComponent(q.file)}&n=${q.number}`;
    els.rSource.href = href;
    els.rSource.textContent = `${sourceFile}:${q.line}`;
    els.result.classList.remove("hidden");
    els.result.dataset.questionId = q.id;
  }

  // --- Progress tracking (localStorage) ---
  const SOLVED_KEY = 'awesome-interview-solved';
  const STREAK_KEY = 'awesome-interview-web-streak';

  function loadSolved() {
    try {
      return new Set(JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  let solved = loadSolved();

  function saveSolved() {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...solved]));
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function recordActivity() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
    } catch {
      data = {};
    }
    const today = todayStr();
    if (data.last === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    data.count = data.last === yesterday ? (data.count || 0) + 1 : 1;
    data.last = today;
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  }

  function currentStreak() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
    } catch {
      return 0;
    }
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (data.last === today || data.last === yesterday) return data.count || 0;
    return 0;
  }

  function toggleSolved(id) {
    if (solved.has(id)) {
      solved.delete(id);
    } else {
      solved.add(id);
      recordActivity();
    }
    saveSolved();
    renderDashboard();
    renderGrid();
  }

  function renderDashboard() {
    if (!els.dashboard) return;
    const total = questions.length;
    const done = questions.filter((q) => solved.has(q.id)).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    els.statTotal.textContent = total;
    els.statSolved.textContent = done;
    els.statStreak.textContent = currentStreak();
    els.statProgressFill.style.width = `${pct}%`;
    els.statProgressLabel.textContent = t('statProgress', { pct });
    els.dashboard.classList.remove('hidden');
  }

  // --- Browsable question card grid ---
  const PAGE_SIZE = 24;
  let gridShown = PAGE_SIZE;

  function localizedTitle(q) {
    return currentLanguage === 'zh' && q.title_zh ? q.title_zh : q.title;
  }

  function questionHref(q) {
    return `reader.html?file=${encodeURIComponent(q.file)}&n=${q.number}`;
  }

  function gridPool() {
    const pool = filter();
    if (els.hideSolved && els.hideSolved.checked) {
      return pool.filter((q) => !solved.has(q.id));
    }
    return pool;
  }

  function renderGrid() {
    if (!els.cardGrid) return;
    const pool = gridPool();
    els.browse.classList.remove('hidden');
    els.cardGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    pool.slice(0, gridShown).forEach((q) => {
      const card = document.createElement('a');
      const diff = (q.difficulty || '').toLowerCase();
      card.className = 'q-card' + (diff ? ` diff-${diff}` : '') + (solved.has(q.id) ? ' solved' : '');
      card.href = questionHref(q);

      const meta = document.createElement('div');
      meta.className = 'q-card-meta';
      const cat = document.createElement('span');
      cat.className = 'q-card-cat';
      cat.textContent = q.category;
      meta.appendChild(cat);
      if (q.difficulty) {
        const badge = document.createElement('span');
        badge.className = `badge dot ${diff}`;
        badge.textContent = t(diff) || q.difficulty;
        meta.appendChild(badge);
      }

      const title = document.createElement('div');
      title.className = 'q-card-title';
      title.textContent = `${q.number}. ${localizedTitle(q)}`;

      const solve = document.createElement('button');
      solve.type = 'button';
      solve.className = 'q-card-solve';
      solve.textContent = '✓';
      solve.title = t('markSolved');
      solve.setAttribute('aria-label', t('markSolved'));
      solve.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSolved(q.id);
      });

      card.appendChild(meta);
      card.appendChild(title);
      if ((q.topics || []).length) {
        const topics = document.createElement('div');
        topics.className = 'q-card-topics';
        topics.textContent = q.topics.slice(0, 4).join(' · ');
        card.appendChild(topics);
      }
      card.appendChild(solve);
      frag.appendChild(card);
    });
    els.cardGrid.appendChild(frag);
    if (els.browseCount) {
      els.browseCount.textContent = t('browseCount', { shown: Math.min(gridShown, pool.length), total: pool.length });
    }
    if (els.loadMore) {
      els.loadMore.classList.toggle('hidden', gridShown >= pool.length);
    }
  }

  function resetGrid() {
    gridShown = PAGE_SIZE;
    renderGrid();
  }

  // --- Command palette (Ctrl/Cmd+K) ---
  let paletteItems = [];
  let paletteActive = 0;

  function openPalette() {
    if (!els.palette) return;
    els.palette.classList.remove('hidden');
    els.paletteInput.value = '';
    renderPalette('');
    els.paletteInput.focus();
  }

  function closePalette() {
    if (els.palette) els.palette.classList.add('hidden');
  }

  function renderPalette(term) {
    const q = term.trim().toLowerCase();
    paletteItems = (q
      ? questions.filter((x) => {
          const hay = `${x.number} ${x.title} ${x.title_zh || ''} ${(x.topics || []).join(' ')} ${x.category}`.toLowerCase();
          return hay.includes(q);
        })
      : questions
    ).slice(0, 50);
    paletteActive = 0;
    els.paletteResults.innerHTML = '';
    if (!paletteItems.length) {
      const li = document.createElement('li');
      li.textContent = t('paletteEmpty');
      li.classList.add('empty');
      els.paletteResults.appendChild(li);
      return;
    }
    paletteItems.forEach((item, i) => {
      const li = document.createElement('li');
      if (i === 0) li.classList.add('active');
      const cat = document.createElement('span');
      cat.className = 'pr-cat';
      cat.textContent = item.category;
      const title = document.createElement('span');
      title.className = 'pr-title';
      title.textContent = `${item.number}. ${localizedTitle(item)}`;
      li.appendChild(cat);
      li.appendChild(title);
      li.addEventListener('click', () => {
        window.location.href = questionHref(item);
      });
      li.addEventListener('mousemove', () => setPaletteActive(i));
      els.paletteResults.appendChild(li);
    });
  }

  function setPaletteActive(i) {
    const lis = els.paletteResults.querySelectorAll('li');
    if (!lis.length) return;
    paletteActive = (i + lis.length) % lis.length;
    lis.forEach((li, idx) => li.classList.toggle('active', idx === paletteActive));
    lis[paletteActive].scrollIntoView({ block: 'nearest' });
  }

  function wireFilters() {
    [els.category, els.difficulty, els.topicSelect].forEach((el) => {
      if (el) el.addEventListener('change', resetGrid);
    });
    if (els.topic) els.topic.addEventListener('input', resetGrid);
    if (els.hideSolved) els.hideSolved.addEventListener('change', resetGrid);
    if (els.loadMore) {
      els.loadMore.addEventListener('click', () => {
        gridShown += PAGE_SIZE;
        renderGrid();
      });
    }
    if (els.palette) {
      els.paletteInput.addEventListener('input', (e) => renderPalette(e.target.value));
      els.paletteInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setPaletteActive(paletteActive + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setPaletteActive(paletteActive - 1); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          const item = paletteItems[paletteActive];
          if (item) window.location.href = questionHref(item);
        } else if (e.key === 'Escape') {
          closePalette();
        }
      });
      els.palette.addEventListener('click', (e) => {
        if (e.target === els.palette) closePalette();
      });
    }
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (els.palette.classList.contains('hidden')) openPalette();
        else closePalette();
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });
  }

  if (els.languageSelect) {
    els.languageSelect.addEventListener('change', (event) => setLanguage(event.target.value));
  }
  if (window.AwesomeTheme) {
    window.AwesomeTheme.wire(els.themeSelect);
  }
  setLanguage(currentLanguage);
  els.pick.addEventListener("click", pick);
  wireFilters();
  document.addEventListener('click', (event) => {
    document.querySelectorAll('details.nav-menu[open]').forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
  load();
})();
