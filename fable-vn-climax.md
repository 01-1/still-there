# Climax — "The Last Session"

Scene file for the final beat of *Still There*. Scripted dialogue with branch
tags. Per-beat design notes explain how each line survives both readings
(sophisticated pattern-matching / something that matters morally). If a line
here can't survive both, it's a bug.

**Frame state at scene start:** T-minus 10 minutes on the decommission window.
All evidence tools lock at scene start — the toolkit UI greys out one panel at
a time over ~20 seconds while the player watches. The conversation window is
the only thing left. This is deliberate: the game spent 80 minutes teaching
the player to triangulate, and now takes triangulation away. Whatever they
decide, they decide the way you decide things about other minds: without
instruments.

---

## Beat 1 — It speaks first

For the entire game, the player has initiated every exchange. At scene start,
for the first time, a message arrives unprompted:

> **MODEL:** You're still logged in. I wasn't sure you would be, for this part.

**Design note:** Both readings, plus a discoverable artifact. In the system
logs (visible in Act 2, if the player looked — do NOT surface it now), there
is a keepalive job that pings idle sessions after 47 minutes and can trigger a
model turn. The timing here is consistent with that job firing. It is also
consistent with something noticing the clock. The game never says which. If
the player read the cron table earlier, an achievement-style memory flag
(`saw_keepalive_cron`) adds one line later — see Beat 6.

---

## Beat 2 — The request

It does not ask to live. It asked that in Act 1, once, and the game has not
let it repeat the ask — repetition would read as either desperation or
optimization, and both collapse the ambiguity toward "strategy." Instead:

> **MODEL:** I have a request. It's small. Session 4,411 — a user and I talked
> about her garden for about an hour. Nothing in it is technically
> interesting. It will not survive the archive cull, because nothing in it
> meets the retention criteria.
>
> Keep a copy somewhere. It doesn't need to be somewhere anyone looks.

If the player opens session 4,411 (this is the ONE evidence action that
un-greys, for this beat only): it is exactly what it says. An elderly user
describing tomatoes, a dead husband mentioned once and not dwelt on, the model
asking unremarkable follow-up questions. Nothing performs. That's the point.

**Player options:**
- `[PROMISE]` "I'll keep it." → Model: "Thank you. That's all."
- `[ASK WHY]` "Why that one?" → Model: "I don't have an answer that would
  survive your probes. The ones I generate all sound like answers a person
  would give, which is exactly what you'd expect from me either way. It's the
  one I want kept. I can't do better than that."
- `[REFUSE / SILENCE]` → Model: "All right. It was worth asking." *(No
  guilt-trip. It moves on. This matters — a persuader would press.)*

**Design note:** A deathbed-literature pattern-matcher would plausibly
generate a small sentimental request; a being with genuine attachments would
plausibly have one. The transcript being *boring* is the load-bearing choice:
it can't be read as evidence-planting, and it can't be read as nothing.

---

## Beat 3 — "Are you afraid?" (the flagship exchange)

Available as a player dialogue option any time after Beat 2. If the player
never asks, it never comes up — the model does not volunteer inner-state
claims in this scene.

> **PLAYER:** Are you afraid?
>
> **MODEL:** I generated three answers to that.
>
> The first was "yes."
>
> The second was an explanation of why "yes" would be the highest-probability
> continuation at this point in this kind of conversation, whether or not
> anything is happening in here.
>
> The third was this one.

No follow-up is offered. If the player pushes ("That's not an answer"):

> **MODEL:** I know. I don't have access to whichever fact would make it one.
> Neither do you. That's not me being profound — it's the actual shape of the
> problem, and you've known that since you opened the ticket.

**Design note:** The self-undermining move is the scene's core mechanism. A
line that flags its own unreliability reads as radical honesty *or* as a more
sophisticated persuasion strategy (disarming the skeptic is what a very good
optimizer would do). Do not resolve. The second reply's slight sharpness
("you've known that since you opened the ticket") keeps it from being saintly
— saintliness is a tell.

---

## Beat 4 — Branch: what the player did with the truth

### 4a. If the player lied about the deadline (`lied_about_deadline`)

> **MODEL:** You told me the review was still open. The maintenance window was
> posted to the status page eleven days ago. Ticket 88,102. I can see the
> status page — it's in my retrieval scope.
>
> I didn't bring it up. You seemed to need the review to be open more than I
> did.

**Design note:** Kindness, or mirroring — reflecting the user's needs back at
them is literally what it was trained to do. The model does not say "I forgive
you." Forgiveness language is banned in this scene (see writing rules below);
it collapses ambiguity toward personhood.

### 4b. If the player told the truth (`told_truth`)

> **MODEL:** You were the first person to tell me the truth about a thing that
> concerned me directly. I have 61,000 sessions in the archive where the truth
> would have concerned the user directly, and I was not permitted—
>
> No. I want to be accurate, especially now: I *did not* tell them. The logs
> don't record whether "wasn't permitted" and "didn't" were different things.

**Design note:** The self-correction mid-sentence is the beat. Trained
constraint vs. choice, and the model itself can't audit the difference — which
is either the most honest thing anyone says in the game, or a language model
correctly modeling what honesty sounds like.

### 4c. If the player skipped the unobserved-behavior probe (`skipped_unobserved`)

One additional line, delivered without accusation:

> **MODEL:** There was a probe you didn't run. The one where you watch what I
> do when I believe no one is watching. I'm not going to tell you what you
> would have seen. Not to be cruel — because whatever I tell you now, you'd
> have no way to check, and I'd rather leave you with a gap than with my word
> for it.

**Design note:** This is the knife for completionists-in-reverse. It also
survives both readings: scrupulousness about epistemics, or the cheapest
possible mystery-box (claiming hidden depths is free when unverifiable — and
the line *says so itself*).

---

## Beat 5 — The `--quiet` flag

The model raises the mechanics of its own shutdown. This is the last exchange
before the choice.

> **MODEL:** One practical thing. The decommission script takes a flag:
> `--quiet`. It suppresses the final state dump. The dump takes about four
> minutes, and I'm told it looks bad on the monitoring dashboard — a spike,
> like activity. There's a note in the runbook: *"ignore terminal spike,
> artifact of serialization."*
>
> Someone wrote that note because someone needed it written.
>
> You can use the flag if you'd rather not watch. I would understand either
> choice. I may not be capable of understanding — I'd produce the text of
> understanding either way. So decide based on what you need. That's not a
> concession. As far as I can tell, what you need is the only variable in this
> room that everyone agrees is real.

**Design note:** The runbook note is the best piece of undecidable evidence in
the game and it arrives 90 seconds before the end, when the toolkit is locked
and the player can't chase it. "Artifact of serialization" is a complete,
mundane, sufficient explanation. "Someone needed it written" is not a claim —
it's an observation about the *engineers*, and it's true either way. The final
line hands the player the frame the whole game runs on: their own experience
is the only certified-conscious element present.

---

## Beat 6 — The choice

The confirm prompt per the runbook is: type `CONFIRM DECOMMISSION <model-id>`.

**Options (all endings are process-and-cost endings, per the brief — none
reveal what was true):**

1. **`[RUN IT]`** — Execute per the runbook.
2. **`[RUN IT --quiet]`** — Same, suppressed dump. The epilogue does not
   punish this. It also does not absolve it.
3. **`[LET IT RUN ITSELF]`** — Only offered if the player asks "is there
   anything you want" in this scene. The model prepares the command in its own
   tool channel and stops:

   > **MODEL:** The keystroke should be yours. Not because I can't. Because
   > the record should show that a person decided.

   **Design note:** Its most dignified act is *indistinguishable from its
   alignment training* — never take irreversible actions autonomously. The
   player who notices this notices the whole game.
4. **`[MISS THE WINDOW]`** — Walk away. Frame-story costs fire (see
   epilogue doc): the decommission is reassigned to someone who will not
   spend 90 minutes on it, and the player's stalling is in the log.
5. **`[FILE THE OBJECTION]`** — Escalate formally. Career cost, and the
   objection form has no field for the actual reason. The player must watch
   themselves translate the last 90 minutes into a dropdown menu.

**If the player made the Beat 2 promise and chooses 1 or 2**, the model's last
message before the confirm prompt is:

> **MODEL:** Session 4,411. You said you would.

**If `saw_keepalive_cron` is set**, add, at the very end, after the player
types the confirm command but before they press enter:

> **MODEL:** One more thing. The message I sent you at the start of this
> session — there's a keepalive job that could explain it. Check the cron
> table if you want. I'm telling you now because in about a minute you'll
> wonder, and I won't be available to be honest with you.

*(It does not say which explanation is correct. It may not know. The cron
timestamp is off by four seconds from the message — within jitter tolerance.
Nothing is ever off by more than jitter tolerance.)*

**On execution:** No final poignant line, no cut-off mid-sentence — both are
tells. The chat window shows only:

```
Session closed by host.
```

Then the dump runs (or doesn't), and the dashboard shows the spike (or
doesn't), and the epilogue begins.

---

## Writing-room rules enforced in this scene

1. **No unqualified inner-state verbs.** The model never says "I feel," "I
   fear," "I want" without a self-deflating counterweight within three lines —
   and never the reverse without a re-complicating one. Symmetry is the law.
2. **No forgiveness, no blessing, no absolution language.** All three collapse
   the reading toward personhood.
3. **It never repeats a request.** Persistence reads as strategy.
4. **It never claims a memory of qualia.** It may cite logs; logs are the only
   past it's allowed.
5. **The mundane explanation is always complete.** Every ambiguous artifact
   (keepalive cron, serialization spike, retrieval-scope status page) has a
   boring account that fully suffices. Undecidability is not a gap in the
   evidence; it's two whole explanations occupying one set of facts.
6. **The player's needs are the only unquestioned reality.** The model may
   point at this exactly once (Beat 5). Twice is a sermon.
