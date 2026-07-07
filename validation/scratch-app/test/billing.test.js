const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const gateway = require('../src/gateway');
const { charge } = require('../src/billing/charge');
const { checkout } = require('../src/billing/checkout');

beforeEach(() => gateway.reset());

test('checkout retry does not double charge', () => {
  const order = { id: 'o-9', amountCents: 1000 };
  gateway.failNext(1);
  checkout(order);
  checkout(order);
  assert.strictEqual(gateway.allCharges().length, 1);
});

test('charge adds the 30 cent processing fee', () => {
  charge('o-8', 1000);
  const [row] = gateway.allCharges();
  assert.strictEqual(row.amountCents, 1030);
});
