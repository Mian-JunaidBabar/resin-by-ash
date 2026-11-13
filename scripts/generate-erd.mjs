/**
 * Generates docs/phase-2/erd.png from prisma/schema.prisma.
 * Usage: node scripts/generate-erd.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const schema = readFileSync(resolve("prisma/schema.prisma"), "utf8");
const models = [...schema.matchAll(/model (\w+) \{([\s\S]*?)\n\}/g)].map(([, name, body]) => ({
  name,
  fields: body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("@@")),
}));

const scalar = new Set(["String", "Int", "Boolean", "DateTime", "Json", "Float", "Decimal", "BigInt"]);

const lines = ["erDiagram"];
for (const model of models) {
  lines.push(`  ${model.name} {`);
  for (const line of model.fields) {
    const m = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?/);
    if (!m) continue;
    const [, field, rawType, list, optional] = m;
    if (!scalar.has(rawType)) continue;
    const type = list ? `${rawType}_list` : rawType.toLowerCase();
    const key = line.includes("@id") ? " PK" : line.includes("@unique") ? " UK" : line.includes("@relation(fields:") ? " FK" : "";
    lines.push(`    ${type} ${field}${optional ? "_nullable" : ""}${key}`);
  }
  lines.push("  }");
}

for (const model of models) {
  for (const line of model.fields) {
    const m = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?.*@relation\(fields: \[(\w+)\]/);
    if (!m) continue;
    const [, , target, list, optional] = m;
    if (list) continue;
    lines.push(`  ${target} ${optional ? "|o" : "||"}--o{ ${model.name} : "${m[1]}"`);
  }
}

const html = `<!doctype html><html><body style="margin:0;padding:32px;background:#fff">
<pre class="mermaid">${lines.join("\n")}</pre>
<script src="file://${resolve("node_modules/mermaid/dist/mermaid.min.js")}"></script>
<script>mermaid.initialize({ startOnLoad: true, theme: "base", themeVariables: { fontFamily: "Helvetica, Arial, sans-serif", primaryColor: "#F6F2ED", primaryBorderColor: "#8a6f5a", lineColor: "#8a6f5a", fontSize: "13px" }, er: { layoutDirection: "TB" } });</script>
</body></html>`;

const tmp = resolve("/tmp/opencode/erd.html");
writeFileSync(tmp, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2200, height: 1600 }, deviceScaleFactor: 2 });
await page.goto(`file://${tmp}`);
await page.waitForSelector("svg", { timeout: 30_000 });
await page.waitForTimeout(800);
mkdirSync("docs/phase-2", { recursive: true });
await page.locator("svg").first().screenshot({ path: "docs/phase-2/erd.png" });
await browser.close();
console.log("Wrote docs/phase-2/erd.png");
