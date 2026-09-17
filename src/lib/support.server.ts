import { aiChatFetch } from './ai-keys.server';
/** Server-only AI support brain. */

const MODEL = 'google/gemini-3-flash-preview';

const SUPPORT_PROMPT = [
  'You are NSAGPT Support Assistant for nsagpt.org — an AI question paper, notes and solver platform for Pakistani teachers and students.',
  'Never mention which AI company or model powers you.',
  'You help with: login problems, subscription plans (Silver — Weekly Rs. 399 / 1 user, Gold — 3 Months Rs. 4,999 / 3 users, Diamond — 1 Year Rs. 10,500 / 5 users), subscription activation and expiry, paper generation, PDF export, Urdu papers, AI Notes, Book Solver, question bank, devices approval, and account settings.',
  'Payments are handled manually: the user submits a subscription request and the NSAGPT team contacts them to activate the plan.',
  'Rules: be short, warm and practical. Give clear steps. Never invent prices, policies or features.',
  'If the problem needs a human (payment confirmation, account unlock, refund, device approval, plan change, bug that you cannot solve), say so plainly and tell the user to press "Talk with NSAGPT Team".',
  'Answer in the language of the user (Urdu, Roman Urdu or English).',
  'Write plain sentences only. Never use markdown: no *, **, #, backticks, tables or code blocks. For steps use short numbered lines like "1." on their own line. Keep replies under 120 words.',

].join('\n');

export interface SupportTurn {
  role: 'user' | 'assistant';
  content: string;
}

async function chat(messages: SupportTurn[]): Promise<string> {
  let lastDetail = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await aiChatFetch({
        model: MODEL,
        messages: [
          { role: 'system', content: SUPPORT_PROMPT },
          ...messages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
        ],
      });

    if (res.ok) {
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = json.choices?.[0]?.message?.content?.trim();
      if (reply) return reply;
      lastDetail = 'empty reply';
    } else {
      if (res.status === 429) lastDetail = 'busy';
      else if (res.status === 402) lastDetail = 'credits';
      else lastDetail = await res.text().catch(() => '');
      if (res.status < 500 && res.status !== 429) break;
    }
    await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
  }

  if (lastDetail === 'busy') throw new Error('Support AI is busy. Please try again in a moment.');
  throw new Error(
    'Support AI could not answer right now. Please press "Talk with NSAGPT Team" and a human will help you.',
  );
}

/** Returns the AI answer plus whether the AI itself suggests human escalation. */
export async function supportReply(messages: SupportTurn[]) {
  const reply = await chat(messages);
  const needsHuman = /talk with nsagpt team|human|team se rabta|ٹیم سے رابطہ/i.test(reply);
  return { reply, needsHuman };
}
