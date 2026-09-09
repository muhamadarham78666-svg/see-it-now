/** Client-safe shape of the AI's "best approach" suggestion. */
export interface PaperPlan {
  /** Short description of the paper the AI will build. */
  summary: string;
  /** Section lines, e.g. "Section A — 12 MCQs, 12 marks". */
  sections: string[];
  /** Extra ideas the teacher may accept. */
  recommendations: string[];
  /** Settings the teacher can apply with one click. */
  patch: {
    counts?: { mcq: number; short: number; long: number } | null;
    attempts?: { mcq: number; short: number; long: number } | null;
    language?: string | null;
    wantDiagrams?: boolean | null;
    longParts?: boolean | null;
    statements?: boolean | null;
    composition?: string[] | null;
    translation?: string | null;
  };
}
