(function () {
  const statusEl = document.getElementById('status');
  const fileListEl = document.getElementById('file-list');
  const readerEl = document.getElementById('reader');
  const rawLink = document.getElementById('raw-link');
  const currentPathEl = document.getElementById('current-path');
  const searchEl = document.getElementById('search');
  const fileCountEl = document.getElementById('file-count');
  const tocListEl = document.getElementById('toc-list');
  const languageSelect = document.getElementById('language-select');
  const themeSelect = document.getElementById('theme-select');
  const fileLabelEl = document.getElementById('file-label');
  const introEl = document.querySelector('.intro');
  const readerTitleEl = document.getElementById('reader-title');
  const readerDescriptionEl = document.getElementById('reader-description');
  const navMarkdownEl = document.getElementById('nav-markdown');
  const navQuestionPickerEl = document.getElementById('nav-question-picker');
  const navReadmeEl = document.getElementById('nav-readme');
  const navKnowledgeEl = document.getElementById('nav-knowledge');
  const navInterviewsEl = document.getElementById('nav-interviews');
  const navMockEl = document.getElementById('nav-mock');
  const navBehavioralEl = document.getElementById('nav-behavioral');
  const navRoadmapEl = document.getElementById('nav-roadmap');
  const navBrowseEl = document.getElementById('nav-browse');

  let files = [];
  let activePath = '';
  let currentFileDir = '';
  let headingObserver = null;
  let pendingFragment = '';
  let currentLanguage = localStorage.getItem('awesome-interview-language') || 'en';

  const translations = {
    en: {
      navMarkdown: 'Markdown reader',
      navQuestionPicker: 'Question picker',
      navReadme: 'README',
      navKnowledge: 'Knowledge',
      navInterviews: 'Interviews',
      navMock: 'Mock interviews',
      navBehavioral: 'Behavioral',
      navRoadmap: 'Roadmap',
      navBrowse: 'Browse',
      intro: 'Reader for all markdown-based modules. Click a document on the left to render it here.',
      searchPlaceholder: 'Search by file, category, or keyword',
      fileLabel: 'Files:',
      openRawMarkdown: 'Open raw markdown',
      currentPathDefault: 'Select a file to read',
      chooseMarkdownTitle: 'Choose a markdown file',
      chooseMarkdownDescription: 'Use the left panel to browse the project’s markdown modules. This reader converts the Markdown into a clean, readable page so you can focus on content instead of source format.',
      tocEmpty: 'Pick a file to see the document outline.',
      statusLoadingFiles: 'Loading files…',
      statusNoFilesFound: 'No markdown files found.',
      statusFilesLoaded: '{count} files loaded.',
      statusLoadingPath: 'Loading {path}...',
      statusDisplayedPath: 'Displayed {path}',
      statusNoSearchMatches: 'No files match your search.',
      statusFilesShown: '{count} files shown.',
      statusLoadFailed: 'Failed to load file: {message}.',
      statusLoadJsonFailed: 'Could not load md_files.json — {message}. Run the local service from the repo root.',
      readerLoadFail: 'Failed to load file.',
      pageTitle: 'Markdown Reader',
      languageSelectAria: 'Select language',
      themeSelectAria: 'Select theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      translationFallback: 'Chinese translation not available for this file — showing the original.',
      translationShown: 'Showing Chinese translation ({path}).',
      copyCode: 'Copy',
      copiedCode: 'Copied',
      copyFailed: 'Copy failed',
    },
    zh: {
      navMarkdown: 'Markdown 阅读器',
      navQuestionPicker: '问题选择器',
      navReadme: '项目说明',
      navKnowledge: '知识库',
      navInterviews: '面试题',
      navMock: '模拟面试',
      navBehavioral: '行为面试',
      navRoadmap: '路线图',
      navBrowse: '浏览',
      intro: '阅读所有基于 Markdown 的模块。点击左侧文档即可在此呈现。',
      searchPlaceholder: '按文件、类别或关键词搜索',
      fileLabel: '文件数：',
      openRawMarkdown: '打开原始 Markdown',
      currentPathDefault: '请选择要阅读的文件',
      chooseMarkdownTitle: '选择一个 Markdown 文件',
      chooseMarkdownDescription: '使用左侧面板浏览项目中的 Markdown 模块。此阅读器会将 Markdown 转换为干净可读的页面，帮助你专注内容而不是源格式。',
      tocEmpty: '选择一个文件以查看文档大纲。',
      statusLoadingFiles: '正在加载文件……',
      statusNoFilesFound: '未找到 Markdown 文件。',
      statusFilesLoaded: '已加载 {count} 个文件。',
      statusLoadingPath: '正在加载 {path}…',
      statusDisplayedPath: '已显示 {path}',
      statusNoSearchMatches: '没有文件符合搜索条件。',
      statusFilesShown: '显示 {count} 个文件。',
      statusLoadFailed: '加载文件失败：{message}。',
      statusLoadJsonFailed: '无法加载 md_files.json — {message}。请从仓库根目录运行本地服务。',
      readerLoadFail: '无法加载文件。',
      pageTitle: 'Markdown 阅读器',
      languageSelectAria: '选择语言',
      themeSelectAria: '选择主题',
      themeLight: '浅色',
      themeDark: '深色',
      translationFallback: '该文件暂无中文翻译，已显示原文。',
      translationShown: '已显示中文翻译（{path}）。',
      copyCode: '复制',
      copiedCode: '已复制',
      copyFailed: '复制失败',
    },
  };

  function t(key, params = {}) {
    let value = translations[currentLanguage][key] || translations.en[key] || key;
    Object.entries(params).forEach(([name, param]) => {
      value = value.replace(`{${name}}`, param);
    });
    return value;
  }

  function setStatus(key, params = {}) {
    statusEl.textContent = t(key, params);
  }

  function updateLocalizedText() {
    if (navMarkdownEl) navMarkdownEl.textContent = t('navMarkdown');
    if (navQuestionPickerEl) navQuestionPickerEl.textContent = t('navQuestionPicker');
    if (navReadmeEl) navReadmeEl.textContent = t('navReadme');
    if (navKnowledgeEl) navKnowledgeEl.textContent = t('navKnowledge');
    if (navInterviewsEl) navInterviewsEl.textContent = t('navInterviews');
    if (navMockEl) navMockEl.textContent = t('navMock');
    if (navBehavioralEl) navBehavioralEl.textContent = t('navBehavioral');
    if (navRoadmapEl) navRoadmapEl.textContent = t('navRoadmap');
    if (navBrowseEl) navBrowseEl.textContent = t('navBrowse');
    document.title = `awesome-interview · ${t('pageTitle')}`;
    if (introEl) introEl.textContent = t('intro');
    searchEl.placeholder = t('searchPlaceholder');
    if (languageSelect) languageSelect.setAttribute('aria-label', t('languageSelectAria'));
    if (themeSelect) {
      themeSelect.setAttribute('aria-label', t('themeSelectAria'));
      const options = themeSelect.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].value === 'light') options[i].textContent = t('themeLight');
        if (options[i].value === 'dark') options[i].textContent = t('themeDark');
      }
    }
    fileLabelEl.textContent = t('fileLabel');
    rawLink.textContent = t('openRawMarkdown');
    currentPathEl.textContent = activePath || t('currentPathDefault');
    if (!activePath) {
      const titleEl = document.getElementById('reader-title');
      const descEl = document.getElementById('reader-description');
      if (titleEl) titleEl.textContent = t('chooseMarkdownTitle');
      if (descEl) descEl.textContent = t('chooseMarkdownDescription');
    }
    const tocEmpty = tocListEl.querySelector('.toc-empty');
    if (tocEmpty && tocListEl.children.length === 1) {
      tocEmpty.textContent = t('tocEmpty');
    }
  }

  function setLanguage(lang) {
    const next = translations[lang] ? lang : 'en';
    const changed = next !== currentLanguage;
    currentLanguage = next;
    localStorage.setItem('awesome-interview-language', currentLanguage);
    if (languageSelect) languageSelect.value = currentLanguage;
    document.documentElement.lang = currentLanguage;
    updateLocalizedText();
    if (changed && activePath) {
      loadFile(activePath);
    }
  }

  function findFileEntry(path) {
    return files.find((f) => f.file === path);
  }

  function resolveLocalizedPath(path) {
    if (currentLanguage === 'zh') {
      const entry = findFileEntry(path);
      if (entry && entry.translations && entry.translations.zh) {
        return { path: entry.translations.zh, fallback: false };
      }
      return { path, fallback: true };
    }
    return { path, fallback: false };
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      return r.json();
    });
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function resolveLink(href) {
    if (/^(?:https?:|mailto:|javascript:)/.test(href)) {
      return href;
    }
    if (href.startsWith('#')) {
      return href;
    }
    const baseDir = currentFileDir && currentFileDir !== '.' ? `/${currentFileDir}/` : '/';
    const url = new URL(href, `${window.location.origin}${baseDir}`);
    return url.pathname + url.hash;
  }

  function stripHtml(text) {
    return text.replace(/<[^>]+>/g, '');
  }

  function renderMarkdown(text) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escaped.split('\n');
    let html = '';
    let inCode = false;
    let codeLang = '';
    let paragraphOpen = false;
    let listOpen = false;
    let listType = '';
    const headings = [];

    function closeParagraph() {
      if (paragraphOpen) {
        html += '</p>';
        paragraphOpen = false;
      }
    }

    function closeList() {
      if (listOpen) {
        html += listType === 'ol' ? '</ol>' : '</ul>';
        listOpen = false;
        listType = '';
      }
    }

    function openParagraph() {
      if (!paragraphOpen) {
        html += '<p>';
        paragraphOpen = true;
      }
    }

    function flushCode() {
      if (inCode) {
        html += '</code></pre>';
        inCode = false;
      }
    }

    function inlineFormat(line) {
      return line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[(.+?)\]\((.+?)\)/g, (match, text, href) => {
          const resolved = resolveLink(href);
          const isExternal = /^(?:https?:|mailto:|javascript:)/.test(href);
          return isExternal
            ? `<a href="${resolved}" target="_blank" rel="noopener">${text}</a>`
            : `<a href="${resolved}">${text}</a>`;
        });
    }

    for (let raw of lines) {
      let line = raw;
      if (line.startsWith('```')) {
        if (inCode) {
          flushCode();
        } else {
          closeParagraph();
          closeList();
          inCode = true;
          codeLang = line.slice(3).trim();
          html += `<pre><code class="language-${codeLang}">`;
        }
        continue;
      }

      if (inCode) {
        html += line + '\n';
        continue;
      }

      if (/^#{1,6}\s+/.test(line)) {
        closeParagraph();
        closeList();
        const depth = line.match(/^#+/)[0].length;
        const content = inlineFormat(line.replace(/^#{1,6}\s+/, ''));
        const text = stripHtml(content);
        const id = slugify(text);
        html += `<h${depth} id="${id}">${content}</h${depth}>`;
        headings.push({ id, text, depth });
        continue;
      }

      if (/^>\s+/.test(line)) {
        closeParagraph();
        closeList();
        const content = inlineFormat(line.replace(/^>\s+/, ''));
        html += `<blockquote>${content}</blockquote>`;
        continue;
      }

      if (/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(line)) {
        closeParagraph();
        const currentType = /^\s*\d+\.\s+/.test(line) ? 'ol' : 'ul';
        if (!listOpen || listType !== currentType) {
          closeList();
          html += currentType === 'ol' ? '<ol>' : '<ul>';
          listOpen = true;
          listType = currentType;
        }
        const content = inlineFormat(line.replace(/^\s*(?:[-*+]\s+|\d+\.\s+)/, ''));
        html += `<li>${content}</li>`;
        continue;
      }

      if (/^---+$/.test(line.trim())) {
        closeParagraph();
        closeList();
        html += '<hr />';
        continue;
      }

      if (line.trim() === '') {
        closeParagraph();
        closeList();
        continue;
      }

      openParagraph();
      html += inlineFormat(line) + ' ';
    }

    flushCode();
    closeParagraph();
    closeList();
    return { html, headings };
  }

  function renderFileList(items) {
    const grouped = items.reduce((acc, file) => {
      if (!acc[file.category]) acc[file.category] = [];
      acc[file.category].push(file);
      return acc;
    }, {});

    fileListEl.innerHTML = '';

    Object.keys(grouped).sort().forEach((category) => {
      const section = document.createElement('details');
      section.className = 'category-group';
      section.open = true;

      const summary = document.createElement('summary');
      summary.className = 'category-heading';
      summary.textContent = `${category} (${grouped[category].length})`;
      section.appendChild(summary);

      grouped[category].forEach((file) => {
        const anchor = document.createElement('a');
        anchor.className = 'file-link';
        anchor.href = '#';
        anchor.textContent = file.file.replace(`${category}/`, '');
        anchor.dataset.path = file.file;
        anchor.addEventListener('click', (event) => {
          event.preventDefault();
          loadFile(file.file);
        });
        if (file.file === activePath) {
          anchor.classList.add('active');
        }
        section.appendChild(anchor);
      });

      fileListEl.appendChild(section);
    });
  }

  function renderToc(headings) {
    tocListEl.innerHTML = '';
    if (!headings.length) {
      tocListEl.innerHTML = `<p class="toc-empty">${t('tocEmpty')}</p>`;
      return;
    }

    headings.forEach(({ id, text, depth }) => {
      const anchor = document.createElement('a');
      anchor.className = `toc-item toc-depth-${depth}`;
      anchor.href = `#${id}`;
      anchor.textContent = text;
      anchor.addEventListener('click', (event) => {
        event.preventDefault();
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          updateTocActive(id);
        }
      });
      tocListEl.appendChild(anchor);
    });
  }

  function scrollToFragment(fragment) {
    const id = fragment.replace(/^#/, '');
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateTocActive(id);
    }
  }

  function updateTocActive(activeId) {
    document.querySelectorAll('.toc-item').forEach((item) => {
      item.classList.toggle('active', item.getAttribute('href') === `#${activeId}`);
    });
  }

  function observeHeadings() {
    if (headingObserver) {
      headingObserver.disconnect();
    }

    const headingElements = Array.from(readerEl.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));
    if (!headingElements.length) {
      return;
    }

    headingObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) {
          return;
        }
        const topHeading = visible.reduce((closest, entry) => {
          return entry.boundingClientRect.top < closest.boundingClientRect.top ? entry : closest;
        }, visible[0]);
        updateTocActive(topHeading.target.id);
      },
      { root: null, rootMargin: '-35% 0% -55% 0%', threshold: 0.1 }
    );

    headingElements.forEach((element) => headingObserver.observe(element));
  }

  function updateFileCount(count) {
    fileCountEl.textContent = count;
  }

  function loadFile(path, fragment = '') {
    activePath = path;
    currentPathEl.textContent = path;
    const { path: loadPath, fallback } = resolveLocalizedPath(path);
    rawLink.href = `/${loadPath}`;
    rawLink.style.display = 'inline';
    currentFileDir = loadPath.split('/').slice(0, -1).join('/') || '.';
    document.querySelectorAll('.file-link').forEach((el) => {
      el.classList.toggle('active', el.dataset.path === path);
    });
    setStatus('statusLoadingPath', { path: loadPath });
    pendingFragment = fragment;

    fetch(`/${loadPath}`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        const rendered = renderMarkdown(text);
        const headings = rendered.headings;
        const html = wrapCodeTabs(rendered.html);
        let banner = '';
        if (currentLanguage === 'zh' && fallback) {
          banner = `<div class="translation-notice translation-notice-warn">${t('translationFallback')}</div>`;
        } else if (currentLanguage === 'zh' && loadPath !== path) {
          banner = `<div class="translation-notice">${t('translationShown', { path: loadPath })}</div>`;
        }
        readerEl.innerHTML = banner + `<h2>${path}</h2>` + html;
        applyPreferredCodeLang();
        addCopyButtons();
        renderToc(headings);
        observeHeadings();
        if (pendingFragment) {
          scrollToFragment(pendingFragment);
        }
        setStatus('statusDisplayedPath', { path: loadPath });
      })
      .catch((err) => {
        readerEl.innerHTML = `<p>${t('readerLoadFail')}</p>`;
        setStatus('statusLoadFailed', { message: err.message });
      });
  }

  function filterFiles() {
    const term = searchEl.value.trim().toLowerCase();
    const filtered = files.filter((file) => {
      return file.file.toLowerCase().includes(term) || file.category.toLowerCase().includes(term);
    });
    renderFileList(filtered);
    updateFileCount(filtered.length);
    if (filtered.length === 0) {
      setStatus('statusNoSearchMatches');
    } else {
      setStatus('statusFilesShown', { count: filtered.length });
    }
  }

  readerEl.addEventListener('click', (event) => {
    const copyBtn = event.target.closest('.copy-btn');
    if (copyBtn) {
      const code = copyBtn.closest('pre') && copyBtn.closest('pre').querySelector('code');
      if (code) {
        copyText(code.textContent || '')
          .then(() => flashCopyButton(copyBtn, 'copiedCode', true))
          .catch(() => flashCopyButton(copyBtn, 'copyFailed', false));
      }
      return;
    }
    const tab = event.target.closest('.code-tab');
    if (tab) {
      const container = tab.closest('.code-tabs');
      const lang = tab.dataset.lang;
      if (container && lang) {
        setPreferredCodeLang(lang);
        readerEl.querySelectorAll('.code-tabs').forEach((c) => activateTab(c, lang));
      }
      return;
    }
    const anchor = event.target.closest('a');
    if (!anchor || !anchor.href) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
      return;
    }
    if (href.startsWith('#')) {
      event.preventDefault();
      const fragment = href.slice(1);
      const target = document.getElementById(fragment);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateTocActive(fragment);
      }
      return;
    }
    const normalized = href.startsWith('/') ? href.slice(1) : href;
    const [cleanPath, fragment] = normalized.split('#');
    if (cleanPath.endsWith('.md')) {
      event.preventDefault();
      if (files.some((file) => file.file === cleanPath)) {
        loadFile(cleanPath, fragment ? `#${fragment}` : '');
      }
    }
  });

  searchEl.addEventListener('input', filterFiles);
  languageSelect.addEventListener('change', (event) => setLanguage(event.target.value));
  document.addEventListener('click', (event) => {
    document.querySelectorAll('details.nav-menu[open]').forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
  if (window.AwesomeTheme) {
    window.AwesomeTheme.wire(themeSelect);
  }
  setLanguage(currentLanguage);

  const CODE_LANG_KEY = 'awesome-interview-code-lang';
  let tabGroupCounter = 0;

  function getPreferredCodeLang() {
    return localStorage.getItem(CODE_LANG_KEY) || 'Python';
  }

  function setPreferredCodeLang(lang) {
    localStorage.setItem(CODE_LANG_KEY, lang);
  }

  function wrapCodeTabs(html) {
    const blockRe = /<p><strong>(Python|TypeScript|Java)[:：]<\/strong>\s*<\/p>\s*<pre>(<code[^>]*>[\s\S]*?<\/code>)<\/pre>/g;
    const matches = [];
    let m;
    while ((m = blockRe.exec(html)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, lang: m[1], code: m[2] });
    }
    if (!matches.length) return html;

    const groups = [];
    for (const match of matches) {
      const last = groups.length ? groups[groups.length - 1] : null;
      const lastEnd = last && last.length ? last[last.length - 1].end : -1;
      if (last && lastEnd >= 0 && /^\s*$/.test(html.slice(lastEnd, match.start))) {
        last.push(match);
      } else {
        groups.push([match]);
      }
    }

    for (let i = groups.length - 1; i >= 0; i--) {
      const group = groups[i];
      if (group.length < 2) continue;
      const gid = `tabs-${++tabGroupCounter}`;
      const tabs = group.map((g) =>
        `<button type="button" class="code-tab" data-tab-group="${gid}" data-lang="${g.lang}">${g.lang}</button>`
      ).join('');
      const panels = group.map((g) =>
        `<pre class="code-panel" data-tab-group="${gid}" data-lang="${g.lang}">${g.code}</pre>`
      ).join('');
      const replacement = `<div class="code-tabs" data-tab-group="${gid}"><div class="code-tab-bar">${tabs}</div>${panels}</div>`;
      const start = group[0].start;
      const end = group[group.length - 1].end;
      html = html.slice(0, start) + replacement + html.slice(end);
    }
    return html;
  }

  function applyPreferredCodeLang() {
    const pref = getPreferredCodeLang();
    readerEl.querySelectorAll('.code-tabs').forEach((container) => {
      const langs = Array.from(container.querySelectorAll('.code-tab')).map((b) => b.dataset.lang);
      const chosen = langs.includes(pref) ? pref : langs[0];
      activateTab(container, chosen);
    });
  }

  function activateTab(container, lang) {
    container.querySelectorAll('.code-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    container.querySelectorAll('.code-panel').forEach((p) => {
      p.classList.toggle('active', p.dataset.lang === lang);
    });
  }

  function addCopyButtons() {
    readerEl.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.copy-btn') || !pre.querySelector('code')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-btn';
      button.textContent = t('copyCode');
      pre.appendChild(button);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('execCommand copy failed'));
      } catch (e) {
        reject(e);
      }
    });
  }

  function flashCopyButton(button, labelKey, copied) {
    button.textContent = t(labelKey);
    button.classList.toggle('copied', copied);
    clearTimeout(button._copyResetTimer);
    button._copyResetTimer = setTimeout(() => {
      button.textContent = t('copyCode');
      button.classList.remove('copied');
    }, 1500);
  }


  function scrollToQuestionNumber(n) {
    const headings = readerEl.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    const target = Array.from(headings).find((h) => /^\s*(\d+)\./.test(h.textContent || '') && parseInt((h.textContent || '').match(/^\s*(\d+)\./)[1], 10) === n);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateTocActive(target.id);
    }
  }

  function loadFileAndJump(path, n) {
    loadFile(path);
    if (n != null && !Number.isNaN(n)) {
      const interval = setInterval(() => {
        if (readerEl.querySelector('h2[id], h3[id]')) {
          clearInterval(interval);
          scrollToQuestionNumber(n);
        }
      }, 50);
      setTimeout(() => clearInterval(interval), 5000);
    }
  }

  fetchJson('md_files.json')
    .then((data) => {
      files = data.files || [];
      if (!files.length) {
        setStatus('statusNoFilesFound');
        return;
      }
      updateFileCount(files.length);
      setStatus('statusFilesLoaded', { count: files.length });
      renderFileList(files);

      const params = new URLSearchParams(window.location.search);
      let requestedFile = params.get('file');
      if (requestedFile) {
        if (requestedFile.endsWith('.zh.md')) {
          requestedFile = requestedFile.slice(0, -'.zh.md'.length) + '.md';
        }
        const n = parseInt(params.get('n') || '', 10);
        loadFileAndJump(requestedFile, n);
      }
    })
    .catch((err) => {
      setStatus('statusLoadJsonFailed', { message: err.message });
    });
})();
