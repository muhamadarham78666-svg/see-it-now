/**
 * Test various Gemini models with free keys to find which have available quota.
 */
const KEYS = ['zain', 'zain2', 'zain3'];
const MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-flash-8b',
  'gemini-flash-exp',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash-exp',
  'gemini-pro',
];

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function testModel(model: string, keyName: string) {
  const key = process.env[keyName];
  if (!key) return `${model} | ${keyName} | SKIP (no key)`;
  const url = `${BASE}/${model}:generateContent?key=${key}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "OK" in one word.' }] }],
        generationConfig: { maxOutputTokens: 10, temperature: 0 },
      }),
    });
    const status = res.status;
    if (status === 200) {
      const data = await res.json() as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return `${model} | ${keyName} | 200 OK | "${text.trim().slice(0, 20)}"`;
    }
    const body = await res.text();
    const errCode = body.match(/"code":\s*(\d+)/)?.[1] ?? status;
    const errMsg = body.match(/"message":\s*"([^"]+)"/)?.[1]?.slice(0, 80) ?? '';
    return `${model} | ${keyName} | ${status} | ${errCode} ${errMsg}`;
  } catch (e: any) {
    return `${model} | ${keyName} | ERROR ${e?.message ?? e}`;
  }
}

async function main() {
  console.log('=== Testing free Gemini models ===\n');
  // Test all models with key 1 first
  for (const model of MODELS) {
    const result = await testModel(model, 'zain');
    console.log(result);
  }
  console.log('\n=== Testing key 2 ===');
  for (const model of ['gemini-3.6-flash', 'gemini-flash-latest']) {
    const result = await testModel(model, 'zain2');
    console.log(result);
  }
  console.log('\n=== Testing key 3 ===');
  for (const model of ['gemini-3.6-flash', 'gemini-flash-latest']) {
    const result = await testModel(model, 'zain3');
    console.log(result);
  }
}

main().catch(console.error);
