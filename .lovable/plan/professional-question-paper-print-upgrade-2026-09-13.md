# Professional Question Paper Print Upgrade

## Goal

Rebuild preview, print and PDF output around the selected **Modern Professional Academic v4** direction. The paper will be compact, formal, customizable, and will naturally use one page for short papers or continue to two or more pages for longer papers.

## What will change

### 1. Correct question layout

- Remove every visual highlight/marker effect; the yellow markings in the references will never appear in output.
- Put roman item numbers inline: **(i) Question text...**, not on a separate row above it.
- Keep MCQs under Q1; start short questions at Q2 and long questions at the next section number. yani Ovbjective ke nichy aye Q1. 
- Preserve long-question parts as **(a)** and **(b)**.
- Do not print topic names or selected chapter names with individual questions or in the paper details.
- Keep marks aligned neatly at the far edge without splitting question text.

### 2. Section rules and choices

- Give every section a clear divider line, title and marks summary.
- Print a section-specific choice line such as **Attempt any 2 of the following questions**.
- Use the teacher's chosen attempt count; do not invent a choice when none is selected.
- Keep a section heading and its first question together across page breaks.

### 3. Compact automatic pagination

- Reduce oversized vertical gaps, margins, answer space and header height.
- Use normal A4 document flow: a small chapter paper should fit one page, while half/full-book papers continue cleanly to later pages.
- Avoid forcing every section onto a new page and avoid splitting a question, options or diagram where possible.
- Add print-safe page sizing and sensible widows/orphans rules.

### 4. Four templates plus full customization

- Use **Modern Professional Academic v4** as the default.
- Add four polished presets: **Modern Professional**, **Classic Board**, **Compact Exam**, and **Formal Institutional**.
- Let the teacher customize accent color, heading/body font, font size, page density/margins, divider style, logo size and header alignment.
- Add a reset-to-template action; manual changes override the selected preset.
- Make preview, print and PDF share the exact same renderer so their layout cannot disagree.

### 5. Header, logo and institution

- Make the institution name the strongest header text.
- Automatically fit PNG, JPG or other supported uploaded logos without stretching or cropping.
- Provide Small / Medium / Large logo sizing, with Medium as the balanced default.
- Keep logo and institution aligned as one professional header; reserve stable space so different logo shapes do not disturb the page.
- Keep subject, class, time, date and total marks in a compact details strip.

### 6. Save and reuse settings

- Persist the selected template and custom print settings with saved papers.
- Carry the same options from generated-question preview into **My Papers**.
- Preserve footer and watermark controls, with watermark optional and off when empty.

## Technical details

- Consolidate the duplicate Paper Builder HTML/preview code into the existing shared paper exporter.
- Extend paper metadata and saved paper fields for the selected preset and customization values.
- Render question rows as a single inline number/text layout and remove chapter from printable metadata.
- Add CSS print rules for A4 pagination, compact spacing, section break protection, image fitting and RTL Urdu alignment.
- Keep custom colors as paper-level print settings; application interface colors remain on existing design tokens.

## Verification

- Compare preview and printed/PDF output using MCQ, short and long sections.
- Check inline **(i)** numbering, no topic/chapter labels, and no yellow highlighting.
- Test Attempt Any 2/3/4, long parts, diagrams, Urdu RTL, different logo aspect ratios and all four templates.
- Test a short paper fitting one A4 page and a longer paper flowing cleanly to two pages.
- Verify desktop and mobile preview controls and confirm no text overlap or clipped marks.