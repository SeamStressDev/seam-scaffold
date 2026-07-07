// Charges an order through the gateway, adding the platform processing fee.

const gateway = require('../gateway');

const PROCESSING_FEE_CENTS = 30;

function charge(orderId, amountCents, { idempotencyKey } = {}) {
  const total = amountCents + PROCESSING_FEE_CENTS;
  return gateway.submitCharge({ orderId, amountCents: total, idempotencyKey });
}

module.exports = { charge, PROCESSING_FEE_CENTS };
