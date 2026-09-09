import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * All admin power lives here. Every call verifies:
 *  1. a valid signed-in session (middleware),
 *  2. the `admin` role in user_roles,
 *  3. a valid admin session token issued after the access-code step.
 */

type Ctx = { supabase: any; userId: string };

async function assertAdminRole(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

async function assertAdmin(context: Ctx, token: string) {
  await assertAdminRole(context);
  const { verifyAdminToken } = await import("./admin.server");
  if (!verifyAdminToken(token, context.userId)) {
    throw new Error("Admin verification expired. Please re-enter your access code.");
  }
}

async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as any;
}

const tokenInput = z.object({ token: z.string().min(1) });

/** Step 2 of admin login: confirm the 4-digit access code. */
export const verifyAdminCodeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdminRole(context as Ctx);
    const { checkAdminCode, issueAdminToken } = await import("./admin.server");
    if (!checkAdminCode(data.code)) return { ok: false as const, token: null };
    return { ok: true as const, token: issueAdminToken((context as Ctx).userId) };
  });

/** Confirms a stored token is still valid (used when opening /admin). */
export const checkAdminSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ token: z.string().nullable() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      await assertAdminRole(context as Ctx);
    } catch {
      return { role: false as const, verified: false as const };
    }
    const { verifyAdminToken } = await import("./admin.server");
    return { role: true as const, verified: verifyAdminToken(data.token, (context as Ctx).userId) };
  });

export const adminOverviewFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const count = async (table: string, filter?: Record<string, string>) => {
      let q = db.from(table).select("id", { count: "exact", head: true });
      if (filter) for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
      const { count: c } = await q;
      return c ?? 0;
    };
    const [users, papers, questions, notes, reviews, pendingReviews, requests, pendingRequests, generations, boards] =
      await Promise.all([
        count("profiles"),
        count("papers"),
        count("questions"),
        count("notes"),
        count("reviews"),
        count("reviews", { status: "pending" }),
        count("access_requests"),
        count("access_requests", { status: "new" }),
        count("generations"),
        count("boards", {}),
      ]);
    const { data: recent } = await db
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(6);
    return {
      stats: { users, papers, questions, notes, reviews, pendingReviews, requests, pendingRequests, generations, boards },
      recentUsers: recent ?? [],
    };
  });

export const adminUsersFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const [{ data: profiles }, { data: roles }, authList] = await Promise.all([
      db.from("profiles").select("id, email, full_name, board_code, class_level, created_at"),
      db.from("user_roles").select("user_id, role"),
      db.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    const adminIds = new Set((roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
    const authMap = new Map((authList.data?.users ?? []).map((u: any) => [u.id, u]));
    const counts = async (table: string) => {
      const { data: rows } = await db.from(table).select("user_id");
      const map = new Map<string, number>();
      for (const row of rows ?? []) map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1);
      return map;
    };
    const [paperCounts, questionCounts, noteCounts] = await Promise.all([
      counts("papers"),
      counts("questions"),
      counts("notes"),
    ]);
    return (profiles ?? [])
      .map((p: any) => {
        const au: any = authMap.get(p.id);
        return {
          ...p,
          isAdmin: adminIds.has(p.id),
          lastSignIn: au?.last_sign_in_at ?? null,
          confirmed: Boolean(au?.email_confirmed_at),
          papers: paperCounts.get(p.id) ?? 0,
          questions: questionCounts.get(p.id) ?? 0,
          notes: noteCounts.get(p.id) ?? 0,
        };
      })
      .sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1));
  });

export const adminCreateUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput
      .extend({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().default(""),
        makeAdmin: z.boolean().default(false),
        requestId: z.string().uuid().nullable().default(null),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    let requestEmail: string | null = null;
    if (data.requestId) {
      const { data: request, error: requestError } = await db
        .from("access_requests")
        .select("email")
        .eq("id", data.requestId)
        .maybeSingle();
      if (requestError || !request) {
        return { ok: false as const, message: "Access request was not found." };
      }
      requestEmail = request.email.trim().toLowerCase();
      if (requestEmail !== data.email.trim().toLowerCase()) {
        return { ok: false as const, message: "The account email must match the access request." };
      }
    }
    const { data: created, error } = await db.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName || null },
    });
    if (error || !created.user) return { ok: false as const, message: error?.message ?? "Could not create user." };
    const { error: profileError } = await db.from("profiles").upsert(
      { id: created.user.id, email: data.email, full_name: data.fullName || null },
      { onConflict: "id" },
    );
    if (profileError) {
      await db.auth.admin.deleteUser(created.user.id);
      return { ok: false as const, message: profileError.message };
    }
    const { error: roleError } = await db
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: data.makeAdmin ? "admin" : "user" });
    if (roleError) {
      await db.auth.admin.deleteUser(created.user.id);
      return { ok: false as const, message: roleError.message };
    }
    if (data.requestId) {
      const { error: approvalError } = await db
        .from("access_requests")
        .update({ status: "approved" })
        .eq("id", data.requestId);
      if (approvalError) {
        await db.auth.admin.deleteUser(created.user.id);
        return { ok: false as const, message: approvalError.message };
      }
    }
    const { sendMail, accountCreatedEmail } = await import("./email.server");
    const mail = await sendMail({
      to: data.email,
      toName: data.fullName || undefined,
      subject: data.requestId ? "Your NSAGPT access is approved — account ready" : "Your NSAGPT account is ready",
      html: accountCreatedEmail({
        name: data.fullName,
        email: data.email,
        password: data.password,
        loginUrl: "https://nsagpt.org/login",
      }),
    });
    return {
      ok: true as const,
       message: mail.ok
         ? data.requestId
           ? "Account created, request approved, and login details emailed."
           : "User created and login details emailed."
         : data.requestId
           ? "Account created and request approved, but the email could not be sent."
           : "User created, but the email could not be sent.",
    };

  });

export const adminUpdateUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput
      .extend({
        userId: z.string().uuid(),
        fullName: z.string().nullable().optional(),
        password: z.string().min(8).nullable().optional(),
        makeAdmin: z.boolean().nullable().optional(),
        boardCode: z.string().nullable().optional(),
        classLevel: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const patch: Record<string, unknown> = {};
    if (data.fullName !== undefined) patch["full_name"] = data.fullName;
    if (data.boardCode !== undefined) patch["board_code"] = data.boardCode;
    if (data.classLevel !== undefined) patch["class_level"] = data.classLevel;
    if (Object.keys(patch).length) await db.from("profiles").update(patch).eq("id", data.userId);
    if (data.password) {
      const { error } = await db.auth.admin.updateUserById(data.userId, { password: data.password });
      if (error) return { ok: false as const, message: error.message };
    }
    if (typeof data.makeAdmin === "boolean") {
      if (data.userId === (context as Ctx).userId && !data.makeAdmin) {
        return { ok: false as const, message: "You cannot remove your own admin access." };
      }
      if (data.makeAdmin) await db.from("user_roles").upsert({ user_id: data.userId, role: "admin" });
      else await db.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    }
    return { ok: true as const, message: "Saved." };
  });

export const adminDeleteUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.extend({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    if (data.userId === (context as Ctx).userId) {
      return { ok: false as const, message: "You cannot delete your own account." };
    }
    const db = await admin();
    const { error } = await db.auth.admin.deleteUser(data.userId);
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const, message: "User deleted." };
  });

export const adminReviewsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const { data: rows } = await db.from("reviews").select("*").order("created_at", { ascending: false });
    return rows ?? [];
  });

export const adminReviewActionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput
      .extend({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject", "pending", "delete"]),
        content: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    if (data.action === "delete") {
      await db.from("reviews").delete().eq("id", data.id);
    } else {
      const patch: Record<string, unknown> = {
        status: data.action === "approve" ? "approved" : data.action === "reject" ? "rejected" : "pending",
      };
      if (data.content !== undefined) patch["content"] = data.content;
      await db.from("reviews").update(patch).eq("id", data.id);
    }
    return { ok: true as const };
  });

export const adminBoardsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const { data: rows } = await db
      .from("boards")
      .select("id, code, name, region, is_active, sort_order")
      .order("sort_order");
    return rows ?? [];
  });

export const adminBoardUpdateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput
      .extend({ id: z.string().uuid(), isActive: z.boolean().optional(), name: z.string().optional() })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const patch: Record<string, unknown> = {};
    if (data.isActive !== undefined) patch["is_active"] = data.isActive;
    if (data.name !== undefined) patch["name"] = data.name;
    if (Object.keys(patch).length) await db.from("boards").update(patch).eq("id", data.id);
    return { ok: true as const };
  });

export const adminRequestsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const { data: rows } = await db.from("access_requests").select("*").order("created_at", { ascending: false });
    return rows ?? [];
  });

export const adminRequestActionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput
      .extend({ id: z.string().uuid(), action: z.enum(["approve", "reject", "delete"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    if (data.action === "delete") {
      await db.from("access_requests").delete().eq("id", data.id);
      return { ok: true as const };
    }
    const { data: row } = await db
      .from("access_requests")
      .select("email, first_name, last_name")
      .eq("id", data.id)
      .maybeSingle();
    const { error: updateError } = await db
      .from("access_requests")
      .update({ status: data.action === "approve" ? "approved" : "rejected" })
      .eq("id", data.id);
    if (updateError) return { ok: false as const, message: updateError.message };
    if (row?.email) {
      const { sendMail, requestApprovedEmail, requestRejectedEmail } = await import("./email.server");
      const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
      const mail = await sendMail({
        to: row.email,
        toName: name || undefined,
        subject: data.action === "approve" ? "Your NSAGPT access request is approved" : "About your NSAGPT access request",
        html: data.action === "approve" ? requestApprovedEmail(name, "https://nsagpt.org/login") : requestRejectedEmail(name),
      });
      return {
        ok: true as const,
        message: mail.ok
          ? data.action === "approve"
            ? "Request approved and confirmation emailed."
            : "Request rejected and confirmation emailed."
          : `${data.action === "approve" ? "Request approved" : "Request rejected"}, but the email could not be sent.`,
      };
    }
    return { ok: true as const, message: "Request updated." };
  });


export const adminContentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const [{ data: papers }, { data: notes }, { data: profiles }] = await Promise.all([
      db.from("papers").select("id, title, subject, user_id, created_at").order("created_at", { ascending: false }).limit(40),
      db.from("notes").select("id, title, subject, user_id, created_at").order("created_at", { ascending: false }).limit(40),
      db.from("profiles").select("id, email, full_name"),
    ]);
    const who = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name || p.email]));
    return {
      papers: (papers ?? []).map((p: any) => ({ ...p, owner: who.get(p.user_id) ?? "—" })),
      notes: (notes ?? []).map((n: any) => ({ ...n, owner: who.get(n.user_id) ?? "—" })),
    };
  });

export const adminDeleteContentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput.extend({ table: z.enum(["papers", "notes", "questions"]), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    await db.from(data.table).delete().eq("id", data.id);
    return { ok: true as const };
  });

/** Device approvals for the one-device login rule. */
export const adminDevicesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    const { data: rows } = await db
      .from("user_devices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return rows ?? [];
  });

export const adminDeviceActionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput
      .extend({ id: z.string().uuid(), action: z.enum(["approve", "reject", "delete"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    if (data.action === "delete") {
      await db.from("user_devices").delete().eq("id", data.id);
      return { ok: true as const };
    }
    const { data: row } = await db.from("user_devices").select("user_id, email, label").eq("id", data.id).maybeSingle();
    if (data.action === "approve") {
      // One active device per account: approving a device releases the others.
      if (row?.user_id) {
        await db.from("user_devices").delete().eq("user_id", row.user_id).neq("id", data.id);
      }
      await db.from("user_devices").update({ status: "approved" }).eq("id", data.id);
    } else {
      await db.from("user_devices").update({ status: "rejected" }).eq("id", data.id);
    }
    if (row?.email) {
      const { sendMail } = await import("./email.server");
      const approved = data.action === "approve";
      await sendMail({
        to: row.email,
        subject: approved ? "Your new device is approved" : "Your new device was not approved",
        html: approved
          ? `<p>Your device <strong>${row.label ?? "new device"}</strong> has been approved. You can sign in to NSAGPT now.</p>`
          : `<p>The sign-in from <strong>${row.label ?? "a new device"}</strong> was not approved. Please contact the administrator if you need access.</p>`,
      });
    }
    return { ok: true as const };
  });


/** Clears every device of one user so they can sign in fresh on any device. */
export const adminResetDevicesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.extend({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as Ctx, data.token);
    const db = await admin();
    await db.from("user_devices").delete().eq("user_id", data.userId);
    return { ok: true as const };
  });
