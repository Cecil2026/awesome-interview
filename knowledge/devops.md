# DevOps Interview Questions

100 high-frequency questions on Docker, Kubernetes, CI/CD, infrastructure-as-code, observability, networking, security, and cloud.

---

### 1. Processes vs threads; explain fork/exec

**Frequency:** High

**Question:** Explain the difference between processes and threads, and walk me through how process creation works on Linux: (1) how a process differs from a thread in terms of address space, PID, file descriptors, and memory sharing; (2) what fork() does, including copy-on-write semantics and duplicated file descriptors; (3) what exec() does to the process image and PID; and (4) how the classic shell fork/exec/wait pattern works and how zombie processes arise.

**Answer:** A process is an isolated address space with its own PID, file descriptors, and memory. Threads share memory within a process and are cheaper to create. `fork()` clones the calling process (copy-on-write of memory, duplicated FDs) producing a child with a new PID. `exec()` replaces the current process image with a new program while keeping the PID. The classic shell pattern is `fork` then `exec` in the child, while the parent `wait`s. Zombies appear when a parent fails to reap a finished child.

**Key points:**
- Threads share heap; processes do not
- `fork` is COW, cheap until writes
- `exec` keeps PID but swaps the binary
- Reap children with `wait`/`waitpid` to avoid zombies

---

### 2. cgroups and namespaces

**Frequency:** High

**Question:** Explain cgroups and namespaces and how they relate to containers: (1) what namespaces isolate and the different namespace types; (2) what cgroups limit and account for; (3) how a container is essentially just a process with these applied; and (4) what changed with cgroup v2's unified hierarchy and how Kubernetes and Docker use cgroup subtrees to enforce requests and limits.

**Answer:** Namespaces isolate what a process sees (PID, NET, MNT, UTS, IPC, USER, CGROUP, TIME); cgroups limit and account for what it can use (CPU, memory, IO, pids). Containers are just processes inside namespaces with cgroup limits applied. cgroup v2 unifies the hierarchy into a single tree under `/sys/fs/cgroup`. Kubernetes and Docker write into cgroup subtrees per pod/container to enforce requests and limits.

**Key points:**
- Namespaces = isolation; cgroups = quotas
- 8 namespace types; PID/NET most visible
- cgroup v2 unified hierarchy preferred
- Inspect: `systemd-cgls`, `cat /proc/self/cgroup`

---

### 3. TCP three-way handshake and TIME_WAIT

**Frequency:** High

**Question:** Explain the TCP connection lifecycle: (1) the three-way handshake for connection setup; (2) how connection teardown works with FIN/ACK; (3) what TIME_WAIT is, why the closing initiator enters it, and what problem it protects against; and (4) what a large number of TIME_WAIT sockets on a busy client indicates and how you would address it without simply disabling the state.

**Answer:** Connection setup: client SYN, server SYN-ACK, client ACK. Teardown is FIN/ACK from each side. The initiator of the close enters `TIME_WAIT` (2*MSL, typically 60s) so late duplicate segments do not interfere with a new connection on the same 4-tuple. Many `TIME_WAIT` sockets on a busy client signal short-lived outbound connections; fix with connection pooling, `SO_REUSEADDR`, or `net.ipv4.tcp_tw_reuse=1` rather than disabling the state.

**Key points:**
- SYN -> SYN/ACK -> ACK
- TIME_WAIT protects against stale segments
- Pool connections instead of tuning kernel
- Inspect: `ss -tan state time-wait | wc -l`

---

### 4. DNS records and TTLs

**Frequency:** High

**Question:** Walk me through common DNS record types and TTLs: (1) what A, AAAA, CNAME, SRV, TXT, and MX records are used for; (2) why a CNAME cannot coexist with other records at the zone apex; (3) how TTL controls resolver caching and the tradeoff of lower TTLs; and (4) how you would plan a DNS migration or cutover.

**Answer:** A maps to IPv4, AAAA to IPv6, CNAME aliases one name to another (cannot coexist with other records at apex), SRV advertises service+port+priority+weight, TXT carries arbitrary text (SPF, ACME challenges). MX routes mail. TTL controls how long resolvers cache; lower TTLs ease cutovers but raise query volume. Plan migrations by dropping TTL hours ahead, then flipping the record.

**Key points:**
- CNAME forbidden at zone apex (use ALIAS/ANAME)
- SRV used by Kubernetes headless services
- Lower TTL before cutovers
- Debug with `dig +trace name`

---

### 5. Image vs container vs layer

**Frequency:** High

**Question:** Explain the difference between an image, a container, and a layer: (1) what a Docker image is as an immutable, content-addressed bundle of layers plus metadata; (2) what a layer is and how layers are deduplicated across images by digest; (3) how a running container adds a thin writable layer on top of the read-only image layers; and (4) why layer ordering and base-image reuse matter for pull efficiency.

**Answer:** An image is an immutable, content-addressed bundle of filesystem layers plus metadata (entrypoint, env). A layer is a tarball diff produced by one build step, deduplicated across images by digest. A container is a running (or stopped) instance with a thin writable layer on top of the image's read-only layers. Pulling reuses layers already on disk, which is why ordering and base-image reuse matter.

**Key points:**
- Image = layers + config manifest
- Layers are content-addressed (sha256)
- Container adds a writable upper layer
- Reuse base images to maximize cache hits

---

### 6. RUN vs CMD vs ENTRYPOINT

**Frequency:** High

**Question:** Compare RUN, CMD, and ENTRYPOINT in a Dockerfile: (1) what RUN does at build time; (2) what ENTRYPOINT defines; (3) what CMD provides and how it relates to ENTRYPOINT; and (4) why you should prefer the exec form over the shell form and how you override CMD at runtime.

**Answer:** `RUN` executes at build time, producing a new layer. `ENTRYPOINT` defines the executable that always runs when the container starts. `CMD` provides default args (or a default command if no ENTRYPOINT). Prefer exec form (`ENTRYPOINT ["app"]`) over shell form to avoid spawning a shell as PID 1. Override `CMD` at runtime by appending args to `docker run image arg1`.

**Key points:**
- RUN = build-time layer
- ENTRYPOINT = fixed binary
- CMD = default args / fallback
- Use exec form (JSON array) for proper signal handling

---

### 7. Layer caching ordering

**Frequency:** High

**Question:** Explain Dockerfile layer caching and how to order instructions for fast builds: (1) how each instruction is cached by its inputs and how a change busts every subsequent layer; (2) why rarely-changing steps like the base image and system packages should come first; (3) why you copy dependency manifests and run installs before copying source code; and (4) additional techniques like pinning base image digests and BuildKit cache mounts.

**Answer:** Each Dockerfile instruction is cached by its inputs; changing one busts every subsequent layer. Put rarely-changing steps first: base image, system packages, then dependency manifests (`package.json`, `go.mod`), then `RUN install`, then finally `COPY . .` of source code. This way a source-only edit reuses the dependency layer, slashing builds from minutes to seconds.

**Key points:**
- Cache invalidates from first change onward
- Copy manifests before sources
- Pin base image digests for reproducibility
- BuildKit `--mount=type=cache` for package caches

---

### 8. Multi-stage builds

**Frequency:** High

**Question:** Explain multi-stage Docker builds: (1) how using multiple FROM stages lets you build in a heavy toolchain image and copy only artifacts into a small runtime image; (2) how --from=stage copies artifacts between stages; (3) why the final image should exclude compilers and sources; and (4) how combining this with distroless minimizes the attack surface and CVE exposure.

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

### 9. Resource limits and OOM

**Frequency:** High

**Question:** Explain resource limits and OOM behavior for containers: (1) why running without limits is dangerous; (2) how memory and CPU limits are enforced via cgroups; (3) what happens when a container exceeds its memory limit versus its CPU limit; and (4) how requests and limits differ in Kubernetes and what happens to pods exceeding limits.

**Answer:** Without limits, a container can starve the host. `docker run --memory=512m --cpus=1` enforces cgroup limits. When the container exceeds memory, the kernel OOM-killer terminates the process and Docker reports `OOMKilled`. CPU limits throttle rather than kill. In Kubernetes, set `resources.limits.memory` and `requests` to inform scheduling; pods exceeding limits are killed and restarted.

**Key points:**
- Memory over-limit -> OOMKill
- CPU over-limit -> throttle
- `requests` schedules, `limits` enforces
- Watch `dmesg | grep -i oom` for kernel events

---

### 10. Pod vs Deployment vs ReplicaSet vs StatefulSet vs DaemonSet vs Job vs CronJob

**Frequency:** High

**Question:** Compare the main Kubernetes workload resources: (1) what a Pod is; (2) what a ReplicaSet maintains; (3) how a Deployment manages ReplicaSets with rolling updates for stateless apps; (4) what a StatefulSet adds for stateful workloads; (5) what a DaemonSet runs per node; and (6) how Job and CronJob handle batch work.

**Answer:** Pod is the smallest unit, one or more co-located containers sharing net/IPC. ReplicaSet maintains N pod replicas. Deployment manages ReplicaSets with rolling updates - the default for stateless apps. StatefulSet gives stable identities and ordered rollouts for stateful workloads (DBs). DaemonSet runs one pod per node (log shippers, CNI). Job runs to completion; CronJob schedules Jobs on cron.

**Key points:**
- Deployment for stateless
- StatefulSet for ordered/identity-bound
- DaemonSet for per-node agents
- Job/CronJob for batch

---

### 11. Service types

**Frequency:** High

**Question:** Explain the Kubernetes Service types: (1) what ClusterIP is and its scope; (2) what NodePort exposes and its port range; (3) how LoadBalancer provisions a cloud LB; (4) what ExternalName returns; and (5) what a headless Service does and why StatefulSets and service discovery use it.

**Answer:** ClusterIP (default) is a virtual IP reachable inside the cluster. NodePort exposes the service on every node at a static port (30000-32767). LoadBalancer provisions a cloud LB pointing at NodePorts. ExternalName returns a CNAME to an external host. Headless (`clusterIP: None`) skips the VIP and returns pod IPs via DNS A/SRV records - used by StatefulSets and service discovery.

**Key points:**
- ClusterIP: in-cluster VIP
- NodePort: same port on every node
- LoadBalancer: cloud LB in front
- Headless: DNS-based, no proxy

---

### 12. ConfigMaps vs Secrets

**Frequency:** High

**Question:** Compare ConfigMaps and Secrets in Kubernetes: (1) how both are key/value stores mounted as env vars or files; (2) how they differ in intended content and the fact that Secrets are only base64-encoded at rest in etcd unless you enable KMS encryption; (3) why file mounts propagate rotations without a pod restart while env vars do not; and (4) how you would integrate real secret management via External Secrets Operator.

**Answer:** Both are key/value stores mounted as env vars or files. ConfigMaps hold non-sensitive config; Secrets hold credentials, base64-encoded at rest in etcd (encrypt etcd with KMS for actual security). Prefer file mounts so rotations propagate without pod restart (with a sidecar reloader or app file-watcher). For real secret management, integrate External Secrets Operator with Vault/AWS Secrets Manager.

**Key points:**
- Secrets base64, not encrypted by default
- Enable etcd encryption-at-rest with KMS
- File mounts auto-update; env vars do not
- Use External Secrets Operator for source-of-truth

---

### 13. Volumes, PVs, PVCs, StorageClasses

**Frequency:** High

**Question:** Explain Kubernetes persistent storage: (1) what a PersistentVolume represents; (2) what a PersistentVolumeClaim is and its namespace scope; (3) how a StorageClass enables dynamic provisioning via a CSI driver; (4) the available access modes RWO, ROX, RWX, and RWOP; and (5) the Retain versus Delete reclaim policies.

**Answer:** A PersistentVolume is a cluster resource representing real storage (EBS, GCE PD, NFS). A PersistentVolumeClaim is a namespaced request for storage. A StorageClass parameterizes dynamic provisioning - a PVC referencing a SC triggers the CSI driver to create a PV. Access modes: RWO (one node), ROX (read-only many), RWX (read-write many), RWOP (one pod). Reclaim policies: Retain/Delete.

**Key points:**
- PV: cluster resource; PVC: namespace claim
- StorageClass enables dynamic provisioning
- Access modes: RWO/ROX/RWX/RWOP
- CSI drivers do the actual provisioning

---

### 14. Probes: liveness, readiness, startup

**Frequency:** High

**Question:** Explain the three Kubernetes probe types: (1) what a readiness probe controls and how a failing pod is treated; (2) what a liveness probe does when a container is stuck; (3) how a startup probe protects slow-booting apps; and (4) the probe mechanisms available and how misconfiguration can cause cascading restarts.

**Answer:** Readiness gates traffic - failing pods are removed from Service endpoints but not killed. Liveness restarts a stuck container. Startup delays liveness/readiness until slow-booting apps are ready, preventing premature kills. Use HTTP probes for web services, exec for CLIs, TCP for raw sockets. Wrong probes cause cascading restarts; set conservative `failureThreshold` and `periodSeconds`.

**Key points:**
- Readiness controls Service membership
- Liveness restarts on hang
- Startup protects slow boots
- Misconfig -> restart storms

---

### 15. Requests vs limits; QoS classes

**Frequency:** High

**Question:** Explain requests, limits, and QoS classes in Kubernetes: (1) how requests are used for scheduling and limits for enforcement; (2) the three QoS classes Guaranteed, Burstable, and BestEffort and how each is determined; (3) the eviction order under node pressure; and (4) why you might set requests equal to limits for latency-sensitive services.

**Answer:** `requests` reserve resources for scheduling; `limits` cap actual usage. Pods get a QoS class: Guaranteed (requests == limits for all containers), Burstable (some requests set), BestEffort (none set). Under node pressure, BestEffort is evicted first, then Burstable exceeding requests, then Guaranteed last. Set requests = limits for latency-sensitive services to avoid throttling surprises.

**Key points:**
- requests = scheduling; limits = enforcement
- QoS: Guaranteed > Burstable > BestEffort
- BestEffort evicted first
- CPU limits cause throttling, not OOM

---

### 16. Affinity, anti-affinity, taints, tolerations, nodeSelectors

**Frequency:** High

**Question:** Explain Kubernetes scheduling controls: (1) what nodeSelector does as a simple label match; (2) how node affinity adds required versus preferred rules; (3) how pod affinity and anti-affinity co-locate or spread pods relative to other pods; and (4) how taints repel pods and tolerations permit scheduling onto tainted nodes, such as for dedicated GPU or spot pools.

**Answer:** `nodeSelector` is a simple label match. Node affinity is the expressive version with required/preferred rules. Pod affinity/anti-affinity co-locate or spread pods relative to other pods (e.g., spread replicas across nodes). Taints repel pods unless they tolerate them; used for dedicated node pools (GPU, spot). Tolerations on a pod let it be scheduled onto tainted nodes.

**Key points:**
- nodeSelector: simple label match
- Affinity: required vs preferred
- Taints repel; tolerations permit
- Anti-affinity = HA across nodes/zones

---

### 17. Helm vs Kustomize

**Frequency:** High

**Question:** Compare Helm and Kustomize: (1) what Helm provides as a templating and package manager with charts, values.yaml, releases, hooks, and rollback; (2) what Kustomize offers as a template-free, overlay-based approach with a base plus environment overlays that patch fields; (3) which tool wins for which use case; and (4) how teams combine both.

**Answer:** Helm is a templating + package manager: charts with `values.yaml`, releases, hooks, rollback. Kustomize is template-free overlay-based - a `base/` plus environment `overlays/` that patch fields. Helm wins for packaging third-party apps; Kustomize for first-party with light env diffs. Many teams use both: Helm for vendor charts, Kustomize on top for overrides via `helmCharts` in kustomization.yaml.

**Key points:**
- Helm: templates + package mgmt
- Kustomize: overlays + patches, no templates
- Hybrid: Kustomize over Helm output
- ArgoCD supports both natively

---

### 18. Blue/green and canary (Argo Rollouts, Flagger)

**Frequency:** High

**Question:** Explain blue/green and canary deployment strategies: (1) how blue/green keeps old and new versions running and switches the Service selector for instant cutover and easy rollback; (2) how a canary shifts a small percentage of traffic, watches metrics, and ramps; and (3) how tools like Argo Rollouts and Flagger automate canaries with analysis steps that query Prometheus for error rate or latency and auto-roll-back on regression.

**Answer:** Blue/green keeps old (blue) and new (green) running, then switches Service selector for instant cutover and easy rollback. Canary shifts a small percentage of traffic to the new version, watches metrics, then ramps. Argo Rollouts and Flagger automate canaries with analysis steps - querying Prometheus for error rate / latency and auto-rolling-back on regression.

**Key points:**
- Blue/green: instant flip via selector
- Canary: gradual percentage ramp
- Analysis from Prometheus/Datadog gates promotion
- Argo Rollouts CRD or Flagger controller

---

### 19. RBAC: Role vs ClusterRole

**Frequency:** High

**Question:** Describe how RBAC works in Kubernetes. Contrast (1) Role versus ClusterRole in terms of namespaced versus cluster-wide scope, (2) how RoleBinding and ClusterRoleBinding link subjects such as users, groups, and ServiceAccounts to roles, and (3) how you apply least privilege to application ServiceAccounts and audit effective permissions with kubectl auth can-i.

**Answer:** Role grants permissions in one namespace; ClusterRole is cluster-wide or namespace-templated. RoleBinding/ClusterRoleBinding link a subject (user, group, ServiceAccount) to a role. Principle of least privilege: avoid `cluster-admin` for apps, scope SAs to needed verbs/resources. Audit with `kubectl auth can-i --list --as=system:serviceaccount:ns:sa`.

**Key points:**
- Role: namespaced
- ClusterRole: cluster or template
- Bind to user/group/SA
- Audit with `kubectl auth can-i`

---

### 20. Pod Pending diagnostic checklist

**Frequency:** High

**Question:** A pod is stuck in Pending. Walk through your diagnostic checklist. Start with kubectl describe pod events, then cover the common causes: (1) insufficient CPU or memory so no node fits the requests, (2) unsatisfiable nodeSelector, affinity, or taints, (3) an unbound PVC due to a missing StorageClass or quota, (4) image pull or missing ServiceAccount issues, and (5) ResourceQuota limits, plus checking cluster autoscaler events for scale-up failures.

**Answer:** Run `kubectl describe pod`. Causes: insufficient CPU/memory (no node fits requests), unsatisfiable nodeSelector/affinity/taints, PVC unbound (no matching SC or quota), image pull pending, missing ServiceAccount, ResourceQuota hit. Check cluster autoscaler events for scale-up failures. For PVCs, describe the PVC to find provisioner errors.

**Key points:**
- `kubectl describe pod` events first
- Check requests vs node capacity
- Verify PVC bound and SC exists
- Inspect autoscaler logs for scale-up failures

---

### 21. CrashLoopBackOff checklist

**Frequency:** High

**Question:** A pod is in CrashLoopBackOff. Explain what that state means and how you investigate it. Cover (1) using kubectl logs --previous to see the prior boot, (2) finding the exit code in kubectl describe, (3) checking command/args, missing env or secrets, and failing init-container migrations, (4) OOMKilled and config errors, and (5) ruling out an overly aggressive liveness probe masquerading as a crash.

**Answer:** Pod starts, exits, restarts with exponential backoff. Investigate: `kubectl logs --previous` for the prior exit, `kubectl describe pod` for exit code, check command/args, missing env or secret, failing migration in init container, OOMKilled, app config error. Probe failures can masquerade as crashes - confirm liveness is not too aggressive.

**Key points:**
- `kubectl logs --previous` for prior boot
- Exit code in describe output
- Check init containers separately
- Rule out liveness probe killing it

---

### 22. OOMKilled

**Frequency:** High

**Question:** Explain what OOMKilled means and how you handle it. Cover (1) that the container exceeded its memory limit and the kernel OOM-killer fired, shown as Reason OOMKilled with Exit Code 137, (2) fixes such as raising limits.memory versus profiling real usage and finding leaks, (3) why JVM and Node need explicit heap flags sized below the cgroup limit, and (4) which memory metric to monitor.

**Answer:** Container memory exceeded its limit; kernel OOM-killer fired. `kubectl describe pod` shows `Reason: OOMKilled` and `Exit Code: 137`. Fixes: raise `limits.memory`, profile real usage (`kubectl top pod`, pprof, Java heap dumps), find leaks. JVM/Node need explicit heap flags inside containers (`-Xmx`, `--max-old-space-size`) sized below the cgroup limit.

**Key points:**
- Exit 137 = SIGKILL by OOM
- Raise limit OR fix leak
- Set JVM/Node heap below cgroup limit
- Monitor `container_memory_working_set_bytes`

---

### 23. CI vs CD vs continuous deployment

**Frequency:** High

**Question:** Distinguish Continuous Integration, Continuous Delivery, and Continuous Deployment. Explain (1) CI as building, testing, and merging every commit to mainline, (2) Continuous Delivery as every green build being deployable to prod behind a manual approval, and (3) Continuous Deployment as automatically deploying every green build with no manual gate. Describe the maturity ladder and what prerequisites (strong tests, observability, quick rollback) let you adopt Continuous Deployment.

**Answer:** Continuous Integration: every commit builds, tests, and merges to mainline. Continuous Delivery: every green build is deployable to prod with a manual approval click. Continuous Deployment: every green build is automatically deployed to prod - no manual gate. The maturity ladder is CI -> CDelivery -> CDeployment. Pick CDeployment when you have strong tests, observability, and quick rollback.

**Key points:**
- CI = integrate often
- CDelivery = always shippable
- CDeployment = auto-ship
- Requires observability + safe rollback

---

### 24. GitOps (Argo CD, Flux)

**Frequency:** High

**Question:** Explain GitOps with tools like Argo CD or Flux. Cover (1) how the desired cluster state lives in Git and a controller continuously reconciles the cluster to match, (2) why the pull-based model (the cluster reaching out to Git) avoids inbound CI credentials, (3) benefits such as an audit trail in commits, rollback via git revert, drift detection, and multi-cluster fanout, and (4) pairing it with an image updater that bumps tags in Git.

**Answer:** Desired cluster state lives in Git; a controller (Argo CD, Flux) continuously reconciles the cluster to match. Pull-based: cluster reaches out to Git, no inbound CI credentials. Benefits: audit trail in commits, rollback via revert, drift detection, multi-cluster fanout. Pair with image updater that bumps tags in Git when new images are published.

**Key points:**
- Git is source of truth
- Pull-based reconciliation
- Rollback = `git revert`
- Drift detection + auto-sync

---

### 25. Terraform vs Pulumi vs CloudFormation vs CDK

**Frequency:** High

**Question:** Compare Terraform, Pulumi, CloudFormation, and CDK for infrastructure as code. Cover (1) Terraform's declarative HCL, multi-cloud reach, provider ecosystem, and external state, (2) Pulumi's use of real programming languages over the same provider model, (3) CloudFormation as AWS-native YAML/JSON that is slow to add features, and (4) CDK as imperative code synthesized to CloudFormation (with CDKTF targeting Terraform). Say when you would pick each.

**Answer:** Terraform: declarative HCL, multi-cloud, huge provider ecosystem, external state. Pulumi: real programming languages (TS/Python/Go) with same provider model. CloudFormation: AWS-native YAML/JSON, slow to add features. CDK: imperative code synthesized to CloudFormation - good DX, AWS-centric. CDKTF synthesizes to Terraform. Pick Terraform for multi-cloud, CDK if AWS-only with strong dev team.

**Key points:**
- Terraform: declarative, multi-cloud
- Pulumi: real languages, same providers
- CloudFormation: AWS-native, slow
- CDK: code -> CFN (AWS-focused)

---

### 26. Terraform state, locking, drift

**Frequency:** High

**Question:** Explain Terraform state, locking, and drift. Cover (1) what state maps and why you store it remotely (S3 plus a DynamoDB lock table, Terraform Cloud, or GCS) and never commit terraform.tfstate since it contains secrets, (2) how locking prevents concurrent applies, (3) what drift is and how you detect it with terraform plan or scheduled drift detection, and (4) using terraform import to adopt existing resources.

**Answer:** State maps resources to real IDs. Store remotely (S3 + DynamoDB lock table, Terraform Cloud, GCS) so the team shares it; never commit `terraform.tfstate`. Locking prevents concurrent applies. Drift is when real infra differs from state - detect with `terraform plan` (no changes = no drift) or scheduled drift detection. Refresh imports unknown changes.

**Key points:**
- Remote state with locking
- Never commit state (contains secrets)
- Drift = plan diff against reality
- `terraform import` for adopting existing resources

---

### 27. VPC: subnets, route tables, NAT GWs

**Frequency:** High

**Question:** Explain the core building blocks of an AWS VPC. Cover (1) the VPC as a private network with a CIDR and subnets carved per AZ, (2) the difference between public subnets routing to an Internet Gateway and private subnets routing outbound only via a NAT Gateway, (3) placing workloads in private subnets and load balancers in public, and (4) that NAT Gateways are AZ-scoped, incur per-AZ data-transfer cost, and need one per AZ for HA.

**Answer:** A VPC is a private network with CIDR (e.g., 10.0.0.0/16). Subnets carve it per AZ (10.0.1.0/24...). Public subnets have a route to the Internet Gateway; private subnets route via NAT Gateway for outbound only. Place workloads in private subnets, LBs in public. NAT GWs are AZ-scoped and incur per-AZ data-transfer cost - one per AZ for HA.

**Key points:**
- Subnet per AZ for HA
- Public = IGW route; private = NAT route
- One NAT GW per AZ
- Workloads in private subnets

---

### 28. Logs vs metrics vs traces

**Frequency:** High

**Question:** Contrast logs, metrics, and traces as observability signals. Cover (1) logs as discrete, free-form events with context that are expensive to query at scale, (2) metrics as cheap, aggregable numeric time series where low cardinality is preferred, and (3) traces as per-request span trees showing causality across services. Explain when to use each (metrics for SLOs and alerts, traces to localize a slow request, logs for full detail) and how OpenTelemetry unifies producing all three.

**Answer:** Logs: discrete events with context, free-form, expensive to query at scale. Metrics: numeric time series, cheap, aggregable, low cardinality preferred. Traces: per-request span trees showing causality across services. Use metrics for SLOs/alerts, traces to localize a slow request, logs for full detail on a known incident. OpenTelemetry unifies producing all three.

**Key points:**
- Metrics: cheap, aggregated
- Traces: causality, per-request
- Logs: full detail, expensive
- OpenTelemetry: unified producer

---

### 29. Prometheus pull model, exporters, recording rules

**Frequency:** High

**Question:** Explain the Prometheus model. Cover (1) the pull model where Prometheus scrapes /metrics endpoints, (2) how apps expose metrics via client libraries while everything else is wrapped by exporters like node_exporter and blackbox_exporter, with service discovery finding targets, (3) recording rules pre-computing expensive queries and alerting rules firing when expressions become true, and (4) long-term storage via federation or remote_write to Thanos, Mimir, or VictoriaMetrics.

**Answer:** Prometheus scrapes `/metrics` endpoints (pull). Apps expose metrics via client libs; everything else is wrapped by exporters (node_exporter, blackbox_exporter, mysqld_exporter). Service discovery (k8s, EC2) finds targets. Recording rules pre-compute expensive queries on a schedule; alerting rules fire when expressions become true. Federation or remote_write to long-term stores (Thanos, Mimir, VictoriaMetrics).

**Key points:**
- Pull from `/metrics` endpoints
- Exporters wrap non-instrumented systems
- Recording rules pre-compute aggregations
- Long-term: Thanos / Mimir / VictoriaMetrics

---

### 30. SLI / SLO / error budgets

**Frequency:** High

**Question:** Explain SLIs, SLOs, and error budgets. Cover (1) an SLI as a measurable indicator like availability or p99 latency, (2) an SLO as a target for that SLI over a window such as 99.9% in 30 days, and (3) the error budget as 1 minus the SLO representing allowed unreliability. Explain how you spend the budget on shipping features and halt risky launches when it is burned, and how multi-window multi-burn-rate alerts fire on fast budget burn.

**Answer:** SLI: a measurable indicator (availability, latency p99). SLO: target for that SLI over a window (99.9% in 30 days). Error budget: 100% - SLO = allowed unreliability (e.g., 43m/month at 99.9%). Spend the budget on shipping features; halt risky launches when burned. Multi-window multi-burn-rate alerts fire on fast budget burn.

**Key points:**
- SLI measured, SLO targeted
- Error budget = 1 - SLO
- Burn-rate alerts on fast spend
- Halt risky changes when exhausted

---

### 31. Incident response: severity, runbooks, postmortems

**Frequency:** High

**Question:** Explain incident response practice. Cover (1) a severity ladder (Sev1 customer-impacting outage, Sev2 degraded, Sev3 minor) triggering the response level, (2) linking each alert to a runbook with diagnostic and mitigation steps, (3) the roles assigned during an incident such as incident commander, comms, and scribe, and (4) the blameless postmortem afterward documenting timeline, contributing factors, and tracked action items with owners and deadlines, noting that tracking completion is where most teams fail.

**Answer:** Sev1 = customer-impacting outage, all-hands; Sev2 = degraded service; Sev3 = minor. Each alert links to a runbook with diagnostic and mitigation steps. During incident: assign IC, comms, scribe. After: blameless postmortem within a week documenting timeline, contributing factors (not "root cause"), and action items with owners and deadlines. Track action item completion - this is where most teams fail.

**Key points:**
- Severity ladder triggers response level
- Alerts -> runbooks always
- Roles: IC, comms, scribe
- Blameless postmortem + tracked actions

---

### 32. Cost optimization

**Frequency:** High

**Question:** Explain how you approach cloud cost optimization. Cover (1) right-sizing by reviewing actual versus requested CPU and memory to trim over-provisioning as the biggest win, (2) using spot/preemptible instances for fault-tolerant workloads and how Karpenter mixes spot and on-demand automatically, (3) committing with Reserved Instances, Savings Plans, or Committed Use for steady baseline, (4) deleting waste like unattached EBS, old snapshots, and idle LBs and lifecycle-tiering S3/GCS, and (5) tagging everything for showback with budget alerts and a FinOps culture.

**Answer:** Right-size: review actual vs requested CPU/memory; trim over-provisioning. Use spot/preemptible for fault-tolerant workloads (60-90% savings); Karpenter mixes spot + on-demand automatically. Reserved Instances / Savings Plans / Committed Use for steady baseline. Delete unattached EBS, old snapshots, idle LBs. Lifecycle-tier S3/GCS to infrequent-access. Tag everything for showback and set budget alerts. FinOps practice aligns engineering with cost ownership.

**Key points:**
- Right-size first (biggest wins)
- Spot for fault-tolerant; Karpenter mixes
- Commit (RI/SP/CUD) for baseline
- Lifecycle storage tiers + delete waste
- Tagging + budget alerts + FinOps culture

---

### 33. File descriptors and ulimit

**Frequency:** Medium

**Question:** Walk me through file descriptors and ulimit on Linux: (1) what a file descriptor actually is and what 0, 1, and 2 represent; (2) what other resources like sockets, pipes, and epoll handles consume; (3) why default soft limits cause EMFILE errors on high-connection services; and (4) the various ways to raise the limit, including ulimit -n, systemd LimitNOFILE, /etc/security/limits.conf, and how container runtimes cap it.

**Answer:** A file descriptor is a small integer index into the kernel's per-process open-file table. 0/1/2 are stdin/stdout/stderr. Sockets, pipes, and epoll handles all consume FDs. Default soft limits (often 1024) bite high-connection services with `EMFILE: too many open files`. Raise with `ulimit -n` for the shell, `LimitNOFILE` in a systemd unit, or `nofile` in `/etc/security/limits.conf`. In containers, the kubelet/Docker daemon settings cap what a workload can request.

**Key points:**
- FDs are per-process, integer indexes
- `EMFILE` means raise `nofile`
- systemd: `LimitNOFILE=`, k8s: container runtime config
- Check usage: `ls /proc/<pid>/fd | wc -l`

---

### 34. systemd units and journalctl

**Frequency:** Medium

**Question:** Describe how systemd manages services and how you work with logs: (1) the different unit types like .service, .timer, .socket, and .mount; (2) what a unit file declares, including ExecStart, Restart=, User=, and resource limits; (3) the commands to reload, enable, and start units; and (4) how to query logs with journalctl and find slow boot units.

**Answer:** systemd manages services as units (`.service`, `.timer`, `.socket`, `.mount`). A unit file lives in `/etc/systemd/system/` and declares `[Service]` with `ExecStart`, `Restart=`, `User=`, and resource limits. `systemctl daemon-reload` picks up changes; `systemctl enable --now foo` starts at boot. Logs go to the journal; query with `journalctl -u foo -f` or `--since "1 hour ago"`. Use `systemd-analyze blame` to find slow boot units.

**Key points:**
- Unit types: service/timer/socket/mount/target
- `Restart=on-failure` + `RestartSec=` for resilience
- `journalctl -u <unit> -f` for live logs
- Drop-ins in `/etc/systemd/system/foo.service.d/`

---

### 35. HTTP/1.1 vs HTTP/2 vs HTTP/3

**Frequency:** Medium

**Question:** Compare HTTP/1.1, HTTP/2, and HTTP/3: (1) how HTTP/1.1 handles requests per connection and its head-of-line blocking; (2) what HTTP/2 adds with binary framing, multiplexed streams, HPACK header compression, and server push; (3) how HTTP/3 runs on QUIC over UDP to eliminate TCP head-of-line blocking and speed up connection establishment with 0-RTT; and (4) which version gRPC requires.

**Answer:** HTTP/1.1 is text, one request per TCP connection (or pipelined with head-of-line blocking). HTTP/2 is binary, multiplexes streams over a single TCP connection, supports header compression (HPACK) and server push. HTTP/3 runs on QUIC (UDP), eliminating TCP head-of-line blocking and giving faster connection establishment via 0-RTT. gRPC requires HTTP/2; many CDNs negotiate HTTP/3 automatically.

**Key points:**
- H1: one in-flight per connection
- H2: multiplexed streams over TCP, HPACK
- H3: QUIC over UDP, no TCP HoL
- gRPC needs H2 end-to-end

---

### 36. TLS handshake and certificate chain

**Frequency:** Medium

**Question:** Explain the TLS handshake and certificate chain validation: (1) how the client and server negotiate a cipher and exchange keys, including ECDHE for forward secrecy; (2) what the server presents and how the client validates the chain up to a trusted root, checks SAN against the hostname, validity dates, and revocation via OCSP/CRL; (3) what changed in TLS 1.3; and (4) common misconfigurations such as missing intermediates, wrong SAN, or expired certs.

**Answer:** Client and server negotiate cipher and exchange keys (ECDHE for forward secrecy). Server presents a leaf cert plus intermediates; client validates the chain up to a trusted root in its store, checks SAN matches hostname, validity dates, and revocation (OCSP/CRL). TLS 1.3 collapsed the handshake to one round-trip and removed legacy ciphers. Misconfigurations include missing intermediates, wrong SAN, or expired certs.

**Key points:**
- Leaf -> intermediate(s) -> trusted root
- SAN must match hostname (CN is legacy)
- TLS 1.3 = 1-RTT, mandatory PFS
- Debug: `openssl s_client -connect host:443 -showcerts`

---

### 37. SSH keys, agent forwarding, jump hosts

**Frequency:** Medium

**Question:** Discuss SSH keys, agent forwarding, and jump hosts: (1) why you would use Ed25519 keys with a passphrase loaded into ssh-agent; (2) what ForwardAgent does and why it is risky on shared hosts; (3) why ProxyJump (ssh -J) through a bastion is safer than agent forwarding; and (4) how you configure repeatable hops in ~/.ssh/config.

**Answer:** Use Ed25519 keys (`ssh-keygen -t ed25519`) protected by a passphrase, loaded into `ssh-agent`. `ForwardAgent yes` forwards your local agent socket to the remote so it can authenticate onward without copying keys; risky on shared hosts. Prefer `ProxyJump bastion` (`ssh -J`) which tunnels through a jump host without exposing keys. Configure repeatable hops in `~/.ssh/config`.

**Key points:**
- Ed25519 > RSA-2048
- Avoid agent forwarding on untrusted hosts
- `ProxyJump`/`-J` is safer than forwarding
- Use `~/.ssh/config` for `Host`, `User`, `IdentityFile`

---

### 38. Distroless vs scratch vs alpine

**Frequency:** Medium

**Question:** Compare distroless, scratch, and alpine base images: (1) what scratch is and its tradeoffs around size, safety, and debuggability; (2) what distroless includes and excludes; (3) what alpine provides with musl libc, busybox, and apk, and the edge cases musl can introduce such as DNS quirks; and (4) which you would pick for production versus when you need a package manager, plus how to debug a distroless image.

**Answer:** `scratch` is empty - only your static binary; smallest and safest but no shell or libc, hard to debug. Distroless includes minimal runtime (libc, CA certs, optional Python/Java) without a package manager or shell. Alpine adds musl libc, busybox, and apk; small but musl can break glibc-compiled binaries (DNS quirks). Pick scratch/distroless for production, alpine when you need a package manager.

**Key points:**
- scratch: static binaries only, ~MB
- distroless: libc + CAs, no shell
- alpine: musl + apk, watch DNS edge cases
- Debug distroless via `kubectl debug` ephemeral container

---

### 39. Image tagging conventions

**Frequency:** Medium

**Question:** Discuss image tagging conventions for production: (1) why you should avoid the latest tag; (2) what immutable identifiers you would use such as semantic version, git SHA, or build date; (3) why you push multiple tags pointing at the same digest; and (4) why and how you pin deployments by digest for true immutability.

**Answer:** Avoid `latest` in production - it is mutable and unpinnable. Tag with immutable identifiers: semantic version (`1.4.2`), git SHA (`sha-abc1234`), or build date. Push multiple tags pointing at the same digest (`1.4.2`, `1.4`, `1`, `sha-...`) so consumers choose stability vs freshness. Always pin deployments by digest (`image@sha256:...`) for true immutability.

**Key points:**
- Never deploy `:latest`
- Combine semver + SHA tags
- Pin by digest in manifests
- Use registry immutable-tag policies

---

### 40. Volumes vs bind mounts vs tmpfs

**Frequency:** Medium

**Question:** Compare Docker volumes, bind mounts, and tmpfs: (1) what volumes are as Docker-managed storage with driver support; (2) how bind mounts attach a host path directly and the coupling that creates; (3) what tmpfs is and when RAM-only storage is ideal; and (4) the Kubernetes analogs for each.

**Answer:** Volumes are Docker-managed storage (`/var/lib/docker/volumes/`) with driver support (local, NFS, cloud). Bind mounts attach a host path directly into the container - flexible but couples the container to host layout. tmpfs lives in RAM only, ideal for secrets and scratch data that must not hit disk. In Kubernetes the analogs are PersistentVolumes, hostPath, and emptyDir (with `medium: Memory`).

**Key points:**
- Volumes: managed, portable
- Bind mounts: host path, host-coupled
- tmpfs: RAM-only, ephemeral
- k8s equivalents: PV/hostPath/emptyDir

---

### 41. Docker network drivers

**Frequency:** Medium

**Question:** Walk me through Docker network drivers: (1) what the default bridge driver does with NAT; (2) what the host driver gives up and gains; (3) how overlay spans multiple hosts via VXLAN; (4) what macvlan and none provide; and (5) how Kubernetes replaces all of this with CNI plugins.

**Answer:** `bridge` (default) creates a NAT-ed virtual network per host. `host` shares the host's network namespace - no isolation, full performance. `overlay` spans multiple hosts via VXLAN for Swarm. `macvlan` gives each container a MAC and IP on the physical LAN. `none` disables networking. Kubernetes replaces all this with CNI plugins; the pod gets its own netns and an IP routable cluster-wide.

**Key points:**
- bridge = default NAT
- host = no isolation, fastest
- overlay = multi-host VXLAN
- macvlan = container on physical LAN

---

### 42. docker compose

**Frequency:** Medium

**Question:** Explain what Docker Compose is and when to use it: (1) what a docker-compose.yml defines, including services, networks, volumes, env, depends_on, and healthchecks; (2) the commands to bring the stack up and tear it down; (3) what it is well suited for and when you should graduate to Kubernetes or Nomad; and (4) what profiles are used for.

**Answer:** Compose defines multi-container apps in `docker-compose.yml`: services, networks, volumes, env, depends_on, healthchecks. `docker compose up -d` brings the stack up; `compose down -v` tears it down. Great for local dev and small single-host deployments. For production multi-host, graduate to Kubernetes or Nomad. Profiles let you toggle optional services (`--profile debug`).

**Key points:**
- One YAML, multiple services
- `depends_on: condition: service_healthy` ordering
- Profiles for optional stacks
- Use Kubernetes for real prod orchestration

---

### 43. Image vulnerability scanning

**Frequency:** Medium

**Question:** Discuss image vulnerability scanning: (1) what tools like Trivy, Grype, and Snyk scan for in image layers; (2) how you integrate scanning as a required CI check and when you fail a build; (3) what else you should scan for such as misconfigurations and secrets; and (4) why you should schedule recurring scans against the registry even for unchanged images.

**Answer:** Tools like Trivy, Grype, and Snyk scan image layers for known CVEs in OS packages and language deps. Integrate in CI as a required check; fail builds on high/critical with a fixed version available. Also scan for misconfigurations (Dockerfile lints) and secrets. Schedule recurring scans on the registry because new CVEs land daily against unchanged images.

**Key points:**
- Trivy/Grype scan OS + lang deps
- Fail CI on fixable high/critical
- Scan registry continuously, not just on push
- Combine with SBOM generation

---

### 44. Non-root, dropped caps, read-only rootfs

**Frequency:** Medium

**Question:** Describe how to harden a container to run non-root with reduced privileges: (1) how you set a non-root USER in the Dockerfile and the securityContext fields in Kubernetes; (2) why you drop ALL capabilities and disable privilege escalation; (3) how readOnlyRootFilesystem works and how you handle apps needing writable paths like /tmp; and (4) why this reduces blast radius.

**Answer:** Set `USER 10001` in the Dockerfile and `securityContext: {runAsNonRoot: true, runAsUser: 10001, allowPrivilegeEscalation: false, capabilities: {drop: [ALL]}, readOnlyRootFilesystem: true}` in Kubernetes. Mount writable paths as emptyDir if the app needs `/tmp`. This drastically reduces blast radius if the app is compromised.

**Key points:**
- Run as non-root UID
- Drop ALL caps, add only what is needed
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`

---

### 45. PID 1 problem and tini

**Frequency:** Medium

**Question:** Explain the PID 1 problem in containers and how to solve it: (1) what special duties PID 1 has in Linux around reaping zombies and handling signals; (2) why many app runtimes and shell-form ENTRYPOINTs fail to handle SIGTERM or forward signals; (3) how tini or dumb-init solves this; and (4) how Docker's --init flag helps and what breaks without it.

**Answer:** PID 1 in Linux has special duties: reaping zombie children and handling signals. Many app runtimes (Node, Python) do not, so SIGTERM is ignored and shells spawned via shell-form ENTRYPOINT do not forward signals. Use `tini` or `dumb-init` as PID 1: `ENTRYPOINT ["tini", "--", "node", "server.js"]`. Docker provides `--init` to inject tini automatically.

**Key points:**
- PID 1 must reap zombies + handle signals
- Shell-form ENTRYPOINT breaks signal forwarding
- Use `tini`/`dumb-init` or `docker run --init`
- Without it, graceful shutdown fails

---

### 46. Healthchecks: Dockerfile vs orchestrator

**Frequency:** Medium

**Question:** Compare Dockerfile healthchecks with orchestrator health probes: (1) what a Dockerfile HEALTHCHECK does and how it marks a container unhealthy; (2) how Compose can wait on service_healthy; (3) why Kubernetes ignores the Dockerfile healthcheck and uses livenessProbe, readinessProbe, and startupProbe instead; and (4) the probe types available and why you keep logic consistent across orchestrators.

**Answer:** Dockerfile `HEALTHCHECK CMD curl -f http://localhost/health || exit 1` marks the container `unhealthy` after retries. Compose can wait on `service_healthy`. Kubernetes ignores Dockerfile healthchecks; it uses pod-spec `livenessProbe`, `readinessProbe`, `startupProbe`. Keep the same logic in both places when running across orchestrators.

**Key points:**
- Dockerfile HEALTHCHECK ignored by k8s
- k8s: liveness/readiness/startup probes
- Probes can be exec/HTTP/TCP/gRPC
- Tune `initialDelaySeconds` to avoid restart loops

---

### 47. docker exec vs run vs attach

**Frequency:** Medium

**Question:** Compare docker exec, docker run, and docker attach: (1) what docker run does; (2) what docker exec does and how you use it for an interactive shell; (3) what docker attach connects to and why pressing Ctrl-C may kill the container; and (4) which one you would prefer for debugging and when you would reach for attach.

**Answer:** `docker run` starts a new container from an image. `docker exec` runs an additional process inside a running container (`-it` for interactive shell). `docker attach` reconnects your terminal to the container's PID 1 stdio; pressing Ctrl-C may kill the container. Prefer `exec` for debugging; reserve `attach` for the rare cases you need PID 1's streams.

**Key points:**
- `run`: new container from image
- `exec`: extra process in running container
- `attach`: connect to PID 1 stdio
- `exec -it sh` for ad-hoc debug

---

### 48. Registry choices

**Frequency:** Medium

**Question:** Discuss container registry choices: (1) the range of options from Docker Hub with its rate limits, to GitHub Container Registry, GitLab Registry, cloud-native ECR/Artifact Registry/ACR, and self-hosted Harbor or Artifactory; (2) the criteria you weigh such as CI auth integration, geo-replication, scanning, and cost; and (3) how you handle air-gapped environments and Docker Hub pull rate limits.

**Answer:** Options include Docker Hub (rate-limited free tier), GitHub Container Registry (`ghcr.io`, integrates with Actions), GitLab Registry, AWS ECR, Google Artifact Registry, Azure ACR, Harbor (self-hosted with scanning/replication), and JFrog Artifactory. Choose based on auth integration with your CI, geo-replication needs, vulnerability scanning, and cost. For air-gapped envs, mirror upstream into Harbor/Artifactory.

**Key points:**
- Cloud-native: ECR/Artifact Registry/ACR
- Self-hosted: Harbor, Artifactory
- Mirror upstream for air-gapped builds
- Watch Docker Hub pull rate limits

---

### 49. Ingress vs Gateway API

**Frequency:** Medium

**Question:** Compare Ingress and the Gateway API: (1) what Ingress is as the legacy L7 API and why annotation-based, per-controller quirks limit portability; (2) what the Gateway API offers as the successor, including its role-oriented split across GatewayClass, Gateway, and HTTPRoute, and first-class support for TCP/UDP/TLS, traffic splitting, and header-based routing; and (3) which you would target for new deployments.

**Answer:** Ingress is the legacy L7 API for HTTP(S) routing via annotations - per-controller quirks limit portability. Gateway API is the successor: vendor-neutral, role-oriented (GatewayClass owned by infra, Gateway by cluster ops, HTTPRoute by app teams), with first-class support for TCP/UDP/TLS, traffic splitting, and header-based routing. New deployments should target Gateway API where the controller supports it.

**Key points:**
- Ingress = legacy, annotation-heavy
- Gateway API = role-split, portable
- HTTPRoute supports weighted traffic
- Controllers: Envoy Gateway, Istio, Contour, NGINX

---

### 50. HPA vs VPA vs Cluster Autoscaler vs Karpenter

**Frequency:** Medium

**Question:** Compare HPA, VPA, Cluster Autoscaler, and Karpenter: (1) how HPA scales pod replicas on metrics; (2) what VPA does to right-size requests and its caveat with HPA; (3) how Cluster Autoscaler adds and removes nodes from existing node groups; and (4) how Karpenter provisions just-right node types on demand without predefined groups, mixing spot and on-demand for cost.

**Answer:** HPA scales pod replicas on CPU/memory/custom metrics. VPA right-sizes pod requests over time (often run in recommendation mode only). Cluster Autoscaler adds/removes nodes from existing node groups when pods cannot schedule. Karpenter provisions just-right node types on demand without predefined groups, picking spot/on-demand mixes to minimize cost. HPA + Karpenter is the modern AWS combo.

**Key points:**
- HPA scales pods horizontally
- VPA tunes requests; avoid with HPA on same metric
- CA scales nodes within ASGs
- Karpenter: groupless, type-optimal nodes

---

### 51. PodDisruptionBudgets

**Frequency:** Medium

**Question:** Explain PodDisruptionBudgets: (1) what a PDB declares about minimum available or maximum unavailable pods during voluntary disruptions; (2) a concrete example with minAvailable on a replicated deployment; (3) which operations honor PDBs such as Cluster Autoscaler, node upgrades, and kubectl drain; and (4) what a PDB does NOT protect against.

**Answer:** A PDB declares the minimum available (or max unavailable) pods during voluntary disruptions like node drains. Example: `minAvailable: 2` on a 3-replica deployment lets at most one pod be evicted at a time. Cluster Autoscaler, node upgrades, and `kubectl drain` honor PDBs. PDBs do NOT protect against involuntary disruptions (node crash).

**Key points:**
- Protects only voluntary disruptions
- `minAvailable` or `maxUnavailable`
- Required for safe rolling node upgrades
- Combine with multi-zone topology spread

---

### 52. Init vs sidecar containers

**Frequency:** Medium

**Question:** Compare init containers and sidecar containers: (1) how init containers run sequentially to completion before app containers start and what they are good for; (2) how sidecars run alongside the main container sharing network and volumes; and (3) how Kubernetes 1.28+ adds native sidecar support via initContainers with restartPolicy: Always and how those start before and outlive the main container's startup.

**Answer:** Init containers run sequentially to completion before app containers start - good for migrations, waiting on dependencies, fetching config. Sidecars run alongside the main container sharing network/volumes (log shippers, proxies). Kubernetes 1.28+ adds native sidecar support via `initContainers` with `restartPolicy: Always`, which start before and outlive the main container's startup.

**Key points:**
- Init: run-once setup, sequential
- Sidecar: lifecycle-attached helper
- Native sidecars via init + `restartPolicy: Always`
- Sidecars share net/volumes with main

---

### 53. NetworkPolicies and default-deny

**Frequency:** Medium

**Question:** Explain Kubernetes NetworkPolicies and default-deny: (1) what the default pod-to-pod connectivity is; (2) how a NetworkPolicy selects pods and restricts ingress and egress; (3) how you apply a namespace-wide default-deny and then layer allow-lists; and (4) why this requires a policy-aware CNI and what L7 policies Cilium adds.

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

### 54. CoreDNS

**Frequency:** Medium

**Question:** Explain CoreDNS in Kubernetes: (1) what CoreDNS is and the names it resolves, including service records, headless service per-pod A records, and SRV records for ports; (2) how it forwards external queries; (3) how ndots:5 in pod resolv.conf causes excess lookups for external names and how you mitigate it; and (4) the key SLIs to watch and how you scale it.

**Answer:** CoreDNS is the default cluster DNS server. It resolves `svc.namespace.svc.cluster.local`, headless service A records (one per pod), SRV records for ports, and forwards external queries upstream. `ndots:5` in pod resolv.conf causes excess lookups for external names; mitigate with FQDNs (trailing dot) or `dnsConfig.options`. Cache hit metrics and forward latency are key SLIs.

**Key points:**
- Resolves `<svc>.<ns>.svc.cluster.local`
- Headless services -> per-pod A records
- Watch `ndots:5` external lookup amplification
- Scale CoreDNS replicas with cluster size

---

### 55. Service mesh: what does it add

**Frequency:** Medium

**Question:** Explain what a service mesh adds and its tradeoffs: (1) the capabilities like mTLS between services, fine-grained traffic policy such as retries, timeouts, and circuit breakers, canary/weighted routing, and uniform metrics and traces without app code changes; (2) the tradeoffs around sidecar latency, operational complexity, and debugging difficulty; and (3) how sidecarless meshes like Cilium and Istio Ambient reduce overhead.

**Answer:** A service mesh (Istio, Linkerd, Cilium Service Mesh) adds mTLS between services, fine-grained traffic policy (retries, timeouts, circuit breakers), canary/weighted routing, and uniform metrics/traces - without app code changes. Trade-offs: latency from sidecars (Linkerd is lightest), operational complexity, debugging difficulty. Sidecarless meshes (Cilium, Istio Ambient) reduce overhead.

**Key points:**
- mTLS + L7 policy + observability
- Sidecar tax vs sidecarless (Ambient)
- Linkerd: simple; Istio: featureful
- Adds debug surface; weigh need

---

### 56. CRDs and the operator pattern

**Frequency:** Medium

**Question:** Explain CRDs and the operator pattern: (1) what a CustomResourceDefinition does to the Kubernetes API; (2) what an operator is as a controller that watches a resource and reconciles real-world state; (3) how this codifies operational knowledge like provisioning, failover, and backups; and (4) the tools to build operators and some well-known examples.

**Answer:** A CustomResourceDefinition extends the API with a new resource type. An operator is a controller watching that resource and reconciling real-world state - codifying ops knowledge (provision DB, run failover, take backup). Built with kubebuilder or Operator SDK. Examples: cert-manager (Certificate -> issued TLS), Prometheus Operator, postgres-operator.

**Key points:**
- CRD adds new API kind
- Controller reconciles desired vs actual
- Encodes domain ops knowledge
- Build with kubebuilder/Operator SDK

---

### 57. Rolling update vs Recreate

**Frequency:** Medium

**Question:** Compare the rolling update and Recreate deployment strategies: (1) how rolling update works as the Deployment default and how maxSurge and maxUnavailable tune speed versus availability; (2) which settings give zero-downtime and what they require; (3) what Recreate does and its tradeoff; and (4) when you would choose Recreate, such as for apps that cannot run mixed versions.

**Answer:** Rolling update is the Deployment default; `maxSurge` (extra pods above replicas) and `maxUnavailable` (allowed missing) tune speed vs availability. `maxSurge: 25%, maxUnavailable: 0` is zero-downtime but needs spare capacity. Recreate kills all old pods, then starts new ones - simple but downtime. Use Recreate for apps that cannot run mixed versions (schema conflicts).

**Key points:**
- maxSurge + maxUnavailable tune rollout
- maxUnavailable: 0 for zero-downtime
- Recreate for incompatible versions
- Combine with readiness probes for safety

---

### 58. ServiceAccount and pod identity

**Frequency:** Medium

**Question:** Explain how a pod gets an identity and authenticates to APIs. Cover (1) the ServiceAccount token mounted into the pod for authenticating to the Kubernetes API, (2) how cloud workload identity mechanisms like IRSA, GKE Workload Identity, and Azure Workload Identity exchange the SA token for cloud credentials, and (3) why projected tokens that auto-rotate are preferable to baking long-lived cloud keys into images.

**Answer:** Pods authenticate to the API via a mounted SA token. For cloud APIs, use workload identity: IRSA (AWS, IAM role tied to SA via OIDC), GKE Workload Identity, Azure Workload Identity. The SA token is exchanged for cloud creds - no long-lived keys in pods. Token volumes are projected and rotated automatically.

**Key points:**
- SA = pod's k8s identity
- IRSA / Workload Identity for cloud APIs
- Tokens projected and auto-rotated
- Never bake cloud keys into images

---

### 59. etcd

**Frequency:** Medium

**Question:** Discuss etcd as the datastore behind the Kubernetes API. Address (1) why it uses Raft and requires odd-sized clusters of 3 or 5 nodes for quorum, (2) why it is latency-sensitive and needs fast dedicated disks, (3) how you back it up and rehearse restores with etcdctl snapshot, and (4) encrypting it at rest with KMS. Note why most production outages trace back to etcd.

**Answer:** etcd is the strongly-consistent key-value store backing the Kubernetes API. Use odd-sized clusters (3 or 5) for Raft quorum; separate disks (low-latency NVMe) and dedicated nodes for HA. Back up regularly with `etcdctl snapshot save` and test restores. Encrypt at rest with KMS. Most production outages trace back to etcd disk latency or quorum loss.

**Key points:**
- Raft, odd-sized 3/5 nodes
- Latency-sensitive: fast disks essential
- Snapshot + restore drill regularly
- Encrypt-at-rest with KMS

---

### 60. ImagePullBackOff causes

**Frequency:** Medium

**Question:** List and explain the causes of ImagePullBackOff. Cover possibilities such as (1) a typo in the image name or tag, (2) an unreachable registry, (3) a missing or wrong-namespace imagePullSecret, (4) expired or private registry credentials, (5) Docker Hub anonymous rate limits, and (6) a digest that no longer exists. Mention using kubectl describe for the exact registry error and mirroring critical images for resilience.

**Answer:** Possible: typo in image/tag, registry unreachable, missing imagePullSecret, expired registry creds, private image without auth, ECR/GCR creds not refreshed, rate-limit (Docker Hub anonymous), digest no longer exists. Describe the pod for the exact registry error. Mirror critical images into your own registry to remove third-party dependency.

**Key points:**
- Verify image name + tag exists
- imagePullSecret + correct namespace
- Watch Docker Hub rate limits
- Mirror upstream images for resilience

---

### 61. Tracing a slow service

**Frequency:** Medium

**Question:** Walk through how you trace a slow service in Kubernetes. Describe a layered approach: (1) checking Service endpoints and pod readiness, (2) reviewing recent deploys and error rate versus latency dashboards, (3) using distributed traces to localize the slow span such as a database or downstream service, and (4) inspecting HPA scaling, CPU throttling, DNS lookup time, and node pressure, correlating against baseline and the change log.

**Answer:** Layered approach: check Service endpoints (`kubectl get endpoints`), pod readiness, recent deploys, error rate vs latency in dashboards, distributed traces for slow span (DB? downstream service?). Inspect HPA scaling, throttling (`container_cpu_cfs_throttled_seconds`), DNS lookup time, and node pressure. Compare against baseline and recent change log.

**Key points:**
- Endpoints + readiness first
- Traces to localize slow span
- CPU throttling often invisible
- Correlate with deploys + node events

---

### 62. Cluster upgrades

**Frequency:** Medium

**Question:** Explain how you perform a Kubernetes cluster upgrade safely. Cover (1) upgrading the control plane components first one minor version at a time without skipping versions, (2) then upgrading nodes by draining respecting PDBs, upgrading kubelet and containerd, and uncordoning, (3) how managed services like EKS, GKE, and AKS automate the control plane, and (4) scanning ahead of time for removed APIs with tools like pluto and updating manifests before upgrading.

**Answer:** Upgrade control plane first (kube-apiserver, controller-manager, scheduler, etcd) one minor at a time - never skip versions. Then nodes: drain (respecting PDBs), upgrade kubelet+containerd, uncordon. Managed services (EKS, GKE, AKS) automate the control plane. Test in non-prod, read release notes for removed APIs (`kubectl deprecations`, `pluto`), update manifests before the upgrade.

**Key points:**
- Control plane first, then nodes
- One minor version at a time
- Drain with PDBs honored
- Scan for removed APIs ahead of time

---

### 63. kubectl drain

**Frequency:** Medium

**Question:** Explain what kubectl drain does and when you use it. Cover (1) how it cordons the node and evicts existing pods while respecting PodDisruptionBudgets, (2) why --ignore-daemonsets is required, (3) the fact that pods using emptyDir lose their data, and (4) when you drain (kernel patches, node upgrades, scale-down) and how you return the node to service with uncordon.

**Answer:** `kubectl drain node --ignore-daemonsets --delete-emptydir-data` cordons the node (no new pods) and evicts existing pods respecting PDBs. DaemonSet pods are skipped via flag. Pods with emptyDir lose data. Use before kernel patches, node upgrades, or scale-down. After maintenance, `kubectl uncordon` to allow scheduling.

**Key points:**
- Cordons + evicts respecting PDBs
- `--ignore-daemonsets` required
- emptyDir data lost on drain
- Uncordon to return node to pool

---

### 64. kubectl top and metrics-server

**Frequency:** Medium

**Question:** Explain kubectl top and metrics-server. Cover (1) what kubectl top pods and nodes show and that the data comes from metrics-server aggregating kubelet cAdvisor, (2) how it powers HPA on resource metrics, (3) the limitation that it holds only current values and no history, so Prometheus plus Grafana is needed for history and dashboards, and (4) that custom or external metrics require Prometheus Adapter or KEDA.

**Answer:** `kubectl top pods` / `kubectl top nodes` shows CPU/memory usage, sourced from metrics-server (a cluster aggregator scraping kubelet cAdvisor). It powers HPA on resource metrics. For history and dashboards use Prometheus + Grafana - metrics-server keeps only current values. Custom/external metrics need Prometheus Adapter or KEDA.

**Key points:**
- metrics-server feeds HPA + `kubectl top`
- Current values only, no history
- Install if missing (not always default)
- For history: Prometheus + Grafana

---

### 65. Pipeline-as-code

**Frequency:** Medium

**Question:** Explain the pipeline-as-code practice. Cover (1) defining pipelines in version-controlled files such as GitHub workflows, Jenkinsfile, or .gitlab-ci.yml so they live with the code and are reviewable and diff-able, (2) reusing logic via templates or composite actions, (3) why you avoid UI-edited pipelines that drift and are hard to audit, and (4) validating pipeline changes through pull-request runs.

**Answer:** Pipelines defined in version-controlled files (`.github/workflows/*.yml`, `Jenkinsfile`, `.gitlab-ci.yml`) live with the code, are reviewable, diff-able, and reusable via templates/composite actions. Avoid UI-edited pipelines - they drift and are hard to audit. Pull-request previews can validate changes before merge.

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

**Question:** Describe the typical stages of PR checks in a CI pipeline. Walk through an order such as lint/format, unit tests, build, container build and scan, integration tests, smoke deploy to an ephemeral environment, required reviewer approval, then merge. Explain (1) failing fast by putting lint before tests, (2) parallelizing independent jobs, (3) how ephemeral preview environments catch integration bugs, and (4) how branch protection enforces required checks, including external status reporting.

**Answer:** Typical order: lint/format -> unit tests -> build -> container build & scan -> integration tests -> smoke deploy to ephemeral env -> required reviewer approval -> merge. Fail fast (lint before tests). Parallelize independent jobs. Required checks in branch protection block merge until green. Include status reporting from external systems (SonarQube, Snyk).

**Key points:**
- Fail fast: lint first
- Parallelize independent jobs
- Ephemeral preview envs catch integration bugs
- Branch protection enforces required checks

---

### 68. Caching dependencies in CI

**Frequency:** Medium

**Question:** Explain how you cache dependencies in CI. Cover (1) what to cache such as the npm, Maven, Go module, pip wheel, and Docker layer stores, keyed by lockfile hash, and restoring at start and saving at end, (2) mechanisms like GitHub Actions cache, GitLab cache blocks, and BuildKit cache mounts, (3) why you cache the upstream package store rather than node_modules across OS differences, and (4) using fallback restore-keys for partial hits.

**Answer:** Cache `~/.npm`, `~/.m2`, Go module cache, pip wheels, Docker layers keyed by lockfile hash. Restore at start, save at end. GitHub Actions `actions/cache`, GitLab `cache:` block, BuildKit `--mount=type=cache`. Cache invalidates when lockfile changes. Avoid caching node_modules across OS differences; cache the upstream package store and run install fresh.

**Key points:**
- Key cache by lockfile hash
- Cache the package store, not node_modules
- BuildKit cache mounts for compiler caches
- Set fallback restore-keys for partial hits

---

### 69. Artifact management

**Frequency:** Medium

**Question:** Explain artifact management with tools like Artifactory, Nexus, GitHub Packages, or AWS CodeArtifact. Cover (1) what they store (jars, wheels, npm, OCI, Helm charts), (2) benefits such as mirroring and caching upstream registries to avoid rate limits and speed builds, immutable release repos, vulnerability scanning, and geo-replication, and (3) the practice of promoting a built artifact through repos (snapshot to release to prod) rather than rebuilding, plus retention and cleanup policies.

**Answer:** Artifactory, Nexus, GitHub Packages, AWS CodeArtifact store built binaries (jars, wheels, npm, OCI, Helm charts). Benefits: caching of upstream registries (no rate limits, faster builds), retention policies, immutable releases, vulnerability scanning, geo-replication. Promote artifacts through repos (snapshot -> release -> prod) rather than rebuilding.

**Key points:**
- Mirror upstream registries
- Promote, do not rebuild
- Immutable release repos
- Retention + cleanup policies

---

### 70. Secrets in CI without leaks

**Frequency:** Medium

**Question:** Explain how you handle secrets in CI without leaking them. Cover (1) using the platform's encrypted secret store such as GitHub Actions Secrets, GitLab CI variables, or Vault rather than repo files, (2) masking secrets in logs and forbidding printing env or set -x, (3) using OIDC federation to exchange a short-lived workflow token for cloud credentials instead of long-lived keys, and (4) scoping secret access to only the jobs and environments that need them.

**Answer:** Use the platform's encrypted secret store (GitHub Actions Secrets, GitLab CI variables, Vault). Mask in logs (most platforms do automatically for known secrets). Forbid printing env. Use OIDC federation to cloud providers - exchange a short-lived workflow token for cloud creds instead of long-lived keys. Restrict secret access to required jobs only.

**Key points:**
- Encrypted secret stores, not repo files
- OIDC to cloud beats long-lived keys
- Mask + forbid `env`/`set -x`
- Scope secrets per job/environment

---

### 71. Environment promotion

**Frequency:** Medium

**Question:** Explain environment promotion in a deployment pipeline. Cover (1) moving the same artifact through dev, staging, and prod with only configuration differing, and why you avoid rebuilding per environment to prevent drift, (2) how promotion works under GitOps as a PR updating the image tag in the prod overlay, (3) gating prod with manual approval and additional checks like canary and smoke tests, and (4) keeping the same config schema with different values across environments.

**Answer:** Same artifact moves through dev -> staging -> prod; only config differs. Avoid rebuilding per env (drift risk). With GitOps, promotion is a PR updating the image tag in the prod overlay. Gate prod with manual approval and additional checks (canary, smoke). Use environments in GitHub Actions for protection rules and required reviewers.

**Key points:**
- One artifact, many envs
- Promote via PR to env overlay
- Manual approval gates for prod
- Same config schema, different values

---

### 72. Database migrations in CD (expand/contract)

**Frequency:** Medium

**Question:** Explain how you run database migrations safely during continuous delivery using the expand/contract pattern. Cover (1) why backward-incompatible migrations break during a rolling deploy when app and DB versions overlap, and (2) the ordered steps: add the new column or table, deploy an app that writes both old and new, backfill, deploy an app reading only new, then drop the old column. Emphasize keeping schema changes backward-compatible across at least one app version.

**Answer:** App and DB versions overlap during rolling deploy, so backward-incompatible migrations break. Use expand/contract: 1) add new column/table (deploy migration), 2) deploy app that writes both old + new, 3) backfill, 4) deploy app reading only new, 5) drop old column. Always make schema changes backward-compatible across at least one app version.

**Key points:**
- Migrations precede app deploy
- App must work with old and new schema
- Backfill before reading new
- Drop legacy after full rollout

---

### 73. Feature flags

**Frequency:** Medium

**Question:** Explain feature flags. Cover (1) how they decouple deploy from release so code ships dark and is enabled per user, cohort, or percentage via a flag service like LaunchDarkly, Unleash, or Flagsmith, (2) what they enable such as trunk-based development, A/B tests, instant kill switches, and gradual rollouts, and (3) flag hygiene, tracking the lifecycle and deleting stale flags to prevent code rot and ballooning permutations.

**Answer:** Decouple deploy from release: code ships dark, then enabled per user/cohort/percentage via flag service (LaunchDarkly, Unleash, Flagsmith). Enables trunk-based dev, A/B tests, instant kill switches, gradual rollouts. Hygiene: track flag lifecycle - delete stale flags to prevent code rot and ballooning permutations.

**Key points:**
- Deploy != release
- Percentage / cohort targeting
- Kill switches without redeploy
- Retire stale flags ruthlessly

---

### 74. Terraform modules and workspaces

**Frequency:** Medium

**Question:** Explain Terraform modules and workspaces. Cover (1) how modules group related resources for reuse (for example a vpc module taking CIDR vars), sourcing from local paths, Git, or registries, and pinning module versions, (2) what workspaces are as isolated state instances within one config and how they are easy to misuse, and (3) why many teams prefer directory-per-env over workspaces for clearer separation.

**Answer:** Modules group related resources for reuse (a `vpc` module taking CIDR vars). Source from local paths, Git, or registries. Pin module versions. Workspaces are isolated state instances in one config (`terraform workspace new prod`) - useful for envs but easy to misuse. Many teams prefer directory-per-env (`envs/prod/`, `envs/staging/`) over workspaces for clearer separation.

**Key points:**
- Modules = reusable building blocks
- Pin module versions
- Workspaces = state isolation
- Directory-per-env often clearer than workspaces

---

### 75. terraform plan review discipline

**Frequency:** Medium

**Question:** Explain the discipline of reviewing a terraform plan before applying. Cover (1) reading the full plan and counting creates, updates, and destroys, (2) scrutinizing destroys for blast radius and watching for forces replacement on critical resources like databases and load balancers, (3) posting plan output in the PR via Atlantis or similar and requiring approval for destructive plans, and (4) applying a saved plan file (-out) so you apply exactly what was planned.

**Answer:** Always read the full plan before apply: count creates/updates/destroys, scrutinize destroys for blast radius, check for sensitive value churn, watch for `forces replacement` on critical resources (DBs, load balancers). Post plan output in PR via Atlantis/tfaction. Require approval for destructive plans. Apply only what was planned (use `-out=plan.tfplan`).

**Key points:**
- Read every destroy line
- `forces replacement` = downtime risk
- Plan in PR via Atlantis
- Apply saved plan to avoid drift

---

### 76. Immutable vs mutable infrastructure

**Frequency:** Medium

**Question:** Contrast immutable and mutable infrastructure. Cover (1) the mutable approach of SSHing into servers and patching in place, and how drift and snowflake servers accumulate, (2) the immutable approach of building a new image, AMI, or container for every change and replacing instances, giving easier rollback, no drift, and a fit with autoscaling, and (3) the requirements it imposes such as fast image builds and rolling-deploy automation, noting containers as the canonical immutable unit.

**Answer:** Mutable: SSH into servers and patch in place (config mgmt). Drift accumulates; snowflake servers emerge. Immutable: build a new image/AMI/container for every change and replace instances - no in-place mutation. Easier rollback, no drift, fits autoscaling. Requires fast image builds and rolling-deploy automation. Containers are the canonical immutable unit.

**Key points:**
- Mutable -> drift + snowflakes
- Immutable -> replace, never patch
- Fast image builds essential
- Rollback = redeploy prior image

---

### 77. Security groups vs NACLs (AWS)

**Frequency:** Medium

**Question:** Contrast security groups and NACLs in AWS. Cover (1) security groups as stateful, instance-level firewalls with allow rules only where return traffic is auto-allowed, (2) NACLs as stateless, subnet-level controls with both allow and deny rules where return traffic needs its own rule, (3) which is the primary tool and which is the coarse second layer, and (4) the practice of default-deny ingress plus minimal, tightened egress for production.

**Answer:** Security groups are stateful, instance-level firewalls - allow rules only, return traffic auto-allowed. NACLs are stateless, subnet-level - both allow and deny rules, return traffic needs its own rule. SGs are the primary tool; NACLs are a coarse second layer (e.g., block specific IPs). Default-deny ingress + minimal egress for production SGs.

**Key points:**
- SG: stateful, instance level, allow-only
- NACL: stateless, subnet level, allow + deny
- SGs first, NACLs as secondary
- Tighten egress, not just ingress

---

### 78. Service discovery

**Frequency:** Medium

**Question:** Explain service discovery approaches. Cover (1) DNS-based discovery via Route53 private zones, CoreDNS in Kubernetes, or Consul, (2) registry-based discovery via Consul, Eureka, or Cloud Map where services register on startup with health info, (3) how Kubernetes Services plus CoreDNS make discovery automatic, and (4) cross-cluster or multi-region options such as external-dns syncing services to Route53 or service-mesh federation, noting why a health-aware registry beats static DNS.

**Answer:** DNS-based: Route53 private zones, CoreDNS in k8s, Consul. Registry-based: Consul, Eureka, Cloud Map - services register on startup with health info. Kubernetes Services + CoreDNS make discovery automatic. For cross-cluster / multi-region, use external-dns syncing k8s services to Route53 or service-mesh federation.

**Key points:**
- k8s: Service + CoreDNS
- Consul/Cloud Map for mixed envs
- external-dns syncs to cloud DNS
- Health-aware registry beats static DNS

---

### 79. Grafana dashboards and alerts

**Frequency:** Medium

**Question:** Explain how you build Grafana dashboards and alerts. Cover (1) that Grafana visualizes from sources like Prometheus, Loki, Tempo, CloudWatch, and BigQuery, (2) managing dashboards as code via JSON or the Grafonnet/Terraform provider for review, (3) using template variables for cluster and namespace dropdowns, (4) where alerts run (Grafana unified alerting or Prometheus Alertmanager), and (5) keeping dashboards small and intentional using the RED or USE method.

**Answer:** Grafana visualizes from Prometheus, Loki, Tempo, CloudWatch, BigQuery, etc. Dashboards as code via JSON or Grafonnet/Terraform provider for review. Use template variables for cluster/namespace dropdowns. Alerts can run in Grafana (unified alerting) or in Prometheus Alertmanager. Keep dashboards small and intentional - one per service, RED or USE method.

**Key points:**
- Dashboards as code in Git
- Template vars for reuse
- RED (rate/errors/duration) or USE (utilization/saturation/errors) method
- Alerts in Alertmanager or Grafana unified

---

### 80. OpenTelemetry: collector, signals, propagation

**Frequency:** Medium

**Question:** Explain OpenTelemetry. Cover (1) that it is a vendor-neutral spec plus SDKs for traces, metrics, and logs, giving one SDK for many backends, (2) how apps emit OTLP to a Collector that batches, filters, and samples before exporting to backends like Tempo, Jaeger, or Datadog, (3) context propagation via the W3C traceparent header so spans link across services, and (4) auto-instrumentation libraries for common frameworks versus manual instrumentation for custom spans.

**Answer:** OTel is a vendor-neutral spec + SDKs for traces, metrics, logs. Apps emit OTLP to a Collector that processes (batch, filter, sample) and exports to backends (Tempo, Jaeger, Datadog). Context propagation uses W3C `traceparent` header so spans link across services. Auto-instrumentation libs cover popular frameworks; manual instrumentation for custom spans.

**Key points:**
- One SDK, many backends
- Collector for processing + routing
- W3C traceparent header propagates context
- Auto-instrumentation for common libs

---

### 81. Pipeline scanning (Trivy, Snyk, Dependabot)

**Frequency:** Medium

**Question:** Explain pipeline security scanning. Cover the categories: (1) SCA for dependency CVEs, (2) SAST for code, (3) IaC scanning with Checkov or tfsec, (4) secret scanning with gitleaks or trufflehog, and (5) container scanning with Trivy or Grype. Also cover how Dependabot or Renovate open PRs to bump vulnerable deps, blocking merge on high/critical findings with a fix available while warning on others, and aggregating findings in a tracker like DefectDojo so they do not vanish into PR noise.

**Answer:** Scan SCA (dependency CVEs), SAST (code), IaC (Checkov, tfsec), secrets (gitleaks, trufflehog), containers (Trivy, Grype). Dependabot/Renovate open PRs to bump vulnerable deps. Block merge on high/critical with a fix available; warn on others. Track findings in a queue (DefectDojo) so they do not vanish into PR noise.

**Key points:**
- SCA + SAST + IaC + secrets + container scans
- Dependabot/Renovate for auto-updates
- Block merge on high/critical fixable
- Aggregate findings in a tracker

---

### 82. AWS vs GCP vs Azure: rough service mapping

**Frequency:** Medium

**Question:** Give a rough service mapping across AWS, GCP, and Azure. Cover the equivalents for (1) compute (EC2 / Compute Engine / Azure VMs), (2) managed Kubernetes (EKS / GKE / AKS), (3) serverless (Lambda / Cloud Functions / Azure Functions), (4) object storage (S3 / GCS / Blob), and (5) managed Postgres (RDS / Cloud SQL / Azure DB). Also explain how the IAM models differ across the three providers and why multi-cloud is harder than it looks so you should pick one primary.

**Answer:** Compute: EC2 / Compute Engine / Azure VMs. Managed K8s: EKS / GKE / AKS (GKE generally most polished). Serverless: Lambda / Cloud Functions / Azure Functions. Object store: S3 / GCS / Blob. Managed Postgres: RDS / Cloud SQL / Azure DB. IAM models differ: AWS roles + policies (powerful, verbose), GCP IAM bindings (simple, hierarchical via projects/folders), Azure RBAC + Entra ID. Multi-cloud is harder than it looks; pick one primary.

**Key points:**
- EKS / GKE / AKS for managed k8s
- S3 / GCS / Blob for object
- IAM models differ significantly
- Multi-cloud is mostly a tax

---

### 83. iptables vs nftables

**Frequency:** Low

**Question:** Compare iptables and nftables: (1) how iptables organizes packet filtering into tables like filter, nat, and mangle, and chains like INPUT, OUTPUT, and FORWARD; (2) what nftables offers as the modern replacement; (3) how both rely on netfilter and how Kubernetes kube-proxy has used iptables, IPVS, and nftables modes; and (4) why rule ordering and first-match-wins evaluation matter.

**Answer:** iptables filters packets via tables (`filter`, `nat`, `mangle`) and chains (`INPUT`, `OUTPUT`, `FORWARD`). nftables is the modern replacement with a single `nft` tool and unified syntax. Both rely on netfilter hooks. Kubernetes kube-proxy historically used iptables (now offers IPVS and nftables modes). Order matters: rules are evaluated top-down per chain; first match wins.

**Key points:**
- Tables: filter/nat/mangle/raw
- Chains: INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING
- nftables is the successor; same netfilter underneath
- `iptables -L -n -v` to inspect counters

---

### 84. .dockerignore

**Frequency:** Low

**Question:** Explain the purpose of a .dockerignore file: (1) how it excludes paths from the build context sent to the daemon; (2) what problems arise without it, such as shipping node_modules, .git, build outputs, and secrets; (3) how its syntax mirrors .gitignore and what you should always exclude; and (4) how you can verify the effect.

**Answer:** `.dockerignore` excludes paths from the build context sent to the daemon. Without it, `node_modules`, `.git`, build outputs, and secrets all ship to the builder, slowing builds and risking leaks. Patterns mirror `.gitignore`. Always exclude `.git`, `node_modules`, `target/`, `*.env`, and local credentials. Verify by inspecting the context size in the build output.

**Key points:**
- Reduces context upload time
- Prevents leaking `.env`/`.git` into images
- Syntax mirrors `.gitignore`
- Required even with BuildKit

---

### 85. BuildKit features

**Frequency:** Low

**Question:** Describe BuildKit and its features: (1) what BuildKit is as the modern builder and the capabilities it enables like parallel stages, better caching, and secret, SSH, and cache mounts; (2) how you enable it; (3) how a cache mount like RUN --mount=type=cache persists a compiler cache across builds; and (4) how remote cache and the syntax frontend directive work.

**Answer:** BuildKit is the modern builder enabling parallel stages, better caching, secret mounts, SSH mounts, cache mounts, and frontends like `Dockerfile` v1.4. Enable with `DOCKER_BUILDKIT=1` (default in modern Docker). Use `RUN --mount=type=cache,target=/root/.cache/go-build` to persist a compiler cache across builds without baking it into the image.

**Key points:**
- Parallel stage execution
- `--mount=type=cache|secret|ssh`
- Remote cache (`--cache-from`, `--cache-to`)
- Frontend syntax via `# syntax=` directive

---

### 86. Buildx multi-arch images

**Frequency:** Low

**Question:** Explain building multi-arch images with buildx: (1) how a buildx build with --platform produces a manifest list (OCI image index) referencing per-arch images; (2) how consumers pull the variant matching their CPU; (3) how QEMU emulation versus native remote builders affect speed; and (4) why this matters for Apple Silicon development and Graviton/Ampere production.

**Answer:** `docker buildx build --platform linux/amd64,linux/arm64 -t repo/app:1.0 --push .` produces a manifest list (a.k.a. OCI image index) referencing per-arch images. Consumers pull the variant matching their CPU. Use QEMU emulation or remote builders (e.g., native arm64 runners) for speed. Critical for Apple Silicon dev and Graviton/Ampere production.

**Key points:**
- `docker buildx create --use`
- `--platform linux/amd64,linux/arm64`
- Manifest list selects per-arch
- Use native runners over QEMU when possible

---

### 87. Image signing (Cosign, SLSA)

**Frequency:** Low

**Question:** Explain image signing and supply-chain trust: (1) what Cosign does, including keyless OIDC identities and where signatures live; (2) what SLSA defines with its provenance levels; (3) how you verify signatures at admission with tools like Kyverno or Connaisseur; and (4) how attestations like SBOM and build provenance complete the supply chain.

**Answer:** Cosign (sigstore) signs OCI artifacts using keyless OIDC identities or static keys; signatures live alongside the image in the registry. SLSA defines provenance levels - SLSA 3 requires non-falsifiable build provenance. Verify signatures at admission (Kyverno, Connaisseur) so unsigned images are rejected. Pair with attestations (SBOM, build provenance) for a complete supply chain.

**Key points:**
- `cosign sign image@digest`
- Keyless via OIDC + Fulcio
- Verify at admission with policy
- SLSA provenance for build trust

---

### 88. Topology spread constraints

**Frequency:** Low

**Question:** Explain topology spread constraints in Kubernetes: (1) what they constrain about pod distribution across topology domains like zones, nodes, and racks; (2) what maxSkew, topologyKey, and whenUnsatisfiable (DoNotSchedule versus ScheduleAnyway) control; and (3) why they are preferred over pod anti-affinity for HA spreading with many replicas.

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

### 89. CNI choices: Calico, Cilium, Flannel

**Frequency:** Low

**Question:** Compare the CNI choices Calico, Cilium, and Flannel: (1) what Flannel offers as a simple VXLAN overlay and its limitations; (2) what Calico adds with BGP routing, NetworkPolicy, and an eBPF dataplane; (3) what Cilium provides as an eBPF-native option with L3-L7 policies, transparent encryption, sidecarless service mesh, and Hubble observability; and (4) how you would choose between them.

**Answer:** Flannel is simple VXLAN overlay, no policies - good for dev. Calico offers BGP routing (no overlay), NetworkPolicy, and eBPF dataplane. Cilium is eBPF-native with L3-L7 policies, transparent encryption, service mesh (no sidecar), and Hubble observability. Pick Cilium for modern clusters needing observability and L7 policy; Calico for mature BGP integration.

**Key points:**
- Flannel: simplest, no policy
- Calico: BGP + NetworkPolicy
- Cilium: eBPF, L7 policy, Hubble
- Cilium can replace kube-proxy

---

### 90. Pod Security Standards

**Frequency:** Low

**Question:** Explain Pod Security Standards (PSS) and how they replaced PodSecurityPolicy. Walk through (1) the three levels Privileged, Baseline, and Restricted and what each permits or blocks, (2) how you enforce a level using PodSecurity admission controller labels on a namespace, and (3) when you would reach for Kyverno or Gatekeeper for more granular policy beyond the built-in levels.

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

### 91. kubeconfig contexts

**Frequency:** Low

**Question:** Explain kubeconfig and contexts. Cover (1) what a context is (cluster + user + namespace) and how you switch between them, (2) tools like kubectx and kubens that improve ergonomics, and (3) practices that prevent destructive wrong-cluster mistakes such as prompt indicators and splitting KUBECONFIG per environment.

**Answer:** `~/.kube/config` holds clusters, users, and contexts (cluster+user+namespace). Switch with `kubectl config use-context prod`. Tools like `kubectx`/`kubens` speed switching. Avoid mixing prod/dev in one terminal; use shell prompt indicators (kube-ps1) or separate `KUBECONFIG` files per env to prevent destructive cross-cluster mistakes.

**Key points:**
- Context = cluster + user + namespace
- Use `kubectx`/`kubens` for ergonomics
- Prompt indicators prevent wrong-cluster mistakes
- Split `KUBECONFIG` per env

---

### 92. Ephemeral containers (kubectl debug)

**Frequency:** Low

**Question:** Explain ephemeral containers via kubectl debug. Cover (1) how they let you add a debug container to a running pod without restarting it, which is critical for distroless or scratch images that have no shell, (2) how --target shares the process namespace with the main container so you can see its processes and /proc, and (3) the limitation that you cannot mount volumes, and how kubectl debug node/... helps with host-level inspection.

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

### 93. Admission controllers

**Frequency:** Low

**Question:** Explain admission controllers in Kubernetes. Cover (1) that they intercept API requests after auth and authz to validate or mutate, and that mutating runs before validating, (2) built-in ones like LimitRanger, ResourceQuota, and PodSecurity, and (3) dynamic policy via ValidatingAdmissionPolicy with CEL and webhooks, contrasting Kyverno's YAML rules with OPA Gatekeeper's Rego for enforcing custom policy.

**Answer:** Admission controllers intercept API requests after auth/authz to validate or mutate. Built-in: LimitRanger (default requests/limits), ResourceQuota (namespace caps), PodSecurity (PSS). Dynamic: ValidatingAdmissionPolicy (CEL), webhooks - OPA Gatekeeper and Kyverno enforce custom policy (image registries allow-listed, required labels, ban privileged pods). Kyverno uses Kubernetes-native YAML rules; Gatekeeper uses Rego.

**Key points:**
- Mutating runs before validating
- LimitRanger + ResourceQuota for safety nets
- Kyverno (YAML) vs Gatekeeper (Rego)
- CEL ValidatingAdmissionPolicy for inline rules

---

### 94. Matrix builds

**Frequency:** Low

**Question:** Explain matrix builds in CI. Cover (1) running the same job across a cross-product of dimensions like OS, language version, and architecture, (2) using fail-fast: false to see all failures rather than stopping at the first, (3) using include and exclude to add or skip specific combinations for sparse matrices, and (4) the caution that cost grows multiplicatively as dimensions are added.

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

### 95. Build reproducibility and provenance

**Frequency:** Low

**Question:** Explain build reproducibility and provenance. Cover (1) what reproducibility means (same inputs produce byte-identical outputs) and how you achieve it via base images pinned by digest, deps pinned with lockfiles, fixed timestamps via SOURCE_DATE_EPOCH, and no network during build, and (2) generating SLSA provenance as an in-toto attestation recording who, what, and where built the artifact, and verifying it at deploy time so only trusted builds run.

**Answer:** Same inputs produce byte-identical outputs. Achieve via pinned base images by digest, pinned deps with lockfiles, fixed timestamps (`SOURCE_DATE_EPOCH`), no network during build. Generate SLSA provenance (in-toto attestation) recording who/what/where built the artifact. Verify provenance at deploy time so only trusted builds run.

**Key points:**
- Pin base images by digest
- Lockfiles + frozen deps
- SOURCE_DATE_EPOCH for deterministic time
- SLSA provenance for trust chain

---

### 96. Ansible vs Salt vs Chef vs Puppet

**Frequency:** Low

**Question:** Compare Ansible, Salt, Chef, and Puppet for configuration management. Cover (1) Ansible as agentless over SSH with YAML playbooks in a push model that is easy to start with, (2) Salt as agent or salt-ssh based, using YAML/Jinja and being fast and event-driven, (3) Chef and Puppet as agent-based with long enterprise lineage, and (4) how immutable infrastructure with containers and Packer-baked AMIs has shrunk config-management's scope while Ansible remains popular for OS-level provisioning.

**Answer:** Ansible: agentless (SSH), YAML playbooks, push model, easy to start - dominant for config mgmt. Salt: agent or salt-ssh, YAML/Jinja, fast event-driven (ZeroMQ). Chef: Ruby DSL, agent-based, declarative. Puppet: declarative DSL, agent-based, strong in long-lived enterprise fleets. With immutable infra (containers, AMIs baked by Packer), config-mgmt usage has shrunk; Ansible remains popular for OS-level provisioning.

**Key points:**
- Ansible: agentless, YAML, push
- Salt: fast, event-driven
- Chef/Puppet: agent-based, long lineage
- Immutable infra reduces config-mgmt scope

---

### 97. Edge / global load balancing

**Frequency:** Low

**Question:** Explain edge and global load balancing. Cover the layered architecture: (1) anycast DNS such as Route53 latency-based or Cloudflare, (2) CDN/edge such as CloudFront, Cloudflare, or Fastly terminating TLS close to users, (3) regional load balancers like ALB/NLB fronting cluster ingresses, and (4) global load balancers such as AWS Global Accelerator or GCP Global LB providing anycast IPs that steer to the nearest healthy region for low latency and automated regional failover.

**Answer:** Layers: anycast DNS (Route53 latency-based, Cloudflare), CDN/edge (CloudFront, Cloudflare, Fastly) terminating TLS close to users, regional LBs (ALB/NLB, GLB) fronting cluster ingresses. Global LB (AWS Global Accelerator, GCP Global LB) gives anycast IPs steering to nearest healthy region. Use for low latency and regional failover.

**Key points:**
- DNS + CDN + regional LB layered
- Global LBs offer anycast IPs
- TLS terminated at edge
- Regional failover automated

---

### 98. Tracing sampling strategies

**Frequency:** Low

**Question:** Explain tracing sampling strategies. Contrast (1) head-based sampling that decides at request start (for example probabilistic 1%), which is cheap but may miss rare errors, (2) tail-based sampling that collects all spans and decides after seeing the full trace to keep errors and slow traces while sampling successes, at the cost of collector buffering memory, and (3) adaptive sampling that adjusts the rate to hit a target volume. Note the principle of always keeping 100% of errors.

**Answer:** Head-based: decide at request start (probabilistic, e.g., 1%) - simple, cheap, may miss rare errors. Tail-based: collect all spans, decide after seeing the full trace (keep errors, slow traces, sample successes) - needs collector buffering memory but far more useful. Adaptive sampling adjusts rate dynamically to hit a target volume.

**Key points:**
- Head: cheap, may miss errors
- Tail: keep errors/slow, sample rest
- Adaptive: target volume
- Always keep 100% errors

---

### 99. Chaos engineering

**Frequency:** Low

**Question:** Explain chaos engineering. Cover (1) deliberately injecting failures like pod kills, network latency, or an AZ outage in production-like environments to verify resilience, (2) that it is hypothesis-driven rather than random, starting small (for example killing one pod during business hours to test that traffic shifts to a healthy pod within 5s), (3) building up to game days simulating regional failover, and (4) tools such as Chaos Mesh, LitmusChaos, Gremlin, and AWS Fault Injection Simulator.

**Answer:** Deliberately inject failures (pod kill, network latency, AZ outage) in production-like environments to verify resilience. Tools: Chaos Mesh, LitmusChaos (k8s-native), Gremlin (SaaS), AWS Fault Injection Simulator. Start small: kill one pod during business hours after a hypothesis ("traffic shifts to healthy pod within 5s"). Build to game days simulating regional failover.

**Key points:**
- Hypothesis-driven, not random
- Start small, expand to game days
- Tools: Chaos Mesh, Litmus, Gremlin, FIS
- Validates assumptions about resilience

---

### 100. Policy as code (OPA, Kyverno, Conftest)

**Frequency:** Low

**Question:** Explain policy as code. Cover (1) codifying org policy such as only signed images, required labels, or no privileged pods and enforcing it via admission control or CI, (2) the tooling contrast between OPA/Gatekeeper using Rego, Kyverno using YAML rules, and Conftest running OPA against structured files like Terraform plans, Dockerfiles, and manifests in CI, and (3) the shift-left principle of failing in the PR rather than at deploy, plus running in audit mode before enforce.

**Answer:** Codify org policy (only signed images, required labels, no privileged pods) and enforce via admission control or CI. OPA/Gatekeeper uses Rego; Kyverno uses YAML rules; Conftest runs OPA against any structured file in CI (Terraform plans, Dockerfiles, k8s manifests). Shift policy left: fail in PR rather than at deploy.

**Key points:**
- Kyverno (YAML) vs OPA/Gatekeeper (Rego)
- Conftest scans IaC/manifests in CI
- Shift-left: fail in PR
- Audit mode before enforce
