export interface SolvedProblem {
  problem_text: string;
  given: string[];
  formula: string | null;
  steps: string[];
  final_answer: string;
  units: string | null;
  concept: string | null;
  topic: string | null;
  /** Optional inline SVG figure for the solution. */
  diagram_svg?: string | null;
  diagram_note?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
}
