# Multi-language dashboard + one-device login approval

Two features: (1) a language selector next to the board selector that switches the whole dashboard and all AI replies, and (2) login locked to one device per account, with new devices needing admin approval.

## 1. Language selector (next to Board)

- New picker beside the board chip with 10 languages: English (default), اردو, Roman Urdu, العربية, हिन्दी, 中文, Español, Français, پښتو, বাংলা.
- Choice is saved per user (profile) so it stays after logout/login, applied instantly across dashboard, sidebar, buttons, labels, empty states, toasts.
- Urdu / Arabic / Pashto switch the dashboard to right-to-left layout.
- Every AI feature (paper generation, Best Approach, Physics/Math Solver, Book Solver, Notes generator, dashboard NSAGPT AI) answers in the selected language. If the user types in a different language, the reply follows the language they wrote in (Roman Urdu question gets a Roman Urdu reply).
- Special Instructions box: preset chips and helper text become clean professional English by default; they translate only when another language is selected. Free-typed instructions in any language keep working.
- Paper output language stays controlled by the paper's own settings (Urdu subjects remain full Urdu) — the interface language does not force the paper language.

## 2. One device per login, admin approves new devices

- On sign-in the app builds a device signature (browser/OS/screen/timezone fingerprint) plus the caller's IP, checked on the server.
- First successful sign-in registers that device as approved for the account.
- Signing in from a different device: sign-in is blocked with "This device is not approved. Contact the administrator." and a request is created automatically with email, device name, browser/OS, IP, and time.
- Admin panel gets a "Devices" tab: pending device requests with Approve / Reject, plus the list of approved devices per user with the option to revoke or reset a user's devices (so a user who changed phone/laptop can be released).
- Admin's own account is exempt from the device lock so you never lock yourself out.

## Technical notes

- New table `user_devices` (user_id, fingerprint, label, browser, os, ip, status pending/approved/rejected, timestamps) with RLS: users read only their own rows; all writes/approvals go through admin-verified server functions.
- Device check runs in a server function after Supabase credentials succeed; on rejection the client session is signed out immediately, so no protected data loads.
- `src/context/LanguageContext.tsx` + `src/lib/i18n/*` hold the dictionaries; components read `t('key')`. Language and direction persist in profile and localStorage.
- AI server prompts (`generate.server.ts`, `plan.server.ts`, `solve.server.ts`, `ask.server.ts`, `notes.server.ts`) receive a `uiLanguage` field with an instruction to mirror the user's input language when it differs.
