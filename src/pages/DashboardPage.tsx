import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@/lib/rr';
import {
  Sparkles,
  AlignLeft,
  FileEdit,
  Shuffle,
  FileUp,
  Archive,
  Newspaper,
  Calculator,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle,
  NotebookPen,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/nsa/Card';
import { Badge } from '@/components/nsa/Badge';
import { Spinner, EmptyState } from '@/components/nsa/Feedback';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { formatDateTime } from '@/lib/utils';
import type { Generation } from '@/types';

export function DashboardPage() {
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    questionsGenerated: 0,
    papersCreated: 0,
    recentGenerations: 0,
    savedQuestions: 0,
    notes: 0,
  });
  const [recentGens, setRecentGens] = useState<Generation[]>([]);

  const userId = session?.user.id ?? null;

  const loadDashboardData = useCallback(async () => {
    if (!userId) {
      setRecentGens([]);
      setLoading(false);
      return;
    }
    const { data: gens } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { count: genCount } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: allQuestionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: savedQuestionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_saved', true);

    const { count: paperCount } = await supabase
      .from('papers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: noteCount } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    setStats({
      questionsGenerated: allQuestionCount ?? 0,
      papersCreated: paperCount ?? 0,
      recentGenerations: genCount ?? 0,
      savedQuestions: savedQuestionCount ?? 0,
      notes: noteCount ?? 0,
    });
    setRecentGens((gens as Generation[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useRealtimeSync(['generations', 'questions', 'papers', 'notes'], userId, loadDashboardData);

  const quickActions = [
    { label: 'Generate MCQs', icon: Sparkles, color: 'from-primary-500 to-primary-600', action: () => navigate('/dashboard/generate?type=mcq') },
    { label: 'Generate Short Questions', icon: AlignLeft, color: 'from-accent-500 to-accent-600', action: () => navigate('/dashboard/generate?type=short') },
    { label: 'Generate Long Questions', icon: FileEdit, color: 'from-success-500 to-success-600', action: () => navigate('/dashboard/generate?type=long') },
    { label: 'Generate Mixed', icon: Shuffle, color: 'from-warning-500 to-warning-600', action: () => navigate('/dashboard/generate?type=mixed') },
    { label: 'Physics / Math Solver', icon: Calculator, color: 'from-accent-600 to-primary-500', action: () => navigate('/dashboard/solver') },
    { label: 'Upload Material', icon: FileUp, color: 'from-primary-400 to-accent-400', action: () => navigate('/dashboard/generate') },
    { label: 'Question Bank', icon: Archive, color: 'from-slate-500 to-slate-600', action: () => navigate('/dashboard/bank') },
    { label: 'Create Paper', icon: Newspaper, color: 'from-primary-600 to-accent-500', action: () => navigate('/dashboard/papers') },
    { label: 'My Notes', icon: NotebookPen, color: 'from-success-500 to-primary-500', action: () => navigate('/dashboard/notes') },
  ];

  const statCards = [
    { label: 'Questions Generated', value: stats.questionsGenerated, icon: TrendingUp, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Papers Created', value: stats.papersCreated, icon: Newspaper, color: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-900/20' },
    { label: 'Recent Generations', value: stats.recentGenerations, icon: Clock, color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-900/20' },
    { label: 'Saved Questions', value: stats.savedQuestions, icon: Layers, color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-900/20' },
    { label: 'Saved Notes', value: stats.notes, icon: NotebookPen, color: 'text-success-500', bg: 'bg-success-50 dark:bg-success-900/20' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="animate-fade-in-up">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Welcome to NSAGPT{profile?.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Create high-quality questions from your study material with AI.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5 animate-fade-in-up" >
              <div style={{ animationDelay: `${i * 0.08}s` }} className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.action}
                className="card p-5 text-left hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{action.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Generations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Recent Generations</h2>
          <button onClick={() => navigate('/dashboard/history')} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all
          </button>
        </div>

        {recentGens.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Sparkles size={32} />}
              title="No generations yet"
              description="Start by uploading your study material and generating your first set of questions."
              action={
                <button onClick={() => navigate('/dashboard/generate')} className="btn-primary text-sm">
                  <Sparkles size={16} />
                  Generate Questions
                </button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {recentGens.map((gen, i) => (
              <Card key={gen.id} className="p-4 flex items-center gap-4 animate-fade-in-up" hover onClick={() => navigate('/dashboard/history')}>
                <div style={{ animationDelay: `${i * 0.05}s` }} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{gen.title}</p>
                    {gen.status === 'completed' && (
                      <Badge variant="success"><CheckCircle size={12} /> Completed</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(gen.created_at)}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="primary">{gen.question_type.toUpperCase()}</Badge>
                  <Badge variant="accent">{gen.question_count} Qs</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
