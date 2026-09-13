# Paper + Notes cleanup plan

## 1. Question Papers merged into Generate Questions
- Generate Questions page gets two tabs at the top: **Generate** and **Question Paper**.
- The paper builder moves into the second tab, so both live on one screen.
- The separate "Papers" item is removed from the sidebar; the dashboard quick action and the old `/dashboard/papers` link open the paper tab of the Generate screen (old link keeps working via redirect).

## 2. Card order on Generate Questions
- Upload / drag-and-drop card moves to the top.
- The whole Paper Setup (class, group, book, chapters, range) card moves below it.
- Everything else keeps its current order.

## 3. Clean paper output (no stray symbols)
- Strip math/markdown wrappers from every generated question, option, part and statement before it is shown or printed: `$ ... $`, `\( \)`, `\[ \]`, `\text{}`, `**`, `__`, backticks, stray `#`, escaped `\\`.
- Math converts to plain readable form (e.g. `x^2`, fractions written inline) instead of raw LaTeX.
- Applies to preview, question bank, and PDF/print.

## 4. Diagrams only when asked
- When the diagram toggle is off, any diagram the AI returns is dropped (image and caption), so the paper stays clean.
- When it is on, diagrams render as before.

## 5. Questions strictly from the book
- The paper prompt is tightened: questions must come only from the uploaded material, or — when no file is given — only from the selected Punjab textbook, class and chapters. No outside/extra topics, no material beyond the chosen chapters.
- Selected chapters become a hard boundary in the prompt, and off-syllabus wording is forbidden.

## 6. Notes from the book only
- AI Notes gets class, book and chapter pickers (same curriculum list as the paper generator).
- Notes prompt is rewritten to build notes strictly from the uploaded material or the chosen book/chapter — no outside sources, no invented extra content.

## 7. Special Instructions obeyed accurately
- Teacher instructions are sent as the top-priority block and repeated as a final check line telling the model to re-read them and confirm every point is applied before answering.
- Instructions also drive counts, marks, sections and question kinds ahead of the board pattern.

## Technical notes
- `src/lib/paperText.ts` (new): shared `cleanPaperText()` sanitizer used by `generate.server.ts` normalization and `paperExport.ts`.
- `src/lib/generate.server.ts`: stricter source-boundary rules, instruction re-check line, diagram suppression, text cleaning in `normalizeQuestions`.
- `src/pages/GeneratePage.tsx`: tabbed layout + card reorder.
- `src/routes/dashboard.papers.tsx`: redirect to `/dashboard/generate?tab=paper`.
- `src/components/dashboard/DashboardLayout.tsx`: remove Papers nav entry.
- `src/lib/notes.server.ts` / `notes.functions.ts` / `src/pages/NotesPage.tsx`: book scoping fields + strict source rule.
