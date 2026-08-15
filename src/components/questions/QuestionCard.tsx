import { useState } from 'react';
import {
  CheckCircle,
  Pencil,
  Trash2,
  Copy,
  RefreshCw,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/nsa/Badge';
import { getLetterLabel, cn } from '@/lib/utils';
import type { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  index: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (question: Question) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (question: Question) => void;
  onRegenerate?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  showControls?: boolean;
}

export function QuestionCard({
  question,
  index,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onRegenerate,
  onMoveUp,
  onMoveDown,
  showControls = true,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isUrdu = question.language === 'urdu';

  const difficultyVariant = (d: string) =>
    d === 'easy' ? 'success' : d === 'hard' ? 'error' : 'warning';

  return (
    <div
      className={cn(
        'card p-4 sm:p-5 transition-all',
        selected && 'ring-2 ring-primary-500/50 border-primary-300 dark:border-primary-600',
        isUrdu && 'font-urdu',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {showControls && onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(question.id)}
            className="mt-1.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/50 flex-shrink-0"
          />
        )}

        {showControls && (onMoveUp || onMoveDown) && (
          <div className="flex flex-col gap-0.5 mt-1 text-slate-300 dark:text-slate-600">
            <GripVertical size={16} className="opacity-50" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Q{index + 1}</span>
            <Badge variant="primary">{question.question_type.toUpperCase()}</Badge>
            <Badge variant={difficultyVariant(question.difficulty)}>
              {question.difficulty}
            </Badge>
            {question.topic && <Badge variant="accent">{question.topic}</Badge>}
            <Badge>{question.marks} marks</Badge>
          </div>

          {/* Question text */}
          <p
            dir={isUrdu ? 'rtl' : 'ltr'}
            className={cn(
              'text-slate-800 dark:text-slate-100 font-medium mb-3',
              isUrdu ? 'text-lg leading-loose text-right' : 'text-sm sm:text-base text-left',
            )}
          >
            {question.question_text}
          </p>

          {/* MCQ options */}
          {expanded && question.question_type === 'mcq' && question.options && (
            <div className="space-y-2 mb-3">
              {question.options.map((opt, i) => {
                const isCorrect = question.correct_answer === opt.label || question.correct_answer === getLetterLabel(i);
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg text-sm',
                      isCorrect
                        ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/40'
                        : 'bg-slate-50 dark:bg-slate-700/30',
                    )}
                  >
                    <span className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      isCorrect
                        ? 'bg-success-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300',
                    )}>
                      {opt.label || getLetterLabel(i)}
                    </span>
                    <span className={cn('flex-1', isCorrect && 'text-success-700 dark:text-success-400 font-medium')}>
                      {opt.text}
                    </span>
                    {isCorrect && <CheckCircle size={16} className="text-success-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Short answer */}
          {expanded && question.question_type === 'short' && question.expected_answer && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 mb-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Expected Answer</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{question.expected_answer}</p>
            </div>
          )}

          {/* Long answer */}
          {expanded && question.question_type === 'long' && question.answer_points && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 mb-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Answer Points</p>
              <ul className="space-y-1.5">
                {question.answer_points.map((point, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-200 flex items-start gap-2">
                    <span className="text-primary-500 font-bold flex-shrink-0">{i + 1}.</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Explanation */}
          {expanded && question.explanation && (
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 mb-3">
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">Explanation</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{question.explanation}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {onMoveUp && (
              <button onClick={() => onMoveUp(question.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ChevronUp size={14} />
              </button>
            )}
            {onMoveDown && (
              <button onClick={() => onMoveDown(question.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ChevronDown size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action bar */}
      {showControls && (onEdit || onDelete || onDuplicate || onRegenerate) && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
          {onEdit && (
            <button onClick={() => onEdit(question)} className="btn-ghost text-xs py-1.5 px-2.5">
              <Pencil size={14} /> Edit
            </button>
          )}
          {onDuplicate && (
            <button onClick={() => onDuplicate(question)} className="btn-ghost text-xs py-1.5 px-2.5">
              <Copy size={14} /> Duplicate
            </button>
          )}
          {onRegenerate && (
            <button onClick={() => onRegenerate(question.id)} className="btn-ghost text-xs py-1.5 px-2.5">
              <RefreshCw size={14} /> Regenerate
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(question.id)} className="btn-ghost text-xs py-1.5 px-2.5 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
