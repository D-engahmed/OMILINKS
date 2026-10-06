import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { hasNonLiteralImport, importsOf, layerOfPath, resolveImport } from "./foundation.scanner.js";

export const KNOWN_LAYERS = [
  "api", "workers", "application", "domain", "ports",
  "infrastructure", "integrations", "shared", "main",
] as const;

// Which layers each layer may import via relative paths (its own layer is always allowed).
const ALLOWED_LAYER_IMPORTS: Record<string, readonly string[]> = {
  domain: ["domain", "ports", "shared"],
  ports: ["ports", "domain", "shared"],
  application: ["application", "domain", "ports", "shared"],
  api: ["api", "application", "shared"],
  workers: ["workers", "application", "shared"],
  infrastructure: ["infrastructure", "ports", "domain", "shared"],
  integrations: ["integrations", "ports", "domain", "shared"],
  shared: ["shared"],
  main: [...KNOWN_LAYERS], // composition root: wires everything
};

const NO_PACKAGES_IN = new Set(["domain", "ports"]);
const DB_DRIVERS = new Set(["pg"]);
const PROVIDER_SDKS = new Set(["openai", "@anthropic-ai/sdk"]);

export type Violation = { file: string; rule: string; detail: string };

export function check(files: string[], root: string): Violation[] {
  const out: Violation[] = [];
  for (const file of files) {
    const layer = layerOfPath(file, root);
    const rel = relative(root, file);
    const add = (rule: string, detail: string) => out.push({ file: rel, rule, detail });

    if (layer === "(root)") continue; // test/tooling files directly in src/
    if (!(KNOWN_LAYERS as readonly string[]).includes(layer)) {
      add("R0-unknown-layer", `folder "${layer}" is not in the layer contract`);
      continue;
    }

    const source = readFileSync(file, "utf8");
    if (hasNonLiteralImport(source)) {
      add("R5-non-literal-import", "import()/require() with a non-literal argument cannot be checked");
    }

    for (const spec of importsOf(source)) {
      const r = resolveImport(file, spec, root);
      if (r.kind === "relative") {
        if (r.layer === "(outside)") {
          add("R6-escapes-src", `"${spec}" resolves outside src/`);
        } else if (r.layer !== layer && !ALLOWED_LAYER_IMPORTS[layer]?.includes(r.layer)) {
          add("R4-layer-direction", `${layer} must not import ${r.layer} ("${spec}")`);
        }
      } else {
        if (NO_PACKAGES_IN.has(layer)) add("R2-domain-purity", `${layer} must not import package "${r.name}"`);
        if (DB_DRIVERS.has(r.name) && layer !== "infrastructure") add("R1-db-driver-confinement", `"${r.name}" only allowed in infrastructure`);
        if (PROVIDER_SDKS.has(r.name) && layer !== "integrations") add("R3-provider-sdk-confinement", `"${r.name}" only allowed in integrations`);
      }
    }
  }
  return out;
}