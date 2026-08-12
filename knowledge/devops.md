# DevOps Interview Questions

100 high-frequency questions on Docker, Kubernetes, CI/CD, infrastructure-as-code, observability, networking, security, and cloud.

---

### 1. Processes vs threads; explain fork/exec

**Frequency:** High

**Question:** What's the difference between processes and threads, and how do `fork()`/`exec()` work on Linux?

**Answer:** A **process** is an isolated **address space** with its own **PID, file descriptors, and memory**. **Threads** live *inside* a process and **share** its heap, globals, and open FDs — so they're **cheaper to create** and communicate through shared memory, but a bug in one thread (memory corruption) can crash the whole process, whereas processes are isolated (one crashing doesn't touch another).

**`fork()`** clones the calling process, producing a **child with a new PID**. Key mechanics: memory is **copy-on-write (COW)** — parent and child share the same physical pages read-only, and a page is only *actually* copied when one of them writes to it (so `fork` is cheap until you mutate memory). File descriptors are **duplicated** — child inherits copies pointing at the same open-file entries (so both can write to an inherited pipe/socket).

**`exec()`** **replaces the current process image** — code, heap, stack — with a **new program**, but **keeps the same PID** (and inherited FDs unless marked close-on-exec). It doesn't return on success; the old program is simply gone.

**The classic shell pattern** is `fork` → in the **child** call `exec` (to run the command) → the **parent** `wait`s to collect the child's exit status. **Zombies** arise when a parent **fails to reap** a finished child: the child has exited but its exit-status entry lingers in the process table until the parent calls `wait`/`waitpid`. Long-lived daemons that spawn children must reap them (or handle `SIGCHLD`) or they leak zombie slots.

**Key points:**
- Threads share heap; processes do not
- `fork` is COW, cheap until writes
- `exec` keeps PID but swaps the binary
- Reap children with `wait`/`waitpid` to avoid zombies

---

### 2. cgroups and namespaces

**Frequency:** High

**Question:** What are cgroups and namespaces, and how do they make a container?

**Answer:** They're the two Linux kernel primitives that *together* create a container — and they solve different problems. **Namespaces isolate what a process can *see*** (visibility); **cgroups limit and account for what it can *use*** (resources).

**Namespaces** give a process its own private view of a global resource. The types: **PID** (its own process tree — it sees itself as PID 1, can't see host processes), **NET** (own network stack — interfaces, routing, ports), **MNT** (own filesystem mounts), **UTS** (own hostname), **IPC** (own shared-memory/semaphores), **USER** (own UID/GID mapping — root inside can be unprivileged outside), **CGROUP** (own cgroup root view), and **TIME** (own boot/monotonic clock). PID and NET are the most visible in practice.

**cgroups (control groups)** enforce quotas and account usage for **CPU, memory, IO, and pids**. Exceed the memory cgroup and the kernel **OOM-kills** the process; exceed the CPU quota and it gets **throttled**.

**A container is just a normal process** with these applied — namespaces so it can't see the host, cgroups so it can't hog resources. There's no "container" object in the kernel; Docker/containerd just set these up around a process.

**cgroup v2** replaced v1's separate per-controller hierarchies with a **single unified tree** under `/sys/fs/cgroup`, which fixed inconsistencies and enabled better pressure/PSI metrics. **Kubernetes and Docker write into cgroup subtrees per pod/container** to enforce `requests`/`limits`. Inspect with `systemd-cgls` or `cat /proc/self/cgroup`.

**Key points:**
- Namespaces = isolation; cgroups = quotas
- 8 namespace types; PID/NET most visible
- cgroup v2 unified hierarchy preferred
- Inspect: `systemd-cgls`, `cat /proc/self/cgroup`

---

### 3. TCP three-way handshake and TIME_WAIT

**Frequency:** High

**Question:** Walk through the TCP handshake and teardown, and what a pile of `TIME_WAIT` sockets means.

**Answer:** **Setup (three-way handshake):** client sends **SYN** (with its initial sequence number), server replies **SYN-ACK** (acknowledging client's and sending its own seq), client sends **ACK**. Three packets establish a synchronized, reliable, bidirectional stream — the SYN-ACK combines two steps so it's three, not four.

**Teardown:** each side independently sends a **FIN** and gets an **ACK** (four packets, since either side can keep sending after the other closes — a "half-close"). 

**`TIME_WAIT`:** the side that **initiates the close** enters `TIME_WAIT` for **2×MSL** (Maximum Segment Lifetime, typically **~60s** total). Two reasons: (1) so **late duplicate segments** from the old connection can't be misinterpreted as belonging to a *new* connection reusing the same 4-tuple (src IP:port, dst IP:port); (2) to ensure the final ACK reaches the peer (if it's lost, the peer resends FIN and this side can re-ACK).

**Many `TIME_WAIT` on a busy client** signals lots of **short-lived outbound connections** — the client keeps opening and closing connections (e.g., a new HTTP connection per request). Each one parks a 4-tuple for ~60s, and you can **exhaust ephemeral ports** under high fan-out. **The right fix is architectural: connection pooling / keep-alive** (reuse connections instead of churning them). Only if that's insufficient, `SO_REUSEADDR` or `net.ipv4.tcp_tw_reuse=1` (safe reuse for *outbound*). **Don't** blindly disable the state — that reintroduces the stale-segment risk. Inspect with `ss -tan state time-wait | wc -l`.

**Key points:**
- SYN -> SYN/ACK -> ACK
- TIME_WAIT protects against stale segments
- Pool connections instead of tuning kernel
- Inspect: `ss -tan state time-wait | wc -l`

---

### 4. DNS records and TTLs

**Frequency:** High

**Question:** Explain the common DNS record types and how TTLs affect a cutover.

**Answer:** **Record types:** **A** maps a name → **IPv4**; **AAAA** → **IPv6**; **CNAME** **aliases** one name to another canonical name (resolvers chase it to the target); **SRV** advertises a **service + port + priority + weight** (used for service discovery — Kubernetes headless services publish SRV records); **TXT** carries **arbitrary text** used for verification and policy (SPF/DKIM email auth, ACME/Let's Encrypt challenges, domain ownership proofs); **MX** routes **mail** to mail servers with a priority.

**Why CNAME can't coexist at the zone apex:** a CNAME says "this name is *nothing but* an alias — resolve the target instead." But the apex (`example.com` itself) **must** carry other records like SOA and NS (required for the zone to function), and a CNAME can't legally sit alongside them. That's why you can't `CNAME example.com → elb.aws.com`. Providers work around this with **ALIAS/ANAME** (a synthetic record that resolves the target server-side and returns A records at the apex).

**TTL and cutovers:** the **TTL** tells resolvers **how long to cache** the answer. **Lower TTL** = changes propagate faster (good for a migration) but **more query volume** hitting your authoritative servers (and slight latency). **Higher TTL** = better caching/resilience but slow to change. **Migration plan:** hours (or a day) *ahead* of the cutover, **drop the TTL** (e.g., to 60s) so caches expire quickly; verify propagation; then **flip the record** — clients pick up the new value within the short TTL. Afterward, raise the TTL back up. Debug resolution end-to-end with `dig +trace name`.

**Key points:**
- CNAME forbidden at zone apex (use ALIAS/ANAME)
- SRV used by Kubernetes headless services
- Lower TTL before cutovers
- Debug with `dig +trace name`

---

### 5. Image vs container vs layer

**Frequency:** High

**Question:** What's the difference between a Docker image, a container, and a layer?

**Answer:** An **image** is an **immutable, content-addressed bundle** of filesystem **layers** plus **metadata** (entrypoint, env, exposed ports, default command). It's a *template* — a frozen snapshot you can ship and reproduce exactly by its digest.

A **layer** is a **tarball diff** (a set of filesystem changes) produced by **one build step** — e.g., `RUN apt-get install ...` adds a layer with the new files. Layers are **content-addressed by SHA-256 digest**, which means they're **deduplicated across images**: if two images share the same base and the same `apt` layer, that layer is stored on disk once and pulled once. This is why `docker pull` of a second image sharing a base is fast — it only fetches the layers you don't already have.

A **container** is a **running (or stopped) instance** of an image: the kernel takes the image's **read-only layers** and stacks a **thin writable layer** on top (union/overlay filesystem). All runtime changes (writing a file, a log) land in that writable upper layer; the underlying image layers stay untouched and shared across every container from that image. Delete the container and the writable layer is discarded (hence you need volumes for persistence).

**Why ordering and base reuse matter:** since layers are shared by digest, structuring your Dockerfile so **stable layers come first and shared base images are reused** maximizes cache hits on both build *and* pull — fewer bytes over the wire and less disk used.

**Key points:**
- Image = layers + config manifest
- Layers are content-addressed (sha256)
- Container adds a writable upper layer
- Reuse base images to maximize cache hits

---

### 6. RUN vs CMD vs ENTRYPOINT

**Frequency:** High

**Question:** Compare `RUN`, `CMD`, and `ENTRYPOINT` in a Dockerfile, and why prefer exec form?

**Answer:** They operate at different times and roles. **`RUN`** executes **at build time**, producing a **new image layer** — it's how you install packages, compile code, etc. (`RUN apt-get install -y curl`). It has nothing to do with what runs when the container starts.

**`ENTRYPOINT`** defines the **executable that always runs** when the container starts — the fixed "what this container *is*" (e.g., `ENTRYPOINT ["nginx"]`). **`CMD`** provides **default arguments** to that entrypoint (or, if there's no ENTRYPOINT, a **default command** that's easily overridden). The idiom is `ENTRYPOINT ["myapp"]` + `CMD ["--port", "8080"]` → runs `myapp --port 8080` by default, but `docker run img --port 9090` swaps just the args while keeping `myapp` fixed.

**Overriding at runtime:** appending args to `docker run image arg1 arg2` **replaces CMD** (the args passed to ENTRYPOINT). `--entrypoint` flag replaces ENTRYPOINT itself.

**Prefer exec form (`["app", "arg"]`) over shell form (`app arg`):** shell form runs your process as a **child of `/bin/sh -c`**, so **the shell becomes PID 1**, not your app. That breaks **signal handling** — `docker stop` sends `SIGTERM` to PID 1 (the shell), which often doesn't forward it, so your app never gets a clean-shutdown signal and gets `SIGKILL`ed after the grace period. Exec form makes **your process PID 1**, receiving signals directly for graceful shutdown. Exec form also skips an unnecessary shell process.

**Key points:**
- RUN = build-time layer
- ENTRYPOINT = fixed binary
- CMD = default args / fallback
- Use exec form (JSON array) for proper signal handling

---

### 7. Layer caching ordering

**Frequency:** High

**Question:** How does Dockerfile layer caching work, and how should you order instructions for fast builds?

**Answer:** **Each instruction is cached by its inputs.** Docker computes a cache key from the instruction and what it touches (for `COPY`, the checksum of the copied files; for `RUN`, the command string and prior layers). On rebuild, Docker reuses cached layers as long as the key matches — but **the moment one instruction's key changes, every subsequent layer is invalidated** and rebuilt from that point down (because each layer depends on the state of the one before it).

**The ordering principle: put rarely-changing steps first, frequently-changing steps last.** A typical optimal order:
1. **Base image** (`FROM`) — changes almost never.
2. **System packages** (`RUN apt-get install ...`) — changes rarely.
3. **Dependency manifests** (`COPY package.json package-lock.json ./`, or `go.mod go.sum`) — changes occasionally.
4. **Install dependencies** (`RUN npm ci` / `go mod download`) — the expensive step.
5. **Copy source code** (`COPY . .`) — changes on *every* commit.

**Why copy manifests before source:** if you `COPY . .` first and *then* install, any one-character source edit changes the copied-files checksum, busts that layer, and **re-runs the entire dependency install** — minutes wasted. By copying only the manifests first and installing, a source-only edit leaves the manifest layer *and the install layer* cached; only the final `COPY . .` re-runs. This cuts rebuilds from **minutes to seconds**.

**Additional techniques:** **pin the base image by digest** (`FROM node:20@sha256:...`) for reproducibility so a moving tag doesn't silently change your base; use **BuildKit cache mounts** (`RUN --mount=type=cache,target=/root/.npm npm ci`) to persist package-manager caches *across* builds even when the install layer itself is invalidated.

**Key points:**
- Cache invalidates from first change onward
- Copy manifests before sources
- Pin base image digests for reproducibility
- BuildKit `--mount=type=cache` for package caches

---

### 8. Multi-stage builds

**Frequency:** High

**Question:** What are multi-stage Docker builds and why do they matter?

**Answer:** A multi-stage build uses **multiple `FROM` stages in one Dockerfile**: you build in a **heavy toolchain image** (compilers, dev headers, full SDK) and then **copy only the finished artifacts** into a **small runtime image**, discarding everything else. The build stays hermetic (all in one Dockerfile) while the shipped image is tiny.

```dockerfile
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/app /app
ENTRYPOINT ["/app"]
```

**How it works:** `--from=build` copies artifacts *from* a named earlier stage into the current one. The first stage (500MB+ with the Go toolchain) is used only to produce the `/out/app` binary and is **not part of the final image** — only the last stage ships.

**Why the final image should exclude compilers and sources:** every tool and source file you ship is **attack surface** and a **CVE liability**. A shipped Go compiler, package manager, shell, or source tree gives an attacker tools to exploit and inflates your vulnerability-scan findings — none of it is needed to *run* a compiled static binary.

**Combining with distroless** (`gcr.io/distroless/static`) takes this further: the runtime image has **no shell, no package manager, no libc** (for static binaries) — just your binary and its minimal dependencies. This **minimizes attack surface and CVE exposure** dramatically (a distroless image might have zero known CVEs vs dozens in a full `ubuntu` base) and shrinks images from hundreds of MB to a few MB, speeding pulls and deploys.

**Key points:**
- Separate build vs runtime stages
- Use `--from=stage` to copy artifacts
- Final image excludes compilers/sources
- Combine with distroless for minimal CVE surface

---

### 9. Resource limits and OOM

**Frequency:** High

**Question:** How are container resource limits enforced, and what happens on memory vs CPU over-limit?

**Answer:** **Without limits a container can starve the host** — one runaway process can consume all memory or CPU and take down every other workload on the node. Limits are enforced via **cgroups**: `docker run --memory=512m --cpus=1` writes into the container's memory and CPU cgroups.

**The two limits behave fundamentally differently:**
- **Memory over-limit → the process is KILLED.** Memory can't be "throttled" — you either have the bytes or you don't. When a container tries to exceed its memory cgroup, the kernel's **OOM-killer** terminates a process in that cgroup, and Docker reports the container as **`OOMKilled`**. This is abrupt — no graceful shutdown.
- **CPU over-limit → the process is THROTTLED, not killed.** CPU is time-sliceable, so exceeding the CPU quota just means the kernel **schedules the container less** — it runs slower (higher latency) but keeps running. You'll see CPU throttling metrics, not crashes.

**In Kubernetes**, there are **two knobs**: **`requests`** (what the pod is *guaranteed* — used by the **scheduler** to place the pod on a node with enough capacity) and **`limits`** (the hard **cap enforced at runtime** via cgroups). A pod that **exceeds its memory limit is OOMKilled and restarted** (with CrashLoopBackoff if it keeps happening); one that exceeds its CPU limit is throttled. Requests below limits enable overcommit (nodes packed tighter than the sum of limits). Watch `dmesg | grep -i oom` for kernel OOM events, and `kubectl describe pod` for the `OOMKilled` reason.

**Key points:**
- Memory over-limit -> OOMKill
- CPU over-limit -> throttle
- `requests` schedules, `limits` enforces
- Watch `dmesg | grep -i oom` for kernel events

---

### 10. Pod vs Deployment vs ReplicaSet vs StatefulSet vs DaemonSet vs Job vs CronJob

**Frequency:** High

**Question:** Compare the main Kubernetes workload resources and when to use each.

**Answer:** They form a hierarchy from lowest-level to highest, each adding guarantees:

- **Pod** — the **smallest deployable unit**: one or more **co-located containers** sharing the same network namespace (localhost, one IP) and IPC. You rarely create bare Pods — they're ephemeral and not self-healing. Sidecars (proxy, log shipper) live in the same pod as the main container.
- **ReplicaSet** — maintains **exactly N identical pod replicas**, recreating any that die. You almost never manage it directly — it's the mechanism a Deployment drives.
- **Deployment** — manages ReplicaSets to provide **rolling updates and rollbacks** for **stateless apps** (the default choice). Updating the image creates a new ReplicaSet and shifts pods over gradually (maxSurge/maxUnavailable); `kubectl rollout undo` reverts.
- **StatefulSet** — for **stateful workloads** (databases, Kafka): adds **stable network identities** (`pod-0`, `pod-1` with sticky DNS), **stable per-pod storage** (each keeps its PVC across reschedules), and **ordered, sequential** rollout/scaling (pod-0 before pod-1). Use when identity or ordering matters.
- **DaemonSet** — runs **one pod per node** (automatically on new nodes too). For **node-level agents**: log shippers (Fluent Bit), CNI plugins, node exporters, monitoring agents.
- **Job** — runs pods **to completion** (batch work) and tracks success; retries on failure.
- **CronJob** — **schedules Jobs on a cron expression** (nightly backups, periodic reports).

**Quick rule:** stateless service → Deployment; identity/ordering/per-pod storage → StatefulSet; per-node agent → DaemonSet; one-off or scheduled batch → Job/CronJob.

**Key points:**
- Deployment for stateless
- StatefulSet for ordered/identity-bound
- DaemonSet for per-node agents
- Job/CronJob for batch

---

### 11. Service types

**Frequency:** High

**Question:** Explain the Kubernetes Service types and when you'd use each.

**Answer:** A Service gives a stable virtual endpoint in front of a set of ephemeral pods (selected by labels). The types build outward from cluster-internal to externally-exposed:

- **ClusterIP** (default) — a **virtual IP reachable only inside the cluster**. kube-proxy load-balances across the matching pods. Use for internal service-to-service traffic (a backend called only by other pods).
- **NodePort** — exposes the service on a **static port (30000–32767) on every node's IP**. Traffic to `<anyNodeIP>:<nodePort>` is forwarded to the service. Crude external access; mostly a building block for LoadBalancer or for bare-metal/dev.
- **LoadBalancer** — **provisions a cloud load balancer** (AWS ELB, GCP LB) that points at the NodePorts, giving a single external IP/DNS. The standard way to expose a service publicly in a cloud. Each one is a real (billable) cloud LB — in practice you front many services with one Ingress instead.
- **ExternalName** — returns a **CNAME to an external hostname** (`my-db.example.com`). No proxying — it's just DNS, used to alias an external dependency behind an in-cluster name.
- **Headless** (`clusterIP: None`) — **skips the virtual IP entirely** and returns the **individual pod IPs** directly via **DNS A/SRV records**. Used when the client needs to address specific pods, not a load-balanced VIP — e.g., **StatefulSets** (each pod gets stable DNS like `pod-0.svc`) and client-side service discovery.

**Rule of thumb:** internal → ClusterIP; public in cloud → LoadBalancer (usually via Ingress); need per-pod addressing → Headless.

**Key points:**
- ClusterIP: in-cluster VIP
- NodePort: same port on every node
- LoadBalancer: cloud LB in front
- Headless: DNS-based, no proxy

---

### 12. ConfigMaps vs Secrets

**Frequency:** High

**Question:** Compare ConfigMaps and Secrets, and how do you do *real* secret management?

**Answer:** Both are **key/value stores** you can mount into pods as **environment variables or files**. The difference is **intent and (weak) protection**:

- **ConfigMaps** hold **non-sensitive configuration** — feature flags, URLs, tuning params.
- **Secrets** hold **credentials** — passwords, tokens, TLS keys. But the critical caveat: **Secrets are only base64-encoded at rest in etcd, not encrypted.** Base64 is *encoding, not security* — anyone who can read etcd (or run `kubectl get secret -o yaml` with access) sees the value trivially. For actual security you must **enable etcd encryption-at-rest backed by a KMS** (AWS KMS, GCP KMS), and lock down RBAC so few can read Secrets.

**File mounts vs env vars — a real operational difference:** when you mount a ConfigMap/Secret **as a file**, Kubernetes **propagates updates to the mounted file** (eventually, via the kubelet) **without restarting the pod** — so a rotated credential can be picked up by an app that file-watches (or a sidecar reloader signals it). But values injected as **environment variables are captured at container start and never update** — you *must restart the pod* to pick up a change. So **prefer file mounts** when you want rotation without downtime.

**Real secret management:** Kubernetes Secrets alone aren't a secrets *manager* (no rotation, auditing, or central source of truth). Integrate the **External Secrets Operator** (or Vault Agent / Secrets Store CSI driver) to **sync from Vault / AWS Secrets Manager / GCP Secret Manager** into K8s Secrets. That keeps the **source of truth** in a purpose-built vault with rotation, versioning, and audit logs, while pods still consume ordinary Secrets.

**Key points:**
- Secrets base64, not encrypted by default
- Enable etcd encryption-at-rest with KMS
- File mounts auto-update; env vars do not
- Use External Secrets Operator for source-of-truth

---

### 13. Volumes, PVs, PVCs, StorageClasses

**Frequency:** High

**Question:** Explain Kubernetes persistent storage: PV, PVC, StorageClass, access modes, reclaim policies.

**Answer:** The model **decouples the *request* for storage from the *provisioning* of it**, so app authors don't need to know the underlying storage tech:

- **PersistentVolume (PV)** — a **cluster-scoped resource representing real storage** (an EBS volume, GCE PD, NFS export, Ceph RBD). It's the actual piece of storage, with a capacity and access mode.
- **PersistentVolumeClaim (PVC)** — a **namespaced *request*** for storage ("I need 20Gi, RWO"). A pod references a PVC, not a PV directly. Kubernetes **binds** the claim to a matching PV.
- **StorageClass (SC)** — **enables dynamic provisioning**: instead of an admin pre-creating PVs, a PVC that names a StorageClass triggers the class's **CSI driver** to **create a PV on demand** (e.g., call the AWS API to make an EBS volume). The SC parameterizes *how* (disk type, IOPS, zone, encryption).

**Access modes** (what the PV supports):
- **RWO** (ReadWriteOnce) — mounted read-write by **one node** (typical for block storage like EBS).
- **ROX** (ReadOnlyMany) — read-only by **many nodes**.
- **RWX** (ReadWriteMany) — read-write by **many nodes** (needs shared storage like NFS/CephFS — EBS can't do this).
- **RWOP** (ReadWriteOncePod) — read-write by exactly **one pod** (stricter than RWO).

**Reclaim policies** (what happens to the PV when its PVC is deleted):
- **Retain** — keep the volume and its data (manual cleanup; safe for important data).
- **Delete** — delete the underlying storage too (convenient for ephemeral/dynamic volumes; the default for many dynamic SCs).

**CSI drivers** (Container Storage Interface) do the actual provisioning/attaching — they're the pluggable adapters between Kubernetes and each storage backend.

**Key points:**
- PV: cluster resource; PVC: namespace claim
- StorageClass enables dynamic provisioning
- Access modes: RWO/ROX/RWX/RWOP
- CSI drivers do the actual provisioning

---

### 14. Probes: liveness, readiness, startup

**Frequency:** High

**Question:** Explain the three Kubernetes probe types and how misconfiguration causes problems.

**Answer:** Each probe answers a different question about a container's health, and they have **very different consequences on failure**:

- **Readiness probe — "can this pod serve traffic *right now*?"** On failure, the pod is **removed from the Service's endpoints** (no traffic routed to it) **but NOT killed**. It stays running and rejoins when it passes again. Use it for temporary unreadiness — warming caches, a dependency briefly down, or draining before shutdown. This is what gates traffic during rollouts.
- **Liveness probe — "is this container *stuck/deadlocked*?"** On failure, Kubernetes **restarts the container**. Use it only for **unrecoverable hangs** (a deadlock a restart would fix), not for transient issues.
- **Startup probe — "has this slow-booting app finished starting?"** It **disables liveness and readiness checks until it passes**, so an app that takes 60s to boot isn't **prematurely killed** by an impatient liveness probe. Once it succeeds, the normal probes take over.

**Probe mechanisms:** **HTTP** GET (web services — return 200 from `/healthz`), **exec** (run a command inside the container — for CLIs/no HTTP), **TCP** (just check a port opens — raw sockets), and **gRPC** (native gRPC health checks).

**Misconfiguration → restart storms:** the classic failure is a **liveness probe that's too aggressive** (short `timeoutSeconds`, low `failureThreshold`) hitting an endpoint that does *real work* (checks the DB). Under load the endpoint slows, the liveness probe times out, Kubernetes restarts the container, which drops in-flight work and makes load worse — a **cascading restart loop**. Fixes: keep liveness **cheap and dependency-free** (don't check downstreams in liveness — that belongs in readiness), set **conservative `failureThreshold`/`periodSeconds`**, and use a **startup probe** for slow boots.

**Key points:**
- Readiness controls Service membership
- Liveness restarts on hang
- Startup protects slow boots
- Misconfig -> restart storms

---

### 15. Requests vs limits; QoS classes

**Frequency:** High

**Question:** Explain requests, limits, and the three QoS classes in Kubernetes.

**Answer:** **`requests`** are what the pod is *guaranteed* and drive **scheduling** — the scheduler places a pod only on a node whose unreserved capacity ≥ the pod's requests (nodes can be overcommitted since requests are usually below limits). **`limits`** are the hard **runtime cap** enforced by cgroups — exceed memory → OOMKilled, exceed CPU → throttled.

**Kubernetes derives a QoS (Quality of Service) class** from how you set these, and it determines eviction priority:
- **Guaranteed** — **every container has requests == limits** for both CPU and memory. Highest priority; treated as "promised these exact resources."
- **Burstable** — **at least one request is set** but it's not Guaranteed (requests < limits, or only some set). Can burst above requests up to limits when the node has spare capacity.
- **BestEffort** — **no requests or limits set at all**. Uses whatever's left over; first to go under pressure.

**Eviction order under node pressure** (e.g., memory pressure, disk pressure): the kubelet evicts **BestEffort first**, then **Burstable pods that are exceeding their requests** (the further over request, the sooner), and **Guaranteed pods last**. So proper requests protect your important pods.

**Why set requests == limits (Guaranteed) for latency-sensitive services:** with requests < limits, a pod can *burst* but is also subject to **CPU throttling surprises** when the node is busy and to earlier eviction. Setting requests == limits gives predictable, reserved resources — no throttling variance, highest QoS, evicted last — which is what you want for tail-latency-sensitive services. The tradeoff is lower cluster utilization (you can't overcommit those resources).

**Key points:**
- requests = scheduling; limits = enforcement
- QoS: Guaranteed > Burstable > BestEffort
- BestEffort evicted first
- CPU limits cause throttling, not OOM

---

### 16. Affinity, anti-affinity, taints, tolerations, nodeSelectors

**Frequency:** High

**Question:** Explain Kubernetes scheduling controls: nodeSelector, affinity, taints, and tolerations.

**Answer:** These control *where* pods land, from simplest to most expressive:

- **`nodeSelector`** — the **simplest**: a plain **label match**. `nodeSelector: {disktype: ssd}` schedules the pod only on nodes labeled `disktype=ssd`. Hard requirement, no nuance.
- **Node affinity** — the **expressive** version of nodeSelector, with two strengths: **`requiredDuringScheduling...`** (a hard rule — won't schedule if unmet) and **`preferredDuringScheduling...`** (a soft preference — weight the scheduler's choice but schedule anyway if unmet). Supports operators (`In`, `NotIn`, `Exists`) for rich expressions like "zone in [us-east-1a, us-east-1b]."
- **Pod affinity / anti-affinity** — schedule relative to **other pods**, not node labels. **Affinity** co-locates ("put this cache pod on the same node/zone as the app it serves" for low latency). **Anti-affinity** spreads ("never put two replicas of this DB on the same node/zone") — the key tool for **HA**, ensuring one node or AZ failure doesn't take out all replicas. Uses `topologyKey` (e.g., `kubernetes.io/hostname` or `topology.kubernetes.io/zone`) to define the spread domain.
- **Taints and tolerations** — the *inverse* mechanism: a **taint on a node repels** all pods unless they explicitly **tolerate** it. Used to **reserve dedicated node pools**: taint GPU nodes `nvidia.com/gpu=true:NoSchedule` so only GPU workloads (which carry the matching toleration) land there; taint spot/preemptible nodes so only fault-tolerant workloads run on them. Tolerations don't *attract* — they just *permit* — so pair with node affinity/selector to actively steer pods onto those nodes.

**Key points:**
- nodeSelector: simple label match
- Affinity: required vs preferred
- Taints repel; tolerations permit
- Anti-affinity = HA across nodes/zones

---

### 17. Helm vs Kustomize

**Frequency:** High

**Question:** Compare Helm and Kustomize, and how do teams combine them?

**Answer:** They solve Kubernetes-manifest management in **fundamentally different ways**:

**Helm** is a **templating engine + package manager**. A **chart** is a package of templated YAML (`{{ .Values.image.tag }}`) plus a **`values.yaml`** of defaults; you install it as a **release** (a named, versioned deployment Helm tracks in-cluster). It adds **hooks** (run jobs at install/upgrade/delete phases — e.g., a DB migration pre-upgrade) and **`helm rollback`** to a previous release revision. The power is parameterization and lifecycle management; the cost is Go-template complexity (whitespace, conditionals, debugging generated YAML).

**Kustomize** is **template-free and overlay-based** — it's built into `kubectl`. You have a **`base/`** of plain, valid YAML and per-environment **`overlays/`** (dev, staging, prod) that **patch** specific fields (change replica count, add a label, swap an image tag) via strategic-merge or JSON patches. No templating language — everything is real YAML you can read directly; the cost is it's less powerful for heavy parameterization or packaging.

**Which wins where:** **Helm** for **packaging and distributing** apps — especially **third-party/vendor** software (Postgres, Prometheus) where you want a versioned, parameterized, installable unit. **Kustomize** for **first-party** apps with **light environment differences** ("same manifests, just more replicas and a different image in prod").

**Combining both:** many teams run **Kustomize *over* Helm output** — Kustomize's `helmCharts` field renders a vendor Helm chart and then applies Kustomize patches on top, getting the vendor's packaging *plus* clean, template-free overrides. **Argo CD supports both natively**, so GitOps workflows use whichever fits per app.

**Key points:**
- Helm: templates + package mgmt
- Kustomize: overlays + patches, no templates
- Hybrid: Kustomize over Helm output
- ArgoCD supports both natively

---

### 18. Blue/green and canary (Argo Rollouts, Flagger)

**Frequency:** High

**Question:** Explain blue/green and canary deployments, and how tools automate canary analysis.

**Answer:** Both are strategies to **release a new version with low risk**, but they trade off differently.

**Blue/green** runs **two full environments**: **blue** (current) and **green** (new). You deploy the new version to green, smoke-test it while all real traffic still goes to blue, then **flip the Service selector** (or LB) to point at green — an **instant, atomic cutover**. **Rollback is instant too**: flip back to blue. Pros: no mixed-version state, fast rollback. Cons: **2× resources** during the switch, and the cutover is all-or-nothing (a bug hits 100% of users the instant you flip).

**Canary** shifts a **small percentage of traffic** (say 5%) to the new version, **watches metrics**, and if healthy **ramps** progressively (5% → 25% → 50% → 100%). Pros: limits blast radius — a bad release only affects the canary slice — and you validate against *real* production traffic gradually. Cons: you run **mixed versions** simultaneously (must be compatible), and it's slower.

**Automation — Argo Rollouts and Flagger:** manually watching dashboards and clicking "promote" doesn't scale, so these tools automate it. You define a **Rollout** with **steps** (`setWeight: 10`, `pause`, `setWeight: 50`, ...) and **analysis templates** that **query Prometheus/Datadog** for **error rate, latency (p99), or success rate** at each step. If metrics stay within thresholds, the tool **auto-promotes** to the next weight; if a metric **regresses past the threshold**, it **automatically rolls back** — no human in the loop. **Argo Rollouts** does this via a Rollout CRD (replacing Deployment); **Flagger** is a controller that drives it on top of a service mesh or ingress for the traffic splitting.

**Key points:**
- Blue/green: instant flip via selector
- Canary: gradual percentage ramp
- Analysis from Prometheus/Datadog gates promotion
- Argo Rollouts CRD or Flagger controller

---

### 19. RBAC: Role vs ClusterRole

**Frequency:** High

**Question:** How does Kubernetes RBAC work — Role vs ClusterRole, bindings, and least privilege?

**Answer:** RBAC (Role-Based Access Control) governs **who can do what to which resources**. It has two halves: **roles** (a set of permissions) and **bindings** (which subjects get a role).

**Role vs ClusterRole — scope is the difference:**
- A **Role** grants permissions **within a single namespace** — e.g., "get/list/watch pods in the `payments` namespace."
- A **ClusterRole** is **cluster-wide** — either for cluster-scoped resources (nodes, PVs, namespaces themselves) or as a **reusable template** you can bind per-namespace. It's how you grant access to non-namespaced things or define a role once and apply it in many namespaces.

**Bindings link subjects to roles:**
- A **RoleBinding** grants a Role (or ClusterRole, scoped to that namespace) to **subjects** — a **user, group, or ServiceAccount** — **within one namespace**.
- A **ClusterRoleBinding** grants a ClusterRole **cluster-wide** to subjects. (Subjects are users/groups from the auth layer, or ServiceAccounts that pods run as.)

**Least privilege for app ServiceAccounts:** don't bind apps to **`cluster-admin`** (a common lazy mistake that gives a compromised pod the whole cluster). Give each app a **dedicated ServiceAccount** bound to a Role scoped to **exactly the verbs and resources it needs** (e.g., only `get` on one ConfigMap). Most apps need *no* Kubernetes API access at all — in that case disable automounting the SA token.

**Auditing effective permissions:** use `kubectl auth can-i <verb> <resource> --as=system:serviceaccount:<ns>:<sa>` to test a specific permission, or `kubectl auth can-i --list --as=...` to dump everything a subject can do — essential for verifying you actually applied least privilege.

**Key points:**
- Role: namespaced
- ClusterRole: cluster or template
- Bind to user/group/SA
- Audit with `kubectl auth can-i`

---

### 20. Pod Pending diagnostic checklist

**Frequency:** High

**Question:** A pod is stuck in `Pending`. Walk through your diagnostic checklist.

**Answer:** `Pending` means the pod is **accepted but not yet running** — almost always the **scheduler can't place it** or a dependency (volume, image) isn't ready. **Start with `kubectl describe pod <name>`** and read the **Events** section at the bottom — it usually states the exact reason (e.g., `0/5 nodes are available: insufficient cpu`). Then work through the common causes:

1. **Insufficient CPU/memory** — no node has enough **unreserved capacity to satisfy the pod's `requests`**. Event says `Insufficient cpu`/`Insufficient memory`. Fix: lower requests, add nodes, or check if the cluster autoscaler should have scaled up (see below).
2. **Unsatisfiable placement constraints** — a **`nodeSelector`, node affinity, or taint** that no node matches/tolerates. Event: `node(s) didn't match node selector` or `had taint {...} that the pod didn't tolerate`. Fix the selector or add a toleration.
3. **Unbound PVC** — the pod needs a volume but the **PVC won't bind** (no matching StorageClass, provisioner error, or exhausted storage quota). `kubectl describe pvc` reveals the provisioner error. The pod waits until the volume is ready.
4. **Image / ServiceAccount issues** — image pull problems or a **missing ServiceAccount** referenced by the pod can block startup.
5. **ResourceQuota** — the namespace's **quota is exhausted**, so admission blocks new pods. Event mentions `exceeded quota`.

**Also check the cluster autoscaler:** if requests can't fit but the cluster *should* grow, inspect the **autoscaler events/logs** for **scale-up failures** (hit max node count, no matching instance type, cloud quota exceeded, or the pod is unschedulable on *any* possible node so the autoscaler won't even try).

**Key points:**
- `kubectl describe pod` events first
- Check requests vs node capacity
- Verify PVC bound and SC exists
- Inspect autoscaler logs for scale-up failures

---

### 21. CrashLoopBackOff checklist

**Frequency:** High

**Question:** A pod is in `CrashLoopBackOff`. What does it mean and how do you investigate?

**Answer:** `CrashLoopBackOff` means the container **starts, exits, and Kubernetes restarts it — repeatedly** — with **exponentially increasing backoff** between restarts (10s, 20s, 40s… up to 5min) to avoid hammering the node. The state itself isn't the bug; it's a symptom that the process keeps dying. Investigate systematically:

1. **`kubectl logs <pod> --previous`** — the most important step. The current container may have *just* started, so `--previous` shows the logs of the **crashed prior instance** — usually the actual error (stack trace, "connection refused," "missing env var").
2. **`kubectl describe pod`** — read the **exit code** and last state. **Exit 0** = app finished and exited (maybe it's not a long-running process, or a misconfigured command). **Exit 137** = SIGKILL, typically **OOMKilled** (check the reason). **Exit 1/2** = app error. Non-zero generally = crash.
3. **Check command/args and config** — wrong `command`/`args`, a **missing environment variable or Secret** the app requires at boot, or a bad config file. Also check **init containers separately** (`kubectl logs <pod> -c <init>`) — a **failing migration or setup init container** blocks the main container and looks like a crash loop.
4. **OOMKilled / resource issues** — if exit 137 with `OOMKilled`, the memory limit is too low or there's a leak (see the OOM question).
5. **Rule out an overly aggressive liveness probe** — a **liveness probe that fails during a slow startup** makes Kubernetes kill and restart a container that was actually fine, masquerading as a crash. If logs show the app was *starting up* when killed, the fix is a **startup probe** or looser liveness thresholds, not the app.

**Key points:**
- `kubectl logs --previous` for prior boot
- Exit code in describe output
- Check init containers separately
- Rule out liveness probe killing it

---

### 22. OOMKilled

**Frequency:** High

**Question:** What does `OOMKilled` mean and how do you handle it?

**Answer:** `OOMKilled` means the container **exceeded its memory limit** and the kernel's **OOM (out-of-memory) killer terminated it** — memory can't be throttled, so the kernel's only option is to kill. `kubectl describe pod` shows **`Reason: OOMKilled`** and **`Exit Code: 137`** (128 + signal 9/SIGKILL).

**Two fundamentally different fixes — decide which:**
- **Raise `limits.memory`** — correct if the app **legitimately needs more memory** than you allocated (you under-provisioned). Measure real usage first.
- **Profile and fix a leak** — correct if usage **grows unboundedly** over time (a real memory leak). Bumping the limit just delays the OOM. Use `kubectl top pod` for a quick view, then real profiling: **pprof** (Go), **heap dumps** (Java), **`--inspect`/heap snapshots** (Node) to find what's growing.

**Critical gotcha — JVM and Node need explicit heap flags:** runtimes with **managed heaps** don't automatically respect the **cgroup memory limit** (older versions especially size the heap to the *host's* total RAM, not the container's limit). So the JVM grabs more than the limit and gets OOMKilled. **Set the heap explicitly *below* the cgroup limit**, leaving headroom for non-heap memory (stacks, metaspace, native buffers): e.g., `-Xmx` (JVM) or `--max-old-space-size` (Node) sized to ~70–80% of the container limit. Modern JVMs also support `-XX:MaxRAMPercentage` to size relative to the cgroup limit.

**Monitor `container_memory_working_set_bytes`** (not RSS — working set is what the OOM-killer actually watches) against the limit, and **alert before** it hits 100% so you catch creep before the kill.

**Key points:**
- Exit 137 = SIGKILL by OOM
- Raise limit OR fix leak
- Set JVM/Node heap below cgroup limit
- Monitor `container_memory_working_set_bytes`

---

### 23. CI vs CD vs continuous deployment

**Frequency:** High

**Question:** Distinguish Continuous Integration, Continuous Delivery, and Continuous Deployment.

**Answer:** Three distinct practices, often conflated, forming a **maturity ladder**:

- **Continuous Integration (CI)** — developers **integrate to mainline frequently** (many times a day), and **every commit triggers an automated build + test**. The goal is catching integration problems early instead of a painful "merge day." This is purely about **build and test**, nothing about deploying.
- **Continuous Delivery (CDelivery)** — **every green build is *deployable* to production** — packaged, tested through staging, and ready — but a **human clicks "approve"** to actually release. You *could* ship any commit at any time; you *choose* when. This adds deployment automation and staging gates on top of CI, keeping the codebase always shippable.
- **Continuous Deployment (CDeployment)** — **every green build is *automatically* deployed to production** with **no manual gate**. The pipeline goes commit → test → prod untouched by humans. This is the fully automated end state.

**The maturity ladder is CI → Continuous Delivery → Continuous Deployment.** You climb it as your safety nets mature.

**Prerequisites for Continuous Deployment** (why you can't just skip to it): removing the human gate means **automation must catch everything a human would**. You need **strong automated tests** (unit, integration, end-to-end — high confidence a green build is safe), **solid observability** (metrics/alerts to detect a bad release in minutes), and **fast, automated rollback** (or progressive delivery like canary + auto-rollback) so a bad deploy is contained and reverted quickly. Without these, auto-shipping every commit is reckless; with them, it dramatically shortens lead time and shrinks each change's blast radius.

**Key points:**
- CI = integrate often
- CDelivery = always shippable
- CDeployment = auto-ship
- Requires observability + safe rollback

---

### 24. GitOps (Argo CD, Flux)

**Frequency:** High

**Question:** Explain GitOps (Argo CD, Flux) and why the pull model matters.

**Answer:** **GitOps** makes **Git the single source of truth** for your cluster's *desired state*. You commit Kubernetes manifests (or Helm/Kustomize) to a repo; a **controller running in the cluster** (Argo CD, Flux) **continuously reconciles** the actual cluster state to match Git — if they diverge, it either alerts or auto-corrects. You don't `kubectl apply` from a laptop or CI; **you `git push`, and the cluster converges.**

**Why pull-based matters:** traditional CI **pushes** to the cluster — which means your **CI system must hold cluster admin credentials**, a big attack surface (compromise CI → compromise every cluster it can reach). In GitOps the **cluster pulls** from Git: the controller runs *inside* the cluster and reaches *out* to the repo, so **no inbound credentials** are needed and the cluster's write access stays internal. It also works cleanly for clusters behind firewalls with no inbound access.

**Benefits:**
- **Audit trail** — every change is a **Git commit** with author, timestamp, review, and diff. Your deployment history *is* your Git history.
- **Rollback = `git revert`** — revert the commit and the controller reconciles back to the previous state. No special tooling.
- **Drift detection** — if someone hand-edits the cluster (`kubectl edit`), the controller **detects the divergence** from Git and flags (or reverts) it, so the cluster can't silently drift from its declared state.
- **Multi-cluster fanout** — one Git repo can drive many clusters consistently.

**Pair with an image updater:** since Git is the source of truth, a new container image built by CI must get its tag **into Git** to deploy. An **image updater** (Argo CD Image Updater, Flux's image automation) watches the registry and **commits the new tag back to the repo**, closing the loop from "CI built an image" to "GitOps deploys it" while keeping Git authoritative.

**Key points:**
- Git is source of truth
- Pull-based reconciliation
- Rollback = `git revert`
- Drift detection + auto-sync

---

### 25. Terraform vs Pulumi vs CloudFormation vs CDK

**Frequency:** High

**Question:** Compare Terraform, Pulumi, CloudFormation, and CDK for infrastructure as code.

**Answer:** Four IaC tools that split along two axes: **declarative vs imperative** language, and **multi-cloud vs AWS-native**.

- **Terraform** — **declarative HCL** (HashiCorp Configuration Language). You describe the desired end state; Terraform diffs it against **external state** and computes the changes. Its superpower is **multi-cloud reach** via a **huge provider ecosystem** (AWS, GCP, Azure, Cloudflare, Datadog, GitHub — thousands of providers). State is stored **outside** the cloud (S3, Terraform Cloud), which you must manage. The de-facto industry standard for cloud-agnostic IaC.
- **Pulumi** — uses **real programming languages** (TypeScript, Python, Go, C#) over the **same provider model** as Terraform. You get loops, conditionals, functions, and IDE support natively instead of HCL's limited expressiveness — great for complex, dynamic infra and teams that prefer code. Tradeoff: more power means more ways to write unmaintainable infra.
- **CloudFormation** — **AWS-native** YAML/JSON, managed entirely by AWS (state and locking handled for you). But it's **AWS-only** and historically **slow to support new services/features** (there's often a lag after a service launches). Verbose and clunky to write by hand.
- **CDK (Cloud Development Kit)** — **imperative code** (TypeScript, Python) that **synthesizes down to CloudFormation**. You write real code with high-level constructs; CDK generates the CFN template. Excellent developer experience but **AWS-centric**. **CDKTF** is the variant that synthesizes to **Terraform** instead, giving CDK's code ergonomics with Terraform's multi-cloud reach.

**When to pick each:** **Terraform** for **multi-cloud** or when you want the largest ecosystem and a declarative model. **CDK** if you're **AWS-only** with a strong dev team that wants real code. **Pulumi** if you want real languages *and* multi-cloud. **CloudFormation** rarely by hand now — mostly as CDK's compilation target.

**Key points:**
- Terraform: declarative, multi-cloud
- Pulumi: real languages, same providers
- CloudFormation: AWS-native, slow
- CDK: code -> CFN (AWS-focused)

---

### 26. Terraform state, locking, drift

**Frequency:** High

**Question:** Explain Terraform state, locking, and drift.

**Answer:** **State** is Terraform's **mapping between your config and the real resources** — `terraform.tfstate` records that `aws_instance.web` corresponds to real instance `i-0abc123`, along with all its known attributes. Terraform needs it to know what already exists so it can compute a diff on the next `apply` (create/update/delete only what changed) rather than recreating everything.

**Store state remotely, never in Git:** a team **shares one state**, so it must live in a **remote backend** — **S3 + a DynamoDB lock table**, **Terraform Cloud**, or **GCS**. Two critical reasons *not* to commit `terraform.tfstate`: (1) it **contains secrets in plaintext** (DB passwords, generated keys, private IPs) — committing it leaks them; (2) local state doesn't coordinate across the team, causing conflicts and corruption.

**Locking prevents concurrent applies:** if two engineers `apply` simultaneously against the same state, they'd race and corrupt it. The backend takes a **lock** (DynamoDB item, Terraform Cloud lock) for the duration of an apply, so a second apply **waits** rather than clobbering. This is why the DynamoDB lock table pairs with S3.

**Drift** is when the **real infrastructure diverges from state** — someone hand-edits a resource in the AWS console, or an external process changes it. **Detect it** by running **`terraform plan`**: if it reports proposed changes when you changed *nothing* in config, that diff *is* the drift (Terraform wants to revert reality back to your declared config). Teams run **scheduled drift detection** (a periodic `plan` in CI) to catch out-of-band changes early.

**Adopting existing resources:** use **`terraform import`** to bring a resource created outside Terraform (or by another tool) **under Terraform management** — it writes the resource into state so future applies manage it. (Newer Terraform also supports declarative `import` blocks.)

**Key points:**
- Remote state with locking
- Never commit state (contains secrets)
- Drift = plan diff against reality
- `terraform import` for adopting existing resources

---

### 27. VPC: subnets, route tables, NAT GWs

**Frequency:** High

**Question:** Explain the core building blocks of an AWS VPC: subnets, route tables, IGW, NAT gateways.

**Answer:** A **VPC (Virtual Private Cloud)** is your **isolated private network** in the cloud, defined by a **CIDR block** (e.g., `10.0.0.0/16` — 65k addresses). You carve it into **subnets**, each **scoped to one Availability Zone** (`10.0.1.0/24` in AZ-a, `10.0.2.0/24` in AZ-b), spreading across AZs for **high availability**.

**The public/private distinction comes down to routing** (via each subnet's **route table**):
- A **public subnet** has a route `0.0.0.0/0 → Internet Gateway (IGW)`. The IGW allows **bidirectional** internet traffic, so resources with public IPs here are reachable *from* the internet and can reach *out*.
- A **private subnet** has a route `0.0.0.0/0 → NAT Gateway`. A NAT Gateway allows **outbound-only** internet access (for pulling packages, calling external APIs) but **blocks inbound** connections from the internet — the subnet has no path *in*.

**Standard topology:** put your **workloads (app servers, databases) in private subnets** (no direct internet exposure — an attacker can't reach them directly) and your **load balancers in public subnets** (they take internet traffic and forward it inward). This is defense in depth — only the LB is exposed.

**NAT Gateway gotchas:** a NAT Gateway is **AZ-scoped** (lives in one AZ). If that AZ fails, private subnets routing through it lose outbound access — so for HA you need **one NAT Gateway per AZ**, with each AZ's private subnets routing to their local NAT. Also, NAT Gateways charge **per-GB data-processing plus hourly** cost, and **cross-AZ traffic through a NAT** adds data-transfer fees — a common surprise on the bill for chatty egress workloads.

**Key points:**
- Subnet per AZ for HA
- Public = IGW route; private = NAT route
- One NAT GW per AZ
- Workloads in private subnets

---

### 28. Logs vs metrics vs traces

**Frequency:** High

**Question:** Contrast logs, metrics, and traces as observability signals, and when to use each.

**Answer:** The **three pillars of observability**, each with a different shape, cost, and best use:

- **Logs** — **discrete, free-form (or structured) events with rich context** ("user 123 failed login from IP X at time T"). Highest **detail** — you can put anything in a log line — but **expensive to store and query at scale** (indexing TBs of text is costly; see log aggregation). Best for **deep detail on a *known* incident** once you know roughly where to look.
- **Metrics** — **numeric time series** (request_count, cpu_percent, p99_latency) sampled over time. **Cheap and highly aggregable** — you can sum/average across thousands of instances efficiently. Key constraint: **prefer low cardinality** (few label combinations) — adding a high-cardinality label like `user_id` explodes the number of series and blows up cost/memory. Best for **dashboards, SLOs, and alerting** ("error rate > 1%").
- **Traces** — a **per-request tree of spans** showing **causality across services**: request enters API gateway (span) → calls auth (span) → calls DB (span), each with timing. Best for **localizing *where* a slow or failing request spent its time** in a distributed system — exactly the thing metrics (too aggregate) and logs (no cross-service linkage) can't show.

**When to use each in an investigation:** an **alert fires from a metric** (error rate up) → you use a **trace** to find *which service/hop* is slow or erroring → you read that service's **logs** for the *full detail* of the failure. Metrics tell you *something's* wrong, traces tell you *where*, logs tell you *what*.

**OpenTelemetry (OTel)** unifies **producing all three** — one vendor-neutral instrumentation SDK and wire protocol (OTLP) for metrics, traces, and logs — so you instrument once and export to any backend (Prometheus, Jaeger, Loki, Datadog) instead of using three separate proprietary agents.

**Key points:**
- Metrics: cheap, aggregated
- Traces: causality, per-request
- Logs: full detail, expensive
- OpenTelemetry: unified producer

---

### 29. Prometheus pull model, exporters, recording rules

**Frequency:** High

**Question:** Explain the Prometheus model: pull scraping, exporters, recording rules, long-term storage.

**Answer:** **Pull, not push:** Prometheus **scrapes** — it periodically HTTP-GETs a **`/metrics`** endpoint on each target and pulls the current metric values (rather than targets pushing to it). Benefits: Prometheus controls scrape timing, can detect a target being *down* (scrape fails), and there's no need for apps to know where to push. (A Pushgateway exists for short-lived batch jobs that can't be scraped.)

**How things expose metrics:**
- **Apps** instrument directly with **client libraries** (Go/Java/Python) that expose `/metrics`.
- **Everything else** — databases, OS, hardware, black-box endpoints — is wrapped by an **exporter**: **`node_exporter`** (host CPU/mem/disk), **`blackbox_exporter`** (probe URLs/ports from outside), **`mysqld_exporter`**, etc. The exporter translates the system's stats into the Prometheus format.
- **Service discovery** (Kubernetes, EC2, Consul) automatically **finds targets** as they come and go — essential in dynamic environments where pod IPs change constantly.

**Recording rules vs alerting rules:**
- **Recording rules** **pre-compute expensive queries on a schedule** and store the result as a new time series — so dashboards and alerts that need `sum(rate(...))` over many series read a cheap pre-aggregated metric instead of recomputing it every query.
- **Alerting rules** evaluate a PromQL expression on a schedule and **fire when it becomes true** (e.g., `rate(errors[5m]) > 0.05`), sending to **Alertmanager** for routing/deduping/silencing.

**Long-term storage:** Prometheus's local TSDB is meant for **recent** data (days–weeks) and doesn't scale horizontally. For long retention and global view, use **federation** (a higher-level Prometheus scrapes aggregates from many) or **`remote_write`** to a scalable backend — **Thanos, Mimir, or VictoriaMetrics** — which provide long-term storage, downsampling, and querying across many Prometheus instances.

**Key points:**
- Pull from `/metrics` endpoints
- Exporters wrap non-instrumented systems
- Recording rules pre-compute aggregations
- Long-term: Thanos / Mimir / VictoriaMetrics

---

### 30. SLI / SLO / error budgets

**Frequency:** High

**Question:** Explain SLIs, SLOs, and error budgets, and how you use the budget.

**Answer:** A hierarchy that turns "reliability" into something **measurable and actionable**:

- **SLI (Service Level Indicator)** — a **measured** number reflecting user experience: **availability** (fraction of successful requests), **p99 latency**, error rate. It's the raw signal.
- **SLO (Service Level Objective)** — a **target for that SLI over a window**: "99.9% of requests succeed over 30 days," "p99 latency < 300ms." It's the goal you commit to. (An SLA is the *contractual* version with penalties — usually looser than your internal SLO.)
- **Error budget** — **`100% − SLO`** = the **allowed unreliability**. A 99.9% availability SLO means a **0.1% error budget** — about **43 minutes of downtime per month** you're *permitted* to spend.

**The error budget is the key idea — it reframes reliability as a *resource to spend*, not something to maximize:**
- **When budget remains**, you can **spend it on shipping** — ship features faster, do risky migrations, run experiments. Being *too* reliable (way under budget) actually signals you're moving too slowly.
- **When the budget is burned** (you've used your 43 minutes), you **halt risky launches** and **redirect effort to reliability** — no new feature rollouts until you're back within budget. This gives dev and ops a **shared, objective decision rule** instead of arguing "is it stable enough to ship?"

**Burn-rate alerting:** instead of alerting the moment a single request fails, you alert on **how fast you're consuming the budget**. **Multi-window, multi-burn-rate alerts** fire when a **fast burn** (e.g., consuming 2% of the monthly budget in 1 hour → page immediately) *and/or* a **slow burn** (e.g., trending to exhaust the budget over days → ticket) is detected, using both a short and long window to confirm it's real and not a blip. This catches genuine budget-threatening problems while suppressing noise from transient errors.

**Key points:**
- SLI measured, SLO targeted
- Error budget = 1 - SLO
- Burn-rate alerts on fast spend
- Halt risky changes when exhausted

---

### 31. Incident response: severity, runbooks, postmortems

**Frequency:** High

**Question:** Explain incident response: severity levels, runbooks, roles, and postmortems.

**Answer:** A structured practice to **respond fast and learn** from outages:

**Severity ladder** — classifies impact and **triggers the response level**: **Sev1** = customer-impacting outage (major functionality down, revenue/data at risk) → all-hands, page everyone, war room; **Sev2** = degraded service (slow, partial failure, workaround exists) → urgent but not all-hands; **Sev3** = minor (cosmetic, internal-only, low impact) → handle in normal hours. Setting severity correctly ensures you neither under- nor over-react.

**Runbooks** — **every alert should link to a runbook** with concrete **diagnostic and mitigation steps** ("if this fires, check X, run Y, if Z then fail over"). This lets a woken-up on-call engineer act immediately instead of reverse-engineering the system at 3am, and captures institutional knowledge.

**Roles during an incident** — for anything beyond trivial, assign clear roles so the response doesn't devolve into chaos: **Incident Commander (IC)** — coordinates, makes decisions, owns the response (not necessarily the one typing fixes); **Comms** — owns updates to stakeholders/status page so responders aren't interrupted; **Scribe** — records the **timeline** (what happened when, what was tried) for the postmortem.

**Blameless postmortem afterward** — within about a week, document the **timeline**, **contributing factors** (deliberately *not* "root cause" — complex outages have *multiple* contributing factors, and singular "root cause" thinking oversimplifies), and **action items with owners and deadlines**. **Blameless** is essential: focus on *how the system allowed* the failure, not *who* made a mistake — blame drives people to hide information and kills learning. **The hard part is tracking action items to completion** — most teams write great postmortems and then never do the follow-ups, so the same incident recurs. Track them like any other prioritized work.

**Key points:**
- Severity ladder triggers response level
- Alerts -> runbooks always
- Roles: IC, comms, scribe
- Blameless postmortem + tracked actions

---

### 32. Cost optimization

**Frequency:** High

**Question:** How do you approach cloud cost optimization?

**Answer:** A layered approach, ordered by impact:

1. **Right-size first (biggest win)** — compare **actual vs requested/provisioned** CPU and memory (via `kubectl top`, Cloud Cost tools, CloudWatch) and **trim over-provisioning**. Most waste is instances/pods sized 3–5× larger than they use "to be safe." This is usually the single largest saving and costs nothing but attention.
2. **Use spot/preemptible instances for fault-tolerant workloads** — spare-capacity instances at **60–90% discount**, with the catch that the cloud can reclaim them on short notice. Perfect for **stateless, retryable, or batch** work (CI runners, stateless web tiers, data processing). **Karpenter** (Kubernetes autoscaler) can **automatically mix spot and on-demand** — running most pods on spot and falling back to on-demand when spot is unavailable, diversifying across instance types to reduce interruption.
3. **Commit for the steady baseline** — for your **always-on** minimum capacity, buy **Reserved Instances, Savings Plans (AWS), or Committed Use Discounts (GCP)** — you commit to 1–3 years of baseline usage for a big discount. Cover the *baseline*, use on-demand/spot for the *spiky* top.
4. **Delete waste** — hunt down the silent money drains: **unattached EBS volumes**, **old snapshots**, **idle load balancers**, orphaned elastic IPs, dev environments left running overnight. Also **lifecycle-tier object storage** — move S3/GCS data to **infrequent-access / archive tiers** (Glacier) as it ages, since most stored data is rarely read.
5. **Tag everything + budget alerts + FinOps culture** — **tag every resource** (team, service, env) so you can do **showback/chargeback** and see *where* money goes. Set **budget alerts** on anomalies (daily spend spikes). And build a **FinOps culture** where engineers **own their costs** — cost visibility in dashboards, cost as a first-class metric — rather than treating the bill as finance's problem.

**Key points:**
- Right-size first (biggest wins)
- Spot for fault-tolerant; Karpenter mixes
- Commit (RI/SP/CUD) for baseline
- Lifecycle storage tiers + delete waste
- Tagging + budget alerts + FinOps culture

---

### 33. File descriptors and ulimit

**Frequency:** Medium

**Question:** What is a file descriptor, and how do you handle `EMFILE` / raise `ulimit`?

**Answer:** A **file descriptor (FD)** is a **small non-negative integer** that indexes into the kernel's **per-process open-file table** — it's the handle a process uses to refer to any open I/O resource. By convention **0 = stdin, 1 = stdout, 2 = stderr**; everything a process opens after that gets the next free integer.

**Crucially, "files" is a misnomer** — FDs represent far more than disk files: **sockets, pipes, epoll/eventfd handles, timerfds, and event notifications all consume FDs**. This is why FD limits bite **network servers** hardest: a server holding 50,000 concurrent connections is holding 50,000+ socket FDs.

**Why the default limit hurts high-connection services:** the default **soft `nofile` limit is often just 1024**. A busy proxy, database, or web server easily exceeds that and starts failing with **`EMFILE: too many open files`** — `accept()` fails, new connections are refused, and the service degrades even though CPU/memory are fine. It's a classic silent scaling wall.

**Ways to raise it** (soft ≤ hard limit):
- **`ulimit -n <N>`** — for the current shell and its children (interactive/quick).
- **systemd unit** — **`LimitNOFILE=`** in the `[Service]` section (the correct place for a systemd-managed daemon; `ulimit` in the shell doesn't affect it).
- **`/etc/security/limits.conf`** — sets **`nofile`** limits for users/groups at login (PAM-based).
- **Containers** — the **kubelet / container runtime (Docker) settings cap** what a container can request; you may need to raise the daemon's `default-ulimits` or set limits in the pod spec/runtime config, because the container can't exceed what the runtime allows.

Check a process's current FD usage with `ls /proc/<pid>/fd | wc -l`.

**Key points:**
- FDs are per-process, integer indexes
- `EMFILE` means raise `nofile`
- systemd: `LimitNOFILE=`, k8s: container runtime config
- Check usage: `ls /proc/<pid>/fd | wc -l`

---

### 34. systemd units and journalctl

**Frequency:** Medium

**Question:** How does systemd manage services, and how do you work with logs via journalctl?

**Answer:** systemd models everything as **units** with typed suffixes: **`.service`** (a long-running or oneshot process), **`.timer`** (cron-like scheduling that triggers a service — with better logging and dependency handling than cron), **`.socket`** (socket-activation — systemd holds the listening socket and starts the service on first connection), **`.mount`** (filesystem mounts), and **`.target`** (grouping/milestones like `multi-user.target`).

**A `.service` unit file** (in `/etc/systemd/system/`) declares behavior in its `[Service]` section:
- **`ExecStart=`** — the command to run.
- **`Restart=`** — resilience policy (**`on-failure`** is the common choice) plus **`RestartSec=`** to back off between restarts, so a crashing service auto-recovers instead of staying dead.
- **`User=`** — run as an unprivileged user (least privilege).
- **Resource limits** — `LimitNOFILE=`, `MemoryMax=`, `CPUQuota=` (systemd applies these via cgroups).

**Managing units:**
- **`systemctl daemon-reload`** — required after editing a unit file so systemd re-reads it.
- **`systemctl enable --now foo`** — enable at boot *and* start immediately (enable = start on boot, start = start now).
- `systemctl status/restart/stop foo` for the rest.
- **Drop-ins**: put overrides in `/etc/systemd/system/foo.service.d/*.conf` to change one setting without editing the vendor unit (survives package upgrades).

**Logs via journalctl:** systemd services log to the **journal** (structured, indexed). Query with **`journalctl -u foo`** (one unit), **`-f`** (follow live, like `tail -f`), **`--since "1 hour ago"`** / `--until`, `-p err` (priority filter), `-b` (this boot). To find **slow boot units**, use **`systemd-analyze blame`** (per-unit startup time) and `systemd-analyze critical-chain`.

**Key points:**
- Unit types: service/timer/socket/mount/target
- `Restart=on-failure` + `RestartSec=` for resilience
- `journalctl -u <unit> -f` for live logs
- Drop-ins in `/etc/systemd/system/foo.service.d/`

---

### 35. HTTP/1.1 vs HTTP/2 vs HTTP/3

**Frequency:** Medium

**Question:** Compare HTTP/1.1, HTTP/2, and HTTP/3, and what does gRPC require?

**Answer:** Three generations, each fixing the previous one's bottleneck:

**HTTP/1.1** — **text-based**, fundamentally **one in-flight request per TCP connection**. You can pipeline requests, but responses must return in order, causing **head-of-line (HoL) blocking** — a slow response stalls everything behind it. Browsers work around this by opening **~6 parallel connections per host**, which is wasteful (6× handshakes, 6× congestion state).

**HTTP/2** — **binary framing** instead of text, and the big win: **multiplexed streams over a *single* TCP connection**. Many requests/responses interleave concurrently with no per-request connection overhead. Adds **HPACK header compression** (headers are hugely repetitive across requests — cookies, user-agent — so compressing them saves real bandwidth) and **server push** (server proactively sends resources; largely deprecated in practice). **Remaining flaw:** it still runs on **TCP**, so a single lost packet stalls *all* multiplexed streams — **TCP-level HoL blocking** — because TCP delivers bytes in order.

**HTTP/3** — runs on **QUIC over UDP** instead of TCP. QUIC implements streams *itself*, so a lost packet only blocks *its own* stream — **eliminating TCP HoL blocking**. It also **merges the transport + TLS handshake** for faster connection setup, including **0-RTT** resumption (send data on the first packet to a previously-seen server). Great for lossy/mobile networks. Most CDNs negotiate it automatically via the `Alt-Svc` header.

**gRPC requires HTTP/2 end-to-end** — it depends on H2's multiplexed streams and bidirectional streaming (many concurrent RPCs, streaming both directions on one connection). This matters operationally: any proxy/load balancer in the path must support H2 (and do L7/gRPC-aware load balancing), or gRPC breaks or load-balances poorly.

**Key points:**
- H1: one in-flight per connection
- H2: multiplexed streams over TCP, HPACK
- H3: QUIC over UDP, no TCP HoL
- gRPC needs H2 end-to-end

---

### 36. TLS handshake and certificate chain

**Frequency:** Medium

**Question:** Explain the TLS handshake, certificate chain validation, TLS 1.3, and common misconfigs.

**Answer:** **Handshake:** the client and server **negotiate a cipher suite** and **establish a shared session key**. Modern setups use **ECDHE** (Elliptic-Curve Diffie-Hellman Ephemeral) for the key exchange, which gives **forward secrecy** — an *ephemeral* key per session means that even if the server's long-term private key is later stolen, past recorded sessions **can't** be decrypted (each used a different, discarded ephemeral key).

**Certificate chain validation:** the server presents its **leaf certificate plus intermediate(s)**. The client validates a **chain of trust**: leaf → intermediate CA → ... → a **root CA in the client's trust store**. Each cert is signed by the next one up; the root is pre-trusted. The client also checks: (1) the **SAN (Subject Alternative Name) matches the hostname** it's connecting to (the CN field is legacy/ignored by modern clients); (2) **validity dates** (not expired/not-yet-valid); (3) **revocation** via **OCSP** (or OCSP stapling) or **CRLs** — has this cert been revoked?

**TLS 1.3 changes:** **collapsed the handshake to one round-trip (1-RTT)** — and 0-RTT for resumption — by removing negotiation round-trips; **removed legacy/weak ciphers** (no RSA key exchange, no CBC, no RC4); and made **forward secrecy mandatory** (ECDHE always). Faster and safer by default.

**Common misconfigurations:**
- **Missing intermediate certs** — the server sends only the leaf, so clients that don't have the intermediate cached can't build the chain ("unable to get local issuer certificate"). Works in some browsers (which cache intermediates), fails in others — a confusing intermittent failure. Always serve the full chain.
- **Wrong/missing SAN** — cert is for `www.example.com` but you connect to `example.com`; hostname mismatch error.
- **Expired certs** — the classic outage; automate renewal (ACME/Let's Encrypt, cert-manager) and alert before expiry.

Debug with `openssl s_client -connect host:443 -showcerts`.

**Key points:**
- Leaf -> intermediate(s) -> trusted root
- SAN must match hostname (CN is legacy)
- TLS 1.3 = 1-RTT, mandatory PFS
- Debug: `openssl s_client -connect host:443 -showcerts`

---

### 37. SSH keys, agent forwarding, jump hosts

**Frequency:** Medium

**Question:** Discuss SSH keys, agent forwarding, and jump hosts (ProxyJump).

**Answer:** **Keys:** prefer **Ed25519** (`ssh-keygen -t ed25519`) over RSA — it's a modern elliptic-curve algorithm that's **faster, has small keys, and strong security** (RSA needs 3072+ bits for equivalent strength). Protect the private key with a **passphrase** so a stolen key file is useless alone, and load it into **`ssh-agent`** so you type the passphrase once and the agent holds the decrypted key in memory for subsequent connections.

**Agent forwarding (`ForwardAgent yes`):** forwards your **local agent's socket to the remote host**, so from the remote you can authenticate onward (e.g., `git clone` from a server) **without copying your private key there**. Convenient, but **risky on shared/untrusted hosts**: anyone with **root on the remote** can hijack the forwarded socket and **use your keys to impersonate you** to anything your agent can reach, for as long as you're connected. Never forward your agent through a box you don't fully trust.

**ProxyJump (`ssh -J bastion target` or `ProxyJump` in config)** — the **safer alternative** for reaching a private host through a **bastion/jump host**. It **tunnels the connection through** the bastion (which just forwards the encrypted stream) so your **authentication and keys terminate on the *target*, not the bastion** — the bastion never sees your agent socket or keys. Unlike agent forwarding, a compromised bastion can't steal your credentials. This is the recommended pattern for accessing private-subnet machines.

**Repeatable hops in `~/.ssh/config`:**
```
Host bastion
  HostName bastion.example.com
  User admin
  IdentityFile ~/.ssh/id_ed25519
Host app-*
  ProxyJump bastion
  User deploy
```
Now `ssh app-1` automatically jumps through the bastion with the right user and key — no long command lines, consistent across the team.

**Key points:**
- Ed25519 > RSA-2048
- Avoid agent forwarding on untrusted hosts
- `ProxyJump`/`-J` is safer than forwarding
- Use `~/.ssh/config` for `Host`, `User`, `IdentityFile`

---

### 38. Distroless vs scratch vs alpine

**Frequency:** Medium

**Question:** Compare distroless, scratch, and alpine base images, and how do you debug distroless?

**Answer:** Three approaches to minimal container base images, trading size against debuggability:

- **`scratch`** — the **empty image**: literally nothing, just your binary. Only works for **fully static binaries** (Go with `CGO_ENABLED=0`, Rust static). **Smallest and safest** (zero packages = near-zero CVEs, no shell for an attacker to use) but **hardest to debug** — no shell, no `ls`, no libc, no CA certs (you must copy those in yourself for TLS to work).
- **distroless** (`gcr.io/distroless/*`) — includes the **minimal runtime** your app needs — **libc, CA certificates**, timezone data, and optionally a language runtime (`distroless/java`, `distroless/python3`) — but **no package manager and no shell**. The sweet spot for most production: small attack surface, works for dynamically-linked binaries and interpreted apps, still no shell for attackers.
- **alpine** — a tiny real distro: **musl libc, busybox** (a minimal shell + coreutils), and **`apk`** package manager. Only ~5MB and you *can* shell in and install tools. The catch: **musl libc ≠ glibc**, so **glibc-compiled binaries can break** on alpine, and musl has historically had **DNS resolution quirks** (different behavior with search domains, no parallel A/AAAA in old versions) that cause subtle networking bugs. Also its `apk` packages differ from Debian/Ubuntu.

**Which to pick:** **scratch or distroless for production** — minimal attack surface, fewer CVEs, smaller/faster. **alpine when you genuinely need a package manager or shell** in the image, accepting the musl edge cases (or use a slim glibc distro like `debian:slim`).

**Debugging a distroless (or scratch) image** — since there's no shell, use an **ephemeral debug container**: `kubectl debug -it <pod> --image=busybox --target=<container>` attaches a temporary container **sharing the target's namespaces** (process, network), so you get tools *alongside* the running container without baking a shell into the production image. `docker` users can similarly attach a debug container to the target's namespaces.

**Key points:**
- scratch: static binaries only, ~MB
- distroless: libc + CAs, no shell
- alpine: musl + apk, watch DNS edge cases
- Debug distroless via `kubectl debug` ephemeral container

---

### 39. Image tagging conventions

**Frequency:** Medium

**Question:** What image tagging conventions should you use in production, and why pin by digest?

**Answer:** **Avoid `:latest` in production.** `latest` is a **mutable, floating pointer** — it silently moves to whatever was pushed most recently. That destroys reproducibility (two nodes pulling `:latest` minutes apart can run *different* code), breaks rollbacks (you can't point back at a specific old `latest`), and makes incidents un-debuggable ("which build was actually running?").

**Tag with immutable, meaningful identifiers:**
- **Semantic version** (`1.4.2`) — human-meaningful, communicates compatibility.
- **Git SHA** (`sha-abc1234`) — ties the image **directly to the exact source commit**, invaluable for tracing "what code is this?"
- **Build date/number** — for ordering.

**Push multiple tags pointing at the same image digest:** e.g., one build gets `1.4.2`, `1.4`, `1`, *and* `sha-abc1234`. This lets different consumers **choose their stability vs freshness tradeoff** — something wanting the latest patch tracks `1.4`, something pinned tracks `1.4.2`, CI references the exact `sha-`. All resolve to the same bytes.

**Pin deployments by digest for *true* immutability:** even a "version" tag like `1.4.2` is technically **mutable** — someone could force-push a different image to that tag. The only **truly immutable reference** is the **content-addressed digest**: `myapp@sha256:abcd...`. Pinning your Kubernetes manifests / deployments to `image@sha256:...` guarantees **exactly these bytes run**, no matter what happens to tags — critical for supply-chain security and reproducibility. (Tools like the GitOps image updater and admission controllers can resolve tags to digests automatically.) Enforce **immutable-tag policies** in the registry (ECR/GCR) so version tags can't be overwritten.

**Key points:**
- Never deploy `:latest`
- Combine semver + SHA tags
- Pin by digest in manifests
- Use registry immutable-tag policies

---

### 40. Volumes vs bind mounts vs tmpfs

**Frequency:** Medium

**Question:** Compare Docker volumes, bind mounts, and tmpfs, and their Kubernetes analogs.

**Answer:** Three ways to give a container storage beyond its ephemeral writable layer, differing in *where the data lives* and *who manages it*:

- **Volumes** — **Docker-managed** storage (under `/var/lib/docker/volumes/`) with **driver support** (local, NFS, cloud block storage). Docker owns the lifecycle; you reference it by name, not a host path. **Portable and the recommended default** — the container doesn't depend on host directory layout, and drivers let the same volume back onto network/cloud storage.
- **Bind mounts** — attach a **specific host path directly** into the container (`-v /host/path:/container/path`). **Flexible** (great for **local dev** — mount your source code so edits appear live inside the container) but **couples the container to the host's filesystem layout** — the path must exist on every host, permissions/SELinux can bite, and it's not portable across machines.
- **tmpfs** — **RAM-only** storage that **never touches disk** and vanishes when the container stops. **Ideal for secrets** (a decrypted credential you don't want persisted) and **hot scratch data** (temp files, caches) where you want speed and no disk trace. Costs RAM.

**Kubernetes analogs:**
- Volumes → **PersistentVolumes/PVCs** (managed, portable, driver-backed — the closest analog).
- Bind mounts → **`hostPath`** (mounts a node path; same host-coupling caveats, generally discouraged in prod for the same portability/security reasons).
- tmpfs → **`emptyDir` with `medium: Memory`** (RAM-backed ephemeral scratch shared within the pod).

**Key points:**
- Volumes: managed, portable
- Bind mounts: host path, host-coupled
- tmpfs: RAM-only, ephemeral
- k8s equivalents: PV/hostPath/emptyDir

---

### 41. Docker network drivers

**Frequency:** Medium

**Question:** Walk through Docker network drivers and how Kubernetes replaces them with CNI.

**Answer:** Docker's built-in drivers cover different networking needs:

- **`bridge`** (default) — creates a **private virtual network per host** with a Linux bridge; containers get internal IPs and reach the outside via **NAT** (source-NAT'd through the host IP). Port publishing (`-p 8080:80`) sets up DNAT. Good isolation, but NAT hides container IPs and adds a small overhead.
- **`host`** — the container **shares the host's network namespace** directly: no isolation, no NAT, the container binds host ports as if it were a host process. **Gains full network performance** and avoids NAT quirks; **gives up isolation** and port-conflict safety.
- **`overlay`** — spans **multiple hosts** by encapsulating traffic in **VXLAN**, so containers on different machines share one virtual network (used by Docker Swarm for multi-host services).
- **`macvlan`** — gives each container its **own MAC and IP directly on the physical LAN**, appearing as a real device on the network (useful for legacy systems that expect real L2 presence).
- **`none`** — disables networking entirely (only loopback) — for fully isolated workloads.

**Kubernetes replaces all of this with CNI (Container Network Interface) plugins.** Instead of per-host bridges + NAT, Kubernetes mandates a **flat network model**: **every pod gets its own network namespace and a unique IP that's routable cluster-wide**, and pods communicate **without NAT** (pod-to-pod uses real IPs). A **CNI plugin** (Calico, Cilium, Flannel, AWS VPC CNI) implements this — wiring each pod's netns, assigning IPs, and setting up routing/overlay (or native VPC routing) so any pod can reach any other pod directly. This flat, NAT-free model is what makes Services, network policies, and service discovery work uniformly.

**Key points:**
- bridge = default NAT
- host = no isolation, fastest
- overlay = multi-host VXLAN
- macvlan = container on physical LAN

---

### 42. docker compose

**Frequency:** Medium

**Question:** What is Docker Compose, what does it define, and when should you graduate to Kubernetes?

**Answer:** **Compose** defines a **multi-container application in a single `docker-compose.yml`** and runs it on **one host**. It's the standard way to spin up an app plus its dependencies (app + Postgres + Redis) with one command.

**What the YAML defines:**
- **`services`** — each container (image, ports, command, environment).
- **`networks`** — Compose auto-creates a network so services reach each other **by service name** as a hostname (`db:5432`).
- **`volumes`** — named volumes for persistence.
- **`env`** — environment variables (often from a `.env` file).
- **`depends_on`** — startup ordering — and importantly with **`condition: service_healthy`**, wait for a dependency's **healthcheck** to pass before starting a service (so the app doesn't start before the DB is ready).
- **`healthcheck`** — per-service readiness check.

**Commands:** `docker compose up -d` brings the whole stack up (detached); `docker compose down -v` tears it down and removes volumes.

**Profiles:** `profiles:` tag optional services so `docker compose --profile debug up` includes extras (a debug UI, seed job) only when requested — keeping the default stack lean.

**When it's well suited vs graduating:** Compose is excellent for **local development** and **small single-host deployments** — simple, fast, no cluster to run. But it has **no multi-host orchestration, no self-healing/rescheduling, no rolling updates or autoscaling across nodes**. When you need **production multi-host** — HA across machines, automatic rescheduling on node failure, horizontal scaling, rolling deploys — **graduate to Kubernetes** (or Nomad). Rule of thumb: Compose for dev and toy prod on one box; Kubernetes when uptime and scale matter.

**Key points:**
- One YAML, multiple services
- `depends_on: condition: service_healthy` ordering
- Profiles for optional stacks
- Use Kubernetes for real prod orchestration

---

### 43. Image vulnerability scanning

**Frequency:** Medium

**Question:** How do you do image vulnerability scanning, and why scan the registry on a schedule?

**Answer:** **What the tools scan:** **Trivy, Grype, and Snyk** analyze **image layers** for **known CVEs** in both **OS packages** (the `apt`/`apk` packages in the base image) **and language dependencies** (npm, pip, Go modules in your app). They compare the software bill of materials against vulnerability databases (NVD, GitHub advisories) and report each finding with a severity and, crucially, **whether a fixed version exists**.

**Integrate as a required CI check:** run a scan on every build and **fail the build on high/critical CVEs *that have a fix available*** — the "fixed version available" qualifier matters, because failing on unfixable CVEs just blocks you with no remedy (better to accept/document those). This shifts security left — vulnerabilities are caught before deploy, not in a quarterly audit.

**Scan for more than CVEs:** also run **misconfiguration checks** (Dockerfile lints — running as root, using `latest`, `ADD` from URLs) and **secret detection** (an API key or private key accidentally baked into a layer — a very common leak). Generate an **SBOM** (Software Bill of Materials) so you have a manifest of everything shipped, enabling fast "are we affected?" answers when a new CVE drops.

**Why schedule recurring registry scans (not just on push):** an image is a **frozen snapshot**, but **new CVEs are disclosed daily** against software that image already contains. An image that scanned clean at build time can have **critical vulnerabilities discovered in it weeks later** — the bytes didn't change, the *known* threats did. So **continuously re-scan images in the registry** to catch newly-disclosed CVEs in already-deployed images, and alert so you can rebuild/patch. Scanning only at push time gives a false sense of security for long-lived images.

**Key points:**
- Trivy/Grype scan OS + lang deps
- Fail CI on fixable high/critical
- Scan registry continuously, not just on push
- Combine with SBOM generation

---

### 44. Non-root, dropped caps, read-only rootfs

**Frequency:** Medium

**Question:** How do you harden a container to run non-root with reduced privileges, and why?

**Answer:** Defense-in-depth: assume the app *will* be compromised and **minimize what an attacker gains**. Several layers, applied in the Dockerfile and Kubernetes `securityContext`:

**1. Run as non-root.** In the Dockerfile, `USER 10001` (a non-zero UID) so the process isn't root. In Kubernetes, enforce it:
```yaml
securityContext:
  runAsNonRoot: true      # refuse to start if the image runs as root
  runAsUser: 10001
```
Why: if an attacker escapes the app into the container, they're an **unprivileged user**, not root — far less they can do, and container-escape exploits often *require* root inside.

**2. Drop all capabilities and block privilege escalation:**
```yaml
  allowPrivilegeEscalation: false      # can't gain more privs via setuid binaries
  capabilities:
    drop: ["ALL"]                       # remove all Linux capabilities
    # add: ["NET_BIND_SERVICE"]         # add back only what's truly needed
```
Linux **capabilities** are fine-grained root powers (bind low ports, load modules, change ownership). Most apps need **none** — drop `ALL` and add back only the specific one required (e.g., `NET_BIND_SERVICE` to bind port 80). This shrinks the privileged surface dramatically.

**3. Read-only root filesystem:**
```yaml
  readOnlyRootFilesystem: true
```
Makes the container's filesystem **immutable**, so an attacker **can't write a malware binary, modify configs, or drop a web shell**. For apps that need to write (e.g., `/tmp`, a cache dir), **mount those specific paths as writable `emptyDir` volumes** — everything else stays read-only.

**Why this reduces blast radius:** each layer removes a tool the attacker would use — non-root removes privileged actions, dropped caps remove kernel powers, read-only rootfs removes persistence and payload-writing. A compromise that would've been a full container takeover becomes a contained, low-privilege foothold with nowhere to go. (Enforce these cluster-wide with Pod Security Standards / admission policies so no workload skips them.)

**Key points:**
- Run as non-root UID
- Drop ALL caps, add only what is needed
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`

---

### 45. PID 1 problem and tini

**Frequency:** Medium

**Question:** Explain the PID 1 problem in containers and how tini / `--init` solves it.

**Answer:** In Linux, **PID 1 is special** — it's the **init process** with two duties normal processes don't have: (1) **reaping zombies** — when *any* process's parent dies, its orphaned children are re-parented to PID 1, which must `wait()` on them when they exit or they become **zombies** (defunct entries that leak the process table); (2) **default signal handling** — PID 1 does *not* get the kernel's default signal actions, so it must **explicitly handle SIGTERM** or the signal is simply ignored.

**Why this breaks in containers:** in a container, **your app *is* PID 1**. Many app runtimes (Node, Python, a JVM) were **never written to be init** — they don't reap re-parented grandchildren (zombies accumulate) and, worse, they **don't handle SIGTERM by default**, so `docker stop` / Kubernetes' graceful-termination SIGTERM is **ignored**, the container hangs for the full grace period, then gets **SIGKILL**ed — no clean shutdown (in-flight requests dropped, connections not drained). **Shell-form ENTRYPOINT** makes it worse: it runs your app under `/bin/sh -c`, so **the shell is PID 1** and typically **doesn't forward signals** to your app at all.

**The fix — a tiny init as PID 1:** use **`tini`** or **`dumb-init`**, minimal init programs that correctly reap zombies and forward signals to your app:
```dockerfile
ENTRYPOINT ["tini", "--", "node", "server.js"]
```
Now `tini` is PID 1, reaps zombies, and forwards SIGTERM to your Node process for a clean shutdown.

**Docker's `--init` flag** (`docker run --init`) **injects tini automatically** as PID 1 without changing your image — handy. In Kubernetes there's no `--init` flag; either bake `tini` into the image or ensure your app *does* handle signals and reap children. **Without this, graceful shutdown fails and zombies leak** — exactly the symptoms of a hung `terminating` pod.

**Key points:**
- PID 1 must reap zombies + handle signals
- Shell-form ENTRYPOINT breaks signal forwarding
- Use `tini`/`dumb-init` or `docker run --init`
- Without it, graceful shutdown fails

---

### 46. Healthchecks: Dockerfile vs orchestrator

**Frequency:** Medium

**Question:** Compare Dockerfile HEALTHCHECK with orchestrator health probes — why does Kubernetes ignore the former?

**Answer:** **Dockerfile `HEALTHCHECK`** bakes a health check *into the image*: `HEALTHCHECK CMD curl -f http://localhost/health || exit 1`. Docker runs it periodically and marks the container **`healthy`/`unhealthy`** (after `--retries`). It's visible in `docker ps` and drives Docker/Swarm behavior.

**Docker Compose** can leverage it: `depends_on: {db: {condition: service_healthy}}` **waits for a dependency's healthcheck to pass** before starting a dependent service — solving "app started before the DB was ready."

**Kubernetes *ignores* the Dockerfile HEALTHCHECK entirely** and uses its own **pod-spec probes**: **`livenessProbe`** (restart if failing), **`readinessProbe`** (remove from Service endpoints if failing), and **`startupProbe`** (protect slow boots). Why the deliberate separation? Kubernetes needs **richer, orchestration-level semantics** than a single healthy/unhealthy bit: it distinguishes "restart me" (liveness) from "stop routing traffic to me" (readiness) from "I'm still booting" (startup) — concepts the Docker healthcheck can't express. It also wants health config in the **declarative pod spec** (versionable, per-environment tunable) rather than frozen into the image. So the image-level healthcheck is simply not consulted.

**Probe mechanisms** available for all three: **exec** (run a command), **HTTP** GET, **TCP** socket connect, and **gRPC** health check — pick per app type.

**Keep the logic consistent across orchestrators:** if the same image runs under both Compose (using HEALTHCHECK) and Kubernetes (using probes), point them at the **same `/health` endpoint and criteria** so "healthy" means the same thing everywhere — otherwise you get confusing environment-specific behavior. And tune `initialDelaySeconds`/`startupProbe` so a slow boot doesn't trigger restart loops.

**Key points:**
- Dockerfile HEALTHCHECK ignored by k8s
- k8s: liveness/readiness/startup probes
- Probes can be exec/HTTP/TCP/gRPC
- Tune `initialDelaySeconds` to avoid restart loops

---

### 47. docker exec vs run vs attach

**Frequency:** Medium

**Question:** Compare `docker run`, `docker exec`, and `docker attach`, and which to use for debugging.

**Answer:** Three commands that people confuse because all can give you a terminal, but they do different things:

- **`docker run`** — **creates and starts a *new* container** from an *image*. `docker run -it ubuntu bash` makes a fresh container. It's the only one that involves an image; the other two operate on **already-running containers**.
- **`docker exec`** — **starts an *additional* process inside an already-running container**. `docker exec -it <container> sh` gives you an **interactive shell alongside** the app that's already running — the app keeps running undisturbed; you're just spawning a second process in its namespaces. This is the **debugging workhorse**: shell in, inspect files, run diagnostics, then exit — the container is unaffected.
- **`docker attach`** — **connects your terminal to the container's existing PID 1 stdio** (the main process's stdin/stdout/stderr). You're not starting anything new — you're wiring into the *primary* process's streams. The gotcha: **Ctrl-C sends SIGINT to PID 1**, which often **kills the container** (since PID 1 *is* the app). Detach safely with the `Ctrl-P Ctrl-Q` sequence, not Ctrl-C.

**For debugging, prefer `docker exec -it <container> sh`** — it's safe (doesn't affect the running app) and gives you a full shell. **Reserve `attach`** for the rare case you genuinely need to see or interact with **PID 1's own output/input** (e.g., a REPL or interactive process running as the main container process). (In Kubernetes the analogs are `kubectl exec` and, for imageless/distroless containers, `kubectl debug` ephemeral containers.)

**Key points:**
- `run`: new container from image
- `exec`: extra process in running container
- `attach`: connect to PID 1 stdio
- `exec -it sh` for ad-hoc debug

---

### 48. Registry choices

**Frequency:** Medium

**Question:** Discuss container registry choices and how you handle air-gapped envs and Docker Hub rate limits.

**Answer:** The landscape spans hosted, cloud-native, and self-hosted:
- **Docker Hub** — the default public registry, but the **free tier has pull rate limits** (anonymous/free-account pulls are throttled), which bites CI that pulls base images repeatedly.
- **GitHub Container Registry (`ghcr.io`)** and **GitLab Registry** — integrate tightly with their **CI** (Actions / GitLab CI) so auth is automatic within pipelines.
- **Cloud-native** — **AWS ECR, Google Artifact Registry, Azure ACR** — integrate with the cloud's IAM (pods pull using their instance/workload identity, no static creds), support geo-replication, and live next to your workloads (fast pulls, no egress).
- **Self-hosted** — **Harbor** (open-source, with built-in **vulnerability scanning, replication, RBAC, signing**) or **JFrog Artifactory** (multi-artifact-type) — for full control, on-prem, or enterprise policy.

**Criteria to weigh:** **CI auth integration** (does your pipeline authenticate cleanly?), **geo-replication** (pull latency for multi-region clusters), **built-in vulnerability scanning**, **signing/policy** support, and **cost** (storage + egress).

**Air-gapped environments:** clusters with no internet can't pull from public registries, so you **mirror upstream images into an internal registry** (Harbor/Artifactory) — pull the needed images once through a controlled boundary, store them internally, and point all workloads at the internal mirror. Combine with an admission policy that only permits the internal registry.

**Docker Hub rate limits:** avoid pulling from Docker Hub in CI by **mirroring/caching base images** into your own registry (or use a **pull-through cache** like Harbor's proxy cache or the cloud registries' remote repositories), and authenticate (authenticated pulls have higher limits) — so a burst of CI builds doesn't hit the anonymous limit and start failing with `toomanyrequests`.

**Key points:**
- Cloud-native: ECR/Artifact Registry/ACR
- Self-hosted: Harbor, Artifactory
- Mirror upstream for air-gapped builds
- Watch Docker Hub pull rate limits

---

### 49. Ingress vs Gateway API

**Frequency:** Medium

**Question:** Compare Ingress and the Gateway API, and which should new deployments target?

**Answer:** Both expose in-cluster Services to external HTTP(S) traffic, but the Gateway API is the modern replacement.

**Ingress** is the **legacy L7 API**. It defines host/path → Service routing, but the spec is **minimal**, so every controller (NGINX, Traefik, ALB) implements advanced features through **vendor-specific annotations** (`nginx.ingress.kubernetes.io/...`). This creates two big problems: **poor portability** (an Ingress tuned for NGINX won't behave the same on Traefik — the annotations are non-standard) and **no clean model** for anything beyond basic HTTP (TCP/UDP, TLS passthrough, traffic splitting, header routing all require hacks or CRDs).

**Gateway API** is the **official successor** — vendor-neutral and expressive by design. Two key improvements:
- **Role-oriented split** into separate resources owned by different teams: **`GatewayClass`** (the controller/infra type, owned by the **infra/platform** team), **`Gateway`** (the actual listener — ports, TLS — owned by **cluster ops**), and **`HTTPRoute`** (routing rules, owned by **app teams**). This lets app developers manage their own routes without touching cluster-wide LB config, with proper RBAC boundaries — something Ingress couldn't cleanly do.
- **First-class support** for **TCP/UDP/TLS routes**, **weighted traffic splitting** (native canary — `HTTPRoute` with backend weights, no annotations), and **header-based routing** — all in the standard spec, so behavior is **portable across controllers**.

**For new deployments, target the Gateway API** where your controller supports it (Envoy Gateway, Istio, Contour, and NGINX all have Gateway API implementations). It's the future-proof, portable, role-appropriate choice; Ingress remains for existing setups and simple cases.

**Key points:**
- Ingress = legacy, annotation-heavy
- Gateway API = role-split, portable
- HTTPRoute supports weighted traffic
- Controllers: Envoy Gateway, Istio, Contour, NGINX

---

### 50. HPA vs VPA vs Cluster Autoscaler vs Karpenter

**Frequency:** Medium

**Question:** Compare HPA, VPA, Cluster Autoscaler, and Karpenter — which axis does each scale?

**Answer:** Four autoscalers operating on **two different axes** — pods vs nodes — that work *together*:

**Pod-level (scale the workload):**
- **HPA (Horizontal Pod Autoscaler)** — scales the **number of pod replicas** up/down based on **CPU, memory, or custom/external metrics** (requests-per-second, queue depth). More load → more pods. The primary way to scale stateless services.
- **VPA (Vertical Pod Autoscaler)** — **right-sizes a pod's CPU/memory *requests*** over time by observing actual usage. Good for workloads you can't easily replicate (some stateful/singleton apps). **Caveat: don't run VPA and HPA on the *same metric*** — they fight (VPA changes requests, which changes the CPU% HPA scales on, causing oscillation). Often run VPA in **recommendation-only mode** to inform requests without auto-applying.

**Node-level (scale the cluster):**
- **Cluster Autoscaler (CA)** — **adds/removes nodes** when pods **can't be scheduled** (Pending due to no capacity) or nodes are underutilized. But it works within **predefined node groups / ASGs** — you must have set up instance-type groups in advance, and it just scales those groups' counts.
- **Karpenter** — a **groupless** node autoscaler (AWS-origin): instead of scaling fixed node groups, it looks at pending pods and **provisions the *just-right* instance type on demand** — picking size, and **mixing spot and on-demand** to minimize cost and fit the exact resource shape needed. Faster and more efficient than CA (no pre-defined groups, better bin-packing, consolidation).

**How they combine:** HPA (or VPA) scales pods; when pods can't fit, **CA or Karpenter** scales nodes to make room. The **modern AWS combo is HPA + Karpenter** — HPA adds replicas under load, Karpenter conjures optimal (often spot) nodes to host them, then consolidates when load drops.

**Key points:**
- HPA scales pods horizontally
- VPA tunes requests; avoid with HPA on same metric
- CA scales nodes within ASGs
- Karpenter: groupless, type-optimal nodes

---

### 51. PodDisruptionBudgets

**Frequency:** Medium

**Question:** Explain PodDisruptionBudgets — what they protect against and what they don't.

**Answer:** A **PodDisruptionBudget (PDB)** limits how many pods of an application can be **voluntarily** taken down **at once**, ensuring you keep enough replicas serving during disruptive maintenance. You declare either **`minAvailable`** (keep at least N pods up) or **`maxUnavailable`** (evict at most N at a time).

**Example:** a 3-replica deployment with `minAvailable: 2` means an eviction is only allowed if **at least 2 pods stay running** — so **at most one pod can be evicted at a time**, and the next won't be evicted until a replacement is Ready. This prevents a node drain from taking down all 3 replicas simultaneously and causing an outage.

**The critical distinction — voluntary vs involuntary disruptions:**
- **PDBs protect against *voluntary* disruptions** — operations Kubernetes *initiates and can throttle*: **`kubectl drain`** (draining a node for maintenance), **node upgrades/rollouts**, and **Cluster Autoscaler / Karpenter** scaling down / consolidating nodes. These respect the PDB — they'll **wait** rather than violate it, so an autoscaler won't drain a node if doing so would breach the budget.
- **PDBs do NOT protect against *involuntary* disruptions** — things no one schedules: a **node hardware crash**, kernel panic, network partition, or an OOM kill. There's no eviction request to block — the pods just die. A PDB can't stop that.

**Implications:** PDBs are **essential for safe rolling node upgrades** in production (without one, a drain can evict all replicas at once). But because they don't cover crashes, you **also** need **multiple replicas spread across zones** (via topology spread constraints / anti-affinity) so an *involuntary* AZ or node failure doesn't take out everything. Also beware setting `minAvailable` == replica count — that **blocks all voluntary eviction** and deadlocks node drains.

**Key points:**
- Protects only voluntary disruptions
- `minAvailable` or `maxUnavailable`
- Required for safe rolling node upgrades
- Combine with multi-zone topology spread

---

### 52. Init vs sidecar containers

**Frequency:** Medium

**Question:** Compare init containers and sidecar containers, including native sidecars (K8s 1.28+).

**Answer:** Both are helper containers in a pod, but with **opposite lifecycles**:

**Init containers** run **sequentially, to completion, *before* the app containers start** — each must exit successfully before the next runs, and only when all finish does the main container start. They're for **one-time setup**: running **database migrations**, **waiting on a dependency** to be reachable (block until the DB responds), **fetching config/secrets** into a shared volume, or setting file permissions. If an init container fails, the pod won't start — it's a hard prerequisite gate.

**Sidecar containers** run **alongside the main container for the pod's whole life**, **sharing its network namespace and volumes**. Classic uses: a **log shipper** (Fluent Bit reading the app's log volume), a **service-mesh proxy** (Envoy intercepting traffic via the shared netns), or a **config reloader**. They're long-running companions, not run-once setup.

**The old problem native sidecars solve:** before native support, a "sidecar" was just an ordinary app container in the pod, which caused **lifecycle bugs** — e.g., the sidecar (proxy) might **not be ready before the main app starts** (early requests fail), or the sidecar might **exit before the main container finishes draining** (losing final logs / breaking the mesh during shutdown), and in a Job the pod couldn't complete because the sidecar never exits.

**Kubernetes 1.28+ native sidecars** fix this: you declare the sidecar as an **`initContainer` with `restartPolicy: Always`**. This special init container **starts before the main containers** (so the proxy/logger is ready first) but **keeps running** and **outlives the main container's startup**, and is **terminated after** the main containers on shutdown — giving proper "start first, stop last" ordering. It also lets Jobs complete (the native sidecar is signaled to stop when the main container finishes). This is now the correct way to run sidecars.

**Key points:**
- Init: run-once setup, sequential
- Sidecar: lifecycle-attached helper
- Native sidecars via init + `restartPolicy: Always`
- Sidecars share net/volumes with main

---

### 53. NetworkPolicies and default-deny

**Frequency:** Medium

**Question:** Explain Kubernetes NetworkPolicies and the default-deny pattern.

**Answer:** **The critical default: all pods can talk to all pods.** Out of the box, Kubernetes networking is **flat and fully open** — any pod can connect to any other pod in any namespace. This is convenient but insecure: a compromised pod can freely probe and reach the entire cluster (lateral movement).

**A NetworkPolicy restricts this.** It **selects pods** (by label) and defines **allowed ingress and/or egress** — the moment *any* policy selects a pod, that pod switches from allow-all to **"deny everything except what's explicitly allowed"** for the covered direction. Policies are **additive** (allow-lists union together).

**The recommended pattern is default-deny + targeted allows.** First apply a **namespace-wide default-deny** that selects all pods and permits nothing:
```yaml
spec:
  podSelector: {}          # selects every pod in the namespace
  policyTypes: [Ingress, Egress]
  # no ingress/egress rules = deny all
```
Then **layer explicit allow policies** per app: "frontend pods may reach backend on port 8080," "backend may egress to the database and to DNS." This is **zero-trust networking** — nothing is reachable unless declared — so a breached pod can only reach exactly what its policy permits, drastically limiting blast radius. (Remember to allow **egress to CoreDNS on port 53**, or name resolution breaks under default-deny egress — a classic gotcha.)

**Requires a policy-aware CNI:** NetworkPolicy is just an *API* — **the CNI plugin must enforce it**. Flannel (basic) doesn't; **Calico and Cilium** do. If your CNI ignores policies, they silently have no effect — a dangerous false sense of security.

**Cilium adds L7 policies:** standard NetworkPolicy is **L3/L4** (IP + port). **Cilium** (eBPF-based) extends this to **L7** — e.g., allow only `GET /api/public` but not `POST /admin`, or restrict specific **gRPC methods** and Kafka topics — identity-aware, application-protocol-level rules that plain NetworkPolicy can't express.

**Key points:**
- Default is allow-all
- Default-deny + targeted allows
- Needs policy-aware CNI
- Cilium adds L7 (HTTP/gRPC) policies

---

### 54. CoreDNS

**Frequency:** Medium

**Question:** Explain CoreDNS in Kubernetes and the `ndots:5` external-lookup problem.

**Answer:** **CoreDNS** is the **default cluster DNS server** — a pluggable DNS server (running as a Deployment) that gives every pod name resolution. It resolves:
- **Service records**: `<service>.<namespace>.svc.cluster.local` → the Service's ClusterIP. This is how pods find each other by name.
- **Headless service per-pod A records**: for `clusterIP: None` services, it returns **one A record per backing pod** (and stable `<pod>.<svc>...` names for StatefulSets).
- **SRV records**: advertise **service + port** (used for port discovery).
- **External queries**: names outside the cluster domain are **forwarded upstream** (to the node's resolver / configured forwarders).

**The `ndots:5` amplification problem:** Kubernetes injects `options ndots:5` into every pod's `/etc/resolv.conf` along with a **search list** (`<ns>.svc.cluster.local`, `svc.cluster.local`, `cluster.local`). The `ndots:5` rule means: **if a queried name has *fewer than 5 dots*, try appending each search domain *first* before trying it as-is.** So resolving an external name like `api.github.com` (2 dots < 5) triggers a cascade of **failed lookups** — `api.github.com.<ns>.svc.cluster.local`, `api.github.com.svc.cluster.local`, `api.github.com.cluster.local` — all NXDOMAIN — **before** finally querying `api.github.com` itself. That's 4 lookups instead of 1, multiplying DNS load and adding latency for every external call.

**Mitigations:** use a **fully-qualified name with a trailing dot** (`api.github.com.`) which has enough dots / signals "absolute, don't append search domains"; or set **`dnsConfig.options` with a lower `ndots`** (e.g., `ndots: 2`) on pods that mostly call external services; or use **NodeLocal DNSCache** to cache and cut the round-trips.

**SLIs and scaling:** watch **cache hit ratio**, **forward (upstream) latency**, and **error/SERVFAIL rate**. Scale **CoreDNS replicas with cluster size** (more pods = more query volume), and use **NodeLocal DNSCache** (a per-node cache) to reduce load on the central CoreDNS and cut latency — DNS is a common cluster-wide bottleneck and outage source.

**Key points:**
- Resolves `<svc>.<ns>.svc.cluster.local`
- Headless services -> per-pod A records
- Watch `ndots:5` external lookup amplification
- Scale CoreDNS replicas with cluster size

---

### 55. Service mesh: what does it add

**Frequency:** Medium

**Question:** What does a service mesh add, and what are its tradeoffs?

**Answer:** A **service mesh** (Istio, Linkerd, Cilium Service Mesh) transparently handles **service-to-service networking concerns** — by intercepting traffic (traditionally via a **sidecar proxy** injected next to each pod) — **without changing application code**. What it adds:
- **mTLS between services** — automatic mutual TLS: every service-to-service call is encrypted and both ends authenticated, giving **zero-trust networking** with certificate rotation handled for you. Apps don't implement TLS.
- **Fine-grained traffic policy** — **retries, timeouts, circuit breakers**, and outlier detection enforced uniformly at the proxy, so resilience patterns don't have to be re-implemented in every service/language.
- **Canary / weighted routing** — split traffic by percentage or headers for progressive delivery (this is what Flagger drives).
- **Uniform observability** — **consistent metrics, traces, and logs** for *every* call, generated at the proxy — so you get golden-signal telemetry across all services regardless of language, with no per-app instrumentation.

**Tradeoffs (it's not free):**
- **Latency and resource tax** — every request hops through a proxy (extra network hop + CPU/memory per sidecar). **Linkerd** is the lightest (purpose-built Rust micro-proxy); **Istio** is the most featureful but heavier.
- **Operational complexity** — you now run and upgrade a whole control plane + hundreds of sidecars; misconfiguration can break all traffic.
- **Debugging difficulty** — the proxy adds a layer between services, so failures can be in the app *or* the mesh, and "why is this request being retried/failing?" gets harder to trace.

**Sidecarless meshes reduce the overhead:** **Cilium** (eBPF in the kernel) and **Istio Ambient mode** move the data plane out of per-pod sidecars — into the node (eBPF or a per-node ztunnel) — **eliminating the sidecar-per-pod tax** (less latency, memory, and lifecycle complexity) while keeping mTLS and L4 policy, adding L7 features via shared proxies only when needed.

**Bottom line:** weigh the need — a mesh is worth it at **many services needing uniform mTLS/observability/traffic control**; for a handful of services it's often overkill.

**Key points:**
- mTLS + L7 policy + observability
- Sidecar tax vs sidecarless (Ambient)
- Linkerd: simple; Istio: featureful
- Adds debug surface; weigh need

---

### 56. CRDs and the operator pattern

**Frequency:** Medium

**Question:** Explain CRDs and the operator pattern.

**Answer:** A **CustomResourceDefinition (CRD)** **extends the Kubernetes API with a new resource kind**. After you register a CRD, you can `kubectl apply` / `get` your own type (e.g., `kind: PostgresCluster`) exactly like a built-in Pod or Service — stored in etcd, validated by a schema, and served by the API. On its own a CRD is just **data** — declaring the kind doesn't *do* anything.

An **operator** supplies the *behavior*: it's a **custom controller that watches instances of the CRD and continuously reconciles real-world state to match the spec** — the same **desired-vs-actual reconciliation loop** Kubernetes uses for built-in resources. You declare `kind: PostgresCluster` with `replicas: 3`, and the operator does the actual work: provisions the pods and storage, configures replication, and keeps it that way.

**Why it's powerful — it codifies operational knowledge as software.** Running a stateful system like a database involves expert, error-prone procedures: **provisioning, configuring replication, performing failover when the primary dies, taking scheduled backups, doing safe upgrades.** An operator **encodes those runbooks into a controller** so they happen automatically and consistently — the human expertise becomes reconciliation logic. This is the Kubernetes-native way to automate "day-2" operations for complex apps.

**Tools and examples:** build operators with **kubebuilder** or the **Operator SDK** (scaffolding for the CRD schema + controller reconcile loop, usually in Go). Well-known examples: **cert-manager** (`Certificate` resource → automatically obtains and renews TLS certs from Let's Encrypt), the **Prometheus Operator** (`Prometheus`/`ServiceMonitor` → manages Prometheus instances and scrape config), and **postgres-operator** / **CloudNativePG** (manages HA Postgres clusters with failover and backups).

**Key points:**
- CRD adds new API kind
- Controller reconciles desired vs actual
- Encodes domain ops knowledge
- Build with kubebuilder/Operator SDK

---

### 57. Rolling update vs Recreate

**Frequency:** Medium

**Question:** Compare the Rolling Update and Recreate deployment strategies, and when to use Recreate.

**Answer:** Two Deployment update strategies with opposite availability/simplicity tradeoffs.

**Rolling Update (the default)** — gradually **replaces old pods with new ones, a few at a time**, keeping the service up throughout. Two knobs tune the rollout:
- **`maxSurge`** — how many **extra pods above the desired count** may be created during the roll (temporary over-capacity to bring up new pods before removing old).
- **`maxUnavailable`** — how many pods may be **missing** (below desired) at once.

These trade **speed vs availability**: higher surge/unavailable = faster rollout but more capacity churn or reduced headroom. **For zero-downtime**, set **`maxUnavailable: 0`** (never drop below full capacity) with **`maxSurge: 25%`** (spin up new pods first, then retire old) — but this **requires spare cluster capacity** for the extra surge pods. Crucially, zero-downtime also **requires good readiness probes** so traffic only shifts to a new pod once it's *actually* ready (otherwise you rout to pods that aren't serving yet).

**Recreate** — **terminates ALL old pods, then starts the new ones**. Dead simple, but there's a **downtime gap** between the old pods dying and new pods becoming Ready. No mixed versions ever run.

**When to choose Recreate:** when the app **cannot tolerate two versions running simultaneously**. Classic cases: an **incompatible database schema migration** (v2 pods expect a new schema that v1 pods would break on — you can't have both hitting the DB at once), or a **singleton that holds an exclusive lock** (two instances would conflict). Accept the brief downtime to guarantee a clean version switch. For everything else, rolling update is preferred.

**Key points:**
- maxSurge + maxUnavailable tune rollout
- maxUnavailable: 0 for zero-downtime
- Recreate for incompatible versions
- Combine with readiness probes for safety

---

### 58. ServiceAccount and pod identity

**Frequency:** Medium

**Question:** How does a pod get an identity and authenticate to Kubernetes and cloud APIs?

**Answer:** **Kubernetes API identity — the ServiceAccount:** every pod runs as a **ServiceAccount (SA)**, and a **projected SA token** (a short-lived, audience-scoped JWT) is **mounted into the pod** (at `/var/run/secrets/kubernetes.io/serviceaccount/token`). The pod presents this token to authenticate to the **Kubernetes API**, and RBAC bindings on the SA determine what it can do. This is the pod's in-cluster identity.

**Cloud API identity — workload identity federation:** the real problem is authenticating to **cloud** APIs (S3, Secrets Manager, GCS) *without* baking static cloud credentials into the pod. The naive approach — putting an AWS access key in an env var or image — is a security disaster (long-lived, easily leaked, hard to rotate, shared across pods). **Workload identity** solves it by **exchanging the pod's SA token for temporary cloud credentials** via OIDC:
- **AWS IRSA (IAM Roles for Service Accounts)** — the SA is annotated with an IAM role; the cluster's OIDC provider lets AWS STS trust the SA token and **hand back short-lived IAM credentials** for that role.
- **GKE Workload Identity** and **Azure Workload Identity** — the same pattern for GCP and Azure: SA ↔ cloud IAM identity mapping, token exchanged for scoped cloud creds.

**Why projected, auto-rotating tokens beat baked-in keys:** the mounted SA token is **projected** (bound to the pod, a specific audience, and an expiry) and **automatically rotated** by the kubelet before it expires — so a leaked token is short-lived and useless soon. Combined with workload identity, **no long-lived cloud secret ever exists in the pod or image** — credentials are minted on demand, scoped to exactly one role, and expire quickly. This is the least-privilege, no-static-secrets way to give pods cloud access.

**Key points:**
- SA = pod's k8s identity
- IRSA / Workload Identity for cloud APIs
- Tokens projected and auto-rotated
- Never bake cloud keys into images

---

### 59. etcd

**Frequency:** Medium

**Question:** Discuss etcd as the datastore behind Kubernetes: Raft, latency, backup, encryption.

**Answer:** **etcd** is the **strongly-consistent, distributed key-value store** that holds **all Kubernetes cluster state** — every object (pods, services, secrets, configmaps) lives in etcd. The API server is essentially a stateless front-end over it. If etcd is unhealthy, the whole control plane is.

**Raft and odd-sized clusters:** etcd uses the **Raft consensus algorithm** to keep replicas consistent, which requires a **quorum (majority)** to commit any write. Quorum math is why you run **odd-sized clusters (3 or 5 nodes)**: a 3-node cluster tolerates **1** failure (2 of 3 = majority), a 5-node tolerates **2**. An *even* size gives no extra fault tolerance (4 nodes still only tolerate 1, since you need 3 for majority) while adding cost and increasing split-brain risk — so always odd.

**Latency sensitivity:** every write must be **fsync'd to disk and replicated to a quorum** before it's committed, so etcd is **extremely disk- and network-latency sensitive**. It needs **fast dedicated disks (low-latency NVMe SSDs)** and ideally **dedicated nodes** — co-locating etcd with noisy workloads, or putting it on slow/network storage, causes write latency to spike, which stalls the entire API (slow `kubectl`, failing controllers).

**Backup and restore drills:** back up regularly with **`etcdctl snapshot save`** — and critically, **rehearse restores** (`etcdctl snapshot restore`). A backup you've never tested restoring is not a backup. etcd is the single source of truth, so a corrupted/lost etcd with no restorable snapshot means rebuilding the cluster from scratch.

**Encryption at rest:** by default etcd stores data (including **Secrets**) unencrypted on disk. Enable **encryption-at-rest backed by a KMS** so Secrets aren't readable from an etcd disk/backup leak (this is the same requirement from the Secrets question).

**Why most control-plane outages trace to etcd:** because it's the consistent, latency-sensitive, quorum-dependent heart of the cluster — **disk latency spikes** or **quorum loss** (losing majority) take down the whole API, and etcd problems cascade everywhere. Treat it as the most critical, most carefully-operated component.

**Key points:**
- Raft, odd-sized 3/5 nodes
- Latency-sensitive: fast disks essential
- Snapshot + restore drill regularly
- Encrypt-at-rest with KMS

---

### 60. ImagePullBackOff causes

**Frequency:** Medium

**Question:** List and explain the causes of `ImagePullBackOff`, and how to diagnose and prevent it.

**Answer:** `ImagePullBackOff` means the kubelet **can't pull the container image** and is backing off between retries (the transient state is `ErrImagePull`, then it settles into `ImagePullBackOff`). It's an *infrastructure/config* problem, not an app crash. **Always start with `kubectl describe pod`** — the Events section shows the **exact registry error** ("not found," "unauthorized," "toomanyrequests"), which points straight at the cause:

1. **Typo in image name or tag** — `myapp:v1.2` when the tag is `v1.2.0`, or a misspelled repo. Error: `manifest unknown` / `not found`. The most common cause.
2. **Registry unreachable** — network/DNS/firewall between the node and the registry (private registry not routable, egress blocked).
3. **Missing or wrong-namespace `imagePullSecret`** — pulling a private image without the credential, or the `imagePullSecret` exists in a *different namespace* than the pod (secrets are namespaced). Error: `unauthorized`.
4. **Expired / wrong private-registry credentials** — the pull secret's token expired, or cloud creds (ECR/GCR) weren't refreshed (ECR tokens are short-lived — need the credential helper / IRSA).
5. **Docker Hub anonymous rate limits** — `toomanyrequests` when unauthenticated CI/nodes exceed the pull limit.
6. **Digest no longer exists** — pinned to `@sha256:...` for an image that was deleted/garbage-collected from the registry.

**Prevention/resilience:** **mirror critical images into your own registry** (Harbor/ECR) so you don't depend on a third party's availability or rate limits, authenticate pulls (higher limits), use cloud credential helpers/IRSA so registry creds auto-refresh, and pre-pull or cache base images. A registry outage or rate-limit shouldn't be able to stop your pods from scheduling.

**Key points:**
- Verify image name + tag exists
- imagePullSecret + correct namespace
- Watch Docker Hub rate limits
- Mirror upstream images for resilience

---

### 61. Tracing a slow service

**Frequency:** Medium

**Question:** Walk through how you trace a slow service in Kubernetes.

**Answer:** A **layered, top-down approach** — start with cheap, broad checks and drill into the specific slow component, always **correlating against baseline and the change log** (the first question is always "what changed?"):

**1. Is the service even healthy/routing correctly?** Check **`kubectl get endpoints <svc>`** — are the expected pods actually in the Service's endpoint list? A pod failing readiness silently drops out, so traffic piles onto fewer pods (looks like latency). Confirm **pod readiness** and replica count.

**2. What changed, and is it errors or latency?** Review **recent deploys** (a slow-down right after a rollout points at the new code/config) and look at **error-rate vs latency dashboards** side by side — rising errors *with* latency suggests failures/retries; latency *without* errors suggests a resource or downstream bottleneck. This narrows the class of problem.

**3. Localize the slow span with distributed traces.** A trace of a slow request shows **where the time actually goes** — is it a **slow database query**, a **downstream service** call, or the app's own CPU? This is exactly what metrics (too aggregate) can't tell you; the trace points at the specific hop to investigate.

**4. Inspect resource and infra factors** that commonly cause invisible slowness:
- **HPA scaling** — is the service under-scaled for current load (not enough replicas)? Is HPA stuck (bad metrics)?
- **CPU throttling** — the sneaky one: a pod hitting its CPU *limit* is **throttled**, not killed, so it just runs slow with no error. Check **`container_cpu_cfs_throttled_seconds`** — throttling is invisible on basic dashboards but a top latency cause.
- **DNS lookup time** — slow/failing CoreDNS (or the `ndots:5` amplification) adds latency to every external call.
- **Node pressure** — memory/disk/IO pressure on the node, noisy neighbors, or a degraded node.

At each layer, compare to the **baseline** (what's normal) and the **change log** (deploys, config, infra changes) to pin the cause.

**Key points:**
- Endpoints + readiness first
- Traces to localize slow span
- CPU throttling often invisible
- Correlate with deploys + node events

---

### 62. Cluster upgrades

**Frequency:** Medium

**Question:** How do you perform a Kubernetes cluster upgrade safely?

**Answer:** Kubernetes upgrades follow strict ordering and version rules to avoid breaking the cluster:

**1. Upgrade the control plane first, one minor version at a time.** Upgrade **kube-apiserver, controller-manager, scheduler, and etcd** *before* touching nodes. Critically, **never skip minor versions** — go 1.27 → 1.28 → 1.29, not 1.27 → 1.29. Kubernetes only supports a **one-minor-version skew** between components, and skipping can break API compatibility and migrations. The control plane must be **at or ahead of** the nodes (kubelet can be one minor behind the API server, never ahead).

**2. Then upgrade nodes gracefully.** For each node (rolling through the fleet): **`kubectl drain`** it (cordon + evict pods, **respecting PodDisruptionBudgets** so you don't take down too many replicas at once), **upgrade the kubelet and container runtime (containerd)**, then **`kubectl uncordon`** to return it to service. Do this rolling, a node (or batch) at a time, so capacity stays up. Often done by replacing nodes entirely (new AMI/image) rather than in-place.

**3. Managed services automate the control plane.** **EKS, GKE, and AKS** handle the control-plane upgrade for you (they run and upgrade the masters/etcd), so you mainly manage the node upgrades (or even those are automated via managed node groups / auto-upgrade). This removes the riskiest, most tedious part.

**4. Scan ahead for removed APIs — the biggest gotcha.** Each Kubernetes release **removes deprecated API versions** (e.g., `Ingress` moved from `extensions/v1beta1` → `networking.k8s.io/v1`). If your manifests use a removed API, they'll **fail to apply after the upgrade**. **Before upgrading**, scan with tools like **`pluto`** or `kubectl deprecations`, **read the release notes**, **update your manifests/Helm charts** to the new API versions, and **test the upgrade in a non-prod cluster first**. Fixing this proactively avoids a post-upgrade outage where deployments suddenly can't be applied.

**Key points:**
- Control plane first, then nodes
- One minor version at a time
- Drain with PDBs honored
- Scan for removed APIs ahead of time

---

### 63. kubectl drain

**Frequency:** Medium

**Question:** What does `kubectl drain` do and when do you use it?

**Answer:** `kubectl drain <node>` **safely empties a node** in two steps: it **cordons** the node (marks it unschedulable so **no new pods** land there) and then **evicts the existing pods** so they reschedule elsewhere. Crucially, eviction **respects PodDisruptionBudgets** — if evicting a pod would violate an app's PDB (drop below `minAvailable`), drain **waits** rather than causing an outage, evicting pods gradually as replacements come up.

**Two important flags/caveats:**
- **`--ignore-daemonsets` is required.** DaemonSet pods (log shippers, CNI, node agents) run **one per node by design** — they can't be "moved" elsewhere, so drain refuses to proceed unless you explicitly acknowledge skipping them with this flag. They keep running until the node is actually removed.
- **Pods using `emptyDir` lose their data.** `emptyDir` is node-local scratch storage; when the pod is evicted and rescheduled on another node, that data is **gone**. Drain won't even proceed for such pods unless you pass **`--delete-emptydir-data`** to confirm you accept the loss. (Persistent data should be on PVCs, which survive.)

**When you drain:** before any **disruptive node maintenance** — **kernel/OS patching**, **node upgrades** (upgrading kubelet/containerd), replacing a node, or **scaling down** the cluster. Draining first ensures workloads are gracefully relocated instead of abruptly killed.

**Returning the node to service:** after maintenance, **`kubectl uncordon <node>`** marks it schedulable again so the scheduler can place pods on it. (Forgetting to uncordon is a common mistake that leaves a node idle and out of the pool.)

**Key points:**
- Cordons + evicts respecting PDBs
- `--ignore-daemonsets` required
- emptyDir data lost on drain
- Uncordon to return node to pool

---

### 64. kubectl top and metrics-server

**Frequency:** Medium

**Question:** Explain `kubectl top` / metrics-server and its limitations vs Prometheus.

**Answer:** **`kubectl top pods`** and **`kubectl top nodes`** show **current CPU and memory usage** — a quick, live snapshot of what's consuming resources. The data comes from **metrics-server**, a lightweight cluster add-on that **scrapes each kubelet's cAdvisor** (the per-node container metrics collector) and **aggregates** it, exposing it through the Metrics API.

**It powers the HPA:** the **Horizontal Pod Autoscaler reads resource metrics (CPU/memory) from metrics-server** to decide when to scale replicas. So metrics-server isn't just for `kubectl top` — without it, HPA on CPU/memory doesn't work. (Note: it's **not installed by default** on all distributions — a common gotcha where `kubectl top` and HPA silently fail because metrics-server is missing; install it.)

**The key limitation — no history:** metrics-server holds **only current (near-real-time) values in memory**; it keeps **no historical data** and does no long-term storage. So you **cannot** graph trends, look at last week's usage, alert on patterns, or do capacity analysis with it. For **history, dashboards, and alerting** you need **Prometheus + Grafana** — Prometheus stores time series over time, Grafana visualizes them. `kubectl top` answers "what's using resources *right now*?"; Prometheus answers "how has usage trended and when did it spike?"

**Custom/external metrics for HPA:** metrics-server only provides **CPU/memory** (resource metrics). To autoscale on **application metrics** — requests-per-second, queue depth, custom business metrics — you need the **Prometheus Adapter** (exposes Prometheus queries via the custom/external metrics API for HPA) or **KEDA** (event-driven autoscaling that scales on external sources like Kafka lag, SQS depth, cron). These plug into HPA's custom/external metrics interface, which metrics-server alone can't serve.

**Key points:**
- metrics-server feeds HPA + `kubectl top`
- Current values only, no history
- Install if missing (not always default)
- For history: Prometheus + Grafana

---

### 65. Pipeline-as-code

**Frequency:** Medium

**Question:** Explain pipeline-as-code and why UI-edited pipelines are an anti-pattern.

**Answer:** **Pipeline-as-code** means your CI/CD pipeline is **defined in version-controlled files that live in the repo alongside the code** — **`.github/workflows/*.yml`** (GitHub Actions), a **`Jenkinsfile`**, or **`.gitlab-ci.yml`**. The pipeline definition is treated exactly like application code.

**Why this matters:**
- **Reviewable and diff-able** — a pipeline change goes through the **same pull-request review** as code. You can see exactly what changed, who changed it, and why (git blame), and reviewers can catch mistakes before they merge.
- **Lives with the code** — the pipeline is **versioned with the branch**, so an old commit builds with the pipeline that was correct *for that commit*, and rolling back code rolls back its pipeline too. No drift between "the code" and "how it's built."
- **Reusable** — factor shared logic into **templates, reusable workflows, or composite actions** so many repos/jobs share one tested definition instead of copy-pasting.

**Why UI-edited pipelines are an anti-pattern:** clicking through a Jenkins/CI web UI to configure a job means the pipeline lives in the **CI server's database, not in Git**. This causes: **drift** (the running pipeline no longer matches anything reviewable — someone tweaked it live months ago and no one remembers), **no audit trail** (who changed what, when? unknown), **no review** (changes go straight to production CI with no approval), **no rollback** (can't revert to a prior config), and **disaster recovery pain** (lose the CI server, lose the pipelines). It's the CI equivalent of editing production by hand.

**Validate pipeline changes via PR runs:** because the pipeline is in the repo, a **pull request that changes it can *run* the changed pipeline** (on the PR branch) before merge — so you test pipeline modifications the same way you test code, catching a broken pipeline in review instead of after it's live on `main`.

**Key points:**
- Pipelines in repo, reviewed in PRs
- Reusable templates / composite actions
- Avoid UI-only pipeline editing
- Validate pipeline changes via PR runs

---

### 66. Trunk-based vs Gitflow

**Frequency:** Medium

**Question:** Contrast trunk-based development with Gitflow. Cover (1) trunk-based development's short-lived branches, frequent merges to main, and feature flags hiding incomplete work, and how that enables continuous deployment and minimizes conflicts, (2) Gitflow's long-lived develop, release, and hotfix branches and its heavier ceremony suited to versioned shipped software, and (3) which model most SaaS teams versus packaged-software teams adopt.

**Answer:** Trunk-based: short-lived branches (hours/days), frequent merges to `main`, feature flags hide incomplete work. Enables continuous deployment and minimizes merge conflicts. Gitflow: long-lived `develop`, `release/*`, `hotfix/*` branches - heavy ceremony, suited to versioned shipped software. Most SaaS teams adopt trunk-based.

**Key points:**
- Trunk-based: small batches, fast merge
- Feature flags hide WIP
- Gitflow: versioned releases, ceremony
- SaaS -> trunk-based; packaged software -> Gitflow

---

### 67. PR check stages

**Frequency:** Medium

**Question:** Describe the typical PR check stages in a CI pipeline and the ordering principles.

**Answer:** A well-designed PR pipeline runs a **sequence of gates**, ordered so the **cheapest, fastest, most-likely-to-fail checks run first**. A typical order:

1. **Lint / format** — seconds to run, catches trivial issues.
2. **Unit tests** — fast, catch logic bugs.
3. **Build** — compile the app.
4. **Container build & scan** — build the image, run vulnerability + secret scanning.
5. **Integration tests** — slower, test components together.
6. **Smoke deploy to an ephemeral environment** — deploy the PR to a temporary, isolated env.
7. **Required reviewer approval** — human review.
8. **Merge.**

**Key principles:**

**Fail fast — lint before tests.** Put the **quickest checks earliest** so a PR with a formatting error or trivial mistake fails in **seconds** instead of after a 15-minute test+build run. Don't make developers wait for expensive stages to learn about cheap problems. This gives fast feedback and saves CI compute.

**Parallelize independent jobs.** Lint, unit tests, and security scans don't depend on each other — **run them concurrently** rather than serially to cut total wall-clock time. Only serialize where there's a real dependency (build before integration tests).

**Ephemeral preview environments catch integration bugs.** Spinning up a **temporary, PR-scoped environment** (its own namespace/stack, torn down on merge/close) lets you run the *actual deployed app* — catching bugs that only appear with real infra, config, dependencies, and networking that unit/integration tests miss. Reviewers can also click through the live change.

**Branch protection enforces required checks.** Configure the required checks as **branch protection rules** so the PR **cannot be merged until they're all green** (and required reviewers approve). This includes **external status reporting** — tools like **SonarQube** (code quality/coverage gates) or **Snyk** (security) report their pass/fail status back to the PR, and those statuses become required checks too, so a quality/security regression blocks merge automatically.

**Key points:**
- Fail fast: lint first
- Parallelize independent jobs
- Ephemeral preview envs catch integration bugs
- Branch protection enforces required checks

---

### 68. Caching dependencies in CI

**Frequency:** Medium

**Question:** How do you cache dependencies in CI, and why cache the package store rather than `node_modules`?

**Answer:** **What to cache:** the **package-manager download stores** — `~/.npm`, `~/.m2` (Maven), the **Go module cache**, **pip wheels** — and **Docker build layers**. These hold the fetched/compiled dependencies that are expensive to re-download or rebuild every run.

**Key the cache by the lockfile hash.** The cache key should be a hash of your **lockfile** (`package-lock.json`, `go.sum`, `poetry.lock`). This means the cache is **restored at the start** of a run and **saved at the end**, and it **automatically invalidates when dependencies change** (lockfile edit → new hash → fresh cache) but is **reused when they don't** — exactly the right behavior. Unchanged deps = instant restore; changed deps = rebuild.

**Mechanisms:** **GitHub Actions `actions/cache`** (or the built-in `setup-*` caching), **GitLab's `cache:` block**, and for Docker, **BuildKit cache mounts** (`RUN --mount=type=cache,target=/root/.npm`) which persist the package store *across builds* even when the install layer is invalidated — great for compiler/package caches.

**Why cache the upstream package store, not `node_modules` directly:** `node_modules` (and equivalents) can contain **platform-specific compiled binaries** (native addons built for a particular OS/arch/libc). Caching it and restoring on a **different runner OS/architecture** can restore **incompatible binaries** — subtle, hard-to-debug breakage. The **package store (`~/.npm`)** holds the **portable downloaded tarballs**, so you cache *that* (fast — no network) and **run `npm ci` fresh** to build `node_modules` correctly for the current environment. You get the speed of skipping downloads without the fragility of shipping compiled artifacts across environments.

**Fallback restore-keys for partial hits:** configure **`restore-keys`** (prefix-matched fallbacks) so that when the exact lockfile-hash key misses (deps changed), CI can still **restore the *most recent* older cache** and only download the *delta* — far faster than a cold cache. A cache miss becomes "update a few packages" instead of "download everything."

**Key points:**
- Key cache by lockfile hash
- Cache the package store, not node_modules
- BuildKit cache mounts for compiler caches
- Set fallback restore-keys for partial hits

---

### 69. Artifact management

**Frequency:** Medium

**Question:** Explain artifact management (Artifactory, Nexus) and the "promote, don't rebuild" practice.

**Answer:** An **artifact repository** (**JFrog Artifactory, Sonatype Nexus, GitHub Packages, AWS CodeArtifact**) is a central store for your **built binaries** — Java **jars**, Python **wheels**, **npm** packages, **OCI** container images, **Helm charts**, and more. It sits between your builds and your dependencies.

**Benefits:**
- **Mirror/cache upstream registries** — acts as a **pull-through proxy** for public registries (npmjs, Maven Central, Docker Hub). Builds pull dependencies from your local mirror, which **avoids upstream rate limits and outages** (Docker Hub limits, npm downtime), **speeds up builds** (local/cached), and works in **air-gapped** environments.
- **Immutable release repos** — once a release version is published, it **can't be overwritten**, guaranteeing that `v1.4.2` always means the same bytes (reproducibility, supply-chain integrity).
- **Vulnerability scanning** — scans stored artifacts for CVEs (like the registry scanning discussed earlier).
- **Geo-replication** — replicate artifacts across regions so distributed teams/clusters pull locally.

**Promote, don't rebuild — the core practice:** build the artifact **once**, then **promote that *same* artifact** through repositories/stages: **snapshot → release → prod** (or dev → staging → prod). You do **not** rebuild the binary for each environment. Why: **rebuilding risks drift** — a different dependency version, base image, or toolchain could sneak in between builds, so "what you tested in staging" wouldn't be "what runs in prod." Promoting the identical, already-tested artifact guarantees **the exact bytes you validated are what ship** (this mirrors the environment-promotion principle). Promotion is just moving/tagging the artifact to the next repo, cheap and safe.

**Retention & cleanup policies:** artifacts accumulate fast (every CI build produces snapshots), so configure **retention rules** — keep the last N snapshots, keep all releases, auto-delete old/unreferenced artifacts — to control storage cost without losing anything you need to reproduce or roll back to.

**Key points:**
- Mirror upstream registries
- Promote, do not rebuild
- Immutable release repos
- Retention + cleanup policies

---

### 70. Secrets in CI without leaks

**Frequency:** Medium

**Question:** How do you handle secrets in CI without leaking them, and why prefer OIDC?

**Answer:** Several layers, because CI is a **prime leak target** (it has access to everything and runs untrusted PR code):

1. **Use the platform's encrypted secret store — never repo files.** Put secrets in **GitHub Actions Secrets, GitLab CI variables, or Vault** — encrypted at rest, injected at runtime, never committed. **Never** put credentials in the repo (even "temporarily," even in a private repo — git history is forever and forks/clones spread it).
2. **Mask secrets in logs and forbid dumping them.** Platforms **automatically mask known secret values** in log output (replace with `***`). But you must also **forbid printing the environment** (`env`, `printenv`) or enabling shell trace (`set -x`), which can **echo secrets the masker doesn't know about** (e.g., a secret derived at runtime, or one in an unexpected variable). A single `set -x` around a curl with an auth header can leak a token into public logs.
3. **Prefer OIDC federation over long-lived cloud keys.** Instead of storing a long-lived AWS access key as a CI secret, use **OIDC**: the CI platform issues a **short-lived, signed workflow token**, and the cloud provider (via a trust policy) **exchanges it for temporary cloud credentials** scoped to a specific role. Benefits: **no long-lived secret to leak** in the first place, credentials **expire in minutes**, and access is **scoped per workflow/repo/branch**. This is the same workload-identity idea as IRSA for pods — short-lived, federated, no static keys.
4. **Scope secret access to only the jobs/environments that need them.** Don't expose every secret to every job. Use **environment-scoped secrets** (e.g., prod secrets only available to the prod-deploy job, gated by environment protection rules) so a compromised or malicious build step can't reach credentials it has no business touching — least privilege for CI.

**Key points:**
- Encrypted secret stores, not repo files
- OIDC to cloud beats long-lived keys
- Mask + forbid `env`/`set -x`
- Scope secrets per job/environment

---

### 71. Environment promotion

**Frequency:** Medium

**Question:** Explain environment promotion in a deployment pipeline.

**Answer:** **Environment promotion** means moving the **same build artifact** through a series of environments — **dev → staging → prod** — where **only the *configuration* differs** between them, not the artifact. The image/binary you built and tested is the one that ultimately runs in prod.

**Why avoid rebuilding per environment:** if you **rebuild** the app separately for each environment, you risk **drift** — a dependency, base image, or toolchain version could differ between the staging build and the prod build, so "the thing you tested in staging" isn't "the thing running in prod." Building **once** and promoting the **identical artifact** guarantees you ship exactly what you validated (same principle as artifact promotion). Environments differ only in **config** (DB URLs, feature flags, resource sizes, replica counts) — injected via ConfigMaps/Secrets/env, not baked into the artifact.

**Promotion under GitOps:** since Git is the source of truth, **promotion is a pull request** that **updates the image tag (or digest) in the target environment's overlay** — e.g., a PR bumping `image: myapp@sha256:...` in the **prod** Kustomize overlay. The GitOps controller then reconciles prod to the new version. Promotion is auditable (it's a reviewed commit), and rollback is `git revert`.

**Gate prod with stronger controls:** dev/staging may auto-promote, but **prod gets extra gates** — **manual approval** (a required reviewer signs off), plus additional automated checks like a **canary rollout** and **smoke tests** post-deploy. In GitHub Actions, **Environments** provide this: **protection rules, required reviewers, and wait timers** on the prod environment so a deploy can't proceed without approval.

**Same config schema, different values:** keep the **configuration *shape* identical** across environments (same keys, same structure) with only the **values** differing per env. This prevents "works in staging, missing-config crash in prod" surprises — if staging and prod use the same schema, a config that's valid in one is structurally valid in the other; only the values (which point to prod resources) change.

**Key points:**
- One artifact, many envs
- Promote via PR to env overlay
- Manual approval gates for prod
- Same config schema, different values

---

### 72. Database migrations in CD (expand/contract)

**Frequency:** Medium

**Question:** How do you run database migrations safely during continuous delivery (expand/contract)?

**Answer:** **The core problem:** during a **rolling deploy**, the **old and new app versions run simultaneously** for a period (that's what \"rolling\" means \u2014 pods are replaced gradually). Both versions hit the **same database at the same time**. So a **backward-incompatible migration breaks things**: if you rename or drop a column that the still-running *old* pods depend on, those old pods start throwing errors the moment the migration runs \u2014 an outage mid-deploy. You **cannot** do a hard, breaking schema change atomically with a rolling app deploy.

**The solution \u2014 expand/contract (a.k.a. parallel change):** make every schema change **backward-compatible across at least one app version**, in ordered steps that keep old and new app versions both working at every point:

1. **Expand \u2014 add the new column/table** (a *purely additive*, backward-compatible migration). Old app ignores it; nothing breaks. Deploy this migration first.
2. **Deploy an app that writes BOTH old and new** \u2014 the new app version writes to *both* the old column and the new one (dual-write), while still reading the old. Now new data lands in both places, and old pods (reading old) still work.
3. **Backfill** \u2014 run a job to **copy existing old-column data into the new column**, so the new column is complete for historical rows, not just new writes.
4. **Deploy an app that reads ONLY the new** \u2014 now that the new column is fully populated (backfill + dual-writes), switch reads to the new column. Old column is still there but unused.
5. **Contract \u2014 drop the old column** \u2014 only *after* every running app version no longer references it. This final migration is now safe because nothing reads or writes the old column.

**The key rule:** **never make a schema change that the currently-running app version can't tolerate.** Each step is individually backward-compatible, so at no point do old and new pods conflict over the schema. It's more steps and more deploys, but it's the only way to evolve a schema with **zero downtime** under rolling deploys. (Run the additive migrations *before* the app deploy, the destructive `contract` *after* full rollout.)

**Key points:**
- Migrations precede app deploy
- App must work with old and new schema
- Backfill before reading new
- Drop legacy after full rollout

---

### 73. Feature flags

**Frequency:** Medium

**Question:** Explain feature flags: decoupling deploy from release, what they enable, and flag hygiene.

**Answer:** A **feature flag** is a runtime toggle that **decouples *deploying* code from *releasing* a feature to users**. You ship the new code to production **"dark"** (deployed but disabled), then **turn it on independently** — per **user, cohort, or percentage** — via a **flag service** (**LaunchDarkly, Unleash, Flagsmith**) without a redeploy. Deploy and release become separate decisions.

**What this enables:**
- **Trunk-based development** — developers merge incomplete features to `main` behind an *off* flag, so work integrates continuously without long-lived branches, and unfinished code ships safely (dark) instead of blocking releases. This is the key enabler of trunk-based + continuous deployment.
- **A/B tests / experiments** — enable a variant for a random % of users and measure impact, since the flag service targets cohorts.
- **Instant kill switches** — if a feature misbehaves in prod, **flip the flag off in seconds** — no rebuild, no redeploy, no rollback. This is a hugely valuable safety net (turn off a broken feature instantly).
- **Gradual rollouts** — ramp a feature 1% → 10% → 50% → 100%, watching metrics — a code-level canary independent of infrastructure.

**Flag hygiene — the critical discipline:** flags are **debt**. Every flag adds a **branch in the code** (`if flag on ... else ...`), and flags **multiply combinatorially** — N flags = up to 2^N possible states, an untestable explosion. Left unmanaged, stale flags cause **code rot** (dead branches no one dares remove), confusion ("is this flag still used?"), and bugs from unexpected combinations. So **track each flag's lifecycle** — who owns it, why it exists, when it should be removed — and **ruthlessly delete flags once a feature is fully rolled out or abandoned** (remove the flag *and* the dead branch). Treat flag cleanup as required follow-up work, not optional.

**Key points:**
- Deploy != release
- Percentage / cohort targeting
- Kill switches without redeploy
- Retire stale flags ruthlessly

---

### 74. Terraform modules and workspaces

**Frequency:** Medium

**Question:** Explain Terraform modules and workspaces, and why prefer directory-per-env.

**Answer:** **Modules** are Terraform's **reusable building blocks** — a module groups related resources behind an input/output interface. E.g., a **`vpc` module** takes a **CIDR variable** and creates the VPC, subnets, route tables, NAT gateways, and outputs the subnet IDs — so every environment/project calls the same tested module instead of copy-pasting resource blocks. **Source** modules from **local paths** (`./modules/vpc`), **Git** (`git::https://...`), or the **public/private Terraform Registry**. **Always pin module versions** (`version = "3.2.1"`) — an unpinned module can change under you and break or unexpectedly modify infra on the next `init`.

**Workspaces** are **isolated state instances within a single configuration** — `terraform workspace new prod` gives you a separate state file while reusing the same `.tf` code, and `terraform.workspace` lets code branch on the current workspace. They *can* model environments (dev/staging/prod) from one config, **but they're easy to misuse**: the environments **share the same code and backend**, differ only by an interpolated workspace name, and it's **dangerously easy to run `apply` against the wrong workspace** (you *think* you're in staging but you're in prod — the current workspace is invisible in the command). They also make per-env differences awkward (conditionals sprinkled through the code).

**Why many teams prefer directory-per-env** (`envs/prod/`, `envs/staging/`, each with its own `main.tf` calling shared modules and its own backend/state): it gives **explicit, physical separation** — you literally `cd envs/prod` to touch prod, each env has its **own state and backend** (a mistake in staging can't touch prod state), per-env config is **visible in files** rather than hidden behind `terraform.workspace` conditionals, and code review clearly shows *which environment* a change affects. The clarity and blast-radius isolation outweigh the mild duplication, so directory-per-env (with shared modules for the common logic) is the common production pattern; workspaces are better reserved for lightweight, near-identical parallel instances.

**Key points:**
- Modules = reusable building blocks
- Pin module versions
- Workspaces = state isolation
- Directory-per-env often clearer than workspaces

---

### 75. terraform plan review discipline

**Frequency:** Medium

**Question:** Explain the discipline of reviewing a `terraform plan` before applying.

**Answer:** `terraform plan` shows **exactly what will change before you change it** — the whole point is to **review it carefully** so an apply never surprises you. The discipline:

**1. Read the full plan and count creates/updates/destroys.** The plan summary (`Plan: X to add, Y to change, Z to destroy`) is your first sanity check. If you intended to change one setting and the plan wants to **destroy 12 resources**, something is wrong — stop and investigate. Don't skim; read what's actually changing.

**2. Scrutinize every destroy for blast radius, and watch for `forces replacement`.** Deletions are the dangerous part. Especially watch for **`# forces replacement`** annotations on **critical, stateful resources** — a change to certain attributes (e.g., a DB engine parameter, an AZ, a name) forces Terraform to **destroy and recreate** the resource. On a **database** that means **data loss + downtime**; on a **load balancer** it means a new endpoint / dropped connections. Catching a `forces replacement` on a database in review (instead of after apply) prevents a catastrophic outage. Also check for **sensitive value churn** (unexpected changes to secrets/keys).

**3. Post the plan in the PR and require approval for destructive plans.** Use **Atlantis** (or `tf`-action tooling) to **run `plan` automatically and post its output as a PR comment**, so reviewers see the exact proposed changes as part of code review — and **require explicit approval** before a plan with destroys can be applied. This makes infra changes reviewable like code and stops one person from unilaterally destroying prod.

**4. Apply exactly what was planned via a saved plan file.** Run `terraform plan -out=plan.tfplan` and then `terraform apply plan.tfplan`. This applies the **saved plan** rather than re-planning at apply time — guaranteeing you apply **precisely what was reviewed**, with no chance that **drift or a state change between plan and apply** silently alters what happens. Plan-then-apply-the-saved-plan closes the gap where reality could shift between review and execution.

**Key points:**
- Read every destroy line
- `forces replacement` = downtime risk
- Plan in PR via Atlantis
- Apply saved plan to avoid drift

---

### 76. Immutable vs mutable infrastructure

**Frequency:** Medium

**Question:** Contrast immutable and mutable infrastructure.

**Answer:** Two philosophies for how you change running servers.

**Mutable infrastructure** — you **modify servers in place**: SSH in (or run config management like Ansible/Chef/Puppet) to patch packages, change configs, deploy new code onto existing machines. The problem is **drift and snowflake servers**: over time, manual fixes, failed partial updates, and one-off tweaks accumulate so that **each server becomes subtly unique and undocumented** — a "snowflake" no one can reliably reproduce. Two servers that should be identical aren't, causing "works on server A, fails on server B" mysteries, and rebuilding a lost server exactly is nearly impossible.

**Immutable infrastructure** — you **never modify a running server**. For *any* change (new code, a patch, a config tweak), you **build a brand-new image** (container image, AMI, VM image) with the change baked in, then **replace** the instances — spin up new ones from the new image, shift traffic, tear down the old. The running servers are **read-only, disposable, and identical to their image**. Benefits:
- **No drift** — every instance is exactly its image; nothing mutates after boot, so servers stay reproducible and identical.
- **Easy rollback** — a bad change? **Redeploy the previous image.** Rollback is just "run the old artifact," clean and fast (same idea as blue/green).
- **Fits autoscaling** — because instances are identical and disposable, the autoscaler can freely create/destroy them from the image.

**Requirements it imposes:** you need **fast image builds** (you build an image for *every* change, so slow builds hurt) and **rolling-deploy automation** (to replace instances with zero downtime). **Containers are the canonical immutable unit** — an image is immutable by construction, and Kubernetes replaces (never patches) pods — which is why the container ecosystem embodies immutable infrastructure by default. (Tools like Packer build immutable VM images/AMIs for the non-container world.)

**Key points:**
- Mutable -> drift + snowflakes
- Immutable -> replace, never patch
- Fast image builds essential
- Rollback = redeploy prior image

---

### 77. Security groups vs NACLs (AWS)

**Frequency:** Medium

**Question:** Contrast AWS security groups and NACLs.

**Answer:** Two AWS firewall mechanisms at different layers, with a key stateful/stateless difference.

**Security Groups (SG)** — **stateful, instance-level** firewalls (attached to ENIs/instances). **Allow rules only** (there's no deny — anything not allowed is implicitly denied). **Stateful** means: if you allow **inbound** traffic on a port, the **return traffic is automatically allowed** out — you don't write a rule for responses. This makes them simple: you just declare "allow inbound 443 from the LB" and replies flow back automatically. SGs are the **primary, day-to-day tool** for controlling access, and can reference *other security groups* as sources ("allow from the app-tier SG").

**NACLs (Network ACLs)** — **stateless, subnet-level** controls (attached to subnets, apply to all traffic in/out of the subnet). They support **both allow AND deny rules** (evaluated in numbered order). **Stateless** means: there's **no automatic return traffic** — if you allow inbound on a port, you must **separately allow the outbound ephemeral-port return traffic** (and vice versa), or connections hang. This makes them fiddlier (you manage both directions manually).

**Which is which:** **SGs are the primary tool** — fine-grained, stateful, easy, reference-able; do almost all your access control here. **NACLs are a coarse secondary layer** — subnet-wide, and their **deny** capability is their main value (SGs can't deny), used for things like **blocking a specific malicious IP range** at the subnet boundary or as a broad backstop. Defense in depth: SG per instance + NACL per subnet.

**Production practice:** **default-deny ingress** (only open the exact ports/sources needed — SGs are deny-by-default already, so just don't over-open) **plus tightened, minimal egress.** People often lock down inbound but leave **outbound wide open (0.0.0.0/0 all ports)** — which lets a compromised instance **exfiltrate data or call C2 servers** freely. Restricting egress to only the destinations a workload legitimately needs is an important, often-skipped hardening step.

**Key points:**
- SG: stateful, instance level, allow-only
- NACL: stateless, subnet level, allow + deny
- SGs first, NACLs as secondary
- Tighten egress, not just ingress

---

### 78. Service discovery

**Frequency:** Medium

**Question:** Explain service discovery approaches and why a health-aware registry beats static DNS.

**Answer:** **Service discovery** answers "where is service X right now?" in a dynamic environment where instances constantly come and go (autoscaling, deploys, failures). Manually hardcoding IPs doesn't work — they change. Approaches:

**1. DNS-based discovery** — services find each other via **DNS names** that resolve to current IPs: **Route53 private hosted zones**, **CoreDNS** (in Kubernetes), or **Consul DNS**. Simple and universal (everything speaks DNS), but plain DNS has a weakness: **TTL caching** means clients may cache a stale IP after an instance dies, and basic DNS returns records regardless of whether the target is actually healthy.

**2. Registry-based discovery** — a dedicated **service registry** (**Consul, Netflix Eureka, AWS Cloud Map**) where **services register themselves on startup** and continuously report **health info** via heartbeats. Clients (or a sidecar) query the registry for *currently healthy* instances. The registry actively **removes unhealthy/dead instances**, so you never get routed to a down node.

**3. Kubernetes: automatic discovery.** In K8s you rarely think about this — a **Service** provides a stable virtual IP + DNS name, and **CoreDNS** resolves `my-svc.my-namespace.svc.cluster.local` automatically. The Service's endpoints are **kept in sync with healthy pods** (pods failing readiness probes are removed from rotation), so discovery is built-in and health-aware out of the box.

**4. Cross-cluster / multi-region.** For services spanning clusters or regions: **external-dns** watches K8s Services/Ingresses and **syncs them to cloud DNS** (Route53, Cloud DNS) so external/other-cluster clients can resolve them; or use **service-mesh federation** (Istio/Consul mesh linking multiple clusters) for cross-cluster routing with mTLS and locality awareness.

**Why a health-aware registry beats static DNS:** static DNS can hand out the IP of a **dead or unhealthy instance** (it doesn't know health, and TTL caching delays updates), causing failed requests until caches expire. A **health-aware registry (or K8s endpoints)** only ever returns **currently-healthy** targets and updates within seconds of a failure — so traffic automatically avoids dead instances. In fast-changing, autoscaling systems, that health-awareness is essential.

**Key points:**
- k8s: Service + CoreDNS
- Consul/Cloud Map for mixed envs
- external-dns syncs to cloud DNS
- Health-aware registry beats static DNS

---

### 79. Grafana dashboards and alerts

**Frequency:** Medium

**Question:** Explain how you build Grafana dashboards and alerts.

**Answer:** **Grafana** is the **visualization layer** — it queries and graphs data from many sources: **Prometheus** (metrics), **Loki** (logs), **Tempo** (traces), **CloudWatch**, **BigQuery**, and more, in one unified UI. It doesn't store data itself; it renders whatever backends hold.

**Dashboards as code.** Don't click-build dashboards and leave them un-versioned — they drift and get lost. Manage them **as code**: export/author the dashboard **JSON** and commit it to Git, or generate it with **Grafonnet** (Jsonnet library) or the **Grafana Terraform provider**. This makes dashboards **reviewable, diffable, and reproducible** — changes go through PR like any other code.

**Template variables.** Use **template variables** (dropdowns for `cluster`, `namespace`, `service`, etc.) so **one dashboard works across many targets** instead of duplicating a dashboard per environment. The variable feeds into the PromQL queries (`{namespace="$namespace"}`), giving reusable, filterable views.

**Where alerts run.** Two options: **Grafana unified alerting** (define alert rules inside Grafana, evaluated against any datasource, routed via Grafana's notification policies) or **Prometheus Alertmanager** (rules defined in Prometheus, Alertmanager handles grouping/routing/silencing). Both are valid — Alertmanager is the classic Prometheus-native path; Grafana unified alerting is convenient when you alert across multiple/varied datasources.

**Keep dashboards small and intentional.** Don't build sprawling 50-panel dashboards no one reads. Aim for **one focused dashboard per service** built on a proven method: **RED** (**Rate, Errors, Duration** — best for request-driven services) or **USE** (**Utilization, Saturation, Errors** — best for resources like CPU, disk, queues). These methods ensure you show the few signals that actually matter for spotting and diagnosing problems, rather than a wall of noise.

**Key points:**
- Dashboards as code in Git
- Template vars for reuse
- RED (rate/errors/duration) or USE (utilization/saturation/errors) method
- Alerts in Alertmanager or Grafana unified

---

### 80. OpenTelemetry: collector, signals, propagation

**Frequency:** Medium

**Question:** Explain OpenTelemetry: the spec, the Collector, context propagation, and instrumentation.

**Answer:** **OpenTelemetry (OTel)** is a **vendor-neutral standard** — a specification plus SDKs — for the three telemetry signals: **traces, metrics, and logs**. Its core value: **one SDK, many backends.** You instrument your app *once* against OTel's API, then export to *any* compatible backend (Tempo, Jaeger, Datadog, Honeycomb...) by config — no rewriting instrumentation if you switch vendors. This breaks the old lock-in where each APM vendor had its own proprietary agent.

**The Collector.** Apps emit telemetry in **OTLP** (the OTel wire protocol) to an **OpenTelemetry Collector** — a standalone processing pipeline that sits between your apps and your backends. The Collector **receives, batches, filters, transforms, and samples** telemetry, then **exports** it to one or more backends (Tempo, Jaeger, Datadog, etc.). Benefits: apps just speak OTLP to the Collector (they don't need backend-specific config), and you centralize sampling/filtering/routing/redaction in one place. You can also change backends by editing the Collector config, not the apps.

**Context propagation.** For a trace to span multiple services, the **trace context must travel with the request** across service boundaries. OTel uses the **W3C `traceparent` HTTP header** — it carries the trace ID and parent span ID, so when service A calls service B, B's spans **link into the same trace** as A's. This standardized header is what stitches per-service spans into one end-to-end distributed trace across your whole system.

**Auto vs manual instrumentation.** **Auto-instrumentation** libraries hook into common frameworks (HTTP servers/clients, gRPC, DB drivers, message queues) and produce spans **without code changes** — you get broad coverage cheaply. **Manual instrumentation** is where you add **custom spans** around your own business logic ("process-payment", "render-report") and attach domain attributes the auto-instrumentation can't know about. Typical practice: auto-instrument for the framework-level baseline, then manually add spans for the critical custom operations you care about.

**Key points:**
- One SDK, many backends
- Collector for processing + routing
- W3C traceparent header propagates context
- Auto-instrumentation for common libs

---

### 81. Pipeline scanning (Trivy, Snyk, Dependabot)

**Frequency:** Medium

**Question:** Explain pipeline security scanning: the categories, auto-update tooling, and gating.

**Answer:** "Shift security left" — run automated scanners in CI so vulnerabilities are caught **before** merge/deploy, not in production. The categories cover the whole supply chain:

1. **SCA (Software Composition Analysis)** — scans your **dependencies** for known CVEs (e.g., a vulnerable version of a library). Most vulnerabilities live in third-party deps, so this is high-value. Tools: Snyk, OWASP Dependency-Check, Trivy.
2. **SAST (Static Application Security Testing)** — scans **your own source code** for insecure patterns (SQL injection, hardcoded crypto, path traversal). Tools: Semgrep, CodeQL, SonarQube.
3. **IaC scanning** — scans **infrastructure code** (Terraform, K8s YAML, CloudFormation) for misconfigurations (public S3 buckets, open security groups, privileged containers). Tools: **Checkov, tfsec, Trivy**.
4. **Secret scanning** — detects **committed credentials** (API keys, tokens, private keys) in the repo/history. Tools: **gitleaks, trufflehog**.
5. **Container scanning** — scans **built images** for OS-package and library CVEs in the image layers. Tools: **Trivy, Grype**.

**Auto-updates.** **Dependabot** or **Renovate** watch your dependencies and **automatically open PRs to bump vulnerable/outdated deps** to a fixed version — so remediation is a one-click merge instead of manual tracking. Renovate is more configurable (grouping, schedules); both drastically reduce the window you sit on a known-vulnerable dependency.

**Gating — the crucial policy.** Don't block on *everything* (that creates alert fatigue and blocks unrelated work over unfixable low-severity noise). Sensible policy: **block merge on HIGH/CRITICAL findings that have a fix available** (you can and must act on those), and **warn (don't block) on the rest** (lower severity, or no fix yet). This keeps the gate meaningful and actionable.

**Aggregate findings.** Feed all scanner output into a **central vulnerability tracker** (**DefectDojo** or similar) rather than leaving results scattered in per-PR comments. Otherwise findings **vanish into PR noise** — unfixed issues get forgotten once the PR merges. A tracker gives you a durable, deduplicated queue with ownership and triage, so nothing slips through.

**Key points:**
- SCA + SAST + IaC + secrets + container scans
- Dependabot/Renovate for auto-updates
- Block merge on high/critical fixable
- Aggregate findings in a tracker

---

### 82. AWS vs GCP vs Azure: rough service mapping

**Frequency:** Medium

**Question:** Give a rough service mapping across AWS, GCP, and Azure, and explain the IAM differences.

**Answer:** The big three offer broadly equivalent primitives under different names:

| Category | AWS | GCP | Azure |
|---|---|---|---|
| Compute (VMs) | EC2 | Compute Engine | Azure VMs |
| Managed Kubernetes | EKS | GKE | AKS |
| Serverless functions | Lambda | Cloud Functions | Azure Functions |
| Object storage | S3 | Cloud Storage (GCS) | Blob Storage |
| Managed Postgres | RDS | Cloud SQL | Azure Database for PostgreSQL |

(GKE is generally considered the most polished managed-Kubernetes offering, since Google originated Kubernetes.)

**How the IAM models differ** — this is where the providers diverge most:
- **AWS** — **IAM roles + JSON policies.** Extremely **powerful and fine-grained**, but **verbose and complex** — policies are JSON documents with actions/resources/conditions, and getting least-privilege right is genuinely hard. Assume-role and cross-account trust add power and complexity.
- **GCP** — **IAM bindings** on a **resource hierarchy** (organization → folders → projects → resources). You bind a **member** (user/service account) to a **role** on a resource, and permissions **inherit down the hierarchy**. Generally **simpler and cleaner** than AWS, with the project/folder tree giving natural organizational scoping.
- **Azure** — **Azure RBAC** (role assignments scoped to subscriptions/resource-groups/resources) layered on **Entra ID** (formerly Azure AD) for identity. Familiar if you come from the Microsoft/AD world; identity and resource-access are somewhat separate concerns.

**Why multi-cloud is harder than it looks — pick one primary.** Although services *map* conceptually, the **details differ everywhere**: IAM models, networking, quotas, APIs, managed-service behaviors, and especially the **operational tooling and team expertise**. Truly abstracting over all three (to avoid lock-in) usually means using only the lowest common denominator and building/maintaining costly abstraction layers — you pay a real "multi-cloud tax" in complexity and lose the deep, provider-specific features that make each cloud valuable. For most teams the pragmatic choice is to **pick one primary cloud**, go deep, and use another only where there's a compelling specific reason.

**Key points:**
- EKS / GKE / AKS for managed k8s
- S3 / GCS / Blob for object
- IAM models differ significantly
- Multi-cloud is mostly a tax

---

### 83. iptables vs nftables

**Frequency:** Low

**Question:** Compare iptables and nftables.

**Answer:** Both are Linux packet-filtering frameworks built on the kernel's **netfilter** hooks; nftables is the modern successor to iptables.

**iptables** organizes filtering into **tables** and **chains**. **Tables** group rules by purpose: **`filter`** (accept/drop packets — the firewall), **`nat`** (network address translation — rewriting source/dest addresses/ports), **`mangle`** (modifying packet headers like TOS/TTL), and `raw`. Within tables, **chains** are hook points in the packet's journey: **`INPUT`** (packets destined for this host), **`OUTPUT`** (packets originating from this host), **`FORWARD`** (packets routed *through* this host), plus `PREROUTING`/`POSTROUTING` (for NAT). You append rules to chains; each rule matches (protocol/port/IP) and takes a target (ACCEPT/DROP/etc.).

**nftables** is the **modern replacement**: a **single `nft` tool** and a **unified, more expressive syntax** replacing the separate `iptables`/`ip6tables`/`arptables`/`ebtables` commands. It supports maps, sets, and combined IPv4/IPv6 rules more cleanly, with better performance and atomic rule replacement. Same **netfilter** underneath — it's the framework that evolved, not a different mechanism.

**Kubernetes relevance:** **kube-proxy** (which implements Service load-balancing) historically programmed **iptables** rules to route Service traffic to pod IPs — which scaled poorly with thousands of Services (huge rule lists, linear matching). It later gained an **IPVS** mode (kernel L4 load balancer, better at scale) and now an **nftables** mode. So which backend kube-proxy uses directly affects cluster networking performance at scale.

**Why ordering matters:** rules in a chain are evaluated **top-down, and the first matching rule wins** (its target is applied and — typically — evaluation stops). So a broad `ACCEPT` placed above a specific `DROP` renders the DROP unreachable. Rule order is functionally significant; a misordered rule silently opens or blocks traffic. Use `iptables -L -n -v` to inspect chains with packet/byte counters and verify which rules are actually matching.

**Key points:**
- Tables: filter/nat/mangle/raw
- Chains: INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING
- nftables is the successor; same netfilter underneath
- `iptables -L -n -v` to inspect counters

---

### 84. .dockerignore

**Frequency:** Low

**Question:** Explain the purpose of a `.dockerignore` file.

**Answer:** When you run `docker build`, Docker first **sends the entire build context** (usually the whole directory `.`) **to the Docker daemon** before executing the Dockerfile. `.dockerignore` **excludes paths from that context** — exactly like `.gitignore` excludes files from Git — so they're never uploaded to the daemon or available to `COPY`/`ADD`.

**Problems without it:**
- **Slow builds** — without exclusions, huge directories like **`node_modules`**, `.git` history, and **build outputs** (`target/`, `dist/`) get **uploaded to the daemon on every build**, wasting time and disk even if the Dockerfile never copies them. On a large repo the context can be hundreds of MB.
- **Bloated/broken images** — a `COPY . .` will drag in local `node_modules` (wrong-architecture native modules), local build artifacts, and cruft that shouldn't be in the image, causing subtle "works locally, breaks in container" bugs.
- **Secret leakage** — most dangerous: local **`.env` files, credentials, `.aws/`, private keys, `.git`** can get **copied into the image** and shipped to a registry, leaking secrets. Excluding them is a real security control.

**Syntax** mirrors `.gitignore` (glob patterns, `!` negation). **Always exclude** at minimum: `.git`, `node_modules`, `target/`/`dist/`/`build/`, `*.env` and credential files, and local caches. **Verify the effect** by watching the build output — Docker prints **`Sending build context to Docker daemon <size>`** (or with BuildKit, the transferred-context size); if that number is surprisingly large, your `.dockerignore` is missing something. (Note: even though `COPY` selectivity helps, you still need `.dockerignore` to keep the *context upload* small and to guard against accidental `COPY .`.)

**Key points:**
- Reduces context upload time
- Prevents leaking `.env`/`.git` into images
- Syntax mirrors `.gitignore`
- Required even with BuildKit

---

### 85. BuildKit features

**Frequency:** Low

**Question:** Describe BuildKit and its key features.

**Answer:** **BuildKit** is Docker's **modern build engine** (default in current Docker, replacing the legacy builder). It re-architects the build as a **dependency graph** rather than a linear sequence, unlocking several capabilities:

- **Parallel stage execution** — in a multi-stage build, independent stages build **concurrently** instead of strictly top-to-bottom, cutting build time. BuildKit only runs the stages a target actually needs.
- **Better, smarter caching** — more precise cache invalidation and content-addressable caching than the old builder.
- **Mount types** via `RUN --mount`:
  - **`--mount=type=cache`** — persists a directory (like a package/compiler cache) **across builds** without baking it into the image. E.g., `RUN --mount=type=cache,target=/root/.cache/go-build go build ...` keeps the Go build cache between builds, so recompiles are fast — yet the cache never becomes an image layer.
  - **`--mount=type=secret`** — exposes a secret (e.g., an npm/pip token) to a single `RUN` **without persisting it into any layer**, avoiding the classic mistake of secrets leaking into image history.
  - **`--mount=type=ssh`** — forwards the host SSH agent to a `RUN` (e.g., to `git clone` a private repo) without copying keys into the image.

**Enabling it:** set **`DOCKER_BUILDKIT=1`** (it's the **default** in modern Docker / `docker buildx`), so usually you get it automatically.

**Remote cache** — BuildKit can **export and import cache to/from a registry** with `--cache-to` and `--cache-from`, so **CI runners share build cache** (a fresh CI runner pulls cache from the registry instead of rebuilding from scratch) — huge for pipeline speed where runners are ephemeral.

**Frontend `# syntax=` directive** — the first line `# syntax=docker/dockerfile:1.x` selects a **Dockerfile frontend version**, letting you opt into newer Dockerfile features (like the `--mount` flags above) **independent of your Docker daemon version** — BuildKit pulls the specified frontend image to parse the Dockerfile.

**Key points:**
- Parallel stage execution
- `--mount=type=cache|secret|ssh`
- Remote cache (`--cache-from`, `--cache-to`)
- Frontend syntax via `# syntax=` directive

---

### 86. Buildx multi-arch images

**Frequency:** Low

**Question:** Explain building multi-arch container images with buildx.

**Answer:** Different CPUs need different binaries — an **amd64** (Intel/AMD) image won't run on an **arm64** host and vice versa. **Multi-arch images** let a *single image tag* work on both. You build them with **`docker buildx`** (the BuildKit-powered build command):

```
docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .
```

**What this produces:** a **manifest list** (a.k.a. **OCI image index**) — a small top-level manifest that **references one image per architecture**. So `repo/app:1.0` isn't a single image; it's an index pointing to the amd64 build *and* the arm64 build.

**How consumers use it:** when any host runs `docker pull repo/app:1.0`, the registry/client inspects the manifest list and **automatically selects the variant matching that host's CPU** — arm64 machines get the arm64 image, amd64 machines get amd64, transparently. One tag, right binary everywhere.

**Speed — QEMU vs native builders:** to build for an architecture different from the build host, buildx can use **QEMU emulation** (e.g., emulating arm64 on an amd64 runner) — convenient (works anywhere) but **slow**, since every instruction is emulated. For faster builds, use **native remote builders** — a real arm64 machine builds the arm64 image while an amd64 machine builds amd64 — no emulation. `docker buildx create --use` sets up a builder that can target multiple nodes/platforms.

**Why it matters now:** developers on **Apple Silicon (M-series, arm64)** need arm64 images to run/build locally, while production increasingly runs on **arm64 server chips** (**AWS Graviton, Ampere**) for better price/performance — *and* plenty of infra is still amd64. Publishing multi-arch images means the same tag runs on a developer's Mac, an amd64 CI runner, and Graviton production, with no per-arch juggling. Prefer **native runners over QEMU** when build speed matters.

**Key points:**
- `docker buildx create --use`
- `--platform linux/amd64,linux/arm64`
- Manifest list selects per-arch
- Use native runners over QEMU when possible

---

### 87. Image signing (Cosign, SLSA)

**Frequency:** Low

**Question:** Explain image signing and supply-chain trust with Cosign, SLSA, and attestations.

**Answer:** The goal is **supply-chain integrity** — proving that the image you're about to run is the *exact* artifact your trusted pipeline built, not something tampered with or swapped in a compromised registry.

**Cosign (sigstore project)** — **signs OCI artifacts** (images and other registry artifacts). Two modes: **static keys** (you hold a private key) or, more powerfully, **keyless / OIDC-based** signing — instead of managing long-lived keys, Cosign obtains a **short-lived certificate from Fulcio** tied to an **OIDC identity** (e.g., your GitHub Actions workflow's identity), signs with it, and records the signature in the **Rekor** transparency log. So the signature attests "**this identity** (this CI workflow) built and signed this image," with no key to leak or rotate. **Signatures live alongside the image in the registry** (as related artifacts referencing the image digest) — no separate signature store. You sign the **digest** (`cosign sign image@sha256:...`), not a mutable tag, so the signature is bound to exact content.

**SLSA** (Supply-chain Levels for Software Artifacts) — a **framework defining provenance levels** describing how trustworthy an artifact's build process is. Higher levels demand stronger guarantees; e.g., **SLSA Level 3** requires **non-falsifiable build provenance** — a signed, tamper-resistant record of *how* the artifact was built (source, builder, parameters) produced by a hardened build service, so you can't forge "this came from our pipeline." It gives a ladder for maturing supply-chain security.

**Verify at admission.** Signing is worthless if nothing checks it. Use an **admission-time policy** (**Kyverno**, **Connaisseur**, or sigstore policy-controller) in Kubernetes to **reject any image that isn't signed by a trusted identity** — so an unsigned or wrongly-signed image simply **can't be deployed to the cluster**. This turns "we sign images" into an enforced guarantee.

**Attestations complete the chain.** Beyond a bare signature, attach signed **attestations**: an **SBOM** (Software Bill of Materials — the full list of components/dependencies in the image, enabling "am I affected by CVE-X?" queries) and **build provenance** (the SLSA record of how it was built). Together — signature + SBOM + provenance, all verifiable — you get an end-to-end, auditable chain from source to running container.

**Key points:**
- `cosign sign image@digest`
- Keyless via OIDC + Fulcio
- Verify at admission with policy
- SLSA provenance for build trust

---

### 88. Topology spread constraints

**Frequency:** Low

**Question:** Explain Kubernetes topology spread constraints and why they beat pod anti-affinity for HA spreading.

**Answer:** **Topology spread constraints** control **how evenly pods of a workload are distributed across topology domains** — failure domains like **availability zones, nodes, or racks**. The point is high availability: if all replicas land in one zone and that zone fails, you're fully down. Spreading them ensures a zone/node loss only takes out a fraction of replicas.

```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: {matchLabels: {app: web}}
```

**The three key fields:**
- **`topologyKey`** — the node label defining the domain to spread across (`topology.kubernetes.io/zone` for zones, `kubernetes.io/hostname` for nodes, a custom `rack` label, etc.).
- **`maxSkew`** — the **maximum allowed imbalance** between domains. `maxSkew: 1` means the difference in pod count between the most- and least-populated domain can be at most 1 — i.e., near-perfectly even. A larger skew allows more imbalance.
- **`whenUnsatisfiable`** — what to do if the constraint *can't* be met: **`DoNotSchedule`** (hard — leave the pod **Pending** rather than violate the spread) vs **`ScheduleAnyway`** (soft — the scheduler *prefers* spreading but will place the pod anyway if it can't). Choose hard when balanced spread is a strict HA requirement; soft when availability of *some* placement matters more than perfect balance.

**Why preferred over pod anti-affinity for HA spreading:** **pod anti-affinity** expresses "don't co-locate these pods," but for spreading *many replicas evenly* it's clumsy and **scales poorly** — anti-affinity is essentially binary (avoid/allow) and the scheduler evaluation gets expensive with many pods, and it can't express "balance within a tolerance." Topology spread constraints give **direct, quantitative control** over the *distribution* (via `maxSkew`) with better scheduler performance at scale and finer tuning (hard vs soft, multiple constraints combined). So for "keep my N replicas balanced across zones/nodes," spread constraints are the right, purpose-built tool; anti-affinity is better for simple "never put these two together" rules.

**Key points:**
- `maxSkew` controls imbalance
- `topologyKey`: zone/hostname/rack
- `DoNotSchedule` vs `ScheduleAnyway`
- Better than anti-affinity for many replicas

---

### 89. CNI choices: Calico, Cilium, Flannel

**Frequency:** Low

**Question:** Compare the Kubernetes CNI choices Calico, Cilium, and Flannel, and how you'd choose.

**Answer:** A **CNI (Container Network Interface)** plugin provides pod networking — assigning pod IPs and routing traffic between pods across nodes. The three common choices trade simplicity for features:

**Flannel** — the **simplest**. A basic **VXLAN overlay**: it encapsulates pod traffic in UDP packets tunneled between nodes. Easy to set up and understand, "just works" for basic pod-to-pod connectivity. **Limitations:** it provides **no NetworkPolicy** (no ability to restrict which pods can talk to which — flat, fully-open network) and the overlay adds encapsulation overhead. Good for **dev/learning clusters** or simple setups where you don't need network security or high performance.

**Calico** — the mature, security-focused choice. Can route pod traffic via **BGP without an overlay** (pods get routable IPs advertised between nodes — no encapsulation overhead, better performance and integration with physical networks). Provides full **Kubernetes NetworkPolicy** (and richer Calico policies) for segmentation, and offers an **eBPF dataplane** option for higher performance. The go-to when you need **network policy enforcement** and clean **BGP integration** with existing network infrastructure.

**Cilium** — the modern, **eBPF-native** choice. Built on eBPF (programmable kernel dataplane) it offers: **L3–L7 network policies** (not just IP/port — you can allow/deny at the *HTTP/gRPC/Kafka* level, e.g., "allow GET /api but not DELETE"), **transparent encryption** (WireGuard/IPsec between nodes), a **sidecarless service mesh** (mesh features without injecting Envoy sidecars into every pod — less overhead), and **Hubble** for deep **network observability** (flow-level visibility into what's talking to what). Cilium can even **replace kube-proxy** entirely with eBPF-based service load-balancing.

**How to choose:** **Flannel** for simple dev/test clusters with no policy needs. **Calico** when you want proven **NetworkPolicy + BGP** integration with existing networks and a mature, stable option. **Cilium** for **modern clusters** wanting **L7 policy, built-in observability (Hubble), encryption, mesh, and kube-proxy replacement** — the most feature-rich, at the cost of requiring a recent kernel and more operational sophistication.

**Key points:**
- Flannel: simplest, no policy
- Calico: BGP + NetworkPolicy
- Cilium: eBPF, L7 policy, Hubble
- Cilium can replace kube-proxy

---

### 90. Pod Security Standards

**Frequency:** Low

**Question:** Explain Pod Security Standards, how they replaced PodSecurityPolicy, and when to reach for Kyverno/Gatekeeper.

**Answer:** **Pod Security Standards (PSS)** define **how locked-down a pod must be**, and are the built-in replacement for the old **PodSecurityPolicy (PSP)**, which was **removed in Kubernetes 1.25**. PSP was hard to use correctly (confusing authorization model, easy to misconfigure), so it was replaced by the simpler PSS + **PodSecurity admission controller**.

**The three levels** (increasing strictness):
- **Privileged** — **no restrictions**. Allows everything, including privileged containers, host namespaces, hostPath mounts. For trusted system/infra workloads only.
- **Baseline** — **blocks known privilege-escalation vectors** while staying broadly compatible with common apps. Disallows things like privileged containers, host networking/PID, and dangerous capabilities — a sensible minimum that most normal workloads still satisfy.
- **Restricted** — **heavily hardened**, following pod-hardening best practices: must run as **non-root**, **drop all capabilities**, use **`seccomp: RuntimeDefault`**, disallow privilege escalation, read-only root filesystem encouraged, etc. The target for security-sensitive workloads.

**How you enforce it** — the built-in **PodSecurity admission controller** is configured **per namespace via labels**:

```yaml
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

You can also set `warn` and `audit` modes (to surface violations without blocking, useful for rolling it out gradually). At `enforce`, pods that violate the level are **rejected at admission**.

**When to reach for Kyverno / Gatekeeper (OPA):** PSS gives only **three coarse, fixed levels** — you can't customize the specific rules. When you need **granular or custom policy** beyond that — e.g., "require every pod to have specific labels," "only allow images from our registry," "enforce resource limits," "require particular annotations," or mutate resources — use a **policy engine** like **Kyverno** or **Gatekeeper**. They let you write arbitrary validating/mutating admission policies, so they cover everything PSS can't. Common pattern: PSS `restricted` as the baseline hardening + Kyverno/Gatekeeper for organization-specific rules on top.

**Key points:**
- PSP removed in 1.25; PSS replaces
- Levels: privileged/baseline/restricted
- Enforce via namespace labels
- Combine with Kyverno for custom rules

---

### 91. kubeconfig contexts

**Frequency:** Low

**Question:** Explain kubeconfig and contexts, and practices that prevent wrong-cluster mistakes.

**Answer:** **kubeconfig** (`~/.kube/config`) is the file that tells `kubectl` **which clusters exist, how to authenticate to each, and which one you're currently targeting.** It holds three kinds of entries: **clusters** (API server address + CA cert), **users** (credentials — certs, tokens, exec plugins), and **contexts**.

**A context is a named bundle of (cluster + user + namespace)** — it says "use *this* cluster, as *this* user, defaulting to *this* namespace." You **switch the active context** with `kubectl config use-context prod`, and every subsequent `kubectl` command targets whatever the current context points at. `kubectl config get-contexts` lists them and marks the active one.

**Ergonomic tools:** **`kubectx`** (fast context switching — `kubectx prod`) and **`kubens`** (fast namespace switching — `kubens payments`) make jumping between clusters/namespaces much quicker than the verbose `kubectl config` commands, often with fuzzy selection.

**Preventing destructive wrong-cluster mistakes** — the real danger: you *think* you're in staging but the active context is **prod**, and you run `kubectl delete` or `apply` against production. Guardrails:
- **Prompt indicators** — use **`kube-ps1`** (or a starship/oh-my-zsh segment) to **show the current context and namespace right in your shell prompt**, so prod is always visibly staring at you before you hit Enter. Seeing `(prod:payments)` in the prompt is the cheapest, most effective safeguard.
- **Separate `KUBECONFIG` per environment** — rather than one giant config mixing prod and dev, keep **separate kubeconfig files** and set `KUBECONFIG` per terminal/session (e.g., a dedicated "prod" terminal). This makes it structurally hard to accidentally hit prod from a dev shell.
- Additional practices: use **read-only or scoped credentials** where possible, require an extra confirmation for prod, and avoid leaving a prod context active as your default.

**Key points:**
- Context = cluster + user + namespace
- Use `kubectx`/`kubens` for ergonomics
- Prompt indicators prevent wrong-cluster mistakes
- Split `KUBECONFIG` per env

---

### 92. Ephemeral containers (kubectl debug)

**Frequency:** Low

**Question:** Explain ephemeral containers via `kubectl debug`.

**Answer:** **Ephemeral containers** let you **attach a temporary debug container to an already-running pod, without restarting it**:

```bash
kubectl debug -it pod/foo --image=busybox:1.36 --target=app -- sh
```

**Why it's critical:** the whole point of hardened images is that **distroless / scratch images have no shell** and no debug tools (no `sh`, `curl`, `ps`, `cat`) — great for security, but it means you **can't `kubectl exec` into them to troubleshoot** (there's nothing to exec). Ephemeral containers solve this: you inject a *separate* container (with busybox/your debug toolkit) **into the running pod**, giving you a shell and tools *alongside* the app — crucially **without killing/restarting the pod**, so you can inspect the live, misbehaving instance in place (restarting would destroy the state you're trying to debug).

**`--target` shares the process namespace.** With `--target=app`, the debug container **shares the process (PID) namespace of the `app` container**, so from your debug shell you can **see the app's processes** (`ps` shows them) and read its **`/proc/<pid>/...`** — its open files, environment, memory maps, network state. This lets you debug the *target* container's actual runtime, not just a sibling.

**Limitation — no volumes.** You **cannot mount volumes** into an ephemeral container (they're added to an existing pod spec, which can't gain new volume mounts). So you can inspect processes/filesystem-via-proc but can't, say, mount a new tool volume. For **host-level** inspection (node filesystem, kubelet, container runtime, host processes) use **`kubectl debug node/<node>`**, which launches a privileged pod on the node with the host's filesystem mounted at `/host` — letting you debug the node itself rather than a pod.

**Key points:**
- Add shell to scratch/distroless
- `--target` shares pid/net with main
- Node debug for host-level inspection
- Cannot mount volumes into ephemeral container

---

### 93. Admission controllers

**Frequency:** Low

**Question:** Explain Kubernetes admission controllers, built-in ones, and dynamic policy options.

**Answer:** **Admission controllers** are hooks that **intercept requests to the Kubernetes API server after authentication and authorization but before the object is persisted to etcd** — the last gate that can **reject or modify** a create/update. They come in two kinds, and the order matters: **mutating admission runs first** (it can *change* the object — e.g., inject a sidecar, add default labels, set fields), **then validating admission runs** (it can only *accept or reject* the now-final object). Mutating-before-validating ensures validation sees the object as it will actually be stored.

**Built-in admission controllers** (compiled into the API server) provide core safety nets:
- **LimitRanger** — applies **default requests/limits** to containers that don't specify them, and enforces min/max per the namespace's LimitRange.
- **ResourceQuota** — enforces **namespace-level caps** (total CPU/memory/object counts), rejecting creates that would exceed the quota.
- **PodSecurity** — enforces the **Pod Security Standards** (privileged/baseline/restricted) based on namespace labels.

**Dynamic / custom policy** (for rules Kubernetes doesn't ship): three approaches:
- **ValidatingAdmissionPolicy** — in-tree, **CEL-based** rules defined as Kubernetes resources, evaluated by the API server itself (no external webhook to run/maintain) — great for simple inline checks.
- **Admission webhooks** — the API server calls out to your service to validate/mutate; this is how policy engines plug in.
- **Policy engines** — **Kyverno** (writes policies as **Kubernetes-native YAML** rules — approachable, no new language) vs **OPA Gatekeeper** (writes policies in **Rego**, OPA's language — more powerful/expressive but a steeper learning curve). Both enforce custom org policy like: **only allow-listed image registries**, **required labels/annotations**, **ban privileged pods**, require resource limits, etc.

Together these turn the API server into an enforcement point where organizational rules are guaranteed before anything runs.

**Key points:**
- Mutating runs before validating
- LimitRanger + ResourceQuota for safety nets
- Kyverno (YAML) vs Gatekeeper (Rego)
- CEL ValidatingAdmissionPolicy for inline rules

---

### 94. Matrix builds

**Frequency:** Low

**Question:** Explain matrix builds in CI and their pitfalls.

**Answer:** A **matrix build** runs **the same job across a cross-product of dimensions** — so you test/build against many combinations automatically instead of writing a separate job for each. Common dimensions: **OS**, **language/runtime version**, and **architecture**.

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    node: [18, 20, 22]
```

This expands to **2 × 3 = 6 parallel jobs** (each OS × each Node version), verifying your code works everywhere you support. It's how libraries prove compatibility across versions/platforms.

**Key controls:**
- **`fail-fast: false`** — by default, CI **cancels all remaining matrix jobs the moment one fails** (`fail-fast: true`). Setting it **false** lets **every combination run to completion**, so you see **all** failures at once (e.g., "fails on Node 18 *and* macOS") rather than fixing one, re-running, and discovering the next. Much better for diagnosing multi-dimension issues.
- **`include` / `exclude`** — build a **sparse matrix**: `exclude` removes specific combos that don't make sense (e.g., skip macOS × Node 18), and `include` adds one-off extra combinations (or extra parameters) outside the pure cross-product. This avoids wasting resources on irrelevant combinations and lets you cover a special case without exploding the whole matrix.

**The caution — multiplicative cost:** matrix size is the **product** of all dimensions, so **cost grows multiplicatively**, not additively. Adding a third value to one axis and a new 2-value axis can turn 6 jobs into 18. Each job consumes a runner and CI minutes, so a careless matrix can blow up build time and cost. Keep matrices intentional — test the versions/platforms you actually support, prune the rest with `exclude`, and watch the total job count.

**Key points:**
- Cross-product of dimensions
- `fail-fast: false` to see all results
- `include`/`exclude` for sparse matrices
- Cost grows multiplicatively

---

### 95. Build reproducibility and provenance

**Frequency:** Low

**Question:** Explain build reproducibility and provenance, and how you achieve them.

**Answer:** **Reproducibility** means **the same inputs produce byte-identical outputs** — rebuild from the same source and you get an artifact with the *exact same hash*, every time, on any machine. This is valuable for **verifiability** (anyone can rebuild and confirm the published binary matches the source — no hidden tampering) and for **trustworthy caching/attestation**. Non-reproducible builds embed hidden variability (timestamps, absolute paths, dependency drift) that makes two builds of the *same commit* differ, defeating verification.

**How you achieve reproducibility:**
- **Pin base images by digest** — `FROM alpine@sha256:...` not `FROM alpine:latest`. A tag is mutable (it can point to a new image tomorrow); a **digest** is immutable content, so the base never changes under you.
- **Pin dependencies with lockfiles** — `package-lock.json`, `poetry.lock`, `go.sum`, `Cargo.lock` — so every build resolves to the **exact same dependency versions and hashes**, not "whatever's newest."
- **Fix timestamps with `SOURCE_DATE_EPOCH`** — many tools stamp the *current* build time into outputs, making them differ each build. Setting this standard env var forces a **deterministic, fixed timestamp**, so file mtimes/metadata are reproducible.
- **No network during the build** — disallow fetching anything from the network at build time (beyond pinned, hash-verified inputs), so a moving remote resource can't change the output. Everything the build needs is pinned and vendored.

**Provenance** — the complementary trust artifact: a signed record of **who built what, from where, and how**. Generate **SLSA provenance** as an **in-toto attestation** — a signed statement recording the **source (commit), builder (which CI system/workflow), build parameters, and the resulting artifact's digest**. Then **verify the provenance at deploy/admission time** so that **only artifacts built by your trusted pipeline from trusted source can run** — an attacker can't sneak in an image built elsewhere, because it lacks valid provenance. Reproducibility + provenance together give an auditable, tamper-evident chain from source code to running artifact.

**Key points:**
- Pin base images by digest
- Lockfiles + frozen deps
- SOURCE_DATE_EPOCH for deterministic time
- SLSA provenance for trust chain

---

### 96. Ansible vs Salt vs Chef vs Puppet

**Frequency:** Low

**Question:** Compare Ansible, Salt, Chef, and Puppet, and how immutable infrastructure changed their role.

**Answer:** All four are **configuration-management** tools — they bring servers to a desired state (packages, files, services, users). They differ mainly in **agent model, language, and push vs pull:**

- **Ansible** — **agentless**, working **over SSH** in a **push model** (a control node pushes changes out). Uses **YAML playbooks** (plus Jinja templating). Its huge advantage is **ease of getting started**: nothing to install on targets (just SSH + Python), readable YAML, no agent infrastructure to run. This simplicity made it the **dominant** config-management tool.
- **Salt** — runs via **agents (minions)** talking to a master (or **`salt-ssh`** agentless), also **YAML + Jinja**. Its strength is **speed and an event-driven** architecture (fast messaging, reactive automation) — good for large fleets needing quick, event-triggered actions.
- **Chef** — **agent-based**, **Ruby DSL** ("recipes/cookbooks"), procedural-leaning. Long **enterprise lineage**, powerful but a steeper learning curve (you write Ruby).
- **Puppet** — **agent-based**, **declarative DSL**, pull model (agents periodically fetch and apply desired state). Strong in **large, long-lived enterprise fleets** where continuous convergence to a declared state matters.

**How immutable infrastructure shrank their scope:** the classic use case was **mutating long-lived servers in place** — exactly what config management does. But with **immutable infrastructure** — **containers** and **Packer-baked AMIs/images** — you **don't patch running servers anymore; you build a new image and replace them.** That removes much of the day-to-day "keep this fleet converged" work these tools existed for. So config management's role has **narrowed**: instead of continuously managing running fleets, it's often used to **build the image in the first place** (provisioning the OS layer inside a Packer build or container). **Ansible in particular remains popular** for that **OS-level provisioning** and for the servers/appliances that *aren't* containerized — but the era of large Puppet/Chef fleets converging thousands of mutable servers has receded in favor of immutable, image-based deploys.

**Key points:**
- Ansible: agentless, YAML, push
- Salt: fast, event-driven
- Chef/Puppet: agent-based, long lineage
- Immutable infra reduces config-mgmt scope

---

### 97. Edge / global load balancing

**Frequency:** Low

**Question:** Explain the layered architecture of edge and global load balancing.

**Answer:** Serving users worldwide with low latency and regional resilience requires **several layers of load balancing stacked from the DNS edge down to the cluster**, each solving a different piece:

**1. Anycast DNS (the entry point).** DNS is where a request begins. **Latency/geo-aware DNS** (**Route53 latency-based routing**, **Cloudflare**) resolves a hostname to an IP **based on the user's location/latency**, steering them toward the nearest region. Often served over **anycast** so the DNS resolution itself hits the closest DNS node. This is coarse (DNS-level, cached by TTL) but directs users to the right region.

**2. CDN / edge (TLS termination close to users).** A **CDN/edge network** (**CloudFront, Cloudflare, Fastly**) has **points of presence worldwide** that **terminate TLS close to the user** — the expensive TLS handshake happens at a nearby edge (low RTT) rather than a distant origin, dramatically cutting connection latency. The edge also caches static content and can route dynamic requests back to origin over optimized backbone links.

**3. Regional load balancers.** Within each region, a **regional LB** (**ALB/NLB** on AWS, or GCP's regional LB) **fronts the cluster's ingress** — distributing traffic across the ingress controllers / services / pods in that region, doing health checks and connection distribution at the region level.

**4. Global load balancers (anycast IPs + failover).** A **global LB** (**AWS Global Accelerator**, **GCP Global Load Balancer**) provides **stable anycast IP addresses** that **steer traffic to the nearest healthy region** at the network layer — users connect to one anycast IP and are routed to the closest region over the provider's private backbone. Crucially it enables **automated regional failover**: if a whole region goes unhealthy, the global LB **shifts traffic to the next-nearest healthy region automatically**, without waiting for DNS TTLs to expire (a weakness of DNS-only failover).

**Together:** DNS + CDN/edge get the user to the right region with TLS terminated nearby; regional LBs spread load inside a region; global LBs give anycast entry and fast cross-region failover — delivering both **low latency** (nearest healthy location) and **resilience** (automatic regional failover).

**Key points:**
- DNS + CDN + regional LB layered
- Global LBs offer anycast IPs
- TLS terminated at edge
- Regional failover automated

---

### 98. Tracing sampling strategies

**Frequency:** Low

**Question:** Explain tracing sampling strategies: head-based, tail-based, and adaptive.

**Answer:** In a high-traffic system, storing **every** trace is prohibitively expensive (volume + cost), so you **sample** — keep a subset. The strategies differ in *when* the keep/drop decision is made, which drives what you can keep.

**Head-based sampling** — decide **at the very start of the request**, before you know how it turns out. Typically **probabilistic**: e.g., "keep 1% of traces" (a coin flip at request entry, propagated so the whole trace is consistently kept or dropped). **Pros:** dead simple and cheap — no need to buffer spans, the decision is instant and local. **Con:** because you decide blindly up front, you'll **randomly drop rare but important traces** — an error or a slow request only has a 1% chance of being kept, so you miss most of exactly the traces you'd want to investigate.

**Tail-based sampling** — **collect all spans of a trace first, then decide after seeing the complete trace.** Because you now *know* the outcome, you can apply smart policy: **keep 100% of traces that errored or were slow**, and only **sample the boring successful ones** (say 1%). This is **far more useful** — you retain the traces that matter (errors, latency spikes) while discarding routine noise. **Cost:** the collector must **buffer all spans of every in-flight trace in memory** until the trace completes and the decision is made — significant memory/infrastructure overhead, and complexity coordinating spans that arrive from many services.

**Adaptive sampling** — **dynamically adjusts the sampling rate to hit a target volume/throughput.** Instead of a fixed 1%, it raises or lowers the rate as traffic changes so you land near a desired number of traces/sec (protecting cost and backend capacity during traffic spikes while capturing more during quiet periods).

**Guiding principle: always keep 100% of errors.** However you sample the successful/normal traffic, you should retain **all error traces** (and typically all unusually slow ones) — those are the diagnostically valuable ones. This is precisely why **tail-based** sampling is often preferred despite its cost: only by deciding *after* seeing the trace can you guarantee you keep every error.

**Key points:**
- Head: cheap, may miss errors
- Tail: keep errors/slow, sample rest
- Adaptive: target volume
- Always keep 100% errors

---

### 99. Chaos engineering

**Frequency:** Low

**Question:** Explain chaos engineering: what it is, how it's practiced, and the tooling.

**Answer:** **Chaos engineering** is the practice of **deliberately injecting failures into a (production-like or production) system to verify it's actually resilient** — turning assumptions about fault tolerance into tested facts. You inject faults like **killing pods, adding network latency/packet loss, exhausting CPU/disk, or simulating an entire AZ/region outage**, then observe whether the system copes as designed.

**It's hypothesis-driven, not random flailing.** The discipline is *scientific*: you state a **hypothesis about steady-state behavior**, inject a specific fault, and check whether reality matches. E.g., "**if I kill one pod of this service, traffic should shift to a healthy pod within 5 seconds with no user-visible errors**" — then you kill the pod and measure. If the hypothesis holds, you've validated that resilience mechanism; if not, you've found a real weakness *before* it caused an incident. Randomly breaking things without a hypothesis just creates outages.

**Start small, then expand.** Begin with **small, controlled experiments during business hours** (killing a single pod, adding modest latency) — crucially *during working hours* so the team is watching and can abort if something goes wrong, and with a limited blast radius. As confidence grows, escalate to **"game days"** — planned, larger-scale exercises simulating major failures like **full regional failover**, run as a team to validate DR procedures, runbooks, and human response, not just the software.

**Tooling:** **Chaos Mesh** and **LitmusChaos** (Kubernetes-native chaos platforms — declare experiments as CRDs to kill pods, inject network/IO faults), **Gremlin** (commercial SaaS chaos platform with a broad fault catalog and safety controls), and **AWS Fault Injection Simulator (FIS)** (AWS-native fault injection across EC2/ECS/EKS/RDS, including AZ-outage simulations). The value: it **validates your assumptions about resilience** — confirming failover, retries, timeouts, autoscaling, and redundancy genuinely work — rather than discovering they don't during a real 3am incident.

**Key points:**
- Hypothesis-driven, not random
- Start small, expand to game days
- Tools: Chaos Mesh, Litmus, Gremlin, FIS
- Validates assumptions about resilience

---

### 100. Policy as code (OPA, Kyverno, Conftest)

**Frequency:** Low

**Question:** Explain policy as code, the tooling landscape, and the shift-left principle.

**Answer:** **Policy as code** means **codifying organizational rules as version-controlled, automatically-enforced code** instead of relying on wikis, checklists, and manual review. Typical policies: **"only signed images may run," "every resource must have `team`/`cost-center` labels," "no privileged pods," "no public S3 buckets," "resource limits required."** These get **enforced at two points**: **admission control** (reject non-compliant resources when they hit the Kubernetes API server) and/or **CI** (fail the pipeline before anything is deployed). Enforcement is automatic and consistent — no human has to remember to check.

**The tooling contrast:**
- **OPA / Gatekeeper** — uses **Rego**, OPA's dedicated policy language. Very **powerful and expressive** (arbitrary logic over structured data), but Rego has a **learning curve**. Gatekeeper integrates OPA as a Kubernetes admission controller.
- **Kyverno** — writes policies as **Kubernetes-native YAML** rules. **No new language to learn** (if you know K8s YAML, you can write policies), and it can validate, mutate, and generate resources. More approachable for K8s-centric teams; less general than Rego.
- **Conftest** — runs **OPA/Rego against *any structured file* in CI** — not just live cluster resources. Point it at **Terraform plans, Dockerfiles, Kubernetes manifests, JSON/YAML configs** and it evaluates your policies against them **in the pipeline**. This lets you enforce policy on **IaC and manifests before they're ever applied**.

**Shift-left principle:** catch violations **as early as possible — fail in the PR/CI, not at deploy time (or worse, in production).** Blocking a non-compliant Terraform change in the pull request (via Conftest) gives the developer instant feedback in the context they're working, instead of the change getting rejected later at `apply`/admission (slow feedback) or slipping into prod. It's cheaper and faster to fix at author time.

**Roll out with audit mode first:** before flipping a policy to **enforce** (which *blocks* violations), run it in **audit/warn mode** — it **reports** violations without blocking. This lets you discover how much existing infrastructure would fail, fix it, and avoid suddenly breaking everyone's deploys the day you enable the policy. Audit → fix → enforce is the safe adoption path.

**Key points:**
- Kyverno (YAML) vs OPA/Gatekeeper (Rego)
- Conftest scans IaC/manifests in CI
- Shift-left: fail in PR
- Audit mode before enforce
