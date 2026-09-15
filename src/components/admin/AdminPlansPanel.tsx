import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Check, Loader2, Lock, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Spinner } from '@/components/nsa/Feedback';
import { adminPlansFn, adminSavePlanFn } from '@/lib/site-admin.functions';
import { formatPrice, type PlanRow } from '@/lib/site';

const EMPTY: PlanRow = {
  plan_key: 'silver',
  name: '',
  duration: '',
  price: 0,
  currency: 'Rs.',
  duration_days: 30,
  user_limit: 1,
  tagline: '',
  benefits: [],
  featured: false,
  is_active: true,
  sort_order: 0,
};

/** Owner-editable subscription pricing. Admins see the values read-only. */
export function AdminPlansPanel() {
  const loadPlans = useServerFn(adminPlansFn);
  const savePlan = useServerFn(adminSavePlanFn);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadPlans({ data: {} as never });
      setRows((res.plans ?? []) as PlanRow[]);
      setCanEdit(res.canEdit);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not load plans.');
    }
    setLoading(false);
  }, [loadPlans]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (key: string, patch: Partial<PlanRow>) =>
    setRows((prev) => prev.map((r) => (r.plan_key === key ? { ...r, ...patch } : r)));

  const save = async (row: PlanRow) => {
    setBusy(row.plan_key);
    setNote(null);
    try {
      await savePlan({
        data: {
          ...row,
          price: Number(row.price) || 0,
          duration_days: Number(row.duration_days) || 1,
          user_limit: Number(row.user_limit) || 1,
          sort_order: Number(row.sort_order) || 0,
          benefits: (row.benefits ?? []).filter((b) => b.trim().length > 0),
        },
      });
      setNote(`${row.name} saved. The homepage now shows the new price.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not save.');
    }
    setBusy(null);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
          <Lock size={15} /> Only the owner can change prices. You can view them here.
        </p>
      )}
      {note && <p className="text-sm text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3">{note}</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        {rows.map((row) => (
          <Card key={row.plan_key} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold text-slate-900 dark:text-white">{row.name || row.plan_key}</p>
              <span className="text-xs text-slate-400">{formatPrice(row.currency, Number(row.price) || 0)}</span>
            </div>

            <Field label="Plan name" value={row.name} disabled={!canEdit} onChange={(v) => update(row.plan_key, { name: v })} />
            <Field label="Duration label" value={row.duration} disabled={!canEdit} onChange={(v) => update(row.plan_key, { duration: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Price" type="number" value={String(row.price)} disabled={!canEdit} onChange={(v) => update(row.plan_key, { price: Number(v) })} />
              <Field label="Currency" value={row.currency} disabled={!canEdit} onChange={(v) => update(row.plan_key, { currency: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Days" type="number" value={String(row.duration_days)} disabled={!canEdit} onChange={(v) => update(row.plan_key, { duration_days: Number(v) })} />
              <Field label="Users" type="number" value={String(row.user_limit)} disabled={!canEdit} onChange={(v) => update(row.plan_key, { user_limit: Number(v) })} />
            </div>
            <Field label="Tagline" value={row.tagline} disabled={!canEdit} onChange={(v) => update(row.plan_key, { tagline: v })} />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Benefits</p>
              {(row.benefits ?? []).map((benefit, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <input
                    value={benefit}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const next = [...(row.benefits ?? [])];
                      next[index] = e.target.value;
                      update(row.plan_key, { benefits: next });
                    }}
                    className="input-field !py-1.5 text-sm"
                  />
                  {canEdit && (
                    <button
                      onClick={() => update(row.plan_key, { benefits: (row.benefits ?? []).filter((_, i) => i !== index) })}
                      className="p-1.5 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600"
                      aria-label="Remove benefit"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              {canEdit && (
                <button
                  onClick={() => update(row.plan_key, { benefits: [...(row.benefits ?? []), ''] })}
                  className="text-xs font-medium text-primary-600 dark:text-primary-400 inline-flex items-center gap-1"
                >
                  <Plus size={13} /> Add benefit
                </button>
              )}
            </div>

            {canEdit && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={row.featured} onChange={(e) => update(row.plan_key, { featured: e.target.checked })} /> Popular
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={row.is_active} onChange={(e) => update(row.plan_key, { is_active: e.target.checked })} /> Visible
                  </label>
                </div>
                <button onClick={() => void save(row)} disabled={busy === row.plan_key} className="btn-primary !px-3 !py-1.5 text-sm disabled:opacity-60">
                  {busy === row.plan_key ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                </button>
              </div>
            )}
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-500">No plans configured yet.</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
        className="input-field !py-1.5 text-sm mt-1 disabled:opacity-70"
      />
    </label>
  );
}

export { EMPTY as EMPTY_PLAN };
