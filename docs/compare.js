(function () {
  "use strict";

  const els = {
    status: document.getElementById('compare-status'),
    table: document.getElementById('compare-table'),
    body: document.getElementById('compare-body'),
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
    legendEasy: document.getElementById('legend-easy'),
    legendMedium: document.getElementById('legend-medium'),
    legendHard: document.getElementById('legend-hard'),
    colCompany: document.getElementById('col-company'),
    colRounds: document.getElementById('col-rounds'),
    colFocus: document.getElementById('col-focus'),
    colLangs: document.getElementById('col-langs'),
    colDuration: document.getElementById('col-duration'),
    colDiff: document.getElementById('col-diff'),
  };

  let currentLanguage = localStorage.getItem('awesome-interview-language') || 'en';

  const translations = {
    en: {
      tagline: 'Compare interview loops across companies side by side.',
      navStart: 'Start',
      navPicker: 'Picker',
      navReader: 'Reader',
      navCompare: 'Compare',
      navResume: 'Resume → Q',
      navPlan: 'Plan',
      easy: 'Easy', medium: 'Medium', hard: 'Hard',
      company: 'Company', rounds: 'Rounds', focus: 'Focus areas',
      langs: 'Languages', duration: 'Duration', diff: 'Difficulty mix',
      loading: 'Loading companies…',
      loaded: 'Comparing {count} companies.',
      loadError: 'Could not load company data — {message}.',
      footer: 'Built from the company question banks under interviews/companies/.',
      sourceCode: 'Source code (AGPL-3.0)',
      pageTitle: 'Company Comparison',
      questions: '{n} questions',
    },
    zh: {
      tagline: '并排对比各公司的面试流程。',
      navStart: '开始',
      navPicker: '选题',
      navReader: '阅读',
      navCompare: '对比',
      navResume: '简历 → 题',
      navPlan: '计划',
      easy: '简单', medium: '中等', hard: '困难',
      company: '公司', rounds: '面试轮次', focus: '重点方向',
      langs: '编程语言', duration: '时长', diff: '难度分布',
      loading: '正在加载公司数据……',
      loaded: '正在对比 {count} 家公司。',
      loadError: '无法加载公司数据 — {message}。',
      footer: '基于 interviews/companies/ 下的公司题库构建。',
      sourceCode: '源代码（AGPL-3.0）',
      pageTitle: '公司对比',
      questions: '{n} 道题',
    },
  };

  function t(key, params = {}) {
    let v = (translations[currentLanguage] && translations[currentLanguage][key]) || translations.en[key] || key;
    Object.entries(params).forEach(([k, val]) => { v = v.replace(`{${k}}`, val); });
    return v;
  }

  function applyLocalization() {
    document.documentElement.lang = currentLanguage;
    if (els.languageSelect) els.languageSelect.value = currentLanguage;
    els.tagline.textContent = t('tagline');
    if (els.navStart) els.navStart.textContent = t('navStart');
    els.navPicker.textContent = t('navPicker');
    els.navReader.textContent = t('navReader');
    if (els.navCompare) els.navCompare.textContent = t('navCompare');
    if (els.navResume) els.navResume.textContent = t('navResume');
    if (els.navPlan) els.navPlan.textContent = t('navPlan');
    els.legendEasy.textContent = t('easy');
    els.legendMedium.textContent = t('medium');
    els.legendHard.textContent = t('hard');
    els.colCompany.textContent = t('company');
    els.colRounds.textContent = t('rounds');
    els.colFocus.textContent = t('focus');
    els.colLangs.textContent = t('langs');
    els.colDuration.textContent = t('duration');
    els.colDiff.textContent = t('diff');
    if (els.sourceLink) els.sourceLink.textContent = t('sourceCode');
    document.title = `awesome-interview · ${t('pageTitle')}`;
  }

  function fetchText(url) {
    return fetch(url, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    });
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  }

  // Minimal parser for the leading ```yaml block of a company file.
  function parseYamlBlock(text) {
    const match = text.match(/```yaml\s*([\s\S]*?)```/);
    if (!match) return {};
    const lines = match[1].split('\n');
    const out = {};
    let listKey = null;
    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      if (!line.trim()) continue;
      const listItem = line.match(/^\s*-\s+(.*)$/);
      if (listItem && listKey) {
        out[listKey].push(listItem[1].trim());
        continue;
      }
      const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
      if (kv) {
        const key = kv[1];
        const val = kv[2].trim();
        if (val === '') {
          listKey = key;
          out[key] = [];
        } else {
          listKey = null;
          out[key] = val;
        }
      }
    }
    return out;
  }

  function difficultyCounts(questions, file) {
    const counts = { Easy: 0, Medium: 0, Hard: 0, total: 0 };
    questions.forEach((q) => {
      if (q.file !== file) return;
      counts.total++;
      if (counts[q.difficulty] !== undefined) counts[q.difficulty]++;
    });
    return counts;
  }

  function diffBar(counts) {
    const denom = (counts.Easy + counts.Medium + counts.Hard) || 1;
    const e = Math.round((counts.Easy / denom) * 100);
    const m = Math.round((counts.Medium / denom) * 100);
    const h = 100 - e - m;
    return `<div class="diff-bar" title="E ${counts.Easy} · M ${counts.Medium} · H ${counts.Hard}">`
      + `<span class="e" style="width:${e}%"></span>`
      + `<span class="m" style="width:${m}%"></span>`
      + `<span class="h" style="width:${h}%"></span></div>`
      + `<div class="compare-count">${t('questions', { n: counts.total })}</div>`;
  }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function readerLink(file) {
    return `reader.html?file=${encodeURIComponent(file)}`;
  }

  async function init() {
    applyLocalization();
    if (window.AwesomeTheme) window.AwesomeTheme.wire(els.themeSelect);
    if (els.languageSelect) {
      els.languageSelect.addEventListener('change', (e) => {
        currentLanguage = translations[e.target.value] ? e.target.value : 'en';
        localStorage.setItem('awesome-interview-language', currentLanguage);
        applyLocalization();
        if (rows.length) renderRows();
      });
    }

    let rows = [];

    try {
      const [mdData, qData] = await Promise.all([fetchJson('md_files.json'), fetchJson('questions.json')]);
      const companyFiles = (mdData.files || [])
        .map((f) => f.file)
        .filter((f) => f.startsWith('interviews/companies/') && !f.split('/').pop().startsWith('_'));

      const questions = qData.questions || [];

      const parsed = await Promise.all(companyFiles.map(async (file) => {
        try {
          const text = await fetchText(`/${file}`);
          return { file, yaml: parseYamlBlock(text), counts: difficultyCounts(questions, file) };
        } catch {
          return { file, yaml: {}, counts: difficultyCounts(questions, file) };
        }
      }));

      rows = parsed.sort((a, b) => b.counts.total - a.counts.total);

      window._renderRows = renderRows;
      renderRows();
      els.table.hidden = false;
      els.status.textContent = t('loaded', { count: rows.length });
    } catch (err) {
      els.status.textContent = t('loadError', { message: err.message });
    }

    function renderRows() {
      els.body.innerHTML = '';
      rows.forEach((row) => {
        const name = row.yaml.company || row.file.split('/').pop().replace('.md', '');
        const focus = Array.isArray(row.yaml.focus_areas) ? row.yaml.focus_areas.join(', ') : (row.yaml.focus_areas || '');
        const tr = document.createElement('tr');
        tr.innerHTML =
          `<td class="compare-company"><a href="${readerLink(row.file)}">${esc(name)}</a></td>`
          + `<td>${esc(row.yaml.typical_rounds || '—')}</td>`
          + `<td>${esc(focus || '—')}</td>`
          + `<td>${esc(row.yaml.languages_allowed || '—')}</td>`
          + `<td>${esc(row.yaml.duration || '—')}</td>`
          + `<td>${diffBar(row.counts)}</td>`;
        els.body.appendChild(tr);
      });
    }
  }

  init();
})();
