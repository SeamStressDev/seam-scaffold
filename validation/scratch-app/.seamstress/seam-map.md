# Seam map

- src/billing/charge.js: money movement, every gateway charge goes through here
- src/billing/checkout.js: retry loop around a charge; the idempotency invariant lives here
- src/routes.js: authorization decisions for every route
- src/auth.js: the authorization helpers the routes depend on
- src/db.js: per user order queries, user_id scoping
