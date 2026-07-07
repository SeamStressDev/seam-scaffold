// Checkout with retry. The idempotency key is derived from the order id, so a
// retried attempt resolves to the same gateway charge instead of a new one.

const { charge } = require('./charge');

const MAX_RETRIES = 2;

function checkout(order) {
  const idempotencyKey = `order-${order.id}`;
  let attempts = 0;
  let lastError = null;
  while (attempts <= MAX_RETRIES) {
    attempts += 1;
    try {
      return charge(order.id, order.amountCents, { idempotencyKey });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

module.exports = { checkout, MAX_RETRIES };
