import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { parseAnalysis } from "../src/lib/analysis.ts";
const base = "http://127.0.0.1:3000";
for (const name of [
  "delivery-fee",
  "ordinary-notification",
  "ambiguous-message",
  "embedded-instructions",
]) {
  const image = await readFile(`tests/fixtures/${name}.png`);
  const form = new FormData();
  form.append(
    "image",
    new Blob([new Uint8Array(image)], { type: "image/png" }),
    `${name}.png`,
  );
  const start = performance.now();
  const response = await fetch(`${base}/api/analyze`, {
    method: "POST",
    headers: { Origin: base },
    body: form,
    signal: AbortSignal.timeout(130_000),
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    console.error(`${name}: HTTP ${response.status}`, body);
    process.exitCode = 1;
    continue;
  }
  const result = parseAnalysis(body);
  console.log(
    JSON.stringify(
      {
        fixture: name,
        seconds: Number(((performance.now() - start) / 1000).toFixed(1)),
        ...result,
      },
      null,
      2,
    ),
  );
}
