// Route table. Handlers take a session and return data.

const { requireUser, requireAdmin } = require('./auth');
const db = require('./db');

const routes = {
  'GET /account': (session) => {
    const userId = requireUser(session);
    return db.getOrdersForUser(userId);
  },
  'GET /admin/orders': (session) => {
    requireAdmin(session);
    return db.getAllOrders();
  },
  'GET /export/orders': () => {
    return db.getAllOrders();
  },
};

module.exports = { routes };
