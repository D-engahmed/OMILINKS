import { readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export function listFiles(dir: string, skipDirs: string[] = ["node_modules", "fixtures"]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.includes(entry.name)) out.push(...listFiles(full, skipDirs));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

const NAMES = String.raw`[\w*{}\s,$]+?`; // cannot contain quotes or ";" so it can't span statements
const Q = String.raw`["']([^"']+)["']`;

const IMPORT_PATTERNS = [
  new RegExp(String.raw`\bimport\s+(?:type\s+)?${NAMES}\s+from\s*${Q}`, "g"),
  new RegExp(String.raw`\bexport\s+(?:type\s+)?${NAMES}\s+from\s*${Q}`, "g"),
  new RegExp(String.raw`\bimport\s*${Q}`, "g"),
  new RegExp(String.raw`\bimport\s*\(\s*${Q}\s*\)`, "g"),
  new RegExp(String.raw`\brequire\s*\(\s*${Q}\s*\)`, "g"),
];

export function importsOf(source: string): string[] {
  const code = stripComments(source);
  const found = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    for (const m of code.matchAll(pattern)) {
      if (m[1]) found.add(m[1]);
    }
  }
  return [...found];
}

export function packageName(spec: string): string {
  if (spec.startsWith("node:")) return spec;
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
}

export function layerOfPath(path: string, root: string): string {
  const rel = relative(root, path);
  if (rel.startsWith("..")) return "(outside)";
  const parts = rel.split(sep);
  return parts.length === 1 ? "(root)" : parts[0]!;
}

export type Resolved =
  | { kind: "relative"; layer: string }
  | { kind: "package"; name: string };

export function resolveImport(fromFile: string, spec: string, root: string): Resolved {
  if (spec.startsWith(".")) {
    return { kind: "relative", layer: layerOfPath(resolve(dirname(fromFile), spec), root) };
  }
  return { kind: "package", name: packageName(spec) };
}