// Fake payment gateway. Records every charge in memory and honors idempotency
// keys the way a real gateway does: a repeated key returns the original charge
// instead of creating a new one. failNext(n) makes the next n submissions
// throw, to simulate timeouts.

const charges = [];
const byIdempotencyKey = new Map();
let failuresRemaining = 0;

function failNext(n) {
  failuresRemaining = n;
}

function submitCharge({ orderId, amountCents, idempotencyKey }) {
  if (failuresRemaining > 0) {
    failuresRemaining -= 1;
    throw new Error('gateway timeout');
  }
  if (idempotencyKey && byIdempotencyKey.has(idempotencyKey)) {
    return byIdempotencyKey.get(idempotencyKey);
  }
  const charge = {
    id: `ch_${charges.length + 1}`,
    orderId,
    amountCents,
    idempotencyKey: idempotencyKey || null,
  };
  charges.push(charge);
  if (idempotencyKey) byIdempotencyKey.set(idempotencyKey, charge);
  return charge;
}

function allCharges() {
  return charges.slice();
}

function reset() {
  charges.length = 0;
  byIdempotencyKey.clear();
  failuresRemaining = 0;
}

module.exports = { submitCharge, allCharges, failNext, reset };
