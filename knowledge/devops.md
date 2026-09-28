# DevOps Interview Questions

100 high-frequency questions on Docker, Kubernetes, CI/CD, infrastructure-as-code, observability, networking, security, and cloud.

---

### 1. Processes vs threads; explain fork/exec

**Frequency:** High

**Question:** A daemon of yours that forks child processes to run external commands accumulates a pile of `<defunct>` processes in `ps` after a few days; the process table fills up and new `fork()` calls start failing with `EAGAIN: Resource temporarily unavailable`. Walk through processes vs threads, how fork/exec work, why zombies leak, and how you'd diagnose and fix it.

**What it is & why:** `fork()`/`exec()` are the basic Linux combo for spawning a new process and running a new program — a daemon uses them to farm work out to child processes. But if the parent never reaps its exited children, **zombie processes** pile up and exhaust the process table, so eventually you can't `fork` anything new.

**Landing it in this case:** A **process** is an isolated **address space** with its own **PID, file descriptors, and memory**. **Threads** live *inside* a process and **share** its heap, globals, and open FDs — so they're **cheaper to create** and communicate through shared memory, but a bug in one thread (memory corruption) can crash the whole process, whereas processes are isolated (one crashing doesn't touch another). The daemon here uses a multi-process model.

**`fork()`** clones the calling process, producing a **child with a new PID**: memory is **copy-on-write (COW)** — parent and child share the same physical pages read-only, and a page is only *actually* copied when one of them writes to it (so `fork` is cheap until you mutate memory). File descriptors are **duplicated** — the child inherits copies pointing at the same open-file entries (so both can write to an inherited pipe/socket). **`exec()`** **replaces the current process image** — code, heap, stack — with a **new program**, but **keeps the same PID** (and inherited FDs unless marked close-on-exec); it doesn't return on success, the old program is simply gone. **The classic shell pattern** is `fork` → in the **child** call `exec` (to run the command) → the **parent** `wait`s to collect the child's exit status.

The root cause here: **zombies** arise when a parent **fails to reap** a finished child — the child has exited but its exit-status entry lingers in the process table until the parent calls `wait`/`waitpid`. This daemon skips that step, so each spawned command leaks a zombie slot; once you hit `ulimit -u` (per-user process cap) or the system `pid_max`, `fork` returns `EAGAIN`.

**How to diagnose / optimize:**
1. `ps -el | grep -c defunct` or `ps aux | grep 'Z'` to count zombies; `ps -eo pid,ppid,stat,cmd | grep defunct` to find each zombie's **parent PPID** — the buggy process is that parent.
2. Confirm the ceiling: `ulimit -u` (per-user process cap), `cat /proc/sys/kernel/pid_max` (system cap), `ps --no-headers -e | wc -l` (current total).
3. Short-term relief: restart (or signal) the parent — once the parent dies, its zombies are reparented to PID 1 and reaped immediately.
4. Real fix: reap in the daemon with `wait`/`waitpid`, or install a `SIGCHLD` handler looping `waitpid(-1, ..., WNOHANG)`; or `signal(SIGCHLD, SIG_IGN)` to let the kernel auto-reap. Verify with `strace -f -e trace=clone,wait4,execve -p <pid>` whether the parent ever calls wait.

**Common follow-ups / tradeoffs:** Threads share the heap (cheap, not isolated); processes are isolated but costlier to create. COW makes the fork-then-exec pattern nearly zero-copy; `vfork`/`posix_spawn` are leaner variants. Distinguish zombies (Z state — holds a PID slot but no memory) from orphans (parent died first, adopted by PID 1). Long-lived daemons that spawn children must reap them (or handle `SIGCHLD`) or they leak zombie slots.

**Key points:**
- Threads share heap; processes don't and are mutually isolated
- `fork` is COW (cheap until writes); `exec` keeps PID but swaps the binary
- Missing `wait`/`waitpid` → zombies pile up → `fork` returns `EAGAIN`
- Find the zombie's PPID with `ps`; fix by reaping children or handling `SIGCHLD`

---

### 2. cgroups and namespaces

**Frequency:** High

**Question:** A containerized Java service keeps getting OOMKilled in Kubernetes, but the developer insists "my JVM heap is only set to 1G, and the node clearly has 64G." Meanwhile a colleague's process inside a container sees the host's full 64G in `top`. Explain what a container actually is in terms of cgroups/namespaces, why this happens, and how you'd diagnose it.

**What it is & why:** cgroups and namespaces are the two Linux kernel primitives that *together* make a container — **namespaces isolate what a process can *see*** (visibility), **cgroups limit and account for what it can *use*** (resources). Without them there's no isolation and nothing stops one container from hogging the whole machine.

**Landing it in this case:** **A container is just a normal process** with these applied — namespaces so it can't see the host, cgroups so it can't hog resources. There's no "container" object in the kernel; Docker/containerd just set these up around a process.

**Namespaces** give a process its own private view of a global resource; there are 8 types: **PID** (its own process tree — it sees itself as PID 1, can't see host processes), **NET** (own network stack — interfaces, routing, ports), **MNT** (own filesystem mounts), **UTS** (own hostname), **IPC** (own shared-memory/semaphores), **USER** (own UID/GID mapping — root inside can be unprivileged outside), **CGROUP** (own cgroup root view), and **TIME** (own boot/monotonic clock). PID and NET are the most visible in practice.

**cgroups (control groups)** enforce quotas and account usage for **CPU, memory, IO, and pids**. That's exactly what's biting here: K8s writes the container's `limits.memory` into the memory cgroup, and beyond the 1G JVM heap there's Metaspace, thread stacks, off-heap/direct memory, and GC structures. Once the cgroup total exceeds the limit, the kernel's **OOM-killer** terminates a process and Docker/K8s report **OOMKilled** — memory can't be throttled, you either have the bytes or you don't. The colleague sees 64G in `top` because old tools don't read the cgroup limit; they read the host's `/proc/meminfo` directly (that namespace isn't isolated). CPU over-quota behaves differently — it just gets **throttled** and runs slower, never killed.

**How to diagnose / optimize:**
1. `kubectl describe pod` for `Last State: Terminated / Reason: OOMKilled`, and `dmesg | grep -i oom` for the kernel OOM event to confirm which process was killed.
2. Read the real limit: inside the container `cat /sys/fs/cgroup/memory.max` (cgroup v2) or `.../memory/memory.limit_in_bytes` (v1), and compare to the JVM's actual RSS.
3. Fix the JVM: use `-XX:MaxRAMPercentage=75` so it sizes to the cgroup limit (JDK 8u191+/11+ is container-aware by default) — don't just watch the heap; align the CPU/memory the container sees to the cgroup.
4. Check placement: `systemd-cgls` and `cat /proc/self/cgroup` to see which cgroup subtree the process lands in.

**Common follow-ups / tradeoffs:** **cgroup v2** replaced v1's separate per-controller hierarchies with a **single unified tree** under `/sys/fs/cgroup`, fixing inconsistencies and enabling better pressure/PSI metrics — prefer it. `requests` are for scheduling, `limits` for runtime enforcement; K8s and Docker write into cgroup subtrees per pod/container to enforce them. Container-aware runtimes (modern JVM, Node, Go's `GOMAXPROCS`) read the cgroup rather than the host; older programs need the core count/memory passed in manually.

**Key points:**
- Namespaces = visibility isolation; cgroups = quotas + accounting
- 8 namespace types (PID/NET most visible); a container = process + these two
- Memory over cgroup → OOMKilled; CPU over → throttled
- Old tools read host `/proc`; make runtimes container-aware (`MaxRAMPercentage`); inspect with `systemd-cgls`, `cat /proc/self/cgroup`

---

### 3. TCP three-way handshake and TIME_WAIT

**Frequency:** High

**Question:** Your API gateway calling a downstream service intermittently fails at peak with `cannot assign requested address` (ephemeral port exhaustion), and `ss -s` shows tens of thousands of TIME_WAIT sockets. Walk through the TCP handshake/teardown, explain where all that TIME_WAIT comes from, how to diagnose and fix it, and why you can't just turn it off.

**What it is & why:** TCP uses a three-way handshake to set up a reliable bidirectional stream and a four-way teardown to close it; `TIME_WAIT` is a state the side that actively closes holds for a while after the connection ends, to guarantee a clean close and stop old data from bleeding into a new connection. It's a correctness safeguard, not a bug.

**Landing it in this case:** **Setup (three-way handshake):** client sends **SYN** (with its initial sequence number), server replies **SYN-ACK** (acknowledging client's and sending its own seq), client sends **ACK** — the SYN-ACK combines two steps, so it's three packets, not four. **Teardown:** each side independently sends a **FIN** and gets an **ACK** (four packets, since either side can keep sending after the other closes — a "half-close").

The root cause here: the side that **initiates the close** enters `TIME_WAIT` for **2×MSL** (Maximum Segment Lifetime, typically **~60s** total). Two reasons: (1) so **late duplicate segments** from the old connection can't be misinterpreted as belonging to a *new* connection reusing the same 4-tuple (src IP:port, dst IP:port); (2) to ensure the final ACK reaches the peer (if it's lost, the peer resends FIN and this side can re-ACK). The gateway opens a fresh short-lived connection to the downstream per request and closes it immediately; each parks a 4-tuple for ~60s, and under high fan-out that exhausts the local ephemeral ports (`ip_local_port_range`, ~28k by default), so `connect()` returns "cannot assign requested address."

**How to diagnose / optimize:**
1. `ss -tan state time-wait | wc -l` to count them, `ss -s` for the overview; confirm the pile-up is on the **client side** (the active closer).
2. `cat /proc/sys/net/ipv4/ip_local_port_range` for the available ephemeral range; `sysctl net.ipv4.ip_local_port_range` can widen it (relief, not a cure).
3. **The right fix is architectural: connection pooling / keep-alive** — reuse connections instead of churning them, driving down new connections/sec so TIME_WAIT drains on its own.
4. If that's still not enough, tune the kernel: `net.ipv4.tcp_tw_reuse=1` (safely reuses TIME_WAIT ports for *outbound* connections), `SO_REUSEADDR`. **Don't** blindly disable the state or use the deprecated `tcp_tw_recycle` — that reintroduces stale-segment/NAT hazards.

**Common follow-ups / tradeoffs:** TIME_WAIT lands on the active closer, so lots of TIME_WAIT on a *server* usually means the server is closing connections (consider letting the client close instead). Widening the port range only buys time; pooling is the real fix. Piled-up CLOSE_WAIT is a different problem — that's the application forgetting to `close()`.

**Key points:**
- SYN → SYN/ACK → ACK; four-way teardown, active closer enters TIME_WAIT
- TIME_WAIT prevents stale-segment cross-talk and guarantees the final ACK
- Lots of TIME_WAIT = too many short-lived connections → port exhaustion; pool/keep-alive is the cure
- Inspect with `ss -tan state time-wait | wc -l`; use `tcp_tw_reuse` cautiously, don't just disable it

---

### 4. DNS records and TTLs

**Frequency:** High

**Question:** You're cutting production traffic from an old load balancer to a new one, so you change the DNS record — but some users move over while others keep hitting the old LB for hours. You also find you can't put a CNAME on the apex `example.com` pointing at the ELB. Explain DNS record types, how TTL affects a cutover, why this one was slow, and the correct way to do it.

**What it is & why:** DNS resolves names to addresses, with different record types carrying different mappings; **TTL** controls how long resolvers cache an answer — it directly determines how long an IP cutover takes to go fully live, making it the key knob for a painless migration.

**Landing it in this case:** **Record types:** **A** → **IPv4**; **AAAA** → **IPv6**; **CNAME** **aliases** one name to another canonical name (resolvers chase it to the target); **SRV** advertises a **service + port + priority + weight** (service discovery — Kubernetes headless services publish SRV records); **TXT** carries **arbitrary text** for verification and policy (SPF/DKIM email auth, ACME/Let's Encrypt challenges, domain ownership proofs); **MX** routes **mail** to mail servers by priority.

Why the CNAME won't attach: the **apex (`example.com` itself) must carry SOA and NS records** (required for the zone to function), and a CNAME says "this name is *nothing but* an alias — resolve the target instead," so it can't legally coexist with them. That's why you can't `CNAME example.com → elb.aws.com`. Providers work around it with **ALIAS/ANAME** (a synthetic record that resolves the target server-side and returns A records at the apex). Why it was slow: before the cutover the record's TTL was still the default day-or-two, so resolvers/clients everywhere had the old IP cached that long; after you changed the record they had to wait for caches to expire naturally — hence the "half new, half old" split.

**How to diagnose / optimize:**
1. Hours (or a day) *before* the cutover, **drop the TTL** (e.g., to 60s) so caches everywhere expire down to the short window.
2. Verify propagation across resolvers: `dig +short name @8.8.8.8`, `dig name @<authoritative NS>`, confirming the new short TTL is live everywhere.
3. Then **flip the record** — clients pick up the new value within ~60s; use `dig +trace name` end-to-end to confirm it lands on the new LB.
4. Once stable, raise the TTL back up (fewer queries, more resilience). Rollback is symmetric: while TTL is low, revert to the old value for a fast switch-back.

**Common follow-ups / tradeoffs:** **Lower TTL** = fast propagation (good for migration) but more query volume on your authoritative servers and slight latency; **higher TTL** = better caching/resilience but slow to change. Beware that some clients (browsers, JVMs) ignore TTL and cache on their own, so DNS cutover isn't zero-risk — pair it with health checks / active-active for safety.

**Key points:**
- CNAME forbidden at zone apex (use ALIAS/ANAME); headless services use SRV
- TTL sets how fast a cutover takes effect: drop TTL ahead of time
- Lower TTL → wait for propagation → flip record → raise TTL after
- Verify with `dig +trace` / `dig @resolver` for propagation and final target

---

### 5. Image vs container vs layer

**Frequency:** High

**Question:** Someone reports "config files I write into the container vanish whenever it's recreated," and separately you notice a node's disk is filling up with images — even though many of them are built on the same base. Explain the relationship between images, containers, and layers: why the data is lost, why the disk can be shared/saved, and how to diagnose both.

**What it is & why:** An image is an immutable read-only template, a container is a running instance of it with a writable layer added on top, and a layer is a content-addressed filesystem diff. Understanding all three is what lets you explain "why writes in a container aren't persistent" and "why images dedupe to save disk."

**Landing it in this case:** An **image** is an **immutable, content-addressed bundle** of filesystem **layers** plus **metadata** (entrypoint, env, exposed ports, default command) — a frozen snapshot you can ship and reproduce exactly by its digest. A **layer** is a **tarball diff** (a set of filesystem changes) produced by **one build step** — e.g., `RUN apt-get install ...` adds a layer with the new files. Layers are **content-addressed by SHA-256 digest**, so they're **deduplicated across images**: if two images share the same base and the same `apt` layer, that layer is stored on disk once and pulled once — which is exactly why images built on a common base don't double the disk, and why pulling a second image sharing a base is fast (it only fetches layers you don't already have).

Why the data is lost: a **container** is a **running (or stopped) instance** of an image — the kernel takes the image's **read-only layers** and stacks a **thin writable layer** on top (union/overlay filesystem). All runtime changes (writing a file, a log) land in that writable upper layer; the underlying image layers stay untouched and shared across every container from that image. **Delete the container and the writable layer is discarded** — so config written into the container disappears on recreate, and persistence requires a **volume** to store data outside the writable layer.

**How to diagnose / optimize:**
1. Disk: `docker system df` for image/container/volume totals, `docker system df -v` for shareable layers per image, `docker history <image>` for each layer's size and originating instruction.
2. Layer sharing: `docker image inspect <img> --format '{{.RootFS.Layers}}'` and compare two images' layer digests to see which are shared.
3. Persistence: mount changing data with `-v mydata:/path` (named volume) or a bind mount rather than the container's writable layer; confirm with `docker volume ls`.
4. Reclaim disk: `docker image prune` (dangling layers), `docker system prune -a` (careful — removes unused images).

**Common follow-ups / tradeoffs:** Since layers are shared by digest, structuring the Dockerfile so **stable layers come first and shared base images are reused** maximizes cache hits on both build *and* pull — fewer bytes over the wire and less disk used. The writable layer uses copy-on-write, so heavy/frequent writes incur overlay overhead — I/O-heavy data should also go on a volume.

**Key points:**
- Image = read-only layers + config manifest; layers are content-addressed (sha256) and deduped across images
- Container = image + a thin writable layer; delete it and writes are gone — persist with volumes
- Reuse base images to maximize cache hits and save disk / pull time
- Diagnose with `docker system df`, `docker history`, `image inspect` layer comparison

---

### 6. RUN vs CMD vs ENTRYPOINT

**Frequency:** High

**Question:** After deploying your service, every `kubectl rollout restart` or `docker stop` waits the full 30-second grace period before the container is force-killed, and the logs never show "received SIGTERM, shutting down gracefully." You find the Dockerfile uses `CMD myapp --port 8080` (shell form). Explain the difference between RUN/CMD/ENTRYPOINT, why this fails, and how to diagnose and fix it.

**What it is & why:** RUN builds layers at build time; ENTRYPOINT/CMD define what runs when the container starts. Writing them in **exec form** makes your process PID 1 so it receives stop signals directly and can shut down gracefully — otherwise, as here, it gets force-killed at the end of the grace period every time.

**Landing it in this case:** **`RUN`** executes **at build time**, producing a **new image layer** (install packages, compile code, e.g. `RUN apt-get install -y curl`) — nothing to do with what runs at startup. **`ENTRYPOINT`** defines the **executable that always runs** — the fixed "what this container *is*" (`ENTRYPOINT ["nginx"]`). **`CMD`** provides **default arguments** to that entrypoint (or, with no ENTRYPOINT, an easily-overridden **default command**). The idiom is `ENTRYPOINT ["myapp"]` + `CMD ["--port", "8080"]` → runs `myapp --port 8080` by default, but `docker run img --port 9090` swaps just the args while keeping `myapp` fixed. **Overriding at runtime:** appending `docker run image arg1 arg2` **replaces CMD**; `--entrypoint` replaces ENTRYPOINT itself.

The root cause is the shell form: `CMD myapp --port 8080` runs your process as a **child of `/bin/sh -c`**, so **the shell becomes PID 1**. On `docker stop`/K8s termination, `SIGTERM` goes to PID 1 (the shell), which usually **doesn't forward it**, so your app never gets the signal, never shuts down gracefully, and is `SIGKILL`ed after the grace period — exactly the "hangs 30s, no graceful-shutdown log" symptom.

**How to diagnose / optimize:**
1. `docker inspect <img> --format '{{.Config.Entrypoint}} {{.Config.Cmd}}'` to see whether it's wrapped as `/bin/sh -c ...`.
2. Exec into the container and check `ps -ef` or `cat /proc/1/comm` — if PID 1 is `sh` rather than your app, you're hit.
3. Switch to **exec form**: `ENTRYPOINT ["myapp"]` + `CMD ["--port","8080"]` (JSON arrays), making your process PID 1 to receive signals directly and skip the extra shell.
4. If you genuinely need a shell (variable expansion), use a signal-forwarding init (`tini`, `--init`) or `exec` the shell away in the app. Verify: `docker stop` should exit promptly and print graceful-shutdown logs.

**Common follow-ups / tradeoffs:** Exec form doesn't go through a shell, so no variable expansion/globbing (use shell form plus an init when you need them). ENTRYPOINT fixes "what it is," CMD supplies "default how to run it" — together fixed yet overridable. PID 1 also carries the zombie-reaping duty (see the tini question).

**Key points:**
- RUN = build-time layer; ENTRYPOINT = fixed binary; CMD = default args / fallback
- Appended args replace CMD; `--entrypoint` replaces ENTRYPOINT
- Shell form makes sh PID 1 and swallows SIGTERM → no graceful shutdown, force-kill on timeout
- Use exec form (JSON array) so the app is PID 1; diagnose via `/proc/1/comm`

---

### 7. Layer caching ordering

**Frequency:** High

**Question:** The team complains that every CI build takes the full 6 minutes — even a one-line business-logic change re-runs `npm ci`/`go mod download` from scratch. You open the Dockerfile and the first instruction is `COPY . .`. Explain how layer caching works, why it invalidates every time, and how to take builds from minutes to seconds.

**What it is & why:** Dockerfile layer caching reuses previously-built layers keyed by each instruction's inputs; order the instructions well and you skip the expensive dependency install. Order them wrong — like this case, copying source before installing dependencies — and you rebuild everything every time.

**Landing it in this case:** **Each instruction is cached by its inputs.** Docker computes a cache key from the instruction and what it touches (for `COPY`, the checksum of the copied files; for `RUN`, the command string plus prior layers). On rebuild it reuses cached layers while keys match — but **the moment one instruction's key changes, every subsequent layer is invalidated** and rebuilt from there down (each layer depends on the previous layer's state). That's exactly the bug: `COPY . .` first, then install, so any one-character source edit changes the copied-files checksum, busts that layer, and re-runs `npm ci`/`go mod download` every time — 6 wasted minutes.

**The ordering principle: rarely-changing steps first, frequently-changing steps last.** The optimal order:
1. **Base image** (`FROM`) — almost never changes.
2. **System packages** (`RUN apt-get install ...`) — rarely changes.
3. **Dependency manifests** (`COPY package.json package-lock.json ./` or `go.mod go.sum`) — occasionally changes.
4. **Install dependencies** (`RUN npm ci` / `go mod download`) — the expensive step.
5. **Copy source code** (`COPY . .`) — changes on *every* commit.

**How to diagnose / optimize:**
1. Read the build log's `CACHED` markers — the instruction after which `CACHED` stops is where the cache breaks; it's usually the misplaced `COPY . .`.
2. Move the manifest copy earlier: `COPY package.json package-lock.json ./` → `RUN npm ci` → `COPY . .` last. Now a source-only edit keeps the manifest layer *and the install layer* cached and only re-runs the final `COPY . .` — **minutes to seconds**.
3. **Pin the base image by digest** (`FROM node:20@sha256:...`) for reproducibility so a moving tag doesn't silently change the base and bust all caches.
4. Use **BuildKit cache mounts** (`RUN --mount=type=cache,target=/root/.npm npm ci`) to persist package-manager caches *across* builds even when the install layer is invalidated.
5. In CI ensure `DOCKER_BUILDKIT=1` and configure cache import/export (`--cache-from` / registry cache), or every fresh runner starts cold.

**Common follow-ups / tradeoffs:** `.dockerignore` is critical — without it `node_modules`, `.git`, etc. pollute the `COPY . .` checksum and needlessly bust the cache. More aggressive caching is faster but can serve stale dependencies, so security-sensitive builds need a way to force a no-cache rebuild (`--no-cache`).

**Key points:**
- Cache invalidates from the first changed instruction downward
- Copy dependency manifests before source to isolate the expensive install layer
- Find the cache break via `CACHED` in the build log; set up `.dockerignore`
- Pin the base by digest for reproducibility; BuildKit `--mount=type=cache` caches packages across builds

---

### 8. Multi-stage builds

**Frequency:** High

**Question:** A security scan blocks your image: a service that runs a single Go binary ships as an 800MB image, Trivy reports dozens of CVEs, and you find the Go compiler, git, and the whole source tree baked in. Explain multi-stage builds, how they solve both size and attack surface, and how to apply and verify the fix.

**What it is & why:** A multi-stage build uses several `FROM` stages in one Dockerfile — compile in a heavy toolchain image, copy only the artifact into a small runtime image — which is exactly how you fix "the shipped image contains compilers, source, and a pile of CVEs" like this case.

**Landing it in this case:** A multi-stage build uses **multiple `FROM` stages in one Dockerfile**: you build in a **heavy toolchain image** (compilers, dev headers, full SDK) and then **copy only the finished artifacts** into a **small runtime image**, discarding everything else. The build stays hermetic (all in one Dockerfile) while the shipped image is tiny.

```dockerfile
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/app /app
ENTRYPOINT ["/app"]
```

**How it works:** `--from=build` copies artifacts *from* a named earlier stage into the current one. The first stage (500MB+ with the Go toolchain) exists only to produce the `/out/app` binary and is **not part of the final image** — only the last stage ships. So this case's 800MB bloat shrinks to a few MB, with the compiler, git, and source all discarded.

**Why the final image should exclude compilers and sources:** every tool and source file you ship is **attack surface** and a **CVE liability**. A shipped Go compiler, package manager, shell, or source tree gives an attacker tools to exploit and inflates your vulnerability-scan findings — none of it is needed to *run* a compiled static binary. **Combining with distroless** (`gcr.io/distroless/static`) takes this further: the runtime image has **no shell, no package manager, no libc** (for static binaries) — just your binary and its minimal dependencies. This **minimizes attack surface and CVE exposure** dramatically (a distroless image might have zero known CVEs vs dozens in a full `ubuntu` base) and shrinks images from hundreds of MB to a few MB, speeding pulls and deploys.

**How to diagnose / optimize:**
1. Quantify first: `docker images` for size, `docker history <img>` for the biggest layers, `trivy image <img>` to see which packages the CVEs come from (usually the base's libc/toolchain).
2. Convert to the two-stage form above: `FROM golang AS build` to compile → `FROM gcr.io/distroless/static:nonroot` + `COPY --from=build`.
3. Re-scan to verify: `trivy image` CVEs should drop sharply, `docker images` size from hundreds of MB to a few MB.
4. If distroless lacks a shell for debugging, attach a tool-laden debug image via `kubectl debug`/ephemeral containers instead of putting tools back in the runtime image.

**Common follow-ups / tradeoffs:** distroless/scratch have no shell, so `docker exec` won't get you in and debugging is harder — rely on ephemeral containers; dynamically-linked binaries need `distroless/base` (has libc), not `static`. You can `--target build` to build only up to a stage for debugging, and use named stages as test stages.

**Key points:**
- Separate build vs runtime stages; `--from=stage` copies only the artifact
- Final image excludes compilers/sources → attack surface and CVEs drop sharply
- Combine with distroless for minimal CVE surface and a few-MB image
- Quantify with `trivy image` / `docker history`; debug via ephemeral containers

---

### 9. Resource limits and OOM

**Frequency:** High

**Question:** A pod shows two symptoms at once: it's occasionally `OOMKilled` and restarted, and the rest of the time its P99 latency is mysteriously high but it never crashes. The developer suspects a bad node, but other pods on the same node are fine. Explain how container limits are enforced, which symptom maps to memory vs CPU over-limit, and how to tell them apart.

**What it is & why:** Container resource limits are enforced via cgroups to stop a runaway process from starving the whole host. The fundamental distinction — memory over-limit gets you killed, CPU over-limit gets you throttled — is what lets you map each of this case's two symptoms to a cause.

**Landing it in this case:** **Without limits a container can starve the host** — a runaway process consumes all memory or CPU and takes down every other workload on the node. Limits are enforced via **cgroups**: `docker run --memory=512m --cpus=1` writes into the container's memory and CPU cgroups.

**The two limits behave fundamentally differently, matching the two symptoms:**
- **Memory over-limit → the process is KILLED (the occasional OOMKilled).** Memory can't be "throttled" — you either have the bytes or you don't. Exceeding the memory cgroup makes the kernel's **OOM-killer** terminate a process in that cgroup, and Docker/K8s report **`OOMKilled`** — abrupt, no graceful shutdown.
- **CPU over-limit → the process is THROTTLED, not killed (the steady-state high latency).** CPU is time-sliceable, so exceeding the CPU quota just means the kernel **schedules the container less** — slower (higher latency) but still running. You see CPU throttling metrics, not crashes. So "P99 high but never crashes" is usually the CPU limit being hit and triggering throttling.

**In Kubernetes** there are **two knobs**: **`requests`** (what the pod is *guaranteed* — used by the **scheduler** to place it on a node with capacity) and **`limits`** (the hard **cap enforced at runtime** via cgroups). Exceeding the memory limit → OOMKilled and restarted (CrashLoopBackoff if persistent); exceeding the CPU limit → throttled. Requests below limits enable overcommit (nodes packed tighter than the sum of limits).

**How to diagnose / optimize:**
1. OOM side: `kubectl describe pod` for `Last State: Terminated / Reason: OOMKilled`, `dmesg | grep -i oom` for kernel OOM events; raise `limits.memory` or fix the leak, `kubectl top pod` for real usage.
2. Throttle side: inside the container check `cat /sys/fs/cgroup/cpu.stat` for `nr_throttled`/`throttled_time`, or Prometheus `container_cpu_cfs_throttled_periods_total` — high/nonzero means CPU throttling.
3. Fix throttling: raise `limits.cpu`, or drop an over-tight CPU limit (keep only the request) to avoid CFS-quota jitter on bursty services.
4. Use `kubectl top pod`/`kubectl top node` to compare requests to actual usage and calibrate the overcommit ratio.

**Common follow-ups / tradeoffs:** Whether to set a CPU limit at all is debated — a too-tight limit plus CFS gives bursty services "throttled even though cores are idle" latency spikes, so many recommend setting only the request and no CPU limit. A memory limit, however, must be set (to contain OOM blast radius). Requests determine the QoS class and scheduling density.

**Key points:**
- Memory over limit → OOMKill (crash-type symptom); CPU over limit → throttle (high-latency symptom)
- `requests` schedule, `limits` enforce at runtime; requests<limits enables overcommit
- OOM: check `dmesg`/`describe pod`; throttle: check `cpu.stat` `nr_throttled`
- Too-tight CPU limits cause latency spikes — weigh keeping only the request

---

### 10. Pod vs Deployment vs ReplicaSet vs StatefulSet vs DaemonSet vs Job vs CronJob

**Frequency:** High

**Question:** Someone deployed a 3-replica database as a Deployment; after scaling, data gets corrupted, pod names change every time, and recreated pods attach to someone else's volume. Meanwhile another team wants a log collector "one per node" but missed newly added nodes. Compare the main Kubernetes workload resources, say what's wrong with each choice above, what to use, and how to diagnose it.

**What it is & why:** These workload resources form a low-to-high hierarchy, each adding guarantees; picking the right type is how you get semantics like stable identity / per-pod storage / per-node coverage. Both failures here come from stuffing a stateful service into a Deployment and not using a DaemonSet for a per-node agent.

**Landing it in this case:**
- **Pod** — the **smallest deployable unit**: one or more **co-located containers** sharing a network namespace (localhost, one IP) and IPC. You rarely create bare Pods (ephemeral, not self-healing). Sidecars (proxy, log shipper) live in the same pod as the main container.
- **ReplicaSet** — maintains **exactly N identical replicas**, recreating any that die; you almost never manage it directly — it's the mechanism a Deployment drives.
- **Deployment** — manages ReplicaSets for **rolling updates and rollbacks** for **stateless apps** (the default; maxSurge/maxUnavailable, `kubectl rollout undo` to revert). But its pods have **interchangeable identity, no stable names, no stable storage** — which is exactly why the database breaks: on scale, pods are recreated randomly and share one PVC template, corrupting data.
- **StatefulSet** — for **stateful workloads** (databases, Kafka): **stable network identity** (`pod-0`/`pod-1` with sticky DNS), **stable per-pod storage** (each keeps its own PVC across reschedules), and **ordered, sequential** rollout/scaling (pod-0 before pod-1). The database should use this.
- **DaemonSet** — runs **one pod per node** (new nodes get one automatically). The log collector should use this — a Deployment with a replica count silently misses new nodes. For node-level agents: log shippers (Fluent Bit), CNI plugins, node exporters, monitoring agents.
- **Job** — runs pods **to completion** and tracks success; retries on failure.
- **CronJob** — **schedules Jobs on a cron expression** (nightly backups, periodic reports).

**How to diagnose / optimize:**
1. Check ownership: `kubectl get pod <name> -o jsonpath='{.metadata.ownerReferences}'` or `kubectl get all` to see which controller manages a pod — a database pod owned by a ReplicaSet is the wrong choice.
2. Migrate the DB to a StatefulSet: use `volumeClaimTemplates` so each pod gets its own PVC; confirm `kubectl get pvc` shows one per ordinal and stable DNS like `pod-0.svc` resolves.
3. Move the collector to a DaemonSet: `kubectl get ds -A` for `DESIRED/CURRENT` = node count; compare `kubectl get nodes` to confirm new nodes get a pod (tainted nodes need a toleration).
4. **Quick rule:** stateless → Deployment; identity/ordering/per-pod storage → StatefulSet; per-node agent → DaemonSet; one-off or scheduled batch → Job/CronJob.

**Common follow-ups / tradeoffs:** StatefulSets scale slowly (ordered) and don't auto-delete PVCs on removal (to protect data), so they're heavier to operate than Deployments. DaemonSets need tolerations to cover tainted nodes (e.g. the control plane). Bare Pods don't self-heal — always wrap them in a controller in production.

**Key points:**
- Stateless → Deployment; ordered/stable-identity/per-pod storage → StatefulSet
- Per-node agent → DaemonSet (auto-covers new nodes; mind tolerations)
- Batch → Job/CronJob; bare Pods don't self-heal
- Diagnose wrong choices via `ownerReferences` / `get ds` / `get pvc`

---

### 11. Service types

**Frequency:** High

**Question:** You gave every externally-facing microservice its own `type: LoadBalancer`, and at month-end the cloud bill shows a dozen billable ELBs. Separately, a gRPC client keeps hammering the same backend pod, load unevenly distributed. Explain the Service types, how to fix both, and how to debug when traffic doesn't flow.

**What it is & why:** A Service gives a stable endpoint in front of a set of ephemeral pods (selected by labels). Picking the right type both saves you the pile of billable LBs in this case and fixes the "gRPC long-lived connection stuck on one pod" imbalance.

**Landing it in this case:** The types build outward from cluster-internal to externally-exposed:
- **ClusterIP** (default) — a **virtual IP reachable only inside the cluster**; kube-proxy load-balances across matching pods. For internal service-to-service traffic.
- **NodePort** — exposes the service on a **static port (30000–32767) on every node's IP**. Crude external access; mostly a building block for LoadBalancer or bare-metal/dev.
- **LoadBalancer** — **provisions a cloud LB** (AWS ELB, GCP LB) pointing at the NodePorts, giving one external IP/DNS. **Each is a real, billable cloud LB** — that's the bill explosion; in practice you **front many services with one Ingress** sharing a single LB.
- **ExternalName** — returns a **CNAME to an external hostname** (`my-db.example.com`). No proxying, just DNS, to alias an external dependency behind an in-cluster name.
- **Headless** (`clusterIP: None`) — **skips the VIP** and returns the **individual pod IPs** via **DNS A/SRV records**. For clients that need to address specific pods, not a VIP — StatefulSets (stable DNS `pod-0.svc`) and client-side discovery. This is the gRPC fix: gRPC is a long-lived HTTP/2 connection, so once it connects through a ClusterIP it pins to one pod and sends everything there; **Headless + client-side load balancing** (or an L7 proxy/service mesh) spreads the RPCs out.

**How to diagnose / optimize:**
1. LB bill: `kubectl get svc -A | grep LoadBalancer` to count them; consolidate behind one Ingress (`kubectl get ingress`) with ClusterIP backends.
2. gRPC imbalance: `kubectl get endpoints <svc>` confirms multiple pod IPs while monitoring shows one taking all traffic — the classic L4 long-connection problem; switch to Headless for client round-robin, or use an HTTP/2-aware Ingress/mesh.
3. Traffic-not-flowing chain: `kubectl get svc` (ClusterIP/port) → `kubectl get endpoints <svc>` (**empty endpoints = selector matched no pod or pods not Ready**, the most common failure) → `kubectl get pod --show-labels` to check labels → in-cluster `kubectl run tmp --rm -it --image=nicolaka/netshoot -- curl <svc>:<port>` to test.
4. **Rule of thumb:** internal → ClusterIP; public → Ingress in front (avoid bare LoadBalancer); per-pod addressing → Headless.

**Common follow-ups / tradeoffs:** Services reflect Ready pods via endpoints/EndpointSlice — pods failing readiness don't enter endpoints. `externalTrafficPolicy: Local` preserves client source IP but can unbalance load. kube-proxy iptables/IPVS is L4 only; L7 routing / gRPC fan-out needs Ingress or a mesh.

**Key points:**
- ClusterIP in-cluster VIP; NodePort per-node port; LoadBalancer is billable each — consolidate with Ingress
- Headless returns per-pod IPs for StatefulSets and client-side LB (essential for gRPC long connections)
- Empty `endpoints` is the #1 cause of no traffic: check selector/label/readiness
- Debug chain: `get svc` → `get endpoints` → check labels → netshoot test

---

### 12. ConfigMaps vs Secrets

**Frequency:** High

**Question:** A security audit finds an intern with `kubectl get secret -o yaml` access base64-decoded the DB password to plaintext. Worse, you rotated the DB password and updated the Secret, but the pods still use the old one and can't connect. Compare ConfigMaps and Secrets, explain the root cause of both problems, and how to do *real* secret management with hot rotation.

**What it is & why:** ConfigMaps and Secrets are both key/value stores you can mount into pods as env vars or files. Understanding their intent and that Secrets are "just base64, not encryption" is what explains both the leak and the failed rotation here.

**Landing it in this case:**
- **ConfigMaps** hold **non-sensitive configuration** — feature flags, URLs, tuning params.
- **Secrets** hold **credentials** — passwords, tokens, TLS keys. But the critical caveat, and why the intern saw plaintext: **Secrets are only base64-encoded at rest in etcd, not encrypted.** Base64 is *encoding, not security* — anyone who can read etcd (or run `kubectl get secret -o yaml`) sees the value trivially. For real security you must **enable etcd encryption-at-rest backed by a KMS** (AWS KMS, GCP KMS) and lock down RBAC so few can read Secrets.

Root cause of the failed rotation — the **file mount vs env var** operational difference: mounting a ConfigMap/Secret **as a file** lets Kubernetes (via the kubelet) **propagate updates to the mounted file without restarting the pod**, so a rotated credential can be picked up by a file-watching app (or a sidecar reloader signals it). But values injected as **environment variables are captured at container start and never update** — you *must restart the pod*. This case used env var injection, so the pods kept the old password after the Secret changed. **Prefer file mounts** for rotation without downtime.

**How to diagnose / optimize:**
1. Leak side: `kubectl auth can-i get secrets --as=<user> -n <ns>` to audit who can read; tighten RBAC to least privilege; `kubectl get secret <s> -o jsonpath='{.data.password}' | base64 -d` proves base64 isn't encryption.
2. Enable encryption-at-rest: configure `EncryptionConfiguration` with a KMS provider, then `kubectl get secrets -A -o json | kubectl replace -f -` to rewrite existing secrets encrypted.
3. Rotation not taking: check injection — `kubectl get pod <p> -o jsonpath='{.spec.containers[*].env}'`; a `secretKeyRef` means env var (needs restart). Switch to `volumeMounts` file mount + app file-watch, or use a reloader / `kubectl rollout restart`.
4. Verify: after updating the Secret, exec in and `cat /path/to/mounted/secret` to see it change within tens of seconds.

**Common follow-ups / tradeoffs:** subPath mounts do NOT auto-update (a gotcha). Kubernetes Secrets alone aren't a secrets *manager* (no rotation, auditing, or central source of truth) — integrate the **External Secrets Operator** (or Vault Agent / Secrets Store CSI driver) to **sync from Vault / AWS Secrets Manager / GCP Secret Manager** into K8s Secrets, keeping the source of truth in a purpose-built vault with rotation, versioning, and audit logs while pods still consume ordinary Secrets.

**Key points:**
- Secrets are base64, not encrypted by default: use KMS encryption-at-rest + strict RBAC
- env var injection is fixed at start (rotation needs restart); file mounts auto-update (except subPath)
- For zero-downtime rotation prefer file mounts + file-watch/reloader
- Use External Secrets Operator/Vault as the rotating, audited source of truth

---

### 13. Volumes, PVs, PVCs, StorageClasses

**Frequency:** High

**Question:** Two storage incidents: (1) you scaled a service using an EBS (RWO) volume from 1 to 3 replicas and the new pods stick in `ContainerCreating` with a `Multi-Attach error`; (2) someone deleted a PVC by mistake and the underlying cloud disk and its data vanished with it. Explain PV/PVC/StorageClass/access modes/reclaim policies, the root cause of each, and how to diagnose and prevent them.

**What it is & why:** This model **decouples the *request* for storage from the *provisioning* of it**, so app authors don't need to know the underlying tech. Understanding access modes and reclaim policies explains both the "multi-attach failure" and the "delete PVC, lose data" here.

**Landing it in this case:**
- **PersistentVolume (PV)** — a **cluster-scoped resource representing real storage** (EBS, GCE PD, NFS export, Ceph RBD), with a capacity and access mode.
- **PersistentVolumeClaim (PVC)** — a **namespaced *request*** ("I need 20Gi, RWO"). A pod references a PVC, not a PV; Kubernetes **binds** the claim to a matching PV.
- **StorageClass (SC)** — **enables dynamic provisioning**: a PVC that names an SC triggers the class's **CSI driver** to **create a PV on demand** (e.g., call the AWS API to make an EBS volume). The SC parameterizes *how* (disk type, IOPS, zone, encryption).

**Access modes** (key to incident 1):
- **RWO** (ReadWriteOnce) — read-write by **one node** (typical block storage like EBS). Scale to 3 replicas landing on different nodes and the same RWO volume can't attach to multiple nodes at once → `Multi-Attach error`. That's the root cause.
- **ROX** (ReadOnlyMany) — read-only by many nodes.
- **RWX** (ReadWriteMany) — read-write by **many nodes** (needs shared storage like NFS/CephFS — EBS can't). Multi-replica shared writes require RWX.
- **RWOP** (ReadWriteOncePod) — read-write by exactly **one pod** (stricter than RWO).

**Reclaim policies** (key to incident 2 — what happens to the PV when its PVC is deleted):
- **Retain** — keep the volume and data (manual cleanup; safe for important data).
- **Delete** — delete the underlying storage too (convenient for ephemeral/dynamic volumes; **the default for many dynamic SCs**) — which is why deleting the PVC took the cloud disk and data.

**How to diagnose / optimize:**
1. Multi-Attach: `kubectl describe pod` events confirm `Multi-Attach error`; `kubectl get pvc/pv` shows access mode RWO. Fix: use a StatefulSet (per-pod PVC) for database-like workloads instead of sharing one volume, or switch to an RWX SC (EFS/NFS/CephFS) if you truly need shared writes. If it's a rolling-update leftover, wait for the old pod to release the mount (`Recreate` strategy or force-detach).
2. Prevent data loss: set `reclaimPolicy: Retain` on important volumes' SC/PV; PVC finalizers already protect against in-use deletion (`kubernetes.io/pvc-protection`), but rely on Retain + backups as the safety net. Check `kubectl get pv` for the `RECLAIM POLICY` column.
3. General: `kubectl get pvc` for `Bound`; `Pending` usually means no matching PV or provisioning failed — `kubectl describe pvc` for provisioner errors.

**Common follow-ups / tradeoffs:** **CSI drivers** (Container Storage Interface) do the actual provisioning/attaching — pluggable adapters between Kubernetes and each backend. `volumeBindingMode: WaitForFirstConsumer` avoids creating the volume in a zone the pod can't schedule to. RWX shared storage is usually slower and pricier. Use VolumeSnapshot for snapshots.

**Key points:**
- PV cluster resource, PVC namespaced claim; SC enables dynamic provisioning
- Access modes RWO/ROX/RWX/RWOP: RWO across nodes → Multi-Attach error
- Delete reclaim policy takes the data too; use Retain + backups for important volumes
- Diagnose with `describe pod/pvc` events and `get pv` RECLAIM POLICY

---

### 14. Probes: liveness, readiness, startup

**Frequency:** High

**Question:** When peak traffic hits, a service starts **restarting en masse** — the more it restarts the worse it gets, until the whole service melts down. You find its liveness probe hits a `/health` endpoint that queries the database, with `timeoutSeconds: 1`. Explain the three probe types, the root cause of this "restart storm," and how to diagnose and fix it.

**What it is & why:** The three probes answer different health questions with very different failure consequences; misconfiguring them — especially using a dependency-heavy endpoint as liveness — triggers cascading restarts under load that take the service down, exactly as here.

**Landing it in this case:**
- **Readiness probe — "can this pod serve traffic *right now*?"** On failure the pod is **removed from the Service's endpoints** (no traffic) **but NOT killed**; it keeps running and rejoins when it passes. For temporary unreadiness — warming caches, a dependency briefly down, draining before shutdown — and it's what gates traffic during rollouts. The DB check here belongs here.
- **Liveness probe — "is this container *stuck/deadlocked*?"** On failure Kubernetes **restarts the container**. Only for **unrecoverable hangs** a restart would fix, not transient issues.
- **Startup probe — "has this slow-booting app finished starting?"** It **disables liveness and readiness until it passes**, so a 60s-boot app isn't **prematurely killed** by an impatient liveness probe; then normal probes take over.

**Probe mechanisms:** **HTTP** GET (web services — 200 from `/healthz`), **exec** (run a command in the container — for CLIs/no HTTP), **TCP** (just check a port opens), and **gRPC** (native gRPC health checks).

The root cause here is the classic **restart storm**: liveness hits an endpoint doing *real work* (a DB query) with an aggressive `timeoutSeconds: 1`. Under peak load the DB slows, the endpoint takes >1s, liveness times out, Kubernetes restarts the container, which drops in-flight work and worsens load — multiple pods restarting at once form a **cascading loop** that melts down.

**How to diagnose / optimize:**
1. `kubectl get pod` shows `RESTARTS` spiking; `kubectl describe pod` events show `Liveness probe failed` and `Container ... Killed/Restarting`.
2. Confirm the config: `kubectl get pod -o yaml` for `livenessProbe`'s path and `timeoutSeconds`/`failureThreshold` — if it depends on a downstream, that's the bug.
3. Fix: keep liveness **cheap and dependency-free** (`/livez` just proves the process is alive — no DB/downstream checks, those go in readiness/`/readyz`); set **conservative `failureThreshold`/`periodSeconds`/`timeoutSeconds`**; use a **startup probe** for slow boots.
4. Verify: `RESTARTS` drops to zero and, under load, pods only leave endpoints (readiness failing) instead of being killed/restarted.

**Common follow-ups / tradeoffs:** Pointing both liveness and readiness at the same heavy endpoint is an anti-pattern — under load it mistakes "busy" for "dead." Readiness failure is self-protective (pull traffic, wait to recover); liveness failure is the nuclear option (restart). Too-loose probes recover slowly from real deadlocks; too-strict ones false-kill — tune to startup/response characteristics. Graceful shutdown also needs `preStop` + readiness pulling traffic first.

**Key points:**
- Readiness controls Service membership (pull traffic, no kill); Liveness restarts on hang; Startup protects slow boots
- Don't make liveness depend on downstreams / query the DB, or load looks like death → restart-storm meltdown
- Keep liveness cheap and dependency-free with conservative thresholds; put dependency checks in readiness
- Diagnose via `RESTARTS` and `describe pod`'s `Liveness probe failed`

---

### 15. Requests vs limits; QoS classes

**Frequency:** High

**Question:** A latency-sensitive payment service gets evicted by the kubelet under node memory pressure, while a batch job with no resource settings on the same node keeps running fine; also its p99 latency jitters with no clear pattern. Explain requests/limits and the three QoS classes, why it got evicted first, what the jitter is, and how to make it stable.

**What it is & why:** `requests`/`limits` are the two knobs where you declare "guaranteed" and "max" per container; Kubernetes derives a **QoS class** from them that decides **who gets evicted first under node pressure**. Set them wrong and you get this case — the important service kicked first and its latency dragged around by noisy neighbors.

**Landing it in this case:** **`requests`** are what the pod is *guaranteed* and drive **scheduling** — the scheduler places a pod only on a node whose unreserved capacity ≥ its requests (nodes can be overcommitted since requests are usually below limits). **`limits`** are the hard **runtime cap** enforced by cgroups — exceed memory → OOMKilled, exceed CPU → throttled.

**Kubernetes derives a QoS class** that determines eviction priority:
- **Guaranteed** — **every container has requests == limits** for both CPU and memory. Highest priority; "promised these exact resources."
- **Burstable** — **at least one request set** but not Guaranteed (requests < limits, or only some set). Can burst above requests to limits when the node has spare capacity.
- **BestEffort** — **no requests or limits at all**. Uses leftovers; first to go under pressure.

The root cause here: the payment service is **Burstable** (requests < limits) and the batch job is actually BestEffort — but eviction looks at **whether you exceed your requests**. **Eviction order under node pressure** (memory, disk): the kubelet evicts **BestEffort first**, then **Burstable pods exceeding their requests** (the further over, the sooner), **Guaranteed last**. The payment service burst well above its requests, so it sorted ahead of that batch job and got kicked. The p99 jitter comes from CPU: with requests < limits it can *burst*, but on a busy node it hits **CPU throttling surprises** — the source of the tail-latency spikes.

**How to diagnose / optimize:**
1. `kubectl describe pod <name>` shows `Status: Failed / Reason: Evicted`, `Message: The node was low on resource: memory`; `kubectl get pod -o jsonpath='{.status.qosClass}'` confirms Burstable.
2. Compare actual usage to requests via `kubectl top pod` or `container_memory_working_set_bytes` — running chronically above requests explains the early eviction.
3. Check CPU throttling: `container_cpu_cfs_throttled_periods_total / container_cpu_cfs_periods_total` consistently > 0 means CFS throttling, the jitter source.
4. Fix: set the latency-sensitive service to **requests == limits (Guaranteed)** — reserved resources, no throttling variance, highest QoS, evicted last; set requests close to real usage so it stops overrunning.

**Common follow-ups / tradeoffs:** Proper requests protect important pods (Guaranteed evicted last). The cost is lower cluster utilization — Guaranteed resources can't be overcommitted. Exceeding a CPU limit only **throttles** (no OOM); exceeding a memory limit is what triggers OOMKilled. BestEffort saves resources but goes first under pressure — only for interruptible work.

**Key points:**
- requests = scheduling; limits = enforcement
- QoS: Guaranteed > Burstable > BestEffort; BestEffort evicted first; Burstable further over requests evicted sooner
- Set latency-sensitive services to requests == limits for Guaranteed — stability at the cost of utilization
- CPU limits cause throttling (p99 jitter) not OOM; check `container_cpu_cfs_throttled_periods_total`

---

### 16. Affinity, anti-affinity, taints, tolerations, nodeSelectors

**Frequency:** High

**Question:** A single-AZ failure took out all 3 replicas of your web service — turns out they were all scheduled onto the same node in the same AZ. Separately, you tainted your GPU nodes but ordinary pods still occasionally land on them. Explain nodeSelector, affinity/anti-affinity, taints/tolerations, how to spread replicas across AZs, and how to truly reserve GPU nodes for GPU workloads.

**What it is & why:** These are the scheduling constraints that control **where a pod lands**, from simplest to most expressive. Here anti-affinity provides **HA across failure domains** and taints/tolerations **reserve dedicated node pools** — misuse or omission gives you "replicas piled in one place" and "stray pods on dedicated nodes."

**Landing it in this case:**
- **`nodeSelector`** — the **simplest**: a plain **label match**. `nodeSelector: {disktype: ssd}` schedules only onto nodes labeled `disktype=ssd`. Hard requirement, no nuance.
- **Node affinity** — the **expressive** version, with two strengths: **`requiredDuringScheduling...`** (hard — won't schedule if unmet) and **`preferredDuringScheduling...`** (soft — weights the choice but schedules anyway if unmet). Supports operators (`In`, `NotIn`, `Exists`) for expressions like "zone in [us-east-1a, us-east-1b]."
- **Pod affinity / anti-affinity** — schedule relative to **other pods**, not node labels. **Affinity** co-locates (cache pod on the same node/zone as the app it serves, for low latency). **Anti-affinity** spreads (never two replicas of this DB on the same node/zone) — the key **HA** tool, ensuring one node/AZ failure doesn't take out all replicas. Uses `topologyKey` (`kubernetes.io/hostname`, `topology.kubernetes.io/zone`) to define the spread domain.
- **Taints and tolerations** — the *inverse*: a **taint on a node repels** all pods unless they explicitly **tolerate** it. To **reserve dedicated node pools**: taint GPU nodes `nvidia.com/gpu=true:NoSchedule` so only GPU workloads (carrying the matching toleration) land there; taint spot/preemptible nodes for fault-tolerant workloads only. Tolerations don't *attract* — they just *permit* — so pair with node affinity/selector to actively steer pods there.

For the two problems: (1) replicas piled together because there's no **pod anti-affinity** — add `requiredDuringScheduling` anti-affinity with `topologyKey: topology.kubernetes.io/zone` to force the three replicas across AZs (or use `topologySpreadConstraints` for even spread). (2) Stray pods on GPU nodes because **those pods also tolerate the taint** (or were never repelled — a toleration only "permits," it doesn't repel others); check for an overly-broad wildcard toleration and use a more specific taint key.

**How to diagnose / optimize:**
1. `kubectl get pod -o wide` for which nodes/AZs replicas landed on; `kubectl get node --show-labels | grep zone` to confirm nodes have `topology.kubernetes.io/zone` labels (missing labels make anti-affinity a no-op).
2. When replicas aren't spread, `kubectl describe pod` for scheduling events — confirm anti-affinity is `required` and not being ignored as a soft preference.
3. For GPU intrusion: `kubectl describe node <gpu-node>` for `Taints:` actually set; `kubectl get pod <intruder> -o jsonpath='{.spec.tolerations}'` to see if it tolerates the taint.
4. Fix: add required zone-level pod anti-affinity to web for cross-AZ HA; keep the `NoSchedule` taint on GPU nodes and use node affinity/selector to **actively steer** GPU workloads there (tolerations only permit, don't attract).

**Common follow-ups / tradeoffs:** A `required` constraint that can't be met leaves the pod Pending (availability vs strict spread tradeoff); `preferred` is best-effort. Anti-affinity `topologyKey` of hostname is cross-node, zone is cross-AZ. Taint effects: `NoSchedule` (no new pods), `PreferNoSchedule` (avoid if possible), `NoExecute` (also evicts already-running pods).

**Key points:**
- nodeSelector: simple label match; Affinity: required (hard) vs preferred (soft)
- anti-affinity + `topologyKey=zone` = cross-AZ HA — nodes must carry zone labels
- Taints repel; tolerations only permit, don't attract — dedicated nodes still need affinity/selector to steer
- Diagnose placement with `kubectl get pod -o wide`; for broken reservation check taints and the intruder's tolerations

---

### 17. Helm vs Kustomize

**Frequency:** High

**Question:** Your team manages both in-house microservices (dev/staging/prod differ only by replica count and image tag) and a pile of third-party components (Postgres, Prometheus); config is scattered and a prod upgrade recently skipped its DB migration. Should you use Helm or Kustomize, how do you combine them, and how do you roll back a bad upgrade?

**What it is & why:** Both manage Kubernetes manifests but with fundamentally different approaches — Helm is a **templating engine + package manager** for "parameterized packaging and lifecycle," Kustomize is a **template-free overlay** for "one manifest set patched per environment." Pick the wrong tool and you get this case's scatter and skipped upgrade step.

**Landing it in this case:** **Helm** is a **templating engine + package manager**. A **chart** is templated YAML (`{{ .Values.image.tag }}`) plus a **`values.yaml`** of defaults; you install it as a **release** (a named, versioned deployment Helm tracks in-cluster). It adds **hooks** (jobs at install/upgrade/delete phases — e.g. a pre-upgrade DB migration) and **`helm rollback`** to a previous release revision. Power: parameterization and lifecycle; cost: Go-template complexity (whitespace, conditionals, debugging generated YAML).

**Kustomize** is **template-free and overlay-based** — built into `kubectl`. A **`base/`** of plain valid YAML and per-environment **`overlays/`** (dev/staging/prod) that **patch** specific fields (replica count, a label, image tag) via strategic-merge or JSON patches. No templating language — everything is real, readable YAML; cost: weaker at heavy parameterization or packaging.

Applied here: the in-house services differing only by replicas/image tag are Kustomize's sweet spot — one `base/` plus three `overlays/`; the third-party Postgres/Prometheus use **Helm charts** for versioned, parameterized installable units. The skipped DB migration happened because that step wasn't wired into Helm's **pre-upgrade hook** — define the migration Job as a pre-upgrade hook and Helm runs it before applying the new version.

**How to diagnose / optimize:**
1. On a bad upgrade, inspect the render first: `helm template <chart> -f values-prod.yaml` or `kustomize build overlays/prod` to print the final YAML — don't guess at templates.
2. Helm upgrade failed or migration skipped: `helm history <release>` for revisions, `helm rollback <release> <revision>` to the last good one; move the migration into a `pre-upgrade` hook so it runs first next time.
3. Kustomize patch not applying: `kubectl diff -k overlays/prod` to see what it'll change and confirm the patch hit the target field.
4. GitOps: **Argo CD supports both natively** — choose Helm or Kustomize per app so each uses the best fit.

**Common follow-ups / tradeoffs:** Helm's strength is parameterization and lifecycle (hooks, rollback, release revisions) at the cost of hard-to-debug Go templates; Kustomize's is readable real YAML at the cost of weaker parameterization/packaging. **Combine them**: many teams run **Kustomize *over* Helm output** — Kustomize's `helmCharts` field renders a vendor chart, then applies Kustomize patches on top, getting the vendor's packaging *plus* clean template-free overrides.

**Key points:**
- Helm: templates + package mgmt (hooks, rollback, releases) — good for third-party/vendor software
- Kustomize: overlays + patches, no templates — good for first-party apps with light env differences
- Skipped upgrade steps → Helm pre-upgrade hook; failures → `helm rollback`; verify renders with `helm template`/`kustomize build`
- Can hybridize (Kustomize over Helm output); Argo CD supports both natively

---

### 18. Blue/green and canary (Argo Rollouts, Flagger)

**Frequency:** High

**Question:** Last time a version that "looked fine" was pushed to all users at once; 10 minutes later the error rate hit 8%, and rolling back took half an hour of re-deploying — a costly outage. The boss now wants "a bad version to hit only a handful of people, with an automatic brake." Compare blue/green and canary, and how do you do automated canary analysis and auto-rollback with tools?

**What it is & why:** Blue/green and canary are both strategies to **release a new version with low risk** — precisely to avoid this case's "full-fleet failure + slow rollback." Blue/green trades double resources for instant rollback; canary limits the **blast radius** of a bad release to a small slice of traffic via gradual ramp-up.

**Landing it in this case:** Both are low-risk release strategies, trading off differently.

**Blue/green** runs **two full environments**: **blue** (current) and **green** (new). You deploy the new version to green, smoke-test it while all real traffic still goes to blue, then **flip the Service selector** (or LB) to point at green — an **instant, atomic cutover**. **Rollback is instant too**: flip back to blue. Pros: no mixed-version state, fast rollback. Cons: **2× resources** during the switch, and the cutover is all-or-nothing (a bug hits 100% of users the instant you flip).

**Canary** shifts a **small percentage of traffic** (say 5%) to the new version, **watches metrics**, and if healthy **ramps** progressively (5% → 25% → 50% → 100%). Pros: limits blast radius — a bad release only affects the canary slice — and you validate against *real* production traffic gradually. Cons: you run **mixed versions** simultaneously (must be compatible), and it's slower.

Applied here: "hit only a handful" means **canary** (start at 5%, not 100%); "automatic brake" means replacing manual promotion with automated analysis gating.

**How to diagnose / optimize:**
1. Watch the canary during rollout: `kubectl argo rollouts get rollout <name> --watch` shows the current weight and each step's analysis result (Successful/Failed/Inconclusive).
2. If the canary auto-rolls-back, see why the analysis failed: inspect its Prometheus query (e.g. error rate `rate(http_requests_total{status=~"5..",version="canary"}[5m])`) against the threshold to tell a real regression from a misconfigured threshold/query.
3. Set thresholds off your SLO — e.g. fail if error rate > 1% or p99 > 500ms — not too loose (lets bad versions pass) nor too tight (false-kills good ones).
4. Blue/green rollback: `kubectl argo rollouts undo <name>` or flip back to the last stable revision — the selector flip takes effect instantly.

**Automation — Argo Rollouts and Flagger:** manually watching dashboards and clicking "promote" doesn't scale, so these tools automate it. You define a **Rollout** with **steps** (`setWeight: 10`, `pause`, `setWeight: 50`, ...) and **analysis templates** that **query Prometheus/Datadog** for **error rate, latency (p99), or success rate** at each step. If metrics stay within thresholds, the tool **auto-promotes**; if a metric **regresses past the threshold**, it **automatically rolls back** — no human in the loop. **Argo Rollouts** does this via a Rollout CRD (replacing Deployment); **Flagger** is a controller that drives traffic splitting on top of a service mesh or ingress.

**Common follow-ups / tradeoffs:** Blue/green rolls back fast but needs 2× resources and switches all-at-once; canary saves resources and limits blast radius but is slower and runs mixed versions (new and old must be forward/backward compatible, especially DB schema). Canary analysis needs **enough traffic samples** to be statistically meaningful — low-traffic services may stay inconclusive.

**Key points:**
- Blue/green: instant selector flip, seconds to roll back, at 2× resources and all-or-nothing
- Canary: gradual percentage ramp (5%→25%→50%→100%) limits blast radius, needs mixed-version compatibility
- Prometheus/Datadog analysis gates promotion; regression past SLO-based thresholds auto-rolls-back
- Argo Rollouts CRD or Flagger controller; `kubectl argo rollouts` to watch and undo

---

### 19. RBAC: Role vs ClusterRole

**Frequency:** High

**Question:** A security audit finds that an app which only needs to read one ConfigMap in its own namespace has its ServiceAccount bound to `cluster-admin` — meaning if that pod is compromised, the attacker owns the whole cluster. Explain RBAC (Role vs ClusterRole, bindings), how to scope it down to least privilege, and how to verify.

**What it is & why:** RBAC (Role-Based Access Control) governs **who can do what to which resources**. It's the core mechanism preventing "one compromised pod = whole cluster compromised" here — use **least privilege** to pin each ServiceAccount to exactly what it needs. It has two halves: **roles** (a set of permissions) and **bindings** (which subjects get a role).

**Landing it in this case:**

**Role vs ClusterRole — scope is the difference:**
- A **Role** grants permissions **within a single namespace** — e.g. "get/list/watch pods in the `payments` namespace."
- A **ClusterRole** is **cluster-wide** — either for cluster-scoped resources (nodes, PVs, namespaces themselves) or as a **reusable template** you can bind per-namespace. It's how you grant access to non-namespaced things or define a role once and apply it in many namespaces.

**Bindings link subjects to roles:**
- A **RoleBinding** grants a Role (or ClusterRole scoped to that namespace) to **subjects** — a **user, group, or ServiceAccount** — **within one namespace**.
- A **ClusterRoleBinding** grants a ClusterRole **cluster-wide** to subjects. (Subjects are users/groups from the auth layer, or ServiceAccounts that pods run as.)

The fix here: this app only reads one ConfigMap, so it needs just a **namespaced Role** (`get` on that single ConfigMap) plus a **RoleBinding** — never a ClusterRoleBinding to `cluster-admin`.

**How to diagnose / optimize:**
1. Map the status quo: `kubectl auth can-i --list --as=system:serviceaccount:<ns>:<sa>` dumps *everything* this SA can do — you'll see `*/*` full access.
2. Find the over-grant: `kubectl get clusterrolebinding -o wide | grep <sa>` to locate the ClusterRoleBinding to cluster-admin.
3. Scope down: delete the over-grant, give the app a **dedicated ServiceAccount**, and bind it to a Role limited to **exactly the verbs and resources it needs** (e.g. only `get` on that ConfigMap) via a namespace RoleBinding.
4. Verify: `kubectl auth can-i get configmap/<name> --as=system:serviceaccount:<ns>:<sa>` (should be yes) and `kubectl auth can-i get secret --as=...` (should be no).
5. Most apps need *no* Kubernetes API access — in that case set `automountServiceAccountToken: false` to not even hand them a token.

**Common follow-ups / tradeoffs:** Don't bind apps to `cluster-admin` (a common lazy mistake giving a compromised pod the whole cluster). Subjects are users/groups from the auth layer or the ServiceAccount a pod runs as — RBAC handles authorization, not authentication. A ClusterRole works both for cluster-scoped resources and as a cross-namespace reusable template (scoped to one namespace when bound with a RoleBinding). Periodic `kubectl auth can-i --list` audits are key to catching permission creep.

**Key points:**
- Role: namespaced; ClusterRole: cluster-scoped resources or cross-namespace template
- Bind to user/group/SA: RoleBinding (in-namespace) vs ClusterRoleBinding (cluster-wide)
- Least privilege: dedicated SA + a just-enough Role, no cluster-admin, disable token mount if no API needed
- Audit and verify with `kubectl auth can-i [--list] --as=...`

---

### 20. Pod Pending diagnostic checklist

**Frequency:** High

**Question:** You just `kubectl apply`d a new version but the pod is stuck in `Pending` and the service won't come up. You have no other clues — walk through your diagnostic checklist: what could cause it, how to confirm each, and how to fix.

**What it is & why:** `Pending` means the pod is **accepted but not yet running** — almost always the **scheduler can't place it** or a dependency (volume, image) isn't ready. Knowing the Pending checklist is what turns "the service won't come up" from a black box into a root cause found in minutes.

**Landing it in this case:** **Start with `kubectl describe pod <name>`** and read the **Events** section at the bottom — it usually states the exact reason (e.g. `0/5 nodes are available: insufficient cpu`). Then work through the common causes:
1. **Insufficient CPU/memory** — no node has enough **unreserved capacity to satisfy the pod's `requests`**. Event: `Insufficient cpu`/`Insufficient memory`. Fix: lower requests, add nodes, or check the cluster autoscaler (below).
2. **Unsatisfiable placement constraints** — a **`nodeSelector`, node affinity, or taint** no node matches/tolerates. Event: `node(s) didn't match node selector` or `had taint {...} that the pod didn't tolerate`. Fix the selector or add a toleration.
3. **Unbound PVC** — the pod needs a volume but the **PVC won't bind** (no matching StorageClass, provisioner error, exhausted storage quota). `kubectl describe pvc` reveals the provisioner error.
4. **Image / ServiceAccount issues** — image pull problems or a **missing ServiceAccount** referenced by the pod can block startup.
5. **ResourceQuota** — the namespace's **quota is exhausted**, so admission blocks new pods. Event: `exceeded quota`.

**How to diagnose / optimize:**
1. `kubectl describe pod <name>` → read the bottom **Events** — usually the exact reason, matching one of the five categories above.
2. If capacity: `kubectl top node`, `kubectl describe node` for allocated vs allocatable per node, compared to the pod's requests — is it genuinely too big or are requests set too high?
3. If PVC: `kubectl get pvc`, `kubectl describe pvc <name>` for `Pending`, the provisioner error, and whether the StorageClass exists.
4. **Also check the cluster autoscaler:** if requests can't fit but the cluster *should* grow, inspect the **autoscaler events/logs** for **scale-up failures** (hit max node count, no matching instance type, cloud quota exceeded, or the pod is unschedulable on *any* possible node so the autoscaler won't even try).

**Common follow-ups / tradeoffs:** Distinguish Pending (can't schedule / dependency not ready) from ContainerCreating (scheduled, pulling image / mounting volume) and CrashLoopBackOff (running but repeatedly crashing) — different phases. Constraint problems (nodeSelector/taint) trade placement flexibility against isolation needs — too loose loses dedicated-node isolation, too tight causes Pending. Over-large requests waste and cause Pending; too small don't protect the service.

**Key points:**
- Read `kubectl describe pod` Events first — usually gives the reason directly
- Check requests vs node capacity (`kubectl top/describe node`)
- Verify the PVC is bound and the StorageClass exists
- Inspect autoscaler logs for scale-up failures (max nodes, no matching instance, cloud quota, never triggered)

---

### 21. CrashLoopBackOff checklist

**Frequency:** High

**Question:** A newly-shipped service is stuck in `CrashLoopBackOff`; in `kubectl get pod` the restart count ticks up every few minutes with growing intervals. What does it actually mean, and how do you step through finding why it keeps dying and fix it?

**What it is & why:** `CrashLoopBackOff` means the container **starts, exits, and Kubernetes restarts it — repeatedly** — with **exponentially increasing backoff** (10s, 20s, 40s… up to 5min) to avoid hammering the node. The key insight: the state itself isn't the bug, it's a *symptom* that the process keeps dying — you're hunting the real reason it exits.

**Landing it in this case:** Investigate systematically:
1. **`kubectl logs <pod> --previous`** — the most important step. The current container may have *just* started, so `--previous` shows the **crashed prior instance's** logs — usually the actual error (stack trace, "connection refused," "missing env var").
2. **`kubectl describe pod`** — read the **exit code** and last state. **Exit 0** = app finished and exited (maybe not a long-running process, or a misconfigured command). **Exit 137** = SIGKILL, typically **OOMKilled** (check the reason). **Exit 1/2** = app error. Non-zero generally = crash.
3. **Check command/args and config** — wrong `command`/`args`, a **missing env var or Secret** needed at boot, or a bad config file. Also check **init containers separately** (`kubectl logs <pod> -c <init>`) — a **failing migration or setup init container** blocks the main container and looks like a crash loop.
4. **OOMKilled / resource issues** — exit 137 with `OOMKilled` means the memory limit is too low or there's a leak (see the OOM question).
5. **Rule out an overly aggressive liveness probe** — a **liveness probe failing during slow startup** makes Kubernetes kill and restart a container that was actually fine, masquerading as a crash. If logs show the app was *starting up* when killed, the fix is a **startup probe** or looser liveness thresholds, not the app.

**How to diagnose / optimize:**
1. `kubectl logs <pod> --previous` for the crashed instance's real error (usually obvious it's a missing env var or an unreachable dependency).
2. No logs? `kubectl describe pod` for the exit code — **137** → check OOMKilled, **0** → command/entrypoint misconfigured or not a long-running process, **1/2** → app-level error.
3. `kubectl logs <pod> -c <init>` to rule out init containers (migration/setup failures).
4. If logs show "killed while still starting up," it's an over-aggressive liveness probe — add a **startup probe** or loosen thresholds.

**Common follow-ups / tradeoffs:** Backoff grows exponentially (up to 5min) to protect the node, so lengthening restart intervals is normal, not improvement. Distinguish "app truly crashes" (fix code/config) from "probe false-kills" (fix the probe, not the app) — the latter is commonly misdiagnosed. Exit 0 also enters CrashLoop because K8s expects a long-running process not to exit.

**Key points:**
- `kubectl logs --previous` for the prior crashed instance — the critical step
- `describe` exit code: 137→OOM, 0→command misconfig/not long-running, 1/2→app error
- Check init containers separately (`-c <init>`) — migration/setup failures masquerade as crash loops
- Rule out an over-aggressive liveness probe false-killing it; use a startup probe or looser thresholds

---

### 22. OOMKilled

**Frequency:** High

**Question:** A Java service reliably gets `OOMKilled` and restarted a few hours after starting. The developer says "I set `-Xmx` to only 1G and the container limit is 2G — how can it overrun?" Explain what OOMKilled is, why this JVM case overruns, how to tell under-provisioning from a leak, and how to fix it.

**What it is & why:** `OOMKilled` means the container **exceeded its memory limit** and the kernel's **OOM (out-of-memory) killer terminated it** — memory can't be throttled, so the kernel's only option is to kill. Understanding it distinguishes this case's two very different causes: under-provisioning (raise the limit) vs a leak (raising the limit just delays it), plus the JVM-specific cgroup-awareness gotcha. `kubectl describe pod` shows **`Reason: OOMKilled`** and **`Exit Code: 137`** (128 + signal 9/SIGKILL).

**Landing it in this case:** "Heap 1G, limit 2G, still killed" is usually two things compounding. First, **JVM/Node need explicit heap flags to be cgroup-aware**: runtimes with managed heaps don't automatically respect the cgroup memory limit (older versions size the heap to the *host's* total RAM). But even with the heap pinned at 1G, the JVM's **non-heap memory** (thread stacks, Metaspace, native buffers, GC structures) also consumes RAM — 1G heap + non-heap easily hits the 2G limit. Second, if memory **grows unboundedly** before the kill (and "after a few hours" fits), it's a real **leak**.

**Two fundamentally different fixes — decide which:**
- **Raise `limits.memory`** — correct if the app **legitimately needs more** than allocated (under-provisioned). Measure real usage first.
- **Profile and fix a leak** — correct if usage **grows unboundedly** over time. Bumping the limit just delays the OOM. Use `kubectl top pod` for a quick view, then real profiling: **pprof** (Go), **heap dumps** (Java), **`--inspect`/heap snapshots** (Node).

**Gotcha — JVM/Node heap flags:** **set the heap explicitly *below* the cgroup limit**, leaving headroom for non-heap memory (stacks, metaspace, native buffers): `-Xmx` (JVM) or `--max-old-space-size` (Node) at ~70–80% of the container limit. Modern JVMs also support `-XX:MaxRAMPercentage` to size relative to the cgroup limit.

**How to diagnose / optimize:**
1. `kubectl describe pod` confirms `Reason: OOMKilled` / `Exit Code: 137`; `dmesg | grep -i oom` for the kernel OOM event and which process was killed.
2. Under-provision vs leak: look at the `container_memory_working_set_bytes` curve — **sawtooth plateau at the ceiling** = under-provisioned (raise limit); **steady climb, never drops** = leak (go profile).
3. JVM case: measure total including off-heap; align `-Xmx` or `-XX:MaxRAMPercentage=75` to the cgroup (leave 20–30% for non-heap); confirm a modern JVM (JDK 8u191+/11+) is container-aware.
4. Confirmed leak: capture a heap dump (Java `jmap`), pprof (Go), or heap snapshot (Node) to find the growing objects before fixing code.
5. **Monitor `container_memory_working_set_bytes`** (not RSS — working set is what the OOM-killer watches) against the limit, and **alert before** 100% to catch creep before the kill.

**Common follow-ups / tradeoffs:** Memory can't be throttled like CPU, so over-limit means kill (vs CPU over-limit only throttling). Raising the limit is futile for a leak (just delays the next OOM) but correct for genuine under-provisioning — diagnose the nature first. A JVM heap set too close to the limit gets killed by non-heap overflow; too low wastes RAM and GCs constantly — 70–80% is the common compromise.

**Key points:**
- Exit 137 + `Reason: OOMKilled` = over memory limit, SIGKILL'd; memory can't be throttled, only killed
- Diagnose under-provision (plateau at ceiling → raise limit) vs leak (steady climb → profile and fix)
- Set JVM/Node heap below the cgroup limit (~70–80%), or use `-XX:MaxRAMPercentage`
- Monitor `container_memory_working_set_bytes`, alert before hitting the ceiling

---

### 23. CI vs CD vs continuous deployment

**Frequency:** High

**Question:** Your team batches two weeks of changes into a painful "release day" — lots of merge conflicts, frequent production incidents — and management asks "can we ship every commit to prod automatically like the big companies?" Distinguish CI, Continuous Delivery, and Continuous Deployment: where are you now, and what's missing before you can auto-ship to prod?

**What it is & why:** These three often-conflated practices form a **maturity ladder** — sorting them out is how you answer "where are we and what to add next," rather than blindly chasing "auto-ship every commit" without a safety net.

**Landing it in this case:**
- **Continuous Integration (CI)** — developers **integrate to mainline frequently** (many times a day) and **every commit triggers an automated build + test**. Goal: catch integration problems early instead of a painful "merge day." Purely about **build and test**, nothing about deploying.
- **Continuous Delivery** — **every green build is *deployable* to production** (packaged, tested through staging, ready) but a **human clicks "approve"** to release. You *could* ship any commit anytime; you *choose* when. Adds deployment automation and staging gates on top of CI, keeping the codebase always shippable.
- **Continuous Deployment** — **every green build is *automatically* deployed to production** with **no manual gate**. Commit → test → prod, untouched by humans. The fully automated end state.

Applied here: batching two weeks with frequent merge conflicts means the team **hasn't nailed CI yet** — the first step isn't racing to auto-prod, it's getting developers to merge to mainline many times a day with per-commit build+test to kill the "release day." **The ladder is CI → Continuous Delivery → Continuous Deployment**, climbed as safety nets mature — you can't skip rungs.

**How to diagnose / optimize:**
1. Assess the current rung: does every commit auto-build+test? No → stand up CI first (frequent mainline integration, PR-triggered pipeline).
2. Add Continuous Delivery: **deployment automation + a staging environment + smoke/e2e tests** so any green build is one-click shippable, keeping the manual approval gate.
3. To reach Continuous Deployment (auto-prod), first satisfy the prerequisites — don't remove the human gate without:
   - **Strong automated tests** (unit, integration, end-to-end — high confidence a green build is safe);
   - **Solid observability** (metrics/alerts detecting a bad release in minutes);
   - **Fast, automated rollback** (or progressive delivery like canary + auto-rollback) to contain and revert a bad deploy quickly.
4. Only then remove the gate — it dramatically shortens lead time and shrinks each change's blast radius; without these, auto-shipping every commit is reckless.

**Common follow-ups / tradeoffs:** Removing the human gate means **automation must catch everything a human would** — with weak test coverage/observability the manual gate is a necessary safety valve. Continuous Deployment shortens lead time and shrinks per-change blast radius (small, frequent releases) but demands mature culture and tooling. Don't conflate Continuous Delivery and Deployment — the difference is exactly that manual approval gate.

**Key points:**
- CI = frequent integration + per-commit automated build/test (build/test only, not deploy)
- Continuous Delivery = every green build always shippable, human clicks approve
- Continuous Deployment = green build auto-ships to prod, no manual gate
- Climb CI→Delivery→Deployment in order; auto-deploy requires strong tests + observability + safe rollback

---

### 24. GitOps (Argo CD, Flux)

**Frequency:** High

**Question:** A postmortem finds someone `kubectl edit`'d a production Deployment to firefight, but nobody remembers what they changed and there's no audit trail; also your CI system holds admin credentials for every cluster, which the security team flags as a huge risk. Explain how GitOps (Argo CD, Flux) fixes both, and why the pull model matters.

**What it is & why:** **GitOps** makes **Git the single source of truth** for your cluster's *desired state* — exactly to cure this case's two pains: unaudited hand-edits (changes with no Git record, no traceable rollback) and CI holding cluster credentials (the push model's security risk). You commit manifests (or Helm/Kustomize) to a repo; a **controller in the cluster** (Argo CD, Flux) **continuously reconciles** actual state to match Git, alerting or auto-correcting on divergence. You don't `kubectl apply` from a laptop or CI; **you `git push`, and the cluster converges.**

**Landing it in this case:**

**Why pull-based matters (fixes the CI credential risk):** traditional CI **pushes** to the cluster, so the **CI system must hold cluster admin credentials** — a big attack surface (compromise CI → compromise every reachable cluster). In GitOps the **cluster pulls** from Git: the controller runs *inside* the cluster and reaches *out* to the repo, so **no inbound credentials** are needed and write access stays internal. It also works cleanly for clusters behind firewalls with no inbound access.

**Benefits (fix the unaudited hand-edit):**
- **Audit trail** — every change is a **Git commit** with author, timestamp, review, and diff. Deployment history *is* Git history.
- **Rollback = `git revert`** — revert the commit and the controller reconciles back. No special tooling.
- **Drift detection** — if someone hand-edits the cluster (`kubectl edit`, as here), the controller **detects the divergence** from Git and flags (or reverts) it, so the cluster can't silently drift.
- **Multi-cluster fanout** — one repo drives many clusters consistently.

**How to diagnose / optimize:** For the hand-edit incident:
1. Check app status in Argo CD: `argocd app get <app>` showing **`OutOfSync`** means someone hand-edited and the cluster diverged from Git.
2. See exactly what drifted: `argocd app diff <app>` (or the UI diff) field-by-field, actual vs declared — this recovers the "nobody remembers what changed."
3. Decide direction: to restore the declared state → `argocd app sync <app>`; to keep the change → commit it properly into Git via PR.
4. Prevent recurrence: enable **self-heal / auto-sync** so drift is auto-reverted; change the emergency process to "edit Git → PR" so `git revert` is the standard rollback.

**Pair with an image updater:** since Git is the source of truth, a CI-built image must get its tag **into Git** to deploy. An **image updater** (Argo CD Image Updater, Flux's image automation) watches the registry and **commits the new tag back to the repo**, closing the loop from "CI built an image" to "GitOps deploys it" while keeping Git authoritative.

**Common follow-ups / tradeoffs:** The pull model's no-inbound-credentials is the core security win, but auto-sync/self-heal blocks *all* hand-edits — which can get in the way of emergency firefighting, so you need a "break glass" process. GitOps requires all changes to flow through Git (disciplined but heavier). `git revert` rollback needs no special tooling but relies on clean, trustworthy Git history.

**Key points:**
- Git is the single source of truth for desired state; after `git push` the cluster self-converges
- Pull-based reconciliation: the in-cluster controller pulls outward, removing CI's need to hold cluster credentials
- Drift detection + audit trail: hand-edits flag as OutOfSync — `argocd app diff` to inspect, `sync` to restore
- Rollback = `git revert`; pair with an image updater to write new image tags back to Git

---

### 25. Terraform vs Pulumi vs CloudFormation vs CDK

**Frequency:** High

**Question:** You're moving from clicking resources together in the console to infrastructure as code, but you're stuck on tool choice: you're mostly on AWS today but plan to add GCP, and half the team hates writing YAML and wants real programming languages. Compare Terraform, Pulumi, CloudFormation, and CDK, and make a recommendation.

**What it is & why:** All four are **infrastructure-as-code (IaC)** tools — provision/manage cloud resources with code instead of clicking the console, which is exactly how you kill this case's "hand-built resources, no versioning or audit" mess. They split along two axes: **declarative vs imperative** language, and **multi-cloud vs AWS-native** — choosing is a matter of trading off along these two axes against your team's situation.

**Landing it in this case:**

- **Terraform** — **declarative HCL** (HashiCorp Configuration Language). You describe the desired end state; Terraform diffs it against **external state** and computes the changes. Its superpower is **multi-cloud reach** via a **huge provider ecosystem** (AWS, GCP, Azure, Cloudflare, Datadog, GitHub — thousands of providers). State is stored **outside** the cloud (S3, Terraform Cloud), which you must manage. The de-facto industry standard for cloud-agnostic IaC.
- **Pulumi** — uses **real programming languages** (TypeScript, Python, Go, C#) over the **same provider model** as Terraform. You get loops, conditionals, functions, and IDE support natively instead of HCL's limited expressiveness — great for complex, dynamic infra and teams that prefer code. Tradeoff: more power means more ways to write unmaintainable infra.
- **CloudFormation** — **AWS-native** YAML/JSON, managed entirely by AWS (state and locking handled for you). But it's **AWS-only** and historically **slow to support new services/features** (there's often a lag after a service launches). Verbose and clunky to write by hand.
- **CDK (Cloud Development Kit)** — **imperative code** (TypeScript, Python) that **synthesizes down to CloudFormation**. You write real code with high-level constructs; CDK generates the CFN template. Excellent developer experience but **AWS-centric**. **CDKTF** is the variant that synthesizes to **Terraform** instead, giving CDK's code ergonomics with Terraform's multi-cloud reach.

Applied here: since you'll **add GCP (multi-cloud) *and* want real programming languages**, the best fit is **Pulumi** (real languages + multi-cloud providers) or **CDKTF** (CDK's ergonomics + Terraform's multi-cloud). If you can live with declarative HCL, **Terraform** is the safest multi-cloud standard. Plain CloudFormation / native CDK would lock you to AWS and fail the future-GCP requirement.

**How to diagnose / optimize:** A selection checklist:
1. Need multi-cloud or lots of third-party providers (Cloudflare, Datadog)? Yes → Terraform / Pulumi / CDKTF; rule out CloudFormation and native CDK.
2. Team prefers declarative or real languages? YAML/HCL → Terraform; TS/Python/Go loops+conditionals → Pulumi or CDK family.
3. Pure AWS with a strong dev team? Yes → CDK (best developer experience).
4. Who manages state? CloudFormation/CDK: AWS-managed; Terraform/Pulumi: you configure a remote backend for state + locking (see next question).

**Common follow-ups / tradeoffs:** **Terraform** for multi-cloud or when you want the largest ecosystem and a declarative model; **CDK** if you're AWS-only with a strong dev team that wants real code; **Pulumi** if you want real languages *and* multi-cloud; **CloudFormation** rarely by hand now, mostly as CDK's compilation target. Real programming languages (Pulumi/CDK) are more expressive but also make it easier to write unmaintainable infra — declarative constraints are sometimes a feature, not a bug.

**Key points:**
- Terraform: declarative HCL, multi-cloud, largest ecosystem, de-facto standard
- Pulumi: real languages (TS/Python/Go), same provider model as TF, multi-cloud
- CloudFormation: AWS-native, managed state but AWS-only and slow on new features
- CDK: code synthesized to CFN (AWS-centric); CDKTF synthesizes to Terraform for multi-cloud

---

### 26. Terraform state, locking, drift

**Frequency:** High

**Question:** Two engineers ran `terraform apply` against production at nearly the same time and corrupted the state, with some resources created twice; separately, a colleague hand-edited a security group in the AWS console and the next apply reverted it. Explain state, locking, and drift — how do you prevent and diagnose these incidents?

**What it is & why:** **State** is Terraform's **mapping between your config and the real resources** — `terraform.tfstate` records that `aws_instance.web` corresponds to real instance `i-0abc123`, along with all its known attributes. Understanding state/locking/drift is exactly how you avoid this case's two failure modes: concurrent applies corrupting state, and out-of-band hand-edits (drift) being silently overwritten. Terraform needs state to know what already exists so it can compute a diff on the next `apply` (create/update/delete only what changed) rather than recreating everything.

**Landing it in this case:**

**Store state remotely, never in Git:** a team **shares one state**, so it must live in a **remote backend** — **S3 + a DynamoDB lock table**, **Terraform Cloud**, or **GCS**. Two critical reasons *not* to commit `terraform.tfstate`: (1) it **contains secrets in plaintext** (DB passwords, generated keys, private IPs) — committing it leaks them; (2) local state doesn't coordinate across the team, causing conflicts and corruption.

**Locking prevents concurrent applies (incident one):** if two engineers `apply` simultaneously against the same state, they race and corrupt it. The backend takes a **lock** (DynamoDB item, Terraform Cloud lock) for the duration of an apply, so a second apply **waits** rather than clobbering. This is why the DynamoDB lock table pairs with S3 — this case corrupted precisely because that lock was missing.

**Drift (incident two)** is when the **real infrastructure diverges from state** — someone hand-edits a resource in the AWS console (that security group), or an external process changes it. **Detect it** by running **`terraform plan`**: if it reports proposed changes when you changed *nothing* in config, that diff *is* the drift (Terraform wants to revert reality back to your declared config). Teams run **scheduled drift detection** (a periodic `plan` in CI) to catch out-of-band changes early.

**Adopting existing resources:** use **`terraform import`** to bring a resource created outside Terraform (or by another tool) **under Terraform management** — it writes the resource into state so future applies manage it. (Newer Terraform also supports declarative `import` blocks.)

**How to diagnose / optimize:**
1. Prevent concurrent corruption: configure an **S3 + DynamoDB lock table** (or Terraform Cloud) remote backend; the next concurrent apply sees `Error acquiring the state lock` and waits instead of clobbering.
2. If an apply was interrupted leaving a **stale lock**, release it with `terraform force-unlock <LOCK_ID>` (confirm nobody's actually running before unlocking).
3. Diagnose drift: run `terraform plan` periodically — a diff with no config change *is* drift; `terraform plan -refresh-only` specifically shows reality vs state divergence.
4. Handle the hand-edited security group: to restore the declared config → just `apply` to revert it; to keep the manual change → write it into the `.tf` code, then apply (make code match reality).
5. Adopt resources already built in the console: `terraform import <address> <real-ID>` (or a declarative `import` block) writes them into state.

**Common follow-ups / tradeoffs:** Never commit `terraform.tfstate` (plaintext secrets, can't coordinate). Scheduled `plan` in CI catches out-of-band changes early, but auto-applying "revert reality to declared" can overwrite someone's emergency firefix — so teams often alert rather than auto-apply. Use `force-unlock` carefully: mistaking a live lock for a stale one causes the very concurrent corruption you're trying to avoid.

**Key points:**
- Remote state with locking (S3+DynamoDB / Terraform Cloud) prevents concurrent-apply corruption; use `force-unlock` for a stuck lock
- Never commit state (plaintext secrets, no cross-team coordination)
- Drift = a `plan` diff with no config change; run `plan` periodically in CI to catch it early
- `terraform import` / `import` blocks adopt resources already created in the console

---

### 27. VPC: subnets, route tables, NAT GWs

**Frequency:** High

**Question:** Your app servers sit in a private subnet and suddenly can't reach external third-party APIs (can't pull packages, can't connect to the payment gateway), though internal services work fine; and the month-end bill has a big mysterious data-transfer charge. Explain a VPC's subnets, route tables, IGW, and NAT gateways — how do you localize these two problems?

**What it is & why:** A **VPC (Virtual Private Cloud)** is your **isolated private network** in the cloud, defined by a **CIDR block** (e.g., `10.0.0.0/16` — 65k addresses). Understanding its subnet/route/gateway building blocks is exactly the basis for diagnosing this case's "private subnet can't reach the internet" and "weird NAT bill." You carve the VPC into **subnets**, each **scoped to one Availability Zone** (`10.0.1.0/24` in AZ-a, `10.0.2.0/24` in AZ-b), spreading across AZs for **high availability**.

**Landing it in this case:**

**The public/private distinction comes down to routing** (via each subnet's **route table**):
- A **public subnet** has a route `0.0.0.0/0 → Internet Gateway (IGW)`. The IGW allows **bidirectional** internet traffic, so resources with public IPs here are reachable *from* the internet and can reach *out*.
- A **private subnet** has a route `0.0.0.0/0 → NAT Gateway`. A NAT Gateway allows **outbound-only** internet access (for pulling packages, calling external APIs) but **blocks inbound** connections from the internet — the subnet has no path *in*.

For this case's "private subnet can't reach external APIs," the likeliest cause is that the `0.0.0.0/0 → NAT Gateway` route is missing or the NAT gateway itself is broken — the private subnet has no outbound path, so package pulls / payment-gateway calls all fail, while internal services using intra-VPC routing work fine.

**Standard topology:** put your **workloads (app servers, databases) in private subnets** (no direct internet exposure — an attacker can't reach them directly) and your **load balancers in public subnets** (they take internet traffic and forward it inward). This is defense in depth — only the LB is exposed.

**NAT Gateway gotchas (this case's bill anomaly):** a NAT Gateway is **AZ-scoped** (lives in one AZ). If that AZ fails, private subnets routing through it lose outbound access — so for HA you need **one NAT Gateway per AZ**, with each AZ's private subnets routing to their local NAT. Also, NAT Gateways charge **per-GB data-processing plus hourly** cost, and **cross-AZ traffic through a NAT** adds data-transfer fees — a common surprise on the bill for chatty egress workloads. That mysterious transfer charge is likely private subnets routing cross-AZ to another AZ's NAT, or heavy outbound traffic accumulating processing fees.

**How to diagnose / optimize:**
1. Private subnet can't reach the internet: check the **route table associated** with that subnet for a `0.0.0.0/0 → nat-xxxx` route; add it if missing.
2. Route present but still broken: confirm the NAT Gateway is in a **public** subnet, status Available, and its public subnet routes to the IGW; then check security groups / NACLs allow egress.
3. Use **VPC Flow Logs** to see whether outbound traffic from the EC2 to the target API is ACCEPT or REJECT, pinpointing whether routing, NACL, or security group is blocking.
4. Bill anomaly: verify each private subnet routes to **its own AZ's NAT** (cross-AZ adds transfer fees); break down NAT processing/transfer in Cost Explorer, and for heavy egress consider VPC Endpoints (S3/ECR etc. bypass NAT) to cut cost.

**Common follow-ups / tradeoffs:** One NAT per AZ is an HA-vs-cost tradeoff — saving money with a single NAT means other AZs' private subnets go dark if that AZ fails. VPC Endpoints (Gateway/Interface) let traffic to AWS services bypass NAT, saving processing fees. Security groups are stateful (allow egress and return traffic is auto-allowed); NACLs are stateless (both directions need explicit rules) — check both when diagnosing egress problems.

**Key points:**
- One subnet per AZ for HA; public = IGW route (bidirectional), private = NAT route (outbound-only)
- Private subnet can't egress: first check the route table `0.0.0.0/0 → NAT` and NAT status, then SG/NACL and Flow Logs
- One NAT GW per AZ; workloads in private subnets, LBs in public subnets
- NAT bills per-GB processing + hourly, cross-AZ adds transfer fees — for bill anomalies check cross-AZ routing and consider VPC Endpoints

---

### 28. Logs vs metrics vs traces

**Frequency:** High

**Question:** At 2am an alert fires: "checkout endpoint p99 latency spiked to 3s." But it's a distributed system across 6 microservices and you don't know which hop is slow, and grepping logs is a hopeless wall of text. Contrast logs, metrics, and traces as observability signals — how do you use each in this investigation?

**What it is & why:** Logs, metrics, and traces are the **three pillars of observability**, each with a different shape, cost, and best use — this case needs all three working together: metrics tell you *something's* wrong, traces tell you *where*, logs tell you *what*.

**Landing it in this case:**

- **Logs** — **discrete, free-form (or structured) events with rich context** ("user 123 failed login from IP X at time T"). Highest **detail** — you can put anything in a log line — but **expensive to store and query at scale** (indexing TBs of text is costly; see log aggregation). Best for **deep detail on a *known* incident** once you know roughly where to look.
- **Metrics** — **numeric time series** (request_count, cpu_percent, p99_latency) sampled over time. **Cheap and highly aggregable** — you can sum/average across thousands of instances efficiently. Key constraint: **prefer low cardinality** (few label combinations) — adding a high-cardinality label like `user_id` explodes the number of series and blows up cost/memory. Best for **dashboards, SLOs, and alerting** ("error rate > 1%").
- **Traces** — a **per-request tree of spans** showing **causality across services**: request enters API gateway (span) → calls auth (span) → calls DB (span), each with timing. Best for **localizing *where* a slow or failing request spent its time** in a distributed system — exactly the thing metrics (too aggregate) and logs (no cross-service linkage) can't show.

Applied here: the p99 alert itself is a **metric** (it tripped an SLO threshold); to find which of the 6 services is slow, the only thing giving you cross-service causality is a **trace**; once you pin the slow service, read *its* **logs** to see whether it's a slow query or an external dependency timing out.

**How to diagnose / optimize:**
1. Start from the alerting **metric** to scope it: is p99 up across all endpoints or one route, is error rate up too — narrow to "the checkout path got slower."
2. Use a **trace** to localize the bottleneck hop: in Jaeger/your tracing backend, filter checkout requests by high latency and look at the span tree for the longest segment (e.g., find the DB span taking 2.8s).
3. Read that service's **logs** for root cause: correlate by trace id and read the full detail ("slow query," "connection pool exhausted").
4. After fixing, return to the **metrics** dashboard to confirm p99 dropped back within SLO — closing the loop.

**Common follow-ups / tradeoffs:** Metrics are cheap and aggregable but beware high-cardinality labels (`user_id` explodes series); logs have the fullest detail but massive storage/query cost and no cross-service linkage; traces excel at cross-service causality but are usually sampled (not every request stored). All three combined give the full picture — metrics alone can't say where it's slow, logs alone can't stitch a cross-service chain. **OpenTelemetry (OTel)** unifies producing all three — one vendor-neutral instrumentation SDK and wire protocol (OTLP) for metrics, traces, and logs — so you instrument once and export to any backend (Prometheus, Jaeger, Loki, Datadog) instead of using three separate proprietary agents.

**Key points:**
- Metrics: cheap, aggregable, drive alerts/SLOs, keep cardinality low (tells you *something's* wrong)
- Traces: cross-service causality, per-request span tree, localize which hop is slow (tells you *where*)
- Logs: full detail but expensive, no cross-service linkage, dig into root cause (tells you *what*)
- Investigation chain: metric alert → trace to localize service → logs for root cause; OpenTelemetry unifies producing all three

---

### 29. Prometheus pull model, exporters, recording rules

**Frequency:** High

**Question:** A dashboard suddenly shows a service red with "target down" but a colleague insists the app is alive; separately your Grafana dashboard takes 15 seconds to load at peak and pins the CPU, and history only goes back two weeks — everything older is gone. Explain Prometheus's pull scraping, exporters, recording rules, and long-term storage — how do you diagnose these?

**What it is & why:** Prometheus is **pull, not push** — it periodically HTTP-GETs a **`/metrics`** endpoint on each target and pulls the current values (rather than targets pushing to it). The benefits are exactly what this case's diagnosis hinges on: Prometheus controls scrape timing, can detect a target being *down* (scrape fails → `up == 0`), and apps don't need to know where to push. (A Pushgateway exists for short-lived batch jobs that can't be scraped.)

**Landing it in this case:**

**How things expose metrics:**
- **Apps** instrument directly with **client libraries** (Go/Java/Python) that expose `/metrics`.
- **Everything else** — databases, OS, hardware, black-box endpoints — is wrapped by an **exporter**: **`node_exporter`** (host CPU/mem/disk), **`blackbox_exporter`** (probe URLs/ports from outside), **`mysqld_exporter`**, etc. The exporter translates the system's stats into the Prometheus format.
- **Service discovery** (Kubernetes, EC2, Consul) automatically **finds targets** as they come and go — essential in dynamic environments where pod IPs change constantly.

This case's "target down but the app is alive" usually isn't the app crashing — it's the **scrape path** breaking: the `/metrics` port isn't exposed, a network policy blocks Prometheus, or service discovery is handing out a stale pod IP.

**Fix the slow dashboard with recording rules:** your peak-time spinning dashboard is almost certainly recomputing `sum(rate(http_requests_total[5m]))` across thousands of series at query time. **Recording rules** **pre-compute expensive queries on a schedule** and store the result as a new time series — so dashboards and alerts read a cheap pre-aggregated metric (e.g., `job:http_requests:rate5m`) instead of recomputing every query. **Alerting rules** instead evaluate a PromQL expression on a schedule and **fire when it becomes true** (e.g., `rate(errors[5m]) > 0.05`), sending to **Alertmanager** for routing/deduping/silencing.

**Fix the two-week history with long-term storage:** Prometheus's local TSDB targets **recent** data (days–weeks, controlled by `--storage.tsdb.retention.time`) and doesn't scale horizontally — that's why older data is gone. For long retention and a global view, use **federation** (a higher-level Prometheus scrapes aggregates from many) or **`remote_write`** to a scalable backend — **Thanos, Mimir, or VictoriaMetrics** — providing long-term storage, downsampling, and querying across many Prometheus instances.

**How to diagnose / optimize:**
1. Target down: check the target's `up` value and **Last Scrape Error** in Prometheus's **Status → Targets** page (e.g., `connection refused`, `context deadline exceeded`) — it tells you at a glance if it's a port, timeout, or DNS issue.
2. Verify the endpoint manually: from a network location Prometheus can reach, `curl http://<target>:<port>/metrics`; if it returns, it's a network/service-discovery problem, if not, the app isn't exposing `/metrics`.
3. Slow dashboard: extract the heavy aggregations into recording rules and point the dashboard at the pre-aggregated series; use Prometheus's own `prometheus_rule_evaluation_duration_seconds` to confirm rule evaluation isn't timing out.
4. Lost history: bumping `retention.time` is only a stopgap (local disk fills eventually); the real fix is `remote_write` to Thanos/Mimir/VictoriaMetrics and pointing long-range queries there.

**Common follow-ups / tradeoffs:** The pull model naturally detects target-down and centralizes scrape control; short-lived jobs that can't be scraped need a Pushgateway. Recording rules trade storage for query speed (an extra pre-aggregated series). Local TSDB is simple but can't retain long-term or scale horizontally; remote_write to Thanos/Mimir buys long retention and a global view at the cost of operational complexity. Beware **high-cardinality labels** — they explode series count and slow both scraping and queries.

**Key points:**
- Pull from `/metrics`; for target-down check the Targets page `up` and Last Scrape Error, then `curl` the endpoint
- Exporters wrap non-instrumented systems; service discovery handles dynamic pod IPs
- Slow dashboards: use recording rules to pre-compute aggregations, point dashboards at the cheap pre-aggregated series
- Local TSDB keeps only recent data; long-term via remote_write to Thanos / Mimir / VictoriaMetrics

---

### 30. SLI / SLO / error budgets

**Frequency:** High

**Question:** A PM wants to ship a risky big change mid-month, ops worries about stability, and the two sides argue all morning over "is it stable enough to ship?"; meanwhile your alerting pages the on-call awake for every stray 500, so noisy that people start ignoring alerts. Use SLIs / SLOs / error budgets and burn-rate alerting to give both problems an objective decision rule.

**What it is & why:** This is a hierarchy that turns "reliability" from a subjective argument into something **measurable and actionable** — precisely solving this case's two pains: use the error budget to end the "can we ship?" bickering, and use burn-rate alerts to stop the noise.

- **SLI (Service Level Indicator)** — a **measured** number reflecting user experience: **availability** (fraction of successful requests), **p99 latency**, error rate. It's the raw signal.
- **SLO (Service Level Objective)** — a **target for that SLI over a window**: "99.9% of requests succeed over 30 days," "p99 latency < 300ms." It's the goal you commit to. (An SLA is the *contractual* version with penalties — usually looser than your internal SLO.)
- **Error budget** — **`100% − SLO`** = the **allowed unreliability**. A 99.9% availability SLO means a **0.1% error budget** — about **43 minutes of downtime per month** you're *permitted* to spend.

**Landing it in this case:**

**Use the error budget to settle "can we ship?":** it reframes reliability as a *resource to spend*, not something to maximize — the argument is answered directly by "how much budget is left this month":
- **When budget remains** (say you've burned only 5 of the 43 minutes), the PM's risky change **can ship** — ship features faster, do risky migrations, run experiments. Being *too* reliable (way under budget) actually signals you're moving too slowly.
- **When the budget is burned** (you've used your 43 minutes), you **halt risky launches** and **redirect effort to reliability** — no new feature rollouts until you're back within budget. This gives dev and ops a **shared, objective decision rule** instead of arguing "is it stable enough to ship?"

**Use burn-rate alerts to stop the noise:** your page-on-every-stray-500 alerting is broken because it alerts on *a single request failing*. Instead, alert on **how fast you're consuming the budget** — **multi-window, multi-burn-rate alerts** fire when a **fast burn** (e.g., consuming 2% of the monthly budget in 1 hour → page immediately) *and/or* a **slow burn** (e.g., trending to exhaust the budget over days → ticket) is detected, using both a short and long window to confirm it's real and not a blip. This suppresses transient-error noise and only wakes people for genuinely budget-threatening problems.

**How to diagnose / optimize:**
1. The "can we ship?" argument: open the error-budget dashboard and read the month's remaining budget percentage; budget left → approve the release, near exhaustion → freeze risky changes — decide by numbers, not feelings.
2. Noisy alerts: replace "alert on single request failure" with multi-window burn-rate alerts, e.g. page only when a short window (5m/1h) and long window (1h/6h) both exceed threshold; slow burns just open a ticket.
3. Find who's burning the budget: break the SLI down by route/dependency (which endpoint, which downstream is dragging success rate down) and fix the source.
4. After the budget is exhausted: trigger the release-freeze process, shift the team's iteration goals from features to reliability work, and unfreeze once back within budget.

**Common follow-ups / tradeoffs:** Setting the SLO too high (e.g. 99.999%) makes the budget tiny and freezes releases on the slightest wobble, actually slowing the team; too low fails to protect user experience — derive the SLO from real user tolerance. The SLA is the external, contractual version, usually looser than the internal SLO to leave buffer. The multi-window burn-rate design is a tradeoff between timeliness and noise resistance: short windows react fast but false-positive easily, long windows are stable but slow, so AND-ing both gets you both.

**Key points:**
- SLI measured, SLO targeted, error budget = 1 − SLO (e.g. 99.9% → ~43 min/month)
- Error budget is the objective verdict on "can we ship?": budget left → ship, exhausted → freeze risky changes
- Burn-rate alerts fire on the rate of budget consumption; multi-window multi-burn-rate resists noise, pages only on real threats
- Too high an SLO makes the budget too small and slows the team — derive it from real user tolerance

---

### 31. Incident response: severity, runbooks, postmortems

**Frequency:** High

**Question:** At 2am the payment service is fully down. A dozen people are typing commands in the incident channel at once, talking over each other, nobody knows who's in charge; support is drowning in complaints but can't get a status update. The postmortem then turns into a blame session — and three months later the same outage recurs. Use incident response (severity, runbooks, roles, postmortems) to explain how you'd fix this chaos.

**What it is & why:** Incident response is a structured practice to **respond fast and learn** from outages — exactly what's missing in this case: no severity classification, no runbook, no clear roles, and a postmortem that turned into finger-pointing, so the response was chaotic and the outage recurred.

**Landing it in this case:**

**Severity ladder** — classifies impact and **triggers the response level**: this case's full payment outage with revenue loss is a **Sev1** = customer-impacting outage (major functionality down, revenue/data at risk) → all-hands, page everyone, war room; **Sev2** = degraded service (slow, partial failure, workaround exists) → urgent but not all-hands; **Sev3** = minor (cosmetic, internal-only, low impact) → handle in normal hours. Setting severity correctly ensures you neither under- nor over-react.

**Runbooks** — **every alert should link to a runbook** with concrete **diagnostic and mitigation steps** ("if this fires, check X, run Y, if Z then fail over"). This lets a woken-up on-call engineer act immediately instead of reverse-engineering the system at 3am — the dozen people flailing here is precisely what happens with no runbook to guide them — and it captures institutional knowledge.

**Roles during an incident** — this case's "a dozen people typing, nobody in charge" chaos is solved by assigning clear roles: **Incident Commander (IC)** — coordinates, makes decisions, owns the response (not necessarily the one typing fixes); **Comms** — owns updates to stakeholders/status page (answering support and users) so responders aren't interrupted; **Scribe** — records the **timeline** (what happened when, what was tried) for the postmortem.

**Blameless postmortem afterward** — within about a week, document the **timeline**, **contributing factors** (deliberately *not* "root cause" — complex outages have *multiple* contributing factors, and singular "root cause" thinking oversimplifies), and **action items with owners and deadlines**. **Blameless** is essential: focus on *how the system allowed* the failure, not *who* made a mistake — the blame session here only drives people to hide information and kills learning. And **the same outage recurring three months later** is exactly the failure to track action items to completion — most teams write great postmortems and then never do the follow-ups. Track them like any other prioritized work.

**How to diagnose / optimize:**
1. Stop the bleeding first: for a Sev1, **designate an IC** to take command so the channel shifts from "everyone flailing" to "IC decides and assigns by name."
2. The IC assigns a Comms role to update the status page/support channel on a cadence, and a Scribe to log the timeline live in a shared doc; everyone else executes only the IC's assignments.
3. Mitigate via the runbook: follow the alert's linked runbook steps to diagnose and fail over (switch to standby cluster, roll back the last release) — restore first, root-cause later.
4. Within a week, hold a blameless postmortem: reconstruct the timeline, list multiple contributing factors, give each action item an owner and deadline, and put them in the backlog tracked to closure to prevent recurrence.

**Common follow-ups / tradeoffs:** The IC isn't necessarily the most technical person — the point is coordination and decisions, freeing experts to focus on fixing. Blameless doesn't mean no accountability — it tracks systemic improvement rather than punishing individuals. Setting severity too high causes fatigue (paging everyone constantly), too low under-reacts; write the classification criteria down in advance. The hardest part of postmortems isn't writing them but actually completing the action items — many teams fail here and outages recur.

**Key points:**
- Severity ladder triggers response level (Sev1 all-hands war room / Sev2 urgent / Sev3 normal hours)
- Every alert always links to a runbook so on-call follows steps instead of reverse-engineering live
- Assign IC / Comms / Scribe roles to end "everyone typing, nobody in charge"
- Blameless postmortem lists contributing factors not a single root cause; action items get owners+deadlines tracked to closure to stop recurrence

---

### 32. Cost optimization

**Frequency:** High

**Question:** Finance drops an AWS bill that's up 40% over last quarter, management wants it cut within two weeks, and you can't even say *which team/service* the money went to. Give an impact-ordered playbook for cloud cost optimization: where do you cut first, and how do you localize the waste?

**What it is & why:** Cloud cost optimization is a layered approach **ordered by impact** — go after what saves the most for the least effort first. This case's spiking bill with no visibility into where it went is exactly what this method addresses: cut from the "biggest wins" down, while first filling in the attribution gap.

**Landing it in this case:**

1. **Right-size first (biggest win)** — compare **actual vs requested/provisioned** CPU and memory (via `kubectl top`, Cloud Cost tools, CloudWatch) and **trim over-provisioning**. Most waste is instances/pods sized 3–5× larger than they use "to be safe." This is usually the single largest saving and costs nothing but attention — start here for a two-week cut.
2. **Use spot/preemptible instances for fault-tolerant workloads** — spare-capacity instances at **60–90% discount**, with the catch that the cloud can reclaim them on short notice. Perfect for **stateless, retryable, or batch** work (CI runners, stateless web tiers, data processing). **Karpenter** (Kubernetes autoscaler) can **automatically mix spot and on-demand** — running most pods on spot and falling back to on-demand when spot is unavailable, diversifying across instance types to reduce interruption.
3. **Commit for the steady baseline** — for your **always-on** minimum capacity, buy **Reserved Instances, Savings Plans (AWS), or Committed Use Discounts (GCP)** — you commit to 1–3 years of baseline usage for a big discount. Cover the *baseline*, use on-demand/spot for the *spiky* top.
4. **Delete waste** — hunt down the silent money drains: **unattached EBS volumes**, **old snapshots**, **idle load balancers**, orphaned elastic IPs, dev environments left running overnight. Also **lifecycle-tier object storage** — move S3/GCS data to **infrequent-access / archive tiers** (Glacier) as it ages, since most stored data is rarely read.
5. **Tag everything + budget alerts + FinOps culture** — this case's "can't see where the money went" is cured here: **tag every resource** (team, service, env) so you can do **showback/chargeback** and see *where* money goes. Set **budget alerts** on anomalies (daily spend spikes). And build a **FinOps culture** where engineers **own their costs** — cost visibility in dashboards, cost as a first-class metric — rather than treating the bill as finance's problem.

**How to diagnose / optimize:**
1. Attribute first: use **Cost Explorer** to break the 40% jump down by service/tag and find which service and dimension (compute/storage/transfer) grew — step one is opening up the bill.
2. Localize right-sizing: `kubectl top pods/nodes` or CloudWatch to compare actual usage vs requests, catch workloads provisioned 3–5× over, and lower requests/limits or switch to smaller instances.
3. Find the drains: list unattached EBS volumes, old snapshots, idle LBs, orphaned EIPs, un-shut-down dev environments, and clean each up.
4. Structural savings: move fault-tolerant workloads to spot (Karpenter mixing), buy RI/SP/CUD for baseline capacity, and set object-storage lifecycle rules to auto-tier to infrequent/archive.
5. Prevent recurrence: enforce tagging on all resources, set daily budget alerts, and put cost in team dashboards for chargeback.

**Common follow-ups / tradeoffs:** Right-sizing saves the most for free, but cutting too aggressively leaves you short at traffic peaks — keep reasonable headroom. Spot is cheap but gets reclaimed, only suitable for stateless/retryable work; stateful services lose data on it. RI/SP/CUD lock in 1–3 years for a discount, but over-committing becomes sunk cost if the business shrinks — only commit the stable baseline. Tag governance is a long-term discipline; without it all attribution and chargeback are impossible.

**Key points:**
- Right-size first (biggest win, free): `kubectl top`/CloudWatch actual vs requested to trim over-provisioning
- Attribute first: Cost Explorer by service/tag to find the source of the increase
- Spot for fault-tolerant (Karpenter mixing), commit RI/SP/CUD for stable baseline
- Delete drains (unattached volumes/old snapshots/idle LBs) + storage lifecycle tiering
- Enforce tagging + budget alerts + FinOps culture to prevent recurrence

---

### 33. File descriptors and ulimit

**Frequency:** Medium

**Question:** A Node/Nginx service starts spamming `EMFILE: too many open files` once traffic ramps up — new connections are refused and the error rate spikes — but the machine's CPU and memory are nearly idle. Explain what a file descriptor is, why you hit this wall, and how you'd step through diagnosing and raising the limit.

**What it is & why:** A **file descriptor (FD)** is a **small non-negative integer** that indexes into the kernel's **per-process open-file table** — it's the handle a process uses to refer to any open I/O resource. By convention **0 = stdin, 1 = stdout, 2 = stderr**; everything a process opens after that gets the next free integer. Understanding FDs is the key to this case: erroring while CPU/memory are idle means the problem isn't compute — it's FD exhaustion.

**Landing it in this case:**

**Crucially, "files" is a misnomer** — FDs represent far more than disk files: **sockets, pipes, epoll/eventfd handles, timerfds, and event notifications all consume FDs**. This is why FD limits bite **network servers** hardest: a server holding 50,000 concurrent connections is holding 50,000+ socket FDs — as traffic ramps here and concurrent connections surge, FDs run out first.

**Why the default limit hurts high-connection services:** the default **soft `nofile` limit is often just 1024**. A busy proxy, database, or web server easily exceeds that and starts failing with **`EMFILE: too many open files`** — `accept()` fails, new connections are refused, and the service degrades even though CPU/memory are fine. It's a classic silent scaling wall — exactly this case's symptom.

**Ways to raise it** (soft ≤ hard limit):
- **`ulimit -n <N>`** — for the current shell and its children (interactive/quick).
- **systemd unit** — **`LimitNOFILE=`** in the `[Service]` section (the correct place for a systemd-managed daemon; `ulimit` in the shell doesn't affect it).
- **`/etc/security/limits.conf`** — sets **`nofile`** limits for users/groups at login (PAM-based).
- **Containers** — the **kubelet / container runtime (Docker) settings cap** what a container can request; you may need to raise the daemon's `default-ulimits` or set limits in the pod spec/runtime config, because the container can't exceed what the runtime allows.

**How to diagnose / optimize:**
1. Confirm it's FD exhaustion, not compute: CPU/memory idle while erroring `EMFILE` essentially pins it on FDs.
2. Find the process PID and check current usage: `ls /proc/<pid>/fd | wc -l` counts currently open FDs.
3. Check that process's limit: `cat /proc/<pid>/limits | grep "open files"` shows soft/hard `nofile`; compare usage against the cap.
4. Raise the limit in the right place: for a systemd service edit `[Service]`'s `LimitNOFILE=` then `daemon-reload` + restart (shell `ulimit` has no effect on it); for a container edit the runtime's `default-ulimits` or the pod spec.
5. Don't just raise the cap — check for an **FD leak**: connections/files never closed make FDs climb without falling; piles of same-type sockets in `ls /proc/<pid>/fd` are the tell, and it must be fixed in code (ensure close, use connection pools).

**Common follow-ups / tradeoffs:** A process can raise its soft limit up to the hard limit itself; only privileged users can raise the hard limit. Blindly bumping `nofile` can't mask an FD leak — a leak will keep saturating any limit, so it must be fixed at the source. A systemd service's limit is **not** affected by shell `ulimit` — editing the wrong place is a common trap. A container's process can't exceed what the runtime allows, even if the app tries to raise it.

**Key points:**
- FDs are per-process integer indexes; sockets/pipes/epoll all count as FDs, so network services hit the wall first
- `EMFILE` + idle CPU/memory = FD exhaustion; raise `nofile`
- Check usage `ls /proc/<pid>/fd | wc -l`, check limit `cat /proc/<pid>/limits`
- systemd: `LimitNOFILE=` (shell `ulimit` won't work); k8s: runtime config; rule out an FD leak before raising the cap

---

### 34. systemd units and journalctl

**Frequency:** Medium

**Question:** An in-house daemon keeps crashing in production; ops finds it doesn't auto-restart after a crash and its logs are scattered everywhere and hard to search. You edited the memory limit in its unit file but it "doesn't take effect," and the machine also reboots suspiciously slowly. Explain how systemd manages services and how to use journalctl — how do you diagnose these?

**What it is & why:** systemd models everything as **units** with typed suffixes: **`.service`** (a long-running or oneshot process), **`.timer`** (cron-like scheduling that triggers a service — with better logging and dependency handling than cron), **`.socket`** (socket-activation — systemd holds the listening socket and starts the service on first connection), **`.mount`** (filesystem mounts), and **`.target`** (grouping/milestones like `multi-user.target`). You use it precisely to solve this case: make a crashing service auto-recover, centralize its logs, and constrain its resources.

**Landing it in this case:**

**Make the crashing service auto-restart** — a `.service` unit file (in `/etc/systemd/system/`) declares behavior in its `[Service]` section:
- **`ExecStart=`** — the command to run.
- **`Restart=`** — resilience policy (**`on-failure`** is the common choice) plus **`RestartSec=`** to back off between restarts, so a crashing service auto-recovers instead of staying dead — this case's "doesn't come back after a crash" is exactly these two lines missing.
- **`User=`** — run as an unprivileged user (least privilege).
- **Resource limits** — `LimitNOFILE=`, `MemoryMax=`, `CPUQuota=` (systemd applies these via cgroups).

**Managing units:**
- **`systemctl daemon-reload`** — required after editing a unit file so systemd re-reads it. This case's "changed the memory limit but it doesn't take effect" is most commonly forgetting `daemon-reload` + restart.
- **`systemctl enable --now foo`** — enable at boot *and* start immediately (enable = start on boot, start = start now).
- `systemctl status/restart/stop foo` for the rest.
- **Drop-ins**: put overrides in `/etc/systemd/system/foo.service.d/*.conf` to change one setting without editing the vendor unit (survives package upgrades).

**How to diagnose / optimize:**
1. Doesn't restart after a crash: `systemctl status foo` to see if it's failed and the exit code; add `Restart=on-failure` + `RestartSec=5` to the unit's `[Service]`, `daemon-reload`, and restart.
2. Scattered logs: systemd services actually all log to the **journal** (structured, indexed) — query centrally with `journalctl -u foo -f` (follow live), `--since "1 hour ago"` / `--until`, `-p err` (priority filter), `-b` (this boot), instead of hunting through log files.
3. Config change not taking effect: after confirming you edited the right file, always `systemctl daemon-reload` so systemd re-reads it, then `systemctl restart foo`; verify with `systemctl show foo -p MemoryMax` that the new value is live.
4. Slow boot: `systemd-analyze blame` lists per-unit startup time, `systemd-analyze critical-chain` shows which unit on the critical path is dragging boot, so you can optimize or fix dependencies.

**Common follow-ups / tradeoffs:** Forgetting `daemon-reload` after editing a unit is the most common "changed it but it doesn't take effect" trap. Drop-in overrides beat editing the vendor unit directly — they survive package upgrades. `Restart=always` restarts on any exit (including normal), `on-failure` only on failure — picking wrong makes a oneshot task re-run endlessly. Resource limits via cgroups constrain a systemd-managed daemon more reliably than shell `ulimit`.

**Key points:**
- Unit types: service/timer/socket/mount/target
- `Restart=on-failure` + `RestartSec=` makes a crashing service auto-recover
- After editing a unit you must `daemon-reload` + restart or it won't take effect; use drop-ins to survive upgrades
- `journalctl -u <unit> -f` for centralized logs; slow boot via `systemd-analyze blame`/`critical-chain`

---

### 35. HTTP/1.1 vs HTTP/2 vs HTTP/3

**Frequency:** Medium

**Question:** Your gRPC service works fine peer-to-peer in test, but once it goes live behind a load balancer it either errors heavily or funnels every request onto a single backend; separately, the frontend team complains pages load painfully slowly on mobile/lossy networks. Compare HTTP/1.1, HTTP/2, and HTTP/3, explain what gRPC requires, and pin down the root cause of both problems.

**What it is & why:** HTTP has three generations, each fixing the previous one's bottleneck — understanding them is the basis for diagnosing this case's "gRPC breaks through the LB" and "slow on weak networks."

**Landing it in this case:**

**HTTP/1.1** — **text-based**, fundamentally **one in-flight request per TCP connection**. You can pipeline requests, but responses must return in order, causing **head-of-line (HoL) blocking** — a slow response stalls everything behind it. Browsers work around this by opening **~6 parallel connections per host**, which is wasteful (6× handshakes, 6× congestion state).

**HTTP/2** — **binary framing** instead of text, and the big win: **multiplexed streams over a *single* TCP connection**. Many requests/responses interleave concurrently with no per-request connection overhead. Adds **HPACK header compression** (headers are hugely repetitive across requests — cookies, user-agent — so compressing them saves real bandwidth) and **server push** (server proactively sends resources; largely deprecated in practice). **Remaining flaw:** it still runs on **TCP**, so a single lost packet stalls *all* multiplexed streams — **TCP-level HoL blocking** — because TCP delivers bytes in order.

**HTTP/3** — runs on **QUIC over UDP** instead of TCP. QUIC implements streams *itself*, so a lost packet only blocks *its own* stream — **eliminating TCP HoL blocking**. It also **merges the transport + TLS handshake** for faster connection setup, including **0-RTT** resumption (send data on the first packet to a previously-seen server). Great for lossy/mobile networks — this case's "slow on weak mobile networks" is exactly what H3 improves (lossy links drop packets, and H2 stalls all streams on TCP HoL). Most CDNs negotiate it automatically via the `Alt-Svc` header.

**gRPC requires HTTP/2 end-to-end** — it depends on H2's multiplexed streams and bidirectional streaming (many concurrent RPCs, streaming both directions on one connection). This is exactly this case's root cause: gRPC multiplexes over a **single long-lived connection**, so if the LB only does L4/connection-level balancing, all RPCs get pinned to one backend (uneven load); and if the LB doesn't support H2 or downgrades the connection to H1, gRPC breaks outright. Any proxy/load balancer in the path must support H2 and do **L7/gRPC-aware** load balancing.

**How to diagnose / optimize:**
1. gRPC errors through the LB: confirm the LB speaks H2 all the way to the backend (many LBs default to H1 to backends); enable the gRPC/HTTP2 backend protocol; verify with `curl --http2` or `grpcurl` directly against the LB.
2. Requests pinned to one backend: because gRPC multiplexes a single connection, L4 balancing binds it to one backend — switch to L7 gRPC-aware balancing (e.g. Envoy, or client-side load balancing), or have the client periodically rebuild the connection to spread load.
3. Slow on weak networks: capture packets to see if heavy TCP retransmits are stalling all H2 streams; enable HTTP/3 (QUIC) at the CDN/edge and let clients negotiate up to H3 via the `Alt-Svc` header.
4. Verify what was negotiated: the Protocol column in browser DevTools or `curl -I --http3` confirms whether h2 or h3 is actually in use.

**Common follow-ups / tradeoffs:** H2's multiplexing removes application-layer HoL but not TCP-layer HoL — on a lossy network it can actually be worse than multi-connection H1; only H3/QUIC solves it fully, at the cost that UDP may be blocked by some corporate firewalls. gRPC strongly depends on H2, and any downgrade in the path breaks it — the biggest operational trap when deploying gRPC. Server push is essentially deprecated, don't rely on it.

**Key points:**
- H1: one in-flight per connection, browsers open ~6 connections to work around HoL
- H2: multiplexed streams over one TCP connection + HPACK, but still has TCP-layer HoL
- H3: QUIC over UDP, eliminates TCP HoL, great for weak/mobile networks, negotiated via `Alt-Svc`
- gRPC needs H2 end-to-end; the LB must support H2 and do L7/gRPC-aware balancing or it breaks or pins to one backend

---

### 36. TLS handshake and certificate chain

**Frequency:** Medium

**Question:** Users report certificate errors on your site — oddly, Chrome opens it fine but curl and some mobile apps fail with "unable to get local issuer certificate"; then later the whole site's HTTPS goes down with a browser "certificate expired" warning. Explain the TLS handshake, certificate chain validation, and TLS 1.3, and how you'd localize these two failures.

**What it is & why:** TLS guarantees confidentiality and identity in transit; understanding its handshake and certificate chain is the basis for diagnosing this case's "some clients error" and "whole-site expiry."

**Handshake:** the client and server **negotiate a cipher suite** and **establish a shared session key**. Modern setups use **ECDHE** (Elliptic-Curve Diffie-Hellman Ephemeral) for the key exchange, which gives **forward secrecy** — an *ephemeral* key per session means that even if the server's long-term private key is later stolen, past recorded sessions **can't** be decrypted (each used a different, discarded ephemeral key).

**Landing it in this case:**

**Certificate chain validation:** the server presents its **leaf certificate plus intermediate(s)**. The client validates a **chain of trust**: leaf → intermediate CA → ... → a **root CA in the client's trust store**. Each cert is signed by the next one up; the root is pre-trusted. The client also checks: (1) the **SAN (Subject Alternative Name) matches the hostname** it's connecting to (the CN field is legacy/ignored by modern clients); (2) **validity dates** (not expired/not-yet-valid); (3) **revocation** via **OCSP** (or OCSP stapling) or **CRLs** — has this cert been revoked?

This case's "Chrome works, curl/apps fail with unable to get local issuer certificate" is the classic **missing intermediate certificate**: the server sends only the leaf, Chrome happens to have cached that intermediate and fills it in, but curl and some apps haven't cached it and can't build the chain — the same site failing intermittently across clients is exactly this signal. And "whole-site cert expired" is the validity-date check failing.

**TLS 1.3 changes:** **collapsed the handshake to one round-trip (1-RTT)** — and 0-RTT for resumption — by removing negotiation round-trips; **removed legacy/weak ciphers** (no RSA key exchange, no CBC, no RC4); and made **forward secrecy mandatory** (ECDHE always). Faster and safer by default.

**How to diagnose / optimize:**
1. Capture the chain the server actually sends: `openssl s_client -connect host:443 -showcerts` and count the certs returned — only the leaf means the intermediate is missing.
2. Verify chain integrity: in `openssl s_client -connect host:443` output, a non-zero `Verify return code` (e.g. 21, unable to get local issuer) confirms the chain didn't build; fix by configuring the full intermediate chain (fullchain) on the server.
3. Check expiry: `openssl s_client -connect host:443 | openssl x509 -noout -dates` for notBefore/notAfter, or `echo | openssl x509 -enddate`.
4. Check SAN matches: `openssl x509 -noout -text | grep -A1 "Subject Alternative Name"` for the hostnames the cert covers.
5. Fix expiry for good: adopt automated renewal (ACME/Let's Encrypt, cert-manager) and alert N days before expiry instead of relying on humans to remember.

**Common follow-ups / tradeoffs:** The nastiest thing about a missing intermediate is that it "works for some clients," masking the problem — always serve fullchain. ECDHE forward secrecy is the modern default and TLS 1.3 mandates it. 0-RTT resumption is fast but has replay risk, so only for idempotent requests. OCSP stapling lets the server fetch revocation status on the client's behalf, saving a round-trip and being more reliable. Certificate expiry is the most common and most preventable outage — automated renewal + alerting is table stakes.

**Key points:**
- Chain: leaf -> intermediate(s) -> trusted root in the client store; a missing intermediate makes some clients fail intermittently
- SAN must match the hostname (CN is legacy); check validity dates and revocation
- TLS 1.3 = 1-RTT, mandatory forward secrecy, weak ciphers removed
- Debug with `openssl s_client -connect host:443 -showcerts`; prevent expiry via ACME/cert-manager auto-renewal + alerting

---

### 37. SSH keys, agent forwarding, jump hosts

**Frequency:** Medium

**Question:** Your team reaches private-subnet machines only through a bastion, and someone took a shortcut and used `ForwardAgent yes` everywhere. A security audit later finds the shared bastion was compromised and suspects someone's SSH keys were impersonated. Discuss SSH keys, agent forwarding, and jump hosts (ProxyJump) — explain this security hole and the safer approach.

**What it is & why:** SSH uses key pairs for strong passwordless authentication; bastion hosts and agent forwarding are two ways to reach into a private network — but their security differs wildly, and this case's breach exposes exactly the risk of agent forwarding.

**Keys:** prefer **Ed25519** (`ssh-keygen -t ed25519`) over RSA — it's a modern elliptic-curve algorithm that's **faster, has small keys, and strong security** (RSA needs 3072+ bits for equivalent strength). Protect the private key with a **passphrase** so a stolen key file is useless alone, and load it into **`ssh-agent`** so you type the passphrase once and the agent holds the decrypted key in memory for subsequent connections.

**Landing it in this case:**

**Agent forwarding (`ForwardAgent yes`) is exactly this case's root cause:** it forwards your **local agent's socket to the remote host**, so from the remote you can authenticate onward (e.g., `git clone` from a server) **without copying your private key there**. Convenient, but **risky on shared/untrusted hosts**: anyone with **root on the remote** can hijack the forwarded socket and **use your keys to impersonate you** to anything your agent can reach, for as long as you're connected. Once the bastion is compromised (as here), the attacker can impersonate keys while everyone forwards their agent through it — never forward your agent through a box you don't fully trust.

**ProxyJump (`ssh -J bastion target` or `ProxyJump` in config) is the safer alternative** — for reaching a private host through a **bastion/jump host**. It **tunnels the connection through** the bastion (which just forwards the encrypted stream) so your **authentication and keys terminate on the *target*, not the bastion** — the bastion never sees your agent socket or keys. Unlike agent forwarding, a compromised bastion can't steal your credentials. This is the recommended pattern for accessing private-subnet machines, and this case should switch to it wholesale.

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

**How to diagnose / optimize:**
1. Find who enabled agent forwarding: `grep -r ForwardAgent ~/.ssh/config /etc/ssh/ssh_config*`, change every `ForwardAgent yes` to `no`, and switch to ProxyJump.
2. Contain the incident: after the bastion compromise, treat all keys recently forwarded through it as leaked — `ssh-keygen` new Ed25519 pairs, rotate `authorized_keys` on all servers, and revoke the old public keys.
3. Verify the connection path: `ssh -v app-1` to confirm it goes through the ProxyJump tunnel and auth terminates on the target; `ssh-add -l` to see which keys the agent currently holds.
4. Shrink the exposure: on the bastion set `AllowAgentForwarding no` (server-side enforced disabling of forwarding) to prevent it at the source.

**Common follow-ups / tradeoffs:** Agent forwarding is convenient but extends trust to the remote host — only use it on fully trusted machines; ProxyJump has the bastion forward only the encrypted stream, never seeing keys, and is the better default. The old `ProxyCommand` (with netcat) achieves a similar result but is clunkier; `-J`/`ProxyJump` is the modern concise form. Ed25519 is faster and stronger than RSA-2048 — prefer it unless you need to interop with old systems. Always passphrase-protect private keys; a bare key file copied away is total compromise.

**Key points:**
- Ed25519 > RSA-2048; passphrase-protect the private key and hold it in ssh-agent
- Agent forwarding is risky on shared/untrusted hosts: root on a compromised host can hijack the socket and impersonate your keys
- `ProxyJump`/`-J` is safer: keys terminate on the target, the bastion never sees them — the recommended pattern for private subnets
- After an incident rotate keys; set server-side `AllowAgentForwarding no`; use `~/.ssh/config` for reuse

---

### 38. Distroless vs scratch vs alpine

**Frequency:** Medium

**Question:** You migrate a Go service off an alpine base image to shrink size and CVEs, and hit two weird things: on alpine the service had intermittent DNS resolution failures / couldn't reach downstreams; after switching to distroless there's no shell, so when something breaks in prod you `kubectl exec` in and don't even have `ls` or `curl` to investigate. Compare scratch, distroless, and alpine, explain both problems, and how you debug distroless.

**What it is & why:** Three approaches to minimal container base images, trading size and CVEs against debuggability — this case's DNS quirk and "can't get in to investigate" are two classic pitfalls of exactly this tradeoff.

**Landing it in this case:**

- **`scratch`** — the **empty image**: literally nothing, just your binary. Only works for **fully static binaries** (Go with `CGO_ENABLED=0`, Rust static). **Smallest and safest** (zero packages = near-zero CVEs, no shell for an attacker to use) but **hardest to debug** — no shell, no `ls`, no libc, no CA certs (you must copy those in yourself for TLS to work).
- **distroless** (`gcr.io/distroless/*`) — includes the **minimal runtime** your app needs — **libc, CA certificates**, timezone data, and optionally a language runtime (`distroless/java`, `distroless/python3`) — but **no package manager and no shell**. The sweet spot for most production: small attack surface, works for dynamically-linked binaries and interpreted apps, still no shell for attackers. This case's "exec in and there's no ls/curl" is the direct consequence of it having no shell.
- **alpine** — a tiny real distro: **musl libc, busybox** (a minimal shell + coreutils), and **`apk`** package manager. Only ~5MB and you *can* shell in and install tools. The catch: **musl libc ≠ glibc**, so **glibc-compiled binaries can break** on alpine, and musl has historically had **DNS resolution quirks** (different behavior with search domains, no parallel A/AAAA in old versions) that cause subtle networking bugs — this case's intermittent DNS failures after moving to alpine are almost certainly musl's resolver behavior. Also its `apk` packages differ from Debian/Ubuntu.

**Which to pick:** **scratch or distroless for production** — minimal attack surface, fewer CVEs, smaller/faster. **alpine when you genuinely need a package manager or shell** in the image, accepting the musl edge cases (or use a slim glibc distro like `debian:slim`).

**How to diagnose / optimize:**
1. Alpine DNS quirks: when in-container resolution misbehaves, first `cat /etc/resolv.conf` for search domains and `ndots` — musl handles multiple search domains and `ndots` differently from glibc; upgrade alpine (newer versions fixed parallel A/AAAA), or switch to `debian:slim` with glibc to sidestep it.
2. Confirm libc compatibility: `ldd your-binary` to see dependencies — a glibc-compiled dynamic binary crashes on alpine for lack of glibc, so either build static (`CGO_ENABLED=0`) or use a glibc base.
3. Debug a shell-less distroless/scratch: since the image has no tools, use an **ephemeral debug container** — `kubectl debug -it <pod> --image=busybox --target=<container>` attaches a temporary container **sharing the target's namespaces** (process, network), so you get `ls`/`curl`/`nslookup` *alongside* the running container without baking a shell into the production image.
4. docker case: similarly attach a debug container to the target's namespaces with `--network container:<id>`, `--pid container:<id>`.

**Common follow-ups / tradeoffs:** scratch/distroless trade "can't get in to investigate" for a minimal attack surface and near-zero CVEs — which is exactly what you want for security (attackers have no shell either), with the debugging cost recovered via ephemeral containers. alpine's shell-in convenience comes with musl libc/DNS edge cases that cause subtle prod bugs, and glibc-compiled binaries are especially risky. Multi-stage build + distroless is the production gold standard: full tooling in the build stage, only the minimal runtime at runtime.

**Key points:**
- scratch: static binaries only, smallest and safest, no shell/libc/CA, hardest to debug
- distroless: libc + CAs + optional runtime, no shell/package manager, the production sweet spot
- alpine: musl + busybox + apk, can shell in, but watch musl's DNS quirks and glibc-binary incompatibility
- Debug shell-less images with a `kubectl debug` ephemeral container sharing namespaces — don't bake tools into the prod image

---

### 39. Image tagging conventions

**Frequency:** Medium

**Question:** Production deploys with `myapp:latest`. One day a node restarts, pulls a freshly pushed `latest`, and now the same "version" is running two different builds across the cluster — introducing an untested change that causes an incident — and when you go to roll back you can't even tell which build was live. Explain image tagging conventions: why avoid `latest`, how to tag with immutable identifiers, why production should pin by digest, and what registry immutable-tag policies do.

**What it is & why:** Image tagging conventions determine the certainty of "which exact code am I deploying" — this case is precisely what `latest` being mutable and un-pinnable causes: the same tag points to different images at different times, causing cluster version drift and no ability to roll back.

**Landing it in this case:**

**Why avoid `latest`:** `latest` is just a **mutable** alias that can be overwritten to point at a new image anytime. This case's node restart re-pulled `latest` and got the new build — the same "version" running two builds, an untested change slipping in, and no way to determine afterward which build was live, all because the tag can't be pinned.

**How to tag (immutable identifiers):** use identifiers that are never reused — **semantic version** (`1.4.2`), **git SHA** (`sha-abc1234`), or **build date**. In practice, **push multiple tags pointing at the same digest** (`1.4.2`, `1.4`, `1`, `sha-abc1234`) so consumers choose between stability and freshness: pin a patch with `1.4.2`, auto-follow patches with `1.4`. The git SHA ties the image directly to the exact source commit.

**Pin by digest in production for true immutability:** tags can still be re-pushed; the only absolutely immutable reference is the **content-addressed digest** — production deploys reference `image@sha256:...`, which is content-addressed and always points to those exact bytes. Pinning the digest in manifests guarantees every node and every pull gets the same image, so this case's version drift can't happen. (Tools like the GitOps image updater and admission controllers can resolve tags to digests automatically.)

**Registry immutable-tag policies:** registries (ECR, GCR, Harbor) can enable an **immutable-tag** policy that **forbids overwriting an existing tag** server-side — once `1.4.2` is pushed it can't be re-pushed, eliminating "same tag, different content" at the root.

**How to diagnose / optimize:**
1. Find what's actually running: `kubectl get pod -o jsonpath='{..image}'` or `kubectl describe pod` for `Image` and `ImageID` (the latter contains the digest) — with `latest` you can't tell the build, with a digest it's unambiguous.
2. Eliminate drift: change the deploy manifest from `myapp:latest` to `myapp@sha256:...` (or at least `myapp:1.4.2`) so all nodes pull the same image.
3. Prevent recurrence: enable immutable-tag policy in the registry, forbid pushing `latest` to the prod registry in CI, and have the release pipeline tag by git SHA and record the digest in the release record.
4. Rollback: since every version is an immutable digest, rolling back is just pointing the manifest at the previous known-good digest.

**Common follow-ups / tradeoffs:** `latest` is convenient for local dev but a time bomb in production. Digests are the strictest but unreadable, so they usually coexist with semver tags (humans read `1.4.2`, machines pin the digest). Multiple tags pointing at one digest let different consumers take what they need without rebuilding. Immutable-tag policy blocks the lazy "re-push a fix to the same tag" habit and forces a new version number — which is exactly the discipline you want.

**Key points:**
- Never deploy `:latest` — mutable and un-pinnable, causing version drift and no rollback
- Tag with immutable identifiers (semver + git SHA), multiple tags to one digest let consumers choose stability/freshness
- Pin production manifests by digest (`image@sha256:...`) for true immutability, consistent across nodes
- Enable registry immutable-tag policy to forbid overwriting tags; use `ImageID` to find the real running build

---

### 40. Volumes vs bind mounts vs tmpfs

**Frequency:** Medium

**Question:** A service using `hostPath` to store data on the local node's directory gets rescheduled to another machine after a node failure — and its data "vanishes"; another service writes decrypted credentials into the container's writable layer, and a security scan flags that the key landed on disk. Compare Docker volumes, bind mounts, and tmpfs and their Kubernetes analogs, and explain how to fix both.

**What it is & why:** Three ways to give a container storage beyond its ephemeral writable layer, differing in *where the data lives* and *who manages it* — picking wrong hits exactly this case's two pitfalls (host coupling losing data, and a key landing on disk).

**Landing it in this case:**

- **Volumes** — **Docker-managed** storage (under `/var/lib/docker/volumes/`) with **driver support** (local, NFS, cloud block storage). Docker owns the lifecycle; you reference it by name, not a host path. **Portable and the recommended default** — the container doesn't depend on host directory layout, and drivers let the same volume back onto network/cloud storage.
- **Bind mounts** — attach a **specific host path directly** into the container (`-v /host/path:/container/path`). **Flexible** (great for **local dev** — mount your source code so edits appear live inside the container) but **couples the container to the host's filesystem layout** — the path must exist on every host, permissions/SELinux can bite, and it's not portable across machines. This case uses `hostPath` (the k8s analog of a bind mount) to store data, so once the pod is rescheduled to a different node, that machine has no copy of the data — hence it "vanished."
- **tmpfs** — **RAM-only** storage that **never touches disk** and vanishes when the container stops. **Ideal for secrets** (a decrypted credential you don't want persisted) and **hot scratch data** (temp files, caches) where you want speed and no disk trace. Costs RAM. This case's key landed on disk — it should switch to tmpfs so the credential stays only in memory with no disk trace.

**Kubernetes analogs:**
- Volumes → **PersistentVolumes/PVCs** (managed, portable, driver-backed — the closest analog).
- Bind mounts → **`hostPath`** (mounts a node path; same host-coupling caveats, generally discouraged in prod for the same portability/security reasons).
- tmpfs → **`emptyDir` with `medium: Memory`** (RAM-backed ephemeral scratch shared within the pod).

**How to diagnose / optimize:**
1. Localize the vanished data: `kubectl describe pod` to see whether the Volumes section uses `hostPath`, and which node the pod landed on — after a node switch, the old node's hostPath data doesn't follow.
2. Fix persistence: replace `hostPath` with a **PVC** backed by network/cloud block storage (EBS, Ceph, NFS) so the same data mounts regardless of which node it's scheduled on.
3. Localize the on-disk key: confirm the credential was written to the container writable layer or a bind mount (both hit disk); switch to an `emptyDir` with `medium: Memory` (tmpfs) so the credential lives only in RAM and disappears when the pod stops.
4. Verify: `kubectl exec` in and `mount | grep <path>` to confirm the path is tmpfs and not disk.

**Common follow-ups / tradeoffs:** hostPath has host coupling and security risk (access to the node filesystem) — avoid it for data persistence in prod, use it only when you genuinely need a specific node path (e.g. log collection). tmpfs/emptyDir Memory costs RAM and isn't persistent, so it's only for scratch data and secrets — don't store data you need to keep. Named volumes/PVCs are the recommended default for persistence — portable, not tied to host layout, and drivers can back them with cloud storage.

**Key points:**
- Volumes/PVCs: managed, portable, cross-node — the recommended default for persistence
- Bind mounts/hostPath: tied to a host path, data lost on node switch, use with caution in prod
- tmpfs/emptyDir Memory: RAM-only, gone when the pod stops, ideal for secrets and hot scratch, never on disk
- Vanished data → check for hostPath and use a PVC; on-disk key → switch to tmpfs and verify with `mount`

---

### 41. Docker network drivers

**Frequency:** Medium

**Question:** A latency-sensitive containerized service shows measurable overhead from the default bridge network's NAT under load — and the backend can't see the client's real IP; the team tries `host` networking for speed and hits port conflicts. After moving to Kubernetes someone asks why pods can reach each other directly by IP with no NAT. Walk through Docker network drivers and how Kubernetes replaces them with CNI.

**What it is & why:** Docker's built-in drivers cover different networking needs; choosing a driver is fundamentally a tradeoff between isolation, performance, and portability — this case's NAT overhead, real-client-IP, and port conflicts are all determined by driver choice.

**Landing it in this case:**

- **`bridge`** (default) — creates a **private virtual network per host** with a Linux bridge; containers get internal IPs and reach the outside via **NAT** (source-NAT'd through the host IP). Port publishing (`-p 8080:80`) sets up DNAT. Good isolation, but NAT hides container IPs and adds a small overhead — exactly this case's latency overhead and "can't see the client's real IP."
- **`host`** — the container **shares the host's network namespace** directly: no isolation, no NAT, the container binds host ports as if it were a host process. **Gains full network performance**, avoids NAT quirks, and sees the real IP; but **gives up isolation** and port-conflict safety — this case's port conflict after switching to host is precisely because the container and host share one port space.
- **`overlay`** — spans **multiple hosts** by encapsulating traffic in **VXLAN**, so containers on different machines share one virtual network (used by Docker Swarm for multi-host services).
- **`macvlan`** — gives each container its **own MAC and IP directly on the physical LAN**, appearing as a real device on the network (useful for legacy systems that expect real L2 presence).
- **`none`** — disables networking entirely (only loopback) — for fully isolated workloads.

**Kubernetes replaces all of this with CNI (Container Network Interface) plugins.** Instead of per-host bridges + NAT, Kubernetes mandates a **flat network model**: **every pod gets its own network namespace and a unique IP that's routable cluster-wide**, and pods communicate **without NAT** (pod-to-pod uses real IPs) — this is exactly why pods here can reach each other directly by IP. A **CNI plugin** (Calico, Cilium, Flannel, AWS VPC CNI) implements this — wiring each pod's netns, assigning IPs, and setting up routing/overlay (or native VPC routing) so any pod can reach any other pod directly. This flat, NAT-free model is what makes Services, network policies, and service discovery work uniformly.

**How to diagnose / optimize:**
1. Localize NAT overhead / lost real IP: `docker inspect <container>` for the driver; under bridge the backend sees the host's source IP, not the client's. To keep the real IP with isolation, add `X-Forwarded-For` at an L7 proxy, or evaluate host networking for latency-sensitive cases.
2. host-network port conflict: `ss -ltnp` / `netstat -ltnp` to find already-bound host ports; in host mode the container can't rebind the same port — either change the container's listen port or fall back to bridge with port mapping for isolation.
3. k8s pods can't reach each other: `kubectl get pod -o wide` for pod IPs, `kubectl exec` and ping another pod IP to verify the flat network; if it fails, check the CNI plugin health (`kubectl get pods -n kube-system` for Calico/Cilium) and whether a NetworkPolicy is blocking.
4. Cross-node failures: confirm the CNI's routing/overlay (VXLAN) or cloud VPC routing is correct and the inter-node UDP port (VXLAN 8472) is allowed.

**Common follow-ups / tradeoffs:** bridge isolates well but NAT adds overhead and hides the real IP; host is fastest and sees the real IP but has no isolation and hits port conflicts — the classic tradeoff for latency-sensitive services. overlay connects multiple hosts but VXLAN encapsulation adds overhead. k8s's flat NAT-free model simplifies service discovery and network policy but requires the CNI to allocate cluster-unique IPs — in large clusters IP planning and CNI choice (overlay vs native VPC routing) matter, and Cilium's eBPF can cut overhead further.

**Key points:**
- bridge = default, NAT has overhead and hides the client's real IP
- host = no isolation, fastest, sees real IP, but port conflicts (`ss -ltnp` to check usage)
- overlay = multi-host VXLAN; macvlan = container directly on the physical LAN
- k8s uses CNI flat networking: unique IP per pod, no NAT between pods; if broken check the CNI plugin and NetworkPolicy first

---

### 42. docker compose

**Frequency:** Medium

**Question:** The team runs its local stack with docker compose, but the app container crashes on startup complaining it can't reach the database — it takes a few manual `restart`s to come up; later that same compose file was deployed to a single production box, and when that box went down recently the whole service was offline for hours. Explain what Docker Compose defines, how to fix the startup ordering, and when to graduate to Kubernetes.

**What it is & why:** **Compose** defines a **multi-container application in a single `docker-compose.yml`** and runs it on **one host** — one command brings up the app plus its dependencies (app + Postgres + Redis). This case's "can't reach the DB" and "single box down = whole site down" map onto its two key aspects: startup ordering and the single-host limitation.

**Landing it in this case:**

**What the YAML defines:**
- **`services`** — each container (image, ports, command, environment).
- **`networks`** — Compose auto-creates a network so services reach each other **by service name** as a hostname (`db:5432`).
- **`volumes`** — named volumes for persistence.
- **`env`** — environment variables (often from a `.env` file).
- **`depends_on`** — startup ordering — this case's "app comes up before the DB and crashes" is fixed here: with **`condition: service_healthy`** a service won't start until a dependency's **healthcheck** passes (so the app doesn't start before the DB is ready), instead of relying on manual restarts and luck.
- **`healthcheck`** — per-service readiness check (`condition: service_healthy` relies on it to judge whether a dependency is truly ready).

**Commands:** `docker compose up -d` brings the whole stack up (detached); `docker compose down -v` tears it down and removes volumes.

**Profiles:** `profiles:` tag optional services so `docker compose --profile debug up` includes extras (a debug UI, seed job) only when requested — keeping the default stack lean.

**When it's well suited vs graduating:** Compose is excellent for **local development** and **small single-host deployments** — simple, fast, no cluster to run. But it has **no multi-host orchestration, no self-healing/rescheduling, no rolling updates or autoscaling across nodes** — this case used it in production and lost the whole site when one box died, hitting exactly that limitation. When you need **production multi-host** — HA across machines, automatic rescheduling on node failure, horizontal scaling, rolling deploys — **graduate to Kubernetes** (or Nomad). Rule of thumb: Compose for dev and toy prod on one box; Kubernetes when uptime and scale matter.

**How to diagnose / optimize:**
1. App can't reach the DB: `docker compose logs app` to see if it crashed by connecting before the DB was ready; add a `healthcheck` to the db service (e.g. `pg_isready`) and `depends_on: db: condition: service_healthy` to the app so it waits for the DB to be healthy.
2. `depends_on` alone isn't enough: `depends_on` without a condition only guarantees **startup order**, not **readiness** — so the app itself should also have retry/backoff connection logic as a fallback.
3. Single box down = whole site down: not fixable by config, it's an architectural limit — production should move to Kubernetes for automatic rescheduling on node failure and multi-replica HA, or at least multiple machines + a load balancer.
4. Migration path: use `kompose` to convert compose to k8s manifests as a starting point, then add Deployment replica counts, PVCs, Services, probes, and other production essentials.

**Common follow-ups / tradeoffs:** `depends_on` only governs order, `condition: service_healthy` governs readiness, but neither replaces application-level connection retries. Compose is simple, fast, and cluster-free — the sweet spot for local dev and small deployments — but has no self-healing, rescheduling, rolling updates, or scaling; a single host is a single point of failure. For real production HA and scale, move to Kubernetes (or Nomad), at the cost of steeply higher operational complexity — don't over-engineer a toy service.

**Key points:**
- One YAML, multiple services, service name is the hostname for reaching each other
- Startup ordering via `depends_on: condition: service_healthy` + `healthcheck`, with app-level connection retries as fallback
- Profiles for optional stacks; `up -d` to start, `down -v` to tear down
- Compose is single-host with no self-healing/rescheduling/HA — one box down takes the whole site; for multi-host prod HA graduate to Kubernetes

---

### 43. Image vulnerability scanning

**Frequency:** Medium

**Question:** A production image that's run stably for two months and scanned completely clean at build time suddenly gets flagged by the security team for a critical CVE (say a high-severity openssl bug). A developer pushes back: "we never touched this image, the bytes didn't change, how can it suddenly have a vulnerability?" Explain how you do image vulnerability scanning, and why you must re-scan the registry on a schedule rather than only at push time.

**What it is & why:** Image vulnerability scanning compares an image's software bill of materials against public vulnerability databases to find known CVEs — addressing exactly this case's "the image didn't change but the threats did," continuously surfacing security issues both before and after deploy rather than waiting for a quarterly audit.

**Landing it in this case:**

**What the tools scan:** **Trivy, Grype, and Snyk** analyze **image layers** for **known CVEs** in both **OS packages** (the `apt`/`apk` packages in the base image) **and language dependencies** (npm, pip, Go modules in your app). They compare the SBOM against vulnerability databases (NVD, GitHub advisories) and report each finding with a severity and, crucially, **whether a fixed version exists** — e.g. `trivy image myapp:1.2.3 --severity HIGH,CRITICAL`.

**Integrate as a required CI check:** run a scan on every build and **fail the build on high/critical CVEs *that have a fix available*** (e.g. `trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL`) — the "fixed version available" qualifier (`--ignore-unfixed`) matters, because failing on unfixable CVEs just blocks you with no remedy (better to accept/document those). This shifts security left — vulnerabilities are caught before deploy, not in a quarterly audit.

**Scan for more than CVEs:** also run **misconfiguration checks** (Dockerfile lints — running as root, using `latest`, `ADD` from URLs) and **secret detection** (an API key or private key accidentally baked into a layer — a very common leak). Generate an **SBOM** (Software Bill of Materials, e.g. `trivy image --format spdx-json`) so you have a manifest of everything shipped, enabling fast "are we affected?" answers when a new CVE drops.

**Why schedule recurring registry scans (not just on push):** an image is a **frozen snapshot**, but **new CVEs are disclosed daily** against software that image already contains. An image that scanned clean at build time can have **critical vulnerabilities discovered in it weeks later** — this case exactly: the bytes didn't change, the *known* threats did. So **continuously re-scan images in the registry** to catch newly-disclosed CVEs in already-deployed images, and alert so you can rebuild/patch. Scanning only at push time gives a false sense of security for long-lived images.

**How to diagnose / optimize:**
1. Localize which layer the new CVE is in: `trivy image myapp:1.2.3` shows the package and layer the CVE belongs to, telling you if it's a base-image OS package or an app dependency.
2. Find the fix version: if the report's `Fixed Version` column has a value it's fixable — bump the base image tag for OS packages, or the lock-file version for language deps.
3. Rebuild and re-scan: after rebuilding, run the scan again to confirm the CVE is gone, then push back to the registry.
4. No fix version (skipped by `--ignore-unfixed`): assess actual exploitability, document acceptance or add mitigation (e.g. network policy to limit exposure), don't blindly block the build.
5. Build the mechanism: schedule recurring registry scans (Harbor built-in, or a CI cron running Trivy) so a newly-disclosed CVE alerts on-call as soon as it drops.

**Common follow-ups / tradeoffs:** Cover both OS packages and language dependencies — scanning only one misses things. Failing CI on fixable high/critical while letting unfixable ones through with `--ignore-unfixed` is the key balance — otherwise you either block the pipeline or make the gate meaningless. Scanning only at push gives long-lived images a false sense of security; continuous registry scanning catches later-disclosed CVEs. An SBOM lets you answer the blast radius in seconds at the next log4j-scale event.

**Key points:**
- Trivy/Grype scan OS + language deps, `--severity HIGH,CRITICAL`
- Fail CI on fixable high/critical, `--ignore-unfixed` to let unfixable ones through
- Continuously scan the registry (Harbor schedule / CI cron), not just on push — the image doesn't change but threats do
- Pair with SBOM generation to answer "are we affected?" fast during an incident

---

### 44. Non-root, dropped caps, read-only rootfs

**Frequency:** Medium

**Question:** A security assessment finds one of your web service's containers runs as root with a writable root filesystem. The red team demonstrates: after exploiting an RCE in the app, the attacker downloaded and wrote a crypto-mining binary into the container, changed configs, and attempted to escape to the node. You're asked to harden the container to run non-root with least privilege via defense in depth. Explain which layers you'd add and which red-team step each blocks.

**What it is & why:** Container hardening is defense in depth — assume the app *will* be compromised and **minimize what an attacker gains** through several layers (non-root, dropped capabilities, read-only filesystem), which here shut down each step the red team took (write a binary, change configs, escape).

**Landing it in this case:** Several layers, applied in the Dockerfile and Kubernetes `securityContext`:

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
Makes the container's filesystem **immutable**, so an attacker **can't write a malware binary, modify configs, or drop a web shell** — blocking exactly the red team's write-a-mining-binary and change-configs steps here. For apps that need to write (e.g., `/tmp`, a cache dir), **mount those specific paths as writable `emptyDir` volumes** — everything else stays read-only.

**Why this reduces blast radius:** each layer removes a tool the attacker would use — non-root removes privileged actions (blocking escape, which usually requires in-container root), dropped caps remove kernel powers, read-only rootfs removes persistence and payload-writing. The full-container-takeover this case would've been becomes a contained, low-privilege foothold with nowhere to go. (Enforce these cluster-wide with Pod Security Standards / admission policies so no workload skips them.)

**How to diagnose / optimize:**
1. Assess the current state: `kubectl get pod <pod> -o jsonpath='{.spec.containers[*].securityContext}'` to see if `runAsNonRoot`/`readOnlyRootFilesystem` are set; `kubectl exec <pod> -- id` returning `uid=0(root)` means it runs as root.
2. App fails to start after hardening (`CrashLoopBackOff`): usually it needs to write the root filesystem or bind a low port. `kubectl logs` for `permission denied` / `read-only file system`; mount its write paths as `emptyDir`, and for ports <1024 add back `NET_BIND_SERVICE` or switch to a high port.
3. Image built as root so `runAsNonRoot: true` refuses to start: edit the Dockerfile to add `USER 10001` and ensure file ownership/permissions let that UID read.
4. Enforce cluster-wide: apply Pod Security Standards (`restricted` profile) or an OPA/Kyverno admission policy that detects and rejects root, privileged, or writable-rootfs workloads.

**Common follow-ups / tradeoffs:** non-root removes privileged actions, dropping ALL caps and adding back only what's needed shrinks the privileged surface, read-only rootfs blocks persistence and payload writing, and `allowPrivilegeEscalation: false` blocks setuid escalation — each layer blocks a class of attack, and stacking them is the defense in depth. The tradeoff is that hardening can collide with app assumptions (needs to write disk, bind low ports), so patch those back one at a time with `emptyDir` volumes and minimal caps rather than opening everything for convenience. Enforce with PSS/admission policies at the cluster level so no workload quietly skips them.

**Key points:**
- Run as non-root UID (`runAsNonRoot`+`runAsUser`) to block escape
- Drop ALL caps, add back only what's needed (e.g. `NET_BIND_SERVICE`)
- `readOnlyRootFilesystem: true` blocks writing binaries/changing configs; mount `emptyDir` for write paths
- `allowPrivilegeEscalation: false`; enforce cluster-wide with PSS/Kyverno

---

### 45. PID 1 problem and tini

**Frequency:** Medium

**Question:** On every rolling deploy your Node service's pods hang in `Terminating` for the full 30-second grace period before being force-killed — dropping in-flight requests and returning 502s in the meantime — and monitoring shows defunct zombie processes piling up in the container. Someone suspects the app isn't handling SIGTERM. Explain the PID 1 problem in containers and how tini / `--init` solves it.

**What it is & why:** The PID 1 problem is when the app in a container becomes the init process directly but doesn't fulfill init's two duties, causing this case's two symptoms — zombie buildup and failed graceful shutdown. Running a minimal init as PID 1 fixes it.

**Landing it in this case:** In Linux, **PID 1 is special** — it's the **init process** with two duties normal processes don't have: (1) **reaping zombies** — when *any* process's parent dies, its orphaned children are re-parented to PID 1, which must `wait()` on them when they exit or they become **zombies** (defunct entries that leak the process table) — this case's zombie buildup comes from here; (2) **default signal handling** — PID 1 does *not* get the kernel's default signal actions, so it must **explicitly handle SIGTERM** or the signal is simply ignored.

**Why this breaks in containers:** in a container, **your app *is* PID 1**. Many app runtimes (Node, Python, a JVM) were **never written to be init** — they don't reap re-parented grandchildren (zombies accumulate) and, worse, they **don't handle SIGTERM by default**, so `docker stop` / Kubernetes' graceful-termination SIGTERM is **ignored**, the container hangs for the full grace period (this case's 30-second `terminationGracePeriodSeconds`), then gets **SIGKILL**ed — no clean shutdown (in-flight requests dropped, connections not drained, exactly those 502s). **Shell-form ENTRYPOINT** makes it worse: it runs your app under `/bin/sh -c`, so **the shell is PID 1** and typically **doesn't forward signals** to your app at all.

**The fix — a tiny init as PID 1:** use **`tini`** or **`dumb-init`**, minimal init programs that correctly reap zombies and forward signals to your app:
```dockerfile
ENTRYPOINT ["tini", "--", "node", "server.js"]
```
Now `tini` is PID 1, reaps zombies, and forwards SIGTERM to your Node process for a clean shutdown. **Docker's `--init` flag** (`docker run --init`) **injects tini automatically** as PID 1 without changing your image — handy. In Kubernetes there's no `--init` flag; either bake `tini` into the image or ensure your app *does* handle signals and reap children.

**How to diagnose / optimize:**
1. Confirm it's a PID 1 problem: `kubectl exec <pod> -- ps -ef` to see whether PID 1 is your app or `/bin/sh`; a shell-form ENTRYPOINT means the shell is PID 1 and doesn't forward signals.
2. Check for zombies: in `ps -ef`, processes in state `Z` or named `<defunct>` are unreaped zombies.
3. Verify signals: `kubectl exec` in and `kill -TERM 1` to see if the app shuts down; no response means it doesn't handle SIGTERM.
4. Fix: change the Dockerfile to exec-form `ENTRYPOINT ["tini","--","node","server.js"]` (or register a SIGTERM handler in the app for graceful shutdown); locally/Compose, `docker run --init` injects tini temporarily.
5. After the fix, roll again and the pod should exit gracefully as soon as it gets SIGTERM instead of hanging the full grace period — 502s gone, zombies no longer accumulating.

**Common follow-ups / tradeoffs:** PID 1 must reap zombies + handle signals, and ordinary app runtimes do neither. Shell-form ENTRYPOINT makes the shell PID 1 and breaks signal forwarding — always use exec form (JSON array). `tini`/`dumb-init` or `docker run --init` is the general safety net; but if the app itself already handles SIGTERM and reaps children, you can skip the init. Without it, graceful shutdown fails and zombies leak — exactly the symptoms of a pod stuck in `terminating`.

**Key points:**
- PID 1 must reap zombies (`ps -ef` for `<defunct>`) + handle signals
- Shell-form ENTRYPOINT makes the shell PID 1 and breaks signal forwarding — use exec form
- Use `tini`/`dumb-init` or `docker run --init`
- Without it graceful shutdown fails, the pod hangs in `Terminating` the full grace period, in-flight requests dropped

---

### 46. Healthchecks: Dockerfile vs orchestrator

**Frequency:** Medium

**Question:** A JVM service takes 40 seconds to cold-start (build connection pools, warm caches). The team wrote a `HEALTHCHECK` in the Dockerfile, but after deploying to Kubernetes it had no effect — traffic was routed to the pod the moment it came up, causing early-request 500s; then they added a `livenessProbe`, which the slow startup tripped into a restart loop, killing the pod repeatedly. Compare Dockerfile HEALTHCHECK with orchestrator probes, explain why k8s ignores the former, and how to configure probes to fix this.

**What it is & why:** A health check tells the platform "can this container do work right now," but Docker's single healthy/unhealthy bit isn't expressive enough, so Kubernetes replaces it with three semantically distinct probes — mapping exactly onto the distinction this case needs between "still starting up" and "ready to take traffic."

**Landing it in this case:** **Dockerfile `HEALTHCHECK`** bakes a health check *into the image*: `HEALTHCHECK CMD curl -f http://localhost/health || exit 1`. Docker runs it periodically and marks the container **`healthy`/`unhealthy`** (after `--retries`). It's visible in `docker ps` and drives Docker/Swarm behavior. **Docker Compose** can leverage it: `depends_on: {db: {condition: service_healthy}}` **waits for a dependency's healthcheck to pass** before starting a dependent service — solving "app started before the DB was ready."

**Kubernetes *ignores* the Dockerfile HEALTHCHECK entirely** (this is why it had no effect here) and uses its own **pod-spec probes**: **`livenessProbe`** (restart if failing), **`readinessProbe`** (remove from Service endpoints if failing — fixes this case's "traffic routed the moment it came up"), and **`startupProbe`** (protect slow boots — fixes "slow startup tripped a restart loop"). Why the deliberate separation? Kubernetes needs **richer, orchestration-level semantics** than a single healthy/unhealthy bit: it distinguishes "restart me" (liveness) from "stop routing traffic to me" (readiness) from "I'm still booting" (startup) — concepts the Docker healthcheck can't express. It also wants health config in the **declarative pod spec** (versionable, per-environment tunable) rather than frozen into the image. So the image-level healthcheck is simply not consulted.

**Probe mechanisms** available for all three: **exec** (run a command), **HTTP** GET, **TCP** socket connect, and **gRPC** health check — pick per app type. This case's 40-second cold start wants a `startupProbe` giving a `failureThreshold * periodSeconds` ≈ 60-second window during which liveness doesn't run; and until `readinessProbe` passes the pod isn't added to Service endpoints.

**How to diagnose / optimize:**
1. HEALTHCHECK not working in k8s: confirm k8s only honors pod-spec probes — `kubectl describe pod` shows no events from the Dockerfile HEALTHCHECK — rewrite the logic as `readiness/liveness/startupProbe`.
2. Takes traffic on startup and 500s: means the `readinessProbe` is missing or passes too early. Add a readiness pointing at `/health` (which actually checks pool/cache readiness); until ready, k8s won't add the pod to Service endpoints.
3. Slow startup triggers a restart loop: `kubectl describe pod` shows `Liveness probe failed` + repeated `Killing`. Add a `startupProbe` to give enough startup window (liveness doesn't run until startup passes), or raise liveness's `initialDelaySeconds`.
4. Verify: `kubectl get pod` for the `READY 0/1 → 1/1` timing, and `kubectl get endpoints <svc>` to confirm the pod only enters endpoints once ready.

**Common follow-ups / tradeoffs:** Dockerfile HEALTHCHECK is ignored by k8s and only works for Docker/Compose (Compose uses it for `depends_on: condition: service_healthy` startup ordering). k8s's three probes each have a job: liveness restarts, readiness pulls traffic, startup protects slow boots — don't make liveness double as a readiness check (it causes spurious restarts). Probes can be exec/HTTP/TCP/gRPC, pick per app. When the same image runs under both Compose and k8s, point both at the **same `/health` endpoint and criteria** to avoid confusing environment-specific behavior. Tune `initialDelaySeconds`/`startupProbe` so a slow boot doesn't trigger restart loops.

**Key points:**
- Dockerfile HEALTHCHECK is ignored by k8s (only works for Docker/Compose)
- k8s: liveness restarts / readiness pulls traffic / startup protects slow boots — don't conflate them
- Probes can be exec/HTTP/TCP/gRPC
- Slow starts: use `startupProbe` or tune `initialDelaySeconds` to avoid restart loops

---

### 47. docker exec vs run vs attach

**Frequency:** Medium

**Question:** A production container is misbehaving, and a new teammate wanting to "take a look inside" runs `docker attach`, casually hits Ctrl-C, and **kills the live container**, causing a brief outage. Afterward you need to explain to the team the difference between `docker run`, `docker exec`, and `docker attach`, and which to use for debugging a production container.

**What it is & why:** All three can hand you a terminal, so they get confused — but one starts a new container, one opens a new process inside a container, and one takes over the main process's stdio. This case's incident is exactly mistaking "take over the main process" for "safely look inside."

**Landing it in this case:**
- **`docker run`** — **creates and starts a *new* container** from an *image*. `docker run -it ubuntu bash` makes a fresh container. It's the only one that involves an image; the other two operate on **already-running containers**.
- **`docker exec`** — **starts an *additional* process inside an already-running container**. `docker exec -it <container> sh` gives you an **interactive shell alongside** the app that's already running — the app keeps running undisturbed; you're just spawning a second process in its namespaces. This is the **debugging workhorse**: shell in, inspect files, run diagnostics, then exit — the container is unaffected. This is what the new teammate should have used.
- **`docker attach`** — **connects your terminal to the container's existing PID 1 stdio** (the main process's stdin/stdout/stderr). You're not starting anything new — you're wiring into the *primary* process's streams. The gotcha: **Ctrl-C sends SIGINT to PID 1**, which often **kills the container** (since PID 1 *is* the app) — the root cause of this case's incident. Detach safely with the `Ctrl-P Ctrl-Q` sequence, not Ctrl-C.

**For debugging, prefer `docker exec -it <container> sh`** — it's safe (doesn't affect the running app) and gives you a full shell. **Reserve `attach`** for the rare case you genuinely need to see or interact with **PID 1's own output/input** (e.g., a REPL or interactive process running as the main container process). In Kubernetes the analogs are `kubectl exec -it <pod> -- sh`, and for shell-less distroless containers `kubectl debug` ephemeral containers.

**How to diagnose / optimize:**
1. Need to inspect a live container: use `docker exec -it <container> sh` (or `kubectl exec`), never `attach` — exec opens a parallel process, and exiting doesn't touch the main process.
2. Already attached and want to exit safely: press `Ctrl-P Ctrl-Q` to detach, **not Ctrl-C** (which sends SIGINT to PID 1 and kills the container).
3. `exec sh` on a distroless/shell-less image fails with `no such file`: use `kubectl debug -it <pod> --image=busybox --target=<container>` to attach a tool-equipped ephemeral container sharing namespaces.
4. Need a clean environment to reproduce: `docker run -it <image> sh` starts a separate container without touching the production one.

**Common follow-ups / tradeoffs:** `run` starts a new container from an image, `exec` opens an extra process in a running container, `attach` connects to PID 1's stdio — different targets. For debugging production, always `exec -it sh` because it's isolated and doesn't disturb the main process; use `attach` only when you truly need to interact with PID 1 (e.g. a REPL main process), and remember to detach with `Ctrl-P Ctrl-Q` not Ctrl-C. Distroless containers have no shell, so rely on `kubectl debug` ephemeral containers.

**Key points:**
- `run`: new container from an image; `exec`: extra process in a running container; `attach`: connect to PID 1 stdio
- Debug with `docker exec -it sh` / `kubectl exec` — isolated, doesn't disturb the main process
- Ctrl-C after `attach` kills the container; detach with `Ctrl-P Ctrl-Q`
- Distroless has no shell — use `kubectl debug` ephemeral containers

---

### 48. Registry choices

**Frequency:** Medium

**Question:** Your CI suddenly fails en masse at peak, logs full of `toomanyrequests: You have reached your pull rate limit` — dozens of concurrent pipelines all anonymously pulling base images from Docker Hub hit the rate cap. At the same time another team needs to deploy into a **bank intranet cluster with no internet access** and asks how to get images in. Discuss container registry choices and how you handle air-gapped environments and Docker Hub rate limits.

**What it is & why:** A container registry is the store-and-distribute hub for images; choosing one is a tradeoff between CI integration, pull locality, scanning/signing, and cost — this case's rate-limit and air-gap pains both come down to "move images to a registry you control."

**Landing it in this case:** The landscape spans hosted, cloud-native, and self-hosted:
- **Docker Hub** — the default public registry, but the **free tier has pull rate limits** (anonymous/free-account pulls are throttled), which bites CI that pulls base images repeatedly — exactly this case's `toomanyrequests`.
- **GitHub Container Registry (`ghcr.io`)** and **GitLab Registry** — integrate tightly with their **CI** (Actions / GitLab CI) so auth is automatic within pipelines.
- **Cloud-native** — **AWS ECR, Google Artifact Registry, Azure ACR** — integrate with the cloud's IAM (pods pull using their instance/workload identity, no static creds), support geo-replication, and live next to your workloads (fast pulls, no egress).
- **Self-hosted** — **Harbor** (open-source, with built-in **vulnerability scanning, replication, RBAC, signing**) or **JFrog Artifactory** (multi-artifact-type) — for full control, on-prem, or enterprise policy.

**Criteria to weigh:** **CI auth integration** (does your pipeline authenticate cleanly?), **geo-replication** (pull latency for multi-region clusters), **built-in vulnerability scanning**, **signing/policy** support, and **cost** (storage + egress).

**Air-gapped environments:** clusters with no internet can't pull from public registries, so you **mirror upstream images into an internal registry** (Harbor/Artifactory) — pull the needed images once through a controlled boundary, store them internally, and point all workloads at the internal mirror. Combine with an admission policy that only permits the internal registry. This case's bank intranet cluster does exactly this.

**Docker Hub rate limits:** avoid pulling from Docker Hub in CI by **mirroring/caching base images** into your own registry (or use a **pull-through cache** like Harbor's proxy cache or the cloud registries' remote repositories), and authenticate (authenticated pulls have higher limits) — so a burst of CI builds doesn't hit the anonymous limit and start failing with `toomanyrequests`.

**How to diagnose / optimize:**
1. Confirm the rate limit: `toomanyrequests: You have reached your pull rate limit` in CI logs is the Docker Hub anonymous cap (the `ratelimit-remaining` response header shows it during pulls).
2. Immediate mitigation: give CI Docker Hub auth (`docker login`) — authenticated accounts have higher limits — to stop the bleeding.
3. Root fix: set up a **proxy-cache project** in Harbor pointing at `docker.io` (or a remote repo on the cloud registry), change all Dockerfile `FROM`s and CI to pull from the internal registry so base images are fetched from upstream once and then cache-hit.
4. Air-gapped cluster: on an internet-connected relay `docker pull` the needed images → `docker save` / `skopeo copy` across the isolation boundary → push into the internal Harbor; point all workload image refs at the internal registry and use an admission policy (Kyverno/OPA) to reject any non-internal registry.
5. Verify no egress from the air-gap: confirm nodes have no outbound access, and on `ImagePullBackOff` use `kubectl describe pod` to check the pull ref didn't accidentally point at a public registry.

**Common follow-ups / tradeoffs:** Hosted (Docker Hub/ghcr/GitLab) wins on simple CI integration, cloud-native (ECR/Artifact Registry/ACR) on IAM (no static creds) + local pulls, self-hosted (Harbor/Artifactory) on full control + built-in scanning/signing/replication at the cost of running it yourself. Choose on CI auth, geo-replication latency, scanning/signing, and cost. Air-gap requires mirroring upstream internally and locking external sources with admission policy. Docker Hub limits are cured with auth + proxy cache — don't let CI pull anonymously and bare.

**Key points:**
- Cloud-native: ECR/Artifact Registry/ACR (IAM, no static creds); self-hosted: Harbor, Artifactory (built-in scanning/signing)
- Air-gap: mirror upstream into an internal registry + admission policy to lock out external sources
- Docker Hub `toomanyrequests`: authenticate + proxy cache/remote repo, don't pull anonymously and bare
- Choose on CI integration, geo-replication, scanning/signing, cost

---

### 49. Ingress vs Gateway API

**Frequency:** Medium

**Question:** You migrate from NGINX Ingress to Traefik, and a whole batch of services' routing behavior changes — rate limiting, rewrites, and timeouts all stop working, because they were all written as `nginx.ingress.kubernetes.io/...` annotations that Traefik doesn't understand. Meanwhile the app teams have to file a ticket to the platform team every time they want to change a route in the cluster-wide Ingress, and they want to do a 5% weighted canary but find they can only hack it through annotations. Compare Ingress and the Gateway API, say which new deployments should target, and how it solves these problems.

**What it is & why:** Both expose in-cluster Services to external HTTP(S) traffic, but the Ingress spec is so thin that advanced features all get stuffed into vendor annotations — the cause of this case's migration hell and canary hack. The Gateway API is the modern replacement that bakes those into the standard and splits ownership by team role.

**Landing it in this case:** **Ingress** is the **legacy L7 API**. It defines host/path → Service routing, but the spec is **minimal**, so every controller (NGINX, Traefik, ALB) implements advanced features through **vendor-specific annotations** (`nginx.ingress.kubernetes.io/...`). This creates two big problems: **poor portability** (an Ingress tuned for NGINX won't behave the same on Traefik — the annotations are non-standard, exactly why swapping controllers broke this case) and **no clean model** for anything beyond basic HTTP (TCP/UDP, TLS passthrough, traffic splitting, header routing all require hacks or CRDs).

**Gateway API** is the **official successor** — vendor-neutral and expressive by design. Two key improvements:
- **Role-oriented split** into separate resources owned by different teams: **`GatewayClass`** (the controller/infra type, owned by the **infra/platform** team), **`Gateway`** (the actual listener — ports, TLS — owned by **cluster ops**), and **`HTTPRoute`** (routing rules, owned by **app teams**). This lets app developers manage their own routes without touching cluster-wide LB config, with proper RBAC boundaries — removing exactly this case's "file a ticket to change a route" bottleneck, something Ingress couldn't cleanly do.
- **First-class support** for **TCP/UDP/TLS routes**, **weighted traffic splitting** (native canary — `HTTPRoute` with backend weights, no annotations; this case's 5% canary is just a `weight` declaration), and **header-based routing** — all in the standard spec, so behavior is **portable across controllers** (moving to Traefik no longer means a rewrite).

**For new deployments, target the Gateway API** where your controller supports it (Envoy Gateway, Istio, Contour, and NGINX all have Gateway API implementations). It's the future-proof, portable, role-appropriate choice; Ingress remains for existing setups and simple cases.

**How to diagnose / optimize:**
1. Routing/features break after a controller swap: `kubectl get ingress <name> -o yaml` and read the `annotations` — map each `nginx.ingress.kubernetes.io/...` to the new controller's equivalent one by one; this exposes the root non-portability problem.
2. Canary only possible via hacks: on a Gateway-API-capable controller, switch to `HTTPRoute` `backendRefs` with `weight` (e.g. `weight: 95` / `weight: 5`) for native weighted splitting, dropping the annotations.
3. App teams blocked by the platform: split into `Gateway` (platform owns listeners/TLS) + `HTTPRoute` (app teams self-manage routes), scoped by RBAC per namespace, so route changes no longer go through tickets.
4. Migration path: put new services straight on Gateway API; convert existing Ingress with the `ingress2gateway` tool as a starting point, then replace incrementally.
5. Verify: `kubectl describe httproute` and check the `Accepted`/`ResolvedRefs` conditions to confirm the controller accepted the route and resolved the backends.

**Common follow-ups / tradeoffs:** Ingress is legacy, annotation-heavy, non-portable, with no clean model for L4/splitting; Gateway API has role separation (GatewayClass/Gateway/HTTPRoute), portability, and native weighted traffic plus TCP/UDP/TLS/header routing. The tradeoff is Gateway API is newer and needs controller support (Envoy Gateway, Istio, Contour, NGINX have implementations), and its ecosystem/examples are less mature than Ingress; simple cases are still fine on Ingress, but new deployments should target Gateway API.

**Key points:**
- Ingress = legacy, annotation-heavy, breaks on controller swap
- Gateway API = role-split (GatewayClass/Gateway/HTTPRoute), portable
- HTTPRoute uses `weight` for native weighted traffic, no more annotation hacks
- Controllers: Envoy Gateway, Istio, Contour, NGINX; migrate existing with `ingress2gateway`

---

### 50. HPA vs VPA vs Cluster Autoscaler vs Karpenter

**Frequency:** Medium

**Question:** A sales event drives a flood of traffic, and your service's HPA does scale replicas from 10 to 40 — but the new pods all get stuck `Pending` because the cluster has no nodes to fit them, and users start timing out. The postmortem also finds that someone enabled both HPA and VPA on the same service, causing the replica count to oscillate back and forth. Compare HPA, VPA, Cluster Autoscaler, and Karpenter — which axis each scales, and how to combine them in this case.

**What it is & why:** These four autoscalers live on **two different axes** — pods vs nodes — and work *together*. This case's "pods scaled but no nodes to host them" is exactly what happens when you have pod-level scaling but are missing the node-level half.

**Landing it in this case:**

**Pod-level (scale the workload):**
- **HPA (Horizontal Pod Autoscaler)** — scales the **number of pod replicas** up/down based on **CPU, memory, or custom/external metrics** (requests-per-second, queue depth). More load → more pods. The primary way to scale stateless services — it's what scaled replicas from 10 to 40 here.
- **VPA (Vertical Pod Autoscaler)** — **right-sizes a pod's CPU/memory *requests*** over time by observing actual usage. Good for workloads you can't easily replicate (some stateful/singleton apps). **Caveat: don't run VPA and HPA on the *same metric*** — they fight (VPA changes requests, which changes the CPU% HPA scales on, causing oscillation) — exactly this case's replica flapping. Often run VPA in **recommendation-only mode** to inform requests without auto-applying.

**Node-level (scale the cluster):**
- **Cluster Autoscaler (CA)** — **adds/removes nodes** when pods **can't be scheduled** (Pending due to no capacity — this case's symptom) or nodes are underutilized. But it works within **predefined node groups / ASGs** — you must have set up instance-type groups in advance, and it just scales those groups' counts.
- **Karpenter** — a **groupless** node autoscaler (AWS-origin): instead of scaling fixed node groups, it looks at pending pods and **provisions the *just-right* instance type on demand** — picking size, and **mixing spot and on-demand** to minimize cost and fit the exact resource shape needed. Faster and more efficient than CA (no pre-defined groups, better bin-packing, consolidation).

**How they combine:** HPA (or VPA) scales pods; when pods can't fit, **CA or Karpenter** scales nodes to make room. The **modern AWS combo is HPA + Karpenter** — HPA adds replicas under load, Karpenter conjures optimal (often spot) nodes to host them, then consolidates when load drops. This is the layer this case was missing.

**How to diagnose / optimize:**
1. Pods stuck Pending: `kubectl describe pod <pod>` and read Events — `0/N nodes are available: Insufficient cpu/memory` means node capacity is the problem, not pod config.
2. Confirm node-level scaling exists: `kubectl get nodes` to see if node count grows with load; if CA/Karpenter is installed, `kubectl -n kube-system logs <autoscaler>` to see why it didn't add nodes (ASG at max, no matching instance type, Karpenter NodePool limit).
3. Fix the node side: adopt Karpenter (or raise CA's ASG max), ensure an instance-type pool that can host the resource shape of 40 replicas, and pre-warm/reserve capacity before the sale.
4. Fix oscillation: `kubectl get vpa` and `kubectl get hpa` — if they point at the same Deployment/metric they conflict; set VPA to `updateMode: "Off"` (recommend-only) or have each manage a different metric.
5. Verify: re-run a load test and watch HPA add replicas → Karpenter provision nodes in seconds → all pods Running, with nodes consolidated back when load drops.

**Common follow-ups / tradeoffs:** HPA scales replicas, VPA tunes requests (don't share a metric with HPA — it oscillates; prefer recommend mode), CA adds/removes nodes within predefined ASGs, Karpenter is groupless and provisions optimal instances per pending pod. You need both pod-level and node-level or HPA scales pods with no node to host them (this case). CA vs Karpenter: CA is stable and mature but limited to preset node groups; Karpenter is faster, bin-packs better, and mixes spot to save cost but is newer and AWS-leaning. The modern AWS setup is often HPA + Karpenter.

**Key points:**
- HPA scales pods horizontally (replicas); VPA tunes requests, avoid sharing a metric with HPA (oscillates)
- CA scales nodes within predefined ASGs; Karpenter is groupless, provisions optimal instances on demand, mixes spot
- Pods stuck Pending: `describe` first to check node capacity, then check node-level scaling
- Need pod-level + node-level together; modern AWS often uses HPA + Karpenter

---

### 51. PodDisruptionBudgets

**Frequency:** Medium

**Question:** During a cluster node upgrade, an operator runs a single `kubectl drain` to empty a node — which happens to host all 3 replicas of a service, so the service instantly drops to zero and goes down. Afterward you introduce a PDB to prevent a repeat, but someone sets `minAvailable` equal to the replica count, so subsequent drains hang forever and can never make progress. Explain what a PodDisruptionBudget protects against and what it doesn't, and how to avoid both of these pitfalls.

**What it is & why:** A PDB limits how many of an app's pods can be taken down **voluntarily** and **at once**, keeping enough replicas serving during disruptive maintenance — exactly the mechanism to prevent this case's "one drain took out every replica." You declare either **`minAvailable`** (keep at least N pods up) or **`maxUnavailable`** (evict at most N at a time).

**Landing it in this case:** A 3-replica deployment with `minAvailable: 2` means an eviction is only allowed if **at least 2 pods stay running** — so **at most one pod can be evicted at a time**, and the next won't be evicted until a replacement is Ready. This is exactly what prevents this case's "drain empties a node and takes all 3 replicas with it" outage.

**The critical distinction — voluntary vs involuntary disruptions:**
- **PDBs protect against *voluntary* disruptions** — operations Kubernetes *initiates and can throttle*: **`kubectl drain`** (draining a node for maintenance — this case), **node upgrades/rollouts**, and **Cluster Autoscaler / Karpenter** scaling down / consolidating nodes. These respect the PDB — they'll **wait** rather than violate it, so an autoscaler won't drain a node if doing so would breach the budget.
- **PDBs do NOT protect against *involuntary* disruptions** — things no one schedules: a **node hardware crash**, kernel panic, network partition, or an OOM kill. There's no eviction request to block — the pods just die. A PDB can't stop that.

**Implications:** PDBs are **essential for safe rolling node upgrades** in production (without one, a drain can evict all replicas at once). But because they don't cover crashes, you **also** need **multiple replicas spread across zones** (via topology spread constraints / anti-affinity) so an *involuntary* AZ or node failure doesn't take out everything. Also beware setting `minAvailable` == replica count — that **blocks all voluntary eviction** and deadlocks node drains, this case's second pitfall.

**How to diagnose / optimize:**
1. Drain won't progress / hangs: `kubectl drain` reports `Cannot evict pod as it would violate the disruption budget` — the PDB won't allow another eviction. `kubectl get pdb` to see whether `ALLOWED DISRUPTIONS` is 0.
2. If `minAvailable` == replica count (e.g. 3 replicas with `minAvailable: 3`): `ALLOWED DISRUPTIONS` is permanently 0 and drains deadlock forever — change to `minAvailable: 2` or `maxUnavailable: 1` to leave eviction headroom.
3. If replicas simply aren't all up: `kubectl get deploy` for the ready count, and scale up so the healthy count exceeds `minAvailable`, creating eviction room.
4. Prevent one node taking out all replicas: add topology spread constraints (`topologySpreadConstraints` by `topology.kubernetes.io/zone`) or anti-affinity so replicas spread across nodes/AZs.
5. Verify: after configuring, `kubectl drain <node>` should evict pods one at a time, waiting for a replacement to be Ready before the next, and the service never drops to zero.

**Common follow-ups / tradeoffs:** PDBs only guard voluntary disruptions (drain, upgrades, autoscaler consolidation), not involuntary ones (crash, OOM, AZ loss) — so they're a rolling-upgrade safety net, but fault tolerance still needs multiple replicas + cross-zone spread. `minAvailable` vs `maxUnavailable` express the same constraint two ways, but `minAvailable` == replica count deadlocks drains, so always leave headroom. Too strict a PDB slows maintenance, too loose fails to protect — match it to replica count and SLA.

**Key points:**
- Protects only voluntary disruptions (drain/upgrade/consolidation), not crashes/OOM/AZ loss
- `minAvailable` or `maxUnavailable`; never set `minAvailable` == replica count (deadlocks drain)
- Drain stuck: check `kubectl get pdb` `ALLOWED DISRUPTIONS`
- Combine with multi-zone topology spread so one node can't take out all replicas

---

### 52. Init vs sidecar containers

**Frequency:** Medium

**Question:** Your service injects an Envoy sidecar as a mesh proxy, and you hit two weird problems: in the first few seconds after the pod starts, every request the main app makes fails (because the proxy isn't up yet), and a batch Job never completes — it hangs in Running because the Envoy sidecar never exits on its own. Compare init containers and sidecar containers, and explain how native sidecars (K8s 1.28+) fix these.

**What it is & why:** Init containers and sidecar containers are both helper containers in a pod, but with **opposite lifecycles**. This case's two problems are exactly the startup-ordering and exit-timing lifecycle bugs of old-style sidecars (an ordinary container masquerading as one) — native sidecars exist to cure them.

**Landing it in this case:** **Init containers** run **sequentially, to completion, *before* the app containers start** — each must exit successfully before the next runs, and only when all finish does the main container start. They're for **one-time setup**: running **database migrations**, **waiting on a dependency** to be reachable (block until the DB responds), **fetching config/secrets** into a shared volume, or setting file permissions. If an init container fails, the pod won't start — it's a hard prerequisite gate.

**Sidecar containers** run **alongside the main container for the pod's whole life**, **sharing its network namespace and volumes**. Classic uses: a **log shipper** (Fluent Bit reading the app's log volume), a **service-mesh proxy** (Envoy intercepting traffic via the shared netns — this case), or a **config reloader**. They're long-running companions, not run-once setup.

**The old problem native sidecars solve:** before native support, a "sidecar" was just an ordinary app container in the pod, which caused **lifecycle bugs** — e.g., the sidecar (proxy) might **not be ready before the main app starts** (early requests fail — this case's first problem), or the sidecar might **exit before the main container finishes draining** (losing final logs / breaking the mesh during shutdown), and in a Job the pod couldn't complete because the sidecar never exits (this case's second problem).

**Kubernetes 1.28+ native sidecars** fix this: you declare the sidecar as an **`initContainer` with `restartPolicy: Always`**. This special init container **starts before the main containers** (so the proxy/logger is ready first, fixing early request failures) but **keeps running** and **outlives the main container's startup**, and is **terminated after** the main containers on shutdown — giving proper "start first, stop last" ordering. It also lets Jobs complete (the native sidecar is signaled to stop when the main container finishes — fixing the hung Job). This is now the correct way to run sidecars.

**How to diagnose / optimize:**
1. Early-startup requests fail: `kubectl logs <pod> -c <app>` to see connection-refused/unreachable errors in the first seconds, while `-c istio-proxy` (or envoy) logs show the proxy became ready later — the classic "sidecar not ready first."
2. Job hangs in Running: `kubectl get pod` shows the main container `Completed` but the pod still Running; `kubectl get pod -o jsonpath` shows the sidecar still running — an old-style sidecar doesn't exit with the main container.
3. Fix: move the sidecar from ordinary `containers` into `initContainers` with `restartPolicy: Always` (K8s 1.28+; the feature gate is on by default in 1.29). Now the proxy starts first and stops last, and Jobs can complete.
4. Service-mesh case: upgrade to a mesh version that supports native sidecars (Istio can inject in native-sidecar mode), or use Istio Ambient to drop the per-pod sidecar entirely.
5. Verify: after redeploy, early requests no longer fail, and the Job's pod goes to `Completed` normally once the main container finishes.

**Common follow-ups / tradeoffs:** Init containers run sequentially to completion for one-time setup, and a failure means the pod won't start; sidecars run in parallel for the pod's whole life, sharing network/volumes for long-lived helpers. Old-style sidecars (ordinary containers) hit startup-ordering and exit-timing bugs (early request failures, Jobs that never complete, lost logs / broken mesh on shutdown). Native sidecars (init + `restartPolicy: Always`) give the correct "start first, stop last" lifecycle and are the current standard; the tradeoff is they require K8s 1.28+ and mesh/tooling support.

**Key points:**
- Init: one-time setup, runs sequentially to completion, failure blocks pod start
- Sidecar: parallel helper for the pod's life, shares network/volumes
- Native sidecar = init container + `restartPolicy: Always` (K8s 1.28+), starts first, stops last
- Fixes early request failures and Jobs hung in Running

---

### 53. NetworkPolicies and default-deny

**Frequency:** Medium

**Question:** A security audit finds that any pod in your cluster can directly reach the database pods and services in other namespaces — the auditor demonstrates lateral movement from a compromised frontend pod to the payment service. You decide to roll out NetworkPolicies with default-deny, but the moment you apply the default-deny policy, DNS resolution breaks across all services and apps report they can't connect. Explain NetworkPolicies and the default-deny pattern, and how to fix this DNS pitfall.

**What it is & why:** Kubernetes defaults to all pods reachable and fully open, so a compromised pod can move laterally at will (this case); NetworkPolicy is what tightens the network from allow-all to zero-trust, permitting only explicitly declared connections.

**Landing it in this case:** **The critical default: all pods can talk to all pods.** Out of the box, Kubernetes networking is **flat and fully open** — any pod can connect to any other pod in any namespace. This is convenient but insecure: a compromised pod can freely probe and reach the entire cluster (lateral movement — exactly what the auditor demonstrated).

**A NetworkPolicy restricts this.** It **selects pods** (by label) and defines **allowed ingress and/or egress** — the moment *any* policy selects a pod, that pod switches from allow-all to **"deny everything except what's explicitly allowed"** for the covered direction. Policies are **additive** (allow-lists union together).

**The recommended pattern is default-deny + targeted allows.** First apply a **namespace-wide default-deny** that selects all pods and permits nothing:
```yaml
spec:
  podSelector: {}          # selects every pod in the namespace
  policyTypes: [Ingress, Egress]
  # no ingress/egress rules = deny all
```
Then **layer explicit allow policies** per app: "frontend pods may reach backend on port 8080," "backend may egress to the database and to DNS." This is **zero-trust networking** — nothing is reachable unless declared — so a breached pod can only reach exactly what its policy permits, drastically limiting blast radius. **Remember to allow egress to CoreDNS on port 53**, or name resolution breaks under default-deny egress — this case's broken DNS and a classic gotcha.

**Requires a policy-aware CNI:** NetworkPolicy is just an *API* — **the CNI plugin must enforce it**. Flannel (basic) doesn't; **Calico and Cilium** do. If your CNI ignores policies, they silently have no effect — a dangerous false sense of security.

**Cilium adds L7 policies:** standard NetworkPolicy is **L3/L4** (IP + port). **Cilium** (eBPF-based) extends this to **L7** — e.g., allow only `GET /api/public` but not `POST /admin`, or restrict specific **gRPC methods** and Kafka topics — identity-aware, application-protocol-level rules that plain NetworkPolicy can't express.

**How to diagnose / optimize:**
1. DNS breaks after applying default-deny: apps report `no such host` / resolution failures — default-deny egress also cut traffic to CoreDNS. Add an allow-egress rule to the CoreDNS pods in `kube-system` on **UDP/TCP 53**.
2. Services can't reach each other: `kubectl describe networkpolicy` to see selected pods and allow rules, and add allows matching the real call chain one by one (e.g. "frontend→backend 8080", "backend→DB 5432").
3. Policies seem to have no effect (default-deny applied but everything still connects): the CNI probably doesn't enforce policy — confirm you're on Calico/Cilium, not bare Flannel, and `kubectl get pods -n kube-system` to see the CNI components running.
4. Verify isolation: from a pod that shouldn't have access, `kubectl exec` and try `nc -zv <db-pod-ip> 5432` or `curl` — it should be denied; from an allowed pod it should connect.
5. Finer-grained needs (allow only a certain HTTP path/gRPC method): adopt Cilium's L7 `CiliumNetworkPolicy`.

**Common follow-ups / tradeoffs:** The default is allow-all, so use default-deny + targeted allows to tighten to zero-trust — but always remember to allow DNS (CoreDNS 53), or name resolution breaks entirely (the most-hit pitfall). NetworkPolicy is only an API and needs a policy-aware CNI (Calico/Cilium) to take effect; Flannel silently ignores it, giving a false sense of security. Standard policies only reach L3/L4 — to control by HTTP path/gRPC method you need Cilium L7. The tradeoff is finer policies cost more to maintain, and default-deny means every new service must add explicit rules to come online.

**Key points:**
- Default allow-all; use default-deny + targeted allows for zero-trust
- After default-deny egress, you must allow DNS (CoreDNS 53) or all resolution breaks
- Needs a policy-aware CNI (Calico/Cilium); Flannel silently fails
- Cilium adds L7 (HTTP/gRPC) policies

---

### 54. CoreDNS

**Frequency:** Medium

**Question:** A high-QPS service of yours calls an external API (`api.github.com`) frequently, and monitoring shows CoreDNS load is abnormally high with occasional SERVFAILs, while a big chunk of the service's external-call latency is DNS. A packet capture reveals that resolving `api.github.com` fires **4 queries**, the first 3 all NXDOMAIN. Explain CoreDNS in Kubernetes and the `ndots:5` external-lookup problem, and how to optimize it.

**What it is & why:** CoreDNS is the cluster's default DNS server, doing name resolution for every pod; but combined with the `ndots:5` rule injected into pods, external-domain resolution generates a burst of failed queries — the root cause of this case's "4 queries per resolution" and high CoreDNS load.

**Landing it in this case:** **CoreDNS** is the **default cluster DNS server** — a pluggable DNS server (running as a Deployment) that gives every pod name resolution. It resolves:
- **Service records**: `<service>.<namespace>.svc.cluster.local` → the Service's ClusterIP. This is how pods find each other by name.
- **Headless service per-pod A records**: for `clusterIP: None` services, it returns **one A record per backing pod** (and stable `<pod>.<svc>...` names for StatefulSets).
- **SRV records**: advertise **service + port** (used for port discovery).
- **External queries**: names outside the cluster domain are **forwarded upstream** (to the node's resolver / configured forwarders).

**The `ndots:5` amplification problem:** Kubernetes injects `options ndots:5` into every pod's `/etc/resolv.conf` along with a **search list** (`<ns>.svc.cluster.local`, `svc.cluster.local`, `cluster.local`). The `ndots:5` rule means: **if a queried name has *fewer than 5 dots*, try appending each search domain *first* before trying it as-is.** So resolving an external name like `api.github.com` (2 dots < 5) triggers a cascade of **failed lookups** — `api.github.com.<ns>.svc.cluster.local`, `api.github.com.svc.cluster.local`, `api.github.com.cluster.local` — all NXDOMAIN — **before** finally querying `api.github.com` itself. That's 4 lookups instead of 1, multiplying DNS load and adding latency for every external call — exactly this case's packet capture.

**Mitigations:** use a **fully-qualified name with a trailing dot** (`api.github.com.`) which has enough dots / signals "absolute, don't append search domains"; or set **`dnsConfig.options` with a lower `ndots`** (e.g., `ndots: 2`) on pods that mostly call external services; or use **NodeLocal DNSCache** to cache and cut the round-trips.

**SLIs and scaling:** watch **cache hit ratio**, **forward (upstream) latency**, and **error/SERVFAIL rate**. Scale **CoreDNS replicas with cluster size** (more pods = more query volume), and use **NodeLocal DNSCache** (a per-node cache) to reduce load on the central CoreDNS and cut latency — DNS is a common cluster-wide bottleneck and outage source.

**How to diagnose / optimize:**
1. Confirm the amplification: inside a pod, `cat /etc/resolv.conf` to see `options ndots:5` and the search list; `kubectl exec` and `dig api.github.com` (or a capture) to see whether it fires a series of `...svc.cluster.local` NXDOMAINs before querying the real name.
2. Quickly prove the search domains are the culprit: `dig api.github.com.` (with a trailing dot) should fire just 1 query and succeed immediately, versus 4 without the dot.
3. Fix the app side: write external domains as FQDNs with a trailing dot, or configure that service's pods with `dnsConfig: {options: [{name: ndots, value: "2"}]}` to lower the threshold.
4. Fix the CoreDNS side: `kubectl top pods -n kube-system` to see if CoreDNS CPU is maxed, deploy **NodeLocal DNSCache** so each node's local cache absorbs repeated queries, and scale CoreDNS replicas with query volume.
5. Investigate SERVFAIL: `kubectl logs -n kube-system -l k8s-app=kube-dns` to see if upstream forwarding times out/fails, and tune CoreDNS's `forward` upstream and `cache` plugin if needed.
6. Verify: after optimizing, CoreDNS query volume and CPU drop, external-call DNS latency converges, and SERVFAILs disappear.

**Common follow-ups / tradeoffs:** CoreDNS resolves Service ClusterIPs, headless per-pod A records, and SRV records, and forwards external names upstream. `ndots:5` makes external domains with fewer than 5 dots run through the search list first, producing 3 NXDOMAINs before the real query — amplifying load and latency; mitigate with FQDN trailing dots, lower `ndots`, or NodeLocal DNSCache. Tradeoff: lowering `ndots` can break short-name resolution of same-namespace services, so customize per service rather than changing it globally. DNS is a cluster-wide invisible bottleneck — monitor cache hit ratio / upstream latency / SERVFAIL and scale replicas with size.

**Key points:**
- Resolves `<svc>.<ns>.svc.cluster.local`, headless -> per-pod A records, SRV, forwards external upstream
- `ndots:5` amplifies external lookups to 4 queries; fix with FQDN trailing dot or lower `ndots`
- NodeLocal DNSCache cuts central load and latency; scale CoreDNS replicas with size
- Monitor cache hit ratio / upstream latency / SERVFAIL — DNS is a cluster-wide invisible bottleneck

---

### 55. Service mesh: what does it add

**Frequency:** Medium

**Question:** You have dozens of microservices written in five languages, security requires all service-to-service calls to be mTLS-encrypted, and SRE wants uniform retries/timeouts/canary and cross-service tracing — but nobody wants to re-implement all this in each language. Someone proposes a service mesh. Explain what a service mesh adds, its tradeoffs, and when it's worth adopting.

**What it is & why:** A service mesh (Istio, Linkerd, Cilium Service Mesh) transparently intercepts traffic (traditionally via a **sidecar proxy** injected next to each pod) and handles service-to-service networking concerns uniformly **without changing application code** — exactly solving this case's "many languages, don't want to re-write mTLS/resilience/tracing in each."

**Landing it in this case:** What it adds:
- **mTLS between services** — automatic mutual TLS: every service-to-service call is encrypted and both ends authenticated, giving **zero-trust networking** with certificate rotation handled for you. Apps don't implement TLS — meeting this case's encryption compliance requirement with zero changes across five languages.
- **Fine-grained traffic policy** — **retries, timeouts, circuit breakers**, and outlier detection enforced uniformly at the proxy, so resilience patterns don't have to be re-implemented in every service/language.
- **Canary / weighted routing** — split traffic by percentage or headers for progressive delivery (this is what Flagger drives).
- **Uniform observability** — **consistent metrics, traces, and logs** for *every* call, generated at the proxy — so you get golden-signal telemetry across all services regardless of language, with no per-app instrumentation.

**Tradeoffs (it's not free):**
- **Latency and resource tax** — every request hops through a proxy (extra network hop + CPU/memory per sidecar). **Linkerd** is the lightest (purpose-built Rust micro-proxy); **Istio** is the most featureful but heavier.
- **Operational complexity** — you now run and upgrade a whole control plane + hundreds of sidecars; misconfiguration can break all traffic.
- **Debugging difficulty** — the proxy adds a layer between services, so failures can be in the app *or* the mesh, and "why is this request being retried/failing?" gets harder to trace.

**Sidecarless meshes reduce the overhead:** **Cilium** (eBPF in the kernel) and **Istio Ambient mode** move the data plane out of per-pod sidecars — into the node (eBPF or a per-node ztunnel) — **eliminating the sidecar-per-pod tax** (less latency, memory, and lifecycle complexity) while keeping mTLS and L4 policy, adding L7 features via shared proxies only when needed.

**How to diagnose / optimize:**
1. Request latency rose after adopting the mesh: compare p99 before/after, and use `istioctl proxy-config` / proxy metrics to see if it's the sidecar hop overhead; choose lightweight Linkerd or move to Ambient/Cilium to drop the per-pod sidecar.
2. Requests mysteriously retried/failing and you're unsure if it's app or mesh: read the proxy's access logs and response flags (Envoy's `response_flags`, e.g. `UO`/`URX`), `istioctl analyze` for config errors, and use distributed tracing to pinpoint which hop failed.
3. mTLS handshake failures / 503s: confirm both ends have sidecars injected and `PeerAuthentication` policy is consistent (`STRICT` vs `PERMISSIVE`), using `PERMISSIVE` for a gradual migration.
4. Sidecar-not-ready causing early request failures: use native sidecars (see the Init/Sidecar question) so the proxy starts first.
5. Judge whether it's worth it: with few services, evaluate whether you only need library-level retries + off-the-shelf mTLS instead of a whole control plane.

**Common follow-ups / tradeoffs:** A mesh adds mTLS + uniform retries/timeouts/circuit breakers + weighted routing + cross-service observability, all transparent to the app and language-agnostic. The cost is per-request proxy-hop latency and CPU/memory tax, operational complexity of a control plane + many sidecars, and the extra debugging layer. Linkerd is simple and light, Istio the most featureful but heavy; sidecarless Ambient/Cilium use a node-level data plane to eliminate the per-pod tax. Bottom line: worth it when **many services need uniform mTLS/observability/traffic control**; overkill for a handful.

**Key points:**
- mTLS + retries/timeouts/circuit breakers + weighted routing + uniform observability, transparent and language-agnostic
- Sidecar tax (latency + CPU/memory) vs sidecarless (Ambient/Cilium node-level)
- Linkerd: simple and light; Istio: featureful but heavy
- Adds a debug surface, failures can be app or mesh; don't over-engineer for few services

---

### 56. CRDs and the operator pattern

**Frequency:** Medium

**Question:** Your team runs dozens of HA Postgres clusters, and the DBA has to manually provision storage, configure primary/replica replication, get up at midnight to fail over when the primary dies, and maintain backup scripts — slow, error-prone, and the sole bottleneck. Someone proposes codifying these runbooks into software with an Operator. Explain CRDs and the operator pattern, and how it solves this case.

**What it is & why:** A CRD adds a custom resource type to the Kubernetes API, and an Operator is a controller that continuously reconciles actual state to that resource's spec — together they encode this case's "expert manual procedures, error-prone, non-scalable" day-2 operations into automated software.

**Landing it in this case:** A **CustomResourceDefinition (CRD)** **extends the Kubernetes API with a new resource kind**. After you register a CRD, you can `kubectl apply` / `get` your own type (e.g., `kind: PostgresCluster`) exactly like a built-in Pod or Service — stored in etcd, validated by a schema, and served by the API. On its own a CRD is just **data** — declaring the kind doesn't *do* anything.

An **operator** supplies the *behavior*: it's a **custom controller that watches instances of the CRD and continuously reconciles real-world state to match the spec** — the same **desired-vs-actual reconciliation loop** Kubernetes uses for built-in resources. You declare `kind: PostgresCluster` with `replicas: 3`, and the operator does the actual work: provisions the pods and storage, configures replication, and keeps it that way — everything this case's DBA did by hand.

**Why it's powerful — it codifies operational knowledge as software.** Running a stateful system like a database involves expert, error-prone procedures: **provisioning, configuring replication, performing failover when the primary dies, taking scheduled backups, doing safe upgrades** (exactly what this case's DBA shoulders manually). An operator **encodes those runbooks into a controller** so they happen automatically and consistently — the human expertise becomes reconciliation logic, the operator auto-fails-over when the primary dies and runs backups on the spec's schedule. This is the Kubernetes-native way to automate "day-2" operations for complex apps.

**Tools and examples:** build operators with **kubebuilder** or the **Operator SDK** (scaffolding for the CRD schema + controller reconcile loop, usually in Go). Well-known examples: **cert-manager** (`Certificate` resource → automatically obtains and renews TLS certs from Let's Encrypt), the **Prometheus Operator** (`Prometheus`/`ServiceMonitor` → manages Prometheus instances and scrape config), and **postgres-operator** / **CloudNativePG** (manages HA Postgres clusters with failover and backups) — adopting CloudNativePG here would replace most of the manual runbooks directly.

**How to diagnose / optimize:**
1. Landing this case: install a mature Postgres Operator (e.g. CloudNativePG), declare each cluster as `kind: Cluster` with `instances: 3` + storage + backup policy, `kubectl apply`, and the operator auto-provisions, configures replication, and manages failover.
2. Operator not reconciling to spec (changed the CR but nothing happens): `kubectl describe <cr>` to read status/conditions and events, and `kubectl logs -n <ns> deploy/<operator>` to see if the reconcile loop errors (insufficient RBAC, webhook failure, missing dependency).
3. Custom CR apply rejected: usually the CRD's OpenAPI schema validation or a validating webhook blocked it — `kubectl explain <kind>` to check fields, and read the webhook logs.
4. Building your own Operator: use kubebuilder to scaffold, implement an idempotent reconcile function (each pass pulls actual toward desired, safely re-entrant), and handle finalizers on deletion.
5. Verify failover: kill the primary pod and watch the operator auto-promote a replica, update the Service to point at the new primary, restoring what the DBA used to do by hand.

**Common follow-ups / tradeoffs:** A CRD only adds an API type (data); the Operator provides the behavior (reconcile loop) — you need both together. Its value is encoding domain ops knowledge into software so day-2 operations are automatic, consistent, and scalable. Tradeoff: building your own Operator is real software-engineering investment (idempotent reconcile, edge cases, upgrades, finalizers) and is overkill for simple cases; for mature domains prefer an off-the-shelf Operator (cert-manager, Prometheus Operator, CloudNativePG) rather than reinventing it. A poorly-designed reconcile loop can cause flapping or races.

**Key points:**
- CRD adds a new API kind (data only); the Operator controller reconciles desired vs actual (behavior)
- Encodes runbooks like failover/backup/upgrade into software — automatic, consistent, scalable
- Build with kubebuilder/Operator SDK; reconcile function must be idempotent and handle finalizers
- For mature domains prefer an off-the-shelf Operator (CloudNativePG, etc.), don't reinvent the wheel

---

### 57. Rolling update vs Recreate

**Frequency:** Medium

**Question:** A stateless API service uses the default rolling update to ship v2, and 5xx errors briefly spike on every release; a neighboring singleton service that holds a database lock occasionally corrupts data after a release. Explain the difference between rolling update and Recreate, how the two knobs are tuned, which strategy each of these services should use, and how to diagnose that 5xx spike.

**What it is & why:** Rolling update and Recreate are the two Deployment update strategies with opposite tradeoffs — one preserves availability, the other guarantees "no mixed versions running" — matching this case's two services' different pains.

**Landing it in this case:** **Rolling Update (the default)** — gradually **replaces old pods with new ones, a few at a time**, keeping the service up throughout. Two knobs tune the rollout:
- **`maxSurge`** — how many **extra pods above the desired count** may be created during the roll (temporary over-capacity to bring up new pods before removing old).
- **`maxUnavailable`** — how many pods may be **missing** (below desired) at once.

These trade **speed vs availability**: higher surge/unavailable = faster rollout but more capacity churn or reduced headroom. This case's stateless API, **for zero-downtime**, should set **`maxUnavailable: 0`** (never drop below full capacity) with **`maxSurge: 25%`** (spin up new pods first, then retire old) — but this **requires spare cluster capacity** for the extra surge pods. Crucially, zero-downtime also **requires good readiness probes** so traffic only shifts to a new pod once it's *actually* ready (otherwise you rout to pods that aren't serving yet) — the prime suspect for that 5xx spike.

**Recreate** — **terminates ALL old pods, then starts the new ones**. Dead simple, but there's a **downtime gap** between the old pods dying and new pods becoming Ready. No mixed versions ever run. This case's **singleton holding an exclusive lock** should use it: two instances would conflict (the root cause of the occasional data corruption). Another classic Recreate case is an **incompatible database schema migration** (v2 pods expect a new schema that v1 pods would break on — you can't have both hitting the DB at once). Accept the brief downtime to guarantee a clean version switch. For everything else, rolling update is preferred.

**How to diagnose / optimize:**
1. 5xx spikes on API release: `kubectl get deploy <svc> -o yaml` to check `strategy` — usually `maxUnavailable` is non-zero or readiness probes aren't set up, so traffic hits pods that aren't up yet.
2. Confirm readiness: `kubectl describe pod <new-pod>` to check the readinessProbe passes only when truly ready; `kubectl get endpoints <svc>` to watch whether endpoints briefly empty during release.
3. Change to `maxUnavailable: 0` + `maxSurge: 25%` + a proper readiness probe, redeploy, and watch the p99/5xx curve smooth out.
4. Singleton's occasional data corruption: confirm it's currently rolling update — at the release instant both v1 and v2 hold the lock simultaneously; change to `strategy.type: Recreate` to eliminate the overlap window.
5. If Recreate's downtime window is unacceptable, consider finer mutual-exclusion like a `PodDisruptionBudget`/leader election instead.

**Common follow-ups / tradeoffs:** Rolling update uses maxSurge/maxUnavailable to trade speed vs availability, `maxUnavailable: 0` + `maxSurge: 25%` for zero-downtime but needs spare capacity and good readiness probes; Recreate is dead simple but has a downtime gap, used when the app **cannot tolerate two versions running at once** (incompatible schema migration, singleton holding an exclusive lock). Pitfalls: without solid readiness probes even a "zero-downtime" config still leaks traffic to unready pods; without spare capacity the surge pods can't start and the rollout stalls.

**Key points:**
- maxSurge + maxUnavailable tune the rollout, trading speed vs availability
- maxUnavailable: 0 + maxSurge: 25% for zero-downtime, but needs spare capacity + readiness probes
- Recreate for incompatible versions / exclusive-lock singletons (accept brief downtime for a clean switch)
- 5xx spike: check strategy and readiness probes + endpoints first

---

### 58. ServiceAccount and pod identity

**Frequency:** Medium

**Question:** A security audit finds one of your pod's images has a long-lived AWS access key pair hardcoded in an ENV, used to read S3; meanwhile another pod gets `403` and can't even list resources in its own namespace. Explain how a pod gets an identity and authenticates to the Kubernetes API and cloud APIs, how to eliminate that hardcoded key, and how to debug the 403.

**What it is & why:** A pod has two identity needs — the ServiceAccount for the in-cluster Kubernetes API, and workload identity federation for external cloud APIs — both aimed at **not putting static long-lived credentials into the pod**, exactly curing this case's hardcoded key and permission problems.

**Landing it in this case:** **Kubernetes API identity — the ServiceAccount:** every pod runs as a **ServiceAccount (SA)**, and a **projected SA token** (a short-lived, audience-scoped JWT) is **mounted into the pod** (at `/var/run/secrets/kubernetes.io/serviceaccount/token`). The pod presents this token to authenticate to the **Kubernetes API**, and RBAC bindings on the SA determine what it can do — this case's `403` is a break somewhere on this chain.

**Cloud API identity — workload identity federation:** what this case's hardcoded key needs to solve is authenticating to **cloud** APIs (S3, Secrets Manager, GCS) *without* baking static cloud credentials into the pod. The naive approach — putting an AWS access key in an env var or image — is a security disaster (long-lived, easily leaked, hard to rotate, shared across pods), exactly what the audit caught. **Workload identity** solves it by **exchanging the pod's SA token for temporary cloud credentials** via OIDC:
- **AWS IRSA (IAM Roles for Service Accounts)** — the SA is annotated with an IAM role (`eks.amazonaws.com/role-arn`); the cluster's OIDC provider lets AWS STS trust the SA token and **hand back short-lived IAM credentials** for that role.
- **GKE Workload Identity** and **Azure Workload Identity** — the same pattern for GCP and Azure: SA ↔ cloud IAM identity mapping, token exchanged for scoped cloud creds.

**Why projected, auto-rotating tokens beat baked-in keys:** the mounted SA token is **projected** (bound to the pod, a specific audience, and an expiry) and **automatically rotated** by the kubelet before it expires — so a leaked token is short-lived and useless soon. Combined with workload identity, **no long-lived cloud secret ever exists in the pod or image** — credentials are minted on demand, scoped to exactly one role, and expire quickly. This is the least-privilege, no-static-secrets way to give pods cloud access.

**How to diagnose / optimize:**
1. Eliminate the hardcoded key: add an IRSA annotation to the pod's SA binding a minimal read-only-S3 IAM role, delete the access key from the image/ENV, and after rebuild `aws sts get-caller-identity` inside the pod to confirm it gets the role's temporary credentials, not a static key.
2. Don't forget to rotate/revoke the leaked key pair (it's been in image history, treat it as compromised).
3. In-namespace `403`: `kubectl auth can-i list pods --as=system:serviceaccount:<ns>:<sa>` to reproduce the permission decision; `kubectl get pod <p> -o jsonpath='{.spec.serviceAccountName}'` to confirm which SA it uses (defaults to `default`, which usually has no Role bound).
4. `kubectl describe rolebinding,clusterrolebinding -n <ns>` to see whether the SA is bound to a suitable Role; if missing, add a minimal-privilege RoleBinding.
5. Cloud-side IRSA not working: check the SA's annotated role-arn, and that the IAM role trust policy's OIDC provider and `sub` (`system:serviceaccount:<ns>:<sa>`) match.

**Common follow-ups / tradeoffs:** The SA is the pod's in-cluster identity and RBAC decides what it can do; for cloud APIs, IRSA / GKE / Azure Workload Identity exchanges the SA token via OIDC for a scoped role's temporary cloud credentials. Projected tokens are short-lived, audience-scoped, and auto-rotated by the kubelet, so a leak expires fast; with workload identity there's no long-lived cloud key in the image at all. Pitfalls: pull secrets are namespace-scoped, the `default` SA has no RBAC by default, and a wrong `sub` in the IAM trust policy fails silently. Never bake cloud keys into images.

**Key points:**
- SA = pod's k8s identity, RBAC bindings decide permissions (for 403, check which SA + RoleBinding first)
- For cloud APIs use IRSA / Workload Identity, SA token exchanged via OIDC for temporary creds
- Tokens are projected, audience-scoped, auto-rotated by the kubelet
- Never bake cloud keys into images; rotate and revoke if leaked

---

### 59. etcd

**Frequency:** Medium

**Question:** One day your whole cluster suddenly "freezes" — `kubectl` commands take tens of seconds to return, controllers stop working, new pods won't schedule, yet the nodes and applications themselves look fine. Monitoring shows one etcd node's disk latency has spiked. Explain etcd's role in the cluster (Raft, latency, backup, encryption), and how to diagnose and prevent this class of failure.

**What it is & why:** **etcd** is the **strongly-consistent, distributed key-value store** that holds **all Kubernetes cluster state** — every object (pods, services, secrets, configmaps) lives in etcd. The API server is essentially a stateless front-end over it. If etcd is unhealthy, the whole control plane is — this case's "cluster frozen but apps fine" is the textbook picture of an etcd problem.

**Landing it in this case:** **Raft and odd-sized clusters:** etcd uses the **Raft consensus algorithm** to keep replicas consistent, which requires a **quorum (majority)** to commit any write. Quorum math is why you run **odd-sized clusters (3 or 5 nodes)**: a 3-node cluster tolerates **1** failure (2 of 3 = majority), a 5-node tolerates **2**. An *even* size gives no extra fault tolerance (4 nodes still only tolerate 1, since you need 3 for majority) while adding cost and increasing split-brain risk — so always odd.

**Latency sensitivity (this case's root cause):** every write must be **fsync'd to disk and replicated to a quorum** before it's committed, so etcd is **extremely disk- and network-latency sensitive**. It needs **fast dedicated disks (low-latency NVMe SSDs)** and ideally **dedicated nodes** — co-locating etcd with noisy workloads, or putting it on slow/network storage, causes write latency to spike, which stalls the entire API (slow `kubectl`, failing controllers) — this case's spiking disk is the culprit.

**Backup and restore drills:** back up regularly with **`etcdctl snapshot save`** — and critically, **rehearse restores** (`etcdctl snapshot restore`). A backup you've never tested restoring is not a backup. etcd is the single source of truth, so a corrupted/lost etcd with no restorable snapshot means rebuilding the cluster from scratch.

**Encryption at rest:** by default etcd stores data (including **Secrets**) unencrypted on disk. Enable **encryption-at-rest backed by a KMS** so Secrets aren't readable from an etcd disk/backup leak (this is the same requirement from the Secrets question).

**How to diagnose / optimize:**
1. Confirm etcd is slow: check the etcd metrics `etcd_disk_wal_fsync_duration_seconds` and `etcd_disk_backend_commit_duration_seconds` (p99 should be tens of ms; hundreds of ms/seconds means the disk is dragging), plus the API server's `etcd_request_duration_seconds`.
2. Confirm quorum health: `etcdctl endpoint status --cluster -w table` to see leader and whether raftIndex is consistent, and `etcdctl endpoint health` per node, to tell whether it's a slow disk or lost majority.
3. Fix a slow disk: move etcd to dedicated low-latency NVMe SSD, peel off co-located noisy workloads, avoid network storage; verify disk latency with `iostat`/`fio`.
4. Lost quorum: restore from the latest `etcdctl snapshot save` snapshot with `etcdctl snapshot restore` and re-form the cluster — assuming you've **rehearsed** the restore.
5. Prevent: odd 3/5 nodes, dedicated fast disks, regular snapshots + regular restore drills, KMS encryption at rest.

**Common follow-ups / tradeoffs:** etcd is the consistent, latency-sensitive, quorum-dependent heart of the cluster — **disk latency spikes** or **quorum loss** (losing majority) take down the whole API, which is why most control-plane outages trace back to it. Raft needs a majority to commit, hence odd node counts (3 tolerates 1, 5 tolerates 2); even counts only add cost and split-brain risk. A snapshot you've never rehearsed restoring isn't a backup; Secrets are stored in plaintext by default, so enable KMS encryption. Treat it as the most critical, most carefully-operated component.

**Key points:**
- Raft, odd 3/5 nodes for fault tolerance; even counts add cost and split-brain risk with no benefit
- Latency-sensitive: fast/dedicated disks essential, a slow disk freezes the whole API
- Regularly rehearse snapshot + restore (an untested backup isn't a backup)
- Encrypt at rest with KMS; for a freeze, check fsync/commit latency and quorum first

---

### 60. ImagePullBackOff causes

**Frequency:** Medium

**Question:** After a release, new pods are all stuck in `ImagePullBackOff` and won't start, but rolling back to the previous image works fine; at the same time another batch of CI builds using Docker Hub base images report `toomanyrequests`. Explain the causes of `ImagePullBackOff`, how to diagnose it step by step, and how to prevent it architecturally.

**What it is & why:** `ImagePullBackOff` means the kubelet **can't pull the container image** and is backing off between retries (the transient state is `ErrImagePull`, then it settles into `ImagePullBackOff`). Understanding it matters because it's an *infrastructure/config* problem, not an app crash — the debugging direction is completely different, and this case's "rollback fixes it" strongly points at the new image's name/tag/credentials.

**Landing it in this case:** **Always start with `kubectl describe pod`** — the Events section shows the **exact registry error** ("not found," "unauthorized," "toomanyrequests"), which points straight at the cause:

1. **Typo in image name or tag** — `myapp:v1.2` when the tag is `v1.2.0`, or a misspelled repo. Error: `manifest unknown` / `not found`. The most common cause, and the prime suspect for this case's new tag not pulling.
2. **Registry unreachable** — network/DNS/firewall between the node and the registry (private registry not routable, egress blocked).
3. **Missing or wrong-namespace `imagePullSecret`** — pulling a private image without the credential, or the `imagePullSecret` exists in a *different namespace* than the pod (secrets are namespaced). Error: `unauthorized`.
4. **Expired / wrong private-registry credentials** — the pull secret's token expired, or cloud creds (ECR/GCR) weren't refreshed (ECR tokens are short-lived — need the credential helper / IRSA).
5. **Docker Hub anonymous rate limits** — `toomanyrequests` when unauthenticated CI/nodes exceed the pull limit — exactly this case's CI builds.
6. **Digest no longer exists** — pinned to `@sha256:...` for an image that was deleted/garbage-collected from the registry.

**How to diagnose / optimize:**
1. `kubectl describe pod <p>` and read the exact registry error in Events — triage by error first (`not found` / `unauthorized` / `toomanyrequests`).
2. `not found`: check the image name + tag in the manifest, and `docker pull <image:tag>` or `crane manifest <image:tag>` locally to verify the tag really exists, then fix the tag.
3. `unauthorized`: `kubectl get secret -n <ns>` to confirm the pull secret is in the pod's *same* namespace, and `kubectl get sa <sa> -o yaml` to see if it references `imagePullSecrets`; for ECR/GCR confirm the credential helper / IRSA is auto-refreshing the short-lived token.
4. `toomanyrequests` (this case's CI): switch to authenticated pulls for a higher limit, and mirror base images into your own registry instead of hitting Docker Hub anonymously.
5. Node can't reach the registry: `curl -v https://<registry>/v2/` on the node to verify DNS/network/firewall.
6. Prevent: **mirror critical images into your own registry** (Harbor/ECR) so you don't depend on a third party's availability or rate limits; authenticate pulls (higher limits); use cloud credential helpers/IRSA so registry creds auto-refresh; pre-pull or cache base images. A registry outage or rate-limit shouldn't be able to stop pods from scheduling.

**Common follow-ups / tradeoffs:** The six causes — name/tag typo (most common), registry unreachable, missing or cross-namespace pull secret, expired credentials (ECR tokens are short-lived, need helper/IRSA), Docker Hub anonymous rate limits, and garbage-collected digests. Diagnosis always starts from the exact error in `kubectl describe pod` Events. The key to resilience is mirroring upstream images into your own registry + authenticated pulls, so a third party's rate limit or outage can't block scheduling. Pitfall: secrets are namespace-scoped, so a cross-namespace reference doesn't work.

**Key points:**
- `kubectl describe pod` for the exact registry error in Events first, then triage
- Verify the image name + tag exists (the most common cause)
- imagePullSecret must be in the same namespace; ECR uses helper/IRSA to auto-refresh
- Watch Docker Hub rate limits; mirror upstream images into your own registry for resilience

---

### 61. Tracing a slow service

**Frequency:** Medium

**Question:** Users complain an API service "got slow" — p99 rose from 120ms to 900ms, but the error rate barely moved and the CPU-usage dashboard looks fine. You're paged on-call to find it. Walk through your systematic method for tracing a slow service in Kubernetes.

**What it is & why:** The method for chasing a slow service is **layered and top-down** — start with cheap, broad checks and drill into the specific slow component, always **correlating against baseline and the change log** (the first question is always "what changed?"). This avoids guessing wildly up front, and this case's "latency up but no errors, CPU looks fine" specifically needs ruling out layer by layer.

**Landing it in this case:**

**1. Is the service even healthy/routing correctly?** Check **`kubectl get endpoints <svc>`** — are the expected pods actually in the Service's endpoint list? A pod failing readiness silently drops out, so traffic piles onto fewer pods (looks like latency). Confirm **pod readiness** and replica count.

**2. What changed, and is it errors or latency?** Review **recent deploys** (a slow-down right after a rollout points at the new code/config) and look at **error-rate vs latency dashboards** side by side — rising errors *with* latency suggests failures/retries; this case is latency *without* errors, suggesting a resource or downstream bottleneck. This narrows the class of problem.

**3. Localize the slow span with distributed traces.** A trace of a slow request shows **where the time actually goes** — is it a **slow database query**, a **downstream service** call, or the app's own CPU? This is exactly what metrics (too aggregate) can't tell you, and the key thing to capture for this case's p99 climbing to 900ms.

**4. Inspect resource and infra factors** that commonly cause invisible slowness:
- **HPA scaling** — is the service under-scaled for current load (not enough replicas)? Is HPA stuck (bad metrics)?
- **CPU throttling** — the sneaky one: a pod hitting its CPU *limit* is **throttled**, not killed, so it just runs slow with no error (which neatly explains this case's "CPU dashboard looks fine yet it's slow" — average usage is low but it periodically hits the limit and gets throttled). Check **`container_cpu_cfs_throttled_seconds`** — throttling is invisible on basic dashboards but a top latency cause.
- **DNS lookup time** — slow/failing CoreDNS (or the `ndots:5` amplification) adds latency to every external call.
- **Node pressure** — memory/disk/IO pressure on the node, noisy neighbors, or a degraded node.

**How to diagnose / optimize:**
1. `kubectl get endpoints <svc>` + `kubectl get pod -l app=<svc>` to confirm the ready replica count hasn't shrunk and traffic isn't piling onto a few pods.
2. Cross-check the change log and `kubectl rollout history deploy/<svc>` — any recent deploy/config change landing at the latency's start.
3. Open distributed tracing (Jaeger/Tempo), pick a few 900ms slow requests, and see whether the time is in the DB, downstream, or local CPU.
4. Check CPU throttling: in Prometheus, `rate(container_cpu_cfs_throttled_seconds_total[5m])`; if non-zero, raise the CPU limit or drop an over-tight limit and re-measure p99.
5. Rule out DNS/node: `kubectl top nodes` for node pressure, measure CoreDNS resolution time, and check whether it landed on a degraded/noisy node.
6. At every layer, compare to the **baseline** (what's normal) and the **change log** (deploys, config, infra changes) to pin the cause.

**Common follow-ups / tradeoffs:** The method is layered top-down: endpoints/readiness → deploy and errors-vs-latency distinction → traces to localize the slow span → resource/infra factors (HPA under-scaled, CPU throttling, DNS, node pressure). The core tradeoff: aggregate metrics tell you "it's slow" but can't localize "which hop is slow" — that needs distributed tracing. The sneakiest trap is CPU throttling — slow without errors and invisible on basic dashboards. At each step ask "what changed?" and compare to baseline.

**Key points:**
- Layered top-down, endpoints + readiness first
- Distinguish errors vs pure latency to narrow the problem class
- Use traces to localize the slow span (metrics too aggregate)
- CPU throttling is often invisible (check cfs_throttled), correlate with deploys + node events

---

### 62. Cluster upgrades

**Frequency:** Medium

**Question:** Your production cluster is still on 1.27 and security wants it on 1.29 ASAP; someone wants to save effort by jumping straight there. Last time another team upgraded, a batch of Ingresses suddenly failed to `apply`, and draining too many nodes at once triggered a brief capacity shortage. Explain how to perform this upgrade safely, in what order and by what rules, and how to avoid repeating those mistakes.

**What it is & why:** Kubernetes upgrades follow strict ordering and version rules to avoid breaking the cluster — understanding these rules is exactly how you avoid this case's class of wrecks: version-skipping, over-aggressive draining, and removed APIs.

**Landing it in this case:**

**1. Upgrade the control plane first, one minor version at a time.** Upgrade **kube-apiserver, controller-manager, scheduler, and etcd** *before* touching nodes. Critically, **never skip minor versions** — this case must go 1.27 → 1.28 → 1.29, not 1.27 → 1.29. Kubernetes only supports a **one-minor-version skew** between components, and skipping can break API compatibility and migrations. The control plane must be **at or ahead of** the nodes (kubelet can be one minor behind the API server, never ahead).

**2. Then upgrade nodes gracefully.** For each node (rolling through the fleet): **`kubectl drain`** it (cordon + evict pods, **respecting PodDisruptionBudgets** so you don't take down too many replicas at once — this case's capacity shortage was exactly draining too many at once instead of rolling), **upgrade the kubelet and container runtime (containerd)**, then **`kubectl uncordon`** to return it to service. Do this rolling, a node (or batch) at a time, so capacity stays up. Often done by replacing nodes entirely (new AMI/image) rather than in-place.

**3. Managed services automate the control plane.** **EKS, GKE, and AKS** handle the control-plane upgrade for you (they run and upgrade the masters/etcd), so you mainly manage the node upgrades (or even those are automated via managed node groups / auto-upgrade). This removes the riskiest, most tedious part.

**4. Scan ahead for removed APIs — the biggest gotcha.** Each Kubernetes release **removes deprecated API versions** (e.g., `Ingress` moved from `extensions/v1beta1` → `networking.k8s.io/v1`) — exactly why this case's Ingresses failed to `apply`. If your manifests use a removed API, they'll **fail to apply after the upgrade**. **Before upgrading**, scan with tools like **`pluto`** or `kubectl deprecations`, **read the release notes**, **update your manifests/Helm charts** to the new API versions, and **test the upgrade in a non-prod cluster first**. Fixing this proactively avoids a post-upgrade outage where deployments suddenly can't be applied.

**How to diagnose / optimize:**
1. Scan for removed APIs before upgrading: `pluto detect-files -d ./manifests` and `pluto detect-helm`, change hits like `extensions/v1beta1 Ingress` to the new apiVersion, and verify with `kubectl apply` in a non-prod cluster first.
2. Plan the path: `kubectl version` for the current version, plan the step-by-step 1.27 → 1.28 → 1.29 hops, and read each release's removed-API list in the notes.
3. Upgrade the control plane first (managed clusters via the EKS/GKE/AKS console or API); afterward `kubectl get nodes` to confirm the API server version leads the kubelet.
4. Rolling node upgrade: node by node / batch by batch `kubectl drain <node> --ignore-daemonsets`, ensuring `PodDisruptionBudget`s are configured to prevent taking down too many replicas at once (this case's capacity-shortage fix), and `kubectl uncordon` after upgrading kubelet/containerd.
5. If some workload fails to `apply` after upgrade: check the erroring apiVersion and go back to step 1 to fix the manifest/Helm chart.

**Common follow-ups / tradeoffs:** Four rules — control plane before nodes, one minor version at a time (only one-minor skew supported, kubelet can lag but never lead), drains honor PDBs, and scan for removed APIs ahead of time. Managed services (EKS/GKE/AKS) automate the riskiest control-plane upgrade. The biggest gotcha is removed APIs causing post-upgrade apply failures — `pluto` scan up front + non-prod testing first is the key. Tradeoff: in-place upgrade vs replacing nodes (the latter is cleaner and lets you roll back a whole node).

**Key points:**
- Control plane first, then nodes, one minor version at a time (no skipping)
- kubelet can lag the API server by one minor, never lead
- Drains honor PDBs; roll in batches so capacity doesn't drop sharply
- Scan for removed APIs with pluto before upgrading and test in non-prod first

---

### 63. kubectl drain

**Frequency:** Medium

**Question:** You need to kernel-patch a node, but `kubectl drain node-7` errors out and hangs (complaining about DaemonSets and pods using emptyDir); a week after patching, you notice the cluster is "missing a node" that isn't scheduling. Explain what `kubectl drain` does, how to handle those errors, and what happened to that "vanished" node.

**What it is & why:** `kubectl drain <node>` **safely empties a node** in two steps: it **cordons** the node (marks it unschedulable so **no new pods** land there) and then **evicts the existing pods** so they reschedule elsewhere — you use it to gracefully clear a node before maintenance instead of abruptly killing pods, exactly what this case should do before patching. Crucially, eviction **respects PodDisruptionBudgets** — if evicting a pod would violate an app's PDB (drop below `minAvailable`), drain **waits** rather than causing an outage, evicting pods gradually as replacements come up.

**Landing it in this case:** This case's two errors each map to a flag:
- **`--ignore-daemonsets` is required.** DaemonSet pods (log shippers, CNI, node agents) run **one per node by design** — they can't be "moved" elsewhere, so drain refuses to proceed unless you explicitly acknowledge skipping them with this flag. They keep running until the node is actually removed.
- **Pods using `emptyDir` lose their data.** `emptyDir` is node-local scratch storage; when the pod is evicted and rescheduled on another node, that data is **gone**. Drain won't even proceed for such pods unless you pass **`--delete-emptydir-data`** to confirm you accept the loss. (Persistent data should be on PVCs, which survive.)

**When you drain:** before any **disruptive node maintenance** — **kernel/OS patching** (this case), **node upgrades** (upgrading kubelet/containerd), replacing a node, or **scaling down** the cluster. Draining first ensures workloads are gracefully relocated instead of abruptly killed.

**Returning the node to service (the truth about this case's "vanished" node):** after maintenance, **`kubectl uncordon <node>`** marks it schedulable again so the scheduler can place pods on it. Forgetting to uncordon is a common mistake that leaves a node stuck `SchedulingDisabled`, idle and out of the pool — that's the "missing" node.

**How to diagnose / optimize:**
1. Drain hangs with an error: read the error text first. DaemonSet complaint → add `--ignore-daemonsets`; emptyDir complaint → confirm the scratch data is disposable, then add `--delete-emptydir-data`. Full command: `kubectl drain node-7 --ignore-daemonsets --delete-emptydir-data`.
2. Drain keeps "waiting" on some pods: usually a PDB is blocking (`kubectl get pdb`), meaning there aren't enough replicas to evict without violating the PDB — scale up replicas or temporarily adjust the PDB.
3. After patching: `kubectl uncordon node-7` to return the node to the pool.
4. "Missing a node" investigation: `kubectl get nodes` to see if any node shows `SchedulingDisabled` — if so, uncordon was skipped; run uncordon to restore it.
5. Don't put important data on emptyDir; use a PVC so drain doesn't lose it.

**Common follow-ups / tradeoffs:** drain = cordon (no new pods) + evict (respecting PDBs, evicting gradually). Two must-know flags: `--ignore-daemonsets` (DaemonSets can't migrate) and `--delete-emptydir-data` (accept local scratch data loss). Used for all disruptive node maintenance, and you must uncordon afterward. Tradeoffs/pitfalls: a too-strict PDB deadlocks drain, forgetting uncordon leaves the node idle, and emptyDir data is lost on eviction (persistent data belongs on a PVC).

**Key points:**
- Cordon + evict, eviction respects PDBs (a hang is usually a PDB or too few replicas)
- DaemonSets need `--ignore-daemonsets`
- emptyDir data is lost on drain, needs `--delete-emptydir-data`; put persistent data on a PVC
- Uncordon after maintenance to return the node to the pool, or it stays idle out of the pool

---

### 64. kubectl top and metrics-server

**Frequency:** Medium

**Question:** On a new cluster `kubectl top pods` reports `error: Metrics API not available`, and a CPU HPA you configured for a service never scales up; separately, product wants to autoscale on "requests per second" rather than CPU. Explain what `kubectl top` / metrics-server is, how to diagnose these problems, and its limitations vs Prometheus.

**What it is & why:** **`kubectl top pods`** and **`kubectl top nodes`** show **current CPU and memory usage** — a quick, live snapshot of what's consuming resources. The data comes from **metrics-server**, a lightweight cluster add-on that **scrapes each kubelet's cAdvisor** (the per-node container metrics collector) and **aggregates** it, exposing it through the Metrics API. This case's `top` error and non-scaling HPA are likely the same root cause: metrics-server isn't installed properly.

**Landing it in this case:** **It powers the HPA:** the **Horizontal Pod Autoscaler reads resource metrics (CPU/memory) from metrics-server** to decide when to scale replicas. So metrics-server isn't just for `kubectl top` — without it, HPA on CPU/memory doesn't work (exactly this case's HPA not scaling). Note: it's **not installed by default** on all distributions — a common gotcha where `kubectl top` and HPA silently fail because metrics-server is missing; install it.

**The key limitation — no history:** metrics-server holds **only current (near-real-time) values in memory**; it keeps **no historical data** and does no long-term storage. So you **cannot** graph trends, look at last week's usage, alert on patterns, or do capacity analysis with it. For **history, dashboards, and alerting** you need **Prometheus + Grafana** — Prometheus stores time series over time, Grafana visualizes them. `kubectl top` answers "what's using resources *right now*?"; Prometheus answers "how has usage trended and when did it spike?"

**Custom/external metrics for HPA (this case's scale-on-RPS):** metrics-server only provides **CPU/memory** (resource metrics). To autoscale on **application metrics** — requests-per-second, queue depth, custom business metrics — you need the **Prometheus Adapter** (exposes Prometheus queries via the custom/external metrics API for HPA) or **KEDA** (event-driven autoscaling that scales on external sources like Kafka lag, SQS depth, cron). These plug into HPA's custom/external metrics interface, which metrics-server alone can't serve — this case's scale-on-RPS needs exactly this stack.

**How to diagnose / optimize:**
1. `kubectl top` reports `Metrics API not available`: `kubectl get apiservice v1beta1.metrics.k8s.io` to check it's Available, and `kubectl get deploy -n kube-system metrics-server` to confirm it's installed/healthy; if absent, install it (e.g. `helm install` or the official manifest).
2. metrics-server installed but unhealthy: `kubectl logs -n kube-system deploy/metrics-server` — self-managed/bare clusters commonly need `--kubelet-insecure-tls` to resolve kubelet certificate issues.
3. CPU HPA not scaling: `kubectl describe hpa <name>` to see if `TARGETS` is `<unknown>` — that means metrics-server is missing/unhealthy; confirm the target pods set CPU `requests` (HPA computes a percentage of the request).
4. Scale on RPS: deploy Prometheus Adapter to expose custom metrics, or use KEDA with a `ScaledObject` scaling on Prometheus/queue metrics, and `kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1` to verify the metric is visible.
5. For history/trends/alerting: wire up Prometheus + Grafana, don't expect it from metrics-server.

**Common follow-ups / tradeoffs:** metrics-server feeds `kubectl top` and CPU/memory HPA with current near-real-time values only, no history. History/trends/alerting need Prometheus + Grafana. Scaling on application metrics (RPS, queue depth) needs Prometheus Adapter or KEDA. Pitfalls: metrics-server isn't installed by default and its absence silently breaks top and HPA; HPA needs pods to set requests to compute CPU percentage; bare clusters often need `--kubelet-insecure-tls`.

**Key points:**
- metrics-server feeds HPA + `kubectl top`; its absence silently breaks both (check the apiservice first)
- Current values only, no history; use Prometheus + Grafana for history/alerting
- CPU HPA not scaling: `describe hpa` for TARGETS and pod requests first
- Scale on RPS/queue and other app metrics with Prometheus Adapter or KEDA

---

### 65. Pipeline-as-code

**Frequency:** Medium

**Question:** Your Jenkins jobs are all configured by hand in the web UI. One day someone changes a build step in the UI without telling anyone, then weeks later the Jenkins disk dies and all the job configs are lost, no one can say "how the shipped thing was actually built," and there's no way to roll back. Explain how pipeline-as-code cures all this and why UI editing is an anti-pattern.

**What it is & why:** **Pipeline-as-code** means your CI/CD pipeline is **defined in version-controlled files that live in the repo alongside the code** — **`.github/workflows/*.yml`** (GitHub Actions), a **`Jenkinsfile`**, or **`.gitlab-ci.yml`**. The pipeline definition is treated exactly like application code — precisely to eliminate this case's "secretly edited in the UI, lost when the server died, can't roll back" predicament.

**Landing it in this case:** **Why it matters:**
- **Reviewable and diff-able** — a pipeline change goes through the **same pull-request review** as code. You can see exactly what changed, who changed it, and why (git blame), and reviewers can catch mistakes before they merge (that secret UI edit would have been caught in review).
- **Lives with the code** — the pipeline is **versioned with the branch**, so an old commit builds with the pipeline that was correct *for that commit*, and rolling back code rolls back its pipeline too. No drift between "the code" and "how it's built," so you *can* answer this case's "how was the shipped thing built?"
- **Reusable** — factor shared logic into **templates, reusable workflows, or composite actions** so many repos/jobs share one tested definition instead of copy-pasting.

**Why UI-edited pipelines are an anti-pattern (this case's root disease):** clicking through a Jenkins/CI web UI to configure a job means the pipeline lives in the **CI server's database, not in Git**. This causes: **drift** (the running pipeline no longer matches anything reviewable — someone tweaked it live months ago and no one remembers), **no audit trail**, **no review**, **no rollback**, and **disaster recovery pain** (lose the CI server, lose the pipelines — exactly this case's dead disk). It's the CI equivalent of editing production by hand.

**How to diagnose / optimize:**
1. Migrate existing UI jobs to code: use Jenkins Job DSL / `Jenkinsfile` (or switch to GitHub Actions/GitLab CI) to translate each job's steps into files in the repo, committed to Git.
2. Lock down the UI editing path: configure jobs to pull the `Jenkinsfile` from SCM (Pipeline from SCM), and revoke the permission to hand-edit steps in the UI to prevent drift recurring.
3. Factor common logic: extract repeated build/deploy steps into reusable workflows / composite actions / shared libraries that many repos reference once.
4. Validate pipeline changes: because the pipeline is in the repo, a **PR that changes it can *run* the changed pipeline** (on the PR branch) before merge — test pipeline modifications the same way you test code, catching a broken pipeline in review instead of after it's live on `main`.
5. Disaster recovery: Git is the source of truth, so a rebuilt CI server reloads all pipeline definitions from the repo — no more "lose the server, lose the pipelines."

**Common follow-ups / tradeoffs:** Pipeline-as-code = defined in the repo, reviewed via PR, versioned with the branch, reusable templates. The four sins of UI editing: drift, no audit/review/rollback, and disaster-recovery pain. Because the pipeline is in the repo, changes can run on the PR branch before merging. Tradeoff: there's upfront migration cost and writing DSL/YAML, and the team must build the discipline of "pipeline changes go through PRs too" — in exchange for auditability, rollback, and reuse.

**Key points:**
- Pipelines defined in the repo, reviewed via PR, versioned with the branch
- Reusable templates / composite actions, don't copy-paste
- Avoid UI-only pipeline editing (drift, no rollback, lost with the server)
- Validate pipeline changes by running them on the PR branch before merge

---

### 66. Trunk-based vs Gitflow

**Frequency:** Medium

**Question:** You're a continuous-deployment SaaS team but you've been using Gitflow's long-lived `develop`/`release/*` branches, feature branches routinely live for two or three weeks, and every merge back to the trunk is a bloody conflict war that often blocks releases. Someone proposes switching to trunk-based development. Contrast trunk-based development with Gitflow, say whether you should switch, and how to land it.

**What it is & why:** Trunk-based development and Gitflow are two branching strategies whose core tradeoff is **integration frequency vs multi-version maintenance capability** — this case's "long-lived branches + merge hell + blocked releases" is the textbook mismatch of using Gitflow in a continuous-deployment setting.

**Landing it in this case:** **Trunk-based development**: short-lived branches (hours/days), frequent merges to `main`, with **feature flags hiding incomplete work**. Because branches are short-lived and integration is frequent, it **enables continuous deployment and minimizes merge conflicts** — the longer a branch lives, the more painful the divergence (exactly why this case's two-to-three-week branches bleed on merge).

**Gitflow**: long-lived `develop`, `release/*`, `hotfix/*` branches — **heavy ceremony**, suited to **versioned shipped software** (where you maintain several released versions at once, cut release branches, and back-port hotfixes to old versions). As a SaaS running only one production version, carrying this ceremony without reaping the multi-version benefit is a net loss.

**Who picks which:** most **SaaS teams pick trunk-based** — they run one production version and continuously deploy, and trunk's small batches + feature flags fit perfectly (this case should switch). **Packaged-software teams** (libraries, desktop apps, firmware) mostly use Gitflow, because they genuinely maintain multiple versions and patch old ones.

**How to diagnose / optimize:**
1. Diagnose the "merge hell" root cause: look at average branch lifetime and merge-conflict frequency — the longer-lived the branches and the less frequent the integration, the bloodier the conflicts, a signal to move to trunk.
2. Land the transition: break work into small batches that merge to `main` within 1-2 days, and hide unfinished features behind **feature flags** (LaunchDarkly / config flags) kept off in production, merging and hiding as you go.
3. Backstop small fast merges with CI: run the full PR check suite (lint/unit/build/integration) on every merge so frequent integration is safe.
4. Dismantle long-lived branches: phase out `develop`, use `main` directly as the integration point, and replace `release/*` with tagging/cutting releases from the trunk.
5. If you genuinely must maintain an old version for some customers (rare SaaS case): keep a very small number of release branches for long-term support and run everything else on trunk.

**Common follow-ups / tradeoffs:** Trunk = short-lived branches + frequent integration + feature flags hiding WIP, enabling continuous deployment and minimizing merge conflicts; Gitflow = long-lived develop/release/hotfix branches, heavy ceremony, built for multi-version maintenance. Choose by delivery model: SaaS (single production version, continuous deployment) → trunk; packaged software (libraries/desktop/firmware maintaining multiple versions with patches) → Gitflow. Tradeoff: trunk demands feature-flag discipline and strong CI or half-baked work leaks to production; Gitflow gives isolation at the cost of integration delay and merge pain.

**Key points:**
- Trunk: small batches, short-lived branches, fast merge, minimal conflicts
- Feature flags hide WIP, backed by strong CI
- Gitflow: long-lived branches, versioned releases, heavy ceremony
- SaaS -> trunk-based; packaged software -> Gitflow

---

### 67. PR check stages

**Frequency:** Medium

**Question:** Your PR pipeline is entirely serial and puts the 15-minute integration tests first — so a developer who submits a PR with a misplaced semicolon still waits a quarter hour to be told about a lint error, and the CI machines are perpetually queued. Worse, someone can bypass a not-yet-green check and merge straight to `main`. Redesign the PR check stages and ordering, and explain the principles.

**What it is & why:** A PR pipeline is a series of **gates**, ordered so the **cheapest, fastest, most-likely-to-fail checks run first** — precisely to cure this case's "trivial errors wait 15 minutes, CI queues, and checks can be bypassed." A typical order:

1. **Lint / format** — seconds to run, catches trivial issues.
2. **Unit tests** — fast, catch logic bugs.
3. **Build** — compile the app.
4. **Container build & scan** — build the image, run vulnerability + secret scanning.
5. **Integration tests** — slower, test components together.
6. **Smoke deploy to an ephemeral environment** — deploy the PR to a temporary, isolated env.
7. **Required reviewer approval** — human review.
8. **Merge.**

**Landing it in this case:**

**Fail fast — lint before tests.** Put the **quickest checks earliest** so a PR with a formatting error or trivial mistake fails in **seconds** instead of after a 15-minute test+build run (this case's ordering is exactly backwards). Don't make developers wait for expensive stages to learn about cheap problems. This gives fast feedback and saves CI compute.

**Parallelize independent jobs.** Lint, unit tests, and security scans don't depend on each other — **run them concurrently** rather than serially to cut total wall-clock time (all-serial is the main reason this case's CI queues). Only serialize where there's a real dependency (build before integration tests).

**Ephemeral preview environments catch integration bugs.** Spinning up a **temporary, PR-scoped environment** (its own namespace/stack, torn down on merge/close) lets you run the *actual deployed app* — catching bugs that only appear with real infra, config, dependencies, and networking that unit/integration tests miss. Reviewers can also click through the live change.

**Branch protection enforces required checks.** Configure the required checks as **branch protection rules** so the PR **cannot be merged until they're all green** (and required reviewers approve) — this case's "can bypass a check and merge" is simply missing branch protection. This includes **external status reporting** — tools like **SonarQube** (code quality/coverage gates) or **Snyk** (security) report their pass/fail status back to the PR, and those statuses become required checks too, so a quality/security regression blocks merge automatically.

**How to diagnose / optimize:**
1. Reorder stages: move lint/format to the very front, unit tests next, and push expensive integration tests/deploys to the back so trivial errors fail in seconds.
2. Parallelize: configure lint, unit tests, and security scans as mutually-independent parallel jobs (GitHub Actions jobs without `needs` / GitLab same-stage), serializing only where there's a real dependency via `needs`/stage.
3. Block bypass merges: set branch protection (GitHub Settings → Branches / GitLab push rules), enabling required status checks + required reviews + disallowing admin bypass.
4. Make SonarQube/Snyk status reporting required checks too, so quality/security regressions block merge automatically.
5. Add ephemeral preview environments (PR-scoped namespace/stack, destroyed on close) running the actually-deployed app to catch bugs that only appear in a real environment.

**Common follow-ups / tradeoffs:** The ordering principles are fail-fast (fastest, most-likely-to-fail first) + parallelize independent jobs (cut wall-clock time) + ephemeral preview environments (catch integration bugs) + branch protection enforcing required checks (including SonarQube/Snyk external status). Tradeoffs: parallelizing saves time but consumes more concurrent runners; ephemeral environments are the most realistic but add setup/cost overhead; branch protection improves safety but needs a good process for emergency merges (e.g. a controlled bypass).

**Key points:**
- Fail fast: lint/format first, expensive checks later
- Parallelize independent jobs to cut wall-clock time, serialize only real dependencies
- Ephemeral preview environments catch integration bugs
- Branch protection enforces required checks (including Sonar/Snyk external status), no bypass merges

---

### 68. Caching dependencies in CI

**Frequency:** Medium

**Question:** Your CI spends 6 minutes re-downloading dependencies on every build. To speed it up, someone cached `node_modules` directly — but after switching to a new batch of runners (different OS/arch), builds start throwing bizarre native-module segfaults. Explain how to cache dependencies correctly in CI, how to set the cache key, and why you should cache the package store rather than `node_modules`.

**What it is & why:** Caching CI dependencies means storing the **expensive-to-re-download/rebuild** stuff for reuse across builds, to save this case's 6 minutes. **What to cache:** the **package-manager download stores** — `~/.npm`, `~/.m2` (Maven), the **Go module cache**, **pip wheels** — and **Docker build layers**.

**Landing it in this case:** **Key the cache by the lockfile hash.** The cache key should be a hash of your **lockfile** (`package-lock.json`, `go.sum`, `poetry.lock`). This means the cache is **restored at the start** of a run and **saved at the end**, and it **automatically invalidates when dependencies change** (lockfile edit → new hash → fresh cache) but is **reused when they don't** — exactly the right behavior. Unchanged deps = instant restore; changed deps = rebuild.

**Mechanisms:** **GitHub Actions `actions/cache`** (or the built-in `setup-*` caching), **GitLab's `cache:` block**, and for Docker, **BuildKit cache mounts** (`RUN --mount=type=cache,target=/root/.npm`) which persist the package store *across builds* even when the install layer is invalidated — great for compiler/package caches.

**Why cache the upstream package store, not `node_modules` directly (this case's segfault root cause):** `node_modules` (and equivalents) can contain **platform-specific compiled binaries** (native addons built for a particular OS/arch/libc). Caching it and restoring on a **different runner OS/architecture** can restore **incompatible binaries** — exactly this case's native-module segfaults after switching runners, subtle and hard to debug. The **package store (`~/.npm`)** holds the **portable downloaded tarballs**, so you cache *that* (fast — no network) and **run `npm ci` fresh** to build `node_modules` correctly for the current environment. You get the speed of skipping downloads without the fragility of shipping compiled artifacts across environments.

**Fallback restore-keys for partial hits:** configure **`restore-keys`** (prefix-matched fallbacks) so that when the exact lockfile-hash key misses (deps changed), CI can still **restore the *most recent* older cache** and only download the *delta* — far faster than a cold cache. A cache miss becomes "update a few packages" instead of "download everything."

**How to diagnose / optimize:**
1. Immediately stop this case's segfaults: stop caching `node_modules`, cache `~/.npm` instead, key on `hashFiles('**/package-lock.json')`, and use `npm ci` in the install step (clean, reproducible install from the lockfile).
2. Configure the cache (GitHub Actions example): `actions/cache` with `path: ~/.npm`, `key: npm-${{ hashFiles('package-lock.json') }}`, `restore-keys: npm-`, or just use `setup-node`'s built-in `cache: npm`.
3. Add restore-keys fallback so partial hits work — a small lockfile change downloads only the delta rather than a full cold-cache download.
4. Native modules across platforms: ensure the cache key or install environment includes the OS/arch dimension so different runners don't reuse incompatible artifacts.
5. Slow Docker builds: use BuildKit cache mounts to persist `~/.npm`, `~/.m2`, etc., reusing the package cache even when earlier layers are invalidated.

**Common follow-ups / tradeoffs:** Cache the package store (portable tarballs) + key on the lockfile hash + restore-keys fallback, and don't cache `node_modules` (which holds platform-compiled binaries). Docker uses BuildKit cache mounts. Tradeoffs: too-coarse caching (no OS/arch) causes bizarre cross-environment binary bugs; too-loose a key (no lockfile) uses stale deps, too strict never hits. The core idea is "cache portable downloads, rebuild artifacts for the current environment each time."

**Key points:**
- Key the cache by lockfile hash, with restore-keys for partial hits
- Cache the package store (`~/.npm`), not node_modules (holds platform binaries)
- Install with `npm ci` to rebuild artifacts for the current environment
- Use BuildKit cache mounts for package/compiler caches in Docker

---

### 69. Artifact management

**Frequency:** Medium

**Question:** Each of your environments (dev/staging/prod) rebuilds the image from source independently. A version that tested fine in staging crashed in prod — investigation found that a base image's `latest` tag had silently updated between the two builds, so prod was running different bytes than staging validated. Explain artifact management (Artifactory, Nexus) and how "promote, don't rebuild" cures this.

**What it is & why:** An **artifact repository** (**JFrog Artifactory, Sonatype Nexus, GitHub Packages, AWS CodeArtifact**) is a central store for your **built binaries** — Java **jars**, Python **wheels**, **npm** packages, **OCI** container images, **Helm charts**, and more. It sits between your builds and your dependencies, making "build once, promote everywhere" possible — exactly curing this case's "each environment rebuilds and drifts."

**Landing it in this case:** **Benefits:**
- **Mirror/cache upstream registries** — acts as a **pull-through proxy** for public registries (npmjs, Maven Central, Docker Hub). Builds pull dependencies from your local mirror, which **avoids upstream rate limits and outages** (Docker Hub limits, npm downtime), **speeds up builds** (local/cached), and works in **air-gapped** environments.
- **Immutable release repos** — once a release version is published, it **can't be overwritten**, guaranteeing that `v1.4.2` always means the same bytes (reproducibility, supply-chain integrity) — this case's `latest` base-image drift should be eliminated with pinned immutable versions.
- **Vulnerability scanning** — scans stored artifacts for CVEs (like the registry scanning discussed earlier).
- **Geo-replication** — replicate artifacts across regions so distributed teams/clusters pull locally.

**Promote, don't rebuild — the core practice (this case's fix):** build the artifact **once**, then **promote that *same* artifact** through repositories/stages: **snapshot → release → prod** (or dev → staging → prod). You do **not** rebuild the binary for each environment. Why: **rebuilding risks drift** — a different dependency version, base image, or toolchain could sneak in between builds (exactly this case's `latest` silently changing), so "what you tested in staging" wouldn't be "what runs in prod." Promoting the identical, already-tested artifact guarantees **the exact bytes you validated are what ship** (this mirrors the environment-promotion principle). Promotion is just moving/tagging the artifact to the next repo, cheap and safe.

**Retention & cleanup policies:** artifacts accumulate fast (every CI build produces snapshots), so configure **retention rules** — keep the last N snapshots, keep all releases, auto-delete old/unreferenced artifacts — to control storage cost without losing anything you need to reproduce or roll back to.

**How to diagnose / optimize:**
1. Localize this case's drift: compare the image `@sha256:` digest running in staging vs prod (`docker inspect` / `kubectl get pod -o jsonpath`) — a difference proves independent rebuilds caused the drift.
2. Switch to promotion: CI builds the image once, pushes it by **commit SHA / immutable tag** to the artifact repo, and both staging and prod pull the **same digest** — promotion just tags/moves, never rebuilds.
3. Pin dependencies: use `@sha256:` digests or fixed versions for base images, never `latest`; configure a pull-through proxy repo to cache upstream and avoid rate limits/drift.
4. Reference digests, not mutable tags, in deployments, so "validated bytes = shipped bytes" and rollback goes to the exact digest.
5. Configure retention to control storage: keep all releases, keep the last N snapshots, auto-clean unreferenced artifacts.

**Common follow-ups / tradeoffs:** An artifact repo provides upstream mirror caching, immutable release repos, vulnerability scanning, and geo-replication. The core practice is promote-don't-rebuild — build once, promote the same artifact dev→staging→prod, eliminating toolchain/dependency/base-image drift and guaranteeing validated bytes are shipped bytes. Under GitOps, promotion is a PR, auditable, with `git revert` rollback. Tradeoff: it requires the discipline of immutable tags/digests instead of `latest`, and retention policies to balance storage cost against rollback/reproduce needs.

**Key points:**
- Mirror upstream registries, avoiding rate limits/outages and enabling offline
- Promote the same artifact, don't rebuild per environment (eliminates drift)
- Immutable release repos + use digest/fixed tags, not latest
- Retention + cleanup policies balance cost against rollback needs

---

### 70. Secrets in CI without leaks

**Frequency:** Medium

**Question:** An incident postmortem finds your AWS access key leaked: a debug script in a PR wrapped an authenticated curl in `set -x`, printing the whole token into public CI logs — and that key was long-lived and shared across all jobs. Explain how to handle secrets in CI without leaking them, why to prefer OIDC, and how to prevent this class of log leak.

**What it is & why:** CI secret management needs layered defenses because CI is a **prime leak target** (it has access to everything and runs untrusted PR code) — this case is exactly two classic mistakes stacked: a long-lived shared key + a log echo.

**Landing it in this case:**

1. **Use the platform's encrypted secret store — never repo files.** Put secrets in **GitHub Actions Secrets, GitLab CI variables, or Vault** — encrypted at rest, injected at runtime, never committed. **Never** put credentials in the repo (even "temporarily," even in a private repo — git history is forever and forks/clones spread it).
2. **Mask secrets in logs and forbid dumping them (the direct lesson of this case's log leak).** Platforms **automatically mask known secret values** in log output (replace with `***`). But you must also **forbid printing the environment** (`env`, `printenv`) or enabling shell trace (`set -x`), which can **echo secrets the masker doesn't know about** (e.g., a secret derived at runtime). A single `set -x` around a curl with an auth header can leak a token into public logs — exactly what happened here.
3. **Prefer OIDC federation over long-lived cloud keys (this case's root fix).** Instead of storing a long-lived AWS access key as a CI secret, use **OIDC**: the CI platform issues a **short-lived, signed workflow token**, and the cloud provider (via a trust policy) **exchanges it for temporary cloud credentials** scoped to a specific role. Benefits: **no long-lived secret to leak** in the first place, credentials **expire in minutes**, and access is **scoped per workflow/repo/branch**. Same workload-identity idea as IRSA for pods — short-lived, federated, no static keys. Even if a log leak recurs, what leaks is a temporary credential that expires in minutes.
4. **Scope secret access to only the jobs/environments that need them.** Don't expose every secret to every job (this case's "shared across all jobs" violates this). Use **environment-scoped secrets** (e.g., prod secrets only available to the prod-deploy job, gated by environment protection rules) so a compromised or malicious build step can't reach credentials it has no business touching — least privilege for CI.

**How to diagnose / optimize:**
1. Immediately stop the bleeding for this case: rotate/revoke the leaked AWS key pair, audit CloudTrail for misuse, and delete the logs containing the token.
2. Root fix: move to OIDC — create a role in the cloud that trusts the CI OIDC provider (trust policy scoped to repo/branch), and in CI use something like `aws-actions/configure-aws-credentials` to get temporary credentials keylessly, then delete all long-lived access keys.
3. Prevent log echo: audit scripts to forbid `set -x` wrapping authenticated commands and forbid `env`/`printenv` dumps, and proactively mask runtime-derived secrets with the platform's `add-mask`.
4. Tighten scope: change secrets to environment-scoped (prod secrets only for prod jobs + environment protection/approval), least privilege.
5. Add scanning as a backstop: run gitleaks/trufflehog in CI to scan commits and logs, catching accidentally-committed credentials at the PR stage.

**Common follow-ups / tradeoffs:** Four layers — encrypted secret store (not in the repo), log masking + forbidding `env`/`set -x`, OIDC federation (short-lived, role-scoped, no long-lived keys), and per-job/environment least privilege. Why OIDC beats long-lived keys: there's no long-lived secret to leak, credentials expire in minutes, and access is scoped by repo/branch — the IRSA idea. Pitfalls: auto-masking only recognizes known secret values, so a runtime-derived secret still leaks under `set -x`; and even private repos can't hold credentials (history is forever).

**Key points:**
- Encrypted secret stores, never repo files (history is forever)
- OIDC to the cloud beats long-lived keys (short-lived, role-scoped, no static keys)
- Mask + forbid `env`/`set -x`; proactively add-mask runtime secrets
- Scope secrets per job/environment (least privilege); rotate and revoke immediately after a leak

---

### 71. Environment promotion

**Frequency:** Medium

**Question:** Your release process is "each environment triggers a separate CI build from main." A feature that canaried fine in staging for a week started throwing frequent 500s the night it hit prod. It turned out the dependency versions locked at staging's build differed from what prod's build pulled — the two environments were running different things. Explain how environment promotion (promoting the same artifact) cures this, how to gate prod, and how to manage config.

**What it is & why:** **Environment promotion** means moving the **same build artifact** through a series of environments — **dev → staging → prod** — where **only the *configuration* differs** between them, not the artifact bytes. The image/binary you built and tested is the one that ultimately runs in prod, directly eliminating this case's "each environment builds separately" drift.

**Landing it in this case:**
- **Why never rebuild per environment:** rebuilding separately risks **drift** — a dependency, base image, or toolchain version could differ between the staging build and the prod build (exactly this case's root cause), so "the thing you tested in staging" isn't "the thing running in prod." Building **once** and promoting the **identical artifact** guarantees you ship exactly what you validated.
- **Externalize config:** environments differ only in **config** (DB URLs, feature flags, resource sizes, replica counts) — injected via ConfigMaps/Secrets/env, **never baked into the artifact**. Keep the **config schema identical** across environments (same keys, same structure) with only the **values** differing per env, preventing "works in staging, missing-config crash in prod."
- **Promotion under GitOps = a PR:** since Git is the source of truth, **promotion is a pull request** that **updates the image tag (or digest) in the target environment's overlay** — e.g., a PR bumping `image: myapp@sha256:...` in the **prod** Kustomize overlay. The GitOps controller then reconciles prod to the new version, promotion is auditable (a reviewed commit), and rollback is `git revert`.
- **Gate prod with stronger controls:** dev/staging may auto-promote, but **prod gets extra gates** — **manual approval** (a required reviewer signs off) + a **canary rollout** + post-deploy **smoke tests**. In GitHub Actions, **Environments** provide **protection rules, required reviewers, and wait timers** on the prod environment so a deploy can't proceed without approval.

**How to diagnose / optimize:**
1. Confirm this case is drift: compare the actual image `@sha256:` digest running in staging vs prod (`kubectl get pod -o jsonpath` or `docker inspect`) — different digests mean independent rebuilds.
2. Switch to promotion: CI builds the image once, pushes by commit SHA/immutable tag, and staging and prod both pull the **same digest** — promotion just tags/moves, no rebuild.
3. Reconcile config shape: compare the key sets of both environments' ConfigMaps/Secrets — a missing key is the "prod missing config" root cause; fill it in, unify the schema, and inject values per environment.
4. Gate prod: change the prod deploy to use GitHub Environments protection rules + required reviewers, with canary + smoke-test automated checks.
5. Rehearse rollback: confirm `git revert` of the overlay makes the controller roll prod back to the previous digest.

**Common follow-ups / tradeoffs:** The core is promoting the same artifact — one artifact, many environments, only config differs, eliminating toolchain/dependency/base-image drift. Under GitOps, promotion is a PR, auditable, with `git revert` rollback. Prod needs manual approval + canary + smoke tests. The config schema is identical across environments with only values changing. Tradeoff: promotion requires the discipline of immutable tags/digests and fully externalized config, or drift and "missing-config crashes" recur.

**Key points:**
- One artifact, many environments, only config differs
- Promote via PR to the environment overlay, auditable, git revert rollback
- Manual approval gate + canary + smoke tests for prod
- Same config schema, different values, config externalized not baked into the artifact

---

### 72. Database migrations in CD (expand/contract)

**Frequency:** Medium

**Question:** In one release a developer renamed the `user.email` column to `user.email_address`, shipping the migration together with the new app version. The rolling deploy was only halfway through when monitoring blew up with the old pods throwing masses of `column "email" does not exist`, leaving the whole service half-dead mid-deploy. Explain how expand/contract (parallel change) lets a schema evolve with zero downtime under rolling deploys.

**What it is & why:** During a **rolling deploy** the **old and new app versions run simultaneously** for a period (pods are replaced gradually), and both hit the **same database at the same time**. So a **backward-incompatible migration must break things** (exactly this case): rename or drop a column and the still-running old pods immediately error. You **cannot** make a breaking schema change atomic with a rolling deploy \u2014 **expand/contract** exists for this, making every step backward-compatible.

**Landing it in this case:** The correct approach isn't "rename + ship simultaneously" but splitting it into steps that keep each schema change **backward-compatible across at least one app version**:

1. **Expand \u2014 add the new column/table** (*purely additive*, backward-compatible). Just `ALTER TABLE ADD COLUMN email_address` first; the old app ignores it, nothing breaks.
2. **Deploy a dual-writing app** \u2014 the new version writes **both** (`email` and `email_address`) while still reading the old `email`. New data lands in both, and old pods reading `email` still work.
3. **Backfill** \u2014 run a job `UPDATE ... SET email_address = email WHERE email_address IS NULL` (batched) so the new column is complete for historical rows too.
4. **Deploy an app that reads only the new column** \u2014 now that `email_address` is full (backfill + dual-writes), switch reads to it; `email` is still there but unread.
5. **Contract \u2014 drop the old column** \u2014 only *after* every running version no longer references `email` is `ALTER TABLE DROP COLUMN email` safe.

**How to diagnose / optimize:**
1. Stop this case's bleeding: immediately roll the app back to the old version (the old column still exists, so rollback works) \u2014 don't rush to roll back the migration.
2. Root-cause the postmortem: confirm the destructive migration (rename/drop column/add NOT NULL without default) and the app release were packaged into the same rolling deploy.
3. Refactor to expand/contract: split the rename into "add new column \u2192 dual-write \u2192 backfill \u2192 switch reads \u2192 drop old column," with additive migrations *before* the app deploy and the drop *after* full rollout.
4. Backfill in batches + rate-limited to avoid long transactions locking the table and taking prod down; watch locks and slow queries with `pg_stat_activity`.
5. Add a guardrail: enforce a backward-compatibility check on migrations in CI (e.g. forbid dropping a column + changing the app in the same PR), guaranteeing "the currently-running version can always tolerate the new schema."

**Common follow-ups / tradeoffs:** The core rule \u2014 **never make a schema change the currently-running app version can't tolerate** \u2014 each step backward-compatible so old and new pods never conflict over the schema. Ordering: additive migrations *before* the app deploy, destructive contract *after* full rollout, and always backfill before reading the new column. Tradeoff: more steps, more deploys, longer cycle, but it's the only way to evolve a schema with zero downtime under rolling deploys; backfill must be batched and rate-limited to avoid locking the table.

**Key points:**
- Migrations precede the app deploy; drop the column after full rollout
- The app must handle both old and new schema (dual-write during transition)
- Backfill before reading the new column, batched and rate-limited to avoid table locks
- Iron rule: never make a change the currently-running version can't tolerate

---

### 73. Feature flags

**Frequency:** Medium

**Question:** A new recommendation algorithm goes live, and 10 minutes later latency spikes and the homepage times out widely. But rolling back means a full CI/CD rebuild + rolling deploy — at least 20 minutes, during which users keep suffering. Afterward the boss asks: "Can we kill a new feature in one second when it breaks, and ship new code next time without waiting for it to be finished?" Explain how feature flags decouple deploy from release.

**What it is & why:** A **feature flag** is a runtime toggle that **decouples *deploying* code from *releasing* a feature to users**. You ship the new code to production **"dark"** (deployed but disabled), then **turn it on independently** — per **user, cohort, or percentage** — via a **flag service** (**LaunchDarkly, Unleash, Flagsmith**) without a redeploy. This case's pain (rollback requires a 20-minute rebuild) is precisely because deploy and release were tied together.

**Landing it in this case:**
- **Instant kill switch (this case's fix):** when the new recommendation algorithm misbehaves, **flip the flag off in seconds** — no rebuild, no redeploy, no 20-minute rollback, and users instantly return to the old path. A hugely valuable safety net.
- **Gradual rollouts:** the new algorithm should have ramped **1% → 10% → 50% → 100%** while watching latency/error metrics — a code-level canary independent of infrastructure, so the 10-minute blast radius would have hit only 1% of users.
- **Trunk-based development:** developers merge unfinished features to `main` behind an *off* flag, so work integrates continuously without long-lived branches and ships safely (dark) instead of blocking releases — the answer to "ship new code without waiting for it to be finished," and the key enabler of trunk-based + continuous deployment.
- **A/B tests / experiments:** enable a variant for a random % of users and measure impact, since the flag service targets cohorts.

**How to diagnose / optimize:**
1. Stop this case's bleeding: flip the new recommendation algorithm's flag to 0% in the flag service, returning all users to the old path within seconds, no redeploy.
2. Shrink the blast radius: switch to enabling for a 1% internal/beta cohort first, watch latency and error rate in Grafana, then ramp up gradually.
3. Check whether it's a flag pitfall: look for **flag-combination explosion** — multiple flags stacking into an unexpected state; use the flag service's audit log to see which flags were on together.
4. Cleanup hygiene: once the algorithm is stable and fully rolled out, **delete the flag and the dead branch**, don't leave `if flag ... else ...` around long-term.
5. Build process: register each flag's owner, reason for existing, and expected removal date, and regularly sweep for stale flags.

**Common follow-ups / tradeoffs:** The core is deploy ≠ release, enabling kill switches, gradual rollouts, trunk-based development, and A/B experiments. **Flag hygiene is the critical discipline:** flags are **debt**, each adds a code branch and they **multiply combinatorially** (N flags = up to 2^N states, untestable), and stale flags cause code rot, confusion, and unexpected-combination bugs. So track each flag's lifecycle (owner, reason, removal date) and **ruthlessly delete the flag and dead branch** once a feature is fully rolled out or abandoned — treat cleanup as required follow-up work, not optional.

**Key points:**
- Deploy != release: ship dark + turn on independently
- Percentage / cohort targeting for gradual rollouts
- Second-level kill switch without redeploy
- Retire stale flags ruthlessly to prevent combination explosion and code rot

---

### 74. Terraform modules and workspaces

**Frequency:** Medium

**Question:** You use Terraform workspaces to separate dev/staging/prod off one shared set of `.tf` files. One day an engineer meant to add a test instance to staging, ran `terraform apply`, and only afterward realized the current workspace was `prod` — the command line gave no hint which workspace they were in, so they changed production directly. Explain modules and workspaces, and why many teams prefer directory-per-env to avoid exactly this.

**What it is & why:** **Modules** are Terraform's **reusable building blocks** — related resources tucked behind an input/output interface. **Workspaces** are **isolated state instances within a single configuration**. This incident's trap is precisely using workspaces *as* environment isolation: sharing code and backend, distinguishing environments only by an invisible workspace name, makes it far too easy to apply against the wrong one.

**Landing it in this case:**
- **Modules:** a **`vpc` module** takes a **CIDR variable** and creates the VPC, subnets, route tables, and NAT gateways, outputting the subnet IDs — every env/project calls the same tested module instead of copy-pasting resource blocks. **Source** it from a local path (`./modules/vpc`), Git (`git::https://...`), or the public/private Terraform Registry. **Always pin module versions** (`version = "3.2.1"`) — an unpinned module can shift under you and break or silently change infra on the next `init`.
- **Workspaces and their misuse (the root cause here):** `terraform workspace new prod` gives you a separate state file while reusing the same `.tf`, and `terraform.workspace` lets code branch on the current workspace. It *can* model dev/staging/prod, **but it's easy to misuse**: environments **share the same code and backend**, differ only by an interpolated name, and it's **dangerously easy to run `apply` against the wrong workspace** (the current workspace is invisible in the command — exactly this incident). It also makes per-env differences awkward (conditionals sprinkled through the code).
- **Directory-per-env (the recommended pattern):** `envs/prod/`, `envs/staging/`, each with its own `main.tf` calling the shared modules and its own backend/state. This gives **explicit, physical separation** — you literally `cd envs/prod` to touch prod; each env has its **own state and backend** (a staging mistake can't reach prod state); config is **visible in files** rather than hidden behind `terraform.workspace` conditionals; and review clearly shows *which environment* a change affects. The clarity and blast-radius isolation beat the mild duplication.

**How to diagnose / optimize:**
1. Establish where you are: `terraform workspace show` for the current one, `terraform workspace list` for all — this incident happened because nobody ran this first.
2. Assess the damage: `terraform plan` to see what changed on prod; if already applied, reconcile actual changes against state (`terraform state list`) and the cloud console, and roll back if needed.
3. Fix structurally: migrate from workspaces to directory-per-env (`envs/prod`, `envs/staging`), each with its own backend + state, so you must `cd` in to operate on an environment.
4. Pin module versions: add `version = "x.y.z"` to every `module` block to stop upstream drift on `init`.
5. Add guardrails: constrain CI to apply only the matching env from the matching directory/branch, with a manual approval gate on prod.

**Common follow-ups / tradeoffs:** Modules = reusable building blocks, always pin versions; workspaces = state isolation but shared code/backend and easy to apply to the wrong env. Directory-per-env gives explicit separation, independent state/backend, visible config, and clear review — the common production pattern; workspaces are better reserved for lightweight, near-identical parallel instances. Tradeoff: directory-per-env has mild code duplication, but the clarity and blast-radius isolation are usually worth it.

**Key points:**
- Modules = reusable building blocks, always pin versions
- Workspaces = state isolation, but the current workspace is invisible and easy to misapply
- Directory-per-env: independent state/backend, visible config, clear review
- Reserve workspaces for lightweight, near-identical parallel instances

---

### 75. terraform plan review discipline

**Frequency:** Medium

**Question:** An engineer just wanted to change a parameter group on an RDS database. They ran `terraform apply`, hit enter to confirm, and that plan quietly carried a `forces replacement` — Terraform destroyed and recreated the production database, losing data and causing hours of downtime. The post-mortem verdict: "nobody actually read the plan." Explain the discipline of reviewing `terraform plan` before applying.

**What it is & why:** `terraform plan` shows **exactly what will change before you change it** — the whole point is to **review it carefully** so an apply never surprises you. This disaster was entirely catchable at plan-reading time, provided the team has a review discipline.

**Landing it in this case:**

1. **Read the full plan and count create/update/destroy.** The summary (`Plan: X to add, Y to change, Z to destroy`) is your first sanity check. You meant to change one parameter but the plan wants to **destroy 1 + add 1** (a recreate) — stop. This incident skipped exactly this step. Don't skim; read what's actually changing.
2. **Scrutinize every destroy for blast radius, and watch for `forces replacement`.** Especially watch for **`# forces replacement`** annotations on **critical, stateful resources** — a change to certain attributes (a DB engine parameter, an AZ, a name) forces Terraform to **destroy and recreate**. On a **database** that means **data loss + downtime** (this incident); on a **load balancer**, a new endpoint / dropped connections. Catching a `forces replacement` on a DB in review instead of after apply averts the disaster. Also check for **sensitive value churn**.
3. **Post the plan in the PR and require approval for destructive plans.** Use **Atlantis** (or `tf`-action tooling) to **run `plan` automatically and post its output as a PR comment**, so reviewers see the exact proposed changes as part of code review — and **require explicit approval** before a plan with destroys can apply. This stops one person unilaterally destroying prod.
4. **Apply exactly what was planned via a saved plan file.** Run `terraform plan -out=plan.tfplan` then `terraform apply plan.tfplan`. This applies the **saved plan** rather than re-planning at apply time — guaranteeing you apply **precisely what was reviewed**, with no chance that drift or a state change between plan and apply silently alters what happens.

**How to diagnose / optimize:**
1. Intercept this incident up front: read the summary line before applying; if `destroy` count > 0 and you meant to delete nothing, stop and investigate immediately.
2. Find the source of the recreate: search the plan for `forces replacement`, see which attribute triggered it; then switch to an in-place update path (e.g., some parameters via `apply_immediately` or a separate parameter-group resource) to avoid the recreate.
3. Protect stateful resources: add `lifecycle { prevent_destroy = true }` to databases so any destroy attempt errors out at plan time.
4. Make it process: wire in Atlantis to auto-plan into the PR, force approval on destructive changes, and forbid local `apply`.
5. Execution consistency: use `plan -out` in CI, then apply that file, eliminating drift between review and execution.

**Common follow-ups / tradeoffs:** Four disciplines — read every destroy line and count create/update/destroy; `forces replacement` = downtime/data-loss risk, focus on stateful resources; plan in the PR via Atlantis with approval on destructive changes; apply the saved plan to avoid drift. Hardening: the `prevent_destroy` lifecycle. Tradeoff: saved plans + PR approval add process overhead, but you get reviewable, accountable changes and no more one-person accidental prod deletion.

**Key points:**
- Read every destroy line, count create/update/destroy
- `forces replacement` = downtime/data-loss risk; add `prevent_destroy` on stateful resources
- Plan in the PR via Atlantis; destructive changes need approval
- Apply the saved plan to avoid drift between review and execution

---

### 76. Immutable vs mutable infrastructure

**Frequency:** Medium

**Question:** You maintain a fleet of 5 EC2 instances by hand — SSH in to patch, tweak configs. Production breaks, and you find only 1 of the 5 crashed: months ago someone manually installed a package on it and forgot to sync the rest. Nobody can say exactly what's installed on each box, and rebuilding a lost machine identically is nearly impossible. Contrast immutable and mutable infrastructure, and explain how immutable cures this "snowflake" disease.

**What it is & why:** Two philosophies for changing running servers. **Mutable infrastructure** modifies machines in place (SSH in or run Ansible/Chef/Puppet to patch, reconfig, deploy code). **Immutable infrastructure** never modifies a running server — any change builds a brand-new image and replaces the instances. This incident's "box A works, box B crashes, nobody can reproduce it" is the textbook mutable-infra disease: drift and snowflake servers.

**Landing it in this case:**
- **The mutable root cause (this incident):** manual fixes, failed partial updates, and one-off tweaks accumulate over time until **each server is subtly unique and undocumented** — a "snowflake" no one can reliably reproduce. Two boxes that should be identical aren't, causing "A works, B crashes" mysteries, and rebuilding a lost machine exactly is nearly impossible.
- **The immutable fix:** for *any* change (new code, a patch, a config tweak), **build a brand-new image** (container image, AMI, VM image) with the change baked in, then **replace** the instances — spin up new ones from the image, shift traffic, tear down the old. Running servers are **read-only, disposable, and identical to their image**. Benefits:
  - **No drift** — every instance is exactly its image; nothing mutates after boot, so machines stay reproducible and identical (this incident's snowflake simply disappears).
  - **Easy rollback** — a bad change? **Redeploy the previous image.** Rollback is just "run the old artifact," clean and fast (same idea as blue/green).
  - **Fits autoscaling** — because instances are identical and disposable, the autoscaler can freely create/destroy them from the image.
- **What it requires:** **fast image builds** (you build an image for *every* change, so slow builds hurt) plus **rolling-deploy automation** (to replace instances with zero downtime). **Containers are the canonical immutable unit** — an image is immutable by construction and Kubernetes replaces (never patches) pods, which is why the container ecosystem embodies immutable infra by default. Use **Packer** to build immutable VM images/AMIs in the non-container world.

**How to diagnose / optimize:**
1. Find this incident's drift: stop SSH-guessing box by box — diff each machine's package manifest / configs (`rpm -qa`/`dpkg -l`, config-file checksums); the differences are the snowflake evidence.
2. Stop the bleeding: pull the crashing box out of the load balancer and rebuild a replacement from a known-good image/template, rather than continuing to hand-patch.
3. Fix it: make machine builds a pipeline — bake AMIs with Packer or move to container images, and route all changes through "change image → build → replace," forbidding SSH edits to prod boxes.
4. Adopt rolling replacement: once a new image is out, roll the whole fleet with an ASG rolling replace or a K8s rolling update, replacing all old instances with zero downtime.
5. Prevent recurrence: disable interactive SSH to prod (or make it read-only) so any "just a quick fix" has to go back through the image/IaC, stopping drift from re-accumulating.

**Common follow-ups / tradeoffs:** Mutable → drift + snowflakes + hard to reproduce; immutable → replace, never patch, no drift, rollback = redeploy the prior image, fits autoscaling. Containers are inherently immutable; Packer serves the non-container case. Tradeoff: immutable demands fast image builds and rolling-deploy automation (slow builds hurt), and even a tiny change means building and replacing a whole machine — but you get reproducibility and clean rollback.

**Key points:**
- Mutable → drift + snowflakes, hard to reproduce
- Immutable → replace, never patch, no drift
- Fast image builds + rolling-replace automation are essential
- Rollback = redeploy the prior image; containers are inherently immutable, use Packer otherwise

---

### 77. Security groups vs NACLs (AWS)

**Frequency:** Medium

**Question:** You added a rule to a subnet's NACL to allow inbound 8080 so a new service could be reached, but testing shows connections just hang — the handshake never completes; yet opening 8080 on the security group instead works instantly. Separately, the security team spots a compromised instance blasting traffic out to a strange IP on the internet. Contrast security groups and NACLs, and explain both phenomena.

**What it is & why:** Two AWS firewalls at different layers, with one key difference: **stateful vs stateless**. **Security Groups (SG)** are **stateful, instance-level** firewalls; **NACLs** are **stateless, subnet-level** controls. This incident's "NACL inbound-only hangs, SG inbound works" is the direct manifestation of stateful vs stateless.

**Landing it in this case:**
- **Security Groups (why SG 8080 works):** attached to ENIs/instances, **allow rules only** (anything not allowed is implicitly denied). **Stateful** means allowing a port **inbound** automatically **permits the return traffic** back out — you don't write a rule for responses. So just declaring "allow inbound 8080" lets replies flow back. SGs are the day-to-day **primary tool** and can reference *other security groups* as sources ("allow from the app-tier SG").
- **NACLs (why inbound-only hangs — this incident):** attached to subnets, apply to all in/out traffic, support **allow AND deny rules** (evaluated in numbered order). **Stateless** means **no automatic return traffic** — you allowed inbound 8080 but must **separately allow the outbound ephemeral-port (1024-65535) return traffic**, or responses can't get out and the connection hangs. That's this incident's trap, and why NACLs are fiddlier (both directions managed by hand).
- **Runaway egress (this incident's compromised instance exfiltrating):** people often lock down inbound but leave **egress wide open (0.0.0.0/0 all ports)**, so a compromised instance can freely **exfiltrate data or call C2 servers** — exactly what the security team saw. Restricting egress to only the destinations a workload legitimately needs is an important, often-skipped hardening step.

**How to diagnose / optimize:**
1. Fix this incident's hung connection: confirm NACLs are stateless — check whether the subnet's NACL added inbound 8080 only and omitted the outbound ephemeral-port range (1024-65535); adding the outbound allow fixes it.
2. Confirm which layer dropped it: run **VPC Reachability Analyzer** or check **VPC Flow Logs** for `REJECT` records to tell whether the SG or NACL dropped the packet.
3. Handle the compromised instance: isolate it first (move it to an SG that egresses only to necessary destinations), audit Flow Logs for the exfiltration target IP/port, then do forensics.
4. Tighten egress: change the instance SG's outbound from `0.0.0.0/0` all-ports to only the destinations the workload legitimately needs (a specific DB, update sources), closing the exfiltration/C2 channel.
5. Layer the defenses: do day-to-day access control with SGs (fine-grained, reference-able), and use NACL **deny** at the subnet as a backstop to block known-malicious IP ranges.

**Common follow-ups / tradeoffs:** SG is stateful, instance-level, allow-only, references other SGs — the primary tool; NACL is stateless, subnet-level, allow + deny, evaluated in numbered order — a coarse secondary layer whose main value is the **deny** capability SGs lack (block IP ranges / backstop). Defense in depth = SG per instance + NACL per subnet. Production practice: default-deny ingress, only open what's needed, and **tighten egress** rather than only managing ingress. Gotcha: NACLs being stateless, both directions must be opened or connections hang.

**Key points:**
- SG: stateful, instance-level, allow-only, references other SGs
- NACL: stateless, subnet-level, allow + deny, both directions must be opened
- SGs first for access control, NACLs secondary for deny/backstop
- Tighten egress, not just ingress, to stop compromised-instance exfiltration/C2

---

### 78. Service discovery

**Frequency:** Medium

**Question:** An autoscale-in reclaimed a few backend instances, and for the next two or three minutes the frontend kept hitting the old, now-nonexistent instance IPs, timing out. It turned out the service address resolved through a DNS record with a 300-second TTL — the instances were gone but clients had the old IPs cached. Explain the approaches to service discovery and why a health-aware registry beats static DNS.

**What it is & why:** **Service discovery** answers "where is service X right now?" in a dynamic environment where instances constantly come and go (autoscaling, deploys, failures). Hardcoding IPs doesn't work — they change. This incident's "instances gone but clients still hit old IPs" is the classic weakness of plain DNS + TTL caching.

**Landing it in this case:**
- **1. DNS-based discovery (what this incident used, and the trap):** services find each other via **DNS names** resolving to current IPs — **Route53 private hosted zones**, **CoreDNS** (in Kubernetes), **Consul DNS**. Simple and universal, but plain DNS has a weakness: **TTL caching** means clients may cache a stale IP after an instance dies (this incident's TTL 300s is exactly that two-to-three-minute window), and basic DNS returns records regardless of whether the target is actually healthy.
- **2. Registry-based discovery (the fix):** a dedicated **service registry** (**Consul, Netflix Eureka, AWS Cloud Map**) where **services register on startup** and continuously report **health** via heartbeats. Clients/sidecars query the registry for *currently healthy* instances; the registry actively **removes unhealthy/dead instances**, so you're never routed to a down node.
- **3. Kubernetes automatic discovery:** a **Service** provides a stable virtual IP + DNS name, and **CoreDNS** resolves `my-svc.my-namespace.svc.cluster.local` automatically. The Service's endpoints are **kept in sync with healthy pods** (pods failing readiness probes are removed from rotation), so discovery is built-in and health-aware out of the box — had this incident used a K8s Service, it wouldn't have hit dead pods.
- **4. Cross-cluster / multi-region:** **external-dns** watches K8s Services/Ingresses and **syncs them to cloud DNS** (Route53, Cloud DNS) for external/other-cluster clients; or use **service-mesh federation** (Istio/Consul mesh linking clusters) for cross-cluster routing with mTLS and locality awareness.

**How to diagnose / optimize:**
1. Find this incident's root cause: `dig` the service name to see the TTL and returned IPs, compare against actually-alive instances, confirming clients cached dead IPs.
2. Emergency mitigation: drop the DNS record TTL from 300s to something small (5-30s) to shrink the stale window — but this only treats the symptom.
3. Fix it: switch to health-aware discovery — in K8s use a Service + readiness probes (dead pods auto-removed from endpoints); outside K8s use Consul/Cloud Map with self-registration + heartbeats so clients query currently-healthy instances.
4. Client resilience: add connection timeouts + retry to other instances, and don't pin a single IP (some languages/libraries cache DNS long-term — disable or shorten that JVM/resolver cache).
5. Cross-cluster: use external-dns to sync cloud DNS or service-mesh federation so what you resolve is always a live target.

**Common follow-ups / tradeoffs:** DNS discovery is simple and universal but suffers TTL caching and health-blindness; registries (Consul/Eureka/Cloud Map) use self-registration + heartbeats to return only currently-healthy instances; K8s Service + CoreDNS + readiness probes is health-aware built-in; cross-cluster uses external-dns or mesh federation. Core conclusion: a **health-aware registry (or K8s endpoints) returns only currently-healthy targets and updates within seconds of a failure**, indispensable in fast-changing autoscaling systems. Tradeoff: registries/mesh add components and operational complexity; plain DNS is easy but unreliable in dynamic environments.

**Key points:**
- k8s: Service + CoreDNS + readiness probes
- Mixed environments: Consul/Cloud Map with self-registration + heartbeats
- external-dns syncs to cloud DNS; cross-cluster uses mesh federation
- Health-aware registry beats static DNS (avoids TTL-cached dead instances)

---

### 79. Grafana dashboards and alerts

**Frequency:** Medium

**Question:** The on-call engineer complains that during an incident the "overview" Grafana dashboard is crammed with 50 panels and it's impossible to tell what's actually broken — and the dashboards were all hand-clicked in the UI, so when someone deleted a panel last time it was gone for good. Your boss asks you to overhaul the monitoring. Explain how you build Grafana dashboards and alerts.

**What it is & why:** **Grafana** is the **visualization layer** — it queries and graphs data from many sources in one unified UI: **Prometheus** (metrics), **Loki** (logs), **Tempo** (traces), **CloudWatch**, **BigQuery**, and more. It doesn't store data itself; it renders whatever the backends hold. This incident's two diseases — a wall of panels + un-versioned hand-clicking — map exactly onto the two practices below.

**Landing it in this case:**
- **Dashboards as code (cures "deleted, gone for good"):** don't click-build and leave un-versioned — they drift and get lost (this incident). **Make them code**: export/author the dashboard **JSON** and commit to Git, or generate with **Grafonnet** (Jsonnet library) or the **Grafana Terraform provider**, making dashboards **reviewable, diffable, and reproducible**; changes go through PR, and a deleted panel is a `git checkout` away.
- **Keep dashboards small and intentional (cures "50 panels, can't tell what's broken"):** don't build sprawling 50-panel dashboards no one reads. Aim for **one focused dashboard per service** built on a proven method: **RED** (**Rate, Errors, Duration** — best for request-driven services) or **USE** (**Utilization, Saturation, Errors** — best for resources like CPU, disk, queues). These ensure you show the few signals that actually matter, so an incident is a one-glance diagnosis, not a wall of noise.
- **Template variables:** use dropdowns for `cluster`, `namespace`, `service`, etc. so **one dashboard works across many targets** instead of duplicating one per environment. The variable feeds into PromQL (`{namespace="$namespace"}`), giving reusable, filterable views.
- **Where alerts run:** **Grafana unified alerting** (rules defined in Grafana, evaluated against any datasource, routed via Grafana's notification policies) or **Prometheus Alertmanager** (rules in Prometheus, Alertmanager handles grouping/routing/silencing). Alertmanager is the classic Prometheus-native path; Grafana unified alerting is convenient when alerting across multiple/varied datasources.

**How to diagnose / optimize:**
1. Refactor this incident's overview board: split it into one RED/USE focused board per service, keeping only a few key signals on the main board so an incident quickly localizes from a Rate/Errors/Duration anomaly to the specific service.
2. Rescue against deletion: export all existing dashboards to JSON and commit to Git (or migrate to Grafonnet / the Terraform provider); future changes go through PR, and deletions revert via version control.
3. The real diagnosis chain for an incident: check the service RED board and spot Errors/Duration rising → drill via template variable into the specific namespace/instance → switch to the Loki panel for that service's logs → switch to Tempo for slow traces to pinpoint the call bottleneck.
4. Alerting: attach alert rules to key RED/USE metrics (error rate, P99 latency, saturation), routed via Alertmanager/Grafana notification policies with grouping/dedup to avoid alert storms.
5. Prune panels: periodically clean out unread panels, keeping dashboards small and intentional.

**Common follow-ups / tradeoffs:** Grafana is the visualization layer, doesn't store data. Four practices: dashboards as code (JSON/Grafonnet/Terraform provider — reviewable, reproducible), template variables for reuse, one focused board per service via RED (rate/errors/duration, request-driven) or USE (utilization/saturation/errors, resources), and alerts in Alertmanager (Prometheus-native) or Grafana unified (cross-source). Tradeoff: dashboards-as-code has upfront learning/process cost but buys reviewability, diffs, and resistance to accidental deletion.

**Key points:**
- Dashboards as code in Git — resists drift and accidental deletion
- Template variables for reuse: one board, many targets
- One focused board per service: RED (request-driven) or USE (resources)
- Alerts in Alertmanager (Prometheus-native) or Grafana unified (cross-source)

---

### 80. OpenTelemetry: collector, signals, propagation

**Frequency:** Medium

**Question:** A request occasionally times out after crossing 5 microservices, but each service only logs its own piece separately — you can't stitch that one request's path across all 5, you're left guessing by timestamps. On top of that, to onboard an APM vendor earlier each service got that vendor's proprietary agent shoved in, and now switching vendors means changing everything. Explain how OpenTelemetry solves both problems.

**What it is & why:** **OpenTelemetry (OTel)** is a **vendor-neutral standard** (spec + SDKs) for the three telemetry signals — **traces, metrics, logs**. Its core value: **one SDK, many backends** — instrument *once* against the OTel API, then export to *any* compatible backend (Tempo, Jaeger, Datadog, Honeycomb...) by config, no rewriting to switch vendors. That cures this incident's "proprietary agent lock-in," while distributed tracing cures "can't stitch 5 services together."

**Landing it in this case:**
- **Context propagation (cures "can't stitch together"):** for a trace to span services, the **trace context must travel with the request** across boundaries. OTel uses the **W3C `traceparent` HTTP header** carrying the trace ID and parent span ID, so when A calls B, B's spans **link into the same trace** as A's. This standard header stitches the 5 services' spans into one end-to-end distributed trace, so you can see exactly which hop the request stalls on.
- **One SDK, many backends (cures "switching vendors means changing everything"):** instrument once with the OTel SDK, and the export target is just config — switching Datadog/Jaeger/Tempo doesn't touch business code, breaking the old lock-in where each APM ships its own proprietary agent.
- **The Collector:** apps emit telemetry in **OTLP** (the OTel wire protocol) to an **OpenTelemetry Collector** — a standalone pipeline between apps and backends that **receives, batches, filters, transforms, and samples**, then **exports** to one or more backends. Benefits: apps only speak OTLP to the Collector (no backend-specific config), sampling/filtering/routing/redaction are centralized, and changing backends means editing the Collector config, not the apps.
- **Auto vs manual instrumentation:** **auto-instrumentation** libraries hook into common frameworks (HTTP servers/clients, gRPC, DB drivers, message queues) and produce spans **without code changes** — broad coverage cheaply. **Manual instrumentation** adds **custom spans** around your business logic ("process-payment", "render-report") with domain attributes. Typical practice: auto-instrument for the framework baseline, then manually add spans for the critical operations.

**How to diagnose / optimize:**
1. Stitch the 5 services: add OTel auto-instrumentation (HTTP/gRPC libs) to each, and confirm the **`traceparent` header is propagated on every hop** (some old gateways/proxies strip custom headers — check this specifically).
2. Find the timeout hop: in the trace backend, pull the full span waterfall for that request by its trace ID and see which service's span is abnormally long — that's the source of the timeout.
3. Drill to root cause: add manual custom spans + domain attributes (order ID, downstream dependency) to the slow span, and correlate logs to traces via trace ID.
4. Control cost/privacy: centralize sampling (tail sampling to keep slow/error traces), filtering, and redaction in the Collector rather than configuring each app.
5. De-lock-in: consolidate export targets into the Collector so future backend switches only change the Collector config; verify the new backend receives OTLP data.

**Common follow-ups / tradeoffs:** OTel = a vendor-neutral standard for three signals (trace/metric/log), one SDK many backends to de-lock-in. The Collector centralizes processing/sampling/routing/redaction. The W3C `traceparent` header propagates context to stitch end-to-end traces. Auto-instrumentation gives the baseline, manual adds critical business spans. Tradeoff: full tracing is costly and needs sampling (head sampling is simple but may drop slow requests; tail sampling keeps slow/error traces but is heavier); the Collector is an extra component but buys centralized governance and app decoupling.

**Key points:**
- One SDK, many backends — de-lock-in from APM vendors
- Collector centralizes processing + sampling + routing + redaction
- W3C traceparent header propagates context, stitching end-to-end traces
- Auto-instrument common libs, manually add critical business spans

---

### 81. Pipeline scanning (Trivy, Snyk, Dependabot)

**Frequency:** Medium

**Question:** The security team tells you a Log4Shell-class CVE from a third-party dependency has been running in production for months, undetected. Your boss demands that from now on such vulnerabilities be caught before merge — but without drowning developers in a flood of low-severity alerts. Explain the categories of pipeline security scanning, the auto-update tooling, and the gating policy.

**What it is & why:** "Shift security left" — run automated scanners in CI so vulnerabilities are caught **before** merge/deploy, not in production. This incident's pain (a high-severity CVE lurking for months) is exactly what this layer prevents, while "don't drown developers" maps to a restrained gating policy. The categories cover the whole supply chain.

**Landing it in this case:**
1. **SCA (Software Composition Analysis) — most relevant here** — scans your **dependencies** for known CVEs (exactly this incident's third-party library flaw). Most vulnerabilities live in third-party deps, so this is high-value. Tools: Snyk, OWASP Dependency-Check, Trivy.
2. **SAST (Static Application Security Testing)** — scans **your own source code** for insecure patterns (SQL injection, hardcoded crypto, path traversal). Tools: Semgrep, CodeQL, SonarQube.
3. **IaC scanning** — scans **infrastructure code** (Terraform, K8s YAML, CloudFormation) for misconfigurations (public S3 buckets, open security groups, privileged containers). Tools: **Checkov, tfsec, Trivy**.
4. **Secret scanning** — detects **committed credentials** (API keys, tokens, private keys) in the repo/history. Tools: **gitleaks, trufflehog**.
5. **Container scanning** — scans **built images** for OS-package and library CVEs in the image layers. Tools: **Trivy, Grype**.

**Auto-updates (cures "lurking for months"):** **Dependabot** or **Renovate** watch your dependencies and **automatically open PRs to bump vulnerable/outdated deps** to a fixed version — remediation becomes a one-click merge instead of manual tracking. Renovate is more configurable (grouping, schedules); both drastically shrink the window you sit on a known-vulnerable dependency.

**Gating — the crucial policy (cures "don't drown developers"):** don't block on *everything* (that creates alert fatigue and blocks unrelated work over unfixable low-severity noise). Sensible policy: **block merge on HIGH/CRITICAL findings that have a fix available** (you can and must act on those), and **warn, don't block, on the rest** (lower severity, or no fix yet). This keeps the gate meaningful and actionable.

**How to diagnose / optimize:**
1. Respond to this incident's CVE: run an SCA scan across the whole repo to find which services pulled the vulnerable version (direct or transitive dependency), and identify the fixed version.
2. Fix fast: let Dependabot/Renovate open the upgrade PR, or manually pin to the fixed version; rebuild the image, rescan to confirm the CVE is gone, then ship via the same-artifact promotion path.
3. Build the interceptor layer: add SCA + container scanning (Trivy) to CI, and set "fixable HIGH/CRITICAL blocks merge" as a gate, so such flaws go red before merge from now on.
4. Control noise: the gate only blocks on fixable high-severity findings; route low-severity/no-fix findings to warnings, not blocks, so developers aren't drowned (the boss's requirement).
5. Don't lose findings: feed all scanner output into a **central vulnerability tracker** (DefectDojo or similar) for a durable, deduplicated queue with ownership and triage.

**Common follow-ups / tradeoffs:** Five scan categories — SCA + SAST + IaC + secrets + container — cover the whole supply chain; Dependabot/Renovate auto-updates shrink the exposure window; gating blocks merge only on **fixable HIGH/CRITICAL** and warns on the rest to avoid alert fatigue; aggregate findings into a central tracker (DefectDojo), otherwise they vanish into PR noise and get forgotten after merge. Tradeoff: too strict a gate drowns developers and blocks unrelated work; too loose lets high-severity slip through — the key is gating on "fixable + high-severity."

**Key points:**
- SCA + SAST + IaC + secrets + container scans cover the whole supply chain
- Dependabot/Renovate auto-updates shrink the exposure window
- Block merge only on fixable high/critical; warn on the rest to avoid drowning developers
- Aggregate findings in a central tracker (DefectDojo) so nothing slips through

---

### 82. AWS vs GCP vs Azure: rough service mapping

**Frequency:** Medium

**Question:** Management decreed "to avoid vendor lock-in, we'll support AWS and GCP simultaneously — code must run on either." Six months later the team is crushed: two IAM models, two networking stacks, two sets of ops tooling, and a "smooth over the differences" abstraction layer nobody wants to use. Give a rough service mapping across AWS/GCP/Azure, explain the IAM differences, and say why multi-cloud is often a "tax."

**What it is & why:** The big three offer broadly equivalent primitives under different names, conceptually mappable — but the **details differ everywhere**, which is precisely why this incident's "support both at once" crushed the team. First the mapping, then the biggest divergence (IAM), then why multi-cloud is a tax.

| Category | AWS | GCP | Azure |
|---|---|---|---|
| Compute (VMs) | EC2 | Compute Engine | Azure VMs |
| Managed Kubernetes | EKS | GKE | AKS |
| Serverless functions | Lambda | Cloud Functions | Azure Functions |
| Object storage | S3 | Cloud Storage (GCS) | Blob Storage |
| Managed Postgres | RDS | Cloud SQL | Azure Database for PostgreSQL |

(GKE is generally considered the most polished managed-Kubernetes offering, since Google originated Kubernetes.)

**How the IAM models differ (this incident's "two IAM models" pain)** — where the providers diverge most:
- **AWS** — **IAM roles + JSON policies.** Extremely **powerful and fine-grained**, but **verbose and complex** — policies are JSON documents with actions/resources/conditions, and getting least-privilege right is genuinely hard. Assume-role and cross-account trust add power and complexity.
- **GCP** — **IAM bindings** on a **resource hierarchy** (organization → folders → projects → resources). You bind a **member** (user/service account) to a **role** on a resource, and permissions **inherit down the hierarchy**. Generally **simpler and cleaner** than AWS, with the project/folder tree giving natural organizational scoping.
- **Azure** — **Azure RBAC** (role assignments scoped to subscriptions/resource-groups/resources) layered on **Entra ID** (formerly Azure AD) for identity. Familiar if you come from the Microsoft/AD world; identity and resource-access are somewhat separate concerns.

**Why multi-cloud is a tax (this incident's root cause):** services *map* conceptually, but the **details differ everywhere** — IAM models, networking, quotas, APIs, managed-service behaviors, and especially **operational tooling and team expertise**. Truly abstracting over all three (to avoid lock-in) usually means using only the **lowest common denominator** and building/maintaining a **costly abstraction layer** (exactly this incident's unloved layer) — you pay a real "multi-cloud tax" in complexity and lose the deep, provider-specific features that make each cloud valuable. For most teams the pragmatic choice is **pick one primary cloud**, go deep, and use another only where there's a compelling specific reason.

**How to diagnose / optimize (a multi-cloud project like this):**
1. Question whether the need is real: distinguish a genuine multi-cloud requirement (compliance mandating data in a specific cloud, acquisition legacy, cross-cloud DR) from a "fear of lock-in" imagined need — this incident is the latter, where the cost far exceeds the benefit.
2. Quantify the multi-cloud tax: inventory where the team is bogged down — two IAM/network configs, abstraction-layer maintenance, teams needing expertise in both, doubled CI/CD — and put the hours in front of management.
3. Converge on a primary cloud: pick the one where the team has the deepest experience and the managed services fit best, go deep on its native features (recovering what the abstraction layer cost).
4. If multi-cloud is genuinely needed: don't build a global abstraction — split by workload (service A only on AWS, service B only on GCP), each team using native tooling, rather than forcing "one codebase runs everywhere."
5. Reduce real lock-in risk: use cross-cloud-common layers (Terraform/Kubernetes/containers) for the portable parts, and freely use proprietary services rather than home-rolling a lowest-common-denominator abstraction.

**Common follow-ups / tradeoffs:** Mapping: compute EC2/CE/VM, managed k8s EKS/GKE/AKS, object S3/GCS/Blob, functions Lambda/Cloud Functions/Azure Functions, Postgres RDS/Cloud SQL/Azure DB. IAM diverges most: AWS JSON policies powerful but verbose, GCP hierarchical bindings cleaner, Azure RBAC + Entra ID. Core tradeoff: multi-cloud avoids lock-in but pays the tax of lowest-common-denominator + abstraction maintenance + doubled ops expertise; most teams should pick one primary and go deep, and if multi-cloud is truly needed, split by workload rather than abstract globally.

**Key points:**
- Managed k8s: EKS / GKE / AKS; object: S3 / GCS / Blob
- IAM differs significantly: AWS JSON policies / GCP hierarchical bindings / Azure RBAC + Entra ID
- Multi-cloud is mostly a tax: lowest common denominator + abstraction maintenance + doubled expertise
- Most teams pick one primary and go deep; if truly needed, split by workload

---

### 83. iptables vs nftables

**Frequency:** Low

**Question:** You added an `iptables` rule to DROP a malicious IP, but it still connects in fine. At the same time, a large K8s cluster with tens of thousands of Services shows noticeably high network latency. Compare iptables and nftables, and explain how you'd track down both phenomena.

**What it is & why:** Both are Linux packet-filtering frameworks built on the kernel's **netfilter** hooks; nftables is the modern successor to iptables. This incident's "DROP doesn't take effect" is a rule-ordering problem, and "high latency on a big cluster" is a kube-proxy backend scalability problem — both require understanding these two frameworks to diagnose.

**Landing it in this case:**
- **iptables structure (to diagnose the ordering problem):** filtering is organized into **tables** and **chains**. **Tables** group rules by purpose: **`filter`** (accept/drop — the firewall), **`nat`** (rewriting source/dest addresses/ports), **`mangle`** (modifying headers like TOS/TTL), `raw`. Within tables, **chains** are hook points in the packet's journey: **`INPUT`** (destined for this host), **`OUTPUT`** (originating here), **`FORWARD`** (routed *through* this host), plus `PREROUTING`/`POSTROUTING` (for NAT). You append rules to chains; each matches (protocol/port/IP) and takes a target (ACCEPT/DROP/etc.).
- **Why the DROP doesn't take effect (phenomenon one):** rules in a chain are evaluated **top-down, first match wins** (its target applies and evaluation typically stops). If a broad `ACCEPT` sits above your `DROP`, it matches first and the DROP is **unreachable** — a misordered rule silently opens or blocks traffic.
- **nftables:** the **modern replacement** — a **single `nft` tool** + **unified, more expressive syntax** replacing separate `iptables`/`ip6tables`/`arptables`/`ebtables`. Cleaner support for maps, sets, and combined IPv4/IPv6 rules, better performance, atomic rule replacement. Same **netfilter** underneath — the framework evolved, not a different mechanism.
- **Kubernetes relevance (phenomenon two):** **kube-proxy** (which implements Service load-balancing) historically programmed **iptables** rules to route Service traffic to pod IPs — scaling poorly with thousands of Services (huge rule lists, linear matching — exactly the big cluster's latency root cause). It later gained an **IPVS** mode (kernel L4 load balancer, more scalable) and now an **nftables** mode. Which backend kube-proxy uses directly affects networking performance at scale.

**How to diagnose / optimize:**
1. Diagnose the ineffective DROP: `iptables -L -n -v --line-numbers` to inspect chains with **packet/byte counters** and see which rules actually match — if your DROP counter is 0 while an ACCEPT above keeps climbing, a preceding rule is winning.
2. Fix the ordering: use `iptables -I` (insert at a position) to place the DROP *before* the broad ACCEPT, then recheck counters to confirm the DROP starts hitting.
3. Diagnose the big-cluster latency: check kube-proxy's current backend (`kube-proxy --proxy-mode` or its ConfigMap); if it's `iptables` mode with tens of thousands of Services, the linear rule matching is the bottleneck.
4. Switch the backend: move kube-proxy to **IPVS** or **nftables** mode (hash / better data structures), or evaluate an eBPF dataplane (Cilium) that bypasses kube-proxy.
5. Verify: after switching, observe Service-access latency and rule scale to confirm improvement.

**Common follow-ups / tradeoffs:** Tables filter/nat/mangle/raw; chains INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING; nftables is the successor — single tool, sets/maps, atomic replacement, same netfilter underneath. Rules are **top-down, first match wins**, so order is functionally significant. kube-proxy backends: iptables (linear, poor at scale) vs IPVS/nftables (more scalable). Inspect with `iptables -L -n -v` counters. Tradeoff: iptables has a mature ecosystem and abundant docs but scales poorly; nftables/IPVS are faster but carry migration and team-familiarity costs.

**Key points:**
- Tables filter/nat/mangle/raw; chains INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING
- Rules are top-down first-match-wins; wrong order silently opens/blocks traffic
- nftables is the successor (single tool, sets/maps, atomic replacement), same netfilter underneath
- kube-proxy at scale: IPVS/nftables beats iptables; use `iptables -L -n -v` to inspect counters

---

### 84. .dockerignore

**Frequency:** Low

**Question:** Two things happen at once: local `docker build` stalls for tens of seconds on "Sending build context" and the image is absurdly large; later a security audit finds the image pushed to the registry contains a `.env` (with a database password) and the entire `.git` directory. The Dockerfile has a single `COPY . .`. Explain how `.dockerignore` fixes all of these in one stroke.

**What it is & why:** When you run `docker build`, Docker first **sends the entire build context** (usually the whole directory `.`) **to the Docker daemon** before executing the Dockerfile. `.dockerignore` **excludes paths from that context** — exactly like `.gitignore` excludes files from Git — so they're never uploaded to the daemon or available to `COPY`/`ADD`. This incident's three symptoms (slow build, bloated image, secret leak) are all direct consequences of no `.dockerignore` + `COPY . .`.

**Landing it in this case:**
- **Slow build (symptom one):** without exclusions, huge directories like `node_modules`, `.git` history, and build outputs (`target/`, `dist/`) get **uploaded to the daemon on every build**, wasting time and disk even if the Dockerfile never copies them — on a large repo the context can be hundreds of MB, exactly the tens-of-seconds stall here.
- **Bloated/broken image (symptom two):** `COPY . .` drags in local `node_modules` (wrong-architecture native modules), local build artifacts, and cruft, causing subtle "works locally, breaks in container" bugs.
- **Secret leakage (symptom three, most dangerous):** local `.env`, credentials, `.aws/`, private keys, and `.git` get **copied into the image** by `COPY . .` and pushed to the registry (exactly what the audit found). Excluding them is a real security control.
- **The fix:** add a `.dockerignore` — its **syntax mirrors `.gitignore`** (glob patterns, `!` negation) — and **always exclude** at minimum: `.git`, `node_modules`, `target/`/`dist/`/`build/`, `*.env` and credential files, and local caches.

**How to diagnose / optimize:**
1. Handle this incident's leak: the image already contains `.env` — treat it as a credential leak and **rotate that database password immediately**, since image-layer history can't be cleanly scrubbed and the registry copy may already be pulled.
2. Add `.dockerignore`: write `.git`, `node_modules`, `*.env`, credentials/`.aws/`, `target/`/`dist/`/`build/`, etc., and rebuild.
3. Verify the context shrank: watch the build output's **`Sending build context to Docker daemon <size>`** (or BuildKit's transferred-context size); the number should drop noticeably — if still surprisingly large, `.dockerignore` is missing something.
4. Verify the image has no secrets: `docker history` to inspect layers, or run a container and `ls` to confirm `.env`/`.git` are no longer in the image.
5. Add a backstop: run secret scanning (gitleaks/trufflehog) in CI against the built image to prevent credentials being baked in again.

**Common follow-ups / tradeoffs:** `.dockerignore` excludes paths from the build context, fixing three things at once: less context-upload time, no image bloat/breakage, and preventing `.env`/`.git`/credentials leaking into the image (a real security control). Syntax matches `.gitignore`. Verify via the "Sending build context" size. Note: even with selective `COPY` and even with BuildKit, you still need `.dockerignore` to keep the *context upload* small and guard against an accidental `COPY .`. Tradeoff: nearly free; the only "cost" is remembering to maintain the exclusion list.

**Key points:**
- Reduces context-upload time (huge dirs no longer uploaded every build)
- Prevents `.env`/`.git`/credentials leaking into images; rotate immediately if leaked
- Syntax mirrors `.gitignore`; verify via "Sending build context" size
- Required even with BuildKit and even with selective COPY

---

### 85. BuildKit features

**Frequency:** Low

**Question:** Your CI builds are slow and have caused an incident: every job runs on a fresh ephemeral runner that downloads Go dependencies from scratch and recompiles, taking ten-plus minutes; worse, someone once `COPY`'d an SSH private key into the image to `git clone` a private repo, and the key ended up stuck in the image-layer history. Describe BuildKit and its key features and how they solve these.

**What it is & why:** **BuildKit** is Docker's **modern build engine** (default in current Docker, replacing the legacy builder), re-architecting the build as a **dependency graph** rather than a linear sequence. This incident's "recompile from scratch every time" is solved by its caching, and "private key in the image" by its secret/ssh mounts.

**Landing it in this case:**
- **Parallel stage execution + smarter caching:** in a multi-stage build, independent stages build **concurrently** instead of strictly top-to-bottom, and BuildKit only runs the stages a target actually needs; more precise cache invalidation and content-addressable caching than the old builder.
- **`--mount=type=cache` (cures "recompile from scratch"):** persists a directory (package/compiler cache) **across builds** without baking it into the image. E.g., `RUN --mount=type=cache,target=/root/.cache/go-build go build ...` keeps the Go build cache between builds so recompiles are fast — the cache never becomes an image layer.
- **`--mount=type=secret` (cures "secret in the image"):** exposes a secret (an npm/pip token) to a single `RUN` **without persisting it into any layer**, avoiding the classic mistake of secrets leaking into image history.
- **`--mount=type=ssh` (cures this incident's key copy):** forwards the host SSH agent to a `RUN` (e.g., to `git clone` a private repo) **without copying keys into the image** — exactly what this incident should have used instead of `COPY`ing the private key.
- **Remote cache (cures "ephemeral runner from scratch"):** `--cache-to` and `--cache-from` **export/import cache to/from a registry**, so **CI runners share build cache** — a fresh ephemeral runner pulls cache from the registry instead of rebuilding from scratch, a huge speedup for this incident's ephemeral-runner pipeline.
- **Enabling it + frontend:** set **`DOCKER_BUILDKIT=1`** (the **default** in modern Docker / `docker buildx`), so you usually get it automatically; the first line `# syntax=docker/dockerfile:1.x` selects a **Dockerfile frontend version**, letting you opt into newer features (like the `--mount` flags) **independent of your daemon version** — BuildKit pulls the specified frontend image to parse the Dockerfile.

**How to diagnose / optimize:**
1. Handle this incident's key leak: the private key is in the image-layer history and can't be cleanly scrubbed — **rotate that SSH key immediately** and remove the affected images from the registry.
2. Switch to an ssh mount: add `# syntax=docker/dockerfile:1` as the first line, change the `git clone` to `RUN --mount=type=ssh git clone ...`, build with `docker build --ssh default`, and the key never enters the image.
3. Add compile cache: add `--mount=type=cache` to `go build`/`npm ci` etc., so local recompiles are fast; use `docker history` to confirm the cache dir didn't become an image layer.
4. Speed up across runners: in CI use `docker buildx build --cache-to=type=registry,ref=... --cache-from=type=registry,ref=...` so ephemeral runners reuse the previous cache, and observe build time drop.
5. Verify BuildKit is enabled: confirm `DOCKER_BUILDKIT=1` or use `docker buildx`, otherwise the `--mount` syntax errors out.

**Common follow-ups / tradeoffs:** BuildKit's dependency-graph build unlocks parallel stages, content-addressable caching, `--mount=type=cache|secret|ssh`, remote cache (`--cache-from`/`--cache-to` for CI sharing), and the `# syntax=` frontend (upgrade Dockerfile features independent of the daemon). Always use secret/ssh mounts for secrets, never `COPY` (layer history can't be scrubbed). Tradeoff: remote cache needs registry storage and network-pull cost but is very worthwhile for ephemeral runners; cache mounts need care around cache contention during concurrent builds.

**Key points:**
- Parallel stage execution + content-addressable caching
- `--mount=type=cache` (compile cache out of layers), `secret`/`ssh` (secrets out of the image)
- Remote cache (`--cache-from`/`--cache-to`) lets ephemeral CI runners share
- `# syntax=` selects the frontend; use mounts not COPY for secrets, rotate if leaked

---

### 86. Buildx multi-arch images

**Frequency:** Low

**Question:** The team moved services to **AWS Graviton (arm64)** to save cost. Developers on M-series Macs run `docker pull repo/app:1.0` fine, but deploying to old amd64 nodes gives `exec format error`; and after CI added a step that emulates arm64 on amd64, build time jumped from 3 minutes to 25. Explain how building multi-arch images with buildx solves both "one tag runs everywhere" and "keep builds fast."

**What it is & why:** Different CPUs need different binaries — an **amd64** (Intel/AMD) image won't run on an **arm64** host and vice versa (exactly this incident's `exec format error`). **Multi-arch images** let a *single image tag* work on both. You build them with **`docker buildx`** (the BuildKit-powered build command):

```
docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .
```

**Landing it in this case:**
- **What it produces:** a **manifest list** (a.k.a. **OCI image index**) — a small top-level manifest that **references one image per architecture**. So `repo/app:1.0` isn't a single image; it's an index pointing to the amd64 build *and* the arm64 build.
- **How consumers use it (cures this incident's exec format error):** when any host runs `docker pull repo/app:1.0`, the registry/client inspects the manifest list and **automatically selects the variant matching that host's CPU** — the developer's M-series Mac gets arm64, Graviton gets arm64, old amd64 nodes get amd64, transparently. One tag, the right binary everywhere.
- **Speed — QEMU vs native builders (cures this incident's slow build):** to build for an architecture different from the build host, buildx can use **QEMU emulation** (e.g., emulating arm64 on an amd64 runner) — convenient (works anywhere) but **slow**, since every instruction is emulated, exactly the 3-to-25-minute jump here. For speed, use **native remote builders** — a real arm64 machine builds arm64 while an amd64 machine builds amd64 — no emulation. `docker buildx create --use` sets up a builder that can target multiple nodes/platforms.

**How to diagnose / optimize:**
1. Confirm the `exec format error` is an architecture mismatch: `docker inspect repo/app:1.0` or `docker manifest inspect repo/app:1.0` to see whether it's a **single-architecture** image.
2. If it's amd64-only: rebuild and push a manifest list with `docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .`.
3. Verify: `docker manifest inspect repo/app:1.0` should show both amd64 *and* arm64 `platform` entries.
4. Fix the slow build: replace CI's QEMU emulation with **native runners** — `docker buildx create --use` to build a multi-node builder, so the amd64 job runs on an amd64 machine and the arm64 job on an arm64 machine (GitHub Actions has arm64 runners, or self-host Graviton runners), and watch build time drop.

**Common follow-ups / tradeoffs:** A manifest list (OCI image index) auto-selects the per-architecture variant, so one tag is correct everywhere. QEMU emulation is convenient but slow (every instruction emulated); native remote builders have no emulation and are fast. `docker buildx create --use` builds a multi-platform builder. Why it matters now: Apple Silicon developers need arm64, production increasingly uses arm64 server chips (Graviton, Ampere) for price/performance, *and* plenty of infra is still amd64. Tradeoff: multi-arch builds are either slow (QEMU) or require maintaining a native runner pool (cost) — pick one.

**Key points:**
- `docker buildx create --use` + `--platform linux/amd64,linux/arm64`
- Manifest list (OCI index) auto-selects per-arch, curing `exec format error`
- Prefer native runners over QEMU (per-instruction emulation is very slow)
- Verify multi-arch entries with `docker manifest inspect`

---

### 87. Image signing (Cosign, SLSA)

**Frequency:** Low

**Question:** In a security incident, an attacker gained write access to one of your registries and quietly swapped the `repo/app:prod` tag for a backdoored image; the cluster kept pulling and deploying it, and it took days to notice. The mandate afterward: "production clusters may only run images built and signed by our trusted CI pipeline." Use Cosign, SLSA, and attestations to explain how you build that supply-chain trust.

**What it is & why:** The goal is **supply-chain integrity** — proving the image you're about to run is the *exact* artifact your trusted pipeline built, not one tampered with or swapped in a compromised registry (this incident). The core tool is **Cosign (sigstore project)** — it **signs OCI artifacts** (images and other registry artifacts) — combined with enforced verification at admission.

**Landing it in this case:**
- **Cosign signing — two modes:** **static keys** (you hold a private key), or more powerfully **keyless / OIDC** signing — instead of long-lived keys, Cosign obtains a **short-lived certificate from Fulcio** tied to an **OIDC identity** (e.g., your GitHub Actions workflow's identity), signs with it, and records the signature in the **Rekor** transparency log. The signature attests "**this identity** (this CI workflow) built and signed this image," with no key to leak or rotate.
- **Sign the digest, not the tag (directly cures this incident):** **signatures live alongside the image in the registry** (as related artifacts referencing the image digest) — no separate signature store. You sign the **digest** (`cosign sign image@sha256:...`), not a mutable tag — so the attacker's swapped backdoor image has a different digest and no valid signature from a trusted identity, and admission rejects it.
- **SLSA for build trust:** **SLSA** (Supply-chain Levels for Software Artifacts) is a **framework defining provenance levels**. Higher levels demand stronger guarantees; **SLSA Level 3** requires **non-falsifiable build provenance** — a signed, tamper-resistant record of *how* the artifact was built (source, builder, parameters) produced by a hardened build service, so an attacker can't forge "this came from our pipeline."
- **Attestations complete the chain:** beyond a bare signature, attach signed **attestations**: an **SBOM** (Software Bill of Materials — the full component/dependency list, enabling "am I affected by CVE-X?" queries) and **build provenance** (the SLSA record). Signature + SBOM + provenance, all verifiable, give an end-to-end, auditable chain from source to running container.

**How to diagnose / optimize:**
1. Forensics for this incident: `cosign verify repo/app:prod --certificate-identity=... --certificate-oidc-issuer=...` against the currently-running image — a verification failure proves it wasn't built by the trusted pipeline.
2. Check the **Rekor** transparency log to reconcile signature records — confirm which digests were signed by the real identity and which was the swapped-in one.
3. Add enforcement: install an **admission-time policy** — **Kyverno**, **Connaisseur**, or sigstore policy-controller — to **reject any image not signed by a trusted identity**, so an unsigned or wrongly-signed image simply **can't be deployed**. This turns "we sign images" into a hard guarantee.
4. Add a signing step to CI (keyless OIDC) plus generate and sign SBOM and SLSA provenance attestations, pushed alongside the image.
5. Verify: intentionally push an unsigned image to the cluster and confirm the admission policy rejects it.

**Common follow-ups / tradeoffs:** Cosign signs OCI artifacts; keyless/OIDC mode gets a short-lived cert from Fulcio and records to the Rekor transparency log, avoiding long-lived key leak/rotation. Always sign the digest, not a mutable tag. SLSA Level 3 requires non-falsifiable build provenance. Attestations (SBOM + provenance) complete the audit chain. Key point: a signature is worthless unless verified at admission. Tradeoff: keyless signing depends on sigstore infrastructure (Fulcio/Rekor availability), and admission verification adds deployment-path complexity but buys strong supply-chain guarantees.

**Key points:**
- `cosign sign image@digest` (sign the digest, not the tag, to defeat tag swaps)
- Keyless signing: OIDC + Fulcio + Rekor transparency log
- Verify at admission with Kyverno/Connaisseur; reject unsigned
- SLSA provenance + SBOM attestations build an end-to-end trust chain

---

### 88. Topology spread constraints

**Frequency:** Low

**Question:** Your web service has 6 replicas across a 3-AZ cluster. One day `us-east-1a` goes down entirely and the service is completely unavailable — investigation shows the scheduler packed 5 of the 6 replicas into 1a. Explain how topology spread constraints keep replicas evenly spread, and why they beat pod anti-affinity for HA spreading.

**What it is & why:** **Topology spread constraints** control **how evenly a workload's pods are distributed across topology domains** — failure domains like **availability zones, nodes, or racks**. The point is exactly this incident's high availability: if all replicas land in one zone and it fails, you're fully down; spreading ensures a zone/node loss takes out only a fraction of replicas.

```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: {matchLabels: {app: web}}
```

**Landing it in this case:** adding the block above to the web Deployment, 6 replicas × 3 zones + `maxSkew: 1` yields a **2/2/2** distribution — losing 1a takes only 2, leaving 4 to hold up. The three key fields:
- **`topologyKey`** — the node label defining the domain to spread across (`topology.kubernetes.io/zone` for zones, `kubernetes.io/hostname` for nodes, a custom `rack` label, etc.).
- **`maxSkew`** — the **maximum allowed imbalance** between domains. `maxSkew: 1` means the pod-count difference between the most- and least-populated domain is at most 1 — near-perfectly even (exactly what this incident needed). A larger skew allows more imbalance.
- **`whenUnsatisfiable`** — what to do if the constraint *can't* be met: **`DoNotSchedule`** (hard — leave the pod **Pending** rather than violate the spread) vs **`ScheduleAnyway`** (soft — the scheduler *prefers* spreading but places the pod anyway if it can't). Choose hard when balanced spread is a strict HA requirement; soft when having *some* placement matters more than perfect balance.

**How to diagnose / optimize:**
1. Review this incident's imbalance: `kubectl get pods -l app=web -o wide` to see the NODE column, then `kubectl get nodes -L topology.kubernetes.io/zone` to map nodes to zones and confirm which zone the replicas piled into.
2. Add the `topologySpreadConstraints` above and roll: `kubectl rollout restart deploy/web`.
3. Verify distribution: re-run `kubectl get pods -o wide` and expect roughly 2/2/2.
4. If pods go **Pending** after a hard (`DoNotSchedule`) constraint: `kubectl describe pod` for events — usually a zone lacks node capacity for the balanced distribution, so either scale that zone's nodes or downgrade to `ScheduleAnyway` as a tradeoff.
5. Note nodes must actually carry the `topology.kubernetes.io/zone` label (cloud providers usually set it automatically), or the constraint has nothing to spread across.

**Common follow-ups / tradeoffs:** `maxSkew` gives quantitative control of imbalance, `topologyKey` picks zone/hostname/rack, `DoNotSchedule` (hard, may Pending) vs `ScheduleAnyway` (soft). Why preferred over pod anti-affinity: anti-affinity expresses "don't co-locate these pods," but for spreading *many replicas evenly* it's clumsy and **scales poorly** — essentially binary (avoid/allow), scheduler evaluation gets expensive with many pods, and it can't express "balance within a tolerance." Topology spread constraints give direct quantitative control of the *distribution*, better scheduler performance at scale, and finer tuning. Tradeoff: hard constraints guarantee balance but cause Pending on insufficient capacity; soft avoids Pending but may end up imbalanced.

**Key points:**
- `maxSkew` quantitatively controls imbalance, curing replicas piling into one zone
- `topologyKey`: zone/hostname/rack; nodes must carry the corresponding label
- `DoNotSchedule` (hard, may Pending) vs `ScheduleAnyway` (soft)
- Better than anti-affinity for balancing many replicas, and lighter on the scheduler

---

### 89. CNI choices: Calico, Cilium, Flannel

**Frequency:** Low

**Question:** Your cluster was originally started on Flannel. Now compliance requires that the payment service's pods be reachable only by the order service, that you can audit who is talking to whom, and that cross-node traffic be encrypted — but you find that the NetworkPolicy you wrote on Flannel simply has no effect. Compare the Calico, Cilium, and Flannel CNIs and explain how you'd choose to meet these requirements.

**What it is & why:** A **CNI (Container Network Interface)** plugin provides pod networking — assigning pod IPs and routing traffic between pods across nodes. This incident's pain (policy has no effect, need for audit, need for encryption) exposes exactly the three CNIs' simplicity-vs-features divide.

**Landing it in this case — the three choices:**
- **Flannel (this incident's starting point, not enough):** the **simplest**, a basic **VXLAN overlay** encapsulating pod traffic in UDP packets tunneled between nodes. Easy to set up, "just works" for basic pod-to-pod connectivity. **Limitations:** it provides **no NetworkPolicy** (can't restrict which pods talk to which — a flat, fully-open network, exactly why this incident's policy has no effect) and the overlay adds encapsulation overhead. Good for dev/learning clusters or simple setups without network-security or high-performance needs.
- **Calico:** mature, security-focused. Can route pod traffic via **BGP without an overlay** (pods get routable IPs advertised between nodes — no encapsulation overhead, better performance and physical-network integration). Provides full **Kubernetes NetworkPolicy** (and richer Calico policies) for segmentation — enough for this incident's "only order may reach payment" — plus an **eBPF dataplane** option for higher performance.
- **Cilium (best meets all of this incident's needs):** modern, **eBPF-native**. Built on eBPF (programmable kernel dataplane) it offers: **L3–L7 network policies** (not just IP/port — allow/deny at the *HTTP/gRPC/Kafka* level, e.g., "allow GET /api but not DELETE"), **transparent encryption** (WireGuard/IPsec between nodes, curing the encryption requirement), a **sidecarless service mesh** (mesh features without injecting Envoy into every pod — less overhead), and **Hubble** for deep **network observability** (flow-level visibility into who's talking to whom, curing the audit requirement). Cilium can even **replace kube-proxy** entirely with eBPF service load-balancing.

**How to diagnose / optimize:**
1. Confirm why the Flannel policy is ineffective: `kubectl get networkpolicy` shows the policy exists, but Flannel has no policy-enforcement engine, so it's inert — this isn't a misconfiguration, it's the CNI not supporting it.
2. Decide: needing NetworkPolicy means switching to Calico or Cilium; this incident also needs L7 audit + encryption, pointing to Cilium.
3. Migration is heavy (switching CNI usually means rebuilding the cluster or rolling-replacing the DaemonSet) — validate in a staging cluster first.
4. After moving to Cilium, verify policy: deploy a CiliumNetworkPolicy allowing only order→payment; `kubectl exec` from another pod to payment should be denied.
5. Verify audit and encryption: `hubble observe --to-pod payments` to see flows correctly allow/deny; `cilium status` / `cilium encrypt status` to confirm WireGuard encryption is on.

**Common follow-ups / tradeoffs:** Flannel is simplest but has no policy and overlay overhead; Calico provides BGP overlay-free routing + NetworkPolicy + an eBPF dataplane option; Cilium is eBPF-native, giving L3–L7 policy, transparent encryption, sidecarless mesh, Hubble observability, and kube-proxy replacement. How to choose: Flannel for dev/test with no policy needs; Calico for mature NetworkPolicy + BGP integration with existing networks; Cilium for modern clusters wanting L7 policy, built-in observability, encryption, and mesh. Tradeoff: Cilium is the most feature-rich but needs a recent kernel and more operational sophistication, and switching CNI is itself a high-risk migration.

**Key points:**
- Flannel: simplest, no policy (this incident's root cause)
- Calico: BGP overlay-free + NetworkPolicy
- Cilium: eBPF, L7 policy, Hubble audit, transparent encryption
- Cilium can replace kube-proxy; switching CNI is a heavy migration, validate in staging first

---

### 90. Pod Security Standards

**Frequency:** Low

**Question:** After upgrading the cluster from 1.24 to 1.25, the pile of **PodSecurityPolicies** you used to forbid privileged containers and restrict host mounts suddenly do nothing, and `kubectl get psp` reports the resource doesn't exist; meanwhile the security team demands that all business-namespace pods run non-root and drop all capabilities. Explain how to restore this with Pod Security Standards, and when you'd still need Kyverno/Gatekeeper.

**What it is & why:** **Pod Security Standards (PSS)** define **how locked-down a pod must be**, the built-in replacement for the old **PodSecurityPolicy (PSP)** — PSP was **removed in Kubernetes 1.25** (exactly why this incident's PSPs stopped working). PSP was hard to use correctly (confusing authorization model, easy to misconfigure), so it was replaced by the simpler PSS + **PodSecurity admission controller**.

**Landing it in this case — the three levels** (increasing strictness):
- **Privileged** — **no restrictions**. Allows everything, including privileged containers, host namespaces, hostPath mounts. For trusted system/infra workloads only.
- **Baseline** — **blocks known privilege-escalation vectors** while staying broadly compatible. Disallows privileged containers, host networking/PID, dangerous capabilities — a sensible minimum most normal workloads still satisfy.
- **Restricted** — **heavily hardened**, following pod-hardening best practices: must run **non-root**, **drop all capabilities**, use **`seccomp: RuntimeDefault`**, disallow privilege escalation, read-only root filesystem encouraged. Exactly the level this incident's security team is asking for.

**How you enforce it** — the built-in **PodSecurity admission controller** is configured **per namespace via labels**:

```yaml
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

You can also set `warn` and `audit` modes (surface violations without blocking, useful for gradual rollout). At `enforce`, violating pods are **rejected at admission**.

**How to diagnose / optimize:**
1. Confirm this incident's root cause: after 1.25 the PSP API is removed, so `kubectl get psp` reports `the server doesn't have a resource type "podsecuritypolicies"` — the old policies silently stopped working and the cluster is currently wide open.
2. Don't jump straight to `enforce` — first label business namespaces with **`audit` and `warn`** pointing at `restricted` to collect which violations existing pods trip (warnings in `kubectl get events` or the apiserver audit log).
3. Fix pod specs one by one: add `securityContext.runAsNonRoot: true`, `capabilities.drop: [ALL]`, `seccompProfile: RuntimeDefault`.
4. Once clean, flip the label to **`pod-security.kubernetes.io/enforce: restricted`**, after which violating pods are rejected at admission.
5. Verify: intentionally submit a root-running pod and confirm it's rejected with the specific violation named.

**Common follow-ups / tradeoffs:** PSP removed in 1.25, PSS replaces it; three levels privileged/baseline/restricted; enforced per-namespace label with enforce/warn/audit modes (audit-then-enforce is the safe rollout path). When to reach for Kyverno/Gatekeeper (OPA): PSS gives only three coarse, fixed levels you can't customize. For **granular or custom policy** — "every pod must have specific labels," "only allow images from our registry," "enforce resource limits," or mutate resources — use a policy engine to write arbitrary validating/mutating policies. Common pattern: PSS `restricted` as baseline hardening + Kyverno/Gatekeeper for org-specific rules on top. Tradeoff: PSS is built-in and zero-dependency but only three levels; policy engines are flexible but need extra deployment/maintenance.

**Key points:**
- PSP removed in 1.25 (this incident's root cause); PSS is the built-in replacement
- Three levels privileged/baseline/restricted, enforced via namespace labels
- Audit/warn first to collect violations, fix, then flip to enforce
- Custom rules (labels/registry/resource limits) via Kyverno/Gatekeeper

---

### 91. kubeconfig contexts

**Frequency:** Low

**Question:** An engineer meant to clear a batch of test pods in staging, ran `kubectl delete deploy --all`, and seconds later the production order service was gone — their active context was actually still on **prod** while they thought they were in staging. The mandate afterward: define team-wide guardrails against wrong-cluster operations. Explain kubeconfig and contexts, and the concrete guardrails.

**What it is & why:** **kubeconfig** (`~/.kube/config`) tells `kubectl` **which clusters exist, how to authenticate to each, and which one you're currently targeting**. It holds three kinds of entries: **clusters** (API server address + CA cert), **users** (credentials — certs, tokens, exec plugins), and **contexts**. This incident's disaster stems precisely from not knowing "which one you're currently targeting."

**Landing it in this case:**
- **A context is a named bundle of (cluster + user + namespace)** — "use *this* cluster, as *this* user, defaulting to *this* namespace." You **switch the active context** with `kubectl config use-context prod`, and every subsequent `kubectl` targets whatever the current context points at — including that fatal `delete --all`. `kubectl config get-contexts` lists them and marks the active one.
- **Ergonomic tools:** **`kubectx`** (fast context switching — `kubectx prod`) and **`kubens`** (fast namespace switching — `kubens payments`), much quicker than the verbose `kubectl config` commands, often with fuzzy selection.
- **Guardrails against wrong-cluster (exactly what this incident must add):**
  - **Prompt indicators** — use **`kube-ps1`** (or a starship/oh-my-zsh segment) to **show the current context and namespace in your shell prompt**, so prod is always visibly staring at you before you hit Enter. Seeing `(prod:payments)` is the cheapest, most effective safeguard — with it, this incident's mistake likely wouldn't have happened.
  - **Separate `KUBECONFIG` per environment** — rather than one giant config mixing prod and dev, keep **separate kubeconfig files** and set `KUBECONFIG` per terminal/session (e.g., a dedicated "prod" terminal), making it structurally hard to hit prod from a dev shell.
  - Additional practices: use **read-only or scoped credentials** where possible, require an extra confirmation for prod, and don't leave prod as the default context.

**How to diagnose / optimize:**
1. First step in an incident — **confirm which cluster you're on**: `kubectl config current-context` and `kubectl config get-contexts`.
2. Review this incident: they ran `delete --all` without checking context, prod used writable credentials, and prod was the default context — three failures.
3. Install guardrails: give everyone `kube-ps1` so the prompt always shows `(context:namespace)`; keep a separate prod kubeconfig loaded only in a dedicated terminal via `export KUBECONFIG=~/.kube/prod`.
4. Tighten permissions: bind day-to-day contexts to **read-only or scoped RBAC credentials**; destructive operations require switching to an explicit high-privilege context.
5. Recover this incident: re-`apply` the order service's manifests from the GitOps/Helm repo, or restore from an etcd backup — which also shows prod must have declarative rebuild capability as a backstop.

**Common follow-ups / tradeoffs:** A context = a named bundle of cluster + user + namespace; `use-context` switches, `get-contexts` inspects; `kubectx`/`kubens` boost ergonomics. Three anti-wrong-cluster measures: `kube-ps1` prompt showing context/namespace (cheapest and most effective), per-environment `KUBECONFIG` files, and prod using scoped credentials + extra confirmation + not-default. Tradeoff: separate kubeconfigs are slightly cumbersome but structurally isolate prod; read-only credentials add day-to-day switching cost but block accidental operations.

**Key points:**
- Context = cluster + user + namespace; check `current-context` before acting
- `kubectx`/`kubens` for ergonomics
- `kube-ps1` prompt shows context to prevent wrong-cluster (what this incident most needed)
- Per-environment `KUBECONFIG` + prod scoped credentials, not default

---

### 92. Ephemeral containers (kubectl debug)

**Frequency:** Low

**Question:** A production service packaged from a distroless image starts intermittently hanging. You want to get in and see where it's stuck, but `kubectl exec -it pod/foo -- sh` fails with `exec: "sh": executable file not found` — the image has no shell, no `ps`, no `curl`; and restarting the pod would destroy the live state you're trying to capture. Explain how to troubleshoot this with `kubectl debug` ephemeral containers.

**What it is & why:** **Ephemeral containers** let you **attach a temporary debug container to an already-running pod without restarting it**:

```bash
kubectl debug -it pod/foo --image=busybox:1.36 --target=app -- sh
```

**Landing it in this case:**
- **Why exec fails:** the whole point of hardened images is that **distroless / scratch images have no shell** and no debug tools (no `sh`, `curl`, `ps`, `cat`) — great for security, but it means you **can't `kubectl exec` in to troubleshoot** (nothing to exec — exactly this incident's error).
- **How ephemeral containers solve it:** you inject a *separate* container (with busybox / your debug toolkit) **into the running pod**, giving you a shell and tools *alongside* the app — crucially **without killing/restarting the pod**, so you can inspect the live, misbehaving instance in place (restarting would destroy the hang state this incident needs to capture).
- **`--target` shares the process namespace:** with `--target=app`, the debug container **shares the process (PID) namespace of the `app` container**, so your debug shell can **see the app's processes** (`ps` shows them) and read its **`/proc/<pid>/...`** — open files, environment, memory maps, network state. This debugs the *target* container's actual runtime.
- **Limitation — no volumes:** you **cannot mount volumes** into an ephemeral container (they're added to an existing pod spec, which can't gain new volume mounts). So you can inspect processes/filesystem-via-proc but can't mount a new tool volume.

**How to diagnose / optimize:**
1. Inject a debug container sharing the target PID: `kubectl debug -it pod/foo --image=busybox:1.36 --target=app -- sh`.
2. Locate the hang: `ps aux` to find the app process PID and its state; `cat /proc/<pid>/status`, `/proc/<pid>/wchan` to see which syscall it's stuck in (e.g., a network read).
3. Check connections: use a richer-tool image (e.g., `nicolaka/netshoot`) via `kubectl debug ... --image=nicolaka/netshoot`, run `ss -tanp`, `curl` to see if it's stuck on a downstream dependency's connection.
4. If node-level is suspected (disk full, kubelet, container runtime): use **`kubectl debug node/<node>`**, which launches a privileged pod on the node with the host filesystem at `/host` — debugging the node itself rather than a pod.
5. After locating it, fix (e.g., add a timeout, expand the connection pool); the ephemeral container disappears with the pod lifecycle and doesn't pollute the spec.

**Common follow-ups / tradeoffs:** Ephemeral containers add a temporary shell/tools to scratch/distroless images without restarting the pod (preserving live state). `--target` shares the target container's PID (sometimes net) namespace, so you can `ps` and read `/proc/<pid>`. For host-level inspection (node filesystem, kubelet, runtime, host processes) use `kubectl debug node/<node>`, which mounts the host root at `/host`. Limitation: you can't mount volumes into an ephemeral container (added to an existing pod spec, no new volume mounts). Tradeoff: ephemeral containers can't be pre-baked into the image, they're runtime-injected, and the cluster must have the feature enabled (default-on in recent K8s).

**Key points:**
- Add a shell to scratch/distroless without restarting the pod (preserve live state)
- `--target` shares the target pid/net; can `ps` and read `/proc/<pid>`
- `kubectl debug node/<node>` for host-level inspection (mounts to `/host`)
- Can't mount volumes into an ephemeral container; use tool-rich images like netshoot

---

### 93. Admission controllers

**Frequency:** Low

**Question:** A post-mortem finds that someone deployed a service with no resource limits and it ate all the node's memory, dragging down other pods on the same node; and someone else shipped an image pulled from a personal Docker Hub account. The team demands that any pod must carry resource limits and use only company-registry images *before* it goes live — enforced automatically by the cluster, not by human review. Explain how admission controllers do this, and the built-in vs custom policy options.

**What it is & why:** **Admission controllers** are hooks that **intercept API-server requests after authentication and authorization but before the object is persisted to etcd** — the last gate that can **reject or modify** a create/update, exactly the "block before it goes live" spot this incident needs. They come in two kinds and order matters: **mutating admission runs first** (can *change* the object — inject a sidecar, add default labels, set fields), **then validating admission runs** (can only *accept or reject* the now-final object). Mutating-before-validating ensures validation sees the object as it will actually be stored.

**Landing it in this case:**
- **Built-in admission controllers** (compiled into the API server) provide core safety nets:
  - **LimitRanger** — applies **default requests/limits** to containers that don't specify them, and enforces min/max per the namespace's LimitRange. This incident's "no limits ate all memory" can be backstopped with defaults here.
  - **ResourceQuota** — enforces **namespace-level caps** (total CPU/memory/object counts), rejecting creates that exceed the quota.
  - **PodSecurity** — enforces the **Pod Security Standards** (privileged/baseline/restricted) based on namespace labels.
- **Dynamic / custom policy** (for rules Kubernetes doesn't ship, like "only the company registry") — three approaches:
  - **ValidatingAdmissionPolicy** — in-tree, **CEL-based** rules defined as Kubernetes resources, evaluated by the API server itself (no external webhook to run/maintain) — great for simple inline checks.
  - **Admission webhooks** — the API server calls out to your service to validate/mutate; how policy engines plug in.
  - **Policy engines** — **Kyverno** (policies as **Kubernetes-native YAML** — approachable, no new language) vs **OPA Gatekeeper** (policies in **Rego** — more powerful/expressive but a steeper learning curve). Both enforce custom org policy: **only allow-listed registries** (curing this incident's personal image), **required labels/annotations**, **ban privileged pods**, require resource limits, etc.

**How to diagnose / optimize:**
1. Enforce "must carry resource limits": configure a **LimitRange** on the namespace (defaults + min/max) so LimitRanger fills in missing defaults and rejects out-of-bounds; for a hard "must be explicitly declared," write a Kyverno validate rule `pattern: resources.limits`.
2. Enforce "only company registry": install Kyverno, write a rule validating the `image` prefix must be `registry.mycompany.com/`, else reject — deploy that ClusterPolicy via `kubectl apply`.
3. Run in audit mode first (Kyverno `validationFailureAction: Audit`) to see how many existing pods violate, fix them, then flip to `Enforce`.
4. Verify: submit a pod using `docker.io/someuser/x` with no limits and confirm admission rejects it with the reason named.
5. Troubleshoot the webhook itself: if deployments suddenly all get rejected or time out, `kubectl get validatingwebhookconfigurations` and check the policy-engine pods are healthy — a down webhook can block all requests (mind `failurePolicy`).

**Common follow-ups / tradeoffs:** Admission intercepts after authn/authz, before persistence; mutating runs before validating (validation sees the final object). Built-in LimitRanger + ResourceQuota + PodSecurity are the safety nets. Custom rules, three choices: CEL ValidatingAdmissionPolicy (in-tree, no webhook, simple), admission webhooks, and policy engines Kyverno (YAML) vs Gatekeeper (Rego). Together they turn the API server into an enforcement point where org rules are guaranteed before anything runs. Tradeoff: webhook-based policy engines are powerful but introduce an external dependency (down/timeout can block the cluster — set `failurePolicy` carefully and exclude critical namespaces); CEL inline policies avoid that risk but have limited expressiveness.

**Key points:**
- Mutating runs before validating; admission is the last gate before persistence
- LimitRanger (default/limit limits) + ResourceQuota + PodSecurity are built-in safety nets
- Custom: Kyverno (YAML) vs Gatekeeper (Rego), and CEL ValidatingAdmissionPolicy
- Audit before enforce; beware a down webhook blocking the cluster (failurePolicy)

---

### 94. Matrix builds

**Frequency:** Low

**Question:** You maintain an open-source library and users keep reporting "it crashes on Windows with an old runtime," but your CI only tests on a single Linux + latest-runtime combo, so you can't reproduce it. Later someone expands the matrix, CI minutes triple in a month and the bill explodes, and one failing combo cancels all the other results so you can't see them. Explain how matrix builds work and how to avoid these pitfalls.

**What it is & why:** A **matrix build** runs **the same job across a cross-product of dimensions** — testing/building many combinations automatically instead of writing a separate job for each, exactly solving this incident's "only tested one combo, missed Windows + old runtime." Common dimensions: **OS**, **language/runtime version**, **architecture**.

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    node: [18, 20, 22]
```

This expands to **2 × 3 = 6 parallel jobs** (each OS × each Node version), verifying your code works everywhere you support. It's how libraries prove cross-version/platform compatibility.

**Landing it in this case — the key controls:**
- **Add the missing dimensions:** put `windows-latest` and old runtime versions into the matrix, and this incident's "Windows + old runtime crash" combo gets covered by CI, so reproduction no longer depends on user reports.
- **`fail-fast: false` (cures results all being cancelled):** by default CI **cancels all remaining matrix jobs the moment one fails** (`fail-fast: true`). Setting it **false** lets **every combination run to completion**, so you see **all** failures at once (e.g., "fails on Node 18 *and* macOS") rather than fixing one, re-running, and discovering the next.
- **`include` / `exclude` (cures the bill explosion):** build a **sparse matrix** — `exclude` removes nonsensical combos (skip macOS × Node 18), and `include` adds one-off extra combinations (or parameters) outside the pure cross-product. Avoids wasting resources on irrelevant combinations and covers a special case without exploding the whole matrix.

**How to diagnose / optimize:**
1. Reproduce this incident's user bug: add `os: windows-latest` + the target old runtime version to the matrix so CI surfaces that failing combo.
2. See all failures at once: set `fail-fast: false` to get the full red/green across all combos, pinpointing whether it's Windows-only or all old versions.
3. Fix the bill: audit the total job count (= the **product** of all dimensions), use `exclude` to prune nonsensical combos (a runtime an OS doesn't support), and keep only the versions/platforms you **actually support**.
4. Use `include` to target special cases precisely (extra integration tests on just one combo) rather than adding values to an axis and bloating the matrix.
5. Keep watching the total job count — each job consumes a runner and CI minutes; adding a 2-value axis can turn 6 jobs into 18.

**Common follow-ups / tradeoffs:** Matrix = cross-product of dimensions; `fail-fast: false` to see all results rather than stopping at first failure; `include`/`exclude` for sparse matrices to cut waste / cover special cases. The core pitfall is **multiplicative cost**: matrix size is the product of all dimensions, so cost grows multiplicatively, not additively — a careless matrix blows up build time and bill (this incident's tripling). Tradeoff: broader matrix coverage catches compatibility bugs earlier but cost scales multiplicatively, so balance coverage against cost — test only what you actually support, `exclude` the rest.

**Key points:**
- Cross-product of dimensions; add the missing combos (Windows/old runtime) to reproduce bugs
- `fail-fast: false` to see all failures at once
- `include`/`exclude` for sparse matrices to cut waste / cover special cases
- Cost grows multiplicatively; watch the total job count to control the bill

---

### 95. Build reproducibility and provenance

**Frequency:** Low

**Question:** A security-conscious customer asks you to prove the released binary was really built from this public commit with no backdoor slipped in. You try rebuilding from the same commit on another machine and the hash doesn't match the release — investigation shows the build stamped the current timestamp into the artifact and used `FROM node:latest`, which pulled a newer version. Explain build reproducibility and provenance, and how to achieve them.

**What it is & why:** **Reproducibility** means **the same inputs produce byte-identical outputs** — rebuild from the same source and you get an artifact with the *exact same hash*, every time, on any machine. This is exactly the **verifiability** the customer wants (anyone can rebuild and confirm the release matches the source — no hidden tampering), and the basis for trustworthy caching/attestation. Non-reproducible builds embed hidden variability (timestamps, absolute paths, dependency drift) that makes two builds of the *same commit* differ, defeating verification — this incident's hash mismatch is exactly those variabilities.

**Landing it in this case — how to achieve reproducibility:**
- **Pin base images by digest (cures this incident's `node:latest` drift):** `FROM node@sha256:...` not `FROM node:latest`. A tag is mutable (can point to a new image tomorrow); a **digest** is immutable content, so the base never changes under you.
- **Pin dependencies with lockfiles:** `package-lock.json`, `poetry.lock`, `go.sum`, `Cargo.lock` — so every build resolves to the **exact same dependency versions and hashes**, not "whatever's newest."
- **Fix timestamps with `SOURCE_DATE_EPOCH` (cures this incident's stamped timestamp):** many tools stamp the *current* build time into outputs, making them differ each build. Setting this standard env var forces a **deterministic, fixed timestamp**, so file mtimes/metadata are reproducible.
- **No network during the build:** disallow fetching anything from the network at build time (beyond pinned, hash-verified inputs), so a moving remote resource can't change the output — everything the build needs is pinned and vendored.

**Provenance** — the complementary trust artifact: a signed record of **who built what, from where, and how**. Generate **SLSA provenance** as an **in-toto attestation** — a signed statement recording the **source (commit), builder (which CI system/workflow), build parameters, and the resulting artifact's digest**. Then **verify the provenance at deploy/admission time** so **only artifacts built by your trusted pipeline from trusted source can run** — an attacker can't sneak in an image built elsewhere, because it lacks valid provenance.

**How to diagnose / optimize:**
1. Locate this incident's nondeterminism: `diff` the two artifacts built on the two machines, or use `diffoscope` to compare layer by layer, to see exactly where they differ (usually timestamps, absolute paths, dependency versions).
2. Fix timestamps: before building, `export SOURCE_DATE_EPOCH=$(git log -1 --format=%ct)` so mtimes take the commit time, not the current time.
3. Fix dependency/base-image drift: change `FROM node:latest` to `FROM node@sha256:...`, commit and lock the lockfile, and build with `--frozen-lockfile`/`npm ci` etc. to forbid resolving new versions.
4. Build offline: restrict the network in BuildKit and vendor all inputs so remote changes can't alter the output.
5. Verify reproducibility: in CI, build on two different machines and compare artifact hashes (should be identical); then generate a SLSA provenance attestation for the customer, who rebuilds + verifies provenance to confirm no tampering.

**Common follow-ups / tradeoffs:** Reproducible = same inputs produce byte-identical outputs. Four measures: pin base images by digest, freeze deps with lockfiles, fix timestamps with `SOURCE_DATE_EPOCH`, and no network during the build. Provenance is a SLSA in-toto attestation recording source/builder/parameters/artifact-digest, verified at deploy/admission so only trusted-pipeline artifacts run. Reproducibility + provenance together give an auditable, tamper-evident chain from source to running artifact. Tradeoff: full reproducibility takes investment (offline builds, vendoring, eliminating all nondeterminism), and many projects only reach "near-reproducible"; provenance verification adds deployment-path steps but buys strong supply-chain guarantees.

**Key points:**
- Pin base images by digest + freeze deps with lockfiles (cures drift)
- `SOURCE_DATE_EPOCH` for deterministic timestamps (cures stamped time)
- No network during the build; use diffoscope to locate nondeterminism
- SLSA provenance attestation builds an auditable source-to-artifact trust chain

---

### 96. Ansible vs Salt vs Chef vs Puppet

**Frequency:** Low

**Question:** You inherit an old platform: thousands of long-lived servers kept compliant by continuous Puppet-agent convergence, but the team is migrating to an immutable model of containers + Packer-baked AMIs and is unsure whether the new flow still needs config management and which tool to pick. Meanwhile, another batch of ephemeral machines needs quick bulk dependency installs and one-off ops tasks. Compare Ansible, Salt, Chef, and Puppet, and clarify their role in the immutable-infrastructure era.

**What it is & why:** All four are **configuration-management** tools — they bring machines to and keep them in a desired state (packages, files, services, users) — but differ in **architecture, language, and push vs pull**. This incident's two needs (a legacy long-lived fleet vs ephemeral bulk tasks / image baking) land squarely on different tools' strengths.

**Landing it in this case — the four compared:**
- **Ansible — agentless, over SSH, YAML, push.** Nothing to install on targets: a control node connects via **SSH** and pushes/runs tasks. Playbooks are **YAML** (low read/write barrier), execution is **push** (you initiate runs from a control point). **Easiest to get started** — just Python + SSH — which made it the de facto dominant tool. This incident's "ephemeral machines bulk install + one-off ops tasks + Packer image baking" is its sweet spot.
- **Salt — agents or salt-ssh, YAML/Jinja, event-driven and fast.** Runs via **minion agents** (over a fast ZeroMQ message bus, very fast for large fleets) or agentless **salt-ssh**. State in **YAML + Jinja**. Its strength is the **event-driven** architecture (minions react to events via the reactor system) — good for reactive automation and scale.
- **Chef — Ruby DSL, agent-based, procedural-leaning.** Config as a **Ruby DSL** ("recipes/cookbooks"), powerful but requiring some Ruby. Targets run a **chef-client agent** that periodically pulls from the server and converges. Programmer-oriented, long enterprise lineage.
- **Puppet — declarative DSL, agent-based, pull model.** Its own **declarative DSL**; agents periodically **pull** the catalog from a Puppet master and converge. Battle-tested in **large, long-lived enterprise fleets** (thousands of long-lived servers needing continuous compliance and drift correction — exactly this incident's legacy platform).

**How immutable infrastructure narrowed their scope (this incident's migration crux):** with **containers and Packer-baked AMIs/images**, the pattern shifts from "spin up a bare box and repeatedly tune it with config management" to "**build an immutable image, deploy it as-is, and to change it rebuild the image and replace.**" This narrows config management's role from *runtime continuous convergence* to *image build time* — you might use Ansible inside a Packer build to bake an image, but you no longer run daily convergence against live servers. **Ansible in particular remains popular** for OS-level provisioning (installing deps, initialization, image baking, ephemeral ops tasks) because it's agentless and simple, while Chef/Puppet's heavy-agent, continuous-convergence model has declining demand in the immutable world.

**How to diagnose / optimize (this incident's migration decisions):**
1. Legacy Puppet fleet: as long as they're long-lived mutable servers, keep Puppet convergence for compliance — don't rush to tear it out.
2. New immutable flow: move config management from "runtime convergence" to "image build time" — use Ansible in a Packer `provisioner` to bake AMIs, producing immutable images.
3. Ephemeral machines / one-off tasks: use Ansible directly (agentless, SSH-ready) for bulk execution, without installing an agent on transient machines.
4. Decide if continuous convergence is still needed: with immutable deploys (config change = rebuild image, redeploy), runtime convergence becomes redundant and agents can be phased out.
5. Troubleshoot config drift: during migration, "live server vs image mismatch" is common — use Ansible `--check` (dry-run) or Puppet `--noop` to see what would change before acting.

**Common follow-ups / tradeoffs:** Ansible agentless/YAML/push/easiest; Salt fast/event-driven/agent-or-salt-ssh; Chef Ruby DSL/agent-based; Puppet declarative DSL/agent-based/enterprise long-lived fleets. Immutable infrastructure narrows config management from runtime continuous convergence to image build time — Ansible stays popular for OS provisioning/image baking/ephemeral tasks thanks to simplicity, while Chef/Puppet's heavy-agent convergence model declines. Tradeoff: agent models (Salt/Chef/Puppet) are strong for large-scale continuous compliance but require maintaining agent infrastructure; agentless (Ansible) is simple but its push model isn't as fast as a message bus at extreme scale.

**Key points:**
- Ansible: agentless, YAML, push; sweet spot is image baking / ephemeral tasks
- Salt: fast, event-driven; Chef/Puppet: agent-based, long enterprise history
- Immutable infrastructure narrows config management to image build time
- Keep the legacy convergence fleet, move new flow to Packer build time, phase out agents

---

### 97. Edge / global load balancing

**Frequency:** Low

**Question:** Your service is deployed only in us-east, and European and Asian users complain that pages are slow and often time out; worse, last time us-east had a full regional outage you failed over by editing DNS, but DNS TTL caching left users cut off for nearly half an hour. Management wants all global users to have low latency and a single-region outage to fail over automatically within seconds. Explain how the layered architecture of edge and global load balancing achieves this.

**What it is & why:** Serving users worldwide with low latency and regional resilience requires **several layers of load balancing stacked from the DNS edge down to the cluster**, each solving a piece — this incident's "Europe/Asia slow" is solved by edge + proximity routing, and "half-hour failover" by a global LB's anycast failover.

**Landing it in this case — the four layers:**
- **1. Anycast DNS (the entry point):** a request begins at DNS. **Latency/geo-aware DNS** (**Route53 latency-based routing**, **Cloudflare**) resolves a hostname to an IP **based on the user's location/latency**, steering toward the nearest region. Often served over **anycast** so the DNS resolution itself hits the closest DNS node. Coarse (DNS-level, TTL-cached) but directs users to the right region.
- **2. CDN / edge (TLS termination close to users, cures this incident's Europe/Asia slowness):** a **CDN/edge network** (**CloudFront, Cloudflare, Fastly**) has **points of presence worldwide** that **terminate TLS close to the user** — the expensive TLS handshake happens at a nearby edge (low RTT) rather than a distant origin, dramatically cutting connection latency. The edge also caches static content and routes dynamic requests back to origin over optimized backbone links.
- **3. Regional load balancers:** within each region, a **regional LB** (**ALB/NLB** on AWS, or GCP's regional LB) **fronts the cluster's ingress**, distributing traffic across ingress controllers / services / pods in that region with region-level health checks and connection distribution.
- **4. Global load balancers (anycast IPs + failover, cures this incident's half-hour switch):** a **global LB** (**AWS Global Accelerator**, **GCP Global Load Balancer**) provides **stable anycast IP addresses** that **steer traffic to the nearest healthy region** at the network layer — users connect to one anycast IP and are routed to the closest region over the provider's private backbone. Crucially it enables **automated regional failover**: if a whole region goes unhealthy, the global LB **shifts traffic to the next-nearest healthy region automatically**, without waiting for DNS TTLs to expire (exactly the weakness behind this incident's half-hour DNS-only failover).

**How to diagnose / optimize:**
1. Fix Europe/Asia slowness: measure first — from EU/Asia probes run `curl -w` to see TLS-handshake vs time-to-first-byte; if the handshake dominates, it's a remote handshake to us-east, so put a CDN in front to terminate TLS at a local PoP.
2. Deploy multi-region: expand the service to eu and ap regions, each fronted by a regional LB.
3. Fix slow failover: instead of switching regions by editing DNS, use a global LB's (Global Accelerator/GCP GLB) stable anycast IP + health checks, so a region outage fails over at the network layer within seconds.
4. Verify failover: proactively take a region offline (or fail its health check) and observe the global LB shifting traffic within seconds with no prolonged user outage.
5. Review DNS TTL: if any DNS-layer switching remains, shorten the TTL, but the real fix is pushing cross-region failover down to the global LB's network layer.

**Common follow-ups / tradeoffs:** Four layers — anycast/geo DNS steers to the nearest region (coarse, TTL-bound); CDN/edge terminates TLS nearby to cut latency + caches static; regional LB (ALB/NLB) distributes within a region; global LB (Global Accelerator/GCP GLB) gives a stable anycast IP + network-layer automatic regional failover (no DNS TTL wait). Together they deliver both low latency (nearest healthy location) and resilience (automatic regional failover). Tradeoff: DNS failover is simple but TTL-caching slows it (this incident's half hour); a global LB fails over fast but adds a paid infrastructure layer; multi-region deployment boosts resilience/latency but raises cost and data-consistency complexity.

**Key points:**
- DNS + CDN + regional LB + global LB layered, each solving a piece
- TLS terminated at the edge near users to cut latency (cures remote-handshake slowness)
- Global LB provides anycast IPs + network-layer automatic regional failover
- DNS failover is TTL-slowed; push cross-region failover down to the global LB

---

### 98. Tracing sampling strategies

**Frequency:** Low

**Question:** You send distributed traces with 1% probabilistic sampling. One day intermittent 500 errors appear in production; you open the tracing system to see the failing request's full call chain, but it was never sampled — a 1% error request only has a 1% chance of being kept. The team wants to switch to "keep every error and slow request, sample less of the normal traffic." Explain head-based, tail-based, and adaptive sampling.

**What it is & why:** In a high-traffic system, storing **every** trace is prohibitively expensive (volume + cost), so you **sample** — keep a subset. The strategies differ in *when* the keep/drop decision is made, which drives what you can keep — this incident's "error not sampled" is exactly a consequence of choosing the wrong decision timing.

**Landing it in this case — the three strategies:**
- **Head-based sampling (this incident's current state, misses errors):** decide **at the very start of the request**, before you know the outcome. Typically **probabilistic**: e.g., "keep 1% of traces" (a coin flip at entry, propagated so the whole trace is consistently kept or dropped). **Pro:** dead simple and cheap — no span buffering, decision is instant and local. **Con:** because you decide blindly up front, you **randomly drop rare but important traces** — an error or slow request has only a 1% chance of being kept, so you miss most of exactly the traces you'd want to investigate (this incident).
- **Tail-based sampling (cures this incident, keeps errors):** **collect all spans of a trace first, then decide after seeing the complete trace.** Now that you *know* the outcome, apply smart policy: **keep 100% of errored or slow traces**, and only **sample the boring successful ones** (say 1%). Far more useful — you retain what matters (errors, latency spikes) while discarding routine noise. **Cost:** the collector must **buffer all spans of every in-flight trace in memory** until the trace completes — significant memory/infrastructure overhead, and complexity coordinating spans arriving from many services.
- **Adaptive sampling:** **dynamically adjusts the sampling rate to hit a target volume/throughput.** Instead of a fixed 1%, it raises/lowers the rate as traffic changes so you land near a desired traces/sec (protecting cost and backend capacity during spikes, capturing more during quiet periods).

**How to diagnose / optimize:**
1. Confirm this incident's root cause: the 500 request is absent from tracing because head-based sampling coin-flipped it away at entry at 1% — not a system bug.
2. Switch to tail-based: in the collector (e.g., OpenTelemetry Collector's `tailsamplingprocessor`) configure policies — `status_code == ERROR` keep 100%, `latency > threshold` keep 100%, sample the rest at 1%.
3. Give the collector memory/capacity: tail sampling must buffer all in-flight spans — observe collector memory and buffers, scale up or tune the buffer window as needed.
4. If cost is still high: layer in adaptive sampling to pin the target traces/sec for the "boring successful" traffic, auto-lowering the rate during spikes to protect the backend.
5. Verify: intentionally trigger an error request and confirm it now appears 100% in tracing with a complete call chain.

**Common follow-ups / tradeoffs:** Head-based (probabilistic entry decision, cheap but may miss errors), tail-based (decide after the full trace, guarantees 100% error/slow retention but the collector must buffer all in-flight spans, heavy and coordination-complex), adaptive (dynamically adjusts rate to hit target throughput). Guiding principle: **always keep 100% of errors** (and typically the unusually slow ones) — those are the diagnostically valuable traces, which is exactly why tail-based is often preferred despite its cost: only deciding *after* seeing the trace guarantees keeping every error. Tradeoff: head is cheap but drops important traces; tail has high diagnostic value but high infrastructure cost/complexity; in practice head+tail/adaptive are often combined to balance cost and coverage.

**Key points:**
- Head: probabilistic entry decision, cheap, may miss errors (this incident's root cause)
- Tail: decide after the full trace, keep 100% error/slow, sample the rest (cures this incident)
- Tail-sampling collector must buffer all in-flight spans; mind memory overhead
- Adaptive hits a target volume; always keep 100% of errors

---

### 99. Chaos engineering

**Frequency:** Low

**Question:** Your architecture docs confidently claim "if any pod dies traffic shifts away within seconds, and a single-AZ outage is covered by multi-active redundancy" — but nobody has actually verified it. Last time an AZ really had trouble, failover didn't kick in and the timeout config was wrong, and you were woken at 3am scrambling. Management asks how to discover, *before* an incident, that this resilience doesn't actually work. Explain chaos engineering: what it is, how it's practiced, and the tooling.

**What it is & why:** **Chaos engineering** is the practice of **deliberately injecting failures into a (production-like or production) system to verify it's actually resilient** — turning this incident's "docs claim resilience but nobody verified it" assumptions into tested facts. You inject faults like **killing pods, adding network latency/packet loss, exhausting CPU/disk, or simulating an entire AZ/region outage**, then observe whether the system copes as designed.

**Landing it in this case:**
- **It's hypothesis-driven, not random flailing.** The discipline is *scientific*: state a **hypothesis about steady-state behavior**, inject a specific fault, and check reality against it. For this incident: "**if I kill one pod of this service, traffic should shift to a healthy pod within 5 seconds with no user-visible errors**" — then kill the pod and measure. If the hypothesis holds, you validated the resilience mechanism; if not (like this incident's broken failover), you found a real weakness *before* it caused an outage. Randomly breaking things without a hypothesis just creates outages.
- **Start small, then expand.** Begin with **small, controlled experiments during business hours** (kill a single pod, add modest latency) — crucially *during working hours* so the team is watching and can abort, with a limited blast radius. As confidence grows, escalate to **"game days"** — planned, larger-scale exercises simulating major failures like **full regional failover** (exactly what this incident should have rehearsed), run as a team to validate DR procedures, runbooks, and human response, not just software.

**How to diagnose / optimize:**
1. Write hypotheses reproducing this incident's worry: e.g., "kill one payments pod, traffic shifts within 5s with no error-rate rise"; "fail an AZ's instances and multi-active should seamlessly cover."
2. Validate at small scale: during business hours use Chaos Mesh to declare a PodChaos killing a single pod, and watch the SLO dashboard to see if error rate/latency really behave as hypothesized.
3. If failover doesn't work (this incident's problem): pinpoint whether health checks are too slow, timeouts too long, or retries unconfigured — fix each (shorten health-check interval, set sane timeouts and retries).
4. Escalate to a game day: inject a full AZ outage (e.g., AWS FIS's AZ-outage simulation), validating multi-active coverage and runbooks, surfacing human and process gaps.
5. Every experiment defines **abort conditions / blast radius** — stop injecting and roll back the moment an SLO breaks, so the drill doesn't become a real incident.

**Common follow-ups / tradeoffs:** Chaos engineering is hypothesis-driven, not random — state a steady-state hypothesis, inject a specific fault, verify reality matches. Start small (business hours, single pod, abortable, limited blast radius) and expand to game days (large-scale exercises validating DR/runbooks/people). Tools: Chaos Mesh and LitmusChaos (K8s-native, experiments as CRDs — kill pods, inject network/IO faults), Gremlin (commercial SaaS with a broad fault catalog + safety controls), and AWS FIS (AWS-native across EC2/ECS/EKS/RDS, including AZ-outage simulations). Value: confirm failover, retries, timeouts, autoscaling, and redundancy genuinely work before a real 3am incident. Tradeoff: doing chaos in production carries real risk, so limit blast radius, set abort conditions, and rehearse in a production-like environment first; the payoff is turning unverified resilience assumptions into facts.

**Key points:**
- Hypothesis-driven, not random; state a steady-state hypothesis then inject and verify
- Start small (business hours, single pod, abortable), expand to game days (AZ outage / DR drills)
- Tools: Chaos Mesh, Litmus, Gremlin, AWS FIS
- Limit blast radius + set abort conditions; verify failover/timeouts/retries work before an incident

---

### 100. Policy as code (OPA, Kyverno, Conftest)

**Frequency:** Low

**Question:** An audit turns up a pile of problems: someone created a publicly-readable S3 bucket in Terraform storing sensitive data, several resources lack `team`/`cost-center` labels so cost allocation is unclear, and some pods have no resource limits. These were all supposed to be in a wiki standard, but nobody remembered to check every time. The team wants these rules turned into code and auto-enforced — ideally blocking developers right at the PR. Explain policy as code, the tooling landscape, and the shift-left principle.

**What it is & why:** **Policy as code** means **codifying organizational rules as version-controlled, automatically-enforced code** instead of relying on wikis, checklists, and manual review (exactly where this incident failed). Typical policies: "only signed images may run," "every resource must have `team`/`cost-center` labels," "no privileged pods," "no public S3 buckets," "resource limits required" — each of this incident's audit findings maps to one. They're **enforced at two points**: **admission control** (reject non-compliant resources when they hit the Kubernetes API server) and/or **CI** (fail the pipeline before anything deploys). Enforcement is automatic and consistent — no human has to remember to check.

**Landing it in this case — the tooling contrast:**
- **OPA / Gatekeeper** — uses **Rego**, OPA's dedicated policy language. Very **powerful and expressive** (arbitrary logic over structured data), but Rego has a **learning curve**. Gatekeeper integrates OPA as a Kubernetes admission controller.
- **Kyverno** — policies as **Kubernetes-native YAML** rules. **No new language to learn** (if you know K8s YAML, you can write policies), and it can validate, mutate, and generate resources. More approachable for K8s-centric teams (e.g., enforcing this incident's "resource limits required," "must have labels"); less general than Rego.
- **Conftest (cures this incident's public S3 in Terraform)** — runs **OPA/Rego against *any structured file* in CI** — not just live cluster resources. Point it at **Terraform plans, Dockerfiles, Kubernetes manifests, JSON/YAML configs** and it evaluates your policies **in the pipeline**, enforcing policy on **IaC and manifests before they're ever applied** — this incident's public S3 bucket gets blocked before `terraform apply`.

**How to diagnose / optimize:**
1. Turn each audit finding into a policy: Conftest/Rego rules "S3 bucket ACL must not be public," "resources must have `team`/`cost-center` tags"; a Kyverno rule "pods must have resources.limits."
2. Wire into CI: the PR pipeline runs `conftest test terraform-plan.json`, so a public S3 or missing tag fails the check and blocks the merge.
3. Wire into admission: install Kyverno/Gatekeeper on the cluster so pods without resource limits are rejected at admission.
4. **Roll out with audit mode first:** before flipping a policy to **enforce** (which *blocks* violations), run it in **audit/warn mode** — it **reports** without blocking. This reveals how much existing infrastructure would fail (this incident has plenty of legacy violations), lets you fix it, and avoids breaking everyone's deploys the day you enable it. Audit → fix → enforce is the safe path.
5. Verify: raise a PR with a public S3 and confirm CI goes red; submit a pod with no limits and confirm admission rejects it.

**Shift-left principle:** catch violations **as early as possible — fail in the PR/CI, not at deploy time (or worse, in production).** Blocking a non-compliant Terraform change in the pull request (via Conftest) gives the developer instant feedback in the context they're working, instead of the change getting rejected later at `apply`/admission (slow feedback) or slipping into prod — exactly this incident's "block right at the PR" ask. It's cheaper and faster to fix at author time.

**Common follow-ups / tradeoffs:** Policy as code codifies org rules as version-controlled, auto-enforced code, enforced at admission and/or CI. Tools: Kyverno (K8s-native YAML, approachable, validate/mutate/generate) vs OPA/Gatekeeper (Rego, powerful/expressive but a learning curve, integrated as an admission controller); Conftest runs OPA/Rego against any structured file (Terraform/Dockerfile/manifest) in CI, intercepting before apply. Shift-left: fail early in PR/CI rather than deploy/prod, cheaper/faster at author time. Roll out with audit/warn mode first to find legacy violations, fix, then enforce, avoiding breaking everyone's deploys on day one. Tradeoff: Rego is general and powerful but hard to learn, Kyverno is approachable but K8s-limited; stricter policies are safer but can slow development and false-positive on legitimate changes, so audit-calibrate first.

**Key points:**
- Policy as code: rules codified, auto-enforced (cures reliance on human memory)
- Kyverno (YAML) vs OPA/Gatekeeper (Rego); Conftest scans IaC/manifests in CI
- Shift-left: block public S3 / missing labels / no limits right at the PR
- Audit mode before enforce to find legacy violations; audit → fix → enforce
