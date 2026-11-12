import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import type { UserIdentity } from "convex/server";
import type { Id } from "../convex/_generated/dataModel";
import type { MutationCtx } from "../convex/_generated/server";
import { add } from "../convex/users";

// Exercise the registered handler with only its auth and persistence boundaries
// replaced. No Convex deployment or external identity provider is required.
const addUser = (
  add as unknown as {
    _handler: (ctx: MutationCtx, args: Record<string, never>) => Promise<Id<"users">>;
  }
)._handler;

const identity: UserIdentity = {
  tokenIdentifier: "https://issuer.example|user_test",
  issuer: "https://issuer.example",
  subject: "user_test",
};

function setup(userIdentity: UserIdentity | null) {
  const userId = "test_user_id" as Id<"users">;
  const getUserIdentity = mock.fn(async () => userIdentity);
  const insert = mock.fn(async (_table: string, _document: { name: string }) => userId);
  // The handler only uses these two methods. Keep unrelated Convex services out
  // of the fixture so accidental new dependencies fail visibly.
  const ctx = { auth: { getUserIdentity }, db: { insert } } as unknown as MutationCtx;

  return { ctx, getUserIdentity, insert, userId };
}

describe("users.add organization requirement", () => {
  it("preserves the authentication error and does not insert for an anonymous caller", async () => {
    const { ctx, getUserIdentity, insert } = setup(null);

    await assert.rejects(addUser(ctx, {}), {
      name: "Error",
      message: "Not authenticated",
    });
    assert.equal(getUserIdentity.mock.callCount(), 1);
    assert.equal(insert.mock.callCount(), 0);
  });

  for (const [label, claims] of [
    ["absent", {}],
    ["undefined", { orgId: undefined }],
    ["null", { orgId: null }],
    ["empty", { orgId: "" }],
  ] as const) {
    it(`rejects an authenticated caller with an ${label} organization claim before writing`, async () => {
      const { ctx, getUserIdentity, insert } = setup({ ...identity, ...claims });

      await assert.rejects(addUser(ctx, {}), {
        name: "Error",
        message: "Missing organization",
      });
      assert.equal(getUserIdentity.mock.callCount(), 1);
      assert.equal(insert.mock.callCount(), 0);
    });
  }

  it("does not substitute a similarly named claim for orgId", async () => {
    const { ctx, insert } = setup({ ...identity, org_id: "org_test" });

    await assert.rejects(addUser(ctx, {}), { message: "Missing organization" });
    assert.equal(insert.mock.callCount(), 0);
  });

  it("inserts once and returns the database id when an organization is present", async () => {
    const { ctx, getUserIdentity, insert, userId } = setup({
      ...identity,
      orgId: "org_test",
    });

    assert.equal(await addUser(ctx, {}), userId);
    assert.equal(getUserIdentity.mock.callCount(), 1);
    assert.equal(insert.mock.callCount(), 1);
    // This PR adds a guard; the existing stored document remains unchanged.
    assert.deepEqual(insert.mock.calls[0]?.arguments, ["users", { name: "Antonio" }]);
  });

  it("waits for authentication before attempting a database write", async () => {
    const { ctx, getUserIdentity, insert, userId } = setup(null);
    let resolveIdentity!: (value: UserIdentity) => void;
    getUserIdentity.mock.mockImplementation(
      () => new Promise<UserIdentity>((resolve) => { resolveIdentity = resolve; }),
    );

    const pending = addUser(ctx, {});
    assert.equal(getUserIdentity.mock.callCount(), 1);
    assert.equal(insert.mock.callCount(), 0);

    resolveIdentity({ ...identity, orgId: "org_test" });
    assert.equal(await pending, userId);
    assert.equal(insert.mock.callCount(), 1);
  });

  it("propagates authentication failures without attempting an insert", async () => {
    const { ctx, getUserIdentity, insert } = setup(null);
    const failure = new Error("Identity provider unavailable");
    getUserIdentity.mock.mockImplementation(async () => { throw failure; });

    await assert.rejects(addUser(ctx, {}), (error: unknown) => error === failure);
    assert.equal(insert.mock.callCount(), 0);
  });

  it("propagates insert failures after the organization check without retrying", async () => {
    const { ctx, insert } = setup({ ...identity, orgId: "org_test" });
    const failure = new Error("Database write failed");
    insert.mock.mockImplementation(async () => { throw failure; });

    await assert.rejects(addUser(ctx, {}), (error: unknown) => error === failure);
    assert.equal(insert.mock.callCount(), 1);
  });
});
