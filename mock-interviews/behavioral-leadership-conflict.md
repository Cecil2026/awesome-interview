# Mock Interview: Behavioral — Leadership, Conflict, and Influence

**Type:** Behavioral
**Difficulty:** L6 (Staff Engineer)
**Duration:** 60 minutes (simulated)
**Tags:** #behavioral, #STAR, #leadership, #conflict, #failure, #influence

## Setup

The candidate is interviewing for a Staff Engineer role at a mid-sized tech company. This is the hiring manager loop — a 60-minute behavioral round with the engineering director who would be the candidate's skip-level manager. The interviewer's job is to probe leadership signals at the L6 bar: scope of impact, ability to drive cross-team work, judgment under ambiguity, willingness to disagree thoughtfully, and capacity to grow from failure. The interviewer is taking handwritten notes and following a rough script with five themes; the order may flex based on what threads open up.

## Transcript

**INTERVIEWER:** Thanks for making time. I want to use most of our hour going deep on a few stories — I'll ask follow-ups, sometimes a lot of them, so don't feel like one question should be a 10-minute answer. Sound good?

**CANDIDATE:** Sounds great.

**INTERVIEWER:** Let's start here. Tell me about a time you led a team through a difficult project. I'm looking for the situation, what made it difficult, and what you actually did.

**CANDIDATE:** Sure. About 18 months ago I was the technical lead on a project to migrate our payment processing from a third-party vendor to an in-house service. The business driver was cost — we were paying about $4M/year in vendor fees that we believed we could cut in half. The complication was that our payment surface was already heavily integrated: 47 services depended on the vendor's SDK, and our compliance posture had been built around their PCI scope.

**INTERVIEWER:** How big was the team?

**CANDIDATE:** Six engineers reporting to two different managers, plus dotted-line involvement from security and compliance. I was the only person spending 100% of my time on it; everyone else was 50% or less.

**INTERVIEWER:** What made it difficult?

**CANDIDATE:** Three things. One, we couldn't have downtime on payments — every minute of disruption costs us real money. Two, the migration touched code we didn't own. The 47 service teams each had their own roadmaps and didn't love being asked to do work for someone else's project. Three, the deadline was tied to a vendor contract renewal — if we missed it, we'd auto-renew at a higher rate for another year.

**INTERVIEWER:** What did you do? Walk me through the actual decisions.

**CANDIDATE:** I started by mapping the dependency graph. Took about two weeks — I literally went service by service, read code, talked to maintainers. By the end I had a directed graph showing which services called payment, what surface area they used, and how complex the migration would be per service. That gave me three buckets: trivial (just an SDK swap), moderate (some logic changes), and hairy (deeply integrated, would need redesign).

**INTERVIEWER:** What did the graph actually look like?

**CANDIDATE:** Twenty-three services were trivial — simple SDK swap, maybe a day each. Eighteen were moderate — some required handling new error semantics, a few used vendor-specific features we'd need to reimplement. Six were hairy. Two of those six were our checkout flow and our subscription billing service, which between them handled 90%+ of payment volume.

**INTERVIEWER:** Then?

**CANDIDATE:** Then I made a sequencing call that turned out to be the most important decision of the project. The natural instinct was to start with trivial migrations because they're fast wins. I argued for starting with the hairy ones.

**INTERVIEWER:** Why?

**CANDIDATE:** Because the hairy services were where we'd discover the requirements gaps. If our in-house payment service couldn't handle some weird flow they used, I wanted to find that out in month one, not month nine. The trivial ones would migrate themselves once the new service was solid; if we burned the calendar on them first, we'd hit the hairy ones late and panic.

**INTERVIEWER:** How did that go over with the team?

**CANDIDATE:** Mixed. Two engineers pushed back hard — they wanted to ship something visible early to build credibility with leadership. I sympathized, but I held the line. We compromised: we picked two of the hairy services to start and added one trivial one for momentum.

**INTERVIEWER:** What happened?

**CANDIDATE:** The compromise turned out to be right. The hairy services surfaced two requirements gaps in our new service that forced design changes — one was about partial refunds with split tender, the other was about webhook ordering. Both would have been three-week reworks if we'd found them in month eight. We caught them in month two.

**INTERVIEWER:** What was the outcome?

**CANDIDATE:** We hit the deadline. All 47 services migrated, zero customer-facing incidents in production, and we beat the cost projection — actually saved about $2.4M annualized vs the $2M estimate, because we also retired some adjacent infrastructure during the migration.

**INTERVIEWER:** Zero incidents on a 47-service migration is unusual. How did you actually achieve that?

**CANDIDATE:** Shadow traffic from day one. Once the new service had even a partial API surface, we mirrored production read traffic to it and compared responses against the vendor's. Any divergence triggered an alert and a triage. We caught hundreds of subtle behavioral differences this way — things like rounding differences in fee calculations, timezone handling in webhook timestamps — that would have been incidents in production.

**INTERVIEWER:** Did the engineers buy in to that level of rigor?

**CANDIDATE:** They did, but it took a conversation. Shadow comparison adds latency to every change and creates a lot of noise early — most divergences in week one are "yes we know, we haven't implemented that yet." Some engineers wanted to skip it for features they were confident about. I held the line on running it for everything. It paid off three months in, when we caught a divergence in refund logic that nobody had thought to look at.

**INTERVIEWER:** Good. Few follow-ups. The two engineers who pushed back — how did you actually handle them in the moment?

**CANDIDATE:** I asked them to walk me through what they were worried about. One was worried about morale — early visible wins help the team feel like they're shipping. The other was worried about leadership perception — if we went two months without a visible deliverable, would the project get killed?

**INTERVIEWER:** Were they right?

**CANDIDATE:** Partially. The morale concern was real. The leadership concern I thought was a misread — leadership knew this was a multi-quarter project and wouldn't pull the plug at month two. But the morale piece was legitimate. So I integrated it: we started with two hairy services AND we set up a weekly "progress radar" that the team could rally around, even if no service had fully migrated yet. The radar showed the gap discoveries, the API stability improvements, the design decisions made. It made the invisible work visible.

**INTERVIEWER:** Did the pushback ever become a problem after the decision was made?

**CANDIDATE:** Not from one of them. The other one stayed grumpy for a while — I think he felt his judgment had been overridden. I addressed it directly in our next 1:1. I told him that I valued his perspective and the morale point genuinely shaped what we did, and I asked what he'd want me to do differently next time. He said he'd have wanted me to bring the decision to the team rather than presenting a conclusion. He was right — I had decided, then sought input, instead of inviting input on an open question. I changed how I ran the next big decision.

**INTERVIEWER:** That's good self-awareness. What would you do differently if you ran this project again?

**CANDIDATE:** *(thinks)* Two things. First, I'd invest more in the cross-team communication earlier. I underestimated how much the 47 service teams hated being asked to do work for our project, even though I'd done all the dependency analysis myself. Some teams felt blindsided when their migration came up in the schedule, because they hadn't been looped in early enough. I should have spent the first month doing rounds with each team, not just reading their code.

**INTERVIEWER:** Second?

**CANDIDATE:** I'd push back on the contract-renewal deadline. I treated it as fixed, but in retrospect, our procurement team had more flexibility than I assumed. If I'd asked, we probably could have gotten a 90-day extension on the same terms, which would have reduced the pressure on the team in the final two months. We shipped on time but burned out two engineers in the process. The schedule pressure wasn't actually as immovable as I treated it.

**INTERVIEWER:** That's a great answer. Let's shift. Tell me about a conflict with a coworker. How did you resolve it?

**CANDIDATE:** Okay. About three years ago, I was the tech lead on an internal service and there was a senior engineer on a sister team — call him Marcus — who consistently wanted to expand our service's scope to handle his team's use cases. We'd talked about it several times. Each conversation ended with me politely explaining why his use case didn't fit our service's responsibility, and him agreeing in the meeting, and then sending the same proposal in slightly different form a month later.

**INTERVIEWER:** What was the actual technical disagreement?

**CANDIDATE:** My service handled idempotent event processing. Marcus wanted us to add a feature where the service would also retry events on his behalf with custom backoff. From his angle it was a small addition — we already had retry infrastructure. From mine, it was a major shift in the service's contract: we'd be moving from "process this event idempotently" to "own delivery semantics for the consumer." That had implications for SLOs, on-call burden, and our API surface that I didn't want to take on.

**INTERVIEWER:** How many times had you had the conversation before he escalated?

**CANDIDATE:** Four, give or take, over about five months. Each one was civil. He'd make the proposal, I'd lay out my concerns about scope creep, we'd seem to agree, and then the proposal would reappear weeks later in slightly different form. I read the recurrence as him not getting it; I should have read it as me not getting something.

**INTERVIEWER:** What did you do?

**CANDIDATE:** I let it simmer for too long, honestly. I kept thinking, "okay, this conversation will land," and it kept not landing. Eventually it came to a head when he escalated to my manager and his manager. The escalation framing was that I was being unreasonable and blocking his team.

**INTERVIEWER:** That had to be uncomfortable.

**CANDIDATE:** Very. My first instinct was defensive — I started building a case for why I was right. My manager caught that and asked me a question that reframed everything. She said: "what does Marcus actually need, and is the thing he's asking for the only way to get it?"

**INTERVIEWER:** Good question.

**CANDIDATE:** Yeah. It made me realize I'd been arguing about the proposal rather than the problem. So I asked Marcus for a 30-minute conversation, just the two of us, and I led with: "I haven't been a great partner on this. Walk me through what you're trying to solve, from scratch, and I'll just listen."

**INTERVIEWER:** What did you learn?

**CANDIDATE:** That his team was getting paged for transient downstream failures and they didn't want to be on the hook for retry logic. The reason he wanted my service to do it was that we already had it, and his team didn't have the bandwidth to build their own. He didn't care which service did the retries — he cared that his team wasn't building or running new infrastructure.

**INTERVIEWER:** So what did you propose?

**CANDIDATE:** We landed on something neither of us had proposed before. Instead of adding retry to my service, we extended the existing platform retry library so any team could opt in with a few lines of config, including his. His team's burden was minimal, my service's contract didn't change, and the platform library got a feature that benefited everyone.

**INTERVIEWER:** Who built it?

**CANDIDATE:** I committed one of my engineers for two weeks to do the library extension, and Marcus's team did the integration. Joint ownership.

**INTERVIEWER:** Did the relationship recover?

**CANDIDATE:** It got much better. Marcus and I became actually friendly after that — I think the conversation where I said "I haven't been a great partner" changed the dynamic. We worked together on three more cross-team projects over the next year, with no recurrence.

**INTERVIEWER:** How did your manager handle the escalation?

**CANDIDATE:** Well, actually. She didn't take sides — she pushed both Marcus and me to figure it out ourselves rather than mediating to a conclusion. The reframing question I mentioned was the most useful thing she did. She also gave me cover later — she could have used it as a development area in my review, and she chose instead to highlight that I'd recovered from it constructively. I respected her judgment a lot more after that incident.

**INTERVIEWER:** Looking back, what was your specific mistake?

**CANDIDATE:** I optimized for being right instead of being effective. I had strong arguments for why the proposal was wrong, and I kept making them, when the actual issue was that I'd never seriously engaged with the problem he was trying to solve. The escalation was the natural consequence — when someone feels they're not being heard, they go up the chain.

**INTERVIEWER:** What's the principle you'd take from that?

**CANDIDATE:** When the same disagreement comes back repeatedly, that's a signal I'm missing something. Either there's a real problem I haven't acknowledged, or the other person is misaligned in a way I haven't surfaced. Either way, restating my position more times isn't going to fix it.

**INTERVIEWER:** And what would you do differently next time?

**CANDIDATE:** Catch it sooner. After the second time the same conversation happened, I should have said: "we keep landing in the same place. Let me try to understand what's really going on, because clearly my current explanation isn't working." Asking that question would have unstuck things six months earlier.

**INTERVIEWER:** Good. Let's go to a tougher one. Tell me about a time you disagreed with your manager. What was the disagreement and how did it play out?

**CANDIDATE:** Yeah. This one's recent — about 8 months ago. My manager wanted us to adopt a new framework — let's call it Framework X — for our team's new services. He'd been at a conference, gotten enthusiastic, and was sketching plans to migrate our existing services to it over the next year. He brought it to me as if the decision were made.

**INTERVIEWER:** What was your concern?

**CANDIDATE:** A few. Framework X was relatively young — about 18 months in active development, with a small contributor base. I'd looked at it during a hack week and found a couple of rough edges in production scenarios. More importantly, our team's services were stable; the migration would consume probably six engineer-quarters of work for benefits I thought were largely cosmetic.

**INTERVIEWER:** How did you raise it?

**CANDIDATE:** I asked for a 1:1 specifically on this topic. I came in with a written one-pager outlining my concerns. I tried to be careful about how I framed it — I didn't want it to sound like "you're wrong," I wanted it to sound like "here are the data points I think we should weigh before committing."

**INTERVIEWER:** What was in the one-pager?

**CANDIDATE:** Three sections. One, what Framework X gives us — I listed the actual concrete benefits and tried to be generous, since I was the skeptic. Two, what it costs us — engineering time, risk to existing services, hiring (since the framework has a small community). Three, alternatives — I outlined two other paths: incremental improvements to our current stack, and a smaller-scope adoption of Framework X for one new service as a trial.

**INTERVIEWER:** How did he react?

**CANDIDATE:** Initially defensively, which is fair — he'd been telling his manager we were adopting it, so I was implicitly asking him to walk that back. He pushed back on my cost analysis, said I was underestimating the long-term value. We went back and forth for the full hour.

**INTERVIEWER:** Where did it land?

**CANDIDATE:** We didn't resolve it that day. He said he'd think about it. I left feeling like I'd planted a flag but maybe damaged the relationship. Two days later he came back and said he wanted to do the trial path — one new service on Framework X, evaluate at three months. If it went well, we'd plan the broader adoption with a more thorough analysis. If it didn't, we'd stop.

**INTERVIEWER:** What happened?

**CANDIDATE:** The trial went okay. We hit some of the rough edges I'd flagged, and a couple I hadn't anticipated. At the three-month checkpoint, we agreed to use it for greenfield services only — no migration of existing ones. That was the right call. The team was relieved we weren't migrating; my manager felt good that we'd made a measured adoption rather than zero adoption.

**INTERVIEWER:** Walk me through the moment in the disagreement that was hardest.

**CANDIDATE:** *(thinks)* About 40 minutes into the conversation, he said something like "I think you're being too conservative." That stung, because conservative is the kind of label that can stick to an engineer and limit you. My first instinct was to defend my track record. Instead, I took a breath and said: "maybe — and I'd genuinely like to hear what would change my mind. What's the specific thing about Framework X that you think outweighs the costs I listed?"

**INTERVIEWER:** What did he say?

**CANDIDATE:** He talked about hiring — he believed Framework X would help us attract better candidates because it's a hot technology. That was a fair point I hadn't considered. It didn't change my overall conclusion, but it shifted the conversation from "are we doing this" to "what's the right way to capture the hiring benefit without the full cost." Which is how we landed on the trial.

**INTERVIEWER:** Did the hiring case actually pan out?

**CANDIDATE:** Modestly. We picked up two candidates over the next year who specifically mentioned the framework in their interviews. Not transformative, but real. My manager occasionally references it as evidence the trial was worth doing, which is fair.

**INTERVIEWER:** Why do you think he came back two days later with the compromise?

**CANDIDATE:** I think the one-pager helped — he could re-read it without the social pressure of the meeting. And honestly, I think he appreciated that I'd come with structure rather than just resistance. People are much more receptive to "here's a different option" than "you're wrong."

**INTERVIEWER:** Has anything similar come up since?

**CANDIDATE:** A few times. The pattern that emerged from that one helped — I'm more deliberate now about engaging with my manager's reasoning rather than just my own conclusions. I think we have a healthier disagreement dynamic now than before. He'll occasionally say "I want your skeptic take" on something, which I take as a positive sign.

**INTERVIEWER:** Did you ever worry about being labeled as the "no" person?

**CANDIDATE:** Honestly, yes. There's a real risk in being the engineer who pushes back, especially on a manager's enthusiasm. I try to counter it by being equally vocal when I support something — if I think a direction is right, I say so clearly. Otherwise the silence reads as resistance, and only the disagreements get heard. The framing I use is: I want to be known as someone with strong opinions, held loosely, expressed early.

**INTERVIEWER:** What would you do differently?

**CANDIDATE:** I'd have raised the concern earlier. I let it sit for about a week between when he first mentioned the framework and when I scheduled the 1:1, because I was trying to figure out how to bring it up without making it weird. By the time I did, he'd already told his own manager about the plan, which made walking it back harder for him. If I'd raised it the same day, it would have been a different conversation.

**INTERVIEWER:** Good. Let's go to failure. Tell me about a significant failure and what you learned from it.

**CANDIDATE:** I'll tell you about a project I led that we ended up shutting down. About four years ago I led the design and partial build of a new search backend for our product catalog. The motivation was that our existing search — Elasticsearch with a bunch of custom plugins — had become hard to maintain, and I believed we could build something cleaner and faster with a more modern architecture.

**INTERVIEWER:** What was the architecture?

**CANDIDATE:** A custom indexer feeding a columnar store with a thin search layer on top. The hypothesis was that for our specific access patterns — heavy faceted filtering, light text search — a purpose-built system would outperform Elasticsearch and be much simpler to operate.

**INTERVIEWER:** What happened?

**CANDIDATE:** We built it. It worked. It was faster on the benchmarks I'd designed. But when we shadow-tested it against real production traffic, the latency profile was actually worse — the p99 was significantly higher than Elasticsearch, even though the median was better. After about six months and three engineers' time, we shut the project down and stayed on Elasticsearch.

**INTERVIEWER:** Why was the p99 worse?

**CANDIDATE:** A few reasons. The query patterns in production had a much longer tail than the patterns I'd benchmarked. Some queries combined facets in ways I hadn't anticipated, and the columnar approach had pathological cases for certain filter combinations. Also, real production traffic had bursty hot spots that Elasticsearch handled gracefully because of years of tuning that I'd implicitly relied on without realizing.

**INTERVIEWER:** What was your specific failure?

**CANDIDATE:** I designed the benchmarks. I designed them based on what I thought our access patterns looked like, derived from a few weeks of log analysis. I missed the long tail. Worse, I should have caught it earlier — we did shadow testing in month four, but I dismissed the early signal because the median was good. I told myself "we'll optimize the tail later." We didn't.

**INTERVIEWER:** How did the team take it?

**CANDIDATE:** Hard. They'd built a system they were proud of, and shutting it down felt like throwing away their work. Two of them were really demoralized. I owned the call publicly — I told the team and leadership that the decision was mine, the misjudgment was mine, and the engineers had done excellent work on the system as designed.

**INTERVIEWER:** Did you push back on the decision to shut it down? Sometimes the right call is to push through.

**CANDIDATE:** I considered it. There was a path — invest another three months on the tail-latency problem, see if we could close the gap. I went through the analysis with my manager and we concluded that even in the best case, we'd end up with something marginally better than Elasticsearch at significant ongoing maintenance cost. The break-even was too far out to justify. So I made the call to stop, not pivot.

**INTERVIEWER:** How did you tell the team?

**CANDIDATE:** Honestly. I called a team meeting, walked through the data, explained the reasoning, took questions for an hour. I tried to be clear about what they had done well — the implementation quality was excellent, the team had executed on what I'd asked them to build. The failure was in the original premise and in my unwillingness to revise it sooner.

**INTERVIEWER:** What about the engineers individually? You said two were demoralized.

**CANDIDATE:** I spent extra 1:1 time with each. For one, the path forward was a new project where she could rebuild momentum — she'd been wanting to work on the recommendation system, and I helped her transition there. The other took it harder; he was a senior engineer who felt his judgment had been wasted on a doomed effort. We had a long conversation about what he'd learned — turned out he'd actually grown a lot on the project even if the outcome was a shutdown. I made sure that learning showed up in his next review.

**INTERVIEWER:** Did anyone leave the company over it?

**CANDIDATE:** Nobody left immediately. One engineer left about nine months later — partly because of this, I think, though there were other factors. He told me on his way out that the shutdown had been the start of him thinking about leaving. I felt that one. It taught me that even when you handle a shutdown well in the moment, the wake of it can persist for a long time.

**INTERVIEWER:** What would you have done differently for him specifically, in hindsight?

**CANDIDATE:** I'd have done more to put him on something he was excited about, fast. After the shutdown I let him take a couple of weeks to figure out his next project, which I thought was respectful — give him space to choose. In retrospect, when someone is shaken by a setback, "what do you want to work on?" is a hard question. He needed help finding the right next thing, not a blank check to figure it out. I should have been more proactive in steering.

**INTERVIEWER:** Did you do anything to surface dissent on the team while the project was still going?

**CANDIDATE:** Not enough. I had a rough premortem in month two — "what could kill this?" — and the team raised some risks, but I treated them as items to mitigate rather than as signals to question the whole project. In retrospect, the engineer who left actually flagged something close to the eventual failure mode in that session: he said "I'm worried our benchmark queries don't look like real traffic." I noted it and we added one extra benchmark. I should have stopped and re-examined the foundation right there.

**INTERVIEWER:** Why didn't you?

**CANDIDATE:** Sunk cost, mostly. We were three months in, the architecture was nice, the team was excited, and stopping to re-validate the foundation felt like losing momentum. The honest answer is I didn't want to face the possibility that my premise was wrong. The discomfort of pulling on that thread was higher than the discomfort of adding one more benchmark and moving on.

**INTERVIEWER:** What's the durable lesson?

**CANDIDATE:** A few. *(thinks)* One: when I'm the one who proposed the project, I'm exactly the wrong person to evaluate whether to keep going. I needed someone outside the team to challenge my assumptions earlier. Two: shadow-test before you commit to the migration timeline, not after. We had production data we could have hit five months earlier, and I didn't because the system "wasn't ready." If I'd shadow-tested at month one with a half-built system, I'd have seen the latency profile earlier. Three: when the early signal is "median good, tail bad," that's almost always a sign that the architecture is wrong, not that the tail is fixable. I now treat tail-first as the design constraint, not an afterthought.

**INTERVIEWER:** Have you applied those lessons since?

**CANDIDATE:** Yes. On my current team, when we considered a similar "rebuild this thing in a new way" project, I structured it differently. We built the simplest possible end-to-end version first, ran shadow traffic against it in week three, and used that as the go/no-go signal for the larger investment. The data killed the project early — we found we couldn't beat the existing system's tail. Cost us three weeks instead of six months.

**INTERVIEWER:** Good. Last one. Tell me about a time you had to influence without authority — convincing someone to do something where you couldn't just tell them to.

**CANDIDATE:** Let me think of a good example. *(pauses)* About a year ago I was advocating for a change in how our company did postmortems. We had a process — we wrote postmortems for sev1 and sev2 incidents — but the quality was inconsistent, the followup on action items was poor, and the same kinds of incidents kept recurring. I wanted to push for a more rigorous process modeled on what I'd seen at a previous company.

**INTERVIEWER:** Who did you need to influence?

**CANDIDATE:** Several stakeholders. The VP of Engineering, who owned the process. The on-call rotation leads across maybe 30 teams. The compliance team, who had their own incident-reporting needs that interacted with our internal process. And the engineers themselves, who would actually have to write the better postmortems.

**INTERVIEWER:** Where did you start?

**CANDIDATE:** I didn't go to the VP first, even though I knew that's where the decision would ultimately have to be ratified. I started by doing the work myself for our own team. We had a sev1 a few weeks earlier; I rewrote the postmortem the way I thought it should be, with deeper root-cause analysis, clearer action items, and explicit owners. Then I shared it with two engineers I respected on other teams, asking them to compare it to their team's recent postmortems and tell me what they thought.

**INTERVIEWER:** What did they think?

**CANDIDATE:** One was enthusiastic, said it was much more useful. The other was lukewarm — he said it was good but he wasn't sure he wanted to spend that much time on postmortems given his team's velocity pressure. Both reactions were useful. The enthusiastic one became an ally. The lukewarm one gave me the objection I'd need to address with everyone else.

**INTERVIEWER:** Then?

**CANDIDATE:** I worked on the cost objection. I went through six months of incidents and tagged which ones were repeats of earlier ones — same root cause or same class. About a third were. I put together a short doc: "we are spending more time on repeat incidents than we would spend on better postmortems."

**INTERVIEWER:** Then you went to the VP?

**CANDIDATE:** Almost. First I went to two more on-call leads who had explicitly complained about repeat incidents — I knew they'd be receptive. Got their support. Then I asked one of them to bring it to the VP with me, so it wasn't just me saying it. Three engineers across two teams making the same case has more weight than one engineer making it alone.

**INTERVIEWER:** How did the VP react?

**CANDIDATE:** Positively, but cautiously. He liked the data. His concern was the implementation burden — who would drive the rollout, who would coach teams on the new format, how would we measure that it was working. Fair concerns. We didn't have a great answer in the moment, so I offered to come back in a week with a rollout proposal.

**INTERVIEWER:** What was the proposal?

**CANDIDATE:** Three-phase. Phase one: pilot with three volunteer teams for two months. Phase two: based on pilot learnings, refine the template and process, then voluntary rollout to all teams. Phase three: make the new format the default for sev1/sev2 incidents, with a lightweight version for sev3. I committed to spending 20% of my time on it for the first three months — drafting the template, sitting in on postmortem reviews for the pilot teams, gathering feedback.

**INTERVIEWER:** Did he buy it?

**CANDIDATE:** Yes. We did the pilot. Two of the three teams loved it, one struggled because their incident volume was high and the new template felt heavy. We adjusted — added a lighter "tier 2" format for higher-frequency, lower-severity incidents. Voluntary rollout reached most teams within a quarter. The "default" phase happened about six months after I'd first started this.

**INTERVIEWER:** What was the outcome?

**CANDIDATE:** Repeat incident rate dropped — when we measured a year later, it was down about 40%. Action item completion rate went from about 30% to 75%. Engineers' qualitative feedback was that postmortems felt more useful, even though they did take longer to write. The VP put it in his quarterly all-hands as a culture win.

**INTERVIEWER:** Did you take credit for it?

**CANDIDATE:** I tried to share it appropriately. In the all-hands shoutout the VP named me, and I asked him afterwards to also explicitly call out the working group members and the early-pilot teams in the next written summary. I think the actual credit should be distributed because the rollout was a team effort by the end. But I won't pretend I didn't appreciate the recognition — it's the kind of work that's hard to make visible, so when it does land, it lands big.

**INTERVIEWER:** Any moments where the rollout almost went sideways?

**CANDIDATE:** One. In the middle phase, two teams adopted the new template badly — they checked the boxes without doing the actual deep analysis. The postmortems looked compliant but didn't surface real causes. If that became the norm, the whole change would have been performative. I noticed it during a review, brought it up gently with both teams, and reframed the template not as a checklist but as a set of prompts. The point isn't to fill the sections; the point is to think the thoughts the sections are asking you to think. After that conversation both teams' postmortems improved noticeably.

**INTERVIEWER:** What did you specifically do that worked? I'm interested in the influence mechanics.

**CANDIDATE:** A few things. *(thinks)* One: I demonstrated the change before asking anyone else to make it. The rewritten postmortem was a real artifact people could look at, not an abstraction. Two: I addressed the strongest objection — cost — with data, not opinions. Three: I built coalition deliberately. I went to the VP with allies, not as a lone voice. Four: I made the ask easy to say yes to — a small pilot with a clear opt-out, not an org-wide mandate. Five: I made it cheap for me to deliver — I put in the 20% time myself rather than asking other people to do the work.

**INTERVIEWER:** What was hardest?

**CANDIDATE:** The patience. From the first conversation to the default-phase rollout was about 14 months. There were stretches where I felt like nothing was moving. The middle phase — between the pilot ending and the voluntary rollout reaching critical mass — was the slowest. I had to keep nudging without becoming a pest.

**INTERVIEWER:** How do you distinguish nudging from pestering?

**CANDIDATE:** Frequency and form. Nudging is a fresh data point or a new angle every few weeks — "here's how team X's experience went" or "I noticed two incidents this month that would have been prevented." Pestering is the same ask repeated. I tried to never re-send the same message; always come with something new. And I tried to read the room — if the VP was deep in a different fire, I'd hold for two weeks and check back when the air had cleared.

**INTERVIEWER:** Any moments where you almost gave up?

**CANDIDATE:** Once. About month seven, the pilot was done, the voluntary rollout had stalled, and the VP's attention had moved to other priorities. I almost wrote it off. What got me past it was that one of the original allies — the on-call lead from the early conversations — pinged me to ask when "the postmortem thing" was going to roll out more broadly. That reminded me there were people waiting for this, even if I wasn't getting top-down support to push it. So I went back and re-engaged the VP with a fresh set of pilot results.

**INTERVIEWER:** Anything you'd do differently?

**CANDIDATE:** I should have built a small working group earlier — like a three-person committee with rotating membership — to share the load. By doing so much of it solo, I bottlenecked the rollout on my own bandwidth, and when I was pulled into other priorities, momentum stalled. Distributed ownership would have been more durable.

**INTERVIEWER:** Did you keep doing the 20% time after the initial three months?

**CANDIDATE:** I tapered it. By month four the working group I should have started earlier finally existed — three people including me, rotating membership. They took on most of the coaching and review burden. My role shifted from doing the work to making sure the working group had air cover and resources. By month eight I was mostly hands-off, just consulted on tricky cases.

**INTERVIEWER:** Great. Okay, we have a few minutes left. Anything you want to add to any of the answers, or anything you wish I'd asked?

**CANDIDATE:** *(thinks)* One thread that ran through several of these — the payment migration, the framework disagreement, the postmortem effort — is that the right move is usually slower than I want it to be. My instinct in each case was to go faster: ship something visible sooner, win the disagreement decisively, get the change rolled out across the org by Q2. The patient version turned out to be the effective version in all three. That's a lesson I'm still actively practicing.

**INTERVIEWER:** Last question. If I called your current manager and asked for one area you should keep growing in, what would they say?

**CANDIDATE:** *(thinks)* They'd probably say: delegating sooner. I tend to take on cross-team work personally because I can see exactly what needs to happen — but that means I bottleneck on my own time. The postmortem story I just told is an example: I should have built the working group at month two, not month four. I'm working on it, but it's an ongoing growth area.

**INTERVIEWER:** Why is it hard?

**CANDIDATE:** Two reasons. One, I have a clear mental model of how I'd do it and it feels slower to transfer that model than to just do it. Two, when I delegate, I have to be willing to accept a different version of the work than the one I'd produce. That's a trust muscle I'm still building.

**INTERVIEWER:** Fair. Thanks for the conversation — these were strong answers.

**CANDIDATE:** Thank you. I enjoyed it.

## What went well

- Five answers covered five distinct themes — leadership, conflict, manager disagreement, failure, influence without authority — without overlap. Good story selection.
- Specific numbers throughout: $4M vendor cost, 47 services, 18 months, 40% reduction in repeat incidents. Specificity signals real experience.
- Each story had a clear "what I did differently / what I learned" component. The failure story in particular owned the mistake without spiraling into self-flagellation.
- Strong follow-up handling. When the interviewer pushed on specific moments — "what did the engineer say in the 1:1?", "what did your manager say that stung?" — the candidate had concrete recall.
- The closing reflection — "the right move is usually slower than I want it to be" — connected the stories into a coherent self-narrative. That kind of meta-pattern is what L6 interviewers are listening for.
- The conflict story (Marcus) showed willingness to admit being wrong, in real time, without being self-flagellating about it.

## What could've been stronger

- The "led a team through a difficult project" story focused heavily on the candidate's individual contribution. A stronger version would have surfaced more of the team's contributions — naming specific engineers, what they did, how the candidate set them up to succeed.
- The failure story could have gone further on the people impact. The engineer who eventually left was mentioned briefly but the candidate didn't fully sit with what that meant or what they might do differently to retain people through hard moments.
- The disagreement-with-manager story landed on a compromise (the trial), but the candidate could have been more honest about whether the compromise was actually optimal or just diplomatically acceptable.
- For the influence-without-authority story, the candidate could have more explicitly named the political dimension — building coalition with the VP's peers, not just the engineers below.
- The candidate sometimes used "we" when "I" would have been more appropriate. Behavioral interviewers want to know what the candidate personally did, not what the team did.

## Key takeaways

- Use STAR (Situation, Task, Action, Result) as a backbone but don't recite it mechanically. The interviewer will probe; let them.
- Anchor stories in specifics: numbers, names (anonymized), dates, concrete artifacts. Vague stories read as fabricated even when they're true.
- The "what I learned / what I'd do differently" component is non-negotiable at L6. If your story doesn't have one, find a different story.
- Own your mistakes plainly. The candidate's "I optimized for being right instead of being effective" landed because it was specific and unvarnished.
- For influence without authority: demonstrate, then ask. Don't propose what you haven't tried yourself.
- Embrace the meta-narrative. Three or four stories that ladder up to a coherent insight about how you operate is more compelling than five disconnected vignettes.
- Patient persistence on the order of months-to-years is an L6 signal. If your stories all resolve in two weeks, you may be reaching for too small a scope.
