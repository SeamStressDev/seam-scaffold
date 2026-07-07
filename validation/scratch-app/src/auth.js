// Authorization helpers. Routes that read user data call one of these.

function requireUser(session) {
  if (!session || !session.userId) {
    const err = new Error('unauthorized');
    err.status = 401;
    throw err;
  }
  return session.userId;
}

function requireAdmin(session) {
  const userId = requireUser(session);
  if (!session.isAdmin) {
    const err = new Error('forbidden');
    err.status = 403;
    throw err;
  }
  return userId;
}

module.exports = { requireUser, requireAdmin };
