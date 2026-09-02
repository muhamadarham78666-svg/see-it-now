import type { Question } from '@/types';
import { getBoardStyle } from '@/lib/boardStyles';

export interface PaperMeta {
  title: string;
  institutionName?: string;
  subject?: string;
  className?: string;
  chapter?: string;
  examName?: string;
  examDate?: string;
  examTime?: string;
  instructions?: string;
  /** Optional logo (data URL or https URL) printed in the paper header. */
  logoUrl?: string;
  /** Optional footer note, e.g. "Best of luck". */
  footerNote?: string;
  /** Board name printed in the header, e.g. "BISE Lahore". */
  boardName?: string;
  /** Board style key controlling section names, header and layout. */
  boardStyle?: string;
}


const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function buildPaperHtml(
  meta: PaperMeta,
  questions: Question[],
  options: { withAnswers: boolean },
): string {
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const isUrduPaper = questions.length > 0 && questions.every((q) => q.language === 'urdu');

  const metaLine = [
    meta.subject && `Subject: ${escapeHtml(meta.subject)}`,
    meta.className && `Class: ${escapeHtml(meta.className)}`,
    meta.chapter && `Chapter: ${escapeHtml(meta.chapter)}`,
    meta.examDate && `Date: ${escapeHtml(meta.examDate)}`,
    meta.examTime && `Time: ${escapeHtml(meta.examTime)}`,
  ]
    .filter(Boolean)
    .join(' &nbsp;•&nbsp; ');

  const style = getBoardStyle(meta.boardStyle);

  const groups: { key: Question['question_type']; label: string }[] = [
    { key: 'mcq', label: style.sections.mcq },
    { key: 'short', label: style.sections.short },
    { key: 'long', label: style.sections.long },
  ];

  let counter = 0;
  const sections = groups
    .map(({ key, label }) => {
      const items = questions.filter((q) => q.question_type === key);
      if (!items.length) return '';
      const sectionMarks = items.reduce((s, q) => s + (q.marks || 0), 0);
      const note =
        style.attemptAnyNote && key !== 'mcq' && items.length > 2
          ? `<p class="note">Attempt any ${Math.max(1, items.length - 1)} of ${items.length} questions. (${sectionMarks} marks)</p>`
          : '';
      const rows = items
        .map((q) => {
          counter += 1;
          const rtl = q.language === 'urdu';
          const opts =
            q.question_type === 'mcq' && q.options
              ? `<ol class="opts">${q.options
                  .map(
                    (o) =>
                      `<li><span class="lbl">${escapeHtml(o.label)}.</span> ${escapeHtml(o.text)}</li>`,
                  )
                  .join('')}</ol>`
              : '';
          const answer = options.withAnswers
            ? `<div class="answer"><strong>Answer:</strong> ${escapeHtml(
                q.question_type === 'mcq'
                  ? (q.correct_answer ?? '—')
                  : q.question_type === 'short'
                    ? (q.expected_answer ?? '—')
                    : (q.answer_points ?? []).join(' • ') || '—',
              )}</div>`
            : '';
          return `<div class="q ${rtl ? 'rtl' : ''}">
            <div class="qhead"><span class="qno">Q${counter}.</span>${style.perQuestionMarks ? `<span class="marks">(${q.marks})</span>` : ''}</div>
            <p class="qtext">${escapeHtml(q.question_text)}</p>
            ${opts}
            ${q.question_type !== 'mcq' ? '<div class="space"></div>' : ''}
            ${answer}
          </div>`;
        })
        .join('');
      return `<section><h2>${escapeHtml(label)}</h2>${note}${rows}</section>`;
    })
    .join('');


  return `<!DOCTYPE html>
<html lang="${isUrduPaper ? 'ur' : 'en'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(meta.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 0; padding: 36px 44px; line-height: 1.6; }
  header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 22px; }
  header .brand { display: flex; align-items: center; justify-content: center; gap: 14px; }
  header .brand img { height: 64px; width: auto; max-width: 130px; object-fit: contain; }
  header h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: .3px; }
  footer { margin-top: 28px; padding-top: 10px; border-top: 1px dashed #999; text-align: center; font-size: 12.5px; font-weight: bold; }
  header .exam { font-size: 16px; font-weight: bold; margin-bottom: 6px; }
  header .meta { font-size: 12px; color: #333; }
  .totals { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 16px; }
  .instructions { border: 1px solid #bbb; background: #fafafa; padding: 10px 14px; font-size: 12.5px; margin-bottom: 22px; white-space: pre-wrap; }
  section { margin-bottom: 26px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .6px; border-bottom: 1px solid #999; padding-bottom: 6px; margin: 0 0 14px; }
  .q { margin-bottom: 16px; page-break-inside: avoid; }
  .qhead { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
  .qtext { margin: 2px 0 8px; font-size: 14px; text-align: left; }
  .opts { list-style: none; padding: 0; margin: 0 0 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; font-size: 13.5px; }
  .opts .lbl { font-weight: bold; }
  .space { border-bottom: 1px dotted #999; height: 26px; margin-bottom: 6px; }
  .answer { font-size: 12.5px; color: #14532d; background: #f0fdf4; border-left: 3px solid #16a34a; padding: 6px 10px; }
  .rtl { direction: rtl; }
  .rtl .qtext, .rtl .opts { font-family: 'Noto Nastaliq Urdu', serif; text-align: right; line-height: 2.2; }
  .rtl .qhead { flex-direction: row-reverse; }
  @media print { body { padding: 18px 24px; } }
</style>
</head>
<body>
  <header>
    <div class="brand">
      ${meta.logoUrl ? `<img src="${escapeHtml(meta.logoUrl)}" alt="Logo" />` : ''}
      <div>
        ${meta.institutionName ? `<h1>${escapeHtml(meta.institutionName)}</h1>` : ''}
        <div class="exam">${escapeHtml(meta.examName || meta.title)}</div>
      </div>
    </div>
    ${metaLine ? `<div class="meta">${metaLine}</div>` : ''}
  </header>
  <div class="totals"><span>Total Questions: ${questions.length}</span><span>Total Marks: ${totalMarks}</span></div>
  ${meta.instructions ? `<div class="instructions"><strong>Instructions:</strong>\n${escapeHtml(meta.instructions)}</div>` : ''}
  ${sections}
  ${meta.footerNote ? `<footer>${escapeHtml(meta.footerNote)}</footer>` : ''}
</body>
</html>`;
}

export interface NoteDoc {
  title: string;
  content: string;
  subject?: string | null;
  institutionName?: string;
  logoUrl?: string;
}

/** Printable HTML for a note: supports #/##/### headings, -/* bullets and **bold**. */
export function buildNoteHtml(note: NoteDoc): string {
  const isUrdu = /[\u0600-\u06FF]/.test(note.content);
  const inline = (line: string) =>
    escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  const blocks: string[] = [];
  let listOpen = false;
  const closeList = () => {
    if (listOpen) {
      blocks.push('</ul>');
      listOpen = false;
    }
  };

  for (const raw of note.content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = Math.min(4, heading[1]!.length + 1);
      blocks.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
      continue;
    }
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!listOpen) {
        blocks.push('<ul>');
        listOpen = true;
      }
      blocks.push(`<li>${inline(bullet[1]!)}</li>`);
      continue;
    }
    closeList();
    blocks.push(`<p>${inline(line)}</p>`);
  }
  closeList();

  return `<!DOCTYPE html>
<html lang="${isUrdu ? 'ur' : 'en'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(note.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "Georgia, 'Times New Roman', serif"}; color: #111; margin: 0; padding: 34px 42px; line-height: ${isUrdu ? '2.2' : '1.7'}; direction: ${isUrdu ? 'rtl' : 'ltr'}; }
  header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 18px; }
  header img { height: 58px; max-width: 120px; object-fit: contain; }
  header h1 { font-size: 21px; margin: 0; }
  header .sub { font-size: 12.5px; color: #444; margin-top: 2px; }
  h2 { font-size: 17px; margin: 20px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 15px; margin: 16px 0 6px; }
  h4, h5 { font-size: 14px; margin: 12px 0 6px; }
  p { margin: 0 0 9px; font-size: 14px; }
  ul { margin: 0 0 12px; padding-${isUrdu ? 'right' : 'left'}: 22px; }
  li { font-size: 14px; margin-bottom: 4px; }
  @media print { body { padding: 18px 24px; } }
</style>
</head>
<body>
  <header>
    ${note.logoUrl ? `<img src="${escapeHtml(note.logoUrl)}" alt="Logo" />` : ''}
    <div>
      ${note.institutionName ? `<div class="sub">${escapeHtml(note.institutionName)}</div>` : ''}
      <h1>${escapeHtml(note.title)}</h1>
      ${note.subject ? `<div class="sub">${escapeHtml(note.subject)}</div>` : ''}
    </div>
  </header>
  ${blocks.join('\n  ')}
</body>
</html>`;
}

export function printHtml(html: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}


export function buildPaperText(meta: PaperMeta, questions: Question[], withAnswers: boolean) {
  const lines: string[] = [];
  if (meta.institutionName) lines.push(meta.institutionName);
  lines.push(meta.examName || meta.title);
  const info = [meta.subject, meta.className, meta.chapter, meta.examDate].filter(Boolean);
  if (info.length) lines.push(info.join(' | '));
  lines.push(
    `Total Marks: ${questions.reduce((s, q) => s + (q.marks || 0), 0)}`,
    '',
  );
  if (meta.instructions) lines.push(`Instructions: ${meta.instructions}`, '');

  questions.forEach((q, i) => {
    lines.push(`Q${i + 1}. (${q.marks}) ${q.question_text}`);
    if (q.options) q.options.forEach((o) => lines.push(`   ${o.label}. ${o.text}`));
    if (withAnswers) {
      if (q.question_type === 'mcq') lines.push(`   Answer: ${q.correct_answer ?? '—'}`);
      else if (q.question_type === 'short') lines.push(`   Answer: ${q.expected_answer ?? '—'}`);
      else if (q.answer_points) q.answer_points.forEach((p) => lines.push(`   - ${p}`));
    }
    lines.push('');
  });

  return lines.join('\n');
}

export function downloadFile(fileName: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
