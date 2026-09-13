# NSAGPT Master Prompt Roadmap (payments excluded)

## Phase 1 — Backend foundations
- [ ] Roles: owner/admin/editor/user enum + permanent owner (muhammadzain7000@gmail.com) protection server-side
- [ ] admin_audit_log table + logging in every admin action
- [ ] Support tables: support_threads, support_messages (RLS, grants)
- [ ] ai_usage table + per-user rate limiting on AI endpoints
- [ ] Book registry tables (books/chapters w/ ACTIVE|DEPRECATED|OLD|PENDING_VERIFICATION), no fake content
- [ ] Missing indexes (user_roles.user_id, paper_questions joins)

## Phase 2 — Support (Part 3)
- [ ] Dashboard Support page: AI support -> escalate "Talk with NSAGPT Team"
- [ ] Admin Support tab: view/reply/status/resolve + user & plan context
- [ ] Small Support widget on main page (separate from contact form)

## Phase 3 — Homepage (Part 6)
- [ ] Futuristic background video/animation w/ fallback
- [ ] Subscription popup after 10s, dismissal persisted
- [ ] Permanent pricing section shares central config (done) — verify
- [ ] Live USD → PKR rate w/ graceful fallback
- [ ] Right→left moving features bar

## Phase 4 — Paper features (Parts 1, 7, 8)
- [ ] Watermark text (light/faded) + footer in PDF
- [ ] 4–5 PDF styles/templates (color + B/W), Urdu RTL support
- [ ] Marks alignment right side / RTL-aware
- [ ] Merge PaperBuilder + Generate into one flow; "My Papers" (view/edit/duplicate/download/delete w/ confirm)
- [ ] Regenerate single question (wire onRegenerate)
- [ ] Duplicate prevention (fingerprint + history check)
- [ ] Marks validation before PDF; impossible config explanation
- [ ] Custom long question (Advanced -> Writing/Composition)
- [ ] Autosave paper config/drafts
- [ ] Notes export: PDF / Word / copy text

## Phase 5 — Account & security (Parts 9, 10, 12)
- [ ] Profile: name/institute editing
- [ ] Subscription management + renew/upgrade UI (requests only)
- [ ] Team members within plan limits (backend enforced)
- [ ] Notifications (in-app) for activation/expiry/generation/support
- [ ] Search for papers/notes/books/chapters
- [ ] Delete confirmation everywhere
- [ ] Retry/backoff in ask.server + solve.server, offline/network handling
- [ ] Hallucination guard: book-grounded prompts say "not found in source"

## Phase 6 — Content & admin (Parts 11)
- [ ] About, Contact, FAQ, Terms, Privacy pages + footer links + sitemap
- [ ] Admin analytics (users/plans/usage/papers/notes/solver/support)
- [ ] System health panel (real checks: DB, AI, email, auth)
- [ ] PWA manifest + app-like mobile behaviour
- [ ] Responsive QA (mobile/tablet), final e2e QA + report
