import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getLetterLabel } from '@/lib/utils';
import type { Question, QuestionOption, QuestionDifficulty } from '@/types';

interface QuestionEditModalProps {
  question: Question | null;
  onSave: (question: Question) => void;
  onClose: () => void;
}

export function QuestionEditModal({ question, onSave, onClose }: QuestionEditModalProps) {
  const [edited, setEdited] = useState<Question | null>(question);

  if (!edited) return null;

  const update = (field: keyof Question, value: unknown) => {
    setEdited((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const updateOption = (index: number, text: string) => {
    if (!edited.options) return;
    const options = [...edited.options];
    options[index] = { ...options[index], text };
    update('options', options);
  };

  const addOption = () => {
    if (!edited.options) return;
    const nextLabel = getLetterLabel(edited.options.length);
    update('options', [...edited.options, { label: nextLabel, text: '' }]);
  };

  const removeOption = (index: number) => {
    if (!edited.options || edited.options.length <= 2) return;
    const options = edited.options.filter((_, i) => i !== index);
    update('options', options.map((opt, i) => ({ ...opt, label: getLetterLabel(i) })));
  };

  const updateAnswerPoint = (index: number, value: string) => {
    if (!edited.answer_points) return;
    const points = [...edited.answer_points];
    points[index] = value;
    update('answer_points', points);
  };

  const addAnswerPoint = () => {
    update('answer_points', [...(edited.answer_points ?? []), '']);
  };

  const removeAnswerPoint = (index: number) => {
    if (!edited.answer_points) return;
    update('answer_points', edited.answer_points.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (edited) onSave(edited);
  };

  return (
    <Modal open={!!edited} onClose={onClose} title="Edit Question" size="lg">
      <div className="space-y-4">
        {/* Question text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Question Text
          </label>
          <textarea
            value={edited.question_text}
            onChange={(e) => update('question_text', e.target.value)}
            rows={3}
            className="input-field resize-y"
          />
        </div>

        {/* Topic & Difficulty & Marks */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Topic</label>
            <input
              value={edited.topic ?? ''}
              onChange={(e) => update('topic', e.target.value)}
              className="input-field"
              placeholder="Topic"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
            <select
              value={edited.difficulty}
              onChange={(e) => update('difficulty', e.target.value as QuestionDifficulty)}
              className="input-field"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Marks</label>
            <input
              type="number"
              value={edited.marks}
              onChange={(e) => update('marks', parseInt(e.target.value) || 0)}
              className="input-field"
              min={1}
            />
          </div>
        </div>

        {/* MCQ options */}
        {edited.question_type === 'mcq' && edited.options && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Options
            </label>
            <div className="space-y-2">
              {edited.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {getLetterLabel(i)}
                  </span>
                  <input
                    value={opt.text}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="input-field flex-1"
                  />
                  <button
                    onClick={() => update('correct_answer', getLetterLabel(i))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      edited.correct_answer === getLetterLabel(i) || edited.correct_answer === opt.label
                        ? 'bg-success-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Correct
                  </button>
                  {edited.options && edited.options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="p-2 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {edited.options.length < 6 && (
              <button onClick={addOption} className="btn-ghost text-xs mt-2">
                <Plus size={14} /> Add Option
              </button>
            )}
          </div>
        )}

        {/* Short answer */}
        {edited.question_type === 'short' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Expected Answer
            </label>
            <textarea
              value={edited.expected_answer ?? ''}
              onChange={(e) => update('expected_answer', e.target.value)}
              rows={3}
              className="input-field resize-y"
            />
          </div>
        )}

        {/* Long answer points */}
        {edited.question_type === 'long' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Answer Points
            </label>
            <div className="space-y-2">
              {(edited.answer_points ?? []).map((point, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-primary-500 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                  <input
                    value={point}
                    onChange={(e) => updateAnswerPoint(i, e.target.value)}
                    className="input-field flex-1"
                  />
                  <button
                    onClick={() => removeAnswerPoint(i)}
                    className="p-2 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addAnswerPoint} className="btn-ghost text-xs mt-2">
              <Plus size={14} /> Add Point
            </button>
          </div>
        )}

        {/* Explanation */}
        {edited.question_type === 'mcq' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Explanation
            </label>
            <textarea
              value={edited.explanation ?? ''}
              onChange={(e) => update('explanation', e.target.value)}
              rows={2}
              className="input-field resize-y"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save size={18} /> Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
