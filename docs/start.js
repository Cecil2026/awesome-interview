(function () {
  "use strict";

  const els = {
    tagline: document.getElementById('tagline'),
    hero: document.getElementById('intent-hero'),
    sourceLink: document.getElementById('source-link'),
    footer: document.getElementById('footer-text'),
    navStart: document.getElementById('nav-start'),
    navPicker: document.getElementById('nav-picker'),
    navReader: document.getElementById('nav-reader'),
    navCompare: document.getElementById('nav-compare'),
    navResume: document.getElementById('nav-resume'),
    navPlan: document.getElementById('nav-plan'),
    languageSelect: document.getElementById('language-select'),
    themeSelect: document.getElementById('theme-select'),
  };

  let currentLanguage = localStorage.getItem('awesome-interview-language') || 'en';

  const translations = {
    en: {
      pageTitle: 'Start',
      tagline: 'Pick the tool that matches your situation.',
      hero: "Tell us what you want to do — we'll point you at the right tool.",
      navStart: 'Start',
      navPicker: 'Picker',
      navReader: 'Reader',
      navCompare: 'Compare',
      navResume: 'Resume → Q',
      navPlan: 'Plan',
      sourceCode: 'Source code (AGPL-3.0)',
      footer: 'No analytics, no backend — everything runs in your browser or your terminal.',
      card1Title: 'I have N weeks until my interview',
      card1Desc: 'Generate a tailored multi-week study plan from your target company, role, and resume.',
      openLabel: 'Open Plan →',
      card1Cli: 'Or CLI: <code>python tools/daily_plan.py</code>',
      card2Title: 'Give me a question to drill',
      card2Desc: 'Pull a random question from the bank, filtered by category, difficulty, and topic.',
      openLabel2: 'Open Picker →',
      card2Cli: 'Or CLI: <code>python tools/random_pick.py knowledge/</code>',
      card3Title: "I'm prepping for a specific company",
      card3Desc: "Compare interview loops side-by-side, then deep-read the company's question bank.",
      openLabel3: 'Open Compare →',
      card3Cli: 'Or browse <code>interviews/companies/</code>',
      card4Title: 'Study a topic deeply',
      card4Desc: 'Read topic-organized Q&A banks on algorithms, AI, frontend, backend, architecture, DevOps.',
      openLabel4: 'Open Reader →',
      card4Cli: 'Or browse <code>knowledge/</code>',
      card5Title: 'Tailor questions to my resume',
      card5Desc: 'Paste a project description; get follow-up questions tuned to your stack.',
      openLabel5: 'Open Resume → Q →',
      card6Title: 'Track my streak / spaced repetition',
      card6Desc: 'Timer, daily plan, streak tracker, SM-2 review scheduler — all stdlib Python scripts.',
      openLabel6: 'CLI reference →',
      card6Cli: 'e.g. <code>python tools/streak.py done</code>',
      extrasHeading: 'All modules (browse the raw repo)',
      extraKnowledge: 'knowledge/',
      extraKnowledgeDesc: '— topic Q&A banks',
      extraInterviews: 'interviews/companies/',
      extraInterviewsDesc: '— per-company banks',
      extraMock: 'mock-interviews/',
      extraMockDesc: '— full transcripts',
      extraRoadmap: 'roadmap/',
      extraRoadmapDesc: '— 8-10 week plans',
      extraBehavioral: 'behavioral/',
      extraBehavioralDesc: '— STAR + LP',
      extraTools: 'tools/',
      extraToolsDesc: '— CLI scripts',
      extraReadme: 'README',
      extraReadmeDesc: '— project overview',
    },
    zh: {
      pageTitle: '开始',
      tagline: '选择最匹配你当前情况的工具。',
      hero: '告诉我你现在要做什么 —— 我帮你指到合适的工具。',
      navStart: '开始',
      navPicker: '选题',
      navReader: '阅读',
      navCompare: '对比',
      navResume: '简历 → 题',
      navPlan: '计划',
      sourceCode: '源代码（AGPL-3.0）',
      footer: '无统计、无后端 —— 一切在你的浏览器或终端里运行。',
      card1Title: '我还有 N 周准备面试',
      card1Desc: '根据目标公司、岗位与简历生成多周备考计划。',
      openLabel: '打开 计划 →',
      card1Cli: '或用 CLI：<code>python tools/daily_plan.py</code>',
      card2Title: '随便给我一道题练',
      card2Desc: '按类别、难度、主题筛选后从题库随机抽题。',
      openLabel2: '打开 选题 →',
      card2Cli: '或用 CLI：<code>python tools/random_pick.py knowledge/</code>',
      card3Title: '我在准备某家公司',
      card3Desc: '并排对比公司面试流程，再深入读该公司的题库。',
      openLabel3: '打开 对比 →',
      card3Cli: '或浏览 <code>interviews/companies/</code>',
      card4Title: '我想深入学某个主题',
      card4Desc: '按主题阅读算法、AI、前端、后端、架构、DevOps 题库。',
      openLabel4: '打开 阅读 →',
      card4Cli: '或浏览 <code>knowledge/</code>',
      card5Title: '基于简历定制面试题',
      card5Desc: '粘贴一段项目经历，得到针对你技术栈的追问。',
      openLabel5: '打开 简历 → 题 →',
      card6Title: '记录打卡 / 间隔复习',
      card6Desc: '计时器、每日计划、连续打卡、SM-2 复习排程 —— 全是 stdlib Python 脚本。',
      openLabel6: 'CLI 参考 →',
      card6Cli: '例如 <code>python tools/streak.py done</code>',
      extrasHeading: '全部模块（浏览原始仓库）',
      extraKnowledge: 'knowledge/',
      extraKnowledgeDesc: '— 主题题库',
      extraInterviews: 'interviews/companies/',
      extraInterviewsDesc: '— 公司题库',
      extraMock: 'mock-interviews/',
      extraMockDesc: '— 完整模拟脚本',
      extraRoadmap: 'roadmap/',
      extraRoadmapDesc: '— 8-10 周计划',
      extraBehavioral: 'behavioral/',
      extraBehavioralDesc: '— STAR + LP',
      extraTools: 'tools/',
      extraToolsDesc: '— CLI 脚本',
      extraReadme: 'README',
      extraReadmeDesc: '— 项目概览',
    },
  };

  function t(key) {
    return (translations[currentLanguage] && translations[currentLanguage][key])
      || translations.en[key]
      || key;
  }

  function applyLocalization() {
    document.documentElement.lang = currentLanguage;
    if (els.languageSelect) els.languageSelect.value = currentLanguage;
    document.title = `awesome-interview · ${t('pageTitle')}`;
    if (els.tagline) els.tagline.textContent = t('tagline');
    if (els.hero) els.hero.textContent = t('hero');
    if (els.footer) els.footer.textContent = t('footer');
    if (els.sourceLink) els.sourceLink.textContent = t('sourceCode');
    if (els.navStart) els.navStart.textContent = t('navStart');
    if (els.navPicker) els.navPicker.textContent = t('navPicker');
    if (els.navReader) els.navReader.textContent = t('navReader');
    if (els.navCompare) els.navCompare.textContent = t('navCompare');
    if (els.navResume) els.navResume.textContent = t('navResume');
    if (els.navPlan) els.navPlan.textContent = t('navPlan');
    // i18n-marked text in the card bodies — some use HTML (cli hints), others textContent.
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const v = translations[currentLanguage] && translations[currentLanguage][key];
      if (v == null) return;
      if (v.indexOf('<') !== -1) el.innerHTML = v; else el.textContent = v;
    });
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
  }

  init();
})();
