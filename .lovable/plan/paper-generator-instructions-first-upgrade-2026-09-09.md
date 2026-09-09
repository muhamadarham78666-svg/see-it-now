# Paper Generator — Instructions-First Upgrade

## Goal
Whatever the teacher writes in **Special Instructions** becomes the paper. Plus proper board-style numbering, choice options, and full English/Urdu paper sections.

## 1. Cleanup (small, visible)
- Top bar board chip: remove the **Class** chips, keep only the board list.
- Remove **NSAGPT AI** from the left menu (it already sits on the dashboard as a card). The ask page and dashboard card keep working.

## 2. Special Instructions become the highest authority
- Instructions box gets a bigger, clearer area with example hints (paper style, sections, marks, choice, language, diagrams, essay/letter, translation).
- Before generating, a **"Best approach" suggestion** appears: the AI reads the instructions plus the chosen class/book/chapters and replies with
  - a short plain-language summary of the paper it will build,
  - the recommended section layout, marks, choice rules and language,
  - anything it thinks would work better.
  The teacher can **Apply suggestion** (it fills the settings) or **Generate anyway** and ignore it.
- Instructions are also parsed for intent so switches follow the text automatically: diagrams, "attempt any N", parts (a)/(b), Urdu-only, essay/letter/translation, marks per section.

## 3. Diagrams
- A clear **Add diagrams** switch stays in the options.
- Writing "diagram", "figure", "شکل" etc. in the instructions turns diagrams on by itself.

## 4. Paper numbering and layout (preview, print, PDF, Word, text)
- Numbering restarts per section: MCQ section is **Q1** with sub-items **(i), (ii), (iii)…** — no separate Q number on every MCQ.
- Short section starts at **Q2**, long at **Q3**, each with its own item numbers.
- Long questions keep parts **(a)** and **(b)**.
- Each question can print a short statement / مفہوم line under it when the AI supplies one.
- Choice line printed per section: "Attempt any 8 of 12" for short and long sections (and MCQ when a choice is set).

## 5. English paper sections
Generated on request or automatically for English books: letter, story, application, essay, short conceptual questions, and a translation part (Urdu → English and English → Urdu paragraphs) with a choice of which side to translate — plus the AI's own recommendation.

## 6. Urdu / Islamiat papers, fully in Urdu
Everything A to Z in Urdu: headings, instructions, section names, marks words. Includes options for
- نظم / غزل کے اشعار کی تشریح
- کہانی، خط، مکالمہ، مضمون
- خلاصہ اور مرکزی خیال

## 7. Main page refresh
The home page features/how-it-works copy is updated so visitors see what the app now does: instruction-driven papers, board patterns, diagrams, choice questions, full Urdu papers, English composition and translation, solvers, notes.

## Technical notes
- `src/lib/generate.server.ts`: instruction builder gains blocks for composition types, translation, tashreeh/khulasa/markazi khayal, statement/mafhoom, per-section numbering hints, forced-Urdu output; JSON shape extended with `statement` and `category`; `normalizeQuestions` maps them.
- New `src/lib/plan.server.ts` + `plan.functions.ts`: `suggestPaperPlanFn` returns `{ summary, sections, recommendations, settingsPatch }` from instructions + curriculum context.
- `src/lib/paperPatterns.ts`: add English composition and Urdu composition section presets per subject.
- `src/lib/paperExport.ts` + `PaperPreviewModal.tsx`: section-scoped numbering, roman sub-items for MCQs, per-section choice note, statement line, Urdu label set when the paper is Urdu.
- `src/pages/GeneratePage.tsx`: instruction textarea upgrade, suggestion panel with Apply/Ignore, composition toggles, instruction-intent parsing.
- `src/components/boards/BoardSelector.tsx`: `BoardChip` renders with `showClass={false}`.
- `src/components/dashboard/DashboardLayout.tsx`: drop the ask entry from `navItems`.
- `src/types/index.ts`: `statement`, `category` on `Question`.
- Landing copy: `Features.tsx`, `HowItWorks.tsx`.
