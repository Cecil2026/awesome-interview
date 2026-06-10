(function () {
  "use strict";

  const REPO_BLOB_BASE = ""; // optionally set to "https://github.com/<owner>/<repo>/blob/main/"

  const els = {
    category: document.getElementById("category"),
    difficulty: document.getElementById("difficulty"),
    topic: document.getElementById("topic"),
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
    labelSource: document.getElementById('label-source'),
    optionAll: document.getElementById('option-all'),
    optionAny: document.getElementById('option-any'),
    optionEasy: document.getElementById('option-easy'),
    optionMedium: document.getElementById('option-medium'),
    optionHard: document.getElementById('option-hard'),
    navGitHub: document.getElementById('nav-github'),
    navKnowledge: document.getElementById('nav-knowledge'),
    navInterviews: document.getElementById('nav-interviews'),
    navMock: document.getElementById('nav-mock'),
    navBehavioral: document.getElementById('nav-behavioral'),
    navRoadmap: document.getElementById('nav-roadmap'),
    navBrowse: document.getElementById('nav-browse'),
    tagline: document.getElementById('tagline'),
    footerText: document.getElementById('footer-text'),
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
  };

  let questions = [];
  let lastQuestion = null;
  let currentLanguage = localStorage.getItem('awesome-interview-language') || 'en';

  function rerenderIfActive() {
    if (lastQuestion) render(lastQuestion);
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
      pickQuestion: 'Pick a question',
      sourceLabel: 'Source:',
      topicsPrefix: 'Topics:',
      statusLoaded: '{count} questions loaded across {categories} categories.',
      statusLoadError: 'Could not load questions.json — {message}. Run "python tools/build_index.py" to generate it.',
      statusNoMatch: 'No questions match those filters. Loosen them and try again.',
      statusPicked: 'Picked from {count} matching question{plural}.',
      footer: 'Powered by docs/questions.json — rebuilt on each push via .github/workflows/build-questions-json.yml.',
      pageTitle: 'Random Question Picker',
      languageSelectAria: 'Select language',
      themeSelectAria: 'Select theme',
      themeLight: 'Light',
      themeDark: 'Dark',
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
      pickQuestion: '抽取一道题',
      sourceLabel: '来源：',
      topicsPrefix: '主题：',
      statusLoaded: '已加载 {count} 道题，覆盖 {categories} 个类别。',
      statusLoadError: '无法加载 questions.json — {message}。请运行 "python tools/build_index.py" 生成它。',
      statusNoMatch: '没有题目符合这些筛选条件。放宽条件再试一次。',
      statusPicked: '从 {count} 道匹配题中抽取。',
      footer: '由 docs/questions.json 提供支持 — 每次推送后通过 .github/workflows/build-questions-json.yml 重新生成。',
      pageTitle: '随机题目选择器',
      languageSelectAria: '选择语言',
      themeSelectAria: '选择主题',
      themeLight: '浅色',
      themeDark: '深色',
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
    if (els.pick) els.pick.textContent = t('pickQuestion');
    if (els.labelSource) els.labelSource.textContent = t('sourceLabel');
    if (els.footerText) els.footerText.textContent = t('footer');
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
      els.pick.disabled = false;
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

  function filter() {
    const cat = els.category.value;
    const diff = els.difficulty.value;
    const topic = els.topic.value.trim().toLowerCase();
    return questions.filter((q) => {
      if (cat && q.category !== cat) return false;
      if (diff && q.difficulty !== diff) return false;
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

  if (els.languageSelect) {
    els.languageSelect.addEventListener('change', (event) => setLanguage(event.target.value));
  }
  if (window.AwesomeTheme) {
    window.AwesomeTheme.wire(els.themeSelect);
  }
  setLanguage(currentLanguage);
  els.pick.addEventListener("click", pick);
  document.addEventListener('click', (event) => {
    document.querySelectorAll('details.nav-menu[open]').forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
  load();
})();
