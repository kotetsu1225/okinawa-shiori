import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Load the real TypeScript modules through the same transformer as the app.
// Only ssrLoadModule is used, so the client dependency scanner is switched off:
// it crawls every HTML entry and races this server's close with esbuild errors.
const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  configFile: false,
  envFile: false,
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());
const trip = await server.ssrLoadModule('/src/api/trip.ts');
const days = await server.ssrLoadModule('/src/api/days.ts');
const items = await server.ssrLoadModule('/src/api/items.ts');

test('all itinerary reads and writes explicitly scope requests to the selected trip', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url: new URL(url, 'https://example.test'), options });
    return new Response('{}', { status: 200 });
  });

  await trip.getTrip('onsen');
  await trip.patchTrip('onsen', { title: '温泉のしおり' });
  await days.listDays('onsen');
  await days.createDay('onsen', { date: '2026-09-23' });
  await days.patchDay('onsen', 'day1', { title: '湯めぐり' });
  await days.deleteDay('onsen', 'day2', true);
  await items.listItems('onsen');
  await items.createItem('onsen', { dayId: 'day1', title: '宿へ' });
  await items.patchItem('onsen', 'item1', { done: true });
  await items.deleteItem('onsen', 'item1');

  assert.deepEqual(calls.map(({ url, options }) => [options.method, url.pathname]), [
    ['GET', '/api/trip'], ['PATCH', '/api/trip'],
    ['GET', '/api/days'], ['POST', '/api/days'], ['PATCH', '/api/days/day1'], ['DELETE', '/api/days/day2'],
    ['GET', '/api/items'], ['POST', '/api/items'], ['PATCH', '/api/items/item1'], ['DELETE', '/api/items/item1'],
  ]);
  for (const { url } of calls) assert.equal(url.searchParams.get('trip'), 'onsen');
  assert.equal(calls[5].url.searchParams.get('withItems'), 'true');
  assert.deepEqual(JSON.parse(calls[8].options.body), { done: true });
});

test('concurrent requests retain independent trip scopes', async (t) => {
  const calls = [];
  const resolvers = [];
  t.mock.method(globalThis, 'fetch', (url) => {
    calls.push(new URL(url, 'https://example.test'));
    return new Promise((resolve) => resolvers.push(resolve));
  });
  const onsenRequest = items.patchItem('onsen', 'old-item', { done: true });
  const okinawaRequest = items.patchItem('okinawa', 'new-item', { done: false });
  resolvers[1](new Response('{}', { status: 200 }));
  await okinawaRequest;
  resolvers[0](new Response('{}', { status: 200 }));
  await onsenRequest;
  assert.equal(calls[0].searchParams.get('trip'), 'onsen');
  assert.equal(calls[1].searchParams.has('trip'), false);
});
