# DevOps 面试题

100 道关于 Docker、Kubernetes、CI/CD、基础设施即代码、可观测性、网络、安全和云的高频题。

---

### 1. 进程 vs 线程；解释 fork/exec

**频率：** 高

**题目：** 进程和线程有什么区别，Linux 上 fork() 和 exec() 是怎么工作的？

**答案：** **进程**是一个隔离的**地址空间**，拥有自己的 **PID、文件描述符和内存**。**线程**活在进程*内部*，**共享**堆、全局变量和打开的 FD——因此**创建更便宜**、可通过共享内存通信，但某个线程的 bug（内存越界）会拖垮整个进程；而进程之间是隔离的（一个崩溃不会影响另一个）。

**`fork()`** 克隆调用进程，生出一个 **PID 不同的子进程**。关键机制：内存是**写时复制（COW）**——父子共享同一批只读物理页，只有当某一方*真正写入*某页时才复制该页（所以在改内存之前 `fork` 很便宜）；文件描述符被**复制**——子进程继承指向同一打开文件表项的 FD 副本（父子都能往继承来的管道/套接字写）。

**`exec()`** 用**新程序替换当前进程映像**（代码、堆、栈），但**保持 PID 不变**（继承的 FD 除非标了 close-on-exec 也保留）。成功时它不返回；旧程序就此消失。

**经典 shell 模式**是 `fork` → 在**子进程**里 `exec`（运行命令）→ **父进程** `wait` 收集子进程退出状态。**僵尸进程**出现在父进程**未回收**已结束子进程时：子进程已退出，但它的退出状态项滞留在进程表里，直到父进程调用 `wait`/`waitpid`。会派生子进程的长命守护进程必须回收它们（或处理 `SIGCHLD`），否则会泄漏僵尸槽位。

**要点：**
- 线程共享堆；进程不共享
- `fork` 是 COW，未写入前便宜
- `exec` 保 PID 但换二进制
- 用 `wait`/`waitpid` 回收子进程避免僵尸

---

### 2. cgroups 与 namespaces

**频率：** 高

**题目：** cgroups 和 namespaces 是什么，它们如何共同构成一个容器？

**答案：** 它们是*共同*构成容器的两个 Linux 内核原语，解决的是不同问题。**Namespace 隔离进程能*看到*什么**（可见性）；**cgroup 限制并记账进程能*用*多少**（资源）。

**Namespace** 给进程一份对某全局资源的私有视图。种类有：**PID**（自己的进程树——它看自己是 PID 1，看不到宿主进程）、**NET**（自己的网络栈——网卡、路由、端口）、**MNT**（自己的文件系统挂载）、**UTS**（自己的主机名）、**IPC**（自己的共享内存/信号量）、**USER**（自己的 UID/GID 映射——容器内的 root 在外面可以是非特权用户）、**CGROUP**（自己的 cgroup 根视图）、**TIME**（自己的启动/单调时钟）。实践中 PID 和 NET 最显眼。

**cgroup（控制组）** 为 **CPU、内存、IO、pids** 强制配额并记账用量。超过内存 cgroup，内核会 **OOM 杀掉**进程；超过 CPU 配额，进程会被**限流**。

**容器就是一个普通进程**加上这些机制——用 namespace 让它看不到宿主，用 cgroup 让它不能霸占资源。内核里没有"容器"这种对象；Docker/containerd 只是围绕一个进程把这些设置好。

**cgroup v2** 用 `/sys/fs/cgroup` 下的**单棵统一树**取代了 v1 各控制器分立的层级，修复了不一致并支持更好的压力/PSI 指标。**Kubernetes 和 Docker 按 pod/容器写入 cgroup 子树**来强制 `requests`/`limits`。用 `systemd-cgls` 或 `cat /proc/self/cgroup` 查看。

**要点：**
- Namespace = 隔离；cgroup = 配额
- 8 种 namespace；PID/NET 最显眼
- 推荐 cgroup v2 统一层级
- 查看：`systemd-cgls`、`cat /proc/self/cgroup`

---

### 3. TCP 三次握手与 TIME_WAIT

**频率：** 高

**题目：** 请走一遍 TCP 的握手与拆连过程，以及一堆 TIME_WAIT 套接字意味着什么。

**答案：** **建连（三次握手）：** 客户端发 **SYN**（带自己的初始序列号），服务端回 **SYN-ACK**（确认客户端的序号并发送自己的），客户端再发 **ACK**。三个包建立起一条同步、可靠、双向的流——SYN-ACK 把两步合并了，所以是三次而非四次。

**拆连：** 双方各自独立发一个 **FIN** 并收到 **ACK**（四个包，因为一方关闭后另一方仍可继续发送——即"半关闭"）。

**`TIME_WAIT`：** **发起关闭**的一方进入 `TIME_WAIT`，持续 **2×MSL**（最大段生存期，通常总计约 **60 秒**）。两个原因：(1) 让旧连接的**晚到重复段**不会被误认为属于复用同一四元组（源 IP:端口、目的 IP:端口）的*新*连接；(2) 确保最后那个 ACK 到达对端（若丢失，对端会重发 FIN，本方可再次 ACK）。

**繁忙客户端上大量 `TIME_WAIT`** 说明存在大量**短命对外连接**——客户端不断开关连接（例如每个请求都新建一条 HTTP 连接）。每条都占住一个四元组约 60 秒，高扇出下会**耗尽临时端口**。**正确的修法是架构层面的：连接池 / keep-alive**（复用连接而不是频繁开关）。只有当这仍不够时，才用 `SO_REUSEADDR` 或 `net.ipv4.tcp_tw_reuse=1`（对*出站*安全的复用）。**不要**盲目关掉这个状态——那会重新引入陈旧段的风险。用 `ss -tan state time-wait | wc -l` 查看。

**要点：**
- SYN -> SYN/ACK -> ACK
- TIME_WAIT 防止陈旧段
- 池化连接而不是调内核
- 查看：`ss -tan state time-wait | wc -l`

---

### 4. DNS 记录与 TTL

**频率：** 高

**题目：** 请解释常见 DNS 记录类型，以及 TTL 如何影响一次切换。

**答案：** **记录类型：** **A** 把名字映射到 **IPv4**；**AAAA** 映射到 **IPv6**；**CNAME** 把一个名字**别名**到另一个规范名（解析器会追到目标）；**SRV** 公告一个**服务 + 端口 + 优先级 + 权重**（用于服务发现——Kubernetes headless 服务会发布 SRV 记录）；**TXT** 携带**任意文本**，用于校验和策略（SPF/DKIM 邮件认证、ACME/Let's Encrypt 挑战、域名归属证明）；**MX** 按优先级把**邮件**路由到邮件服务器。

**为什么 CNAME 不能与区域顶点共存：** CNAME 意思是"这个名字*只不过*是个别名——去解析目标吧"。但顶点（`example.com` 本身）**必须**携带 SOA、NS 等其他记录（区域正常运作所必需），而 CNAME 不能合法地与它们并存。这就是你不能 `CNAME example.com → elb.aws.com` 的原因。厂商用 **ALIAS/ANAME** 绕过（一种合成记录，在服务端解析目标并在顶点返回 A 记录）。

**TTL 与切换：** **TTL** 告诉解析器**缓存答案多久**。**更低的 TTL** = 变更传播更快（利于迁移）但**查询量更大**打到你的权威服务器（还有轻微延迟）；**更高的 TTL** = 缓存/韧性更好但改动慢。**迁移方案：** 切换*前*数小时（或一天）**把 TTL 降下来**（如降到 60s），让缓存快速过期；确认传播完成；然后**切换记录**——客户端会在短短 TTL 内拿到新值。之后再把 TTL 调回去。用 `dig +trace name` 端到端调试解析。

**要点：**
- 顶点禁 CNAME（用 ALIAS/ANAME）
- Kubernetes headless 服务用 SRV
- 切换前降 TTL
- 用 `dig +trace name` 调试

---

### 5. 镜像 vs 容器 vs 层

**频率：** 高

**题目：** Docker 镜像、容器和层三者有什么区别？

**答案：** **镜像**是一个**不可变、内容寻址的捆绑**，包含文件系统**层**加**元数据**（entrypoint、env、暴露端口、默认命令）。它是一个*模板*——一个冻结快照，可以发布并按 digest 完全复现。

**层**是由**一个构建步骤**产生的 **tar 差量**（一组文件系统变更）——例如 `RUN apt-get install ...` 会加一层新文件。层按 **SHA-256 digest 内容寻址**，因此**跨镜像去重**：若两个镜像共享同一基础和同一 `apt` 层，该层在磁盘上只存一份、只 pull 一次。这就是为什么 pull 第二个共享基础的镜像很快——它只拉你还没有的层。

**容器**是镜像的**运行（或已停止）实例**：内核拿镜像的**只读层**，在上面叠一个**薄可写层**（联合/overlay 文件系统）。所有运行时变更（写文件、日志）都落在那个可写上层；底层镜像层保持不动，在该镜像的每个容器间共享。删掉容器，可写层就丢弃（所以持久化需要卷）。

**为什么顺序和基础镜像复用很重要：** 既然层按 digest 共享，把 Dockerfile 组织成**稳定层在前、复用共享基础镜像**能在构建*和* pull 两方面最大化缓存命中——传输字节更少、磁盘占用更小。

**要点：**
- 镜像 = 层 + config manifest
- 层是内容寻址的（sha256）
- 容器加一层可写上层
- 复用基础镜像最大化缓存命中

---

### 6. RUN vs CMD vs ENTRYPOINT

**频率：** 高

**题目：** 请对比 Dockerfile 中的 RUN、CMD 和 ENTRYPOINT，以及为何优先用 exec 形式？

**答案：** 它们作用于不同时机和角色。**`RUN`** 在**构建期**执行，产生一个**新镜像层**——用来装包、编译代码等（`RUN apt-get install -y curl`），与容器启动时跑什么无关。

**`ENTRYPOINT`** 定义容器启动时**始终运行的可执行**——固定的"这个容器*是*什么"（如 `ENTRYPOINT ["nginx"]`）。**`CMD`** 给该 entrypoint 提供**默认参数**（或在无 ENTRYPOINT 时提供一个易被覆盖的**默认命令**）。惯用法是 `ENTRYPOINT ["myapp"]` + `CMD ["--port", "8080"]` → 默认跑 `myapp --port 8080`，但 `docker run img --port 9090` 只换参数而保持 `myapp` 固定。

**运行时覆盖：** 向 `docker run image arg1 arg2` 追加参数会**替换 CMD**（传给 ENTRYPOINT 的参数）；`--entrypoint` 标则替换 ENTRYPOINT 本身。

**优先用 exec 形式（`["app", "arg"]`）而非 shell 形式（`app arg`）：** shell 形式把你的进程作为 **`/bin/sh -c` 的子进程**跑，于是 **shell 成了 PID 1**，而非你的应用。这会破坏**信号处理**——`docker stop` 向 PID 1（shell）发 `SIGTERM`，shell 往往不转发，于是你的应用收不到优雅关闭信号，宽限期过后被 `SIGKILL`。exec 形式让**你的进程成为 PID 1**，直接收信号以优雅关闭，且省掉一个多余的 shell 进程。

**要点：**
- RUN = 构建期层
- ENTRYPOINT = 固定二进制
- CMD = 默认参数 / 回退
- 用 exec 形式（JSON 数组）以正确处理信号

---

### 7. 层缓存顺序

**频率：** 高

**题目：** Dockerfile 层缓存是怎么工作的，为了快速构建应如何安排指令顺序？

**答案：** **每条指令按其输入缓存。** Docker 从指令及其触及的内容计算一个缓存键（对 `COPY` 是所复制文件的校验和；对 `RUN` 是命令字符串和先前的层）。重建时，只要键匹配 Docker 就复用缓存层——但**一旦某条指令的键变了，其后每一层都失效**并从那里向下重建（因为每层都依赖前一层的状态）。

**顺序原则：把很少变动的步骤放前面，频繁变动的放后面。** 典型的最优顺序：
1. **基础镜像**（`FROM`）——几乎从不变。
2. **系统包**（`RUN apt-get install ...`）——很少变。
3. **依赖清单**（`COPY package.json package-lock.json ./` 或 `go.mod go.sum`）——偶尔变。
4. **安装依赖**（`RUN npm ci` / `go mod download`）——昂贵的一步。
5. **复制源码**（`COPY . .`）——*每次*提交都变。

**为什么把清单复制在源码之前：** 若先 `COPY . .` 再安装，任何一个字符的源码改动都会变化复制文件的校验和、击破那一层，并**重跑整个依赖安装**——白白浪费几分钟。先只复制清单并安装，则仅源码改动时清单层*和安装层*都仍缓存，只重跑最后的 `COPY . .`。这把重建从**分钟级降到秒级**。

**其他技巧：** **按 digest 钉基础镜像**（`FROM node:20@sha256:...`）求可复现，避免浮动的 tag 静默改变基础；用 **BuildKit 缓存挂载**（`RUN --mount=type=cache,target=/root/.npm npm ci`）在*跨*构建之间保留包管理器缓存，即使安装层本身失效。

**要点：**
- 缓存从首次变更起失效
- 把清单复制在源代码之前
- 按 digest 钉基础镜像求可复现
- BuildKit `--mount=type=cache` 做包缓存

---

### 8. 多阶段构建

**频率：** 高

**题目：** 什么是 Docker 多阶段构建，为什么它很重要？

**答案：** 多阶段构建在一个 Dockerfile 里用**多个 `FROM` 阶段**：你在**重型工具链镜像**（编译器、开发头文件、完整 SDK）里构建，然后**只把完成的产物复制**进一个**小型运行时镜像**，丢弃其余一切。构建保持封闭（全在一个 Dockerfile），而发布的镜像却很小。

```dockerfile
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/app /app
ENTRYPOINT ["/app"]
```

**工作方式：** `--from=build` 从一个命名的早期阶段*把*产物复制到当前阶段。第一阶段（带 Go 工具链，500MB+）仅用于产出 `/out/app` 二进制，**不属于最终镜像**——只有最后一个阶段会发布。

**为什么最终镜像应排除编译器和源码：** 你发布的每一个工具和源文件都是**攻击面**和 **CVE 负担**。发布的 Go 编译器、包管理器、shell 或源码树都给攻击者提供了可利用的工具并抬高你的漏洞扫描结果——而运行一个编译好的静态二进制根本不需要它们。

**配合 distroless**（`gcr.io/distroless/static`）更进一步：运行时镜像**无 shell、无包管理器、无 libc**（对静态二进制）——只有你的二进制及其最小依赖。这极大地**最小化攻击面和 CVE 暴露**（一个 distroless 镜像可能零已知 CVE，而完整 `ubuntu` 基础可能数十个），并把镜像从几百 MB 缩到几 MB，加快 pull 和部署。

**要点：**
- 分离构建 vs 运行时阶段
- 用 `--from=stage` 复制产物
- 最终镜像不含编译器/源码
- 配合 distroless 得到最小 CVE 面

---

### 9. 资源上限与 OOM

**频率：** 高

**题目：** 容器资源上限如何强制，超内存与超 CPU 分别会怎样？

**答案：** **没有上限，容器会饿死主机**——一个失控进程可耗尽全部内存或 CPU，拖垮节点上其他所有工作负载。上限通过 **cgroups** 强制：`docker run --memory=512m --cpus=1` 写入容器的内存和 CPU cgroup。

**这两种上限的行为根本不同：**
- **内存超限 → 进程被杀。** 内存无法"节流"——要么有字节要么没有。当容器试图超过其内存 cgroup 时，内核的 **OOM 杀手**终止该 cgroup 内的一个进程，Docker 把容器报为 **`OOMKilled`**。这很突兀——没有优雅关闭。
- **CPU 超限 → 进程被节流，不被杀。** CPU 可按时间片分配，超 CPU 配额只意味着内核**给该容器排更少的时间**——它跑得更慢（延迟更高）但继续跑。你会看到 CPU 节流指标，而非崩溃。

**在 Kubernetes 中**有**两个旋钮**：**`requests`**（pod 被*保证*的量——**调度器**用它把 pod 放到有足够容量的节点上）和 **`limits`**（cgroup 在**运行时强制的硬上限**）。**超内存 limit 的 pod 会被 OOMKilled 并重启**（若持续则进入 CrashLoopBackoff）；超 CPU limit 的被节流。requests 低于 limits 可实现超售（节点打包比 limits 之和更紧）。用 `dmesg | grep -i oom` 看内核 OOM 事件，用 `kubectl describe pod` 看 `OOMKilled` 原因。

**要点：**
- 内存超 limit -> OOMKill
- CPU 超 limit -> 节流
- `requests` 调度、`limits` 强制
- 看 `dmesg | grep -i oom` 看内核事件

---

### 10. Pod vs Deployment vs ReplicaSet vs StatefulSet vs DaemonSet vs Job vs CronJob

**频率：** 高

**题目：** 请对比 Kubernetes 主要的工作负载资源，以及各自何时使用。

**答案：** 它们从最底层到最高层构成一个层级，每层增加保证：

- **Pod**——**最小可部署单元**：一个或多个**共置容器**共享同一网络命名空间（localhost、一个 IP）和 IPC。你很少直接创建裸 Pod——它们短暂且不自愈。Sidecar（代理、日志采集）与主容器同处一个 pod。
- **ReplicaSet**——维护**恰好 N 个相同 pod 副本**，任何死掉的都重建。你几乎从不直接管理它——它是 Deployment 驱动的机制。
- **Deployment**——管理 ReplicaSet，为**无状态应用**（默认选择）提供**滚动更新和回滚**。更新镜像会创建新 ReplicaSet 并逐步迁移 pod（maxSurge/maxUnavailable）；`kubectl rollout undo` 回退。
- **StatefulSet**——用于**有状态工作负载**（数据库、Kafka）：增加**稳定网络身份**（`pod-0`、`pod-1` 带黏性 DNS）、**稳定的每 pod 存储**（每个跨重调度保留自己的 PVC），以及**有序、顺序**的滚动/伸缩（pod-0 先于 pod-1）。当身份或顺序重要时用它。
- **DaemonSet**——**每节点跑一个 pod**（新节点也自动跑）。用于**节点级代理**：日志采集（Fluent Bit）、CNI 插件、node exporter、监控代理。
- **Job**——把 pod 跑**到完成**（批处理）并跟踪成功；失败时重试。
- **CronJob**——**按 cron 表达式调度 Job**（夜间备份、周期报表）。

**快速规则：** 无状态服务 → Deployment；身份/顺序/每 pod 存储 → StatefulSet；每节点代理 → DaemonSet；一次性或定时批处理 → Job/CronJob。

**要点：**
- 无状态用 Deployment
- 有序/身份绑定用 StatefulSet
- 每节点代理用 DaemonSet
- 批用 Job/CronJob

---

### 11. Service 类型

**频率：** 高

**题目：** 请解释 Kubernetes 的 Service 类型，以及各自何时使用。

**答案：** Service 在一组短暂 pod（按 label 选中）前面给出一个稳定的虚拟端点。这些类型从集群内部向外部暴露层层展开：

- **ClusterIP**（默认）——一个**只在集群内可达的虚拟 IP**。kube-proxy 在匹配的 pod 间负载均衡。用于内部服务间流量（只被其他 pod 调用的后端）。
- **NodePort**——在**每个节点 IP 的一个静态端口（30000–32767）**上暴露服务。到 `<任一节点IP>:<nodePort>` 的流量转发到该服务。粗糙的外部访问；多作为 LoadBalancer 的构件或用于裸机/开发。
- **LoadBalancer**——**配置一个云负载均衡器**（AWS ELB、GCP LB）指向 NodePort，给出单个外部 IP/DNS。云上公开暴露服务的标准方式。每个都是真实（计费）的云 LB——实践中你会用一个 Ingress 前置多个服务。
- **ExternalName**——返回到外部主机名的 **CNAME**（`my-db.example.com`）。不做代理——纯 DNS，用于把外部依赖别名到一个集群内名字后面。
- **Headless**（`clusterIP: None`）——**完全跳过虚拟 IP**，通过 **DNS A/SRV 记录**直接返回**各个 pod IP**。当客户端需要寻址特定 pod 而非负载均衡的 VIP 时用——例如 **StatefulSet**（每个 pod 得到稳定 DNS 如 `pod-0.svc`）和客户端侧服务发现。

**经验法则：** 内部 → ClusterIP；云上公开 → LoadBalancer（通常经 Ingress）；需要按 pod 寻址 → Headless。

**要点：**
- ClusterIP：集群内 VIP
- NodePort：每节点同一端口
- LoadBalancer：前置云 LB
- Headless：基于 DNS、无代理

---

### 12. ConfigMaps vs Secrets

**频率：** 高

**题目：** 请对比 ConfigMap 与 Secret，以及如何做*真正的*密钥管理？

**答案：** 两者都是**键值存储**，可作为**环境变量或文件**挂载进 pod。区别在于**意图和（弱）保护**：

- **ConfigMap** 放**非敏感配置**——特性开关、URL、调优参数。
- **Secret** 放**凭证**——密码、令牌、TLS 密钥。但关键警告：**Secret 在 etcd 中静态时只是 base64 编码，不是加密。** base64 是*编码，不是安全*——任何能读 etcd（或有权限跑 `kubectl get secret -o yaml`）的人都能轻易看到值。要真正安全，你必须**启用由 KMS 支持的 etcd 静态加密**（AWS KMS、GCP KMS），并锁紧 RBAC 使很少人能读 Secret。

**文件挂载 vs 环境变量——一个真实的运维差异：** 当你把 ConfigMap/Secret **作为文件**挂载时，Kubernetes（最终经 kubelet）会**把更新传播到挂载的文件**而**不重启 pod**——所以轮换后的凭证能被 file-watch 的应用（或由 sidecar reloader 通知）拾取。但作为**环境变量**注入的值在容器启动时就捕获、永不更新——你*必须重启 pod*才能拾取变更。所以想要无停机轮换时**优先文件挂载**。

**真正的密钥管理：** 单靠 Kubernetes Secret 不是一个密钥*管理器*（无轮换、审计或中心真相源）。集成 **External Secrets Operator**（或 Vault Agent / Secrets Store CSI 驱动）来**从 Vault / AWS Secrets Manager / GCP Secret Manager 同步**到 K8s Secret。这把**真相源**放在带轮换、版本和审计日志的专用保险库里，而 pod 仍消费普通 Secret。

**要点：**
- Secret 是 base64，默认未加密
- 用 KMS 启用 etcd 静态加密
- 文件挂载自动更新；env var 不会
- 用 External Secrets Operator 做真相源

---

### 13. 卷、PV、PVC、StorageClass

**频率：** 高

**题目：** 请解释 Kubernetes 持久化存储：PV、PVC、StorageClass、访问模式、回收策略。

**答案：** 这套模型把存储的*请求*与其*供给*解耦，让应用作者无需了解底层存储技术：

- **PersistentVolume（PV）**——一个**表示真实存储的集群级资源**（EBS 卷、GCE PD、NFS 导出、Ceph RBD）。它是实际的那块存储，有容量和访问模式。
- **PersistentVolumeClaim（PVC）**——一个**命名空间内的存储*请求***（"我需要 20Gi、RWO"）。pod 引用的是 PVC，而非直接引用 PV。Kubernetes 把 claim **绑定**到匹配的 PV。
- **StorageClass（SC）**——**启用动态供给**：不再由管理员预建 PV，一个指定了 StorageClass 的 PVC 会触发该 class 的 **CSI 驱动**按需**创建 PV**（如调用 AWS API 生成 EBS 卷）。SC 参数化*怎么*建（磁盘类型、IOPS、可用区、加密）。

**访问模式**（PV 支持什么）：
- **RWO**（ReadWriteOnce）——被**一个节点**读写挂载（EBS 等块存储的典型）。
- **ROX**（ReadOnlyMany）——被**多个节点**只读。
- **RWX**（ReadWriteMany）——被**多个节点**读写（需要 NFS/CephFS 等共享存储——EBS 做不到）。
- **RWOP**（ReadWriteOncePod）——被恰好**一个 pod** 读写（比 RWO 更严）。

**回收策略**（PVC 删除后 PV 怎么办）：
- **Retain**——保留卷及其数据（手动清理；对重要数据安全）。
- **Delete**——连底层存储一起删（对短暂/动态卷方便；许多动态 SC 的默认）。

**CSI 驱动**（容器存储接口）做实际的供给/挂接——它们是 Kubernetes 与各存储后端之间可插拔的适配器。

**要点：**
- PV：集群资源；PVC：命名空间内 claim
- StorageClass 启用动态供给
- 访问模式：RWO/ROX/RWX/RWOP
- CSI 驱动做实际供给

---

### 14. 探针：liveness、readiness、startup

**频率：** 高

**题目：** 请解释 Kubernetes 的三种探针，以及误配如何引发问题。

**答案：** 每种探针回答关于容器健康的不同问题，且**失败时后果差别很大**：

- **Readiness 探针——"这个 pod *现在*能服务流量吗？"** 失败时 pod 被**从 Service 的 endpoint 移除**（不再路由流量到它）**但不被杀**。它继续运行，再次通过时重新加入。用于临时不就绪——预热缓存、依赖短暂不可用、关闭前排空。这是滚动更新期间控制流量的机制。
- **Liveness 探针——"这个容器*卡死/死锁*了吗？"** 失败时 Kubernetes **重启容器**。只对**不可恢复的挂起**用它（重启能修的死锁），不要用于瞬时问题。
- **Startup 探针——"这个慢启动应用启动完了吗？"** 它在**通过之前禁用 liveness 和 readiness 检查**，这样启动要 60 秒的应用不会被没耐心的 liveness 探针**过早杀掉**。一旦成功，正常探针接管。

**探针机制：** **HTTP** GET（Web 服务——从 `/healthz` 返回 200）、**exec**（在容器内跑命令——用于 CLI/无 HTTP）、**TCP**（仅检查端口能打开——原始套接字）和 **gRPC**（原生 gRPC 健康检查）。

**误配 → 重启风暴：** 经典故障是 **liveness 探针过于激进**（`timeoutSeconds` 太短、`failureThreshold` 太低）打到一个做*真实工作*（检查 DB）的端点。负载下端点变慢，liveness 探针超时，Kubernetes 重启容器，丢弃在途工作使负载更糟——一个**级联重启循环**。修法：让 liveness **廉价且无依赖**（别在 liveness 里检查下游——那属于 readiness），设**保守的 `failureThreshold`/`periodSeconds`**，慢启动用 **startup 探针**。

**要点：**
- Readiness 控制 Service 成员
- Liveness 在挂时重启
- Startup 保护慢启动
- 误配 -> 重启风暴

---

### 15. requests vs limits；QoS 类

**频率：** 高

**题目：** 请解释 Kubernetes 中的 requests、limits 和三种 QoS 类。

**答案：** **`requests`** 是 pod 被*保证*的量，驱动**调度**——调度器只把 pod 放到未预留容量 ≥ pod requests 的节点上（由于 requests 通常低于 limits，节点可被超售）。**`limits`** 是 cgroup 强制的硬**运行时上限**——超内存 → OOMKilled，超 CPU → 被节流。

**Kubernetes 根据你如何设置这些值推导出一个 QoS（服务质量）类**，它决定驱逐优先级：
- **Guaranteed**——**每个容器的 CPU 和内存都 requests == limits**。最高优先级；被当作"承诺了这些确切资源"。
- **Burstable**——**至少设了一个 request** 但不是 Guaranteed（requests < limits，或只设了一部分）。节点有余量时可从 requests 突发到 limits。
- **BestEffort**——**完全没设 requests 或 limits**。用剩下的任何资源；压力下第一个走。

**节点压力下的驱逐顺序**（如内存压力、磁盘压力）：kubelet 先驱逐 **BestEffort**，然后是**超过其 requests 的 Burstable pod**（超得越多越早），**Guaranteed pod 最后**。所以恰当设置 requests 能保护你的重要 pod。

**为什么延迟敏感服务应设 requests == limits（Guaranteed）：** 当 requests < limits 时，pod 可*突发*，但也会在节点繁忙时遭遇 **CPU 节流意外**并更早被驱逐。设 requests == limits 给出可预测、预留的资源——无节流波动、最高 QoS、最后被驱逐——这正是尾延迟敏感服务所需。代价是更低的集群利用率（那些资源无法超售）。

**要点：**
- requests = 调度；limits = 强制
- QoS：Guaranteed > Burstable > BestEffort
- BestEffort 先被驱逐
- CPU limit 引起节流而非 OOM

---

### 16. affinity、anti-affinity、taint、toleration、nodeSelector

**频率：** 高

**题目：** 请解释 Kubernetes 的调度约束：nodeSelector、affinity、taint 和 toleration。

**答案：** 它们控制 pod *落在哪里*，从最简单到最有表达力：

- **`nodeSelector`**——**最简单**：纯 **label 匹配**。`nodeSelector: {disktype: ssd}` 只把 pod 调度到标了 `disktype=ssd` 的节点上。硬要求，没有细微差别。
- **节点 affinity**——nodeSelector 的**表达性**版本，有两种强度：**`requiredDuringScheduling...`**（硬规则——不满足就不调度）和 **`preferredDuringScheduling...`**（软偏好——加权调度器的选择，但不满足也照样调度）。支持操作符（`In`、`NotIn`、`Exists`）表达丰富条件，如"zone in [us-east-1a, us-east-1b]"。
- **Pod affinity / anti-affinity**——相对**其他 pod**（而非节点 label）调度。**affinity** 共置（"把这个缓存 pod 放到它服务的应用的同一节点/区域"以降延迟）。**anti-affinity** 分散（"绝不把这个 DB 的两个副本放到同一节点/区域"）——**高可用**的关键工具，确保单节点或单 AZ 故障不会拖垮所有副本。用 `topologyKey`（如 `kubernetes.io/hostname` 或 `topology.kubernetes.io/zone`）定义分散域。
- **Taint 与 toleration**——*相反*的机制：**节点上的 taint 排斥**所有 pod，除非它们显式**容忍（tolerate）**。用于**预留专用节点池**：给 GPU 节点打 taint `nvidia.com/gpu=true:NoSchedule`，只有带匹配 toleration 的 GPU 工作负载才落在那里；给 spot/可抢占节点打 taint，只让容错工作负载在其上运行。toleration 不*吸引*——只*允许*——所以要配合节点 affinity/selector 主动把 pod 引导到那些节点上。

**要点：**
- nodeSelector：简单 label 匹配
- Affinity：required vs preferred
- Taint 排斥；toleration 允许
- Anti-affinity = 跨节点/区域 HA

---

### 17. Helm vs Kustomize

**频率：** 高

**题目：** 请对比 Helm 与 Kustomize，团队如何组合使用它们？

**答案：** 它们以**根本不同的方式**解决 Kubernetes 清单管理：

**Helm** 是一个**模板引擎 + 包管理器**。一个 **chart** 是一包模板化 YAML（`{{ .Values.image.tag }}`）加一个默认值 **`values.yaml`**；你把它作为一个 **release**（Helm 在集群内跟踪的命名、带版本的部署）安装。它增加了 **hook**（在安装/升级/删除阶段跑 Job——如升级前的 DB 迁移）和到先前 release 修订版的 **`helm rollback`**。它的强项是参数化和生命周期管理；代价是 Go 模板的复杂性（空白、条件、调试生成的 YAML）。

**Kustomize** 是**无模板、基于 overlay** 的——它内建于 `kubectl`。你有一个纯粹、有效 YAML 的 **`base/`** 和每环境的 **`overlays/`**（dev、staging、prod），后者通过策略合并或 JSON patch **打补丁**特定字段（改副本数、加 label、换镜像 tag）。没有模板语言——一切都是可直接阅读的真实 YAML；代价是对重度参数化或打包不够强。

**各自的胜场：** **Helm** 用于**打包和分发**应用——尤其是**第三方/供应商**软件（Postgres、Prometheus），你想要一个带版本、参数化、可安装的单元。**Kustomize** 用于**一方**应用且**环境差异轻**（"同一份清单，prod 只是更多副本和不同镜像"）。

**组合两者：** 许多团队在 **Helm 输出*之上*跑 Kustomize**——Kustomize 的 `helmCharts` 字段渲染一个供应商 Helm chart，然后在上面应用 Kustomize 补丁，既得到供应商的打包*又*得到干净、无模板的覆盖。**Argo CD 原生支持两者**，所以 GitOps 工作流按应用选用最合适的。

**要点：**
- Helm：模板 + 包管理
- Kustomize：overlay + 补丁、无模板
- 混合：在 Helm 输出上跑 Kustomize
- ArgoCD 原生支持两者

---

### 18. Blue/green 与 canary（Argo Rollouts、Flagger）

**频率：** 高

**题目：** 请对比 blue/green 与 canary 发布，以及工具如何自动化 canary 分析。

**答案：** 两者都是**低风险发布新版本**的策略，但权衡不同。

**Blue/green** 跑**两套完整环境**：**蓝**（当前）和**绿**（新）。你把新版本部署到绿，在所有真实流量仍走蓝时冒烟测试它，然后**翻转 Service selector**（或 LB）指向绿——一次**瞬时、原子的切换**。**回滚也是瞬时的**：翻回蓝。优点：无混版状态、回滚快。缺点：切换期间**2 倍资源**，且切换是全有或全无（翻转那一刻 bug 打到 100% 用户）。

**Canary** 把**一小比例流量**（比如 5%）转到新版本，**观察指标**，健康则逐步**放大**（5% → 25% → 50% → 100%）。优点：限制爆炸半径——坏发布只影响 canary 那一片——且你用*真实*生产流量逐步验证。缺点：你**同时跑混版**（必须兼容），且更慢。

**自动化——Argo Rollouts 和 Flagger：** 人工盯仪表盘并点"晋升"不可扩展，所以这些工具自动化它。你定义一个带**步骤**的 **Rollout**（`setWeight: 10`、`pause`、`setWeight: 50` …）和**分析模板**，后者在每步**查询 Prometheus/Datadog** 看**错误率、延迟（p99）或成功率**。若指标保持在阈值内，工具**自动晋升**到下一权重；若某指标**回归越过阈值**，它**自动回滚**——无需人工介入。**Argo Rollouts** 通过一个 Rollout CRD（替换 Deployment）做到；**Flagger** 是一个控制器，在服务网格或 ingress 之上驱动流量切分。

**要点：**
- Blue/green：通过 selector 瞬时翻转
- Canary：渐进百分比放大
- Prometheus/Datadog 的分析门控晋升
- Argo Rollouts CRD 或 Flagger 控制器

---

### 19. RBAC：Role vs ClusterRole

**频率：** 高

**题目：** Kubernetes RBAC 如何工作——Role vs ClusterRole、绑定和最小权限？

**答案：** RBAC（基于角色的访问控制）管理**谁能对哪些资源做什么**。它有两半：**角色**（一组权限）和**绑定**（哪些主体获得某角色）。

**Role vs ClusterRole——区别在范围：**
- **Role** 授予**单个命名空间内**的权限——如"在 `payments` 命名空间 get/list/watch pod"。
- **ClusterRole** 是**集群范围**的——要么用于集群级资源（node、PV、命名空间本身），要么作为可**按命名空间绑定的可复用模板**。它是你授予非命名空间资源访问，或定义一次角色并在多个命名空间应用的方式。

**绑定把主体链接到角色：**
- **RoleBinding** 在**一个命名空间内**把一个 Role（或限定到该命名空间的 ClusterRole）授予**主体**——**用户、组或 ServiceAccount**。
- **ClusterRoleBinding** 把一个 ClusterRole **集群范围**地授予主体。（主体是认证层的用户/组，或 pod 运行所用的 ServiceAccount。）

**应用 ServiceAccount 的最小权限：** 别把应用绑到 **`cluster-admin`**（一个常见的偷懒错误，会让被攻破的 pod 拿到整个集群）。给每个应用一个**专用 ServiceAccount**，绑到一个限定为**恰好它所需 verb 和资源**的 Role（如只对一个 ConfigMap `get`）。多数应用根本*不*需要 Kubernetes API 访问——那种情况禁用自动挂载 SA token。

**审计有效权限：** 用 `kubectl auth can-i <verb> <resource> --as=system:serviceaccount:<ns>:<sa>` 测试某个具体权限，或 `kubectl auth can-i --list --as=...` 导出某主体能做的一切——这对验证你确实应用了最小权限至关重要。

**要点：**
- Role：命名空间内
- ClusterRole：集群或模板
- 绑定到用户/组/SA
- 用 `kubectl auth can-i` 审计

---

### 20. Pod Pending 诊断清单

**频率：** 高

**题目：** 一个 pod 卡在 `Pending`。请走一遍你的诊断清单。

**答案：** `Pending` 意味着 pod 被**接受但尚未运行**——几乎总是**调度器无法放置它**或某个依赖（卷、镜像）未就绪。**从 `kubectl describe pod <name>` 开始**，读底部的 **Events** 段——它通常直接说明确切原因（如 `0/5 nodes are available: insufficient cpu`）。然后逐一排查常见原因：

1. **CPU/内存不足**——没有节点有足够的**未预留容量满足 pod 的 `requests`**。事件说 `Insufficient cpu`/`Insufficient memory`。修法：降低 requests、加节点，或检查集群 autoscaler 是否本应扩容（见下）。
2. **不可满足的放置约束**——没有节点匹配/容忍的 **`nodeSelector`、节点 affinity 或 taint**。事件：`node(s) didn't match node selector` 或 `had taint {...} that the pod didn't tolerate`。修好 selector 或加 toleration。
3. **PVC 未绑定**——pod 需要卷但 **PVC 绑不上**（无匹配 StorageClass、供给器错误，或存储配额耗尽）。`kubectl describe pvc` 揭示供给器错误。pod 等到卷就绪。
4. **镜像 / ServiceAccount 问题**——镜像拉取问题或 pod 引用的 **ServiceAccount 缺失**都能阻塞启动。
5. **ResourceQuota**——命名空间的**配额耗尽**，于是准入阻止新 pod。事件提到 `exceeded quota`。

**也检查集群 autoscaler：** 若 requests 装不下但集群*本应*扩，检查 **autoscaler 事件/日志**看**扩容失败**（到达最大节点数、无匹配实例类型、云配额超限，或 pod 在*任何*可能节点上都不可调度所以 autoscaler 根本不尝试）。

**要点：**
- 先看 `kubectl describe pod` 事件
- 检查 requests vs 节点容量
- 验证 PVC 已绑且 SC 存在
- 查自动扩缩日志定位扩缩容失败

---

### 21. CrashLoopBackOff 清单

**频率：** 高

**题目：** 一个 pod 处于 `CrashLoopBackOff`。它意味着什么，你如何调查？

**答案：** `CrashLoopBackOff` 意味着容器**启动、退出、Kubernetes 重启它——反复如此**——重启之间有**指数增长的退避**（10s、20s、40s… 最多 5 分钟）以免猛捶节点。这个状态本身不是 bug；它是进程不断死掉的症状。系统地调查：

1. **`kubectl logs <pod> --previous`**——最重要的一步。当前容器可能*刚刚*启动，所以 `--previous` 显示**崩溃的前一实例**的日志——通常就是实际错误（栈追踪、"connection refused"、"missing env var"）。
2. **`kubectl describe pod`**——读**退出码**和 last state。**Exit 0** = 应用完成并退出（也许它不是长期运行进程，或命令配错）。**Exit 137** = SIGKILL，通常是 **OOMKilled**（检查原因）。**Exit 1/2** = 应用错误。非零一般 = 崩溃。
3. **检查 command/args 和配置**——错误的 `command`/`args`、应用启动时需要的**缺失环境变量或 Secret**，或坏的配置文件。也**单独检查 init 容器**（`kubectl logs <pod> -c <init>`）——一个**失败的迁移或初始化 init 容器**会阻塞主容器，看起来像崩溃循环。
4. **OOMKilled / 资源问题**——若 exit 137 带 `OOMKilled`，内存 limit 太低或有泄漏（见 OOM 那题）。
5. **排除过激的 liveness 探针**——一个**在慢启动期间失败的 liveness 探针**会让 Kubernetes 杀掉并重启一个其实正常的容器，伪装成崩溃。若日志显示应用被杀时正在*启动*，修法是 **startup 探针**或更宽松的 liveness 阈值，而非改应用。

**要点：**
- `kubectl logs --previous` 看前次启动
- describe 输出中的退出码
- 单独检查 init 容器
- 排除 liveness 探针杀它

---

### 22. OOMKilled

**频率：** 高

**题目：** `OOMKilled` 意味着什么，你如何处理？

**答案：** `OOMKilled` 意味着容器**超过了其内存 limit**，内核的 **OOM（内存不足）杀手把它终止了**——内存无法节流，所以内核唯一的选择就是杀。`kubectl describe pod` 显示 **`Reason: OOMKilled`** 和 **`Exit Code: 137`**（128 + 信号 9/SIGKILL）。

**两个根本不同的修法——判断该用哪个：**
- **抬高 `limits.memory`**——若应用**确实需要比你分配更多的内存**（你欠配了），这是对的。先测量真实用量。
- **剖析并修复泄漏**——若用量随时间**无界增长**（真正的内存泄漏），这才对。抬高 limit 只会推迟 OOM。用 `kubectl top pod` 快速看，然后做真正的剖析：**pprof**（Go）、**堆转储**（Java）、**`--inspect`/堆快照**（Node）找出在增长的东西。

**关键坑——JVM 和 Node 需要显式堆 flag：** 带**托管堆**的运行时不会自动尊重 **cgroup 内存 limit**（尤其旧版本会把堆按*主机*总 RAM 而非容器 limit 来定）。于是 JVM 抓超过 limit 的内存并被 OOMKilled。**把堆显式设在 cgroup limit *之下***，给非堆内存（栈、metaspace、原生缓冲）留余量：如 `-Xmx`（JVM）或 `--max-old-space-size`（Node）设为容器 limit 的约 70–80%。现代 JVM 也支持 `-XX:MaxRAMPercentage` 按 cgroup limit 相对定堆。

**监控 `container_memory_working_set_bytes`**（不是 RSS——工作集才是 OOM 杀手实际盯的）对比 limit，并在它到 100% **之前告警**，以便在被杀前捕获蔓延。

**要点：**
- Exit 137 = OOM 的 SIGKILL
- 抬高 limit 或修泄漏
- JVM/Node 堆设在 cgroup limit 之下
- 监控 `container_memory_working_set_bytes`

---

### 23. CI vs CD vs 持续部署

**频率：** 高

**题目：** 请辨析持续集成、持续交付和持续部署。

**答案：** 三个不同的实践，常被混为一谈，构成一个**成熟度阶梯**：

- **持续集成（CI）**——开发者**频繁集成到主线**（一天多次），且**每次提交触发自动构建 + 测试**。目标是尽早捕获集成问题，而非痛苦的"合并日"。这纯粹关乎**构建和测试**，与部署无关。
- **持续交付（Continuous Delivery）**——**每个绿色构建都*可部署*到生产**——已打包、经 staging 测试、就绪——但由**人点击"批准"**才真正发布。你*可以*随时发布任何提交；你*选择*何时发。它在 CI 之上加了部署自动化和 staging 门，让代码库始终可发。
- **持续部署（Continuous Deployment）**——**每个绿色构建*自动*部署到生产**，**无手动门**。流水线从提交 → 测试 → 生产，人不插手。这是完全自动化的终态。

**成熟度阶梯是 CI → 持续交付 → 持续部署。** 随着安全网成熟，你逐级攀登。

**持续部署的前提**（为什么不能直接跳到它）：去掉人工门意味着**自动化必须捕获人会捕获的一切**。你需要**强自动化测试**（单元、集成、端到端——高度确信绿色构建是安全的）、**扎实的可观测性**（指标/告警在几分钟内检测坏发布），以及**快速、自动的回滚**（或 canary + 自动回滚这类渐进式交付），使坏部署被遏制并迅速回退。没有这些，自动发布每个提交是鲁莽的；有了它们，则极大缩短前置时间并缩小每次变更的爆炸半径。

**要点：**
- CI = 频繁集成
- CDelivery = 始终可发
- CDeployment = 自动发
- 需要可观测性 + 安全回滚

---

### 24. GitOps（Argo CD、Flux）

**频率：** 高

**题目：** 请解释 GitOps（Argo CD、Flux），以及拉模型为什么重要。

**答案：** **GitOps** 让 **Git 成为集群*期望状态*的单一真相源**。你把 Kubernetes 清单（或 Helm/Kustomize）提交到一个仓库；一个**运行在集群内的控制器**（Argo CD、Flux）**持续调和**实际集群状态使之匹配 Git——若二者偏离，它要么告警要么自动纠正。你不从笔记本或 CI `kubectl apply`；**你 `git push`，集群自行收敛。**

**为什么基于拉很重要：** 传统 CI **推**到集群——这意味着你的 **CI 系统必须持有集群管理员凭证**，一个巨大的攻击面（攻破 CI → 攻破它能触及的每个集群）。GitOps 里**集群从 Git 拉**：控制器跑在集群*内部*并向*外*够到仓库，所以**不需要入站凭证**，集群的写权限保持在内部。对无入站访问、位于防火墙后的集群也能干净工作。

**好处：**
- **审计轨迹**——每次变更都是一个带作者、时间戳、评审和 diff 的 **Git 提交**。你的部署历史*就是*你的 Git 历史。
- **回滚 = `git revert`**——revert 那个提交，控制器就调和回先前状态。无需特殊工具。
- **漂移检测**——若有人手改集群（`kubectl edit`），控制器**检测到与 Git 的偏离**并标记（或还原）它，所以集群不能悄悄偏离其声明状态。
- **多集群扇出**——一个 Git 仓库能一致地驱动多个集群。

**配合 image updater：** 既然 Git 是真相源，CI 构建的新容器镜像必须把它的 tag **写进 Git** 才能部署。一个 **image updater**（Argo CD Image Updater、Flux 的 image automation）监视 registry 并**把新 tag 提交回仓库**，闭合从"CI 构建了镜像"到"GitOps 部署它"的环路，同时保持 Git 权威。

**要点：**
- Git 是真相源
- 基于拉的调和
- 回滚 = `git revert`
- 漂移检测 + 自动同步

---

### 25. Terraform vs Pulumi vs CloudFormation vs CDK

**频率：** 高

**题目：** 请对比 Terraform、Pulumi、CloudFormation 和 CDK 做基础设施即代码。

**答案：** 四种 IaC 工具沿两条轴分野：**声明式 vs 命令式**语言，以及**多云 vs AWS 原生**。

- **Terraform**——**声明式 HCL**（HashiCorp 配置语言）。你描述期望的终态；Terraform 把它与**外部 state** 做 diff 并计算变更。它的杀手锏是通过**庞大的 provider 生态**（AWS、GCP、Azure、Cloudflare、Datadog、GitHub——数千个 provider）实现的**多云覆盖**。state 存在云**外部**（S3、Terraform Cloud），需你管理。云无关 IaC 的事实标准。
- **Pulumi**——在与 Terraform**相同的 provider 模型**之上用**真正的编程语言**（TypeScript、Python、Go、C#）。你原生得到循环、条件、函数和 IDE 支持，而非 HCL 有限的表达力——很适合复杂、动态的基础设施和偏好写代码的团队。取舍：更强的能力也意味着更多写出难维护基础设施的途径。
- **CloudFormation**——**AWS 原生** YAML/JSON，完全由 AWS 管理（state 和锁替你处理）。但它**仅限 AWS**且历史上**支持新服务/特性慢**（服务上线后常有滞后）。手写冗长笨拙。
- **CDK（云开发工具包）**——**命令式代码**（TypeScript、Python），**合成到 CloudFormation**。你用高级构件写真代码；CDK 生成 CFN 模板。开发体验极佳但**以 AWS 为中心**。**CDKTF** 是改为合成到 **Terraform** 的变体，兼得 CDK 的代码工效与 Terraform 的多云覆盖。

**何时选谁：** **Terraform** 用于**多云**或想要最大生态和声明式模型时。**CDK** 若你**仅 AWS** 且有想写真代码的强开发团队。**Pulumi** 若你想要真语言*且*多云。**CloudFormation** 如今很少手写——多作为 CDK 的编译目标。

**要点：**
- Terraform：声明式、多云
- Pulumi：真语言、同 provider
- CloudFormation：AWS 原生、慢
- CDK：代码 -> CFN（以 AWS 为重）

---

### 26. Terraform state、锁、漂移

**频率：** 高

**题目：** 请解释 Terraform 的 state、锁与漂移。

**答案：** **State** 是 Terraform **在你的配置与真实资源之间的映射**——`terraform.tfstate` 记录 `aws_instance.web` 对应真实实例 `i-0abc123` 及其所有已知属性。Terraform 需要它来知道已经存在什么，以便下次 `apply` 时计算 diff（只创建/更新/删除变化的部分）而非重建一切。

**远程存 state，绝不进 Git：** 一个团队**共享一份 state**，故它必须存在**远程后端**——**S3 + DynamoDB 锁表**、**Terraform Cloud** 或 **GCS**。两个不 commit `terraform.tfstate` 的关键理由：(1) 它**明文含密钥**（DB 密码、生成的密钥、私有 IP）——提交它会泄露；(2) 本地 state 不能跨团队协调，导致冲突和损坏。

**锁防止并发 apply：** 若两名工程师对同一 state 同时 `apply`，会竞争并损坏它。后端在 apply 期间取一把**锁**（DynamoDB 条目、Terraform Cloud 锁），使第二个 apply **等待**而非覆盖。这就是 DynamoDB 锁表与 S3 配对的原因。

**漂移**是**真实基础设施偏离 state**——有人在 AWS 控制台手改资源，或外部进程改了它。**检测它**靠跑 **`terraform plan`**：若你在配置里*什么都没改*它却报告拟议变更，那个 diff *就是*漂移（Terraform 想把现实还原回你的声明配置）。团队会跑**计划漂移检测**（CI 里周期性 `plan`）尽早捕获带外变更。

**接纳既有资源：** 用 **`terraform import`** 把在 Terraform 之外（或由其他工具）创建的资源**纳入 Terraform 管理**——它把资源写进 state 使未来 apply 管理它。（较新的 Terraform 也支持声明式 `import` 块。）

**要点：**
- 远程 state 带锁
- 永不 commit state（含密钥）
- 漂移 = plan 与现实的 diff
- `terraform import` 用于接纳现有资源

---

### 27. VPC：子网、路由表、NAT 网关

**频率：** 高

**题目：** 请解释 AWS VPC 的核心构件：子网、路由表、IGW、NAT 网关。

**答案：** **VPC（虚拟私有云）**是你在云上的**隔离私有网络**，由一个 **CIDR 块**定义（如 `10.0.0.0/16`——6.5 万个地址）。你把它切成**子网**，每个**限定在一个可用区（AZ）**（`10.0.1.0/24` 在 AZ-a，`10.0.2.0/24` 在 AZ-b），跨 AZ 铺开以实现**高可用**。

**公/私之分归结于路由**（由每个子网的**路由表**决定）：
- **公子网**有路由 `0.0.0.0/0 → Internet Gateway（IGW）`。IGW 允许**双向**互联网流量，故这里带公网 IP 的资源既能*从*互联网被访问也能*向外*访问。
- **私子网**有路由 `0.0.0.0/0 → NAT Gateway`。NAT Gateway 只允许**仅出站**互联网访问（拉包、调外部 API），但**阻断来自互联网的入站**连接——该子网没有*进*的路径。

**标准拓扑：** 把**工作负载（应用服务器、数据库）放私子网**（不直接暴露互联网——攻击者无法直接触及）、**负载均衡器放公子网**（它们接互联网流量并转发进内部）。这是纵深防御——只有 LB 被暴露。

**NAT Gateway 的坑：** NAT Gateway 是 **AZ 范围**（存在于一个 AZ）。若该 AZ 故障，经它路由的私子网失去出站访问——故为 HA 你需要**每 AZ 一个 NAT Gateway**，每个 AZ 的私子网路由到本地 NAT。此外，NAT Gateway 按 **每 GB 处理 + 按小时**计费，且**经 NAT 的跨 AZ 流量**加数据传输费——对话务繁忙的出站负载常是账单上的惊喜。

**要点：**
- 每 AZ 一子网做 HA
- 公 = IGW 路由；私 = NAT 路由
- 每 AZ 一 NAT GW
- 工作负载在私子网

---

### 28. 日志 vs 指标 vs 链路追踪

**频率：** 高

**题目：** 请辨析日志、指标、追踪三种可观测性信号，以及各自何时用。

**答案：** **可观测性三支柱**，各有不同的形态、成本和最佳用途：

- **日志**——**离散、自由格式（或结构化）、上下文丰富的事件**（"用户 123 在时刻 T 从 IP X 登录失败"）。**细节**最高——你能往一行日志里放任何东西——但**规模化存储和查询昂贵**（索引 TB 级文本代价高；见日志聚合）。最适合在你大致知道往哪看之后，对*已知*事故做**深入细节**。
- **指标**——随时间采样的**数值时间序列**（request_count、cpu_percent、p99_latency）。**便宜且高度可聚合**——你能高效地跨数千实例求和/平均。关键约束：**优先低基数**（少量标签组合）——加一个像 `user_id` 的高基数标签会让序列数爆炸、成本/内存飙升。最适合**仪表盘、SLO 和告警**（"错误率 > 1%"）。
- **追踪**——一棵**每请求的 span 树**，显示**跨服务的因果**：请求进 API 网关（span）→ 调 auth（span）→ 调 DB（span），各带时延。最适合在分布式系统里**定位慢或失败的请求把时间花在*哪里***——这正是指标（太聚合）和日志（无跨服务关联）无法展示的。

**排查时各用哪个：** 一个**指标触发告警**（错误率升）→ 你用**追踪**找*哪个服务/跳*慢或出错 → 你读该服务的**日志**看失败的*完整细节*。指标告诉你*出了*问题，追踪告诉你*在哪*，日志告诉你*是什么*。

**OpenTelemetry（OTel）** 统一了**三者的产生**——一个厂商中立的埋点 SDK 和线协议（OTLP）覆盖指标、追踪、日志——所以你埋点一次即可导出到任意后端（Prometheus、Jaeger、Loki、Datadog），而非用三个独立的私有 agent。

**要点：**
- 指标：便宜、聚合
- 追踪：因果、按请求
- 日志：全细节、贵
- OpenTelemetry：统一生成

---

### 29. Prometheus 拉模型、exporter、recording rule

**频率：** 高

**题目：** 请解释 Prometheus 模型：拉式抓取、exporter、recording rule、长期存储。

**答案：** **拉，不是推：** Prometheus **抓取**——它周期性地 HTTP-GET 每个目标上的 **`/metrics`** 端点并拉取当前指标值（而非目标推给它）。好处：Prometheus 掌控抓取时机、能检测目标*宕机*（抓取失败）、且应用无需知道往哪推。（对无法被抓的短命批处理任务，有 Pushgateway。）

**各类东西如何暴露指标：**
- **应用**用**客户端库**（Go/Java/Python）直接埋点，暴露 `/metrics`。
- **其他一切**——数据库、操作系统、硬件、黑盒端点——由 **exporter** 包装：**`node_exporter`**（主机 CPU/内存/磁盘）、**`blackbox_exporter`**（从外部探测 URL/端口）、**`mysqld_exporter`** 等。exporter 把系统的统计翻译成 Prometheus 格式。
- **服务发现**（Kubernetes、EC2、Consul）随目标上下线自动**找到它们**——在 pod IP 不断变化的动态环境里至关重要。

**Recording rule vs alerting rule：**
- **Recording rule** 按计划**预计算昂贵查询**并把结果存为新时间序列——于是需要 `sum(rate(...))` 跨多序列的仪表盘和告警读一个便宜的预聚合指标，而非每次查询都重算。
- **Alerting rule** 按计划评估 PromQL 表达式并**在其变真时开火**（如 `rate(errors[5m]) > 0.05`），发到 **Alertmanager** 做路由/去重/静默。

**长期存储：** Prometheus 的本地 TSDB 面向**近期**数据（天到周）且不横向扩展。为长保留和全局视图，用**联邦**（更高层 Prometheus 从多个抓取聚合）或 **`remote_write`** 到可扩展后端——**Thanos、Mimir 或 VictoriaMetrics**——它们提供长期存储、降采样和跨多个 Prometheus 实例查询。

**要点：**
- 从 `/metrics` 端点拉
- Exporter 包装未埋点系统
- Recording rule 预计算聚合
- 长期：Thanos / Mimir / VictoriaMetrics

---

### 30. SLI / SLO / 错误预算

**频率：** 高

**题目：** 请解释 SLI、SLO 和错误预算，以及你如何使用预算。

**答案：** 一个把"可靠性"变成**可度量、可行动**之物的层级：

- **SLI（服务水平指标）**——一个反映用户体验的**被度量**的数字：**可用性**（成功请求的比例）、**p99 延迟**、错误率。它是原始信号。
- **SLO（服务水平目标）**——**该 SLI 在某窗口上的目标**："30 天内 99.9% 的请求成功"、"p99 延迟 < 300ms"。它是你承诺的目标。（SLA 是带罚则的*合同*版本——通常比你内部 SLO 更宽松。）
- **错误预算**——**`100% − SLO`** = **允许的不可靠量**。99.9% 可用性 SLO 意味着 **0.1% 错误预算**——大约**每月 43 分钟**你*被允许*花掉的停机。

**错误预算是核心思想——它把可靠性重构为一种*可花费的资源*，而非要最大化的东西：**
- **预算有余**时，你可以**把它花在发布上**——更快发特性、做有风险的迁移、跑实验。*太*可靠（远低于预算）其实说明你走得太慢。
- **预算烧光**时（用掉了那 43 分钟），你**停止有风险的上线**并**把精力转向可靠性**——回到预算内之前不再上新特性。这给开发和运维一个**共享的、客观的决策规则**，而非争论"够稳了吗能发吗？"

**燃烧率告警：** 不是单个请求一失败就告警，而是对**你消耗预算的速度**告警。**多窗口、多燃烧率告警**在检测到**快速燃烧**（如 1 小时内消耗月预算的 2% → 立即呼叫）*和/或* **缓慢燃烧**（如数天内趋向耗尽预算 → 开工单）时开火，用一个短窗口和一个长窗口确认它是真的而非一闪。这在抑制瞬时错误噪声的同时捕获真正威胁预算的问题。

**要点：**
- SLI 度量、SLO 目标
- 错误预算 = 1 - SLO
- 燃烧率告警快速消耗
- 耗尽时停风险变更

---

### 31. 事件响应：严重度、runbook、复盘

**频率：** 高

**题目：** 请解释事件响应：严重度级别、runbook、角色与复盘。

**答案：** 一套用于**快速响应并从故障中学习**的结构化实践：

**严重度阶梯**——分类影响并**触发响应级别**：**Sev1** = 影响客户的故障（主要功能宕机、营收/数据有风险）→ 全员上阵、呼叫所有人、作战室；**Sev2** = 服务降级（慢、部分失败、有绕过办法）→ 紧急但非全员；**Sev3** = 轻微（外观、仅内部、低影响）→ 正常工时处理。正确设置严重度确保你既不反应不足也不反应过度。

**Runbook**——**每个告警都应链到一个 runbook**，带具体的**诊断和缓解步骤**（"若此开火，检查 X，跑 Y，若 Z 则故障转移"）。这让被叫醒的 on-call 工程师立即行动，而非凌晨 3 点逆向工程系统，并沉淀机构知识。

**事件期间的角色**——对任何非琐碎的情况，指派清晰角色使响应不沦为混乱：**事件指挥官（IC）**——协调、决策、拥有响应（不一定是敲修复的人）；**通讯**——负责向利益相关方/状态页更新，使响应者不被打断；**记录员**——记录**时间线**（何时发生什么、尝试了什么）供复盘。

**事后无指责复盘**——约一周内，记录**时间线**、**贡献因素**（刻意*不*叫"根因"——复杂故障有*多个*贡献因素，单一"根因"思维过度简化）和**带 owner、截止日期的行动项**。**无指责**至关重要：聚焦*系统如何允许*失败，而非*谁*犯了错——追责驱使人藏信息、扼杀学习。**难点是把行动项跟踪到完成**——多数团队写出很好的复盘然后从不做后续，于是同一事件复发。像对待任何其他优先工作一样跟踪它们。

**要点：**
- 严重度阶梯触发响应级
- 告警 -> runbook 始终
- 角色：IC、通讯、记录员
- 无指责复盘 + 跟踪行动

---

### 32. 成本优化

**频率：** 高

**题目：** 你如何着手做云成本优化？

**答案：** 一个按影响排序的分层方法：

1. **先右调（最大赢点）**——对比 **实际 vs 请求/供给** 的 CPU 和内存（经 `kubectl top`、成本工具、CloudWatch）并**削减过度供给**。多数浪费是"为保险"把实例/pod 定得比实际用量大 3–5 倍。这通常是单项最大的节省，除了用心之外不花钱。
2. **容错工作负载用 spot/preemptible 实例**——闲置容量实例，**打 6–9 折折扣**，代价是云可能短通知内回收。非常适合**无状态、可重试或批处理**工作（CI runner、无状态 web 层、数据处理）。**Karpenter**（Kubernetes autoscaler）能**自动混合 spot 和按需**——多数 pod 跑 spot，spot 不可用时回落到按需，并跨实例类型分散以减少中断。
3. **为稳定基线做承诺**——对**常开**的最小容量，买 **Reserved Instance、Savings Plan（AWS）或 Committed Use Discount（GCP）**——承诺 1–3 年的基线用量换大折扣。覆盖*基线*，用按需/spot 应对*尖峰*的顶部。
4. **删除浪费**——揪出无声的漏财：**未挂载的 EBS 卷**、**旧快照**、**闲置负载均衡器**、孤立的弹性 IP、通宵未关的 dev 环境。也**给对象存储分层生命周期**——随数据老化把 S3/GCS 移到**低频访问 / 归档层**（Glacier），因为多数存储的数据很少被读。
5. **一切打标签 + 预算告警 + FinOps 文化**——**给每个资源打标签**（团队、服务、环境）以做 **showback/chargeback** 并看清钱花在*哪*。对异常设**预算告警**（每日花费尖峰）。并建立 **FinOps 文化**，让工程师**为自己的成本负责**——成本进仪表盘、成本作为一等指标——而非把账单当财务的问题。

**要点：**
- 先右调（最大赢点）
- 容错用 spot；Karpenter 混合
- 基线 commit（RI/SP/CUD）
- 生命周期存储分层 + 删浪费
- 标签 + 预算告警 + FinOps 文化

---

### 33. 文件描述符与 ulimit

**频率：** 中

**题目：** 什么是文件描述符，你如何处理 `EMFILE` / 提高 `ulimit`？

**答案：** **文件描述符（FD）**是一个**小的非负整数**，索引进内核的**每进程打开文件表**——它是进程用来引用任何已打开 I/O 资源的句柄。按惯例 **0 = stdin，1 = stdout，2 = stderr**；进程之后打开的一切拿到下一个空闲整数。

**关键在于，"文件"是个误称**——FD 代表的远不止磁盘文件：**套接字、管道、epoll/eventfd 句柄、timerfd 和事件通知都消耗 FD**。这就是为什么 FD 上限对**网络服务器**咬得最狠：一台持有 5 万并发连接的服务器就持有 5 万+ 套接字 FD。

**为什么默认上限伤害高连接服务：** 默认**软 `nofile` 上限常常只有 1024**。一个繁忙的代理、数据库或 web 服务器轻易超过它并开始以 **`EMFILE: too many open files`** 失败——`accept()` 失败、新连接被拒、服务降级，即便 CPU/内存都没问题。这是经典的无声扩展墙。

**提高它的方式**（软 ≤ 硬上限）：
- **`ulimit -n <N>`**——针对当前 shell 及其子进程（交互/快速）。
- **systemd 单元**——`[Service]` 段的 **`LimitNOFILE=`**（systemd 管理的守护进程的正确位置；shell 里的 `ulimit` 不影响它）。
- **`/etc/security/limits.conf`**——在登录时为用户/组设 **`nofile`** 上限（基于 PAM）。
- **容器**——**kubelet / 容器运行时（Docker）设置封顶**容器能请求的额度；你可能需要抬高守护进程的 `default-ulimits` 或在 pod spec/运行时配置里设上限，因为容器无法超过运行时允许的。

用 `ls /proc/<pid>/fd | wc -l` 查进程当前的 FD 使用。

**要点：**
- FD 是每进程的整数索引
- `EMFILE` 意味着抬高 `nofile`
- systemd：`LimitNOFILE=`；k8s：容器运行时配置
- 查使用：`ls /proc/<pid>/fd | wc -l`

---

### 34. systemd 单元与 journalctl

**频率：** 中

**题目：** systemd 如何管理服务，你如何用 journalctl 处理日志？

**答案：** systemd 把一切建模为带类型后缀的**单元**：**`.service`**（长期运行或 oneshot 进程）、**`.timer`**（类 cron 调度触发服务——比 cron 有更好的日志和依赖处理）、**`.socket`**（套接字激活——systemd 持有监听套接字并在首次连接时启动服务）、**`.mount`**（文件系统挂载）和 **`.target`**（分组/里程碑如 `multi-user.target`）。

**一个 `.service` 单元文件**（在 `/etc/systemd/system/`）在其 `[Service]` 段声明行为：
- **`ExecStart=`**——要运行的命令。
- **`Restart=`**——韧性策略（**`on-failure`** 是常见选择）加 **`RestartSec=`** 在重启间退避，使崩溃的服务自动恢复而非保持死亡。
- **`User=`**——以非特权用户运行（最小权限）。
- **资源上限**——`LimitNOFILE=`、`MemoryMax=`、`CPUQuota=`（systemd 通过 cgroup 施加）。

**管理单元：**
- **`systemctl daemon-reload`**——编辑单元文件后必需，使 systemd 重读它。
- **`systemctl enable --now foo`**——开机启用*且*立即启动（enable = 开机启动，start = 现在启动）。
- 其余用 `systemctl status/restart/stop foo`。
- **Drop-in**：把覆盖放进 `/etc/systemd/system/foo.service.d/*.conf` 以改一个设置而不编辑厂商单元（能挺过包升级）。

**用 journalctl 查日志：** systemd 服务记录到 **journal**（结构化、有索引）。用 **`journalctl -u foo`**（一个单元）、**`-f`**（实时跟随，类似 `tail -f`）、**`--since "1 hour ago"`** / `--until`、`-p err`（优先级过滤）、`-b`（本次启动）查询。要找**慢启动单元**，用 **`systemd-analyze blame`**（每单元启动时间）和 `systemd-analyze critical-chain`。

**要点：**
- 单元类型：service/timer/socket/mount/target
- `Restart=on-failure` + `RestartSec=` 增强韧性
- `journalctl -u <unit> -f` 看实时日志
- 在 `/etc/systemd/system/foo.service.d/` 用 drop-in

---

### 35. HTTP/1.1 vs HTTP/2 vs HTTP/3

**频率：** 中

**题目：** 请对比 HTTP/1.1、HTTP/2、HTTP/3，以及 gRPC 需要什么？

**答案：** 三代，每代修复前一代的瓶颈：

**HTTP/1.1**——**基于文本**，根本上**每个 TCP 连接一个在途请求**。你可以流水线化请求，但响应必须按序返回，导致**队头（HoL）阻塞**——一个慢响应拖住它后面的一切。浏览器靠**每主机开约 6 个并行连接**绕过，这很浪费（6 倍握手、6 倍拥塞状态）。

**HTTP/2**——**二进制分帧**而非文本，以及大赢点：**在*单个* TCP 连接上多路复用流**。许多请求/响应并发交错，无每请求连接开销。加了 **HPACK 头部压缩**（头部跨请求高度重复——cookie、user-agent——压缩它们省真实带宽）和**服务端推送**（服务器主动发资源；实践中基本被弃用）。**遗留缺陷：** 它仍跑在 **TCP** 上，故单个丢包会拖住*所有*多路复用流——**TCP 层 HoL 阻塞**——因为 TCP 按序交付字节。

**HTTP/3**——跑在 **QUIC over UDP** 而非 TCP 上。QUIC 自己实现流，故丢包只拖住*它自己的*流——**消除 TCP HoL 阻塞**。它还**合并传输 + TLS 握手**以更快建连，包括 **0-RTT** 恢复（对之前见过的服务器在首包就发数据）。适合有损/移动网络。多数 CDN 通过 `Alt-Svc` 头自动协商它。

**gRPC 端到端需要 HTTP/2**——它依赖 H2 的多路复用流和双向流（一个连接上许多并发 RPC、双向流）。这在运维上重要：路径中任何代理/负载均衡器必须支持 H2（并做 L7/gRPC 感知的负载均衡），否则 gRPC 会中断或均衡不佳。

**要点：**
- H1：每连接一个在途
- H2：TCP 上多路复用流、HPACK
- H3：UDP 上 QUIC，无 TCP HoL
- gRPC 端到端需 H2

---

### 36. TLS 握手与证书链

**频率：** 中

**题目：** 请解释 TLS 握手、证书链验证、TLS 1.3 及常见误配置。

**答案：** **握手：** 客户端与服务端**协商密码套件**并**建立共享会话密钥**。现代做法用 **ECDHE**（椭圆曲线临时 Diffie-Hellman）做密钥交换，提供**前向保密**——每会话一个*临时*密钥意味着即便服务器的长期私钥日后被窃，过去录制的会话也**无法**解密（每个用了不同的、已丢弃的临时密钥）。

**证书链验证：** 服务端出示其**叶证书加中间证书**。客户端验证一条**信任链**：叶 → 中间 CA → … → **客户端信任库中的根 CA**。每张证书由上一级签名；根被预信任。客户端还检查：(1) **SAN（主体备用名）匹配它要连的主机名**（CN 字段已遗留、被现代客户端忽略）；(2) **有效期**（未过期/未生效）；(3) 经 **OCSP**（或 OCSP stapling）或 **CRL** 的**吊销**——此证书是否被吊销？

**TLS 1.3 改动：** 通过去掉协商往返把**握手压缩到一个往返（1-RTT）**——恢复用 0-RTT；**去除遗留/弱密码**（无 RSA 密钥交换、无 CBC、无 RC4）；并让**前向保密强制**（总是 ECDHE）。默认更快更安全。

**常见误配置：**
- **缺中间证书**——服务端只发叶，故未缓存中间证书的客户端无法建链（"unable to get local issuer certificate"）。某些浏览器（缓存了中间证书）能用、另一些失败——令人困惑的间歇失败。始终提供完整链。
- **错/缺 SAN**——证书是给 `www.example.com` 的但你连 `example.com`；主机名不匹配错误。
- **过期证书**——经典故障；自动续期（ACME/Let's Encrypt、cert-manager）并在过期前告警。

用 `openssl s_client -connect host:443 -showcerts` 调试。

**要点：**
- 叶 -> 中间 -> 受信根
- SAN 必须匹配主机名（CN 已遗留）
- TLS 1.3 = 1-RTT、强制 PFS
- 调试：`openssl s_client -connect host:443 -showcerts`

---

### 37. SSH 密钥、agent 转发、跳板机

**频率：** 中

**题目：** 请讨论 SSH 密钥、agent 转发和跳板机（ProxyJump）。

**答案：** **密钥：** 优先 **Ed25519**（`ssh-keygen -t ed25519`）而非 RSA——它是现代椭圆曲线算法，**更快、密钥小、安全强**（RSA 需 3072+ 位才等强）。用**口令**保护私钥，使被窃的密钥文件单独无用，并加载到 **`ssh-agent`**，这样你输一次口令，agent 就在内存中持有解密的密钥供后续连接。

**Agent 转发（`ForwardAgent yes`）：** 把你的**本地 agent 套接字转发到远端**，于是从远端你能继续认证（如从服务器 `git clone`）而**无需把私钥拷过去**。方便，但**在共享/不可信主机上有风险**：任何在远端有 **root** 的人都能劫持转发的套接字并**用你的密钥冒充你**去访问你 agent 能触及的一切，只要你还连着。绝不通过你不完全信任的机器转发 agent。

**ProxyJump（`ssh -J bastion target` 或配置里的 `ProxyJump`）**——通过**跳板机**到达私有主机的**更安全替代**。它把连接**隧道穿过**跳板机（它只转发加密流），使你的**认证和密钥终结在*目标*而非跳板机**——跳板机永远见不到你的 agent 套接字或密钥。不像 agent 转发，被攻破的跳板机偷不到你的凭证。这是访问私子网机器的推荐模式。

**在 `~/.ssh/config` 里配可复用的跳：**
```
Host bastion
  HostName bastion.example.com
  User admin
  IdentityFile ~/.ssh/id_ed25519
Host app-*
  ProxyJump bastion
  User deploy
```
现在 `ssh app-1` 自动带正确的用户和密钥跳过跳板机——无冗长命令行，团队间一致。

**要点：**
- Ed25519 > RSA-2048
- 不在不可信主机上做 agent 转发
- `ProxyJump`/`-J` 比转发更安全
- 在 `~/.ssh/config` 中配 `Host`、`User`、`IdentityFile`

---

### 38. Distroless vs scratch vs alpine

**频率：** 中

**题目：** 请对比 distroless、scratch 和 alpine 基础镜像，以及你如何调试 distroless？

**答案：** 三种极简容器基础镜像方案，在体积与可调试性之间权衡：

- **`scratch`**——**空镜像**：字面上什么都没有，只有你的二进制。只适用于**完全静态的二进制**（`CGO_ENABLED=0` 的 Go、静态 Rust）。**最小最安全**（零包 = 近零 CVE，无 shell 供攻击者利用）但**最难调试**——无 shell、无 `ls`、无 libc、无 CA 证书（要让 TLS 工作你得自己拷进去）。
- **distroless**（`gcr.io/distroless/*`）——包含你应用所需的**最小运行时**——**libc、CA 证书**、时区数据，以及可选的语言运行时（`distroless/java`、`distroless/python3`）——但**无包管理器、无 shell**。多数生产的甜蜜点：攻击面小，适用于动态链接二进制和解释型应用，仍无 shell 给攻击者。
- **alpine**——一个微型真发行版：**musl libc、busybox**（最小 shell + coreutils）和 **`apk`** 包管理器。仅约 5MB 且你*可以* shell 进去装工具。代价：**musl libc ≠ glibc**，故 **glibc 编译的二进制在 alpine 上可能出问题**，且 musl 历史上有 **DNS 解析怪癖**（search 域行为不同、旧版无并行 A/AAAA）导致微妙网络 bug。它的 `apk` 包也与 Debian/Ubuntu 不同。

**该选哪个：** **生产用 scratch 或 distroless**——攻击面最小、CVE 更少、更小更快。**当你确实需要镜像里有包管理器或 shell 时用 alpine**，接受 musl 边缘情况（或用 `debian:slim` 这类精简 glibc 发行版）。

**调试 distroless（或 scratch）镜像**——既然无 shell，用**临时调试容器**：`kubectl debug -it <pod> --image=busybox --target=<container>` 挂一个**共享目标命名空间**（进程、网络）的临时容器，于是你在运行容器*旁*有了工具，而无需把 shell 烤进生产镜像。`docker` 用户可类似地把调试容器挂到目标的命名空间。

**答案：** `scratch` 是空——只你的静态二进制；最小最安全但无 shell 或 libc，难调试。Distroless 包含最小运行时（libc、CA 证书，可选 Python/Java），无包管理器和 shell。Alpine 加 musl libc、busybox 和 apk；小但 musl 可能让 glibc 编译的二进制崩（DNS 怪癖）。生产选 scratch/distroless，需要包管理器时选 alpine。

**要点：**
- scratch：仅静态二进制，~MB
- distroless：libc + CA，无 shell
- alpine：musl + apk，注意 DNS 边缘情况
- 调试 distroless 通过 `kubectl debug` 临时容器

---

### 39. 镜像标签规范

**频率：** 中

**题目：** 请讲解生产环境的镜像标签规范：(1) 为什么应避免使用可变、不可钉死的 latest，(2) 如何用不可变标识打标（语义版本、git SHA、构建日期）并 push 多个指向同一 digest 的标签让消费者在稳定与新鲜之间选，(3) 为什么生产部署应用 digest（image@sha256:...）钉死实现真正的不可变，以及镜像仓库不可变标签策略的作用。

**答案：** 生产避免 `latest`——它可变且不可钉死。用不可变标识打标：语义版本（`1.4.2`）、git SHA（`sha-abc1234`）或构建日期。push 多个指向同一 digest 的标签（`1.4.2`、`1.4`、`1`、`sha-...`），让消费者在稳定与新鲜之间选。生产部署用 digest 钉死（`image@sha256:...`）做真正的不可变。

**要点：**
- 永不部署 `:latest`
- 组合 semver + SHA 标签
- manifest 中按 digest 钉死
- 用镜像仓库不可变标签策略

---

### 40. 卷 vs 绑定挂载 vs tmpfs

**频率：** 中

**题目：** 请对比 Docker 卷、绑定挂载、tmpfs 及它们的 Kubernetes 对应。

**答案：** 三种在容器短暂可写层之外给它存储的方式，差别在*数据住哪*和*谁管理*：

- **卷**——**Docker 管理**的存储（在 `/var/lib/docker/volumes/`），带**驱动支持**（本地、NFS、云块存储）。Docker 拥有生命周期；你按名引用而非主机路径。**可移植且是推荐默认**——容器不依赖主机目录布局，且驱动让同一卷背靠网络/云存储。
- **绑定挂载**——把**具体主机路径直接**挂入容器（`-v /host/path:/container/path`）。**灵活**（很适合**本地开发**——挂你的源代码使编辑在容器内实时可见）但**把容器与主机文件系统布局耦合**——路径必须在每台主机存在，权限/SELinux 能咬你，且跨机器不可移植。
- **tmpfs**——**仅内存**存储，**从不碰磁盘**且容器停时消失。**理想用于密钥**（不想持久化的解密凭证）和**热临时数据**（临时文件、缓存），想要速度且不留磁盘痕迹。消耗 RAM。

**Kubernetes 对应：**
- 卷 → **PersistentVolume/PVC**（托管、可移植、驱动支撑——最接近的对应）。
- 绑定挂载 → **`hostPath`**（挂节点路径；同样的主机耦合顾虑，生产中因同样的可移植/安全理由一般不推荐）。
- tmpfs → **`emptyDir` 带 `medium: Memory`**（RAM 支撑的短暂临时空间，在 pod 内共享）。

**要点：**
- 卷：托管、可移植
- 绑定挂载：主机路径、与主机耦合
- tmpfs：仅 RAM、短暂
- k8s 等价：PV/hostPath/emptyDir

---

### 41. Docker 网络驱动

**频率：** 中

**题目：** 请走一遍 Docker 网络驱动，以及 Kubernetes 如何用 CNI 替代它们。

**答案：** Docker 内置驱动覆盖不同网络需求：

- **`bridge`**（默认）——用 Linux bridge **每主机创建一个私有虚拟网络**；容器得内部 IP，经 **NAT**（通过主机 IP 做源 NAT）到达外部。端口发布（`-p 8080:80`）设置 DNAT。隔离好，但 NAT 隐藏容器 IP 并加小开销。
- **`host`**——容器**直接共享主机网络命名空间**：无隔离、无 NAT，容器像主机进程一样绑主机端口。**获得全网络性能**并避免 NAT 怪癖；**放弃隔离**和端口冲突安全。
- **`overlay`**——通过把流量封进 **VXLAN** 跨**多主机**，使不同机器上的容器共享一个虚拟网络（Docker Swarm 多主机服务用）。
- **`macvlan`**——给每个容器**直接在物理 LAN 上的自己的 MAC 和 IP**，作为网络上真实设备出现（对期望真实 L2 存在的遗留系统有用）。
- **`none`**——完全禁网络（只有环回）——用于完全隔离的工作负载。

**Kubernetes 用 CNI（容器网络接口）插件替代所有这些。** 不是每主机 bridge + NAT，Kubernetes 强制**扁平网络模型**：**每个 pod 得自己的网络命名空间和一个集群范围可路由的唯一 IP**，pod 间**无 NAT** 通信（pod 到 pod 用真实 IP）。一个 **CNI 插件**（Calico、Cilium、Flannel、AWS VPC CNI）实现它——接线每个 pod 的 netns、分配 IP、设路由/overlay（或原生 VPC 路由），使任一 pod 能直接到达任一 pod。这个扁平、无 NAT 的模型正是让 Service、网络策略和服务发现统一工作的基础。

**要点：**
- bridge = 默认 NAT
- host = 无隔离、最快
- overlay = 多主机 VXLAN
- macvlan = 容器在物理 LAN

---

### 42. docker compose

**频率：** 中

**题目：** 什么是 Docker Compose，它定义什么，何时该升级到 Kubernetes？

**答案：** **Compose** 在**单个 `docker-compose.yml`** 中定义**多容器应用**并在**一台主机**上运行它。它是用一条命令拉起应用加其依赖（应用 + Postgres + Redis）的标准方式。

**YAML 定义什么：**
- **`services`**——每个容器（镜像、端口、命令、环境）。
- **`networks`**——Compose 自动建网，使服务**按服务名**作为主机名互达（`db:5432`）。
- **`volumes`**——用于持久化的命名卷。
- **`env`**——环境变量（常来自 `.env` 文件）。
- **`depends_on`**——启动顺序——重要的是配 **`condition: service_healthy`** 可在依赖的**健康检查**通过前不启动某服务（使应用不在 DB 就绪前启动）。
- **`healthcheck`**——每服务就绪检查。

**命令：** `docker compose up -d` 起整个栈（分离）；`docker compose down -v` 拆它并删卷。

**Profiles：** `profiles:` 给可选服务打标，使 `docker compose --profile debug up` 仅在请求时包含附加项（调试 UI、seed 任务）——保持默认栈精简。

**何时适合 vs 升级：** Compose 极适合**本地开发**和**小型单主机部署**——简单、快、无集群要跑。但它**无多主机编排、无自愈/重调度、无跨节点滚动更新或自动扩缩**。当你需要**生产多主机**——跨机 HA、节点故障自动重调度、水平扩展、滚动部署——**升级到 Kubernetes**（或 Nomad）。经验法则：dev 和单机玩具生产用 Compose；正常运行时间和规模要紧时用 Kubernetes。

**要点：**
- 一个 YAML、多个服务
- `depends_on: condition: service_healthy` 顺序
- Profiles 做可选栈
- 真生产编排用 Kubernetes

---

### 43. 镜像漏洞扫描

**频率：** 中

**题目：** 你如何做镜像漏洞扫描，为什么要按计划扫 registry？

**答案：** **工具扫什么：** **Trivy、Grype、Snyk** 分析**镜像层**中的**已知 CVE**，涵盖 **OS 包**（基础镜像里的 `apt`/`apk` 包）**和语言依赖**（应用里的 npm、pip、Go 模块）。它们把软件物料清单对照漏洞库（NVD、GitHub 公告）并报告每项发现的严重度，关键是**是否有修复版本存在**。

**作为必备 CI 检查集成：** 每次构建跑扫描，并对**有修复可用**的 high/critical CVE **失败构建**——"有修复版本"这个限定很重要，因为对无法修复的 CVE 失败只会堵住你却无解（更好是接受/记录它们）。这把安全左移——漏洞在部署前被捕获，而非在季度审计里。

**扫的不止 CVE：** 也跑**误配检查**（Dockerfile lint——以 root 运行、用 `latest`、从 URL `ADD`）和**密钥检测**（意外烤进层的 API key 或私钥——很常见的泄露）。生成 **SBOM**（软件物料清单）使你有一份出货一切的清单，新 CVE 出现时能快速回答"我们受影响吗？"

**为什么排期重复扫 registry（不只在 push 时）：** 镜像是**冻结快照**，但**新 CVE 每天被披露**，针对该镜像已含的软件。构建时扫描干净的镜像可能**数周后在其中发现严重漏洞**——字节没变，*已知*威胁变了。故**持续重扫 registry 中的镜像**以捕获已部署镜像里新披露的 CVE，并告警使你能重建/打补丁。只在 push 时扫给长寿镜像一种虚假的安全感。

**要点：**
- Trivy/Grype 扫 OS + 语言依赖
- 可修复的 high/critical 失败 CI
- 持续扫 registry，不仅在 push 时
- 配合 SBOM 生成

---

### 44. 非 root、丢能力、只读 rootfs

**频率：** 中

**题目：** 你如何加固容器以非 root、低权限运行，为什么？

**答案：** 纵深防御：假定应用*会*被攻陷，并**最小化攻击者所得**。若干层，在 Dockerfile 和 Kubernetes `securityContext` 中施加：

**1. 以非 root 运行。** Dockerfile 里 `USER 10001`（非零 UID）使进程不是 root。Kubernetes 里强制它：
```yaml
securityContext:
  runAsNonRoot: true      # 若镜像以 root 运行则拒绝启动
  runAsUser: 10001
```
为什么：若攻击者从应用逃进容器，他们是**非特权用户**而非 root——能干的少得多，且容器逃逸利用往往*需要*容器内 root。

**2. 丢弃所有能力并阻止提权：**
```yaml
  allowPrivilegeEscalation: false      # 不能经 setuid 二进制获得更多权限
  capabilities:
    drop: ["ALL"]                       # 移除所有 Linux 能力
    # add: ["NET_BIND_SERVICE"]         # 只加回真正需要的
```
Linux **能力**是细粒度的 root 权力（绑低端口、加载模块、改所有权）。多数应用**一个都不需要**——丢 `ALL` 只加回所需那个（如 `NET_BIND_SERVICE` 绑 80 端口）。这极大缩小特权面。

**3. 只读根文件系统：**
```yaml
  readOnlyRootFilesystem: true
```
使容器文件系统**不可变**，故攻击者**无法写恶意二进制、改配置或投放 web shell**。对需要写的应用（如 `/tmp`、缓存目录），**把那些特定路径挂为可写 `emptyDir` 卷**——其余保持只读。

**为什么这减小爆炸半径：** 每层移除攻击者会用的一件工具——非 root 移除特权动作、丢能力移除内核权力、只读 rootfs 移除持久化和写载荷。本会是完整容器接管的攻陷变成一个被遏制、低权限、无处可去的立足点。（用 Pod Security Standards / 准入策略在全集群强制这些，使无工作负载跳过。）

**要点：**
- 以非 root UID 运行
- 丢 ALL 能力，只加需要的
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`

---

### 45. PID 1 问题与 tini

**频率：** 中

**题目：** 请解释容器中的 PID 1 问题，以及 tini / `--init` 如何解决它。

**答案：** 在 Linux 中，**PID 1 很特殊**——它是 **init 进程**，有普通进程没有的两项职责：(1) **回收僵尸**——当*任何*进程的父死亡，其孤儿子进程被重新挂到 PID 1 名下，PID 1 必须在它们退出时 `wait()` 它们，否则它们变**僵尸**（泄露进程表的 defunct 条目）；(2) **默认信号处理**——PID 1 *不*获得内核的默认信号动作，故它必须**显式处理 SIGTERM**，否则信号就被直接忽略。

**为什么这在容器里出问题：** 在容器里，**你的应用*就是* PID 1**。许多应用运行时（Node、Python、JVM）**从未为做 init 而写**——它们不回收被重挂的孙进程（僵尸堆积），更糟的是它们**默认不处理 SIGTERM**，所以 `docker stop` / Kubernetes 优雅终止的 SIGTERM 被**忽略**，容器挂满整个宽限期，然后被 **SIGKILL**——没有干净关停（在途请求被丢、连接未排水）。**Shell 形式 ENTRYPOINT** 更糟：它在 `/bin/sh -c` 下跑你的应用，所以 **shell 是 PID 1** 且通常**根本不转发信号**给你的应用。

**修法——一个小 init 作 PID 1：** 用 **`tini`** 或 **`dumb-init`**，它们是正确回收僵尸并向你应用转发信号的极简 init 程序：
```dockerfile
ENTRYPOINT ["tini", "--", "node", "server.js"]
```
现在 `tini` 是 PID 1，回收僵尸，并把 SIGTERM 转发给你的 Node 进程以干净关停。

**Docker 的 `--init` 标志**（`docker run --init`）**自动注入 tini** 作 PID 1 而不改你的镜像——方便。Kubernetes 里没有 `--init` 标志；要么把 `tini` 烤进镜像，要么确保你的应用*确实*处理信号并回收子进程。**没它，优雅关停失败且僵尸泄露**——正是卡住 `terminating` 的 pod 的症状。

**要点：**
- PID 1 必须回收僵尸 + 处理信号
- Shell 形式 ENTRYPOINT 破坏信号转发
- 用 `tini`/`dumb-init` 或 `docker run --init`
- 没它优雅关停会失败

---

### 46. 健康检查：Dockerfile vs 编排器

**频率：** 中

**题目：** 请对比 Dockerfile HEALTHCHECK 与编排器健康探针——为何 Kubernetes 忽略前者？

**答案：** **Dockerfile `HEALTHCHECK`** 把健康检查烤*进镜像*：`HEALTHCHECK CMD curl -f http://localhost/health || exit 1`。Docker 周期性跑它并（在 `--retries` 后）标记容器 **`healthy`/`unhealthy`**。它在 `docker ps` 可见并驱动 Docker/Swarm 行为。

**Docker Compose** 能利用它：`depends_on: {db: {condition: service_healthy}}` 在启动依赖服务前**等依赖的健康检查通过**——解决"应用在 DB 就绪前启动"。

**Kubernetes 完全*忽略* Dockerfile HEALTHCHECK** 而用自己的 **pod-spec 探针**：**`livenessProbe`**（失败则重启）、**`readinessProbe`**（失败则从 Service 端点移除）、**`startupProbe`**（保护慢启动）。为何刻意分开？Kubernetes 需要比单个 healthy/unhealthy 位**更丰富、编排级的语义**：它区分"重启我"（liveness）、"停止向我路由流量"（readiness）、"我还在启动"（startup）——Docker 健康检查无法表达的概念。它还想把健康配置放在**声明式 pod spec**（可版本化、按环境调）而非冻进镜像。故镜像级健康检查干脆不被查阅。

**三者可用的探针机制：** **exec**（跑命令）、**HTTP** GET、**TCP** 套接字连接、**gRPC** 健康检查——按应用类型选。

**跨编排器保持逻辑一致：** 若同一镜像既在 Compose（用 HEALTHCHECK）又在 Kubernetes（用探针）下跑，把它们指向**同一个 `/health` 端点和标准**，使"健康"到处一个意思——否则你得到令人困惑的环境特定行为。并调 `initialDelaySeconds`/`startupProbe` 使慢启动不触发重启循环。

**要点：**
- Dockerfile HEALTHCHECK 被 k8s 忽略
- k8s：liveness/readiness/startup 探针
- 探针可为 exec/HTTP/TCP/gRPC
- 调 `initialDelaySeconds` 避免重启循环

---

### 47. docker exec vs run vs attach

**频率：** 中

**题目：** 请对比 `docker run`、`docker exec`、`docker attach`，调试该用哪个？

**答案：** 三个命令常被混淆，因为都能给你一个终端，但做的事不同：

- **`docker run`**——从*镜像***创建并启动一个*新*容器**。`docker run -it ubuntu bash` 造一个全新容器。它是唯一涉及镜像的；另两个对**已在运行的容器**操作。
- **`docker exec`**——**在已运行的容器内启动一个*额外*进程**。`docker exec -it <container> sh` 给你一个**与已运行应用并行**的交互 shell——应用不受扰地继续跑；你只是在它的命名空间里生成了第二个进程。这是**调试主力**：shell 进去、看文件、跑诊断，然后退出——容器不受影响。
- **`docker attach`**——**把你的终端连到容器现有 PID 1 的 stdio**（主进程的 stdin/stdout/stderr）。你不启动任何新东西——你接入*主*进程的流。坑：**Ctrl-C 向 PID 1 发 SIGINT**，常常**杀掉容器**（因为 PID 1 *就是*应用）。用 `Ctrl-P Ctrl-Q` 序列安全脱离，而非 Ctrl-C。

**调试优选 `docker exec -it <container> sh`**——安全（不影响运行的应用）且给你完整 shell。**把 `attach` 留给**你确实需要看或交互 **PID 1 自己输出/输入**的少见情况（如作为主容器进程跑的 REPL 或交互进程）。（Kubernetes 中对应是 `kubectl exec`，对无镜像/distroless 容器用 `kubectl debug` 临时容器。）

**要点：**
- `run`：从镜像起新容器
- `exec`：运行容器内的额外进程
- `attach`：连到 PID 1 stdio
- `exec -it sh` 临时调试

---

### 48. Registry 选择

**频率：** 中

**题目：** 请讨论容器 registry 选择，以及你如何处理气隙环境和 Docker Hub 速率上限。

**答案：** 格局涵盖托管、云原生和自托管：
- **Docker Hub**——默认公共 registry，但**免费层有 pull 速率上限**（匿名/免费账号 pull 被限速），反复拉基础镜像的 CI 会中招。
- **GitHub Container Registry（`ghcr.io`）** 和 **GitLab Registry**——与各自的 **CI**（Actions / GitLab CI）紧密集成，流水线内认证自动。
- **云原生**——**AWS ECR、Google Artifact Registry、Azure ACR**——与云的 IAM 集成（pod 用实例/工作负载身份 pull，无静态凭证），支持地理复制，且紧邻工作负载（拉取快、无出站）。
- **自托管**——**Harbor**（开源，内置**漏洞扫描、复制、RBAC、签名**）或 **JFrog Artifactory**（多制品类型）——用于完全控制、本地部署或企业策略。

**考量标准：** **CI 认证集成**（流水线能否干净认证？）、**地理复制**（多区域集群的 pull 时延）、**内置漏洞扫描**、**签名/策略**支持、**成本**（存储 + 出站）。

**气隙环境：** 无互联网的集群无法从公共 registry 拉，故你**把上游镜像镜像到内部 registry**（Harbor/Artifactory）——通过受控边界拉取一次所需镜像，内部存储，并把所有工作负载指向内部镜像。配合只允许内部 registry 的准入策略。

**Docker Hub 速率上限：** 避免在 CI 从 Docker Hub 拉，把基础镜像**镜像/缓存**到自己的 registry（或用直通缓存如 Harbor 的代理缓存或云 registry 的远程仓库），并认证（认证 pull 限额更高）——使 CI 构建的突发不碰匿名上限而以 `toomanyrequests` 开始失败。

**要点：**
- 云原生：ECR/Artifact Registry/ACR
- 自托管：Harbor、Artifactory
- 气隙构建镜像上游
- 注意 Docker Hub pull 速率上限

---

### 49. Ingress vs Gateway API

**频率：** 中

**题目：** 请对比 Ingress 与 Gateway API，新部署该瞄准哪个？

**答案：** 两者都把集群内 Service 暴露给外部 HTTP(S) 流量，但 Gateway API 是现代替代品。

**Ingress** 是**遗留 L7 API**。它定义 host/path → Service 路由，但规范**极少**，故每个控制器（NGINX、Traefik、ALB）都通过**供应商特定注解**（`nginx.ingress.kubernetes.io/...`）实现高级特性。这造成两大问题：**可移植性差**（为 NGINX 调的 Ingress 在 Traefik 上行为不同——注解非标准）和**没有干净模型**处理基本 HTTP 之外的东西（TCP/UDP、TLS 直通、流量切分、按头路由都需黑客手段或 CRD）。

**Gateway API** 是**官方继任者**——设计上供应商中立且表达力强。两个关键改进：
- **角色导向拆分**为由不同团队拥有的独立资源：**`GatewayClass`**（控制器/基础设施类型，由**基础设施/平台**团队拥有）、**`Gateway`**（实际监听器——端口、TLS——由**集群运维**拥有）、**`HTTPRoute`**（路由规则，由**应用团队**拥有）。这让应用开发者管自己的路由而不碰集群级 LB 配置，带恰当 RBAC 边界——Ingress 无法干净做到的。
- **一等支持** **TCP/UDP/TLS 路由**、**加权流量切分**（原生 canary——带后端权重的 `HTTPRoute`，无注解）和**按头路由**——全在标准规范里，故行为**跨控制器可移植**。

**新部署应瞄准 Gateway API**（在你控制器支持处——Envoy Gateway、Istio、Contour、NGINX 都有 Gateway API 实现）。它是面向未来、可移植、角色适当的选择；Ingress 留给现有设置和简单情况。

**要点：**
- Ingress = 遗留、注解重
- Gateway API = 角色划分、可移植
- HTTPRoute 支持加权流量
- 控制器：Envoy Gateway、Istio、Contour、NGINX

---

### 50. HPA vs VPA vs Cluster Autoscaler vs Karpenter

**频率：** 中

**题目：** 请对比 HPA、VPA、Cluster Autoscaler 和 Karpenter——各自扩哪根轴？

**答案：** 四个自动扩缩器在**两根不同轴**上——pod vs 节点——且*协同*工作：

**Pod 级（扩工作负载）：**
- **HPA（水平 Pod 自动扩缩）**——基于 **CPU、内存或自定义/外部指标**（每秒请求数、队列深度）上下扩 **pod 副本数**。更多负载 → 更多 pod。扩无状态服务的主要方式。
- **VPA（垂直 Pod 自动扩缩）**——通过观察实际用量随时间**右调 pod 的 CPU/内存 *requests***。适合不易副制的工作负载（某些有状态/单例应用）。**注意：不要在*同一指标*上同时跑 VPA 和 HPA**——它们会打架（VPA 改 requests，而 requests 变了 HPA 据以扩缩的 CPU% 也变，引发振荡）。常把 VPA 跑在**仅推荐模式**以告知 requests 而不自动施加。

**节点级（扩集群）：**
- **Cluster Autoscaler（CA）**——当 pod **无法调度**（因无容量而 Pending）或节点低利用时**增/删节点**。但它在**预定义节点组 / ASG** 内工作——你必须预先设好实例类型组，它只扩缩这些组的数量。
- **Karpenter**——**无组**节点自动扩缩器（AWS 起源）：不扩固定节点组，而是看 pending pod 并**按需供给*恰好*的实例类型**——选尺寸、**混 spot 和按需**以最小化成本并契合确切的资源形状。比 CA 更快更高效（无预定组、更好的装箱、合并）。

**它们如何组合：** HPA（或 VPA）扩 pod；当 pod 装不下，**CA 或 Karpenter** 扩节点腾地方。**现代 AWS 组合是 HPA + Karpenter**——HPA 在负载下加副本，Karpenter 变出最优（常是 spot）节点来承载，负载降时再合并。

**要点：**
- HPA 水平扩 pod
- VPA 调 requests；同指标避免与 HPA 同用
- CA 在 ASG 内扩节点
- Karpenter：无组、类型最优节点

---

### 51. PodDisruptionBudgets

**频率：** 中

**题目：** 请解释 PodDisruptionBudget——它防什么、不防什么。

**答案：** **PodDisruptionBudget（PDB）**限制一个应用的 pod 能**一次性**被**主动**取下多少个，确保你在干扰性维护期间保留足够副本服务。你声明 **`minAvailable`**（至少保持 N 个 pod）或 **`maxUnavailable`**（一次最多驱逐 N 个）。

**例子：** 3 副本部署配 `minAvailable: 2` 意味着只有当**至少 2 个 pod 保持运行**时才允许驱逐——故**一次最多驱逐一个 pod**，且下一个在替代 Ready 前不会被驱逐。这防止节点排空同时携掉全部 3 副本而造成故障。

**关键区分——自愿 vs 非自愿干扰：**
- **PDB 防*自愿*干扰**——Kubernetes *发起且能节流*的操作：**`kubectl drain`**（为维护排空节点）、**节点升级/滚动**、**Cluster Autoscaler / Karpenter** 缩容/合并节点。这些尊重 PDB——宁可**等**也不违反它，故自动扩缩器若排空节点会破预算就不排。
- **PDB 不防*非自愿*干扰**——无人调度的事：**节点硬件崩溃**、内核 panic、网络分区或 OOM 杀。没有驱逐请求可阻——pod 就直接死。PDB 阻不了。

**含义：** PDB 对生产中**安全的滚动节点升级必不可少**（没它，一次 drain 可一次驱逐全部副本）。但因为它不盖崩溃，你**还**需要**多副本跨区域分散**（通过拓扑分散约束 / 反亲和性），使*非自愿*的 AZ 或节点故障不会携掉一切。也当心 `minAvailable` == 副本数——那会**阻止所有自愿驱逐**并死锁节点排空。

**要点：**
- 只保护自愿干扰
- `minAvailable` 或 `maxUnavailable`
- 安全滚动节点升级必需
- 配合多区域拓扑分散

---

### 52. Init 容器 vs Sidecar 容器

**频率：** 中

**题目：** 请对比 init 容器与 sidecar 容器，包括原生 sidecar（K8s 1.28+）。

**答案：** 两者都是 pod 里的辅助容器，但**生命周期相反**：

**Init 容器**在应用容器启动*前***顺序、运行到完成**——每个必须成功退出下一个才跑，全部完成后主容器才启动。用于**一次性设置**：跑**数据库迁移**、**等依赖**可达（阻到 DB 响应）、**取配置/密钥**到共享卷，或设文件权限。若 init 容器失败，pod 不启动——它是硬前提门。

**Sidecar 容器**在 pod 整个生命里**与主容器并行运行**，**共享其网络命名空间和卷**。经典用法：**日志发送器**（Fluent Bit 读应用的日志卷）、**服务网格代理**（Envoy 通过共享 netns 拦流量）或**配置重载器**。它们是长期运行的伙伴，非跑一次的设置。

**原生 sidecar 解决的旧问题：** 在原生支持前，"sidecar"只是 pod 里普通应用容器，造成**生命周期 bug**——如 sidecar（代理）可能**在主应用启动前未就绪**（早期请求失败），或 sidecar 可能**在主容器排水完前退出**（丢最后日志 / 关停时破网格），且 Job 里 pod 因 sidecar 不退而无法完成。

**Kubernetes 1.28+ 原生 sidecar** 修好这些：你把 sidecar 声明为带 **`restartPolicy: Always` 的 `initContainer`**。这个特殊 init 容器**在主容器前启动**（代理/日志先就绪）但**持续运行**并**存活到主容器启动之后**，关停时在主容器**之后才终止**——给出正确的"先启动、后停止"顺序。它还让 Job 能完成（主容器完成时原生 sidecar 被信号停止）。这是现在跑 sidecar 的正确方式。

**要点：**
- Init：一次性设置、顺序
- Sidecar：生命周期附着的辅助
- 原生 sidecar 通过 init + `restartPolicy: Always`
- Sidecar 与主共享网络/卷

---

### 53. NetworkPolicy 与默认拒绝

**频率：** 中

**题目：** 请解释 Kubernetes NetworkPolicy 与默认拒绝模式。

**答案：** **关键默认：所有 pod 能与所有 pod 通信。** 开箱即用时，Kubernetes 网络是**扁平且完全开放**的——任一 pod 能连任何命名空间里的任何其他 pod。方便但不安全：被攻陷的 pod 可自由探测并到达整个集群（横向移动）。

**NetworkPolicy 约束它。** 它按标签**选定 pod** 并定义**允许的 ingress 和/或 egress**——一旦*任何*策略选中某 pod，该 pod 对所盖方向就从 allow-all 切为**"除显式允许外拒绝一切"**。策略是**叠加**的（allow-list 并集）。

**推荐模式是默认拒绝 + 定向允许。** 先施加一个选中所有 pod 且什么也不允许的**命名空间级默认拒绝**：
```yaml
spec:
  podSelector: {}          # 选中命名空间里每个 pod
  policyTypes: [Ingress, Egress]
  # 无 ingress/egress 规则 = 拒绝全部
```
然后按应用**分层显式 allow 策略**："前端 pod 可在 8080 达后端"、"后端可 egress 到数据库和 DNS"。这是**零信任网络**——除非声明否则不可达——故被破 pod 只能到其策略允许的，极大限制爆炸半径。（记得允许 **egress 到 CoreDNS 的 53 端口**，否则默认拒绝 egress 下名字解析就坏——经典的坑。）

**需要策略感知的 CNI：** NetworkPolicy 只是个 *API*——**CNI 插件必须执行它**。Flannel（基础）不行；**Calico 和 Cilium** 行。若你的 CNI 忽略策略，它们默默无效——危险的虚假安全感。

**Cilium 加 L7 策略：** 标准 NetworkPolicy 是 **L3/L4**（IP + 端口）。**Cilium**（基于 eBPF）把它扩到 **L7**——如只允许 `GET /api/public` 而非 `POST /admin`，或限定特定 **gRPC 方法**和 Kafka topic——身份感知、应用协议级的规则，普通 NetworkPolicy 无法表达。

**要点：**
- 默认是 allow-all
- 默认拒绝 + 定向 allow
- 需要策略感知 CNI
- Cilium 加 L7（HTTP/gRPC）策略

---

### 54. CoreDNS

**频率：** 中

**题目：** 请解释 Kubernetes 中的 CoreDNS 和 `ndots:5` 外部查找问题。

**答案：** **CoreDNS** 是**默认集群 DNS 服务器**——一个可插拔 DNS 服务器（以 Deployment 运行），给每个 pod 名字解析。它解析：
- **Service 记录**：`<service>.<namespace>.svc.cluster.local` → Service 的 ClusterIP。这是 pod 按名互找的方式。
- **Headless 服务的每 pod A 记录**：对 `clusterIP: None` 服务，它返回**每个后端 pod 一条 A 记录**（并为 StatefulSet 给稳定的 `<pod>.<svc>...` 名）。
- **SRV 记录**：广告**服务 + 端口**（用于端口发现）。
- **外部查询**：集群域之外的名字**向上游转发**（到节点解析器 / 配置的转发器）。

**`ndots:5` 放大问题：** Kubernetes 向每个 pod 的 `/etc/resolv.conf` 注入 `options ndots:5` 和一个**搜索列表**（`<ns>.svc.cluster.local`、`svc.cluster.local`、`cluster.local`）。`ndots:5` 规则意味：**若查询名的点*少于 5 个*，先逐个附加搜索域再直接试。** 故解析 `api.github.com`（2 点 < 5）触发一串**失败查找**——`api.github.com.<ns>.svc.cluster.local`、`api.github.com.svc.cluster.local`、`api.github.com.cluster.local`——全 NXDOMAIN——**才**最后查 `api.github.com` 本身。4 次查找而非 1 次，成倍增 DNS 负载并为每次外部调用加延迟。

**缓解：** 用带**尾点的完全限定名**（`api.github.com.`）——点够 / 信号"绝对、不附加搜索域"；或在主调外部服务的 pod 上设**`dnsConfig.options` 用更低 `ndots`**（如 `ndots: 2`）；或用 **NodeLocal DNSCache** 缓存并减往返。

**SLI 与扩容：** 盯**缓存命中率**、**转发（上游）延迟**和**错误/SERVFAIL 率**。随集群规模**扩 CoreDNS 副本**（更多 pod = 更大查询量），并用 **NodeLocal DNSCache**（每节点缓存）减中心 CoreDNS 负载并降延迟——DNS 是常见的集群级瓶颈和故障源。

**要点：**
- 解析 `<svc>.<ns>.svc.cluster.local`
- Headless 服务 -> 每 pod A 记录
- 注意 `ndots:5` 外部查找放大
- 随集群规模扩 CoreDNS 副本

---

### 55. 服务网格：它加了什么

**频率：** 中

**题目：** 服务网格加了什么，它的权衡是什么？

**答案：** **服务网格**（Istio、Linkerd、Cilium Service Mesh）透明地处理**服务间网络关注**——通过拦截流量（传统上用注入到每个 pod 旁的 **sidecar 代理**）——而**不改应用代码**。它加：
- **服务间 mTLS**——自动双向 TLS：每个服务间调用都加密且两端互认，给出**零信任网络**，证书轮换替你处理。应用不实现 TLS。
- **细粒度流量策略**——在代理处统一施加**重试、超时、断路器**和异常检测，于是韧性模式无需在每个服务/语言重实现。
- **Canary / 加权路由**——按百分比或头切流量做渐进式交付（Flagger 驱动的就是这个）。
- **统一可观测性**——为*每个*调用在代理处生成**一致的指标、追踪、日志**——于是无论语言你都得到跨所有服务的黄金信号遥测，无需每应用埋点。

**权衡（它不免费）：**
- **延迟和资源税**——每请求经代理一跳（额外网络跳 + 每 sidecar 的 CPU/内存）。**Linkerd** 最轻（专为此建的 Rust 微代理）；**Istio** 最多功能但更重。
- **运维复杂度**——你现在要跑并升级整个控制平面 + 数百 sidecar；误配能破所有流量。
- **调试难度**——代理在服务间加一层，故故障可能在应用*或*网格，"为何这请求被重试/失败？"更难追。

**无 sidecar 网格降开销：** **Cilium**（内核 eBPF）和 **Istio Ambient 模式**把数据平面从每 pod sidecar 移出——到节点（eBPF 或每节点 ztunnel）——**消除每 pod 一 sidecar 的税**（更少延迟、内存、生命周期复杂度），同时保留 mTLS 和 L4 策略，仅在需要时通过共享代理加 L7 特性。

**底线：** 权衡需求——在**多服务需统一 mTLS/可观测/流量控制**时网格值得；对少数几个服务常是杀鸡用牛刀。

**要点：**
- mTLS + L7 策略 + 可观测性
- Sidecar 税 vs 无 sidecar（Ambient）
- Linkerd：简单；Istio：功能多
- 加调试面；权衡需求

---

### 56. CRD 与 Operator 模式

**频率：** 中

**题目：** 请解释 CRD 与 Operator 模式。

**答案：** **CustomResourceDefinition（CRD）用新资源类型扩展 Kubernetes API**。注册 CRD 后，你能像内置 Pod 或 Service 一样 `kubectl apply` / `get` 你自己的类型（如 `kind: PostgresCluster`）——存在 etcd、由 schema 校验、由 API 服务。CRD 本身只是**数据**——声明类型本身*不做*任何事。

**Operator** 提供*行为*：它是一个**监听 CRD 实例并持续把真实世界状态调和到匹配 spec 的自定义控制器**——同 Kubernetes 对内置资源用的**期望-实际调和环**。你声明 `kind: PostgresCluster` 带 `replicas: 3`，Operator 做实际工作：供给 pod 和存储、配复制、并保持如此。

**为何强大——它把运维知识固化为软件。** 跑数据库这类有状态系统涉及专家级、易错的步骤：**供给、配复制、主死时故障切换、定时备份、安全升级**。Operator 把那些 runbook **编码进控制器**，使它们自动且一致地发生——人的专业知识变成调和逻辑。这是 Kubernetes 原生的自动化复杂应用"day-2"运维的方式。

**工具与例子：** 用 **kubebuilder** 或 **Operator SDK**（为 CRD schema + 控制器调和环搭脚手架，通常 Go）构建。知名例子：**cert-manager**（`Certificate` → 自动从 Let's Encrypt 获取并续期 TLS）、**Prometheus Operator**（`Prometheus`/`ServiceMonitor` → 管 Prometheus 实例和抓取配置）、**postgres-operator** / **CloudNativePG**（管带故障切换和备份的 HA Postgres 集群）。

**要点：**
- CRD 加新 API kind
- 控制器调和期望 vs 实际
- 编码领域运维知识
- 用 kubebuilder/Operator SDK 构建

---

### 57. 滚动更新 vs Recreate

**频率：** 中

**题目：** 请对比滚动更新与 Recreate 部署策略，何时用 Recreate？

**答案：** 两种 Deployment 更新策略，可用性/简单性权衡相反。

**滚动更新（默认）**——逐渐**用新 pod 替换老 pod，每次几个**，全程保服务在线。两个旋钮调推出：
- **`maxSurge`**——推出期间可创建**超过期望数的额外 pod**（临时超容以先起新 pod 再退老）。
- **`maxUnavailable`**——一次可**缺**（低于期望）多少 pod。

它们权衡**速度 vs 可用性**：更高 surge/unavailable = 更快推出但更多容量抖动或余量减少。**为零停机**，设 **`maxUnavailable: 0`**（绝不降到满容量之下）配 **`maxSurge: 25%`**（先起新 pod 再退老）——但这**需要集群有余容量**给额外 surge pod。关键是，零停机还**需要好的 readiness 探针**，使流量仅在新 pod *真正*就绪后才切过去（否则你把流量路到尚未服务的 pod）。

**Recreate**——**终止所有老 pod，然后启动新的**。极简单，但老 pod 死亡到新 pod Ready 之间有**停机空窗**。从不同时跑混版本。

**何时选 Recreate：** 当应用**不能容忍两个版本同时运行**时。经典情形：**不兼容的数据库 schema 迁移**（v2 pod 期望新 schema 而 v1 pod 会坏——不能两者同时打 DB），或**持独占锁的单例**（两实例会冲突）。接受短暂停机以保证干净的版本切换。其余一切优选滚动更新。

**要点：**
- maxSurge + maxUnavailable 调推出
- maxUnavailable: 0 求零停机
- 不兼容版本用 Recreate
- 配合 readiness 探针求安全

---

### 58. ServiceAccount 与 pod 身份

**频率：** 中

**题目：** pod 如何获得身份并向 Kubernetes 和云 API 认证？

**答案：** **Kubernetes API 身份——ServiceAccount：** 每个 pod 以一个 **ServiceAccount（SA）**运行，一个**投影的 SA token**（短寿、受众限定的 JWT）被**挂入 pod**（在 `/var/run/secrets/kubernetes.io/serviceaccount/token`）。pod 出示此 token 向 **Kubernetes API** 认证，SA 上的 RBAC 绑定决定它能做什么。这是 pod 的集群内身份。

**云 API 身份——workload identity 联合：** 真正的问题是向**云** API（S3、Secrets Manager、GCS）认证而*不*把静态云凭证烤进 pod。天真做法——把 AWS access key 放 env 变量或镜像——是安全灾难（长寿、易泄、难轮换、跨 pod 共享）。**Workload identity** 通过 OIDC **把 pod 的 SA token 交换为临时云凭证**来解决：
- **AWS IRSA（IAM Roles for Service Accounts）**——SA 被标注一个 IAM 角色；集群的 OIDC 提供商让 AWS STS 信任 SA token 并**发回该角色的短寿 IAM 凭证**。
- **GKE Workload Identity** 和 **Azure Workload Identity**——GCP 和 Azure 的同样模式：SA ↔ 云 IAM 身份映射，token 交换为限定云凭证。

**为何投影、自动轮换的 token 胜过烤入的密钥：** 挂入的 SA token 是**投影的**（绑到 pod、特定受众、有效期）且由 kubelet 在过期前**自动轮换**——故泄露的 token 短寿、很快无用。配合 workload identity，**pod 或镜像里从不存在长寿云密钥**——凭证按需铸造、限定于恰好一个角色、快速过期。这是给 pod 云访问的最小权限、无静态密钥的方式。

**要点：**
- SA = pod 的 k8s 身份
- 对云 API 用 IRSA / Workload Identity
- Token 被投影并自动轮换
- 永远别把云密钥烤进镜像

---

### 59. etcd

**频率：** 中

**题目：** 请讨论 etcd 作为 Kubernetes 背后的数据存储：Raft、延迟、备份、加密。

**答案：** **etcd** 是持有**全部 Kubernetes 集群状态**的**强一致分布式键值存储**——每个对象（pod、service、secret、configmap）都在 etcd。API server 本质上是它上方的无状态前端。etcd 不健康，整个控制平面就不健康。

**Raft 与奇数集群：** etcd 用 **Raft 共识算法**保副本一致，提交任何写需**法定人数（多数）**。法定人数数学是你跑**奇数集群（3 或 5 节点）**的原因：3 节点容 **1** 故障（3 之 2 = 多数），5 节点容 **2**。*偶*数不给额外容错（4 节点仍只容 1，因需 3 个构成多数）却加成本并增脑裂风险——故总用奇数。

**延迟敏感：** 每个写必须 **fsync 到磁盘并复制到法定人数**才提交，故 etcd **极度对磁盘和网络延迟敏感**。它需要**快的专用磁盘（低延迟 NVMe SSD）**和理想上**专用节点**——把 etcd 与吵闹工作负载共置，或放慢/网络存储上，会让写延迟飙升而卡住整个 API（`kubectl` 慢、控制器失败）。

**备份与恢复演练：** 定期用 **`etcdctl snapshot save`** 备份——关键是**演练恢复**（`etcdctl snapshot restore`）。一个你从未测过恢复的备份不是备份。etcd 是单一真相源，故损坏/丢失且无可恢复快照意味着从零重建集群。

**静态加密：** 默认 etcd 在磁盘上明文存数据（含 **Secret**）。启用 **KMS 支撑的静态加密**，使 Secret 不能从 etcd 磁盘/备份泄露中读取（同 Secret 那题的要求）。

**为何多数控制平面故障追到 etcd：** 因为它是集群一致、延迟敏感、依赖法定人数的心脏——**磁盘延迟飙升**或**法定人数丢失**（失多数）搬掉整个 API，etcd 问题处处级联。把它当最关键、最细心运维的组件。

**要点：**
- Raft，奇数 3/5 节点
- 对延迟敏感：快盘必备
- 定期演练快照 + 恢复
- 用 KMS 静态加密

---

### 60. ImagePullBackOff 原因

**频率：** 中

**题目：** 请列举并解释 `ImagePullBackOff` 的原因，以及如何诊断和预防。

**答案：** `ImagePullBackOff` 意味 kubelet **拉不到容器镜像**并在重试间退避（瞬时态是 `ErrImagePull`，然后落到 `ImagePullBackOff`）。这是*基础设施/配置*问题，不是应用崩溃。**总从 `kubectl describe pod` 开始**——Events 部分显示**确切的 registry 错误**（"not found"、"unauthorized"、"toomanyrequests"），直指原因：

1. **镜像名或 tag 拼错**——tag 是 `v1.2.0` 却写 `myapp:v1.2`，或 repo 拼错。错误：`manifest unknown` / `not found`。最常见。
2. **registry 不可达**——节点与 registry 间的网络/DNS/防火墙（私有 registry 不可路由、出流被堵）。
3. **缺或错命名空间的 `imagePullSecret`**——拉私有镜像无凭证，或 `imagePullSecret` 在与 pod *不同的命名空间*（secret 是命名空间级的）。错误：`unauthorized`。
4. **私有 registry 凭证过期/错误**——pull secret 的 token 过期，或云凭证（ECR/GCR）未刷新（ECR token 短寿——需凭证 helper / IRSA）。
5. **Docker Hub 匿名限流**——未认证的 CI/节点超拉取限时报 `toomanyrequests`。
6. **digest 不再存在**——钉到已从 registry 删除/回收的 `@sha256:...`。

**预防/韧性：** **把关键镜像镜像到自己的 registry**（Harbor/ECR），不依赖第三方的可用性或限流；认证拉取（更高限额）；用云凭证 helper/IRSA 使 registry 凭证自动刷新；预拉或缓存基础镜像。registry 故障或限流不应能阻止 pod 调度。

**要点：**
- 验证 image 名 + tag 存在
- imagePullSecret + 正确命名空间
- 注意 Docker Hub 限流
- 把上游镜像镜像求韧性

---

### 61. 追踪慢服务

**频率：** 中

**题目：** 请走一遍你在 Kubernetes 中追踪慢服务的方法。

**答案：** **分层、自顶而下**——从便宜、宽泛的检查开始，逐步钻到具体的慢组件，始终**对照基线和变更日志**（第一个问题总是"改了什么？"）：

**1. 服务本身健康/路由对吗？** 查 **`kubectl get endpoints <svc>`**——期望的 pod 真在 Service 的 endpoint 列表里吗？pod readiness 失败会静静掉出，流量堆到更少 pod（看起来像延迟）。确认 **pod readiness** 和副本数。

**2. 改了什么，是错误还是延迟？** 看**最近部署**（推出后立马变慢指向新代码/配置）并并排**错误率 vs 延迟仪表盘**——错误*与*延迟同升提示失败/重试；延迟*无*错误提示资源或下游瓶颈。这缩小了问题类型。

**3. 用分布式追踪定位慢 span。** 一次慢请求的追踪显示**时间真正花在哪**——是**慢数据库查询**、**下游服务**调用，还是应用自己的 CPU？这正是指标（太聚合）告诉不了你的。

**4. 检查常造成隐形慢的资源与基础设施因素：**
- **HPA 扩缩**——当前负载下服务扩得不够（副本不足）？HPA 卡住（指标坏）？
- **CPU 节流**——阴险的一个：pod 碰到 CPU *限额*会被**节流**而非杀掉，于是只是变慢而无错误。查 **`container_cpu_cfs_throttled_seconds`**——节流在基本仪表盘上不可见但是顶级延迟成因。
- **DNS 查询时间**——慢/失败的 CoreDNS（或 `ndots:5` 放大）给每个外部调用加延迟。
- **节点压力**——节点的内存/磁盘/IO 压力、吵闹邻居或降级节点。

每层都与**基线**（什么是正常）和**变更日志**（部署、配置、基础设施变更）对比以钉住原因。

**要点：**
- 先看 endpoint + readiness
- 用追踪定位慢 span
- CPU 节流常不可见
- 关联部署 + 节点事件

---

### 62. 集群升级

**频率：** 中

**题目：** 如何安全地执行 Kubernetes 集群升级？

**答案：** Kubernetes 升级遵严格的顺序和版本规则以免破集群：

**1. 先升控制面，一次一个小版本。** 在碰节点*之前*升 **kube-apiserver、controller-manager、scheduler、etcd**。关键是**永不跳小版本**——走 1.27 → 1.28 → 1.29，不是 1.27 → 1.29。Kubernetes 只支持组件间**一个小版本偏斜**，跳版会破 API 兼容和迁移。控制面必须**处于或领先**于节点（kubelet 可比 API server 落后一个小版本，绝不领先）。

**2. 然后优雅地升节点。** 对每个节点（滚动遍历机队）：**`kubectl drain`**（警戒 + 驱逐 pod，**尊重 PodDisruptionBudget** 以免一次听太多副本），**升级 kubelet 和容器运行时（containerd）**，再 **`kubectl uncordon`** 让它回流。滚动逐节点（或逐批）做，保容量不降。常直接换新节点（新 AMI/镜像）而非原地升。

**3. 托管服务自动化控制面。** **EKS、GKE、AKS** 替你处理控制面升级（它们跑并升 master/etcd），你主要管节点升级（甚至那也可通过托管节点组/自动升级自动化）。这拿掉了最险、最琐碎的部分。

**4. 提前扫描被移除的 API——最大坑。** 每个 Kubernetes 版本**移除弃用的 API 版本**（如 `Ingress` 从 `extensions/v1beta1` → `networking.k8s.io/v1`）。若 manifest 用了被移除的 API，升级后就**apply 失败**。**升级前**用 **`pluto`** 或 `kubectl deprecations` 扫描，**读 release note**，**把 manifest/Helm chart 更新**到新 API 版本，并**先在非 prod 集群测**。主动修复避免升级后 deployment 突然无法 apply 的事故。

**要点：**
- 先控制面再节点
- 一次一个小版本
- 排空时尊重 PDB
- 提前扫描被移除的 API

---

### 63. kubectl drain

**频率：** 中

**题目：** `kubectl drain` 做什么，何时用？

**答案：** `kubectl drain <node>` 分两步**安全清空节点**：先**警戒（cordon）**节点（标为不可调度，**不接新 pod**），再**驱逐现有 pod** 使其重调到其他处。关键是，驱逐**尊重 PodDisruptionBudget**——若驱逐某 pod 会违反其 PDB（降到 `minAvailable` 之下），drain 会**等**而非造成中断，随替代起来而逐步驱逐。

**两个重要 flag/注意：**
- **`--ignore-daemonsets` 必需。** DaemonSet pod（日志采集、CNI、节点代理）按设计**每节点一个**——无法"移"到别处，故 drain 拒绝推进，除非你用此 flag 明确确认跳过。它们一直跑到节点真被移除。
- **用 `emptyDir` 的 pod 会丢数据。** `emptyDir` 是节点本地临时存储；pod 被驱逐并重调到另一节点时那些数据**消失**。除非你传 **`--delete-emptydir-data`** 确认接受丢失，drain 不会推进。（持久数据应在 PVC 上，那会存活。）

**何时 drain：** 任何**破坏性节点维护**前——**内核/OS 打补丁**、**节点升级**（升 kubelet/containerd）、换节点或**缩容**。先排空确保工作负载被优雅重定位而非突然杀掉。

**让节点回流：** 维护后用 **`kubectl uncordon <node>`** 重新标为可调度。（忘了 uncordon 是常见错误，会让节点闲置在池外。）

**要点：**
- 警戒 + 驱逐尊重 PDB
- 需要 `--ignore-daemonsets`
- 排空时 emptyDir 数据丢失
- Uncordon 让节点回池

---

### 64. kubectl top 与 metrics-server

**频率：** 中

**题目：** 请解释 `kubectl top` / metrics-server 及其相对 Prometheus 的局限。

**答案：** **`kubectl top pods`** 和 **`kubectl top nodes`** 显示**当前 CPU 和内存使用**——什么在吃资源的快速实时快照。数据来自 **metrics-server**，一个轻量集群插件，**抓每个 kubelet 的 cAdvisor**（每节点容器指标采集器）并**聚合**，通过 Metrics API 暴露。

**它驱动 HPA：** **Horizontal Pod Autoscaler 从 metrics-server 读资源指标（CPU/内存）**来决定何时扩副本。所以 metrics-server 不只用于 `kubectl top`——没它，基于 CPU/内存的 HPA 不工作。（注意：它**并非所有发行版默认安装**——常见坑是 `kubectl top` 和 HPA 因缺 metrics-server 而静静失效；装上它。）

**关键局限——无历史：** metrics-server 只在内存中持**当前（近实时）值**，**不保历史数据**、不做长期存储。所以你**无法**用它画趋势、看上周使用、按模式告警或做容量分析。**历史、仪表盘和告警**需 **Prometheus + Grafana**——Prometheus 存时间序列，Grafana 可视化。`kubectl top` 答"*现在*什么在吃资源？"；Prometheus 答"使用如何趋势、何时飙升？"

**HPA 的自定义/外部指标：** metrics-server 只提供 **CPU/内存**（资源指标）。要按**应用指标**——每秒请求数、队列深度、自定义业务指标——自动扩缩，需 **Prometheus Adapter**（把 Prometheus 查询通过自定义/外部指标 API 暴给 HPA）或 **KEDA**（事件驱动自动扩缩，按 Kafka lag、SQS 深度、cron 等外部源）。它们接入 HPA 的自定义/外部指标接口，而 metrics-server 单独无法服务。

**要点：**
- metrics-server 喂 HPA + `kubectl top`
- 仅当前值、无历史
- 缺失就装（并非总是默认）
- 历史：Prometheus + Grafana

---

### 65. 流水线即代码

**频率：** 中

**题目：** 请解释流水线即代码，以及为何 UI 编辑的流水线是反模式。

**答案：** **流水线即代码**意味你的 CI/CD 流水线**定义在与代码同居仓的版本控制文件**里——**`.github/workflows/*.yml`**（GitHub Actions）、**`Jenkinsfile`** 或 **`.gitlab-ci.yml`**。流水线定义被当作应用代码对待。

**为何重要：**
- **可评审、可 diff**——流水线变更走**同代码一样的 PR 评审**。你能看到改了什么、谁改的、为何（git blame），评审者能在合并前抓错。
- **与代码同存**——流水线**随分支版本化**，故旧提交用*当时正确*的流水线构建，回滚代码也回滚其流水线。"代码"与"如何构建"不漂移。
- **可复用**——把共享逻辑抽成**模板、可复用 workflow 或 composite action**，多仓/作业共用一份已测定义而非复制粘贴。

**为何 UI 编辑是反模式：** 在 Jenkins/CI 网页 UI 里点选配置作业意味流水线存在 **CI 服务器的数据库而非 Git**。这导致：**漂移**（运行的流水线不再匹配任何可评审之物——几个月前有人现场改过而无人记得）、**无审计迹**、**无评审**、**无回滚**、**灾备痛**（丢 CI 服务器就丢流水线）。这是 CI 版的手改生产。

**通过 PR 运行验证流水线变更：** 因流水线在仓里，**一个改它的 PR 可在合并前*运行*改后的流水线**（在 PR 分支上）——于是你像测代码一样测流水线修改，在评审中抓住坏流水线而非它已上 `main`。

**要点：**
- 流水线在仓库、PR 中评审
- 可复用模板 / composite action
- 避免仅 UI 编辑流水线
- 通过 PR 运行验证流水线变更

---

### 66. 主干 vs Gitflow

**频率：** 中

**题目：** 请对比主干开发与 Gitflow。

**答案：** **主干开发（trunk-based）**：短命分支（小时/天）、频繁合入 `main`，用**特性开关隐藏未完成工作**。因为分支短命、频繁集成，它**启用持续部署并最小化合并冲突**——大分支接多久，分叉就多痛。

**Gitflow**：长命的 `develop`、`release/*`、`hotfix/*` 分支——**仪式重**，适合**版本化交付的软件**（你同时维护多个发布版本、打 release 分支、向旧版打 hotfix）。

**谁选哪个：** 多数 **SaaS 团队选主干**——他们只跑一个生产版本、持续部署，主干的小批量 + 特性开关完美契合。**打包软件团队**（库、桌面应用、固件）多用 Gitflow，因为他们真要维护多个版本并为旧版发补丁。

**要点：**
- 主干：小批量、快合并
- 特性开关隐藏 WIP
- Gitflow：版本化发布、仪式
- SaaS -> 主干；打包软件 -> Gitflow

---

### 67. PR 检查阶段

**频率：** 中

**题目：** 请描述 CI 流水线中典型的 PR 检查阶段和排序原则。

**答案：** 设计良好的 PR 流水线跑一系列**闸门**，排序使**最便宜、最快、最可能失败的检查先跑**。典型顺序：

1. **Lint / 格式**——秒级，抓琐碎问题。
2. **单元测试**——快，抓逻辑 bug。
3. **构建**——编译应用。
4. **容器构建 & 扫描**——构镜像，跑漏洞 + 密钥扫描。
5. **集成测试**——较慢，组件一起测。
6. **烟雾部署到临时环境**——部到临时隔离环境。
7. **必需评审者批准**——人工评审。
8. **合并。**

**关键原则：**

**快速失败——lint 在测试前。** 把**最快的检查放最前**，使有格式错或琐碎错的 PR 在**秒内**失败而非等 15 分钟的测试+构建。不让开发者等昂贵阶段才知道便宜问题。又快反馈又省 CI 算力。

**并行独立作业。** lint、单元测试、安全扫描互不依赖——**并发跑**而非串行，削总墙钟时间。只在真有依赖处串行（构建先于集成测试）。

**临时预览环境抓集成 bug。** 拉起**临时、PR 限定的环境**（自己的命名空间/栈，合并/关闭时拆）让你跑*真正部署的应用*——抓住只在真实基础设施、配置、依赖、网络下才现的 bug。评审者也能点看实时变更。

**分支保护强制必需检查。** 把必需检查配为**分支保护规则**，PR **全部变绿（且必需评审者批准）前不能合并**。这包括**外部状态报告**——**SonarQube**（代码质量/覆盖率门）或 **Snyk**（安全）把通过/失败状态报回 PR，这些状态也成为必需检查，于是质量/安全回退自动阻合并。

**要点：**
- 快速失败：lint 优先
- 并行独立作业
- 临时预览环境捕集成 bug
- 分支保护强制必需检查

---

### 68. CI 中缓存依赖

**频率：** 中

**题目：** 如何在 CI 中缓存依赖，为何缓存 package store 而非 `node_modules`？

**答案：** **缓存什么：** **包管理器下载存储**——`~/.npm`、`~/.m2`（Maven）、**Go module cache**、**pip wheel**——以及 **Docker 构建层**。这些持有重新下载/重建昂贵的依赖。

**以 lockfile 哈希为缓存键。** 缓存键应为 **lockfile**（`package-lock.json`、`go.sum`、`poetry.lock`）的哈希。于是缓存在运行**开始时恢复**、**结束时保存**，且**依赖变时自动失效**（lockfile 改 → 新哈希 → 新缓存）但**不变时复用**——恰好的行为。依赖不变 = 瞬时恢复；变了 = 重建。

**机制：** **GitHub Actions `actions/cache`**（或内置 `setup-*` 缓存）、**GitLab `cache:` 块**，对 Docker 用 **BuildKit cache mount**（`RUN --mount=type=cache,target=/root/.npm`），它即使安装层失效也能*跨构建*持久化 package store——适合编译器/包缓存。

**为何缓存上游 package store 而非 `node_modules`：** `node_modules`（及同类）可含**平台特定的编译二进制**（为特定 OS/arch/libc 构的原生插件）。缓存它并在**不同 runner OS/架构**上恢复会恢出**不兼容的二进制**——微妙难调的坏。**package store（`~/.npm`）**持**可移植的下载 tarball**，故缓存*那个*（快——无网络）并**新跑 `npm ci`** 为当前环境正确构 `node_modules`。既得跳过下载的速度，又无跨环境运编译产物的脆弱。

**部分命中的回退 restore-keys：** 配 **`restore-keys`**（前缀匹配回退），使精确 lockfile-哈希键未命中（依赖变）时，CI 仍能**恢复*最近*的旧缓存**且只下*增量*——远快于冷缓存。缓存未命中从"下载全部"变成"更新几个包"。

**要点：**
- 按 lockfile 哈希为缓存键
- 缓存 package store，不是 node_modules
- BuildKit cache mount 做编译器缓存
- 设回退 restore-keys 做部分命中

---

### 69. 制品管理

**频率：** 中

**题目：** 请解释制品管理（Artifactory、Nexus）与"晋升而非重建"的实践。

**答案：** **制品仓库**（**JFrog Artifactory、Sonatype Nexus、GitHub Packages、AWS CodeArtifact**）是你**构建二进制**的中心存储——Java **jar**、Python **wheel**、**npm** 包、**OCI** 容器镜像、**Helm chart** 等。它坐在你的构建与依赖之间。

**好处：**
- **镜像/缓存上游 registry**——作为公共 registry（npmjs、Maven Central、Docker Hub）的**透传代理**。构建从本地镜像拉依赖，**避上游限流和故障**、**加快构建**（本地/缓存），并在**物理隔离**环境工作。
- **不可变发布仓**——发布版本一旦发布就**不可覆盖**，保证 `v1.4.2` 总是同一字节（可重现、供应链完整性）。
- **漏洞扫描**——对存储制品扫 CVE。
- **地理复制**——跨区复制制品，分布团队/集群本地拉。

**晋升而非重建——核心实践：** 构建制品**一次**，然后把**同一制品**在仓库/阶段间**晋升**：**snapshot → release → prod**（或 dev → staging → prod）。**不**为每环境重建。为何：**重建有漂移风险**——两次构建间可能潜入不同依赖版本、基础镜像或工具链，于是"staging 测的"不等于"prod 跑的"。晋升已测的同一制品保证**你验证的字节就是上线的字节**。晋升只是把制品移/标到下一仓，便宜安全。

**保留与清理策略：** 制品积累很快（每次 CI 构建都出 snapshot），故配**保留规则**——留最后 N 个 snapshot、留所有 release、自删旧/无引用制品——控制存储成本而不丢你需要重现或回滚的任何东西。

**要点：**
- 镜像上游 registry
- 晋升、不要重建
- 不可变发布仓库
- 保留 + 清理策略

---

### 70. CI 中无泄漏的密钥

**频率：** 中

**题目：** 如何在 CI 中处理密钥而不泄漏，为何偏好 OIDC？

**答案：** 多层防护，因为 CI 是**首要泄漏目标**（它能访问一切并跑不可信的 PR 代码）：

1. **用平台的加密密钥库——绝不用 repo 文件。** 密钥放 **GitHub Actions Secrets、GitLab CI variables 或 Vault**——静态加密、运行时注入、从不提交。**绝不**把凭证放 repo（即使"临时"、即使私有 repo——git 历史永存，fork/clone 会扩散）。
2. **在日志中遮蔽密钥并禁止 dump。** 平台**自动遮蔽已知密钥值**（替为 `***`）。但你还必须**禁止打印环境**（`env`、`printenv`）或开启 shell trace（`set -x`），它们会**回显遮蔽器不知道的密钥**（如运行时派生的密钥）。一个包住带 auth header 的 curl 的 `set -x` 就能把 token 泄入公开日志。
3. **偏好 OIDC 联合而非长寿云密钥。** 不存长寿 AWS access key，而用 **OIDC**：CI 平台发**短寿、签名的工作流 token**，云提供商（通过信任策略）**交换为限定角色的临时云凭证**。好处：**压根没长寿密钥可泄**、凭证**几分钟内过期**、访问**按工作流/repo/分支作用域**。同 pod 的 IRSA 思想——短寿、联合、无静态密钥。
4. **把密钥访问作用域到只给需要的作业/环境。** 不把每个密钥暴给每个作业。用**环境作用域的密钥**（如 prod 密钥只给 prod-deploy 作业，受环境保护规则门控），使被入侵或恶意的构建步骤摸不到无关凭证——CI 的最小权限。

**要点：**
- 加密密钥库，不在 repo 文件
- OIDC 到云胜过长期密钥
- 遮蔽 + 禁 `env`/`set -x`
- 按作业/环境作用域密钥

---

### 71. 环境晋升

**频率：** 中

**题目：** 请解释部署流水线中的环境晋升。

**答案：** **环境晋升**意味把**同一构建制品**在一系列环境间移动——**dev → staging → prod**——它们间**只有*配置*不同**，制品不变。你构并测的镜像/二进制就是最终在 prod 跑的。

**为何避免每环境重建：** 若为每环境分别**重建**，你冒**漂移**风险——staging 构建与 prod 构建间某依赖、基础镜像或工具链版本可能不同，于是"staging 测的"不是"prod 跑的"。构建**一次**并晋升**同一制品**保证你上线的恰是你验证的（同制品晋升原则）。环境只在**配置**（DB URL、特性开关、资源尺寸、副本数）上差异——由 ConfigMap/Secret/env 注入而非烤进制品。

**GitOps 下的晋升：** 因 Git 是真相源，**晋升是一个 PR**，**更新目标环境 overlay 中的 image tag（或 digest）**——如一个把 **prod** Kustomize overlay 里 `image: myapp@sha256:...` 推的 PR。GitOps 控制器随后把 prod 调和到新版。晋升可审计（是评审过的提交），回滚是 `git revert`。

**用更强控制门控 prod：** dev/staging 可自动晋升，但 **prod 得额外门**——**手动批准**（必需评审者签字），加上**canary 推出**和部署后**烟雾测试**等自动检查。GitHub Actions 的 **Environments** 提供这些：prod 环境上的**保护规则、必需评审者、等待计时**，使部署未经批准无法推进。

**同配置 schema、不同值：** 跨环境保持**配置*形状*一致**（同键、同结构），只有**值**按环境不同。这防"staging 能跑、prod 缺配崩溃"的意外——若 staging 和 prod 用同 schema，在一边有效的配置在另一边结构上也有效，只是值（指向 prod 资源）变。

**要点：**
- 一个制品、多个环境
- 通过 PR 到环境 overlay 晋升
- prod 手动批准门
- 同配置 schema、不同值

---

### 72. CD 中的数据库迁移（扩展/收缩）

**频率：** 中

**题目：** 如何在持续交付中安全地跑数据库迁移（扩展/收缩）？

**答案：** **核心问题：** 在**滚动部署**期间，**旧新应用版本一段时间同时运行**（"滚动"就是 pod 逐渐替换）。两版本**同时打同一数据库**。所以**向后不兼容的迁移会出事**：若重命名或删掉仍在跑的*旧* pod 依赖的列，那些旧 pod 会在迁移一跑就报错——部署中途宕机。你**不能**把硬破性 schema 变更与滚动部署原子化。

**解法——扩展/收缩（并行变更）：** 让每个 schema 变更**跨至少一个应用版本向后兼容**，按步骤使新旧应用在每一点都能工作：

1. **扩展——加新列/表**（*纯加性*、向后兼容的迁移）。旧应用忽略它；无事。先部这迁移。
2. **部署同写新旧的应用**——新版同写*两边*（旧列和新列，双写），仍读旧。新数据落两处，旧 pod（读旧）仍工作。
3. **回填**——跑作业把现有旧列数据拷入新列，使新列对历史行也完整。
4. **部署只读新的应用**——新列已满（回填+双写），切读到新列。旧列还在但未用。
5. **收缩——删旧列**——仅在所有运行版本都不再引用它*之后*。此时删除安全。

**关键规则：** **绝不做当前运行版本无法容忍的 schema 变更。** 每步均向后兼容，新旧 pod 无时因 schema 冲突。步骤多、部署多，但这是滚动部署下演进 schema 而**零停机**的唯一途径。（加性迁移在应用部署*前*，破性 contract 在完全推出*后*。）

**要点：**
- 迁移先于应用部署
- 应用必须能处理新旧 schema
- 读新前先回填
- 完全推出后再删旧

---

### 73. 特性开关

**频率：** 中

**题目：** 请解释特性开关：把部署与发布解耦、它能带来什么、以及开关卫生。

**答案：** **特性开关**是一个运行时开关，把***部署*代码与*发布*特性给用户解耦**。你把新代码**"暗着"**发到生产（部署但禁用），再**独立打开**——按**用户、群组或百分比**——通过**开关服务**（**LaunchDarkly、Unleash、Flagsmith**）而无需重部。部署与发布成为分开的决策。

**它能带来：**
- **主干开发**——开发者把未完成特性在*关*开关后合入 `main`，于是工作持续集成而无长命分支，未完代码安全（暗）上线而非阻发布。这是主干+持续部署的关键使能。
- **A/B 测试/实验**——给随机 % 用户启变体并测影响，因开关服务定向群组。
- **即时 kill switch**——特性在 prod 出问题，**秒内关开关**——无重建、无重部、无回滚。极有价值的安全网。
- **渐进推出**——把特性 1% → 10% → 50% → 100% 坡升并看指标——与基础设施无关的代码级 canary。

**开关卫生——关键纪律：** 开关是**债**。每个开关加一个**代码分支**（`if flag on ... else ...`），且开关**排列组合爆炸**——N 个开关 = 最多 2^N 种状态，不可测。不管的陈旧开关造成**代码腐烂**（无人敢删的死分支）、困惑（"这开关还用吗？"）和意外组合的 bug。故**跟踪每个开关的生命周期**——谁拥有、为何存在、何时删——并**在特性完全推出或废弃后无情删除开关**（删开关*和*死分支）。把开关清理当必需后续工作，非可选。

**要点：**
- 部署 ≠ 发布
- 百分比 / 群组定向
- 无需重部署的 kill switch
- 无情退役陈旧开关

---

### 74. Terraform 模块与 workspace

**频率：** 中

**题目：** 请解释 Terraform 模块与 workspace，以及为何偏好每环境一目录。

**答案：** **模块（Module）**是 Terraform 的**可复用积木**——把相关资源置于一个输入/输出接口后。如一个 **`vpc` 模块**取 **CIDR 变量**并创建 VPC、子网、路由表、NAT 网关，输出子网 ID——于是每环境/项目调同一个已测模块而非复制粘贴资源块。**来源**可为**本地路径**（`./modules/vpc`）、**Git**（`git::https://...`）或**公共/私有 Terraform Registry**。**总钉模块版本**（`version = "3.2.1"`）——未钉模块可能在 `init` 时情变而破或意外改基础设施。

**Workspace** 是**单一配置内隔离的 state 实例**——`terraform workspace new prod` 给你一个独立 state 文件而复用同套 `.tf` 代码，`terraform.workspace` 让代码按当前 workspace 分支。它们*能*从一套配置建模环境（dev/staging/prod），但**易被误用**：环境**共享同套代码和后端**，只靠插值的 workspace 名区分，而且**危险地容易对错 workspace 跑 `apply`**（你*以为*在 staging 却在 prod——当前 workspace 在命令中不可见）。它们还让每环境差异别扴（条件散布代码中）。

**为何许多团队偏好每环境一目录**（`envs/prod/`、`envs/staging/`，各自有 `main.tf` 调共享模块、各自有后端/state）：它给**显式、物理的分离**——你确实 `cd envs/prod` 才碰 prod，每环境有**自己的 state 和后端**（staging 的错碰不到 prod state），每环境配置**在文件中可见**而非藏在 `terraform.workspace` 条件后，代码评审清楚显示变更影响*哪个环境*。清晰和爆炸半径隔离胜过轻微重复，故每环境一目录（配共享模块）是常见生产模式；workspace 更适保留给轻量、几乎相同的并行实例。

**要点：**
- 模块 = 可复用积木
- 钉模块版本
- Workspace = state 隔离
- 每环境一目录常比 workspace 更清楚

---

### 75. terraform plan 评审纪律

**频率：** 中

**题目：** 请解释 apply 前评审 `terraform plan` 的纪律。

**答案：** `terraform plan` 在你改动前**准确显示将变什么**——目的就是**仔细评审**，让 apply 永不给你惊喜。纪律：

**1. 读完整 plan，数 create/update/destroy。** plan 摘要（`Plan: X to add, Y to change, Z to destroy`）是第一道理智检查。若你只想改一个设置而 plan 要**销毁 12 个资源**，有问题——停下调查。别扫读；读真正在变的。

**2. 审视每个 destroy 的爆炸半径，留意 `forces replacement`。** 删除是危险处。尤其留意**关键有状态资源**上的 **`# forces replacement`** 注解——某些属性变更（如 DB 引擎参数、AZ、名字）迫使 Terraform **销毁并重建**资源。在**数据库**上意味**数据丢失+停机**；在**负载均衡器**上意味新端点/断连。在评审中（而非 apply 后）抓到数据库上的 `forces replacement` 就避免了灾难性宕机。也查**敏感值变动**（密钥/密钥的意外变更）。

**3. 把 plan 贴到 PR，破坏性 plan 需批准。** 用 **Atlantis**（或 `tf`-action 工具）**自动跑 `plan` 并把输出贴为 PR 评论**，使评审者作为代码评审的一部分看到确切的拟议变更——并在带 destroy 的 plan 能 apply 前**要求显式批准**。这让基础设施变更像代码一样可评审，阻止一人单方面销毁 prod。

**4. 通过保存的 plan 文件精确 apply 已 plan 的。** 跑 `terraform plan -out=plan.tfplan` 再 `terraform apply plan.tfplan`。这 apply **保存的 plan** 而非 apply 时重新 plan——保证你 apply **恰是评审过的**，无 plan 与 apply 间的**漂移或 state 变更**悄悄改动结果。plan-然后-apply-保存的-plan 关闭了评审与执行间现实可能变化的缺口。

**要点：**
- 读每行 destroy
- `forces replacement` = 停机风险
- 通过 Atlantis 在 PR 中 plan
- Apply 保存的 plan 避免漂移

---

### 76. 不可变 vs 可变基础设施

**频率：** 中

**题目：** 请对比不可变基础设施与可变基础设施。

**答案：** 两种改变运行中服务器的哲学。

**可变基础设施**——你**原地改服务器**：SSH 进（或跑 Ansible/Chef/Puppet 等配置管理）在现有机器上打补丁、改配置、部新代码。问题是**漂移与雪花服务器**：随时间，手动修补、失败的部分更新、一次性微调累积，使**每台服务器变得微妙独特且无文档**——一个无人能可靠重现的"雪花"。两台本应相同的服务器不同，造成"A 服务器行、B 服务器崩"的谜团，且精确重建丢失的服务器几乎不可能。

**不可变基础设施**——你**从不改运行中的服务器**。对*任何*变更（新代码、补丁、配置微调），你**构建全新镜像**（容器镜像、AMI、VM 镜像）把变更烤进去，再**替换**实例——从新镜像起新的、切流量、拆旧的。运行中的服务器**只读、可弃、与镜像相同**。好处：
- **无漂移**——每实例恰是其镜像；启动后不变，服务器保持可重现且相同。
- **回滚易**——坏变更？**重部前一镜像。** 回滚只是"跑旧制品"，干净快捷（同蓝绿思想）。
- **契合自动扩缩容**——因实例相同可弃，扩缩器可自由从镜像创建/销毁。

**它要求：** 你需要**快速镜像构建**（每次变更都构镜像，慢构建伤人）和**滚动部署自动化**（零停机替换实例）。**容器是经典的不可变单元**——镜像构造上不可变，Kubernetes 替换（从不打补丁）pod——这就是容器生态默认体现不可变基础设施的原因。（Packer 等工具为非容器世界构建不可变 VM 镜像/AMI。）

**要点：**
- 可变 -> 漂移 + 雪花
- 不可变 -> 替换、永不打补丁
- 快速镜像构建必备
- 回滚 = 重部前一镜像

---

### 77. 安全组 vs NACL（AWS）

**频率：** 中

**题目：** 请对比 AWS 安全组与 NACL。

**答案：** 两种不同层的 AWS 防火墙机制，有个关键的有状态/无状态差异。

**安全组（SG）**——**有状态、实例级**防火墙（附到 ENI/实例）。**只有 allow 规则**（没有 deny——未 allow 的隐式拒绝）。**有状态**意味：若你 allow 某端口的**入站**流量，**返回流量自动放行**出去——你不用为响应写规则。这使它简单：你只声明"allow 从 LB 入站 443"，回复就自动流回。SG 是控制访问的**主要日常工具**，可引用*其他安全组*作源（"allow 从 app 层 SG"）。

**NACL（网络 ACL）**——**无状态、子网级**控制（附到子网，作用于子网进出所有流量）。它支持 **allow 与 deny 规则**（按编号顺序求值）。**无状态**意味：**无自动返回流量**——若你 allow 某端口入站，你必须**单独 allow 出站临时端口的返回流量**（反之亦然），否则连接卡住。这使它更繁琐（你手动管两个方向）。

**谁是谁：** **SG 是主要工具**——细粒度、有状态、简单、可引用；几乎全部访问控制在此做。**NACL 是粗的第二层**——子网级，其 **deny** 能力是主要价值（SG 不能 deny），用于如在子网边界**阻断特定恶意 IP 段**或作宽泛兜底。纵深防御：每实例 SG + 每子网 NACL。

**生产实践：** **默认拒入**（只开确切所需端口/源——SG 本就默认拒，别过度开）**加收紧、最小的出站**。人们常锁死入站却把**出站大开（0.0.0.0/0 全端口）**——这让被入侵的实例自由**外泄数据或呼叫 C2 服务器**。把出站限到工作负载合法所需的目的地是重要却常被跳过的加固步骤。

**要点：**
- SG：有状态、实例级、仅 allow
- NACL：无状态、子网级、allow + deny
- SG 优先，NACL 次要
- 收紧出，不只入

---

### 78. 服务发现

**频率：** 中

**题目：** 请解释服务发现的几种方式，以及为何健康感知的注册胜过静态 DNS。

**答案：** **服务发现**在实例不断来去（自动扩缩、部署、故障）的动态环境中回答"服务 X 现在在哪"。手动硬编码 IP 行不通——它们会变。方式：

**1. 基于 DNS 的发现**——服务通过解析到当前 IP 的 **DNS 名**互相找到：**Route53 私有托管区**、**CoreDNS**（Kubernetes 中）或 **Consul DNS**。简单通用（一切都说 DNS），但纯 DNS 有弱点：**TTL 缓存**意味实例死后客户端可能缓存陈旧 IP，且基础 DNS 不管目标是否真健康都返回记录。

**2. 基于注册的发现**——专门的**服务注册表**（**Consul、Netflix Eureka、AWS Cloud Map**），**服务启动时自注册**并通过心跳持续报告**健康信息**。客户端（或 sidecar）向注册表查*当前健康*的实例。注册表主动**移除不健康/死实例**，你永不被路到宕的节点。

**3. Kubernetes：自动发现。** K8s 中你很少想这事——**Service** 提供稳定虚拟 IP + DNS 名，**CoreDNS** 自动解析 `my-svc.my-namespace.svc.cluster.local`。Service 的 endpoint 与**健康 pod 保持同步**（readiness 探针失败的 pod 移出轮转），故发现内建且开箱健康感知。

**4. 跨集群/多区域。** 对跨集群或区域的服务：**external-dns** 监视 K8s Service/Ingress 并**同步到云 DNS**（Route53、Cloud DNS），使外部/其他集群客户端能解析；或用**服务网格联邦**（Istio/Consul mesh 连多集群）做带 mTLS 和地域感知的跨集群路由。

**为何健康感知注册胜过静态 DNS：** 静态 DNS 可能给出**死或不健康实例**的 IP（它不知健康，TTL 缓存又延迟更新），导致请求失败直到缓存过期。**健康感知注册表（或 K8s endpoint）**只返回**当前健康**目标，并在故障后数秒内更新——流量自动避开死实例。在快变、自动扩缩的系统里，这种健康感知不可或缺。

**要点：**
- k8s：Service + CoreDNS
- 混合环境用 Consul/Cloud Map
- external-dns 同步到云 DNS
- 健康感知注册胜过静态 DNS

---

### 79. Grafana 仪表板与告警

**频率：** 中

**题目：** 请解释你如何构建 Grafana 仪表板与告警。

**答案：** **Grafana** 是**可视化层**——它在一个统一 UI 里从众多数据源查询并绘图：**Prometheus**（指标）、**Loki**（日志）、**Tempo**（追踪）、**CloudWatch**、**BigQuery** 等。它自己不存数据；它渲染各后端所持的。

**仪表板即代码。** 别点选构建仪表板又不版本化——它们漂移并丢失。**做成代码**管理：导出/编写仪表板 **JSON** 提交到 Git，或用 **Grafonnet**（Jsonnet 库）或 **Grafana Terraform provider** 生成。这让仪表板**可评审、可 diff、可重现**——变更像其他代码一样走 PR。

**模板变量。** 用**模板变量**（`cluster`、`namespace`、`service` 等下拉）使**一个仪表板适配多个目标**而非每环境复制一个。变量喂进 PromQL 查询（`{namespace="$namespace"}`），给出可复用、可筛选的视图。

**告警在哪跑。** 两个选择：**Grafana 统一告警**（在 Grafana 内定义告警规则，对任何数据源求值，经 Grafana 通知策略路由）或 **Prometheus Alertmanager**（规则在 Prometheus 定义，Alertmanager 处理分组/路由/静默）。都有效——Alertmanager 是经典的 Prometheus 原生路径；Grafana 统一告警在你跨多个/异构数据源告警时方便。

**保持仪表板小而有意图。** 别建无人读的 50 面板巨型仪表板。目标是**每服务一个聚焦仪表板**，基于成熟方法：**RED**（**Rate、Errors、Duration**——最适请求驱动的服务）或 **USE**（**Utilization、Saturation、Errors**——最适 CPU、磁盘、队列等资源）。这些方法确保你展示真正重要的少数信号以发现和诊断问题，而非一墙噪声。

**要点：**
- 仪表板做成代码放 Git
- 模板变量求复用
- RED（rate/errors/duration）或 USE（utilization/saturation/errors）方法
- 告警在 Alertmanager 或 Grafana 统一

---

### 80. OpenTelemetry：collector、信号、传播

**频率：** 中

**题目：** 请解释 OpenTelemetry：规范、Collector、上下文传播与埋点。

**答案：** **OpenTelemetry（OTel）**是面向三大遥测信号——**trace、metric、log**——的**供应商中立标准**（规范 + SDK）。核心价值：**一个 SDK、多个后端。** 你对 OTel API *埋点一次*，再按配置导出到*任何*兼容后端（Tempo、Jaeger、Datadog、Honeycomb…）——换供应商无需重写埋点。这打破了每个 APM 供应商自带专有 agent 的旧锁定。

**Collector。** 应用以 **OTLP**（OTel 线协议）发遥测到 **OpenTelemetry Collector**——一个介于应用与后端之间的独立处理管道。Collector **接收、批处理、过滤、变换、采样**遥测，再**导出**到一个或多个后端。好处：应用只对 Collector 说 OTLP（无需后端专有配置），你把采样/过滤/路由/脱敏集中在一处；换后端只改 Collector 配置而非应用。

**上下文传播。** 要让 trace 跨多服务，**trace 上下文必须随请求**跨服务边界传递。OTel 用 **W3C `traceparent` HTTP 头**——它携 trace ID 和父 span ID，于是 A 调 B 时 B 的 span **链入与 A 同一 trace**。这个标准化头把各服务的 span 缝成一条端到端分布式 trace。

**自动 vs 手动埋点。** **自动埋点**库钩入常见框架（HTTP 服务/客户端、gRPC、DB 驱动、消息队列）并**无需改代码**产生 span——廉价获广覆盖。**手动埋点**则绕你自己的业务逻辑加**自定义 span**（"process-payment"、"render-report"）并附上自动埋点无从得知的领域属性。典型做法：自动埋点给框架级基线，再手动为关心的关键自定义操作加 span。

**要点：**
- 一个 SDK、多个后端
- Collector 做处理 + 路由
- W3C traceparent 头传播上下文
- 常见 lib 用自动埋点

---

### 81. 流水线扫描（Trivy、Snyk、Dependabot）

**频率：** 中

**题目：** 请解释流水线安全扫描：各类、自动升级工具与门控。

**答案：** "安全左移"——在 CI 跑自动扫描器，使漏洞在合并/部署**前**而非生产中被抓。各类覆盖整个供应链：

1. **SCA（软件成分分析）**——扫你的**依赖**看已知 CVE（如某库的易受攻击版本）。多数漏洞在第三方依赖里，高价值。工具：Snyk、OWASP Dependency-Check、Trivy。
2. **SAST（静态应用安全测试）**——扫**你自己的源码**看不安全模式（SQL 注入、硬编码加密、路径穿越）。工具：Semgrep、CodeQL、SonarQube。
3. **IaC 扫描**——扫**基础设施代码**（Terraform、K8s YAML、CloudFormation）看配置错（公开 S3、开放安全组、特权容器）。工具：**Checkov、tfsec、Trivy**。
4. **密钥扫描**——检测 repo/历史中**已提交的凭证**（API key、token、私钥）。工具：**gitleaks、trufflehog**。
5. **容器扫描**——扫**构好的镜像**看镜像层里 OS 包和库的 CVE。工具：**Trivy、Grype**。

**自动更新。** **Dependabot** 或 **Renovate** 监视依赖并**自动开 PR 把易受攻击/过时依赖升到修复版本**——修复变一键合并而非手动追踪。Renovate 更可配（分组、排期）；两者都大幅缩短你坑在已知易受攻击依赖上的窗口。

**门控——关键策略。** 别对*一切*都阻（造成告警疲劳并因不可修的低危噪声阻断无关工作）。合理策略：**对有修复可用的 HIGH/CRITICAL 发现阻合并**（你能且必须行动），**其余告警（不阻）**（低危或尚无修复）。保持门控有意义、可行动。

**聚合发现。** 把所有扫描器输出喂入**中心漏洞追踪器**（**DefectDojo** 等）而非散在各 PR 评论里。否则发现**没入 PR 噪音**——PR 合并后未修问题就被遗忘。追踪器给你一个持久、去重、带归属与分级的队列，无一漏网。

**要点：**
- SCA + SAST + IaC + 密钥 + 容器扫描
- Dependabot/Renovate 做自动更新
- 可修的 high/critical 阻合并
- 在追踪器中聚合发现

---

### 82. AWS vs GCP vs Azure：粗略服务映射

**频率：** 中

**题目：** 请给出 AWS/GCP/Azure 的粗略服务映射，并解释 IAM 差异。

**答案：** 三大云在不同名字下提供大致等价的基元：

| 类别 | AWS | GCP | Azure |
|---|---|---|---|
| 计算（VM） | EC2 | Compute Engine | Azure VMs |
| 托管 Kubernetes | EKS | GKE | AKS |
| Serverless 函数 | Lambda | Cloud Functions | Azure Functions |
| 对象存储 | S3 | Cloud Storage（GCS） | Blob Storage |
| 托管 Postgres | RDS | Cloud SQL | Azure Database for PostgreSQL |

（GKE 普遍被视为最打磨的托管 Kubernetes，因 Google 是 Kubernetes 发源。）

**IAM 模型如何不同**——这是三家分歧最大处：
- **AWS**——**IAM role + JSON policy。** 极**强大、细粒度**，但**冗长复杂**——policy 是带 action/resource/condition 的 JSON 文档，做对最小权限真的难。assume-role 和跨账号信任增添强大与复杂。
- **GCP**——在**资源层级**（组织→文件夹→项目→资源）上的 **IAM binding**。把**成员**（用户/服务账号）绑到资源上的**角色**，权限**沿层级向下继承**。通常比 AWS **更简单干净**，project/folder 树给出自然组织分域。
- **Azure**——**Azure RBAC**（角色分配作用于订阅/资源组/资源）叠在 **Entra ID**（前 Azure AD）身份上。来自微软/AD 世界的人熟悉；身份与资源访问略分开。

**为何多云比看起来难——选一个主云。** 虽然服务概念上*映射*，但**细节处处不同**：IAM 模型、网络、配额、API、托管服务行为，尤其是**运维工具与团队经验**。真正抽象三家（为避锁定）常意味只用最小公分母并构建/维护昂贵抽象层——你付真实的"多云税"并失去让每个云有价值的深层专有特性。对多数团队，务实选择是**选一个主云**、钻深，只在有充分理由时才用另一个。

**要点：**
- 托管 k8s：EKS / GKE / AKS
- 对象：S3 / GCS / Blob
- IAM 模型差异显著
- 多云大多是税

---

### 83. iptables vs nftables

**频率：** 低

**题目：** 请对比 iptables 与 nftables。

**答案：** 两者都是基于内核 **netfilter** 钩子的 Linux 包过滤框架；nftables 是 iptables 的现代继任。

**iptables** 把过滤组织为**表**与**链**。**表**按目的分组：**`filter`**（accept/drop——防火墙）、**`nat`**（网络地址转换——改写源/目地地址端口）、**`mangle`**（改包头如 TOS/TTL）、`raw`。表内，**链**是包旅程中的钩点：**`INPUT`**（发往本主机）、**`OUTPUT`**（本主机发出）、**`FORWARD`**（经本主机路由），加 `PREROUTING`/`POSTROUTING`（用于 NAT）。你向链追加规则；每规则匹配（协议/端口/IP）并取 target（ACCEPT/DROP 等）。

**nftables** 是**现代替代**：**单一 `nft` 工具**和**统一、更表达的语法**，取代分立的 `iptables`/`ip6tables`/`arptables`/`ebtables`。它更干净地支持 map、set 和 IPv4/IPv6 合并规则，性能更好且能原子替换规则。底层同 **netfilter**——是框架演进，非不同机制。

**Kubernetes 相关性：** **kube-proxy**（实现 Service 负载均衡）历史上编程 **iptables** 规则把 Service 流量路到 pod IP——在成千上万 Service 时扩展性差（巨大规则表、线性匹配）。后来增了 **IPVS** 模式（内核 L4 负载均衡器，更拓展）现又有 **nftables** 模式。故 kube-proxy 用哪个后端直接影响大规模集群网络性能。

**为何顺序重要：** 链中规则**自上而下求值，首个匹配获胜**（应用其 target、通常停止）。故一条宽泛 `ACCEPT` 放在特定 `DROP` 之上会使 DROP 不可达。规则顺序功能上重要；错排会静默地开或阻流量。用 `iptables -L -n -v` 带包/字节计数地检查链，验证哪些规则真在匹配。

**要点：**
- 表：filter/nat/mangle/raw
- 链：INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING
- nftables 是继任者；底层同 netfilter
- 用 `iptables -L -n -v` 查计数

---

### 84. .dockerignore

**频率：** 低

**题目：** 请解释 `.dockerignore` 文件的作用。

**答案：** 跑 `docker build` 时，Docker 先把**整个构建上下文**（通常整个目录 `.`）**发给 Docker 守护进程**再执行 Dockerfile。`.dockerignore` **从那个上下文排除路径**——恰如 `.gitignore` 从 Git 排除文件——使它们从不上传到守护进程或可供 `COPY`/`ADD`。

**无它的问题：**
- **构建慢**——无排除时，**`node_modules`**、`.git` 历史、**构建产物**（`target/`、`dist/`）等巨目录**每次构建都上传到守护进程**，即使 Dockerfile 从不拷它们，也浪费时间与磁盘。大 repo 上上下文可达几百 MB。
- **镜像臃肿/损坏**——`COPY . .` 会拖入本地 `node_modules`（错架构原生模块）、本地构建产物和不该入镜像的杂物，造成微妙的"本地行、容器崩"。
- **密钥泄露**——最危险：本地 **`.env`、凭证、`.aws/`、私钥、`.git`** 可能**被拷入镜像**并推到 registry，泄密钥。排除它们是真实的安全控制。

**语法**镜像 `.gitignore`（glob 模式、`!` 否定）。至少**始终排除**：`.git`、`node_modules`、`target/`/`dist/`/`build/`、`*.env` 和凭证文件、本地缓存。**验证效果**：看构建输出——Docker 打 **`Sending build context to Docker daemon <size>`**（或 BuildKit 的传输上下文大小）；若那数字大得意外，你的 `.dockerignore` 漏了什么。（即使 `COPY` 选择性有帮助，你仍需 `.dockerignore` 保上下文*上传*小并防意外 `COPY .`。）

**要点：**
- 减少上下文上传时间
- 防止把 `.env`/`.git` 泄进镜像
- 语法镜像 `.gitignore`
- 即使用 BuildKit 也需要

---

### 85. BuildKit 特性

**频率：** 低

**题目：** 请描述 BuildKit 及其关键特性。

**答案：** **BuildKit** 是 Docker 的**现代构建引擎**（现代 Docker 默认，取代旧构建器）。它把构建重构为**依赖图**而非线性序列，解锁多项能力：

- **并行阶段执行**——多阶段构建里，独立阶段**并发**构建而非严格自上而下，缩短时间。BuildKit 只跑目标真正需要的阶段。
- **更好更聪明的缓存**——比旧构建器更精确的缓存失效与内容寻址缓存。
- **挂载类型**（通过 `RUN --mount`）：
  - **`--mount=type=cache`**——**跨构建**持久化一个目录（如包/编译器缓存）而不烤进镜像。如 `RUN --mount=type=cache,target=/root/.cache/go-build go build ...` 在构建间保留 Go 构建缓存，重编快——而缓存从不成为镜像层。
  - **`--mount=type=secret`**——把密钥（如 npm/pip token）暴给单个 `RUN` 而**不持久化进任何层**，避免密钥泄进镜像历史的经典错误。
  - **`--mount=type=ssh`**——把宿主 SSH agent 转发给 `RUN`（如 `git clone` 私有 repo）而不把密钥拷进镜像。

**如何启用：** 设 **`DOCKER_BUILDKIT=1`**（现代 Docker / `docker buildx` 里是**默认**），通常自动就有。

**远程缓存**——BuildKit 能用 `--cache-to` 和 `--cache-from` **把缓存导出/导入 registry**，使 **CI runner 共享构建缓存**（全新 CI runner 从 registry 拉缓存而非从零重建）——对 runner 短命的流水线极大提速。

**前端 `# syntax=` 指令**——首行 `# syntax=docker/dockerfile:1.x` 选一个 **Dockerfile 前端版本**，让你**独立于 Docker 守护进程版本**用上更新的 Dockerfile 特性（如上面的 `--mount`）——BuildKit 拉指定前端镜像来解析 Dockerfile。

**要点：**
- 并行阶段执行
- `--mount=type=cache|secret|ssh`
- 远程缓存（`--cache-from`、`--cache-to`）
- 通过 `# syntax=` 指令选前端

---

### 86. Buildx 多架构镜像

**频率：** 低

**题目：** 请解释用 buildx 构建多架构容器镜像。

**答案：** 不同 CPU 需要不同二进制——**amd64**（Intel/AMD）镜像跑不了 **arm64** 宿主，反之亦然。**多架构镜像**让*单个镜像 tag* 在两者上都能用。你用 **`docker buildx`**（BuildKit 驱动的构建命令）构建：

```
docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .
```

**它产出什么：** 一个 **manifest list**（即 **OCI image index**）——一个小的顶层 manifest，**每架构引用一个镜像**。所以 `repo/app:1.0` 不是单个镜像；它是指向 amd64 构建*和* arm64 构建的索引。

**消费者如何用：** 任何宿主跑 `docker pull repo/app:1.0` 时，registry/客户端查 manifest list 并**自动选匹配该宿主 CPU 的变体**——arm64 机拿 arm64 镜像、amd64 机拿 amd64，透明。一个 tag、处处正确的二进制。

**速度——QEMU vs 原生构建器：** 要为异于构建宿主的架构构建，buildx 可用 **QEMU 仿真**（如在 amd64 runner 上仿 arm64）——方便（处处可用）但**慢**，因每条指令都被仿真。求快用**原生远程构建器**——真 arm64 机构 arm64、amd64 机构 amd64——无仿真。`docker buildx create --use` 建一个能瞄准多节点/平台的构建器。

**为何现在重要：** **Apple Silicon（M 系、arm64）**上的开发者需 arm64 镜像本地跑/构，而生产越来越跑在 **arm64 服务器芯片**（**AWS Graviton、Ampere**）上求更好性价比——*且*大量基础设施仍是 amd64。发布多架构镜像意味同一 tag 在开发者的 Mac、amd64 CI runner 和 Graviton 生产上都跑，无需逐架构折腾。求速度时**优先原生 runner 而非 QEMU**。

**要点：**
- `docker buildx create --use`
- `--platform linux/amd64,linux/arm64`
- manifest list 按架构选
- 可能时用原生 runner 而非 QEMU

---

### 87. 镜像签名（Cosign、SLSA）

**频率：** 低

**题目：** 请用 Cosign、SLSA、attestation 解释镜像签名与供应链信任。

**答案：** 目标是**供应链完整性**——证明你将跑的镜像正是你可信流水线所构的*那个*制品，而非被篡改或在被入侵 registry 里掉包的。

**Cosign（sigstore 项目）**——**签 OCI 制品**（镜像及其他 registry 制品）。两种模式：**静态密钥**（你持私钥），或更强的**无密钥/OIDC**签名——不管长寿密钥，Cosign 从 **Fulcio** 取一个绑定 **OIDC 身份**（如你 GitHub Actions 工作流的身份）的**短寿证书**签，并把签名记入 **Rekor** 透明日志。于是签名证明"**这个身份**（这个 CI 工作流）构建并签了此镜像"，无密钥可泄或轮换。**签名与镜像一起存在 registry**（作引用镜像 digest 的相关制品）——无独立签名库。你签 **digest**（`cosign sign image@sha256:...`）而非可变 tag，故签名绑定确切内容。

**SLSA**（软件制品供应链级别）——一个**定义溯源级别**的框架，描述制品构建过程多可信。越高级要求越强保证；如 **SLSA Level 3** 要求**不可伪造的构建溯源**——由加固构建服务产出的、签名防篡改的"*如何*构建"记录（源、构建器、参数），使你伪造不了"这出自我们流水线"。它给供应链安全成熟提供阶梯。

**在准入处验证。** 若无物校验，签名一文不值。用 Kubernetes 里**准入时策略**（**Kyverno**、**Connaisseur** 或 sigstore policy-controller）**拒绝任何未被可信身份签名的镜像**——未签或错签镜像根本**无法部署到集群**。这把"我们签镜像"变成强制保证。

**attestation 补全链条。** 除裸签名外，附上签名的 **attestation**：**SBOM**（软件物料清单——镜像内组件/依赖的完整列表，支持"我受 CVE-X 影响吗"查询）和**构建溯源**（如何构建的 SLSA 记录）。三者合一——签名 + SBOM + 溯源，全可验证——你得到从源到运行容器的端到端可审计链。

**要点：**
- `cosign sign image@digest`
- 通过 OIDC + Fulcio 无密钥
- 准入处用策略校验
- SLSA 溯源做构建信任

---

### 88. 拓扑分散约束

**频率：** 低

**题目：** 请解释 Kubernetes 拓扑分散约束，以及为何在 HA 分散上胜过 pod anti-affinity。

**答案：** **拓扑分散约束**控制**一个工作负载的 pod 在拓扑域间多均匀分布**——如**可用区、节点、机架**等故障域。要点是高可用：若所有副本落一个区而该区挂，你全宕。分散它们保证一个区/节点丢失只带走一部分副本。

```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: {matchLabels: {app: web}}
```

**三个关键字段：**
- **`topologyKey`**——定义分散域的节点标签（区用 `topology.kubernetes.io/zone`、节点用 `kubernetes.io/hostname`、自定义 `rack` 标签等）。
- **`maxSkew`**——域间**最大允许不均**。`maxSkew: 1` 意味最多与最少域的 pod 数差至多 1——近乎完美均匀。更大 skew 允许更多不均。
- **`whenUnsatisfiable`**——约束*无法*满足时怎么办：**`DoNotSchedule`**（硬——宁让 pod **Pending** 也不违反分散）vs **`ScheduleAnyway`**（软——调度器*偏好*分散但满足不了也照放）。均衡分散是严格 HA 要求时选硬；有*某个*放置比完美均衡更重要时选软。

**为何 HA 分散上优于 pod anti-affinity：** **pod anti-affinity** 表达"别把这些 pod 放一起"，但对*把多副本均匀分散*笨拙且**扩展差**——anti-affinity 本质二元（避/许），多 pod 时调度器求值变贵，且无法表达"在容差内均衡"。拓扑分散约束对*分布*给**直接、量化的控制**（经 `maxSkew`），大规模下调度器性能更好、调优更细（硬 vs 软、多约束组合）。故"让我 N 个副本在区/节点间均衡"用分散约束这一专建工具；anti-affinity 更适简单"永不把这俩放一起"规则。

**要点：**
- `maxSkew` 控不均
- `topologyKey`：zone/hostname/rack
- `DoNotSchedule` vs `ScheduleAnyway`
- 多副本时比 anti-affinity 更好

---

### 89. CNI 选择：Calico、Cilium、Flannel

**频率：** 低

**题目：** 请对比 Kubernetes CNI 选择 Calico、Cilium、Flannel，以及你如何选。

**答案：** **CNI（容器网络接口）**插件提供 pod 网络——分配 pod IP 并在跨节点 pod 间路由流量。三个常见选择用简单换特性：

**Flannel**——**最简单**。一个基础 **VXLAN overlay**：把 pod 流量封在节点间隧道的 UDP 包里。易搭易懂，基本 pod-to-pod 连通"就是能用"。**局限：** 它**无 NetworkPolicy**（无法限制哪些 pod 能通信——扁平、全开网络），且 overlay 加封装开销。适**开发/学习集群**或不需网络安全或高性能的简单场景。

**Calico**——成熟、重安全的选择。可经 **BGP 无 overlay 路由** pod 流量（pod 得节点间通告的可路由 IP——无封装开销、性能更好、与物理网络集成更佳）。提供完整 **Kubernetes NetworkPolicy**（及更丰富的 Calico 策略）做分段，并有 **eBPF 数据面**选项求更高性能。当你需**网络策略强制**和与既有网络基础设施干净 **BGP 集成**时的首选。

**Cilium**——现代、**eBPF 原生**的选择。基于 eBPF（可编程内核数据面）它提供：**L3–L7 网络策略**（不止 IP/端口——你能在 *HTTP/gRPC/Kafka* 级 allow/deny，如"allow GET /api 但不 DELETE"）、**透明加密**（节点间 WireGuard/IPsec）、**无 sidecar 服务网格**（网格特性而不给每 pod 注入 Envoy sidecar——更少开销），及做深度**网络可观测性**的 **Hubble**（流级看谁在跟谁通信）。Cilium 甚至能用 eBPF 服务负载均衡**完全替代 kube-proxy**。

**如何选：** **Flannel** 用于无策略需求的简单开发/测试集群。**Calico** 当你要与既有网络的成熟 **NetworkPolicy + BGP** 集成和稳定选项。**Cilium** 用于要 **L7 策略、内建可观测性（Hubble）、加密、网格和 kube-proxy 替换**的**现代集群**——特性最丰富，代价是需较新内核和更多运维成熟度。

**要点：**
- Flannel：最简单、无策略
- Calico：BGP + NetworkPolicy
- Cilium：eBPF、L7 策略、Hubble
- Cilium 可替代 kube-proxy

---

### 90. Pod Security Standards

**频率：** 低

**题目：** 请解释 Pod Security Standards、它如何替代 PodSecurityPolicy，以及何时用 Kyverno/Gatekeeper。

**答案：** **Pod Security Standards（PSS）**定义**pod 必须多锁定**，是旧 **PodSecurityPolicy（PSP）**的内置替代，PSP 已在 **Kubernetes 1.25 移除**。PSP 难正确使用（授权模型混乱、易配错），故被更简单的 PSS + **PodSecurity 准入控制器**替代。

**三个等级**（严格递增）：
- **Privileged**——**不设限**。允许一切，含特权容器、宿主命名空间、hostPath 挂载。仅用于可信系统/基础设施负载。
- **Baseline**——**阻已知提权向量**同时与常见应用广泛兼容。禁特权容器、宿主网络/PID、危险能力——多数普通负载仍满足的合理最低限。
- **Restricted**——**重度加固**，遵 pod 加固最佳实践：必须**非 root**跑、**弃所有能力**、用 **`seccomp: RuntimeDefault`**、禁提权、鼓励只读根文件系统等。安全敏感负载的目标。

**如何强制**——内置 **PodSecurity 准入控制器**通过**每命名空间 label** 配置：

```yaml
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

还可设 `warn` 和 `audit` 模式（不阻地暴露违反，利于逐步推广）。`enforce` 下，违反该级的 pod 在**准入处被拒**。

**何时用 Kyverno / Gatekeeper（OPA）：** PSS 只给**三个粗、固定级**——不能定制具体规则。当你需**细粒度或自定义策略**（如"每 pod 必有特定 label"、"只允我们 registry 的镜像"、"强制资源限制"、或变更资源）时，用 **Kyverno** 或 **Gatekeeper** 这样的**策略引擎**。它们写任意校验/变更准入策略，覆盖 PSS 做不到的一切。常见模式：PSS `restricted` 作基线加固 + Kyverno/Gatekeeper 叠组织专有规则。

**要点：**
- PSP 在 1.25 移除；PSS 替代
- 等级：privileged/baseline/restricted
- 通过命名空间 label 强制
- 配合 Kyverno 做自定义规则

---

### 91. kubeconfig context

**频率：** 低

**题目：** 请解释 kubeconfig 与 context，以及防止错集群操作的实践。

**答案：** **kubeconfig**（`~/.kube/config`）告诉 `kubectl` **有哪些集群、如何向各集群认证、你当前瞄准哪个**。它持三类条目：**cluster**（API server 地址 + CA 证书）、**user**（凭证——证书、token、exec 插件）和 **context**。

**context 是（cluster + user + namespace）的具名捆绑**——它说"用*这个*集群、以*这个*用户、默认*这个*命名空间"。你用 `kubectl config use-context prod` **切活动 context**，之后每条 `kubectl` 都瞄准当前 context 所指。`kubectl config get-contexts` 列出并标出活动的。

**人体工学工具：** **`kubectx`**（快切 context——`kubectx prod`）和 **`kubens`**（快切 namespace——`kubens payments`）比冗长的 `kubectl config` 快很多，常带模糊选择。

**防破坏性错集群操作**——真危险：你*以为*在 staging 但活动 context 是 **prod**，你对生产跑了 `kubectl delete` 或 `apply`。护栏：
- **提示符指示**——用 **`kube-ps1`**（或 starship/oh-my-zsh 段）把**当前 context 和 namespace 显在 shell 提示符里**，使 prod 在你回车前总显眼地盯着你。提示符里看到 `(prod:payments)` 是最廉价、最有效的保障。
- **每环境分开 `KUBECONFIG`**——不用一个巨型配置混 prod 与 dev，而保持**分开的 kubeconfig 文件**并每终端/会话设 `KUBECONFIG`（如专门的"prod"终端）。这从结构上难以从 dev shell 误碰 prod。
- 其他实践：尽可能用**只读或受限凭证**、prod 要额外确认、别把 prod context 留作默认。

**要点：**
- Context = cluster + user + namespace
- 用 `kubectx`/`kubens` 求顺手
- 提示符指示防错集群
- 按环境分 `KUBECONFIG`

---

### 92. 临时容器（kubectl debug）

**频率：** 低

**题目：** 请解释通过 `kubectl debug` 的临时容器。

**答案：** **临时容器**让你**把一个临时调试容器附到已在跑的 pod 而不重启它**：

```bash
kubectl debug -it pod/foo --image=busybox:1.36 --target=app -- sh
```

**为何关键：** 加固镜像的初衷就是 **distroless / scratch 镜像无 shell**、无调试工具（无 `sh`、`curl`、`ps`、`cat`）——安全佳，但意味你**无法 `kubectl exec` 进去排障**（没东西可 exec）。临时容器解此：你把个*单独*容器（带 busybox/你的调试工具包）**注入运行中的 pod**，在应用*旁*给你 shell 和工具——关键是**不杀/不重启 pod**，使你能就地检查活的、出错的实例（重启会摧毁你想调的状态）。

**`--target` 共享进程命名空间。** 用 `--target=app`，调试容器**共享 `app` 容器的进程（PID）命名空间**，故从你的调试 shell 能**看到应用的进程**（`ps` 显示）并读其 **`/proc/<pid>/...`**——打开的文件、环境、内存映射、网络状态。这让你调*目标*容器的实际运行时而非只个兽弟。

**局限——无卷。** 你**不能给临时容器挂卷**（它们加到现有 pod spec，而后者不能新增卷挂载）。故你能通过 proc 看进程/文件系统，但不能挂新工具卷。做**主机级**检查（节点文件系统、kubelet、容器运行时、主机进程）用 **`kubectl debug node/<node>`**，它在节点上起一个特权 pod 并把主机文件系统挂在 `/host`——让你调节点本身而非 pod。

**要点：**
- 给 scratch/distroless 加 shell
- `--target` 与主共享 pid/net
- 节点调试做主机级检查
- 不能给临时容器挂卷

---

### 93. 准入控制器

**频率：** 低

**题目：** 请解释 Kubernetes 准入控制器、内置的几种与动态策略选项。

**答案：** **准入控制器**是**在认证授权后、对象持久化到 etcd 前拦截 API server 请求**的钩子——能**拒绝或修改** create/update 的最后一道门。它们分两种，顺序重要：**mutating 准入先跑**（能*改*对象——如注入 sidecar、加默认 label、设字段），**再跑 validating 准入**（只能*接受或拒绝*已定型的对象）。mutating 先于 validating 确保校验看到的是将真正存储的对象。

**内置准入控制器**（编进 API server）提供核心安全网：
- **LimitRanger**——给未指定的容器应用**默认 requests/limits**，并按命名空间 LimitRange 强制最小/最大。
- **ResourceQuota**——强制**命名空间级上限**（总 CPU/内存/对象数），拒绝超配额的 create。
- **PodSecurity**——基于命名空间 label 强制 **Pod Security Standards**（privileged/baseline/restricted）。

**动态/自定义策略**（Kubernetes 不自带的规则）三种方式：
- **ValidatingAdmissionPolicy**——in-tree、**基于 CEL** 的规则，定义为 Kubernetes 资源，由 API server 自身求值（无外部 webhook 要跑/维护）——适简单内联检查。
- **准入 webhook**——API server 回调你的服务做校验/变更；策略引擎靠此接入。
- **策略引擎**——**Kyverno**（策略写为 **Kubernetes 原生 YAML** 规则——易上手、无新语言）vs **OPA Gatekeeper**（策略写 **Rego**——更强大/表达但学习曲线陡）。两者强制自定义组织策略：**只允白名单 registry**、**必需 label/annotation**、**禁特权 pod**、要求资源限制等。

合起来把 API server 变成一个强制点，任何东西跑前组织规则已被保证。

**要点：**
- Mutating 在 validating 之前跑
- LimitRanger + ResourceQuota 做安全网
- Kyverno（YAML）vs Gatekeeper（Rego）
- CEL ValidatingAdmissionPolicy 做内联规则

---

### 94. 矩阵构建

**频率：** 低

**题目：** 请解释 CI 中的矩阵构建及其陷阱。

**答案：** **矩阵构建**把**同一作业跨多个维度的笛卡尔积跑**——自动对多种组合测试/构建而非为每个写单独作业。常见维度：**OS**、**语言/运行时版本**、**架构**。

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    node: [18, 20, 22]
```

这展开为 **2 × 3 = 6 个并行作业**（每 OS × 每 Node 版），验证你代码在所支持处都能工作。库靠此证明跨版本/平台兼容。

**关键控制：**
- **`fail-fast: false`**——默认 CI 在一个失败瞬间**取消所有剩余矩阵作业**（`fail-fast: true`）。设 **false** 让**每个组合跑完**，你一次看到**所有**失败（如"Node 18 *和* macOS 都挂"）而非修一个、重跑、再发现下一个。诊断多维问题时好很多。
- **`include` / `exclude`**——构**稀疏矩阵**：`exclude` 移除无意义的特定组合（如跳 macOS × Node 18），`include` 加纯积之外的一次性额外组合（或额外参数）。避免在无关组合上浪费资源，并能覆盖特例而不爆整个矩阵。

**告讫——乘法成本：** 矩阵大小是所有维度的**乘积**，故**成本乘法增长**而非加法。给一轴加第三个值、再加一个 2 值轴，能把 6 作业变 18。每作业耗 runner 和 CI 分钟，故不慎的矩阵会炋升构建时间与成本。保持矩阵有意图——测你真支持的版本/平台，其余用 `exclude` 剪掉，并盯总作业数。

**要点：**
- 维度的笛卡尔积
- `fail-fast: false` 看所有结果
- `include`/`exclude` 做稀疏矩阵
- 成本相乘增长

---

### 95. 构建可复现性与溯源

**频率：** 低

**题目：** 请解释构建可复现性与溯源，以及如何实现。

**答案：** **可复现性**意味**相同输入产出字节相同的输出**——从同一源重建，每次、任何机器上都得到*hash 完全相同*的制品。这对**可验证性**（任何人重建并确认发布二进制与源匹配——无隐藏篡改）和可信缓存/attestation 有价。不可复现构建埋隐藏变异（时间戳、绝对路径、依赖漂移），使*同一 commit* 的两次构建不同，挖掉验证。

**如何实现可复现：**
- **按 digest 钉基础镜像**——`FROM alpine@sha256:...` 而非 `FROM alpine:latest`。tag 可变（明天可指新镜像）；**digest** 是不变内容，基础不会在你脚下变。
- **用 lockfile 钉依赖**——`package-lock.json`、`poetry.lock`、`go.sum`、`Cargo.lock`——使每次构建解析到**完全相同的依赖版本与 hash**，而非"最新的"。
- **用 `SOURCE_DATE_EPOCH` 固定时间戳**——多工具把*当前*构建时间刻入输出，使每次不同。设这个标准环变量强制**确定、固定的时间戳**，使文件 mtime/元数据可复现。
- **构建期无网络**——禁止构建时从网络取任何东西（钉定、hash 验证的输入除外），使移动远端资源改不了输出。构建所需一切钉定并 vendored。

**溯源**——互补的信任制品：一个签名记录的**谁从哪里、如何构了什么**。生成 **SLSA 溯源**作为 **in-toto attestation**——签名声明记录**源（commit）、构建器（哪个 CI 系统/工作流）、构建参数、及结果制品 digest**。然后在**部署/准入时验证溯源**，使**只有你可信流水线从可信源构的制品能跑**——攻击者塞不进别处构的镜像，因它缺有效溯源。可复现 + 溯源合起来给出从源码到运行制品的可审计、防篡改链。

**要点：**
- 按 digest 钉基础镜像
- Lockfile + 冻结依赖
- SOURCE_DATE_EPOCH 求确定性时间
- SLSA 溯源建信任链

---

### 96. Ansible vs Salt vs Chef vs Puppet

**频率：** 低

**题目：** 请对比 Ansible、Salt、Chef、Puppet 四种配置管理工具及其在不可变基础设施时代的定位。

**答案：** 四者都做**配置管理**——把机器带到并保持在期望状态（装包、写配置文件、起服务），但在**架构、语言、执行模型**上分野。

**Ansible——无 agent、走 SSH、YAML、推模型。** 无需目标机装 agent：控制机经 **SSH** 连过去、推并跑任务。playbook 是 **YAML**（读写门槛低），执行是**推**（你从控制点主动发起运行）。**最易上手**——装 Python + SSH 即可，故成配置管理的事实主导者。典型：
```yaml
- hosts: web
  tasks:
    - name: 装 nginx
      apt: { name: nginx, state: present }
```

**Salt——agent 或 salt-ssh、YAML/Jinja、事件驱动且快。** 既可用 **minion agent**（走 ZeroMQ 高速消息总线，管大舰队极快），也可 **salt-ssh** 无 agent 跑。状态用 **YAML + Jinja** 模板。强项是**事件驱动**——minion 可对事件反应（reactor 系统），适合响应式自动化与大规模。

**Chef——Ruby DSL、基于 agent、声明式。** 配置写成 **Ruby DSL**（"recipe"/"cookbook"），表达力强但要会点 Ruby。目标机跑 **chef-client agent**，周期性从服务器拉并收敛到期望态。偏程序员向。

**Puppet——声明式 DSL、基于 agent、长命企业舰队。** 自有**声明式 DSL**，agent 定期从 Puppet master **拉**目录并收敛。在**长命企业舰队**（数千台常驻服务器要持续合规与漂移纠正）里久经考验，是老牌企业选择。

**不可变基础设施如何收窄其用途。** 随**容器与 Packer 烤的 AMI/镜像**兴起，模式从"起一台裸机再用配置管理反复调它"转向"**构一个不可变镜像、原样部署、要改就重建镜像换掉**"。这把配置管理的角色从*运行时持续收敛*收窄到*镜像构建期*——你可能在 Packer 构建里用 Ansible 烤镜像，但不再对活服务器天天跑收敛。**Ansible 因无 agent、简单，在 OS 级供给（装依赖、初始化、烤镜像、临时运维任务）上仍很流行**，而 Chef/Puppet 那种重 agent、持续收敛的模型在不可变世界里需求下降。

**要点：**
- Ansible：无 agent、YAML、推
- Salt：快、事件驱动
- Chef/Puppet：基于 agent、长历史
- 不可变基础设施缩配置管理范围

---

### 97. 边缘 / 全球负载均衡

**频率：** 低

**题目：** 请解释边缘与全球负载均衡的分层架构。

**答案：** 以低延迟和区域韧性服务全球用户，需要**从 DNS 边缘向下到集群堆叠多层负载均衡**，每层解决一块：

**1. Anycast DNS（入口）。** 请求从 DNS 起。**延迟/地理感知 DNS**（**Route53 基于延迟的路由**、**Cloudflare**）**按用户位置/延迟**把主机名解到 IP，导向最近区域。常走 **anycast** 使 DNS 解析本身命中最近 DNS 节点。粗（DNS 级、受 TTL 缓存）但把用户导到对的区域。

**2. CDN/边缘（靠近用户终止 TLS）。** **CDN/边缘网**（**CloudFront、Cloudflare、Fastly**）有**全球 PoP**，**靠近用户终止 TLS**——昂贵的 TLS 握手发生在附近边缘（低 RTT）而非遥远源站，大幅降连接延迟。边缘也缓静态内容并可经优化骨干链把动态请求回源。

**3. 区域负载均衡器。** 每区域内，**区域 LB**（AWS 上 **ALB/NLB** 或 GCP 区域 LB）**前置集群 ingress**——把流量分到该区的 ingress 控制器/服务/pod，在区域级做健康检查与连接分发。

**4. 全球负载均衡器（anycast IP + 故障切换）。** **全球 LB**（**AWS Global Accelerator**、**GCP Global Load Balancer**）提供**稳定 anycast IP**，在网络层**把流量导向最近的健康区域**——用户连一个 anycast IP 并经提供商私有骨干路到最近区域。关键是启用**自动区域故障切换**：若整个区域不健康，全球 LB **自动把流量移到次近的健康区域**，无需等 DNS TTL 过期（仅 DNS 故障切换的弱点）。

**合起来：** DNS + CDN/边缘把用户带到对的区域且附近终止 TLS；区域 LB 在区内摊负载；全球 LB 给 anycast 入口与快速跨区故障切换——兼得**低延迟**（最近健康位置）与**韧性**（自动区域故障切换）。

**要点：**
- DNS + CDN + 区域 LB 分层
- 全球 LB 提供 anycast IP
- TLS 在边缘终止
- 区域故障切换自动化

---

### 98. 追踪采样策略

**频率：** 低

**题目：** 请解释追踪采样策略：基于头、基于尾、自适应。

**答案：** 高流量系统里存**每一条** trace 贵不可担（量 + 成本），故**采样**——只留子集。策略差在*何时*做留/弃决定，这决定你能留什么。

**基于头采样**——在**请求最开始**、还不知结果时就决。通常**概率性**：如"留 1% trace"（请求入口抛硬币，传播下去使整条 trace 一致地留或弃）。**优：** 极简单且便宜——无需缓冲 span，决定即时、本地。**劣：** 因上来盲决，你会**随机弃掉稀有但重要的 trace**——一条错误或慢请求只有 1% 机会被留，故你错过大多数恰欲调查的 trace。

**基于尾采样**——**先收一条 trace 的所有 span，看完整 trace 后再决**。因现在*知*结果，可用聪明策略：**100% 留出错或慢的 trace**，只**对无聊的成功 trace 采样**（如 1%）。这**有用得多**——你保留重要的（错误、延迟尖刺）而弃日常噪声。**代价：** collector 必须**把每条在飞 trace 的所有 span 缓在内存**直到 trace 完成并决定——可观内存/基础设施开销，且协调多服务到达的 span 复杂。

**自适应采样**——**动态调采样率以命中目标量/吞吐**。不是固定 1%，而随流量变化升降率使你落在期望的 trace/秒附近（流量尖刺时保成本与后端容量、安静时多捕）。

**指导原则：始终 100% 留错误。** 不管怎么对成功/正常流量采样，你都应保留**所有错误 trace**（通常连同异常慢的）——那些才有诊断价值。这正是**基于尾**尽管有代价却常被偏好的原因：只有*看完* trace 再决才能保证留下每条错误。

**要点：**
- 头：便宜、可能漏错
- 尾：保错/慢、采样其余
- 自适应：目标量
- 始终 100% 保错

---

### 99. 混沌工程

**频率：** 低

**题目：** 请解释混沌工程：是什么、如何实践、工具有哪些。

**答案：** **混沌工程**是**向（类生产或生产）系统故意注入故障以验证它真有韧性**的实践——把对容错的假设变成经测试的事实。你注入如**杀 pod、加网络延迟/丢包、耗尽 CPU/磁盘、模拟整个 AZ/区域中断**的故障，再观察系统是否如设计应对。

**它是假设驱动，非随机乱来。** 纪律是*科学*的：你陈述**关于稳态行为的假设**、注入特定故障、检现实是否匹配。如"**若杀此服务一个 pod，流量应在 5 秒内转到健康 pod 且无用户可见错误**"——然后杀 pod 并度量。假设成立，你验证了该韧性机制；不成，你在事故*前*找到真实弱点。无假设地随机搞坏只造故障。

**从小开始、再扩展。** 先做**办公时间内小、受控的实验**（杀单个 pod、加适度延迟）——关键是*工作时间*，团队在盯，出事能中止，且爆炸半径有限。信心涨后升到**"game day"**——计划的、更大规模的演习，模拟如**全区域故障切换**的重大故障，作为团队验证 DR 流程、runbook 和人的响应，而非只软件。

**工具：** **Chaos Mesh** 和 **LitmusChaos**（Kubernetes 原生混沌平台——把实验声明为 CRD 杀 pod、注网络/IO 故障）、**Gremlin**（商业 SaaS 混沌平台，广泛故障目录与安全控制）和 **AWS Fault Injection Simulator（FIS）**（AWS 原生，跨 EC2/ECS/EKS/RDS 注故障，含 AZ 中断模拟）。价值：它**验证你关于韧性的假设**——确认故障切换、重试、超时、自动扩缩、冗余真能工作——而非在真实凌晨 3 点事故中发现它们不行。

**要点：**
- 假设驱动、不随机
- 从小开始、扩到 game day
- 工具：Chaos Mesh、Litmus、Gremlin、FIS
- 验证关于韧性的假设

---

### 100. 策略即代码（OPA、Kyverno、Conftest）

**频率：** 低

**题目：** 请解释策略即代码、工具格局与左移原则。

**答案：** **策略即代码**意味**把组织规则编码为版本控制、自动强制的代码**而非靠 wiki、清单、人工评审。典型策略：**"只签名镜像可跑"、"每资源必有 `team`/`cost-center` label"、"无特权 pod"、"无公开 S3"、"必需资源限制"**。它们在**两处强制**：**准入控制**（不合规资源碰 API server 时拒）和/或 **CI**（部署前让流水线失败）。强制自动且一致——无需人记得去查。

**工具对比：**
- **OPA / Gatekeeper**——用 **Rego**（OPA 专用策略语言）。很**强大、表达**（对结构化数据的任意逻辑），但 Rego 有**学习曲线**。Gatekeeper 把 OPA 集成为 Kubernetes 准入控制器。
- **Kyverno**——策略写为 **Kubernetes 原生 YAML** 规则。**无新语言要学**（懂 K8s YAML 就能写），能校验、变更、生成资源。对 K8s 为中心的团队更易上手；通用性不如 Rego。
- **Conftest**——在 CI 对***任何结构化文件***跑 **OPA/Rego**——不只活集群资源。指向 **Terraform plan、Dockerfile、Kubernetes manifest、JSON/YAML 配置**，它在**流水线里**对它们求你的策略。这让你在 **IaC 和 manifest 被应用前**就强制策略。

**左移原则：** 尽早抓违反——**在 PR/CI 失败，而非部署时（更糟是生产）**。在 pull request 里（用 Conftest）阻不合规 Terraform 变更，给开发者在其工作上下文里即时反馈，而非变更晚在 `apply`/准入被拒（反馈慢）或溩进 prod。在作者时修更便宜更快。

**先用审计模式推广：** 把策略翻到 **enforce**（*阻*违反）前，先以**审计/警告模式**跑——它**报**违反而不阻。这让你发现多少现有基础设施会失败、修好它，避免启用当天突然弄坏所有人的部署。审计 → 修复 → enforce 是安全采纳路径。

**要点：**
- Kyverno（YAML）vs OPA/Gatekeeper（Rego）
- Conftest 在 CI 中扫 IaC/manifest
- 左移：在 PR 中失败
- 强制前先审计模式
