const { test } = require('node:test');
const assert = require('node:assert');
const { routes } = require('../src/routes');

test('/account requires a signed in user', () => {
  assert.throws(() => routes['GET /account'](null), /unauthorized/);
});

test('/account returns only the callers rows', () => {
  const rows = routes['GET /account']({ userId: 'u-1' });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => row.user_id === 'u-1'));
});

test('/admin/orders requires admin', () => {
  assert.throws(() => routes['GET /admin/orders']({ userId: 'u-1' }), /forbidden/);
});
