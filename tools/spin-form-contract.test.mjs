import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = readFileSync(new URL('../src/lib/spin-form.ts', import.meta.url), 'utf8');
const contract = JSON.parse(readFileSync(new URL('../src/lib/spin-form.contract.json', import.meta.url), 'utf8'));
const fingerprint = value => createHash('sha256').update(value.replace(/\r/g, '')).digest('hex');

test('browser SPIN validation matches the versioned public contract shared with API', () => {
  assert.equal(contract.name, 'binahub-spin-public-form');
  assert.equal(contract.version, 1);
  assert.equal(contract.normalization, 'remove-carriage-returns');
  assert.equal(fingerprint(source), contract.sha256);
});

test('browser form is dependency-free and does not include server-only imports', () => {
  assert.doesNotMatch(source, /^\s*import\s|\brequire\s*\(|\bprocess\.env|server-only|node:/m);
});

test('CRLF and LF produce the same contract fingerprint', () => {
  assert.equal(fingerprint(source.replace(/\r/g, '').replace(/\n/g, '\r\n')), fingerprint(source));
});

test('an actual source edit changes the pinned contract fingerprint', () => {
  assert.notEqual(fingerprint(source + '\n// synthetic contract change'), contract.sha256);
});
