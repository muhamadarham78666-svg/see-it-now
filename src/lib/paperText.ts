/**
 * Cleans AI text so a printed question paper never shows raw LaTeX / markdown
 * markup ($, \(, **, `, #, \frac, \text{}) — only clean readable exam wording.
 */
export function cleanPaperText(input: string | null | undefined): string {
  if (!input) return '';
  let out = String(input);

  // Display / inline math delimiters.
  out = out.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  out = out.replace(/\$([^$\n]*)\$/g, '$1');
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, '$1');
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, '$1');

  // Common LaTeX commands → plain text.
  out = out.replace(/\\(?:text|mathrm|mathbf|textbf|mathit|textit|operatorname)\s*\{([^{}]*)\}/g, '$1');
  out = out.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
  out = out.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');
  out = out.replace(/\\(?:left|right|displaystyle|limits|,|;|!|:)/g, '');
  out = out.replace(/\\times/g, '×').replace(/\\div/g, '÷');
  out = out.replace(/\\pm/g, '±').replace(/\\cdot/g, '·');
  out = out.replace(/\\(?:le|leq)/g, '≤').replace(/\\(?:ge|geq)/g, '≥');
  out = out.replace(/\\neq/g, '≠').replace(/\\approx/g, '≈');
  out = out.replace(/\\(?:degree|circ)/g, '°');
  out = out.replace(/\\(?:alpha|beta|gamma|theta|lambda|mu|pi|omega|Delta|delta|sigma)/g, (m) => {
    const map: Record<string, string> = {
      '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\theta': 'θ', '\\lambda': 'λ',
      '\\mu': 'μ', '\\pi': 'π', '\\omega': 'ω', '\\Delta': 'Δ', '\\delta': 'δ', '\\sigma': 'σ',
    };
    return map[m] ?? m;
  });
  // Any remaining command word.
  out = out.replace(/\\[a-zA-Z]+/g, '');

  // Braces / underscores left over from math grouping.
  out = out.replace(/\^\{([^{}]*)\}/g, '^$1');
  out = out.replace(/_\{([^{}]*)\}/g, '_$1');
  out = out.replace(/[{}]/g, '');

  // Markdown emphasis / code / headings.
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
  out = out.replace(/\*([^*\n]+)\*/g, '$1');
  out = out.replace(/__([^_]+)__/g, '$1');
  out = out.replace(/`+/g, '');
  out = out.replace(/^\s{0,3}#{1,6}\s*/gm, '');
  out = out.replace(/^\s*>\s?/gm, '');

  // Whitespace tidy-up.
  out = out.replace(/[ \t]{2,}/g, ' ');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}
