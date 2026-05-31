# One-off SQL patches

Each file here is a **one-time** SQL patch that has already been run against prod.
**Never re-run or edit these files** — they're kept as an audit trail.

- Naming: `YYYY-MM-DD-short-description.sql`. One file per fix.
- Run them with `scripts/run-sql.js` (staging first, then `--target=prod --confirm`).
- See `../SAFETY.md` for the full process and why this is the *last* resort.
