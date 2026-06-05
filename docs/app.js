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
    navRoadmap: document.getElementById('nav-roadmap'),
    tagline: document.getElementById('tagline'),
    footerText: document.getElementById('footer-text'),
  };

  let questions = [];
  let currentLanguage = localStorage.getItem('awesome-interview-language') || 'en';

  const translations = {
    en: {
      tagline: 'Pick a random question from the bank and start drilling.',
      github: 'GitHub',
      knowledge: 'Knowledge',
      interviews: 'Interviews',
      roadmap: 'Roadmap',
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
    },
    zh: {
      tagline: '从题库中随机抽题，开始练习。',
      github: 'GitHub',
      knowledge: '知识库',
      interviews: '面试题',
      roadmap: '路线图',
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
    if (els.navRoadmap) els.navRoadmap.textContent = t('roadmap');
    if (els.languageSelect) els.languageSelect.setAttribute('aria-label', t('languageSelectAria'));
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
        const hay = (q.topics || []).join(",").toLowerCase() + " " + q.title.toLowerCase();
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
    render(q);
    const plural = pool.length === 1 ? '' : 's';
    els.status.textContent = t('statusPicked', { count: pool.length, plural });
  }

  function render(q) {
    els.rTitle.textContent = q.title;
    els.rCategory.textContent = q.category;
    if (q.difficulty) {
      els.rDifficulty.textContent = q.difficulty;
      els.rDifficulty.className = "badge " + q.difficulty.toLowerCase();
      els.rDifficulty.style.display = "";
    } else {
      els.rDifficulty.style.display = "none";
    }
    els.rTopics.textContent = (q.topics || []).length ? `${t('topicsPrefix')} ${q.topics.join(', ')}` : "";
    const href = REPO_BLOB_BASE ? `${REPO_BLOB_BASE}${q.file}#L${q.line}` : `../${q.file}#L${q.line}`;
    els.rSource.href = href;
    els.rSource.textContent = `${q.file}:${q.line}`;
    els.result.classList.remove("hidden");
  }

  if (els.languageSelect) {
    els.languageSelect.addEventListener('change', (event) => setLanguage(event.target.value));
  }
  setLanguage(currentLanguage);
  els.pick.addEventListener("click", pick);
  load();
})();
