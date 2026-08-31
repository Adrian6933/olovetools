// ============================================================================
// Loadable pairs. Each one is picked to show a different failure mode of naive
// diffing: a rewritten function, a re-indented block, a reordered config and a
// paragraph where only a few words moved.
// ============================================================================

import type { LanguageId } from './highlight';

export type SampleId = 'code' | 'indent' | 'config' | 'prose';

export interface Sample {
  id: SampleId;
  language: LanguageId;
  a: string;
  b: string;
}

const CODE_A = `export function greet(user) {
  if (!user) {
    return "Hello, stranger!";
  }
  console.log("Hello, " + user.name + "!");
  return true;
}

export function farewell(user) {
  console.log("Bye, " + user.name);
}`;

const CODE_B = `// Greeting helpers, rewritten for the new API.
export function greet(user = { name: "Guest" }) {
  if (!user.name) {
    return "Hello, stranger!";
  }
  console.log(\`Hello, \${user.name}!\`);
  console.log("Welcome back");
  return { success: true };
}

export function farewell(user) {
  console.log(\`Bye, \${user.name}\`);
}`;

const INDENT_A = `function total(items) {
const rates = getRates();
let sum = 0;
for (const item of items) {
sum += item.price * rates[item.currency];
}
return sum;
}`;

const INDENT_B = `function total(items) {
    const rates = getRates();
    let sum = 0;
    for (const item of items) {
        sum += item.price * rates[item.currency];
    }
    return sum;
}`;

const CONFIG_A = `{
  "name": "checkout-service",
  "version": "2.4.1",
  "port": 8080,
  "timeout": 30,
  "features": {
    "retry": true,
    "cache": false
  },
  "regions": ["eu-west-1", "us-east-1"]
}`;

const CONFIG_B = `{
  "name": "checkout-service",
  "version": "2.5.0",
  "port": 8080,
  "timeout": 15,
  "features": {
    "retry": true,
    "cache": true,
    "tracing": true
  },
  "regions": ["eu-west-1", "us-east-1", "ap-south-1"]
}`;

const PROSE_A = `The quick brown fox jumps over the lazy dog near the river.
Our refund window is 14 days from the delivery date.
Support replies within one business day, Monday to Friday.
Prices shown include VAT for customers inside the European Union.`;

const PROSE_B = `The quick brown fox leaps over the sleepy dog beside the river.
Our refund window is 30 days from the delivery date.
Support replies within one business day, Monday to Saturday.
Prices shown exclude VAT for customers outside the European Union.`;

export const SAMPLES: Record<SampleId, Sample> = {
  code: { id: 'code', language: 'javascript', a: CODE_A, b: CODE_B },
  indent: { id: 'indent', language: 'javascript', a: INDENT_A, b: INDENT_B },
  config: { id: 'config', language: 'json', a: CONFIG_A, b: CONFIG_B },
  prose: { id: 'prose', language: 'none', a: PROSE_A, b: PROSE_B },
};
