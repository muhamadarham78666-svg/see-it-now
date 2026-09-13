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
  /** "Attempt any N" counts per section (0 / undefined = attempt all). */
  attempts?: { mcq?: number; short?: number; long?: number };
  /** Faint diagonal watermark text printed behind the paper. */
  watermarkText?: string;
  /** PDF template / print style. */
  pdfStyle?: PdfStyleKey;
  /** Reusable visual overrides for the selected print template. */
  printSettings?: Partial<PaperPrintSettings>;
}

export type PdfStyleKey = 'academic' | 'modern' | 'classic' | 'compact' | 'formal';
export type PaperFontKey = 'serif' | 'sans' | 'book';
export type PaperDensity = 'compact' | 'balanced' | 'spacious';
export type PaperDivider = 'single' | 'double' | 'boxed';
export type PaperLogoAlignment = 'left' | 'center' | 'right';

export interface PaperPrintSettings {
  accentColor: string;
  headingFont: PaperFontKey;
  bodyFont: PaperFontKey;
  fontSize: number;
  density: PaperDensity;
  divider: PaperDivider;
  logoSize: number;
  logoAlignment: PaperLogoAlignment;
}

export const PDF_STYLE_OPTIONS: { value: PdfStyleKey; label: string; hint: string }[] = [
  { value: 'academic', label: 'Modern Professional Academic', hint: 'Formal header, ruled sections and compact academic typography' },
  { value: 'modern', label: 'Modern Professional', hint: 'Clean sans-serif layout with crisp section blocks' },
  { value: 'classic', label: 'Classic Board', hint: 'Traditional serif board-paper presentation' },
  { value: 'compact', label: 'Compact Exam', hint: 'Maximum questions per page with restrained spacing' },
  { value: 'formal', label: 'Formal Institutional', hint: 'Prominent institute identity and double rules' },
];

export const PAPER_PRINT_PRESETS: Record<PdfStyleKey, PaperPrintSettings> = {
  academic: { accentColor: '#17365d', headingFont: 'sans', bodyFont: 'serif', fontSize: 13, density: 'compact', divider: 'single', logoSize: 72, logoAlignment: 'left' },
  modern: { accentColor: '#174e48', headingFont: 'sans', bodyFont: 'sans', fontSize: 13, density: 'balanced', divider: 'boxed', logoSize: 68, logoAlignment: 'left' },
  classic: { accentColor: '#111827', headingFont: 'serif', bodyFont: 'serif', fontSize: 13.5, density: 'balanced', divider: 'single', logoSize: 68, logoAlignment: 'center' },
  compact: { accentColor: '#263238', headingFont: 'sans', bodyFont: 'sans', fontSize: 12, density: 'compact', divider: 'single', logoSize: 58, logoAlignment: 'left' },
  formal: { accentColor: '#5b2132', headingFont: 'serif', bodyFont: 'book', fontSize: 13.5, density: 'balanced', divider: 'double', logoSize: 76, logoAlignment: 'center' },
};

export const DEFAULT_PDF_STYLE: PdfStyleKey = 'academic';

export function resolvePrintSettings(meta: PaperMeta): PaperPrintSettings {
  const requested = meta.pdfStyle ?? DEFAULT_PDF_STYLE;
  const style = requested in PAPER_PRINT_PRESETS ? requested : DEFAULT_PDF_STYLE;
  return { ...PAPER_PRINT_PRESETS[style], ...meta.printSettings };
}

/** Marks total per section vs. expected paper total; used to warn before export. */
export function validateMarks(
  questions: Question[],
  attempts?: PaperMeta['attempts'],
): { ok: boolean; total: number; issues: string[] } {
  const issues: string[] = [];
  const zero = questions.filter((q) => !q.marks || q.marks <= 0);
  if (zero.length) issues.push(`${zero.length} question(s) have no marks assigned.`);
  (['mcq', 'short', 'long'] as const).forEach((key) => {
    const items = questions.filter((q) => q.question_type === key);
    const pick = attempts?.[key];
    if (pick && pick > items.length) {
      issues.push(`"Attempt any ${pick}" is more than the ${items.length} ${key} question(s) available.`);
    }
  });
  const total = questions.reduce((s, q) => s + (q.marks || 0), 0);
  if (!questions.length) issues.push('The paper has no questions yet.');
  return { ok: issues.length === 0, total, issues };
}



const ROMAN = [
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
  'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx',
  'xxi', 'xxii', 'xxiii', 'xxiv', 'xxv', 'xxvi', 'xxvii', 'xxviii', 'xxix', 'xxx',
];
const roman = (n: number) => ROMAN[n - 1] ?? String(n);

interface PaperLabels {
  q: string;
  marks: string;
  totalMarks: string;
  totalQuestions: string;
  answer: string;
  instructions: string;
  rollNo: string;
  name: string;
  attemptAny: (pick: number, total: number) => string;
}

const EN_LABELS: PaperLabels = {
  q: 'Q',
  marks: 'marks',
  totalMarks: 'Total Marks',
  totalQuestions: 'Total Questions',
  answer: 'Answer',
  instructions: 'Instructions',
  rollNo: 'Roll No',
  name: 'Name',
  attemptAny: (pick, total) => `Attempt any ${pick} of ${total} questions.`,
};

const URDU_LABELS: PaperLabels = {
  q: 'سوال ',
  marks: 'نمبر',
  totalMarks: 'کل نمبر',
  totalQuestions: 'کل سوالات',
  answer: 'جواب',
  instructions: 'ہدایات',
  rollNo: 'رول نمبر',
  name: 'نام',
  attemptAny: (pick, total) => `کل ${total} سوالات میں سے کوئی سے ${pick} سوال حل کریں۔`,
};

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
    meta.examDate && `Date: ${escapeHtml(meta.examDate)}`,
    meta.examTime && `Time: ${escapeHtml(meta.examTime)}`,
  ]
    .filter(Boolean)
    .join(' &nbsp;•&nbsp; ');

  const boardStyle = getBoardStyle(meta.boardStyle);
  const print = resolvePrintSettings(meta);
  const accent = /^#[0-9a-f]{6}$/i.test(print.accentColor) ? print.accentColor : PAPER_PRINT_PRESETS.academic.accentColor;
  const fontMap: Record<PaperFontKey, string> = {
    serif: "Georgia, 'Times New Roman', serif",
    sans: "Arial, 'Helvetica Neue', sans-serif",
    book: "'Palatino Linotype', Palatino, Georgia, serif",
  };
  const density = {
    compact: { page: '18px 26px', section: 12, question: 7, line: 1.34, answer: 18 },
    balanced: { page: '26px 34px', section: 18, question: 10, line: 1.48, answer: 23 },
    spacious: { page: '34px 44px', section: 24, question: 14, line: 1.62, answer: 30 },
  }[print.density];
  const bodyFont = fontMap[print.bodyFont];
  const headingFont = fontMap[print.headingFont];
  const muted = '#444';

  const groups: { key: Question['question_type']; label: string }[] = [
    { key: 'mcq', label: boardStyle.sections.mcq },
    { key: 'short', label: boardStyle.sections.short },
    { key: 'long', label: boardStyle.sections.long },
  ];
  const cleanSectionLabel = (label: string) =>
    label.replace(/\s*[—-]?\s*Q\.?\s*1\s*/i, ' ').replace(/\s{2,}/g, ' ').trim();

  const t = isUrduPaper ? URDU_LABELS : EN_LABELS;

  let qNumber = 0;
  const sections = groups
    .map(({ key, label }) => {
      const items = questions.filter((q) => q.question_type === key);
      if (!items.length) return '';
      const sectionMarks = items.reduce((s, q) => s + (q.marks || 0), 0);
      const chosen = meta.attempts?.[key];
      const attemptAny = chosen && chosen > 0 && chosen < items.length ? chosen : 0;
      const note = attemptAny
        ? `<p class="note">${t.attemptAny(attemptAny, items.length)} (${sectionMarks} ${t.marks})</p>`
        : '';
      // Each section receives one main question number: objective Q1, short Q2, long Q3.
      // Items stay inline as (i), (ii), while long-question parts remain (a), (b).
      const sectionNo = ++qNumber;
      const rows = items
        .map((q, index) => {
          const itemNo = `(${roman(index + 1)})`;
          const rtl = q.language === 'urdu' || isUrduPaper;
          const opts =
            q.question_type === 'mcq' && q.options
              ? `<ol class="opts">${q.options
                  .map(
                    (o) =>
                      `<li><span class="lbl">${escapeHtml(o.label)}.</span> ${escapeHtml(o.text)}</li>`,
                  )
                  .join('')}</ol>`
              : '';
          const diagram = q.diagram_svg
            ? `<figure class="fig">${q.diagram_svg}${
                q.diagram_note ? `<figcaption>${escapeHtml(q.diagram_note)}</figcaption>` : ''
              }</figure>`
            : '';
          const parts =
            q.parts && q.parts.length
              ? `<ol class="parts">${q.parts
                  .map(
                    (p) =>
                      `<li><span class="lbl">(${escapeHtml(p.label)})</span> ${escapeHtml(p.text)}${
                        p.marks ? ` <span class="pmarks">(${p.marks})</span>` : ''
                      }</li>`,
                  )
                  .join('')}</ol>`
              : '';
          const statement = q.statement
            ? `<p class="stmt">${escapeHtml(q.statement)}</p>`
            : '';
          const answer = options.withAnswers
            ? `<div class="answer"><strong>${t.answer}:</strong> ${escapeHtml(
                q.question_type === 'mcq'
                  ? (q.correct_answer ?? '—')
                  : q.question_type === 'short'
                    ? (q.expected_answer ?? '—')
                    : (q.answer_points ?? []).join(' • ') || '—',
              )}</div>`
            : '';
           return `<div class="q sub ${rtl ? 'rtl' : ''}">
             <div class="qline"><p class="qtext"><span class="itemno">${itemNo}</span> ${escapeHtml(q.question_text)}</p>${boardStyle.perQuestionMarks && q.marks ? `<span class="marks">[${q.marks}]</span>` : ''}</div>
            ${statement}
            ${diagram}
            ${parts}
            ${opts}
            ${q.question_type !== 'mcq' && !parts ? '<div class="space"></div>' : ''}
            ${answer}
          </div>`;
        })
        .join('');
      const lead = `<div class="section-title"><span class="mainq">${t.q}${sectionNo}.</span><span>${escapeHtml(cleanSectionLabel(label))}</span>${boardStyle.perQuestionMarks ? `<span class="section-marks">[${sectionMarks}]</span>` : ''}</div>`;
      return `<section class="${isUrduPaper ? 'rtl' : ''}">${lead}${note}${rows}</section>`;
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
  @page { size: A4; margin: 10mm 11mm; }
  body { font-family: ${bodyFont}; color: #111; margin: 0; padding: ${density.page}; line-height: ${density.line}; position: relative; font-size: ${print.fontSize}px; }
  header { text-align: center; border-bottom: ${print.divider === 'double' ? '4px double' : '2px solid'} ${accent}; padding-bottom: 9px; margin-bottom: 10px; }
  header .brand { display: grid; grid-template-columns: ${print.logoAlignment === 'center' ? '1fr' : `${print.logoSize}px 1fr ${print.logoSize}px`}; align-items: center; gap: 12px; }
  header .brand.no-logo { grid-template-columns: 1fr; }
  header .brand.no-logo .brand-copy { grid-column: 1; }
  header .brand.logo-right img { grid-column: 3; }
  header .brand.logo-center img { margin: 0 auto 3px; }
  header .brand.logo-center .brand-copy { grid-row: 2; }
  header .brand-copy { grid-column: ${print.logoAlignment === 'left' ? '2' : print.logoAlignment === 'right' ? '1 / 3' : '1'}; }
  header .brand img { height: ${print.logoSize}px; width: ${print.logoSize}px; max-width: 100%; object-fit: contain; }
  header h1 { font-family: ${headingFont}; margin: 0 0 2px; font-size: ${print.fontSize + 9}px; font-weight: 800; }
  header .board { font-family: ${headingFont}; font-size: 11px; font-weight: bold; color: ${accent}; text-transform: uppercase; margin-bottom: 2px; }
  footer { margin-top: 16px; padding-top: 7px; border-top: 1px dashed #777; text-align: center; font-size: 11px; font-weight: bold; }
  header .exam { font-family: ${headingFont}; font-size: ${print.fontSize + 1}px; font-weight: bold; margin-bottom: 4px; }
  header .meta { font-size: 12px; color: #333; }
  .idbox { display: flex; gap: 8px; margin-bottom: 8px; font-size: 11px; }
  .idbox div { flex: 1; border: 1px solid #888; padding: 4px 8px; }
  .totals { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
  .instructions { border: 1px solid #999; background: #fafafa; padding: 6px 9px; font-size: 11.5px; margin-bottom: 10px; white-space: pre-wrap; }
  section { margin-bottom: ${density.section}px; ${print.divider === 'boxed' ? `border: 1px solid #aaa; padding: 8px 10px;` : ''} break-inside: auto; }
  .section-title { font-family: ${headingFont}; display: flex; align-items: baseline; gap: 7px; font-size: ${print.fontSize}px; font-weight: 800; color: ${accent}; border-bottom: ${print.divider === 'double' ? '3px double' : '1.5px solid'} ${accent}; padding-bottom: 3px; margin: 0 0 6px; }
  .section-title .section-marks { margin-left: auto; white-space: nowrap; color: #222; font-size: 11px; font-weight: 600; }
  .note { font-size: 11.5px; font-weight: 700; color: ${muted}; margin: 0 0 6px; border-bottom: 1px dashed #999; padding-bottom: 4px; }
  .q { margin-bottom: ${density.question}px; page-break-inside: avoid; break-inside: avoid; }
  .qline { display: flex; align-items: baseline; gap: 10px; }
  .qline .marks { margin-left: auto; text-align: right; white-space: nowrap; color: ${muted}; font-size: 11px; font-weight: 600; }
  .qtext { flex: 1; margin: 0 0 4px; font-size: ${print.fontSize}px; text-align: left; }
  .itemno { display: inline-block; min-width: 26px; font-weight: 700; }
  .opts { list-style: none; padding: 0 0 0 28px; margin: 0 0 3px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; font-size: ${print.fontSize - 0.5}px; }
  .opts .lbl { font-weight: bold; }
  .space { border-bottom: 1px dotted #aaa; height: ${density.answer}px; margin: 0 0 3px 28px; }
  .fig { margin: 4px 0 6px; text-align: center; page-break-inside: avoid; break-inside: avoid; }
  .fig svg { max-width: 280px; max-height: 190px; height: auto; }
  .fig figcaption { font-size: 11.5px; color: ${muted}; margin-top: 2px; }
  .parts { list-style: none; padding: 0 0 0 28px; margin: 0 0 4px; font-size: ${print.fontSize - 0.5}px; }
  .parts li { margin-bottom: 3px; }
  .parts .pmarks { color: ${muted}; font-size: 12px; }
  .stmt { font-size: 11px; color: ${muted}; font-style: italic; margin: -2px 0 4px 28px; }
  .q.sub { padding-left: 2px; }

  .answer { font-size: 11.5px; color: #174e48; background: #f4faf8; border-left: 3px solid #174e48; padding: 5px 8px; }
  .rtl { direction: rtl; }
  .rtl .qtext, .rtl .opts, .rtl .lead, .rtl .stmt, .rtl .parts, .rtl .note { font-family: 'Noto Nastaliq Urdu', serif; text-align: right; line-height: 2.2; }
  .rtl .qline, .rtl .section-title { flex-direction: row-reverse; }
  .rtl .qline .marks, .rtl .section-title .section-marks { margin-left: 0; margin-right: auto; text-align: left; }
  .rtl .q.sub { padding-left: 0; padding-right: 16px; }
  .watermark { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 0; pointer-events: none; }
  .watermark span { transform: rotate(-32deg); font-size: 70px; font-weight: bold; color: #000; opacity: .055; white-space: nowrap; text-transform: uppercase; }
  body > header, body > section, body > footer, body > div { position: relative; z-index: 1; }
  ${
    isUrduPaper
      ? `body { direction: rtl; font-family: 'Noto Nastaliq Urdu', serif; line-height: 2.1; }
  .section-title, .totals, .instructions, .idbox, footer { font-family: 'Noto Nastaliq Urdu', serif; }
  .qtext, .opts { text-align: right; }
  .qline, .section-title { flex-direction: row-reverse; }
  .qline .marks, .section-title .section-marks { margin-left: 0; margin-right: auto; text-align: left; }`
      : ''
  }
  @media print {
    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .watermark span { opacity: .09; }
  }
</style>
</head>
<body>
  ${meta.watermarkText ? `<div class="watermark" aria-hidden="true"><span>${escapeHtml(meta.watermarkText)}</span></div>` : ''}
  <header>
    <div class="brand logo-${print.logoAlignment}${meta.logoUrl ? '' : ' no-logo'}">
      ${meta.logoUrl ? `<img src="${escapeHtml(meta.logoUrl)}" alt="Logo" />` : ''}
      <div class="brand-copy">
        ${meta.boardName ? `<div class="board">${escapeHtml(meta.boardName)}</div>` : ''}
        ${meta.institutionName ? `<h1>${escapeHtml(meta.institutionName)}</h1>` : ''}
        <div class="exam">${escapeHtml(meta.examName || boardStyle.examHeading)}</div>
      </div>
    </div>
    ${metaLine ? `<div class="meta">${metaLine}</div>` : ''}
  </header>
  ${boardStyle.rollNoBox ? `<div class="idbox"><div>${t.rollNo}: ______________</div><div>${t.name}: ______________________</div></div>` : ''}
  <div class="totals"><span>${t.totalQuestions}: ${questions.length}</span><span>${t.totalMarks}: ${totalMarks}</span></div>

  ${meta.instructions ? `<div class="instructions"><strong>${t.instructions}:</strong>\n${escapeHtml(meta.instructions)}</div>` : ''}
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
  const info = [meta.subject, meta.className, meta.examDate].filter(Boolean);
  if (info.length) lines.push(info.join(' | '));
  lines.push(
    `Total Marks: ${questions.reduce((s, q) => s + (q.marks || 0), 0)}`,
    '',
  );
  if (meta.instructions) lines.push(`Instructions: ${meta.instructions}`, '');

  let qNo = 0;
  let lastType: Question['question_type'] | null = null;
  let subNo = 0;
  questions.forEach((q) => {
    if (q.question_type !== lastType) {
      lastType = q.question_type;
      subNo = 0;
      qNo += 1;
      const sameType = questions.filter((item) => item.question_type === q.question_type);
      const attempt = meta.attempts?.[q.question_type];
      lines.push(`Q${qNo}.`, attempt && attempt < sameType.length ? `Attempt any ${attempt} of ${sameType.length} questions.` : '');
    }
    subNo += 1;
    lines.push(`  (${roman(subNo)}) ${q.question_text} [${q.marks}]`);
    if (q.statement) lines.push(`   → ${q.statement}`);
    if (q.diagram_note) lines.push(`   [Figure: ${q.diagram_note}]`);
    if (q.parts) q.parts.forEach((p) => lines.push(`   (${p.label}) ${p.text}${p.marks ? ` (${p.marks})` : ''}`));
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
