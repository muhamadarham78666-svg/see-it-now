# Custom Long Question in Writing / Composition

## What will change
- Add a **Custom Long Question** box inside Advanced Options → Writing / Composition.
- Let the teacher type a complete question in English or Urdu and choose its marks.
- Add an **Add to Long Questions** button; added questions will appear below the box and can be removed before generation.
- Automatically increase the Long Questions count when a custom question is added, so the paper totals stay consistent.
- Include each custom entry in the generated result as a real Long Question, not merely as an AI instruction.
- Save it with the other generated questions so it works in preview, editing, Question Bank, Papers, PDF, and downloads.
- Prevent empty or duplicate custom questions and show a clear confirmation after adding.

## Technical details
- Extend generation settings with structured custom long questions (`text` and `marks`).
- Preserve custom questions even if the AI or offline generator returns fewer questions.
- Use the selected paper language, including Urdu RTL display where applicable.
- Validate the generation flow and type checks after implementation.
