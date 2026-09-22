import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, dayPath, loginDestination, overviewPath, tripFromSearch, withTrip } from '../src/lib/routes.ts';

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

test('trip selection survives overview and day navigation, including encoded IDs', () => {
  assert.equal(tripFromSearch(''), 'okinawa');
  assert.equal(tripFromSearch('?trip='), 'okinawa');
  assert.equal(tripFromSearch('?trip=onsen&other=value'), 'onsen');
  assert.equal(tripFromSearch('?trip=another-trip'), 'another-trip');
  assert.equal(overviewPath('onsen'), '/?trip=onsen');
  assert.equal(dayPath('温泉の日', 'onsen'), '/days/%E6%B8%A9%E6%B3%89%E3%81%AE%E6%97%A5?trip=onsen');
  assert.equal(overviewPath('okinawa'), '/');
});

test('scoping an API URL preserves other query options', () => {
  assert.equal(withTrip('/api/days/day1?withItems=true', 'onsen'), '/api/days/day1?withItems=true&trip=onsen');
  assert.equal(withTrip('/api/days/day1?withItems=true&trip=onsen', 'okinawa'), '/api/days/day1?withItems=true');
  assert.equal(withTrip('/api/items?trip=old', 'onsen'), '/api/items?trip=onsen');
});

test('legacy login links resolve publicly with the selected trip', () => {
  assert.equal(loginDestination('?trip=onsen'), '/?trip=onsen');
  assert.equal(loginDestination('?trip=onsen&next=%2Fdays%2Fday1'), '/days/day1?trip=onsen');
  assert.equal(loginDestination('?next=' + encodeURIComponent('/days/day1?trip=onsen')), '/days/day1?trip=onsen');
  assert.equal(loginDestination('?trip=onsen&next=' + encodeURIComponent('/days/day1?trip=okinawa')), '/days/day1?trip=onsen');
  for (const next of ['https://example.com', '//example.com', '/\\example.com', '/days/day1#fragment']) {
    assert.equal(loginDestination('?trip=onsen&next=' + encodeURIComponent(next)), '/?trip=onsen');
  }
});
