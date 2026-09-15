# Owner control centre, plan pricing, renewals, blogs and contact details

## 1. Subscription control from the admin panel

- New **Plans** section in the admin panel listing Silver, Gold, Diamond with editable name, price, duration, user limit, tagline and benefit lines.
- Prices and benefits move from fixed code values into the database, so the homepage pricing cards, the Get Started flow, the request emails and the support assistant all read the same live values.
- Only the owner can change a price or duration; admins can view.
- Each subscriber row gets one-click actions: activate, extend (7 days / 3 months / 1 year), change plan, and cancel.

## 2. Expiry, logout and renewal

- When a subscription ends, the user is signed out and, on the next sign-in attempt, sees a clean "Your subscription has ended" screen with a **Request renewal** button instead of the dashboard. The request lands in the admin panel like a new subscription request.
- Owner/admin accounts are never blocked by this.

## 3. Renewal warnings (7 / 3 / 1 days before expiry)

- An elegant in-app reminder card appears in the dashboard when the plan is close to ending, with days remaining and a Renew button.
- One warning email per stage (7, 3, 1 days) plus one on the expiry day, sent from the existing NSAGPT sender, in the same branded style as the current emails. No duplicates.

## 4. Owner-only extra powers

- Owner sees an extra **Owner** section: plan pricing, contact details, blog publishing, staff roles, homepage toggles, and full audit log.
- Admins keep their current sections; anything owner-only is hidden, not just disabled, and re-checked on the server.

## 5. Contact details on the homepage (owner-controlled)

- Owner enters address, phone, WhatsApp, email and optional map link, with a **Show on homepage** switch.
- Footer shows a contact block only when the switch is on and at least one field is filled; otherwise the footer stays exactly as it is today.

## 6. Blogs

- Admin **Blog** section: create, edit, publish/unpublish and delete posts with title, cover image, short summary, full article body (rich text), and author name.
- Public `/blog` list page and `/blog/<post-link>` article page, each with its own search-engine title, description and share image; only published posts are visible.
- A "Blog" link appears in the homepage navigation and footer.

## 7. Homepage support chat cleanup

- The support answers are cleaned before display: no `**`, `##`, backticks or stray symbols; bold shows as real bold, lists as proper bullets, paragraphs spaced.
- The assistant is also told to answer in plain sentences and short bullets.
- Chat bubbles get slightly larger line height and spacing for a calmer, more elegant look.

## 8. Extra owner options worth adding

- **Maintenance mode** — show a friendly "we'll be back" page to visitors while the owner keeps full access.
- **Announcement bar** — one line of text on the homepage the owner can switch on or off.
- **Free trial switch** — turn a short trial on or off for new accounts.
- **Signup pause** — stop accepting new access requests temporarily.

## Technical notes

- New tables: `plan_settings` (plan key, name, price, duration days, user limit, tagline, benefits, active), `site_settings` (single row: contact fields, show-contact flag, announcement, maintenance, trial, signup toggles), `blog_posts` (title, slug, summary, body, cover, author, status, published_at).
- Public read policies for `plan_settings`, published `blog_posts`, and `site_settings`; all writes go through owner/admin-checked server functions using `is_owner` / `has_role`.
- `subscriptions` gains `warned_stages` (which reminder emails already went out) and reminders run from a `/api/public/cron/subscription-reminders` route protected by a shared secret, plus a check on sign-in as a fallback.
- Session blocking uses the existing `requireActiveSubscription` plus a client guard in `ProtectedRoute` that signs out and routes to the renewal screen.
- `SUBSCRIPTION_PLANS` in `src/lib/subscriptions.ts` stays as the fallback default when the database has no row yet, so nothing breaks mid-migration.
