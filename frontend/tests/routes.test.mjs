import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, dayPath, loginDestination } from '../src/lib/routes.ts';

test('login, overview and stable day IDs resolve independently', () => {
  assert.deepEqual(parseRoute('/'), { page: 'overview' });
  assert.deepEqual(parseRoute('/login'), { page: 'login' });
  assert.deepEqual(parseRoute('/days/01JABC/'), { page: 'day', dayId: '01JABC' });
  assert.deepEqual(parseRoute(dayPath('日付')), { page: 'day', dayId: '日付' });
});
test('malformed and unknown paths do not resolve to another day', () => {
  for (const path of ['/unknown', '/days/', '/days/a/b', '/days/%ZZ', '/days/%2F', '/days/%5C']) {
    assert.deepEqual(parseRoute(path), { page: 'not-found' });
  }
});
test('login preserves an internal day link and rejects external destinations', () => {
  assert.equal(loginDestination('?next=%2Fdays%2F01JABC'), '/days/01JABC');
  for (const next of ['https://example.com', '//example.com', '/login', '/unknown', '/days/%2F']) {
    assert.equal(loginDestination('?next=' + encodeURIComponent(next)), '/');
  }
  assert.equal(loginDestination(''), '/');
});
