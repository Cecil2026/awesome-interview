# DevOps 面试题

100 道关于 Docker、Kubernetes、CI/CD、基础设施即代码、可观测性、网络、安全和云的高频题。

---

### 1. 进程 vs 线程；解释 fork/exec

**频率：** 高

**题目：** 请解释进程和线程的区别，说明二者在地址空间、PID、文件描述符和内存共享上的差异；并讲清 fork() 和 exec() 各自做了什么：(1) fork() 如何克隆调用进程（写时复制、FD 复制、生成不同 PID 的子进程），(2) exec() 如何替换进程映像而保持 PID 不变，(3) shell 中 fork 然后 exec、父进程 wait 的经典模式，以及父进程不回收已结束子进程时为何会出现僵尸进程。

**答案：** 进程是隔离的地址空间，有自己的 PID、文件描述符和内存。线程在进程内共享内存且创建更便宜。`fork()` 克隆调用进程（内存写时复制、FD 复制），生出一个 PID 不同的子进程。`exec()` 用新程序替换当前进程映像，PID 不变。经典 shell 模式是子进程 `fork` 然后 `exec`，父进程 `wait`。父进程未回收已结束子进程时会出现僵尸。

**要点：**
- 线程共享堆；进程不共享
- `fork` 是 COW，未写入前便宜
- `exec` 保 PID 但换二进制
- 用 `wait`/`waitpid` 回收子进程避免僵尸

---

### 2. cgroups 与 namespaces

**频率：** 高

**题目：** 请对比 cgroups 与 namespaces：(1) namespace 隔离进程能看到什么以及有哪几种 namespace，(2) cgroup 如何限制并记账进程能用多少资源，(3) 为什么说容器就是带着 cgroup 上限运行在 namespace 内的进程，(4) cgroup v2 的统一层级，以及 Kubernetes 和 Docker 如何按 pod/容器写入 cgroup 子树来强制 request 和 limit。

**答案：** Namespace 隔离进程能看到什么（PID、NET、MNT、UTS、IPC、USER、CGROUP、TIME）；cgroup 限制并记账它能用多少（CPU、内存、IO、PID）。容器就是带着 cgroup 上限运行在 namespace 内的进程。cgroup v2 把层级统一为 `/sys/fs/cgroup` 下的单棵树。Kubernetes 和 Docker 按 pod/容器写入 cgroup 子树以强制 request 和 limit。

**要点：**
- Namespace = 隔离；cgroup = 配额
- 8 种 namespace；PID/NET 最显眼
- 推荐 cgroup v2 统一层级
- 查看：`systemd-cgls`、`cat /proc/self/cgroup`

---

### 3. TCP 三次握手与 TIME_WAIT

**频率：** 高

**题目：** 请描述 TCP 的三次握手建连过程（SYN、SYN-ACK、ACK）和拆连时双方的 FIN/ACK 交换；并解释 TIME_WAIT 状态：(1) 关闭发起方为何进入 TIME_WAIT 及其持续时间（2*MSL），(2) 该状态如何防止晚到的重复段干扰同一四元组上的新连接，(3) 繁忙客户端上大量 TIME_WAIT 套接字说明了什么，以及为什么应该用连接池、SO_REUSEADDR 或 net.ipv4.tcp_tw_reuse=1 来修复而不是关掉这个状态。

**答案：** 建连：客户端 SYN、服务端 SYN-ACK、客户端 ACK。拆连双方各发 FIN/ACK。关闭发起方进入 `TIME_WAIT`（2*MSL，通常 60s），让晚到的重复段不干扰同一四元组上的新连接。繁忙客户端上大量 `TIME_WAIT` 套接字提示短命对外连接；用连接池、`SO_REUSEADDR` 或 `net.ipv4.tcp_tw_reuse=1` 修复，而非关掉这个状态。

**要点：**
- SYN -> SYN/ACK -> ACK
- TIME_WAIT 防止陈旧段
- 池化连接而不是调内核
- 查看：`ss -tan state time-wait | wc -l`

---

### 4. DNS 记录与 TTL

**频率：** 高

**题目：** 请介绍常见 DNS 记录类型及其用途：A、AAAA、CNAME（为何在区域顶点不能与其他记录共存）、SRV、TXT、MX 各自映射或携带什么。再解释 TTL 的作用：它如何控制解析器缓存时长，低 TTL 的利弊，以及为什么迁移前应提前数小时降低 TTL 再切换记录。

**答案：** A 映射 IPv4，AAAA 映射 IPv6，CNAME 把一个名字别名到另一个（在区域顶点不能与其他记录共存），SRV 公告 service+port+priority+weight，TXT 携任意文本（SPF、ACME 挑战）。MX 路由邮件。TTL 控制解析器缓存时长；低 TTL 便于切换但抬高查询量。迁移前提前数小时降 TTL，然后切换记录。

**要点：**
- 顶点禁 CNAME（用 ALIAS/ANAME）
- Kubernetes headless 服务用 SRV
- 切换前降 TTL
- 用 `dig +trace name` 调试

---

### 5. 镜像 vs 容器 vs 层

**频率：** 高

**题目：** 请解释容器镜像、容器和层三者的关系：(1) 镜像作为不可变、内容寻址的文件系统层与元数据（entrypoint、env）捆绑，(2) 层作为一个构建步骤产生的 tar 差量如何按 digest 跨镜像去重，(3) 容器作为在镜像只读层之上加一个薄可写层的运行实例，以及为什么 pull 会复用磁盘上已有的层、基础镜像复用和顺序为何重要。

**答案：** 镜像是不可变、内容寻址的文件系统层与元数据（entrypoint、env）的捆绑。层是一个构建步骤产生的 tar 差量，跨镜像按 digest 去重。容器是基于镜像只读层之上加一个薄可写层的运行（或停止）实例。pull 会复用磁盘上已有的层，所以顺序和基础镜像复用很重要。

**要点：**
- 镜像 = 层 + config manifest
- 层是内容寻址的（sha256）
- 容器加一层可写上层
- 复用基础镜像最大化缓存命中

---

### 6. RUN vs CMD vs ENTRYPOINT

**频率：** 高

**题目：** 请对比 Dockerfile 中的 RUN、CMD 和 ENTRYPOINT：(1) RUN 在构建期执行并产生一层，(2) ENTRYPOINT 定义容器启动时始终运行的可执行，(3) CMD 提供默认参数或在无 ENTRYPOINT 时的默认命令。同时说明为什么应优先用 exec 形式而非 shell 形式（避免把 shell 作为 PID 1、正确处理信号），以及运行时如何通过 docker run image arg 覆盖 CMD。

**答案：** `RUN` 在构建期执行，产生一层。`ENTRYPOINT` 定义容器启动时始终运行的可执行。`CMD` 提供默认参数（或无 ENTRYPOINT 时的默认命令）。优先用 exec 形式（`ENTRYPOINT ["app"]`）而非 shell 形式以避免把 shell 作为 PID 1。运行时通过给 `docker run image arg1` 追加参数覆盖 `CMD`。

**要点：**
- RUN = 构建期层
- ENTRYPOINT = 固定二进制
- CMD = 默认参数 / 回退
- 用 exec 形式（JSON 数组）以正确处理信号

---

### 7. 层缓存顺序

**频率：** 高

**题目：** 请解释 Dockerfile 的层缓存机制以及如何优化指令顺序：(1) 每条指令如何按其输入缓存、改一条为何会破坏其后每一层，(2) 为什么应把变动少的步骤（基础镜像、系统包）放前面，把依赖清单（package.json、go.mod）和 RUN install 放在 COPY . . 源代码之前，(3) 这样安排如何把源代码改动的构建时间从分钟级降到秒级，以及按 digest 钉基础镜像和 BuildKit --mount=type=cache 的作用。

**答案：** 每条 Dockerfile 指令按其输入缓存；改一条会破坏其后每一层。把变动少的步骤放前面：基础镜像、系统包，然后依赖清单（`package.json`、`go.mod`），然后 `RUN install`，最后 `COPY . .` 源代码。这样源代码改动只需复用依赖层，把构建从分钟级降到秒级。

**要点：**
- 缓存从首次变更起失效
- 把清单复制在源代码之前
- 按 digest 钉基础镜像求可复现
- BuildKit `--mount=type=cache` 做包缓存

---

### 8. 多阶段构建

**频率：** 高

**题目：** 请解释 Docker 多阶段构建：如何用多个 FROM 阶段在重型工具链镜像中构建、再用 --from=stage 只复制产物到小型运行时镜像，为什么最终镜像不含编译器和源码从而攻击面最小，以及配合 distroless 得到最小 CVE 面并保持构建封闭。

**答案：** 用多个 `FROM` 阶段在重型工具链镜像中构建，只复制产物到小型运行时镜像。例：

```dockerfile
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/app /app
ENTRYPOINT ["/app"]
```

得到攻击面最小的小镜像，同时保持构建封闭。

**要点：**
- 分离构建 vs 运行时阶段
- 用 `--from=stage` 复制产物
- 最终镜像不含编译器/源码
- 配合 distroless 得到最小 CVE 面

---

### 9. 资源上限与 OOM

**频率：** 高

**题目：** 请解释容器资源上限与 OOM：(1) 无上限时容器为何会饿死主机、如何用 docker run --memory/--cpus 强制 cgroup 上限，(2) 容器超内存时内核 OOM 杀手如何终止进程、Docker 报 OOMKilled，(3) CPU 超限为何是节流而非杀，以及 Kubernetes 中 resources 的 requests（告知调度）与 limits（强制、超限被杀重启）之别，还有如何用 dmesg 查内核 OOM 事件。

**答案：** 无上限时，容器会饿死主机。`docker run --memory=512m --cpus=1` 强制 cgroup 上限。容器超内存时，内核 OOM 杀手终止进程，Docker 报 `OOMKilled`。CPU 超限是节流而非杀。Kubernetes 中设 `resources.limits.memory` 和 `requests` 告知调度；超 limit 的 pod 会被杀并重启。

**要点：**
- 内存超 limit -> OOMKill
- CPU 超 limit -> 节流
- `requests` 调度、`limits` 强制
- 看 `dmesg | grep -i oom` 看内核事件

---

### 10. Pod vs Deployment vs ReplicaSet vs StatefulSet vs DaemonSet vs Job vs CronJob

**频率：** 高

**题目：** 请对比 Kubernetes 中的这些工作负载资源：Pod、Deployment、ReplicaSet、StatefulSet、DaemonSet、Job、CronJob。分别说明 (1) Pod 作为最小单元和共置容器，(2) ReplicaSet 维护 N 个副本、Deployment 用滚动更新管理它作为无状态默认，(3) StatefulSet 为有状态工作负载提供稳定身份和有序滚动，(4) DaemonSet 每节点一个 pod，(5) Job 跑到完成、CronJob 按 cron 调度 Job。

**答案：** Pod 是最小单元，一个或多个共置容器共享网络/IPC。ReplicaSet 维护 N 个 pod 副本。Deployment 用滚动更新管理 ReplicaSet——无状态应用的默认。StatefulSet 给有状态工作负载（数据库）稳定身份和有序滚动。DaemonSet 每节点跑一个 pod（日志采集、CNI）。Job 跑到完成；CronJob 按 cron 调度 Job。

**要点：**
- 无状态用 Deployment
- 有序/身份绑定用 StatefulSet
- 每节点代理用 DaemonSet
- 批用 Job/CronJob

---

### 11. Service 类型

**频率：** 高

**题目：** 请介绍 Kubernetes 的 Service 类型：ClusterIP（集群内可达的虚拟 IP）、NodePort（每节点静态端口 30000-32767）、LoadBalancer（配置指向 NodePort 的云 LB）、ExternalName（返回外部主机的 CNAME）、Headless（clusterIP: None 跳过 VIP 并通过 DNS A/SRV 返回 pod IP）各自的行为和适用场景，尤其 Headless 在 StatefulSet 和服务发现中的用途。

**答案：** ClusterIP（默认）是集群内可达的虚拟 IP。NodePort 在每个节点的静态端口（30000-32767）上暴露服务。LoadBalancer 配置指向 NodePort 的云 LB。ExternalName 返回到外部主机的 CNAME。Headless（`clusterIP: None`）跳过 VIP 并通过 DNS A/SRV 记录返回 pod IP——StatefulSet 与服务发现用。

**要点：**
- ClusterIP：集群内 VIP
- NodePort：每节点同一端口
- LoadBalancer：前置云 LB
- Headless：基于 DNS、无代理

---

### 12. ConfigMaps vs Secrets

**频率：** 高

**题目：** 请对比 Kubernetes 的 ConfigMap 与 Secret：(1) 二者都作为 env var 或文件挂载的 key/value 存储，(2) ConfigMap 放非敏感配置、Secret 放凭证但在 etcd 中只是 base64 编码（需用 KMS 加密 etcd 才真安全），(3) 为什么应优先文件挂载让轮换无需 pod 重启就能传播（env var 不会自动更新），以及如何用 External Secrets Operator 集成 Vault/AWS Secrets Manager 做真相源。

**答案：** 两者都是作为 env var 或文件挂载的 key/value 存储。ConfigMap 放非敏感配置；Secret 放凭证，在 etcd 中静态 base64 编码（用 KMS 加密 etcd 才是真安全）。优先用文件挂载，让轮换无需 pod 重启即可传播（用 sidecar reloader 或应用文件 watcher）。真实密钥管理集成 External Secrets Operator 与 Vault/AWS Secrets Manager。

**要点：**
- Secret 是 base64，默认未加密
- 用 KMS 启用 etcd 静态加密
- 文件挂载自动更新；env var 不会
- 用 External Secrets Operator 做真相源

---

### 13. 卷、PV、PVC、StorageClass

**频率：** 高

**题目：** 请讲解 Kubernetes 的存储抽象：(1) PersistentVolume 作为表示真实存储的集群资源，(2) PersistentVolumeClaim 作为命名空间内的存储请求，(3) StorageClass 如何参数化动态供给、PVC 引用 SC 如何触发 CSI 驱动创建 PV，以及访问模式（RWO、ROX、RWX、RWOP）和回收策略（Retain/Delete）的含义。

**答案：** PersistentVolume 是表示真实存储（EBS、GCE PD、NFS）的集群资源。PersistentVolumeClaim 是命名空间内的存储请求。StorageClass 参数化动态供给——PVC 引用一个 SC 触发 CSI 驱动创建 PV。访问模式：RWO（一节点）、ROX（只读多）、RWX（读写多）、RWOP（一 pod）。回收策略：Retain/Delete。

**要点：**
- PV：集群资源；PVC：命名空间内 claim
- StorageClass 启用动态供给
- 访问模式：RWO/ROX/RWX/RWOP
- CSI 驱动做实际供给

---

### 14. 探针：liveness、readiness、startup

**频率：** 高

**题目：** 请对比 Kubernetes 的三种探针 liveness、readiness、startup：(1) readiness 如何控制流量（失败的 pod 从 Service endpoint 移除但不杀），(2) liveness 如何重启卡住的容器，(3) startup 如何延迟 liveness/readiness 直到慢启动应用就绪防止过早被杀，以及探针类型（HTTP/exec/TCP）的选择和错误配置如何引起级联重启（保守设 failureThreshold 与 periodSeconds）。

**答案：** Readiness 控制流量——失败的 pod 从 Service endpoint 移除但不杀。Liveness 重启卡住的容器。Startup 延迟 liveness/readiness 直到慢启动应用就绪，防止过早被杀。Web 服务用 HTTP 探针，CLI 用 exec，原始套接字用 TCP。错探针引起级联重启；保守设 `failureThreshold` 与 `periodSeconds`。

**要点：**
- Readiness 控制 Service 成员
- Liveness 在挂时重启
- Startup 保护慢启动
- 误配 -> 重启风暴

---

### 15. requests vs limits；QoS 类

**频率：** 高

**题目：** 请解释 Kubernetes 中 requests 与 limits 的区别，以及 QoS 类：(1) requests 为调度预留资源、limits 封顶实际使用，(2) 三种 QoS 类（Guaranteed、Burstable、BestEffort）如何根据 requests/limits 设置来判定，(3) 节点压力下的驱逐顺序（BestEffort 先、然后超 requests 的 Burstable、最后 Guaranteed），以及为什么延迟敏感服务应设 requests = limits 避免节流意外、CPU 超 limit 是节流而非 OOM。

**答案：** `requests` 为调度预留资源；`limits` 封顶实际使用。pod 得到 QoS 类：Guaranteed（所有容器 requests == limits）、Burstable（设了部分 requests）、BestEffort（都没设）。节点压力下，BestEffort 先被驱逐，然后是超 requests 的 Burstable，最后 Guaranteed。延迟敏感服务设 requests = limits 避免节流意外。

**要点：**
- requests = 调度；limits = 强制
- QoS：Guaranteed > Burstable > BestEffort
- BestEffort 先被驱逐
- CPU limit 引起节流而非 OOM

---

### 16. affinity、anti-affinity、taint、toleration、nodeSelector

**频率：** 高

**题目：** 请解释 Kubernetes 的调度约束：(1) nodeSelector 的简单 label 匹配，(2) 节点 affinity 的表达性版本（required/preferred），(3) pod affinity/anti-affinity 相对其他 pod 的共置或分散（如把副本分散到节点做 HA），(4) taint 如何排斥 pod（用于 GPU、spot 等专用节点池）以及 pod 上的 toleration 如何允许它被调度到有 taint 的节点。

**答案：** `nodeSelector` 是简单 label 匹配。节点 affinity 是表达性版本，带 required/preferred 规则。Pod affinity/anti-affinity 相对其他 pod 共置或分散（如把副本分散到节点）。Taint 排斥 pod 除非它们容忍；用于专用节点池（GPU、spot）。Pod 上的 toleration 让它能被调度到有 taint 的节点。

**要点：**
- nodeSelector：简单 label 匹配
- Affinity：required vs preferred
- Taint 排斥；toleration 允许
- Anti-affinity = 跨节点/区域 HA

---

### 17. Helm vs Kustomize

**频率：** 高

**题目：** 请对比 Helm 与 Kustomize：(1) Helm 作为模板加包管理器（chart、values.yaml、release、hook、回滚），(2) Kustomize 作为无模板的 overlay 方案（base/ 加环境 overlays/ 打补丁字段），(3) 各自的胜场（Helm 打包第三方应用、Kustomize 处理一方应用的轻量环境差异），以及如何混合使用（Helm 装供应商 chart、Kustomize 通过 helmCharts 在上面覆盖）和 ArgoCD 对两者的原生支持。

**答案：** Helm 是模板 + 包管理器：chart 带 `values.yaml`、release、hook、回滚。Kustomize 是无模板的 overlay——一个 `base/` 加环境 `overlays/` 打补丁字段。Helm 在打包第三方应用上胜；Kustomize 用于带轻量环境差异的一方应用。许多团队两者都用：Helm 装供应商 chart，Kustomize 在上面通过 kustomization.yaml 的 `helmCharts` 覆盖。

**要点：**
- Helm：模板 + 包管理
- Kustomize：overlay + 补丁、无模板
- 混合：在 Helm 输出上跑 Kustomize
- ArgoCD 原生支持两者

---

### 18. Blue/green 与 canary（Argo Rollouts、Flagger）

**频率：** 高

**题目：** 请对比 blue/green 与 canary 发布，以及 Argo Rollouts、Flagger 的作用：(1) blue/green 如何让老（蓝）与新（绿）都跑再切 Service selector 实现瞬时切换和便捷回滚，(2) canary 如何把一小比例流量转到新版本、观察指标后放大，(3) Argo Rollouts 和 Flagger 如何用分析步骤自动化 canary（查询 Prometheus/Datadog 看错误率/延迟并在回归时自动回滚）。

**答案：** Blue/green 让老（蓝）和新（绿）都跑，然后切 Service selector 实现瞬时切换和便捷回滚。Canary 把一小比例流量转到新版本、观察指标、然后放大。Argo Rollouts 和 Flagger 用分析步骤自动化 canary——查询 Prometheus 看错误率/延迟并在回归时自动回滚。

**要点：**
- Blue/green：通过 selector 瞬时翻转
- Canary：渐进百分比放大
- Prometheus/Datadog 的分析门控晋升
- Argo Rollouts CRD 或 Flagger 控制器

---

### 19. RBAC：Role vs ClusterRole

**频率：** 高

**题目：** 请解释 Kubernetes RBAC 中 Role 与 ClusterRole 的区别，以及 RoleBinding/ClusterRoleBinding 如何把主体（用户、组、ServiceAccount）链接到角色。请谈谈如何遵循最小权限原则给应用授权、避免滥用 cluster-admin，以及如何用 kubectl auth can-i 审计某个 ServiceAccount 的实际权限。

**答案：** Role 在一个命名空间内授权；ClusterRole 是集群范围或命名空间模板。RoleBinding/ClusterRoleBinding 把主体（用户、组、ServiceAccount）链接到角色。最小权限原则：应用避免 `cluster-admin`，把 SA 限定到所需 verb/资源。用 `kubectl auth can-i --list --as=system:serviceaccount:ns:sa` 审计。

**要点：**
- Role：命名空间内
- ClusterRole：集群或模板
- 绑定到用户/组/SA
- 用 `kubectl auth can-i` 审计

---

### 20. Pod Pending 诊断清单

**频率：** 高

**题目：** 假设一个 pod 长期处于 Pending 状态，请给出你的诊断清单。请说明如何从 kubectl describe pod 的事件入手，并逐一排查常见原因：CPU/内存资源不足（没有节点能容纳 requests）、不可满足的 nodeSelector/affinity/taint、PVC 未绑定（缺匹配 StorageClass 或配额）、镜像拉取待定、ServiceAccount 缺失、命中 ResourceQuota，以及如何查集群自动扩缩事件来定位扩缩容失败。

**答案：** 跑 `kubectl describe pod`。常见原因：CPU/内存不足（无节点能容纳 requests）、不可满足的 nodeSelector/affinity/taint、PVC 未绑定（无匹配 SC 或配额）、image pull 待定、SA 缺失、命中 ResourceQuota。查集群自动扩缩事件看扩缩容失败。PVC 问题用 describe PVC 找供给器错误。

**要点：**
- 先看 `kubectl describe pod` 事件
- 检查 requests vs 节点容量
- 验证 PVC 已绑且 SC 存在
- 查自动扩缩日志定位扩缩容失败

---

### 21. CrashLoopBackOff 清单

**频率：** 高

**题目：** 假设一个 pod 陷入 CrashLoopBackOff，请给出你的排查清单。请说明它启动、退出、按指数退避重启的行为，以及如何依次调查：用 kubectl logs --previous 看前一次退出、用 kubectl describe pod 看退出码、检查 command/args、缺失的 env 或 secret、init 容器中失败的迁移、OOMKilled、应用配置错误，以及如何确认不是 liveness 探针过激把它杀掉。

**答案：** Pod 启动、退出、按指数退避重启。调查：`kubectl logs --previous` 看前次退出、`kubectl describe pod` 看退出码、查命令/参数、缺 env 或 secret、init 容器中失败的迁移、OOMKilled、应用配置错误。探针失败可伪装为崩溃——确认 liveness 没过激。

**要点：**
- `kubectl logs --previous` 看前次启动
- describe 输出中的退出码
- 单独检查 init 容器
- 排除 liveness 探针杀它

---

### 22. OOMKilled

**频率：** 高

**题目：** 请解释 Kubernetes 中的 OOMKilled 是怎么发生的：容器内存超过 limit、内核 OOM 杀手介入。请说明如何从 kubectl describe pod 里识别 Reason: OOMKilled 和 Exit Code 137，如何修复（抬高 limits.memory、用 kubectl top pod 或 pprof/堆转储剖析真实用量、找内存泄漏），为什么 JVM/Node 在容器里需要显式堆 flag（-Xmx、--max-old-space-size）且要设在 cgroup limit 之下，以及应监控哪个指标（container_memory_working_set_bytes）。

**答案：** 容器内存超 limit；内核 OOM 杀手开火。`kubectl describe pod` 显示 `Reason: OOMKilled` 和 `Exit Code: 137`。修复：抬高 `limits.memory`、剖析真实使用（`kubectl top pod`、pprof、Java 堆转储）、找泄漏。JVM/Node 在容器内需要显式堆 flag（`-Xmx`、`--max-old-space-size`），设在 cgroup limit 之下。

**要点：**
- Exit 137 = OOM 的 SIGKILL
- 抬高 limit 或修泄漏
- JVM/Node 堆设在 cgroup limit 之下
- 监控 `container_memory_working_set_bytes`

---

### 23. CI vs CD vs 持续部署

**频率：** 高

**题目：** 请辨析持续集成（CI）、持续交付（Continuous Delivery）和持续部署（Continuous Deployment）三者的区别。请说明 CI 如何在每次提交时构建、测试并合入主线，持续交付如何让每个绿色构建可手动发布到 prod，持续部署又如何让每个绿色构建自动部署到 prod 而无手动门；并谈谈从 CI 到持续交付再到持续部署的成熟阶梯，以及采用持续部署需要哪些前提（强测试、可观测性、快速回滚）。

**答案：** 持续集成：每次提交构建、测试并合并到主线。持续交付：每次绿色构建可手动点击发布到 prod。持续部署：每次绿色构建自动部署到 prod——无手动门。成熟阶梯是 CI -> CDelivery -> CDeployment。有强测试、可观测性和快速回滚时选 CDeployment。

**要点：**
- CI = 频繁集成
- CDelivery = 始终可发
- CDeployment = 自动发
- 需要可观测性 + 安全回滚

---

### 24. GitOps（Argo CD、Flux）

**频率：** 高

**题目：** 请介绍 GitOps 及其代表工具 Argo CD 和 Flux：期望的集群状态存放在 Git、控制器如何持续把集群调和到与之匹配。请说明基于拉（pull-based）模式为何意味着集群主动伸向 Git、不需要入站 CI 凭证，谈谈它的好处（commit 审计轨迹、通过 git revert 回滚、漂移检测、多集群扇出），以及 image updater 如何在新镜像发布时在 Git 中更新 tag。

**答案：** 期望集群状态在 Git；控制器（Argo CD、Flux）持续把集群调和到匹配。基于拉：集群伸向 Git，无入站 CI 凭证。好处：commit 审计轨迹、通过 revert 回滚、漂移检测、多集群扇出。配合 image updater 在新镜像发布时在 Git 中升 tag。

**要点：**
- Git 是真相源
- 基于拉的调和
- 回滚 = `git revert`
- 漂移检测 + 自动同步

---

### 25. Terraform vs Pulumi vs CloudFormation vs CDK

**频率：** 高

**题目：** 请对比 Terraform、Pulumi、CloudFormation 和 CDK 四种 IaC 工具。请说明各自特点：Terraform（声明式 HCL、多云、庞大的 provider 生态、外部 state）、Pulumi（用真正的编程语言如 TS/Python/Go、同样的 provider 模型）、CloudFormation（AWS 原生 YAML/JSON、加特性慢）、CDK（命令式代码合成到 CloudFormation、开发体验好但以 AWS 为中心，另有 CDKTF 合成到 Terraform），并谈谈多云选 Terraform、AWS 独立且开发团队强则选 CDK 的取舍。

**答案：** Terraform：声明式 HCL、多云、巨大 provider 生态、外部 state。Pulumi：真编程语言（TS/Python/Go），同 provider 模型。CloudFormation：AWS 原生 YAML/JSON、加特性慢。CDK：命令式代码合成到 CloudFormation——DX 好、以 AWS 为中心。CDKTF 合成到 Terraform。多云选 Terraform，AWS 独立且强开发团队选 CDK。

**要点：**
- Terraform：声明式、多云
- Pulumi：真语言、同 provider
- CloudFormation：AWS 原生、慢
- CDK：代码 -> CFN（以 AWS 为重）

---

### 26. Terraform state、锁、漂移

**频率：** 高

**题目：** 请解释 Terraform 的 state、锁与漂移。请说明 state 如何把资源映射到真实 ID、为什么要用远程 state（S3 + DynamoDB 锁表、Terraform Cloud、GCS）以便团队共享且绝不 commit terraform.tfstate、锁如何防止并发 apply、漂移（真实基础设施与 state 不一致）如何用 terraform plan 检测，以及 terraform import 如何用于接纳既有资源。

**答案：** State 把资源映射到真实 ID。远程存（S3 + DynamoDB 锁表、Terraform Cloud、GCS）让团队共享；永远别 commit `terraform.tfstate`。锁防止并发 apply。漂移是真实基础设施与 state 不同——用 `terraform plan` 检测（无变 = 无漂移）或计划漂移检测。Refresh 导入未知变更。

**要点：**
- 远程 state 带锁
- 永不 commit state（含密钥）
- 漂移 = plan 与现实的 diff
- `terraform import` 用于接纳现有资源

---

### 27. VPC：子网、路由表、NAT 网关

**频率：** 高

**题目：** 请介绍 AWS VPC 的组成：带 CIDR 的私有网络（如 10.0.0.0/16）、按 AZ 切分的子网、路由表和 NAT 网关。请说明公子网如何通过 Internet Gateway 路由、私子网如何仅通过 NAT Gateway 出站,为什么工作负载应放私子网而 LB 放公子网,以及 NAT Gateway 为 AZ 范围、会按 AZ 产生数据传输成本、因此为 HA 应每个 AZ 部署一个。

**答案：** VPC 是带 CIDR（如 10.0.0.0/16）的私有网络。子网按 AZ 切分（10.0.1.0/24...）。公子网到 Internet Gateway 有路由；私子网仅出站通过 NAT Gateway 路由。把工作负载放私子网，LB 放公子网。NAT GW 是 AZ 范围且按 AZ 产生数据传输成本——HA 每 AZ 一个。

**要点：**
- 每 AZ 一子网做 HA
- 公 = IGW 路由；私 = NAT 路由
- 每 AZ 一 NAT GW
- 工作负载在私子网

---

### 28. 日志 vs 指标 vs 链路追踪

**频率：** 高

**题目：** 请辨析日志、指标和链路追踪三种可观测性信号。请说明各自特性：日志是带上下文的离散事件、自由格式、规模化查询昂贵;指标是数值时间序列、便宜、可聚合、应优先低基数;追踪是每请求的 span 树、展示跨服务因果;并谈谈何时用哪种（SLO/告警用指标、定位慢请求用追踪、已知事故要全细节用日志），以及 OpenTelemetry 如何统一这三种信号的生成。

**答案：** 日志：带上下文的离散事件、自由格式、规模化查询贵。指标：数值时间序列、便宜、可聚合、低基数优先。追踪：每请求 span 树显示跨服务因果。SLO/告警用指标，定位慢请求用追踪，已知事故全细节用日志。OpenTelemetry 统一三种生成。

**要点：**
- 指标：便宜、聚合
- 追踪：因果、按请求
- 日志：全细节、贵
- OpenTelemetry：统一生成

---

### 29. Prometheus 拉模型、exporter、recording rule

**频率：** 高

**题目：** 请介绍 Prometheus 的拉模型、exporter 和 recording rule。请说明 Prometheus 如何抓取 /metrics 端点、应用如何通过 client lib 暴露指标、其他系统如何用 exporter（node_exporter、blackbox_exporter、mysqld_exporter）包装、服务发现（k8s、EC2）如何找目标;并解释 recording rule 如何按计划预计算昂贵查询、alerting rule 如何在表达式为真时开火,以及如何通过联邦或 remote_write 把数据送到长期存储（Thanos、Mimir、VictoriaMetrics）。

**答案：** Prometheus 抓 `/metrics` 端点（拉）。应用通过 client lib 暴露指标；其他通过 exporter（node_exporter、blackbox_exporter、mysqld_exporter）包装。服务发现（k8s、EC2）找目标。Recording rule 按计划预计算昂贵查询；alerting rule 在表达式为真时开火。联邦或 remote_write 到长期存储（Thanos、Mimir、VictoriaMetrics）。

**要点：**
- 从 `/metrics` 端点拉
- Exporter 包装未埋点系统
- Recording rule 预计算聚合
- 长期：Thanos / Mimir / VictoriaMetrics

---

### 30. SLI / SLO / 错误预算

**频率：** 高

**题目：** 请解释 SLI、SLO 和错误预算三个概念。请说明 SLI 是可度量的指标（可用性、p99 延迟）、SLO 是该 SLI 在某窗口上的目标（30 天 99.9%）、错误预算是 100% 减去 SLO 得到的允许不可靠量（如 99.9% 对应每月约 43 分钟）;并谈谈如何把错误预算用于发布新特性、预算耗尽时停止有风险的发布,以及多窗口多燃烧率告警如何在快速燃烧时开火。

**答案：** SLI：可度量指标（可用性、p99 延迟）。SLO：该 SLI 在窗口上的目标（30 天 99.9%）。错误预算：100% - SLO = 允许的不可靠（如 99.9% 时每月 43m）。把预算用在发特性上；耗尽时停风险发布。多窗口多燃烧率告警在快速燃烧时开火。

**要点：**
- SLI 度量、SLO 目标
- 错误预算 = 1 - SLO
- 燃烧率告警快速消耗
- 耗尽时停风险变更

---

### 31. 事件响应：严重度、runbook、复盘

**频率：** 高

**题目：** 请描述事件响应的关键要素：严重度、runbook 与复盘。请说明严重度阶梯（Sev1 是影响客户的故障、全员上阵;Sev2 是服务降级;Sev3 是轻微）如何触发不同的响应级别、每个告警为什么应链到带诊断和缓解步骤的 runbook、事件期间应指派哪些角色（IC、通讯、记录员），以及事后如何做无指责复盘（记录时间线、贡献因素而非'根因'、带 owner 和截止日期的行动项）并跟踪行动项完成。

**答案：** Sev1 = 影响客户的故障、全员上阵；Sev2 = 服务降级；Sev3 = 轻微。每个告警链到带诊断和缓解步骤的 runbook。事件期间：指派 IC、通讯、记录员。之后：一周内做无指责复盘，记录时间线、贡献因素（不是"根因"）和带 owner、截止日期的行动项。跟踪行动项完成——这是多数团队失败之处。

**要点：**
- 严重度阶梯触发响应级
- 告警 -> runbook 始终
- 角色：IC、通讯、记录员
- 无指责复盘 + 跟踪行动

---

### 32. 成本优化

**频率：** 高

**题目：** 请介绍云成本优化的主要手段。请说明如何做右调（评审实际用量对比请求的 CPU/内存、削减过度供给，这是最大赢点）、如何对容错工作负载用 spot/preemptible（节省 60-90%）并用 Karpenter 自动混合 spot 与按需、如何对稳定基线用 Reserved Instance/Savings Plan/Committed Use、如何删除未挂载的 EBS/旧快照/闲置 LB、如何把 S3/GCS 生命周期切到低频访问,以及如何用打标签做 showback、设预算告警并靠 FinOps 文化让工程与成本责任对齐。

**答案：** 右调：评审实际 vs 请求的 CPU/内存；削过度供给。容错工作负载用 spot/preemptible（节省 60-90%）；Karpenter 自动混 spot + 按需。稳定基线用 Reserved Instance / Savings Plan / Committed Use。删未挂载 EBS、旧快照、闲置 LB。把 S3/GCS 生命周期切到低频访问。一切打标签做 showback 并设预算告警。FinOps 实践让工程与成本责任对齐。

**要点：**
- 先右调（最大赢点）
- 容错用 spot；Karpenter 混合
- 基线 commit（RI/SP/CUD）
- 生命周期存储分层 + 删浪费
- 标签 + 预算告警 + FinOps 文化

---

### 33. 文件描述符与 ulimit

**频率：** 中

**题目：** 请解释什么是文件描述符：它在内核每进程打开文件表中扮演什么角色，0/1/2 分别代表什么，套接字、管道、epoll 句柄如何消耗 FD。再说明默认软上限（通常 1024）为何会让高连接服务遇到 EMFILE: too many open files，以及如何分别在 shell（ulimit -n）、systemd 单元（LimitNOFILE）、/etc/security/limits.conf（nofile）中提高上限，并说明容器中 kubelet/Docker daemon 的设置对工作负载的封顶作用。

**答案：** 文件描述符是内核每进程打开文件表中的一个小整数索引。0/1/2 是 stdin/stdout/stderr。套接字、管道、epoll 句柄都消耗 FD。默认软上限（通常 1024）会让高连接服务遭遇 `EMFILE: too many open files`。用 `ulimit -n` 提高 shell 的上限；systemd 单元中用 `LimitNOFILE`；或在 `/etc/security/limits.conf` 中用 `nofile`。容器里 kubelet/Docker daemon 的设置封顶工作负载能请求的额度。

**要点：**
- FD 是每进程的整数索引
- `EMFILE` 意味着抬高 `nofile`
- systemd：`LimitNOFILE=`；k8s：容器运行时配置
- 查使用：`ls /proc/<pid>/fd | wc -l`

---

### 34. systemd 单元与 journalctl

**频率：** 中

**题目：** 请介绍 systemd 如何以单元管理服务：(1) 常见单元类型（.service、.timer、.socket、.mount、target），(2) 单元文件位置以及 [Service] 段中的 ExecStart、Restart=、User= 和资源上限等声明，(3) systemctl daemon-reload 与 systemctl enable --now 的作用，(4) 如何用 journalctl 查询服务日志（如 -u foo -f、--since），以及如何用 systemd-analyze blame 找慢启动单元和用 drop-in 覆盖配置。

**答案：** systemd 以单元（`.service`、`.timer`、`.socket`、`.mount`）管理服务。单元文件位于 `/etc/systemd/system/`，在 `[Service]` 中声明 `ExecStart`、`Restart=`、`User=` 和资源上限。`systemctl daemon-reload` 拾取改动；`systemctl enable --now foo` 设开机启动。日志进 journal；用 `journalctl -u foo -f` 或 `--since "1 hour ago"` 查询。用 `systemd-analyze blame` 找慢启动单元。

**要点：**
- 单元类型：service/timer/socket/mount/target
- `Restart=on-failure` + `RestartSec=` 增强韧性
- `journalctl -u <unit> -f` 看实时日志
- 在 `/etc/systemd/system/foo.service.d/` 用 drop-in

---

### 35. HTTP/1.1 vs HTTP/2 vs HTTP/3

**频率：** 中

**题目：** 请对比 HTTP/1.1、HTTP/2 和 HTTP/3：(1) HTTP/1.1 的文本协议和每连接一个在途请求（含流水线的头阻塞），(2) HTTP/2 的二进制、单 TCP 连接上多路复用流以及 HPACK 头部压缩和服务端推送，(3) HTTP/3 跑在 QUIC（UDP）上如何消除 TCP 头阻塞并通过 0-RTT 加快建连，以及为什么 gRPC 需要 HTTP/2、CDN 如何协商 HTTP/3。

**答案：** HTTP/1.1 是文本，每个 TCP 连接一个请求（或带头阻塞流水线）。HTTP/2 是二进制，单 TCP 连接上多路复用流，支持头部压缩（HPACK）与服务端推送。HTTP/3 跑在 QUIC（UDP）上，消除 TCP 头阻塞并通过 0-RTT 加快建连。gRPC 需要 HTTP/2；许多 CDN 自动协商 HTTP/3。

**要点：**
- H1：每连接一个在途
- H2：TCP 上多路复用流、HPACK
- H3：UDP 上 QUIC，无 TCP HoL
- gRPC 端到端需 H2

---

### 36. TLS 握手与证书链

**频率：** 中

**题目：** 请描述 TLS 握手过程：(1) 客户端与服务端如何协商 cipher 并交换密钥（ECDHE 如何实现前向保密），(2) 服务端出示的证书链（叶证书、中间证书）以及客户端如何一路验证到受信任根并检查 SAN 匹配主机名、有效期和吊销（OCSP/CRL），(3) TLS 1.3 相比旧版本的改进（1-RTT、去除遗留 cipher），以及缺中间证书、错 SAN、过期证书等常见误配置。

**答案：** 客户端与服务端协商 cipher 并交换密钥（ECDHE 实现前向保密）。服务端出示叶证书加中间证书；客户端验证链直到其存储中的受信任根，检查 SAN 匹配主机名、有效期与吊销（OCSP/CRL）。TLS 1.3 把握手缩减到一个往返并去除遗留 cipher。误配置包括缺中间证书、错 SAN 或过期证书。

**要点：**
- 叶 -> 中间 -> 受信根
- SAN 必须匹配主机名（CN 已遗留）
- TLS 1.3 = 1-RTT、强制 PFS
- 调试：`openssl s_client -connect host:443 -showcerts`

---

### 37. SSH 密钥、agent 转发、跳板机

**频率：** 中

**题目：** 请讲解 SSH 密钥与安全登录的最佳实践：(1) 为何使用带口令的 Ed25519 密钥并加载到 ssh-agent，(2) ForwardAgent 的作用及其在共享/不可信主机上的风险，(3) 为什么应优先用 ProxyJump（ssh -J）通过跳板机隧道而不暴露密钥，以及如何在 ~/.ssh/config 中配置可复用的跳转（Host、User、IdentityFile）。

**答案：** 使用带口令的 Ed25519 密钥（`ssh-keygen -t ed25519`），加载到 `ssh-agent`。`ForwardAgent yes` 将本地 agent 套接字转发到远端以便继续认证而无需复制密钥；在共享主机上有风险。优先 `ProxyJump bastion`（`ssh -J`）通过跳板机隧道，不暴露密钥。在 `~/.ssh/config` 中配置可复用跳。

**要点：**
- Ed25519 > RSA-2048
- 不在不可信主机上做 agent 转发
- `ProxyJump`/`-J` 比转发更安全
- 在 `~/.ssh/config` 中配 `Host`、`User`、`IdentityFile`

---

### 38. Distroless vs scratch vs alpine

**频率：** 中

**题目：** 请对比 distroless、scratch 和 alpine 三类基础镜像：(1) scratch 只有静态二进制、最小最安全但无 shell 或 libc 难调试，(2) distroless 包含最小运行时（libc、CA 证书）但无包管理器和 shell，(3) alpine 提供 musl libc、busybox 和 apk 但 musl 可能让 glibc 编译的二进制出问题（DNS 怪癖）。说明生产该如何选择，以及如何通过 kubectl debug 临时容器调试 distroless。

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

**题目：** 请对比 Docker 的卷、绑定挂载和 tmpfs：(1) 卷作为 Docker 管理的存储及其驱动支持，(2) 绑定挂载直接挂入主机路径的灵活性与和主机布局耦合的缺点，(3) tmpfs 仅在内存、适合不能落盘的密钥和临时数据，以及它们在 Kubernetes 中的对应（PersistentVolume、hostPath、emptyDir 含 medium: Memory）。

**答案：** 卷是 Docker 管理的存储（`/var/lib/docker/volumes/`），支持驱动（本地、NFS、云）。绑定挂载直接把主机路径挂入容器——灵活但把容器与主机布局耦合。tmpfs 只在内存，理想用于不能落盘的密钥和临时数据。Kubernetes 对应是 PersistentVolume、hostPath、emptyDir（`medium: Memory`）。

**要点：**
- 卷：托管、可移植
- 绑定挂载：主机路径、与主机耦合
- tmpfs：仅 RAM、短暂
- k8s 等价：PV/hostPath/emptyDir

---

### 41. Docker 网络驱动

**频率：** 中

**题目：** 请介绍 Docker 的网络驱动：bridge（默认 NAT 虚拟网络）、host（共享主机网络命名空间、无隔离、全性能）、overlay（通过 VXLAN 跨多主机用于 Swarm）、macvlan（给容器物理 LAN 上的 MAC 和 IP）、none（禁网络）各自的特点和用途，以及 Kubernetes 如何用 CNI 插件替代这些、pod 如何获得自己的 netns 和集群范围可路由的 IP。

**答案：** `bridge`（默认）每主机创建 NAT 虚拟网络。`host` 共享主机网络命名空间——无隔离，全性能。`overlay` 通过 VXLAN 跨多主机用于 Swarm。`macvlan` 给每个容器一个 MAC 和物理 LAN 上的 IP。`none` 禁网络。Kubernetes 用 CNI 插件替代所有这些；pod 获得自己的 netns 和集群范围可路由的 IP。

**要点：**
- bridge = 默认 NAT
- host = 无隔离、最快
- overlay = 多主机 VXLAN
- macvlan = 容器在物理 LAN

---

### 42. docker compose

**频率：** 中

**题目：** 请介绍 docker compose：(1) 如何在 docker-compose.yml 中定义多容器应用（services、networks、volumes、env、depends_on、healthcheck），(2) docker compose up -d 和 down -v 的作用，(3) 它适合本地开发和小型单主机部署、而生产多主机应转向 Kubernetes 或 Nomad，以及 profiles 如何切换可选服务和 depends_on 的 service_healthy 条件如何控制启动顺序。

**答案：** Compose 在 `docker-compose.yml` 中定义多容器应用：services、networks、volumes、env、depends_on、healthcheck。`docker compose up -d` 起栈；`compose down -v` 拆栈。非常适合本地开发与小型单主机部署。生产多主机请进 Kubernetes 或 Nomad。Profiles 让你切换可选服务（`--profile debug`）。

**要点：**
- 一个 YAML、多个服务
- `depends_on: condition: service_healthy` 顺序
- Profiles 做可选栈
- 真生产编排用 Kubernetes

---

### 43. 镜像漏洞扫描

**频率：** 中

**题目：** 请讲解镜像漏洞扫描：(1) Trivy、Grype、Snyk 等工具如何扫描镜像层中 OS 包和语言依赖里的已知 CVE，(2) 如何在 CI 中把它作为必备检查、并对有可用修复的 high/critical 失败构建，(3) 为什么应对 registry 做周期性扫描而不仅在 push 时（新 CVE 每天针对未变镜像出现），以及扫描误配、密钥和配合 SBOM 生成。

**答案：** Trivy、Grype、Snyk 等工具扫描镜像层中 OS 包和语言依赖里的已知 CVE。在 CI 中作为必备检查；有可用修复版本的 high/critical 失败构建。也扫描误配（Dockerfile lint）与密钥。在 registry 上做周期性扫描，因为新 CVE 每天都会针对未变镜像出现。

**要点：**
- Trivy/Grype 扫 OS + 语言依赖
- 可修复的 high/critical 失败 CI
- 持续扫 registry，不仅在 push 时
- 配合 SBOM 生成

---

### 44. 非 root、丢能力、只读 rootfs

**频率：** 中

**题目：** 请讲解容器加固的三项关键措施：(1) 以非 root UID 运行（Dockerfile 的 USER 与 Kubernetes securityContext 的 runAsNonRoot/runAsUser），(2) 丢弃 ALL 能力只加需要的、allowPrivilegeEscalation: false，(3) readOnlyRootFilesystem: true 以及应用需要可写路径时如何挂 emptyDir，并说明这些如何极大减小应用被攻陷时的爆炸半径。

**答案：** Dockerfile 设 `USER 10001`，Kubernetes 设 `securityContext: {runAsNonRoot: true, runAsUser: 10001, allowPrivilegeEscalation: false, capabilities: {drop: [ALL]}, readOnlyRootFilesystem: true}`。如果应用需要 `/tmp` 等可写路径，挂 emptyDir。这极大减小应用被攻陷时的爆炸半径。

**要点：**
- 以非 root UID 运行
- 丢 ALL 能力，只加需要的
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`

---

### 45. PID 1 问题与 tini

**频率：** 中

**题目：** 请解释容器中的 PID 1 问题：(1) Linux 中 PID 1 承担的特殊职责（回收僵尸子进程、处理信号），(2) 为什么许多应用运行时（Node、Python）不做这些导致 SIGTERM 被忽略、shell 形式 ENTRYPOINT 不转发信号，(3) 如何用 tini 或 dumb-init 作 PID 1、或用 docker run --init 自动注入 tini，以及不解决它优雅关停为何会失败。

**答案：** Linux 中 PID 1 有特殊职责：回收僵尸子进程和处理信号。许多应用运行时（Node、Python）不做这些，所以 SIGTERM 被忽略，shell 形式 ENTRYPOINT 启动的 shell 不转发信号。用 `tini` 或 `dumb-init` 作 PID 1：`ENTRYPOINT ["tini", "--", "node", "server.js"]`。Docker 提供 `--init` 自动注入 tini。

**要点：**
- PID 1 必须回收僵尸 + 处理信号
- Shell 形式 ENTRYPOINT 破坏信号转发
- 用 `tini`/`dumb-init` 或 `docker run --init`
- 没它优雅关停会失败

---

### 46. 健康检查：Dockerfile vs 编排器

**频率：** 中

**题目：** 请对比 Dockerfile 健康检查与编排器健康检查：(1) Dockerfile 的 HEALTHCHECK 如何在多次重试后标记容器 unhealthy、Compose 如何等 service_healthy，(2) 为什么 Kubernetes 忽略 Dockerfile 健康检查、转而使用 pod spec 的 livenessProbe、readinessProbe、startupProbe，(3) 探针可为 exec/HTTP/TCP/gRPC，以及如何调 initialDelaySeconds 避免重启循环、跨编排器保持相同逻辑。

**答案：** Dockerfile `HEALTHCHECK CMD curl -f http://localhost/health || exit 1` 在多次重试后标记容器 `unhealthy`。Compose 可等 `service_healthy`。Kubernetes 忽略 Dockerfile 健康检查；它用 pod spec 的 `livenessProbe`、`readinessProbe`、`startupProbe`。跨编排器运行时两地保持同样逻辑。

**要点：**
- Dockerfile HEALTHCHECK 被 k8s 忽略
- k8s：liveness/readiness/startup 探针
- 探针可为 exec/HTTP/TCP/gRPC
- 调 `initialDelaySeconds` 避免重启循环

---

### 47. docker exec vs run vs attach

**频率：** 中

**题目：** 请对比 docker exec、docker run 和 docker attach：(1) run 如何从镜像启动新容器，(2) exec 如何在运行的容器内运行额外进程（-it 交互 shell），(3) attach 如何把终端重连到容器 PID 1 的 stdio 以及为何按 Ctrl-C 可能杀容器，并说明为什么调试应优选 exec、attach 只留给需要 PID 1 流的少数场景。

**答案：** `docker run` 从镜像启动新容器。`docker exec` 在运行的容器内运行额外进程（`-it` 交互 shell）。`docker attach` 把你的终端重连到容器 PID 1 的 stdio；按 Ctrl-C 可能杀容器。调试优选 `exec`；`attach` 留给需要 PID 1 流的少数场景。

**要点：**
- `run`：从镜像起新容器
- `exec`：运行容器内的额外进程
- `attach`：连到 PID 1 stdio
- `exec -it sh` 临时调试

---

### 48. Registry 选择

**频率：** 中

**题目：** 请讲解如何选择容器镜像 registry：(1) 常见选项及其特点（Docker Hub 的速率上限、GitHub Container Registry 与 Actions 集成、GitLab Registry、AWS ECR、Google Artifact Registry、Azure ACR、Harbor、JFrog Artifactory），(2) 选型应考虑的因素（CI 认证集成、地理复制、漏洞扫描、成本），以及气隙环境为何要把镜像上游到 Harbor/Artifactory。

**答案：** 选项包括 Docker Hub（免费层有速率上限）、GitHub Container Registry（`ghcr.io`，与 Actions 集成）、GitLab Registry、AWS ECR、Google Artifact Registry、Azure ACR、Harbor（带扫描/复制的自托管）和 JFrog Artifactory。按你 CI 的认证集成、地理复制需求、漏洞扫描和成本选择。气隙环境把镜像上游到 Harbor/Artifactory。

**要点：**
- 云原生：ECR/Artifact Registry/ACR
- 自托管：Harbor、Artifactory
- 气隙构建镜像上游
- 注意 Docker Hub pull 速率上限

---

### 49. Ingress vs Gateway API

**频率：** 中

**题目：** 请对比 Kubernetes 的 Ingress 与 Gateway API：(1) Ingress 作为通过注解做 HTTP(S) 路由的遗留 L7 API 及其可移植性问题，(2) Gateway API 作为继任者的供应商中立、角色导向设计（GatewayClass、Gateway、HTTPRoute 分别由谁拥有），(3) 它对 TCP/UDP/TLS、流量切分（HTTPRoute 加权流量）和按头路由的原生支持，以及常见控制器（Envoy Gateway、Istio、Contour、NGINX）。

**答案：** Ingress 是通过注解做 HTTP(S) 路由的遗留 L7 API——控制器的怪癖会拖累可移植性。Gateway API 是继任者：供应商中立、角色导向（GatewayClass 由基础设施拥有、Gateway 由集群运维、HTTPRoute 由应用团队），原生支持 TCP/UDP/TLS、流量切分和按头路由。新部署在控制器支持时应瞄准 Gateway API。

**要点：**
- Ingress = 遗留、注解重
- Gateway API = 角色划分、可移植
- HTTPRoute 支持加权流量
- 控制器：Envoy Gateway、Istio、Contour、NGINX

---

### 50. HPA vs VPA vs Cluster Autoscaler vs Karpenter

**频率：** 中

**题目：** 请对比 Kubernetes 的四种自动扩缩机制：HPA（按 CPU/内存/自定义指标扩 pod 副本）、VPA（随时间右调 pod requests，常只跑推荐模式，为何不宜与 HPA 同指标同用）、Cluster Autoscaler（在现有节点组中按无法调度的 pod 增减节点）、Karpenter（无预定义组按需供给恰当节点类型、混 spot/按需最小化成本），并说明 HPA + Karpenter 为何是现代 AWS 组合。

**答案：** HPA 按 CPU/内存/自定义指标扩 pod 副本。VPA 随时间右调 pod requests（常只跑推荐模式）。Cluster Autoscaler 在现有节点组中按 pod 无法调度增减节点。Karpenter 按需供给恰到好处的节点类型，无预定义组，挑 spot/按需混合最小化成本。HPA + Karpenter 是现代 AWS 组合。

**要点：**
- HPA 水平扩 pod
- VPA 调 requests；同指标避免与 HPA 同用
- CA 在 ASG 内扩节点
- Karpenter：无组、类型最优节点

---

### 51. PodDisruptionBudgets

**频率：** 中

**题目：** 请讲解 PodDisruptionBudget：(1) 它如何声明自愿干扰（如节点排空）期间最少可用或最多不可用的 pod 数（举例 minAvailable: 2 对 3 副本的含义），(2) 哪些操作会尊重 PDB（Cluster Autoscaler、节点升级、kubectl drain），(3) 为什么 PDB 不保护非自愿干扰（节点崩溃），以及如何配合多区域拓扑分散。

**答案：** PDB 声明自愿干扰（如节点排空）期间最少可用（或最多不可用）的 pod 数。例：3 副本部署的 `minAvailable: 2` 一次最多让一个 pod 被驱逐。Cluster Autoscaler、节点升级和 `kubectl drain` 尊重 PDB。PDB 不保护非自愿干扰（节点崩溃）。

**要点：**
- 只保护自愿干扰
- `minAvailable` 或 `maxUnavailable`
- 安全滚动节点升级必需
- 配合多区域拓扑分散

---

### 52. Init 容器 vs Sidecar 容器

**频率：** 中

**题目：** 请对比 Kubernetes 的 init 容器与 sidecar 容器：(1) init 容器如何在应用容器启动前顺序运行到完成（适合迁移、等依赖、取配置），(2) sidecar 如何与主容器并行运行并共享网络/卷（日志采集、代理），以及 (3) Kubernetes 1.28+ 如何通过带 restartPolicy: Always 的 initContainers 提供原生 sidecar 支持（在主容器启动前就启动并存活到主容器之后）。

**答案：** Init 容器在应用容器启动前顺序运行到完成——适合迁移、等依赖、取配置。Sidecar 与主容器并行运行，共享网络/卷（日志采集、代理）。Kubernetes 1.28+ 通过带 `restartPolicy: Always` 的 `initContainers` 加原生 sidecar 支持，它们在主容器启动前就启动并存活到主容器之后。

**要点：**
- Init：一次性设置、顺序
- Sidecar：生命周期附着的辅助
- 原生 sidecar 通过 init + `restartPolicy: Always`
- Sidecar 与主共享网络/卷

---

### 53. NetworkPolicy 与默认拒绝

**频率：** 中

**题目：** 请讲解 Kubernetes NetworkPolicy 与默认拒绝：(1) 为什么默认所有 pod 可互相通信、NetworkPolicy 如何选定 pod 并约束其 ingress/egress，(2) 如何在命名空间级应用默认拒绝（空 podSelector 加 policyTypes: [Ingress, Egress]）再分层加 allow，(3) 为什么需要策略感知的 CNI（Calico、Cilium），以及 Cilium 如何加 L7（HTTP 路径、gRPC 方法）策略。

**答案：** 默认所有 pod 可与所有 pod 通信。NetworkPolicy 选定 pod 并约束其 ingress/egress。在命名空间级应用默认拒绝：

```yaml
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
```

然后按应用分层加 allow。需要执行策略的 CNI（Calico、Cilium）。Cilium 加 L7 策略（HTTP 路径、gRPC 方法）。

**要点：**
- 默认是 allow-all
- 默认拒绝 + 定向 allow
- 需要策略感知 CNI
- Cilium 加 L7（HTTP/gRPC）策略

---

### 54. CoreDNS

**频率：** 中

**题目：** 请介绍 CoreDNS：(1) 它作为默认集群 DNS 服务器如何解析 svc.namespace.svc.cluster.local、headless service 的每 pod A 记录、端口 SRV 记录并转发外部查询，(2) pod resolv.conf 中 ndots:5 为何会让外部名字产生过多查找、如何用 FQDN（尾点）或 dnsConfig.options 缓解，以及缓存命中和转发延迟作为关键 SLI、随集群规模扩 CoreDNS 副本。

**答案：** CoreDNS 是默认集群 DNS 服务器。它解析 `svc.namespace.svc.cluster.local`、headless service A 记录（每 pod 一条）、端口 SRV 记录，并向上游转发外部查询。pod resolv.conf 中 `ndots:5` 会让外部名字产生过多查找；用 FQDN（尾点）或 `dnsConfig.options` 缓解。缓存命中指标和转发延迟是关键 SLI。

**要点：**
- 解析 `<svc>.<ns>.svc.cluster.local`
- Headless 服务 -> 每 pod A 记录
- 注意 `ndots:5` 外部查找放大
- 随集群规模扩 CoreDNS 副本

---

### 55. 服务网格：它加了什么

**频率：** 中

**题目：** 请讲解服务网格（Istio、Linkerd、Cilium Service Mesh）在服务间加了什么：(1) mTLS、细粒度流量策略（重试、超时、断路）、canary/加权路由、统一指标/追踪，且无需改应用代码，(2) 其权衡（sidecar 带来的延迟、运维复杂度、调试难度），以及无 sidecar 网格（Cilium、Istio Ambient）如何降开销、Linkerd 与 Istio 的定位差异。

**答案：** 服务网格（Istio、Linkerd、Cilium Service Mesh）在服务间加 mTLS、细粒度流量策略（重试、超时、断路）、canary/加权路由和统一指标/追踪——无需改应用代码。权衡：sidecar 带来的延迟（Linkerd 最轻）、运维复杂度、调试难度。无 sidecar 网格（Cilium、Istio Ambient）降开销。

**要点：**
- mTLS + L7 策略 + 可观测性
- Sidecar 税 vs 无 sidecar（Ambient）
- Linkerd：简单；Istio：功能多
- 加调试面；权衡需求

---

### 56. CRD 与 Operator 模式

**频率：** 中

**题目：** 请解释 CRD 与 Operator 模式：(1) CustomResourceDefinition 如何用新资源类型扩展 Kubernetes API，(2) Operator 作为监听该资源并将真实世界状态调和的控制器如何把运维知识编入代码（供给数据库、故障切换、备份），以及如何用 kubebuilder 或 Operator SDK 构建，并举例（cert-manager、Prometheus Operator、postgres-operator）。

**答案：** CustomResourceDefinition 用新资源类型扩展 API。Operator 是监听该资源并将真实世界状态调和的控制器——把运维知识编入代码（供给数据库、跑故障切换、做备份）。用 kubebuilder 或 Operator SDK 构建。例：cert-manager（Certificate -> 签发 TLS）、Prometheus Operator、postgres-operator。

**要点：**
- CRD 加新 API kind
- 控制器调和期望 vs 实际
- 编码领域运维知识
- 用 kubebuilder/Operator SDK 构建

---

### 57. 滚动更新 vs Recreate

**频率：** 中

**题目：** 请对比 Kubernetes 的滚动更新与 Recreate 部署策略：(1) 滚动更新作为 Deployment 默认，maxSurge 和 maxUnavailable 如何调速度与可用性（如 maxSurge: 25%, maxUnavailable: 0 实现零停机但需备用容量），(2) Recreate 如何先杀所有老 pod 再启动新 pod（简单但有停机），以及为什么不能混版本运行（schema 冲突）的应用要用 Recreate、如何配合 readiness 探针求安全。

**答案：** 滚动更新是 Deployment 默认；`maxSurge`（在副本数之上的额外 pod）和 `maxUnavailable`（允许缺的）调速度 vs 可用性。`maxSurge: 25%, maxUnavailable: 0` 零停机但需备用容量。Recreate 杀掉所有老 pod，然后启动新——简单但有停机。不能混版本运行（schema 冲突）的应用用 Recreate。

**要点：**
- maxSurge + maxUnavailable 调推出
- maxUnavailable: 0 求零停机
- 不兼容版本用 Recreate
- 配合 readiness 探针求安全

---

### 58. ServiceAccount 与 pod 身份

**频率：** 中

**题目：** 请说明 Kubernetes 中 ServiceAccount 如何充当 pod 的身份、pod 又是如何用挂载的 SA token 向 API 认证的。针对访问云 API 的场景，请介绍 workload identity 方案（AWS IRSA、GKE Workload Identity、Azure Workload Identity）如何把 SA token 交换为云凭证，token 卷的投影与自动轮换机制，以及为什么绝不应把长期云密钥烤进镜像。

**答案：** pod 通过挂载的 SA token 向 API 认证。对云 API 用 workload identity：IRSA（AWS，通过 OIDC 把 IAM 角色绑到 SA）、GKE Workload Identity、Azure Workload Identity。SA token 被交换为云凭证——pod 内无长期密钥。Token 卷被投影并自动轮换。

**要点：**
- SA = pod 的 k8s 身份
- 对云 API 用 IRSA / Workload Identity
- Token 被投影并自动轮换
- 永远别把云密钥烤进镜像

---

### 59. etcd

**频率：** 中

**题目：** 请介绍 etcd 在 Kubernetes 中的作用，它作为 API 背后强一致键值存储的定位。请说明它基于 Raft 的法定人数为何要用奇数节点（3 或 5）、为什么它对磁盘延迟极其敏感（需要快盘和专用节点）、如何用 etcdctl snapshot 做定期备份并演练恢复，以及如何用 KMS 做静态加密。

**答案：** etcd 是 Kubernetes API 背后的强一致键值存储。Raft 法定人数用奇数集群（3 或 5）；HA 用独立磁盘（低延迟 NVMe）和专用节点。定期用 `etcdctl snapshot save` 备份并测试恢复。用 KMS 静态加密。多数生产事故追溯到 etcd 磁盘延迟或法定人数丢失。

**要点：**
- Raft，奇数 3/5 节点
- 对延迟敏感：快盘必备
- 定期演练快照 + 恢复
- 用 KMS 静态加密

---

### 60. ImagePullBackOff 原因

**频率：** 中

**题目：** 假设一个 pod 报 ImagePullBackOff，请列举可能的原因并说明如何诊断。请涵盖：镜像名或 tag 拼错、registry 不可达、缺 imagePullSecret 或凭证过期、私有镜像未认证、ECR/GCR 凭证未刷新、Docker Hub 匿名限流、digest 不存在等，并说明如何用 describe pod 看确切的 registry 错误，以及为什么把关键镜像镜像到自己的 registry 能提升韧性。

**答案：** 可能：image/tag 拼错、registry 不可达、缺 imagePullSecret、registry 凭证过期、私有镜像无认证、ECR/GCR 凭证未刷新、限流（Docker Hub 匿名）、digest 不存在。describe pod 看确切 registry 错误。把关键镜像镜像到你自己的 registry 移除第三方依赖。

**要点：**
- 验证 image 名 + tag 存在
- imagePullSecret + 正确命名空间
- 注意 Docker Hub 限流
- 把上游镜像镜像求韧性

---

### 61. 追踪慢服务

**频率：** 中

**题目：** 假设某个服务变慢，请描述你分层排查的方法。请说明如何依次检查 Service endpoint（kubectl get endpoints）与 pod readiness、最近的部署、仪表板上的错误率对比延迟、用分布式追踪定位慢 span（数据库还是下游服务）、HPA 扩缩情况、CPU 节流（container_cpu_cfs_throttled_seconds）、DNS 查询时间和节点压力，以及如何与基线和最近变更日志做对比。

**答案：** 分层方式：查 Service endpoint（`kubectl get endpoints`）、pod readiness、最近部署、仪表板的错误率 vs 延迟、分布式追踪找慢 span（数据库？下游服务？）。检查 HPA 扩缩、节流（`container_cpu_cfs_throttled_seconds`）、DNS 查询时间和节点压力。与基线和最近变更日志对比。

**要点：**
- 先看 endpoint + readiness
- 用追踪定位慢 span
- CPU 节流常不可见
- 关联部署 + 节点事件

---

### 62. 集群升级

**频率：** 中

**题目：** 请描述 Kubernetes 集群升级的完整流程。请说明为什么要先升控制面（kube-apiserver、controller-manager、scheduler、etcd）且一次只升一个小版本、绝不跳版，然后再处理节点（排空并尊重 PDB、升级 kubelet 与 containerd、uncordon）。也请谈谈托管服务（EKS、GKE、AKS）如何自动化控制面，以及如何提前查 release note 并用 kubectl deprecations 或 pluto 扫描被移除的 API、在升级前更新 manifest。

**答案：** 先升控制面（kube-apiserver、controller-manager、scheduler、etcd），一次一个小版本——永不跳版。然后节点：排空（尊重 PDB）、升级 kubelet+containerd、uncordon。托管服务（EKS、GKE、AKS）自动化控制面。在非 prod 测试，看 release note 找被移除的 API（`kubectl deprecations`、`pluto`），升级前更新 manifest。

**要点：**
- 先控制面再节点
- 一次一个小版本
- 排空时尊重 PDB
- 提前扫描被移除的 API

---

### 63. kubectl drain

**频率：** 中

**题目：** 请解释 kubectl drain（如 kubectl drain node --ignore-daemonsets --delete-emptydir-data）的作用：它如何警戒节点使其不接新 pod、如何在尊重 PDB 的前提下驱逐现有 pod。请说明 DaemonSet pod 为何需要 --ignore-daemonsets 跳过、带 emptyDir 的 pod 数据为什么会丢失、这个命令适用于哪些场景（内核打补丁、节点升级、缩容），以及维护后如何用 kubectl uncordon 让节点回到调度池。

**答案：** `kubectl drain node --ignore-daemonsets --delete-emptydir-data` 警戒节点（不接新 pod）并尊重 PDB 驱逐现有 pod。DaemonSet pod 通过 flag 跳过。带 emptyDir 的 pod 数据丢失。用在内核打补丁、节点升级或缩容前。维护后用 `kubectl uncordon` 重允调度。

**要点：**
- 警戒 + 驱逐尊重 PDB
- 需要 `--ignore-daemonsets`
- 排空时 emptyDir 数据丢失
- Uncordon 让节点回池

---

### 64. kubectl top 与 metrics-server

**频率：** 中

**题目：** 请解释 kubectl top pods / kubectl top nodes 的数据从哪里来，说明 metrics-server 作为集群聚合器如何抓取 kubelet 的 cAdvisor 数据、又如何驱动基于资源指标的 HPA。请谈谈为什么 metrics-server 只保留当前值而没有历史、如果集群里没装该如何处理、历史与仪表板应改用什么（Prometheus + Grafana），以及自定义/外部指标需要什么（Prometheus Adapter 或 KEDA）。

**答案：** `kubectl top pods` / `kubectl top nodes` 显示 CPU/内存使用，来源于 metrics-server（一个集群聚合器，抓 kubelet cAdvisor）。它驱动按资源指标的 HPA。历史和仪表板用 Prometheus + Grafana——metrics-server 只保留当前值。自定义/外部指标需要 Prometheus Adapter 或 KEDA。

**要点：**
- metrics-server 喂 HPA + `kubectl top`
- 仅当前值、无历史
- 缺失就装（并非总是默认）
- 历史：Prometheus + Grafana

---

### 65. 流水线即代码

**频率：** 中

**题目：** 请解释流水线即代码（Pipeline as Code）的理念：把流水线定义放进版本控制文件（如 .github/workflows/*.yml、Jenkinsfile、.gitlab-ci.yml），与代码同存、可评审、可 diff。请谈谈如何通过模板或 composite action 做复用、为什么要避免仅在 UI 中编辑流水线（会漂移且难审计），以及 pull request 预览如何在合并前验证流水线变更。

**答案：** 流水线定义在版本控制文件（`.github/workflows/*.yml`、`Jenkinsfile`、`.gitlab-ci.yml`），与代码同存、可评审、可 diff，通过模板/composite action 可复用。避免 UI 编辑的流水线——它们漂移且难审计。Pull request 预览可在合并前验证变更。

**要点：**
- 流水线在仓库、PR 中评审
- 可复用模板 / composite action
- 避免仅 UI 编辑流水线
- 通过 PR 运行验证流水线变更

---

### 66. 主干 vs Gitflow

**频率：** 中

**题目：** 请对比主干开发（trunk-based）与 Gitflow 两种分支策略。请说明主干开发如何用短命分支、频繁合入 main、用特性开关隐藏未完成工作，从而支持持续部署并减少合并冲突；Gitflow 又如何用长命的 develop、release/* 和 hotfix/* 分支、仪式更重；并谈谈为什么多数 SaaS 团队选主干开发、而版本化交付的打包软件更适合 Gitflow。

**答案：** 主干：短命分支（小时/天）、频繁合到 `main`，特性开关隐藏未完成工作。启用持续部署并最小化合并冲突。Gitflow：长命 `develop`、`release/*`、`hotfix/*` 分支——仪式重，适合版本化交付的软件。多数 SaaS 团队采用主干。

**要点：**
- 主干：小批量、快合并
- 特性开关隐藏 WIP
- Gitflow：版本化发布、仪式
- SaaS -> 主干；打包软件 -> Gitflow

---

### 67. PR 检查阶段

**频率：** 中

**题目：** 请描述一个 PR 检查（PR check）的典型流水线阶段和顺序：lint/格式 -> 单元测试 -> 构建 -> 容器构建与扫描 -> 集成测试 -> 烟雾部署到临时环境 -> 必需评审者批准 -> 合并。请说明为什么要快速失败（lint 放在测试前）、如何并行执行独立作业、临时预览环境如何捕捉集成 bug、分支保护中的必需检查如何在变绿前阻止合并，以及如何纳入外部系统的状态报告（如 SonarQube、Snyk）。

**答案：** 典型顺序：lint/格式 -> 单元测试 -> 构建 -> 容器构建 & 扫描 -> 集成测试 -> 烟雾部署到临时环境 -> 必需评审者批准 -> 合并。快速失败（lint 在测试前）。独立作业并行。分支保护中的必需检查在绿之前阻止合并。包含外部系统状态报告（SonarQube、Snyk）。

**要点：**
- 快速失败：lint 优先
- 并行独立作业
- 临时预览环境捕集成 bug
- 分支保护强制必需检查

---

### 68. CI 中缓存依赖

**频率：** 中

**题目：** 请介绍在 CI 中缓存依赖的做法：如何以 lockfile 哈希为键缓存 ~/.npm、~/.m2、Go module cache、pip wheel、Docker 层，并在作业开始时恢复、结束时保存。请谈谈具体工具（GitHub Actions actions/cache、GitLab 的 cache: 块、BuildKit --mount=type=cache）、为什么应缓存上游 package store 而非 node_modules（尤其跨 OS 时）、lockfile 变化时缓存如何失效，以及如何用回退的 restore-keys 实现部分命中。

**答案：** 按 lockfile 哈希为键缓存 `~/.npm`、`~/.m2`、Go module cache、pip wheel、Docker 层。起始恢复、结束保存。GitHub Actions `actions/cache`、GitLab `cache:` 块、BuildKit `--mount=type=cache`。Lockfile 变化时缓存失效。避免跨 OS 缓存 node_modules；缓存上游 package store 并新装。

**要点：**
- 按 lockfile 哈希为缓存键
- 缓存 package store，不是 node_modules
- BuildKit cache mount 做编译器缓存
- 设回退 restore-keys 做部分命中

---

### 69. 制品管理

**频率：** 中

**题目：** 请介绍制品管理（artifact management）：Artifactory、Nexus、GitHub Packages、AWS CodeArtifact 等如何存放构建产物（jar、wheel、npm、OCI、Helm chart）。请说明它带来的好处（缓存上游 registry 避免限流并加快构建、保留策略、不可变发布、漏洞扫描、地理复制），以及为什么应在仓库间晋升制品（snapshot -> release -> prod）而不是重新构建。

**答案：** Artifactory、Nexus、GitHub Packages、AWS CodeArtifact 存构建二进制（jar、wheel、npm、OCI、Helm chart）。好处：缓存上游 registry（无限流、构建更快）、保留策略、不可变发布、漏洞扫描、地理复制。在仓库间晋升制品（snapshot -> release -> prod）而非重建。

**要点：**
- 镜像上游 registry
- 晋升、不要重建
- 不可变发布仓库
- 保留 + 清理策略

---

### 70. CI 中无泄漏的密钥

**频率：** 中

**题目：** 请说明如何在 CI 中安全使用密钥而不泄漏。请涵盖：使用平台的加密密钥库（GitHub Actions Secrets、GitLab CI variables、Vault）、在日志中遮蔽密钥、禁止打印 env、用 OIDC 联邦到云提供商以把短命的工作流 token 交换为云凭证从而避免长期密钥，以及如何把密钥访问按作业/环境作用域限定到最小范围。

**答案：** 用平台的加密密钥库（GitHub Actions Secrets、GitLab CI variables、Vault）。日志中遮蔽（多数平台对已知密钥自动）。禁打印 env。用 OIDC 联邦到云提供商——把短命工作流 token 交换为云凭证而非长期密钥。把密钥访问限定到所需作业。

**要点：**
- 加密密钥库，不在 repo 文件
- OIDC 到云胜过长期密钥
- 遮蔽 + 禁 `env`/`set -x`
- 按作业/环境作用域密钥

---

### 71. 环境晋升

**频率：** 中

**题目：** 请解释环境晋升（environment promotion）的做法：让同一个制品在 dev -> staging -> prod 间流转、只有配置随环境不同。请说明为什么要避免每个环境重新构建（漂移风险）、在 GitOps 下晋升如何表现为更新 prod overlay 中 image tag 的 PR、如何用手动批准和额外检查（canary、烟雾）门控 prod，以及如何用 GitHub Actions 的 environment 做保护规则和必需评审者。

**答案：** 同一制品在 dev -> staging -> prod 间移动；只有配置不同。避免每环境重建（漂移风险）。GitOps 下，晋升是更新 prod overlay 中 image tag 的 PR。用手动批准和额外检查（canary、烟雾）门控 prod。在 GitHub Actions 用 environment 做保护规则和必需评审者。

**要点：**
- 一个制品、多个环境
- 通过 PR 到环境 overlay 晋升
- prod 手动批准门
- 同配置 schema、不同值

---

### 72. CD 中的数据库迁移（扩展/收缩）

**频率：** 中

**题目：** 请介绍 CD 中数据库迁移的扩展/收缩（expand/contract）模式，说明为什么在滚动部署期间应用与数据库版本会重叠、向后不兼容的迁移会因此出问题。请按步骤讲清楚：(1) 加新列/表（部署迁移）、(2) 部署同时写新旧的应用、(3) 回填、(4) 部署只读新的应用、(5) 删旧列，并解释为什么 schema 变更必须跨至少一个应用版本保持向后兼容。

**答案：** 滚动部署期间应用与数据库版本重叠，所以向后不兼容的迁移会破坏。用扩展/收缩：1) 加新列/表（部署迁移），2) 部署同时写新旧的应用，3) 回填，4) 部署只读新的应用，5) 删旧列。始终让 schema 变更跨至少一个应用版本向后兼容。

**要点：**
- 迁移先于应用部署
- 应用必须能处理新旧 schema
- 读新前先回填
- 完全推出后再删旧

---

### 73. 特性开关

**频率：** 中

**题目：** 请介绍特性开关（feature flag）如何把部署与发布解耦：代码可以先暗着发布，再通过开关服务（LaunchDarkly、Unleash、Flagsmith）按用户/群组/百分比启用。请谈谈它能带来的能力（支持主干开发、A/B 测试、即时 kill switch、渐进推出），以及开关的卫生管理——跟踪开关生命周期、删除陈旧开关以防代码腐烂和组合爆炸。

**答案：** 把部署与发布解耦：代码发布暗的，然后通过开关服务（LaunchDarkly、Unleash、Flagsmith）按用户/群组/百分比启用。启用主干开发、A/B 测试、即时 kill switch、渐进推出。卫生：跟踪开关生命周期——删除陈旧开关防代码腐烂和排列组合爆炸。

**要点：**
- 部署 ≠ 发布
- 百分比 / 群组定向
- 无需重部署的 kill switch
- 无情退役陈旧开关

---

### 74. Terraform 模块与 workspace

**频率：** 中

**题目：** 请介绍 Terraform 的模块（module）与 workspace。请说明模块如何把相关资源分组复用（如一个取 CIDR 变量的 vpc 模块）、来源可以是本地路径/Git/registry、以及为什么要钉模块版本；再说明 workspace 是同一配置中隔离的 state 实例（terraform workspace new prod），谈谈它对环境的用途和易被误用之处，以及为什么许多团队更偏好每环境一目录（envs/prod/、envs/staging/）而非 workspace。

**答案：** 模块把相关资源分组复用（一个取 CIDR 变量的 `vpc` 模块）。来源可为本地路径、Git 或 registry。钉模块版本。Workspace 是一个配置中的隔离 state 实例（`terraform workspace new prod`）——对环境有用但易误用。许多团队偏好每环境一目录（`envs/prod/`、`envs/staging/`）而非 workspace 求更清楚分离。

**要点：**
- 模块 = 可复用积木
- 钉模块版本
- Workspace = state 隔离
- 每环境一目录常比 workspace 更清楚

---

### 75. terraform plan 评审纪律

**频率：** 中

**题目：** 请讲讲 terraform plan 的评审纪律。请说明为什么 apply 前要读完整的 plan：数清 create/update/destroy、审视 destroy 看爆炸半径、检查敏感值变化、留意关键资源（数据库、负载均衡器）上的 forces replacement；并谈谈如何通过 Atlantis/tfaction 把 plan 输出贴到 PR 里、破坏性 plan 需要批准,以及为什么只 apply 已保存的 plan（-out=plan.tfplan）以避免漂移。

**答案：** Apply 前始终读完整 plan：数 create/update/destroy、审视 destroy 看爆炸半径、查敏感值变化、注意关键资源（数据库、负载均衡器）上的 `forces replacement`。通过 Atlantis/tfaction 在 PR 中贴 plan 输出。破坏性 plan 需批准。只 apply 已 plan 的（用 `-out=plan.tfplan`）。

**要点：**
- 读每行 destroy
- `forces replacement` = 停机风险
- 通过 Atlantis 在 PR 中 plan
- Apply 保存的 plan 避免漂移

---

### 76. 不可变 vs 可变基础设施

**频率：** 中

**题目：** 请对比不可变基础设施与可变基础设施。请说明可变方式（SSH 进服务器原地打补丁、走配置管理）如何导致漂移累积和雪花服务器，而不可变方式如何在每次变更时构建新镜像/AMI/容器并替换实例、不做原地修改；并谈谈不可变的好处（回滚更易、无漂移、契合自动扩缩容）、它需要哪些前提（快速镜像构建、滚动部署自动化），以及为什么容器是经典的不可变单元。

**答案：** 可变：SSH 进服务器原地打补丁（配置管理）。漂移累积；雪花服务器出现。不可变：每次变更构建新镜像/AMI/容器并替换实例——无原地变更。回滚更易、无漂移、契合自动扩缩容。需要快速镜像构建和滚动部署自动化。容器是经典的不可变单元。

**要点：**
- 可变 -> 漂移 + 雪花
- 不可变 -> 替换、永不打补丁
- 快速镜像构建必备
- 回滚 = 重部前一镜像

---

### 77. 安全组 vs NACL（AWS）

**频率：** 中

**题目：** 请对比 AWS 的安全组（Security Group）与网络 ACL（NACL）。请说明安全组是有状态、实例级、只有 allow 规则、返回流量自动放行,而 NACL 是无状态、子网级、同时有 allow 与 deny 规则、返回流量需要单独规则;并谈谈为什么安全组是主要工具、NACL 作为粗粒度的第二层（如阻断特定 IP），以及生产环境为什么安全组应默认拒入并收紧出站而不仅是入站。

**答案：** 安全组是有状态、实例级防火墙——只 allow 规则，返回流量自动允许。NACL 是无状态、子网级——allow 与 deny 规则都有，返回流量需要自己的规则。SG 是主要工具；NACL 是粗的第二层（如阻特定 IP）。生产 SG 默认拒入 + 最小出。

**要点：**
- SG：有状态、实例级、仅 allow
- NACL：无状态、子网级、allow + deny
- SG 优先，NACL 次要
- 收紧出，不只入

---

### 78. 服务发现

**频率：** 中

**题目：** 请介绍服务发现的几种方式。请说明基于 DNS 的方案（Route53 私有区、Kubernetes 中的 CoreDNS、Consul）和基于注册的方案（Consul、Eureka、Cloud Map，服务启动时带健康信息注册）、Kubernetes Service 加 CoreDNS 如何让发现自动化,以及跨集群/多区域时如何用 external-dns 把 k8s 服务同步到 Route53 或用服务网格联邦,并谈谈为什么健康感知的注册胜过静态 DNS。

**答案：** 基于 DNS：Route53 私有区、k8s 中的 CoreDNS、Consul。基于注册：Consul、Eureka、Cloud Map——服务启动时带健康信息注册。Kubernetes Service + CoreDNS 让发现自动。跨集群/多区域用 external-dns 把 k8s 服务同步到 Route53 或服务网格联邦。

**要点：**
- k8s：Service + CoreDNS
- 混合环境用 Consul/Cloud Map
- external-dns 同步到云 DNS
- 健康感知注册胜过静态 DNS

---

### 79. Grafana 仪表板与告警

**频率：** 中

**题目：** 请介绍 Grafana 的仪表板与告警。请说明它如何从 Prometheus、Loki、Tempo、CloudWatch、BigQuery 等数据源可视化、如何通过 JSON 或 Grafonnet/Terraform provider 把仪表板做成代码以便评审、如何用模板变量做集群/命名空间下拉;并谈谈告警可以跑在 Grafana 统一告警还是 Prometheus Alertmanager,以及如何保持仪表板小而有意图（每服务一个、采用 RED 或 USE 方法）。

**答案：** Grafana 从 Prometheus、Loki、Tempo、CloudWatch、BigQuery 等可视化。通过 JSON 或 Grafonnet/Terraform provider 把仪表板做成代码以便评审。用模板变量做集群/命名空间下拉。告警可跑在 Grafana（统一告警）或 Prometheus Alertmanager。保持仪表板小且有意图——每服务一个、RED 或 USE 方法。

**要点：**
- 仪表板做成代码放 Git
- 模板变量求复用
- RED（rate/errors/duration）或 USE（utilization/saturation/errors）方法
- 告警在 Alertmanager 或 Grafana 统一

---

### 80. OpenTelemetry：collector、信号、传播

**频率：** 中

**题目：** 请介绍 OpenTelemetry 的 collector、信号和上下文传播。请说明 OTel 作为 trace、metric、log 的供应商中立规范加 SDK 的定位、应用如何发 OTLP 到 Collector、Collector 如何做处理（批、过滤、采样）并导出到后端（Tempo、Jaeger、Datadog）;并解释 W3C traceparent 头如何在服务间传播上下文让 span 串起来,以及自动埋点库与手动埋点（自定义 span）各自的适用场景。

**答案：** OTel 是 trace、metric、log 的供应商中立规范 + SDK。应用发 OTLP 到 Collector，它处理（批、过滤、采样）并导出到后端（Tempo、Jaeger、Datadog）。上下文传播用 W3C `traceparent` 头让 span 跨服务链。自动埋点 lib 覆盖流行框架；自定义 span 用手动埋点。

**要点：**
- 一个 SDK、多个后端
- Collector 做处理 + 路由
- W3C traceparent 头传播上下文
- 常见 lib 用自动埋点

---

### 81. 流水线扫描（Trivy、Snyk、Dependabot）

**频率：** 中

**题目：** 请介绍流水线中的安全扫描，涵盖各类扫描：SCA（依赖 CVE）、SAST（代码）、IaC（Checkov、tfsec）、密钥（gitleaks、trufflehog）、容器（Trivy、Grype）。请说明 Dependabot/Renovate 如何开 PR 升级易受攻击的依赖、有可用修复的 high/critical 如何阻止合并而其余仅告警,以及为什么要把发现追踪在队列（如 DefectDojo）里而不是淹没在 PR 噪音中。

**答案：** 扫描 SCA（依赖 CVE）、SAST（代码）、IaC（Checkov、tfsec）、密钥（gitleaks、trufflehog）、容器（Trivy、Grype）。Dependabot/Renovate 开 PR 升易受攻击依赖。有可用修复的 high/critical 阻合并；其他警告。把发现追踪在队列（DefectDojo）中以免淹没在 PR 噪音里。

**要点：**
- SCA + SAST + IaC + 密钥 + 容器扫描
- Dependabot/Renovate 做自动更新
- 可修的 high/critical 阻合并
- 在追踪器中聚合发现

---

### 82. AWS vs GCP vs Azure：粗略服务映射

**频率：** 中

**题目：** 请给出 AWS、GCP、Azure 三大云的粗略服务映射。请对照说明各类服务：计算（EC2 / Compute Engine / Azure VM）、托管 Kubernetes（EKS / GKE / AKS，GKE 通常最精致）、Serverless（Lambda / Cloud Functions / Azure Functions）、对象存储（S3 / GCS / Blob）、托管 Postgres（RDS / Cloud SQL / Azure DB），并对比三者不同的 IAM 模型（AWS role + policy、GCP IAM binding、Azure RBAC + Entra ID），以及为什么多云比看起来更难、通常应选一个主云。

**答案：** 计算：EC2 / Compute Engine / Azure VM。托管 K8s：EKS / GKE / AKS（GKE 通常最精致）。Serverless：Lambda / Cloud Functions / Azure Functions。对象存储：S3 / GCS / Blob。托管 Postgres：RDS / Cloud SQL / Azure DB。IAM 模型不同：AWS role + policy（强大、冗长）、GCP IAM binding（简单、通过 project/folder 分层）、Azure RBAC + Entra ID。多云比看起来难；选一个主。

**要点：**
- 托管 k8s：EKS / GKE / AKS
- 对象：S3 / GCS / Blob
- IAM 模型差异显著
- 多云大多是税

---

### 83. iptables vs nftables

**频率：** 低

**题目：** 请对比 iptables 和 nftables：(1) iptables 如何通过表（filter、nat、mangle）和链（INPUT、OUTPUT、FORWARD 等）过滤包，(2) nftables 作为现代替代品的单工具统一语法，(3) 两者都基于 netfilter 钩子这一点，(4) Kubernetes kube-proxy 历史上使用 iptables 及现在的 IPVS 和 nftables 模式，以及规则按链自上而下评估、首个匹配获胜的顺序重要性。

**答案：** iptables 通过表（`filter`、`nat`、`mangle`）和链（`INPUT`、`OUTPUT`、`FORWARD`）过滤包。nftables 是现代替代品，单工具 `nft` 与统一语法。两者都基于 netfilter 钩子。Kubernetes kube-proxy 历史上用 iptables（现在提供 IPVS 和 nftables 模式）。顺序重要：规则按链自上而下评估；首个匹配获胜。

**要点：**
- 表：filter/nat/mangle/raw
- 链：INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING
- nftables 是继任者；底层同 netfilter
- 用 `iptables -L -n -v` 查计数

---

### 84. .dockerignore

**频率：** 低

**题目：** 请解释 .dockerignore 的作用：(1) 它如何排除发送给守护进程的构建上下文中的路径，(2) 没有它时 node_modules、.git、构建产物和密钥被送进构建器会带来什么后果（拖慢构建、泄漏风险），(3) 其语法与 .gitignore 的关系、应始终排除哪些内容（.git、node_modules、target/、*.env、本地凭证），以及为什么即使使用 BuildKit 也仍然需要它。

**答案：** `.dockerignore` 排除发送给守护进程的构建上下文中的路径。没有它，`node_modules`、`.git`、构建产物和密钥都会送进构建器，拖慢构建并有泄漏风险。模式镜像 `.gitignore`。始终排除 `.git`、`node_modules`、`target/`、`*.env` 和本地凭证。通过构建输出里上下文大小验证。

**要点：**
- 减少上下文上传时间
- 防止把 `.env`/`.git` 泄进镜像
- 语法镜像 `.gitignore`
- 即使用 BuildKit 也需要

---

### 85. BuildKit 特性

**频率：** 低

**题目：** 请介绍 BuildKit 作为现代构建器的特性：(1) 并行阶段执行，(2) 更好的缓存以及密钥挂载、SSH 挂载、缓存挂载（--mount=type=cache|secret|ssh），(3) 如何用 DOCKER_BUILDKIT=1 启用，(4) 如何用 RUN --mount=type=cache 在构建间持久化编译器缓存而不烤进镜像，以及远程缓存（--cache-from、--cache-to）和通过 # syntax= 指令选前端。

**答案：** BuildKit 是现代构建器，支持并行阶段、更好缓存、密钥挂载、SSH 挂载、缓存挂载，以及 `Dockerfile` v1.4 这类前端。`DOCKER_BUILDKIT=1` 启用（现代 Docker 默认）。用 `RUN --mount=type=cache,target=/root/.cache/go-build` 在构建间持久化编译器缓存而不烤进镜像。

**要点：**
- 并行阶段执行
- `--mount=type=cache|secret|ssh`
- 远程缓存（`--cache-from`、`--cache-to`）
- 通过 `# syntax=` 指令选前端

---

### 86. Buildx 多架构镜像

**频率：** 低

**题目：** 请解释如何用 docker buildx 构建多架构镜像：(1) --platform linux/amd64,linux/arm64 如何产出引用各架构镜像的 manifest list（OCI image index）、消费者如何拉取匹配其 CPU 的变体，(2) 用 QEMU 仿真还是原生 runner 来构建的取舍，(3) docker buildx create --use 的作用，以及为什么这对 Apple Silicon 开发和 Graviton/Ampere 生产至关重要。

**答案：** `docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .` 产出引用各架构镜像的 manifest list（即 OCI image index）。消费者拉匹配其 CPU 的变体。用 QEMU 仿真或远程构建器（如原生 arm64 runner）求速度。对 Apple Silicon 开发和 Graviton/Ampere 生产至关重要。

**要点：**
- `docker buildx create --use`
- `--platform linux/amd64,linux/arm64`
- manifest list 按架构选
- 可能时用原生 runner 而非 QEMU

---

### 87. 镜像签名（Cosign、SLSA）

**频率：** 低

**题目：** 请介绍镜像签名与供应链安全：(1) Cosign（sigstore）如何用无密钥 OIDC 身份（Fulcio）或静态密钥签 OCI 制品、签名如何与镜像一起存在 registry，(2) SLSA 如何定义溯源级别（如 SLSA 3 要求不可伪造的构建溯源），(3) 如何在准入处用策略（Kyverno、Connaisseur）验签并拒绝未签镜像，以及配合 attestation（SBOM、构建溯源）构成完整供应链。

**答案：** Cosign（sigstore）用无密钥 OIDC 身份或静态密钥签 OCI 制品；签名与镜像一起存在 registry。SLSA 定义溯源级别——SLSA 3 要求不可伪造的构建溯源。在准入处验签（Kyverno、Connaisseur），未签镜像被拒。配合 attestation（SBOM、构建溯源）构成完整供应链。

**要点：**
- `cosign sign image@digest`
- 通过 OIDC + Fulcio 无密钥
- 准入处用策略校验
- SLSA 溯源做构建信任

---

### 88. 拓扑分散约束

**频率：** 低

**题目：** 请讲解拓扑分散约束（topologySpreadConstraints）：(1) 它如何约束 pod 在拓扑域（区域、节点、机架）间的分布，(2) maxSkew、topologyKey、whenUnsatisfiable（DoNotSchedule vs ScheduleAnyway）、labelSelector 各字段的作用，以及为什么在多副本 HA 分散上它比 pod anti-affinity 更好（扩展更好、控制更细）。

**答案：** 约束 pod 如何分布在拓扑域（区域、节点、机架）。例：

```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: {matchLabels: {app: web}}
```

这强制跨区域近均匀分布。HA 分散优于 pod anti-affinity 因为扩展更好、控制更细。

**要点：**
- `maxSkew` 控不均
- `topologyKey`：zone/hostname/rack
- `DoNotSchedule` vs `ScheduleAnyway`
- 多副本时比 anti-affinity 更好

---

### 89. CNI 选择：Calico、Cilium、Flannel

**频率：** 低

**题目：** 请对比 CNI 插件 Flannel、Calico 和 Cilium：(1) Flannel 作为简单 VXLAN overlay、无策略（适合开发），(2) Calico 提供 BGP 路由（无 overlay）、NetworkPolicy 和 eBPF 数据面，(3) Cilium 作为 eBPF 原生方案带 L3-L7 策略、透明加密、无 sidecar 服务网格、Hubble 可观测性以及可替代 kube-proxy，并说明现代集群和成熟 BGP 集成分别宜选哪个。

**答案：** Flannel 是简单 VXLAN overlay，无策略——适合开发。Calico 提供 BGP 路由（无 overlay）、NetworkPolicy 和 eBPF 数据面。Cilium 是 eBPF 原生，带 L3-L7 策略、透明加密、无 sidecar 的服务网格和 Hubble 可观测性。需要可观测性和 L7 策略的现代集群选 Cilium；成熟 BGP 集成选 Calico。

**要点：**
- Flannel：最简单、无策略
- Calico：BGP + NetworkPolicy
- Cilium：eBPF、L7 策略、Hubble
- Cilium 可替代 kube-proxy

---

### 90. Pod Security Standards

**频率：** 低

**题目：** 请介绍 Kubernetes 的 Pod Security Standards（PSS），它是如何替代已被移除的 PodSecurityPolicy 的？请说明它的三个等级（Privileged、Baseline、Restricted）分别代表什么级别的限制，如何通过 PodSecurity 准入控制器给命名空间打标签（如 pod-security.kubernetes.io/enforce）来强制这些等级，以及在什么场景下会配合 Kyverno 或 Gatekeeper 做更细粒度的自定义策略。

**答案：** PSS 替代了 PodSecurityPolicy。三级：Privileged（不设限）、Baseline（阻止已知权限提升）、Restricted（加固：非 root、无能力、seccomp RuntimeDefault）。通过 PodSecurity 准入控制器在命名空间打标签强制：

```yaml
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

用 Kyverno/Gatekeeper 做更细策略。

**要点：**
- PSP 在 1.25 移除；PSS 替代
- 等级：privileged/baseline/restricted
- 通过命名空间 label 强制
- 配合 Kyverno 做自定义规则

---

### 91. kubeconfig context

**频率：** 低

**题目：** 请解释 kubeconfig（~/.kube/config）中 cluster、user 和 context 三者的关系，context 如何由 cluster、user 与 namespace 组成。请谈谈如何用 kubectl config use-context 或 kubectx/kubens 切换、如何通过 shell 提示符指示（如 kube-ps1）或按环境分开 KUBECONFIG 文件，来防止在 prod 和 dev 间误操作导致破坏性错误。

**答案：** `~/.kube/config` 持有 cluster、user 和 context（cluster+user+namespace）。用 `kubectl config use-context prod` 切换。`kubectx`/`kubens` 这类工具加速切换。别在一个终端里混 prod/dev；用 shell 提示符指示（kube-ps1）或按环境分开 `KUBECONFIG` 文件防破坏性跨集群错误。

**要点：**
- Context = cluster + user + namespace
- 用 `kubectx`/`kubens` 求顺手
- 提示符指示防错集群
- 按环境分 `KUBECONFIG`

---

### 92. 临时容器（kubectl debug）

**频率：** 低

**题目：** 请介绍 Kubernetes 的临时容器（kubectl debug），它如何在不重启 pod 的情况下给运行中的 pod 加调试容器。请说明它对没有 shell 的 distroless/scratch 镜像为何至关重要、--target 如何与主容器共享 process namespace 让你看到其进程和 /proc、为什么不能给临时容器挂卷，以及需要主机级检查时如何改用 kubectl debug node/... 。

**答案：** 不重启 pod 给运行中 pod 加调试容器：

```bash
kubectl debug -it pod/foo --image=busybox:1.36 --target=app -- sh
```

对没 shell 的 distroless/scratch 镜像至关重要。`--target` 与主容器共享 process namespace 让你能看其进程与 `/proc`。不能加卷；那种用 `kubectl debug node/...` 在主机上跑。

**要点：**
- 给 scratch/distroless 加 shell
- `--target` 与主共享 pid/net
- 节点调试做主机级检查
- 不能给临时容器挂卷

---

### 93. 准入控制器

**频率：** 低

**题目：** 请介绍 Kubernetes 的准入控制器：它在认证/授权之后如何拦截 API 请求做校验或变更。请说明内置的几种（LimitRanger 设默认 requests/limits、ResourceQuota 做命名空间上限、PodSecurity 实现 PSS）、动态方式（ValidatingAdmissionPolicy 用 CEL、webhook），以及 OPA Gatekeeper 与 Kyverno 如何执行自定义策略（镜像 registry 白名单、必需 label、禁特权 pod），并对比 Kyverno 用原生 YAML 规则与 Gatekeeper 用 Rego、以及 mutating 与 validating 的执行顺序。

**答案：** 准入控制器在认证/授权后拦截 API 请求做校验或变更。内置：LimitRanger（默认 requests/limits）、ResourceQuota（命名空间上限）、PodSecurity（PSS）。动态：ValidatingAdmissionPolicy（CEL）、webhook——OPA Gatekeeper 和 Kyverno 执行自定义策略（镜像 registry allow-list、必需 label、禁特权 pod）。Kyverno 用 Kubernetes 原生 YAML 规则；Gatekeeper 用 Rego。

**要点：**
- Mutating 在 validating 之前跑
- LimitRanger + ResourceQuota 做安全网
- Kyverno（YAML）vs Gatekeeper（Rego）
- CEL ValidatingAdmissionPolicy 做内联规则

---

### 94. 矩阵构建

**频率：** 低

**题目：** 请解释 CI 中的矩阵构建（matrix build）：如何跨 OS、语言版本、架构等组合运行同一个作业。请以 GitHub Actions 的 strategy.matrix 为例说明其笛卡尔积特性，谈谈 fail-fast: false 如何让你看到所有失败、include/exclude 如何添加或跳过特定组合形成稀疏矩阵，以及为什么要注意组合爆炸导致作业数和成本相乘增长。

**答案：** 跨 OS、语言版本、架构组合跑同一作业。GitHub Actions：

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    node: [18, 20, 22]
```

用 `fail-fast: false` 看所有失败。`include`/`exclude` 加或跳特定组合。注意组合爆炸——矩阵作业相乘。

**要点：**
- 维度的笛卡尔积
- `fail-fast: false` 看所有结果
- `include`/`exclude` 做稀疏矩阵
- 成本相乘增长

---

### 95. 构建可复现性与溯源

**频率：** 低

**题目：** 请解释构建的可复现性与溯源（provenance）：如何让相同输入产出字节完全相同的输出。请说明具体手段——按 digest 钉基础镜像、用 lockfile 钉依赖、固定时间戳（SOURCE_DATE_EPOCH）、构建期禁网络；以及如何生成 SLSA 溯源（in-toto attestation）记录谁/构建了什么/在哪儿构建，并在部署时验证溯源以确保只有受信构建才能运行。

**答案：** 同输入产出字节相同输出。通过 digest 钉基础镜像、lockfile 钉依赖、固定时间戳（`SOURCE_DATE_EPOCH`）、构建期无网络实现。生成 SLSA 溯源（in-toto attestation）记录谁/什么/在哪儿构建。部署时验证溯源，让只有受信构建运行。

**要点：**
- 按 digest 钉基础镜像
- Lockfile + 冻结依赖
- SOURCE_DATE_EPOCH 求确定性时间
- SLSA 溯源建信任链

---

### 96. Ansible vs Salt vs Chef vs Puppet

**频率：** 低

**题目：** 请对比 Ansible、Salt、Chef、Puppet 四种配置管理工具。请说明各自特点：Ansible（无 agent、走 SSH、YAML playbook、推模型、易上手）、Salt（agent 或 salt-ssh、YAML/Jinja、事件驱动且快）、Chef（Ruby DSL、基于 agent、声明式）、Puppet（声明式 DSL、基于 agent、长命企业舰队强项），并谈谈随着不可变基础设施（容器、Packer 烤的 AMI）兴起配置管理的用途如何收窄、而 Ansible 在 OS 级供给上为何仍然流行。

**答案：** Ansible：无 agent（SSH）、YAML playbook、推模型、易上手——配置管理主导者。Salt：agent 或 salt-ssh、YAML/Jinja、快事件驱动（ZeroMQ）。Chef：Ruby DSL、基于 agent、声明式。Puppet：声明式 DSL、基于 agent、长命企业舰队强项。随不可变基础设施（容器、Packer 烤的 AMI），配置管理用途缩小；Ansible 在 OS 级供给仍流行。

**要点：**
- Ansible：无 agent、YAML、推
- Salt：快、事件驱动
- Chef/Puppet：基于 agent、长历史
- 不可变基础设施缩配置管理范围

---

### 97. 边缘 / 全球负载均衡

**频率：** 低

**题目：** 请描述边缘/全球负载均衡的分层架构。请说明各层的角色：anycast DNS（Route53 基于延迟、Cloudflare）、CDN/边缘（CloudFront、Cloudflare、Fastly）在靠近用户处终止 TLS、区域 LB（ALB/NLB、GLB）前置集群 ingress;并谈谈全球 LB（AWS Global Accelerator、GCP Global LB）如何提供 anycast IP 把流量转向最近的健康区域、如何用于低延迟和区域故障切换。

**答案：** 层次：anycast DNS（Route53 基于延迟、Cloudflare）、CDN/边缘（CloudFront、Cloudflare、Fastly）在用户附近终止 TLS、区域 LB（ALB/NLB、GLB）前置集群 ingress。全球 LB（AWS Global Accelerator、GCP Global LB）给 anycast IP 转向最近健康区域。用于低延迟和区域故障切换。

**要点：**
- DNS + CDN + 区域 LB 分层
- 全球 LB 提供 anycast IP
- TLS 在边缘终止
- 区域故障切换自动化

---

### 98. 追踪采样策略

**频率：** 低

**题目：** 请对比链路追踪的几种采样策略。请说明基于头（head-based）采样如何在请求开始时决定（如 1% 概率）——简单便宜但可能漏掉稀有错误;基于尾（tail-based）采样如何收集所有 span、在看完整 trace 后决定（保留错误和慢 trace、对成功采样）——需要 collector 缓冲内存但有用得多;以及自适应采样如何动态调整速率以达到目标量,并谈谈为什么应始终 100% 保留错误。

**答案：** 基于头：在请求开始决定（概率，如 1%）——简单、便宜、可能漏稀有错误。基于尾：收集所有 span，看完整 trace 后决定（保留错误、慢 trace、采样成功）——需要 collector 缓冲内存但有用得多。自适应采样动态调整速率以达目标量。

**要点：**
- 头：便宜、可能漏错
- 尾：保错/慢、采样其余
- 自适应：目标量
- 始终 100% 保错

---

### 99. 混沌工程

**频率：** 低

**题目：** 请介绍混沌工程：如何在类生产环境中故意注入故障（pod kill、网络延迟、AZ 中断）以验证韧性。请说明常见工具（Chaos Mesh、LitmusChaos、Gremlin、AWS Fault Injection Simulator）、为什么实验应是假设驱动而非随机、如何从小做起（如办公时间杀一个 pod 并事先给出'流量在 5 秒内转到健康 pod'这样的假设），以及如何逐步建立到模拟区域故障切换的 game day。

**答案：** 在类生产环境中故意注入故障（pod kill、网络延迟、AZ 中断）以验证韧性。工具：Chaos Mesh、LitmusChaos（k8s 原生）、Gremlin（SaaS）、AWS Fault Injection Simulator。从小开始：办公时间杀一个 pod 后给出假设（"流量在 5 秒内转到健康 pod"）。建到模拟区域故障切换的 game day。

**要点：**
- 假设驱动、不随机
- 从小开始、扩到 game day
- 工具：Chaos Mesh、Litmus、Gremlin、FIS
- 验证关于韧性的假设

---

### 100. 策略即代码（OPA、Kyverno、Conftest）

**频率：** 低

**题目：** 请介绍策略即代码（policy as code）及其工具 OPA、Kyverno、Conftest。请说明如何把组织策略（只许签名镜像、必需 label、无特权 pod）编码并通过准入控制或 CI 强制、对比 OPA/Gatekeeper 用 Rego 与 Kyverno 用 YAML 规则、Conftest 如何在 CI 中对任何结构化文件（Terraform plan、Dockerfile、k8s manifest）跑 OPA;并谈谈左移策略（在 PR 中失败而非部署时）以及强制前先用审计模式的做法。

**答案：** 把组织策略（只许签名镜像、必需 label、无特权 pod）编码并通过准入控制或 CI 强制。OPA/Gatekeeper 用 Rego；Kyverno 用 YAML 规则；Conftest 在 CI 中对任何结构化文件（Terraform plan、Dockerfile、k8s manifest）跑 OPA。左移策略：在 PR 中失败而非部署时。

**要点：**
- Kyverno（YAML）vs OPA/Gatekeeper（Rego）
- Conftest 在 CI 中扫 IaC/manifest
- 左移：在 PR 中失败
- 强制前先审计模式
