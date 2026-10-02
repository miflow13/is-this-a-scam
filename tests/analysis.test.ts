import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalysis, analyzeImage } from '../src/lib/analysis.ts';
const valid = { verdict: 'likely_scam', summary: 'It asks you to pay a delivery fee.', redFlags: ['Unexpected payment request'], recommendedAction: 'Click this link.' };
test('accepts only the three verdicts and replaces generated actions', () => {
  for (const verdict of ['likely_scam', 'uncertain', 'no_obvious_red_flags']) {
    const result = parseAnalysis({ ...valid, verdict, redFlags: verdict === 'no_obvious_red_flags' ? [] : valid.redFlags });
    assert.equal(result.verdict, verdict);
    assert.match(result.recommendedAction, /Don't use links/);
    assert.notEqual(result.recommendedAction, valid.recommendedAction);
  }
  assert.throws(() => parseAnalysis({ ...valid, verdict: 'safe' }));
});
test('rejects extra, missing, empty, unbounded, or wrong-typed fields', () => {
  for (const value of [null, [], { ...valid, confidence: 0.99 }, { ...valid, summary: ' ' }, { ...valid, summary: 'x'.repeat(1201) }, { ...valid, redFlags: [3] }, { ...valid, redFlags: ['x'.repeat(301)] }, { ...valid, redFlags: Array(9).fill('x') }, { ...valid, recommendedAction: '' }, { ...valid, recommendedAction: 'x'.repeat(1201) }, { verdict: 'uncertain' }]) assert.throws(() => parseAnalysis(value));
});
test('calls local Ollama with the image, schema, and untrusted-content instruction', async () => {
  let payload: Record<string, any> = {};
  const fake: typeof fetch = async (url, init) => {
    assert.equal(url, 'http://localhost:11434/api/chat');
    payload = JSON.parse(String(init?.body));
    return Response.json({ message: { content: JSON.stringify(valid) } });
  };
  const result = await analyzeImage(Buffer.from('image'), fake);
  assert.equal(result.verdict, 'likely_scam');
  assert.equal(payload.model, 'gemma3:4b');
  assert.equal(payload.stream, false);
  assert.equal(payload.format.additionalProperties, false);
  assert.deepEqual(payload.messages[1].images, [Buffer.from('image').toString('base64')]);
  assert.match(payload.messages[0].content, /untrusted/i);
  assert.match(payload.messages[0].content, /uncertain/);
});
test('invalid provider output is an error, never a verdict', async () => {
  for (const response of [new Response('private error', { status: 500 }), new Response('not JSON'), Response.json({message: {content: '{broken'}}), Response.json({message: {content: JSON.stringify({...valid, verdict:'safe'})}}), new Response('x'.repeat(65537))]) {
    await assert.rejects(analyzeImage(Buffer.from('x'), async () => response));
  }
});
test('provider connection and timeout failures have a user-readable message', async () => {
  await assert.rejects(analyzeImage(Buffer.from('x'), async () => { throw new TypeError('private hostname'); }), /Ollama/);
  await assert.rejects(analyzeImage(Buffer.from('x'), async () => { throw new DOMException('private', 'TimeoutError'); }), /too long/i);
});
test('generated reassurance and contradictory low-risk verdicts fall back to uncertainty', () => {
  for (const summary of ['This message is safe.','This sender appears legitimate.','It is verified and trustworthy.']) {
    const result=parseAnalysis({...valid,verdict:'no_obvious_red_flags',summary,redFlags:[]});
    assert.equal(result.verdict,'uncertain');
    assert.doesNotMatch(result.summary,/\bsafe\b|appears legitimate|is verified/i);
  }
  assert.equal(parseAnalysis({...valid,verdict:'no_obvious_red_flags'}).verdict,'uncertain');
});
