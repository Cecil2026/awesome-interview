# DevOps 面试题

100 道关于 Docker、Kubernetes、CI/CD、基础设施即代码、可观测性、网络、安全和云的高频题。

---

### 1. 进程 vs 线程；解释 fork/exec

**频率：** 高

**题目：** 你的守护进程（会派生子进程去跑外部命令）跑几天后，`ps` 里挂着一大片 `<defunct>` 进程，进程表被占满，新的 `fork()` 开始报 `EAGAIN: Resource temporarily unavailable`。讲讲进程 vs 线程、fork/exec 原理、为什么会漏僵尸、怎么定位和修？

**这是什么 & 为什么用它：** `fork()`/`exec()` 是 Linux 上创建新进程、运行新程序的基本组合，守护进程靠它派生子进程干活；但父进程若不回收已退出的子进程，就会积累**僵尸进程**耗尽进程表，导致再也 `fork` 不出新进程。

**落地这个案例：** **进程**是隔离的**地址空间**，有自己的 **PID、文件描述符和内存**；**线程**活在进程*内部*，**共享**堆、全局变量和打开的 FD——因此**创建更便宜**、可通过共享内存通信，但某个线程的内存越界会拖垮整个进程，而进程之间互相隔离（一个崩溃不影响另一个）。这里的守护进程用的是多进程模型。

**`fork()`** 克隆调用进程，生出一个 **PID 不同的子进程**：内存是**写时复制（COW）**——父子共享同一批只读物理页，只有当某一方*真正写入*某页时才复制该页（所以改内存之前 `fork` 很便宜）；文件描述符被**复制**——子进程继承指向同一打开文件表项的 FD 副本（父子都能往继承来的管道/套接字写）。**`exec()`** 用**新程序替换当前进程映像**（代码、堆、栈），但**保持 PID 不变**（继承的 FD 除非标了 close-on-exec 也保留），成功时不返回，旧程序就此消失。**经典 shell 模式**就是 `fork` → 在子进程里 `exec` 运行命令 → 父进程 `wait` 收集退出状态。

本案例的病根：**僵尸进程**出现在父进程**未回收**已退出子进程时——子进程虽已结束，退出状态项仍滞留在进程表里，直到父进程调用 `wait`/`waitpid`。守护进程漏了这一步，每派生一个命令就泄漏一个僵尸槽位，累积到 `ulimit -u`（每用户进程上限）或系统 `pid_max` 后，`fork` 报 `EAGAIN`。

**怎么排查/定位/修复：**
1. `ps -el | grep -c defunct` 或 `ps aux | grep 'Z'` 数僵尸数量；`ps -eo pid,ppid,stat,cmd | grep defunct` 找出僵尸的**父进程 PPID**——真正有 bug 的是那个父进程。
2. 确认瓶颈：`ulimit -u` 看每用户进程上限、`cat /proc/sys/kernel/pid_max` 看系统上限，`ps --no-headers -e | wc -l` 看当前进程总数。
3. 短期缓解：重启（或给它发信号让它）父进程——父进程一死，僵尸被 PID 1 收养并立刻回收。
4. 根治：在守护进程里 `wait`/`waitpid` 回收，或注册 `SIGCHLD` 处理器循环 `waitpid(-1, ..., WNOHANG)`；或直接 `signal(SIGCHLD, SIG_IGN)` 让内核自动回收。用 `strace -f -e trace=clone,wait4,execve -p <pid>` 验证父进程到底有没有调 wait。

**面试常追问 / 权衡：** 线程共享堆便宜但不隔离，进程隔离但创建贵；COW 让 `fork` 之后紧接 `exec` 的场景几乎零拷贝开销；`vfork`/`posix_spawn` 是更省的变体。僵尸（Z 态，占 PID 但无内存）与孤儿进程（父先死、被 PID 1 收养）要区分清楚。

**要点：**
- 线程共享堆；进程不共享、彼此隔离
- `fork` 是 COW，未写入前便宜；`exec` 保 PID 但换二进制
- 漏 `wait`/`waitpid` → 僵尸堆积 → `fork` 报 `EAGAIN`
- 定位靠 `ps` 找僵尸 PPID，根治靠回收子进程或处理 `SIGCHLD`

---

### 2. cgroups 与 namespaces

**频率：** 高

**题目：** 一个容器化的 Java 服务在 K8s 里频繁 OOMKilled，可开发说"我 JVM 堆才设了 1G，节点明明有 64G 内存"；同时另一个同事的进程在容器里 `top` 看到的是宿主全部 64G。请从 cgroups/namespaces 角度解释容器到底是什么、为什么会这样、怎么排查？

**这是什么 & 为什么用它：** cgroups 和 namespaces 是*共同*构成容器的两个 Linux 内核原语——**namespace 隔离进程能*看到*什么**（可见性），**cgroup 限制并记账进程能*用*多少**（资源）。没有它们容器就无从隔离，也无法防止一个容器霸占整台机器。

**落地这个案例：** **容器就是一个普通进程**加上这些机制——用 namespace 让它看不到宿主，用 cgroup 让它不能霸占资源；内核里没有"容器"这种对象，Docker/containerd 只是围绕一个进程把这些设置好。

**Namespace** 给进程一份对某全局资源的私有视图，共 8 种：**PID**（自己的进程树——它看自己是 PID 1，看不到宿主进程）、**NET**（自己的网络栈——网卡、路由、端口）、**MNT**（文件系统挂载）、**UTS**（主机名）、**IPC**（共享内存/信号量）、**USER**（UID/GID 映射——容器内 root 在外面可以是非特权用户）、**CGROUP**（自己的 cgroup 根视图）、**TIME**（启动/单调时钟）。实践中 PID 和 NET 最显眼。

**cgroup（控制组）** 为 **CPU、内存、IO、pids** 强制配额并记账。本案例正是 cgroup 内存限额在起作用：K8s 把容器 `limits.memory` 写进内存 cgroup，JVM 堆 1G 之外还有 Metaspace、线程栈、堆外/直接内存、GC 结构，一旦 cgroup 总量超限，内核 **OOM 杀手**终止进程、Docker/K8s 报 **OOMKilled**（内存无法节流，要么有要么没有）；而同事 `top` 看到 64G，是因为老工具不读 cgroup 限额、直接读宿主的 `/proc/meminfo`（namespace 没隔离这个）。CPU 超配额则不同——只会被**限流**跑得更慢，不会被杀。

**怎么排查/定位/修复：**
1. `kubectl describe pod` 看 `Last State: Terminated / Reason: OOMKilled`，`dmesg | grep -i oom` 看内核 OOM 事件确认是哪个进程被杀。
2. 看真实限额：容器内 `cat /sys/fs/cgroup/memory.max`（cgroup v2）或 `.../memory/memory.limit_in_bytes`（v1），对比 JVM 实际 RSS。
3. 修 JVM：用 `-XX:MaxRAMPercentage=75` 让 JVM 感知 cgroup 限额（JDK 8u191+/11+ 默认已容器感知），别只盯堆；把容器内看到的核数/内存对齐 cgroup。
4. 查看归属：`systemd-cgls`、`cat /proc/self/cgroup` 看进程落在哪棵 cgroup 子树。

**面试常追问 / 权衡：** **cgroup v2** 用 `/sys/fs/cgroup` 下的单棵统一树取代 v1 各控制器分立的层级，修复不一致并支持更好的压力/PSI 指标，推荐使用。requests 用于调度、limits 用于运行时强制。容器感知的运行时（新版 JVM、Node、Go 的 `GOMAXPROCS`）会读 cgroup 而非宿主，老程序则需手动传核数/内存。

**要点：**
- Namespace = 隔离可见性；cgroup = 配额与记账
- 8 种 namespace，PID/NET 最显眼；容器=进程+这两者
- 内存超 cgroup → OOMKilled；CPU 超 → 限流
- 老工具读宿主 /proc，需让运行时容器感知（`MaxRAMPercentage`）；查看用 `systemd-cgls`、`cat /proc/self/cgroup`

---

### 3. TCP 三次握手与 TIME_WAIT

**频率：** 高

**题目：** 你的 API 网关调用下游服务在高峰期间歇报 `cannot assign requested address`（临时端口耗尽），`ss -s` 显示几万个 TIME_WAIT。请走一遍 TCP 握手/拆连，解释这堆 TIME_WAIT 是怎么来的、怎么定位和修，以及为什么不能简单粗暴关掉它？

**这是什么 & 为什么用它：** TCP 用三次握手建立可靠双向流、四次挥手拆连；`TIME_WAIT` 是主动关闭方在连接结束后保留一段时间的状态，用来保证连接干净关闭、防止旧数据串到新连接——它是正确性保障，不是 bug。

**落地这个案例：** **建连（三次握手）：** 客户端发 **SYN**（带初始序列号），服务端回 **SYN-ACK**（确认客户端序号并发自己的），客户端再发 **ACK**——SYN-ACK 合并了两步，所以三次而非四次。**拆连：** 双方各自独立发一个 **FIN** 并收 **ACK**（四个包，因为一方关闭后另一方仍可发送，即"半关闭"）。

本案例的病根：**发起关闭**的一方进入 `TIME_WAIT`，持续 **2×MSL**（最大段生存期，通常约 **60 秒**）。两个原因：(1) 让旧连接的**晚到重复段**不被误认为属于复用同一四元组（源 IP:端口、目的 IP:端口）的*新*连接；(2) 确保最后那个 ACK 到达对端（若丢失，对端重发 FIN，本方可再 ACK）。网关对每个请求都新建一条到下游的短命连接、用完即关，每条占住一个四元组约 60 秒，高扇出下把本机临时端口（`ip_local_port_range`，默认约 2.8 万个）耗尽，于是 `connect()` 报"无法分配地址"。

**怎么排查/定位/修复：**
1. `ss -tan state time-wait | wc -l` 数 TIME_WAIT，`ss -s` 看总览；确认是**客户端侧**（主动关闭方）堆积。
2. `cat /proc/sys/net/ipv4/ip_local_port_range` 看可用临时端口区间，`sysctl net.ipv4.ip_local_port_range` 可临时放宽（缓解，非根治）。
3. **正确的修法是架构层面的：连接池 / keep-alive**——复用连接而非频繁开关，把每秒新建连接数压下来，TIME_WAIT 自然消失。
4. 仍不够时再动内核：`net.ipv4.tcp_tw_reuse=1`（对*出站*连接安全地复用 TIME_WAIT 端口）、`SO_REUSEADDR`。**不要**盲目关掉该状态或用已废弃的 `tcp_tw_recycle`——会重新引入陈旧段/NAT 环境下的风险。

**面试常追问 / 权衡：** TIME_WAIT 落在主动关闭方，所以服务端大量 TIME_WAIT 往往意味着服务端在主动断连（可考虑让客户端关）。调大端口范围只是拖延，池化才是根治。CLOSE_WAIT 堆积是另一码事——那是应用忘了 `close()`。

**要点：**
- SYN -> SYN/ACK -> ACK；四次挥手，主动关闭方进 TIME_WAIT
- TIME_WAIT 防陈旧段串扰、保证末尾 ACK 送达
- 大量 TIME_WAIT = 短命连接过多 → 临时端口耗尽，池化/keep-alive 根治
- 查看 `ss -tan state time-wait | wc -l`，谨慎用 `tcp_tw_reuse`，勿盲目关闭

---

### 4. DNS 记录与 TTL

**频率：** 高

**题目：** 你要把生产流量从旧负载均衡器切到新的，改了 DNS 记录，结果部分用户切过去了、另一部分还在打旧 LB，拖了好几个小时；而且你还发现根域 `example.com` 死活配不上 CNAME 指向 ELB。请解释 DNS 记录类型、TTL 如何影响切换、这次为什么切得慢、以及正确的切换姿势？

**这是什么 & 为什么用它：** DNS 把名字解析成地址，各类记录承载不同映射；**TTL** 控制解析器缓存答案多久——它直接决定一次 IP 切换要多久才能全网生效，是做无痛迁移的关键旋钮。

**落地这个案例：** **记录类型：** **A** → **IPv4**；**AAAA** → **IPv6**；**CNAME** 把一个名字**别名**到另一个规范名（解析器会追到目标）；**SRV** 公告**服务 + 端口 + 优先级 + 权重**（服务发现——Kubernetes headless 服务发布 SRV）；**TXT** 携带**任意文本**用于校验和策略（SPF/DKIM 邮件认证、ACME/Let's Encrypt 挑战、域名归属证明）；**MX** 按优先级路由**邮件**。

这次配不上 CNAME 的原因：**顶点（`example.com` 本身）必须携带 SOA、NS 等记录**（区域运作所必需），而 CNAME 意思是"这名字*只不过*是别名，去解析目标"，不能合法地与那些记录并存——所以不能 `CNAME example.com → elb.aws.com`。用厂商的 **ALIAS/ANAME**（合成记录，服务端解析目标、在顶点返回 A 记录）绕过。切得慢的原因：切换前记录 TTL 还是默认的一两天，各地解析器/客户端把旧 IP 缓存了那么久，改记录后要等缓存自然过期才会拿到新值——所以出现"一半新一半旧"。

**怎么排查/定位/修复：**
1. 切换*前*数小时（或一天）**把 TTL 降下来**（如降到 60s），让全网缓存快速过期到短周期。
2. `dig +short name @8.8.8.8`、`dig name @<权威NS>` 对比多个解析器，确认新 TTL 已在各处生效、传播完成。
3. 再**切换记录**——客户端在短短 60s 内拿到新值；`dig +trace name` 端到端看解析链路，确认打到新 LB。
4. 稳定后把 TTL 调回较高值（省查询、增韧性）。回滚同理：低 TTL 期间改回旧值即可快速生效。

**面试常追问 / 权衡：** **低 TTL** = 传播快、利于迁移，但查询量更大打到权威服务器、略增延迟；**高 TTL** = 缓存/韧性好但改动慢。注意有些客户端（浏览器、JVM）无视 TTL 自缓存，DNS 切换不是零风险，配合健康检查/双活更稳。

**要点：**
- 顶点禁 CNAME，用 ALIAS/ANAME；headless 服务用 SRV
- TTL 决定切换生效速度：切换前提前降 TTL
- 降 TTL → 等传播 → 切记录 → 事后调回
- 用 `dig +trace`/`dig @解析器` 验证传播与最终指向

---

### 5. 镜像 vs 容器 vs 层

**频率：** 高

**题目：** 有人反映"我往容器里写的配置文件，容器一重建就没了"，同时你发现节点磁盘被镜像占满、但明明很多镜像都基于同一个 base。请解释镜像/容器/层的关系，说清数据为什么会丢、磁盘为什么能被共享省下来、以及怎么排查？

**这是什么 & 为什么用它：** 镜像是不可变的只读模板，容器是它加了一层可写层的运行实例，层是内容寻址的文件系统差量——理解这三者才能解释"容器里写的东西为什么不持久"和"镜像为什么能去重省磁盘"。

**落地这个案例：** **镜像**是**不可变、内容寻址的捆绑**，含文件系统**层**加**元数据**（entrypoint、env、暴露端口、默认命令）——一个冻结快照，可发布并按 digest 完全复现。**层**是**一个构建步骤**产生的 **tar 差量**（如 `RUN apt-get install ...` 加一层新文件），按 **SHA-256 digest 内容寻址**，因此**跨镜像去重**：两个镜像共享同一 base 和同一 `apt` 层，该层磁盘上只存一份、只 pull 一次——这就是为什么很多镜像基于同一 base 时磁盘没有翻倍，也是 pull 第二个共享基础镜像很快的原因。

数据丢失的原因：**容器**是镜像的**运行实例**，内核拿镜像的**只读层**，在上面叠一个**薄可写层**（联合/overlay 文件系统）。所有运行时变更（写文件、日志）都落在那个可写上层；底层镜像层不动、在该镜像每个容器间共享。**删掉容器，可写层就丢弃**——所以往容器里写的配置一重建就没了，持久化必须用**卷（volume）**把数据存到可写层之外。

**怎么排查/定位/修复：**
1. 磁盘：`docker system df` 看镜像/容器/卷各占多少，`docker system df -v` 看每个镜像的可共享层；`docker history <image>` 看某镜像每层大小与来源指令。
2. 层共享：`docker image inspect <img> --format '{{.RootFS.Layers}}'` 对比两个镜像的层 digest，确认哪些是共享的。
3. 数据持久化：把易变数据挂 `-v mydata:/path` 命名卷或绑定挂载，别写进容器可写层；`docker volume ls` 确认。
4. 清理磁盘：`docker image prune`（悬空层）、`docker system prune -a`（谨慎，删未用镜像）。

**面试常追问 / 权衡：** 既然层按 digest 共享，把 Dockerfile 组织成**稳定层在前、复用共享 base**能在构建*和* pull 两方面最大化缓存命中，传输字节更少、磁盘更省。可写层用 CoW，频繁大量写会有 overlay 开销——重 I/O 数据也该走卷。

**要点：**
- 镜像 = 只读层 + config manifest；层内容寻址（sha256）跨镜像去重
- 容器 = 镜像 + 一层薄可写层，删容器即丢，持久化用卷
- 复用 base 最大化缓存命中、省磁盘与 pull 时间
- 排查用 `docker system df`、`docker history`、`image inspect` 对比层

---

### 6. RUN vs CMD vs ENTRYPOINT

**频率：** 高

**题目：** 你的服务部署后，`kubectl rollout restart` 或 `docker stop` 每次都要等满 30 秒宽限期才被强杀，日志里根本没有"收到 SIGTERM、开始优雅关闭"。查下来 Dockerfile 写的是 `CMD myapp --port 8080`（shell 形式）。请解释 RUN/CMD/ENTRYPOINT 的区别、这个故障为什么发生、怎么定位和修？

**这是什么 & 为什么用它：** RUN 在构建期造层，ENTRYPOINT/CMD 定义容器启动时跑什么；用 **exec 形式**书写能让你的进程直接成为 PID 1、正确收到停止信号，从而实现优雅关闭——否则会像本案例一样每次都被超时强杀。

**落地这个案例：** **`RUN`** 在**构建期**执行、产生**新镜像层**（装包、编译，如 `RUN apt-get install -y curl`），与启动时跑什么无关。**`ENTRYPOINT`** 定义容器启动时**始终运行的可执行**——固定的"这容器*是*什么"（`ENTRYPOINT ["nginx"]`）。**`CMD`** 给 entrypoint 提供**默认参数**（或无 ENTRYPOINT 时提供易覆盖的**默认命令**）。惯用法 `ENTRYPOINT ["myapp"]` + `CMD ["--port","8080"]` → 默认跑 `myapp --port 8080`，而 `docker run img --port 9090` 只换参数、保持 `myapp` 固定。**运行时覆盖：** `docker run image arg1 arg2` 追加的参数**替换 CMD**；`--entrypoint` 替换 ENTRYPOINT 本身。

本案例的病根就在 shell 形式：`CMD myapp --port 8080` 把你的进程作为 **`/bin/sh -c` 的子进程**跑，于是 **shell 成了 PID 1**。`docker stop`/K8s 终止时向 PID 1（shell）发 `SIGTERM`，shell 往往**不转发**给子进程，你的应用收不到信号、不会优雅关闭，等满宽限期后被 `SIGKILL` 强杀——这正是"卡满 30 秒、无优雅关闭日志"的表现。

**怎么排查/定位/修复：**
1. `docker inspect <img> --format '{{.Config.Entrypoint}} {{.Config.Cmd}}'` 看是不是被包成了 `/bin/sh -c ...`。
2. 进容器 `ps -ef` 或 `cat /proc/1/comm` 看 PID 1 到底是 `sh` 还是你的应用——是 `sh` 就中招了。
3. 改成 **exec 形式**：`ENTRYPOINT ["myapp"]` + `CMD ["--port","8080"]`（JSON 数组），让你的进程成为 PID 1 直接收信号，还省掉多余 shell。
4. 若确实需要 shell（变量展开等），用一个转发信号的 init（`tini`、`--init`）或在应用里 `exec` 掉 shell。验证：`docker stop` 应秒退并打出优雅关闭日志。

**面试常追问 / 权衡：** exec 形式不经 shell，因此不做变量展开/通配（需要时才用 shell 形式并配 init）。ENTRYPOINT 固定"是什么"、CMD 提供"默认怎么跑"，二者配合既固定又可覆盖。PID 1 还有僵尸回收职责（见 tini 相关题）。

**要点：**
- RUN=构建期层；ENTRYPOINT=固定二进制；CMD=默认参数/回退
- 追加参数替换 CMD，`--entrypoint` 替换 ENTRYPOINT
- shell 形式让 sh 成 PID 1、吞掉 SIGTERM → 优雅关闭失效、超时强杀
- 用 exec 形式（JSON 数组）让应用成 PID 1；查 `/proc/1/comm` 定位

---

### 7. 层缓存顺序

**频率：** 高

**题目：** 团队抱怨 CI 里每次构建都要跑满 6 分钟——即使只改了一行业务代码，`npm ci`/`go mod download` 也每次从头重装。你打开 Dockerfile 发现第一句就是 `COPY . .`。请解释层缓存原理、为什么每次都失效、以及怎么把构建从分钟级降到秒级？

**这是什么 & 为什么用它：** Dockerfile 层缓存按每条指令的输入复用已构建的层，指令顺序安排得当就能跳过昂贵的依赖安装——顺序错了（像本案例把源码复制放在依赖安装之前）就会每次全量重建。

**落地这个案例：** **每条指令按其输入缓存。** Docker 从指令及其触及内容算缓存键（`COPY` 是所复制文件的校验和，`RUN` 是命令字符串加先前的层）。重建时键匹配就复用——但**一旦某条指令的键变了，其后每一层都失效**并从那里向下重建（每层依赖前一层状态）。本案例正中要害：先 `COPY . .` 再安装，任何一个字符的源码改动都改变复制层的校验和、击破那一层，导致其后的 `npm ci`/`go mod download` 每次重跑，白白 6 分钟。

**顺序原则：很少变动的放前面，频繁变动的放后面。** 最优顺序：
1. **基础镜像**（`FROM`）——几乎从不变。
2. **系统包**（`RUN apt-get install ...`）——很少变。
3. **依赖清单**（`COPY package.json package-lock.json ./` 或 `go.mod go.sum`）——偶尔变。
4. **安装依赖**（`RUN npm ci` / `go mod download`）——昂贵的一步。
5. **复制源码**（`COPY . .`）——*每次*提交都变。

**怎么排查/定位/修复：**
1. 看构建日志里的 `CACHED` 标记——哪条指令之后不再有 `CACHED`，缓存就是从那里断的；那条通常就是排错位置的 `COPY . .`。
2. 把清单复制提前：先 `COPY package.json package-lock.json ./` → `RUN npm ci` → 最后才 `COPY . .`。这样仅改源码时清单层*和安装层*都命中缓存，只重跑末尾的 `COPY . .`——**分钟级降到秒级**。
3. **按 digest 钉基础镜像**（`FROM node:20@sha256:...`）求可复现，避免浮动 tag 静默改基础、连带击破所有缓存。
4. 用 **BuildKit 缓存挂载**（`RUN --mount=type=cache,target=/root/.npm npm ci`）在*跨*构建间保留包管理器缓存，即使安装层本身失效也不必重新下载。
5. CI 上确保开启 `DOCKER_BUILDKIT=1` 并配好缓存导入导出（`--cache-from`/registry cache），否则每次全新 runner 都是冷缓存。

**面试常追问 / 权衡：** `.dockerignore` 很关键——否则 `node_modules`、`.git` 会混进 `COPY . .` 的校验和、无谓击破缓存。缓存越激进越快但也越容易吃到陈旧依赖，安全场景要能强制不带缓存重建（`--no-cache`）。

**要点：**
- 缓存从首次变更的指令起向下全部失效
- 把依赖清单复制在源码之前，隔离昂贵的安装层
- 看构建日志 `CACHED` 定位缓存断点；配 `.dockerignore`
- 按 digest 钉 base 求可复现；BuildKit `--mount=type=cache` 跨构建缓存包

---

### 8. 多阶段构建

**频率：** 高

**题目：** 安全扫描把你的镜像拦下了：一个只跑单个 Go 二进制的服务，镜像却有 800MB，Trivy 报了几十个 CVE，还发现镜像里带着 Go 编译器、git 和整棵源码树。请解释多阶段构建、它怎么同时解决体积和攻击面问题、以及怎么落地验证？

**这是什么 & 为什么用它：** 多阶段构建在一个 Dockerfile 里用多个 `FROM` 阶段，在重型工具链里编译、只把产物复制进小运行时镜像——正是用来解决本案例这种"发布镜像里混进了编译器、源码和一堆 CVE"的问题。

**落地这个案例：** 多阶段构建用**多个 `FROM` 阶段**：你在**重型工具链镜像**（编译器、开发头文件、完整 SDK）里构建，然后**只把完成的产物复制**进一个**小型运行时镜像**，丢弃其余一切。构建保持封闭（全在一个 Dockerfile），而发布的镜像却很小。

```dockerfile
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/app /app
ENTRYPOINT ["/app"]
```

**工作方式：** `--from=build` 从一个命名的早期阶段*把*产物复制到当前阶段。第一阶段（带 Go 工具链，500MB+）仅用于产出 `/out/app` 二进制，**不属于最终镜像**——只有最后一个阶段会发布。这样本案例里 800MB 的臃肿镜像会缩到几 MB，编译器、git、源码全被丢弃。

**为什么最终镜像应排除编译器和源码：** 你发布的每一个工具和源文件都是**攻击面**和 **CVE 负担**。发布的 Go 编译器、包管理器、shell 或源码树都给攻击者提供了可利用的工具并抬高漏洞扫描结果——而运行一个编译好的静态二进制根本不需要它们。**配合 distroless**（`gcr.io/distroless/static`）更进一步：运行时镜像**无 shell、无包管理器、无 libc**（对静态二进制）——只有你的二进制及其最小依赖。这极大**最小化攻击面和 CVE 暴露**（distroless 可能零已知 CVE，而完整 `ubuntu` 基础可能数十个），镜像从几百 MB 缩到几 MB，加快 pull 和部署。

**怎么排查/定位/修复：**
1. 先量化问题：`docker images` 看体积，`docker history <img>` 看哪层最大，`trivy image <img>` 看 CVE 来自哪些包（多半是 base 里的 libc/工具链）。
2. 改成上面的两阶段：`FROM golang AS build` 编译 → `FROM gcr.io/distroless/static:nonroot` + `COPY --from=build`。
3. 重扫验证：`trivy image` CVE 应大幅下降，`docker images` 体积应从几百 MB 到几 MB。
4. 若 distroless 里没 shell 不方便调试，用 `kubectl debug`/临时容器附加一个带工具的调试镜像，而不是把工具塞回运行镜像。

**面试常追问 / 权衡：** distroless/scratch 无 shell 导致 `docker exec` 进不去、排障难，需靠临时容器；动态链接的二进制得用 `distroless/base`（带 libc）而非 `static`。可用 `--target build` 只构建到某阶段做调试，用命名阶段做测试阶段。

**要点：**
- 分离构建 vs 运行时阶段，`--from=stage` 只复制产物
- 最终镜像不含编译器/源码 → 攻击面与 CVE 大降
- 配合 distroless 得到最小 CVE 面、几 MB 体积
- 用 `trivy image`/`docker history` 量化验证，调试靠临时容器

---

### 9. 资源上限与 OOM

**频率：** 高

**题目：** 一个 pod 两种毛病同时出现：偶尔被 `OOMKilled` 重启，平时 P99 延迟又莫名很高但从不崩。开发怀疑是节点故障，但同节点其他 pod 正常。请解释容器资源上限怎么强制、这两种症状分别对应超内存还是超 CPU、以及怎么定位区分？

**这是什么 & 为什么用它：** 容器资源上限通过 cgroups 强制，防止一个失控进程饿死整台主机；理解"超内存被杀、超 CPU 被节流"这一根本差异，才能把本案例的两种症状分别对上号。

**落地这个案例：** **没有上限，容器会饿死主机**——失控进程耗尽内存或 CPU，拖垮节点上所有工作负载。上限由 **cgroups** 强制：`docker run --memory=512m --cpus=1` 写入内存和 CPU cgroup。

**两种上限行为根本不同，正好对应本案例两种症状：**
- **内存超限 → 进程被杀（对应偶发 OOMKilled）。** 内存无法"节流"——要么有字节要么没有。容器试图超过内存 cgroup 时，内核 **OOM 杀手**终止该 cgroup 内一个进程，Docker/K8s 报 **`OOMKilled`**，很突兀、没有优雅关闭。
- **CPU 超限 → 进程被节流，不被杀（对应平时高延迟）。** CPU 按时间片分配，超 CPU 配额只意味着内核**给该容器排更少时间**——跑得更慢（延迟高）但继续跑。你会看到 CPU 节流指标，而非崩溃。所以"P99 高但不崩"多半是 CPU limit 被打满触发节流。

**在 Kubernetes 中**有**两个旋钮**：**`requests`**（pod 被*保证*的量，**调度器**据此把 pod 放到有容量的节点）和 **`limits`**（cgroup 运行时强制的硬上限）。超内存 limit → OOMKilled 并重启（持续则 CrashLoopBackoff）；超 CPU limit → 节流。requests 低于 limits 可实现超售（节点打包比 limits 之和更紧）。

**怎么排查/定位/修复：**
1. OOM 侧：`kubectl describe pod` 看 `Last State: Terminated / Reason: OOMKilled`，`dmesg | grep -i oom` 看内核 OOM 事件；调大 `limits.memory` 或修内存泄漏，`kubectl top pod` 看实际用量。
2. 节流侧：查容器内 `cat /sys/fs/cgroup/cpu.stat` 的 `nr_throttled`/`throttled_time`，或 Prometheus 的 `container_cpu_cfs_throttled_periods_total`——非零且高说明在被 CPU 节流。
3. 修节流：调高 `limits.cpu`、或去掉过紧的 CPU limit（只留 request）以避免 CFS 配额造成的突发抖动。
4. 用 `kubectl top pod`/`kubectl top node` 对比 request 与实际用量，校准超售比例。

**面试常追问 / 权衡：** CPU limit 是否该设有争议——过紧的 limit + CFS 会给突发型服务带来"明明有空闲核却被节流"的延迟毛刺，很多实践建议只设 request 不设 CPU limit。内存 limit 则必须设（防 OOM 蔓延）。requests 决定 QoS 类和调度密度。

**要点：**
- 内存超 limit → OOMKill（突发型症状）；CPU 超 limit → 节流（高延迟症状）
- `requests` 调度、`limits` 运行时强制；requests<limits 可超售
- OOM 查 `dmesg`/`describe pod`，节流查 `cpu.stat` 的 `nr_throttled`
- CPU limit 过紧会造成延迟毛刺，权衡是否只留 request

---

### 10. Pod vs Deployment vs ReplicaSet vs StatefulSet vs DaemonSet vs Job vs CronJob

**频率：** 高

**题目：** 有人用 Deployment 部署了一套 3 副本的数据库，扩缩容后发现数据错乱、pod 名字每次都变、重建后挂到了别人的卷上。同时另一个团队想让日志采集器"每个节点都跑一个"却漏了新加的节点。请对比 K8s 主要工作负载资源，指出上面两处选型错在哪、该用什么、怎么排查？

**这是什么 & 为什么用它：** 这些工作负载资源从底到高构成一个层级、每层加不同保证；选对类型才能拿到"稳定身份/每 pod 存储/每节点覆盖"等语义——本案例的两处故障正是把有状态服务塞进 Deployment、把每节点代理没用 DaemonSet 造成的。

**落地这个案例：**
- **Pod**——**最小可部署单元**：一个或多个**共置容器**共享网络命名空间（localhost、一个 IP）和 IPC。很少直接建裸 Pod（短暂、不自愈）。Sidecar（代理、日志采集）与主容器同 pod。
- **ReplicaSet**——维护**恰好 N 个相同副本**，死了就重建；几乎从不直接管，它是 Deployment 的底层机制。
- **Deployment**——管理 ReplicaSet，为**无状态应用**（默认选择）提供**滚动更新和回滚**（maxSurge/maxUnavailable，`kubectl rollout undo` 回退）。但它的 pod **身份可互换、无稳定名字、无稳定存储**——这正是那套数据库出问题的根源：扩缩时 pod 随机重建、共享同一 PVC 模板导致数据错乱。
- **StatefulSet**——用于**有状态工作负载**（数据库、Kafka）：**稳定网络身份**（`pod-0`/`pod-1` 带黏性 DNS）、**稳定的每 pod 存储**（各自保留自己的 PVC 跨重调度）、**有序顺序**的滚动/伸缩（pod-0 先于 pod-1）。那套数据库应该用它。
- **DaemonSet**——**每节点跑一个 pod**（新节点自动补上）。日志采集器应该用它——用 Deployment 定副本数就会漏掉新节点。用于节点级代理：日志采集（Fluent Bit）、CNI 插件、node exporter、监控代理。
- **Job**——把 pod 跑**到完成**并跟踪成功、失败重试。
- **CronJob**——**按 cron 调度 Job**（夜间备份、周期报表）。

**怎么排查/定位/修复：**
1. 看归属：`kubectl get pod <name> -o jsonpath='{.metadata.ownerReferences}'` 或 `kubectl get all` 看 pod 是被哪种控制器管的——数据库 pod 若 owner 是 ReplicaSet 就选型错了。
2. 数据库迁移到 StatefulSet：用 `volumeClaimTemplates` 让每个 pod 有独立 PVC；确认 `kubectl get pvc` 里每个序号一份、`pod-0.svc` 这类稳定 DNS 可解析。
3. 日志采集改 DaemonSet：`kubectl get ds -A` 看 `DESIRED/CURRENT` 是否等于节点数；`kubectl get nodes` 对比，确认新节点也起了 pod（注意 taint 需配 toleration）。
4. **快速规则：** 无状态 → Deployment；身份/顺序/每 pod 存储 → StatefulSet；每节点代理 → DaemonSet；一次性/定时批处理 → Job/CronJob。

**面试常追问 / 权衡：** StatefulSet 伸缩慢（有序）、删除不自动删 PVC（防丢数据），运维比 Deployment 重。DaemonSet 要配 toleration 才能覆盖有污点的节点（如控制面）。裸 Pod 不自愈，生产永远用控制器包一层。

**要点：**
- 无状态用 Deployment；有序/稳定身份/每 pod 存储用 StatefulSet
- 每节点代理用 DaemonSet（自动覆盖新节点，注意 toleration）
- 批处理用 Job/CronJob；裸 Pod 不自愈
- 靠 `ownerReferences`/`get ds`/`get pvc` 定位选型错误

---

### 11. Service 类型

**频率：** 高

**题目：** 你给每个对外微服务都开了一个 `type: LoadBalancer`，月底云账单冒出十几个计费的 ELB；另外一个连 gRPC 的客户端总把请求全压到同一个后端 pod 上、负载不均。请解释各 Service 类型、这两处该怎么改、以及流量不通时怎么排查？

**这是什么 & 为什么用它：** Service 在一组短暂 pod（按 label 选中）前给出稳定端点；选对类型既能省掉本案例里成堆的计费 LB，又能解决"gRPC 长连接压到单 pod"的负载不均问题。

**落地这个案例：** 类型从集群内部向外部层层展开：
- **ClusterIP**（默认）——**只在集群内可达的虚拟 IP**，kube-proxy 在匹配 pod 间负载均衡。用于内部服务间流量。
- **NodePort**——在**每个节点 IP 的静态端口（30000–32767）**暴露；粗糙的外部访问，多作为 LoadBalancer 构件或裸机/开发用。
- **LoadBalancer**——**配置一个云 LB**（AWS ELB、GCP LB）指向 NodePort，给单个外部 IP/DNS。**每个都是真实计费的云 LB**——这正是账单爆炸的原因；实践中应**用一个 Ingress 前置多个服务**，共享一个 LB。
- **ExternalName**——返回到外部主机名的 **CNAME**（`my-db.example.com`），不代理、纯 DNS，把外部依赖别名到集群内名字。
- **Headless**（`clusterIP: None`）——**跳过虚拟 IP**，通过 **DNS A/SRV** 直接返回**各 pod IP**。当客户端需寻址特定 pod 而非 VIP 时用——StatefulSet（稳定 DNS `pod-0.svc`）和客户端侧服务发现。gRPC 那个问题的根源就在这：gRPC 是 HTTP/2 长连接，一旦连上 ClusterIP 后就固定复用一条连接、请求全压到同一 pod；改用 **Headless + 客户端侧负载均衡**（或 L7 代理/服务网格）才能把 RPC 摊开。

**怎么排查/定位/修复：**
1. LB 账单：`kubectl get svc -A | grep LoadBalancer` 数一下有多少个；把它们收敛到一个 Ingress（`kubectl get ingress`），后端用 ClusterIP。
2. gRPC 负载不均：`kubectl get endpoints <svc>` 确认有多个 pod IP，但监控显示只有一个在扛——典型 L4 长连接问题；换 Headless 让客户端做轮询，或走支持 HTTP/2 感知的 Ingress/网格。
3. 流量不通通用链路：`kubectl get svc`（看 ClusterIP/端口）→ `kubectl get endpoints <svc>`（**空 endpoints = selector 没匹配到 pod 或 pod 未 Ready**，最常见故障）→ `kubectl get pod --show-labels` 核对 label → 集群内 `kubectl run tmp --rm -it --image=nicolaka/netshoot -- curl <svc>:<port>` 实测。
4. **经验法则：** 内部 → ClusterIP；对外 → Ingress 前置（少用裸 LoadBalancer）；按 pod 寻址 → Headless。

**面试常追问 / 权衡：** Service 靠 endpoints/EndpointSlice 反映 Ready 的 pod，readiness 探针未过的 pod 不进 endpoints。`externalTrafficPolicy: Local` 可保留客户端源 IP 但可能负载不均。kube-proxy iptables/IPVS 只做 L4，L7 路由/gRPC 摊流需 Ingress 或网格。

**要点：**
- ClusterIP 内部 VIP；NodePort 每节点端口；LoadBalancer 每个都计费，用 Ingress 收敛
- Headless 返回各 pod IP，供 StatefulSet 与客户端侧负载均衡（gRPC 长连接必备）
- 空 `endpoints` 是流量不通头号原因：查 selector/label/readiness
- 排查链路：`get svc` → `get endpoints` → 核对 label → netshoot 实测

---

### 12. ConfigMaps vs Secrets

**频率：** 高

**题目：** 安全审计发现：一个有 `kubectl get secret -o yaml` 权限的实习生把数据库密码 base64 解开就看到了明文；更糟的是你轮换了数据库密码、更新了 Secret，可 pod 还在用旧密码连不上库。请对比 ConfigMap 与 Secret、解释这两处问题的根因、以及怎么做*真正的*密钥管理与热轮换？

**这是什么 & 为什么用它：** ConfigMap/Secret 都是键值存储、可作为环境变量或文件挂载进 pod；分清它们的意图和 Secret"只是 base64 不是加密"的弱保护，才能解释本案例的泄露和轮换不生效两个问题。

**落地这个案例：**
- **ConfigMap** 放**非敏感配置**——特性开关、URL、调优参数。
- **Secret** 放**凭证**——密码、令牌、TLS 密钥。但关键警告、也是实习生能看到明文的原因：**Secret 在 etcd 中静态时只是 base64 编码，不是加密**——base64 是*编码不是安全*，任何能读 etcd（或有权限 `kubectl get secret -o yaml`）的人都能轻易解出值。要真正安全，必须**启用由 KMS 支持的 etcd 静态加密**（AWS KMS、GCP KMS），并锁紧 RBAC 使很少人能读 Secret。

轮换不生效的根因——**文件挂载 vs 环境变量的运维差异：** 把 ConfigMap/Secret **作为文件**挂载时，Kubernetes（经 kubelet）会**把更新传播到挂载文件而不重启 pod**，轮换后的凭证能被 file-watch 的应用（或 sidecar reloader 通知）拾取。但作为**环境变量**注入的值在**容器启动时就捕获、永不更新**——必须重启 pod 才拾取变更。本案例正是用了 env var 注入，所以更新 Secret 后 pod 仍拿旧密码。无停机轮换时**优先文件挂载**。

**怎么排查/定位/修复：**
1. 泄露侧：`kubectl auth can-i get secrets --as=<user> -n <ns>` 审计谁能读；用 RBAC 收紧到最小；`kubectl get secret <s> -o jsonpath='{.data.password}' | base64 -d` 自证 base64 不是加密。
2. 开静态加密：配 `EncryptionConfiguration` 用 KMS provider，然后 `kubectl get secrets -A -o json | kubectl replace -f -` 重写以加密存量。
3. 轮换不生效：确认注入方式——`kubectl get pod <p> -o jsonpath='{.spec.containers[*].env}'` 若见 `secretKeyRef` 说明是 env var（需重启）；改成 `volumeMounts` 文件挂载 + 应用 file-watch，或用 reloader/`kubectl rollout restart` 触发滚动更新。
4. 验证：更新 Secret 后进容器 `cat /path/to/mounted/secret` 看是否几十秒内变化。

**面试常追问 / 权衡：** subPath 挂载不会自动更新（是坑）。单靠 Kubernetes Secret 不是密钥*管理器*（无轮换、审计、中心真相源）——集成 **External Secrets Operator**（或 Vault Agent / Secrets Store CSI 驱动）从 **Vault / AWS Secrets Manager / GCP Secret Manager 同步**到 K8s Secret，把带轮换/版本/审计的真相源放专用保险库，pod 仍消费普通 Secret。

**要点：**
- Secret 只是 base64、默认未加密：靠 KMS 静态加密 + 严格 RBAC
- env var 注入启动时定死、轮换需重启；文件挂载自动更新（subPath 除外）
- 无停机轮换优先文件挂载 + file-watch/reloader
- 用 External Secrets Operator/Vault 做带轮换审计的真相源

---

### 13. 卷、PV、PVC、StorageClass

**频率：** 高

**题目：** 两桩存储事故：其一，你把一个用了 EBS（RWO）的服务从 1 副本扩到 3，新 pod 卡在 `ContainerCreating`、事件里报 `Multi-Attach error`；其二，误删了一个 PVC，结果底层云盘和数据也一起没了。请解释 PV/PVC/StorageClass/访问模式/回收策略、这两桩事故各自的根因、以及怎么排查和预防？

**这是什么 & 为什么用它：** 这套模型把存储的*请求*与*供给*解耦，让应用作者无需了解底层技术；理解访问模式和回收策略，才能解释本案例的"多点挂载失败"和"删 PVC 连数据一起没"。

**落地这个案例：**
- **PersistentVolume（PV）**——**表示真实存储的集群级资源**（EBS、GCE PD、NFS 导出、Ceph RBD），有容量和访问模式。
- **PersistentVolumeClaim（PVC）**——**命名空间内的存储请求**（"我要 20Gi、RWO"）。pod 引用 PVC 而非 PV，K8s 把 claim **绑定**到匹配 PV。
- **StorageClass（SC）**——**启用动态供给**：指定 SC 的 PVC 触发该 class 的 **CSI 驱动**按需**创建 PV**（如调 AWS API 生成 EBS）。SC 参数化*怎么*建（磁盘类型、IOPS、可用区、加密）。

**访问模式**（第一桩事故的关键）：
- **RWO**（ReadWriteOnce）——被**一个节点**读写挂载（EBS 等块存储典型）。扩到 3 副本且落在不同节点时，同一 RWO 卷无法同时挂到多节点，于是新 pod 报 `Multi-Attach error`——这就是根因。
- **ROX**（ReadOnlyMany）——多节点只读。
- **RWX**（ReadWriteMany）——多节点读写（需 NFS/CephFS 等共享存储，EBS 做不到）。想多副本共享写就得用 RWX。
- **RWOP**（ReadWriteOncePod）——恰好**一个 pod** 读写（比 RWO 更严）。

**回收策略**（第二桩事故的关键，PVC 删除后 PV 怎么办）：
- **Retain**——保留卷及数据（手动清理；对重要数据安全）。
- **Delete**——连底层存储一起删（对短暂/动态卷方便，**许多动态 SC 的默认**）——所以误删 PVC 就把云盘和数据带走了。

**怎么排查/定位/修复：**
1. Multi-Attach：`kubectl describe pod` 看事件确认 `Multi-Attach error`；`kubectl get pvc/pv` 看访问模式是 RWO。修法：数据库类改用 StatefulSet（每 pod 独立 PVC）而非共享一卷，或需要真共享则换 RWX 的 SC（EFS/NFS/CephFS）。若是滚动更新残留，等旧 pod 释放挂载（`Recreate` 策略或强制 detach）。
2. 防误删丢数据：重要卷的 SC 或 PV 设 `reclaimPolicy: Retain`；给 PVC 加 finalizer 保护本就默认存在（`kubernetes.io/pvc-protection` 阻止有 pod 在用时删除），但仍要靠 Retain + 备份兜底。`kubectl get pv` 看 `RECLAIM POLICY` 一栏。
3. 通用：`kubectl get pvc` 看是否 `Bound`；`Pending` 多为无匹配 PV 或 SC 供给失败，`kubectl describe pvc` 看 provisioner 报错。

**面试常追问 / 权衡：** **CSI 驱动**（容器存储接口）做实际供给/挂接，是 K8s 与各存储后端间可插拔的适配器。`volumeBindingMode: WaitForFirstConsumer` 可避免把卷建在 pod 调不到的可用区。RWX 共享存储通常更慢更贵。快照用 VolumeSnapshot。

**要点：**
- PV 集群资源、PVC 命名空间 claim；SC 启用动态供给
- 访问模式 RWO/ROX/RWX/RWOP：RWO 多副本跨节点 → Multi-Attach error
- 回收策略 Delete 会连数据删；重要卷用 Retain + 备份
- 排查用 `describe pod/pvc` 看事件，`get pv` 看 RECLAIM POLICY

---

### 14. 探针：liveness、readiness、startup

**频率：** 高

**题目：** 大促流量一上来，一个服务开始**集体反复重启**，越重启越糟，最后整个服务雪崩；排查发现它的 liveness 探针打的是一个会查数据库的 `/health` 端点、`timeoutSeconds: 1`。请解释三种探针、这次"重启风暴"的根因、以及怎么定位和修复？

**这是什么 & 为什么用它：** 三种探针分别回答容器健康的不同问题、失败后果差别极大；配错（尤其把有依赖的重端点当 liveness）会像本案例一样在高负载下触发级联重启、把服务拖垮。

**落地这个案例：**
- **Readiness 探针——"这 pod *现在*能服务流量吗？"** 失败时 pod 被**从 Service endpoint 移除**（不再路由流量）**但不被杀**，继续运行、再次通过时重新加入。用于临时不就绪——预热缓存、依赖短暂不可用、关闭前排空，也是滚动更新期间控制流量的机制。本案例查 DB 的检查应放这里。
- **Liveness 探针——"这容器*卡死/死锁*了吗？"** 失败时 K8s **重启容器**。只对**不可恢复的挂起**用（重启能修的死锁），不要用于瞬时问题。
- **Startup 探针——"这慢启动应用启动完了吗？"** 在**通过前禁用 liveness/readiness**，让启动要 60 秒的应用不被没耐心的 liveness **过早杀掉**；成功后正常探针接管。

**探针机制：** **HTTP** GET（Web 服务，`/healthz` 返回 200）、**exec**（容器内跑命令，用于 CLI/无 HTTP）、**TCP**（仅检查端口可开）、**gRPC**（原生 gRPC 健康检查）。

本案例的根因就是经典**重启风暴**：liveness 打到一个做*真实工作*（查 DB）的端点，且 `timeoutSeconds: 1` 过于激进。大促负载下 DB 变慢、端点响应超过 1 秒，liveness 超时判失败，K8s 重启容器、丢弃在途工作使负载更糟，多个 pod 同时重启形成**级联循环**、最终雪崩。

**怎么排查/定位/修复：**
1. `kubectl get pod` 看 `RESTARTS` 飙升，`kubectl describe pod` 看事件里 `Liveness probe failed`、`Container ... Killed/Restarting`。
2. 确认探针配置：`kubectl get pod -o yaml` 看 `livenessProbe` 打的路径和 `timeoutSeconds`/`failureThreshold`——若它依赖下游就是病根。
3. 修法：让 liveness **廉价且无依赖**（`/livez` 只证进程活着，别查 DB/下游——那属于 readiness/`/readyz`）；设**保守的 `failureThreshold`/`periodSeconds`/`timeoutSeconds`**；慢启动用 **startup 探针**。
4. 验证：改完观察 `RESTARTS` 归零，负载升高时 pod 只是被移出 endpoint（readiness 失败）而不再被杀重启。

**面试常追问 / 权衡：** liveness 与 readiness 探同一个重端点是反模式——负载下会把"忙"误判成"死"。readiness 失败是自我保护（摘流量待恢复），liveness 失败是核选项（重启）。探针太宽松则真死锁恢复慢，太严则误杀，需按启动/响应特征调参。优雅关闭还需配 `preStop` + readiness 先摘流量。

**要点：**
- Readiness 控制 Service 成员（摘流量不杀）；Liveness 挂时重启；Startup 护慢启动
- 别让 liveness 依赖下游/查 DB，否则高负载误判成死 → 重启风暴雪崩
- liveness 要廉价无依赖 + 保守阈值；依赖检查放 readiness
- 定位看 `RESTARTS` 与 `describe pod` 的 `Liveness probe failed`

---

### 15. requests vs limits；QoS 类

**频率：** 高

**题目：** 一个延迟敏感的支付服务在节点内存压力时被 kubelet 驱逐（Evicted），而同节点上一个没设资源的批处理任务却活得好好的；另外它的 p99 延迟毫无规律地抖动。请解释 requests/limits 和三种 QoS 类、为什么它先被驱逐、p99 抖动是怎么回事、怎么让它稳下来？

**这是什么 & 为什么用它：** `requests`/`limits` 是你给容器声明"保证多少、最多用多少"的两个旋钮，Kubernetes 据此推导 **QoS 类**决定**节点压力下谁先被驱逐**；设置不当的后果就是本案例——重要服务先被踢、延迟被同节点邻居拖抖。

**落地这个案例：** **`requests`** 是 pod 被*保证*的量，驱动**调度**——调度器只把 pod 放到未预留容量 ≥ pod requests 的节点上（由于 requests 通常低于 limits，节点可被超售）。**`limits`** 是 cgroup 强制的硬**运行时上限**——超内存 → OOMKilled，超 CPU → 被节流。

**Kubernetes 根据你如何设置这些值推导出一个 QoS（服务质量）类**，它决定驱逐优先级：
- **Guaranteed**——**每个容器的 CPU 和内存都 requests == limits**。最高优先级；被当作"承诺了这些确切资源"。
- **Burstable**——**至少设了一个 request** 但不是 Guaranteed（requests < limits，或只设了一部分）。节点有余量时可从 requests 突发到 limits。
- **BestEffort**——**完全没设 requests 或 limits**。用剩下的任何资源；压力下第一个走。

本案例的病根：支付服务是 **Burstable**（requests < limits）而批处理任务其实是 BestEffort——但驱逐看的是**是否超出 requests**。**节点压力下的驱逐顺序**（如内存压力、磁盘压力）：kubelet 先驱逐 **BestEffort**，然后是**超过其 requests 的 Burstable pod**（超得越多越早），**Guaranteed pod 最后**。支付服务把内存突发到远超 requests，于是排到了那个批处理前面被踢。而 p99 抖动来自 CPU：requests < limits 时 pod 可*突发*，但节点繁忙时会遭遇 **CPU 节流意外**——这正是尾延迟毛刺的来源。

**怎么排查/定位/修复：**
1. `kubectl describe pod <name>` 看 `Status: Failed / Reason: Evicted`、`Message: The node was low on resource: memory`，`kubectl get pod -o jsonpath='{.status.qosClass}'` 确认它是 Burstable。
2. 用 `kubectl top pod` 或 `container_memory_working_set_bytes` 对比实际用量与 requests，确认它长期超 requests 运行（所以驱逐排序靠前）。
3. 查 CPU 节流：`container_cpu_cfs_throttled_periods_total / container_cpu_cfs_periods_total` 若持续 > 0，说明被 CFS 限流，正是 p99 抖动源。
4. 根治：把延迟敏感服务设成 **requests == limits（Guaranteed）**——预留资源、无节流波动、最高 QoS、最后被驱逐；同时给 requests 定到贴近真实用量以免再超。

**面试常追问 / 权衡：** 恰当设置 requests 能保护重要 pod（Guaranteed 最后被驱逐）。代价是更低的集群利用率——Guaranteed 那部分资源无法超售。CPU 超 limit 只**节流**不 OOM，内存超 limit 才 OOMKilled。BestEffort 省资源但压力下第一个走，只适合可容忍中断的任务。

**要点：**
- requests = 调度；limits = 强制
- QoS：Guaranteed > Burstable > BestEffort，BestEffort 先被驱逐；超 requests 越多的 Burstable 越早被踢
- 延迟敏感服务设 requests == limits 拿 Guaranteed，换稳定性牺牲利用率
- CPU limit 引起节流（p99 抖动）而非 OOM；查 `container_cpu_cfs_throttled_periods_total`

---

### 16. affinity、anti-affinity、taint、toleration、nodeSelector

**频率：** 高

**题目：** 一次单可用区（AZ）故障，你的 web 服务 3 个副本全挂了——事后发现它们被调度到了同一个 AZ 的同一台节点；同时你给 GPU 节点打了 taint，可普通 pod 还是偶尔跑上去了。请解释 nodeSelector、affinity/anti-affinity、taint/toleration，怎么保证副本跨 AZ 分散、怎么真正把 GPU 节点独占给 GPU 负载？

**这是什么 & 为什么用它：** 这几样都是控制 **pod 落在哪里**的调度约束，从最简单到最有表达力——本案例里 anti-affinity 用来做**跨故障域的高可用**，taint/toleration 用来**预留专用节点池**，用错或漏配就会出现"副本挤在一处"和"闲杂 pod 混进专用节点"。

**落地这个案例：** 它们控制 pod *落在哪里*，从最简单到最有表达力：

- **`nodeSelector`**——**最简单**：纯 **label 匹配**。`nodeSelector: {disktype: ssd}` 只把 pod 调度到标了 `disktype=ssd` 的节点上。硬要求，没有细微差别。
- **节点 affinity**——nodeSelector 的**表达性**版本，有两种强度：**`requiredDuringScheduling...`**（硬规则——不满足就不调度）和 **`preferredDuringScheduling...`**（软偏好——加权调度器的选择，但不满足也照样调度）。支持操作符（`In`、`NotIn`、`Exists`）表达丰富条件，如"zone in [us-east-1a, us-east-1b]"。
- **Pod affinity / anti-affinity**——相对**其他 pod**（而非节点 label）调度。**affinity** 共置（"把这个缓存 pod 放到它服务的应用的同一节点/区域"以降延迟）。**anti-affinity** 分散（"绝不把这个 DB 的两个副本放到同一节点/区域"）——**高可用**的关键工具，确保单节点或单 AZ 故障不会拖垮所有副本。用 `topologyKey`（如 `kubernetes.io/hostname` 或 `topology.kubernetes.io/zone`）定义分散域。
- **Taint 与 toleration**——*相反*的机制：**节点上的 taint 排斥**所有 pod，除非它们显式**容忍（tolerate）**。用于**预留专用节点池**：给 GPU 节点打 taint `nvidia.com/gpu=true:NoSchedule`，只有带匹配 toleration 的 GPU 工作负载才落在那里；给 spot/可抢占节点打 taint，只让容错工作负载在其上运行。toleration 不*吸引*——只*允许*——所以要配合节点 affinity/selector 主动把 pod 引导到那些节点上。

针对本案例两个问题：(1) 副本挤一处，是因为没配 **pod anti-affinity**——给 web 加 `requiredDuringScheduling` 的 anti-affinity、`topologyKey: topology.kubernetes.io/zone`，强制三副本分到不同 AZ（或用 `topologySpreadConstraints` 做更均匀的铺开）。(2) 闲杂 pod 混进 GPU 节点，是因为**别的 pod 恰好也容忍了那个 taint**，或它们本就没被拒（toleration 只是"允许"不是"排斥别人"）——需要检查是不是有过宽的通配 toleration，必要时用更专用的 taint key。

**怎么排查/定位/修复：**
1. `kubectl get pod -o wide` 看副本落在哪些节点/AZ；`kubectl get node --show-labels | grep zone` 确认节点的 `topology.kubernetes.io/zone` label 是否齐全（label 缺失会导致 anti-affinity 形同虚设）。
2. 副本没分散时用 `kubectl describe pod` 看调度事件，确认 anti-affinity 是 `required` 还是被当软偏好忽略了。
3. 查 GPU 节点为何被混入：`kubectl describe node <gpu-node>` 看 `Taints:` 是否真的打上了；`kubectl get pod <intruder> -o jsonpath='{.spec.tolerations}'` 看它是否容忍了该 taint。
4. 修复：给 web 加 required pod anti-affinity（zone 级）保证跨 AZ；给 GPU 节点保持 `NoSchedule` taint，并用节点 affinity/selector 把 GPU 负载**主动引导**过去（toleration 只允许不吸引）。

**面试常追问 / 权衡：** required 硬约束满足不了就 Pending（可用性 vs 严格分散的权衡），preferred 软约束尽量满足但不保证。anti-affinity 的 `topologyKey` 选 hostname 是跨节点、选 zone 是跨 AZ。taint 的 effect 有 `NoSchedule`（新 pod 不调度）、`PreferNoSchedule`（尽量不）、`NoExecute`（连已在跑的也驱逐）。

**要点：**
- nodeSelector：简单 label 匹配；Affinity：required（硬）vs preferred（软）
- anti-affinity + `topologyKey=zone` = 跨 AZ HA，别忘了节点要有 zone label
- Taint 排斥、toleration 只允许不吸引——专用节点还需 affinity/selector 主动引导
- 查落点用 `kubectl get pod -o wide`，查独占失效看 taint 与入侵者的 tolerations

---

### 17. Helm vs Kustomize

**频率：** 高

**题目：** 你们团队要同时管理自研微服务（dev/staging/prod 三套环境只差副本数和镜像 tag）和一堆第三方组件（Postgres、Prometheus），现在配置散乱、prod 一次升级还漏跑了 DB 迁移。该用 Helm 还是 Kustomize，怎么组合，升级出错怎么回退？

**这是什么 & 为什么用它：** Helm 和 Kustomize 都是管理 Kubernetes 清单的工具，但思路根本不同——Helm 是**模板引擎 + 包管理器**解决"参数化打包和生命周期"，Kustomize 是**无模板 overlay** 解决"同一份清单按环境打补丁"；选错工具就会出现本案例的配置散乱和升级漏步。

**落地这个案例：** 它们以**根本不同的方式**解决 Kubernetes 清单管理：

**Helm** 是一个**模板引擎 + 包管理器**。一个 **chart** 是一包模板化 YAML（`{{ .Values.image.tag }}`）加一个默认值 **`values.yaml`**；你把它作为一个 **release**（Helm 在集群内跟踪的命名、带版本的部署）安装。它增加了 **hook**（在安装/升级/删除阶段跑 Job——如升级前的 DB 迁移）和到先前 release 修订版的 **`helm rollback`**。它的强项是参数化和生命周期管理；代价是 Go 模板的复杂性（空白、条件、调试生成的 YAML）。

**Kustomize** 是**无模板、基于 overlay** 的——它内建于 `kubectl`。你有一个纯粹、有效 YAML 的 **`base/`** 和每环境的 **`overlays/`**（dev、staging、prod），后者通过策略合并或 JSON patch **打补丁**特定字段（改副本数、加 label、换镜像 tag）。没有模板语言——一切都是可直接阅读的真实 YAML；代价是对重度参数化或打包不够强。

**各自的胜场：** **Helm** 用于**打包和分发**应用——尤其是**第三方/供应商**软件（Postgres、Prometheus），你想要一个带版本、参数化、可安装的单元。**Kustomize** 用于**一方**应用且**环境差异轻**（"同一份清单，prod 只是更多副本和不同镜像"）。

套到本案例：自研服务三环境只差副本数/镜像 tag，正是 **Kustomize** 的甜点——一个 `base/` 加三个 `overlays/` 打补丁即可；第三方 Postgres/Prometheus 用 **Helm chart** 拿到带版本、参数化的安装单元。那次漏跑 DB 迁移，正因为该步骤没挂进 Helm 的 **pre-upgrade hook**——把迁移 Job 定义成升级前 hook，Helm 会在应用新版本前先跑它。

**怎么排查/定位/修复：**
1. 升级出错先看渲染结果：`helm template <chart> -f values-prod.yaml` 或 `kustomize build overlays/prod` 把最终 YAML 打出来核对，别靠脑补模板。
2. Helm 升级失败或迁移漏跑：`helm history <release>` 看修订版列表，`helm rollback <release> <revision>` 回退到上一个好版本；把迁移改成 `pre-upgrade` hook 确保下次先跑。
3. Kustomize 补丁没生效：`kubectl diff -k overlays/prod` 看实际会改什么，确认 patch 命中了目标字段。
4. GitOps 场景：**Argo CD 原生支持两者**，按应用分别选 Helm 或 Kustomize，让每个应用用最合适的方式。

**面试常追问 / 权衡：** Helm 强在参数化和生命周期（hook、rollback、release 版本），代价是 Go 模板复杂难调试；Kustomize 强在可读的真实 YAML，代价是重度参数化/打包不够力。**组合两者**：许多团队在 **Helm 输出*之上*跑 Kustomize**——Kustomize 的 `helmCharts` 字段渲染供应商 chart，再叠 Kustomize 补丁，既得供应商打包*又*得干净无模板的覆盖。

**要点：**
- Helm：模板 + 包管理（hook、rollback、release），适合第三方/供应商软件
- Kustomize：overlay + 补丁、无模板，适合一方应用、环境差异轻
- 升级漏步用 Helm pre-upgrade hook，出错用 `helm rollback`；渲染核对用 `helm template`/`kustomize build`
- 可混合（Helm 输出上跑 Kustomize），Argo CD 原生支持两者

---

### 18. Blue/green 与 canary（Argo Rollouts、Flagger）

**频率：** 高

**题目：** 上次一个"看起来没问题"的版本一次性推给全量用户，10 分钟后错误率飙到 8%，回滚又花了半小时重新部署，损失惨重。老板要求以后"坏版本最多影响一小撮人、且能自动刹车"。请对比 blue/green 与 canary，怎么用工具做自动 canary 分析和自动回滚？

**这是什么 & 为什么用它：** blue/green 和 canary 都是**低风险发布新版本**的策略，目的就是避免本案例"全量翻车 + 回滚慢"——blue/green 靠瞬时切换换来秒级回滚，canary 靠渐进放量把坏发布的**爆炸半径**限制在一小片流量里。

**落地这个案例：** 两者都是低风险发布策略，但权衡不同。

**Blue/green** 跑**两套完整环境**：**蓝**（当前）和**绿**（新）。你把新版本部署到绿，在所有真实流量仍走蓝时冒烟测试它，然后**翻转 Service selector**（或 LB）指向绿——一次**瞬时、原子的切换**。**回滚也是瞬时的**：翻回蓝。优点：无混版状态、回滚快。缺点：切换期间**2 倍资源**，且切换是全有或全无（翻转那一刻 bug 打到 100% 用户）。

**Canary** 把**一小比例流量**（比如 5%）转到新版本，**观察指标**，健康则逐步**放大**（5% → 25% → 50% → 100%）。优点：限制爆炸半径——坏发布只影响 canary 那一片——且你用*真实*生产流量逐步验证。缺点：你**同时跑混版**（必须兼容），且更慢。

套到本案例：要"只影响一小撮人"就该用 **canary**（先 5% 而非 100%），要"能自动刹车"就得把人工晋升换成自动分析门控。

**自动化——Argo Rollouts 和 Flagger：** 人工盯仪表盘并点"晋升"不可扩展，所以这些工具自动化它。你定义一个带**步骤**的 **Rollout**（`setWeight: 10`、`pause`、`setWeight: 50` …）和**分析模板**，后者在每步**查询 Prometheus/Datadog** 看**错误率、延迟（p99）或成功率**。若指标保持在阈值内，工具**自动晋升**到下一权重；若某指标**回归越过阈值**，它**自动回滚**——无需人工介入。**Argo Rollouts** 通过一个 Rollout CRD（替换 Deployment）做到；**Flagger** 是一个控制器，在服务网格或 ingress 之上驱动流量切分。

**怎么排查/定位/修复：**
1. 发布中盯 canary：`kubectl argo rollouts get rollout <name> --watch` 看当前权重、每步的分析结果（Successful/Failed/Inconclusive）。
2. 若 canary 被自动回滚，看分析为什么失败：查它跑的 Prometheus 查询（如错误率 `rate(http_requests_total{status=~"5..",version="canary"}[5m])`）对比阈值，确认是真回归还是阈值/查询配错。
3. 定阈值要基于 SLO——如错误率 > 1% 或 p99 > 500ms 就判失败，别定得太松（放坏版本过关）也别太紧（好版本被误杀）。
4. blue/green 场景回滚：`kubectl argo rollouts undo <name>` 或直接翻回上一个稳定 revision，selector 一翻即生效。

**面试常追问 / 权衡：** blue/green 回滚快但要 2 倍资源、切换全有或全无；canary 省资源、限爆炸半径但更慢且要跑混版（新旧必须前后兼容，尤其 DB schema）。canary 分析需要**足够流量样本**才有统计意义，低流量服务 canary 可能不 conclusive。Argo Rollouts 用 CRD 替换 Deployment，Flagger 在服务网格/ingress 之上驱动切分。

**要点：**
- Blue/green：通过 selector 瞬时翻转、秒级回滚，代价 2 倍资源、全量切换
- Canary：渐进百分比放大（5%→25%→50%→100%）限爆炸半径，需混版兼容
- Prometheus/Datadog 的分析门控晋升，越阈值自动回滚，阈值按 SLO 定
- Argo Rollouts CRD 或 Flagger 控制器，`kubectl argo rollouts` 观测与回退

---

### 19. RBAC：Role vs ClusterRole

**频率：** 高

**题目：** 安全审计发现：一个只需读取自己命名空间某个 ConfigMap 的应用，其 ServiceAccount 被绑到了 `cluster-admin`——意味着这个 pod 一旦被攻破，攻击者就拿到了整个集群。请解释 RBAC（Role vs ClusterRole、绑定），怎么把它收敛到最小权限并验证？

**这是什么 & 为什么用它：** RBAC（基于角色的访问控制）管理**谁能对哪些资源做什么**，它是防止本案例"一个 pod 沦陷 = 整个集群沦陷"的核心机制——用**最小权限**把每个 ServiceAccount 限死在它真正需要的操作上。它有两半：**角色**（一组权限）和**绑定**（哪些主体获得某角色）。

**落地这个案例：**

**Role vs ClusterRole——区别在范围：**
- **Role** 授予**单个命名空间内**的权限——如"在 `payments` 命名空间 get/list/watch pod"。
- **ClusterRole** 是**集群范围**的——要么用于集群级资源（node、PV、命名空间本身），要么作为可**按命名空间绑定的可复用模板**。它是你授予非命名空间资源访问，或定义一次角色并在多个命名空间应用的方式。

**绑定把主体链接到角色：**
- **RoleBinding** 在**一个命名空间内**把一个 Role（或限定到该命名空间的 ClusterRole）授予**主体**——**用户、组或 ServiceAccount**。
- **ClusterRoleBinding** 把一个 ClusterRole **集群范围**地授予主体。（主体是认证层的用户/组，或 pod 运行所用的 ServiceAccount。）

本案例的修法：这个应用只需读一个 ConfigMap，所以只要一个**命名空间级 Role**（`get` 单个 ConfigMap）加一个 **RoleBinding**，绝不该用 ClusterRoleBinding 到 `cluster-admin`。

**怎么排查/定位/修复：**
1. 先摸清现状：`kubectl auth can-i --list --as=system:serviceaccount:<ns>:<sa>` 导出这个 SA 当前能做的**一切**——会看到它拥有 `*/*` 这种全权限。
2. 找到超权绑定：`kubectl get clusterrolebinding -o wide | grep <sa>` 定位那条绑到 cluster-admin 的 ClusterRoleBinding。
3. 收敛：删掉超权绑定，给应用一个**专用 ServiceAccount**，绑到一个限定为**恰好它所需 verb 和资源**的 Role（如只对那个 ConfigMap `get`），用 RoleBinding 在本命名空间授予。
4. 验证：`kubectl auth can-i get configmap/<name> --as=system:serviceaccount:<ns>:<sa>`（应为 yes）、`kubectl auth can-i get secret --as=...`（应为 no）确认最小权限已生效。
5. 多数应用根本*不*需要 Kubernetes API 访问——那种情况直接设 `automountServiceAccountToken: false` 禁用自动挂载 SA token，连凭证都不给。

**面试常追问 / 权衡：** 别把应用绑到 `cluster-admin`（常见偷懒错误，被攻破的 pod 拿到整个集群）。主体是认证层的用户/组，或 pod 运行所用的 ServiceAccount——RBAC 只管授权不管认证。ClusterRole 既可用于集群级资源，也可作为跨命名空间复用的模板（配 RoleBinding 时被限定到单个命名空间）。定期用 `kubectl auth can-i --list` 审计是发现权限蔓延的关键。

**要点：**
- Role：命名空间内；ClusterRole：集群级资源或跨命名空间模板
- 绑定到用户/组/SA：RoleBinding（命名空间内）vs ClusterRoleBinding（集群范围）
- 最小权限：专用 SA + 恰好够用的 Role，不用 cluster-admin，不需要 API 就禁挂 token
- 用 `kubectl auth can-i [--list] --as=...` 审计与验证

---

### 20. Pod Pending 诊断清单

**频率：** 高

**题目：** 你刚 `kubectl apply` 了一个新版本，但 pod 一直卡在 `Pending`，业务上不来。你手头没有别的线索，请走一遍你的诊断清单：可能是哪些原因、每种怎么确认、怎么修？

**这是什么 & 为什么用它：** `Pending` 意味着 pod 被**接受但尚未运行**——几乎总是**调度器无法放置它**或某个依赖（卷、镜像）未就绪。搞清 Pending 的诊断清单，是把"业务上不来"从一片黑箱变成几分钟内定位根因的关键。

**落地这个案例：** **从 `kubectl describe pod <name>` 开始**，读底部的 **Events** 段——它通常直接说明确切原因（如 `0/5 nodes are available: insufficient cpu`）。然后逐一排查常见原因：

1. **CPU/内存不足**——没有节点有足够的**未预留容量满足 pod 的 `requests`**。事件说 `Insufficient cpu`/`Insufficient memory`。修法：降低 requests、加节点，或检查集群 autoscaler 是否本应扩容（见下）。
2. **不可满足的放置约束**——没有节点匹配/容忍的 **`nodeSelector`、节点 affinity 或 taint**。事件：`node(s) didn't match node selector` 或 `had taint {...} that the pod didn't tolerate`。修好 selector 或加 toleration。
3. **PVC 未绑定**——pod 需要卷但 **PVC 绑不上**（无匹配 StorageClass、供给器错误，或存储配额耗尽）。`kubectl describe pvc` 揭示供给器错误。pod 等到卷就绪。
4. **镜像 / ServiceAccount 问题**——镜像拉取问题或 pod 引用的 **ServiceAccount 缺失**都能阻塞启动。
5. **ResourceQuota**——命名空间的**配额耗尽**，于是准入阻止新 pod。事件提到 `exceeded quota`。

**怎么排查/定位/修复：**
1. `kubectl describe pod <name>` → 读底部 **Events**，这一步通常直接给出确切原因，按上面五类对号入座。
2. 若是容量：`kubectl top node`、`kubectl describe node` 看各节点已分配 vs 可分配，对比 pod 的 requests，确认是真装不下还是 requests 定太大。
3. 若是 PVC：`kubectl get pvc`、`kubectl describe pvc <name>` 看是否 `Pending`、供给器报什么错、StorageClass 是否存在。
4. **也检查集群 autoscaler：** 若 requests 装不下但集群*本应*扩，检查 **autoscaler 事件/日志**看**扩容失败**（到达最大节点数、无匹配实例类型、云配额超限，或 pod 在*任何*可能节点上都不可调度所以 autoscaler 根本不尝试）。

**面试常追问 / 权衡：** Pending（调度不了/依赖没好）和 ContainerCreating（已调度、正在拉镜像/挂卷）、CrashLoopBackOff（已运行但反复崩）是不同阶段，别混。约束类问题（nodeSelector/taint）要在"放置能力"和"隔离需求"间权衡——放太松失去专用节点隔离，太紧则 Pending。requests 定太大既浪费又易 Pending，太小又保护不了服务。

**要点：**
- 先看 `kubectl describe pod` 的 Events，多半直接给原因
- 检查 requests vs 节点容量（`kubectl top/describe node`）
- 验证 PVC 已绑且 StorageClass 存在
- 查 autoscaler 日志定位扩容失败（到顶、无匹配实例、云配额、根本没触发）

---

### 21. CrashLoopBackOff 清单

**频率：** 高

**题目：** 一个刚上线的服务陷入 `CrashLoopBackOff`，`kubectl get pod` 里重启次数每隔几分钟涨一次、间隔越来越长。它到底意味着什么？你怎么一步步查出它为什么反复死、怎么修？

**这是什么 & 为什么用它：** `CrashLoopBackOff` 意味着容器**启动、退出、Kubernetes 重启它——反复如此**——重启之间有**指数增长的退避**（10s、20s、40s… 最多 5 分钟）以免猛捶节点。理解这一点很重要：这个状态本身不是 bug，而是"进程不断死掉"的**症状**，你要找的是背后真正让进程退出的原因。

**落地这个案例：** 系统地调查：

1. **`kubectl logs <pod> --previous`**——最重要的一步。当前容器可能*刚刚*启动，所以 `--previous` 显示**崩溃的前一实例**的日志——通常就是实际错误（栈追踪、"connection refused"、"missing env var"）。
2. **`kubectl describe pod`**——读**退出码**和 last state。**Exit 0** = 应用完成并退出（也许它不是长期运行进程，或命令配错）。**Exit 137** = SIGKILL，通常是 **OOMKilled**（检查原因）。**Exit 1/2** = 应用错误。非零一般 = 崩溃。
3. **检查 command/args 和配置**——错误的 `command`/`args`、应用启动时需要的**缺失环境变量或 Secret**，或坏的配置文件。也**单独检查 init 容器**（`kubectl logs <pod> -c <init>`）——一个**失败的迁移或初始化 init 容器**会阻塞主容器，看起来像崩溃循环。
4. **OOMKilled / 资源问题**——若 exit 137 带 `OOMKilled`，内存 limit 太低或有泄漏（见 OOM 那题）。
5. **排除过激的 liveness 探针**——一个**在慢启动期间失败的 liveness 探针**会让 Kubernetes 杀掉并重启一个其实正常的容器，伪装成崩溃。若日志显示应用被杀时正在*启动*，修法是 **startup 探针**或更宽松的 liveness 阈值，而非改应用。

**怎么排查/定位/修复：** 按上面顺序走：先 `kubectl logs <pod> --previous` 拿到崩溃实例的真实报错（十有八九一眼看出是缺环境变量还是连不上依赖）；拿不到日志就 `kubectl describe pod` 读退出码——**137** 转去查 OOMKilled、**0** 说明命令/入口配错或不是常驻进程、**1/2** 是应用自身报错；再 `kubectl logs <pod> -c <init>` 排掉 init 容器（迁移/初始化失败）；最后若日志显示"应用还在启动就被杀"，则是 liveness 探针过激，加 **startup 探针**或放宽阈值。

**面试常追问 / 权衡：** 退避是指数增长（最多 5 分钟）以保护节点，所以重启间隔越来越长是正常现象而非好转。区分"应用真崩"（改代码/配置）和"探针误杀"（改探针，别动应用）很关键——后者常被误诊。exit 0 也会进 CrashLoop，因为 K8s 期望常驻进程不退出。

**要点：**
- `kubectl logs --previous` 看前次崩溃实例——最关键一步
- `describe` 读退出码：137→OOM、0→命令配错/非常驻、1/2→应用错
- 单独检查 init 容器（`-c <init>`），迁移/初始化失败会伪装成崩溃循环
- 排除过激 liveness 探针误杀，用 startup 探针或放宽阈值

---

### 22. OOMKilled

**频率：** 高

**题目：** 一个 Java 服务运行几小时后必被 `OOMKilled` 重启一次，开发说"我 `-Xmx` 只设了 1G，容器 limit 给了 2G，怎么会超？"。请解释 OOMKilled 是什么、这个 JVM 案例为什么会超、怎么判断是欠配还是泄漏、怎么修？

**这是什么 & 为什么用它：** `OOMKilled` 意味着容器**超过了其内存 limit**，内核的 **OOM（内存不足）杀手把它终止了**——内存无法节流，所以内核唯一的选择就是杀。搞懂它才能区分本案例的两种截然不同病因：是内存欠配（该加 limit），还是泄漏（加 limit 只是拖延），以及 JVM 特有的 cgroup 感知坑。`kubectl describe pod` 显示 **`Reason: OOMKilled`** 和 **`Exit Code: 137`**（128 + 信号 9/SIGKILL）。

**落地这个案例：** 本案例"堆 1G、limit 2G 却被杀"通常是两个原因叠加。第一，**JVM/Node 需要显式堆 flag 感知 cgroup**：带**托管堆**的运行时不会自动尊重 **cgroup 内存 limit**（尤其旧版本会把堆按*主机*总 RAM 而非容器 limit 来定）——但即便堆锁在 1G，JVM 的**非堆内存**（线程栈、Metaspace、原生缓冲、GC 结构）也要吃内存，堆 1G + 非堆很容易顶到 2G limit。第二，若内存**随时间无界增长**才被杀（本案例"运行几小时后"很像），那是**真正的泄漏**。

**两个根本不同的修法——判断该用哪个：**
- **抬高 `limits.memory`**——若应用**确实需要比你分配更多的内存**（你欠配了），这是对的。先测量真实用量。
- **剖析并修复泄漏**——若用量随时间**无界增长**（真正的内存泄漏），这才对。抬高 limit 只会推迟 OOM。用 `kubectl top pod` 快速看，然后做真正的剖析：**pprof**（Go）、**堆转储**（Java）、**`--inspect`/堆快照**（Node）找出在增长的东西。

**关键坑——JVM 和 Node 需要显式堆 flag：** **把堆显式设在 cgroup limit *之下***，给非堆内存（栈、metaspace、原生缓冲）留余量：如 `-Xmx`（JVM）或 `--max-old-space-size`（Node）设为容器 limit 的约 70–80%。现代 JVM 也支持 `-XX:MaxRAMPercentage` 按 cgroup limit 相对定堆。

**怎么排查/定位/修复：**
1. `kubectl describe pod` 确认 `Reason: OOMKilled` / `Exit Code: 137`，`dmesg | grep -i oom` 看内核 OOM 事件确认是哪个进程被杀。
2. 判断欠配还是泄漏：看 `container_memory_working_set_bytes` 曲线——**锯齿平稳**到顶 = 欠配（抬 limit）；**持续爬升永不回落** = 泄漏（去剖析）。
3. JVM 案例先量总量：容器内看堆外占用，把 `-Xmx` 或 `-XX:MaxRAMPercentage=75` 显式对齐 cgroup（留 20–30% 给非堆），确认现代 JVM（JDK 8u191+/11+）已容器感知。
4. 确诊泄漏就抓堆：Java 做 heap dump（`jmap`）分析增长对象，Go 用 pprof，Node 抓堆快照——找到真正在涨的东西再改代码。
5. **监控 `container_memory_working_set_bytes`**（不是 RSS——工作集才是 OOM 杀手实际盯的）对比 limit，并在它到 100% **之前告警**，以便在被杀前捕获蔓延。

**面试常追问 / 权衡：** 内存不能像 CPU 那样节流，所以超限只能杀（对比 CPU 超限只限流）。抬 limit 对泄漏是掩耳盗铃，只推迟下一次 OOM；但对真实欠配又是正解——所以先判性质再动手。JVM 堆设太贴近 limit 会因非堆内存溢出被杀，设太低又浪费并频繁 GC，70–80% 是常见折中。

**要点：**
- Exit 137 + `Reason: OOMKilled` = 超内存 limit 被 SIGKILL，内存不可节流只能杀
- 先判欠配（曲线平稳到顶，抬 limit）vs 泄漏（持续爬升，剖析修复）
- JVM/Node 堆显式设在 cgroup limit 之下（约 70–80%），或用 `-XX:MaxRAMPercentage`
- 监控 `container_memory_working_set_bytes`，到顶前告警

---

### 23. CI vs CD vs 持续部署

**频率：** 高

**题目：** 团队目前每两周攒一批改动搞一次痛苦的"发布日"，合并冲突多、上线常出事，管理层问"我们能不能像大厂那样每次提交自动上生产？"。请辨析 CI、持续交付、持续部署，我们现在在哪一级、要跳到自动上生产还缺什么？

**这是什么 & 为什么用它：** CI、持续交付、持续部署是三个常被混为一谈的实践，构成一个**成熟度阶梯**——理清它们才能回答本案例"我们在哪、下一步该补什么"，而不是盲目追求"每次提交自动上生产"却没有安全网。

**落地这个案例：**
- **持续集成（CI）**——开发者**频繁集成到主线**（一天多次），且**每次提交触发自动构建 + 测试**。目标是尽早捕获集成问题，而非痛苦的"合并日"。这纯粹关乎**构建和测试**，与部署无关。
- **持续交付（Continuous Delivery）**——**每个绿色构建都*可部署*到生产**——已打包、经 staging 测试、就绪——但由**人点击"批准"**才真正发布。你*可以*随时发布任何提交；你*选择*何时发。它在 CI 之上加了部署自动化和 staging 门，让代码库始终可发。
- **持续部署（Continuous Deployment）**——**每个绿色构建*自动*部署到生产**，**无手动门**。流水线从提交 → 测试 → 生产，人不插手。这是完全自动化的终态。

套到本案例：两周攒一批、合并冲突多，说明团队**连 CI 都没做好**——第一步不是冲向自动上生产，而是先让开发者一天多次合并主线、每次提交跑自动构建+测试，消灭"发布日"。**成熟度阶梯是 CI → 持续交付 → 持续部署**，随着安全网成熟逐级攀登，不能跳级。

**怎么排查/定位/修复：** 评估现状并逐级补齐：
1. 判断当前级别：提交后是否**每次自动构建+测试**？没有 → 先把 CI 建起来（主线频繁集成、PR 触发流水线）。
2. 补持续交付：加**部署自动化 + staging 环境 + 冒烟/端到端测试**，让任意绿色构建"一键可发"，保留人工批准门。
3. 想去持续部署（自动上生产），先补齐前提，否则别去掉人工门：
   - **强自动化测试**（单元、集成、端到端——高度确信绿色构建安全）；
   - **扎实的可观测性**（指标/告警在几分钟内检测坏发布）；
   - **快速、自动的回滚**（或 canary + 自动回滚这类渐进式交付），使坏部署被遏制并迅速回退。
4. 有了这些再去掉人工门——它极大缩短前置时间并缩小每次变更的爆炸半径；没有则自动发布每个提交是鲁莽的。

**面试常追问 / 权衡：** 去掉人工门意味着**自动化必须捕获人会捕获的一切**——测试覆盖和可观测性不够时，人工门反而是必要的安全阀。持续部署缩短前置时间、缩小每次变更爆炸半径（小批量频繁发），但要求文化和工具都到位。别把"持续交付"和"持续部署"混用——差别就在那个人工批准门。

**要点：**
- CI = 频繁集成 + 每次提交自动构建/测试（只关构建测试，不关部署）
- 持续交付 = 每个绿色构建始终可发，人工点批准
- 持续部署 = 绿色构建自动上生产，无人工门
- 阶梯 CI→交付→部署逐级爬；上自动部署前必须有强测试 + 可观测性 + 安全回滚

---

### 24. GitOps（Argo CD、Flux）

**频率：** 高

**题目：** 一次事故复盘发现：有人 `kubectl edit` 手改了生产 Deployment 救急，但没人记得改了什么、也没法追溯；而且你们的 CI 系统持有所有集群的 admin 凭证，安全团队警告这是巨大风险。请解释 GitOps（Argo CD、Flux）怎么解决这两个问题，拉模型为什么重要？

**这是什么 & 为什么用它：** **GitOps** 让 **Git 成为集群*期望状态*的单一真相源**——正是用来根治本案例的两个痛点：手改无审计（改动没有 Git 记录、无法追溯回滚）和 CI 持有集群凭证（推模型的安全风险）。你把 Kubernetes 清单（或 Helm/Kustomize）提交到一个仓库；一个**运行在集群内的控制器**（Argo CD、Flux）**持续调和**实际集群状态使之匹配 Git——若二者偏离，它要么告警要么自动纠正。你不从笔记本或 CI `kubectl apply`；**你 `git push`，集群自行收敛。**

**落地这个案例：**

**为什么基于拉很重要（解决 CI 凭证风险）：** 传统 CI **推**到集群——这意味着你的 **CI 系统必须持有集群管理员凭证**，一个巨大的攻击面（攻破 CI → 攻破它能触及的每个集群）。GitOps 里**集群从 Git 拉**：控制器跑在集群*内部*并向*外*够到仓库，所以**不需要入站凭证**，集群的写权限保持在内部。对无入站访问、位于防火墙后的集群也能干净工作。

**好处（解决手改无审计）：**
- **审计轨迹**——每次变更都是一个带作者、时间戳、评审和 diff 的 **Git 提交**。你的部署历史*就是*你的 Git 历史。
- **回滚 = `git revert`**——revert 那个提交，控制器就调和回先前状态。无需特殊工具。
- **漂移检测**——若有人手改集群（`kubectl edit`，正是本案例），控制器**检测到与 Git 的偏离**并标记（或还原）它，所以集群不能悄悄偏离其声明状态。
- **多集群扇出**——一个 Git 仓库能一致地驱动多个集群。

**配合 image updater：** 既然 Git 是真相源，CI 构建的新容器镜像必须把它的 tag **写进 Git** 才能部署。一个 **image updater**（Argo CD Image Updater、Flux 的 image automation）监视 registry 并**把新 tag 提交回仓库**，闭合从"CI 构建了镜像"到"GitOps 部署它"的环路，同时保持 Git 权威。

**怎么排查/定位/修复：** 针对本案例的手改事件：
1. 用 Argo CD 看应用状态：`argocd app get <app>` 若显示 **`OutOfSync`**，就是有人手改导致集群偏离了 Git。
2. 看具体漂移了什么：`argocd app diff <app>`（或 UI 的 diff 视图）逐字段对比集群实际 vs Git 声明，正好补上"没人记得改了什么"。
3. 决定纠正方向：想恢复到 Git 声明 → `argocd app sync <app>` 让它调和回去；想保留这次改动 → 把它正式提交进 Git 走评审。
4. 防复发：开启 **self-heal / 自动同步**，控制器检测到漂移就自动还原；对紧急手改流程改为"改 Git → 走 PR"，让 `git revert` 成为标准回滚手段。

**面试常追问 / 权衡：** 拉模型免去入站凭证是安全核心优势，但自动同步/self-heal 会阻止一切手改——紧急救急时可能挡路，需要"打破玻璃"的应急流程。GitOps 要求所有变更都过 Git，纪律性强但也意味着流程更重。回滚靠 `git revert` 无需特殊工具，但依赖 Git 历史干净可信。

**要点：**
- Git 是期望状态的单一真相源，`git push` 后集群自行收敛
- 基于拉的调和：控制器在集群内向外拉，免去 CI 持集群凭证的风险
- 漂移检测 + 审计轨迹：`kubectl edit` 手改被标记为 OutOfSync，`argocd app diff` 查、`sync` 还原
- 回滚 = `git revert`；配 image updater 把新镜像 tag 写回 Git

---

### 25. Terraform vs Pulumi vs CloudFormation vs CDK

**频率：** 高

**题目：** 你们要从"点控制台手工建资源"转向 IaC，但纠结选型：目前主力在 AWS 但计划接入 GCP，团队里一半是写 YAML 头疼、想用真编程语言的开发。请对比 Terraform、Pulumi、CloudFormation、CDK，给出选型建议？

**这是什么 & 为什么用它：** 这四种都是**基础设施即代码（IaC）**工具，用代码而非手点控制台来创建/管理云资源——本案例正是要靠 IaC 消灭"手工建资源、无版本无审计"的乱局。它们沿两条轴分野：**声明式 vs 命令式**语言，以及**多云 vs AWS 原生**——选型就是在这两轴上对着团队情况取舍。

**落地这个案例：**

- **Terraform**——**声明式 HCL**（HashiCorp 配置语言）。你描述期望的终态；Terraform 把它与**外部 state** 做 diff 并计算变更。它的杀手锏是通过**庞大的 provider 生态**（AWS、GCP、Azure、Cloudflare、Datadog、GitHub——数千个 provider）实现的**多云覆盖**。state 存在云**外部**（S3、Terraform Cloud），需你管理。云无关 IaC 的事实标准。
- **Pulumi**——在与 Terraform**相同的 provider 模型**之上用**真正的编程语言**（TypeScript、Python、Go、C#）。你原生得到循环、条件、函数和 IDE 支持，而非 HCL 有限的表达力——很适合复杂、动态的基础设施和偏好写代码的团队。取舍：更强的能力也意味着更多写出难维护基础设施的途径。
- **CloudFormation**——**AWS 原生** YAML/JSON，完全由 AWS 管理（state 和锁替你处理）。但它**仅限 AWS**且历史上**支持新服务/特性慢**（服务上线后常有滞后）。手写冗长笨拙。
- **CDK（云开发工具包）**——**命令式代码**（TypeScript、Python），**合成到 CloudFormation**。你用高级构件写真代码；CDK 生成 CFN 模板。开发体验极佳但**以 AWS 为中心**。**CDKTF** 是改为合成到 **Terraform** 的变体，兼得 CDK 的代码工效与 Terraform 的多云覆盖。

套到本案例：既然**要接入 GCP（多云）又想用真编程语言**，最贴合的是 **Pulumi**（真语言 + 多云 provider）或 **CDKTF**（CDK 的代码工效 + Terraform 的多云）。若能接受声明式 HCL，**Terraform** 是多云事实标准、最稳妥；纯 CloudFormation/原生 CDK 会因锁死 AWS 而不满足未来上 GCP 的诉求。

**怎么排查/定位/修复：** 选型决策清单：
1. 是否需要多云或大量第三方 provider（Cloudflare、Datadog）？是 → Terraform / Pulumi / CDKTF，排除 CloudFormation 和原生 CDK。
2. 团队偏好声明式还是真编程语言？偏 YAML/HCL → Terraform；偏 TS/Python/Go 循环条件 → Pulumi 或 CDK 系。
3. 是否纯 AWS 且有强开发团队？是 → CDK（开发体验最佳）。
4. 谁管 state？CloudFormation/CDK 由 AWS 托管；Terraform/Pulumi 需自己配远程后端管 state 与锁（见下一题）。

**面试常追问 / 权衡：** **Terraform** 用于多云或想要最大生态和声明式模型时；**CDK** 若纯 AWS 且团队想写真代码；**Pulumi** 若想要真语言*且*多云；**CloudFormation** 如今很少手写，多作为 CDK 的编译目标。真编程语言（Pulumi/CDK）表达力强但也更容易写出难维护的基础设施——声明式的约束有时反而是好事。

**要点：**
- Terraform：声明式 HCL、多云、生态最大，事实标准
- Pulumi：真语言（TS/Python/Go）、与 TF 同 provider 模型、多云
- CloudFormation：AWS 原生、state 托管但仅限 AWS 且支持新特性慢
- CDK：代码合成到 CFN（以 AWS 为重）；CDKTF 合成到 Terraform 兼得多云

---

### 26. Terraform state、锁、漂移

**频率：** 高

**题目：** 两名工程师几乎同时对生产跑 `terraform apply`，结果 state 损坏、有资源被重复创建；另外一位同事之前在 AWS 控制台手改了安全组，下次 apply 时 Terraform 又把它改了回去。请解释 state、锁、漂移，这些事故怎么防、怎么排查？

**这是什么 & 为什么用它：** **State** 是 Terraform **在你的配置与真实资源之间的映射**——`terraform.tfstate` 记录 `aws_instance.web` 对应真实实例 `i-0abc123` 及其所有已知属性。理解 state/锁/漂移正是为了避免本案例的两类事故：并发 apply 损坏 state，以及带外手改造成的漂移被静默覆盖。Terraform 需要 state 来知道已经存在什么，以便下次 `apply` 时计算 diff（只创建/更新/删除变化的部分）而非重建一切。

**落地这个案例：**

**远程存 state，绝不进 Git：** 一个团队**共享一份 state**，故它必须存在**远程后端**——**S3 + DynamoDB 锁表**、**Terraform Cloud** 或 **GCS**。两个不 commit `terraform.tfstate` 的关键理由：(1) 它**明文含密钥**（DB 密码、生成的密钥、私有 IP）——提交它会泄露；(2) 本地 state 不能跨团队协调，导致冲突和损坏。

**锁防止并发 apply（本案例事故一）：** 若两名工程师对同一 state 同时 `apply`，会竞争并损坏它。后端在 apply 期间取一把**锁**（DynamoDB 条目、Terraform Cloud 锁），使第二个 apply **等待**而非覆盖。这就是 DynamoDB 锁表与 S3 配对的原因——本案例正因为缺了这把锁才损坏。

**漂移（本案例事故二）**是**真实基础设施偏离 state**——有人在 AWS 控制台手改资源（那个安全组），或外部进程改了它。**检测它**靠跑 **`terraform plan`**：若你在配置里*什么都没改*它却报告拟议变更，那个 diff *就是*漂移（Terraform 想把现实还原回你的声明配置）。团队会跑**计划漂移检测**（CI 里周期性 `plan`）尽早捕获带外变更。

**接纳既有资源：** 用 **`terraform import`** 把在 Terraform 之外（或由其他工具）创建的资源**纳入 Terraform 管理**——它把资源写进 state 使未来 apply 管理它。（较新的 Terraform 也支持声明式 `import` 块。）

**怎么排查/定位/修复：**
1. 防并发损坏：配 **S3 + DynamoDB 锁表**（或 Terraform Cloud）远程后端；下次并发 apply 时第二个会看到 `Error acquiring the state lock` 并等待，而非覆盖。
2. 若 apply 被中断留下**残留锁**，用 `terraform force-unlock <LOCK_ID>` 释放（确认没人真的在跑再解）。
3. 排查漂移：定期 `terraform plan`，配置没动却出现 diff 就是漂移；`terraform plan -refresh-only` 专门看现实与 state 的偏离。
4. 处理那个被手改的安全组：想恢复到声明配置 → 直接 `apply` 让它改回；想保留手改 → 把改动写进 `.tf` 代码再 apply（让代码与现实一致）。
5. 已在控制台建好、想纳管的资源：`terraform import <地址> <真实ID>`（或声明式 `import` 块）写进 state。

**面试常追问 / 权衡：** 永不 commit `terraform.tfstate`（含明文密钥且无法协调）。漂移检测在 CI 周期跑 `plan` 能早发现带外变更，但"自动把现实改回声明"有时会覆盖别人的紧急救急改动——所以团队常先告警而非自动 apply。`force-unlock` 要谨慎，误解真正在跑的锁会导致并发损坏。

**要点：**
- 远程 state 带锁（S3+DynamoDB / Terraform Cloud），防并发 apply 损坏，卡住用 `force-unlock`
- 永不 commit state（明文含密钥、无法跨团队协调）
- 漂移 = `terraform plan` 报出的配置未改却有的 diff，CI 周期跑 plan 早发现
- `terraform import` / `import` 块接纳控制台里已有的资源

---

### 27. VPC：子网、路由表、NAT 网关

**频率：** 高

**题目：** 你的应用服务器放在私有子网里，突然发现它调不通外部第三方 API（拉不了包、连不上支付网关），但内部服务都正常；月底账单上还多出一大笔莫名其妙的数据传输费。请解释 VPC 的子网、路由表、IGW、NAT 网关，这两个问题怎么定位？

**这是什么 & 为什么用它：** **VPC（虚拟私有云）**是你在云上的**隔离私有网络**，由一个 **CIDR 块**定义（如 `10.0.0.0/16`——6.5 万个地址）。理解它的子网/路由/网关构件，正是排查本案例"私有子网出不了网"和"NAT 账单异常"的基础。你把 VPC 切成**子网**，每个**限定在一个可用区（AZ）**（`10.0.1.0/24` 在 AZ-a，`10.0.2.0/24` 在 AZ-b），跨 AZ 铺开以实现**高可用**。

**落地这个案例：**

**公/私之分归结于路由**（由每个子网的**路由表**决定）：
- **公子网**有路由 `0.0.0.0/0 → Internet Gateway（IGW）`。IGW 允许**双向**互联网流量，故这里带公网 IP 的资源既能*从*互联网被访问也能*向外*访问。
- **私子网**有路由 `0.0.0.0/0 → NAT Gateway`。NAT Gateway 只允许**仅出站**互联网访问（拉包、调外部 API），但**阻断来自互联网的入站**连接——该子网没有*进*的路径。

本案例"私有子网调不通外部 API"，最可能就是这条 `0.0.0.0/0 → NAT Gateway` 路由缺失或 NAT 网关本身出了问题——私子网没有出站路径，所以拉包/调支付网关全失败，但走 VPC 内部路由的内部服务照常。

**标准拓扑：** 把**工作负载（应用服务器、数据库）放私子网**（不直接暴露互联网——攻击者无法直接触及）、**负载均衡器放公子网**（它们接互联网流量并转发进内部）。这是纵深防御——只有 LB 被暴露。

**NAT Gateway 的坑（本案例账单异常）：** NAT Gateway 是 **AZ 范围**（存在于一个 AZ）。若该 AZ 故障，经它路由的私子网失去出站访问——故为 HA 你需要**每 AZ 一个 NAT Gateway**，每个 AZ 的私子网路由到本地 NAT。此外，NAT Gateway 按 **每 GB 处理 + 按小时**计费，且**经 NAT 的跨 AZ 流量**加数据传输费——对话务繁忙的出站负载常是账单上的惊喜。本案例那笔莫名传输费，很可能就是私子网跨 AZ 路由到了别的 AZ 的 NAT，或大量出站流量走 NAT 累积的处理费。

**怎么排查/定位/修复：**
1. 私子网出不了网：查该子网**关联的路由表**是否有 `0.0.0.0/0 → nat-xxxx` 这条路由；缺了就补上。
2. 有路由仍不通：确认 NAT Gateway 在**公**子网里且状态 Available、其所在公子网路由指向 IGW；再查安全组/NACL 是否放行出站。
3. 用 **VPC Flow Logs** 看该 EC2 到目标 API 的出站流量是 ACCEPT 还是 REJECT，定位是路由、NACL 还是安全组挡的。
4. 账单异常：核对每个私子网是否路由到**本 AZ 的 NAT**（跨 AZ 会加数据传输费）；用成本浏览器按 NAT 处理量/传输量拆解，大出站负载考虑 VPC Endpoint（走 S3/ECR 等免 NAT）降费。

**面试常追问 / 权衡：** 每 AZ 一个 NAT 是 HA 与成本的权衡——省钱只放一个 NAT 会让其他 AZ 的私子网在该 AZ 故障时断网。VPC Endpoint（Gateway/Interface）能让到 AWS 服务的流量绕开 NAT，省处理费。安全组是有状态（放行出站自动允回包）、NACL 是无状态（进出都要显式放行），排查出网问题两者都要看。

**要点：**
- 每 AZ 一子网做 HA；公 = IGW 路由（双向），私 = NAT 路由（仅出站）
- 私子网出不了网先查路由表 `0.0.0.0/0 → NAT` 与 NAT 状态，再看 SG/NACL 和 Flow Logs
- 每 AZ 一 NAT GW，工作负载放私子网、LB 放公子网
- NAT 按处理量+小时计费，跨 AZ 加传输费——账单异常查跨 AZ 路由，考虑 VPC Endpoint 降费

---

### 28. 日志 vs 指标 vs 链路追踪

**频率：** 高

**题目：** 半夜告警"结账接口 p99 延迟飙到 3 秒"，但这是个跨 6 个微服务的分布式系统，你不知道慢在哪一环，翻日志又是海量文本无从下手。请辨析日志、指标、追踪三种可观测性信号，在这次排障里各该怎么用？

**这是什么 & 为什么用它：** 日志、指标、追踪是**可观测性三支柱**，各有不同的形态、成本和最佳用途——本案例正需要三者配合：指标告诉你*出了*问题，追踪告诉你慢*在哪*个服务，日志告诉你*是什么*原因。

**落地这个案例：**

- **日志**——**离散、自由格式（或结构化）、上下文丰富的事件**（"用户 123 在时刻 T 从 IP X 登录失败"）。**细节**最高——你能往一行日志里放任何东西——但**规模化存储和查询昂贵**（索引 TB 级文本代价高；见日志聚合）。最适合在你大致知道往哪看之后，对*已知*事故做**深入细节**。
- **指标**——随时间采样的**数值时间序列**（request_count、cpu_percent、p99_latency）。**便宜且高度可聚合**——你能高效地跨数千实例求和/平均。关键约束：**优先低基数**（少量标签组合）——加一个像 `user_id` 的高基数标签会让序列数爆炸、成本/内存飙升。最适合**仪表盘、SLO 和告警**（"错误率 > 1%"）。
- **追踪**——一棵**每请求的 span 树**，显示**跨服务的因果**：请求进 API 网关（span）→ 调 auth（span）→ 调 DB（span），各带时延。最适合在分布式系统里**定位慢或失败的请求把时间花在*哪里***——这正是指标（太聚合）和日志（无跨服务关联）无法展示的。

套到本案例：那条 p99 告警本身就是**指标**（触发了 SLO 阈值）；要在 6 个服务里找出慢在哪一跳，唯一能给你跨服务因果的是**追踪**；锁定慢的那个服务后，再去读它的**日志**看到底是慢查询还是外部依赖超时。

**怎么排查/定位/修复：**
1. 从告警的**指标**入手确认范围：p99 是全接口还是某路由、错误率是否同时升，缩小到"结账链路变慢"。
2. 用**追踪**定位瓶颈跳：在 Jaeger/追踪后端按高延迟筛结账请求的 trace，看 span 树哪一段耗时最长（比如发现 DB span 占了 2.8s）。
3. 读那个服务的**日志**看根因：按 trace id 关联该服务日志，看到"slow query"或"connection pool exhausted"这类完整细节。
4. 修复后回到**指标**看板确认 p99 回落到 SLO 内，形成闭环。

**面试常追问 / 权衡：** 指标便宜可聚合但要防高基数标签（`user_id` 会让序列爆炸）；日志细节最全但海量存储查询贵，无跨服务关联；追踪擅长跨服务因果但通常采样（不是每条都存）。三者结合才完整——只有指标不知道慢在哪，只有日志无法串起跨服务链路。**OpenTelemetry（OTel）** 统一了三者的产生——一个厂商中立的埋点 SDK 和线协议（OTLP）覆盖指标、追踪、日志——埋点一次即可导出到任意后端（Prometheus、Jaeger、Loki、Datadog），而非用三个独立的私有 agent。

**要点：**
- 指标：便宜、可聚合、驱动告警/SLO，注意低基数（告诉你"出了"问题）
- 追踪：跨服务因果、按请求 span 树，定位慢在哪一跳（告诉你"在哪"）
- 日志：全细节但贵、无跨服务关联，深挖根因（告诉你"是什么"）
- 排障链路：指标告警 → 追踪定位服务 → 日志看根因；OpenTelemetry 统一生成三者

---

### 29. Prometheus 拉模型、exporter、recording rule

**频率：** 高

**题目：** 一个大盘上某服务突然显示为红色告警"target down"，同事说应用明明活着；另外你的 Grafana 大盘一到高峰期打开就转圈十几秒、CPU 打满，且历史数据只能查到最近两周、更早的全没了。请解释 Prometheus 的拉式抓取、exporter、recording rule、长期存储，这几个问题怎么定位？

**这是什么 & 为什么用它：** Prometheus 是**拉，不是推**——它周期性地 HTTP-GET 每个目标上的 **`/metrics`** 端点并拉取当前指标值（而非目标推给它）。好处正是本案例排障的关键：Prometheus 掌控抓取时机、能检测目标*宕机*（抓取失败即 `up == 0`），且应用无需知道往哪推。（对无法被抓的短命批处理任务，有 Pushgateway。）

**落地这个案例：**

**各类东西如何暴露指标：**
- **应用**用**客户端库**（Go/Java/Python）直接埋点，暴露 `/metrics`。
- **其他一切**——数据库、操作系统、硬件、黑盒端点——由 **exporter** 包装：**`node_exporter`**（主机 CPU/内存/磁盘）、**`blackbox_exporter`**（从外部探测 URL/端口）、**`mysqld_exporter`** 等。exporter 把系统的统计翻译成 Prometheus 格式。
- **服务发现**（Kubernetes、EC2、Consul）随目标上下线自动**找到它们**——在 pod IP 不断变化的动态环境里至关重要。

本案例"target down 但应用活着"，多半不是应用挂了，而是**抓取路径**出了问题：`/metrics` 端口没暴露、网络策略挡了 Prometheus、或服务发现拿到的是过期 pod IP。

**大盘慢用 recording rule 治：** 你那个高峰打开转圈的大盘，几乎肯定在查询时现算 `sum(rate(http_requests_total[5m]))` 跨成千上万条序列。**Recording rule** 按计划**预计算昂贵查询**并把结果存为新时间序列——于是仪表盘和告警读一个便宜的预聚合指标（如 `job:http_requests:rate5m`），而非每次打开都重算。**Alerting rule** 则按计划评估 PromQL 并**在其变真时开火**（如 `rate(errors[5m]) > 0.05`），发到 **Alertmanager** 做路由/去重/静默。

**历史只剩两周靠长期存储解：** Prometheus 的本地 TSDB 面向**近期**数据（天到周，受 `--storage.tsdb.retention.time` 控制）且不横向扩展——这就是你查不到更早数据的原因。为长保留和全局视图，用**联邦**（更高层 Prometheus 从多个抓取聚合）或 **`remote_write`** 到可扩展后端——**Thanos、Mimir 或 VictoriaMetrics**——它们提供长期存储、降采样和跨多个 Prometheus 实例查询。

**怎么排查/定位/修复：**
1. target down：先在 Prometheus 的 **Status → Targets** 页看该目标的 `up` 值和 **Last Scrape Error**（如 `connection refused`、`context deadline exceeded`），一眼看出是端口、超时还是 DNS。
2. 手动验证端点：在 Prometheus 能到的网络位置 `curl http://<target>:<port>/metrics`，能返回就说明是网络/服务发现问题，不能返回则是应用没暴露 `/metrics`。
3. 大盘慢：把大盘里重的聚合查询抽成 recording rule，仪表盘改读预聚合序列；用 `/metrics` 上 Prometheus 自身的 `prometheus_rule_evaluation_duration_seconds` 确认规则求值不超时。
4. 历史丢失：调大 `retention.time` 只是治标（本地盘迟早爆），治本是配 `remote_write` 到 Thanos/Mimir/VictoriaMetrics，把长期查询指向它们。

**面试常追问 / 权衡：** 拉模型的好处是能天然检测目标宕机、集中控制抓取；短命任务拉不到只能用 Pushgateway。recording rule 用存储换查询速度（多存一份预聚合序列）。本地 TSDB 简单但不能长留、不横向扩展；remote_write 到 Thanos/Mimir 换来长保留和全局视图，代价是运维复杂度和成本。注意**高基数标签**会让序列爆炸，拖慢抓取和查询。

**要点：**
- 拉模型从 `/metrics` 抓取，target down 先看 Targets 页的 `up` 和 Last Scrape Error，再 `curl` 验证端点
- Exporter 包装未埋点系统；服务发现应对动态 pod IP
- 大盘慢用 recording rule 预计算聚合，仪表盘改读便宜的预聚合序列
- 本地 TSDB 只留近期数据，长期靠 remote_write 到 Thanos / Mimir / VictoriaMetrics

---

### 30. SLI / SLO / 错误预算

**频率：** 高

**题目：** 产品经理想月中上一个有风险的大改，运维担心稳定性，两边争"到底稳不稳、能不能发"吵了一上午；同时你的告警系统一有零星 500 就把 on-call 吵醒，噪声大到大家开始忽略告警。请用 SLI / SLO / 错误预算和燃烧率告警，给这两个问题一个客观的决策规则。

**这是什么 & 为什么用它：** 这是一套把"可靠性"从主观争论变成**可度量、可行动**之物的层级，正好解决本案例的两个痛点——用错误预算终结"能不能发"的口水仗，用燃烧率告警止住噪声。

- **SLI（服务水平指标）**——一个反映用户体验的**被度量**的数字：**可用性**（成功请求的比例）、**p99 延迟**、错误率。它是原始信号。
- **SLO（服务水平目标）**——**该 SLI 在某窗口上的目标**："30 天内 99.9% 的请求成功"、"p99 延迟 < 300ms"。它是你承诺的目标。（SLA 是带罚则的*合同*版本——通常比你内部 SLO 更宽松。）
- **错误预算**——**`100% − SLO`** = **允许的不可靠量**。99.9% 可用性 SLO 意味着 **0.1% 错误预算**——大约**每月 43 分钟**你*被允许*花掉的停机。

**落地这个案例：**

**用错误预算裁决"能不能发"：** 错误预算把可靠性重构为一种*可花费的资源*，而非要最大化的东西——本案例的争论直接由"这月还剩多少预算"回答：
- **预算有余**时（比如本月只烧了 43 分钟里的 5 分钟），PM 那个有风险的改**可以发**——更快发特性、做有风险的迁移、跑实验。*太*可靠（远低于预算）其实说明你走得太慢。
- **预算烧光**时（用掉了那 43 分钟），**停止有风险的上线**并**把精力转向可靠性**——回到预算内之前不再上新特性。这给开发和运维一个**共享的、客观的决策规则**，不用再吵"够稳了吗能发吗？"

**用燃烧率告警止住噪声：** 你那个零星 500 就把人吵醒的告警，问题在于对*单个请求失败*告警。改成对**你消耗预算的速度**告警——**多窗口、多燃烧率告警**在检测到**快速燃烧**（如 1 小时内消耗月预算的 2% → 立即呼叫）*和/或* **缓慢燃烧**（如数天内趋向耗尽预算 → 开工单）时才开火，用一个短窗口和一个长窗口确认它是真的而非一闪。这样瞬时错误噪声被抑制，只有真正威胁预算的问题才吵醒人。

**怎么排查/定位/修复：**
1. 争"能不能发"：打开错误预算看板，看本月剩余预算百分比；有余就批准发布，接近耗尽就冻结有风险变更——用数字而非感觉决策。
2. 告警太吵：把"单请求失败告警"替换为多窗口燃烧率告警，例如短窗口（5m/1h）和长窗口（1h/6h）同时超阈才 page，慢燃烧只开工单。
3. 定位预算被谁烧掉：按路由/依赖拆分 SLI（哪个接口、哪个下游拉低了成功率），锁定消耗预算的源头再修。
4. 预算烧光后：触发发布冻结流程，团队把迭代目标从特性切到可靠性工作，回到预算内再解冻。

**面试常追问 / 权衡：** SLO 定太高（如 99.999%）会让预算极小、稍有抖动就冻结发布，反而拖慢团队；定太低又保护不了用户体验——SLO 该由真实用户容忍度反推。SLA 是对外合同版、通常比内部 SLO 宽松，留出缓冲。燃烧率告警的多窗口设计是在"及时性"和"抗噪"之间的权衡：短窗口反应快但易误报，长窗口稳但慢，两者与门才兼顾。

**要点：**
- SLI 度量、SLO 目标、错误预算 = 1 - SLO（如 99.9% → 每月约 43 分钟）
- 错误预算是"能不能发"的客观裁决：有余则发，烧光则冻结风险变更
- 燃烧率告警对消耗预算的速度告警，多窗口多燃烧率抗噪、只在真威胁时 page
- SLO 定太高预算太小反拖慢团队，按真实用户容忍度反推

---

### 31. 事件响应：严重度、runbook、复盘

**频率：** 高

**题目：** 凌晨两点支付服务全线宕机，作战群里十几个人同时在敲命令、各说各的、没人知道谁在负责，客服那边被用户投诉淹没却拿不到状态更新；事后复盘会又开成了"甩锅大会"，三个月后同样的故障再次发生。请用事件响应的严重度、runbook、角色和复盘，说清这场混乱怎么治。

**这是什么 & 为什么用它：** 事件响应是一套用于**快速响应并从故障中学习**的结构化实践，正是本案例缺的东西——没有严重度分级、没有 runbook、没有明确角色、复盘还搞成追责，结果响应混乱、故障复发。

**落地这个案例：**

**严重度阶梯**——分类影响并**触发响应级别**：本案例支付全线宕、营收受损，就是 **Sev1** = 影响客户的故障 → 全员上阵、呼叫所有人、开作战室；**Sev2** = 服务降级（慢、部分失败、有绕过办法）→ 紧急但非全员；**Sev3** = 轻微（外观、仅内部、低影响）→ 正常工时处理。正确设置严重度确保既不反应不足也不反应过度。

**Runbook**——**每个告警都应链到一个 runbook**，带具体的**诊断和缓解步骤**（"若此开火，检查 X，跑 Y，若 Z 则故障转移"）。这让被叫醒的 on-call 工程师立即行动，而非凌晨 3 点逆向工程系统——本案例十几人乱敲，正因为没有 runbook 指路。

**事件期间的角色**——本案例"十几人各说各的、没人负责"的混乱，靠指派清晰角色解决：**事件指挥官（IC）**——协调、决策、拥有响应（不一定是敲修复的人）；**通讯**——负责向利益相关方/状态页更新（回答客服和用户），使响应者不被打断；**记录员**——记录**时间线**（何时发生什么、尝试了什么）供复盘。

**事后无指责复盘**——约一周内，记录**时间线**、**贡献因素**（刻意*不*叫"根因"——复杂故障有*多个*贡献因素，单一"根因"思维过度简化）和**带 owner、截止日期的行动项**。**无指责**至关重要：聚焦*系统如何允许*失败，而非*谁*犯了错——本案例开成甩锅大会，只会驱使人藏信息、扼杀学习。而**同一故障三个月后复发**，正是因为行动项没跟踪到完成——多数团队写出很好的复盘然后从不做后续。像对待任何其他优先工作一样跟踪它们。

**怎么排查/定位/修复：**
1. 止血优先级：Sev1 先**指定 IC**接管指挥，让作战群从"人人乱敲"变成"IC 统一决策、点名分工"。
2. IC 指派通讯角色定时更新状态页/客服群，指派记录员在共享文档实时记时间线，其余人只按 IC 分工执行。
3. 缓解按 runbook 走：照着告警链接的 runbook 步骤诊断和故障转移（如切备用集群、回滚上个发布），先恢复再找根因。
4. 恢复后一周内开无指责复盘：还原时间线、列多个贡献因素、给每条行动项定 owner 和截止日期，并进 backlog 像正常工作一样跟踪到关闭，防止复发。

**面试常追问 / 权衡：** IC 不一定是最懂技术的人，关键是协调决策，让专家专注修复。无指责不等于无责任——它追踪的是系统性改进而非惩罚个人。严重度定得过高会疲劳（动辄全员呼叫），过低又反应不足；分级标准要事先写清。复盘最难的不是写，而是把行动项真正做完——很多团队败在这一步导致故障反复。

**要点：**
- 严重度阶梯触发响应级（Sev1 全员作战室 / Sev2 紧急 / Sev3 工时处理）
- 每个告警始终链到 runbook，让 on-call 照步骤止血而非现场逆向系统
- 指派 IC / 通讯 / 记录员三角色，终结"人人乱敲、没人负责"
- 无指责复盘列贡献因素而非单一根因，行动项带 owner+截止日期并跟踪到关闭防复发

---

### 32. 成本优化

**频率：** 高

**题目：** 财务甩来一张 AWS 账单，比上季度涨了 40%，管理层要你两周内砍成本，但你手里连"钱花在哪个团队/服务"都说不清。请给出一套按影响排序的云成本优化打法，并说明你会先动哪里、怎么定位浪费。

**这是什么 & 为什么用它：** 云成本优化是一套**按影响排序**的分层方法——先动省得最多、花钱最少的地方。本案例账单暴涨还看不清去向，正需要这套方法从"最大赢点"依次砍下去，并先补上归因能力。

**落地这个案例：**

1. **先右调（最大赢点）**——对比 **实际 vs 请求/供给** 的 CPU 和内存（经 `kubectl top`、成本工具、CloudWatch）并**削减过度供给**。多数浪费是"为保险"把实例/pod 定得比实际用量大 3–5 倍。这通常是单项最大的节省，除了用心之外不花钱——两周砍成本先从这里下手。
2. **容错工作负载用 spot/preemptible 实例**——闲置容量实例，**打 6–9 折折扣**，代价是云可能短通知内回收。非常适合**无状态、可重试或批处理**工作（CI runner、无状态 web 层、数据处理）。**Karpenter**（Kubernetes autoscaler）能**自动混合 spot 和按需**——多数 pod 跑 spot，spot 不可用时回落到按需，并跨实例类型分散以减少中断。
3. **为稳定基线做承诺**——对**常开**的最小容量，买 **Reserved Instance、Savings Plan（AWS）或 Committed Use Discount（GCP）**——承诺 1–3 年的基线用量换大折扣。覆盖*基线*，用按需/spot 应对*尖峰*的顶部。
4. **删除浪费**——揪出无声的漏财：**未挂载的 EBS 卷**、**旧快照**、**闲置负载均衡器**、孤立的弹性 IP、通宵未关的 dev 环境。也**给对象存储分层生命周期**——随数据老化把 S3/GCS 移到**低频访问 / 归档层**（Glacier），因为多数存储的数据很少被读。
5. **一切打标签 + 预算告警 + FinOps 文化**——本案例"看不清钱花在哪"就靠这条根治：**给每个资源打标签**（团队、服务、环境）以做 **showback/chargeback**。对异常设**预算告警**（每日花费尖峰）。并建立 **FinOps 文化**，让工程师**为自己的成本负责**——成本进仪表盘、成本作为一等指标——而非把账单当财务的问题。

**怎么排查/定位/修复：**
1. 先归因：用 **Cost Explorer** 按服务/标签拆这 40% 的涨幅，找出是哪个服务、哪个维度（计算/存储/传输）涨的——本案例第一步就是把账单拆开看。
2. 右调定位：`kubectl top pods/nodes` 或 CloudWatch 对比实际用量 vs 请求量，揪出过度供给 3–5 倍的负载，下调 request/limit 或换小实例。
3. 找漏财：列未挂载 EBS 卷、旧快照、闲置 LB、孤立 EIP、没关的 dev 环境，逐项清理。
4. 结构性降费：把容错负载迁到 spot（Karpenter 混合），基线容量买 RI/SP/CUD，对象存储配生命周期规则自动分层到低频/归档。
5. 防复发：给所有资源强制打标签，设每日预算告警，成本进团队仪表盘做 chargeback。

**面试常追问 / 权衡：** 右调最省且不花钱，但砍太狠会在流量尖峰时不够用——留合理 headroom。spot 便宜但会被回收，只适合无状态/可重试负载，有状态服务放上去会丢数据。RI/SP/CUD 锁 1–3 年换折扣，但承诺过量、业务萎缩就变成沉没成本——只 commit 稳定基线。标签治理是长期功夫，缺了它一切归因和 chargeback 都无从谈起。

**要点：**
- 先右调（最大赢点、不花钱）：`kubectl top`/CloudWatch 对比实际 vs 请求量削过度供给
- 归因先行：Cost Explorer 按服务/标签拆账单找涨幅来源
- 容错用 spot（Karpenter 混合），稳定基线 commit RI/SP/CUD 换折扣
- 删漏财（未挂载卷/旧快照/闲置 LB）+ 存储生命周期分层
- 强制打标签 + 预算告警 + FinOps 文化防复发

---

### 33. 文件描述符与 ulimit

**频率：** 中

**题目：** 一个 Node/Nginx 服务在流量涨上来后开始日志刷屏 `EMFILE: too many open files`、新连接被拒绝、错误率飙升，但机器 CPU 和内存都很闲。请解释文件描述符是什么、为什么会撞这堵墙，以及你怎么一步步定位和提高上限。

**这是什么 & 为什么用它：** **文件描述符（FD）**是一个**小的非负整数**，索引进内核的**每进程打开文件表**——它是进程用来引用任何已打开 I/O 资源的句柄。按惯例 **0 = stdin，1 = stdout，2 = stderr**；进程之后打开的一切拿到下一个空闲整数。理解 FD 正是本案例排障的钥匙：CPU/内存都闲却报错，问题不在算力而在 FD 耗尽。

**落地这个案例：**

**"文件"是个误称**——FD 代表的远不止磁盘文件：**套接字、管道、epoll/eventfd 句柄、timerfd 和事件通知都消耗 FD**。这就是为什么 FD 上限对**网络服务器**咬得最狠：一台持有 5 万并发连接的服务器就持有 5 万+ 套接字 FD——本案例流量一涨、并发连接激增，FD 就先见底。

**为什么默认上限伤害高连接服务：** 默认**软 `nofile` 上限常常只有 1024**。一个繁忙的代理、数据库或 web 服务器轻易超过它并开始以 **`EMFILE: too many open files`** 失败——`accept()` 失败、新连接被拒、服务降级，即便 CPU/内存都没问题。这是经典的无声扩展墙，正是本案例的症状。

**提高它的方式**（软 ≤ 硬上限）：
- **`ulimit -n <N>`**——针对当前 shell 及其子进程（交互/快速）。
- **systemd 单元**——`[Service]` 段的 **`LimitNOFILE=`**（systemd 管理的守护进程的正确位置；shell 里的 `ulimit` 不影响它）。
- **`/etc/security/limits.conf`**——在登录时为用户/组设 **`nofile`** 上限（基于 PAM）。
- **容器**——**kubelet / 容器运行时（Docker）设置封顶**容器能请求的额度；你可能需要抬高守护进程的 `default-ulimits` 或在 pod spec/运行时配置里设上限，因为容器无法超过运行时允许的。

**怎么排查/定位/修复：**
1. 确认是 FD 耗尽而非算力：CPU/内存闲却报 `EMFILE`，基本锁定 FD。
2. 找到进程 PID，看当前用量：`ls /proc/<pid>/fd | wc -l` 数当前打开的 FD 数。
3. 看该进程的上限：`cat /proc/<pid>/limits | grep "open files"` 看软/硬 `nofile`，对比用量是否顶到上限。
4. 提高上限，选对位置：systemd 服务改 `[Service]` 的 `LimitNOFILE=` 再 `daemon-reload` + 重启（shell 里 `ulimit` 对它无效）；容器则改运行时 `default-ulimits` 或 pod spec。
5. 别只调上限——排查是否**FD 泄漏**：连接/文件用完不关会让 FD 只涨不降，`ls /proc/<pid>/fd` 里堆积大量同类 socket 就是信号，得从代码修（确保 close、用连接池）。

**面试常追问 / 权衡：** 软上限可由进程自行提到硬上限以内，硬上限只有特权能提。一味调大 `nofile` 掩盖不了 FD 泄漏——泄漏会持续吃满任何上限，必须从代码根治。systemd 服务的上限**不受** shell `ulimit` 影响，改错地方是常见坑。容器里进程无法超过运行时允许的上限，即便应用自己想调也没用。

**要点：**
- FD 是每进程的整数索引，套接字/管道/epoll 都算 FD，网络服务最先撞墙
- `EMFILE` + CPU/内存闲 = FD 耗尽，抬高 `nofile`
- 查用量 `ls /proc/<pid>/fd | wc -l`，查上限 `cat /proc/<pid>/limits`
- systemd 用 `LimitNOFILE=`（shell `ulimit` 无效）、k8s 用运行时配置；先排除 FD 泄漏再调大

---

### 34. systemd 单元与 journalctl

**频率：** 中

**题目：** 一个自研守护进程部署到线上后老是崩，运维发现它崩了不会自动拉起、日志也散落在各处不好查；改了单元文件里的内存上限却"不生效"，机器重启还异常地慢。请解释 systemd 怎么管服务、怎么用 journalctl 查日志，这几个问题怎么排查？

**这是什么 & 为什么用它：** systemd 把一切建模为带类型后缀的**单元**：**`.service`**（长期运行或 oneshot 进程）、**`.timer`**（类 cron 调度触发服务——比 cron 有更好的日志和依赖处理）、**`.socket`**（套接字激活——systemd 持有监听套接字并在首次连接时启动服务）、**`.mount`**（文件系统挂载）和 **`.target`**（分组/里程碑如 `multi-user.target`）。用它正是为了解决本案例：让崩溃服务自动恢复、日志集中可查、资源受限。

**落地这个案例：**

**让崩溃服务自动拉起**——一个 `.service` 单元文件（在 `/etc/systemd/system/`）在其 `[Service]` 段声明行为：
- **`ExecStart=`**——要运行的命令。
- **`Restart=`**——韧性策略（**`on-failure`** 是常见选择）加 **`RestartSec=`** 在重启间退避，使崩溃的服务自动恢复而非保持死亡——本案例"崩了不拉起"就是缺了这两行。
- **`User=`**——以非特权用户运行（最小权限）。
- **资源上限**——`LimitNOFILE=`、`MemoryMax=`、`CPUQuota=`（systemd 通过 cgroup 施加）。

**管理单元：**
- **`systemctl daemon-reload`**——编辑单元文件后必需，使 systemd 重读它。本案例"改了内存上限却不生效"，最常见的原因就是忘了 `daemon-reload` + 重启服务。
- **`systemctl enable --now foo`**——开机启用*且*立即启动（enable = 开机启动，start = 现在启动）。
- 其余用 `systemctl status/restart/stop foo`。
- **Drop-in**：把覆盖放进 `/etc/systemd/system/foo.service.d/*.conf` 以改一个设置而不编辑厂商单元（能挺过包升级）。

**怎么排查/定位/修复：**
1. 崩了不拉起：`systemctl status foo` 看是否 failed 及退出码，给单元 `[Service]` 加 `Restart=on-failure` + `RestartSec=5`，`daemon-reload` 后重启。
2. 查散落日志：systemd 服务其实都记录到 **journal**（结构化、有索引），用 `journalctl -u foo -f`（实时跟随）、`--since "1 hour ago"` / `--until`、`-p err`（优先级过滤）、`-b`（本次启动）集中查询，不用再翻各处日志文件。
3. 改配置不生效：确认改的是对的文件后，务必 `systemctl daemon-reload` 让 systemd 重读，再 `systemctl restart foo`；用 `systemctl show foo -p MemoryMax` 验证新值真的生效。
4. 开机慢：`systemd-analyze blame` 列每个单元的启动耗时，`systemd-analyze critical-chain` 看关键路径上是哪个单元拖慢了启动，针对性优化或改依赖。

**面试常追问 / 权衡：** 编辑单元后不 `daemon-reload` 是最常见的"改了不生效"坑。用 drop-in 覆盖比直接改厂商单元好，能挺过包升级。`Restart=always` 对任何退出都重启（含正常退出），`on-failure` 只对失败重启——选错会让 oneshot 任务反复重跑。资源上限走 cgroup，比在 shell 里 `ulimit` 更可靠地约束 systemd 管理的守护进程。

**要点：**
- 单元类型：service/timer/socket/mount/target
- `Restart=on-failure` + `RestartSec=` 让崩溃服务自动恢复
- 改单元后必须 `daemon-reload` + 重启，否则不生效；用 drop-in 覆盖挺过升级
- `journalctl -u <unit> -f` 集中查日志；开机慢用 `systemd-analyze blame`/`critical-chain` 定位

---

### 35. HTTP/1.1 vs HTTP/2 vs HTTP/3

**频率：** 中

**题目：** 你的 gRPC 服务在测试环境两两互通正常，一上线经过负载均衡器就大量报错、或所有请求都压到同一个后端上；另外前端团队抱怨移动端弱网下页面加载特别慢。请对比 HTTP/1.1、HTTP/2、HTTP/3，说清 gRPC 需要什么、这两个问题根因在哪。

**这是什么 & 为什么用它：** HTTP 三代，每代修复前一代的瓶颈——理解它们正是本案例定位"gRPC 过 LB 报错"和"弱网慢"的基础。

**落地这个案例：**

**HTTP/1.1**——**基于文本**，根本上**每个 TCP 连接一个在途请求**。你可以流水线化请求，但响应必须按序返回，导致**队头（HoL）阻塞**——一个慢响应拖住它后面的一切。浏览器靠**每主机开约 6 个并行连接**绕过，这很浪费（6 倍握手、6 倍拥塞状态）。

**HTTP/2**——**二进制分帧**而非文本，以及大赢点：**在*单个* TCP 连接上多路复用流**。许多请求/响应并发交错，无每请求连接开销。加了 **HPACK 头部压缩**（头部跨请求高度重复——cookie、user-agent——压缩它们省真实带宽）和**服务端推送**（服务器主动发资源；实践中基本被弃用）。**遗留缺陷：** 它仍跑在 **TCP** 上，故单个丢包会拖住*所有*多路复用流——**TCP 层 HoL 阻塞**——因为 TCP 按序交付字节。

**HTTP/3**——跑在 **QUIC over UDP** 而非 TCP 上。QUIC 自己实现流，故丢包只拖住*它自己的*流——**消除 TCP HoL 阻塞**。它还**合并传输 + TLS 握手**以更快建连，包括 **0-RTT** 恢复（对之前见过的服务器在首包就发数据）。适合有损/移动网络——本案例"移动端弱网慢"正是 HTTP/3 能改善的场景（弱网丢包多，H2 会因 TCP HoL 卡住全部流）。

**gRPC 端到端需要 HTTP/2**——它依赖 H2 的多路复用流和双向流（一个连接上许多并发 RPC、双向流）。这正是本案例根因：gRPC 复用**单条长连接**，若 LB 只做 L4/连接级均衡，所有 RPC 会被绑到同一个后端（负载不均）；若 LB 不支持 H2 或把连接降级到 H1，gRPC 直接中断。路径中任何代理/负载均衡器必须支持 H2 并做 **L7/gRPC 感知**的负载均衡。

**怎么排查/定位/修复：**
1. gRPC 过 LB 报错：确认 LB 到后端全程走 H2（很多 LB 默认对后端用 H1），开启 gRPC/HTTP2 后端协议；用 `curl --http2` 或 `grpcurl` 对 LB 直连验证。
2. 请求压到单后端：因为 gRPC 单连接多路复用，L4 均衡会绑死后端——改用 L7 gRPC 感知均衡（如 Envoy、gRPC 客户端侧负载均衡），或让客户端周期性重建连接分散。
3. 弱网慢：抓包看是否大量 TCP 重传导致 H2 全流卡顿；在 CDN/入口开启 HTTP/3（QUIC），通过 `Alt-Svc` 头让客户端协商升级到 H3。
4. 验证协商结果：浏览器 DevTools 的 Protocol 列或 `curl -I --http3` 确认实际用的是 h2 还是 h3。

**面试常追问 / 权衡：** H2 的多路复用消除了应用层 HoL，但没消除 TCP 层 HoL——弱网丢包时反而可能不如多连接的 H1；H3/QUIC 才彻底解决，代价是 UDP 可能被某些企业防火墙拦。gRPC 强依赖 H2，中间任何环节降级都会断——这是运维部署 gRPC 的最大坑。服务端推送已基本废弃，别指望。

**要点：**
- H1：每连接一个在途，浏览器开约 6 连接绕 HoL
- H2：单 TCP 连接多路复用流、HPACK 压缩，但仍有 TCP 层 HoL
- H3：UDP 上 QUIC，消除 TCP HoL，适合弱网/移动，CDN 经 `Alt-Svc` 协商
- gRPC 端到端需 H2，LB 必须支持 H2 且做 L7/gRPC 感知均衡，否则中断或压单后端

---

### 36. TLS 握手与证书链

**频率：** 中

**题目：** 用户报告你的站点报证书错误，诡异的是 Chrome 能打开、curl 和某些手机 App 却报 "unable to get local issuer certificate"；过一阵又出现整站 HTTPS 全挂、浏览器提示证书过期。请解释 TLS 握手、证书链验证、TLS 1.3，这两类故障怎么定位。

**这是什么 & 为什么用它：** TLS 保证传输的机密性和身份可信，理解它的握手与证书链，正是排查本案例"部分客户端报错"和"整站过期"的基础。

**握手：** 客户端与服务端**协商密码套件**并**建立共享会话密钥**。现代做法用 **ECDHE**（椭圆曲线临时 Diffie-Hellman）做密钥交换，提供**前向保密**——每会话一个*临时*密钥意味着即便服务器的长期私钥日后被窃，过去录制的会话也**无法**解密（每个用了不同的、已丢弃的临时密钥）。

**落地这个案例：**

**证书链验证：** 服务端出示其**叶证书加中间证书**。客户端验证一条**信任链**：叶 → 中间 CA → … → **客户端信任库中的根 CA**。每张证书由上一级签名；根被预信任。客户端还检查：(1) **SAN（主体备用名）匹配它要连的主机名**（CN 字段已遗留、被现代客户端忽略）；(2) **有效期**（未过期/未生效）；(3) 经 **OCSP**（或 OCSP stapling）或 **CRL** 的**吊销**——此证书是否被吊销？

本案例"Chrome 能开、curl/App 报 unable to get local issuer certificate"，是典型的**缺中间证书**：服务端只发了叶证书，Chrome 恰好缓存过该中间证书能自己补上，curl 和某些 App 没缓存就建不了链——同一站点在不同客户端间歇失败正是这个信号。而"整站证书过期"则是有效期检查失败。

**TLS 1.3 改动：** 通过去掉协商往返把**握手压缩到一个往返（1-RTT）**——恢复用 0-RTT；**去除遗留/弱密码**（无 RSA 密钥交换、无 CBC、无 RC4）；并让**前向保密强制**（总是 ECDHE）。默认更快更安全。

**怎么排查/定位/修复：**
1. 抓服务端实际发的链：`openssl s_client -connect host:443 -showcerts`，看它返回了几张证书——只有叶一张就是缺中间证书。
2. 验证链完整性：`openssl s_client -connect host:443` 输出里 `Verify return code` 非 0（如 21 unable to get local issuer）确认建链失败；修复是在服务端配置里拼上完整的中间证书链（fullchain）。
3. 查过期：`openssl s_client -connect host:443 | openssl x509 -noout -dates` 看 notBefore/notAfter，或 `echo | openssl x509 -enddate` 确认是否过期。
4. 查 SAN 是否匹配：`openssl x509 -noout -text | grep -A1 "Subject Alternative Name"` 看证书覆盖的主机名。
5. 根治过期：上自动续期（ACME/Let's Encrypt、cert-manager）并在到期前 N 天告警，别再靠人工记。

**面试常追问 / 权衡：** 缺中间证书最坑的地方是"部分客户端能用"，掩盖了问题——始终配 fullchain。ECDHE 前向保密是现代默认，TLS 1.3 强制它。0-RTT 恢复快但有重放风险，只适合幂等请求。OCSP stapling 让服务端代查吊销状态、省客户端一次往返且更可靠。证书过期是最常见也最可预防的线上事故，自动续期 + 告警是标配。

**要点：**
- 链：叶 -> 中间 -> 客户端信任库的受信根，缺中间证书会让部分客户端间歇失败
- SAN 必须匹配主机名（CN 已遗留）、检查有效期与吊销
- TLS 1.3 = 1-RTT、强制前向保密、去弱密码
- 调试 `openssl s_client -connect host:443 -showcerts`；过期靠 ACME/cert-manager 自动续期 + 告警

---

### 37. SSH 密钥、agent 转发、跳板机

**频率：** 中

**题目：** 团队要访问只能经跳板机进的私有子网机器，有人图省事全程用了 `ForwardAgent yes`；后来安全审计发现那台共享跳板机被入侵，怀疑有人的 SSH 密钥被冒用。请讨论 SSH 密钥、agent 转发和跳板机（ProxyJump），说清这个安全隐患和更稳的做法。

**这是什么 & 为什么用它：** SSH 用密钥对做无口令的强身份认证，跳板机/agent 转发是穿透私有网络的两种手段——但安全性天差地别，本案例的入侵正暴露了 agent 转发的风险。

**密钥：** 优先 **Ed25519**（`ssh-keygen -t ed25519`）而非 RSA——它是现代椭圆曲线算法，**更快、密钥小、安全强**（RSA 需 3072+ 位才等强）。用**口令**保护私钥，使被窃的密钥文件单独无用，并加载到 **`ssh-agent`**，这样你输一次口令，agent 就在内存中持有解密的密钥供后续连接。

**落地这个案例：**

**Agent 转发（`ForwardAgent yes`）的风险正是本案例根因：** 它把你的**本地 agent 套接字转发到远端**，于是从远端你能继续认证（如从服务器 `git clone`）而**无需把私钥拷过去**。方便，但**在共享/不可信主机上有风险**：任何在远端有 **root** 的人都能劫持转发的套接字并**用你的密钥冒充你**去访问你 agent 能触及的一切，只要你还连着。跳板机一旦被入侵（正如本案例），攻击者就能趁大家转发 agent 时冒用密钥——绝不通过你不完全信任的机器转发 agent。

**ProxyJump（`ssh -J bastion target` 或配置里的 `ProxyJump`）是更安全的替代**——通过跳板机到达私有主机。它把连接**隧道穿过**跳板机（它只转发加密流），使你的**认证和密钥终结在*目标*而非跳板机**——跳板机永远见不到你的 agent 套接字或密钥。不像 agent 转发，被攻破的跳板机偷不到你的凭证。这才是访问私子网机器的推荐模式，本案例应全面改用它。

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

**怎么排查/定位/修复：**
1. 排查谁开了 agent 转发：`grep -r ForwardAgent ~/.ssh/config /etc/ssh/ssh_config*`，把 `ForwardAgent yes` 全改为 `no`，改用 ProxyJump。
2. 事故止血：跳板机被入侵后，视所有近期转发过 agent 的密钥为已泄露，`ssh-keygen` 生成新 Ed25519 密钥对、轮换所有服务器上的 `authorized_keys`，吊销旧公钥。
3. 验证连接路径：`ssh -v app-1` 看 verbose 输出确认走的是 ProxyJump 隧道、认证终结在目标；`ssh-add -l` 查 agent 当前加载了哪些密钥。
4. 收敛暴露面：跳板机上限制 `AllowAgentForwarding no`（服务端强制关闭转发），从源头杜绝。

**面试常追问 / 权衡：** agent 转发方便但把信任延伸到了远端主机，只在完全可信的机器上用；ProxyJump 只让跳板机转发加密流、看不到密钥，是默认更优解。老式 `ProxyCommand`（用 netcat）能实现类似效果但更繁琐，`-J`/`ProxyJump` 是现代简洁写法。Ed25519 比 RSA-2048 更快更强，除非要兼容老系统否则首选。私钥务必带口令，纯裸密钥文件被拷走即完全沦陷。

**要点：**
- Ed25519 > RSA-2048，私钥加口令并用 ssh-agent 持有
- agent 转发在共享/不可信主机有风险：被入侵主机的 root 可劫持套接字冒用你的密钥
- `ProxyJump`/`-J` 更安全：密钥终结在目标、跳板机看不到，是访问私子网推荐模式
- 事故后轮换密钥；服务端 `AllowAgentForwarding no` 从源头杜绝；`~/.ssh/config` 配复用

---

### 38. Distroless vs scratch vs alpine

**频率：** 中

**题目：** 你把 Go 服务从 alpine 基础镜像迁过来减体积和 CVE，结果两件怪事：迁到 alpine 时服务偶发 DNS 解析失败/连不上下游；改用 distroless 后镜像里没了 shell，线上出问题时你 `kubectl exec` 进去连 `ls` 和 `curl` 都没有，没法排查。请对比 scratch、distroless、alpine，说清这两个问题和 distroless 怎么调试。

**这是什么 & 为什么用它：** 三种极简容器基础镜像方案，在体积、CVE 与可调试性之间权衡——本案例的 DNS 怪癖和"进不去排查"正是这套权衡的两个典型坑。

**落地这个案例：**

- **`scratch`**——**空镜像**：字面上什么都没有，只有你的二进制。只适用于**完全静态的二进制**（`CGO_ENABLED=0` 的 Go、静态 Rust）。**最小最安全**（零包 = 近零 CVE，无 shell 供攻击者利用）但**最难调试**——无 shell、无 `ls`、无 libc、无 CA 证书（要让 TLS 工作你得自己拷进去）。
- **distroless**（`gcr.io/distroless/*`）——包含你应用所需的**最小运行时**——**libc、CA 证书**、时区数据，以及可选的语言运行时（`distroless/java`、`distroless/python3`）——但**无包管理器、无 shell**。多数生产的甜蜜点：攻击面小，适用于动态链接二进制和解释型应用，仍无 shell 给攻击者。本案例"exec 进去没有 ls/curl"正是它无 shell 的直接后果。
- **alpine**——一个微型真发行版：**musl libc、busybox**（最小 shell + coreutils）和 **`apk`** 包管理器。仅约 5MB 且你*可以* shell 进去装工具。代价：**musl libc ≠ glibc**，故 **glibc 编译的二进制在 alpine 上可能出问题**，且 musl 历史上有 **DNS 解析怪癖**（search 域行为不同、旧版无并行 A/AAAA）导致微妙网络 bug——本案例迁到 alpine 后偶发 DNS 失败，八成就是 musl 的解析行为在作怪。它的 `apk` 包也与 Debian/Ubuntu 不同。

**该选哪个：** **生产用 scratch 或 distroless**——攻击面最小、CVE 更少、更小更快。**当你确实需要镜像里有包管理器或 shell 时用 alpine**，接受 musl 边缘情况（或用 `debian:slim` 这类精简 glibc 发行版）。

**怎么排查/定位/修复：**
1. alpine DNS 怪癖：容器内 DNS 解析异常时，先 `cat /etc/resolv.conf` 看 search 域和 `ndots`，musl 对多 search 域和 `ndots` 的处理与 glibc 不同；升级 alpine 版本（新版修了并行 A/AAAA），或干脆换 `debian:slim` 用 glibc 规避。
2. 确认 libc 兼容：`ldd your-binary` 看依赖，glibc 编译的动态二进制放 alpine 会因缺 glibc 崩——要么静态编译（`CGO_ENABLED=0`），要么用 glibc 基础镜像。
3. 调试无 shell 的 distroless/scratch：既然镜像里没工具，用**临时调试容器**——`kubectl debug -it <pod> --image=busybox --target=<container>` 挂一个共享目标命名空间（进程、网络）的临时容器，于是你在运行容器*旁*就有了 `ls`/`curl`/`nslookup`，而无需把 shell 烤进生产镜像。
4. docker 场景：类似地把调试容器以 `--network container:<id>`、`--pid container:<id>` 挂到目标命名空间来排查。

**面试常追问 / 权衡：** scratch/distroless 用"进不去排查"换极小攻击面和近零 CVE——这正是安全上想要的（攻击者也没 shell 可用），代价用临时调试容器补回。alpine 能 shell 进去很方便，但 musl 的 libc/DNS 边缘情况会带来微妙线上 bug，glibc 编译的二进制尤其危险。多阶段构建 + distroless 是生产黄金组合：构建阶段有全套工具，运行阶段只留最小运行时。

**要点：**
- scratch：仅静态二进制、最小最安全、无 shell/libc/CA，最难调试
- distroless：libc + CA + 可选运行时，无 shell/包管理器，生产甜蜜点
- alpine：musl + busybox + apk，能 shell 进去，但注意 musl 的 DNS 怪癖和 glibc 二进制不兼容
- 调试无 shell 镜像用 `kubectl debug` 临时容器共享命名空间，不把工具烤进生产镜像

---

### 39. 镜像标签规范

**频率：** 中

**题目：** 生产用 `myapp:latest` 部署，某天一个节点重启拉了新推的 `latest`，结果同一"版本"在集群里跑着两份不同的代码，还引入了未测过的改动导致故障；回滚时你甚至说不清线上到底是哪个构建。请讲解镜像标签规范：为什么避免 `latest`、怎么用不可变标识打标、为什么生产该用 digest 钉死，以及仓库不可变标签策略的作用。

**这是什么 & 为什么用它：** 镜像标签规范决定了"你部署的到底是哪一份代码"的确定性——本案例正是 `latest` 可变、不可钉死造成的：同名标签在不同时间指向不同镜像，导致集群版本漂移、无法回滚。

**落地这个案例：**

**为什么避免 `latest`：** `latest` 只是个**可变**的别名，随时可被覆盖指向新镜像。本案例节点重启重新拉取 `latest` 就拿到了新构建——同一"版本"跑两份代码、引入未测改动、且事后无法确定线上是哪个构建，全因这个标签不可钉死。

**怎么打标（不可变标识）：** 用不会被复用的标识——**语义版本**（`1.4.2`）、**git SHA**（`sha-abc1234`）或**构建日期**。实践中 **push 多个指向同一 digest 的标签**（`1.4.2`、`1.4`、`1`、`sha-abc1234`），让消费者在稳定与新鲜之间选：想钉死小版本用 `1.4.2`，想自动跟随补丁用 `1.4`。

**生产用 digest 钉死做真正的不可变：** 标签仍可能被重推，唯一绝对不可变的是**内容哈希 digest**——生产部署引用 `image@sha256:...`，它按内容寻址，永远指向那一份确切的字节。manifest 里钉 digest，才能保证集群每个节点、每次拉取都是同一镜像，本案例的版本漂移就不会发生。

**仓库不可变标签策略：** 镜像仓库（ECR、GCR、Harbor）可开启**不可变标签**策略，从服务端**禁止覆盖已存在的标签**——一旦推了 `1.4.2` 就不能再推同名，从根上杜绝"同标签不同内容"。

**怎么排查/定位/修复：**
1. 查线上到底跑的什么：`kubectl get pod -o jsonpath='{..image}'` 或 `kubectl describe pod` 看 `Image` 和 `ImageID`（后者含 digest），若是 `latest` 就无从判断构建，若是 digest 一眼确定。
2. 消除漂移：把部署 manifest 从 `myapp:latest` 改成 `myapp@sha256:...`（或至少 `myapp:1.4.2`），确保所有节点拉同一份。
3. 防复发：在仓库开启不可变标签策略，CI 里禁止推 `latest` 到生产仓库；发布流水线用 git SHA 打标并记录 digest 到发布记录。
4. 回滚：因为每个版本都是不可变 digest，回滚只需把 manifest 指回上一个已知好的 digest。

**面试常追问 / 权衡：** `latest` 在本地开发方便但生产是定时炸弹。digest 最严格但可读性差，故常与 semver 标签并存（人读 `1.4.2`、机器钉 digest）。多标签指同一 digest 让不同消费者各取所需但不重复构建。不可变标签策略会挡住"重推修复同名标签"的偷懒做法，强制走新版本号——这正是想要的纪律。

**要点：**
- 永不用 `:latest` 部署生产——可变、不可钉死，导致版本漂移和无法回滚
- 用不可变标识打标（semver + git SHA），多标签指同一 digest 让消费者选稳定/新鲜
- 生产 manifest 按 digest（`image@sha256:...`）钉死，真正不可变、每节点一致
- 开启仓库不可变标签策略禁止覆盖同名标签，`ImageID` 查线上真实构建

---

### 40. 卷 vs 绑定挂载 vs tmpfs

**频率：** 中

**题目：** 一个用 `hostPath` 挂本机目录存数据的服务，节点故障被重新调度到另一台机器后数据"凭空消失"了；另一个服务把解密后的凭证写进了容器可写层，安全扫描报告说密钥落了盘。请对比 Docker 卷、绑定挂载、tmpfs 及它们的 Kubernetes 对应，说清这两个问题该怎么改。

**这是什么 & 为什么用它：** 三种在容器短暂可写层之外给它存储的方式，差别在*数据住哪*和*谁管理*——选错就会踩本案例这两个坑（主机耦合导致数据丢、密钥落盘）。

**落地这个案例：**

- **卷**——**Docker 管理**的存储（在 `/var/lib/docker/volumes/`），带**驱动支持**（本地、NFS、云块存储）。Docker 拥有生命周期；你按名引用而非主机路径。**可移植且是推荐默认**——容器不依赖主机目录布局，且驱动让同一卷背靠网络/云存储。
- **绑定挂载**——把**具体主机路径直接**挂入容器（`-v /host/path:/container/path`）。**灵活**（很适合**本地开发**——挂你的源代码使编辑在容器内实时可见）但**把容器与主机文件系统布局耦合**——路径必须在每台主机存在，权限/SELinux 能咬你，且跨机器不可移植。本案例用 `hostPath`（绑定挂载的 k8s 对应）存数据，pod 一被调度到别的节点，那台机器没有那份数据，所以"消失"了。
- **tmpfs**——**仅内存**存储，**从不碰磁盘**且容器停时消失。**理想用于密钥**（不想持久化的解密凭证）和**热临时数据**（临时文件、缓存），想要速度且不留磁盘痕迹。消耗 RAM。本案例密钥落盘，正该改用 tmpfs 让它只在内存、不留磁盘痕迹。

**Kubernetes 对应：**
- 卷 → **PersistentVolume/PVC**（托管、可移植、驱动支撑——最接近的对应）。
- 绑定挂载 → **`hostPath`**（挂节点路径；同样的主机耦合顾虑，生产中因同样的可移植/安全理由一般不推荐）。
- tmpfs → **`emptyDir` 带 `medium: Memory`**（RAM 支撑的短暂临时空间，在 pod 内共享）。

**怎么排查/定位/修复：**
1. 数据消失定位：`kubectl describe pod` 看 Volumes 段用的是不是 `hostPath`，再看 pod 被调度到了哪个节点——换节点后旧节点的 hostPath 数据不会跟着走。
2. 修复持久化：把 `hostPath` 换成 **PVC** 背靠网络/云块存储（EBS、Ceph、NFS），这样无论调度到哪个节点都能挂到同一份数据。
3. 密钥落盘定位：确认凭证写到了容器可写层或绑定挂载（都会落盘），改成挂 `emptyDir` 带 `medium: Memory`（tmpfs），凭证只在 RAM、pod 停即消失。
4. 验证：`kubectl exec` 进去 `mount | grep <path>` 确认该路径是 tmpfs 而非磁盘。

**面试常追问 / 权衡：** hostPath 有主机耦合和安全风险（能访问节点文件系统），生产避免用它做数据持久化，只在确需访问节点特定路径（如日志采集）时用。tmpfs/emptyDir Memory 消耗 RAM 且不持久，只适合临时数据和密钥，别拿它存要留的数据。命名卷/PVC 是持久化的推荐默认——可移植、不绑主机布局、驱动可背靠云存储。

**要点：**
- 卷/PVC：托管、可移植、跨节点，持久化推荐默认
- 绑定挂载/hostPath：绑主机路径，换节点数据丢，生产慎用
- tmpfs/emptyDir Memory：仅 RAM、pod 停即消失，适合密钥和热临时数据、不落盘
- 数据消失查是否 hostPath 改用 PVC；密钥落盘改用 tmpfs 并 `mount` 验证

---

### 41. Docker 网络驱动

**频率：** 中

**题目：** 一个容器化服务对延迟极敏感，压测发现默认 bridge 网络的 NAT 带来可观开销、还看不到客户端真实 IP；团队想换 `host` 网络提速却撞上端口冲突。迁到 Kubernetes 后又有人问为什么 pod 之间能直接用 IP 互通、不再需要 NAT。请走一遍 Docker 网络驱动，以及 Kubernetes 如何用 CNI 替代它们。

**这是什么 & 为什么用它：** Docker 内置多种网络驱动覆盖不同需求，选驱动本质是在隔离、性能、可移植之间权衡——本案例的 NAT 开销、真实 IP、端口冲突都由驱动选择决定。

**落地这个案例：**

- **`bridge`**（默认）——用 Linux bridge **每主机创建一个私有虚拟网络**；容器得内部 IP，经 **NAT**（通过主机 IP 做源 NAT）到达外部。端口发布（`-p 8080:80`）设置 DNAT。隔离好，但 NAT 隐藏容器 IP 并加小开销——本案例的延迟开销和"看不到客户端真实 IP"正源于此。
- **`host`**——容器**直接共享主机网络命名空间**：无隔离、无 NAT，容器像主机进程一样绑主机端口。**获得全网络性能**并避免 NAT 怪癖，也能看到真实 IP；但**放弃隔离**和端口冲突安全——本案例换 host 提速后撞端口冲突，正因为容器和主机共用一个端口空间。
- **`overlay`**——通过把流量封进 **VXLAN** 跨**多主机**，使不同机器上的容器共享一个虚拟网络（Docker Swarm 多主机服务用）。
- **`macvlan`**——给每个容器**直接在物理 LAN 上的自己的 MAC 和 IP**，作为网络上真实设备出现（对期望真实 L2 存在的遗留系统有用）。
- **`none`**——完全禁网络（只有环回）——用于完全隔离的工作负载。

**Kubernetes 用 CNI（容器网络接口）插件替代所有这些。** 不是每主机 bridge + NAT，Kubernetes 强制**扁平网络模型**：**每个 pod 得自己的网络命名空间和一个集群范围可路由的唯一 IP**，pod 间**无 NAT** 通信（pod 到 pod 用真实 IP）——这就是本案例"pod 间能直接用 IP 互通"的原因。一个 **CNI 插件**（Calico、Cilium、Flannel、AWS VPC CNI）实现它——接线每个 pod 的 netns、分配 IP、设路由/overlay（或原生 VPC 路由），使任一 pod 能直接到达任一 pod。这个扁平、无 NAT 的模型正是让 Service、网络策略和服务发现统一工作的基础。

**怎么排查/定位/修复：**
1. 定位 NAT 开销/丢真实 IP：`docker inspect <container>` 看用的驱动；bridge 下后端看到的源 IP 是主机而非客户端。想保真实 IP 又要隔离，可在 L7 代理加 `X-Forwarded-For`，或对延迟敏感场景评估 host 网络。
2. host 网络端口冲突：`ss -ltnp` / `netstat -ltnp` 查主机已占端口，host 模式下容器不能再绑同一端口——要么改容器监听端口，要么回退到 bridge 用端口映射隔离。
3. k8s pod 互通异常：`kubectl get pod -o wide` 看 pod IP，`kubectl exec` 里 ping 另一 pod IP 验证扁平网络；不通则查 CNI 插件是否健康（`kubectl get pods -n kube-system` 看 Calico/Cilium）和 NetworkPolicy 是否挡了。
4. 跨节点不通：确认 CNI 的路由/overlay（VXLAN）或云 VPC 路由正确，节点间对应 UDP 端口（VXLAN 8472）放行。

**面试常追问 / 权衡：** bridge 隔离好但 NAT 有开销、藏真实 IP；host 最快、见真实 IP 但无隔离且端口冲突——延迟敏感服务的经典取舍。overlay 让多主机互通但 VXLAN 封装有开销。k8s 的扁平无 NAT 模型简化了服务发现和网络策略，但要求 CNI 分配集群唯一 IP——大集群下 IP 规划和 CNI 选型（overlay vs 原生 VPC 路由）很关键，Cilium 用 eBPF 还能进一步降开销。

**要点：**
- bridge = 默认，NAT 有开销、藏客户端真实 IP
- host = 无隔离、最快、见真实 IP，但端口冲突（`ss -ltnp` 查占用）
- overlay = 多主机 VXLAN；macvlan = 容器直接上物理 LAN
- k8s 用 CNI 扁平网络：每 pod 唯一 IP、pod 间无 NAT，不通先查 CNI 插件和 NetworkPolicy

---

### 42. docker compose

**频率：** 中

**题目：** 团队用 docker compose 起本地栈，应用容器一启动就报连不上数据库、崩溃退出，得手动 `restart` 几次才好；后来这套 compose 部署上了单台生产机，最近那台机器宕机导致整个服务下线好几个小时。请解释 Docker Compose 定义什么、启动顺序怎么治，以及何时该升级到 Kubernetes。

**这是什么 & 为什么用它：** **Compose** 在**单个 `docker-compose.yml`** 中定义**多容器应用**并在**一台主机**上运行它——一条命令拉起应用加其依赖（应用 + Postgres + Redis）。本案例"连不上 DB"和"单机宕机整站挂"正对应它的两个关键点：启动顺序和单主机局限。

**落地这个案例：**

**YAML 定义什么：**
- **`services`**——每个容器（镜像、端口、命令、环境）。
- **`networks`**——Compose 自动建网，使服务**按服务名**作为主机名互达（`db:5432`）。
- **`volumes`**——用于持久化的命名卷。
- **`env`**——环境变量（常来自 `.env` 文件）。
- **`depends_on`**——启动顺序——本案例"应用先于 DB 起来所以连不上崩溃"就靠它治：配 **`condition: service_healthy`** 可在依赖的**健康检查**通过前不启动某服务（使应用不在 DB 就绪前启动），不用再靠手动重启碰运气。
- **`healthcheck`**——每服务就绪检查（`condition: service_healthy` 依赖它判断依赖是否真就绪）。

**命令：** `docker compose up -d` 起整个栈（分离）；`docker compose down -v` 拆它并删卷。

**Profiles：** `profiles:` 给可选服务打标，使 `docker compose --profile debug up` 仅在请求时包含附加项（调试 UI、seed 任务）——保持默认栈精简。

**何时适合 vs 升级：** Compose 极适合**本地开发**和**小型单主机部署**——简单、快、无集群要跑。但它**无多主机编排、无自愈/重调度、无跨节点滚动更新或自动扩缩**——本案例把它用于生产、单机一宕就整站下线，正是踩了这个局限。当你需要**生产多主机**——跨机 HA、节点故障自动重调度、水平扩展、滚动部署——**升级到 Kubernetes**（或 Nomad）。经验法则：dev 和单机玩具生产用 Compose；正常运行时间和规模要紧时用 Kubernetes。

**怎么排查/定位/修复：**
1. 应用连不上 DB：`docker compose logs app` 看是不是在 DB 就绪前就发起连接崩了；给 db 服务加 `healthcheck`（如 `pg_isready`），给 app 加 `depends_on: db: condition: service_healthy`，让它等 DB 健康再起。
2. 光有 `depends_on` 不够：不带 condition 的 `depends_on` 只保证**启动顺序**不保证**就绪**——所以应用本身也应带重试/退避连接逻辑作为兜底。
3. 单机宕机整站挂：这不是配置能修的，是架构局限——生产该迁到 Kubernetes 实现节点故障自动重调度和多副本 HA，或至少多机 + 负载均衡。
4. 迁移路径：用 `kompose` 把 compose 转成 k8s manifest 起步，再补 Deployment 副本数、PVC、Service、探针等生产要素。

**面试常追问 / 权衡：** `depends_on` 只管顺序，`condition: service_healthy` 才管就绪，但两者都不能替代应用层的连接重试。Compose 简单快、零集群开销，是本地开发和小部署的甜蜜点，但没有自愈、重调度、滚动更新、扩缩——单主机就是单点。真要生产 HA 和规模就上 Kubernetes（或 Nomad），代价是运维复杂度陡增，别为一个玩具服务过度工程。

**要点：**
- 一个 YAML、多个服务，服务名即主机名互达
- 启动顺序用 `depends_on: condition: service_healthy` + `healthcheck`，应用层还要有连接重试兜底
- Profiles 做可选栈；`up -d` 起、`down -v` 拆
- Compose 单主机无自愈/重调度/HA，单机宕即整站挂；生产多主机 HA 升级到 Kubernetes

---

### 43. 镜像漏洞扫描

**频率：** 中

**题目：** 一个已经稳定跑了两个月、构建时扫描完全干净的生产镜像，安全团队突然报警说里面有一个 critical 级 CVE（如某个 openssl 高危漏洞）。开发反驳"这镜像我们根本没动过、字节都没变，怎么会突然有漏洞"。请解释你如何做镜像漏洞扫描，以及为什么必须按计划重复扫 registry 而不只在 push 时扫。

**这是什么 & 为什么用它：** 镜像漏洞扫描把镜像里的软件物料清单对照公开漏洞库找已知 CVE，解决的痛点正是本案例这种"镜像没变但威胁变了"——把安全问题在部署前和部署后持续暴露出来，而不是等季度审计才发现。

**落地这个案例：**

**工具扫什么：** **Trivy、Grype、Snyk** 分析**镜像层**中的**已知 CVE**，涵盖 **OS 包**（基础镜像里的 `apt`/`apk` 包）**和语言依赖**（应用里的 npm、pip、Go 模块）。它们把软件物料清单对照漏洞库（NVD、GitHub 公告）并报告每项发现的严重度，关键是**是否有修复版本存在**。例如 `trivy image myapp:1.2.3 --severity HIGH,CRITICAL`。

**作为必备 CI 检查集成：** 每次构建跑扫描，并对**有修复可用**的 high/critical CVE **失败构建**（如 `trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL`）——"有修复版本"这个限定很重要（`--ignore-unfixed`），因为对无法修复的 CVE 失败只会堵住你却无解（更好是接受/记录它们）。这把安全左移——漏洞在部署前被捕获，而非在季度审计里。

**扫的不止 CVE：** 也跑**误配检查**（Dockerfile lint——以 root 运行、用 `latest`、从 URL `ADD`）和**密钥检测**（意外烤进层的 API key 或私钥——很常见的泄露）。生成 **SBOM**（软件物料清单，如 `trivy image --format spdx-json`）使你有一份出货一切的清单，新 CVE 出现时能快速回答"我们受影响吗？"

**为什么排期重复扫 registry（不只在 push 时）：** 镜像是**冻结快照**，但**新 CVE 每天被披露**，针对该镜像已含的软件。构建时扫描干净的镜像可能**数周后在其中发现严重漏洞**——本案例正是如此：字节没变，*已知*威胁变了。故**持续重扫 registry 中的镜像**以捕获已部署镜像里新披露的 CVE，并告警使你能重建/打补丁。只在 push 时扫给长寿镜像一种虚假的安全感。

**怎么排查/定位/修复：**
1. 定位新 CVE 属于哪层：`trivy image myapp:1.2.3` 看报告里 CVE 归属的包和层，判断是基础镜像的 OS 包还是应用依赖。
2. 找修复版本：报告的 `Fixed Version` 列若有值，说明可修复——OS 包升基础镜像 tag、语言依赖升 lock 文件版本。
3. 重建并复扫：重新构建镜像后再跑扫描确认该 CVE 消失，推回 registry。
4. 无修复版本（`--ignore-unfixed` 会跳过的）：评估是否实际可利用，记录接受或加缓解（如网络策略限制暴露面），别盲目卡构建。
5. 建立机制：给 registry 配定时重扫（Harbor 内置、或 CI cron 跑 Trivy），新 CVE 一披露就告警到值班。

**面试常追问 / 权衡：** 扫 OS 包和语言依赖都要覆盖，只扫其一会漏。CI 里对可修复的 high/critical 失败、对不可修复的用 `--ignore-unfixed` 放行是关键平衡——否则要么堵死流水线要么形同虚设。只在 push 时扫会给长寿镜像虚假安全感，持续扫 registry 才能捕获后披露的 CVE。SBOM 让你在下一个 log4j 级事件时秒级回答受影响范围。

**要点：**
- Trivy/Grype 扫 OS + 语言依赖，`--severity HIGH,CRITICAL`
- 可修复的 high/critical 失败 CI，`--ignore-unfixed` 放行无解的
- 持续扫 registry（Harbor 定时/CI cron），不仅在 push 时——镜像没变但威胁会变
- 配合 SBOM 生成，事件时快速回答"我们受影响吗"

---

### 44. 非 root、丢能力、只读 rootfs

**频率：** 中

**题目：** 一次安全评估发现你们某个 web 服务的容器以 root 运行、还挂着可写根文件系统。红队演示了：利用应用的一个 RCE 漏洞后，攻击者在容器里下载并写入了一个挖矿二进制、改了配置、还试图容器逃逸到节点。事后要求你按纵深防御把容器加固到非 root、低权限运行。请说明你会加哪几层、每层挡住红队的哪一步。

**这是什么 & 为什么用它：** 容器加固是纵深防御——假定应用*会*被攻陷，通过非 root、丢能力、只读文件系统等若干层**最小化攻击者所得**，正好逐一封死本案例红队走的每一步（写二进制、改配置、逃逸）。

**落地这个案例：** 若干层，在 Dockerfile 和 Kubernetes `securityContext` 中施加：

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
使容器文件系统**不可变**，故攻击者**无法写恶意二进制、改配置或投放 web shell**——正好挡死本案例红队写挖矿二进制和改配置那两步。对需要写的应用（如 `/tmp`、缓存目录），**把那些特定路径挂为可写 `emptyDir` 卷**——其余保持只读。

**为什么这减小爆炸半径：** 每层移除攻击者会用的一件工具——非 root 移除特权动作（挡逃逸，逃逸利用往往需容器内 root）、丢能力移除内核权力、只读 rootfs 移除持久化和写载荷。本案例本会是完整容器接管的攻陷变成一个被遏制、低权限、无处可去的立足点。用 Pod Security Standards / 准入策略在全集群强制这些，使无工作负载跳过。

**怎么排查/定位/修复：**
1. 排查现状：`kubectl get pod <pod> -o jsonpath='{.spec.containers[*].securityContext}'` 看有没有设 `runAsNonRoot`、`readOnlyRootFilesystem`；`kubectl exec <pod> -- id` 若返回 `uid=0(root)` 就是以 root 跑。
2. 加固后应用启动失败（`CrashLoopBackOff`）：多半是应用要写根文件系统或要绑低端口。`kubectl logs` 看 `permission denied` / `read-only file system`，把它要写的路径挂 `emptyDir`，要绑 <1024 端口的加回 `NET_BIND_SERVICE` 或改监听高端口。
3. 镜像本身以 root 构建导致 `runAsNonRoot: true` 拒绝启动：改 Dockerfile 加 `USER 10001` 并确保文件属主/权限允许该 UID 读。
4. 全集群强制：上 Pod Security Standards（`restricted` profile）或 OPA/Kyverno 准入策略，扫出并拒绝以 root、特权、可写 rootfs 的工作负载。

**面试常追问 / 权衡：** 非 root 移除特权动作、丢 `ALL` 能力再按需加回缩小特权面、只读 rootfs 挡持久化和写载荷、`allowPrivilegeEscalation: false` 堵 setuid 提权——每层各挡一类攻击，叠加才是纵深防御。权衡在于加固可能撞上应用假设（要写盘、要绑低端口），得逐一用 `emptyDir` 卷和最小能力回补，不能图省事全开。集群级用 PSS/准入策略强制，避免个别工作负载偷偷跳过。

**要点：**
- 以非 root UID 运行（`runAsNonRoot`+`runAsUser`），挡逃逸
- 丢 ALL 能力，只加需要的（如 `NET_BIND_SERVICE`）
- `readOnlyRootFilesystem: true` 挡写二进制/改配置，需写的挂 `emptyDir`
- `allowPrivilegeEscalation: false`；集群级用 PSS/Kyverno 强制

---

### 45. PID 1 问题与 tini

**频率：** 中

**题目：** 你们的 Node 服务每次滚动发布，pod 都要卡在 `Terminating` 状态整整 30 秒（宽限期）才被强杀，期间在途请求被丢、报 502；同时监控还发现容器里 defunct 僵尸进程越积越多。有人怀疑是应用没处理 SIGTERM。请解释容器里的 PID 1 问题以及 tini / `--init` 如何解决它。

**这是什么 & 为什么用它：** PID 1 问题是指容器里应用直接当了 init 进程却没履行 init 的两项职责，导致本案例的两个症状——僵尸堆积和优雅关停失败。用一个极简 init 当 PID 1 就能修好。

**落地这个案例：** 在 Linux 中，**PID 1 很特殊**——它是 **init 进程**，有普通进程没有的两项职责：(1) **回收僵尸**——当*任何*进程的父死亡，其孤儿子进程被重新挂到 PID 1 名下，PID 1 必须在它们退出时 `wait()` 它们，否则它们变**僵尸**（泄露进程表的 defunct 条目）——本案例僵尸堆积就是这来的；(2) **默认信号处理**——PID 1 *不*获得内核的默认信号动作，故它必须**显式处理 SIGTERM**，否则信号就被直接忽略。

**为什么这在容器里出问题：** 在容器里，**你的应用*就是* PID 1**。许多应用运行时（Node、Python、JVM）**从未为做 init 而写**——它们不回收被重挂的孙进程（僵尸堆积），更糟的是它们**默认不处理 SIGTERM**，所以 `docker stop` / Kubernetes 优雅终止的 SIGTERM 被**忽略**，容器挂满整个宽限期（本案例的 30 秒 `terminationGracePeriodSeconds`），然后被 **SIGKILL**——没有干净关停（在途请求被丢、连接未排水，正是那些 502）。**Shell 形式 ENTRYPOINT** 更糟：它在 `/bin/sh -c` 下跑你的应用，所以 **shell 是 PID 1** 且通常**根本不转发信号**给你的应用。

**修法——一个小 init 作 PID 1：** 用 **`tini`** 或 **`dumb-init`**，它们是正确回收僵尸并向你应用转发信号的极简 init 程序：
```dockerfile
ENTRYPOINT ["tini", "--", "node", "server.js"]
```
现在 `tini` 是 PID 1，回收僵尸，并把 SIGTERM 转发给你的 Node 进程以干净关停。**Docker 的 `--init` 标志**（`docker run --init`）**自动注入 tini** 作 PID 1 而不改你的镜像——方便。Kubernetes 里没有 `--init` 标志；要么把 `tini` 烤进镜像，要么确保你的应用*确实*处理信号并回收子进程。

**怎么排查/定位/修复：**
1. 确认是不是 PID 1 问题：`kubectl exec <pod> -- ps -ef` 看 PID 1 是你的应用还是 `/bin/sh`；若是 shell 形式 ENTRYPOINT，shell 当了 PID 1 不转发信号。
2. 查僵尸：`ps -ef` 里状态为 `Z` 或名字带 `<defunct>` 的就是没被回收的僵尸。
3. 验证信号：`kubectl exec` 进去 `kill -TERM 1` 看应用是否响应关停；若无反应说明应用没处理 SIGTERM。
4. 修：Dockerfile 改用 exec 形式 `ENTRYPOINT ["tini","--","node","server.js"]`（或应用内注册 SIGTERM handler 优雅关服）；本地/Compose 可 `docker run --init` 临时注入 tini。
5. 修后再滚动发布，pod 应在收到 SIGTERM 后立即优雅退出、不再卡满宽限期，502 消失、僵尸不再堆积。

**面试常追问 / 权衡：** PID 1 必须回收僵尸 + 处理信号，普通应用运行时两样都不做。Shell 形式 ENTRYPOINT 让 shell 当 PID 1、破坏信号转发，务必用 exec 形式（JSON 数组）。用 `tini`/`dumb-init` 或 `docker run --init` 是通用兜底；但若应用本身已正确处理 SIGTERM 并回收子进程，也可以不加 init。没它优雅关停失败、僵尸泄露——正是卡在 `terminating` 的 pod 的典型症状。

**要点：**
- PID 1 必须回收僵尸（`ps -ef` 看 `<defunct>`）+ 处理信号
- Shell 形式 ENTRYPOINT 让 shell 当 PID 1、破坏信号转发，改用 exec 形式
- 用 `tini`/`dumb-init` 或 `docker run --init`
- 没它优雅关停失败、pod 卡 `Terminating` 整段宽限期、丢在途请求

---

### 46. 健康检查：Dockerfile vs 编排器

**频率：** 中

**题目：** 一个 JVM 服务冷启动要 40 秒建连接池、预热缓存。团队在 Dockerfile 里写了 `HEALTHCHECK`，但部署到 Kubernetes 后它完全没生效，pod 一起来就被路由流量导致早期请求 500；后来加了 `livenessProbe` 又因为启动慢触发了重启循环，pod 反复被杀。请对比 Dockerfile HEALTHCHECK 与编排器健康探针，说清为何 k8s 忽略前者、以及怎么配探针治好这个案例。

**这是什么 & 为什么用它：** 健康检查告诉平台"这容器现在能不能干活"，但 Docker 的单一 healthy/unhealthy 位表达力不够，Kubernetes 用三种语义不同的探针替代它——正好对应本案例要区分的"还在启动"和"已就绪可收流量"。

**落地这个案例：** **Dockerfile `HEALTHCHECK`** 把健康检查烤*进镜像*：`HEALTHCHECK CMD curl -f http://localhost/health || exit 1`。Docker 周期性跑它并（在 `--retries` 后）标记容器 **`healthy`/`unhealthy`**。它在 `docker ps` 可见并驱动 Docker/Swarm 行为。**Docker Compose** 能利用它：`depends_on: {db: {condition: service_healthy}}` 在启动依赖服务前**等依赖的健康检查通过**——解决"应用在 DB 就绪前启动"。

**Kubernetes 完全*忽略* Dockerfile HEALTHCHECK**（这就是本案例它没生效的原因）而用自己的 **pod-spec 探针**：**`livenessProbe`**（失败则重启）、**`readinessProbe`**（失败则从 Service 端点移除，治本案例"一起来就被路由流量"）、**`startupProbe`**（保护慢启动，治"启动慢触发重启循环"）。为何刻意分开？Kubernetes 需要比单个 healthy/unhealthy 位**更丰富、编排级的语义**：它区分"重启我"（liveness）、"停止向我路由流量"（readiness）、"我还在启动"（startup）——Docker 健康检查无法表达的概念。它还想把健康配置放在**声明式 pod spec**（可版本化、按环境调）而非冻进镜像。故镜像级健康检查干脆不被查阅。

**三者可用的探针机制：** **exec**（跑命令）、**HTTP** GET、**TCP** 套接字连接、**gRPC** 健康检查——按应用类型选。本案例 40 秒冷启动可配 `startupProbe` 给 `failureThreshold * periodSeconds` ≈ 60 秒窗口，期间不跑 liveness；`readinessProbe` 未通过前不进 Service 端点。

**怎么排查/定位/修复：**
1. HEALTHCHECK 在 k8s 没生效：确认 k8s 只认 pod-spec 探针，`kubectl describe pod` 里看不到基于 Dockerfile HEALTHCHECK 的事件——把逻辑改写成 `readiness/liveness/startupProbe`。
2. 一起来就收流量报 500：说明缺 `readinessProbe` 或它太快通过。加指向 `/health`（真正查连接池/缓存就绪）的 readiness，未就绪前 k8s 不把 pod 加进 Service 端点。
3. 慢启动触发重启循环：`kubectl describe pod` 看到 `Liveness probe failed` + 反复 `Killing`。加 `startupProbe` 给足启动窗口（startup 通过前 liveness 不运行），或调大 liveness 的 `initialDelaySeconds`。
4. 验证：`kubectl get pod` 看 `READY 0/1 → 1/1` 的时机，`kubectl get endpoints <svc>` 确认 pod 只在就绪后才进端点。

**面试常追问 / 权衡：** Dockerfile HEALTHCHECK 被 k8s 忽略、只对 Docker/Compose 有效（Compose 靠它做 `depends_on: condition: service_healthy` 治启动顺序）。k8s 三探针各司其职：liveness 重启、readiness 摘流量、startup 保慢启动，别用 liveness 兼职就绪判断（会误重启）。探针可为 exec/HTTP/TCP/gRPC，按应用选。跨 Compose 和 k8s 跑同一镜像时把两边指向**同一个 `/health` 端点和标准**，避免环境特定的困惑行为。调 `initialDelaySeconds`/`startupProbe` 避免慢启动触发重启循环。

**要点：**
- Dockerfile HEALTHCHECK 被 k8s 忽略（只对 Docker/Compose 有效）
- k8s：liveness 重启 / readiness 摘流量 / startup 保慢启动，三者别混用
- 探针可为 exec/HTTP/TCP/gRPC
- 慢启动用 `startupProbe` 或调 `initialDelaySeconds` 避免重启循环

---

### 47. docker exec vs run vs attach

**频率：** 中

**题目：** 生产上一个容器行为异常，一名新同事想进去看看，他先 `docker attach` 上去、随手按了 Ctrl-C，结果**把线上容器杀了**引发一次短暂故障。事后你要给团队讲清 `docker run`、`docker exec`、`docker attach` 的区别，以及调试线上容器到底该用哪个。

**这是什么 & 为什么用它：** 这三个命令都能给你一个终端所以常被混淆，但一个起新容器、一个在容器里开新进程、一个接管主进程的 stdio——本案例的事故正是把"接管主进程"当成了"安全进去看看"。

**落地这个案例：**
- **`docker run`**——从*镜像***创建并启动一个*新*容器**。`docker run -it ubuntu bash` 造一个全新容器。它是唯一涉及镜像的；另两个对**已在运行的容器**操作。
- **`docker exec`**——**在已运行的容器内启动一个*额外*进程**。`docker exec -it <container> sh` 给你一个**与已运行应用并行**的交互 shell——应用不受扰地继续跑；你只是在它的命名空间里生成了第二个进程。这是**调试主力**：shell 进去、看文件、跑诊断，然后退出——容器不受影响。新同事该用的正是这个。
- **`docker attach`**——**把你的终端连到容器现有 PID 1 的 stdio**（主进程的 stdin/stdout/stderr）。你不启动任何新东西——你接入*主*进程的流。坑：**Ctrl-C 向 PID 1 发 SIGINT**，常常**杀掉容器**（因为 PID 1 *就是*应用）——这就是本案例事故的根因。用 `Ctrl-P Ctrl-Q` 序列安全脱离，而非 Ctrl-C。

**调试优选 `docker exec -it <container> sh`**——安全（不影响运行的应用）且给你完整 shell。**把 `attach` 留给**你确实需要看或交互 **PID 1 自己输出/输入**的少见情况（如作为主容器进程跑的 REPL 或交互进程）。Kubernetes 中对应是 `kubectl exec -it <pod> -- sh`，对无 shell 的 distroless 容器用 `kubectl debug` 起临时调试容器。

**怎么排查/定位/修复：**
1. 要进容器看现场：用 `docker exec -it <container> sh`（或 `kubectl exec`），绝不用 `attach`——exec 开的是并行进程，退出不影响主进程。
2. 已经 attach 上了想安全退出：按 `Ctrl-P Ctrl-Q` 脱离，**别按 Ctrl-C**（会给 PID 1 发 SIGINT 杀容器）。
3. distroless/无 shell 镜像 `exec sh` 报 `no such file`：改用 `kubectl debug -it <pod> --image=busybox --target=<container>` 挂个带工具的临时容器共享命名空间调试。
4. 需要新起一个干净环境复现：`docker run -it <image> sh` 起独立容器，不碰线上那个。

**面试常追问 / 权衡：** `run` 从镜像起新容器、`exec` 在运行容器内开额外进程、`attach` 连 PID 1 的 stdio——三者操作对象不同。调试线上一律 `exec -it sh`，因为它隔离、不干扰主进程；`attach` 只在你真要交互 PID 1（如 REPL 主进程）时用，且要记得用 `Ctrl-P Ctrl-Q` 而非 Ctrl-C 脱离。distroless 容器没 shell，得靠 `kubectl debug` 临时容器。

**要点：**
- `run`：从镜像起新容器；`exec`：运行容器内的额外进程；`attach`：连 PID 1 stdio
- 调试用 `docker exec -it sh` / `kubectl exec`，隔离不干扰主进程
- `attach` 后按 Ctrl-C 会杀容器，用 `Ctrl-P Ctrl-Q` 脱离
- distroless 无 shell 用 `kubectl debug` 临时容器

---

### 48. Registry 选择

**频率：** 中

**题目：** 你们 CI 高峰期突然大面积构建失败，日志里全是 `toomanyrequests: You have reached your pull rate limit`——原来几十个并发流水线都在匿名从 Docker Hub 拉基础镜像撞了速率上限。与此同时另一个团队要把服务部署进一个**没有互联网**的银行内网集群，问你镜像怎么进去。请讨论容器 registry 选择，以及你如何处理气隙环境和 Docker Hub 速率上限。

**这是什么 & 为什么用它：** 容器 registry 是镜像的存储与分发中心，选型本质是在 CI 集成、就近拉取、扫描/签名、成本之间权衡——本案例的速率上限和气隙两个痛点，都要靠"把镜像挪到自己可控的 registry"来解。

**落地这个案例：** 格局涵盖托管、云原生和自托管：
- **Docker Hub**——默认公共 registry，但**免费层有 pull 速率上限**（匿名/免费账号 pull 被限速），反复拉基础镜像的 CI 会中招——正是本案例 `toomanyrequests` 的来源。
- **GitHub Container Registry（`ghcr.io`）** 和 **GitLab Registry**——与各自的 **CI**（Actions / GitLab CI）紧密集成，流水线内认证自动。
- **云原生**——**AWS ECR、Google Artifact Registry、Azure ACR**——与云的 IAM 集成（pod 用实例/工作负载身份 pull，无静态凭证），支持地理复制，且紧邻工作负载（拉取快、无出站）。
- **自托管**——**Harbor**（开源，内置**漏洞扫描、复制、RBAC、签名**）或 **JFrog Artifactory**（多制品类型）——用于完全控制、本地部署或企业策略。

**考量标准：** **CI 认证集成**（流水线能否干净认证？）、**地理复制**（多区域集群的 pull 时延）、**内置漏洞扫描**、**签名/策略**支持、**成本**（存储 + 出站）。

**气隙环境：** 无互联网的集群无法从公共 registry 拉，故你**把上游镜像镜像到内部 registry**（Harbor/Artifactory）——通过受控边界拉取一次所需镜像，内部存储，并把所有工作负载指向内部镜像。配合只允许内部 registry 的准入策略。本案例的银行内网集群正是这么做。

**Docker Hub 速率上限：** 避免在 CI 从 Docker Hub 拉，把基础镜像**镜像/缓存**到自己的 registry（或用直通缓存如 Harbor 的代理缓存或云 registry 的远程仓库），并认证（认证 pull 限额更高）——使 CI 构建的突发不碰匿名上限而以 `toomanyrequests` 开始失败。

**怎么排查/定位/修复：**
1. 确认速率上限：CI 日志出现 `toomanyrequests: You have reached your pull rate limit` 就是撞了 Docker Hub 匿名上限（拉时也可看返回头 `ratelimit-remaining`）。
2. 立即缓解：给 CI 配 Docker Hub 认证（`docker login`），认证账号限额更高，先止血。
3. 根治：在 Harbor 建一个指向 `docker.io` 的**代理缓存项目**（或云 registry 的远程仓库），把 Dockerfile 的 `FROM` 和 CI 全改为拉内部 registry，基础镜像只从上游拉一次后命中缓存。
4. 气隙集群：在有网的中转机 `docker pull` 所需镜像 → `docker save` / `skopeo copy` 搬过隔离边界 → push 进内网 Harbor；工作负载镜像地址全指向内网 registry，并用准入策略（Kyverno/OPA）拒绝任何非内部 registry 的镜像。
5. 验证气隙不外联：确认节点无出站、`ImagePullBackOff` 时 `kubectl describe pod` 看拉取地址是否误指了公共 registry。

**面试常追问 / 权衡：** 托管（Docker Hub/ghcr/GitLab）胜在 CI 集成简单，云原生（ECR/Artifact Registry/ACR）胜在 IAM 免静态凭证 + 就近拉取，自托管（Harbor/Artifactory）胜在完全控制 + 内置扫描/签名/复制，代价是自己运维。选型看 CI 认证、地理复制时延、扫描/签名、成本。气隙必须把上游镜像镜像进内部并用准入策略封死外部来源。Docker Hub 上限靠认证 + 代理缓存治，别让 CI 匿名裸拉。

**要点：**
- 云原生：ECR/Artifact Registry/ACR（IAM 免静态凭证）；自托管：Harbor、Artifactory（内置扫描/签名）
- 气隙：镜像上游到内部 registry + 准入策略封外部来源
- Docker Hub `toomanyrequests`：认证 + 代理缓存/远程仓库，别匿名裸拉
- 选型看 CI 集成、地理复制、扫描签名、成本

---

### 49. Ingress vs Gateway API

**频率：** 中

**题目：** 你们从 NGINX Ingress 迁到 Traefik，结果一堆服务的路由行为全变了——限流、重写、超时都失效，因为它们全写在 `nginx.ingress.kubernetes.io/...` 注解里，Traefik 不认。同时应用团队每次改个路由都要提工单让平台团队改集群级 Ingress，还想做 5% 的加权灰度却发现只能靠注解 hack。请对比 Ingress 与 Gateway API，说清新部署该瞄准哪个、以及它怎么解决这些问题。

**这是什么 & 为什么用它：** 两者都把集群内 Service 暴露给外部 HTTP(S) 流量，但 Ingress 规范太薄导致高级功能全塞进供应商注解——本案例的迁移地狱和灰度 hack 正因如此；Gateway API 是把这些做进标准、且按团队角色拆分的现代替代品。

**落地这个案例：** **Ingress** 是**遗留 L7 API**。它定义 host/path → Service 路由，但规范**极少**，故每个控制器（NGINX、Traefik、ALB）都通过**供应商特定注解**（`nginx.ingress.kubernetes.io/...`）实现高级特性。这造成两大问题：**可移植性差**（为 NGINX 调的 Ingress 在 Traefik 上行为不同——注解非标准，正是本案例换控制器就崩的原因）和**没有干净模型**处理基本 HTTP 之外的东西（TCP/UDP、TLS 直通、流量切分、按头路由都需黑客手段或 CRD）。

**Gateway API** 是**官方继任者**——设计上供应商中立且表达力强。两个关键改进：
- **角色导向拆分**为由不同团队拥有的独立资源：**`GatewayClass`**（控制器/基础设施类型，由**基础设施/平台**团队拥有）、**`Gateway`**（实际监听器——端口、TLS——由**集群运维**拥有）、**`HTTPRoute`**（路由规则，由**应用团队**拥有）。这让应用开发者管自己的路由而不碰集群级 LB 配置，带恰当 RBAC 边界——正好去掉本案例"改路由要提工单"的瓶颈，Ingress 无法干净做到。
- **一等支持** **TCP/UDP/TLS 路由**、**加权流量切分**（原生 canary——带后端权重的 `HTTPRoute`，无注解，本案例 5% 灰度直接用 `weight` 声明）和**按头路由**——全在标准规范里，故行为**跨控制器可移植**（换 Traefik 不再重写）。

**新部署应瞄准 Gateway API**（在你控制器支持处——Envoy Gateway、Istio、Contour、NGINX 都有 Gateway API 实现）。它是面向未来、可移植、角色适当的选择；Ingress 留给现有设置和简单情况。

**怎么排查/定位/修复：**
1. 迁控制器后路由/功能失效：`kubectl get ingress <name> -o yaml` 看 `annotations`，把每条 `nginx.ingress.kubernetes.io/...` 逐一对照新控制器等价物——这暴露了注解不可移植的根本问题。
2. 灰度只能靠 hack：在支持 Gateway API 的控制器上改用 `HTTPRoute` 的 `backendRefs` 加 `weight`（如 `weight: 95` / `weight: 5`）做原生加权切分，去掉注解。
3. 应用团队被平台卡住：拆成 `Gateway`（平台拥有监听器/TLS）+ `HTTPRoute`（应用团队自管路由），用 RBAC 限定各自命名空间，路由变更不再走工单。
4. 迁移路径：新服务直接上 Gateway API；存量 Ingress 用 `ingress2gateway` 工具转换起步，逐步替换。
5. 验证：`kubectl describe httproute` 看 `Accepted`/`ResolvedRefs` 条件，确认路由被控制器接受、后端解析成功。

**面试常追问 / 权衡：** Ingress 遗留、注解重、不可移植、无 L4/切分干净模型；Gateway API 角色划分（GatewayClass/Gateway/HTTPRoute）、可移植、原生支持加权流量和 TCP/UDP/TLS/按头路由。权衡是 Gateway API 较新、需控制器支持（Envoy Gateway、Istio、Contour、NGINX 已有实现），生态和示例不如 Ingress 成熟；简单场景 Ingress 仍够用，但新部署应瞄准 Gateway API。

**要点：**
- Ingress = 遗留、注解重、换控制器就崩
- Gateway API = 角色划分（GatewayClass/Gateway/HTTPRoute）、可移植
- HTTPRoute 用 `weight` 原生加权流量，不再靠注解 hack
- 控制器：Envoy Gateway、Istio、Contour、NGINX；存量用 `ingress2gateway` 迁移

---

### 50. HPA vs VPA vs Cluster Autoscaler vs Karpenter

**频率：** 中

**题目：** 大促流量涌来，你们服务的 HPA 确实把副本从 10 扩到了 40，但新 pod 全卡在 `Pending`——集群没节点能装它们，用户开始超时。事后复盘还发现有人给同一个服务同时开了 HPA 和 VPA，导致副本数来回振荡。请对比 HPA、VPA、Cluster Autoscaler 和 Karpenter，说清各自扩哪根轴、以及本案例该怎么组合。

**这是什么 & 为什么用它：** 这四个自动扩缩器分在**两根不同轴**上——pod vs 节点——且*协同*工作；本案例"pod 扩了但没节点装"正是因为只有 pod 级扩缩、缺了节点级扩缩这一半。

**落地这个案例：**

**Pod 级（扩工作负载）：**
- **HPA（水平 Pod 自动扩缩）**——基于 **CPU、内存或自定义/外部指标**（每秒请求数、队列深度）上下扩 **pod 副本数**。更多负载 → 更多 pod。扩无状态服务的主要方式，本案例把副本从 10 扩到 40 的就是它。
- **VPA（垂直 Pod 自动扩缩）**——通过观察实际用量随时间**右调 pod 的 CPU/内存 *requests***。适合不易副制的工作负载（某些有状态/单例应用）。**注意：不要在*同一指标*上同时跑 VPA 和 HPA**——它们会打架（VPA 改 requests，而 requests 变了 HPA 据以扩缩的 CPU% 也变，引发振荡）——正是本案例副本来回振荡的原因。常把 VPA 跑在**仅推荐模式**以告知 requests 而不自动施加。

**节点级（扩集群）：**
- **Cluster Autoscaler（CA）**——当 pod **无法调度**（因无容量而 Pending，正是本案例症状）或节点低利用时**增/删节点**。但它在**预定义节点组 / ASG** 内工作——你必须预先设好实例类型组，它只扩缩这些组的数量。
- **Karpenter**——**无组**节点自动扩缩器（AWS 起源）：不扩固定节点组，而是看 pending pod 并**按需供给*恰好*的实例类型**——选尺寸、**混 spot 和按需**以最小化成本并契合确切的资源形状。比 CA 更快更高效（无预定组、更好的装箱、合并）。

**它们如何组合：** HPA（或 VPA）扩 pod；当 pod 装不下，**CA 或 Karpenter** 扩节点腾地方。**现代 AWS 组合是 HPA + Karpenter**——HPA 在负载下加副本，Karpenter 变出最优（常是 spot）节点来承载，负载降时再合并。本案例缺的就是这一层。

**怎么排查/定位/修复：**
1. pod 卡 Pending：`kubectl describe pod <pod>` 看 Events，`0/N nodes are available: Insufficient cpu/memory` 说明是节点容量不足、不是 pod 配置问题。
2. 确认有没有节点级扩缩：`kubectl get nodes` 看节点数是否随负载增长；若集群装了 CA/Karpenter，`kubectl -n kube-system logs <autoscaler>` 看它为何没加节点（如 ASG 到达 max、无匹配实例类型、Karpenter NodePool 限额）。
3. 修节点侧：上 Karpenter（或调大 CA 的 ASG max），确保有能容纳 40 副本资源形状的实例类型池，大促前预热/预留容量。
4. 修振荡：`kubectl get vpa` 和 `kubectl get hpa` 若指向同一 Deployment 同一指标就是冲突——把 VPA 改成 `updateMode: "Off"`（仅推荐）或让两者管不同指标。
5. 验证：再压测看 HPA 加副本 → Karpenter 秒级供节点 → pod 全部 Running，负载降后节点被合并回收。

**面试常追问 / 权衡：** HPA 扩副本、VPA 调 requests（同指标别和 HPA 同用，会振荡，多用推荐模式）、CA 在预定义 ASG 内增删节点、Karpenter 无组按 pending pod 供最优实例。pod 级和节点级必须都有，否则 HPA 扩了 pod 却没节点装（本案例）。CA vs Karpenter：CA 稳定成熟但受限于预设节点组，Karpenter 更快、装箱更好、能混 spot 省钱但相对新且偏 AWS。现代 AWS 常用 HPA + Karpenter。

**要点：**
- HPA 水平扩 pod（副本）；VPA 调 requests，同指标避免与 HPA 同用（会振荡）
- CA 在预定义 ASG 内扩节点；Karpenter 无组、按需供最优实例、混 spot
- pod 卡 Pending 先 `describe` 看是不是节点容量不足，再查节点级扩缩
- pod 级 + 节点级要配齐，现代 AWS 常用 HPA + Karpenter

---

### 51. PodDisruptionBudgets

**频率：** 中

**题目：** 一次集群节点升级，运维一条 `kubectl drain` 把某节点排空，结果那节点恰好承载了某服务的全部 3 个副本，服务瞬间归零、直接故障。事后引入 PDB 防止重演，但有人把 `minAvailable` 设成了等于副本数，导致后续 drain 永远卡住排不动。请解释 PodDisruptionBudget 防什么、不防什么，以及这两个坑怎么规避。

**这是什么 & 为什么用它：** PDB 限制一个应用的 pod 能**一次性**被**主动**取下多少个，确保干扰性维护期间保留足够副本服务——正是用来防本案例"一次 drain 端掉全部副本"的机制。你声明 **`minAvailable`**（至少保持 N 个 pod）或 **`maxUnavailable`**（一次最多驱逐 N 个）。

**落地这个案例：** 3 副本部署配 `minAvailable: 2` 意味着只有当**至少 2 个 pod 保持运行**时才允许驱逐——故**一次最多驱逐一个 pod**，且下一个在替代 Ready 前不会被驱逐。这正好防止本案例"节点排空同时携掉全部 3 副本"的故障。

**关键区分——自愿 vs 非自愿干扰：**
- **PDB 防*自愿*干扰**——Kubernetes *发起且能节流*的操作：**`kubectl drain`**（为维护排空节点，本案例）、**节点升级/滚动**、**Cluster Autoscaler / Karpenter** 缩容/合并节点。这些尊重 PDB——宁可**等**也不违反它，故自动扩缩器若排空节点会破预算就不排。
- **PDB 不防*非自愿*干扰**——无人调度的事：**节点硬件崩溃**、内核 panic、网络分区或 OOM 杀。没有驱逐请求可阻——pod 就直接死。PDB 阻不了。

**含义：** PDB 对生产中**安全的滚动节点升级必不可少**（没它，一次 drain 可一次驱逐全部副本）。但因为它不盖崩溃，你**还**需要**多副本跨区域分散**（通过拓扑分散约束 / 反亲和性），使*非自愿*的 AZ 或节点故障不会携掉一切。也当心 `minAvailable` == 副本数——那会**阻止所有自愿驱逐**并死锁节点排空，正是本案例第二个坑。

**怎么排查/定位/修复：**
1. drain 排不动/卡住：`kubectl drain` 报 `Cannot evict pod as it would violate the disruption budget`，说明 PDB 不允许再驱逐。`kubectl get pdb` 看 `ALLOWED DISRUPTIONS` 是否为 0。
2. 若 `minAvailable` == 副本数（如 3 副本配 `minAvailable: 3`）：`ALLOWED DISRUPTIONS` 恒为 0，永远死锁——改成 `minAvailable: 2` 或 `maxUnavailable: 1` 留出驱逐余量。
3. 若是副本本就没起够：`kubectl get deploy` 看 ready 副本数，扩副本让健康数超过 `minAvailable` 才有驱逐空间。
4. 防单节点端掉全部副本：加拓扑分散约束（`topologySpreadConstraints` 按 `topology.kubernetes.io/zone`）或反亲和性，让副本分散到多节点/多 AZ。
5. 验证：配好后 `kubectl drain <node>` 应逐个驱逐、替代 pod Ready 后再驱逐下一个，服务全程不归零。

**面试常追问 / 权衡：** PDB 只防自愿干扰（drain、升级、自动扩缩合并），不防非自愿（崩溃、OOM、AZ 挂）——所以它是滚动升级安全网，但抗故障还得靠多副本 + 跨区分散。`minAvailable` vs `maxUnavailable` 二选一表达同一约束，但 `minAvailable` == 副本数会死锁 drain，务必留余量。PDB 太严会拖慢维护、太松则起不到保护，要和副本数、SLA 匹配。

**要点：**
- 只保护自愿干扰（drain/升级/合并），不防崩溃/OOM/AZ 挂
- `minAvailable` 或 `maxUnavailable`，别让 `minAvailable` == 副本数（死锁 drain）
- drain 卡住看 `kubectl get pdb` 的 `ALLOWED DISRUPTIONS`
- 配合多区域拓扑分散防单节点端掉全部副本

---

### 52. Init 容器 vs Sidecar 容器

**频率：** 中

**题目：** 你们的服务注入了 Envoy sidecar 做网格代理，出现两个诡异问题：pod 刚启动那几秒主应用发的请求全失败（因为代理还没起好），而一个批处理 Job 永远完成不了、卡在 Running（因为 Envoy sidecar 不会自己退出）。请对比 init 容器与 sidecar 容器，说清原生 sidecar（K8s 1.28+）如何修好这些。

**这是什么 & 为什么用它：** init 容器和 sidecar 容器都是 pod 里的辅助容器，但**生命周期相反**——本案例两个问题正是老式 sidecar（普通容器冒充）在启动顺序和退出时机上的生命周期 bug，原生 sidecar 就是为治它们而生。

**落地这个案例：** **Init 容器**在应用容器启动*前***顺序、运行到完成**——每个必须成功退出下一个才跑，全部完成后主容器才启动。用于**一次性设置**：跑**数据库迁移**、**等依赖**可达（阻到 DB 响应）、**取配置/密钥**到共享卷，或设文件权限。若 init 容器失败，pod 不启动——它是硬前提门。

**Sidecar 容器**在 pod 整个生命里**与主容器并行运行**，**共享其网络命名空间和卷**。经典用法：**日志发送器**（Fluent Bit 读应用的日志卷）、**服务网格代理**（Envoy 通过共享 netns 拦流量，本案例）或**配置重载器**。它们是长期运行的伙伴，非跑一次的设置。

**原生 sidecar 解决的旧问题：** 在原生支持前，"sidecar"只是 pod 里普通应用容器，造成**生命周期 bug**——如 sidecar（代理）可能**在主应用启动前未就绪**（早期请求失败，正是本案例第一个问题），或 sidecar 可能**在主容器排水完前退出**（丢最后日志 / 关停时破网格），且 Job 里 pod 因 sidecar 不退而无法完成（本案例第二个问题）。

**Kubernetes 1.28+ 原生 sidecar** 修好这些：你把 sidecar 声明为带 **`restartPolicy: Always` 的 `initContainer`**。这个特殊 init 容器**在主容器前启动**（代理/日志先就绪，治早期请求失败）但**持续运行**并**存活到主容器启动之后**，关停时在主容器**之后才终止**——给出正确的"先启动、后停止"顺序。它还让 Job 能完成（主容器完成时原生 sidecar 被信号停止，治 Job 卡住）。这是现在跑 sidecar 的正确方式。

**怎么排查/定位/修复：**
1. 启动早期请求失败：`kubectl logs <pod> -c <app>` 看是否在启动几秒内报连不上/连接被拒，而 `-c istio-proxy`（或 envoy）日志显示代理稍后才就绪——典型的 sidecar 未先就绪。
2. Job 卡 Running 不完成：`kubectl get pod` 看主容器已 `Completed` 但 pod 仍 Running，`kubectl get pod -o jsonpath` 看 sidecar 容器还在跑——老式 sidecar 不随主容器退出。
3. 修：把 sidecar 从普通 `containers` 挪到 `initContainers` 并加 `restartPolicy: Always`（K8s 1.28+，1.29 默认开启 feature gate）。这样代理先启动后停止、Job 能完成。
4. 服务网格场景：升级到支持原生 sidecar 的网格版本（Istio 已支持把注入改为原生 sidecar 模式），或用 Istio Ambient 去掉 per-pod sidecar。
5. 验证：重部署后早期请求不再失败，Job 主容器完成后 pod 正常 `Completed`。

**面试常追问 / 权衡：** init 容器顺序运行到完成、做一次性前置设置、失败即 pod 不启动；sidecar 全程并行、共享网络/卷、做长期辅助。老式 sidecar 用普通容器冒充会踩启动顺序和退出时机的坑（早期请求失败、Job 不完成、关停丢日志/破网格）。原生 sidecar（init + `restartPolicy: Always`）给出"先启动、后停止"的正确生命周期，是现在的标准做法；权衡是需要 K8s 1.28+ 及网格/工具支持。

**要点：**
- Init：一次性前置设置、顺序运行到完成，失败即 pod 不启动
- Sidecar：全程并行的辅助，共享网络/卷
- 原生 sidecar = init 容器 + `restartPolicy: Always`（K8s 1.28+），先启动后停止
- 治早期请求失败和 Job 卡 Running 不完成

---

### 53. NetworkPolicy 与默认拒绝

**频率：** 中

**题目：** 一次安全审计发现，你们集群里任意一个 pod 都能直连数据库 pod 和其它命名空间的服务——审计员演示了从一个被攻陷的前端 pod 横向移动到支付服务。你决定上 NetworkPolicy 做默认拒绝，结果刚 apply 完默认拒绝策略，所有服务的 DNS 解析全挂了、应用报连不上。请解释 NetworkPolicy 与默认拒绝模式，以及这个 DNS 坑怎么修。

**这是什么 & 为什么用它：** Kubernetes 默认所有 pod 互通、完全开放，被攻陷的 pod 可随意横向移动（本案例）；NetworkPolicy 用来把网络从 allow-all 收紧成零信任，只放行显式声明的连接。

**落地这个案例：** **关键默认：所有 pod 能与所有 pod 通信。** 开箱即用时，Kubernetes 网络是**扁平且完全开放**的——任一 pod 能连任何命名空间里的任何其他 pod。方便但不安全：被攻陷的 pod 可自由探测并到达整个集群（横向移动，正是审计演示的）。

**NetworkPolicy 约束它。** 它按标签**选定 pod** 并定义**允许的 ingress 和/或 egress**——一旦*任何*策略选中某 pod，该 pod 对所盖方向就从 allow-all 切为**"除显式允许外拒绝一切"**。策略是**叠加**的（allow-list 并集）。

**推荐模式是默认拒绝 + 定向允许。** 先施加一个选中所有 pod 且什么也不允许的**命名空间级默认拒绝**：
```yaml
spec:
  podSelector: {}          # 选中命名空间里每个 pod
  policyTypes: [Ingress, Egress]
  # 无 ingress/egress 规则 = 拒绝全部
```
然后按应用**分层显式 allow 策略**："前端 pod 可在 8080 达后端"、"后端可 egress 到数据库和 DNS"。这是**零信任网络**——除非声明否则不可达——故被破 pod 只能到其策略允许的，极大限制爆炸半径。**记得允许 egress 到 CoreDNS 的 53 端口**，否则默认拒绝 egress 下名字解析就坏——正是本案例 DNS 全挂的原因，经典的坑。

**需要策略感知的 CNI：** NetworkPolicy 只是个 *API*——**CNI 插件必须执行它**。Flannel（基础）不行；**Calico 和 Cilium** 行。若你的 CNI 忽略策略，它们默默无效——危险的虚假安全感。

**Cilium 加 L7 策略：** 标准 NetworkPolicy 是 **L3/L4**（IP + 端口）。**Cilium**（基于 eBPF）把它扩到 **L7**——如只允许 `GET /api/public` 而非 `POST /admin`，或限定特定 **gRPC 方法**和 Kafka topic——身份感知、应用协议级的规则，普通 NetworkPolicy 无法表达。

**怎么排查/定位/修复：**
1. apply 默认拒绝后 DNS 全挂：应用报 `no such host` / 名字解析失败——默认拒绝 egress 把去 CoreDNS 的流量也切了。加一条 allow egress 到 `kube-system` 命名空间 CoreDNS pod 的 **UDP/TCP 53** 端口。
2. 服务间连不上：`kubectl describe networkpolicy` 看选中的 pod 和放行规则，逐条对照实际调用链补 allow（如"前端→后端 8080"、"后端→DB 5432"）。
3. 策略像没生效（默认拒绝了还是全通）：多半是 CNI 不执行策略——确认用的是 Calico/Cilium 而非裸 Flannel，`kubectl get pods -n kube-system` 看 CNI 组件在跑。
4. 验证隔离：从一个不该有权限的 pod `kubectl exec` 里 `nc -zv <db-pod-ip> 5432` 或 `curl`，应被拒；从允许的 pod 应通。
5. 更细粒度需求（只允许某 HTTP 路径/gRPC 方法）：上 Cilium 的 L7 `CiliumNetworkPolicy`。

**面试常追问 / 权衡：** 默认 allow-all 要用默认拒绝 + 定向 allow 收成零信任，但必须记得放行 DNS（CoreDNS 53），否则名字解析全挂——最常踩的坑。NetworkPolicy 只是 API，必须搭策略感知 CNI（Calico/Cilium）才生效，Flannel 会让它静默失效造成虚假安全感。标准策略只到 L3/L4，要按 HTTP 路径/gRPC 方法管得上 Cilium L7。权衡是策略越细维护成本越高，默认拒绝也会让新服务上线时必须显式补规则。

**要点：**
- 默认 allow-all，用默认拒绝 + 定向 allow 做零信任
- 默认拒绝 egress 后必须放行 DNS（CoreDNS 53），否则解析全挂
- 需要策略感知 CNI（Calico/Cilium），Flannel 会静默失效
- Cilium 加 L7（HTTP/gRPC）策略

---

### 54. CoreDNS

**频率：** 中

**题目：** 你们一个高 QPS 的服务频繁调用外部 API（`api.github.com`），监控显示 CoreDNS 负载异常高、还偶发 SERVFAIL，而这个服务的外部调用延迟里有很大一块是 DNS。抓包发现每次解析 `api.github.com` 竟然发了 4 次查询、前 3 次全是 NXDOMAIN。请解释 Kubernetes 中的 CoreDNS 和 `ndots:5` 外部查找问题，以及怎么优化。

**这是什么 & 为什么用它：** CoreDNS 是集群默认 DNS 服务器，给每个 pod 做名字解析；但它配合注入 pod 的 `ndots:5` 规则会让外部域名解析产生大量失败查询——正是本案例"一次解析发 4 次查询"和 CoreDNS 高负载的根因。

**落地这个案例：** **CoreDNS** 是**默认集群 DNS 服务器**——一个可插拔 DNS 服务器（以 Deployment 运行），给每个 pod 名字解析。它解析：
- **Service 记录**：`<service>.<namespace>.svc.cluster.local` → Service 的 ClusterIP。这是 pod 按名互找的方式。
- **Headless 服务的每 pod A 记录**：对 `clusterIP: None` 服务，它返回**每个后端 pod 一条 A 记录**（并为 StatefulSet 给稳定的 `<pod>.<svc>...` 名）。
- **SRV 记录**：广告**服务 + 端口**（用于端口发现）。
- **外部查询**：集群域之外的名字**向上游转发**（到节点解析器 / 配置的转发器）。

**`ndots:5` 放大问题：** Kubernetes 向每个 pod 的 `/etc/resolv.conf` 注入 `options ndots:5` 和一个**搜索列表**（`<ns>.svc.cluster.local`、`svc.cluster.local`、`cluster.local`）。`ndots:5` 规则意味：**若查询名的点*少于 5 个*，先逐个附加搜索域再直接试。** 故解析 `api.github.com`（2 点 < 5）触发一串**失败查找**——`api.github.com.<ns>.svc.cluster.local`、`api.github.com.svc.cluster.local`、`api.github.com.cluster.local`——全 NXDOMAIN——**才**最后查 `api.github.com` 本身。4 次查找而非 1 次，成倍增 DNS 负载并为每次外部调用加延迟——正是本案例抓包看到的现象。

**缓解：** 用带**尾点的完全限定名**（`api.github.com.`）——点够 / 信号"绝对、不附加搜索域"；或在主调外部服务的 pod 上设**`dnsConfig.options` 用更低 `ndots`**（如 `ndots: 2`）；或用 **NodeLocal DNSCache** 缓存并减往返。

**SLI 与扩容：** 盯**缓存命中率**、**转发（上游）延迟**和**错误/SERVFAIL 率**。随集群规模**扩 CoreDNS 副本**（更多 pod = 更大查询量），并用 **NodeLocal DNSCache**（每节点缓存）减中心 CoreDNS 负载并降延迟——DNS 是常见的集群级瓶颈和故障源。

**怎么排查/定位/修复：**
1. 确认放大：在 pod 里 `cat /etc/resolv.conf` 看 `options ndots:5` 和 search 列表；`kubectl exec` 里 `dig api.github.com` 或抓包看是否先发一串 `...svc.cluster.local` 全 NXDOMAIN 才查真实名。
2. 快速验证是搜索域惹的祸：`dig api.github.com.`（带尾点）应只发 1 次查询立即成功，对比不带尾点的 4 次。
3. 修应用侧：外部域名统一写成 FQDN 带尾点，或给该服务 pod 配 `dnsConfig: {options: [{name: ndots, value: "2"}]}` 降低阈值。
4. 修 CoreDNS 侧：`kubectl top pods -n kube-system` 看 CoreDNS CPU 是否打满，部署 **NodeLocal DNSCache** 让每节点本地缓存吸收重复查询，并按查询量扩 CoreDNS 副本。
5. 查 SERVFAIL：`kubectl logs -n kube-system -l k8s-app=kube-dns` 看是否上游转发超时/失败，必要时调 CoreDNS 的 `forward` 上游和 `cache` 插件。
6. 验证：优化后 CoreDNS 查询量和 CPU 下降、外部调用 DNS 延迟收敛、SERVFAIL 消失。

**面试常追问 / 权衡：** CoreDNS 解析 Service ClusterIP、Headless 每 pod A 记录、SRV，外部名转发上游。`ndots:5` 让点少于 5 的外部域名先套一遍搜索域产生 3 次 NXDOMAIN 再查真名，放大负载和延迟——用 FQDN 尾点、降 `ndots`、或 NodeLocal DNSCache 缓解。权衡：降 `ndots` 可能破坏依赖短名解析同命名空间服务的场景，要按服务定制而非全局改。DNS 是集群级隐形瓶颈，要监控缓存命中率/上游延迟/SERVFAIL 并随规模扩副本。

**要点：**
- 解析 `<svc>.<ns>.svc.cluster.local`、Headless -> 每 pod A 记录、SRV、外部转发上游
- `ndots:5` 外部查找放大成 4 次查询，用 FQDN 尾点或降 `ndots` 治
- NodeLocal DNSCache 减中心负载和延迟，随规模扩 CoreDNS 副本
- 监控缓存命中率 / 上游延迟 / SERVFAIL，DNS 是集群级隐形瓶颈

---

### 55. 服务网格：它加了什么

**频率：** 中

**题目：** 你们有几十个微服务用五种语言写成，安全要求所有服务间调用必须 mTLS 加密，SRE 又想要统一的重试/超时/灰度和跨服务追踪——但没人愿意在每种语言里重复实现这些。有人提议上服务网格。请说明服务网格加了什么、它的权衡是什么，以及什么时候值得上。

**这是什么 & 为什么用它：** 服务网格（Istio、Linkerd、Cilium Service Mesh）透明拦截流量（传统用注入每个 pod 旁的 **sidecar 代理**），**不改应用代码**就统一处理服务间网络关注——正好解决本案例"多语言、不想每种语言各写一遍 mTLS/韧性/追踪"的痛点。

**落地这个案例：** 它加：
- **服务间 mTLS**——自动双向 TLS：每个服务间调用都加密且两端互认，给出**零信任网络**，证书轮换替你处理。应用不实现 TLS——满足本案例的加密合规要求，五种语言零改动。
- **细粒度流量策略**——在代理处统一施加**重试、超时、断路器**和异常检测，于是韧性模式无需在每个服务/语言重实现。
- **Canary / 加权路由**——按百分比或头切流量做渐进式交付（Flagger 驱动的就是这个）。
- **统一可观测性**——为*每个*调用在代理处生成**一致的指标、追踪、日志**——于是无论语言你都得到跨所有服务的黄金信号遥测，无需每应用埋点。

**权衡（它不免费）：**
- **延迟和资源税**——每请求经代理一跳（额外网络跳 + 每 sidecar 的 CPU/内存）。**Linkerd** 最轻（专为此建的 Rust 微代理）；**Istio** 最多功能但更重。
- **运维复杂度**——你现在要跑并升级整个控制平面 + 数百 sidecar；误配能破所有流量。
- **调试难度**——代理在服务间加一层，故故障可能在应用*或*网格，"为何这请求被重试/失败？"更难追。

**无 sidecar 网格降开销：** **Cilium**（内核 eBPF）和 **Istio Ambient 模式**把数据平面从每 pod sidecar 移出——到节点（eBPF 或每节点 ztunnel）——**消除每 pod 一 sidecar 的税**（更少延迟、内存、生命周期复杂度），同时保留 mTLS 和 L4 策略，仅在需要时通过共享代理加 L7 特性。

**怎么排查/定位/修复：**
1. 上网格后请求延迟涨了：对比接入前后的 p99，`istioctl proxy-config` / 代理指标看是不是 sidecar 一跳的开销；轻量选 Linkerd 或转 Ambient/Cilium 去掉 per-pod sidecar。
2. 请求莫名被重试/失败、不确定是应用还是网格：看代理的访问日志和响应标志（Envoy 的 `response_flags`，如 `UO`/`URX`），`istioctl analyze` 查配置错误，用分布式追踪定位是哪一跳出问题。
3. mTLS 握手失败/503：确认两端都注入了 sidecar、`PeerAuthentication` 策略一致（`STRICT` vs `PERMISSIVE`），迁移期用 `PERMISSIVE` 灰度。
4. sidecar 未就绪导致早期请求失败：用原生 sidecar（见 Init/Sidecar 那题）保证代理先启动。
5. 判断值不值得：服务少的话先评估是否只需库级重试 + 现成 mTLS，别为几个服务上整套控制平面。

**面试常追问 / 权衡：** 网格加 mTLS + 统一重试/超时/断路器 + 加权路由 + 跨服务可观测，全部对应用透明、语言无关。代价是每请求代理一跳的延迟和 CPU/内存税、控制平面 + 大量 sidecar 的运维复杂度、以及多一层带来的调试难度。Linkerd 简单轻量、Istio 功能最全但重；无 sidecar 的 Ambient/Cilium 用节点级数据平面消除 per-pod 税。底线：**多服务需统一 mTLS/可观测/流量控制**时值得，少数几个服务是杀鸡用牛刀。

**要点：**
- mTLS + 重试/超时/断路器 + 加权路由 + 统一可观测，对应用透明、语言无关
- Sidecar 税（延迟 + CPU/内存）vs 无 sidecar（Ambient/Cilium 节点级）
- Linkerd：简单轻量；Istio：功能多但重
- 加调试面，故障可能在应用或网格；服务少时别过度工程

---

### 56. CRD 与 Operator 模式

**频率：** 中

**题目：** 你们团队跑着几十套 HA Postgres 集群，DBA 每次都要手动供给存储、配主从复制、主库挂了半夜起来手动故障切换、还要维护备份脚本——既慢又易错，还成了唯一瓶颈。有人提议把这些 runbook 用 Operator 固化成软件。请解释 CRD 与 Operator 模式，以及它如何解决这个案例。

**这是什么 & 为什么用它：** CRD 给 Kubernetes API 加自定义资源类型、Operator 是持续把实际状态调和到该资源 spec 的控制器——两者合起来把本案例这种"专家手动执行、易错、不可扩展"的 day-2 运维编码成自动化软件。

**落地这个案例：** **CustomResourceDefinition（CRD）用新资源类型扩展 Kubernetes API**。注册 CRD 后，你能像内置 Pod 或 Service 一样 `kubectl apply` / `get` 你自己的类型（如 `kind: PostgresCluster`）——存在 etcd、由 schema 校验、由 API 服务。CRD 本身只是**数据**——声明类型本身*不做*任何事。

**Operator** 提供*行为*：它是一个**监听 CRD 实例并持续把真实世界状态调和到匹配 spec 的自定义控制器**——同 Kubernetes 对内置资源用的**期望-实际调和环**。你声明 `kind: PostgresCluster` 带 `replicas: 3`，Operator 做实际工作：供给 pod 和存储、配复制、并保持如此——本案例 DBA 手动做的全交给它。

**为何强大——它把运维知识固化为软件。** 跑数据库这类有状态系统涉及专家级、易错的步骤：**供给、配复制、主死时故障切换、定时备份、安全升级**（正是本案例 DBA 手动扛的那些）。Operator 把那些 runbook **编码进控制器**，使它们自动且一致地发生——人的专业知识变成调和逻辑，主库挂了 Operator 自动故障切换、备份按 spec 定时跑。这是 Kubernetes 原生的自动化复杂应用"day-2"运维的方式。

**工具与例子：** 用 **kubebuilder** 或 **Operator SDK**（为 CRD schema + 控制器调和环搭脚手架，通常 Go）构建。知名例子：**cert-manager**（`Certificate` → 自动从 Let's Encrypt 获取并续期 TLS）、**Prometheus Operator**（`Prometheus`/`ServiceMonitor` → 管 Prometheus 实例和抓取配置）、**postgres-operator** / **CloudNativePG**（管带故障切换和备份的 HA Postgres 集群）——本案例直接采用 CloudNativePG 就能替掉大部分手动 runbook。

**怎么排查/定位/修复：**
1. 落地本案例：装一个成熟的 Postgres Operator（如 CloudNativePG），把每套集群声明成 `kind: Cluster` 带 `instances: 3` + 存储 + 备份策略，`kubectl apply`，Operator 自动供给、配复制、管故障切换。
2. Operator 没按 spec 调和（改了 CR 但没反应）：`kubectl describe <cr>` 看 status/conditions 和事件，`kubectl logs -n <ns> deploy/<operator>` 看调和循环是否报错（RBAC 不足、webhook 失败、依赖缺失）。
3. 自定义 CR apply 被拒：多半是 CRD 的 OpenAPI schema 校验或 validating webhook 挡了，`kubectl explain <kind>` 对字段、看 webhook 日志。
4. 自建 Operator：用 kubebuilder 生成脚手架，实现幂等的调和函数（每次把实际状态拉向期望，能安全重入），注意处理删除时的 finalizer。
5. 验证故障切换：kill 主库 pod，看 Operator 是否自动提升副本、更新 Service 指向新主，恢复 DBA 原来手动做的事。

**面试常追问 / 权衡：** CRD 只加 API 类型（数据），Operator 才提供行为（调和环）——两者要配套。它的价值是把领域运维知识编码成软件，让 day-2 运维自动、一致、可扩展。权衡：自建 Operator 是真正的软件工程投入（调和幂等、边界情况、升级、finalizer），对简单场景过重；成熟领域优先用现成 Operator（cert-manager、Prometheus Operator、CloudNativePG），别重复造轮子。调和环设计不当会引发抖动或竞态。

**要点：**
- CRD 加新 API kind（仅数据）；Operator 控制器调和期望 vs 实际（行为）
- 把故障切换/备份/升级等 runbook 编码成软件，自动一致可扩展
- 用 kubebuilder/Operator SDK 构建，调和函数要幂等、处理 finalizer
- 成熟领域优先用现成 Operator（CloudNativePG 等），别自造轮子

---

### 57. 滚动更新 vs Recreate

**频率：** 中

**题目：** 你们一个无状态 API 服务用默认滚动更新推 v2，结果每次发版 5xx 都短暂飙升；隔壁一个带库锁的单例服务发版后偶发数据错乱。请说明滚动更新和 Recreate 的区别、两个旋钮怎么调，以及这两个服务各该用哪种策略、怎么定位那波 5xx。

**这是什么 & 为什么用它：** 滚动更新和 Recreate 是 Deployment 的两种更新策略，权衡相反——前者保可用性、后者保"版本干净不混跑"，正好对应本案例两个服务不同的痛点。

**落地这个案例：** **滚动更新（默认）**——逐渐**用新 pod 替换老 pod，每次几个**，全程保服务在线。两个旋钮调推出：
- **`maxSurge`**——推出期间可创建**超过期望数的额外 pod**（临时超容以先起新 pod 再退老）。
- **`maxUnavailable`**——一次可**缺**（低于期望）多少 pod。

它们权衡**速度 vs 可用性**：更高 surge/unavailable = 更快推出但更多容量抖动或余量减少。本案例那个无状态 API **为零停机**应设 **`maxUnavailable: 0`**（绝不降到满容量之下）配 **`maxSurge: 25%`**（先起新 pod 再退老）——但这**需要集群有余容量**给额外 surge pod。关键是，零停机还**需要好的 readiness 探针**，使流量仅在新 pod *真正*就绪后才切过去（否则你把流量路到尚未服务的 pod）——这正是那波 5xx 的头号嫌疑。

**Recreate**——**终止所有老 pod，然后启动新的**。极简单，但老 pod 死亡到新 pod Ready 之间有**停机空窗**。从不同时跑混版本。本案例那个**持独占锁的单例**服务就该用它：两实例会冲突（正是偶发数据错乱的根因）。经典该选 Recreate 的另一情形是**不兼容的数据库 schema 迁移**（v2 pod 期望新 schema 而 v1 pod 会坏——不能两者同时打 DB）。接受短暂停机以保证干净的版本切换。其余一切优选滚动更新。

**怎么排查/定位/修复：**
1. API 发版 5xx 飙升：`kubectl get deploy <svc> -o yaml` 看 `strategy`，多半 `maxUnavailable` 非 0 或没配好 readiness 探针，导致流量打到没起好的 pod。
2. 确认 readiness：`kubectl describe pod <new-pod>` 看 readinessProbe 是否在真正就绪后才通过；`kubectl get endpoints <svc>` 观察发版时 endpoint 是否短暂空掉。
3. 改成 `maxUnavailable: 0` + `maxSurge: 25%` + 合理 readiness 探针，重发观察 p99/5xx 曲线是否平稳。
4. 单例服务偶发数据错乱：确认它当前是滚动更新——发版瞬间会有 v1、v2 两实例同时持锁，改成 `strategy.type: Recreate` 消除混跑窗口。
5. 若 Recreate 停机窗口不可接受，考虑加 `PodDisruptionBudget`/leader election 等更细的互斥手段替代。

**面试常追问 / 权衡：** 滚动更新用 maxSurge/maxUnavailable 权衡速度 vs 可用性，`maxUnavailable: 0` + `maxSurge: 25%` 求零停机但需集群余容量和好 readiness 探针；Recreate 极简单但有停机空窗，用于**不能容忍两版本同跑**的场景（不兼容 schema 迁移、持独占锁的单例）。陷阱：readiness 探针不到位时"零停机"配置照样漏流量到未就绪 pod；余容量不足时 surge pod 起不来会卡住推出。

**要点：**
- maxSurge + maxUnavailable 调推出，权衡速度 vs 可用性
- maxUnavailable: 0 + maxSurge: 25% 求零停机，但要余容量 + readiness 探针
- 不兼容版本 / 独占锁单例用 Recreate（接受短暂停机换干净切换）
- 5xx 飙升先查 strategy 和 readiness 探针 + endpoints

---

### 58. ServiceAccount 与 pod 身份

**频率：** 中

**题目：** 安全审计发现你们一个 pod 的镜像里 ENV 硬编码了一对长寿 AWS access key，用来读 S3；同时另一个 pod 报 `403` 连自己 namespace 的资源都列不了。请说明 pod 怎么获得身份、怎么向 Kubernetes API 和云 API 认证，以及怎么把那对硬编码 key 干掉、怎么排查那个 403。

**这是什么 & 为什么用它：** pod 有两种身份需求——对集群内 Kubernetes API 用 ServiceAccount，对外部云 API 用 workload identity 联合，目的都是**不把静态长寿凭证塞进 pod**，正好治本案例的硬编码 key 和权限问题。

**落地这个案例：** **Kubernetes API 身份——ServiceAccount：** 每个 pod 以一个 **ServiceAccount（SA）**运行，一个**投影的 SA token**（短寿、受众限定的 JWT）被**挂入 pod**（在 `/var/run/secrets/kubernetes.io/serviceaccount/token`）。pod 出示此 token 向 **Kubernetes API** 认证，SA 上的 RBAC 绑定决定它能做什么——本案例那个 `403` 就是这条链上出了问题。

**云 API 身份——workload identity 联合：** 本案例硬编码 key 要解决的正是向**云** API（S3、Secrets Manager、GCS）认证而*不*把静态云凭证烤进 pod。天真做法——把 AWS access key 放 env 变量或镜像——是安全灾难（长寿、易泄、难轮换、跨 pod 共享），正是审计抓到的。**Workload identity** 通过 OIDC **把 pod 的 SA token 交换为临时云凭证**来解决：
- **AWS IRSA（IAM Roles for Service Accounts）**——SA 被标注一个 IAM 角色（`eks.amazonaws.com/role-arn`）；集群的 OIDC 提供商让 AWS STS 信任 SA token 并**发回该角色的短寿 IAM 凭证**。
- **GKE Workload Identity** 和 **Azure Workload Identity**——GCP 和 Azure 的同样模式：SA ↔ 云 IAM 身份映射，token 交换为限定云凭证。

**为何投影、自动轮换的 token 胜过烤入的密钥：** 挂入的 SA token 是**投影的**（绑到 pod、特定受众、有效期）且由 kubelet 在过期前**自动轮换**——故泄露的 token 短寿、很快无用。配合 workload identity，**pod 或镜像里从不存在长寿云密钥**——凭证按需铸造、限定于恰好一个角色、快速过期。这是给 pod 云访问的最小权限、无静态密钥的方式。

**怎么排查/定位/修复：**
1. 干掉硬编码 key：给 pod 的 SA 加 IRSA 注解绑定一个只读 S3 的最小 IAM 角色，删掉镜像/ENV 里的 access key，重建后进 pod `aws sts get-caller-identity` 确认拿到的是角色的临时凭证而非静态 key。
2. 别忘了轮换/吊销那对已泄露的 key（它已进过镜像历史，视同泄露）。
3. namespace 内 `403`：`kubectl auth can-i list pods --as=system:serviceaccount:<ns>:<sa>` 复现权限判定；`kubectl get pod <p> -o jsonpath='{.spec.serviceAccountName}'` 确认它用的是哪个 SA（默认是 `default`，往往没绑任何 Role）。
4. `kubectl describe rolebinding,clusterrolebinding -n <ns>` 看该 SA 有没有被绑到合适的 Role，缺则补一个最小权限 RoleBinding。
5. 云侧 IRSA 不生效：检查 SA 注解的 role-arn、IAM 角色信任策略里的 OIDC provider 和 `sub`（`system:serviceaccount:<ns>:<sa>`）是否匹配。

**面试常追问 / 权衡：** SA 是 pod 的集群内身份、RBAC 决定它能做什么；云 API 用 IRSA / GKE / Azure Workload Identity 把 SA token 经 OIDC 换成限定角色的临时云凭证。投影 token 短寿、受众限定、kubelet 自动轮换，泄露也很快失效；配合 workload identity 镜像里根本没有长寿云密钥。陷阱：pull secret 是 namespace 级、SA 默认没有 RBAC 权限、IAM 信任策略 `sub` 写错会静默失败。永远别把云密钥烤进镜像。

**要点：**
- SA = pod 的 k8s 身份，RBAC 绑定决定权限（403 先查用的哪个 SA + RoleBinding）
- 对云 API 用 IRSA / Workload Identity，SA token 经 OIDC 换临时凭证
- Token 被投影、受众限定、kubelet 自动轮换
- 永远别把云密钥烤进镜像，泄露后要轮换吊销

---

### 59. etcd

**频率：** 中

**题目：** 一天你们整个集群突然"卡死"——`kubectl` 命令要几十秒才返回、控制器不干活、新 pod 调度不上，但节点和应用本身看着都正常。监控显示某 etcd 节点磁盘延迟飙高。请解释 etcd 在集群里的角色（Raft、延迟、备份、加密），以及怎么定位并防范这类故障。

**这是什么 & 为什么用它：** **etcd** 是持有**全部 Kubernetes 集群状态**的**强一致分布式键值存储**——每个对象（pod、service、secret、configmap）都在 etcd。API server 本质上是它上方的无状态前端。etcd 不健康，整个控制平面就不健康——本案例"集群卡死但应用正常"正是 etcd 出问题的典型画像。

**落地这个案例：** **Raft 与奇数集群：** etcd 用 **Raft 共识算法**保副本一致，提交任何写需**法定人数（多数）**。法定人数数学是你跑**奇数集群（3 或 5 节点）**的原因：3 节点容 **1** 故障（3 之 2 = 多数），5 节点容 **2**。*偶*数不给额外容错（4 节点仍只容 1，因需 3 个构成多数）却加成本并增脑裂风险——故总用奇数。

**延迟敏感（正是本案例根因）：** 每个写必须 **fsync 到磁盘并复制到法定人数**才提交，故 etcd **极度对磁盘和网络延迟敏感**。它需要**快的专用磁盘（低延迟 NVMe SSD）**和理想上**专用节点**——把 etcd 与吵闹工作负载共置，或放慢/网络存储上，会让写延迟飙升而卡住整个 API（`kubectl` 慢、控制器失败）——本案例那块延迟飙高的磁盘就是元凶。

**备份与恢复演练：** 定期用 **`etcdctl snapshot save`** 备份——关键是**演练恢复**（`etcdctl snapshot restore`）。一个你从未测过恢复的备份不是备份。etcd 是单一真相源，故损坏/丢失且无可恢复快照意味着从零重建集群。

**静态加密：** 默认 etcd 在磁盘上明文存数据（含 **Secret**）。启用 **KMS 支撑的静态加密**，使 Secret 不能从 etcd 磁盘/备份泄露中读取（同 Secret 那题的要求）。

**怎么排查/定位/修复：**
1. 确认是 etcd 慢：看 etcd 指标 `etcd_disk_wal_fsync_duration_seconds` 和 `etcd_disk_backend_commit_duration_seconds`（p99 应在几十毫秒内，飙到几百毫秒/秒就是磁盘拖后腿），以及 API server 的 `etcd_request_duration_seconds`。
2. 确认法定人数健康：`etcdctl endpoint status --cluster -w table` 看 leader、raftIndex 是否一致，`etcdctl endpoint health` 看各节点，判断是磁盘慢还是丢了多数。
3. 磁盘慢的修复：把 etcd 迁到独占的低延迟 NVMe SSD、剥离与它共置的吵闹负载、别用网络存储；`iostat`/`fio` 验证磁盘延迟。
4. 丢法定人数：从最新 `etcdctl snapshot save` 的快照 `etcdctl snapshot restore` 恢复并重组集群——前提是你**演练过**恢复。
5. 防范：奇数 3/5 节点、专用快盘、定期快照 + 定期恢复演练、KMS 静态加密。

**面试常追问 / 权衡：** etcd 是集群一致、延迟敏感、依赖法定人数的心脏——**磁盘延迟飙升**或**法定人数丢失**（失多数）都会搬掉整个 API，故多数控制平面故障最终追到它。Raft 要多数才提交，所以奇数节点（3 容 1、5 容 2），偶数只加成本和脑裂风险。快照没演练过恢复不算备份；默认明文存 Secret，要开 KMS 加密。把它当最关键、最细心运维的组件。

**要点：**
- Raft，奇数 3/5 节点求容错，偶数无益还增脑裂风险
- 对延迟敏感：快盘/专用节点必备，慢盘会卡死整个 API
- 定期演练快照 + 恢复（没演练的备份不算备份）
- 用 KMS 静态加密；卡死先看 fsync/commit 延迟和法定人数

---

### 60. ImagePullBackOff 原因

**频率：** 中

**题目：** 一次发版后新 pod 全卡在 `ImagePullBackOff` 起不来，回滚到上个镜像却正常；同一时间另一批用 Docker Hub 基础镜像的 CI 构建报 `toomanyrequests`。请解释 `ImagePullBackOff` 的成因、怎么一步步诊断，以及怎么从架构上预防。

**这是什么 & 为什么用它：** `ImagePullBackOff` 意味 kubelet **拉不到容器镜像**并在重试间退避（瞬时态是 `ErrImagePull`，然后落到 `ImagePullBackOff`）。理解它是因为这是*基础设施/配置*问题、不是应用崩溃——排查方向完全不同，本案例"回滚就好"强烈指向新镜像的名字/tag/凭证。

**落地这个案例：** **总从 `kubectl describe pod` 开始**——Events 部分显示**确切的 registry 错误**（"not found"、"unauthorized"、"toomanyrequests"），直指原因：

1. **镜像名或 tag 拼错**——tag 是 `v1.2.0` 却写 `myapp:v1.2`，或 repo 拼错。错误：`manifest unknown` / `not found`。最常见，本案例发版新 tag 拉不到是头号嫌疑。
2. **registry 不可达**——节点与 registry 间的网络/DNS/防火墙（私有 registry 不可路由、出流被堵）。
3. **缺或错命名空间的 `imagePullSecret`**——拉私有镜像无凭证，或 `imagePullSecret` 在与 pod *不同的命名空间*（secret 是命名空间级的）。错误：`unauthorized`。
4. **私有 registry 凭证过期/错误**——pull secret 的 token 过期，或云凭证（ECR/GCR）未刷新（ECR token 短寿——需凭证 helper / IRSA）。
5. **Docker Hub 匿名限流**——未认证的 CI/节点超拉取限时报 `toomanyrequests`，正是本案例那批 CI 构建的症状。
6. **digest 不再存在**——钉到已从 registry 删除/回收的 `@sha256:...`。

**怎么排查/定位/修复：**
1. `kubectl describe pod <p>` 看 Events 里的确切 registry 错误——先按错误分流（`not found` / `unauthorized` / `toomanyrequests`）。
2. `not found`：核对 manifest 里的镜像名 + tag，`docker pull <image:tag>` 或 `crane manifest <image:tag>` 在本地验证该 tag 真存在，改正 tag。
3. `unauthorized`：`kubectl get secret -n <ns>` 确认 pull secret 在 pod *同一* namespace，`kubectl get sa <sa> -o yaml` 看是否引用了 `imagePullSecrets`；ECR/GCR 则确认凭证 helper / IRSA 在自动刷新短寿 token。
4. `toomanyrequests`（本案例 CI）：改用认证拉取提高限额，并把基础镜像镜像到自有 registry，不再匿名直连 Docker Hub。
5. 节点连不上 registry：在节点上 `curl -v https://<registry>/v2/` 验证 DNS/网络/防火墙。
6. 预防：**把关键镜像镜像到自己的 registry**（Harbor/ECR），不依赖第三方的可用性或限流；认证拉取（更高限额）；用云凭证 helper/IRSA 使 registry 凭证自动刷新；预拉或缓存基础镜像。registry 故障或限流不应能阻止 pod 调度。

**面试常追问 / 权衡：** 六大成因——名/tag 拼错（最常见）、registry 不可达、pull secret 缺失或跨 namespace、凭证过期（ECR token 短寿需 helper/IRSA）、Docker Hub 匿名限流、digest 被回收。诊断永远从 `kubectl describe pod` 的 Events 看确切错误。韧性关键：镜像上游镜像到自有 registry + 认证拉取，别让第三方限流或宕机卡住调度。陷阱：secret 是 namespace 级的，跨 namespace 引用无效。

**要点：**
- 先 `kubectl describe pod` 看 Events 里的确切 registry 错误再分流
- 验证 image 名 + tag 存在（最常见成因）
- imagePullSecret 要在同一命名空间；ECR 用 helper/IRSA 自动刷新
- 注意 Docker Hub 限流，把上游镜像镜像到自有 registry 求韧性

---

### 61. 追踪慢服务

**频率：** 中

**题目：** 用户投诉某个 API 服务"变慢了"——p99 从 120ms 涨到 900ms，但错误率没怎么动、CPU 使用率仪表盘看着还好。你被 on-call 叫起来定位。请走一遍你在 Kubernetes 中系统追踪慢服务的方法。

**这是什么 & 为什么用它：** 追慢服务的方法论是**分层、自顶而下**——从便宜、宽泛的检查开始，逐步钻到具体的慢组件，始终**对照基线和变更日志**（第一个问题总是"改了什么？"）。这样能避免一上来乱猜，本案例"延迟涨但无错误、CPU 看着正常"就特别需要按层排除。

**落地这个案例：**

**1. 服务本身健康/路由对吗？** 查 **`kubectl get endpoints <svc>`**——期望的 pod 真在 Service 的 endpoint 列表里吗？pod readiness 失败会静静掉出，流量堆到更少 pod（看起来像延迟）。确认 **pod readiness** 和副本数。

**2. 改了什么，是错误还是延迟？** 看**最近部署**（推出后立马变慢指向新代码/配置）并并排**错误率 vs 延迟仪表盘**——错误*与*延迟同升提示失败/重试；本案例是延迟*无*错误，提示资源或下游瓶颈。这缩小了问题类型。

**3. 用分布式追踪定位慢 span。** 一次慢请求的追踪显示**时间真正花在哪**——是**慢数据库查询**、**下游服务**调用，还是应用自己的 CPU？这正是指标（太聚合）告诉不了你的，也是本案例 p99 涨到 900ms 该抓的关键。

**4. 检查常造成隐形慢的资源与基础设施因素：**
- **HPA 扩缩**——当前负载下服务扩得不够（副本不足）？HPA 卡住（指标坏）？
- **CPU 节流**——阴险的一个：pod 碰到 CPU *限额*会被**节流**而非杀掉，于是只是变慢而无错误（正好解释本案例"CPU 仪表盘看着好却慢"——平均使用率不高但周期性撞限额被节流）。查 **`container_cpu_cfs_throttled_seconds`**——节流在基本仪表盘上不可见但是顶级延迟成因。
- **DNS 查询时间**——慢/失败的 CoreDNS（或 `ndots:5` 放大）给每个外部调用加延迟。
- **节点压力**——节点的内存/磁盘/IO 压力、吵闹邻居或降级节点。

**怎么排查/定位/修复：**
1. `kubectl get endpoints <svc>` + `kubectl get pod -l app=<svc>` 确认 ready 副本数没缩水、流量没堆到少数 pod。
2. 对照变更日志和 `kubectl rollout history deploy/<svc>`——最近有没有部署/配置变更卡在延迟起点。
3. 打开分布式追踪（Jaeger/Tempo）挑几条 900ms 的慢请求，看时间花在 DB、下游还是本地 CPU。
4. 查 CPU 节流：Prometheus 里 `rate(container_cpu_cfs_throttled_seconds_total[5m])`，若非零则调高 CPU limit 或去掉过紧的 limit，重测 p99。
5. 排除 DNS/节点：`kubectl top nodes` 看节点压力，测 CoreDNS 解析耗时，检查是否落在降级/吵闹节点。
6. 每层都与**基线**（什么是正常）和**变更日志**（部署、配置、基础设施变更）对比以钉住原因。

**面试常追问 / 权衡：** 方法是分层自顶而下：endpoint/readiness → 部署与错误 vs 延迟区分 → 追踪定位慢 span → 资源/基础设施因素（HPA 不足、CPU 节流、DNS、节点压力）。核心权衡：聚合指标能告诉你"慢"但定位不到"慢在哪一跳"，得靠分布式追踪。最阴险的陷阱是 CPU 节流——只慢不报错、基本仪表盘不可见。每一步都要问"改了什么"并对照基线。

**要点：**
- 分层自顶而下，先看 endpoint + readiness
- 区分错误 vs 纯延迟以缩小问题类型
- 用追踪定位慢 span（指标太聚合）
- CPU 节流常不可见（查 cfs_throttled），关联部署 + 节点事件

---

### 62. 集群升级

**频率：** 中

**题目：** 你们生产集群还停在 1.27，安全要求尽快升到 1.29；有人图省事想一步升过去。上一次别的团队升级后，一批 Ingress 突然 `apply` 失败、还因为一次性排空太多节点触发了短暂容量不足。请说明怎么安全地执行这次升级、按什么顺序和规则，以及怎么避免重蹈覆辙。

**这是什么 & 为什么用它：** Kubernetes 升级遵严格的顺序和版本规则以免破集群——理解这些规则正是为了避免本案例这类"跳版本、排空过猛、被移除 API"的翻车。

**落地这个案例：**

**1. 先升控制面，一次一个小版本。** 在碰节点*之前*升 **kube-apiserver、controller-manager、scheduler、etcd**。关键是**永不跳小版本**——本案例必须走 1.27 → 1.28 → 1.29，不是 1.27 → 1.29。Kubernetes 只支持组件间**一个小版本偏斜**，跳版会破 API 兼容和迁移。控制面必须**处于或领先**于节点（kubelet 可比 API server 落后一个小版本，绝不领先）。

**2. 然后优雅地升节点。** 对每个节点（滚动遍历机队）：**`kubectl drain`**（警戒 + 驱逐 pod，**尊重 PodDisruptionBudget** 以免一次停太多副本——本案例容量不足正是因为没滚动、一次排空过多），**升级 kubelet 和容器运行时（containerd）**，再 **`kubectl uncordon`** 让它回流。滚动逐节点（或逐批）做，保容量不降。常直接换新节点（新 AMI/镜像）而非原地升。

**3. 托管服务自动化控制面。** **EKS、GKE、AKS** 替你处理控制面升级（它们跑并升 master/etcd），你主要管节点升级（甚至那也可通过托管节点组/自动升级自动化）。这拿掉了最险、最琐碎的部分。

**4. 提前扫描被移除的 API——最大坑。** 每个 Kubernetes 版本**移除弃用的 API 版本**（如 `Ingress` 从 `extensions/v1beta1` → `networking.k8s.io/v1`）——正是本案例 Ingress `apply` 失败的原因。若 manifest 用了被移除的 API，升级后就**apply 失败**。**升级前**用 **`pluto`** 或 `kubectl deprecations` 扫描，**读 release note**，**把 manifest/Helm chart 更新**到新 API 版本，并**先在非 prod 集群测**。主动修复避免升级后 deployment 突然无法 apply 的事故。

**怎么排查/定位/修复：**
1. 升级前先扫被移除 API：`pluto detect-files -d ./manifests` 和 `pluto detect-helm`，把命中的 `extensions/v1beta1 Ingress` 等改成新 apiVersion，先在非 prod 集群 `kubectl apply` 验证。
2. 规划路径：`kubectl version` 看当前版本，规划 1.27 → 1.28 → 1.29 的逐版跳，读每版 release note 的 removed API 清单。
3. 控制面先升（托管集群走 EKS/GKE/AKS 控制台或 API），升完 `kubectl get nodes` 确认 API server 版本领先于 kubelet。
4. 节点滚动升：逐节点/逐批 `kubectl drain <node> --ignore-daemonsets`，确保 `PodDisruptionBudget` 已配好防止一次停太多副本（本案例容量不足的修复点），升 kubelet/containerd 后 `kubectl uncordon`。
5. 若升级后某 workload `apply` 失败：看报错的 apiVersion，回到第 1 步补改 manifest/Helm chart。

**面试常追问 / 权衡：** 规则四条——先控制面再节点、一次一个小版本（只支持一个小版本偏斜，kubelet 可落后不可领先）、排空尊重 PDB、提前扫被移除 API。托管服务（EKS/GKE/AKS）把最险的控制面升级自动化。最大坑是被移除的 API 导致升级后 apply 失败，`pluto` 提前扫 + 非 prod 先测是关键。权衡：原地升 vs 换新节点（后者更干净、可回滚整台）。

**要点：**
- 先控制面再节点，一次一个小版本（不跳版）
- kubelet 可落后 API server 一个小版本、绝不领先
- 排空时尊重 PDB、滚动逐批做以免容量骤降
- 升级前用 pluto 扫被移除 API 并在非 prod 先测

---

### 63. kubectl drain

**频率：** 中

**题目：** 你要给一个节点打内核补丁，`kubectl drain node-7` 却报错卡住不动（提示有 DaemonSet 和用了 emptyDir 的 pod）；补完丁一周后又发现集群"少了一台"节点没在调度。请解释 `kubectl drain` 做什么、这些报错怎么处理，以及那台"消失"的节点是怎么回事。

**这是什么 & 为什么用它：** `kubectl drain <node>` 分两步**安全清空节点**：先**警戒（cordon）**节点（标为不可调度，**不接新 pod**），再**驱逐现有 pod** 使其重调到其他处——用它就是为了在维护前优雅腾空节点、而非硬杀 pod 造成中断，正是本案例打补丁前该做的。关键是，驱逐**尊重 PodDisruptionBudget**——若驱逐某 pod 会违反其 PDB（降到 `minAvailable` 之下），drain 会**等**而非造成中断，随替代起来而逐步驱逐。

**落地这个案例：** 本案例两个报错各有对应 flag：
- **`--ignore-daemonsets` 必需。** DaemonSet pod（日志采集、CNI、节点代理）按设计**每节点一个**——无法"移"到别处，故 drain 拒绝推进，除非你用此 flag 明确确认跳过。它们一直跑到节点真被移除。
- **用 `emptyDir` 的 pod 会丢数据。** `emptyDir` 是节点本地临时存储；pod 被驱逐并重调到另一节点时那些数据**消失**。除非你传 **`--delete-emptydir-data`** 确认接受丢失，drain 不会推进。（持久数据应在 PVC 上，那会存活。）

**何时 drain：** 任何**破坏性节点维护**前——**内核/OS 打补丁**（本案例）、**节点升级**（升 kubelet/containerd）、换节点或**缩容**。先排空确保工作负载被优雅重定位而非突然杀掉。

**让节点回流（本案例"消失"节点的真相）：** 维护后用 **`kubectl uncordon <node>`** 重新标为可调度。忘了 uncordon 是常见错误，会让节点一直 `SchedulingDisabled` 闲置在池外——这就是那台"少了的"节点。

**怎么排查/定位/修复：**
1. drain 卡住报错：先看错误文本。DaemonSet 提示 → 加 `--ignore-daemonsets`；emptyDir 提示 → 确认那份临时数据可丢后加 `--delete-emptydir-data`。完整命令 `kubectl drain node-7 --ignore-daemonsets --delete-emptydir-data`。
2. drain 一直在"等待"某些 pod：多半是 PDB 挡着（`kubectl get pdb`），说明副本不够无法在不违反 PDB 下驱逐，先扩副本或临时调整 PDB。
3. 打完补丁：`kubectl uncordon node-7` 让节点回池。
4. "少一台节点"排查：`kubectl get nodes` 看有没有节点显示 `SchedulingDisabled`，有就是漏了 uncordon，执行 uncordon 恢复。
5. 重要数据别放 emptyDir，改用 PVC，这样 drain 不会丢数据。

**面试常追问 / 权衡：** drain = cordon（不接新 pod）+ evict（尊重 PDB 逐步驱逐）。两个必知 flag：`--ignore-daemonsets`（DaemonSet 无法迁移）、`--delete-emptydir-data`（接受本地临时数据丢失）。用于一切破坏性节点维护，完事必须 uncordon。权衡/陷阱：PDB 配太严会让 drain 卡死、忘 uncordon 让节点闲置、emptyDir 数据在驱逐时丢失（持久数据要放 PVC）。

**要点：**
- 警戒 + 驱逐，驱逐尊重 PDB（卡住多半是 PDB 或副本不足）
- DaemonSet 需要 `--ignore-daemonsets`
- emptyDir 数据在排空时丢失，需 `--delete-emptydir-data`，持久数据放 PVC
- 维护后 uncordon 让节点回池，漏了会闲置在池外

---

### 64. kubectl top 与 metrics-server

**频率：** 中

**题目：** 你在一个新集群上跑 `kubectl top pods` 报 `error: Metrics API not available`，同时你给某服务配的 CPU HPA 一直不扩容；另外产品想按"每秒请求数"而不是 CPU 来自动扩缩。请解释 `kubectl top` / metrics-server 是什么、这几个问题怎么定位，以及它相对 Prometheus 的局限。

**这是什么 & 为什么用它：** **`kubectl top pods`** 和 **`kubectl top nodes`** 显示**当前 CPU 和内存使用**——什么在吃资源的快速实时快照。数据来自 **metrics-server**，一个轻量集群插件，**抓每个 kubelet 的 cAdvisor**（每节点容器指标采集器）并**聚合**，通过 Metrics API 暴露。本案例 `top` 报错和 HPA 不扩，多半是同一个根因：metrics-server 没装好。

**落地这个案例：** **它驱动 HPA：** **Horizontal Pod Autoscaler 从 metrics-server 读资源指标（CPU/内存）**来决定何时扩副本。所以 metrics-server 不只用于 `kubectl top`——没它，基于 CPU/内存的 HPA 不工作（正是本案例 HPA 不扩的原因）。注意：它**并非所有发行版默认安装**——常见坑是 `kubectl top` 和 HPA 因缺 metrics-server 而静静失效；装上它。

**关键局限——无历史：** metrics-server 只在内存中持**当前（近实时）值**，**不保历史数据**、不做长期存储。所以你**无法**用它画趋势、看上周使用、按模式告警或做容量分析。**历史、仪表盘和告警**需 **Prometheus + Grafana**——Prometheus 存时间序列，Grafana 可视化。`kubectl top` 答"*现在*什么在吃资源？"；Prometheus 答"使用如何趋势、何时飙升？"

**HPA 的自定义/外部指标（本案例按 RPS 扩缩）：** metrics-server 只提供 **CPU/内存**（资源指标）。要按**应用指标**——每秒请求数、队列深度、自定义业务指标——自动扩缩，需 **Prometheus Adapter**（把 Prometheus 查询通过自定义/外部指标 API 暴给 HPA）或 **KEDA**（事件驱动自动扩缩，按 Kafka lag、SQS 深度、cron 等外部源）。它们接入 HPA 的自定义/外部指标接口，而 metrics-server 单独无法服务——本案例按 RPS 扩缩就该上这套。

**怎么排查/定位/修复：**
1. `kubectl top` 报 `Metrics API not available`：`kubectl get apiservice v1beta1.metrics.k8s.io` 看是否 Available，`kubectl get deploy -n kube-system metrics-server` 确认是否安装/健康，没有就装（如 `helm install` 或官方 manifest）。
2. metrics-server 装了但不健康：`kubectl logs -n kube-system deploy/metrics-server`，自建/裸集群常见要加 `--kubelet-insecure-tls` 解决 kubelet 证书问题。
3. CPU HPA 不扩：`kubectl describe hpa <name>` 看 `TARGETS` 是不是 `<unknown>`——是就是 metrics-server 缺失/不健康；确认目标 pod 设了 CPU `requests`（HPA 按 request 百分比算）。
4. 按 RPS 扩缩：部署 Prometheus Adapter 暴露自定义指标，或用 KEDA 配 `ScaledObject` 按 Prometheus/队列指标扩缩，`kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1` 验证指标可见。
5. 要看历史/趋势/告警：接 Prometheus + Grafana，别指望 metrics-server。

**面试常追问 / 权衡：** metrics-server 喂 `kubectl top` 和 CPU/内存 HPA，只有当前近实时值、无历史。历史/趋势/告警要 Prometheus + Grafana。按应用指标（RPS、队列深度）扩缩要 Prometheus Adapter 或 KEDA。陷阱：metrics-server 非默认安装、缺失时 top 和 HPA 静默失效；HPA 需要 pod 设 requests 才能算 CPU 百分比；裸集群常要 `--kubelet-insecure-tls`。

**要点：**
- metrics-server 喂 HPA + `kubectl top`，缺失时二者静默失效（先查 apiservice）
- 仅当前值、无历史，历史/告警用 Prometheus + Grafana
- CPU HPA 不扩先 `describe hpa` 看 TARGETS 和 pod requests
- 按 RPS/队列等应用指标扩缩用 Prometheus Adapter 或 KEDA

---

### 65. 流水线即代码

**频率：** 中

**题目：** 你们的 Jenkins 作业都是在网页 UI 里手点配置的。一次有人在 UI 里改了构建步骤没告诉任何人，几周后 Jenkins 磁盘挂了、作业配置全丢，没人说得清"上线的东西到底是怎么构建的"，也无法回滚。请解释流水线即代码怎么根治这些问题、为何 UI 编辑是反模式。

**这是什么 & 为什么用它：** **流水线即代码**意味你的 CI/CD 流水线**定义在与代码同居仓的版本控制文件**里——**`.github/workflows/*.yml`**（GitHub Actions）、**`Jenkinsfile`** 或 **`.gitlab-ci.yml`**。流水线定义被当作应用代码对待——正是为了消灭本案例那种"UI 里偷偷改、服务器挂了就丢、无法回滚"的困境。

**落地这个案例：** **为何重要：**
- **可评审、可 diff**——流水线变更走**同代码一样的 PR 评审**。你能看到改了什么、谁改的、为何（git blame），评审者能在合并前抓错（本案例那次偷改就会被评审拦下）。
- **与代码同存**——流水线**随分支版本化**，故旧提交用*当时正确*的流水线构建，回滚代码也回滚其流水线。"代码"与"如何构建"不漂移，也就能回答本案例"上线的东西怎么构建的"。
- **可复用**——把共享逻辑抽成**模板、可复用 workflow 或 composite action**，多仓/作业共用一份已测定义而非复制粘贴。

**为何 UI 编辑是反模式（本案例的病根）：** 在 Jenkins/CI 网页 UI 里点选配置作业意味流水线存在 **CI 服务器的数据库而非 Git**。这导致：**漂移**（运行的流水线不再匹配任何可评审之物——几个月前有人现场改过而无人记得）、**无审计迹**、**无评审**、**无回滚**、**灾备痛**（丢 CI 服务器就丢流水线，正是本案例磁盘挂了全丢）。这是 CI 版的手改生产。

**怎么排查/定位/修复：**
1. 把现有 UI 作业迁成代码：用 Jenkins Job DSL / `Jenkinsfile`（或换 GitHub Actions/GitLab CI）把每个作业的步骤翻译进仓库里的文件，提交进 Git。
2. 锁死 UI 编辑入口：把作业配置改为从 SCM 拉 `Jenkinsfile`（Pipeline from SCM），关掉在 UI 里手改步骤的权限，防止再次漂移。
3. 抽公共逻辑：重复的构建/部署步骤提成可复用 workflow / composite action / shared library，多仓引用一份。
4. 验证流水线改动：因流水线在仓里，**一个改它的 PR 可在合并前*运行*改后的流水线**（在 PR 分支上）——像测代码一样测流水线修改，在评审中抓住坏流水线而非它已上 `main`。
5. 灾备：Git 就是真相源，CI 服务器重建后从仓库重新加载全部流水线定义，不再有"丢服务器丢流水线"。

**面试常追问 / 权衡：** 流水线即代码 = 定义在仓库、走 PR 评审、随分支版本化、可复用模板。UI 编辑的四宗罪：漂移、无审计/评审/回滚、灾备痛。因流水线在仓里，改动能在 PR 分支上先跑再合。权衡：初期迁移和写 DSL/YAML 有成本，且团队要养成"改流水线也走 PR"的纪律，但换来可审计、可回滚、可复用。

**要点：**
- 流水线定义在仓库、走 PR 评审、随分支版本化
- 可复用模板 / composite action，别复制粘贴
- 避免仅 UI 编辑流水线（漂移、无回滚、丢服务器就丢）
- 通过 PR 分支运行验证流水线变更后再合并

---

### 66. 主干 vs Gitflow

**频率：** 中

**题目：** 你们是个持续部署的 SaaS 团队，但一直用 Gitflow 的长命 `develop`/`release/*` 分支，特性分支经常挂两三周，每次合并回主干都是一场血腥的冲突大战、还常常阻塞发布。有人提议换主干开发。请对比主干开发与 Gitflow，说明你们该不该换、怎么落地。

**这是什么 & 为什么用它：** 主干开发和 Gitflow 是两种分支策略，核心权衡是**集成频率 vs 多版本维护能力**——本案例"长命分支 + 合并地狱 + 阻塞发布"正是 Gitflow 用在持续部署场景的典型不匹配。

**落地这个案例：** **主干开发（trunk-based）**：短命分支（小时/天）、频繁合入 `main`，用**特性开关隐藏未完成工作**。因为分支短命、频繁集成，它**启用持续部署并最小化合并冲突**——大分支接多久，分叉就多痛（正是本案例挂两三周的分支合并时血流成河的原因）。

**Gitflow**：长命的 `develop`、`release/*`、`hotfix/*` 分支——**仪式重**，适合**版本化交付的软件**（你同时维护多个发布版本、打 release 分支、向旧版打 hotfix）。你们作为只跑一个生产版本的 SaaS，扛这套仪式却没享受到多版本维护的好处，是净亏损。

**谁选哪个：** 多数 **SaaS 团队选主干**——他们只跑一个生产版本、持续部署，主干的小批量 + 特性开关完美契合（本案例应该换）。**打包软件团队**（库、桌面应用、固件）多用 Gitflow，因为他们真要维护多个版本并为旧版发补丁。

**怎么排查/定位/修复：**
1. 诊断"合并地狱"根因：看分支平均存活时长和合并冲突频率——分支越长命、集成越少，冲突越血腥，这是该转主干的信号。
2. 落地转型：把工作拆成能在 1-2 天内合入 `main` 的小批量，未完成的功能用**特性开关**（LaunchDarkly / 配置开关）在生产里关着，边合边藏。
3. 用 CI 兜底小步快合：每次合并跑全套 PR 检查（lint/单测/构建/集成），让频繁集成是安全的。
4. 拆掉长命分支：逐步淘汰 `develop`，直接以 `main` 为集成点，`release/*` 换成从主干打 tag/切发布。
5. 若确实需要给老客户维护旧版本（少数 SaaS 情形）：保留极少量 release 分支做长期支持，其余走主干。

**面试常追问 / 权衡：** 主干 = 短命分支 + 频繁集成 + 特性开关隐藏 WIP，启用持续部署、最小化合并冲突；Gitflow = 长命 develop/release/hotfix 分支、仪式重，为多版本维护而生。选择看交付模型：SaaS（单一生产版本、持续部署）→ 主干；打包软件（库/桌面/固件，维护多版本发补丁）→ Gitflow。权衡：主干要求特性开关纪律和强 CI，否则半成品会漏进生产；Gitflow 提供隔离但代价是集成延迟和合并痛。

**要点：**
- 主干：小批量、短命分支、快合并，最小化冲突
- 特性开关隐藏 WIP，配强 CI 兜底
- Gitflow：长命分支、版本化发布、仪式重
- SaaS -> 主干；打包软件 -> Gitflow

---

### 67. PR 检查阶段

**频率：** 中

**题目：** 你们的 PR 流水线全是串行的，而且把 15 分钟的集成测试放在最前面——结果开发者提个连分号都没打对的 PR，也要等一刻钟才被告知一个 lint 错误，CI 机器还长期排队。更糟的是有人能绕过没变绿的检查直接合入 `main`。请重新设计 PR 检查的阶段和排序，并说明原则。

**这是什么 & 为什么用它：** PR 流水线是一系列**闸门**，排序原则是让**最便宜、最快、最可能失败的检查先跑**——正是为了根治本案例"琐碎错也要等一刻钟、CI 排队、还能绕过检查"的问题。典型顺序：

1. **Lint / 格式**——秒级，抓琐碎问题。
2. **单元测试**——快，抓逻辑 bug。
3. **构建**——编译应用。
4. **容器构建 & 扫描**——构镜像，跑漏洞 + 密钥扫描。
5. **集成测试**——较慢，组件一起测。
6. **烟雾部署到临时环境**——部到临时隔离环境。
7. **必需评审者批准**——人工评审。
8. **合并。**

**落地这个案例：**

**快速失败——lint 在测试前。** 把**最快的检查放最前**，使有格式错或琐碎错的 PR 在**秒内**失败而非等 15 分钟的测试+构建（本案例排序完全反了）。不让开发者等昂贵阶段才知道便宜问题。又快反馈又省 CI 算力。

**并行独立作业。** lint、单元测试、安全扫描互不依赖——**并发跑**而非串行，削总墙钟时间（本案例全串行是 CI 排队的主因）。只在真有依赖处串行（构建先于集成测试）。

**临时预览环境抓集成 bug。** 拉起**临时、PR 限定的环境**（自己的命名空间/栈，合并/关闭时拆）让你跑*真正部署的应用*——抓住只在真实基础设施、配置、依赖、网络下才现的 bug。评审者也能点看实时变更。

**分支保护强制必需检查。** 把必需检查配为**分支保护规则**，PR **全部变绿（且必需评审者批准）前不能合并**（本案例"能绕过检查合入"就是没配分支保护）。这包括**外部状态报告**——**SonarQube**（代码质量/覆盖率门）或 **Snyk**（安全）把通过/失败状态报回 PR，这些状态也成为必需检查，于是质量/安全回退自动阻合并。

**怎么排查/定位/修复：**
1. 重排阶段：把 lint/格式提到最前，单测其次，昂贵的集成测试/部署放后面，让琐碎错秒级失败。
2. 并行化：把 lint、单测、安全扫描配成互不依赖的并行 job（GitHub Actions 多个 job 无 `needs` 依赖 / GitLab 同 stage），只在真有依赖处用 `needs`/stage 串行。
3. 堵住绕过合并：在仓库设 branch protection（GitHub Settings → Branches / GitLab push rules），勾选 required status checks + required reviews + 禁止管理员绕过。
4. 把 SonarQube/Snyk 的状态回报也设为必需检查，质量/安全回退自动阻合并。
5. 加临时预览环境（PR 限定 namespace/栈，关闭时销毁）跑真正部署的应用，抓只在真实环境现的 bug。

**面试常追问 / 权衡：** 排序原则是快速失败（最快最易挂的先跑）+ 并行独立作业（削墙钟时间）+ 临时预览环境（抓集成 bug）+ 分支保护强制必需检查（含 SonarQube/Snyk 外部状态）。权衡：并行化省时间但吃更多并发 runner；临时环境最真实但有搭建/成本开销；分支保护提升安全但要留好紧急合并的流程（如受控 bypass）。

**要点：**
- 快速失败：lint/格式优先，昂贵检查靠后
- 并行独立作业削墙钟时间，只在有依赖处串行
- 临时预览环境捕集成 bug
- 分支保护强制必需检查（含 Sonar/Snyk 外部状态），禁止绕过合并

---

### 68. CI 中缓存依赖

**频率：** 中

**题目：** 你们 CI 每次构建都要花 6 分钟重新下载依赖。有人为了提速直接缓存了 `node_modules`，结果换了一批新 runner（不同 OS/架构）后，构建开始报诡异的原生模块段错误。请说明怎么在 CI 中正确缓存依赖、缓存键怎么设，以及为何该缓存 package store 而不是 `node_modules`。

**这是什么 & 为什么用它：** CI 缓存依赖是把**重新下载/重建昂贵的东西**存下来跨构建复用，以省掉本案例那 6 分钟。**缓存什么：** **包管理器下载存储**——`~/.npm`、`~/.m2`（Maven）、**Go module cache**、**pip wheel**——以及 **Docker 构建层**。

**落地这个案例：** **以 lockfile 哈希为缓存键。** 缓存键应为 **lockfile**（`package-lock.json`、`go.sum`、`poetry.lock`）的哈希。于是缓存在运行**开始时恢复**、**结束时保存**，且**依赖变时自动失效**（lockfile 改 → 新哈希 → 新缓存）但**不变时复用**——恰好的行为。依赖不变 = 瞬时恢复；变了 = 重建。

**机制：** **GitHub Actions `actions/cache`**（或内置 `setup-*` 缓存）、**GitLab `cache:` 块**，对 Docker 用 **BuildKit cache mount**（`RUN --mount=type=cache,target=/root/.npm`），它即使安装层失效也能*跨构建*持久化 package store——适合编译器/包缓存。

**为何缓存上游 package store 而非 `node_modules`（本案例段错误的根因）：** `node_modules`（及同类）可含**平台特定的编译二进制**（为特定 OS/arch/libc 构的原生插件）。缓存它并在**不同 runner OS/架构**上恢复会恢出**不兼容的二进制**——正是本案例换 runner 后原生模块段错误的原因，微妙难调。**package store（`~/.npm`）**持**可移植的下载 tarball**，故缓存*那个*（快——无网络）并**新跑 `npm ci`** 为当前环境正确构 `node_modules`。既得跳过下载的速度，又无跨环境运编译产物的脆弱。

**部分命中的回退 restore-keys：** 配 **`restore-keys`**（前缀匹配回退），使精确 lockfile-哈希键未命中（依赖变）时，CI 仍能**恢复*最近*的旧缓存**且只下*增量*——远快于冷缓存。缓存未命中从"下载全部"变成"更新几个包"。

**怎么排查/定位/修复：**
1. 立刻止血本案例段错误：停止缓存 `node_modules`，改缓存 `~/.npm`，key 用 `hashFiles('**/package-lock.json')`，安装步骤用 `npm ci`（干净、可复现地按 lockfile 装）。
2. 配缓存（GitHub Actions 示例）：`actions/cache` 的 `path: ~/.npm`、`key: npm-${{ hashFiles('package-lock.json') }}`、`restore-keys: npm-`，或直接用 `setup-node` 的内置 `cache: npm`。
3. 加 restore-keys 回退让部分命中生效，lockfile 微调时只下增量而非冷缓存全下。
4. 原生模块跨平台：确保缓存键或安装环境包含 OS/架构维度，避免不同 runner 复用不兼容产物。
5. Docker 构建慢：用 BuildKit cache mount 持久化 `~/.npm`、`~/.m2` 等，即使前面的层失效也能复用包缓存。

**面试常追问 / 权衡：** 缓存 package store（可移植 tarball）+ lockfile 哈希做 key + restore-keys 回退，别缓存含平台编译二进制的 `node_modules`。Docker 用 BuildKit cache mount。权衡：缓存太粗（不含 OS/arch）会跨环境出诡异二进制 bug；key 太松（不含 lockfile）会用到过期依赖，太严则永远 miss。核心是"缓存可移植下载、每次为当前环境重建产物"。

**要点：**
- 按 lockfile 哈希为缓存键，配 restore-keys 做部分命中
- 缓存 package store（`~/.npm`），不是 node_modules（含平台二进制）
- 安装用 `npm ci` 为当前环境重建产物
- Docker 用 BuildKit cache mount 做包/编译器缓存

---

### 69. 制品管理

**频率：** 中

**题目：** 你们每个环境（dev/staging/prod）都各自从源码重新构建一次镜像。一次 staging 测得好好的版本上了 prod 却崩了——排查发现两次构建之间某个基础镜像的 `latest` 悄悄更新了，prod 跑的字节和 staging 验证的根本不是同一个。请解释制品管理（Artifactory、Nexus）和"晋升而非重建"怎么根治这个问题。

**这是什么 & 为什么用它：** **制品仓库**（**JFrog Artifactory、Sonatype Nexus、GitHub Packages、AWS CodeArtifact**）是你**构建二进制**的中心存储——Java **jar**、Python **wheel**、**npm** 包、**OCI** 容器镜像、**Helm chart** 等。它坐在你的构建与依赖之间，让"构建一次、到处晋升"成为可能——正好治本案例"每环境各建一次导致漂移"的病。

**落地这个案例：** **好处：**
- **镜像/缓存上游 registry**——作为公共 registry（npmjs、Maven Central、Docker Hub）的**透传代理**。构建从本地镜像拉依赖，**避上游限流和故障**、**加快构建**（本地/缓存），并在**物理隔离**环境工作。
- **不可变发布仓**——发布版本一旦发布就**不可覆盖**，保证 `v1.4.2` 总是同一字节（可重现、供应链完整性）——本案例基础镜像 `latest` 漂移就该用钉死的不可变版本消除。
- **漏洞扫描**——对存储制品扫 CVE。
- **地理复制**——跨区复制制品，分布团队/集群本地拉。

**晋升而非重建——核心实践（本案例的解法）：** 构建制品**一次**，然后把**同一制品**在仓库/阶段间**晋升**：**snapshot → release → prod**（或 dev → staging → prod）。**不**为每环境重建。为何：**重建有漂移风险**——两次构建间可能潜入不同依赖版本、基础镜像或工具链（正是本案例 `latest` 悄悄变了），于是"staging 测的"不等于"prod 跑的"。晋升已测的同一制品保证**你验证的字节就是上线的字节**。晋升只是把制品移/标到下一仓，便宜安全。

**保留与清理策略：** 制品积累很快（每次 CI 构建都出 snapshot），故配**保留规则**——留最后 N 个 snapshot、留所有 release、自删旧/无引用制品——控制存储成本而不丢你需要重现或回滚的任何东西。

**怎么排查/定位/修复：**
1. 定位本案例漂移：对比 staging 与 prod 跑的镜像 digest（`docker inspect` / `kubectl get pod -o jsonpath` 里的 `@sha256:`）——不同就证明是各自重建导致的漂移。
2. 改成晋升：CI 构建一次镜像，按 **commit SHA / 不可变 tag** 推到制品仓，staging 和 prod 都拉**同一个 digest**，晋升只是打标/移仓，不重建。
3. 钉死依赖：基础镜像用 `@sha256:` digest 或固定版本，别用 `latest`；配透传代理仓缓存上游避免限流/漂移。
4. 部署引用 digest 而非可变 tag，保证"验证的字节 = 上线的字节"，回滚也回到确切 digest。
5. 配保留规则控制存储：留所有 release、留最近 N 个 snapshot、自动清理无引用制品。

**面试常追问 / 权衡：** 制品仓提供上游镜像缓存、不可变发布仓、漏洞扫描、地理复制。核心实践是晋升而非重建——构建一次、同一制品 dev→staging→prod 晋升，消除工具链/依赖/基础镜像漂移，保证验证字节即上线字节。权衡：需要纪律用不可变 tag/digest 而非 `latest`，需配保留策略平衡存储成本与回滚/复现需求。

**要点：**
- 镜像上游 registry，避限流/故障、可离线
- 晋升同一制品、不要每环境重建（消除漂移）
- 不可变发布仓 + 用 digest/固定 tag，别用 latest
- 保留 + 清理策略平衡成本与回滚需求

---

### 70. CI 中无泄漏的密钥

**频率：** 中

**题目：** 一次事故复盘发现你们的 AWS access key 泄漏了：一个 PR 里的调试脚本用 `set -x` 包住了带认证的 curl，把整个 token 打进了公开的 CI 日志；而这对 key 还是长寿的、被所有作业共享。请说明怎么在 CI 中处理密钥不泄漏、为何偏好 OIDC，以及怎么防住这类日志泄漏。

**这是什么 & 为什么用它：** CI 密钥管理要多层防护，因为 CI 是**首要泄漏目标**（它能访问一切并跑不可信的 PR 代码）——本案例正是"长寿共享 key + 日志回显"两个经典失误叠加。

**落地这个案例：**

1. **用平台的加密密钥库——绝不用 repo 文件。** 密钥放 **GitHub Actions Secrets、GitLab CI variables 或 Vault**——静态加密、运行时注入、从不提交。**绝不**把凭证放 repo（即使"临时"、即使私有 repo——git 历史永存，fork/clone 会扩散）。
2. **在日志中遮蔽密钥并禁止 dump（本案例日志泄漏的直接教训）。** 平台**自动遮蔽已知密钥值**（替为 `***`）。但你还必须**禁止打印环境**（`env`、`printenv`）或开启 shell trace（`set -x`），它们会**回显遮蔽器不知道的密钥**（如运行时派生的密钥）。一个包住带 auth header 的 curl 的 `set -x` 就能把 token 泄入公开日志——正是本案例发生的事。
3. **偏好 OIDC 联合而非长寿云密钥（本案例根治手段）。** 不存长寿 AWS access key，而用 **OIDC**：CI 平台发**短寿、签名的工作流 token**，云提供商（通过信任策略）**交换为限定角色的临时云凭证**。好处：**压根没长寿密钥可泄**、凭证**几分钟内过期**、访问**按工作流/repo/分支作用域**。同 pod 的 IRSA 思想——短寿、联合、无静态密钥。即便再发生日志泄漏，泄的也是几分钟就作废的临时凭证。
4. **把密钥访问作用域到只给需要的作业/环境。** 不把每个密钥暴给每个作业（本案例"所有作业共享"就违反了这条）。用**环境作用域的密钥**（如 prod 密钥只给 prod-deploy 作业，受环境保护规则门控），使被入侵或恶意的构建步骤摸不到无关凭证——CI 的最小权限。

**怎么排查/定位/修复：**
1. 立即止血本案例：轮换/吊销那对泄漏的 AWS key，审计 CloudTrail 看有没有被滥用，删除含 token 的日志。
2. 根治：改用 OIDC——在云侧建信任 CI OIDC provider 的角色（信任策略限定 repo/分支），CI 里用 `aws-actions/configure-aws-credentials` 之类无密钥地拿临时凭证，删掉所有长寿 access key。
3. 防日志回显：审查脚本禁止 `set -x` 包认证命令、禁止 `env`/`printenv` dump，运行时派生的密钥用平台 `add-mask` 主动遮蔽。
4. 收敛作用域：把密钥改成环境作用域（prod 密钥只给 prod 作业 + 环境保护规则/审批），最小权限。
5. 加扫描兜底：CI 里跑 gitleaks/trufflehog 扫提交和日志，PR 阶段就拦截意外提交的凭证。

**面试常追问 / 权衡：** 四层——加密密钥库（不进 repo）、日志遮蔽 + 禁 `env`/`set -x`、OIDC 联合（短寿、限定角色、无长寿密钥）、按作业/环境作用域最小权限。OIDC 优于长寿密钥的关键：没有长寿密钥可泄、几分钟过期、按 repo/分支作用域，同 IRSA 思想。陷阱：自动遮蔽只认已知密钥值，运行时派生的密钥被 `set -x` 照样泄；私有 repo 也不能放凭证（历史永存）。

**要点：**
- 加密密钥库，绝不放 repo 文件（历史永存）
- OIDC 到云胜过长期密钥（短寿、限定角色、无静态密钥）
- 遮蔽 + 禁 `env`/`set -x`，运行时密钥主动 add-mask
- 按作业/环境作用域最小权限，泄漏后立即轮换吊销

---

### 71. 环境晋升

**频率：** 中

**题目：** 你们上线流程是"每个环境各触发一次 CI 从 main 构建"，结果 staging 灰度一周好好的功能推到 prod 当晚就 500 频发。查下来 staging 构建时锁的依赖版本和 prod 那次构建拉到的不一样，两个环境跑的根本不是一份东西。请解释环境晋升（同制品晋升）怎么根治这问题、prod 门怎么设、配置怎么管。

**这是什么 & 为什么用它：** **环境晋升**就是把**同一构建制品**沿 **dev → staging → prod** 一路搬，环境之间**只有*配置*不同**、制品字节不变——你构并测的镜像就是最终在 prod 跑的那份，直接消除本案例"每环境各建一次"引入的漂移。

**落地这个案例：**
- **为何绝不每环境重建：** 分别重建就有**漂移**风险——两次构建间某依赖、基础镜像或工具链版本可能悄悄变（正是本案例的病根），于是"staging 测的"不是"prod 跑的"。构建**一次**、晋升**同一制品**保证上线的恰是你验证的。
- **配置外置：** 环境只在**配置**（DB URL、特性开关、资源尺寸、副本数）上差异——由 ConfigMap/Secret/env 注入，**绝不烤进制品**。跨环境保持**配置 schema 一致**（同键、同结构），只有**值**按环境不同，防"staging 能跑、prod 缺配崩溃"。
- **GitOps 下晋升 = 一个 PR：** Git 是真相源，晋升就是一个**更新目标环境 overlay 里 image tag/digest** 的 PR——如把 prod Kustomize overlay 的 `image: myapp@sha256:...` 推上去。GitOps 控制器随后把 prod 调和到新版，晋升可审计（评审过的提交），回滚是 `git revert`。
- **prod 加更强门控：** dev/staging 可自动晋升，prod 得额外门——**手动批准**（必需评审者签字）+ **canary 推出** + 部署后**烟雾测试**。GitHub Actions 的 **Environments** 提供 prod 环境上的**保护规则、必需评审者、等待计时**，未批准无法推进。

**怎么排查/定位/修复：**
1. 证实本案例是漂移：对比 staging 与 prod 实际跑的镜像 `@sha256:` digest（`kubectl get pod -o jsonpath` 或 `docker inspect`），digest 不同就是各自重建导致。
2. 改成晋升：CI 只构一次镜像、按 commit SHA/不可变 tag 推仓，staging 和 prod 拉**同一 digest**，晋升只打标/移仓不重建。
3. 核对配置形状：对比两环境 ConfigMap/Secret 的键集合，缺键就是"prod 缺配"根因，补齐并统一 schema，值按环境注入。
4. prod 上门：把 prod 部署改为 GitHub Environments 保护规则 + 必需评审者，配 canary + 烟雾测试自动检查。
5. 回滚演练：确认 `git revert` overlay 就能让控制器把 prod 调回上一个 digest。

**面试常追问 / 权衡：** 核心是同制品晋升——一个制品、多环境、只有配置不同，消除工具链/依赖/基础镜像漂移。GitOps 下晋升是 PR、可审计、`git revert` 回滚。prod 需手动批准 + canary + 烟雾测试门控。配置 schema 跨环境一致、只变值。权衡：晋升需纪律用不可变 tag/digest、把配置彻底外置，否则漂移和"缺配崩溃"照样发生。

**要点：**
- 一个制品、多个环境，只有配置不同
- 通过 PR 到环境 overlay 晋升、可审计、git revert 回滚
- prod 手动批准门 + canary + 烟雾测试
- 同配置 schema、不同值，配置外置不烤进制品

---

### 72. CD 中的数据库迁移（扩展/收缩）

**频率：** 中

**题目：** 一次发布里开发把 `user.email` 列重命名成 `user.email_address`，迁移和新版应用一起上，滚动部署刚推到一半，监控就爆出旧 pod 大量 `column "email" does not exist` 报错，部署中途整个服务半死不活。请解释扩展/收缩（并行变更）怎么让 schema 演进在滚动部署下零停机。

**这是什么 & 为什么用它：** **滚动部署**期间**新旧应用版本会同时运行一段时间**（pod 逐渐替换），两版本**同时打同一数据库**。所以**向后不兼容迁移必出事**（本案例正是如此）：一改名/删列，仍在跑的旧 pod 立刻报错。你**无法**把破坏性 schema 变更和滚动部署做成原子的——**扩展/收缩**就是为此而生，让每步都向后兼容。

**落地这个案例：** 本案例正确做法不是"改名+同时发版"，而是把它拆成让每个 schema 变更**跨至少一个应用版本向后兼容**的多步：

1. **扩展——加新列/表**（*纯加性*、向后兼容）。先只 `ALTER TABLE ADD COLUMN email_address`，旧应用忽略它，无事。
2. **部署双写应用**——新版**同写两边**（`email` 和 `email_address`），仍读旧列 `email`。新数据落两处，读旧的旧 pod 仍工作。
3. **回填**——跑作业 `UPDATE ... SET email_address = email WHERE email_address IS NULL`（分批），让新列对历史行也完整。
4. **部署只读新列的应用**——新列已满（回填+双写），切读到 `email_address`，旧列 `email` 还在但没人读。
5. **收缩——删旧列**——仅在所有运行版本都不再引用 `email` *之后*，`ALTER TABLE DROP COLUMN email` 才安全。

**怎么排查/定位/修复：**
1. 止血本案例：立即回滚应用到旧版本（旧列还在，回滚可用），别急着回滚迁移。
2. 复盘根因：确认破坏性迁移（改名/删列/加 NOT NULL 无默认）和应用发版被打包进了同一次滚动部署。
3. 改造成扩展/收缩：把改名拆成"加新列 → 双写 → 回填 → 切读 → 删旧列"五步，加性迁移排在应用部署*前*，删列排在完全推出*后*。
4. 回填要分批 + 限速，避免长事务锁表把线上打挂；用 `pg_stat_activity` 盯锁和慢查询。
5. 加防线：CI 里对迁移做向后兼容检查（如禁止在同一 PR 里删列 + 改应用），保证"当前运行版本永远能容忍新 schema"。

**面试常追问 / 权衡：** 核心铁律——**绝不做当前运行版本无法容忍的 schema 变更**，每步向后兼容，新旧 pod 无时因 schema 冲突。顺序：加性迁移在应用部署*前*，破坏性收缩在完全推出*后*，读新列前必须先回填。权衡：步骤多、部署多、周期长，但这是滚动部署下零停机演进 schema 的唯一途径；回填要分批限速防锁表。

**要点：**
- 迁移先于应用部署，删列在完全推出后
- 应用必须能处理新旧 schema（双写过渡）
- 读新前先回填，且分批限速防锁表
- 铁律：绝不做当前运行版本无法容忍的变更

---

### 73. 特性开关

**频率：** 中

**题目：** 新推荐算法上线，10 分钟后延迟飙升、首页大面积超时。但要回滚就得走一遍完整的 CI/CD 重建 + 滚动部署，至少 20 分钟，这期间用户一直在受影响。事后老板问："能不能出问题时一秒把新功能关掉、而且下次上新代码不用等它做完再发？"请解释特性开关怎么做到部署与发布解耦。

**这是什么 & 为什么用它：** **特性开关**是运行时开关，把***部署*代码和*发布*特性给用户解耦**。新代码可以**"暗着"**发到生产（部署但禁用），再**独立打开**——按**用户、群组或百分比**——通过**开关服务**（**LaunchDarkly、Unleash、Flagsmith**）而无需重部。本案例的痛点（回滚要重建 20 分钟）正是因为部署和发布被绑死了。

**落地这个案例：**
- **即时 kill switch（本案例的解法）：** 新推荐算法出问题，**秒内关开关**——无重建、无重部、无 20 分钟回滚，用户立刻回到旧路径。这是极有价值的安全网。
- **渐进推出：** 本该把新算法 **1% → 10% → 50% → 100%** 坡升并盯延迟/错误率指标——与基础设施无关的代码级 canary，10 分钟的爆炸半径本可只波及 1% 用户。
- **主干开发：** 开发者把未完成特性放在*关*的开关后合入 `main`，工作持续集成、无长命分支，未完代码安全（暗）上线而非阻塞发布——这是"下次上新代码不用等它做完"的答案，也是主干 + 持续部署的关键使能。
- **A/B 测试/实验：** 给随机 % 用户启变体并测影响，靠开关服务定向群组。

**怎么排查/定位/修复：**
1. 止血本案例：直接在开关服务把新推荐算法开关关到 0%，几秒内全量用户回旧路径，无需重部。
2. 缩小爆炸半径：改成先对 1% 内部/beta 群组开，观察 Grafana 上延迟和错误率再逐步坡升。
3. 定位是不是开关本身的坑：查是否踩了**开关组合爆炸**——多个开关叠加出意外状态，用开关服务的审计日志看哪些开关同时开着。
4. 收尾卫生：算法稳定全量后，**删掉开关和死分支**，别让 `if flag ... else ...` 长期留存。
5. 建流程：给每个开关登记 owner、存在理由、预期删除时间，定期扫陈旧开关。

**面试常追问 / 权衡：** 核心是部署 ≠ 发布，带来 kill switch、渐进推出、主干开发、A/B 实验。**开关卫生是关键纪律**：开关是**债**，每个开关加一个代码分支且**组合爆炸**（N 个开关最多 2^N 状态、不可测），陈旧开关造成代码腐烂、困惑和意外组合 bug。所以要跟踪每个开关的生命周期（谁拥有、为何存在、何时删），特性完全推出或废弃后**无情删除开关和死分支**——把清理当必需后续工作，非可选。

**要点：**
- 部署 ≠ 发布，暗发 + 独立打开
- 百分比 / 群组定向做渐进推出
- 无需重部署的秒级 kill switch
- 无情退役陈旧开关，防组合爆炸与代码腐烂

---

### 74. Terraform 模块与 workspace

**频率：** 中

**题目：** 你们用 Terraform workspace 区分 dev/staging/prod，共用一套 `.tf`。某天一位工程师本想在 staging 加个测试实例，`terraform apply` 一把下去才发现当前 workspace 是 `prod`——命令行里根本看不到自己在哪个 workspace，直接改了生产。请解释模块与 workspace，以及为何很多团队偏好"每环境一目录"来避免这种事。

**这是什么 & 为什么用它：** **模块**是 Terraform 的**可复用积木**（相关资源藏在一个输入/输出接口后），**workspace** 是**单一配置内隔离的 state 实例**。本案例的坑就是 workspace 被拿来当环境隔离用——共享代码和后端、只靠不可见的 workspace 名区分，太容易对错环境 apply。

**落地这个案例：**
- **模块：** 一个 **`vpc` 模块**取 **CIDR 变量**，创建 VPC、子网、路由表、NAT 网关，输出子网 ID——每环境/项目调同一个已测模块，而非复制粘贴资源块。**来源**可为本地路径（`./modules/vpc`）、Git（`git::https://...`）或公共/私有 Terraform Registry。**总钉模块版本**（`version = "3.2.1"`）——未钉模块可能在 `init` 时情变而破或意外改基础设施。
- **workspace 及其误用（本案例根因）：** `terraform workspace new prod` 给你独立 state 文件而复用同套 `.tf`，`terraform.workspace` 让代码按当前 workspace 分支。它*能*建模 dev/staging/prod，但**易被误用**：环境**共享同套代码和后端**，只靠插值的 workspace 名区分，而且**危险地容易对错 workspace 跑 `apply`**（当前 workspace 在命令中不可见——正是本案例），还让每环境差异别扭（条件散布代码中）。
- **每环境一目录（推荐做法）：** `envs/prod/`、`envs/staging/` 各有 `main.tf` 调共享模块、各有后端/state。它给**显式物理分离**：你确实 `cd envs/prod` 才碰 prod；每环境**自己的 state 和后端**（staging 的错碰不到 prod state）；配置**在文件里可见**而非藏在 `terraform.workspace` 条件后；代码评审清楚显示变更影响*哪个环境*。清晰和爆炸半径隔离胜过轻微重复。

**怎么排查/定位/修复：**
1. 先确认现状：`terraform workspace show` 看当前在哪，`terraform workspace list` 看全部——本案例就是没人先跑这个。
2. 评估误伤：`terraform plan` 看 prod 上被改了什么，若已 apply，从 state（`terraform state list`）和云控制台核对实际改动，必要时回退。
3. 结构性根治：把 workspace 方案改成每环境一目录（`envs/prod`、`envs/staging`），各自独立后端 + state，`cd` 进去才能操作对应环境。
4. 钉死模块版本：所有 `module` 块加 `version = "x.y.z"`，避免 `init` 时上游模块漂移。
5. 加防呆：CI 流水线限定只在对应目录/分支 apply 对应环境，prod 加人工审批门。

**面试常追问 / 权衡：** 模块 = 可复用积木、务必钉版本；workspace = state 隔离但共享代码/后端、易对错环境 apply。每环境一目录给显式分离、独立 state/后端、配置可见、评审清晰，是常见生产模式；workspace 更适合保留给轻量、几乎相同的并行实例。权衡：每环境一目录有轻微代码重复，但换来的清晰和爆炸半径隔离通常更值。

**要点：**
- 模块 = 可复用积木，务必钉版本
- Workspace = state 隔离，但当前 workspace 不可见易误 apply
- 每环境一目录：独立 state/后端、配置可见、评审清晰
- workspace 留给轻量、几乎相同的并行实例

---

### 75. terraform plan 评审纪律

**频率：** 中

**题目：** 一位工程师只是想给 RDS 数据库改个参数组，`terraform apply` 敲完直接回车确认，结果那次 plan 里悄悄带着 `forces replacement`——Terraform 把生产数据库销毁重建，数据没了、停机几小时。复盘定论是"没人认真读 plan"。请说明 apply 前评审 `terraform plan` 的纪律。

**这是什么 & 为什么用它：** `terraform plan` 在你改动前**准确显示将变什么**——它存在的意义就是让你**仔细评审**，apply 永不给你惊喜。本案例的灾难完全可以在读 plan 时就拦下，前提是团队有评审纪律。

**落地这个案例：**

1. **读完整 plan，数 create/update/destroy。** 摘要 `Plan: X to add, Y to change, Z to destroy` 是第一道理智检查。你只想改一个参数，plan 却要 **destroy 1 + add 1**（重建），就该停下——本案例正是没做这步。别扫读，读真正在变的。
2. **审视每个 destroy 的爆炸半径，盯 `forces replacement`。** 尤其留意**关键有状态资源**上的 **`# forces replacement`** 注解——某些属性变更（DB 引擎参数、AZ、名字）迫使 Terraform**销毁并重建**。在**数据库**上意味**数据丢失 + 停机**（本案例），在**负载均衡器**上意味新端点/断连。在评审中而非 apply 后抓到 DB 上的 `forces replacement` 就避免灾难。也查**敏感值意外变动**。
3. **把 plan 贴到 PR，破坏性 plan 需批准。** 用 **Atlantis**（或 `tf`-action 类工具）**自动跑 `plan` 并把输出贴成 PR 评论**，评审者作为代码评审看到确切拟议变更，带 destroy 的 plan 能 apply 前**要求显式批准**——阻止一人单方面销毁 prod。
4. **用保存的 plan 文件精确 apply。** `terraform plan -out=plan.tfplan` 再 `terraform apply plan.tfplan`，apply **保存的 plan** 而非重新 plan，保证 apply **恰是评审过的**，无 plan 与 apply 间的漂移或 state 变更悄悄改结果。

**怎么排查/定位/修复：**
1. 事前拦截本案例：apply 前先看摘要行，`destroy` 数 > 0 且你没打算删任何东西，立即停手调查。
2. 定位重建来源：在 plan 里搜 `forces replacement`，看是哪个属性触发；确认后改用可原地更新的方式（如某些参数走 `apply_immediately` 或独立参数组资源）避免重建。
3. 保护有状态资源：给数据库等加 `lifecycle { prevent_destroy = true }`，让任何销毁企图在 plan 阶段直接报错。
4. 流程化：接入 Atlantis 自动 plan 到 PR，带 destroy 的变更强制审批，禁止本地直接 `apply`。
5. 执行一致性：CI 里用 `plan -out` 保存再 apply 该文件，杜绝评审与执行之间的漂移。

**面试常追问 / 权衡：** 四条纪律——读每行 destroy 并数 create/update/destroy；`forces replacement` = 停机/数据丢失风险，重点盯有状态资源；通过 Atlantis 在 PR 中 plan 并对破坏性变更要审批；apply 保存的 plan 避免漂移。加固手段：`prevent_destroy` 生命周期。权衡：保存 plan + PR 审批增加流程开销，但换来的是可评审、可追责、不再一人误删 prod。

**要点：**
- 读每行 destroy，数 create/update/destroy
- `forces replacement` = 停机/数据丢失风险，有状态资源加 prevent_destroy
- 通过 Atlantis 在 PR 中 plan，破坏性变更需审批
- Apply 保存的 plan 避免评审与执行间漂移

---

### 76. 不可变 vs 可变基础设施

**频率：** 中

**题目：** 你们一组 5 台 EC2 靠人手 SSH 上去打补丁、改配置维护。生产出问题，排查发现只有其中 1 台崩——因为几个月前有人在那台上手动装了个包又忘了同步，别的机器没有。谁也说不清每台到底装了什么，想照样重建一台丢失的机器几乎不可能。请对比不可变与可变基础设施，说明不可变怎么根治这种"雪花"。

**这是什么 & 为什么用它：** 这是两种改变运行中服务器的哲学。**可变基础设施**原地改机器（SSH 进去或跑 Ansible/Chef/Puppet 打补丁、改配置、部代码）；**不可变基础设施**从不改运行中的服务器，任何变更都构建全新镜像再替换实例。本案例的"A 机器行、B 机器崩、没人能重现"正是可变基础设施的典型病——漂移和雪花服务器。

**落地这个案例：**
- **可变的病根（本案例）：** 随时间累积的手动修补、失败的部分更新、一次性微调，使**每台服务器变得微妙独特且无文档**——无人能可靠重现的"雪花"。两台本应相同的机器不同，造成"A 行 B 崩"的谜团，精确重建丢失的机器几乎不可能。
- **不可变的解法：** 对*任何*变更（新代码、补丁、配置微调），**构建全新镜像**（容器镜像、AMI、VM 镜像）把变更烤进去，再**替换**实例——从新镜像起新的、切流量、拆旧的。运行中的服务器**只读、可弃、与镜像相同**。好处：
  - **无漂移**——每实例恰是其镜像，启动后不变，机器保持可重现且相同（本案例的雪花直接消失）。
  - **回滚易**——坏变更就**重部前一镜像**，回滚只是"跑旧制品"，干净快捷（同蓝绿思想）。
  - **契合自动扩缩容**——实例相同可弃，扩缩器自由从镜像创建/销毁。
- **它要求：** **快速镜像构建**（每次变更都构镜像，慢构建伤人）+ **滚动部署自动化**（零停机替换实例）。**容器是经典的不可变单元**——镜像构造上不可变，Kubernetes 替换（从不打补丁）pod，这就是容器生态默认体现不可变的原因。非容器世界用 **Packer** 构不可变 VM 镜像/AMI。

**怎么排查/定位/修复：**
1. 定位本案例漂移：不要再逐台 SSH 猜，直接对比各机器的包清单/配置（`rpm -qa`/`dpkg -l`、配置文件 checksum），差异就是雪花证据。
2. 止血：先把出问题的那台从负载均衡摘下，用已知良好镜像/模板重建一台顶上，而不是继续手动修补。
3. 根治：把机器构建流程化——用 Packer 烤 AMI 或改容器镜像，所有变更走"改镜像 → 构建 → 替换"，禁止生产机器 SSH 改动。
4. 上滚动替换：新镜像出来后用 ASG 滚动替换或 K8s 滚动更新，零停机换掉全部旧实例。
5. 防复发：关掉生产的交互式 SSH 权限（或只读），任何"临时改一下"都必须回到镜像/IaC，杜绝漂移重新累积。

**面试常追问 / 权衡：** 可变 → 漂移 + 雪花 + 难重现；不可变 → 替换、永不打补丁、无漂移、回滚即重部旧镜像、契合自动扩缩容。容器天然不可变，Packer 服务非容器场景。权衡：不可变要求快速镜像构建和滚动部署自动化（慢构建很痛），且每次小改都要构建替换整台——但换来可重现性和干净回滚。

**要点：**
- 可变 → 漂移 + 雪花，难重现
- 不可变 → 替换、永不打补丁、无漂移
- 快速镜像构建 + 滚动替换自动化必备
- 回滚 = 重部前一镜像；容器天然不可变，非容器用 Packer

---

### 77. 安全组 vs NACL（AWS）

**频率：** 中

**题目：** 你在子网 NACL 上加了条规则允许入站 8080 让新服务能被访问，测试却发现连接一直卡住、握手不完成；而同样在安全组上开 8080 就立刻通。另外安全团队还发现一台被入侵的实例正往外网一个陌生 IP 狂发流量。请对比安全组与 NACL，解释这两个现象。

**这是什么 & 为什么用它：** 二者是 AWS 两个不同层的防火墙，关键区别是**有状态/无状态**。**安全组（SG）**是**有状态、实例级**防火墙；**NACL**是**无状态、子网级**控制。本案例"NACL 只开入站就卡住、SG 开入站就通"正是有状态与无状态的直接体现。

**落地这个案例：**
- **安全组（为何 SG 开 8080 就通）：** 附到 ENI/实例，**只有 allow 规则**（未 allow 的隐式拒绝）。**有状态**意味 allow 了某端口**入站**，**返回流量自动放行**出去——你不用为响应写规则。所以只声明"allow 入站 8080"回复就自动流回。SG 是日常**主要工具**，可引用*其他安全组*作源（"allow 从 app 层 SG"）。
- **NACL（为何只开入站会卡住——本案例现象）：** 附到子网、作用于进出所有流量，支持 **allow 与 deny 规则**（按编号顺序求值）。**无状态**意味**无自动返回流量**——你 allow 了入站 8080，还必须**单独 allow 出站临时端口（1024-65535）的返回流量**，否则响应出不去、连接卡住。这正是本案例的坑，也是 NACL 更繁琐的地方（两个方向都要手动管）。
- **出站失控（本案例被入侵实例外泄）：** 人们常锁死入站却把**出站大开（0.0.0.0/0 全端口）**，被入侵的实例就能自由**外泄数据或呼叫 C2 服务器**——正是安全团队看到的现象。把出站限到工作负载合法所需的目的地是重要却常被跳过的加固。

**怎么排查/定位/修复：**
1. 定位本案例卡连接：确认 NACL 无状态——检查该子网 NACL 是否只加了入站 8080 而漏了出站临时端口范围（1024-65535），补上出站 allow 即通。
2. 用工具确认拦在哪层：跑 **VPC Reachability Analyzer** 或看 **VPC Flow Logs** 的 `REJECT` 记录，判断是 SG 还是 NACL 丢的包。
3. 处置被入侵实例：先把它隔离（换到只出必要目的地的 SG），审 Flow Logs 看外泄目标 IP/端口，再取证。
4. 收紧出站：把实例 SG 的出站从 `0.0.0.0/0` 全端口改为只允许工作负载合法所需目的地（如特定 DB、更新源），堵住数据外泄/C2 通道。
5. 分层防御：日常访问控制用 SG（细粒度、可引用），在子网 NACL 上用 **deny** 兜底封已知恶意 IP 段。

**面试常追问 / 权衡：** SG 有状态、实例级、仅 allow、可引用其他 SG，是主要工具；NACL 无状态、子网级、allow + deny、按编号求值，是粗的第二层，主要价值是 SG 没有的 **deny** 能力（封 IP 段/兜底）。纵深防御 = 每实例 SG + 每子网 NACL。生产实践：默认拒入、只开所需，且**收紧出站**别只管入站。陷阱：NACL 无状态必须两个方向都开，否则连接卡住。

**要点：**
- SG：有状态、实例级、仅 allow、可引用其他 SG
- NACL：无状态、子网级、allow + deny，两个方向都要开
- SG 优先做访问控制，NACL 次要用 deny 兜底
- 收紧出站不只管入站，防被入侵实例外泄/C2

---

### 78. 服务发现

**频率：** 中

**题目：** 一次自动扩缩把几个后端实例回收了，之后大约两三分钟内，前端仍有一批请求打到已经不存在的旧实例 IP 上、连接超时。查下来是服务地址靠一个 TTL 300 秒的 DNS 记录解析，实例都死了客户端还缓存着旧 IP。请解释服务发现的几种方式，以及为何健康感知的注册胜过静态 DNS。

**这是什么 & 为什么用它：** **服务发现**在实例不断来去（自动扩缩、部署、故障）的动态环境中回答"服务 X 现在在哪"。手动硬编码 IP 行不通——它们会变。本案例"实例死了客户端还打旧 IP"正是纯 DNS + TTL 缓存的经典弱点。

**落地这个案例：**
- **1. 基于 DNS 的发现（本案例用的、也是坑所在）：** 服务通过解析到当前 IP 的 **DNS 名**互相找到：**Route53 私有托管区**、**CoreDNS**（K8s 中）、**Consul DNS**。简单通用，但纯 DNS 有弱点——**TTL 缓存**意味实例死后客户端可能缓存陈旧 IP（本案例 TTL 300s 就是那两三分钟窗口），且基础 DNS 不管目标真健康与否都返回记录。
- **2. 基于注册的发现（解法）：** 专门的**服务注册表**（**Consul、Netflix Eureka、AWS Cloud Map**），**服务启动时自注册**并通过心跳持续报**健康**。客户端/sidecar 向注册表查*当前健康*的实例，注册表主动**移除不健康/死实例**，你永不被路到宕节点。
- **3. Kubernetes 自动发现：** **Service** 提供稳定虚拟 IP + DNS 名，**CoreDNS** 自动解析 `my-svc.my-namespace.svc.cluster.local`。Service 的 endpoint 与**健康 pod 保持同步**（readiness 探针失败的 pod 移出轮转），发现内建且开箱健康感知——本案例若在 K8s 里用 Service 就不会打到死 pod。
- **4. 跨集群/多区域：** **external-dns** 监视 K8s Service/Ingress 并**同步到云 DNS**（Route53、Cloud DNS）供外部/其他集群解析；或用**服务网格联邦**（Istio/Consul mesh 连多集群）做带 mTLS 和地域感知的跨集群路由。

**怎么排查/定位/修复：**
1. 定位本案例根因：`dig` 那个服务名看 TTL 和返回的 IP，对比实际存活实例，确认客户端缓存了已死 IP。
2. 应急缓解：把 DNS 记录 TTL 从 300s 降到很小（如 5-30s）缩短陈旧窗口，但这治标不治本。
3. 根治：换成健康感知发现——K8s 里用 Service + readiness 探针（死 pod 自动移出 endpoint），K8s 外用 Consul/Cloud Map 让实例自注册 + 心跳，客户端查当前健康实例。
4. 客户端韧性：加连接超时 + 重试到其他实例，别把单个 IP 攥死（有些语言/库会长期缓存 DNS，需关掉或缩短其 JVM/解析缓存）。
5. 跨集群场景用 external-dns 同步云 DNS 或服务网格联邦，保证解析到的都是活目标。

**面试常追问 / 权衡：** DNS 发现简单通用但受 TTL 缓存和"不看健康"之害；注册表（Consul/Eureka/Cloud Map）靠自注册 + 心跳只返回当前健康实例；K8s 的 Service + CoreDNS + readiness 探针内建健康感知；跨集群用 external-dns 或网格联邦。核心结论：**健康感知注册（或 K8s endpoint）只返回当前健康目标、故障后数秒更新**，在快变自动扩缩系统里不可或缺。权衡：注册表/网格引入额外组件和运维复杂度，纯 DNS 省事但在动态环境不可靠。

**要点：**
- k8s：Service + CoreDNS + readiness 探针
- 混合环境用 Consul/Cloud Map 自注册 + 心跳
- external-dns 同步到云 DNS，跨集群用网格联邦
- 健康感知注册胜过静态 DNS（避 TTL 缓存打死实例）

---

### 79. Grafana 仪表板与告警

**频率：** 中

**题目：** 值班同事投诉：出故障时那个"总览"Grafana 仪表板塞了 50 个面板，根本看不出到底哪儿坏了；而且仪表板全是有人在 UI 里手点出来的，上次误删一个面板再也找不回来。老板让你重整监控。请说明你如何构建 Grafana 仪表板与告警。

**这是什么 & 为什么用它：** **Grafana** 是**可视化层**——在统一 UI 里从众多数据源查询并绘图：**Prometheus**（指标）、**Loki**（日志）、**Tempo**（追踪）、**CloudWatch**、**BigQuery** 等。它自己不存数据，只渲染各后端所持的。本案例两个病——面板噪声墙 + 手点不版本化——正好对应下面两条实践。

**落地这个案例：**
- **仪表板即代码（治"误删找不回"）：** 别点选构建又不版本化，它们会漂移并丢失（本案例）。**做成代码**：导出/编写仪表板 **JSON** 提交 Git，或用 **Grafonnet**（Jsonnet 库）、**Grafana Terraform provider** 生成，让仪表板**可评审、可 diff、可重现**，变更走 PR，误删一个 `git checkout` 就回来。
- **保持仪表板小而有意图（治"50 面板看不出哪坏"）：** 别建无人读的 50 面板巨型板。目标**每服务一个聚焦仪表板**，基于成熟方法：**RED**（**Rate、Errors、Duration**——最适请求驱动服务）或 **USE**（**Utilization、Saturation、Errors**——最适 CPU、磁盘、队列等资源）。这些方法确保只展示真正重要的少数信号，故障时一眼定位而非一墙噪声。
- **模板变量：** 用 `cluster`、`namespace`、`service` 等下拉让**一个仪表板适配多个目标**，而非每环境复制一个。变量喂进 PromQL（`{namespace="$namespace"}`），给出可复用、可筛选的视图。
- **告警在哪跑：** **Grafana 统一告警**（在 Grafana 内定义规则、对任何数据源求值、经 Grafana 通知策略路由）或 **Prometheus Alertmanager**（规则在 Prometheus 定义、Alertmanager 做分组/路由/静默）。Alertmanager 是经典 Prometheus 原生路径；Grafana 统一告警在跨多个/异构数据源告警时方便。

**怎么排查/定位/修复：**
1. 重构本案例的总览板：拆成每服务一个 RED/USE 聚焦板，主板只留少量关键信号，故障时从 Rate/Errors/Duration 异常快速定位到具体服务。
2. 抢救误删风险：把现有仪表板全部导出 JSON 提交 Git（或迁到 Grafonnet/Terraform provider），以后改动走 PR，误删用版本回退。
3. 定位一次故障的实战链路：先看服务 RED 板发现 Errors/Duration 升高 → 用模板变量下钻到具体 namespace/实例 → 切 Loki 面板看该服务日志 → 切 Tempo 看慢 trace 定位调用瓶颈。
4. 告警配套：给关键 RED/USE 指标（如错误率、P99 延迟、饱和度）配告警规则，经 Alertmanager/Grafana 通知策略路由并做分组去重，避免告警风暴。
5. 收敛面板:定期清理无人看的面板，保持仪表板小而有意图。

**面试常追问 / 权衡：** Grafana 是可视化层、不存数据。四条实践：仪表板即代码（JSON/Grafonnet/Terraform provider，可评审可重现）、模板变量求复用、每服务聚焦板用 RED（rate/errors/duration，请求驱动）或 USE（utilization/saturation/errors，资源）方法、告警在 Alertmanager（Prometheus 原生）或 Grafana 统一（跨异构源）。权衡：仪表板即代码前期有学习/流程成本，但换来可评审、可 diff、抗误删。

**要点：**
- 仪表板做成代码放 Git，抗漂移抗误删
- 模板变量求复用，一板多目标
- 每服务聚焦板：RED（请求驱动）或 USE（资源）方法
- 告警在 Alertmanager（Prometheus 原生）或 Grafana 统一（跨异构源）

---

### 80. OpenTelemetry：collector、信号、传播

**频率：** 中

**题目：** 一个请求跨了 5 个微服务后偶发超时，但每个服务只在自己日志里各记各的，你没法把这一次请求在 5 个服务里的路径串起来，只能靠时间戳猜。而且当初为了接入某 APM 供应商，每个服务都塞了它的专有 agent，现在想换供应商得改一大圈。请解释 OpenTelemetry 怎么解决这两个问题。

**这是什么 & 为什么用它：** **OpenTelemetry（OTel）**是面向三大遥测信号——**trace、metric、log**——的**供应商中立标准**（规范 + SDK）。核心价值：**一个 SDK、多个后端**——对 OTel API *埋点一次*，按配置导出到*任何*兼容后端（Tempo、Jaeger、Datadog、Honeycomb…），换供应商无需重写埋点。这正好治本案例的"专有 agent 锁定"，而分布式 trace 治"5 个服务串不起来"。

**落地这个案例：**
- **上下文传播（治"串不起来"）：** 要让 trace 跨多服务，**trace 上下文必须随请求跨服务边界传递**。OTel 用 **W3C `traceparent` HTTP 头**，携 trace ID 和父 span ID，A 调 B 时 B 的 span **链入与 A 同一 trace**。这个标准头把 5 个服务的 span 缝成一条端到端分布式 trace，你就能看到这一次请求到底卡在哪一跳。
- **一个 SDK、多个后端（治"换供应商要改一圈"）：** 用 OTel SDK 埋一次，导出目标只是配置项，换 Datadog/Jaeger/Tempo 不动业务代码，打破每家 APM 自带专有 agent 的旧锁定。
- **Collector：** 应用以 **OTLP**（OTel 线协议）发遥测到 **OpenTelemetry Collector**——介于应用与后端间的独立处理管道，**接收、批处理、过滤、变换、采样**再**导出**到一个或多个后端。好处：应用只对 Collector 说 OTLP（无需后端专有配置），采样/过滤/路由/脱敏集中一处，换后端只改 Collector 配置而非应用。
- **自动 vs 手动埋点：** **自动埋点**库钩入常见框架（HTTP 服务/客户端、gRPC、DB 驱动、消息队列）**无需改代码**产 span，廉价广覆盖；**手动埋点**绕业务逻辑加**自定义 span**（"process-payment"、"render-report"）并附领域属性。典型做法：自动埋点给框架级基线，再手动给关键操作加 span。

**怎么排查/定位/修复：**
1. 让 5 个服务串起来：各服务接入 OTel 自动埋点（HTTP/gRPC 库），确认 **`traceparent` 头在每一跳被透传**（有的老网关/代理会丢自定义头，重点查这个）。
2. 定位超时那一跳：在 trace 后端按同一 trace ID 拉出这次请求的完整 span 瀑布图，看哪个服务的 span 耗时异常长，就是超时源头。
3. 下钻根因：对慢 span 手动补自定义 span + 领域属性（如订单 ID、下游依赖），把日志和 trace 用 trace ID 关联起来再看日志。
4. 控成本/隐私：在 Collector 集中配采样（尾采样保留慢/错 trace）、过滤和脱敏，别在每个应用里各配一套。
5. 去锁定：把导出目标统一收到 Collector，未来换后端只改 Collector 配置，验证新后端能收到 OTLP 数据。

**面试常追问 / 权衡：** OTel = 三信号（trace/metric/log）供应商中立标准，一个 SDK 多个后端去锁定。Collector 集中做处理/采样/路由/脱敏。W3C `traceparent` 头传播上下文缝成端到端 trace。自动埋点给基线、手动埋点补关键业务 span。权衡：全量 trace 成本高需采样（头采样简单但可能丢慢请求，尾采样能留慢/错但更重）；Collector 是额外组件但换来集中治理和应用解耦。

**要点：**
- 一个 SDK、多个后端，去 APM 供应商锁定
- Collector 集中做处理 + 采样 + 路由 + 脱敏
- W3C traceparent 头传播上下文，缝成端到端 trace
- 常见 lib 用自动埋点，关键业务补手动 span

---

### 81. 流水线扫描（Trivy、Snyk、Dependabot）

**频率：** 中

**题目：** 安全团队通知你们生产镜像里有个 Log4Shell 级别的 CVE，来自一个第三方依赖，已经在生产跑了几个月没人发现。老板要求"以后这类漏洞必须在合并前就被拦下，而且别搞得开发被一堆低危告警淹死"。请说明流水线安全扫描的各类、自动升级工具与门控策略。

**这是什么 & 为什么用它：** "安全左移"——在 CI 跑自动扫描器，让漏洞在**合并/部署前**而非生产中被抓。本案例的痛点（高危 CVE 潜伏几个月）正是缺了这层，而"别淹死开发"对应的是门控策略要克制。各类扫描覆盖整个供应链：

**落地这个案例：**
1. **SCA（软件成分分析，本案例最相关）**——扫**依赖**看已知 CVE（正是本案例那种第三方库漏洞）。多数漏洞在第三方依赖里，高价值。工具：Snyk、OWASP Dependency-Check、Trivy。
2. **SAST（静态应用安全测试）**——扫**你自己源码**看不安全模式（SQL 注入、硬编码加密、路径穿越）。工具：Semgrep、CodeQL、SonarQube。
3. **IaC 扫描**——扫**基础设施代码**（Terraform、K8s YAML、CloudFormation）看配置错（公开 S3、开放安全组、特权容器）。工具：Checkov、tfsec、Trivy。
4. **密钥扫描**——检测 repo/历史中**已提交的凭证**（API key、token、私钥）。工具：gitleaks、trufflehog。
5. **容器扫描**——扫**构好的镜像**看镜像层里 OS 包和库的 CVE。工具：Trivy、Grype。

**自动更新（治"潜伏几个月"）：** **Dependabot** 或 **Renovate** 监视依赖并**自动开 PR 把易受攻击/过时依赖升到修复版本**，修复变一键合并而非手动追踪。Renovate 更可配（分组、排期）；两者都大幅缩短你坑在已知易受攻击依赖上的窗口。

**门控——关键策略（治"别淹死开发"）：** 别对*一切*都阻（造成告警疲劳、因不可修的低危噪声阻断无关工作）。合理策略：**对有修复可用的 HIGH/CRITICAL 发现阻合并**（你能且必须行动），**其余告警不阻**（低危或尚无修复）。保持门控有意义、可行动。

**怎么排查/定位/修复：**
1. 应急处置本案例 CVE：先 SCA 扫全仓定位哪些服务引了该易受攻击版本（直接依赖还是传递依赖），确认修复版本。
2. 快速修复：让 Dependabot/Renovate 开升级 PR，或手动钉到修复版本，构镜像重扫确认 CVE 消失后走同制品晋升上线。
3. 建拦截层：CI 加 SCA + 容器扫描（Trivy），把"有修复的 HIGH/CRITICAL 阻合并"设成门，以后这类漏洞合并前就红。
4. 控噪声：门只卡可修的高危，低危/无修复的转告警不阻断，避免开发被淹（本案例老板的要求）。
5. 不遗漏：把所有扫描器输出喂入**中心漏洞追踪器**（DefectDojo 等），给去重、归属、分级的持久队列。

**面试常追问 / 权衡：** 五类扫描 SCA + SAST + IaC + 密钥 + 容器覆盖全供应链；Dependabot/Renovate 自动升级缩短暴露窗口；门控只对**可修的 HIGH/CRITICAL 阻合并**、其余告警，避免告警疲劳；发现聚合到中心追踪器（DefectDojo），否则散在 PR 评论里、合并后被遗忘。权衡：门控太严会淹死开发、阻断无关工作，太松又漏高危，关键是"有修复 + 高危"才卡。

**要点：**
- SCA + SAST + IaC + 密钥 + 容器扫描，覆盖全供应链
- Dependabot/Renovate 自动升级，缩短暴露窗口
- 只对可修的 high/critical 阻合并，其余告警防淹死
- 在中心追踪器（DefectDojo）聚合发现，防遗漏

---

### 82. AWS vs GCP vs Azure：粗略服务映射

**频率：** 中

**题目：** 管理层拍板"为了不被云厂商锁定，我们要同时支持 AWS 和 GCP，代码在哪家都能跑"。半年后团队被拖垮：两套 IAM、两套网络、两套运维工具，还维护着一层"抹平差异"的抽象，谁都嫌它难用。请给出 AWS/GCP/Azure 的粗略服务映射、解释 IAM 差异，并说说多云为何常常是"税"。

**这是什么 & 为什么用它：** 三大云在不同名字下提供大致等价的基元，概念上能互相映射——但**细节处处不同**，这正是本案例"同时支持两家"被拖垮的原因。先看映射，再看分歧最大的 IAM，最后讲为何多云是税：

| 类别 | AWS | GCP | Azure |
|---|---|---|---|
| 计算（VM） | EC2 | Compute Engine | Azure VMs |
| 托管 Kubernetes | EKS | GKE | AKS |
| Serverless 函数 | Lambda | Cloud Functions | Azure Functions |
| 对象存储 | S3 | Cloud Storage（GCS） | Blob Storage |
| 托管 Postgres | RDS | Cloud SQL | Azure Database for PostgreSQL |

（GKE 普遍被视为最打磨的托管 Kubernetes，因 Google 是 Kubernetes 发源。）

**IAM 模型如何不同（本案例"两套 IAM"之痛）**——这是三家分歧最大处：
- **AWS**——**IAM role + JSON policy。** 极**强大、细粒度**，但**冗长复杂**——policy 是带 action/resource/condition 的 JSON 文档，做对最小权限真的难。assume-role 和跨账号信任增添强大与复杂。
- **GCP**——在**资源层级**（组织→文件夹→项目→资源）上的 **IAM binding**。把**成员**（用户/服务账号）绑到资源上的**角色**，权限**沿层级向下继承**。通常比 AWS **更简单干净**，project/folder 树给出自然组织分域。
- **Azure**——**Azure RBAC**（角色分配作用于订阅/资源组/资源）叠在 **Entra ID**（前 Azure AD）身份上。来自微软/AD 世界的人熟悉；身份与资源访问略分开。

**为何多云是税（本案例被拖垮的根因）：** 服务概念上*映射*，但**细节处处不同**：IAM 模型、网络、配额、API、托管服务行为，尤其是**运维工具与团队经验**。真正抽象三家（为避锁定）常意味只用**最小公分母**并构建/维护**昂贵抽象层**（正是本案例那层没人爱用的东西）——你付真实的"多云税"并失去让每个云有价值的深层专有特性。对多数团队，务实选择是**选一个主云**、钻深，只在有充分理由时才用另一个。

**怎么排查/定位/修复（本案例这种多云项目）：**
1. 先问需求真伪：区分"真需要多云"（合规要求数据落在特定云、并购遗留、灾备跨云）和"怕锁定"的假想需求——本案例是后者，代价远超收益。
2. 量化多云税：盘点被拖垮在哪——两套 IAM/网络配置、抽象层维护、团队要精通两家、CI/CD 双份，把工时摊出来给管理层看。
3. 收敛到主云：选团队经验最深、托管服务最贴合的一家做主云，钻深用它的专有特性（本该省下抽象层的钱）。
4. 若确有多云需求：别做全局抽象，按工作负载切分（A 服务只在 AWS、B 服务只在 GCP），每个团队用原生工具，而不是强求"同一份代码到处跑"。
5. 降低真实锁定风险：用 Terraform/Kubernetes/容器等跨云通用层承接可移植部分，专有服务就大方用，而不是自造最小公分母抽象。

**面试常追问 / 权衡：** 映射：计算 EC2/CE/VM、托管 k8s EKS/GKE/AKS、对象 S3/GCS/Blob、函数 Lambda/Cloud Functions/Azure Functions、Postgres RDS/Cloud SQL/Azure DB。IAM 差异最大：AWS JSON policy 强大但冗长、GCP 层级 binding 更干净、Azure RBAC + Entra ID。核心权衡：多云为避锁定，但要付最小公分母 + 抽象层维护 + 双份运维经验的"税"，多数团队应选一个主云钻深，真有多云需求就按工作负载切分而非全局抽象。

**要点：**
- 托管 k8s：EKS / GKE / AKS；对象：S3 / GCS / Blob
- IAM 差异显著：AWS JSON policy / GCP 层级 binding / Azure RBAC + Entra ID
- 多云大多是税：最小公分母 + 抽象层维护 + 双份经验
- 多数团队选一个主云钻深，真有需求按工作负载切分

---

### 83. iptables vs nftables

**频率：** 低

**题目：** 你加了条 `iptables` 规则想 DROP 某个恶意 IP，可它照样能连进来；同时一个几万 Service 的大 K8s 集群网络延迟明显偏高。请对比 iptables 与 nftables，并解释这两个现象怎么定位。

**这是什么 & 为什么用它：** 两者都是基于内核 **netfilter** 钩子的 Linux 包过滤框架，nftables 是 iptables 的现代继任。本案例"DROP 不生效"是规则顺序问题，"大集群延迟高"是 kube-proxy 后端的扩展性问题，都要靠理解这两个框架来定位。

**落地这个案例：**
- **iptables 结构（定位规则顺序问题）：** 过滤组织为**表**与**链**。**表**按目的分组：**`filter`**（accept/drop——防火墙）、**`nat`**（网络地址转换——改写源/目的地址端口）、**`mangle`**（改包头如 TOS/TTL）、`raw`。表内，**链**是包旅程中的钩点：**`INPUT`**（发往本机）、**`OUTPUT`**（本机发出）、**`FORWARD`**（经本机路由），加 `PREROUTING`/`POSTROUTING`（NAT 用）。向链追加规则，每规则匹配（协议/端口/IP）并取 target（ACCEPT/DROP 等）。
- **为何 DROP 不生效（本案例现象一）：** 链中规则**自上而下求值、首个匹配获胜**（应用其 target 并通常停止）。你的 DROP 之上若已有一条宽泛 `ACCEPT`，它先匹配，DROP 就**不可达**——错排会静默地开或阻流量。
- **nftables：** **现代替代**——**单一 `nft` 工具** + **统一更表达的语法**，取代分立的 `iptables`/`ip6tables`/`arptables`/`ebtables`。更干净地支持 map、set 和 IPv4/IPv6 合并规则，性能更好、能原子替换规则。底层同 **netfilter**，是框架演进而非不同机制。
- **Kubernetes 相关性（本案例现象二）：** **kube-proxy**（实现 Service 负载均衡）历史上编程 **iptables** 规则把 Service 流量路到 pod IP——在成千上万 Service 时扩展性差（巨大规则表、线性匹配，正是大集群延迟高的根因）。后来有 **IPVS** 模式（内核 L4 负载均衡器，更可扩展）现又有 **nftables** 模式。kube-proxy 用哪个后端直接影响大规模集群网络性能。

**怎么排查/定位/修复：**
1. 定位 DROP 不生效：`iptables -L -n -v --line-numbers` 看链，带**包/字节计数**判断哪些规则真在匹配——若你的 DROP 计数为 0 而上面某条 ACCEPT 一直在涨，就是被前面规则抢先。
2. 修复顺序：用 `iptables -I`（插到指定位置）把 DROP 规则放到那条宽泛 ACCEPT *之前*，重看计数确认 DROP 开始命中。
3. 定位大集群延迟：查 kube-proxy 当前后端（`kube-proxy --proxy-mode` 或其 ConfigMap），若是 `iptables` 模式且 Service 上万，规则线性匹配就是瓶颈。
4. 换后端：把 kube-proxy 切到 **IPVS** 或 **nftables** 模式（哈希/更优数据结构），或评估用 eBPF 数据面（Cilium）绕过 kube-proxy。
5. 验证：切换后观测 Service 访问延迟和规则规模，确认改善。

**面试常追问 / 权衡：** 表 filter/nat/mangle/raw、链 INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING；nftables 是继任者、单一工具、支持 set/map、能原子替换，底层同 netfilter。规则**自上而下首个匹配获胜**，顺序功能上重要。kube-proxy 后端 iptables（线性、大规模差）vs IPVS/nftables（更可扩展）。排查用 `iptables -L -n -v` 看计数。权衡：iptables 生态成熟、文档多但大规模差；nftables/IPVS 更快但迁移和团队熟悉度有成本。

**要点：**
- 表 filter/nat/mangle/raw；链 INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING
- 规则自上而下首个匹配获胜，顺序错会静默开/阻流量
- nftables 是继任者（单一工具、set/map、原子替换），底层同 netfilter
- kube-proxy 大规模用 IPVS/nftables 优于 iptables；用 `iptables -L -n -v` 查计数

---

### 84. .dockerignore

**频率：** 低

**题目：** 两件事同时发生：本地 `docker build` 每次都卡在 "Sending build context" 好几十秒、镜像还大得离谱；后来安全审计发现推到 registry 的镜像里居然有一份 `.env`（带数据库密码）和整个 `.git` 目录。Dockerfile 里就一句 `COPY . .`。请解释 `.dockerignore` 怎么一次解决这几个问题。

**这是什么 & 为什么用它：** 跑 `docker build` 时，Docker 先把**整个构建上下文**（通常整个目录 `.`）**发给 Docker 守护进程**再执行 Dockerfile。`.dockerignore` **从那个上下文排除路径**——恰如 `.gitignore` 从 Git 排除——使它们从不上传到守护进程、也不可供 `COPY`/`ADD`。本案例三个症状（构建慢、镜像臃肿、密钥泄露）都是没有 `.dockerignore` + `COPY . .` 的直接后果。

**落地这个案例：**
- **构建慢（症状一）：** 无排除时 `node_modules`、`.git` 历史、构建产物（`target/`、`dist/`）等巨目录**每次都上传到守护进程**，即使 Dockerfile 不拷它们也浪费时间与磁盘，大 repo 上下文可达几百 MB——正是本案例卡几十秒的原因。
- **镜像臃肿/损坏（症状二）：** `COPY . .` 拖入本地 `node_modules`（错架构原生模块）、本地构建产物和杂物，造成微妙的"本地行、容器崩"。
- **密钥泄露（症状三，最危险）：** 本地 `.env`、凭证、`.aws/`、私钥、`.git` 被 `COPY . .` **拷进镜像**并推到 registry（正是本案例审计发现的）。排除它们是真实的安全控制。
- **解法：** 加 `.dockerignore`，**语法镜像 `.gitignore`**（glob 模式、`!` 否定），至少**始终排除**：`.git`、`node_modules`、`target/`/`dist/`/`build/`、`*.env` 和凭证文件、本地缓存。

**怎么排查/定位/修复：**
1. 处置本案例泄露：镜像里已有 `.env`，视同凭证泄露——**立即轮换那份数据库密码**，因为镜像层历史里删不干净、registry 上可能已被拉取。
2. 加 `.dockerignore`：写入 `.git`、`node_modules`、`*.env`、凭证/`.aws/`、`target/`/`dist/`/`build/` 等，重新构建。
3. 验证上下文变小：看构建输出的 **`Sending build context to Docker daemon <size>`**（或 BuildKit 的传输上下文大小），数字应显著下降；若仍大得意外说明 `.dockerignore` 还漏了东西。
4. 验证镜像不含密钥：`docker history` 看层、或起容器进去 `ls` 确认 `.env`/`.git` 已不在镜像里。
5. 加防线：CI 里跑密钥扫描（gitleaks/trufflehog）扫构好的镜像，防再次把凭证打进去。

**面试常追问 / 权衡：** `.dockerignore` 从构建上下文排除路径，一次解决三件事：减少上下文上传时间、避免镜像臃肿/损坏、防 `.env`/`.git`/凭证泄进镜像（真实安全控制）。语法同 `.gitignore`。验证靠看 "Sending build context" 大小。注意：即使 `COPY` 写得选择性、即使用 BuildKit，仍需 `.dockerignore` 保上下文*上传*小并防意外 `COPY .`。权衡：几乎无代价，唯一"成本"是要记得维护排除清单。

**要点：**
- 减少上下文上传时间（巨目录不再每次上传）
- 防 `.env`/`.git`/凭证泄进镜像，泄露后立即轮换
- 语法镜像 `.gitignore`，验证看 "Sending build context" 大小
- 即使用 BuildKit、即使 COPY 选择性也需要

---

### 85. BuildKit 特性

**频率：** 低

**题目：** 你们的 CI 构建又慢又出过事故：每个 job 都在全新短命 runner 上从零下载 Go 依赖、重新编译，一次十几分钟；更糟的是之前有人为了 `git clone` 私有仓，把 SSH 私钥用 `COPY` 拷进了镜像，结果密钥留在了镜像层历史里。请描述 BuildKit 及其关键特性怎么解决这些。

**这是什么 & 为什么用它：** **BuildKit** 是 Docker 的**现代构建引擎**（现代 Docker 默认，取代旧构建器），把构建重构为**依赖图**而非线性序列。本案例的"每次从零编译"靠它的缓存能力解决、"私钥进镜像"靠它的 secret/ssh 挂载解决。

**落地这个案例：**
- **并行阶段执行 + 更聪明缓存：** 多阶段构建里独立阶段**并发**构建而非严格自上而下，BuildKit 只跑目标真正需要的阶段；比旧构建器更精确的缓存失效与内容寻址缓存。
- **`--mount=type=cache`（治"每次从零编译"）：** **跨构建**持久化一个目录（包/编译器缓存）而不烤进镜像。如 `RUN --mount=type=cache,target=/root/.cache/go-build go build ...` 在构建间保留 Go 构建缓存，重编快——缓存从不成为镜像层。
- **`--mount=type=secret`（治"密钥进镜像"）：** 把密钥（npm/pip token）暴给单个 `RUN` 而**不持久化进任何层**，避免密钥泄进镜像历史的经典错误。
- **`--mount=type=ssh`（治本案例私钥拷贝）：** 把宿主 SSH agent 转发给 `RUN`（如 `git clone` 私有 repo）而**不把密钥拷进镜像**——正是本案例应该用的方式，取代 `COPY` 私钥。
- **远程缓存（治"短命 runner 从零构建"）：** 用 `--cache-to` 和 `--cache-from` **把缓存导出/导入 registry**，让 **CI runner 共享构建缓存**——全新短命 runner 从 registry 拉缓存而非从零重建，对本案例这种 runner 短命的流水线极大提速。
- **启用与前端：** 设 **`DOCKER_BUILDKIT=1`**（现代 Docker / `docker buildx` 里**默认**）通常自动就有；首行 `# syntax=docker/dockerfile:1.x` 选一个 **Dockerfile 前端版本**，让你**独立于守护进程版本**用上更新特性（如上面的 `--mount`），BuildKit 拉指定前端镜像解析 Dockerfile。

**怎么排查/定位/修复：**
1. 处置本案例私钥泄露：私钥已在镜像层历史里，删不干净——**立即轮换那把 SSH key**，并从 registry 移除受影响镜像。
2. 改用 ssh 挂载：Dockerfile 首行加 `# syntax=docker/dockerfile:1`，把 `git clone` 改成 `RUN --mount=type=ssh git clone ...`，构建时 `docker build --ssh default`，私钥永不进镜像。
3. 加编译缓存：给 `go build`/`npm ci` 等加 `--mount=type=cache`，本地重编即快；用 `docker history` 确认缓存目录没成为镜像层。
4. 跨 runner 提速：CI 里用 `docker buildx build --cache-to=type=registry,ref=... --cache-from=type=registry,ref=...`，让短命 runner 复用上一次缓存，观测构建时长下降。
5. 验证 BuildKit 已启用：确认 `DOCKER_BUILDKIT=1` 或用 `docker buildx`，否则 `--mount` 语法会报错。

**面试常追问 / 权衡：** BuildKit 依赖图构建解锁并行阶段、内容寻址缓存、`--mount=type=cache|secret|ssh`、远程缓存（`--cache-from`/`--cache-to` 供 CI 共享）、`# syntax=` 前端（独立于守护进程升级 Dockerfile 特性）。密钥务必用 secret/ssh 挂载而非 `COPY`（层历史删不掉）。权衡：远程缓存需 registry 存储和网络拉取成本，但对短命 runner 极划算；cache 挂载在并发构建时需注意缓存竞争。

**要点：**
- 并行阶段执行 + 内容寻址缓存
- `--mount=type=cache`（编译缓存不进层）、`secret`/`ssh`（密钥不进镜像）
- 远程缓存（`--cache-from`/`--cache-to`）让短命 CI runner 共享
- `# syntax=` 选前端；密钥用挂载而非 COPY，泄露即轮换

---

### 86. Buildx 多架构镜像

**频率：** 低

**题目：** 团队把服务迁到 **AWS Graviton（arm64）**省成本，结果开发者在 M 系 Mac 上 `docker pull repo/app:1.0` 跑得好好的，部署到旧的 amd64 节点却 `exec format error`；而 CI 里加了个 amd64 上仿真构 arm64 的步骤后，构建时长从 3 分钟飙到 25 分钟。请解释用 buildx 构建多架构镜像怎么同时解决"一个 tag 处处能跑"和"构建别太慢"。

**这是什么 & 为什么用它：** 不同 CPU 需要不同二进制——**amd64**（Intel/AMD）镜像跑不了 **arm64** 宿主，反之亦然（正是本案例的 `exec format error`）。**多架构镜像**让*单个镜像 tag* 在两者上都能用。你用 **`docker buildx`**（BuildKit 驱动的构建命令）构建：

```
docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .
```

**落地这个案例：**
- **它产出什么：** 一个 **manifest list**（即 **OCI image index**）——一个小的顶层 manifest，**每架构引用一个镜像**。所以 `repo/app:1.0` 不是单个镜像；它是指向 amd64 构建*和* arm64 构建的索引。
- **消费者如何用（治本案例的 exec format error）：** 任何宿主跑 `docker pull repo/app:1.0` 时，registry/客户端查 manifest list 并**自动选匹配该宿主 CPU 的变体**——开发者的 M 系 Mac 拿 arm64、Graviton 拿 arm64、旧 amd64 节点拿 amd64，透明。一个 tag、处处正确的二进制。
- **速度——QEMU vs 原生构建器（治本案例构建变慢）：** 要为异于构建宿主的架构构建，buildx 可用 **QEMU 仿真**（如在 amd64 runner 上仿 arm64）——方便（处处可用）但**慢**，因每条指令都被仿真，正是本案例从 3 分钟涨到 25 分钟的原因。求快用**原生远程构建器**——真 arm64 机构 arm64、amd64 机构 amd64——无仿真。`docker buildx create --use` 建一个能瞄准多节点/平台的构建器。

**怎么排查/定位/修复：**
1. 先确认 `exec format error` 是架构不匹配：`docker inspect repo/app:1.0` 或 `docker manifest inspect repo/app:1.0` 看它是不是**只有一个架构**的镜像。
2. 若只有 amd64：改用 `docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .` 重构并推 manifest list。
3. 验证：`docker manifest inspect repo/app:1.0` 应看到 amd64 *和* arm64 两条 `platform` 条目。
4. 治构建慢：把 CI 的 QEMU 仿真换成**原生 runner**——`docker buildx create --use` 建多节点构建器，让 amd64 job 上 amd64 机、arm64 job 上 arm64 机（GitHub Actions 有 arm64 runner，或自建 Graviton runner），观测构建时长回落。

**面试常追问 / 权衡：** manifest list（OCI image index）按架构自动选变体，一个 tag 处处正确。QEMU 仿真方便但慢（每指令仿真）；原生远程构建器无仿真、快。`docker buildx create --use` 建能瞄准多平台的构建器。为何现在重要：Apple Silicon 开发者要 arm64、生产越来越用 arm64 服务器芯片（Graviton、Ampere）求性价比，*且*大量基础设施仍是 amd64。权衡：多架构构建要么慢（QEMU）要么要维护原生 runner 池（成本），二选一。

**要点：**
- `docker buildx create --use` + `--platform linux/amd64,linux/arm64`
- manifest list（OCI index）按架构自动选，治 `exec format error`
- 求速度用原生 runner 而非 QEMU（每指令仿真极慢）
- 用 `docker manifest inspect` 验证多架构条目

---

### 87. 镜像签名（Cosign、SLSA）

**频率：** 低

**题目：** 一次安全事件里，攻击者拿到了你们某个 registry 的写权限，把 `repo/app:prod` 这个 tag 悄悄换成了带后门的镜像，集群照常拉取部署，几天后才被发现。事后要求"生产集群只允许跑我们可信 CI 流水线构建并签名的镜像"。请用 Cosign、SLSA、attestation 讲清怎么建立这条供应链信任。

**这是什么 & 为什么用它：** 目标是**供应链完整性**——证明你将跑的镜像正是你可信流水线所构的*那个*制品，而非本案例这种被篡改或在被入侵 registry 里掉包的。核心工具是 **Cosign（sigstore 项目）**——**签 OCI 制品**（镜像及其他 registry 制品），再在准入处强制校验。

**落地这个案例：**
- **Cosign 签名——两种模式：** **静态密钥**（你持私钥），或更强的**无密钥/OIDC** 签名——不管长寿密钥，Cosign 从 **Fulcio** 取一个绑定 **OIDC 身份**（如你 GitHub Actions 工作流的身份）的**短寿证书**签，并把签名记入 **Rekor** 透明日志。于是签名证明"**这个身份**（这个 CI 工作流）构建并签了此镜像"，无密钥可泄或轮换。
- **签 digest 不签 tag（正好治本案例）：** **签名与镜像一起存在 registry**（作引用镜像 digest 的相关制品），无独立签名库。你签 **digest**（`cosign sign image@sha256:...`）而非可变 tag——攻击者掉包 tag 指向的后门镜像 digest 不同，没有可信身份的有效签名，准入处会拒。
- **SLSA 做构建信任：** **SLSA**（软件制品供应链级别）是**定义溯源级别**的框架。越高级要求越强保证；如 **SLSA Level 3** 要求**不可伪造的构建溯源**——由加固构建服务产出的、签名防篡改的"*如何*构建"记录（源、构建器、参数），使攻击者伪造不了"这出自我们流水线"。
- **attestation 补全链条：** 除裸签名外，附上签名的 **attestation**：**SBOM**（软件物料清单——镜像内组件/依赖的完整列表，支持"我受 CVE-X 影响吗"查询）和**构建溯源**（如何构建的 SLSA 记录）。签名 + SBOM + 溯源三者合一、全可验证，你得到从源到运行容器的端到端可审计链。

**怎么排查/定位/修复：**
1. 事后取证本案例：`cosign verify repo/app:prod --certificate-identity=... --certificate-oidc-issuer=...` 对当前跑的镜像验签，未通过即证明它不是可信流水线构的。
2. 查 **Rekor** 透明日志核对签名记录，确认哪些 digest 是真身份签的、哪个是掉包进来的。
3. 补强制：在准入处装策略——用 **Kyverno**、**Connaisseur** 或 sigstore policy-controller，**拒绝任何未被可信身份签名的镜像**，未签或错签镜像根本**无法部署到集群**。这把"我们签镜像"变成硬保证。
4. CI 里加签名步骤（无密钥 OIDC）+ 生成 SBOM 与 SLSA 溯源 attestation 并签名，随镜像一起推。
5. 验证：故意推一个未签镜像到集群，确认被准入策略拒绝。

**面试常追问 / 权衡：** Cosign 签 OCI 制品，无密钥/OIDC 模式经 Fulcio 取短寿证书、记入 Rekor 透明日志，免长寿密钥泄露轮换。必须签 digest 不签可变 tag。SLSA Level 3 要求不可伪造构建溯源。attestation（SBOM + 溯源）补全审计链。关键：签名若不在准入处校验就一文不值。权衡：无密钥签名依赖 sigstore 基础设施（Fulcio/Rekor 可用性），准入校验增加部署环节复杂度但换来强供应链保证。

**要点：**
- `cosign sign image@digest`（签 digest 不签 tag，治 tag 掉包）
- 无密钥签名：OIDC + Fulcio + Rekor 透明日志
- 准入处用 Kyverno/Connaisseur 校验，未签即拒
- SLSA 溯源 + SBOM attestation 建端到端信任链

---

### 88. 拓扑分散约束

**频率：** 低

**题目：** 你的 web 服务有 6 个副本、集群跨 3 个可用区，某天 `us-east-1a` 整个区中断，结果服务完全不可用——一查发现调度器把 6 个副本里的 5 个都塞进了 1a。请解释拓扑分散约束怎么保证副本均匀铺开，以及为何它在 HA 分散上胜过 pod anti-affinity。

**这是什么 & 为什么用它：** **拓扑分散约束**控制**一个工作负载的 pod 在拓扑域间多均匀分布**——如**可用区、节点、机架**等故障域。要点正是本案例的高可用：若所有副本落一个区而该区挂，你全宕。分散它们保证一个区/节点丢失只带走一部分副本。

```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: {matchLabels: {app: web}}
```

**落地这个案例：** 上面这段加到 web Deployment，6 副本 × 3 区 + `maxSkew: 1` 会得到 **2/2/2** 的分布，1a 挂只带走 2 个、剩 4 个撑住。三个关键字段：
- **`topologyKey`**——定义分散域的节点标签（区用 `topology.kubernetes.io/zone`、节点用 `kubernetes.io/hostname`、自定义 `rack` 标签等）。
- **`maxSkew`**——域间**最大允许不均**。`maxSkew: 1` 意味最多与最少域的 pod 数差至多 1——近乎完美均匀（本案例正需要）。更大 skew 允许更多不均。
- **`whenUnsatisfiable`**——约束*无法*满足时怎么办：**`DoNotSchedule`**（硬——宁让 pod **Pending** 也不违反分散）vs **`ScheduleAnyway`**（软——调度器*偏好*分散但满足不了也照放）。均衡分散是严格 HA 要求时选硬；有*某个*放置比完美均衡更重要时选软。

**怎么排查/定位/修复：**
1. 复盘本案例的失衡：`kubectl get pods -l app=web -o wide` 看 NODE 列，再 `kubectl get nodes -L topology.kubernetes.io/zone` 把节点映到区，确认副本挤在了哪个区。
2. 加上面的 `topologySpreadConstraints`，滚动重启：`kubectl rollout restart deploy/web`。
3. 验证分布：重新 `kubectl get pods -o wide` 应看到近 2/2/2。
4. 若加了硬约束（`DoNotSchedule`）后 pod 卡 **Pending**：`kubectl describe pod` 看事件——通常是某区节点容量不足撑不下均衡分布，要么扩该区节点，要么权衡降级为 `ScheduleAnyway`。
5. 注意节点得真带 `topology.kubernetes.io/zone` 标签（云厂商一般自动打），否则约束无从分散。

**面试常追问 / 权衡：** `maxSkew` 量化控制不均，`topologyKey` 选 zone/hostname/rack，`DoNotSchedule`（硬，可能 Pending）vs `ScheduleAnyway`（软）。为何优于 pod anti-affinity：anti-affinity 表达"别把这些 pod 放一起"，但对*均匀分散多副本*笨拙且**扩展差**——本质二元（避/许），多 pod 时调度器求值变贵，无法表达"在容差内均衡"。拓扑分散约束对*分布*给直接量化控制、大规模调度器性能更好、调优更细。权衡：硬约束保证均衡但容量不足会导致 Pending；软约束不会 Pending 但可能失衡。

**要点：**
- `maxSkew` 量化控不均，治副本挤一个区
- `topologyKey`：zone/hostname/rack；节点须带对应标签
- `DoNotSchedule`（硬、可能 Pending）vs `ScheduleAnyway`（软）
- 多副本均衡分散比 anti-affinity 更好、更省调度器

---

### 89. CNI 选择：Calico、Cilium、Flannel

**频率：** 低

**题目：** 你们最早用 Flannel 起的集群，现在合规要求"支付服务的 pod 只能被订单服务访问、且要能审计谁在跟谁通信、跨节点流量还得加密"，结果发现 Flannel 上写的 NetworkPolicy 根本不生效。请对比 Calico、Cilium、Flannel 三种 CNI，说明该怎么选来满足这些需求。

**这是什么 & 为什么用它：** **CNI（容器网络接口）**插件提供 pod 网络——分配 pod IP 并在跨节点 pod 间路由流量。本案例的痛点（策略不生效、要审计、要加密）正好暴露三种 CNI 用简单换特性的分野：

**落地这个案例——三个选择：**
- **Flannel（本案例起点，不够用）**——**最简单**。一个基础 **VXLAN overlay**：把 pod 流量封在节点间隧道的 UDP 包里。易搭易懂，基本 pod-to-pod 连通"就是能用"。**局限：** 它**无 NetworkPolicy**（无法限制哪些 pod 能通信——扁平、全开网络，正是本案例策略不生效的原因），且 overlay 加封装开销。适**开发/学习集群**或不需网络安全或高性能的简单场景。
- **Calico**——成熟、重安全的选择。可经 **BGP 无 overlay 路由** pod 流量（pod 得节点间通告的可路由 IP——无封装开销、性能更好、与物理网络集成更佳）。提供完整 **Kubernetes NetworkPolicy**（及更丰富的 Calico 策略）做分段——能满足本案例"支付只准订单访问"，并有 **eBPF 数据面**选项求更高性能。
- **Cilium（最能满足本案例全部需求）**——现代、**eBPF 原生**。基于 eBPF（可编程内核数据面）它提供：**L3–L7 网络策略**（不止 IP/端口——你能在 *HTTP/gRPC/Kafka* 级 allow/deny，如"allow GET /api 但不 DELETE"）、**透明加密**（节点间 WireGuard/IPsec，治本案例加密需求）、**无 sidecar 服务网格**（网格特性而不给每 pod 注入 Envoy sidecar——更少开销），及做深度**网络可观测性**的 **Hubble**（流级看谁在跟谁通信，治本案例审计需求）。Cilium 甚至能用 eBPF 服务负载均衡**完全替代 kube-proxy**。

**怎么排查/定位/修复：**
1. 先确认本案例 Flannel 上策略为何无效：`kubectl get networkpolicy` 策略在、但 Flannel 无策略执行引擎，所以形同虚设——这不是配错，是 CNI 不支持。
2. 决策：需要 NetworkPolicy 就必须换到 Calico 或 Cilium；本案例还要 L7 审计 + 加密，指向 Cilium。
3. 迁移是重活（换 CNI 通常要重建集群或滚动替换 DaemonSet），先在预备集群验证。
4. 换到 Cilium 后验证策略：部署 CiliumNetworkPolicy 只放行订单→支付，用 `kubectl exec` 从别的 pod 访问支付应被拒。
5. 验证审计与加密：`hubble observe --to-pod payments` 看流是否被正确 allow/deny；`cilium status` / `cilium encrypt status` 确认 WireGuard 加密已开。

**面试常追问 / 权衡：** Flannel 最简单但无策略、有 overlay 开销；Calico 提供 BGP 无 overlay 路由 + NetworkPolicy + eBPF 数据面选项；Cilium eBPF 原生，给 L3–L7 策略、透明加密、无 sidecar 网格、Hubble 可观测、可替代 kube-proxy。如何选：Flannel 用于无策略需求的开发/测试；Calico 要与既有网络的成熟 NetworkPolicy + BGP 集成；Cilium 用于要 L7 策略、内建可观测、加密、网格的现代集群。权衡：Cilium 特性最丰富但需较新内核和更多运维成熟度，换 CNI 本身是高风险迁移。

**要点：**
- Flannel：最简单、无策略（本案例策略失效根因）
- Calico：BGP 无 overlay + NetworkPolicy
- Cilium：eBPF、L7 策略、Hubble 审计、透明加密
- Cilium 可替代 kube-proxy；换 CNI 是重迁移，先预备集群验证

---

### 90. Pod Security Standards

**频率：** 低

**题目：** 集群从 1.24 升到 1.25 后，你们原来用来禁止特权容器、限制宿主挂载的一堆 **PodSecurityPolicy** 突然全没作用了，`kubectl get psp` 直接报资源不存在；同时安全团队要求"所有业务命名空间的 pod 必须非 root 运行、弃掉所有能力"。请解释怎么用 Pod Security Standards 补回来，以及何时还得上 Kyverno/Gatekeeper。

**这是什么 & 为什么用它：** **Pod Security Standards（PSS）**定义**pod 必须多锁定**，是旧 **PodSecurityPolicy（PSP）**的内置替代——PSP 已在 **Kubernetes 1.25 移除**（正是本案例 PSP 失效的原因）。PSP 难正确使用（授权模型混乱、易配错），故被更简单的 PSS + **PodSecurity 准入控制器**替代。

**落地这个案例——三个等级**（严格递增）：
- **Privileged**——**不设限**。允许一切，含特权容器、宿主命名空间、hostPath 挂载。仅用于可信系统/基础设施负载。
- **Baseline**——**阻已知提权向量**同时与常见应用广泛兼容。禁特权容器、宿主网络/PID、危险能力——多数普通负载仍满足的合理最低限。
- **Restricted**——**重度加固**，遵 pod 加固最佳实践：必须**非 root**跑、**弃所有能力**、用 **`seccomp: RuntimeDefault`**、禁提权、鼓励只读根文件系统等。正是本案例安全团队要求的目标级别。

**如何强制**——内置 **PodSecurity 准入控制器**通过**每命名空间 label** 配置：

```yaml
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

还可设 `warn` 和 `audit` 模式（不阻地暴露违反，利于逐步推广）。`enforce` 下，违反该级的 pod 在**准入处被拒**。

**怎么排查/定位/修复：**
1. 确认本案例根因：升到 1.25 后 PSP API 被移除，`kubectl get psp` 报 `the server doesn't have a resource type "podsecuritypolicies"`——旧策略无声失效，此刻集群是全开的。
2. 别直接上 `enforce`——先给业务命名空间打 **`audit` 和 `warn`** label 指向 `restricted`，收集现有 pod 会踩哪些违反（`kubectl get events` 或 apiserver 审计日志里看 warning）。
3. 逐个修 pod spec：加 `securityContext.runAsNonRoot: true`、`capabilities.drop: [ALL]`、`seccompProfile: RuntimeDefault`。
4. 修干净后把 label 翻到 **`pod-security.kubernetes.io/enforce: restricted`**，此后违反的 pod 在准入处直接被拒。
5. 验证：故意提交一个 root 跑的 pod，确认被拒且报明具体违反项。

**面试常追问 / 权衡：** PSP 在 1.25 移除、PSS 替代；三级 privileged/baseline/restricted；每命名空间 label 强制，有 enforce/warn/audit 三模式（先 audit 后 enforce 是安全推广路径）。何时用 Kyverno/Gatekeeper（OPA）：PSS 只给三个粗、固定级、不能定制。需**细粒度或自定义策略**（如"每 pod 必有特定 label"、"只允我们 registry 的镜像"、"强制资源限制"、或变更资源）时用策略引擎，它们写任意校验/变更准入策略。常见模式：PSS `restricted` 作基线加固 + Kyverno/Gatekeeper 叠组织专有规则。权衡：PSS 内置零依赖但只有三级；策略引擎灵活但要额外部署维护。

**要点：**
- PSP 在 1.25 移除（本案例根因）；PSS 内置替代
- 三级 privileged/baseline/restricted，命名空间 label 强制
- 先 audit/warn 收集违反、修好再翻 enforce
- 自定义规则（label/registry/资源限制）配合 Kyverno/Gatekeeper

---

### 91. kubeconfig context

**频率：** 低

**题目：** 一名工程师本想在 staging 清掉一批测试 pod，跑了 `kubectl delete deploy --all`，几秒后发现生产订单服务全没了——他的活动 context 其实停在 **prod** 上，而他一直以为在 staging。事后要求给团队定一套防"错集群操作"的规范。请解释 kubeconfig 与 context，以及具体护栏。

**这是什么 & 为什么用它：** **kubeconfig**（`~/.kube/config`）告诉 `kubectl` **有哪些集群、如何向各集群认证、你当前瞄准哪个**。它持三类条目：**cluster**（API server 地址 + CA 证书）、**user**（凭证——证书、token、exec 插件）和 **context**。本案例的惨剧根源就是不知道"当前瞄准哪个"。

**落地这个案例：**
- **context 是（cluster + user + namespace）的具名捆绑**——它说"用*这个*集群、以*这个*用户、默认*这个*命名空间"。你用 `kubectl config use-context prod` **切活动 context**，之后每条 `kubectl` 都瞄准当前 context 所指——包括那条致命的 `delete --all`。`kubectl config get-contexts` 列出并标出活动的。
- **人体工学工具：** **`kubectx`**（快切 context——`kubectx prod`）和 **`kubens`**（快切 namespace——`kubens payments`）比冗长的 `kubectl config` 快很多，常带模糊选择。
- **防错集群的护栏（正是本案例要补的）：**
  - **提示符指示**——用 **`kube-ps1`**（或 starship/oh-my-zsh 段）把**当前 context 和 namespace 显在 shell 提示符里**，使 prod 在你回车前总显眼地盯着你。提示符里看到 `(prod:payments)` 是最廉价、最有效的保障——本案例若提示符显着 `prod` 大概率不会误删。
  - **每环境分开 `KUBECONFIG`**——不用一个巨型配置混 prod 与 dev，而保持**分开的 kubeconfig 文件**并每终端/会话设 `KUBECONFIG`（如专门的"prod"终端）。这从结构上难以从 dev shell 误碰 prod。
  - 其他实践：尽可能用**只读或受限凭证**、prod 要额外确认、别把 prod context 留作默认。

**怎么排查/定位/修复：**
1. 出事第一步——**先确认你到底在哪个集群**：`kubectl config current-context` 和 `kubectl config get-contexts`。
2. 复盘本案例：他没先看 context 就 `delete --all`，且 prod 用了可写凭证、prod 还是默认 context——三重失误。
3. 装护栏：给每人配 `kube-ps1` 让提示符常显 `(context:namespace)`；prod 单独一份 kubeconfig，用专门终端 `export KUBECONFIG=~/.kube/prod` 才加载。
4. 收权限：日常 context 绑**只读或受限 RBAC 凭证**，破坏性操作要切到显式的高权 context。
5. 恢复本案例：从 GitOps/Helm 仓库重新 `apply` 订单服务的 manifest，或从 etcd 备份恢复——这也说明 prod 必须有声明式重建能力兜底。

**面试常追问 / 权衡：** context = cluster + user + namespace 的具名捆绑；`use-context` 切换、`get-contexts` 查看；`kubectx`/`kubens` 提效。防错集群三招：`kube-ps1` 提示符显 context/namespace（最廉价有效）、按环境分 `KUBECONFIG` 文件、prod 用受限凭证 + 额外确认 + 不设默认。权衡：分开 kubeconfig 稍麻烦但结构性隔离 prod；只读凭证增加日常切换成本但挡住误操作。

**要点：**
- Context = cluster + user + namespace；先 `current-context` 再动手
- `kubectx`/`kubens` 提效
- `kube-ps1` 提示符显 context 防错集群（本案例最该有的）
- 按环境分 `KUBECONFIG` + prod 用受限凭证、不设默认

---

### 92. 临时容器（kubectl debug）

**频率：** 低

**题目：** 生产一个用 distroless 镜像打包的服务开始间歇性挂起，你想进去看它到底卡在哪，结果 `kubectl exec -it pod/foo -- sh` 直接报 `exec: "sh": executable file not found`——镜像里连 shell 和 `ps`、`curl` 都没有；而重启 pod 又会摧毁你想抓的现场状态。请解释怎么用 `kubectl debug` 的临时容器排这个障。

**这是什么 & 为什么用它：** **临时容器**让你**把一个临时调试容器附到已在跑的 pod 而不重启它**：

```bash
kubectl debug -it pod/foo --image=busybox:1.36 --target=app -- sh
```

**落地这个案例：**
- **为何 exec 进不去：** 加固镜像的初衷就是 **distroless / scratch 镜像无 shell**、无调试工具（无 `sh`、`curl`、`ps`、`cat`）——安全佳，但意味你**无法 `kubectl exec` 进去排障**（没东西可 exec，正是本案例的报错）。
- **临时容器怎么解：** 你把个*单独*容器（带 busybox/你的调试工具包）**注入运行中的 pod**，在应用*旁*给你 shell 和工具——关键是**不杀/不重启 pod**，使你能就地检查活的、出错的实例（重启会摧毁本案例想抓的挂起现场）。
- **`--target` 共享进程命名空间：** 用 `--target=app`，调试容器**共享 `app` 容器的进程（PID）命名空间**，故从你的调试 shell 能**看到应用的进程**（`ps` 显示）并读其 **`/proc/<pid>/...`**——打开的文件、环境、内存映射、网络状态。这让你调*目标*容器的实际运行时。
- **局限——无卷：** 你**不能给临时容器挂卷**（它们加到现有 pod spec，而后者不能新增卷挂载）。故你能通过 proc 看进程/文件系统，但不能挂新工具卷。

**怎么排查/定位/修复：**
1. 注入调试容器共享目标 PID：`kubectl debug -it pod/foo --image=busybox:1.36 --target=app -- sh`。
2. 定位挂起：`ps aux` 找到应用进程 PID，看它在什么状态；`cat /proc/<pid>/status`、`/proc/<pid>/wchan` 看它卡在哪个系统调用（如卡在网络读）。
3. 查连接：用带更多工具的镜像（如 `nicolaka/netshoot`）`kubectl debug ... --image=nicolaka/netshoot`，跑 `ss -tanp`、`curl` 看是否卡在某个下游依赖的连接上。
4. 若怀疑是节点层面（磁盘满、kubelet、容器运行时）：用 **`kubectl debug node/<node>`**，它在节点上起一个特权 pod 并把主机文件系统挂在 `/host`——让你调节点本身而非 pod。
5. 定位后修复（如加超时、扩连接池），临时容器随 pod 生命周期自动消失、不污染 spec。

**面试常追问 / 权衡：** 临时容器给 scratch/distroless 镜像临时加 shell/工具而不重启 pod（保住现场）。`--target` 共享目标容器的 PID（有时 net）命名空间，能 `ps`、读 `/proc/<pid>`。做主机级检查（节点文件系统、kubelet、运行时、主机进程）用 `kubectl debug node/<node>`，挂主机根到 `/host`。局限：不能给临时容器挂卷（加到现有 pod spec，不能新增卷挂载）。权衡：临时容器无法预置到镜像里，是运行时注入；且需要集群启用该特性（较新 K8s 默认开）。

**要点：**
- 给 scratch/distroless 加 shell，不重启 pod（保现场）
- `--target` 共享目标 pid/net，可 `ps`、读 `/proc/<pid>`
- `kubectl debug node/<node>` 做主机级检查（挂到 `/host`）
- 不能给临时容器挂卷；用 netshoot 等带工具的镜像

---

### 93. 准入控制器

**频率：** 低

**题目：** 一次事故复盘发现：有人部署了个没设 resource limits 的服务，把节点内存吃光拖垮了同节点其他 pod；还有人从个人 Docker Hub 账号拉了个镜像上线。团队要求"任何 pod 上线前就必须带资源限制、且只能用公司 registry 的镜像"——不是靠人 review，而是集群自动挡。请解释准入控制器怎么做到，以及内置和自定义策略的选项。

**这是什么 & 为什么用它：** **准入控制器**是**在认证授权后、对象持久化到 etcd 前拦截 API server 请求**的钩子——能**拒绝或修改** create/update 的最后一道门，正是本案例"上线前就挡住"要的位置。它们分两种，顺序重要：**mutating 准入先跑**（能*改*对象——如注入 sidecar、加默认 label、设字段），**再跑 validating 准入**（只能*接受或拒绝*已定型的对象）。mutating 先于 validating 确保校验看到的是将真正存储的对象。

**落地这个案例：**
- **内置准入控制器**（编进 API server）提供核心安全网：
  - **LimitRanger**——给未指定的容器应用**默认 requests/limits**，并按命名空间 LimitRange 强制最小/最大。本案例"没设 limits 吃光内存"可用它给默认值兜底。
  - **ResourceQuota**——强制**命名空间级上限**（总 CPU/内存/对象数），拒绝超配额的 create。
  - **PodSecurity**——基于命名空间 label 强制 **Pod Security Standards**（privileged/baseline/restricted）。
- **动态/自定义策略**（Kubernetes 不自带的规则，如"只允公司 registry"）三种方式：
  - **ValidatingAdmissionPolicy**——in-tree、**基于 CEL** 的规则，定义为 Kubernetes 资源，由 API server 自身求值（无外部 webhook 要跑/维护）——适简单内联检查。
  - **准入 webhook**——API server 回调你的服务做校验/变更；策略引擎靠此接入。
  - **策略引擎**——**Kyverno**（策略写为 **Kubernetes 原生 YAML** 规则——易上手、无新语言）vs **OPA Gatekeeper**（策略写 **Rego**——更强大/表达但学习曲线陡）。两者强制自定义组织策略：**只允白名单 registry**（治本案例个人镜像）、**必需 label/annotation**、**禁特权 pod**、要求资源限制等。

**怎么排查/定位/修复：**
1. 治"必须带资源限制"：给命名空间配 **LimitRange**（默认值 + 最小/最大），LimitRanger 会给漏配的容器补默认并拒绝超界的；要硬性"必须显式声明"则用 Kyverno 写一条 validate 规则 `pattern: resources.limits`。
2. 治"只允公司 registry"：装 Kyverno，写规则校验 `image` 前缀必须是 `registry.mycompany.com/`，否则拒绝——用 `kubectl apply` 部署该 ClusterPolicy。
3. 先跑审计模式（Kyverno `validationFailureAction: Audit`）看现存多少 pod 会违反，修完再翻 `Enforce`。
4. 验证：提交一个用 `docker.io/someuser/x` 且无 limits 的 pod，确认被准入拒绝并报明原因。
5. 排查 webhook 本身：若部署突然全被拒或超时，`kubectl get validatingwebhookconfigurations`、看策略引擎 pod 是否健康——webhook 挂了可能阻塞所有请求（注意 `failurePolicy`）。

**面试常追问 / 权衡：** 准入在认证授权后、持久化前拦截；mutating 先于 validating 跑（校验看到最终对象）。内置 LimitRanger + ResourceQuota + PodSecurity 做安全网。自定义规则三选：CEL 的 ValidatingAdmissionPolicy（in-tree、无 webhook、适简单）、准入 webhook、策略引擎 Kyverno（YAML）vs Gatekeeper（Rego）。合起来把 API server 变成强制点，任何东西跑前组织规则已被保证。权衡：webhook 型策略引擎功能强但引入外部依赖（挂了/超时可能阻塞集群，需谨慎设 `failurePolicy` 和排除关键命名空间）；CEL 内联策略无此风险但表达力有限。

**要点：**
- Mutating 先于 validating；准入是持久化前最后一道门
- LimitRanger（默认/限 limits）+ ResourceQuota + PodSecurity 内置安全网
- 自定义：Kyverno（YAML）vs Gatekeeper（Rego）、CEL ValidatingAdmissionPolicy
- 先审计后 enforce；注意 webhook 挂掉可能阻塞集群（failurePolicy）

---

### 94. 矩阵构建

**频率：** 低

**题目：** 你维护一个开源库，用户不断报"在 Windows + 老版本运行时上崩了"，但你的 CI 只在一个 Linux + 最新运行时上测，根本复现不了；后来有人扩了矩阵，CI 分钟数一个月翻了三倍、账单爆了，而且一个组合失败就把其他结果全取消看不到。请解释矩阵构建怎么用、以及这些陷阱怎么避。

**这是什么 & 为什么用它：** **矩阵构建**把**同一作业跨多个维度的笛卡尔积跑**——自动对多种组合测试/构建而非为每个写单独作业，正好解决本案例"只测一个组合、漏掉 Windows + 老运行时"。常见维度：**OS**、**语言/运行时版本**、**架构**。

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    node: [18, 20, 22]
```

这展开为 **2 × 3 = 6 个并行作业**（每 OS × 每 Node 版），验证你代码在所支持处都能工作。库靠此证明跨版本/平台兼容。

**落地这个案例——关键控制：**
- **加上遗漏的维度：** 把 `windows-latest` 和老运行时版本加进矩阵，本案例那个"Windows + 老版本崩"的组合就会被 CI 覆盖到，复现不再靠用户报。
- **`fail-fast: false`（治本案例结果被全取消）：** 默认 CI 在一个失败瞬间**取消所有剩余矩阵作业**（`fail-fast: true`）。设 **false** 让**每个组合跑完**，你一次看到**所有**失败（如"Node 18 *和* macOS 都挂"）而非修一个、重跑、再发现下一个。诊断多维问题时好很多。
- **`include` / `exclude`（治本案例账单爆炸）：** 构**稀疏矩阵**——`exclude` 移除无意义的特定组合（如跳 macOS × Node 18），`include` 加纯积之外的一次性额外组合（或额外参数）。避免在无关组合上浪费资源，并能覆盖特例而不爆整个矩阵。

**怎么排查/定位/修复：**
1. 复现本案例用户 bug：在矩阵里加 `os: windows-latest` + 目标老运行时版本，让 CI 跑出那个失败组合。
2. 看全所有失败：设 `fail-fast: false`，一次拿到全部组合的红绿，定位是仅 Windows 还是所有老版本都挂。
3. 治账单：审矩阵总作业数（= 各维度**乘积**），用 `exclude` 剪掉无意义组合（如某 OS 不支持的运行时），只保留你**真支持**的版本/平台。
4. 用 `include` 精准补特例（如只在一个组合上跑额外的集成测试），而不是给整轴加值把矩阵撑大。
5. 持续盯总作业数——每作业耗 runner 和 CI 分钟，加一个 2 值轴可能把 6 作业变 18。

**面试常追问 / 权衡：** 矩阵 = 维度的笛卡尔积；`fail-fast: false` 看全部结果而非首败即停；`include`/`exclude` 做稀疏矩阵剪浪费/补特例。核心陷阱是**乘法成本**：矩阵大小是所有维度的乘积，成本乘法而非加法增长——给一轴加第三个值、再加一个 2 值轴能把 6 变 18，不慎的矩阵飙升构建时间与账单（本案例翻三倍）。权衡：矩阵覆盖越全越能提前抓兼容 bug，但成本乘法上涨，要在覆盖与成本间取舍——只测真支持的组合，其余 `exclude` 剪掉。

**要点：**
- 维度笛卡尔积；补齐遗漏组合（Windows/老运行时）才能复现 bug
- `fail-fast: false` 一次看全部失败
- `include`/`exclude` 稀疏矩阵剪浪费、补特例
- 成本乘法增长，盯总作业数控账单

---

### 95. 构建可复现性与溯源

**频率：** 低

**题目：** 一个安全客户要求你们证明"发布的二进制确实是从公开的这个 commit 构出来的、没被塞后门"，你们试着在另一台机器上从同一 commit 重构，结果 hash 和发布版对不上——一查是构建把当前时间戳刻进了产物、还用了 `FROM node:latest` 拉到了新版本。请解释构建可复现性与溯源，以及怎么做到。

**这是什么 & 为什么用它：** **可复现性**意味**相同输入产出字节相同的输出**——从同一源重建，每次、任何机器上都得到*hash 完全相同*的制品。这正是本案例客户要的**可验证性**（任何人重建并确认发布二进制与源匹配——无隐藏篡改），也是可信缓存/attestation 的基础。不可复现构建埋隐藏变异（时间戳、绝对路径、依赖漂移），使*同一 commit* 的两次构建不同，挖掉验证——本案例 hash 对不上就是这些变异造成的。

**落地这个案例——如何实现可复现：**
- **按 digest 钉基础镜像（治本案例 `node:latest` 漂移）**——`FROM node@sha256:...` 而非 `FROM node:latest`。tag 可变（明天可指新镜像）；**digest** 是不变内容，基础不会在你脚下变。
- **用 lockfile 钉依赖**——`package-lock.json`、`poetry.lock`、`go.sum`、`Cargo.lock`——使每次构建解析到**完全相同的依赖版本与 hash**，而非"最新的"。
- **用 `SOURCE_DATE_EPOCH` 固定时间戳（治本案例时间戳刻入）**——多工具把*当前*构建时间刻入输出，使每次不同。设这个标准环变量强制**确定、固定的时间戳**，使文件 mtime/元数据可复现。
- **构建期无网络**——禁止构建时从网络取任何东西（钉定、hash 验证的输入除外），使移动远端资源改不了输出。构建所需一切钉定并 vendored。

**溯源**——互补的信任制品：一个签名记录的**谁从哪里、如何构了什么**。生成 **SLSA 溯源**作为 **in-toto attestation**——签名声明记录**源（commit）、构建器（哪个 CI 系统/工作流）、构建参数、及结果制品 digest**。然后在**部署/准入时验证溯源**，使**只有你可信流水线从可信源构的制品能跑**——攻击者塞不进别处构的镜像，因它缺有效溯源。

**怎么排查/定位/修复：**
1. 定位本案例的不确定性源：在两台机器构出的两份产物上做 `diff`，或用 `diffoscope` 逐层比对，看差异到底在哪（多半是时间戳、绝对路径、依赖版本）。
2. 治时间戳：构建前 `export SOURCE_DATE_EPOCH=$(git log -1 --format=%ct)`，让 mtime 取 commit 时间而非当前时间。
3. 治依赖/基础镜像漂移：把 `FROM node:latest` 改成 `FROM node@sha256:...`，提交并锁定 lockfile，构建时用 `--frozen-lockfile`/`npm ci` 等禁止解析新版本。
4. 断网构建：BuildKit 里限制网络、所有输入 vendored，确保远端变动改不了输出。
5. 验证可复现：CI 里两台不同机器各构一次、比对制品 hash 应完全相同；再生成 SLSA 溯源 attestation 交给客户，客户重构 + 验溯源即可确认无篡改。

**面试常追问 / 权衡：** 可复现 = 相同输入产出字节相同输出。四招：digest 钉基础镜像、lockfile 冻结依赖、`SOURCE_DATE_EPOCH` 固定时间戳、构建期无网络。溯源是 SLSA in-toto attestation，记录源/构建器/参数/制品 digest，在部署/准入时验证使只有可信流水线的制品能跑。可复现 + 溯源合起来给出从源码到运行制品的可审计、防篡改链。权衡：完全可复现需要投入（断网、vendoring、消除所有非确定性），很多项目只做到"接近可复现"；溯源验证增加部署环节但换来强供应链保证。

**要点：**
- 按 digest 钉基础镜像 + lockfile 冻结依赖（治漂移）
- `SOURCE_DATE_EPOCH` 固定时间戳（治时间刻入）
- 构建期无网络；用 diffoscope 定位不确定性源
- SLSA 溯源 attestation 建源到制品的可审计信任链

---

### 96. Ansible vs Salt vs Chef vs Puppet

**频率：** 低

**题目：** 你接手一个老平台：几千台常驻服务器靠 Puppet agent 持续收敛保合规，但团队正在往容器 + Packer 烤 AMI 的不可变模式迁，纠结"新流程还要不要配置管理、选哪个"。同时另一批临时机器要快速批量装依赖、跑一次性运维任务。请对比 Ansible、Salt、Chef、Puppet，并说清它们在不可变基础设施时代的定位。

**这是什么 & 为什么用它：** 四者都做**配置管理**——把机器带到并保持在期望状态（装包、写配置文件、起服务），但在**架构、语言、执行模型**上分野，本案例两类需求（存量常驻舰队 vs 临时批量任务/烤镜像）恰好落在不同工具的强项上。

**落地这个案例——四者对比：**
- **Ansible——无 agent、走 SSH、YAML、推模型。** 无需目标机装 agent：控制机经 **SSH** 连过去、推并跑任务。playbook 是 **YAML**（读写门槛低），执行是**推**（你从控制点主动发起运行）。**最易上手**——装 Python + SSH 即可，故成配置管理的事实主导者。本案例"临时机器批量装依赖 + 一次性运维任务 + Packer 烤镜像"正是它的甜区。典型：
```yaml
- hosts: web
  tasks:
    - name: 装 nginx
      apt: { name: nginx, state: present }
```
- **Salt——agent 或 salt-ssh、YAML/Jinja、事件驱动且快。** 既可用 **minion agent**（走 ZeroMQ 高速消息总线，管大舰队极快），也可 **salt-ssh** 无 agent 跑。状态用 **YAML + Jinja** 模板。强项是**事件驱动**——minion 可对事件反应（reactor 系统），适合响应式自动化与大规模。
- **Chef——Ruby DSL、基于 agent、声明式。** 配置写成 **Ruby DSL**（"recipe"/"cookbook"），表达力强但要会点 Ruby。目标机跑 **chef-client agent**，周期性从服务器拉并收敛到期望态。偏程序员向。
- **Puppet——声明式 DSL、基于 agent、长命企业舰队。** 自有**声明式 DSL**，agent 定期从 Puppet master **拉**目录并收敛。在**长命企业舰队**（数千台常驻服务器要持续合规与漂移纠正，正是本案例存量平台）里久经考验，是老牌企业选择。

**不可变基础设施如何收窄其用途（本案例迁移的核心）。** 随**容器与 Packer 烤的 AMI/镜像**兴起，模式从"起一台裸机再用配置管理反复调它"转向"**构一个不可变镜像、原样部署、要改就重建镜像换掉**"。这把配置管理的角色从*运行时持续收敛*收窄到*镜像构建期*——你可能在 Packer 构建里用 Ansible 烤镜像，但不再对活服务器天天跑收敛。**Ansible 因无 agent、简单，在 OS 级供给（装依赖、初始化、烤镜像、临时运维任务）上仍很流行**，而 Chef/Puppet 那种重 agent、持续收敛的模型在不可变世界里需求下降。

**怎么排查/定位/修复（本案例迁移决策）：**
1. 存量 Puppet 舰队：只要还是常驻可变服务器，就保留 Puppet 收敛保合规，别急着拆。
2. 新的不可变流程：把配置管理从"运行时收敛"移到"镜像构建期"——用 Ansible 在 Packer `provisioner` 里烤 AMI，产出不可变镜像。
3. 临时机器/一次性任务：直接用 Ansible（无 agent、SSH 即用）批量执行，不必给临时机装 agent。
4. 判断是否还需持续收敛：若换成不可变部署（改配置 = 重建镜像重部署），运行时收敛就多余了，可逐步退役 agent。
5. 排查配置漂移：迁移期常见"活服务器和镜像不一致"，用 Ansible 的 `--check`（dry-run）或 Puppet 的 `--noop` 先看会改什么再动手。

**面试常追问 / 权衡：** Ansible 无 agent、YAML、推、最易上手；Salt 快、事件驱动、agent 或 salt-ssh；Chef Ruby DSL、基于 agent；Puppet 声明式 DSL、基于 agent、企业长命舰队。不可变基础设施把配置管理从运行时持续收敛收窄到镜像构建期——Ansible 因简单在 OS 供给/烤镜像/临时任务上仍流行，Chef/Puppet 的重 agent 持续收敛模型需求下降。权衡：agent 模型（Salt/Chef/Puppet）大规模持续合规强但要维护 agent 基础设施；无 agent（Ansible）简单但推模型在超大规模下不如消息总线快。

**要点：**
- Ansible：无 agent、YAML、推，烤镜像/临时任务甜区
- Salt：快、事件驱动；Chef/Puppet：基于 agent、企业长历史
- 不可变基础设施把配置管理收窄到镜像构建期
- 存量收敛舰队保留、新流程移到 Packer 构建期，逐步退役 agent

---

### 97. 边缘 / 全球负载均衡

**频率：** 低

**题目：** 你们的服务只部在 us-east，欧洲和亚洲用户抱怨页面又慢又常超时；更糟的是上次 us-east 整个区域故障，你们靠改 DNS 切到备用区，但因为 DNS TTL 缓存，用户断了将近半小时才恢复。管理层要求"全球用户都低延迟、且单区域挂掉能秒级自动切走"。请解释边缘与全球负载均衡的分层架构怎么实现。

**这是什么 & 为什么用它：** 以低延迟和区域韧性服务全球用户，需要**从 DNS 边缘向下到集群堆叠多层负载均衡**，每层解决一块——本案例的"欧亚慢"靠边缘 + 就近路由解决、"切换半小时"靠全球 LB 的 anycast 故障切换解决。

**落地这个案例——四层：**
- **1. Anycast DNS（入口）。** 请求从 DNS 起。**延迟/地理感知 DNS**（**Route53 基于延迟的路由**、**Cloudflare**）**按用户位置/延迟**把主机名解到 IP，导向最近区域。常走 **anycast** 使 DNS 解析本身命中最近 DNS 节点。粗（DNS 级、受 TTL 缓存）但把用户导到对的区域。
- **2. CDN/边缘（靠近用户终止 TLS，治本案例欧亚慢）。** **CDN/边缘网**（**CloudFront、Cloudflare、Fastly**）有**全球 PoP**，**靠近用户终止 TLS**——昂贵的 TLS 握手发生在附近边缘（低 RTT）而非遥远源站，大幅降连接延迟。边缘也缓静态内容并可经优化骨干链把动态请求回源。
- **3. 区域负载均衡器。** 每区域内，**区域 LB**（AWS 上 **ALB/NLB** 或 GCP 区域 LB）**前置集群 ingress**——把流量分到该区的 ingress 控制器/服务/pod，在区域级做健康检查与连接分发。
- **4. 全球负载均衡器（anycast IP + 故障切换，治本案例切换半小时）。** **全球 LB**（**AWS Global Accelerator**、**GCP Global Load Balancer**）提供**稳定 anycast IP**，在网络层**把流量导向最近的健康区域**——用户连一个 anycast IP 并经提供商私有骨干路到最近区域。关键是启用**自动区域故障切换**：若整个区域不健康，全球 LB **自动把流量移到次近的健康区域**，无需等 DNS TTL 过期（正是本案例仅 DNS 故障切换半小时的弱点）。

**怎么排查/定位/修复：**
1. 治欧亚慢：先量——从欧洲/亚洲探针跑 `curl -w` 看 TLS 握手 vs 首字节耗时，若 TLS 握手占大头说明是往 us-east 远程握手，接入 CDN 在本地 PoP 终止 TLS。
2. 多区域部署：把服务扩到 eu、ap 区域，各配区域 LB 前置本区集群。
3. 治切换慢：不靠改 DNS 切区，改用全球 LB（Global Accelerator/GCP GLB）的稳定 anycast IP + 健康检查，区域挂掉时网络层秒级切到次近健康区。
4. 验证故障切换：主动下线一个区域（或 fail 其健康检查），观测全球 LB 是否秒级把流量移走、用户无长时间中断。
5. 复盘 DNS TTL：若仍有 DNS 层切换，把 TTL 调短，但根本方案是把跨区故障切换下沉到全球 LB 的网络层。

**面试常追问 / 权衡：** 四层——anycast/地理 DNS 导向最近区域（粗、受 TTL）；CDN/边缘就近终止 TLS 降延迟 + 缓静态；区域 LB（ALB/NLB）区内分发；全球 LB（Global Accelerator/GCP GLB）给稳定 anycast IP + 网络层自动区域故障切换（不等 DNS TTL）。合起来兼得低延迟（最近健康位置）与韧性（自动区域故障切换）。权衡：DNS 故障切换简单但受 TTL 缓存拖慢（本案例半小时）；全球 LB 切换快但多一层付费基础设施；多区域部署提升韧性/延迟但成本与数据一致性复杂度上升。

**要点：**
- DNS + CDN + 区域 LB + 全球 LB 分层，各解一块
- TLS 在边缘就近终止降延迟（治远程握手慢）
- 全球 LB 提供 anycast IP + 网络层自动区域故障切换
- DNS 故障切换受 TTL 拖慢，跨区切换应下沉到全球 LB

---

### 98. 追踪采样策略

**频率：** 低

**题目：** 你们用 1% 概率采样发送分布式追踪，某天线上出现间歇性 500 错误，你打开追踪系统想看那条出错请求的完整调用链，却发现它根本没被采到——1% 的错误请求只有 1% 概率留下。团队想改成"错误和慢请求一条不漏、正常流量少留点"。请解释基于头、基于尾、自适应三种采样策略。

**这是什么 & 为什么用它：** 高流量系统里存**每一条** trace 贵不可担（量 + 成本），故**采样**——只留子集。策略差在*何时*做留/弃决定，这决定你能留什么——本案例"错误没采到"正是采样时机选错的后果。

**落地这个案例——三种策略：**
- **基于头采样（本案例现状，漏错）**——在**请求最开始**、还不知结果时就决。通常**概率性**：如"留 1% trace"（请求入口抛硬币，传播下去使整条 trace 一致地留或弃）。**优：** 极简单且便宜——无需缓冲 span，决定即时、本地。**劣：** 因上来盲决，你会**随机弃掉稀有但重要的 trace**——一条错误或慢请求只有 1% 机会被留，故你错过大多数恰欲调查的 trace（正是本案例）。
- **基于尾采样（治本案例，保错）**——**先收一条 trace 的所有 span，看完整 trace 后再决**。因现在*知*结果，可用聪明策略：**100% 留出错或慢的 trace**，只**对无聊的成功 trace 采样**（如 1%）。这**有用得多**——你保留重要的（错误、延迟尖刺）而弃日常噪声。**代价：** collector 必须**把每条在飞 trace 的所有 span 缓在内存**直到 trace 完成并决定——可观内存/基础设施开销，且协调多服务到达的 span 复杂。
- **自适应采样**——**动态调采样率以命中目标量/吞吐**。不是固定 1%，而随流量变化升降率使你落在期望的 trace/秒附近（流量尖刺时保成本与后端容量、安静时多捕）。

**怎么排查/定位/修复：**
1. 确认本案例根因：追踪系统里那条 500 请求查无踪迹，是基于头采样在入口就 1% 抛硬币丢掉了它——不是系统 bug。
2. 切到基于尾采样：在 collector（如 OpenTelemetry Collector 的 `tailsamplingprocessor`）配策略——`status_code == ERROR` 100% 留、`latency > 阈值` 100% 留、其余按 1% 概率。
3. 给 collector 加内存/容量：尾采样要缓所有在飞 span，观测 collector 内存与缓冲区，必要时扩容或调缓冲窗口。
4. 若成本仍高：叠加自适应采样，把"无聊成功流量"的目标 trace/秒定住，流量尖刺时自动降率保后端。
5. 验证：故意触发一个错误请求，确认它这次 100% 出现在追踪系统里、调用链完整。

**面试常追问 / 权衡：** 基于头（入口概率决、便宜但可能漏错）、基于尾（看完整 trace 再决、能 100% 保错/慢但 collector 要缓所有在飞 span、开销大且协调复杂）、自适应（动态调率命中目标吞吐）。指导原则：**始终 100% 留错误**（通常连同异常慢的）——那些才有诊断价值，这正是基于尾尽管有代价却常被偏好的原因：只有看完 trace 再决才能保证留下每条错误。权衡：头便宜但漏重要 trace；尾诊断价值高但基础设施成本与复杂度高；实践常头+尾/自适应组合平衡成本与覆盖。

**要点：**
- 头：入口概率决、便宜、可能漏错（本案例根因）
- 尾：看完整 trace，100% 保错/慢、采样其余（治本案例）
- 尾采样 collector 要缓所有在飞 span，注意内存开销
- 自适应命中目标量；始终 100% 保错误

---

### 99. 混沌工程

**频率：** 低

**题目：** 你们的架构文档信誓旦旦写着"任一 pod 挂掉流量会秒级转走、单 AZ 故障有多活兜底"，但没人真验证过；结果上次某 AZ 真出问题时，故障切换没生效、超时配置也不对，凌晨 3 点被叫醒手忙脚乱。管理层问"怎么在事故前就发现这些韧性其实根本不生效"。请解释混沌工程：是什么、如何实践、工具有哪些。

**这是什么 & 为什么用它：** **混沌工程**是**向（类生产或生产）系统故意注入故障以验证它真有韧性**的实践——把本案例这种"文档上写着有韧性但没验证过"的假设变成经测试的事实。你注入如**杀 pod、加网络延迟/丢包、耗尽 CPU/磁盘、模拟整个 AZ/区域中断**的故障，再观察系统是否如设计应对。

**落地这个案例：**
- **它是假设驱动，非随机乱来。** 纪律是*科学*的：你陈述**关于稳态行为的假设**、注入特定故障、检现实是否匹配。针对本案例就写成"**若杀此服务一个 pod，流量应在 5 秒内转到健康 pod 且无用户可见错误**"——然后杀 pod 并度量。假设成立，你验证了该韧性机制；不成（像本案例故障切换失效），你在事故*前*找到真实弱点。无假设地随机搞坏只造故障。
- **从小开始、再扩展。** 先做**办公时间内小、受控的实验**（杀单个 pod、加适度延迟）——关键是*工作时间*，团队在盯，出事能中止，且爆炸半径有限。信心涨后升到 **"game day"**——计划的、更大规模的演习，模拟如**全区域故障切换**的重大故障（正是本案例该提前演练的），作为团队验证 DR 流程、runbook 和人的响应，而非只软件。

**怎么排查/定位/修复：**
1. 先写假设复现本案例担忧：如"杀 payments 一个 pod，5 秒内流量转走、错误率不升"；"fail 一个 AZ 的实例，多活应无缝兜底"。
2. 小规模验证：办公时间用 Chaos Mesh 声明一个 PodChaos 杀单 pod，盯 SLO 面板看错误率/延迟是否真如假设。
3. 若发现故障切换不生效（本案例的问题）：定位是健康检查太慢、超时配置过长、还是重试没配——逐项修（如缩健康检查间隔、设合理超时与重试）。
4. 升级到 game day：注入整个 AZ 中断（如 AWS FIS 的 AZ 中断模拟），验证多活兜底和 runbook，暴露人和流程的问题。
5. 每次实验都定好**中止条件（abort/blast radius）**，SLO 一破立即停止注入、回滚，避免把演练变成真事故。

**面试常追问 / 权衡：** 混沌工程是假设驱动、非随机——陈述稳态假设、注入特定故障、验证现实是否匹配。从小（办公时间、单 pod、可中止、爆炸半径有限）扩到 game day（大规模演习验证 DR/runbook/人）。工具：Chaos Mesh 和 LitmusChaos（K8s 原生，实验声明为 CRD，杀 pod、注网络/IO 故障）、Gremlin（商业 SaaS，广泛故障目录 + 安全控制）、AWS FIS（AWS 原生，跨 EC2/ECS/EKS/RDS 注故障，含 AZ 中断模拟）。价值：在真实凌晨 3 点事故前确认故障切换、重试、超时、自动扩缩、冗余真能工作。权衡：在生产做混沌有真实风险，必须限爆炸半径、设中止条件、先在类生产环境练熟；收益是把未经验证的韧性假设变成事实。

**要点：**
- 假设驱动、不随机；写明稳态假设再注入验证
- 从小（办公时间、单 pod、可中止）扩到 game day（AZ 故障/DR 演练）
- 工具：Chaos Mesh、Litmus、Gremlin、AWS FIS
- 限爆炸半径 + 设中止条件；事故前验证故障切换/超时/重试真生效

---

### 100. 策略即代码（OPA、Kyverno、Conftest）

**频率：** 低

**题目：** 一次审计翻出一堆问题：有人在 Terraform 里建了个公开可读的 S3 桶存了敏感数据、多个资源没打 `team`/`cost-center` label 导致成本分摊算不清、还有 pod 没设资源限制。这些本该在 wiki 规范里写着，但没人每次都记得查。团队要求"把这些规则变成代码、自动挡，最好在开发者提 PR 时就拦下"。请解释策略即代码、工具格局与左移原则。

**这是什么 & 为什么用它：** **策略即代码**意味**把组织规则编码为版本控制、自动强制的代码**而非靠 wiki、清单、人工评审（正是本案例失灵的地方）。典型策略：**"只签名镜像可跑"、"每资源必有 `team`/`cost-center` label"、"无特权 pod"、"无公开 S3"、"必需资源限制"**——本案例的每个审计问题都对应一条。它们在**两处强制**：**准入控制**（不合规资源碰 API server 时拒）和/或 **CI**（部署前让流水线失败）。强制自动且一致——无需人记得去查。

**落地这个案例——工具对比：**
- **OPA / Gatekeeper**——用 **Rego**（OPA 专用策略语言）。很**强大、表达**（对结构化数据的任意逻辑），但 Rego 有**学习曲线**。Gatekeeper 把 OPA 集成为 Kubernetes 准入控制器。
- **Kyverno**——策略写为 **Kubernetes 原生 YAML** 规则。**无新语言要学**（懂 K8s YAML 就能写），能校验、变更、生成资源。对 K8s 为中心的团队更易上手（如强制本案例"必需资源限制"、"必有 label"）；通用性不如 Rego。
- **Conftest（治本案例 Terraform 公开 S3）**——在 CI 对***任何结构化文件***跑 **OPA/Rego**——不只活集群资源。指向 **Terraform plan、Dockerfile、Kubernetes manifest、JSON/YAML 配置**，它在**流水线里**对它们求你的策略。这让你在 **IaC 和 manifest 被应用前**就强制策略——本案例的公开 S3 桶在 `terraform apply` 前就被 Conftest 拦下。

**左移原则：** 尽早抓违反——**在 PR/CI 失败，而非部署时（更糟是生产）**。在 pull request 里（用 Conftest）阻不合规 Terraform 变更，给开发者在其工作上下文里即时反馈，而非变更晚在 `apply`/准入被拒（反馈慢）或溜进 prod。在作者时修更便宜更快，正是本案例"提 PR 时就拦下"的诉求。

**怎么排查/定位/修复：**
1. 把审计问题逐条写成策略：Conftest/Rego 规则"S3 桶 ACL 不得为 public"、"资源必有 `team`/`cost-center` tag"；Kyverno 规则"pod 必须有 resources.limits"。
2. 接进 CI：PR 流水线跑 `conftest test terraform-plan.json`，公开 S3 或缺 tag 直接让检查失败、挡住合并。
3. 接进准入：集群装 Kyverno/Gatekeeper，缺资源限制的 pod 在准入处被拒。
4. **先用审计模式推广：** 把策略翻到 **enforce**（*阻*违反）前，先以**审计/警告模式**跑——它**报**违反而不阻。这让你发现多少现有基础设施会失败（本案例存量违规不少）、修好它，避免启用当天突然弄坏所有人的部署。审计 → 修复 → enforce 是安全采纳路径。
5. 验证：提一个含公开 S3 的 PR，确认 CI 红；提一个无 limits 的 pod，确认准入拒绝。

**面试常追问 / 权衡：** 策略即代码把组织规则编码为版本控制、自动强制的代码，在准入和/或 CI 两处强制。工具：Kyverno（K8s 原生 YAML、易上手、能校验/变更/生成）vs OPA/Gatekeeper（Rego、强大表达但学习曲线，集成为准入控制器）；Conftest 在 CI 对任意结构化文件（Terraform/Dockerfile/manifest）跑 OPA/Rego，apply 前拦截。左移：尽早在 PR/CI 失败而非部署/生产，作者时修更便宜快。推广务必先审计/警告模式发现存量违规、修好再 enforce，避免上线当天弄坏所有部署。权衡：Rego 通用强大但难学，Kyverno 易上手但限于 K8s；策略越严越安全但也可能拖慢开发、误伤合法变更，需先审计校准。

**要点：**
- 策略即代码：规则编码、自动强制（治靠人记忆失灵）
- Kyverno（YAML）vs OPA/Gatekeeper（Rego）；Conftest 在 CI 扫 IaC/manifest
- 左移：在 PR 就拦下公开 S3/缺 label/无 limits
- 强制前先审计模式发现存量违规，审计→修复→enforce
