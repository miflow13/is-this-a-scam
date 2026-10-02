import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { POST } from '../src/app/api/analyze/route.ts';
const url = 'http://127.0.0.1:3000/api/analyze';
async function request(origin = 'http://127.0.0.1:3000', count = 1) {
  const bytes = await sharp({create:{width:32,height:32,channels:3,background:'#fff'}}).png().toBuffer();
  const form = new FormData();
  for(let i=0;i<count;i++) form.append('image',new Blob([new Uint8Array(bytes)],{type:'image/png'}),'screenshot.png');
  return new Request(url,{method:'POST',headers:{origin},body:form});
}
test('rejects cross-origin submission before analysis', async () => {
  const response = await POST(await request('https://other.example'));
  assert.equal(response.status,403);
  assert.deepEqual(Object.keys(await response.json()),['error']);
});
test('rejects missing origin, duplicate files, missing image, and malformed multipart', async () => {
  const noOrigin = await request(); noOrigin.headers.delete('origin');
  assert.equal((await POST(noOrigin)).status,403);
  assert.equal((await POST(await request(undefined,2))).status,400);
  assert.equal((await POST(await request(undefined,0))).status,400);
  const bad = new Request(url,{method:'POST',headers:{origin:'http://127.0.0.1:3000','content-type':'multipart/form-data; boundary=x'},body:'broken'});
  assert.equal((await POST(bad)).status,400);
});
test('rejects excessive request bodies including those with no length header', async () => {
  const req = new Request(url,{method:'POST',headers:{origin:'http://127.0.0.1:3000','content-type':'multipart/form-data; boundary=x'},body:new Uint8Array(8*1024*1024+65537)});
  assert.equal((await POST(req)).status,413);
});
test('returns only validated results with no-store; provider errors never look like verdicts', async () => {
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({message:{content:JSON.stringify({verdict:'uncertain',summary:'The sender is not identifiable.',redFlags:[],recommendedAction:'Click the message.'})}});
    const response = await POST(await request());
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const result = await response.json();
    assert.deepEqual(Object.keys(result).sort(),['recommendedAction','redFlags','summary','verdict']);
    assert.equal(result.verdict,'uncertain');
    assert.match(result.recommendedAction,/Don't use links/);
    globalThis.fetch = async () => { throw new TypeError('private details'); };
    const failed = await POST(await request());
    assert.equal(failed.status,503);
    assert.deepEqual(Object.keys(await failed.json()),['error']);
  } finally { globalThis.fetch = realFetch; }
});
