# DevOps 面试题

100 道关于 Docker、Kubernetes、CI/CD、基础设施即代码、可观测性、网络、安全和云的高频题。

---

### 1. 进程 vs 线程；解释 fork/exec

**答案：** 进程是隔离的地址空间，有自己的 PID、文件描述符和内存。线程在进程内共享内存且创建更便宜。`fork()` 克隆调用进程（内存写时复制、FD 复制），生出一个 PID 不同的子进程。`exec()` 用新程序替换当前进程映像，PID 不变。经典 shell 模式是子进程 `fork` 然后 `exec`，父进程 `wait`。父进程未回收已结束子进程时会出现僵尸。

**要点：**
- 线程共享堆；进程不共享
- `fork` 是 COW，未写入前便宜
- `exec` 保 PID 但换二进制
- 用 `wait`/`waitpid` 回收子进程避免僵尸

---

### 2. 文件描述符与 ulimit

**答案：** 文件描述符是内核每进程打开文件表中的一个小整数索引。0/1/2 是 stdin/stdout/stderr。套接字、管道、epoll 句柄都消耗 FD。默认软限制（常 1024）会让高连接服务遭遇 `EMFILE: too many open files`。用 `ulimit -n` 提高 shell 的；systemd 单元中用 `LimitNOFILE`；或 `/etc/security/limits.conf` 中用 `nofile`。容器里 kubelet/Docker daemon 设置封顶工作负载能请求多少。

**要点：**
- FD 是每进程的整数索引
- `EMFILE` 意味着抬高 `nofile`
- systemd：`LimitNOFILE=`；k8s：容器运行时配置
- 查使用：`ls /proc/<pid>/fd | wc -l`

---

### 3. cgroups 与 namespaces

**答案：** Namespace 隔离进程能看到什么（PID、NET、MNT、UTS、IPC、USER、CGROUP、TIME）；cgroup 限制并记账它能用什么（CPU、内存、IO、PID）。容器就是带着 cgroup 限制运行在 namespace 内的进程。cgroup v2 把层级统一为 `/sys/fs/cgroup` 下的单棵树。Kubernetes 和 Docker 按 pod/容器写入 cgroup 子树以强制 request 和 limit。

**要点：**
- Namespace = 隔离；cgroup = 配额
- 8 种 namespace；PID/NET 最显眼
- 推荐 cgroup v2 统一层级
- 查看：`systemd-cgls`、`cat /proc/self/cgroup`

---

### 4. systemd 单元与 journalctl

**答案：** systemd 以单元（`.service`、`.timer`、`.socket`、`.mount`）管理服务。单元文件位于 `/etc/systemd/system/`，在 `[Service]` 中声明 `ExecStart`、`Restart=`、`User=` 和资源限制。`systemctl daemon-reload` 拾取改动；`systemctl enable --now foo` 开机启动。日志进 journal；用 `journalctl -u foo -f` 或 `--since "1 hour ago"` 查询。用 `systemd-analyze blame` 找慢启动单元。

**要点：**
- 单元类型：service/timer/socket/mount/target
- `Restart=on-failure` + `RestartSec=` 增强韧性
- `journalctl -u <unit> -f` 看实时日志
- 在 `/etc/systemd/system/foo.service.d/` 用 drop-in

---

### 5. TCP 三次握手与 TIME_WAIT

**答案：** 建连：客户端 SYN、服务端 SYN-ACK、客户端 ACK。拆连双方各发 FIN/ACK。关闭发起方进入 `TIME_WAIT`（2*MSL，通常 60s），让晚到的重复段不干扰同一四元组上的新连接。繁忙客户端上大量 `TIME_WAIT` 套接字提示短命对外连接；用连接池、`SO_REUSEADDR` 或 `net.ipv4.tcp_tw_reuse=1` 修复，而非关掉这个状态。

**要点：**
- SYN -> SYN/ACK -> ACK
- TIME_WAIT 防止陈旧段
- 池化连接而不是调内核
- 查看：`ss -tan state time-wait | wc -l`

---

### 6. DNS 记录与 TTL

**答案：** A 映射 IPv4，AAAA 映射 IPv6，CNAME 把一个名字别名到另一个（在区域顶点不能与其他记录共存），SRV 公告 service+port+priority+weight，TXT 携任意文本（SPF、ACME 挑战）。MX 路由邮件。TTL 控制解析器缓存时长；低 TTL 便于切换但抬高查询量。迁移前提前数小时降 TTL，然后切换记录。

**要点：**
- 顶点禁 CNAME（用 ALIAS/ANAME）
- Kubernetes headless 服务用 SRV
- 切换前降 TTL
- 用 `dig +trace name` 调试

---

### 7. HTTP/1.1 vs HTTP/2 vs HTTP/3

**答案：** HTTP/1.1 是文本，每个 TCP 连接一个请求（或带头阻塞流水线）。HTTP/2 是二进制，单 TCP 连接上多路复用流，支持头部压缩（HPACK）与服务端推送。HTTP/3 跑在 QUIC（UDP）上，消除 TCP 头阻塞并通过 0-RTT 加快建连。gRPC 需要 HTTP/2；许多 CDN 自动协商 HTTP/3。

**要点：**
- H1：每连接一个在途
- H2：TCP 上多路复用流、HPACK
- H3：UDP 上 QUIC，无 TCP HoL
- gRPC 端到端需 H2

---

### 8. TLS 握手与证书链

**答案：** 客户端与服务端协商 cipher 并交换密钥（ECDHE 实现前向保密）。服务端出示叶证书加中间证书；客户端验证链直到其存储中的受信任根，检查 SAN 匹配主机名、有效期与吊销（OCSP/CRL）。TLS 1.3 把握手缩减到一个往返并去除遗留 cipher。误配置包括缺中间证书、错 SAN 或过期证书。

**要点：**
- 叶 -> 中间 -> 受信根
- SAN 必须匹配主机名（CN 已遗留）
- TLS 1.3 = 1-RTT、强制 PFS
- 调试：`openssl s_client -connect host:443 -showcerts`

---

### 9. iptables vs nftables

**答案：** iptables 通过表（`filter`、`nat`、`mangle`）和链（`INPUT`、`OUTPUT`、`FORWARD`）过滤包。nftables 是现代替代品，单工具 `nft` 与统一语法。两者都基于 netfilter 钩子。Kubernetes kube-proxy 历史上用 iptables（现在提供 IPVS 和 nftables 模式）。顺序重要：规则按链自上而下评估；首个匹配获胜。

**要点：**
- 表：filter/nat/mangle/raw
- 链：INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING
- nftables 是继任者；底层同 netfilter
- 用 `iptables -L -n -v` 查计数

---

### 10. SSH 密钥、agent 转发、跳板机

**答案：** 使用带口令的 Ed25519 密钥（`ssh-keygen -t ed25519`），加载到 `ssh-agent`。`ForwardAgent yes` 将本地 agent 套接字转发到远端以便继续认证而无需复制密钥；在共享主机上有风险。优先 `ProxyJump bastion`（`ssh -J`）通过跳板机隧道，不暴露密钥。在 `~/.ssh/config` 中配置可复用跳。

**要点：**
- Ed25519 > RSA-2048
- 不在不可信主机上做 agent 转发
- `ProxyJump`/`-J` 比转发更安全
- 在 `~/.ssh/config` 中配 `Host`、`User`、`IdentityFile`

---

### 11. 镜像 vs 容器 vs 层

**答案：** 镜像是不可变、内容寻址的文件系统层与元数据（entrypoint、env）的捆绑。层是一个构建步骤产生的 tar 差量，跨镜像按 digest 去重。容器是基于镜像只读层之上加一个薄可写层的运行（或停止）实例。pull 会复用磁盘上已有的层，所以顺序和基础镜像复用很重要。

**要点：**
- 镜像 = 层 + config manifest
- 层是内容寻址的（sha256）
- 容器加一层可写上层
- 复用基础镜像最大化缓存命中

---

### 12. RUN vs CMD vs ENTRYPOINT

**答案：** `RUN` 在构建期执行，产生一层。`ENTRYPOINT` 定义容器启动时始终运行的可执行。`CMD` 提供默认参数（或无 ENTRYPOINT 时的默认命令）。优先用 exec 形式（`ENTRYPOINT ["app"]`）而非 shell 形式以避免把 shell 作为 PID 1。运行时通过给 `docker run image arg1` 追加参数覆盖 `CMD`。

**要点：**
- RUN = 构建期层
- ENTRYPOINT = 固定二进制
- CMD = 默认参数 / 回退
- 用 exec 形式（JSON 数组）以正确处理信号

---

### 13. 层缓存顺序

**答案：** 每条 Dockerfile 指令按其输入缓存；改一条会破坏其后每一层。把变动少的步骤放前面：基础镜像、系统包，然后依赖清单（`package.json`、`go.mod`），然后 `RUN install`，最后 `COPY . .` 源代码。这样源代码改动只需复用依赖层，把构建从分钟级降到秒级。

**要点：**
- 缓存从首次变更起失效
- 把清单复制在源代码之前
- 按 digest 钉基础镜像求可复现
- BuildKit `--mount=type=cache` 做包缓存

---

### 14. 多阶段构建

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

### 15. .dockerignore

**答案：** `.dockerignore` 排除发送给守护进程的构建上下文中的路径。没有它，`node_modules`、`.git`、构建产物和密钥都会送进构建器，拖慢构建并有泄漏风险。模式镜像 `.gitignore`。始终排除 `.git`、`node_modules`、`target/`、`*.env` 和本地凭证。通过构建输出里上下文大小验证。

**要点：**
- 减少上下文上传时间
- 防止把 `.env`/`.git` 泄进镜像
- 语法镜像 `.gitignore`
- 即使用 BuildKit 也需要

---

### 16. Distroless vs scratch vs alpine

**答案：** `scratch` 是空——只你的静态二进制；最小最安全但无 shell 或 libc，难调试。Distroless 包含最小运行时（libc、CA 证书，可选 Python/Java），无包管理器和 shell。Alpine 加 musl libc、busybox 和 apk；小但 musl 可能让 glibc 编译的二进制崩（DNS 怪癖）。生产选 scratch/distroless，需要包管理器时选 alpine。

**要点：**
- scratch：仅静态二进制，~MB
- distroless：libc + CA，无 shell
- alpine：musl + apk，注意 DNS 边缘情况
- 调试 distroless 通过 `kubectl debug` 临时容器

---

### 17. 镜像标签规范

**答案：** 生产避免 `latest`——它可变且不可钉死。用不可变标识打标：语义版本（`1.4.2`）、git SHA（`sha-abc1234`）或构建日期。push 多个指向同一 digest 的标签（`1.4.2`、`1.4`、`1`、`sha-...`），让消费者在稳定与新鲜之间选。生产部署用 digest 钉死（`image@sha256:...`）做真正的不可变。

**要点：**
- 永不部署 `:latest`
- 组合 semver + SHA 标签
- manifest 中按 digest 钉死
- 用镜像仓库不可变标签策略

---

### 18. 卷 vs 绑定挂载 vs tmpfs

**答案：** 卷是 Docker 管理的存储（`/var/lib/docker/volumes/`），支持驱动（本地、NFS、云）。绑定挂载直接把主机路径挂入容器——灵活但把容器与主机布局耦合。tmpfs 只在内存，理想用于不能落盘的密钥和临时数据。Kubernetes 对应是 PersistentVolume、hostPath、emptyDir（`medium: Memory`）。

**要点：**
- 卷：托管、可移植
- 绑定挂载：主机路径、与主机耦合
- tmpfs：仅 RAM、短暂
- k8s 等价：PV/hostPath/emptyDir

---

### 19. Docker 网络驱动

**答案：** `bridge`（默认）每主机创建 NAT 虚拟网络。`host` 共享主机网络命名空间——无隔离，全性能。`overlay` 通过 VXLAN 跨多主机用于 Swarm。`macvlan` 给每个容器一个 MAC 和物理 LAN 上的 IP。`none` 禁网络。Kubernetes 用 CNI 插件替代所有这些；pod 获得自己的 netns 和集群范围可路由的 IP。

**要点：**
- bridge = 默认 NAT
- host = 无隔离、最快
- overlay = 多主机 VXLAN
- macvlan = 容器在物理 LAN

---

### 20. docker compose

**答案：** Compose 在 `docker-compose.yml` 中定义多容器应用：services、networks、volumes、env、depends_on、healthcheck。`docker compose up -d` 起栈；`compose down -v` 拆栈。非常适合本地开发与小型单主机部署。生产多主机请进 Kubernetes 或 Nomad。Profiles 让你切换可选服务（`--profile debug`）。

**要点：**
- 一个 YAML、多个服务
- `depends_on: condition: service_healthy` 顺序
- Profiles 做可选栈
- 真生产编排用 Kubernetes

---

### 21. BuildKit 特性

**答案：** BuildKit 是现代构建器，支持并行阶段、更好缓存、密钥挂载、SSH 挂载、缓存挂载，以及 `Dockerfile` v1.4 这类前端。`DOCKER_BUILDKIT=1` 启用（现代 Docker 默认）。用 `RUN --mount=type=cache,target=/root/.cache/go-build` 在构建间持久化编译器缓存而不烤进镜像。

**要点：**
- 并行阶段执行
- `--mount=type=cache|secret|ssh`
- 远程缓存（`--cache-from`、`--cache-to`）
- 通过 `# syntax=` 指令选前端

---

### 22. Buildx 多架构镜像

**答案：** `docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .` 产出引用各架构镜像的 manifest list（即 OCI image index）。消费者拉匹配其 CPU 的变体。用 QEMU 仿真或远程构建器（如原生 arm64 runner）求速度。对 Apple Silicon 开发和 Graviton/Ampere 生产至关重要。

**要点：**
- `docker buildx create --use`
- `--platform linux/amd64,linux/arm64`
- manifest list 按架构选
- 可能时用原生 runner 而非 QEMU

---

### 23. 镜像漏洞扫描

**答案：** Trivy、Grype、Snyk 等工具扫描镜像层中 OS 包和语言依赖里的已知 CVE。在 CI 中作为必备检查；有可用修复版本的 high/critical 失败构建。也扫描误配（Dockerfile lint）与密钥。在 registry 上做周期性扫描，因为新 CVE 每天都会针对未变镜像出现。

**要点：**
- Trivy/Grype 扫 OS + 语言依赖
- 可修复的 high/critical 失败 CI
- 持续扫 registry，不仅在 push 时
- 配合 SBOM 生成

---

### 24. 镜像签名（Cosign、SLSA）

**答案：** Cosign（sigstore）用无密钥 OIDC 身份或静态密钥签 OCI 制品；签名与镜像一起存在 registry。SLSA 定义溯源级别——SLSA 3 要求不可伪造的构建溯源。在准入处验签（Kyverno、Connaisseur），未签镜像被拒。配合 attestation（SBOM、构建溯源）构成完整供应链。

**要点：**
- `cosign sign image@digest`
- 通过 OIDC + Fulcio 无密钥
- 准入处用策略校验
- SLSA 溯源做构建信任

---

### 25. 非 root、丢能力、只读 rootfs

**答案：** Dockerfile 设 `USER 10001`，Kubernetes 设 `securityContext: {runAsNonRoot: true, runAsUser: 10001, allowPrivilegeEscalation: false, capabilities: {drop: [ALL]}, readOnlyRootFilesystem: true}`。如果应用需要 `/tmp` 等可写路径，挂 emptyDir。这极大减小应用被攻陷时的爆炸半径。

**要点：**
- 以非 root UID 运行
- 丢 ALL 能力，只加需要的
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`

---

### 26. 资源限制与 OOM

**答案：** 无限制时，容器可饿死主机。`docker run --memory=512m --cpus=1` 强制 cgroup 限制。容器超内存时，内核 OOM 杀手终止进程，Docker 报 `OOMKilled`。CPU 限制是节流而非杀。Kubernetes 中设 `resources.limits.memory` 和 `requests` 通知调度；超 limit 的 pod 被杀并重启。

**要点：**
- 内存超 limit -> OOMKill
- CPU 超 limit -> 节流
- `requests` 调度、`limits` 强制
- 看 `dmesg | grep -i oom` 看内核事件

---

### 27. PID 1 问题与 tini

**答案：** Linux 中 PID 1 有特殊职责：回收僵尸子进程和处理信号。许多应用运行时（Node、Python）不做这些，所以 SIGTERM 被忽略，shell 形式 ENTRYPOINT 启动的 shell 不转发信号。用 `tini` 或 `dumb-init` 作 PID 1：`ENTRYPOINT ["tini", "--", "node", "server.js"]`。Docker 提供 `--init` 自动注入 tini。

**要点：**
- PID 1 必须回收僵尸 + 处理信号
- Shell 形式 ENTRYPOINT 破坏信号转发
- 用 `tini`/`dumb-init` 或 `docker run --init`
- 没它优雅关停会失败

---

### 28. 健康检查：Dockerfile vs 编排器

**答案：** Dockerfile `HEALTHCHECK CMD curl -f http://localhost/health || exit 1` 在多次重试后标记容器 `unhealthy`。Compose 可等 `service_healthy`。Kubernetes 忽略 Dockerfile 健康检查；它用 pod spec 的 `livenessProbe`、`readinessProbe`、`startupProbe`。跨编排器运行时两地保持同样逻辑。

**要点：**
- Dockerfile HEALTHCHECK 被 k8s 忽略
- k8s：liveness/readiness/startup 探针
- 探针可为 exec/HTTP/TCP/gRPC
- 调 `initialDelaySeconds` 避免重启循环

---

### 29. docker exec vs run vs attach

**答案：** `docker run` 从镜像启动新容器。`docker exec` 在运行的容器内运行额外进程（`-it` 交互 shell）。`docker attach` 把你的终端重连到容器 PID 1 的 stdio；按 Ctrl-C 可能杀容器。调试优选 `exec`；`attach` 留给需要 PID 1 流的少数场景。

**要点：**
- `run`：从镜像起新容器
- `exec`：运行容器内的额外进程
- `attach`：连到 PID 1 stdio
- `exec -it sh` 临时调试

---

### 30. Registry 选择

**答案：** 选项包括 Docker Hub（免费层有速率限制）、GitHub Container Registry（`ghcr.io`，与 Actions 集成）、GitLab Registry、AWS ECR、Google Artifact Registry、Azure ACR、Harbor（带扫描/复制的自托管）和 JFrog Artifactory。按你 CI 的认证集成、地理复制需求、漏洞扫描和成本选择。气隙环境镜像上游到 Harbor/Artifactory。

**要点：**
- 云原生：ECR/Artifact Registry/ACR
- 自托管：Harbor、Artifactory
- 气隙构建镜像上游
- 注意 Docker Hub pull 速率限制

---

### 31. Pod vs Deployment vs ReplicaSet vs StatefulSet vs DaemonSet vs Job vs CronJob

**答案：** Pod 是最小单元，一个或多个共置容器共享网络/IPC。ReplicaSet 维护 N 个 pod 副本。Deployment 用滚动更新管理 ReplicaSet——无状态应用的默认。StatefulSet 给有状态工作负载（数据库）稳定身份和有序滚动。DaemonSet 每节点跑一个 pod（日志采集、CNI）。Job 跑到完成；CronJob 按 cron 调度 Job。

**要点：**
- 无状态用 Deployment
- 有序/身份绑定用 StatefulSet
- 每节点代理用 DaemonSet
- 批用 Job/CronJob

---

### 32. Service 类型

**答案：** ClusterIP（默认）是集群内可达的虚拟 IP。NodePort 在每个节点的静态端口（30000-32767）上暴露服务。LoadBalancer 配置指向 NodePort 的云 LB。ExternalName 返回到外部主机的 CNAME。Headless（`clusterIP: None`）跳过 VIP 并通过 DNS A/SRV 记录返回 pod IP——StatefulSet 与服务发现用。

**要点：**
- ClusterIP：集群内 VIP
- NodePort：每节点同一端口
- LoadBalancer：前置云 LB
- Headless：基于 DNS、无代理

---

### 33. Ingress vs Gateway API

**答案：** Ingress 是通过注解做 HTTP(S) 路由的遗留 L7 API——按控制器的怪癖限制可移植性。Gateway API 是继任者：供应商中立、角色导向（GatewayClass 由基础设施拥有、Gateway 由集群运维、HTTPRoute 由应用团队），原生支持 TCP/UDP/TLS、流量切分和按头路由。新部署在控制器支持时应瞄准 Gateway API。

**要点：**
- Ingress = 遗留、注解重
- Gateway API = 角色划分、可移植
- HTTPRoute 支持加权流量
- 控制器：Envoy Gateway、Istio、Contour、NGINX

---

### 34. ConfigMaps vs Secrets

**答案：** 两者都是作为 env var 或文件挂载的 key/value 存储。ConfigMap 放非敏感配置；Secret 放凭证，在 etcd 中静态 base64 编码（用 KMS 加密 etcd 才是真安全）。优先用文件挂载，让轮换无需 pod 重启即可传播（用 sidecar reloader 或应用文件 watcher）。真实密钥管理集成 External Secrets Operator 与 Vault/AWS Secrets Manager。

**要点：**
- Secret 是 base64，默认未加密
- 用 KMS 启用 etcd 静态加密
- 文件挂载自动更新；env var 不会
- 用 External Secrets Operator 做真相源

---

### 35. 卷、PV、PVC、StorageClass

**答案：** PersistentVolume 是表示真实存储（EBS、GCE PD、NFS）的集群资源。PersistentVolumeClaim 是命名空间内的存储请求。StorageClass 参数化动态供给——PVC 引用一个 SC 触发 CSI 驱动创建 PV。访问模式：RWO（一节点）、ROX（只读多）、RWX（读写多）、RWOP（一 pod）。回收策略：Retain/Delete。

**要点：**
- PV：集群资源；PVC：命名空间内 claim
- StorageClass 启用动态供给
- 访问模式：RWO/ROX/RWX/RWOP
- CSI 驱动做实际供给

---

### 36. 探针：liveness、readiness、startup

**答案：** Readiness 控制流量——失败的 pod 从 Service endpoint 移除但不杀。Liveness 重启卡住的容器。Startup 延迟 liveness/readiness 直到慢启动应用就绪，防止过早被杀。Web 服务用 HTTP 探针，CLI 用 exec，原始套接字用 TCP。错探针引起级联重启；保守设 `failureThreshold` 与 `periodSeconds`。

**要点：**
- Readiness 控制 Service 成员
- Liveness 在挂时重启
- Startup 保护慢启动
- 误配 -> 重启风暴

---

### 37. requests vs limits；QoS 类

**答案：** `requests` 为调度预留资源；`limits` 封顶实际使用。pod 得到 QoS 类：Guaranteed（所有容器 requests == limits）、Burstable（设了部分 requests）、BestEffort（都没设）。节点压力下，BestEffort 先被驱逐，然后是超 requests 的 Burstable，最后 Guaranteed。延迟敏感服务设 requests = limits 避免节流意外。

**要点：**
- requests = 调度；limits = 强制
- QoS：Guaranteed > Burstable > BestEffort
- BestEffort 先被驱逐
- CPU limit 引起节流而非 OOM

---

### 38. HPA vs VPA vs Cluster Autoscaler vs Karpenter

**答案：** HPA 按 CPU/内存/自定义指标扩 pod 副本。VPA 随时间右调 pod requests（常只跑推荐模式）。Cluster Autoscaler 在现有节点组中按 pod 无法调度增减节点。Karpenter 按需供给恰到好处的节点类型，无预定义组，挑 spot/按需混合最小化成本。HPA + Karpenter 是现代 AWS 组合。

**要点：**
- HPA 水平扩 pod
- VPA 调 requests；同指标避免与 HPA 同用
- CA 在 ASG 内扩节点
- Karpenter：无组、类型最优节点

---

### 39. PodDisruptionBudgets

**答案：** PDB 声明自愿干扰（如节点排空）期间最少可用（或最多不可用）的 pod 数。例：3 副本部署的 `minAvailable: 2` 一次最多让一个 pod 被驱逐。Cluster Autoscaler、节点升级和 `kubectl drain` 尊重 PDB。PDB 不保护非自愿干扰（节点崩溃）。

**要点：**
- 只保护自愿干扰
- `minAvailable` 或 `maxUnavailable`
- 安全滚动节点升级必需
- 配合多区域拓扑分散

---

### 40. affinity、anti-affinity、taint、toleration、nodeSelector

**答案：** `nodeSelector` 是简单 label 匹配。节点 affinity 是表达性版本，带 required/preferred 规则。Pod affinity/anti-affinity 相对其他 pod 共置或分散（如把副本分散到节点）。Taint 排斥 pod 除非它们容忍；用于专用节点池（GPU、spot）。Pod 上的 toleration 让它能被调度到有 taint 的节点。

**要点：**
- nodeSelector：简单 label 匹配
- Affinity：required vs preferred
- Taint 排斥；toleration 允许
- Anti-affinity = 跨节点/区域 HA

---

### 41. 拓扑分散约束

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

### 42. Init 容器 vs Sidecar 容器

**答案：** Init 容器在应用容器启动前顺序运行到完成——适合迁移、等依赖、取配置。Sidecar 与主容器并行运行，共享网络/卷（日志采集、代理）。Kubernetes 1.28+ 通过带 `restartPolicy: Always` 的 `initContainers` 加原生 sidecar 支持，它们在主容器启动前就启动并存活到主容器之后。

**要点：**
- Init：一次性设置、顺序
- Sidecar：生命周期附着的辅助
- 原生 sidecar 通过 init + `restartPolicy: Always`
- Sidecar 与主共享网络/卷

---

### 43. NetworkPolicy 与默认拒绝

**答案：** 默认所有 pod 可与所有 pod 通信。NetworkPolicy 选 pod 并限制 ingress/egress。应用命名空间级默认拒绝：

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

### 44. CNI 选择：Calico、Cilium、Flannel

**答案：** Flannel 是简单 VXLAN overlay，无策略——适合开发。Calico 提供 BGP 路由（无 overlay）、NetworkPolicy 和 eBPF 数据面。Cilium 是 eBPF 原生，带 L3-L7 策略、透明加密、无 sidecar 的服务网格和 Hubble 可观测性。需要可观测性和 L7 策略的现代集群选 Cilium；成熟 BGP 集成选 Calico。

**要点：**
- Flannel：最简单、无策略
- Calico：BGP + NetworkPolicy
- Cilium：eBPF、L7 策略、Hubble
- Cilium 可替代 kube-proxy

---

### 45. CoreDNS

**答案：** CoreDNS 是默认集群 DNS 服务器。它解析 `svc.namespace.svc.cluster.local`、headless service A 记录（每 pod 一条）、端口 SRV 记录，并向上游转发外部查询。pod resolv.conf 中 `ndots:5` 会让外部名字产生过多查找；用 FQDN（尾点）或 `dnsConfig.options` 缓解。缓存命中指标和转发延迟是关键 SLI。

**要点：**
- 解析 `<svc>.<ns>.svc.cluster.local`
- Headless 服务 -> 每 pod A 记录
- 注意 `ndots:5` 外部查找放大
- 随集群规模扩 CoreDNS 副本

---

### 46. 服务网格：它加了什么

**答案：** 服务网格（Istio、Linkerd、Cilium Service Mesh）在服务间加 mTLS、细粒度流量策略（重试、超时、断路）、canary/加权路由和统一指标/追踪——无需改应用代码。权衡：sidecar 带来的延迟（Linkerd 最轻）、运维复杂度、调试难度。无 sidecar 网格（Cilium、Istio Ambient）降开销。

**要点：**
- mTLS + L7 策略 + 可观测性
- Sidecar 税 vs 无 sidecar（Ambient）
- Linkerd：简单；Istio：功能多
- 加调试面；权衡需求

---

### 47. CRD 与 Operator 模式

**答案：** CustomResourceDefinition 用新资源类型扩展 API。Operator 是监听该资源并将真实世界状态调和的控制器——把运维知识编入代码（供给数据库、跑故障切换、做备份）。用 kubebuilder 或 Operator SDK 构建。例：cert-manager（Certificate -> 签发 TLS）、Prometheus Operator、postgres-operator。

**要点：**
- CRD 加新 API kind
- 控制器调和期望 vs 实际
- 编码领域运维知识
- 用 kubebuilder/Operator SDK 构建

---

### 48. Helm vs Kustomize

**答案：** Helm 是模板 + 包管理器：chart 带 `values.yaml`、release、hook、回滚。Kustomize 是无模板的 overlay——一个 `base/` 加环境 `overlays/` 打补丁字段。Helm 在打包第三方应用上胜；Kustomize 用于带轻量环境差异的一方应用。许多团队两者都用：Helm 装供应商 chart，Kustomize 在上面通过 kustomization.yaml 的 `helmCharts` 覆盖。

**要点：**
- Helm：模板 + 包管理
- Kustomize：overlay + 补丁、无模板
- 混合：在 Helm 输出上跑 Kustomize
- ArgoCD 原生支持两者

---

### 49. 滚动更新 vs Recreate

**答案：** 滚动更新是 Deployment 默认；`maxSurge`（在副本数之上的额外 pod）和 `maxUnavailable`（允许缺的）调速度 vs 可用性。`maxSurge: 25%, maxUnavailable: 0` 零停机但需备用容量。Recreate 杀掉所有老 pod，然后启动新——简单但有停机。不能混版本运行（schema 冲突）的应用用 Recreate。

**要点：**
- maxSurge + maxUnavailable 调推出
- maxUnavailable: 0 求零停机
- 不兼容版本用 Recreate
- 配合 readiness 探针求安全

---

### 50. Blue/green 与 canary（Argo Rollouts、Flagger）

**答案：** Blue/green 让老（蓝）和新（绿）都跑，然后切 Service selector 实现瞬时切换和便捷回滚。Canary 把一小比例流量转到新版本、观察指标、然后放大。Argo Rollouts 和 Flagger 用分析步骤自动化 canary——查询 Prometheus 看错误率/延迟并在回归时自动回滚。

**要点：**
- Blue/green：通过 selector 瞬时翻转
- Canary：渐进百分比放大
- Prometheus/Datadog 的分析门控晋升
- Argo Rollouts CRD 或 Flagger 控制器

---

### 51. Pod Security Standards

**答案：** PSS 替代了 PodSecurityPolicy。三级：Privileged（无限制）、Baseline（阻止已知权限提升）、Restricted（加固：非 root、无能力、seccomp RuntimeDefault）。通过 PodSecurity 准入控制器在命名空间打标签强制：

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

### 52. RBAC：Role vs ClusterRole

**答案：** Role 在一个命名空间内授权；ClusterRole 是集群范围或命名空间模板。RoleBinding/ClusterRoleBinding 把主体（用户、组、ServiceAccount）链接到角色。最小权限原则：应用避免 `cluster-admin`，把 SA 限定到所需 verb/资源。用 `kubectl auth can-i --list --as=system:serviceaccount:ns:sa` 审计。

**要点：**
- Role：命名空间内
- ClusterRole：集群或模板
- 绑定到用户/组/SA
- 用 `kubectl auth can-i` 审计

---

### 53. ServiceAccount 与 pod 身份

**答案：** pod 通过挂载的 SA token 向 API 认证。对云 API 用 workload identity：IRSA（AWS，通过 OIDC 把 IAM 角色绑到 SA）、GKE Workload Identity、Azure Workload Identity。SA token 被交换为云凭证——pod 内无长期密钥。Token 卷被投影并自动轮换。

**要点：**
- SA = pod 的 k8s 身份
- 对云 API 用 IRSA / Workload Identity
- Token 被投影并自动轮换
- 永远别把云密钥烤进镜像

---

### 54. etcd

**答案：** etcd 是 Kubernetes API 背后的强一致键值存储。Raft 法定人数用奇数集群（3 或 5）；HA 用独立磁盘（低延迟 NVMe）和专用节点。定期用 `etcdctl snapshot save` 备份并测试恢复。用 KMS 静态加密。多数生产事故追溯到 etcd 磁盘延迟或法定人数丢失。

**要点：**
- Raft，奇数 3/5 节点
- 对延迟敏感：快盘必备
- 定期演练快照 + 恢复
- 用 KMS 静态加密

---

### 55. kubeconfig context

**答案：** `~/.kube/config` 持有 cluster、user 和 context（cluster+user+namespace）。用 `kubectl config use-context prod` 切换。`kubectx`/`kubens` 这类工具加速切换。别在一个终端里混 prod/dev；用 shell 提示符指示（kube-ps1）或按环境分开 `KUBECONFIG` 文件防破坏性跨集群错误。

**要点：**
- Context = cluster + user + namespace
- 用 `kubectx`/`kubens` 求顺手
- 提示符指示防错集群
- 按环境分 `KUBECONFIG`

---

### 56. Pod Pending 诊断清单

**答案：** 跑 `kubectl describe pod`。原因：CPU/内存不足（无节点适合 requests）、不可满足的 nodeSelector/affinity/taint、PVC 未绑定（无匹配 SC 或配额）、image pull 待定、SA 缺失、ResourceQuota 命中。查集群自动扩缩事件看扩容失败。PVC 问题 describe PVC 找供给器错误。

**要点：**
- 先看 `kubectl describe pod` 事件
- 检查 requests vs 节点容量
- 验证 PVC 已绑且 SC 存在
- 看自动扩缩日志看扩容失败

---

### 57. CrashLoopBackOff 清单

**答案：** Pod 启动、退出、按指数退避重启。调查：`kubectl logs --previous` 看前次退出、`kubectl describe pod` 看退出码、查命令/参数、缺 env 或 secret、init 容器中失败的迁移、OOMKilled、应用配置错误。探针失败可伪装为崩溃——确认 liveness 没过激。

**要点：**
- `kubectl logs --previous` 看前次启动
- describe 输出中的退出码
- 单独检查 init 容器
- 排除 liveness 探针杀它

---

### 58. ImagePullBackOff 原因

**答案：** 可能：image/tag 拼错、registry 不可达、缺 imagePullSecret、registry 凭证过期、私有镜像无认证、ECR/GCR 凭证未刷新、限流（Docker Hub 匿名）、digest 不存在。describe pod 看确切 registry 错误。把关键镜像镜像到你自己的 registry 移除第三方依赖。

**要点：**
- 验证 image 名 + tag 存在
- imagePullSecret + 正确命名空间
- 注意 Docker Hub 限流
- 把上游镜像镜像求韧性

---

### 59. OOMKilled

**答案：** 容器内存超 limit；内核 OOM 杀手开火。`kubectl describe pod` 显示 `Reason: OOMKilled` 和 `Exit Code: 137`。修复：抬高 `limits.memory`、剖析真实使用（`kubectl top pod`、pprof、Java 堆转储）、找泄漏。JVM/Node 在容器内需要显式堆 flag（`-Xmx`、`--max-old-space-size`），设在 cgroup limit 之下。

**要点：**
- Exit 137 = OOM 的 SIGKILL
- 抬高 limit 或修泄漏
- JVM/Node 堆设在 cgroup limit 之下
- 监控 `container_memory_working_set_bytes`

---

### 60. 追踪慢服务

**答案：** 分层方式：查 Service endpoint（`kubectl get endpoints`）、pod readiness、最近部署、仪表板的错误率 vs 延迟、分布式追踪找慢 span（数据库？下游服务？）。检查 HPA 扩缩、节流（`container_cpu_cfs_throttled_seconds`）、DNS 查询时间和节点压力。与基线和最近变更日志对比。

**要点：**
- 先看 endpoint + readiness
- 用追踪定位慢 span
- CPU 节流常不可见
- 关联部署 + 节点事件

---

### 61. 集群升级

**答案：** 先升控制面（kube-apiserver、controller-manager、scheduler、etcd），一次一个小版本——永不跳版。然后节点：排空（尊重 PDB）、升级 kubelet+containerd、uncordon。托管服务（EKS、GKE、AKS）自动化控制面。在非 prod 测试，看 release note 找被移除的 API（`kubectl deprecations`、`pluto`），升级前更新 manifest。

**要点：**
- 先控制面再节点
- 一次一个小版本
- 排空时尊重 PDB
- 提前扫描被移除的 API

---

### 62. kubectl drain

**答案：** `kubectl drain node --ignore-daemonsets --delete-emptydir-data` 警戒节点（不接新 pod）并尊重 PDB 驱逐现有 pod。DaemonSet pod 通过 flag 跳过。带 emptyDir 的 pod 数据丢失。用在内核打补丁、节点升级或缩容前。维护后用 `kubectl uncordon` 重允调度。

**要点：**
- 警戒 + 驱逐尊重 PDB
- 需要 `--ignore-daemonsets`
- 排空时 emptyDir 数据丢失
- Uncordon 让节点回池

---

### 63. 临时容器（kubectl debug）

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

### 64. kubectl top 与 metrics-server

**答案：** `kubectl top pods` / `kubectl top nodes` 显示 CPU/内存使用，来源于 metrics-server（一个集群聚合器，抓 kubelet cAdvisor）。它驱动按资源指标的 HPA。历史和仪表板用 Prometheus + Grafana——metrics-server 只保留当前值。自定义/外部指标需要 Prometheus Adapter 或 KEDA。

**要点：**
- metrics-server 喂 HPA + `kubectl top`
- 仅当前值、无历史
- 缺失就装（并非总是默认）
- 历史：Prometheus + Grafana

---

### 65. 准入控制器

**答案：** 准入控制器在认证/授权后拦截 API 请求做校验或变更。内置：LimitRanger（默认 requests/limits）、ResourceQuota（命名空间上限）、PodSecurity（PSS）。动态：ValidatingAdmissionPolicy（CEL）、webhook——OPA Gatekeeper 和 Kyverno 执行自定义策略（镜像 registry allow-list、必需 label、禁特权 pod）。Kyverno 用 Kubernetes 原生 YAML 规则；Gatekeeper 用 Rego。

**要点：**
- Mutating 在 validating 之前跑
- LimitRanger + ResourceQuota 做安全网
- Kyverno（YAML）vs Gatekeeper（Rego）
- CEL ValidatingAdmissionPolicy 做内联规则

---

### 66. CI vs CD vs 持续部署

**答案：** 持续集成：每次提交构建、测试并合并到主线。持续交付：每次绿色构建可手动点击发布到 prod。持续部署：每次绿色构建自动部署到 prod——无手动门。成熟阶梯是 CI -> CDelivery -> CDeployment。有强测试、可观测性和快速回滚时选 CDeployment。

**要点：**
- CI = 频繁集成
- CDelivery = 始终可发
- CDeployment = 自动发
- 需要可观测性 + 安全回滚

---

### 67. 流水线即代码

**答案：** 流水线定义在版本控制文件（`.github/workflows/*.yml`、`Jenkinsfile`、`.gitlab-ci.yml`），与代码同存、可评审、可 diff，通过模板/composite action 可复用。避免 UI 编辑的流水线——它们漂移且难审计。Pull request 预览可在合并前验证变更。

**要点：**
- 流水线在仓库、PR 中评审
- 可复用模板 / composite action
- 避免仅 UI 编辑流水线
- 通过 PR 运行验证流水线变更

---

### 68. 主干 vs Gitflow

**答案：** 主干：短命分支（小时/天）、频繁合到 `main`，特性开关隐藏未完成工作。启用持续部署并最小化合并冲突。Gitflow：长命 `develop`、`release/*`、`hotfix/*` 分支——仪式重，适合版本化交付的软件。多数 SaaS 团队采用主干。

**要点：**
- 主干：小批量、快合并
- 特性开关隐藏 WIP
- Gitflow：版本化发布、仪式
- SaaS -> 主干；打包软件 -> Gitflow

---

### 69. PR 检查阶段

**答案：** 典型顺序：lint/格式 -> 单元测试 -> 构建 -> 容器构建 & 扫描 -> 集成测试 -> 烟雾部署到临时环境 -> 必需评审者批准 -> 合并。快速失败（lint 在测试前）。独立作业并行。分支保护中的必需检查在绿之前阻止合并。包含外部系统状态报告（SonarQube、Snyk）。

**要点：**
- 快速失败：lint 优先
- 并行独立作业
- 临时预览环境捕集成 bug
- 分支保护强制必需检查

---

### 70. CI 中缓存依赖

**答案：** 按 lockfile 哈希为键缓存 `~/.npm`、`~/.m2`、Go module cache、pip wheel、Docker 层。起始恢复、结束保存。GitHub Actions `actions/cache`、GitLab `cache:` 块、BuildKit `--mount=type=cache`。Lockfile 变化时缓存失效。避免跨 OS 缓存 node_modules；缓存上游 package store 并新装。

**要点：**
- 按 lockfile 哈希为缓存键
- 缓存 package store，不是 node_modules
- BuildKit cache mount 做编译器缓存
- 设回退 restore-keys 做部分命中

---

### 71. 矩阵构建

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

### 72. 制品管理

**答案：** Artifactory、Nexus、GitHub Packages、AWS CodeArtifact 存构建二进制（jar、wheel、npm、OCI、Helm chart）。好处：缓存上游 registry（无限流、构建更快）、保留策略、不可变发布、漏洞扫描、地理复制。在仓库间晋升制品（snapshot -> release -> prod）而非重建。

**要点：**
- 镜像上游 registry
- 晋升、不要重建
- 不可变发布仓库
- 保留 + 清理策略

---

### 73. 构建可复现性与溯源

**答案：** 同输入产出字节相同输出。通过 digest 钉基础镜像、lockfile 钉依赖、固定时间戳（`SOURCE_DATE_EPOCH`）、构建期无网络实现。生成 SLSA 溯源（in-toto attestation）记录谁/什么/在哪儿构建。部署时验证溯源，让只有受信构建运行。

**要点：**
- 按 digest 钉基础镜像
- Lockfile + 冻结依赖
- SOURCE_DATE_EPOCH 求确定性时间
- SLSA 溯源建信任链

---

### 74. GitOps（Argo CD、Flux）

**答案：** 期望集群状态在 Git；控制器（Argo CD、Flux）持续把集群调和到匹配。基于拉：集群伸向 Git，无入站 CI 凭证。好处：commit 审计轨迹、通过 revert 回滚、漂移检测、多集群扇出。配合 image updater 在新镜像发布时在 Git 中升 tag。

**要点：**
- Git 是真相源
- 基于拉的调和
- 回滚 = `git revert`
- 漂移检测 + 自动同步

---

### 75. CI 中无泄漏的密钥

**答案：** 用平台的加密密钥库（GitHub Actions Secrets、GitLab CI variables、Vault）。日志中遮蔽（多数平台对已知密钥自动）。禁打印 env。用 OIDC 联邦到云提供商——把短命工作流 token 交换为云凭证而非长期密钥。把密钥访问限定到所需作业。

**要点：**
- 加密密钥库，不在 repo 文件
- OIDC 到云胜过长期密钥
- 遮蔽 + 禁 `env`/`set -x`
- 按作业/环境作用域密钥

---

### 76. 环境晋升

**答案：** 同一制品在 dev -> staging -> prod 间移动；只有配置不同。避免每环境重建（漂移风险）。GitOps 下，晋升是更新 prod overlay 中 image tag 的 PR。用手动批准和额外检查（canary、烟雾）门控 prod。在 GitHub Actions 用 environment 做保护规则和必需评审者。

**要点：**
- 一个制品、多个环境
- 通过 PR 到环境 overlay 晋升
- prod 手动批准门
- 同配置 schema、不同值

---

### 77. CD 中的数据库迁移（扩展/收缩）

**答案：** 滚动部署期间应用与数据库版本重叠，所以向后不兼容的迁移会破坏。用扩展/收缩：1) 加新列/表（部署迁移），2) 部署同时写新旧的应用，3) 回填，4) 部署只读新的应用，5) 删旧列。始终让 schema 变更跨至少一个应用版本向后兼容。

**要点：**
- 迁移先于应用部署
- 应用必须能处理新旧 schema
- 读新前先回填
- 完全推出后再删旧

---

### 78. 特性开关

**答案：** 把部署与发布解耦：代码发布暗的，然后通过开关服务（LaunchDarkly、Unleash、Flagsmith）按用户/群组/百分比启用。启用主干开发、A/B 测试、即时 kill switch、渐进推出。卫生：跟踪开关生命周期——删除陈旧开关防代码腐烂和排列组合爆炸。

**要点：**
- 部署 ≠ 发布
- 百分比 / 群组定向
- 无需重部署的 kill switch
- 无情退役陈旧开关

---

### 79. Terraform vs Pulumi vs CloudFormation vs CDK

**答案：** Terraform：声明式 HCL、多云、巨大 provider 生态、外部 state。Pulumi：真编程语言（TS/Python/Go），同 provider 模型。CloudFormation：AWS 原生 YAML/JSON、加特性慢。CDK：命令式代码合成到 CloudFormation——DX 好、以 AWS 为中心。CDKTF 合成到 Terraform。多云选 Terraform，AWS 独立且强开发团队选 CDK。

**要点：**
- Terraform：声明式、多云
- Pulumi：真语言、同 provider
- CloudFormation：AWS 原生、慢
- CDK：代码 -> CFN（以 AWS 为重）

---

### 80. Terraform state、锁、漂移

**答案：** State 把资源映射到真实 ID。远程存（S3 + DynamoDB 锁表、Terraform Cloud、GCS）让团队共享；永远别 commit `terraform.tfstate`。锁防止并发 apply。漂移是真实基础设施与 state 不同——用 `terraform plan` 检测（无变 = 无漂移）或计划漂移检测。Refresh 导入未知变更。

**要点：**
- 远程 state 带锁
- 永不 commit state（含密钥）
- 漂移 = plan 与现实的 diff
- `terraform import` 用于接纳现有资源

---

### 81. Terraform 模块与 workspace

**答案：** 模块把相关资源分组复用（一个取 CIDR 变量的 `vpc` 模块）。来源可为本地路径、Git 或 registry。钉模块版本。Workspace 是一个配置中的隔离 state 实例（`terraform workspace new prod`）——对环境有用但易误用。许多团队偏好每环境一目录（`envs/prod/`、`envs/staging/`）而非 workspace 求更清楚分离。

**要点：**
- 模块 = 可复用积木
- 钉模块版本
- Workspace = state 隔离
- 每环境一目录常比 workspace 更清楚

---

### 82. terraform plan 评审纪律

**答案：** Apply 前始终读完整 plan：数 create/update/destroy、审视 destroy 看爆炸半径、查敏感值变化、注意关键资源（数据库、负载均衡器）上的 `forces replacement`。通过 Atlantis/tfaction 在 PR 中贴 plan 输出。破坏性 plan 需批准。只 apply 已 plan 的（用 `-out=plan.tfplan`）。

**要点：**
- 读每行 destroy
- `forces replacement` = 停机风险
- 通过 Atlantis 在 PR 中 plan
- Apply 保存的 plan 避免漂移

---

### 83. Ansible vs Salt vs Chef vs Puppet

**答案：** Ansible：无 agent（SSH）、YAML playbook、推模型、易上手——配置管理主导者。Salt：agent 或 salt-ssh、YAML/Jinja、快事件驱动（ZeroMQ）。Chef：Ruby DSL、基于 agent、声明式。Puppet：声明式 DSL、基于 agent、长命企业舰队强项。随不可变基础设施（容器、Packer 烤的 AMI），配置管理用途缩小；Ansible 在 OS 级供给仍流行。

**要点：**
- Ansible：无 agent、YAML、推
- Salt：快、事件驱动
- Chef/Puppet：基于 agent、长历史
- 不可变基础设施缩配置管理范围

---

### 84. 不可变 vs 可变基础设施

**答案：** 可变：SSH 进服务器原地打补丁（配置管理）。漂移累积；雪花服务器出现。不可变：每次变更构建新镜像/AMI/容器并替换实例——无原地变更。回滚更易、无漂移、契合自动扩缩。需要快速镜像构建和滚动部署自动化。容器是经典不可变单元。

**要点：**
- 可变 -> 漂移 + 雪花
- 不可变 -> 替换、永不打补丁
- 快速镜像构建必备
- 回滚 = 重部前一镜像

---

### 85. VPC：子网、路由表、NAT 网关

**答案：** VPC 是带 CIDR（如 10.0.0.0/16）的私有网络。子网按 AZ 切分（10.0.1.0/24...）。公子网到 Internet Gateway 有路由；私子网仅出站通过 NAT Gateway 路由。把工作负载放私子网，LB 放公子网。NAT GW 是 AZ 范围且按 AZ 产生数据传输成本——HA 每 AZ 一个。

**要点：**
- 每 AZ 一子网做 HA
- 公 = IGW 路由；私 = NAT 路由
- 每 AZ 一 NAT GW
- 工作负载在私子网

---

### 86. 安全组 vs NACL（AWS）

**答案：** 安全组是有状态、实例级防火墙——只 allow 规则，返回流量自动允许。NACL 是无状态、子网级——allow 与 deny 规则都有，返回流量需要自己的规则。SG 是主要工具；NACL 是粗的第二层（如阻特定 IP）。生产 SG 默认拒入 + 最小出。

**要点：**
- SG：有状态、实例级、仅 allow
- NACL：无状态、子网级、allow + deny
- SG 优先，NACL 次要
- 收紧出，不只入

---

### 87. 服务发现

**答案：** 基于 DNS：Route53 私有区、k8s 中的 CoreDNS、Consul。基于注册：Consul、Eureka、Cloud Map——服务启动时带健康信息注册。Kubernetes Service + CoreDNS 让发现自动。跨集群/多区域用 external-dns 把 k8s 服务同步到 Route53 或服务网格联邦。

**要点：**
- k8s：Service + CoreDNS
- 混合环境用 Consul/Cloud Map
- external-dns 同步到云 DNS
- 健康感知注册胜过静态 DNS

---

### 88. 边缘 / 全球负载均衡

**答案：** 层次：anycast DNS（Route53 基于延迟、Cloudflare）、CDN/边缘（CloudFront、Cloudflare、Fastly）在用户附近终止 TLS、区域 LB（ALB/NLB、GLB）前置集群 ingress。全球 LB（AWS Global Accelerator、GCP Global LB）给 anycast IP 转向最近健康区域。用于低延迟和区域故障切换。

**要点：**
- DNS + CDN + 区域 LB 分层
- 全球 LB 提供 anycast IP
- TLS 在边缘终止
- 区域故障切换自动化

---

### 89. 日志 vs 指标 vs 链路追踪

**答案：** 日志：带上下文的离散事件、自由格式、规模化查询贵。指标：数值时间序列、便宜、可聚合、低基数优先。追踪：每请求 span 树显示跨服务因果。SLO/告警用指标，定位慢请求用追踪，已知事故全细节用日志。OpenTelemetry 统一三种生成。

**要点：**
- 指标：便宜、聚合
- 追踪：因果、按请求
- 日志：全细节、贵
- OpenTelemetry：统一生成

---

### 90. Prometheus 拉模型、exporter、recording rule

**答案：** Prometheus 抓 `/metrics` 端点（拉）。应用通过 client lib 暴露指标；其他通过 exporter（node_exporter、blackbox_exporter、mysqld_exporter）包装。服务发现（k8s、EC2）找目标。Recording rule 按计划预计算昂贵查询；alerting rule 在表达式为真时开火。联邦或 remote_write 到长期存储（Thanos、Mimir、VictoriaMetrics）。

**要点：**
- 从 `/metrics` 端点拉
- Exporter 包装未埋点系统
- Recording rule 预计算聚合
- 长期：Thanos / Mimir / VictoriaMetrics

---

### 91. Grafana 仪表板与告警

**答案：** Grafana 从 Prometheus、Loki、Tempo、CloudWatch、BigQuery 等可视化。通过 JSON 或 Grafonnet/Terraform provider 把仪表板做成代码以便评审。用模板变量做集群/命名空间下拉。告警可跑在 Grafana（统一告警）或 Prometheus Alertmanager。保持仪表板小且有意图——每服务一个、RED 或 USE 方法。

**要点：**
- 仪表板做成代码放 Git
- 模板变量求复用
- RED（rate/errors/duration）或 USE（utilization/saturation/errors）方法
- 告警在 Alertmanager 或 Grafana 统一

---

### 92. OpenTelemetry：collector、信号、传播

**答案：** OTel 是 trace、metric、log 的供应商中立规范 + SDK。应用发 OTLP 到 Collector，它处理（批、过滤、采样）并导出到后端（Tempo、Jaeger、Datadog）。上下文传播用 W3C `traceparent` 头让 span 跨服务链。自动埋点 lib 覆盖流行框架；自定义 span 用手动埋点。

**要点：**
- 一个 SDK、多个后端
- Collector 做处理 + 路由
- W3C traceparent 头传播上下文
- 常见 lib 用自动埋点

---

### 93. 追踪采样策略

**答案：** 基于头：在请求开始决定（概率，如 1%）——简单、便宜、可能漏稀有错误。基于尾：收集所有 span，看完整 trace 后决定（保留错误、慢 trace、采样成功）——需要 collector 缓冲内存但有用得多。自适应采样动态调整速率以达目标量。

**要点：**
- 头：便宜、可能漏错
- 尾：保错/慢、采样其余
- 自适应：目标量
- 始终 100% 保错

---

### 94. SLI / SLO / 错误预算

**答案：** SLI：可度量指标（可用性、p99 延迟）。SLO：该 SLI 在窗口上的目标（30 天 99.9%）。错误预算：100% - SLO = 允许的不可靠（如 99.9% 时每月 43m）。把预算用在发特性上；耗尽时停风险发布。多窗口多燃烧率告警在快速燃烧时开火。

**要点：**
- SLI 度量、SLO 目标
- 错误预算 = 1 - SLO
- 燃烧率告警快速消耗
- 耗尽时停风险变更

---

### 95. 事件响应：严重度、runbook、复盘

**答案：** Sev1 = 影响客户的故障、全员上阵；Sev2 = 服务降级；Sev3 = 轻微。每个告警链到带诊断和缓解步骤的 runbook。事件期间：指派 IC、通讯、记录员。之后：一周内做无指责复盘，记录时间线、贡献因素（不是"根因"）和带 owner、截止日期的行动项。跟踪行动项完成——这是多数团队失败之处。

**要点：**
- 严重度阶梯触发响应级
- 告警 -> runbook 始终
- 角色：IC、通讯、记录员
- 无指责复盘 + 跟踪行动

---

### 96. 混沌工程

**答案：** 在类生产环境中故意注入故障（pod kill、网络延迟、AZ 中断）以验证韧性。工具：Chaos Mesh、LitmusChaos（k8s 原生）、Gremlin（SaaS）、AWS Fault Injection Simulator。从小开始：办公时间杀一个 pod 后给出假设（"流量在 5 秒内转到健康 pod"）。建到模拟区域故障切换的 game day。

**要点：**
- 假设驱动、不随机
- 从小开始、扩到 game day
- 工具：Chaos Mesh、Litmus、Gremlin、FIS
- 验证关于韧性的假设

---

### 97. 流水线扫描（Trivy、Snyk、Dependabot）

**答案：** 扫描 SCA（依赖 CVE）、SAST（代码）、IaC（Checkov、tfsec）、密钥（gitleaks、trufflehog）、容器（Trivy、Grype）。Dependabot/Renovate 开 PR 升易受攻击依赖。有可用修复的 high/critical 阻合并；其他警告。把发现追踪在队列（DefectDojo）中以免淹没在 PR 噪音里。

**要点：**
- SCA + SAST + IaC + 密钥 + 容器扫描
- Dependabot/Renovate 做自动更新
- 可修的 high/critical 阻合并
- 在追踪器中聚合发现

---

### 98. 策略即代码（OPA、Kyverno、Conftest）

**答案：** 把组织策略（只许签名镜像、必需 label、无特权 pod）编码并通过准入控制或 CI 强制。OPA/Gatekeeper 用 Rego；Kyverno 用 YAML 规则；Conftest 在 CI 中对任何结构化文件（Terraform plan、Dockerfile、k8s manifest）跑 OPA。左移策略：在 PR 中失败而非部署时。

**要点：**
- Kyverno（YAML）vs OPA/Gatekeeper（Rego）
- Conftest 在 CI 中扫 IaC/manifest
- 左移：在 PR 中失败
- 强制前先审计模式

---

### 99. AWS vs GCP vs Azure：粗略服务映射

**答案：** 计算：EC2 / Compute Engine / Azure VM。托管 K8s：EKS / GKE / AKS（GKE 通常最精致）。Serverless：Lambda / Cloud Functions / Azure Functions。对象存储：S3 / GCS / Blob。托管 Postgres：RDS / Cloud SQL / Azure DB。IAM 模型不同：AWS role + policy（强大、冗长）、GCP IAM binding（简单、通过 project/folder 分层）、Azure RBAC + Entra ID。多云比看起来难；选一个主。

**要点：**
- 托管 k8s：EKS / GKE / AKS
- 对象：S3 / GCS / Blob
- IAM 模型差异显著
- 多云大多是税

---

### 100. 成本优化

**答案：** 右调：评审实际 vs 请求的 CPU/内存；削过度供给。容错工作负载用 spot/preemptible（节省 60-90%）；Karpenter 自动混 spot + 按需。稳定基线用 Reserved Instance / Savings Plan / Committed Use。删未挂载 EBS、旧快照、闲置 LB。把 S3/GCS 生命周期切到低频访问。一切打标签做 showback 并设预算告警。FinOps 实践让工程与成本责任对齐。

**要点：**
- 先右调（最大赢点）
- 容错用 spot；Karpenter 混合
- 基线 commit（RI/SP/CUD）
- 生命周期存储分层 + 删浪费
- 标签 + 预算告警 + FinOps 文化

---
