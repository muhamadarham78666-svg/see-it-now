import type { BoardStyleKey } from '@/lib/boards';

export interface BoardPaperStyle {
  key: BoardStyleKey;
  /** Short human label shown on the settings chip. */
  label: string;
  /** Heading printed above the section list, e.g. "Annual Examination". */
  examHeading: string;
  /** Section titles per question type. */
  sections: { mcq: string; short: string; long: string };
  /** Print a roll-no / name box under the header. */
  rollNoBox: boolean;
  /** Show "Attempt any X" note under short/long section titles. */
  attemptAnyNote: boolean;
  /** Header/section accent colour used in the printed paper. */
  accent: string;
  /** Serif (board style) or sans (international style) typography. */
  font: 'serif' | 'sans';
  /** Show marks for each question. */
  perQuestionMarks: boolean;
}

const punjab: BoardPaperStyle = {
  key: 'punjab',
  label: 'Punjab board style',
  examHeading: 'Annual / Model Examination',
  sections: {
    mcq: 'Objective Type — Q.1 Multiple Choice Questions',
    short: 'Subjective Type — Section B (Short Questions)',
    long: 'Section C (Detailed / Long Questions)',
  },
  rollNoBox: true,
  attemptAnyNote: true,
  accent: '#111827',
  font: 'serif',
  perQuestionMarks: true,
};

export const BOARD_PAPER_STYLES: Record<BoardStyleKey, BoardPaperStyle> = {
  punjab,
  sindh: {
    ...punjab,
    key: 'sindh',
    label: 'Sindh board style',
    examHeading: 'Annual Examination',
    sections: {
      mcq: 'Section “A” — Multiple Choice Questions',
      short: 'Section “B” — Short Answer Questions',
      long: 'Section “C” — Detailed Answer Questions',
    },
  },
  kpk: {
    ...punjab,
    key: 'kpk',
    label: 'KPK board style',
    examHeading: 'Annual Examination',
    sections: {
      mcq: 'Objective Paper — Multiple Choice Questions',
      short: 'Subjective Paper — Short Questions',
      long: 'Subjective Paper — Extensive Questions',
    },
  },
  balochistan: {
    ...punjab,
    key: 'balochistan',
    label: 'Balochistan board style',
    examHeading: 'Annual Examination',
  },
  fbise: {
    ...punjab,
    key: 'fbise',
    label: 'Federal board style',
    examHeading: 'SSC / HSSC Examination',
    sections: {
      mcq: 'Section A — Multiple Choice Questions (Encircle the correct option)',
      short: 'Section B — Short Answer Questions',
      long: 'Section C — Detailed Answer Questions',
    },
    accent: '#0f3d2e',
  },
  akueb: {
    ...punjab,
    key: 'akueb',
    label: 'Aga Khan Board style',
    examHeading: 'Examination — Aga Khan University Examination Board',
    sections: {
      mcq: 'Section A — Multiple Choice Questions',
      short: 'Section B — Constructed Response Questions',
      long: 'Section C — Extended Response Questions',
    },
    attemptAnyNote: false,
    accent: '#7c2d12',
  },
  cambridge: {
    key: 'cambridge',
    label: 'Cambridge style',
    examHeading: 'Examination Paper',
    sections: {
      mcq: 'Section A — Multiple Choice',
      short: 'Section B — Structured Questions',
      long: 'Section C — Extended Response',
    },
    rollNoBox: true,
    attemptAnyNote: false,
    accent: '#1e3a8a',
    font: 'sans',
    perQuestionMarks: true,
  },
  ib: {
    key: 'ib',
    label: 'IB style',
    examHeading: 'Assessment Paper',
    sections: {
      mcq: 'Part 1 — Multiple Choice',
      short: 'Part 2 — Short Response',
      long: 'Part 3 — Extended Response',
    },
    rollNoBox: true,
    attemptAnyNote: false,
    accent: '#0e7490',
    font: 'sans',
    perQuestionMarks: true,
  },
  custom: {
    key: 'custom',
    label: 'Simple / Custom style',
    examHeading: 'Question Paper',
    sections: {
      mcq: 'Section A — Multiple Choice Questions',
      short: 'Section B — Short Questions',
      long: 'Section C — Long Questions',
    },
    rollNoBox: false,
    attemptAnyNote: false,
    accent: '#111827',
    font: 'serif',
    perQuestionMarks: true,
  },
};

export function getBoardStyle(key: string | null | undefined): BoardPaperStyle {
  if (key && key in BOARD_PAPER_STYLES) return BOARD_PAPER_STYLES[key as BoardStyleKey];
  return BOARD_PAPER_STYLES.custom;
}

/** Options for the paper-style dropdown in the preview modal. */
export const BOARD_STYLE_OPTIONS: { value: BoardStyleKey; label: string }[] = (
  Object.values(BOARD_PAPER_STYLES) as BoardPaperStyle[]
).map((s) => ({ value: s.key, label: s.label }));
