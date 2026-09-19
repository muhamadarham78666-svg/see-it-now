# Offline Question Bank + Plan-wise Access

Maqsad: app apne data se kaam kare (AI ke baghair), aur AI sirf Diamond ke liye rahe. Firebase baad ke marhale mein.

## 1. Apna Question Bank (offline data)

Ek naya "Question Bank (Master)" hissa admin ke andar:

- Excel/CSV file upload — ek dafa hazaron sawal.
- Columns: Class, Book, Chapter, Type (mcq/short/long), Question, Option A–D, Correct answer, Marks, Difficulty, Language (English/Urdu), Answer/points, Topic.
- Upload se pehle preview: kitne sawal sahi hain, kitni rows mein ghalti hai, aur kya ghalti hai — ghalat rows skip, baqi import.
- Duplicate sawal khud pakde jayein (same sawal dobara import na ho).
- Upload ke baad list: class/book/chapter/type se filter, search, single sawal edit ya delete, aur poori upload wapas hatane ka option.
- Sample Excel file download button, taake format sahi rahe.
- Admin me esa system bnana ke waha se hm easily sara data dal saky or save kr sky mcqs short long or istra ke Jo Jo hoty he wo sab
- AI se sara data bnawaye ge Jo jo chapters save he classes save he sab ke liye  aik chapter me se 200 mcqs 50 short 50 long or Jo Jo hota hewobi isi calculation ke hisab se krna he jisme mahfoom paragraph etc sab hota he
- &nbsp;

## 2. Offline Paper Generator (AI ke baghair)

Generate screen par do tareeqe:

- **Apne bank se (offline)** — default. Class, book, chapters, MCQ/short/long ki ginti, difficulty, language chunein; app apne bank se sawal chun kar paper bana deta hai. Fauri, koi credit kharch nahi.
- Khud pa khud bna kr dedy hmry provide kiye sawal short long question or mcqs 
- **AI se** — sirf Diamond.

Offline chunaav ke usool:

- Chapters ke darmiyan barabar taqseem (har chapter se hissa).
- Difficulty ka mix jaisa chuna gaya ho.
- Board pattern aur marks ka hisaab pehle jaisa hi.
- Ek hi user ko haal hi mein diye gaye sawal dobara na aayein (har baar naya paper).
- Agar kisi chapter mein sawal kam hain to saaf message: "Is chapter mein sirf N sawal hain — admin se aur add karwayein" (chup-chaap AI par nahi jayega).

Paper ka preview, edit, aur PDF/print sab pehle jaisa chalega.

## 3. Plan-wise access


| Feature                 | Silver              | Gold                         | Diamond           |
| ----------------------- | ------------------- | ---------------------------- | ----------------- |
| Offline Paper Generator | Haan (rozana limit) | Haan (rozana limit barh kar) | Haan (bila limit) |
| Question Bank browse    | Haan                | Haan                         | Haan              |
| Notes Generator         | Crown               | Crown                        | Haan              |
| Book Solver / Solve     | Crown               | Crown                        | Haan              |
| NSAGPT AI chat          | Crown               | Crown                        | Haan              |
| AI se paper             | Crown               | Crown                        | Haan              |


- **Crown** = feature dikhta hai magar lock: sunehri crown ka chamakta (shine + pulse) animation, "Diamond mein shamil" badge, click par khubsurat upgrade card jisme plan ka faida aur "Upgrade request" button.
- Upgrade request wahi maujooda system use karega (admin ke paas jata hai, manual approve).
- Silver/Gold ke liye AI ke saare raste server par bhi band — sirf UI chhupana kaafi nahi.
- Owner/admin/editor par koi rok nahi.

## 4. Rozana limits (offline)

- Silver: 5 paper / din
- Gold: 25 paper / din
- Diamond: bila limit + AI
- Ye number admin ke Plans panel se badle ja sakte hain (code chhune ki zaroorat nahi).
- Admin portal or esa system hoga jaha pr bulk me Aik bar AI se data bnwa kr ap usme dal sku ge or jab bi user generat kry ga paper usi data se nikl aye ga easily Baki sab same procedure rahy ga jesa he 

## 5. Plan cards aur homepage

Plan cards par ab saaf likha hoga kis plan mein kya hai (offline paper, notes, solver, AI) — tick aur crown ke sath, wahi rangeen andaaz.

## 6. Firebase (agla marhala — abhi nahi)

Aap ne kaha pehle offline system. Firebase shift ke liye baad mein alag plan bana kar ijazat loonga: login, users, question bank, papers Firebase par le jana, aur purana data migrate karna. Abhi ka kaam Firebase par shift hone ke baad bhi waise hi chalega kyunki data ka dhaancha wahi rahega.

## Meri tajaveez (extra behtari)

1. **Paper banane mein "sawal badlo"** — kisi ek sawal par click kar ke bank se doosra sawal le lena (AI ke baghair).
2. **Chapter-wise sehat** — admin panel mein dikhaye ke kis chapter mein kitne MCQ/short/long hain, kahan kami hai.
3. **Ready paper templates** — "Half book test", "Full book", "Chapter test" ek click par.
4. **Answer key** — offline paper ke sath jawabat ki alag PDF (data mein jawab already hoga).
5. **Import history** — kis din kitne sawal add hue, zaroorat par wapas hatana.

## Technical notes

- New tables: `bank_questions` (class_level, book, chapter, type, text, options jsonb, correct, expected, points jsonb, marks, difficulty, language, topic, fingerprint unique, import_id, created_by), `bank_imports` (file name, counts, status, created_by). RLS: staff write, `authenticated` read-only SELECT; GRANTs included.
- `plan_settings` mein additive columns: `features jsonb` (feature keys allowed) + `daily_paper_limit int`.
- New `src/lib/entitlements.ts` (client) + `entitlements.server.ts` (`requireFeature(context, feature)`), jo `subscriptions.plan_key` + `plan_settings.features` se faisla kare; staff bypass.
- Har AI server fn (`generate`, `notes`, `solve`, `ask`, `plan`) mein `requireFeature(..., 'ai')` — Diamond ke ilawa 403.
- New `src/lib/offlinePaper.functions.ts` + `offlinePaper.server.ts`: bank se chapter-balanced chunaav, recent-usage avoid, daily limit check (`ai_usage_events` jaisa `paper_events` counter).
- CSV/XLSX parsing client par (`xlsx` package), server par row-wise validate + bulk insert.
- New UI: `src/components/admin/AdminBankPanel.tsx`, `src/components/CrownLock.tsx` (shine/pulse animation + upgrade modal), GeneratePage mein source toggle (Offline / AI).
- Sidebar aur dashboard cards locked features par `CrownLock` se wrap.