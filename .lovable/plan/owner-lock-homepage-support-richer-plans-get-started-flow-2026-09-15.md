# Owner lock, homepage support, richer plans & Get Started flow

## 1. Owner account — permanently protected
- `muhammadzain7000@gmail.com` (Muhammad Zain) پہلے سے owner ہے۔ اب admin portal میں یہ صاف نظر آئے گا: نام کے ساتھ **Owner** badge۔
- Owner کی row پر delete button اور role change controls نہیں دکھیں گے (server already blocks it, ab UI bhi match karega).
- Users list میں ہر user کے لیے admin toggle کی جگہ ایک **role selector**: User / Editor / Admin.
- Editor یا Admin بنانے کا اختیار صرف owner کے پاس ہوگا؛ باقی admins یہ نہیں کر سکیں گے۔ Owner کو کوئی remove یا demote نہیں کر سکے گا (server-side دوبارہ چیک ہوگا)۔
- ہر role change audit log میں جائے گا (پہلے سے موجود system).

## 2. Homepage پر Support option (new visitors کے لیے)
- Homepage پر ایک floating support button + panel۔
- سب سے پہلے چھوٹا form: نام، email، phone/WhatsApp — تصدیق کے بعد chat شروع ہوگی۔
- AI support جواب دے گا۔ جہاں AI کو لگے کہ کام NSAGPT team کا ہے، وہ خود conversation کو team کے حوالے کر دے گا (اور visitor بھی "Talk with NSAGPT Team" دبا سکے گا)۔
- ہر guest conversation admin portal کے **Support** tab میں آئے گی، صاف نشان کے ساتھ کہ یہ homepage سے ہے، اور نام/email/phone کے ساتھ۔
- Admin وہیں سے reply کر سکے گا (visitor کو اسی panel میں نظر آئے گا، اس کے browser سے وابستہ) اور اسی reply کی **email** بھی بھیج سکے گا۔
- نئی conversation یا نئے پیغام پر admin کو email اطلاع جائے گی؛ portal میں realtime update ہوگا۔

## 3. Subscription cards — animations, colours, benefits
- Silver / Gold / Diamond کے لیے الگ رنگ اور gradient: Silver = slate/silver, Gold = amber/gold glow, Diamond = cyan-violet shine.
- Hover lift, soft glow, shine sweep، اور "Most popular" badge کی subtle pulse (motion-reduce respected).
- ہر plan میں فوائد کی واضح list، مثلاً:
  - **Silver — Weekly, Rs. 399, 1 user:** paper generator، AI notes، book solver، PDF export، ایک ہفتہ trial جیسا استعمال۔
  - **Gold — 3 Months, Rs. 4,999, 3 users:** سب کچھ + 3 teachers، تمام paper templates، Urdu papers، priority support، بہترین value۔
  - **Diamond — 1 Year, Rs. 10,500, 5 users:** سب کچھ + 5 users، پورا سال، سب سے کم ماہانہ خرچ، fastest support۔
- قیمتیں اور user limits وہی مرکزی config سے آئیں گی (کوئی نئی قیمت invent نہیں ہوگی)۔ Online payment بالکل نہیں۔

## 4. "Get Started" پر خوبصورت choice card
- Get Started دبانے پر ایک aesthetic modal:
  - **I already have an account → Sign in** (login page).
  - **I'm new → Get access** (subscription plan select کریں)۔
- New user والا راستہ plan selection دکھائے گا (Silver/Gold/Diamond) اور پھر وہی request form (نام، email، phone، message)۔
- Submit کے بعد صاف پیغام: request admin کے پاس گئی، verification کے بعد approve ہوگی اور login details email ہوں گی۔
- یہی modal login page کے "Contact administrator" راستے سے consistent رہے گا۔

## 5. میری تجاویز (اسی کام کے ساتھ)
- Homepage support اور dashboard support ایک ہی admin inbox میں — الگ نظام نہیں۔
- Admin portal میں support/subscription کے unread counts badge کی صورت میں۔
- Subscription request میں duplicate email spam سے بچاؤ (short cool-down)۔

## Technical notes
- `support_threads` میں پہلے سے `source` اور `guest_email` موجود ہیں؛ guest threads کے لیے `guest_name`, `guest_phone`, اور ایک secret `guest_token` column شامل ہوں گے (تاکہ visitor بغیر account اپنی chat واپس دیکھ سکے)۔ Grants + RLS: public کچھ نہیں پڑھ سکے گا؛ سارا access server functions سے ہوگا۔
- نئی public server functions: guest thread start / send message / poll messages — rate-limited اور validated؛ AI reply موجودہ `support.server.ts` brain استعمال کرے گا۔
- Admin reply + "email this reply" موجودہ admin token + `assertAdmin` اور موجودہ Brevo email service پر بنے گا۔
- Owner/editor role rules `src/lib/roles.ts` سے آئیں گی؛ server side پر owner protection پہلے سے موجود ہے، اسے role-grant path پر بھی لاگو کیا جائے گا۔
- Get Started modal + pricing changes صرف frontend (`Hero`, `LandingNav`, `PricingSection`, نیا `GetStartedModal`)۔

## Validation
- Owner row: delete/demote controls غائب اور server reject؛ owner سے admin/editor بنانا کام کرے۔
- Homepage support: form → chat → AI reply → escalate → admin portal میں نظر آنا → admin reply visitor کو اور email میں۔
- Pricing cards اور Get Started modal mobile, tablet, desktop پر چیک۔
- Request submit → admin approve → login کام کرے۔
