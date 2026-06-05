# DevOps Interview Questions

100 high-frequency questions on Docker, Kubernetes, CI/CD, infrastructure-as-code, observability, networking, security, and cloud.

---

### 1. Processes vs threads; explain fork/exec

**Answer:** A process is an isolated address space with its own PID, file descriptors, and memory. Threads share memory within a process and are cheaper to create. `fork()` clones the calling process (copy-on-write of memory, duplicated FDs) producing a child with a new PID. `exec()` replaces the current process image with a new program while keeping the PID. The classic shell pattern is `fork` then `exec` in the child, while the parent `wait`s. Zombies appear when a parent fails to reap a finished child.

**Key points:**
- Threads share heap; processes do not
- `fork` is COW, cheap until writes
- `exec` keeps PID but swaps the binary
- Reap children with `wait`/`waitpid` to avoid zombies

---

### 2. File descriptors and ulimit

**Answer:** A file descriptor is a small integer index into the kernel's per-process open-file table. 0/1/2 are stdin/stdout/stderr. Sockets, pipes, and epoll handles all consume FDs. Default soft limits (often 1024) bite high-connection services with `EMFILE: too many open files`. Raise with `ulimit -n` for the shell, `LimitNOFILE` in a systemd unit, or `nofile` in `/etc/security/limits.conf`. In containers, the kubelet/Docker daemon settings cap what a workload can request.

**Key points:**
- FDs are per-process, integer indexes
- `EMFILE` means raise `nofile`
- systemd: `LimitNOFILE=`, k8s: container runtime config
- Check usage: `ls /proc/<pid>/fd | wc -l`

---

### 3. cgroups and namespaces

**Answer:** Namespaces isolate what a process sees (PID, NET, MNT, UTS, IPC, USER, CGROUP, TIME); cgroups limit and account for what it can use (CPU, memory, IO, pids). Containers are just processes inside namespaces with cgroup limits applied. cgroup v2 unifies the hierarchy into a single tree under `/sys/fs/cgroup`. Kubernetes and Docker write into cgroup subtrees per pod/container to enforce requests and limits.

**Key points:**
- Namespaces = isolation; cgroups = quotas
- 8 namespace types; PID/NET most visible
- cgroup v2 unified hierarchy preferred
- Inspect: `systemd-cgls`, `cat /proc/self/cgroup`

---

### 4. systemd units and journalctl

**Answer:** systemd manages services as units (`.service`, `.timer`, `.socket`, `.mount`). A unit file lives in `/etc/systemd/system/` and declares `[Service]` with `ExecStart`, `Restart=`, `User=`, and resource limits. `systemctl daemon-reload` picks up changes; `systemctl enable --now foo` starts at boot. Logs go to the journal; query with `journalctl -u foo -f` or `--since "1 hour ago"`. Use `systemd-analyze blame` to find slow boot units.

**Key points:**
- Unit types: service/timer/socket/mount/target
- `Restart=on-failure` + `RestartSec=` for resilience
- `journalctl -u <unit> -f` for live logs
- Drop-ins in `/etc/systemd/system/foo.service.d/`

---

### 5. TCP three-way handshake and TIME_WAIT

**Answer:** Connection setup: client SYN, server SYN-ACK, client ACK. Teardown is FIN/ACK from each side. The initiator of the close enters `TIME_WAIT` (2*MSL, typically 60s) so late duplicate segments do not interfere with a new connection on the same 4-tuple. Many `TIME_WAIT` sockets on a busy client signal short-lived outbound connections; fix with connection pooling, `SO_REUSEADDR`, or `net.ipv4.tcp_tw_reuse=1` rather than disabling the state.

**Key points:**
- SYN -> SYN/ACK -> ACK
- TIME_WAIT protects against stale segments
- Pool connections instead of tuning kernel
- Inspect: `ss -tan state time-wait | wc -l`

---

### 6. DNS records and TTLs

**Answer:** A maps to IPv4, AAAA to IPv6, CNAME aliases one name to another (cannot coexist with other records at apex), SRV advertises service+port+priority+weight, TXT carries arbitrary text (SPF, ACME challenges). MX routes mail. TTL controls how long resolvers cache; lower TTLs ease cutovers but raise query volume. Plan migrations by dropping TTL hours ahead, then flipping the record.

**Key points:**
- CNAME forbidden at zone apex (use ALIAS/ANAME)
- SRV used by Kubernetes headless services
- Lower TTL before cutovers
- Debug with `dig +trace name`

---

### 7. HTTP/1.1 vs HTTP/2 vs HTTP/3

**Answer:** HTTP/1.1 is text, one request per TCP connection (or pipelined with head-of-line blocking). HTTP/2 is binary, multiplexes streams over a single TCP connection, supports header compression (HPACK) and server push. HTTP/3 runs on QUIC (UDP), eliminating TCP head-of-line blocking and giving faster connection establishment via 0-RTT. gRPC requires HTTP/2; many CDNs negotiate HTTP/3 automatically.

**Key points:**
- H1: one in-flight per connection
- H2: multiplexed streams over TCP, HPACK
- H3: QUIC over UDP, no TCP HoL
- gRPC needs H2 end-to-end

---

### 8. TLS handshake and certificate chain

**Answer:** Client and server negotiate cipher and exchange keys (ECDHE for forward secrecy). Server presents a leaf cert plus intermediates; client validates the chain up to a trusted root in its store, checks SAN matches hostname, validity dates, and revocation (OCSP/CRL). TLS 1.3 collapsed the handshake to one round-trip and removed legacy ciphers. Misconfigurations include missing intermediates, wrong SAN, or expired certs.

**Key points:**
- Leaf -> intermediate(s) -> trusted root
- SAN must match hostname (CN is legacy)
- TLS 1.3 = 1-RTT, mandatory PFS
- Debug: `openssl s_client -connect host:443 -showcerts`

---

### 9. iptables vs nftables

**Answer:** iptables filters packets via tables (`filter`, `nat`, `mangle`) and chains (`INPUT`, `OUTPUT`, `FORWARD`). nftables is the modern replacement with a single `nft` tool and unified syntax. Both rely on netfilter hooks. Kubernetes kube-proxy historically used iptables (now offers IPVS and nftables modes). Order matters: rules are evaluated top-down per chain; first match wins.

**Key points:**
- Tables: filter/nat/mangle/raw
- Chains: INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING
- nftables is the successor; same netfilter underneath
- `iptables -L -n -v` to inspect counters

---

### 10. SSH keys, agent forwarding, jump hosts

**Answer:** Use Ed25519 keys (`ssh-keygen -t ed25519`) protected by a passphrase, loaded into `ssh-agent`. `ForwardAgent yes` forwards your local agent socket to the remote so it can authenticate onward without copying keys; risky on shared hosts. Prefer `ProxyJump bastion` (`ssh -J`) which tunnels through a jump host without exposing keys. Configure repeatable hops in `~/.ssh/config`.

**Key points:**
- Ed25519 > RSA-2048
- Avoid agent forwarding on untrusted hosts
- `ProxyJump`/`-J` is safer than forwarding
- Use `~/.ssh/config` for `Host`, `User`, `IdentityFile`

---

### 11. Image vs container vs layer

**Answer:** An image is an immutable, content-addressed bundle of filesystem layers plus metadata (entrypoint, env). A layer is a tarball diff produced by one build step, deduplicated across images by digest. A container is a running (or stopped) instance with a thin writable layer on top of the image's read-only layers. Pulling reuses layers already on disk, which is why ordering and base-image reuse matter.

**Key points:**
- Image = layers + config manifest
- Layers are content-addressed (sha256)
- Container adds a writable upper layer
- Reuse base images to maximize cache hits

---

### 12. RUN vs CMD vs ENTRYPOINT

**Answer:** `RUN` executes at build time, producing a new layer. `ENTRYPOINT` defines the executable that always runs when the container starts. `CMD` provides default args (or a default command if no ENTRYPOINT). Prefer exec form (`ENTRYPOINT ["app"]`) over shell form to avoid spawning a shell as PID 1. Override `CMD` at runtime by appending args to `docker run image arg1`.

**Key points:**
- RUN = build-time layer
- ENTRYPOINT = fixed binary
- CMD = default args / fallback
- Use exec form (JSON array) for proper signal handling

---

### 13. Layer caching ordering

**Answer:** Each Dockerfile instruction is cached by its inputs; changing one busts every subsequent layer. Put rarely-changing steps first: base image, system packages, then dependency manifests (`package.json`, `go.mod`), then `RUN install`, then finally `COPY . .` of source code. This way a source-only edit reuses the dependency layer, slashing builds from minutes to seconds.

**Key points:**
- Cache invalidates from first change onward
- Copy manifests before sources
- Pin base image digests for reproducibility
- BuildKit `--mount=type=cache` for package caches

---

### 14. Multi-stage builds

**Answer:** Use multiple `FROM` stages to build in a heavy toolchain image and copy only artifacts into a small runtime image. Example:

```dockerfile
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/app /app
ENTRYPOINT ["/app"]
```

This yields tiny, attack-surface-minimal images while keeping the build hermetic.

**Key points:**
- Separate build vs runtime stages
- Use `--from=stage` to copy artifacts
- Final image excludes compilers/sources
- Combine with distroless for minimal CVE surface

---

### 15. .dockerignore

**Answer:** `.dockerignore` excludes paths from the build context sent to the daemon. Without it, `node_modules`, `.git`, build outputs, and secrets all ship to the builder, slowing builds and risking leaks. Patterns mirror `.gitignore`. Always exclude `.git`, `node_modules`, `target/`, `*.env`, and local credentials. Verify by inspecting the context size in the build output.

**Key points:**
- Reduces context upload time
- Prevents leaking `.env`/`.git` into images
- Syntax mirrors `.gitignore`
- Required even with BuildKit

---

### 16. Distroless vs scratch vs alpine

**Answer:** `scratch` is empty - only your static binary; smallest and safest but no shell or libc, hard to debug. Distroless includes minimal runtime (libc, CA certs, optional Python/Java) without a package manager or shell. Alpine adds musl libc, busybox, and apk; small but musl can break glibc-compiled binaries (DNS quirks). Pick scratch/distroless for production, alpine when you need a package manager.

**Key points:**
- scratch: static binaries only, ~MB
- distroless: libc + CAs, no shell
- alpine: musl + apk, watch DNS edge cases
- Debug distroless via `kubectl debug` ephemeral container

---

### 17. Image tagging conventions

**Answer:** Avoid `latest` in production - it is mutable and unpinnable. Tag with immutable identifiers: semantic version (`1.4.2`), git SHA (`sha-abc1234`), or build date. Push multiple tags pointing at the same digest (`1.4.2`, `1.4`, `1`, `sha-...`) so consumers choose stability vs freshness. Always pin deployments by digest (`image@sha256:...`) for true immutability.

**Key points:**
- Never deploy `:latest`
- Combine semver + SHA tags
- Pin by digest in manifests
- Use registry immutable-tag policies

---

### 18. Volumes vs bind mounts vs tmpfs

**Answer:** Volumes are Docker-managed storage (`/var/lib/docker/volumes/`) with driver support (local, NFS, cloud). Bind mounts attach a host path directly into the container - flexible but couples the container to host layout. tmpfs lives in RAM only, ideal for secrets and scratch data that must not hit disk. In Kubernetes the analogs are PersistentVolumes, hostPath, and emptyDir (with `medium: Memory`).

**Key points:**
- Volumes: managed, portable
- Bind mounts: host path, host-coupled
- tmpfs: RAM-only, ephemeral
- k8s equivalents: PV/hostPath/emptyDir

---

### 19. Docker network drivers

**Answer:** `bridge` (default) creates a NAT-ed virtual network per host. `host` shares the host's network namespace - no isolation, full performance. `overlay` spans multiple hosts via VXLAN for Swarm. `macvlan` gives each container a MAC and IP on the physical LAN. `none` disables networking. Kubernetes replaces all this with CNI plugins; the pod gets its own netns and an IP routable cluster-wide.

**Key points:**
- bridge = default NAT
- host = no isolation, fastest
- overlay = multi-host VXLAN
- macvlan = container on physical LAN

---

### 20. docker compose

**Answer:** Compose defines multi-container apps in `docker-compose.yml`: services, networks, volumes, env, depends_on, healthchecks. `docker compose up -d` brings the stack up; `compose down -v` tears it down. Great for local dev and small single-host deployments. For production multi-host, graduate to Kubernetes or Nomad. Profiles let you toggle optional services (`--profile debug`).

**Key points:**
- One YAML, multiple services
- `depends_on: condition: service_healthy` ordering
- Profiles for optional stacks
- Use Kubernetes for real prod orchestration

---

### 21. BuildKit features

**Answer:** BuildKit is the modern builder enabling parallel stages, better caching, secret mounts, SSH mounts, cache mounts, and frontends like `Dockerfile` v1.4. Enable with `DOCKER_BUILDKIT=1` (default in modern Docker). Use `RUN --mount=type=cache,target=/root/.cache/go-build` to persist a compiler cache across builds without baking it into the image.

**Key points:**
- Parallel stage execution
- `--mount=type=cache|secret|ssh`
- Remote cache (`--cache-from`, `--cache-to`)
- Frontend syntax via `# syntax=` directive

---

### 22. Buildx multi-arch images

**Answer:** `docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .` produces a manifest list (a.k.a. OCI image index) referencing per-arch images. Consumers pull the variant matching their CPU. Use QEMU emulation or remote builders (e.g., native arm64 runners) for speed. Critical for Apple Silicon dev and Graviton/Ampere production.

**Key points:**
- `docker buildx create --use`
- `--platform linux/amd64,linux/arm64`
- Manifest list selects per-arch
- Use native runners over QEMU when possible

---

### 23. Image vulnerability scanning

**Answer:** Tools like Trivy, Grype, and Snyk scan image layers for known CVEs in OS packages and language deps. Integrate in CI as a required check; fail builds on high/critical with a fixed version available. Also scan for misconfigurations (Dockerfile lints) and secrets. Schedule recurring scans on the registry because new CVEs land daily against unchanged images.

**Key points:**
- Trivy/Grype scan OS + lang deps
- Fail CI on fixable high/critical
- Scan registry continuously, not just on push
- Combine with SBOM generation

---

### 24. Image signing (Cosign, SLSA)

**Answer:** Cosign (sigstore) signs OCI artifacts using keyless OIDC identities or static keys; signatures live alongside the image in the registry. SLSA defines provenance levels - SLSA 3 requires non-falsifiable build provenance. Verify signatures at admission (Kyverno, Connaisseur) so unsigned images are rejected. Pair with attestations (SBOM, build provenance) for a complete supply chain.

**Key points:**
- `cosign sign image@digest`
- Keyless via OIDC + Fulcio
- Verify at admission with policy
- SLSA provenance for build trust

---

### 25. Non-root, dropped caps, read-only rootfs

**Answer:** Set `USER 10001` in the Dockerfile and `securityContext: {runAsNonRoot: true, runAsUser: 10001, allowPrivilegeEscalation: false, capabilities: {drop: [ALL]}, readOnlyRootFilesystem: true}` in Kubernetes. Mount writable paths as emptyDir if the app needs `/tmp`. This drastically reduces blast radius if the app is compromised.

**Key points:**
- Run as non-root UID
- Drop ALL caps, add only what is needed
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`

---

### 26. Resource limits and OOM

**Answer:** Without limits, a container can starve the host. `docker run --memory=512m --cpus=1` enforces cgroup limits. When the container exceeds memory, the kernel OOM-killer terminates the process and Docker reports `OOMKilled`. CPU limits throttle rather than kill. In Kubernetes, set `resources.limits.memory` and `requests` to inform scheduling; pods exceeding limits are killed and restarted.

**Key points:**
- Memory over-limit -> OOMKill
- CPU over-limit -> throttle
- `requests` schedules, `limits` enforces
- Watch `dmesg | grep -i oom` for kernel events

---

### 27. PID 1 problem and tini

**Answer:** PID 1 in Linux has special duties: reaping zombie children and handling signals. Many app runtimes (Node, Python) do not, so SIGTERM is ignored and shells spawned via shell-form ENTRYPOINT do not forward signals. Use `tini` or `dumb-init` as PID 1: `ENTRYPOINT ["tini", "--", "node", "server.js"]`. Docker provides `--init` to inject tini automatically.

**Key points:**
- PID 1 must reap zombies + handle signals
- Shell-form ENTRYPOINT breaks signal forwarding
- Use `tini`/`dumb-init` or `docker run --init`
- Without it, graceful shutdown fails

---

### 28. Healthchecks: Dockerfile vs orchestrator

**Answer:** Dockerfile `HEALTHCHECK CMD curl -f http://localhost/health || exit 1` marks the container `unhealthy` after retries. Compose can wait on `service_healthy`. Kubernetes ignores Dockerfile healthchecks; it uses pod-spec `livenessProbe`, `readinessProbe`, `startupProbe`. Keep the same logic in both places when running across orchestrators.

**Key points:**
- Dockerfile HEALTHCHECK ignored by k8s
- k8s: liveness/readiness/startup probes
- Probes can be exec/HTTP/TCP/gRPC
- Tune `initialDelaySeconds` to avoid restart loops

---

### 29. docker exec vs run vs attach

**Answer:** `docker run` starts a new container from an image. `docker exec` runs an additional process inside a running container (`-it` for interactive shell). `docker attach` reconnects your terminal to the container's PID 1 stdio; pressing Ctrl-C may kill the container. Prefer `exec` for debugging; reserve `attach` for the rare cases you need PID 1's streams.

**Key points:**
- `run`: new container from image
- `exec`: extra process in running container
- `attach`: connect to PID 1 stdio
- `exec -it sh` for ad-hoc debug

---

### 30. Registry choices

**Answer:** Options include Docker Hub (rate-limited free tier), GitHub Container Registry (`ghcr.io`, integrates with Actions), GitLab Registry, AWS ECR, Google Artifact Registry, Azure ACR, Harbor (self-hosted with scanning/replication), and JFrog Artifactory. Choose based on auth integration with your CI, geo-replication needs, vulnerability scanning, and cost. For air-gapped envs, mirror upstream into Harbor/Artifactory.

**Key points:**
- Cloud-native: ECR/Artifact Registry/ACR
- Self-hosted: Harbor, Artifactory
- Mirror upstream for air-gapped builds
- Watch Docker Hub pull rate limits

---

### 31. Pod vs Deployment vs ReplicaSet vs StatefulSet vs DaemonSet vs Job vs CronJob

**Answer:** Pod is the smallest unit, one or more co-located containers sharing net/IPC. ReplicaSet maintains N pod replicas. Deployment manages ReplicaSets with rolling updates - the default for stateless apps. StatefulSet gives stable identities and ordered rollouts for stateful workloads (DBs). DaemonSet runs one pod per node (log shippers, CNI). Job runs to completion; CronJob schedules Jobs on cron.

**Key points:**
- Deployment for stateless
- StatefulSet for ordered/identity-bound
- DaemonSet for per-node agents
- Job/CronJob for batch

---

### 32. Service types

**Answer:** ClusterIP (default) is a virtual IP reachable inside the cluster. NodePort exposes the service on every node at a static port (30000-32767). LoadBalancer provisions a cloud LB pointing at NodePorts. ExternalName returns a CNAME to an external host. Headless (`clusterIP: None`) skips the VIP and returns pod IPs via DNS A/SRV records - used by StatefulSets and service discovery.

**Key points:**
- ClusterIP: in-cluster VIP
- NodePort: same port on every node
- LoadBalancer: cloud LB in front
- Headless: DNS-based, no proxy

---

### 33. Ingress vs Gateway API

**Answer:** Ingress is the legacy L7 API for HTTP(S) routing via annotations - per-controller quirks limit portability. Gateway API is the successor: vendor-neutral, role-oriented (GatewayClass owned by infra, Gateway by cluster ops, HTTPRoute by app teams), with first-class support for TCP/UDP/TLS, traffic splitting, and header-based routing. New deployments should target Gateway API where the controller supports it.

**Key points:**
- Ingress = legacy, annotation-heavy
- Gateway API = role-split, portable
- HTTPRoute supports weighted traffic
- Controllers: Envoy Gateway, Istio, Contour, NGINX

---

### 34. ConfigMaps vs Secrets

**Answer:** Both are key/value stores mounted as env vars or files. ConfigMaps hold non-sensitive config; Secrets hold credentials, base64-encoded at rest in etcd (encrypt etcd with KMS for actual security). Prefer file mounts so rotations propagate without pod restart (with a sidecar reloader or app file-watcher). For real secret management, integrate External Secrets Operator with Vault/AWS Secrets Manager.

**Key points:**
- Secrets base64, not encrypted by default
- Enable etcd encryption-at-rest with KMS
- File mounts auto-update; env vars do not
- Use External Secrets Operator for source-of-truth

---

### 35. Volumes, PVs, PVCs, StorageClasses

**Answer:** A PersistentVolume is a cluster resource representing real storage (EBS, GCE PD, NFS). A PersistentVolumeClaim is a namespaced request for storage. A StorageClass parameterizes dynamic provisioning - a PVC referencing a SC triggers the CSI driver to create a PV. Access modes: RWO (one node), ROX (read-only many), RWX (read-write many), RWOP (one pod). Reclaim policies: Retain/Delete.

**Key points:**
- PV: cluster resource; PVC: namespace claim
- StorageClass enables dynamic provisioning
- Access modes: RWO/ROX/RWX/RWOP
- CSI drivers do the actual provisioning

---

### 36. Probes: liveness, readiness, startup

**Answer:** Readiness gates traffic - failing pods are removed from Service endpoints but not killed. Liveness restarts a stuck container. Startup delays liveness/readiness until slow-booting apps are ready, preventing premature kills. Use HTTP probes for web services, exec for CLIs, TCP for raw sockets. Wrong probes cause cascading restarts; set conservative `failureThreshold` and `periodSeconds`.

**Key points:**
- Readiness controls Service membership
- Liveness restarts on hang
- Startup protects slow boots
- Misconfig -> restart storms

---

### 37. Requests vs limits; QoS classes

**Answer:** `requests` reserve resources for scheduling; `limits` cap actual usage. Pods get a QoS class: Guaranteed (requests == limits for all containers), Burstable (some requests set), BestEffort (none set). Under node pressure, BestEffort is evicted first, then Burstable exceeding requests, then Guaranteed last. Set requests = limits for latency-sensitive services to avoid throttling surprises.

**Key points:**
- requests = scheduling; limits = enforcement
- QoS: Guaranteed > Burstable > BestEffort
- BestEffort evicted first
- CPU limits cause throttling, not OOM

---

### 38. HPA vs VPA vs Cluster Autoscaler vs Karpenter

**Answer:** HPA scales pod replicas on CPU/memory/custom metrics. VPA right-sizes pod requests over time (often run in recommendation mode only). Cluster Autoscaler adds/removes nodes from existing node groups when pods cannot schedule. Karpenter provisions just-right node types on demand without predefined groups, picking spot/on-demand mixes to minimize cost. HPA + Karpenter is the modern AWS combo.

**Key points:**
- HPA scales pods horizontally
- VPA tunes requests; avoid with HPA on same metric
- CA scales nodes within ASGs
- Karpenter: groupless, type-optimal nodes

---

### 39. PodDisruptionBudgets

**Answer:** A PDB declares the minimum available (or max unavailable) pods during voluntary disruptions like node drains. Example: `minAvailable: 2` on a 3-replica deployment lets at most one pod be evicted at a time. Cluster Autoscaler, node upgrades, and `kubectl drain` honor PDBs. PDBs do NOT protect against involuntary disruptions (node crash).

**Key points:**
- Protects only voluntary disruptions
- `minAvailable` or `maxUnavailable`
- Required for safe rolling node upgrades
- Combine with multi-zone topology spread

---

### 40. Affinity, anti-affinity, taints, tolerations, nodeSelectors

**Answer:** `nodeSelector` is a simple label match. Node affinity is the expressive version with required/preferred rules. Pod affinity/anti-affinity co-locate or spread pods relative to other pods (e.g., spread replicas across nodes). Taints repel pods unless they tolerate them; used for dedicated node pools (GPU, spot). Tolerations on a pod let it be scheduled onto tainted nodes.

**Key points:**
- nodeSelector: simple label match
- Affinity: required vs preferred
- Taints repel; tolerations permit
- Anti-affinity = HA across nodes/zones

---

### 41. Topology spread constraints

**Answer:** Constrains how pods are distributed across topology domains (zones, nodes, racks). Example:

```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: {matchLabels: {app: web}}
```

This forces near-even distribution across zones. Preferred over pod anti-affinity for HA spreading because it scales better and has finer control.

**Key points:**
- `maxSkew` controls imbalance
- `topologyKey`: zone/hostname/rack
- `DoNotSchedule` vs `ScheduleAnyway`
- Better than anti-affinity for many replicas

---

### 42. Init vs sidecar containers

**Answer:** Init containers run sequentially to completion before app containers start - good for migrations, waiting on dependencies, fetching config. Sidecars run alongside the main container sharing network/volumes (log shippers, proxies). Kubernetes 1.28+ adds native sidecar support via `initContainers` with `restartPolicy: Always`, which start before and outlive the main container's startup.

**Key points:**
- Init: run-once setup, sequential
- Sidecar: lifecycle-attached helper
- Native sidecars via init + `restartPolicy: Always`
- Sidecars share net/volumes with main

---

### 43. NetworkPolicies and default-deny

**Answer:** By default all pods can talk to all pods. A NetworkPolicy selects pods and restricts ingress/egress. Apply a namespace-wide default-deny:

```yaml
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
```

Then layer allow-lists per app. Requires a CNI that enforces policies (Calico, Cilium). Cilium adds L7 policies (HTTP path, gRPC method).

**Key points:**
- Default is allow-all
- Default-deny + targeted allows
- Needs policy-aware CNI
- Cilium adds L7 (HTTP/gRPC) policies

---

### 44. CNI choices: Calico, Cilium, Flannel

**Answer:** Flannel is simple VXLAN overlay, no policies - good for dev. Calico offers BGP routing (no overlay), NetworkPolicy, and eBPF dataplane. Cilium is eBPF-native with L3-L7 policies, transparent encryption, service mesh (no sidecar), and Hubble observability. Pick Cilium for modern clusters needing observability and L7 policy; Calico for mature BGP integration.

**Key points:**
- Flannel: simplest, no policy
- Calico: BGP + NetworkPolicy
- Cilium: eBPF, L7 policy, Hubble
- Cilium can replace kube-proxy

---

### 45. CoreDNS

**Answer:** CoreDNS is the default cluster DNS server. It resolves `svc.namespace.svc.cluster.local`, headless service A records (one per pod), SRV records for ports, and forwards external queries upstream. `ndots:5` in pod resolv.conf causes excess lookups for external names; mitigate with FQDNs (trailing dot) or `dnsConfig.options`. Cache hit metrics and forward latency are key SLIs.

**Key points:**
- Resolves `<svc>.<ns>.svc.cluster.local`
- Headless services -> per-pod A records
- Watch `ndots:5` external lookup amplification
- Scale CoreDNS replicas with cluster size

---

### 46. Service mesh: what does it add

**Answer:** A service mesh (Istio, Linkerd, Cilium Service Mesh) adds mTLS between services, fine-grained traffic policy (retries, timeouts, circuit breakers), canary/weighted routing, and uniform metrics/traces - without app code changes. Trade-offs: latency from sidecars (Linkerd is lightest), operational complexity, debugging difficulty. Sidecarless meshes (Cilium, Istio Ambient) reduce overhead.

**Key points:**
- mTLS + L7 policy + observability
- Sidecar tax vs sidecarless (Ambient)
- Linkerd: simple; Istio: featureful
- Adds debug surface; weigh need

---

### 47. CRDs and the operator pattern

**Answer:** A CustomResourceDefinition extends the API with a new resource type. An operator is a controller watching that resource and reconciling real-world state - codifying ops knowledge (provision DB, run failover, take backup). Built with kubebuilder or Operator SDK. Examples: cert-manager (Certificate -> issued TLS), Prometheus Operator, postgres-operator.

**Key points:**
- CRD adds new API kind
- Controller reconciles desired vs actual
- Encodes domain ops knowledge
- Build with kubebuilder/Operator SDK

---

### 48. Helm vs Kustomize

**Answer:** Helm is a templating + package manager: charts with `values.yaml`, releases, hooks, rollback. Kustomize is template-free overlay-based - a `base/` plus environment `overlays/` that patch fields. Helm wins for packaging third-party apps; Kustomize for first-party with light env diffs. Many teams use both: Helm for vendor charts, Kustomize on top for overrides via `helmCharts` in kustomization.yaml.

**Key points:**
- Helm: templates + package mgmt
- Kustomize: overlays + patches, no templates
- Hybrid: Kustomize over Helm output
- ArgoCD supports both natively

---

### 49. Rolling update vs Recreate

**Answer:** Rolling update is the Deployment default; `maxSurge` (extra pods above replicas) and `maxUnavailable` (allowed missing) tune speed vs availability. `maxSurge: 25%, maxUnavailable: 0` is zero-downtime but needs spare capacity. Recreate kills all old pods, then starts new ones - simple but downtime. Use Recreate for apps that cannot run mixed versions (schema conflicts).

**Key points:**
- maxSurge + maxUnavailable tune rollout
- maxUnavailable: 0 for zero-downtime
- Recreate for incompatible versions
- Combine with readiness probes for safety

---

### 50. Blue/green and canary (Argo Rollouts, Flagger)

**Answer:** Blue/green keeps old (blue) and new (green) running, then switches Service selector for instant cutover and easy rollback. Canary shifts a small percentage of traffic to the new version, watches metrics, then ramps. Argo Rollouts and Flagger automate canaries with analysis steps - querying Prometheus for error rate / latency and auto-rolling-back on regression.

**Key points:**
- Blue/green: instant flip via selector
- Canary: gradual percentage ramp
- Analysis from Prometheus/Datadog gates promotion
- Argo Rollouts CRD or Flagger controller

---

### 51. Pod Security Standards

**Answer:** PSS replaced PodSecurityPolicy. Three levels: Privileged (no restrictions), Baseline (block known privilege escalation), Restricted (hardened: non-root, no caps, seccomp RuntimeDefault). Enforce via the PodSecurity admission controller labels on namespaces:

```yaml
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

Use Kyverno/Gatekeeper for more granular policy.

**Key points:**
- PSP removed in 1.25; PSS replaces
- Levels: privileged/baseline/restricted
- Enforce via namespace labels
- Combine with Kyverno for custom rules

---

### 52. RBAC: Role vs ClusterRole

**Answer:** Role grants permissions in one namespace; ClusterRole is cluster-wide or namespace-templated. RoleBinding/ClusterRoleBinding link a subject (user, group, ServiceAccount) to a role. Principle of least privilege: avoid `cluster-admin` for apps, scope SAs to needed verbs/resources. Audit with `kubectl auth can-i --list --as=system:serviceaccount:ns:sa`.

**Key points:**
- Role: namespaced
- ClusterRole: cluster or template
- Bind to user/group/SA
- Audit with `kubectl auth can-i`

---

### 53. ServiceAccount and pod identity

**Answer:** Pods authenticate to the API via a mounted SA token. For cloud APIs, use workload identity: IRSA (AWS, IAM role tied to SA via OIDC), GKE Workload Identity, Azure Workload Identity. The SA token is exchanged for cloud creds - no long-lived keys in pods. Token volumes are projected and rotated automatically.

**Key points:**
- SA = pod's k8s identity
- IRSA / Workload Identity for cloud APIs
- Tokens projected and auto-rotated
- Never bake cloud keys into images

---

### 54. etcd

**Answer:** etcd is the strongly-consistent key-value store backing the Kubernetes API. Use odd-sized clusters (3 or 5) for Raft quorum; separate disks (low-latency NVMe) and dedicated nodes for HA. Back up regularly with `etcdctl snapshot save` and test restores. Encrypt at rest with KMS. Most production outages trace back to etcd disk latency or quorum loss.

**Key points:**
- Raft, odd-sized 3/5 nodes
- Latency-sensitive: fast disks essential
- Snapshot + restore drill regularly
- Encrypt-at-rest with KMS

---

### 55. kubeconfig contexts

**Answer:** `~/.kube/config` holds clusters, users, and contexts (cluster+user+namespace). Switch with `kubectl config use-context prod`. Tools like `kubectx`/`kubens` speed switching. Avoid mixing prod/dev in one terminal; use shell prompt indicators (kube-ps1) or separate `KUBECONFIG` files per env to prevent destructive cross-cluster mistakes.

**Key points:**
- Context = cluster + user + namespace
- Use `kubectx`/`kubens` for ergonomics
- Prompt indicators prevent wrong-cluster mistakes
- Split `KUBECONFIG` per env

---

### 56. Pod Pending diagnostic checklist

**Answer:** Run `kubectl describe pod`. Causes: insufficient CPU/memory (no node fits requests), unsatisfiable nodeSelector/affinity/taints, PVC unbound (no matching SC or quota), image pull pending, missing ServiceAccount, ResourceQuota hit. Check cluster autoscaler events for scale-up failures. For PVCs, describe the PVC to find provisioner errors.

**Key points:**
- `kubectl describe pod` events first
- Check requests vs node capacity
- Verify PVC bound and SC exists
- Inspect autoscaler logs for scale-up failures

---

### 57. CrashLoopBackOff checklist

**Answer:** Pod starts, exits, restarts with exponential backoff. Investigate: `kubectl logs --previous` for the prior exit, `kubectl describe pod` for exit code, check command/args, missing env or secret, failing migration in init container, OOMKilled, app config error. Probe failures can masquerade as crashes - confirm liveness is not too aggressive.

**Key points:**
- `kubectl logs --previous` for prior boot
- Exit code in describe output
- Check init containers separately
- Rule out liveness probe killing it

---

### 58. ImagePullBackOff causes

**Answer:** Possible: typo in image/tag, registry unreachable, missing imagePullSecret, expired registry creds, private image without auth, ECR/GCR creds not refreshed, rate-limit (Docker Hub anonymous), digest no longer exists. Describe the pod for the exact registry error. Mirror critical images into your own registry to remove third-party dependency.

**Key points:**
- Verify image name + tag exists
- imagePullSecret + correct namespace
- Watch Docker Hub rate limits
- Mirror upstream images for resilience

---

### 59. OOMKilled

**Answer:** Container memory exceeded its limit; kernel OOM-killer fired. `kubectl describe pod` shows `Reason: OOMKilled` and `Exit Code: 137`. Fixes: raise `limits.memory`, profile real usage (`kubectl top pod`, pprof, Java heap dumps), find leaks. JVM/Node need explicit heap flags inside containers (`-Xmx`, `--max-old-space-size`) sized below the cgroup limit.

**Key points:**
- Exit 137 = SIGKILL by OOM
- Raise limit OR fix leak
- Set JVM/Node heap below cgroup limit
- Monitor `container_memory_working_set_bytes`

---

### 60. Tracing a slow service

**Answer:** Layered approach: check Service endpoints (`kubectl get endpoints`), pod readiness, recent deploys, error rate vs latency in dashboards, distributed traces for slow span (DB? downstream service?). Inspect HPA scaling, throttling (`container_cpu_cfs_throttled_seconds`), DNS lookup time, and node pressure. Compare against baseline and recent change log.

**Key points:**
- Endpoints + readiness first
- Traces to localize slow span
- CPU throttling often invisible
- Correlate with deploys + node events

---

### 61. Cluster upgrades

**Answer:** Upgrade control plane first (kube-apiserver, controller-manager, scheduler, etcd) one minor at a time - never skip versions. Then nodes: drain (respecting PDBs), upgrade kubelet+containerd, uncordon. Managed services (EKS, GKE, AKS) automate the control plane. Test in non-prod, read release notes for removed APIs (`kubectl deprecations`, `pluto`), update manifests before the upgrade.

**Key points:**
- Control plane first, then nodes
- One minor version at a time
- Drain with PDBs honored
- Scan for removed APIs ahead of time

---

### 62. kubectl drain

**Answer:** `kubectl drain node --ignore-daemonsets --delete-emptydir-data` cordons the node (no new pods) and evicts existing pods respecting PDBs. DaemonSet pods are skipped via flag. Pods with emptyDir lose data. Use before kernel patches, node upgrades, or scale-down. After maintenance, `kubectl uncordon` to allow scheduling.

**Key points:**
- Cordons + evicts respecting PDBs
- `--ignore-daemonsets` required
- emptyDir data lost on drain
- Uncordon to return node to pool

---

### 63. Ephemeral containers (kubectl debug)

**Answer:** Add a debug container to a running pod without restarting it:

```bash
kubectl debug -it pod/foo --image=busybox:1.36 --target=app -- sh
```

Critical for distroless/scratch images with no shell. `--target` shares process namespace with the main container so you can see its processes and `/proc`. Cannot add volumes; for that, `kubectl debug node/...` runs on the host.

**Key points:**
- Add shell to scratch/distroless
- `--target` shares pid/net with main
- Node debug for host-level inspection
- Cannot mount volumes into ephemeral container

---

### 64. kubectl top and metrics-server

**Answer:** `kubectl top pods` / `kubectl top nodes` shows CPU/memory usage, sourced from metrics-server (a cluster aggregator scraping kubelet cAdvisor). It powers HPA on resource metrics. For history and dashboards use Prometheus + Grafana - metrics-server keeps only current values. Custom/external metrics need Prometheus Adapter or KEDA.

**Key points:**
- metrics-server feeds HPA + `kubectl top`
- Current values only, no history
- Install if missing (not always default)
- For history: Prometheus + Grafana

---

### 65. Admission controllers

**Answer:** Admission controllers intercept API requests after auth/authz to validate or mutate. Built-in: LimitRanger (default requests/limits), ResourceQuota (namespace caps), PodSecurity (PSS). Dynamic: ValidatingAdmissionPolicy (CEL), webhooks - OPA Gatekeeper and Kyverno enforce custom policy (image registries allow-listed, required labels, ban privileged pods). Kyverno uses Kubernetes-native YAML rules; Gatekeeper uses Rego.

**Key points:**
- Mutating runs before validating
- LimitRanger + ResourceQuota for safety nets
- Kyverno (YAML) vs Gatekeeper (Rego)
- CEL ValidatingAdmissionPolicy for inline rules

---

### 66. CI vs CD vs continuous deployment

**Answer:** Continuous Integration: every commit builds, tests, and merges to mainline. Continuous Delivery: every green build is deployable to prod with a manual approval click. Continuous Deployment: every green build is automatically deployed to prod - no manual gate. The maturity ladder is CI -> CDelivery -> CDeployment. Pick CDeployment when you have strong tests, observability, and quick rollback.

**Key points:**
- CI = integrate often
- CDelivery = always shippable
- CDeployment = auto-ship
- Requires observability + safe rollback

---

### 67. Pipeline-as-code

**Answer:** Pipelines defined in version-controlled files (`.github/workflows/*.yml`, `Jenkinsfile`, `.gitlab-ci.yml`) live with the code, are reviewable, diff-able, and reusable via templates/composite actions. Avoid UI-edited pipelines - they drift and are hard to audit. Pull-request previews can validate changes before merge.

**Key points:**
- Pipelines in repo, reviewed in PRs
- Reusable templates / composite actions
- Avoid UI-only pipeline editing
- Validate pipeline changes via PR runs

---

### 68. Trunk-based vs Gitflow

**Answer:** Trunk-based: short-lived branches (hours/days), frequent merges to `main`, feature flags hide incomplete work. Enables continuous deployment and minimizes merge conflicts. Gitflow: long-lived `develop`, `release/*`, `hotfix/*` branches - heavy ceremony, suited to versioned shipped software. Most SaaS teams adopt trunk-based.

**Key points:**
- Trunk-based: small batches, fast merge
- Feature flags hide WIP
- Gitflow: versioned releases, ceremony
- SaaS -> trunk-based; packaged software -> Gitflow

---

### 69. PR check stages

**Answer:** Typical order: lint/format -> unit tests -> build -> container build & scan -> integration tests -> smoke deploy to ephemeral env -> required reviewer approval -> merge. Fail fast (lint before tests). Parallelize independent jobs. Required checks in branch protection block merge until green. Include status reporting from external systems (SonarQube, Snyk).

**Key points:**
- Fail fast: lint first
- Parallelize independent jobs
- Ephemeral preview envs catch integration bugs
- Branch protection enforces required checks

---

### 70. Caching dependencies in CI

**Answer:** Cache `~/.npm`, `~/.m2`, Go module cache, pip wheels, Docker layers keyed by lockfile hash. Restore at start, save at end. GitHub Actions `actions/cache`, GitLab `cache:` block, BuildKit `--mount=type=cache`. Cache invalidates when lockfile changes. Avoid caching node_modules across OS differences; cache the upstream package store and run install fresh.

**Key points:**
- Key cache by lockfile hash
- Cache the package store, not node_modules
- BuildKit cache mounts for compiler caches
- Set fallback restore-keys for partial hits

---

### 71. Matrix builds

**Answer:** Run the same job across combinations of OS, language version, arch. GitHub Actions:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    node: [18, 20, 22]
```

Use `fail-fast: false` to see all failures. `include`/`exclude` add or skip specific combos. Watch combinatorial explosion - matrix jobs multiply.

**Key points:**
- Cross-product of dimensions
- `fail-fast: false` to see all results
- `include`/`exclude` for sparse matrices
- Cost grows multiplicatively

---

### 72. Artifact management

**Answer:** Artifactory, Nexus, GitHub Packages, AWS CodeArtifact store built binaries (jars, wheels, npm, OCI, Helm charts). Benefits: caching of upstream registries (no rate limits, faster builds), retention policies, immutable releases, vulnerability scanning, geo-replication. Promote artifacts through repos (snapshot -> release -> prod) rather than rebuilding.

**Key points:**
- Mirror upstream registries
- Promote, do not rebuild
- Immutable release repos
- Retention + cleanup policies

---

### 73. Build reproducibility and provenance

**Answer:** Same inputs produce byte-identical outputs. Achieve via pinned base images by digest, pinned deps with lockfiles, fixed timestamps (`SOURCE_DATE_EPOCH`), no network during build. Generate SLSA provenance (in-toto attestation) recording who/what/where built the artifact. Verify provenance at deploy time so only trusted builds run.

**Key points:**
- Pin base images by digest
- Lockfiles + frozen deps
- SOURCE_DATE_EPOCH for deterministic time
- SLSA provenance for trust chain

---

### 74. GitOps (Argo CD, Flux)

**Answer:** Desired cluster state lives in Git; a controller (Argo CD, Flux) continuously reconciles the cluster to match. Pull-based: cluster reaches out to Git, no inbound CI credentials. Benefits: audit trail in commits, rollback via revert, drift detection, multi-cluster fanout. Pair with image updater that bumps tags in Git when new images are published.

**Key points:**
- Git is source of truth
- Pull-based reconciliation
- Rollback = `git revert`
- Drift detection + auto-sync

---

### 75. Secrets in CI without leaks

**Answer:** Use the platform's encrypted secret store (GitHub Actions Secrets, GitLab CI variables, Vault). Mask in logs (most platforms do automatically for known secrets). Forbid printing env. Use OIDC federation to cloud providers - exchange a short-lived workflow token for cloud creds instead of long-lived keys. Restrict secret access to required jobs only.

**Key points:**
- Encrypted secret stores, not repo files
- OIDC to cloud beats long-lived keys
- Mask + forbid `env`/`set -x`
- Scope secrets per job/environment

---

### 76. Environment promotion

**Answer:** Same artifact moves through dev -> staging -> prod; only config differs. Avoid rebuilding per env (drift risk). With GitOps, promotion is a PR updating the image tag in the prod overlay. Gate prod with manual approval and additional checks (canary, smoke). Use environments in GitHub Actions for protection rules and required reviewers.

**Key points:**
- One artifact, many envs
- Promote via PR to env overlay
- Manual approval gates for prod
- Same config schema, different values

---

### 77. Database migrations in CD (expand/contract)

**Answer:** App and DB versions overlap during rolling deploy, so backward-incompatible migrations break. Use expand/contract: 1) add new column/table (deploy migration), 2) deploy app that writes both old + new, 3) backfill, 4) deploy app reading only new, 5) drop old column. Always make schema changes backward-compatible across at least one app version.

**Key points:**
- Migrations precede app deploy
- App must work with old and new schema
- Backfill before reading new
- Drop legacy after full rollout

---

### 78. Feature flags

**Answer:** Decouple deploy from release: code ships dark, then enabled per user/cohort/percentage via flag service (LaunchDarkly, Unleash, Flagsmith). Enables trunk-based dev, A/B tests, instant kill switches, gradual rollouts. Hygiene: track flag lifecycle - delete stale flags to prevent code rot and ballooning permutations.

**Key points:**
- Deploy != release
- Percentage / cohort targeting
- Kill switches without redeploy
- Retire stale flags ruthlessly

---

### 79. Terraform vs Pulumi vs CloudFormation vs CDK

**Answer:** Terraform: declarative HCL, multi-cloud, huge provider ecosystem, external state. Pulumi: real programming languages (TS/Python/Go) with same provider model. CloudFormation: AWS-native YAML/JSON, slow to add features. CDK: imperative code synthesized to CloudFormation - good DX, AWS-centric. CDKTF synthesizes to Terraform. Pick Terraform for multi-cloud, CDK if AWS-only with strong dev team.

**Key points:**
- Terraform: declarative, multi-cloud
- Pulumi: real languages, same providers
- CloudFormation: AWS-native, slow
- CDK: code -> CFN (AWS-focused)

---

### 80. Terraform state, locking, drift

**Answer:** State maps resources to real IDs. Store remotely (S3 + DynamoDB lock table, Terraform Cloud, GCS) so the team shares it; never commit `terraform.tfstate`. Locking prevents concurrent applies. Drift is when real infra differs from state - detect with `terraform plan` (no changes = no drift) or scheduled drift detection. Refresh imports unknown changes.

**Key points:**
- Remote state with locking
- Never commit state (contains secrets)
- Drift = plan diff against reality
- `terraform import` for adopting existing resources

---

### 81. Terraform modules and workspaces

**Answer:** Modules group related resources for reuse (a `vpc` module taking CIDR vars). Source from local paths, Git, or registries. Pin module versions. Workspaces are isolated state instances in one config (`terraform workspace new prod`) - useful for envs but easy to misuse. Many teams prefer directory-per-env (`envs/prod/`, `envs/staging/`) over workspaces for clearer separation.

**Key points:**
- Modules = reusable building blocks
- Pin module versions
- Workspaces = state isolation
- Directory-per-env often clearer than workspaces

---

### 82. terraform plan review discipline

**Answer:** Always read the full plan before apply: count creates/updates/destroys, scrutinize destroys for blast radius, check for sensitive value churn, watch for `forces replacement` on critical resources (DBs, load balancers). Post plan output in PR via Atlantis/tfaction. Require approval for destructive plans. Apply only what was planned (use `-out=plan.tfplan`).

**Key points:**
- Read every destroy line
- `forces replacement` = downtime risk
- Plan in PR via Atlantis
- Apply saved plan to avoid drift

---

### 83. Ansible vs Salt vs Chef vs Puppet

**Answer:** Ansible: agentless (SSH), YAML playbooks, push model, easy to start - dominant for config mgmt. Salt: agent or salt-ssh, YAML/Jinja, fast event-driven (ZeroMQ). Chef: Ruby DSL, agent-based, declarative. Puppet: declarative DSL, agent-based, strong in long-lived enterprise fleets. With immutable infra (containers, AMIs baked by Packer), config-mgmt usage has shrunk; Ansible remains popular for OS-level provisioning.

**Key points:**
- Ansible: agentless, YAML, push
- Salt: fast, event-driven
- Chef/Puppet: agent-based, long lineage
- Immutable infra reduces config-mgmt scope

---

### 84. Immutable vs mutable infrastructure

**Answer:** Mutable: SSH into servers and patch in place (config mgmt). Drift accumulates; snowflake servers emerge. Immutable: build a new image/AMI/container for every change and replace instances - no in-place mutation. Easier rollback, no drift, fits autoscaling. Requires fast image builds and rolling-deploy automation. Containers are the canonical immutable unit.

**Key points:**
- Mutable -> drift + snowflakes
- Immutable -> replace, never patch
- Fast image builds essential
- Rollback = redeploy prior image

---

### 85. VPC: subnets, route tables, NAT GWs

**Answer:** A VPC is a private network with CIDR (e.g., 10.0.0.0/16). Subnets carve it per AZ (10.0.1.0/24...). Public subnets have a route to the Internet Gateway; private subnets route via NAT Gateway for outbound only. Place workloads in private subnets, LBs in public. NAT GWs are AZ-scoped and incur per-AZ data-transfer cost - one per AZ for HA.

**Key points:**
- Subnet per AZ for HA
- Public = IGW route; private = NAT route
- One NAT GW per AZ
- Workloads in private subnets

---

### 86. Security groups vs NACLs (AWS)

**Answer:** Security groups are stateful, instance-level firewalls - allow rules only, return traffic auto-allowed. NACLs are stateless, subnet-level - both allow and deny rules, return traffic needs its own rule. SGs are the primary tool; NACLs are a coarse second layer (e.g., block specific IPs). Default-deny ingress + minimal egress for production SGs.

**Key points:**
- SG: stateful, instance level, allow-only
- NACL: stateless, subnet level, allow + deny
- SGs first, NACLs as secondary
- Tighten egress, not just ingress

---

### 87. Service discovery

**Answer:** DNS-based: Route53 private zones, CoreDNS in k8s, Consul. Registry-based: Consul, Eureka, Cloud Map - services register on startup with health info. Kubernetes Services + CoreDNS make discovery automatic. For cross-cluster / multi-region, use external-dns syncing k8s services to Route53 or service-mesh federation.

**Key points:**
- k8s: Service + CoreDNS
- Consul/Cloud Map for mixed envs
- external-dns syncs to cloud DNS
- Health-aware registry beats static DNS

---

### 88. Edge / global load balancing

**Answer:** Layers: anycast DNS (Route53 latency-based, Cloudflare), CDN/edge (CloudFront, Cloudflare, Fastly) terminating TLS close to users, regional LBs (ALB/NLB, GLB) fronting cluster ingresses. Global LB (AWS Global Accelerator, GCP Global LB) gives anycast IPs steering to nearest healthy region. Use for low latency and regional failover.

**Key points:**
- DNS + CDN + regional LB layered
- Global LBs offer anycast IPs
- TLS terminated at edge
- Regional failover automated

---

### 89. Logs vs metrics vs traces

**Answer:** Logs: discrete events with context, free-form, expensive to query at scale. Metrics: numeric time series, cheap, aggregable, low cardinality preferred. Traces: per-request span trees showing causality across services. Use metrics for SLOs/alerts, traces to localize a slow request, logs for full detail on a known incident. OpenTelemetry unifies producing all three.

**Key points:**
- Metrics: cheap, aggregated
- Traces: causality, per-request
- Logs: full detail, expensive
- OpenTelemetry: unified producer

---

### 90. Prometheus pull model, exporters, recording rules

**Answer:** Prometheus scrapes `/metrics` endpoints (pull). Apps expose metrics via client libs; everything else is wrapped by exporters (node_exporter, blackbox_exporter, mysqld_exporter). Service discovery (k8s, EC2) finds targets. Recording rules pre-compute expensive queries on a schedule; alerting rules fire when expressions become true. Federation or remote_write to long-term stores (Thanos, Mimir, VictoriaMetrics).

**Key points:**
- Pull from `/metrics` endpoints
- Exporters wrap non-instrumented systems
- Recording rules pre-compute aggregations
- Long-term: Thanos / Mimir / VictoriaMetrics

---

### 91. Grafana dashboards and alerts

**Answer:** Grafana visualizes from Prometheus, Loki, Tempo, CloudWatch, BigQuery, etc. Dashboards as code via JSON or Grafonnet/Terraform provider for review. Use template variables for cluster/namespace dropdowns. Alerts can run in Grafana (unified alerting) or in Prometheus Alertmanager. Keep dashboards small and intentional - one per service, RED or USE method.

**Key points:**
- Dashboards as code in Git
- Template vars for reuse
- RED (rate/errors/duration) or USE (utilization/saturation/errors) method
- Alerts in Alertmanager or Grafana unified

---

### 92. OpenTelemetry: collector, signals, propagation

**Answer:** OTel is a vendor-neutral spec + SDKs for traces, metrics, logs. Apps emit OTLP to a Collector that processes (batch, filter, sample) and exports to backends (Tempo, Jaeger, Datadog). Context propagation uses W3C `traceparent` header so spans link across services. Auto-instrumentation libs cover popular frameworks; manual instrumentation for custom spans.

**Key points:**
- One SDK, many backends
- Collector for processing + routing
- W3C traceparent header propagates context
- Auto-instrumentation for common libs

---

### 93. Tracing sampling strategies

**Answer:** Head-based: decide at request start (probabilistic, e.g., 1%) - simple, cheap, may miss rare errors. Tail-based: collect all spans, decide after seeing the full trace (keep errors, slow traces, sample successes) - needs collector buffering memory but far more useful. Adaptive sampling adjusts rate dynamically to hit a target volume.

**Key points:**
- Head: cheap, may miss errors
- Tail: keep errors/slow, sample rest
- Adaptive: target volume
- Always keep 100% errors

---

### 94. SLI / SLO / error budgets

**Answer:** SLI: a measurable indicator (availability, latency p99). SLO: target for that SLI over a window (99.9% in 30 days). Error budget: 100% - SLO = allowed unreliability (e.g., 43m/month at 99.9%). Spend the budget on shipping features; halt risky launches when burned. Multi-window multi-burn-rate alerts fire on fast budget burn.

**Key points:**
- SLI measured, SLO targeted
- Error budget = 1 - SLO
- Burn-rate alerts on fast spend
- Halt risky changes when exhausted

---

### 95. Incident response: severity, runbooks, postmortems

**Answer:** Sev1 = customer-impacting outage, all-hands; Sev2 = degraded service; Sev3 = minor. Each alert links to a runbook with diagnostic and mitigation steps. During incident: assign IC, comms, scribe. After: blameless postmortem within a week documenting timeline, contributing factors (not "root cause"), and action items with owners and deadlines. Track action item completion - this is where most teams fail.

**Key points:**
- Severity ladder triggers response level
- Alerts -> runbooks always
- Roles: IC, comms, scribe
- Blameless postmortem + tracked actions

---

### 96. Chaos engineering

**Answer:** Deliberately inject failures (pod kill, network latency, AZ outage) in production-like environments to verify resilience. Tools: Chaos Mesh, LitmusChaos (k8s-native), Gremlin (SaaS), AWS Fault Injection Simulator. Start small: kill one pod during business hours after a hypothesis ("traffic shifts to healthy pod within 5s"). Build to game days simulating regional failover.

**Key points:**
- Hypothesis-driven, not random
- Start small, expand to game days
- Tools: Chaos Mesh, Litmus, Gremlin, FIS
- Validates assumptions about resilience

---

### 97. Pipeline scanning (Trivy, Snyk, Dependabot)

**Answer:** Scan SCA (dependency CVEs), SAST (code), IaC (Checkov, tfsec), secrets (gitleaks, trufflehog), containers (Trivy, Grype). Dependabot/Renovate open PRs to bump vulnerable deps. Block merge on high/critical with a fix available; warn on others. Track findings in a queue (DefectDojo) so they do not vanish into PR noise.

**Key points:**
- SCA + SAST + IaC + secrets + container scans
- Dependabot/Renovate for auto-updates
- Block merge on high/critical fixable
- Aggregate findings in a tracker

---

### 98. Policy as code (OPA, Kyverno, Conftest)

**Answer:** Codify org policy (only signed images, required labels, no privileged pods) and enforce via admission control or CI. OPA/Gatekeeper uses Rego; Kyverno uses YAML rules; Conftest runs OPA against any structured file in CI (Terraform plans, Dockerfiles, k8s manifests). Shift policy left: fail in PR rather than at deploy.

**Key points:**
- Kyverno (YAML) vs OPA/Gatekeeper (Rego)
- Conftest scans IaC/manifests in CI
- Shift-left: fail in PR
- Audit mode before enforce

---

### 99. AWS vs GCP vs Azure: rough service mapping

**Answer:** Compute: EC2 / Compute Engine / Azure VMs. Managed K8s: EKS / GKE / AKS (GKE generally most polished). Serverless: Lambda / Cloud Functions / Azure Functions. Object store: S3 / GCS / Blob. Managed Postgres: RDS / Cloud SQL / Azure DB. IAM models differ: AWS roles + policies (powerful, verbose), GCP IAM bindings (simple, hierarchical via projects/folders), Azure RBAC + Entra ID. Multi-cloud is harder than it looks; pick one primary.

**Key points:**
- EKS / GKE / AKS for managed k8s
- S3 / GCS / Blob for object
- IAM models differ significantly
- Multi-cloud is mostly a tax

---

### 100. Cost optimization

**Answer:** Right-size: review actual vs requested CPU/memory; trim over-provisioning. Use spot/preemptible for fault-tolerant workloads (60-90% savings); Karpenter mixes spot + on-demand automatically. Reserved Instances / Savings Plans / Committed Use for steady baseline. Delete unattached EBS, old snapshots, idle LBs. Lifecycle-tier S3/GCS to infrequent-access. Tag everything for showback and set budget alerts. FinOps practice aligns engineering with cost ownership.

**Key points:**
- Right-size first (biggest wins)
- Spot for fault-tolerant; Karpenter mixes
- Commit (RI/SP/CUD) for baseline
- Lifecycle storage tiers + delete waste
- Tagging + budget alerts + FinOps culture

---
