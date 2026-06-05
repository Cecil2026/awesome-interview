# Mock Interview: Design a Chat Application (WhatsApp / Slack)

**Type:** System Design
**Difficulty:** L5
**Duration:** 60 minutes (simulated)
**Tags:** #system-design, #realtime, #websockets, #message-queues, #fan-out, #presence

## Setup

The candidate is interviewing for a Staff-track L5 backend role at a messaging-adjacent company (think Slack, Discord, or a fintech that builds its own chat). The interviewer is a Principal Engineer who has shipped large-scale messaging systems before. The prompt was shared at the start of the round. The candidate is on a virtual whiteboard with the interviewer joining via video; the interviewer has a strong opinion about consistency models and is going to test the candidate's understanding of message ordering specifically.

## Transcript

**INTERVIEWER:** Today I'd like you to design a chat application — think WhatsApp or Slack. Take your time, ask whatever you need, and I'll dig in on whatever's interesting.

**CANDIDATE:** Cool. Let me start with scoping. There's a wide range here. Some clarifying questions: are we doing one-on-one chat, group chat, both? Voice and video calls? Just messaging? Mobile, desktop, web, or all of them?

**INTERVIEWER:** All clients — mobile, desktop, web. Messaging only — no voice or video for this round. Both one-on-one and group chats. Groups can be small or large; let's say up to 100K members for the largest.

**CANDIDATE:** Okay, that's a meaningful constraint. Large groups change the fan-out story significantly. What about features within messaging — typing indicators, read receipts, presence, message editing, threading, file attachments, search?

**INTERVIEWER:** All in scope, but prioritize: message delivery is must-have, presence and read receipts are important, typing indicators and edits are nice-to-have, attachments and search you can sketch. Threading we'll skip.

**CANDIDATE:** End-to-end encryption?

**INTERVIEWER:** Out of scope. Assume transport-level security only. We can talk about it at the end if there's time.

**CANDIDATE:** Scale numbers — how many users, how many messages per second?

**INTERVIEWER:** 500M MAU, 100M DAU. Make your own assumptions about messages per user per day.

**CANDIDATE:** *(thinks)* Active users send maybe 50 messages per day on average. So 100M * 50 = 5B messages per day, which is about 60K messages per second average. With a 5x peak factor — evenings in major time zones — call it 300K writes per second at peak.

**INTERVIEWER:** Reads?

**CANDIDATE:** Reads are more complicated. Every message sent is also read by the recipient — in a 1:1 that's 1 read per write. In a group, it's N reads per write where N is the group size. Most groups are small; the long tail has a few huge groups. Let's say average read amplification is 3x — so 900K reads per second at peak, but with hot spots at much higher rates.

**INTERVIEWER:** Distinguish between "read" as in delivered, and "read" as in displayed.

**CANDIDATE:** Good distinction. Delivered means the message lands on the recipient's device. Displayed means the user actually viewed it. Delivered is roughly 3x writes — every active conversation gets push delivery. Displayed is lower because not every recipient opens every message immediately. For history fetches — scrolling back to read older messages — there's a separate read pattern, much spikier per-user but lower aggregate volume.

**INTERVIEWER:** What's the storage like?

**CANDIDATE:** 5B messages a day, average size maybe 200 bytes including metadata. 1 TB per day, 365 TB per year. With history retained indefinitely and replication, we're looking at petabyte scale within a few years.

**INTERVIEWER:** Latency targets?

**CANDIDATE:** Message delivery — sender hits send to recipient sees it — I'd target p50 under 200ms and p99 under 1 second across regions. Typing indicators and presence can be looser — a few seconds is acceptable. Read receipts: under a second.

**INTERVIEWER:** Okay. What are you not designing for?

**CANDIDATE:** I'm not designing for voice/video, end-to-end encryption, federation with other chat networks, or fine-grained permissions on individual messages. And I'm assuming all clients trust the server — no MLS-style group encryption.

**INTERVIEWER:** Good. Let's see the API.

**CANDIDATE:** *(writes)*

```
WebSocket session:
  CONNECT /ws  (with auth token)
  -> server upgrades to WS, registers session

Client -> Server:
  SEND_MESSAGE { conversation_id, client_msg_id, body, type }
  MARK_READ { conversation_id, last_read_msg_id }
  TYPING { conversation_id, started: bool }
  PRESENCE { status: online | away | offline }

Server -> Client:
  MESSAGE { msg_id, conversation_id, sender_id, body, ts }
  READ_RECEIPT { conversation_id, user_id, last_read_msg_id }
  TYPING { conversation_id, user_id, started }
  PRESENCE { user_id, status }

REST (for fetches and management):
  GET /conversations
  GET /conversations/{id}/messages?before=...&limit=...
  POST /conversations (create)
  POST /conversations/{id}/members (add)
  DELETE /conversations/{id}/members/{user_id}
```

**INTERVIEWER:** Why WebSockets and not long-polling or SSE?

**CANDIDATE:** Bidirectional is the win. With SSE you'd still need a separate HTTP channel for client-to-server sends, which adds connection overhead and complicates ordering. Long polling works but has higher overhead and worse latency. WebSockets are the standard for this workload, and modern infra — including most LBs and CDNs — supports them.

**INTERVIEWER:** What about HTTP/3 server push or WebTransport?

**CANDIDATE:** WebTransport is cleaner long-term and avoids head-of-line blocking on a single TCP connection, but adoption and infra support are still maturing. I'd start with WebSockets and have a path to WebTransport later. We'd want to abstract the transport so swapping is contained.

**INTERVIEWER:** Tell me about `client_msg_id`. Why is that in the SEND request?

**CANDIDATE:** Idempotency. The client generates a UUID for each message before sending. If the send is retried — network blip, client reconnects — the server uses the client_msg_id to dedupe. Same UUID, same logical message, regardless of how many times it gets transmitted.

**INTERVIEWER:** And the server returns its own msg_id?

**CANDIDATE:** Yes. The server assigns a global or per-conversation msg_id that's used for ordering, history fetches, and references. The client_msg_id is the dedup key; the server msg_id is the canonical identifier going forward. The server's reply to SEND_MESSAGE includes both, so the client can reconcile.

**INTERVIEWER:** Good. Let's see the data model.

**CANDIDATE:** *(writes)*

```
users (
  user_id BIGINT PK,
  name VARCHAR,
  avatar_url TEXT,
  created_at TIMESTAMP,
  ...
)

conversations (
  conv_id BIGINT PK,
  type ENUM('direct', 'group'),
  name VARCHAR,
  created_at TIMESTAMP,
  ...
)

conversation_members (
  conv_id BIGINT,
  user_id BIGINT,
  joined_at TIMESTAMP,
  last_read_msg_id BIGINT,
  notification_settings JSONB,
  PRIMARY KEY (conv_id, user_id)
)

messages (
  conv_id BIGINT,
  msg_id BIGINT,           -- monotonic within conv
  sender_id BIGINT,
  body TEXT,
  type ENUM('text','image','file','system'),
  client_msg_id UUID,
  created_at TIMESTAMP,
  edited_at TIMESTAMP NULL,
  PRIMARY KEY (conv_id, msg_id)
)
```

**INTERVIEWER:** Why is msg_id per-conversation rather than global?

**CANDIDATE:** Two reasons. First, message ordering is a per-conversation concern — there's no meaningful order between messages in two unrelated conversations. Making the ID per-conversation means the ordering authority is local, not global. Second, it makes sharding trivial — partition by conv_id, and all of a conversation's messages live on one shard.

**INTERVIEWER:** Trade-off?

**CANDIDATE:** No global "give me message #12345" lookup — but we don't need one. Every reference to a message includes the conv_id, so the lookup is always (conv_id, msg_id).

**INTERVIEWER:** What kind of database?

**CANDIDATE:** Messages I'd put in a wide-column store — Cassandra or ScyllaDB. The access pattern is "get the last N messages in conversation X" or "get messages in conversation X before timestamp T," which is a perfect fit for a partition-key + clustering-key model. Partition by conv_id, cluster by msg_id descending. Write throughput is massive, and you scale by adding nodes.

**INTERVIEWER:** Why not Postgres with sharding?

**CANDIDATE:** Postgres would work, but at 300K writes/sec you'd need to shard aggressively, and you don't really benefit from transactions across conversations. Cassandra is purpose-built for this access pattern. The trade-off is consistency — Cassandra is eventually consistent by default. For chat, that's mostly fine; messages don't need strict global ordering.

**INTERVIEWER:** What about user and conversation metadata?

**CANDIDATE:** That's relational — Postgres. Lower write volume, benefits from transactions (especially for membership changes), and the data model is naturally relational.

**INTERVIEWER:** What's the write volume on Postgres?

**CANDIDATE:** Much lower than messages. New conversations, member adds/removes, profile updates, last_read updates. The chattiest is last_read — that scales with read activity. We'd debounce and batch on the client, plus aggregate in a write buffer before persisting. Sharded Postgres handles it comfortably.

**INTERVIEWER:** What's the per-message msg_id generator?

**CANDIDATE:** Per-conversation monotonic counter. Each conversation has its own counter that increments on every send. To avoid contention, you can let the conversation's owning shard host the counter and serialize SENDs through it. Or use a hybrid: a Snowflake-style ID where the timestamp prefix gives rough order and a sequence suffix breaks ties.

**INTERVIEWER:** Push back on "serialize SENDs through one shard." What about throughput on a very active conversation?

**CANDIDATE:** A single conversation processing thousands of messages per second is rare, but it does happen — think a popular Discord or Slack channel. *(thinks)* For those, we accept that the writes are serialized to one shard, but the shard can handle tens of thousands of writes per second. We bottleneck on the single-conversation throughput before we bottleneck on the shard.

**INTERVIEWER:** What if a single conversation exceeds shard capacity?

**CANDIDATE:** Then the per-conversation monotonic-counter assumption breaks. We'd switch that conversation to a relaxed model: msg_id is a Snowflake ID with timestamp prefix and node ID, ordering is by Snowflake comparison. We lose strict monotonicity but gain horizontal scale. We'd flag such conversations and route them differently — a "high-fanout" tier.

**INTERVIEWER:** *(scribbles)* Okay, sketch the high-level architecture.

**CANDIDATE:** *(draws)*

```
[Mobile/Desktop/Web Clients]
       |
       v (WebSocket)
[Edge LB / TLS Termination]
       |
       v
[WebSocket Gateway Tier] <----> [Session Registry (Redis)]
       |
       v
[Message Service]
   |        \
   |         \--> [Conversation Sharder]
   v
[Cassandra: messages]   [Postgres: users, conversations, members]
   |
   v
[Kafka: message bus]
   |
   +---> [Fan-out Service] --> [WebSocket Gateway delivery]
   +---> [Push Notification Service]
   +---> [Search Indexer (Elasticsearch)]
   +---> [Analytics Pipeline]
```

The WebSocket gateway is the only stateful tier — it holds the connection. Everything else is stateless and scales horizontally.

**INTERVIEWER:** Walk me through what happens when Alice sends a message in a group of 50 people.

**CANDIDATE:** Step by step. Alice's client has a WebSocket connection to gateway G1. She types a message, hits send. Her client emits SEND_MESSAGE with conversation_id and client_msg_id over the WebSocket.

G1 receives the SEND, validates the auth token, forwards it to the Message Service via gRPC. The Message Service looks up the conversation's owning shard, calls the per-conversation msg_id counter to get the next msg_id, writes the message to Cassandra. On successful write, it ACKs back to G1, which forwards an ACK to Alice's client. That's the send path — Alice's UI now shows the message as "sent."

Meanwhile, the Message Service publishes the message to Kafka, keyed by conv_id. The Fan-out Service consumes from Kafka, looks up the conversation's members — that's 50 user_ids — and for each, queries the Session Registry to find their current WebSocket gateway. It then pushes the message to each gateway, which delivers it over the open WebSocket to each connected client. For offline members, it triggers a push notification via APNs/FCM.

**INTERVIEWER:** Let me push back on something. You said the Message Service writes to Cassandra and then publishes to Kafka. What if the Cassandra write succeeds but the Kafka publish fails?

**CANDIDATE:** *(pauses)* That's the classic dual-write problem. The message is durably stored but never fans out. We'd want some kind of outbox pattern.

**INTERVIEWER:** Tell me more.

**CANDIDATE:** Two main approaches. One: write the message and an outbox entry in a single Cassandra batch — Cassandra batches within a partition are atomic — and have a separate process tail the outbox and publish to Kafka. Two: change-data-capture from Cassandra into Kafka via a tool like Debezium-equivalent. Both have the property that Kafka publish is downstream of the durable write.

**INTERVIEWER:** Which would you pick?

**CANDIDATE:** Outbox is simpler operationally — fewer moving parts than CDC, especially on Cassandra where CDC tooling is less mature than on Postgres. The trade-off is a small lag between write and publish, but for chat that's tens of ms.

**INTERVIEWER:** Okay. Now the inverse — what if Kafka publishes succeed but the Cassandra write fails?

**CANDIDATE:** With the outbox pattern that can't happen — Kafka publish is gated on a successful write to the outbox, which is in the same partition as the message. They commit together or not at all.

**INTERVIEWER:** Good. Let's go deeper on the Fan-out Service. 100K-member group. What happens?

**CANDIDATE:** *(thinks)* Naive fan-out: one message in, 100K member lookups, push to each. If every member is online, that's 100K WebSocket writes for one message. At our message rate, the fan-out service is doing a lot of work. We'd shard it by something — maybe by recipient user_id range — so each fan-out node handles a slice of the membership.

**INTERVIEWER:** What about the member list itself? Where does that live?

**CANDIDATE:** In Postgres for the source of truth, but cached aggressively. The fan-out service caches member lists in memory with TTL and pub/sub invalidation on changes. For a 100K-member group, the member list is maybe a few MB — fits in memory.

**INTERVIEWER:** What's the upper bound on a group? You said 100K. What if it's a million?

**CANDIDATE:** *(thinks)* At a million we're in broadcast territory — closer to a Twitch chat than a private group. The fan-out cost becomes prohibitive on the per-recipient model. We'd switch to a pull-based model for very large rooms: clients periodically poll for new messages, or subscribe via a pub/sub channel where the server doesn't have to know who's subscribed.

**INTERVIEWER:** Pull-based — what's the trade-off?

**CANDIDATE:** Higher latency for the recipient — instead of sub-second push, you're at the poll interval. Better for the server: it doesn't have to maintain per-recipient state for ultra-large rooms. The hybrid is to push for the first N hot members and pull for the long tail, or to use a fan-out tree where intermediate nodes fan out further.

**INTERVIEWER:** Which would you pick for 100K?

**CANDIDATE:** Push, but with optimizations. Specifically: only push to currently-connected members. For disconnected members, write to their unread queue and let them fetch on reconnect. That avoids 100K WebSocket pushes when realistically only a fraction are online and looking at the app right now.

**INTERVIEWER:** Where does the unread queue live?

**CANDIDATE:** Conceptually it's "messages where msg_id > last_read_msg_id for this conversation, this user." We don't materialize it as a separate queue — we derive it from the messages table and the conversation_members.last_read_msg_id field. When a client comes online and reconnects, it queries `GET /conversations/{id}/messages?since={last_read_msg_id}` to catch up.

**INTERVIEWER:** What's the alternative to deriving the unread queue? Should you materialize it?

**CANDIDATE:** You could — have a per-user inbox that stores message references. WhatsApp historically did something like that. The trade-off: materialized inboxes are simpler to fetch but expensive to write (every message creates N inbox writes). For our scale, derived-from-conversation is cheaper, since we're storing the message once and computing unread state from membership metadata.

**INTERVIEWER:** What does the cost difference look like?

**CANDIDATE:** Roughly proportional to group size. For a 100-member group, materialized inbox costs 100 writes per message, derived costs 1. At 300K msg/sec average with average group size 5 or so, materialized would be 1.5M inbox-writes/sec — workable but pricey. Derived is much cheaper and we already need to maintain `last_read_msg_id` per member anyway.

**INTERVIEWER:** Does materialized have other advantages?

**CANDIDATE:** Yes — fast cross-conversation queries. "Show me all unread messages across all my conversations" is one query on a materialized inbox; on derived, it's a fan-in across all my conversations. For a "unified inbox" UI, materialized is much better. We could maintain a hybrid: materialized for the top-N most recent conversations per user, derived for the rest.

**INTERVIEWER:** What about the WebSocket Gateway? How does it know where to send messages?

**CANDIDATE:** The Session Registry. When a client connects to a gateway, the gateway writes `(user_id, gateway_id, session_id)` to Redis. When the fan-out service needs to deliver a message to a user, it looks up the user's session(s) in Redis and forwards to the appropriate gateway(s).

**INTERVIEWER:** What if a user has multiple devices?

**CANDIDATE:** Multiple sessions per user. Each device gets its own session entry. The fan-out delivers to all sessions for that user. The Session Registry is keyed by user_id with a set of session entries.

**INTERVIEWER:** What if a message is delivered to one device but the user reads it from another? Do both devices know it's read?

**CANDIDATE:** Yes — when the user reads from device A, the client emits MARK_READ. The server updates last_read_msg_id and fans out a READ_RECEIPT to other sessions for the same user, plus to other participants in the conversation. All devices converge on the same read state within a second.

**INTERVIEWER:** What about reactions and edits — how do those propagate?

**CANDIDATE:** Same fan-out path. A reaction is a small message-like event: `(msg_id, user_id, emoji, action: add | remove)`. Fan-out delivers to the conversation members. Edits are similar — `(msg_id, new_body, edited_at)`. Clients apply the update to their local copy and re-render. We persist the latest version, and optionally an edit history for audit.

**INTERVIEWER:** What if a session is stale — the gateway crashed without cleaning up?

**CANDIDATE:** TTL on session entries with periodic heartbeat from gateways. If a gateway stops heartbeating, its sessions expire from the registry within a minute. When fan-out tries to deliver to a stale session, the gateway is gone, the push fails, fan-out drops the delivery for that session — the message is still in Cassandra, so the client picks it up on reconnect.

**INTERVIEWER:** *(scribbles)* Okay, let me dig into ordering. You said per-conversation monotonic msg_id. What ordering does the client see?

**CANDIDATE:** The client sees messages in msg_id order within a conversation. The server is the ordering authority — it assigns msg_ids in the order it processes SENDs.

**INTERVIEWER:** What if two senders in the same conversation hit send simultaneously, from different regions, and the messages take different paths through the system?

**CANDIDATE:** *(pauses)* The ordering is determined by which one the conversation's owning shard processes first. If Alice and Bob both send at the "same time," the shard assigns msg_ids in whatever order the requests arrive, which depends on network paths. There's no causal ordering — it's effectively "first to the shard wins."

**INTERVIEWER:** Is that okay for chat?

**CANDIDATE:** Mostly yes, with one caveat. If Bob's message is a reply to Alice's — "thanks for the link" — but Bob's message arrives at the shard first because his network is faster, then his "reply" gets a lower msg_id and is rendered before Alice's message. That's confusing.

**INTERVIEWER:** How would you fix it?

**CANDIDATE:** Vector clocks or causal metadata. The client includes the last msg_id it's seen in its SEND. The server, on receiving Bob's SEND with `last_seen_msg_id = X`, ensures Bob's message is ordered after X. If Alice's message already has msg_id > X, Bob's message gets msg_id > Alice's.

**INTERVIEWER:** What does that actually look like at the storage layer?

**CANDIDATE:** Bob's SEND arrives, server sees `last_seen = X`. Server queries the latest msg_id in the conversation — say it's now Y > X because Alice's message arrived first. Server assigns Bob's message msg_id Y+1. So the causal happens-before is preserved.

**INTERVIEWER:** What if Bob's `last_seen = X` is actually quite stale — he hasn't synced in a while — and there are 1000 newer messages?

**CANDIDATE:** The constraint is still satisfied: Bob's message gets msg_id = current_max + 1 = 1000 + X + 1. We're not delaying it — just making sure it's later than what he saw. That's fine.

**INTERVIEWER:** What about total ordering across conversations? Does that matter?

**CANDIDATE:** Not really. The user's UI shows conversations in last-message-timestamp order, which is loose. Within a conversation, we have per-conversation ordering. Across conversations, time-based ordering is good enough, and clock skew of a few seconds is acceptable for UI purposes.

**INTERVIEWER:** Good. Let's talk about delivery guarantees. What guarantees do you provide?

**CANDIDATE:** At-least-once delivery to each recipient, plus exactly-once visible delivery via dedup at the client. The flow: server commits message to Cassandra, fan-out pushes to recipient gateway, gateway pushes to client. If the client's WebSocket is closed mid-push, the message is lost in transit but still in Cassandra — on reconnect, the client fetches from where it left off.

**INTERVIEWER:** What does "exactly-once visible" mean exactly?

**CANDIDATE:** The user sees each message exactly once. The system might deliver the same message multiple times across reconnect/retry attempts, but the client deduplicates by server msg_id before rendering.

**INTERVIEWER:** What if the client never sees the message? Network partition, app crashes, etc.

**CANDIDATE:** The message is durable in Cassandra. When the client reconnects and asks for messages since last_read, it gets the message. As long as the server's view of "received" is gated on durable storage, the message can't be silently dropped.

**INTERVIEWER:** What about ACKs from the client back to the server — do you track delivery state?

**CANDIDATE:** Yes. The client ACKs receipt of each message over the WebSocket. The server records "delivered_at" per (user_id, msg_id) — either as a sparse Cassandra column or in a separate delivery_status table. This drives the single-check vs double-check status indicators users see, like WhatsApp's gray/blue ticks. Volume is significant — one ACK per recipient per message — so we'd batch ACKs client-side and persist in coarse strokes.

**INTERVIEWER:** What about offline-to-online transitions — backfill ordering?

**CANDIDATE:** Client requests messages since last_read_msg_id, gets them in msg_id order, applies in order. If the user is in many conversations, we'd page or prioritize: fetch the conversations the user is actively viewing first, then backfill the rest.

**INTERVIEWER:** When does the client update last_read?

**CANDIDATE:** When the user actually views the message. The client emits MARK_READ with the highest msg_id viewed. The server updates `conversation_members.last_read_msg_id` and fans out a READ_RECEIPT to other participants who care.

**INTERVIEWER:** How often do you persist MARK_READ?

**CANDIDATE:** Debounce on the client — say, batch read updates over 1-2 seconds, then send. Don't fire one MARK_READ per message; that's wasteful at scroll speed. The server batches the write to Postgres, since we're updating one row per conversation.

**INTERVIEWER:** Good. Let's talk about presence. How do you know if Alice is online?

**CANDIDATE:** Presence is derived from active WebSocket connections plus client-emitted state. When Alice's WebSocket connects, the gateway publishes a presence-update event. When it disconnects — clean or stale — presence reverts to offline after a grace period. Clients can also emit PRESENCE with explicit status — away, do-not-disturb.

**INTERVIEWER:** Where does the presence state live?

**CANDIDATE:** Redis, keyed by user_id, with TTL. Updates come from gateway connect/disconnect events. Reads come from clients subscribed to a user's presence.

**INTERVIEWER:** How does a client subscribe to a user's presence?

**CANDIDATE:** When a client opens a conversation, it implicitly subscribes to presence for the other members. The server registers the subscription and pushes presence updates to the subscriber whenever the target user's status changes.

**INTERVIEWER:** Scale check — how many subscriptions are there?

**CANDIDATE:** Each user is interested in maybe 100 contacts. With 100M DAU that's 10B subscriptions globally. We don't materialize all of those — we lazily subscribe only when a client opens a relevant view. Active subscriptions are more like 100M-1B at peak, which is manageable across a few thousand presence servers.

**INTERVIEWER:** What about presence for a 100K-member group?

**CANDIDATE:** *(thinks)* That's expensive. We wouldn't push presence updates for all 100K members. Instead, we'd show aggregate stats — "23,000 online" — computed periodically. Or only push presence for members the user has interacted with recently. For pure scale, we'd cap presence visibility in large groups.

**INTERVIEWER:** How do you handle a user with thousands of contacts in their roster?

**CANDIDATE:** Lazy subscription as I mentioned, plus paging. The user's UI only shows a small number of contacts at once — top of the contact list, currently open chats. We subscribe to presence for visible contacts and unsubscribe when they scroll out of view or the chat closes. Presence updates for the unsubscribed bulk are not pushed; on next open, we fetch a snapshot.

**INTERVIEWER:** What's the snapshot fetch look like?

**CANDIDATE:** `GET /presence?user_ids=[...]` returns current status for a batch. The Redis lookup is fast — 100 keys is sub-millisecond. We'd cache the snapshot client-side for a few seconds to avoid hammering on rapid UI scroll.

**INTERVIEWER:** Typing indicators?

**CANDIDATE:** Same idea but ephemeral. Client emits TYPING(started=true) when the user starts typing, TYPING(started=false) on stop or after a timeout. Server fans out to the same audience that would receive a message. No persistence — typing events don't go to Cassandra. They might not even go through Kafka — just direct gateway-to-gateway via a pub/sub channel for ultra-low latency.

**INTERVIEWER:** What's the bandwidth cost of typing indicators?

**CANDIDATE:** Significant if naive. If everyone in a 100K group is told who's typing, you'd have absurd fan-out. We cap typing indicator fan-out: only show in 1:1 and small groups, hide in large rooms.

**INTERVIEWER:** What's the cutoff?

**CANDIDATE:** Heuristic. Maybe show in groups up to 20-50 members. Above that, the typing indicator becomes noise — many people typing simultaneously and the UI can't represent it usefully anyway. We'd verify with product analytics; this is a UX call as much as an engineering one.

**INTERVIEWER:** *(checks clock)* Okay. Push notifications. Tell me how those work.

**CANDIDATE:** Server-side: a Push Notification Service consumes from Kafka — same topic as fan-out, or a derived one filtered to messages where any recipient is offline. For each offline recipient, it constructs a push payload and dispatches via APNs (iOS) or FCM (Android). The clients then receive the push via the OS, which wakes the app or shows a notification.

**INTERVIEWER:** How do you know who's offline?

**CANDIDATE:** Cross-reference with the Session Registry. A user is offline if they have no active sessions. We send the push regardless if all their sessions are background/idle, since the WebSocket might be open but the user not paying attention.

**INTERVIEWER:** What if the user is online on desktop but offline on mobile?

**CANDIDATE:** Push to mobile, suppress (or send silently) to desktop where the WebSocket already delivered. Per-device session tracking lets us route this correctly.

**INTERVIEWER:** What if the push fails — token expired, APNs rate-limited, etc.?

**CANDIDATE:** Retry with backoff for transient errors. For token-expired, mark the token invalid in the user's profile and stop sending to it. For rate limits, queue and slow down. We'd also have a separate path: when the user reopens the app, fetch unread messages from the server even without a push.

**INTERVIEWER:** What about notification batching? If I get 50 messages while away, do I get 50 pushes?

**CANDIDATE:** No, that's terrible UX. We batch on the server side: per-recipient, per-conversation, with a short collapse window. If we send a push and another message arrives in the same conversation within, say, 5 seconds, we update the push payload instead of sending a new one. APNs and FCM both support payload-replacement via collapse keys. The user sees "Alice sent you 3 messages" rather than three separate banners.

**INTERVIEWER:** What about badge counts on iOS?

**CANDIDATE:** Maintained server-side per user. Each push includes the current unread count. When the user reads messages, the client sends MARK_READ; the server updates the unread count and pushes a silent badge-only update so the badge clears on other devices too.

**INTERVIEWER:** What about Do Not Disturb / quiet hours?

**CANDIDATE:** Per-user settings stored in Postgres. The Push Notification Service checks them before dispatch. During quiet hours, we either drop the push entirely, send it silently (no banner, but the message is still delivered), or save it for a digest at the end of the quiet period. User preference dictates.

**INTERVIEWER:** Let's switch to media. How do file attachments work?

**CANDIDATE:** Out-of-band. The client uploads the file to a blob store — S3 or equivalent — via a presigned URL. The blob store returns a content URL. The client then sends a MESSAGE with `type=image` (or file, etc.) and the URL as the body or attachment field. Recipients see the URL and fetch the content directly from the blob store.

**INTERVIEWER:** Why out-of-band?

**CANDIDATE:** Two reasons. One, message channels are optimized for small frequent messages, not multi-MB blobs. Sending a 50MB video through the message bus would hammer Kafka and the message storage layer. Two, blob stores have features we want — content-addressable storage, CDN integration, lifecycle policies — that we don't want to reimplement.

**INTERVIEWER:** What about thumbnails or transcoded versions?

**CANDIDATE:** A separate Media Processing Service. Triggered on upload — S3 event notification or a Kafka topic the blob upload publishes to. The service generates thumbnails, transcodes video, extracts EXIF, and updates the message metadata with derived URLs. Recipients see thumbnails first and load the full file on demand.

**INTERVIEWER:** What if the upload finishes after the message is sent?

**CANDIDATE:** Order matters. Client uploads first, gets the URL, then sends the message referencing the URL. If the upload fails, the message is never sent. If the upload succeeds but the send fails, the blob is orphaned and gets garbage-collected by a lifecycle policy.

**INTERVIEWER:** Could you optimistically display the message before upload completes?

**CANDIDATE:** Yes — client shows a "uploading" placeholder, with local data. When upload completes and the SEND succeeds, the placeholder is replaced with the real message reference. Other recipients don't see anything until the SEND lands. That's standard UX for chat apps with media.

**INTERVIEWER:** What about media access control? Can a non-member fetch the blob?

**CANDIDATE:** Without ACLs, presigned URLs gate access. But presigned URLs are bearer tokens — anyone with the URL can fetch. For sensitive content, use short-lived presigned URLs (1-hour TTL) and re-sign on each access by authenticated members. Better: a media-proxy service that checks authorization before serving the blob. Pricier but private.

**INTERVIEWER:** Search?

**CANDIDATE:** Async indexing. The Search Indexer consumes from Kafka and writes to Elasticsearch — index per user or per conversation, depending on access patterns. For privacy reasons, indexes should be per-user scoped: a user's search index includes only conversations they're a member of. We have to handle member adds/removes — when a user joins a conversation, do they get backfilled search? Usually no; only new messages are searchable.

**INTERVIEWER:** Why per-user instead of per-conversation?

**CANDIDATE:** Two reasons. One, security trimming — searches must only return messages the user is allowed to see; per-user indexes enforce that by construction. Two, query performance — a user's search hits one index, not a fan-in across many conversations. The downside is index duplication: a message in a 50-member group lives in 50 indexes. We accept the storage cost for the access-pattern win.

**INTERVIEWER:** Could you do per-conversation with security trimming at query time?

**CANDIDATE:** Yes — single index per conversation, query joins membership info to filter. Less storage, more query complexity, and worse query latency for users with lots of conversations. We'd pick based on the read pattern. For consumer chat where most users search rarely, per-conversation might be fine. For Slack-style workplace search where it's a primary feature, per-user pays off.

**INTERVIEWER:** What's the index size?

**CANDIDATE:** With 1 TB/day of message data, the index is similar size — maybe smaller after compression and term indexing. We'd shard the index by user_id or conversation_id and use Elasticsearch's built-in sharding.

**INTERVIEWER:** What's the search latency?

**CANDIDATE:** P99 under a second for a typical query. Elasticsearch is fast for keyword queries; full-text relevance ranking adds some cost.

**INTERVIEWER:** Sort by what?

**CANDIDATE:** Default by relevance (BM25), with options to sort by recency or pin within a specific conversation. We'd also support filters: sender, date range, has-attachment, conversation. Each filter is a standard Elasticsearch term query.

**INTERVIEWER:** What about deletion? If a user deletes a message, does it disappear from search?

**CANDIDATE:** Yes — we publish a delete event to the Search Indexer, which removes the doc from the index. Soft-delete first (mark deleted but keep for a grace period in case of accidental delete), then hard-delete after, say, 30 days. The indexer respects the same lifecycle.

**INTERVIEWER:** *(scribbles)* Alright. Let's go deep on one more area. Pick: WebSocket gateway scaling, or message storage at petabyte scale. Your choice.

**CANDIDATE:** Let's do WebSocket gateway. It's the most operationally interesting because it's stateful.

**INTERVIEWER:** Go.

**CANDIDATE:** Each gateway is a server holding open WebSocket connections. Connection count per server is bounded by file descriptors, memory, and CPU. With careful tuning — Linux kernel settings, efficient WS library — a single gateway can hold 100K-500K connections. Let's say 200K per gateway as a planning number.

For 100M concurrent users at peak, that's 500 gateway servers. Across 3-5 regions for latency, call it 100-200 per region.

**INTERVIEWER:** How do clients find a gateway?

**CANDIDATE:** Geo-DNS routes to the nearest region. Within a region, an L4 LB distributes new connections to gateways. The LB can be sticky on client IP if we want predictability, but it doesn't have to be — the Session Registry handles routing per-connection.

**INTERVIEWER:** What if a gateway is at capacity?

**CANDIDATE:** Health check fails or shed connections. The LB stops sending new connections; existing connections stay. We autoscale by adding gateway capacity when connection count approaches a threshold.

**INTERVIEWER:** What's the failure mode if a gateway crashes?

**CANDIDATE:** All connections on it drop. Clients detect via WebSocket close, reconnect. The LB routes to a different gateway. On reconnect, the client fetches any messages it missed during the disconnect window via REST. Total user impact: a few seconds of "reconnecting" UI, no message loss.

**INTERVIEWER:** What's the reconnect storm look like at 200K connections?

**CANDIDATE:** Bad if naive. 200K clients all reconnecting simultaneously is a thundering herd. Mitigations: clients use jittered exponential backoff — random delay between, say, 100ms and 5s before reconnecting. The remaining gateways absorb the load gradually. We'd also pre-provision capacity so the surviving gateways have headroom.

**INTERVIEWER:** What's the headroom number?

**CANDIDATE:** Plan for N+2 — if any two gateways can be down simultaneously, the rest absorb the load. For 200K connections per gateway and 100 gateways, that's 200K extra to spread across 98 — about 2% headroom each. We'd plan for more like 20-30% headroom to handle multiple failures or unexpected spikes.

**INTERVIEWER:** What about graceful shutdown for deploys?

**CANDIDATE:** Drain mode. Gateway stops accepting new connections, signals existing clients to reconnect — server-initiated graceful close with a "please reconnect" code. Clients move to other gateways. The shutting-down gateway waits for connections to drain or hits a timeout, then terminates.

**INTERVIEWER:** What's the deploy timeline?

**CANDIDATE:** Rolling: shut down 5% of gateways at a time, wait for connections to migrate, deploy new version, bring back up, repeat. At our scale a full fleet roll is maybe 30-60 minutes.

**INTERVIEWER:** What if the new version has a bug and all the reconnecting clients crash it?

**CANDIDATE:** *(thinks)* That's the thundering herd on deploy. We'd want canary deploys: roll out to 1% of gateways, watch for connection spike behavior, then expand. We could also rate-limit reconnects at the LB during deploys.

**INTERVIEWER:** Good. What about cross-region for the gateway?

**CANDIDATE:** Clients connect to their nearest region. The gateway in region A might need to deliver a message from a user whose session is on a gateway in region B. Two options: route the message cross-region via the fan-out service to the target region's gateway, or have a single global Session Registry that all regions consult.

**INTERVIEWER:** Which?

**CANDIDATE:** Both, in layers. Per-region Session Registry with most lookups local — for users whose contacts are mostly in the same region, fan-out is local. For cross-region targets, the fan-out service forwards via a Kafka topic mirrored to the target region, or via a direct gRPC call to the target region's fan-out service.

**INTERVIEWER:** Replication of the Session Registry?

**CANDIDATE:** Per-region Redis with cross-region replication for cross-region lookups. Most users only chat with people nearby, so cross-region traffic is a small percentage. The replication can be async — a few hundred ms of staleness on cross-region presence is fine.

**INTERVIEWER:** What about message delivery to a user whose session moved regions?

**CANDIDATE:** Race condition risk: user disconnects from region A, reconnects in region B, fan-out in region A still has stale session info, pushes to a gateway that no longer has the connection. The push fails, fan-out drops, message is lost from the push path — but still in Cassandra. The client fetches it on next sync. The delivery is delayed but not lost. To reduce the delay, we'd add a "push failed, try alternate region" retry, which checks the global registry.

**INTERVIEWER:** That's expensive though if it happens often.

**CANDIDATE:** Right — so we'd cache the "last known region" per user and check global only on failure. Stable users (most users) hit the cache; mobile users moving between cell towers might trigger cross-region lookups occasionally. The cost is bounded.

**INTERVIEWER:** *(checks clock)* Okay. Failure scenarios. The whole Cassandra cluster goes down. What happens?

**CANDIDATE:** Writes fail. The Message Service can't acknowledge SENDs because we can't durably persist. The send fails fast — client sees an error, retries with backoff. Reads: recent messages are in app/client cache; older history fetches fail.

**INTERVIEWER:** What's the blast radius?

**CANDIDATE:** Total — no messaging works. We'd want multi-region Cassandra with active replication, so a single-region outage doesn't take down the world. Cross-region Cassandra is well-supported; we'd configure replication factor 3 in each region with `LOCAL_QUORUM` writes for low latency.

**INTERVIEWER:** What about during failover?

**CANDIDATE:** With LOCAL_QUORUM, a single AZ failure within a region doesn't block writes. A full region failure means clients route to other regions, but their data — including conversation membership — needs to be available there. That requires cross-region replication on the Postgres side too, which is harder.

**INTERVIEWER:** Why harder?

**CANDIDATE:** Postgres doesn't have native multi-master across regions like Cassandra does. We'd use logical replication and accept eventual consistency, or use a globally-distributed SQL like CockroachDB or Spanner-equivalent for the metadata. Adds complexity but is the right call at this scale.

**INTERVIEWER:** How do you handle the metadata update for new conversations across regions?

**CANDIDATE:** When a user creates a conversation, the membership and metadata get written to the local region's Postgres, then replicated asynchronously. If a member in another region tries to send to the new conversation before replication completes, they get a "conversation not found" error briefly. We mitigate by routing the initial messages through the originating region until replication catches up, or by including the metadata snapshot inline with the first cross-region message.

**INTERVIEWER:** What about message ordering across regions if Cassandra is multi-master?

**CANDIDATE:** That's where it gets tricky. If Alice in region A and Bob in region B send messages to the same conversation simultaneously, both Cassandras assign their own clustering keys and replicate. Conflict resolution depends on the schema — for messages, since each row has a unique (conv_id, msg_id), we'd ensure msg_ids are globally unique by encoding the region into the high bits, similar to Snowflake. Then both messages coexist, ordered by msg_id.

**INTERVIEWER:** Is the resulting order what users expect?

**CANDIDATE:** Approximately — it's timestamp-based plus a region tiebreaker. There's no causality preservation across regions without explicit happens-before tracking. For chat, we accept that interleavings within a few hundred ms are non-deterministic.

**INTERVIEWER:** *(scribbles)* Let me go back to something. You mentioned per-conversation counter. That's per-region or global?

**CANDIDATE:** In a multi-region model, per-region per-conversation counter, plus region encoding to make msg_ids globally unique. We give up strict global monotonicity for performance.

**INTERVIEWER:** Does that affect history fetch?

**CANDIDATE:** History fetch becomes "give me all messages where msg_id > X, sorted by msg_id." With Snowflake-style IDs, the sort approximates causal order. Recent messages from different regions might interleave by region tiebreaker, but that's visually fine.

**INTERVIEWER:** Okay. End-to-end encryption — quick word on it since we have time?

**CANDIDATE:** Sure. With E2EE, the server is a cipher-text relay; it can't read message content. That breaks server-side features: no search, no message moderation, no fan-out optimization based on content. Standard approach is Signal Protocol or MLS for groups. For groups, MLS scales better than Signal because group key management is logarithmic in members.

**INTERVIEWER:** Why logarithmic?

**CANDIDATE:** MLS uses a tree-based key structure — each member is a leaf, internal nodes hold shared secrets along the path. Adding or removing a member updates O(log N) tree nodes instead of pairwise sessions for each pair. For a 100-member group, that's about 7 updates instead of 100. For 100K-member groups, MLS is the only practical option for E2EE.

**INTERVIEWER:** How does that affect storage?

**CANDIDATE:** Message bodies are ciphertext blobs from the server's POV. Same schema, smaller server-side capabilities. Metadata — sender, conversation, timestamp — is still visible unless we add metadata protection layers like sealed-sender.

**INTERVIEWER:** Search?

**CANDIDATE:** Client-side index, or no search. Some implementations sync messages to the client and let the client search locally. That works for one-device users; multi-device is awkward.

**INTERVIEWER:** *(checks clock)* Five minutes. What would you add if you had more time?

**CANDIDATE:** A lot. *(thinks)* One: a proper offline-first client architecture with local-first storage and sync — IndexedDB on web, SQLite on native — so the client always has data even with bad connectivity. Two: message reactions and threading, which fold into the schema reasonably but have their own fan-out and notification semantics. Three: federation — interop with other chat networks via Matrix or XMPP, which is a whole architectural layer. Four: anti-spam and abuse detection — both ML-based content scanning (for non-E2EE channels) and behavior-based signals (rapid-fire sends, account age, etc.). Five: compliance — message retention policies, legal hold, deletion workflows for GDPR.

**INTERVIEWER:** Pick one and tell me how you'd start.

**CANDIDATE:** Offline-first client. The principle: every UI action is first applied to local state, then synced. We'd have a local message log with optimistic UI — when Alice sends a message, it appears immediately as "sending," local SQLite stores it with a `pending` flag. The sync layer pushes to the server, updates the local record when ACK arrives. If offline, the message stays `pending` until the connection comes back.

For read state, the local model is authoritative — what the user has actually seen. The server is a coordinator for cross-device sync. When the client comes online, it pushes its local read-state deltas and pulls the server's. Conflicts — same conversation read from two devices with different last-read positions — resolve to max(local, server).

**INTERVIEWER:** Good. Okay, we're at time. Thanks for working through this.

**CANDIDATE:** Thanks. I always enjoy the chat design problem — it has so many layers.

## What went well

- Methodical clarification phase: nailed down message vs voice/video, group size limits, E2EE scope, and presence semantics before designing anything.
- Confident handling of the dual-write problem (Cassandra + Kafka). Reached for outbox pattern by name and explained the alternative (CDC).
- Strong response on per-conversation vs global ordering. Recognized the causality issue with simultaneous sends and proposed last-seen-msg-id propagation cleanly.
- Adjusted the fan-out design for very large groups (100K+) without overcommitting — switched to push-for-online + pull-on-reconnect rather than insisting on universal push.
- Articulated multi-region trade-offs concretely: per-region msg_id encoding, LOCAL_QUORUM, async cross-region replication for Postgres.
- Bonus points for treating the WebSocket gateway as the only stateful tier and giving the deployment story (drain, canary, thundering herd).

## What could've been stronger

- The initial msg_id design hand-waved contention on hot conversations. Only when pushed did the candidate switch to Snowflake-style IDs for the high-fanout tier. Worth raising proactively.
- Presence at scale was solved decently but could have been more rigorous on subscription churn — what happens when a user closes one conversation and opens another, churn on registry.
- Push notifications could have addressed quiet hours, notification grouping, and badge counts more explicitly. These are real product concerns at chat scale.
- Mentioned MLS for E2EE group keys but didn't explain why it scales better than Signal — a stronger candidate would have noted the logarithmic key-update cost vs Signal's pairwise sessions.
- Search was scoped narrowly — didn't address relevance ranking, security trimming on indexes, or attachment indexing (OCR, file content).

## Key takeaways

- Per-conversation sharding is the right primitive for chat — all of a conversation's writes serialize on one shard, ordering is local, and scale comes from many shards in parallel.
- Use the outbox pattern (or CDC) to avoid the dual-write problem when a single user action requires both a durable write and a downstream publish.
- For very large groups, mix push (online recipients) with pull (offline + late joiners). Don't try to push to everyone always.
- The WebSocket gateway is the only stateful service. Treat it carefully: heartbeats, drains, canary deploys, regional pinning.
- Causal ordering needs explicit tracking — last-seen-msg-id propagation, vector clocks, or accept that simultaneity is non-deterministic.
- Media goes out-of-band via blob storage and CDN. Don't push 50MB videos through the message bus.

## Reference architecture

```
                            +-------------------------+
                            |   Mobile / Web / Desk   |
                            +-----------+-------------+
                                        |
                                  WebSocket (TLS)
                                        |
                                Geo-DNS / Anycast
                                        |
                  +---------------------+---------------------+
                  |                                           |
       +----------v----------+                    +-----------v----------+
       |      Region A       |                    |       Region B       |
       |                     |                    |                      |
       |  [L4 LB]            |                    |   [L4 LB]            |
       |     |               |                    |      |               |
       |  [WS Gateway pool]  |<---heartbeats--->  |   [WS Gateway pool]  |
       |     |               |                    |      |               |
       |     +-> [Session Registry (Redis)] <-replicate-> [Session Reg]  |
       |     |                                    |      |               |
       |  [Message Service] -gRPC-+               |   [Message Service]  |
       |     |                    |               |      |               |
       |  [Conversation Sharder]  |               |   [Conv Sharder]     |
       |     |                    |               |      |               |
       |  [Cassandra (RF=3)] <----+---xregion-----+-> [Cassandra (RF=3)] |
       |     |                                    |      |               |
       |  [Postgres (metadata)] <----replicate----+-> [Postgres]         |
       |     |                                    |      |               |
       |  [Kafka] -+                              |   [Kafka] -+         |
       |     |     |                              |      |     |         |
       |     |     +---> [Fan-out Service]        |      |     +-> [Fan-out]
       |     |     +---> [Push Notif Service] --> APNs/FCM                |
       |     |     +---> [Search Indexer] --> [Elasticsearch]            |
       |     |     +---> [Media Processor] --> [S3 + CDN]                |
       |     |                                                            |
       +-----+------------------------------------+----------------------+
             |                                    |
             +------ outbox sync / Kafka mirror --+
```

Key numbers:
- 100M DAU, 300K msg/sec peak, 1 TB/day storage growth
- 200K WebSocket connections per gateway, 500-1000 gateways
- Per-conversation msg_id, Snowflake-style for high-fanout tier
- LOCAL_QUORUM Cassandra writes, async cross-region for Postgres
- Per-region Session Registry with cross-region pub/sub
- Outbox pattern for message -> Kafka publish

Hot-path latency budget (1:1 same-region):
- WS send -> gateway: ~10ms client-to-edge
- Gateway -> Message Service: ~1ms
- Cassandra write (LOCAL_QUORUM): ~5-15ms
- Fan-out lookup + push: ~5-10ms
- Recipient gateway -> client: ~10ms
- Total: ~30-50ms p50, ~150-300ms p99
