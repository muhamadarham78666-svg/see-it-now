import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Check, Loader2, Lock } from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Spinner } from '@/components/nsa/Feedback';
import { adminSaveSiteSettingsFn, adminSiteSettingsFn } from '@/lib/site-admin.functions';
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from '@/lib/site';

/** Owner-only control centre: contact block, announcement, maintenance, signups, blog. */
export function AdminSitePanel() {
  const loadSettings = useServerFn(adminSiteSettingsFn);
  const saveSettings = useServerFn(adminSaveSiteSettingsFn);
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadSettings({ data: {} as never });
      setForm({ ...DEFAULT_SITE_SETTINGS, ...((res.settings ?? {}) as Partial<SiteSettings>) });
      setCanEdit(res.canEdit);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not load settings.');
    }
    setLoading(false);
  }, [loadSettings]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setBusy(true);
    setNote(null);
    try {
      await saveSettings({ data: { ...form, free_trial_days: Number(form.free_trial_days) || 3 } });
      setNote('Saved. The homepage updates right away.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not save.');
    }
    setBusy(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
          <Lock size={15} /> Only the owner can change these settings.
        </p>
      )}
      {note && <p className="text-sm text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3">{note}</p>}

      <Card className="p-5 space-y-3">
        <p className="font-display font-semibold text-slate-900 dark:text-white">Contact details</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          These appear at the bottom of the homepage only while the switch below is on.
        </p>
        <Row label="Address" value={form.contact_address} disabled={!canEdit} onChange={(v) => set('contact_address', v)} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Row label="Phone" value={form.contact_phone} disabled={!canEdit} onChange={(v) => set('contact_phone', v)} />
          <Row label="WhatsApp" value={form.contact_whatsapp} disabled={!canEdit} onChange={(v) => set('contact_whatsapp', v)} />
          <Row label="Email" value={form.contact_email} disabled={!canEdit} onChange={(v) => set('contact_email', v)} />
          <Row label="Map link" value={form.contact_map_url} disabled={!canEdit} onChange={(v) => set('contact_map_url', v)} />
        </div>
        <Switch label="Show contact details on the homepage" checked={form.show_contact} disabled={!canEdit} onChange={(v) => set('show_contact', v)} />
      </Card>

      <Card className="p-5 space-y-3">
        <p className="font-display font-semibold text-slate-900 dark:text-white">Announcement bar</p>
        <Row label="Message" value={form.announcement} disabled={!canEdit} onChange={(v) => set('announcement', v)} />
        <Switch label="Show the announcement at the top of the homepage" checked={form.announcement_enabled} disabled={!canEdit} onChange={(v) => set('announcement_enabled', v)} />
      </Card>

      <Card className="p-5 space-y-3">
        <p className="font-display font-semibold text-slate-900 dark:text-white">Site controls</p>
        <Switch label="Blog section visible on the website" checked={form.blog_enabled} disabled={!canEdit} onChange={(v) => set('blog_enabled', v)} />
        <Switch label="Pause new access requests" checked={form.signups_paused} disabled={!canEdit} onChange={(v) => set('signups_paused', v)} />
        <Switch label="Maintenance notice on the homepage" checked={form.maintenance_mode} disabled={!canEdit} onChange={(v) => set('maintenance_mode', v)} />
        <Row label="Maintenance message" value={form.maintenance_message} disabled={!canEdit} onChange={(v) => set('maintenance_message', v)} />
        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <Switch label="Offer a free trial" checked={form.free_trial_enabled} disabled={!canEdit} onChange={(v) => set('free_trial_enabled', v)} />
          <Row label="Trial days" type="number" value={String(form.free_trial_days)} disabled={!canEdit} onChange={(v) => set('free_trial_days', Number(v))} />
        </div>
      </Card>

      {canEdit && (
        <button onClick={() => void submit()} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save settings
        </button>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: any) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="input-field !py-2 text-sm mt-1 disabled:opacity-70"
      />
    </label>
  );
}

function Switch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4" />
      {label}
    </label>
  );
}
