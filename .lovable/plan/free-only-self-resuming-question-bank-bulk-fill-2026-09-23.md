# Free-only, self-resuming Question Bank bulk fill

## Goal

Bulk fill kabhi Lovable paid credits use na kare. Free Gemini quota busy ya khatam ho to job safely pause ho, waqt poora hone par khud dobara chale, aur admin ko raw error ke bajaye saaf status aur countdown mile.

## 1. Paid-credit fallback ko bulk fill se band karna

- AI transport mein explicit **free-only mode** add hoga.
- Question Bank bulk fill aur single-chapter bank fill isi mode mein sirf `zain`, `zain2`, `zain3` use karein ge. Or bi jitny free AI he usky bi AI keys add hogy ta ke backup rahy. Takreeban 5 free AI add hony chahye or unka countdown ana chahye na ke lovable credit ana chahye. Or user ko to bilkul bi koi error ni ana chahye waha pr agr credit khtm hojye to kuch aesthetic msg ana chahye credit khtm Wala nhi
- 5 free keys unavailable hon to Lovable AI call bilkul nahi hogi; is flow se paid credit zero kharch hoga.
- Dashboard ke normal Diamond AI features ka current fallback alag rahega; unka behavior is change mein nahi badlega.

## 2. Intelligent free-key rotation and cooldown

- Har key ka server-side health state rakha jayega: available, cooldown-until, ya configuration-blocked.
- `429` par provider ka `Retry-After` maana jayega; na mile to bounded cooldown lagay ga.
- Temporary `5xx` par limited backoff hoga; `400/401/403/404` ko blindly retry nahi kiya jayega.
- Ek request mein repeated long retry loop aur paid fallback nahi hoga. Agli eligible key use hogi; sab cooling hon to next retry time return hoga.

## 3. Durable resumable bulk job

- Database mein ek staff-only bulk-job record hoga: selected class/book, targets, running/paused/completed status, next retry time, progress, last safe message, lease expiry, and timestamps.
- **Single-flight lock** ek waqt mein sirf ek worker chalne dega.
- Har run sirf ek chhota bounded batch process karega. Existing question fingerprints duplicates ko rokhen ge, is liye refresh/retry se sawal dobara save nahi hon ge.
- Page band, logout, reload, ya server restart se progress nahi lost hogi.

## 4. Automatic hourly resume

- Owner ke Start karne ke baad hourly worker active job check karega: cooldown poora ho to agla small batch, warna bina AI call ke exit.
- Har ghante 24 checks/day hon ge; maximum automatic restart delay lagbhag 60 minutes hoga. Ye frequent polling ke bajaye low-cost compromise hai.
- Job complete ya manually stopped ho to worker koi AI request nahi karega. Provider access/configuration block par auto-probes band rahen ge; sirf quota/rate-limit pause automatically resume hoga.
- Endpoint secret-protected hoga; secret code mein nahi rakha jayega.

## 5. Admin experience

- Current tight browser loop ko persistent **Start / Pause / Resume / Run now** controls se replace karna.
- Status card: Running, Waiting for free quota, Paused, Completed; next attempt countdown; chapters/questions progress; last successful chapter.
- Raw `402 payment_required` JSON kabhi screen par nahi dikhega. Message hoga: “Paid credits protected. Free quota is cooling down; next automatic attempt at …”.
- Start button multiple tabs se duplicate jobs create nahi karega.

## 6. Validation

- Confirm bulk request free-only mode mein paid gateway ko call nahi karti.
- Simulate all three keys returning `429`; verify pause + `next_retry_at`, no paid-credit request, and later successful resume.
- Verify duplicate prevention, Start/Pause/Resume, page reload persistence, and mobile admin layout.
- Verify an offline paper still generates from saved bank questions without any AI call.

## Technical details

- Add a migration for `bank_bulk_jobs` with explicit authenticated/service grants, RLS, owner/admin/editor read controls, and one active-job constraint.
- Add a lease-acquisition database function or atomic update to prevent concurrent runs.
- Extend `aiChatFetch` with a policy argument; return a small typed free-quota status instead of forwarding provider JSON.
- Update `bankBulk.server.ts`, `bankBulk.functions.ts`, and `AdminBankPanel.tsx`; add a secret-verified route under `/api/public/` for the hourly scheduler.
- Store idempotent progress in existing `bank_questions` plus job metadata; never launch work from page render.