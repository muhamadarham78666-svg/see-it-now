# Bulk Question Bank + Fully Offline Paper Generator

Maqsad: Admin ke Question Bank mein aapki di hui latest books (9th–12th, 91 books, 1026 chapters) ke hisab se bulk data ban jaye, aur user dashboard ke paper generator ke **saare** options AI ke baghair usi data se chalein — bila limit.

## 1. Bulk data banane ka engine (Admin → Question bank)

- Naya **Bulk fill** hissa: scope chunein — poori class, ek book, ya "sab kuch".
- Har chapter ka target: MCQs, short, long, aur (jahan book mein hota hai) مفہوم/statements, composition aur translation items.
- Data sirf aapki registry (curriculum.ts) ke books aur chapters se banega — bahar se koi book nahi.
- Engine **resumable** hai: har qadam par wo chapter uthata hai jo target se peeche hai, batch banata hai, save karta hai, progress dikhata hai (kitne chapters done, kitne sawal bane, kya baqi hai). Tab band ho jaye to agli dafa wahi se chalta hai.
- Duplicate sawal khud rukte hain (fingerprint), aur key ka quota khatam ho to engine ruk kar wajah batata hai — chup-chaap paid AI par nahi jata.
- Yaad rahe: 1026 chapters ka poora bank ek baithak mein nahi banta (rozana key limit). Engine chalta rahega; main pehle **9th–12th ke main science/compulsory books** se shuru karwata hoon taake aap owner account se foran check kar sakein.

## 2. Offline paper — AI wale sab options

Generate screen ke saare options ab bank se poore honge:

- MCQ / short / long ki ginti (jitni marzi), difficulty mix, English/Urdu/both.
- Long questions ke parts (a), (b), Attempt Any 2/3/4, مفہوم/statements, composition items, translation.
- Board pattern aur marks ka hisaab, chapter-wise barabar taqseem, haal ke sawal dobara nahi.
- Kami ho to saaf message: kis type ke kitne sawal mile.

Iske liye bank mein additive columns: `category`, `parts`, `statement` (purana data waise hi rahega).

## 3. Bila limit

- Offline paper par rozana limit khatam — Silver/Gold/Diamond sab jitni dafa chahein paper banayein (AI credit kharch nahi hota).
- AI wala raasta pehle jaisa sirf Diamond ke liye.

## 4. Aap ka check

Data ban jane ke baad aap owner account se login kar ke Admin → Question bank mein dekh sakenge (class/book/chapter filter, sawal edit/delete), aur Generate screen se offline paper bana kar approve karenge.

## Technical notes

- Migration: `bank_questions` mein `category text not null default ''`, `parts jsonb`, `statement text`; index on (class_level, book, chapter, question_type).
- New `src/lib/bankBulk.functions.ts` + `bankBulk.server.ts`: `bankBulkPlanFn` (scope → chapters + missing counts), `bankBulkStepFn` (ek chapter/batch, AI se sawal, bank mein save, next target return), `bankBulkProgressFn`.
- `AdminBankPanel.tsx` mein runner UI: start/pause, live progress, per-chapter log.
- `offlinePaper.server.ts`: category/parts/statement aware selection, composition/translation/attempts support; `offlinePaper.functions.ts` se `assertPaperQuota` hata, counts caps barhaye.
- `GeneratePage.tsx`: bank mode ko poore paper settings (longParts, attempts, statements, composition, translation) forward.
