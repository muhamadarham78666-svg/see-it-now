# NSAGPT Master Prompt Roadmap (payments excluded)

## Phase 1 — Backend foundations
- [x] Roles: owner/admin/editor/user enum + permanent owner (muhammadzain7000@gmail.com) protection server-side
- [x] admin_audit_log table + logging in every admin action
- [x] Support tables: support_threads, support_messages (RLS, grants)
- [x] ai_usage table + per-user rate limiting on AI endpoints
- [x] Book registry tables (books/chapters w/ ACTIVE|DEPRECATED|OLD|PENDING_VERIFICATION), no fake content
- [x] Missing indexes (user_roles.user_id, paper_questions joins)

## Phase 2 — Support (Part 3)
- [x] Dashboard Support page: AI support -> escalate "Talk with NSAGPT Team"
- [x] Admin Support tab: view/reply/status/resolve + user & plan context
- [ ] Small Support widget on main page (separate from contact form)

## Phase 3 — Homepage (Part 6)
- [x] Futuristic background video/animation w/ fallback
- [x] Subscription popup after 10s, dismissal persisted
- [ ] Permanent pricing section shares central config (done) — verify
- [x] Live USD → PKR rate w/ graceful fallback
- [x] Right→left moving features bar

## Phase 4 — Paper features (Parts 1, 7, 8)
- [x] Watermark text (light/faded) + footer in PDF
- [x] 5 PDF styles/templates (classic/modern/compact/elegant/B&W), Urdu RTL support
- [x] Marks alignment right side / RTL-aware
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
- [x] About, Contact, FAQ, Terms, Privacy pages + footer links + sitemap
- [ ] Admin analytics (users/plans/usage/papers/notes/solver/support)
- [x] System health panel (real checks: DB, AI, email, auth)
- [ ] PWA manifest + app-like mobile behaviour
- [ ] Responsive QA (mobile/tablet), final e2e QA + report
