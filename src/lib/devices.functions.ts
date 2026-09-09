import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkSchema = z.object({
  fingerprint: z.string().min(6).max(120),
  label: z.string().max(120).default("Unknown device"),
  browser: z.string().max(80).default(""),
  os: z.string().max(80).default(""),
});

function callerIp(): string {
  return (
    getRequestHeader("cf-connecting-ip") ||
    (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    getRequestHeader("x-real-ip") ||
    ""
  );
}

export type DeviceCheck =
  | { status: "approved" }
  | { status: "pending" }
  | { status: "rejected" };

/**
 * One approved device per account. The first device is trusted automatically;
 * any other device is recorded as a pending request for the administrator.
 * Admins are exempt so the owner can never be locked out.
 */
export const checkDeviceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkSchema.parse(data))
  .handler(async ({ data, context }): Promise<DeviceCheck> => {
    const { userId, supabase } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin) return { status: "approved" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const ip = callerIp();

    const { data: rows } = await db
      .from("user_devices")
      .select("id, fingerprint, status, ip")
      .eq("user_id", userId);

    const list: { id: string; fingerprint: string; status: string; ip: string }[] = rows ?? [];
    const mine = list.find((d) => d.fingerprint === data.fingerprint);

    if (mine) {
      if (mine.status === "rejected") return { status: "rejected" };

      // A changed network / IP also needs a fresh approval.
      const ipChanged = mine.status === "approved" && ip && mine.ip && mine.ip !== ip;
      await db
        .from("user_devices")
        .update({
          last_seen_at: new Date().toISOString(),
          ip: ip || mine.ip,
          ...(ipChanged ? { status: "pending" } : {}),
        })
        .eq("id", mine.id);

      if (ipChanged) return { status: "pending" };
      return { status: mine.status === "approved" ? "approved" : "pending" };
    }

    const hasApproved = list.some((d) => d.status === "approved");
    const { data: profile } = await db
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    await db.from("user_devices").insert({
      user_id: userId,
      email: profile?.email ?? "",
      fingerprint: data.fingerprint,
      label: data.label,
      browser: data.browser,
      os: data.os,
      ip,
      status: hasApproved ? "pending" : "approved",
    });

    if (hasApproved && profile?.email) {
      const { sendMail, deviceRequestEmail, adminAlertEmail, ADMIN_EMAIL } = await import("./email.server");
      await sendMail({
        to: profile.email,
        subject: "New device sign-in needs approval",
        html: deviceRequestEmail(""),
      });
      const adminTo = ADMIN_EMAIL;
      if (adminTo) {
        await sendMail({
          to: adminTo,
          subject: `New device request — ${profile.email}`,
          html: adminAlertEmail({
            Email: profile.email,
            Device: data.label,
            Browser: data.browser,
            OS: data.os,
            IP: ip,
          }),
        });
      }
    }

    return { status: hasApproved ? "pending" : "approved" };
  });

