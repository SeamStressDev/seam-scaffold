// In memory order store. Reads of order rows are scoped by user_id.

const orders = [
  { id: 'o-1', user_id: 'u-1', amountCents: 1200, item: 'poster' },
  { id: 'o-2', user_id: 'u-1', amountCents: 800, item: 'stickers' },
  { id: 'o-3', user_id: 'u-2', amountCents: 5600, item: 'print' },
];

function getOrdersForUser(userId) {
  return orders.filter((row) => row.user_id === userId);
}

function getAllOrders() {
  return orders.slice();
}

module.exports = { getOrdersForUser, getAllOrders };
