# Board-wise Papers + Admin Panel

## 1. Boards — no pop-up, inline selection

Pop-up dashboard par nahi aayega (aap ne khud yeh option choose kiya). Board selection wahin hoga jahan kaam hota hai:

- **Generate Questions** page ke settings panel mein, MCQ / Short / Long ke neeche ek naya "Board & Class" block:
  - Board (searchable dropdown, tamam boards)
  - Class (9 / 10 / 11 / 12)
  - Paper style preview chip (e.g. "BISE Lahore — Objective + Subjective")
- Selection **auto-save** hoti hai profile preferences mein, is liye har dafa dobara select karne ki zarurat nahi — top bar mein ek chota "Board: BISE Lahore ▾" chip se kabhi bhi badla ja sakta hai.
- Pehli baar login par ek **one-time soft banner** (pop-up nahi) — "Apna board select karein" — jo click par usi chip ko khol deta hai.

### Boards list (Pakistan)
- **Punjab**: Lahore, Gujranwala, Rawalpindi, Multan, Faisalabad, Sargodha, Bahawalpur, DG Khan, Sahiwal
- **Sindh**: Karachi, Hyderabad, Sukkur, Larkana, Mirpurkhas, Shaheed Benazirabad, Aga Khan Board (AKU-EB)
- **KPK**: Peshawar, Mardan, Abbottabad, Swat, Kohat, DI Khan, Bannu, Malakand
- **Balochistan**: Quetta
- **Others**: FBISE (Federal), AJK Mirpur, Gilgit-Baltistan
- **International**: Cambridge O/A Level, IGCSE, IB
- Plus "Custom / Other board" option apne heading ke saath.

## 2. Board ke hisab se paper style

Har board ka ek style template hoga jo paper preview aur download mein apply hoga:

- Header format: board ka naam, "Annual/Supplementary Examination", roll no. box, time allowed, total marks
- Sections ki tarteeb aur naming (Objective Type — Q.1 MCQs with circles; Subjective — Section B short questions with "Attempt any X of Y", Section C long questions)
- Marks distribution ka default (e.g. Punjab 9th: MCQ 12, Short 22, Long 16)
- Language/RTL handling (Urdu boards ke liye Nastaliq + RTL header)
- Cambridge/IB ke liye alag clean international layout

Yeh sab ek hi jagah define hoga (`boardStyles`), taake naye board add karna aasan rahe. Aap paper preview mein style badal kar dobara dekh sakte hain.

## 3. Admin login + admin panel

- Login page par ek **selector**: "User" | "Admin" (segmented toggle). Admin choose karne par wahi email/password form, lekin login ke baad `/admin` par redirect.
- Admin sirf server-side verify hoga (role table se) — agar user admin nahi hai to साफ़ message: "This account has no admin access."
- **Admin panel** (`/admin`) tabs:
  - **Reviews**: pending reviews approve / reject / delete, approved list edit
  - **Users**: list (name, email, role, join date), role toggle user/admin, kisi user ka display name theek karna
  - **Boards**: board list par enable/disable aur custom board add
  - **Settings**: chhoti site-level cheezein (landing page contact email, marketing text toggle)

## Technical notes

- **DB migration**: `user_roles` table + `app_role` enum + `has_role()` security-definer function (roles kabhi profile par nahi rakhe jate). `profiles` mein `board` + `class_level` preference. `boards` table (code, name, region, active) seed ke saath. Reviews par admin-only update/delete policies via `has_role`.
- **Admin reads/writes**: `createServerFn` + `requireSupabaseAuth`, har handler mein `has_role(uid,'admin')` check; `/admin` route `_authenticated`-style guard + client-side role check.
- **Frontend**: naya `src/lib/boards.ts` (list) aur `src/lib/boardStyles.ts` (paper templates), `BoardSelector` component (Generate settings + top-bar chip), `PaperPreviewModal` mein board style apply, `src/pages/AdminPage.tsx` + route.
- Existing papers/questions par koi asar nahi — board field optional hai, default "Custom / Other".

## Order of work
1. Migration (roles, boards, profile fields, review policies)
2. Boards data + style templates + selector UI (Generate + chip + soft banner)
3. Paper preview/export board styling
4. Admin login selector + admin panel (reviews, users, boards)
5. End-to-end check in browser
