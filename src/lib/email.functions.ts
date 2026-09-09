import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public endpoint: sends the "we received your request" confirmation to the
 * person who filled the access form, plus an alert to the administrator.
 * It only sends mail — it never reads or writes application data.
 */
export const sendAccessRequestMailFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        firstName: z.string().max(80).default(""),
        lastName: z.string().max(80).default(""),
        email: z.string().email(),
        phone: z.string().max(40).default(""),
        note: z.string().max(2000).default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { sendMail, accessRequestEmail, adminAlertEmail, ADMIN_EMAIL } = await import("./email.server");
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
    const result = await sendMail({
      to: data.email,
      toName: name || undefined,
      subject: "We received your NSAGPT access request",
      html: accessRequestEmail(name),
    });
    const adminTo = ADMIN_EMAIL;
    if (adminTo) {
      await sendMail({
        to: adminTo,
        subject: `New access request — ${name || data.email}`,
        html: adminAlertEmail({ Name: name, Email: data.email, Phone: data.phone, Note: data.note }),
      });
    }
    return { ok: result.ok };
  });
