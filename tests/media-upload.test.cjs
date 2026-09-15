const { test } = require('node:test');
const assert = require('node:assert/strict');
const { uploadMedia } = require('../src/lib/media/upload.ts');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const PropertyImage = require('../src/components/PropertyImage.tsx').default;

test('media upload sends bytes to storage and returns the permanent public URL', async (t) => {
  const file = new Blob(['media fixture'], { type: 'video/mp4' });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? Response.json({ uploadUrl: 'http://localhost:9000/upload?signature=test', publicUrl: 'http://localhost:9000/property/video.mp4' })
      : new Response(null, { status: 200 });
  });
  assert.equal(await uploadMedia(file, file.type, 'test-token'), 'http://localhost:9000/property/video.mp4');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(calls[0].options.body), { contentType: 'video/mp4' });
  assert.equal(calls[1].options.method, 'PUT');
  assert.equal(calls[1].options.body, file);
  assert.equal(calls[1].options.headers['Content-Type'], file.type);
  assert.equal(calls[1].options.headers.Authorization, undefined);
});

test('signed-out users cannot request an upload', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', () => assert.fail('Unexpected network request'));
  await assert.rejects(uploadMedia(new Blob(), 'image/jpeg', null), /sign in/i);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('presign rejection stops before uploading bytes', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'Only manager accounts can do this.' }, { status: 403 }));
  await assert.rejects(uploadMedia(new Blob(), 'image/jpeg', 'token'), /Only manager/);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('failed storage PUT never returns a URL to publish', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => ++calls === 1
    ? Response.json({ uploadUrl: 'http://localhost:9000/upload', publicUrl: 'http://localhost:9000/photo.jpg' })
    : new Response(null, { status: 500 }));
  await assert.rejects(uploadMedia(new Blob(), 'image/jpeg', 'token'), /Upload failed/);
});

test('property images render direct MinIO URLs without the Next.js optimizer', () => {
  const url = 'http://localhost:9000/huza-properties/properties/test/photo.jpg';
  const html = renderToStaticMarkup(React.createElement(PropertyImage, { src: url, alt: 'Property', width: 400, height: 300 }));
  assert.ok(html.includes(`src="${url}"`));
  assert.ok(!html.includes('/_next/image'));
});
