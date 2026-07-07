// Ported from the engine's detector.test.ts heuristic describes (7 tests),
// assertions translated from vitest expect to node:assert.

import { test, describe } from "node:test";
import assert from "node:assert";
import { scoreSource, DEFAULT_CANDIDATE_THRESHOLD } from "../src/heuristic/heuristic.js";

describe("heuristic: server scope refinement", () => {
  test("scores a server side money path file as a candidate", () => {
    const c = scoreSource(
      "actions/generate-user-stripe.ts",
      `"use server";\nimport { stripe } from "@/lib/stripe";\nawait stripe.checkout.sessions.create({});`,
    );
    assert.ok(c.score >= DEFAULT_CANDIDATE_THRESHOLD);
    assert.ok(c.hits.includes("bonus:server"));
  });

  test("does NOT score a pure UI trigger component as a candidate", () => {
    const c = scoreSource(
      "components/forms/billing-form-button.tsx",
      `export function BillingButton() { return <button onClick={() => generateUserStripe()}>Upgrade</button>; }`,
    );
    assert.ok(c.score < DEFAULT_CANDIDATE_THRESHOLD);
    assert.ok(c.hits.includes("penalty:ui"));
  });

  test("nominates a non JS auth seam (Django JWT backend)", () => {
    const c = scoreSource(
      "conduit/apps/authentication/backends.py",
      `import jwt\nfrom django.conf import settings\n` +
        `def authenticate(self, request):\n  token = request.META.get('HTTP_AUTHORIZATION')\n` +
        `  payload = jwt.decode(token, settings.SECRET_KEY)\n  return (user, token)`,
    );
    assert.ok(c.score >= DEFAULT_CANDIDATE_THRESHOLD);
    assert.ok(c.hits.includes("bonus:server"));
  });

  test("nominates a DRF view with declarative permissions plus deletion", () => {
    const c = scoreSource(
      "conduit/apps/articles/views.py",
      `class ArticleViewSet(viewsets.ModelViewSet):\n` +
        `  permission_classes = [IsAuthenticatedOrReadOnly]\n` +
        `  def perform_destroy(self, instance):\n    instance.delete()`,
    );
    assert.ok(c.score >= DEFAULT_CANDIDATE_THRESHOLD);
  });

  test("does not penalize a server file that merely contains the word 'view'", () => {
    const c = scoreSource(
      "app/views.py",
      `def delete_account(request):\n  if request.user.is_staff:\n    Account.objects.filter(id=request.user.id).delete()`,
    );
    assert.ok(!c.hits.includes("penalty:ui"));
  });
});

describe("heuristic: content safety net", () => {
  test("rescues a signal LIGHT but risk SHAPED file with no obvious keywords", () => {
    const c = scoreSource(
      "lib/ledger.ts",
      `export function settle(account, amount) {\n` +
        `  if (account.owner !== currentActor) return;\n` +
        `  account.balance -= amount;\n` +
        `  entries.delete(account.id);\n` +
        `}`,
    );
    assert.ok(c.score >= DEFAULT_CANDIDATE_THRESHOLD);
    assert.strictEqual(c.viaSafetyNet, true);
    for (const expected of ["shape:access-branch", "shape:money-math", "shape:db-delete"]) {
      assert.ok(c.hits.includes(expected), `missing ${expected}`);
    }
  });

  test("does not rescue a trivial file with no risk shapes", () => {
    const c = scoreSource("lib/format.ts", `export const upper = (s) => s.toUpperCase();`);
    assert.ok(c.score < DEFAULT_CANDIDATE_THRESHOLD);
  });
});
