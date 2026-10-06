import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { check, type Violation } from "./foundation.rules.js";
import { listFiles } from "./foundation.scanner.js";

const SRC = fileURLToPath(new URL("./", import.meta.url));
const FIXTURES = fileURLToPath(new URL("./fixtures/", import.meta.url));
const fmt = (v: Violation[]) => v.map((x) => `${x.file} [${x.rule}] ${x.detail}`).join("\n");

test("real code has no layer violations", () => {
  const v = check(listFiles(SRC), SRC);
  assert.deepEqual(v, [], fmt(v));
});

const fixtureViolations = check(listFiles(FIXTURES, ["node_modules"]), FIXTURES);
const rulesFor = (name: string) =>
  fixtureViolations.filter((x) => x.file.endsWith(name)).map((x) => x.rule).sort();

test("domain importing pg breaks R1 and R2", () => {
  assert.deepEqual(rulesFor("imports-pg.ts"), ["R1-db-driver-confinement", "R2-domain-purity"]);
});

test("tsconfig has no path aliases", () => {
  const cfg = JSON.parse(readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8"));
  assert.equal(cfg.compilerOptions?.paths, undefined);
});