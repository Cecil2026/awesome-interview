(function () {
  "use strict";

  const els = {
    tagline: document.getElementById('tagline'),
    sourceLink: document.getElementById('source-link'),
    navPicker: document.getElementById('nav-picker'),
    navReader: document.getElementById('nav-reader'),
    navCompare: document.getElementById('nav-compare'),
    navResume: document.getElementById('nav-resume'),
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

  // Technology catalog: aliases (lowercase, survive normalization), bank topics, and tailored follow-ups.
  const CATALOG = [
    { label: 'React', aliases: ['react', 'reactjs', 'react.js', 'next.js', 'nextjs', 'redux'],
      topics: ['react', 'frontend', 'ssr', 'web-perf', 'lcp'],
      follow: {
        en: ['How do you prevent unnecessary re-renders in a large React tree?',
             'How did you manage state — local, context, or a store? What drove that choice?',
             'How did you measure and improve first paint / LCP on this app?'],
        zh: ['在大型 React 组件树里你如何避免不必要的重渲染？',
             '状态是怎么管理的——本地 state、context 还是 store？为什么这么选？',
             '你是如何衡量并优化首屏 / LCP 的？'],
      } },
    { label: 'Frontend / JS', aliases: ['javascript', 'typescript', 'vue', 'angular', 'webpack', 'vite', 'css', 'frontend', 'spa'],
      topics: ['frontend', 'web-perf', 'ssr', 'lcp'],
      follow: {
        en: ['How did you keep the bundle size under control as the app grew?',
             'Walk me through how you debugged a tricky cross-browser or performance issue.'],
        zh: ['随着应用变大，你是如何控制打包体积的？',
             '讲一个你排查棘手的跨浏览器或性能问题的过程。'],
      } },
    { label: 'Node.js', aliases: ['node', 'node.js', 'nodejs', 'express', 'nestjs', 'koa'],
      topics: ['concurrency', 'system-design', 'api', 'caching'],
      follow: {
        en: ['Node is single-threaded — how did you handle CPU-bound work or keep the event loop unblocked?',
             'How did you handle backpressure and graceful shutdown?'],
        zh: ['Node 是单线程的——你如何处理 CPU 密集任务、避免阻塞事件循环？',
             '你是如何处理背压（backpressure）和优雅关闭的？'],
      } },
    { label: 'Java / JVM', aliases: ['java', 'spring', 'springboot', 'jvm', 'kotlin', 'dubbo', 'mybatis'],
      topics: ['jvm', 'gc', 'concurrency', 'system-design', 'transactions'],
      follow: {
        en: ['How did you tune the JVM / GC for this service? What problem prompted it?',
             'How did you handle concurrency — thread pools, locks, or higher-level constructs?'],
        zh: ['你是如何为这个服务调优 JVM / GC 的？是什么问题促使你这么做？',
             '并发是怎么处理的——线程池、锁，还是更高层的抽象？'],
      } },
    { label: 'Python', aliases: ['python', 'django', 'flask', 'fastapi', 'celery', 'pandas'],
      topics: ['system-design', 'api', 'concurrency'],
      follow: {
        en: ['How did the GIL affect your design, and how did you work around it for parallelism?',
             'How did you handle long-running or async tasks?'],
        zh: ['GIL 对你的设计有什么影响？为了并行你是如何绕过它的？',
             '长耗时任务或异步任务你是怎么处理的？'],
      } },
    { label: 'Go', aliases: ['golang', 'go', 'gin', 'goroutine'],
      topics: ['concurrency', 'system-design', 'networking'],
      follow: {
        en: ['How did you use goroutines and channels here? How did you avoid leaks?',
             'How did you handle context cancellation and timeouts across calls?'],
        zh: ['这里你是如何使用 goroutine 和 channel 的？怎么避免泄漏？',
             '跨调用的 context 取消和超时你是怎么处理的？'],
      } },
    { label: 'C / C++', aliases: ['c++', 'cpp', 'c/c++', 'embedded', 'rtos'],
      topics: ['memory', 'memory-layout', 'concurrency', 'performance', 'c-cpp', 'operating-systems'],
      follow: {
        en: ['How did you manage memory and avoid leaks / undefined behavior?',
             'Where did you spend the most time optimizing, and how did you profile it?'],
        zh: ['你是如何管理内存、避免泄漏和未定义行为的？',
             '你在哪里花了最多时间做优化？是怎么做性能剖析的？'],
      } },
    { label: 'Database / SQL', aliases: ['mysql', 'postgres', 'postgresql', 'sql', 'oracle', 'sqlite', 'database', 'rdbms'],
      topics: ['databases', 'indexing', 'query-optimization', 'transactions', 'sharding'],
      follow: {
        en: ['How did you design your schema and indexes? Show me a query you had to optimize.',
             'What isolation level did you use, and how did you reason about transactions / deadlocks?',
             'At what point would this table need sharding, and how would you do it?'],
        zh: ['你的表结构和索引是怎么设计的？讲一个你必须优化的查询。',
             '你用的是哪个隔离级别？事务 / 死锁你是怎么权衡的？',
             '这张表到什么程度就需要分库分表？你会怎么做？'],
      } },
    { label: 'NoSQL', aliases: ['mongodb', 'mongo', 'cassandra', 'dynamodb', 'hbase', 'nosql', 'couchbase'],
      topics: ['databases', 'sharding', 'replication', 'consistency', 'partition'],
      follow: {
        en: ['Why NoSQL over a relational DB here? What did you give up?',
             'How did you model your partition key, and how did you avoid hot partitions?'],
        zh: ['这里为什么选 NoSQL 而不是关系型数据库？你放弃了什么？',
             '分区键是怎么设计的？你是如何避免热点分区的？'],
      } },
    { label: 'Redis / Cache', aliases: ['redis', 'memcached', 'cache', 'caching'],
      topics: ['caching', 'redis', 'cache', 'consistency', 'system-design'],
      follow: {
        en: ['What was your caching strategy and TTL policy? How did you handle cache invalidation?',
             'How did you protect against cache penetration, breakdown and avalanche?'],
        zh: ['你的缓存策略和 TTL 是怎么定的？缓存失效是怎么处理的？',
             '缓存穿透、击穿、雪崩你是如何防护的？'],
      } },
    { label: 'Kafka / Messaging', aliases: ['kafka', 'rabbitmq', 'pulsar', 'rocketmq', 'mq', 'message queue', 'pub sub', 'pubsub'],
      topics: ['message-queue', 'pub-sub', 'streaming', 'fanout', 'ordering', 'distributed-systems'],
      follow: {
        en: ['How did you guarantee ordering and exactly-once / at-least-once delivery?',
             'How did you handle consumer lag and rebalancing?',
             'What happened to in-flight messages during a failure?'],
        zh: ['你是如何保证消息顺序和 exactly-once / at-least-once 投递的？',
             '消费积压和 rebalance 你是怎么处理的？',
             '故障时正在处理中的消息会怎样？'],
      } },
    { label: 'Microservices', aliases: ['microservice', 'microservices', 'grpc', 'rest', 'restful', 'graphql', 'api gateway', 'service mesh'],
      topics: ['system-design', 'distributed-systems', 'distributed', 'api', 'consistency'],
      follow: {
        en: ['How did services communicate, and how did you handle partial failures and retries?',
             'How did you maintain data consistency across services?',
             'How did you trace a request across multiple services?'],
        zh: ['服务之间是如何通信的？部分失败和重试你是怎么处理的？',
             '跨服务的数据一致性你是如何保证的？',
             '一个请求横跨多个服务时你是怎么做链路追踪的？'],
      } },
    { label: 'Distributed systems', aliases: ['distributed', 'consensus', 'raft', 'paxos', 'zookeeper', 'etcd', 'consistency', 'sharding', 'replication'],
      topics: ['distributed-systems', 'distributed', 'consensus', 'consistency', 'replication', 'sharding', 'consistent-hashing'],
      follow: {
        en: ['What consistency model did you choose (strong vs eventual) and why?',
             'How did you handle leader election / split-brain?',
             'How did you reshard or rebalance without downtime?'],
        zh: ['你选择了哪种一致性模型（强一致 vs 最终一致），为什么？',
             '选主 / 脑裂问题你是怎么处理的？',
             '你是如何在不停机的情况下重新分片 / 再平衡的？'],
      } },
    { label: 'Kubernetes / Cloud', aliases: ['kubernetes', 'k8s', 'docker', 'container', 'aws', 'azure', 'gcp', 'terraform', 'helm', 'cloud'],
      topics: ['system-design', 'reliability', 'cost-optimization', 'cloud'],
      follow: {
        en: ['How did you handle deployments and rollbacks safely?',
             'How did you set resource limits, autoscaling and health checks?',
             'How did you control cloud cost?'],
        zh: ['你是如何安全地做部署和回滚的？',
             '资源限制、自动扩缩容和健康检查你是怎么配置的？',
             '云成本你是如何控制的？'],
      } },
    { label: 'CI/CD / DevOps', aliases: ['cicd', 'ci cd', 'jenkins', 'gitlab', 'github actions', 'pipeline', 'devops', 'nginx'],
      topics: ['reliability', 'system-design'],
      follow: {
        en: ['Walk me through your deployment pipeline from commit to production.',
             'How did you catch a bad release before it reached all users?'],
        zh: ['讲一遍你从提交到上线的部署流水线。',
             '你是如何在问题版本影响全部用户之前发现它的？'],
      } },
    { label: 'WebSocket / Real-time', aliases: ['websocket', 'websockets', 'webrtc', 'real time', 'realtime', 'sse', 'long polling'],
      topics: ['websockets', 'real-time', 'persistent-connections', 'presence', 'low-latency', 'fanout'],
      follow: {
        en: ['How did you manage millions of persistent connections and presence?',
             'How did you scale the fan-out, and what happened on reconnect?'],
        zh: ['你是如何管理大量长连接和在线状态（presence）的？',
             '消息扇出（fan-out）是如何扩展的？断线重连时会发生什么？'],
      } },
    { label: 'Machine Learning / AI', aliases: ['machine learning', 'ml', 'tensorflow', 'pytorch', 'nlp', 'llm', 'rag', 'recommendation', 'deep learning', 'embedding', 'model'],
      topics: ['ml', 'recommendation', 'ranking', 'recommendation'],
      follow: {
        en: ['How did you serve the model in production, and what was the latency budget?',
             'How did you evaluate quality, and how did you detect model / data drift?',
             'How did you build the training data pipeline?'],
        zh: ['模型在生产环境是怎么部署/服务的？延迟预算是多少？',
             '你是如何评估效果的？模型 / 数据漂移是怎么检测的？',
             '训练数据的流水线你是怎么搭的？'],
      } },
    { label: 'Mobile', aliases: ['android', 'ios', 'flutter', 'react native', 'swift', 'kotlin', 'mobile'],
      topics: ['mobile', 'android', 'offline', 'low-latency'],
      follow: {
        en: ['How did you handle offline support and data sync?',
             'How did you keep the app responsive and battery-friendly?'],
        zh: ['离线支持和数据同步你是怎么做的？',
             '你是如何保证应用流畅且省电的？'],
      } },
    { label: 'Security', aliases: ['oauth', 'jwt', 'security', 'encryption', 'tls', 'ssl', 'authentication', 'authorization', 'auth'],
      topics: ['security', 'privacy', 'permissions', 'e2e-encryption'],
      follow: {
        en: ['How did you handle authentication and authorization?',
             'What was your approach to storing secrets and protecting sensitive data?'],
        zh: ['认证和授权你是怎么做的？',
             '密钥存储和敏感数据保护你是怎么处理的？'],
      } },
    { label: 'Big data', aliases: ['spark', 'hadoop', 'flink', 'hive', 'data pipeline', 'etl', 'streaming', 'data warehouse'],
      topics: ['streaming', 'data-stream', 'ingestion', 'distributed-systems', 'time-series'],
      follow: {
        en: ['Batch vs streaming — why did you pick one, and how did you handle late / out-of-order data?',
             'How did you handle reprocessing and idempotency in the pipeline?'],
        zh: ['批处理还是流处理——你为什么这么选？延迟 / 乱序数据是怎么处理的？',
             '流水线里的重跑和幂等性你是怎么保证的？'],
      } },
  ];

  function applyLocalization() {
    document.documentElement.lang = currentLanguage;
    if (els.languageSelect) els.languageSelect.value = currentLanguage;
    els.tagline.textContent = t('tagline');
    els.navPicker.textContent = t('navPicker');
    els.navCompare.textContent = t('navCompare');
    els.navReader.textContent = t('navReader');
    if (els.navResume) els.navResume.textContent = t('navResume');
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

  function normalize(text) {
    return ' ' + text.toLowerCase().replace(/[^a-z0-9+#. ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  }

  function detectTech(text) {
    const norm = normalize(text);
    const hits = [];
    CATALOG.forEach((entry) => {
      const matched = entry.aliases.some((a) => norm.indexOf(' ' + a + ' ') !== -1);
      if (matched) hits.push(entry);
    });
    return hits;
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
