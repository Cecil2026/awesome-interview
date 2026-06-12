(function () {
  "use strict";

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

  window.AwesomeTechCatalog = { CATALOG, normalize, detectTech };
})();
