# Lighthouse Talent ⚡

## What this is

Lighthouse Talent is **Nashville's curated startup-talent network** — a portal that
startups pay to access. Talented people apply and get vetted; paying companies
browse the vetted network and request warm introductions to people they want to
hire; the Lighthouse team curates it all behind the scenes.

## How to ask for a change

You don't need to write code. You ask, and Claude builds it.

1. Open a new issue using the **Feature request** or **Bug report** template
   (the only two options — pick one and fill in the form).
2. Fill in the form in plain language. The more specific, the better.
3. When you're ready, **post a comment on the issue containing `@claude`**.
4. The builder opens a Pull Request ("PR") within a couple of minutes.
5. On the PR, click **"Files changed"** → **"Review changes"** → **"Approve"** if it
   looks right.
6. Click **"Merge"**. That's it — it deploys to the live site automatically.

If anything looks off, comment on the PR (you can `@claude` again to ask for a
change) instead of merging.

## What you can ask Claude to do

Concrete examples that work well:

- *"Add a 'Years of Experience' filter to the company candidate search."*
- *"Fix this typo on the admin dashboard: it says 'Aplied' instead of 'Applied'."*
- *"Make the 'Request Intro' button blue instead of green."*

The clearer and smaller the ask, the cleaner the result.

## What Claude *can't* do

Claude is deliberately fenced in so it can't break things:

- It **won't make changes that aren't described in an issue.** If your request is
  vague or needs a decision, it stops and asks in a comment.
- It **won't add a brand-new product feature** you haven't discussed with Mike
  first.
- It **won't delete or modify real customer data on its own.** Database changes go
  through Mike.

## How deployment works

**Merging to `main` deploys to production.** There is no other step. Every PR also
gets its own **preview link** automatically, so you can click around a change
before merging it.

## Inviting a new company (for now)

For now, **message Mike** to grant a new company access. This becomes a
self-service screen in Phase 2.

## When something breaks

1. Check the **Vercel deploy logs** dashboard: _(Mike will paste the real link
   here.)_
2. **Message Mike on Slack** with the broken URL and what you did.
3. If a recent change caused it, you can open the PR that introduced it and click
   **"Revert"** to roll it back instantly.

---

## Setup for engineers

```bash
npm install
npm run dev      # http://localhost:5173
```

Everything else an engineer (or a fresh Claude session) needs is in
[`.claude/CLAUDE.md`](.claude/CLAUDE.md) — stack, the data-layer rule, the
non-negotiables, the data model. Secrets are handled by `dotenvx`; the scripts are
already wrapped, so `npm run dev` / `build` / `preview` "just work" with the local
`.env.keys`.

## Setting up Claude (one-time, admin)

For the `@claude` workflow above to work, an admin does this once:

1. Install the **Claude GitHub App** (https://github.com/apps/claude) and grant it
   access to **this repo only**.
2. Generate a token locally:
   ```bash
   npm install -g @anthropic-ai/claude-code   # if not already installed
   claude setup-token                          # opens a browser, prints a token
   ```
3. In the repo's **Settings → Secrets and variables → Actions**, add a secret named
   `CLAUDE_CODE_OAUTH_TOKEN` and paste the token in.

That's it — `@claude` works from then on. (It authenticates via the Claude Code
subscription, not a pay-per-call API key, so there are no surprise bills.)
