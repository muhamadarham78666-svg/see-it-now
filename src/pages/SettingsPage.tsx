import { useState } from 'react';
import { Settings as SettingsIcon, Globe, Gauge, Hash, ListOrdered, Sun, Moon, User, Save, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/Toggle';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Language, QuestionType, Difficulty } from '@/types';

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [prefs, setPrefs] = useState({
    language: (profile?.preferences?.language ?? 'english') as Language,
    defaultQuestionType: (profile?.preferences?.defaultQuestionType ?? 'mcq') as QuestionType,
    defaultDifficulty: (profile?.preferences?.defaultDifficulty ?? 'medium') as Difficulty,
    defaultQuestionCount: profile?.preferences?.defaultQuestionCount ?? 10,
  });

  const [fullName, setFullName] = useState(profile?.full_name ?? '');

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        preferences: {
          theme,
          language: prefs.language,
          defaultQuestionType: prefs.defaultQuestionType,
          defaultDifficulty: prefs.defaultDifficulty,
          defaultQuestionCount: prefs.defaultQuestionCount,
        },
      })
      .eq('id', profile!.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Customize your NSAGPT experience.</p>
      </div>

      {/* Appearance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <SettingsIcon size={20} className="text-primary-500" />
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Theme</label>
          <SegmentedControl
            value={theme}
            onChange={(v) => setTheme(v as 'light' | 'dark')}
            options={[
              { value: 'light', label: 'Light', icon: <Sun size={16} /> },
              { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
            ]}
          />
        </div>
      </Card>

      {/* Defaults */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Gauge size={20} className="text-accent-500" />
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Generation Defaults</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Globe size={16} className="text-slate-400" /> Default Language
            </label>
            <SegmentedControl
              value={prefs.language}
              onChange={(v) => setPrefs({ ...prefs, language: v as Language })}
              options={[
                { value: 'english', label: 'English' },
                { value: 'urdu', label: 'Urdu' },
                { value: 'mixed', label: 'Mixed' },
              ]}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <ListOrdered size={16} className="text-slate-400" /> Default Question Type
            </label>
            <SegmentedControl
              value={prefs.defaultQuestionType}
              onChange={(v) => setPrefs({ ...prefs, defaultQuestionType: v as QuestionType })}
              options={[
                { value: 'mcq', label: 'MCQ' },
                { value: 'short', label: 'Short' },
                { value: 'long', label: 'Long' },
                { value: 'mixed', label: 'Mixed' },
              ]}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Gauge size={16} className="text-slate-400" /> Default Difficulty
            </label>
            <SegmentedControl
              value={prefs.defaultDifficulty}
              onChange={(v) => setPrefs({ ...prefs, defaultDifficulty: v as Difficulty })}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
                { value: 'mixed', label: 'Mixed' },
              ]}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Hash size={16} className="text-slate-400" /> Default Question Count
            </label>
            <input
              type="number"
              value={prefs.defaultQuestionCount}
              onChange={(e) => setPrefs({ ...prefs, defaultQuestionCount: parseInt(e.target.value) || 1 })}
              className="input-field max-w-[120px]"
              min={1}
            />
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={20} className="text-success-500" />
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Account</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
            <input value={profile?.email ?? ''} disabled className="input-field opacity-60 cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Role:</span>
            <Badge variant={profile?.role === 'admin' ? 'primary' : 'default'}>
              {profile?.role === 'admin' ? 'Administrator' : 'User'}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400 animate-fade-in">
            <Check size={16} /> Saved
          </span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
