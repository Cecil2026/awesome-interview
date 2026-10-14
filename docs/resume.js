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
      themeLight: 'Light',
      themeDark: 'Dark',
      navStart: 'Start',
      inputLabel: 'Project experience',
      placeholder: 'e.g. Built a real-time chat service with Node.js, WebSocket and Redis, sharded across 3 regions, handling 50k concurrent connections...',
      generate: 'Generate questions',
      sample: 'Load sample',
      hint: 'Runs fully offline — no data leaves your browser.',
      loadError: 'Could not load the question bank — bank matches are unavailable. Check your connection and reload.',
      footer: 'Heuristic generator — reads your stack and the hard parts you describe, then builds targeted questions plus local bank matches.',
      sourceCode: 'Source code (MIT)',
      pageTitle: 'Resume → Questions',
      detectedLabel: 'Detected stack:',
      noneDetected: 'No specific technologies detected — generating general project questions. Add concrete tech names (React, Kafka, Kubernetes…) for sharper follow-ups.',
      emptyInput: 'Paste a project description first.',
      detectedDifficulty: 'Detected hard parts:',
      secTargeted: 'Targeted deep-dive (your project\'s hard parts)',
      noTargeted: 'No specific difficulty or scale numbers detected. Mention the hard parts — distributed locks, cache consistency, sharding, GC, failover, QPS / latency figures — for questions aimed right at them.',
      secTech: 'Technical deep-dive (from your stack)',
      secProject: 'General project deep-dive',
      secBehavioral: 'Behavioral (STAR)',
      secBank: 'Related practice from the question bank',
      bankMeta: '{category} · #{number}',
      noBank: 'No closely matching bank questions found for this stack.',
      viewAnswer: 'Show talking points + sample answer',
      sampleLabel: 'Sample answer',
    },
    zh: {
      tagline: '粘贴一段简历项目经历，生成对应的技术面试题。',
      navPicker: '选题',
      navReader: '阅读',
      navCompare: '对比',
      navResume: '简历 → 题',
      navPlan: '计划',
      themeLight: '浅色',
      themeDark: '深色',
      navStart: '开始',
      inputLabel: '项目经历',
      placeholder: '例如：用 Node.js、WebSocket 和 Redis 构建了一个实时聊天服务，按 3 个区域分片，支撑 5 万并发连接……',
      generate: '生成面试题',
      sample: '载入示例',
      hint: '完全离线运行——数据不会离开你的浏览器。',
      loadError: '无法加载题库——题库匹配不可用。请检查网络后重新加载。',
      footer: '启发式生成器——读取你的技术栈与描述的难点，生成针对性的题目，并匹配本地题库。',
      sourceCode: '源代码（MIT）',
      pageTitle: '简历 → 面试题',
      detectedLabel: '识别到的技术栈：',
      noneDetected: '未识别到具体技术——已生成通用项目题。补充具体技术名称（React、Kafka、Kubernetes……）可获得更精准的追问。',
      emptyInput: '请先粘贴一段项目描述。',
      detectedDifficulty: '识别到的难点：',
      secTargeted: '项目难点深挖（针对你项目的硬骨头）',
      noTargeted: '没识别到具体难点或规模数字。把硬骨头写出来——分布式锁、缓存一致性、分库分表、GC、主从切换、QPS / 延迟数字——就能得到针对性的追问。',
      secTech: '技术深挖（基于你的技术栈）',
      secProject: '通用项目深挖',
      secBehavioral: '行为面试（STAR）',
      secBank: '题库里相关的练习题',
      bankMeta: '{category} · 第 {number} 题',
      noBank: '题库里没有和这套技术栈高度匹配的题目。',
      viewAnswer: '查看答案要点 + 范答',
      sampleLabel: '答案示例',
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
            'Mention what is yours vs what is shared infra'],
        sample: 'At a high level it is a thin API front end, a set of stateless services, and the data tier. The read path is synchronous over gRPC; writes that fan out go through an event bus so the caller is never blocked. We picked Postgres for the transactional core and Redis for hot reads — Postgres for its transactions, Redis to shave p99. The gateway, auth and the bus are shared infra; the order and inventory services were mine.' },
      { q: 'What was the scale — QPS, data volume, number of users? Where was the bottleneck and how did you find it?',
        a: ['Concrete numbers: peak QPS, p50 / p99, data growth per day',
            'Name the bottleneck (DB, network, lock contention) — be specific',
            'How you found it: profiler, flame graph, slow log, RUM',
            'What you measured before vs after to prove the fix'],
        sample: 'At peak we ran roughly 120k QPS with p99 near 90ms and about 200GB of new data a day. The bottleneck was lock contention on a hot counter row — I caught it from a flame graph plus the slow-query log, not by guessing. I sharded the counter and moved the read into cache, and p99 fell from 400ms to 90ms, which is how I proved the fix rather than claiming it.' },
      { q: 'What was the hardest technical trade-off you made, and which alternatives did you reject and why?',
        a: ['Frame the trade-off in 2-3 axes (latency vs cost, consistency vs availability)',
            'State the rejected option fairly — what it would have been good at',
            'Why this fit your constraints (team size, deadline, traffic shape)',
            'What you would revisit if constraints changed'],
        sample: 'The hardest call was consistency vs availability on the write path. I rejected synchronous 2PC — it gives strong consistency but collapses availability during a partition, and our deadline and traffic shape could not absorb that. I went with a transactional outbox plus async reconciliation, which fit the team size and let us ship. If the requirement tightened, say money actually moving, I would revisit and add TCC for just those flows.' },
      { q: 'How did the system behave under failure? What happened if a key component or dependency went down?',
        a: ['Walk one failure scenario end-to-end (e.g., DB primary loss)',
            'Detection: alerts, SLO breach, customer report — what fired first',
            'Mitigations in place: retries, circuit breakers, fallback, degraded mode',
            'What was a known weakness that you accepted'],
        sample: 'Take the DB primary dying: the replica is promoted automatically and the app reconnects through the pool, so users saw a few seconds of higher latency, not errors. We caught it first from the SLO error-rate alert, before any customer reported it. Mitigations were retries with backoff, a circuit breaker on the DB client, and a read-only degraded mode; the weakness I accepted was a small window of possibly lost writes, which the reconciliation job swept up.' },
      { q: 'How did you test, deploy and monitor this? Which metrics told you it was healthy?',
        a: ['Test pyramid: unit + integration + load + chaos',
            'Deploy: canary / blue-green; auto-rollback signal',
            'Golden signals: latency, traffic, errors, saturation',
            'Plus business KPIs that prove the system is actually working'],
        sample: 'We had unit and integration tests, plus a nightly load test and light chaos on staging. Deploys were canary with automatic rollback if the golden signals — latency, errors, saturation — breached. In prod I watched those four plus two business KPIs, orders per minute and payment success rate, because green infra with falling orders still means something is broken.' },
      { q: 'How would you scale this system 10x? What breaks first?',
        a: ['Identify the current bottleneck and project it linearly',
            'Likely next failure: single-writer DB, cross-region latency, hot key',
            'Sketch the change: shard, cache layer, async path',
            'What this would cost (people + infra) and what risk it adds'],
        sample: 'The current bottleneck is the single-writer DB, so at 10x it saturates first. I would shard by user_id, put a read replica and cache in front of the hot reads, and move the heaviest writes onto an async path. It costs roughly two engineers for a quarter plus the extra infra, and it adds operational complexity — resharding and cache invalidation — which is the risk I would flag up front.' },
    ],
    zh: [
      { q: '完整讲一遍系统的端到端架构。主要组件有哪些,它们怎么交互?',
        a: ['先一句话总结,再画框图',
            '区分同步路径和异步 / 事件路径',
            '点出数据存储,以及为什么选每一个',
            '说明哪些是你自己的,哪些是共用基础设施'],
        sample: '整体上是一层很薄的 API 入口、一组无状态服务,再加数据层。读路径走 gRPC 同步;需要扇出的写走事件总线,调用方不被阻塞。事务核心选 Postgres(看中它的事务),热点读用 Redis 压 p99。网关、鉴权和总线是共用基础设施;订单和库存服务是我负责的。' },
      { q: '系统规模怎样——QPS、数据量、用户数?瓶颈在哪里,你怎么定位的?',
        a: ['给具体数字:峰值 QPS、p50 / p99、每天数据增量',
            '点名瓶颈(DB、网络、锁竞争),要具体',
            '怎么发现的:profiler、火焰图、慢日志、RUM',
            '修复前后分别度量哪些指标,证明确实改善'],
        sample: '峰值大概 12 万 QPS,p99 在 90ms 左右,每天新增约 200GB 数据。瓶颈是一个热点计数行上的锁竞争——我是用火焰图加慢查询日志定位的,不是拍脑袋。我把计数器拆分、再把读挪到缓存,p99 从 400ms 降到 90ms,用前后对比证明了确实有效。' },
      { q: '你做过最难的技术取舍是什么?放弃了哪些备选方案,为什么?',
        a: ['用 2-3 个维度框定取舍(延迟 vs 成本、一致性 vs 可用)',
            '客观陈述被放弃的方案有什么优势',
            '为什么当前选择更契合你的约束(团队、时限、流量形态)',
            '如果约束变化,哪个会重新考虑'],
        sample: '最难的取舍是写路径上的一致性 vs 可用性。我放弃了同步 2PC——它能给强一致,但网络分区时可用性直接崩,而我们的时限和流量形态扛不住。最后用事务 outbox + 异步对账,契合团队规模也能按时上线。如果要求变严、比如真的涉及资金流转,我会回头只给那几条链路加 TCC。' },
      { q: '系统在故障下表现如何?某个关键组件或依赖挂掉会发生什么?',
        a: ['完整走一个故障场景(比如 DB 主库丢失)',
            '感知:告警、SLO 破线、用户反馈——哪个先出',
            '已有的缓解:重试、熔断、降级、fallback',
            '哪些已知弱点是你主动接受的'],
        sample: '以 DB 主库挂掉为例:副本自动提升,应用通过连接池重连,用户只感到几秒延迟升高,而不是报错。我们是先从 SLO 错误率告警发现的,早于任何用户反馈。缓解手段是重试带退避、DB 客户端熔断、以及只读降级模式;我主动接受的弱点是有一个很小的可能丢写窗口,由对账任务兜住。' },
      { q: '你怎么测试、部署和监控?哪些指标说明它是健康的?',
        a: ['测试金字塔:单测 + 集成 + 压测 + 混沌',
            '部署:金丝雀 / 蓝绿;自动回滚信号',
            '黄金信号:延迟、流量、错误、饱和度',
            '加上能证明系统真在工作的业务 KPI'],
        sample: '我们有单测和集成测试,外加每晚一次压测和 staging 上的轻量混沌。部署是金丝雀,黄金信号(延迟、错误、饱和度)破线就自动回滚。线上我盯这四个信号再加两个业务 KPI——每分钟下单量和支付成功率,因为基础设施全绿但下单在掉,照样说明出问题了。' },
      { q: '把这个系统扩展 10 倍你会怎么做?最先坏的是什么?',
        a: ['先识别当前瓶颈,线性外推',
            '下一个故障点通常是:单写 DB、跨地域延迟、热点 key',
            '勾勒改动:分片、加缓存层、改异步',
            '成本(人 + 资源)和带来的风险'],
        sample: '当前瓶颈是单写库,翻 10 倍它最先饱和。我会按 user_id 分片,在热点读前面加读副本和缓存,再把最重的写改成异步。代价大概是两个人一个季度加上额外资源,并且会引入重分片、缓存失效这类运维复杂度——这是我会提前说清的风险。' },
    ],
  };

  const GENERIC_BEHAVIORAL = {
    en: [
      { q: 'What was your specific contribution versus the rest of the team?',
        a: ['Use "I" not "we" — own your slice',
            'Be precise: design / code / mentoring / on-call',
            'Acknowledge the team — does not weaken you, it adds credibility',
            'Quantify when possible (lines, commits do not count; outcomes do)'],
        sample: 'I owned the design and implementation of the order service and the event-driven write path end to end, and I ran on-call for it. The caching layer was a teammate\'s — I integrated against it — and I mentored two juniors on the testing approach. The outcome I point to is p99 down 4x and zero data-loss incidents after launch; that part is mine, with credit to the team for the infra I built on.' },
      { q: 'Tell me about the biggest challenge or disagreement during this project and how you resolved it.',
        a: ['STAR: situation, task, action, result — keep each tight',
            'Pick a real disagreement, not a strawman',
            'Show the data / experiment that broke the tie',
            'Close on what you learned about working with that person / team'],
        sample: 'We disagreed on sync vs async for cross-service writes under a launch deadline. A senior pushed for 2PC; I argued for an outbox. Rather than debate by seniority, I ran a quick load test showing 2PC\'s latency collapse during a partition, and the data settled it — we shipped async. What I took away was to resolve design arguments with a small experiment instead of who is more senior.' },
      { q: 'If you rebuilt this today, what would you do differently and why?',
        a: ['Pick 1-2 things, not a laundry list',
            'Show you understand what was right at the time vs what is right now',
            'Mention what you learned that changed your view',
            'Avoid "we should have used <today\'s buzzword>" without justification'],
        sample: 'Two things. I would introduce the event bus from day one instead of retrofitting it — bolting it on later cost us a messy migration. And I would invest in observability earlier; we flew blind for the first month. Starting simple was the right call for speed at the time, but I underestimated how fast we would need to scale, and that is what changed my default toward building the seams in early.' },
      { q: 'How did you decide what to prioritize when you were under time pressure?',
        a: ['Name the framework (RICE / ICE / impact-effort) — but stay concrete',
            'What you cut and why; what you chose to ship',
            'How you communicated the trade-off to stakeholders',
            'What ended up mattering vs what you over- or under-weighted'],
        sample: 'I used a rough impact-vs-effort cut. With two weeks left I protected the core checkout path and the payment integration, and I dropped the admin dashboard and some edge-case handling, which I flagged to the PM with the risk spelled out. The trade-off was communicated, not silent. In hindsight checkout was exactly right to protect; I had under-weighted error handling, which bit us once in week one.' },
    ],
    zh: [
      { q: '这个项目里你的具体贡献,和团队其他人的贡献分别是什么?',
        a: ['用"我"不用"我们"——讲清自己那块',
            '具体一点:设计 / 实现 / 带人 / 值班',
            '承认团队的作用——不会削弱你,反而更可信',
            '能量化就量化(代码行数不算,产出结果才算)'],
        sample: '我端到端负责订单服务和事件驱动的写路径的设计与实现,也包了它的值班。缓存层是同事做的,我负责对接;另外我带了两个初级同学做测试方案。我拿得出手的结果是上线后 p99 降了 4 倍、零数据丢失事故——这部分是我的,同时也要感谢团队提供了我在上面搭建的基础设施。' },
      { q: '讲一次项目中最大的挑战或分歧,以及你怎么解决的。',
        a: ['STAR:情境 / 任务 / 行动 / 结果——每一段都简洁',
            '选真实的分歧,不要立稻草人',
            '说清楚是什么数据 / 实验决定了结果',
            '收尾讲你从中学到了怎么和这类同事 / 团队合作'],
        sample: '上线前我们在跨服务写走同步还是异步上有分歧。一位资深同事主张 2PC,我主张用 outbox。我没有按资历争,而是跑了个压测,展示 2PC 在网络分区下延迟崩掉,数据把结论定了——最后我们上了异步。我的收获是:设计分歧用一个小实验去解决,而不是看谁更资深。' },
      { q: '如果现在重做这个项目,你会有哪些不同的做法,为什么?',
        a: ['挑 1-2 件,不要列清单',
            '说明你能分清"当时是对的"和"现在是对的"',
            '提一下你学到的、改变了观点的东西',
            '避免"应该用 <最新流行词>"这种没有论据的话'],
        sample: '两件事。一是我会从第一天就引入事件总线,而不是后面再补——后期硬塞让我们做了一次很乱的迁移。二是更早投入可观测性,头一个月我们基本是盲飞。当时为了速度先做简单版是对的,但我低估了需要扩容的速度,这也是我后来默认"早点把接缝留出来"的原因。' },
      { q: '时间紧的时候你怎么决定优先级?',
        a: ['说出你用的框架(RICE / ICE / 影响 vs 投入),但要具体',
            '砍了什么,为什么;选择什么先上',
            '怎么跟干系人沟通这个取舍',
            '最后真正重要的是什么,哪些被你高估或低估了'],
        sample: '我用的是粗粒度的影响 vs 投入。还剩两周时,我保住核心下单链路和支付对接,砍掉了后台管理面板和一些边界情况处理,并把风险讲清楚同步给了 PM。这个取舍是沟通过的,不是默默砍的。事后看保下单完全正确;我低估了错误处理,第一周就被坑了一次。' },
    ],
  };

  // Technology catalog shared with plan.js — loaded from tech-catalog.js.
  const { CATALOG, normalize, detectTech, detectSignals, extractMetrics } = (window.AwesomeTechCatalog || {});

  // Quote-back question built from the concrete scale numbers found in the resume.
  const METRIC_FOLLOWUP = {
    en: {
      tag: 'Scale & numbers',
      q: (nums) => `You cite ${nums}. Under what scenario / load test were these measured, where was the peak bottleneck, and what breaks first if traffic grows 10x?`,
      a: ['Say how you measured it: synthetic load test vs real prod peak — and at what percentile',
          'Name the bottleneck these numbers exposed (DB, lock, GC, network) and how you found it',
          'The 10x answer: which resource saturates first, and the concrete change to buy headroom',
          'Pair every number with a before/after so it reads as impact, not trivia'],
      sample: 'Those came from a load test shaped on prod traffic at peak, reported at p99, and real peak confirmed them within ~10%. The limiter was the single-writer DB — I pinned it from a flame graph plus the slow-query log, not a guess. At 10x it saturates first, so I would shard by user_id and put a read replica and cache in front of the hot reads. I always quote each number with its before/after so it reads as impact rather than trivia.',
    },
    zh: {
      tag: '规模与数字',
      q: (nums) => `你提到了 ${nums}。这些数字是在什么场景 / 压测下得到的?峰值时瓶颈在哪里?如果流量再翻 10 倍,最先撑不住的是什么?`,
      a: ['说清怎么测的:压测还是真实线上峰值,取的是哪个分位',
          '点出这些数字暴露的瓶颈(DB、锁、GC、网络)以及你怎么定位的',
          '10 倍的答案:哪个资源最先饱和,以及买到余量的具体改动',
          '每个数字都配前后对比,让它读起来是"影响"而不是"数据点"'],
      sample: '这些数字来自按线上流量建模的压测、取峰值 p99,真实峰值也对得上、误差 10% 以内。瓶颈是单写库——我是用火焰图加慢查询日志定位的,不是拍脑袋。翻 10 倍时它最先饱和,所以我会按 user_id 分片,再在热点读前面加读副本和缓存。我习惯每个数字都配前后对比,让它读起来是"影响"而不是堆数据。',
    },
  };

  function applyLocalization() {
    document.documentElement.lang = currentLanguage;
    if (els.languageSelect) els.languageSelect.value = currentLanguage;
    els.tagline.textContent = t('tagline');
    els.navPicker.textContent = t('navPicker');
    els.navCompare.textContent = t('navCompare');
    els.navReader.textContent = t('navReader');
    if (els.navResume) els.navResume.textContent = t('navResume');
    if (els.navPlan) els.navPlan.textContent = t('navPlan');
    if (els.themeSelect) {
      const opts = els.themeSelect.options;
      for (let i = 0; i < opts.length; i++) {
        if (opts[i].value === 'light') opts[i].textContent = t('themeLight');
        if (opts[i].value === 'dark') opts[i].textContent = t('themeDark');
      }
    }
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
        const hasBullets = Array.isArray(item.a) && item.a.length;
        if (hasBullets || item.sample) {
          let inner = '';
          if (hasBullets) inner += `<ul>${item.a.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
          if (item.sample) {
            inner += `<div class="q-sample"><span class="q-sample-label">${esc(t('sampleLabel'))}</span>`
                   + `<p>${esc(item.sample)}</p></div>`;
          }
          html += `<details class="q-answer"><summary>${esc(t('viewAnswer'))}</summary>${inner}</details>`;
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
    const signals = (detectSignals ? detectSignals(text) : []);
    const metrics = (extractMetrics ? extractMetrics(text) : []);

    // Detected chips — tech stack + the hard parts we read out of the text.
    const addChipRow = (labelKey, items, getLabel) => {
      if (!items.length) return;
      const label = document.createElement('span');
      label.className = 'empty-note';
      label.style.width = '100%';
      label.textContent = t(labelKey);
      els.detected.appendChild(label);
      items.forEach((e) => {
        const chip = document.createElement('span');
        chip.className = 'tech-chip';
        chip.textContent = getLabel(e);
        els.detected.appendChild(chip);
      });
    };
    if (detected.length || signals.length) {
      addChipRow('detectedLabel', detected, (e) => e.label);
      addChipRow('detectedDifficulty', signals, (e) => e.label[currentLanguage] || e.label.en);
    } else {
      els.detected.innerHTML = `<span class="empty-note">${esc(t('noneDetected'))}</span>`;
    }

    // Targeted deep-dive: quote the scale numbers back + difficulty-specific Q&A.
    const targetedItems = [];
    if (metrics.length) {
      const mf = METRIC_FOLLOWUP[currentLanguage] || METRIC_FOLLOWUP.en;
      targetedItems.push({ text: mf.q(metrics.join(' · ')), tag: mf.tag, a: mf.a, sample: mf.sample });
    }
    signals.forEach((s) => {
      targetedItems.push({
        text: s.q[currentLanguage] || s.q.en,
        tag: s.label[currentLanguage] || s.label.en,
        a: s.a[currentLanguage] || s.a.en,
        sample: s.sample && (s.sample[currentLanguage] || s.sample.en),
      });
    });

    // Tech follow-ups
    const techItems = [];
    detected.forEach((e) => {
      const arr = (e.follow[currentLanguage] || e.follow.en);
      arr.forEach((entry) => {
        // Backwards-compat: entry may be plain string or { q, a, sample }.
        const q = typeof entry === 'string' ? entry : entry.q;
        const a = typeof entry === 'string' ? null : entry.a;
        const sample = typeof entry === 'string' ? null : entry.sample;
        techItems.push({ text: q, tag: e.label, a, sample });
      });
    });

    // General project + behavioral
    const projBank = GENERIC_PROJECT[currentLanguage] || GENERIC_PROJECT.en;
    const behBank = GENERIC_BEHAVIORAL[currentLanguage] || GENERIC_BEHAVIORAL.en;
    const projItems = projBank.map((e) => ({ text: e.q, a: e.a, sample: e.sample }));
    const behItems = behBank.map((e) => ({ text: e.q, a: e.a, sample: e.sample }));

    // Bank matches
    const bankItems = matchBankQuestions(detected).map((q) => ({ bank: true, q }));

    els.body.appendChild(section(t('secTargeted'), targetedItems, { emptyText: t('noTargeted') }));
    if (techItems.length) els.body.appendChild(section(t('secTech'), techItems));
    els.body.appendChild(section(t('secProject'), projItems));
    els.body.appendChild(section(t('secBehavioral'), behItems));
    els.body.appendChild(section(t('secBank'), bankItems, { emptyText: t('noBank') }));

    els.results.hidden = false;
  }

  const SAMPLE = {
    en: 'Led the backend of a real-time chat platform. Built with Java (Spring Boot) microservices behind a gRPC API gateway, using Redis for presence/caching and Kafka for message fan-out. Messages were stored in Cassandra, sharded by conversation ID and replicated across 3 regions. Used a Redis distributed lock for presence writes and made delivery idempotent with a dedup key to avoid duplicate consumption. Hit cache avalanche during a promo and added TTL jitter; tuned JVM G1 GC after full-GC pauses spiked p99. WebSocket gateways held ~80k concurrent connections per node at 120k QPS, deployed on Kubernetes with autoscaling, rate limiting and circuit breakers. Added end-to-end encryption and cut p99 latency from 400ms to 90ms.',
    zh: '负责一个实时聊天平台的后端。基于 Java（Spring Boot）微服务，前置 gRPC API 网关，使用 Redis 做在线状态/缓存，Kafka 做消息扇出。消息存储在 Cassandra，按会话 ID 分片并跨 3 个区域复制。在线状态写入用 Redis 分布式锁，投递通过去重键做幂等以避免重复消费。大促时遇到缓存雪崩，加了 TTL 抖动；full GC 停顿导致 p99 飙升后对 JVM G1 做了调优。WebSocket 网关每个节点维持约 8 万并发连接、承载 12 万 QPS，部署在 Kubernetes 上并支持自动扩缩容、限流与熔断。增加了端到端加密，并将 p99 延迟从 400ms 降到 90ms。',
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
      .catch((err) => {
        console.error('resume: failed to load questions.json', err);
        questions = [];
        if (els.hint) {
          els.hint.textContent = t('loadError');
          els.hint.classList.add('hint-error');
        }
      });
  }

  init();
})();
