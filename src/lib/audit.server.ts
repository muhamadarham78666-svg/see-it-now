/** Server-only admin audit trail. Never called from the browser. */

export interface AuditEntry {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await (supabaseAdmin as any).from('admin_audit_log').insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail ?? '',
      action: entry.action,
      target_type: entry.targetType ?? '',
      target_id: entry.targetId ?? '',
      target_label: entry.targetLabel ?? '',
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.error('[audit] failed to record admin action', entry.action, err);
  }
}
