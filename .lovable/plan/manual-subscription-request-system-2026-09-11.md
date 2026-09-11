# Manual Subscription Request System

## Goal
Online payment ابھی شامل نہیں ہوگا۔ صارف Silver، Gold یا Diamond منتخب کرکے اپنا نام، فون/WhatsApp اور email جمع کرے گا۔ NSAGPT ٹیم اس سے رابطہ کرے گی، پھر admin portal سے account اور subscription فعال کرے گی۔

## User Flow
1. Homepage پر ایک مستقل pricing section دکھائیں گے:
   - Silver — Weekly — Rs. 399 — 1 user
   - Gold — 3 Months — Rs. 4,999 — 3 users
   - Diamond — 1 Year — Rs. 10,500 — 5 users
2. ہر plan کا **Select Plan** بٹن اسی plan کے ساتھ request form کھولے گا۔
3. Form میں selected plan واضح اور locked ہوگا؛ صارف نام، email، فون/WhatsApp اور optional message دے گا۔
4. Submit پر request backend میں محفوظ ہوگی، صارف کو confirmation email ملے گی، اور admin کو نئی request کی اطلاع جائے گی۔
5. Success message واضح کرے گا کہ NSAGPT ٹیم رابطہ کرکے subscription فعال کرے گی؛ کوئی online payment نہیں لیا جائے گا۔

## Admin Flow
1. Admin portal میں الگ **Subscriptions** tab شامل ہوگا، access requests سے الگ۔
2. ہر request میں plan، duration، price، user limit، contact details، status اور submission time دکھے گا۔
3. Admin request کو contact/reject کر سکے گا، یا **Create account & activate** سے account بنا سکے گا۔
4. Activation پر start date، calculated end date اور plan limits backend میں محفوظ ہوں گے، request approved ہوگی، اور login/subscription details email ہوں گی۔
5. Existing users کے لیے admin اسی request کو ان کے account سے جوڑ کر subscription activate/renew کر سکے گا، duplicate account بنانا ضروری نہیں ہوگا۔

## Subscription Enforcement
- Active subscription record backend کا واحد معتبر source ہوگا۔
- Dashboard پر plan، start/end date، remaining time اور user limit نظر آئے گی۔
- Expired subscription پر protected AI actions server-side block ہوں گے اور یہ پیغام آئے گا: **“Subscription Ended — Contact with NSAGPT Team”**.
- Silver/Gold/Diamond configuration ایک مرکزی جگہ سے استعمال ہوگی تاکہ homepage، admin، emails اور dashboard ہمیشہ یکساں رہیں۔

## Technical Details
- New tables: `subscription_requests` and `subscriptions`, with explicit grants, RLS, timestamps and secure status rules.
- Public visitors may only submit requests; they cannot read or alter them.
- Subscription activation and management require authenticated admin role plus the existing private admin verification step.
- Reuse the existing Brevo email service and existing account-creation flow.
- Add realtime refresh for subscription requests in the admin portal.
- No Paddle, Stripe, merchant account, checkout, card fields, or payment webhook will be added.

## Validation
- Test request submission and duplicate-submit protection.
- Verify user/admin emails and realtime admin visibility.
- Verify activation, renewal, expiry calculation, account linking, and server-side AI blocking.
- Check homepage, form, dashboard and admin portal on desktop, tablet and mobile.
