#!/usr/bin/env bun
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { $ } from "bun";

const SRC_DIR = "src";
const DIST_DIR = "dist";
const ENTRYPOINTS = {
  "src/worker.ts": "worker",
  "src/content-script/index.ts": "content-script",
  "src/options/index.tsx": "options",
};

function tabulate(rows: string[][]): string {
  const colWidths: number[] = [];
  for (const row of rows) {
    for (const [i, cell] of row.entries()) {
      colWidths[i] = Math.max(colWidths[i] ?? 0, cell.length);
    }
  }

  return rows
    .map(
      (row) =>
        "  " + row.map((cell, i) => cell.padEnd(colWidths[i], " ")).join("  "),
    )
    .join("\n");
}

async function patchCss(input: string, output: string): Promise<void> {
  const text = await fs.readFile(input, "utf8");
  const lines = text.split("\n");
  const linesIter = lines[Symbol.iterator]();
  const outputLines: typeof lines = [];

  const properties: string[] = [];

  while (true) {
    const r = linesIter.next();
    if (r.done) {
      break;
    }
    const line = r.value;
    if (line.includes("@property")) {
      const propertyName = line.split(" ")[1];

      // Rewrite @property
      while (true) {
        const r = linesIter.next();
        if (r.done) {
          break;
        }
        const line = r.value.trim();
        if (line.startsWith("initial-value")) {
          const propertyValue = line.split(":")[1].trim().replace(";", "");
          properties.push(`${propertyName}: ${propertyValue};`);
        } else if (line.trim() === "}") {
          break;
        }
      }
    } else {
      outputLines.push(line);
    }
  }

  outputLines.push(
    "@layer theme {",
    "  :root, :host {",
    ...properties.map((line) => "    " + line),
    "  }",
    "}",
  );

  await fs.writeFile(output, outputLines.join("\n"), "utf8");
}

async function build(): Promise<void> {
  // eslint-disable-next-line no-console -- Hush.
  console.info("building...");

  await fs.rm(DIST_DIR, { recursive: true, force: true });

  const outputs: string[][] = [];

  for (const [src, dst] of Object.entries(ENTRYPOINTS)) {
    try {
      var result = await Bun.build({
        entrypoints: [src],
        outdir: DIST_DIR,
        target: "browser",
        naming: `[dir]/${dst}.[ext]`,
        splitting: false,
        sourcemap: true,
        minify: false,
      });
    } catch (error) {
      // eslint-disable-next-line no-console -- Hush.
      console.error(error);
      return;
    }

    for (const o of result.outputs) {
      const relpath = path.relative(process.cwd(), o.path);
      const size = o.size / 1024;
      outputs.push([relpath, size.toFixed(2), "KB"]);
    }
  }

  // CSS (Tailwind)
  // Note that all CSS is bundled into a single file, which is shared by both the content-script and
  // the options page.
  {
    const filename = "ukg-schedule-sync.css";
    const input = `src/${filename}`;
    const outputTemp = `tmp/${filename}`;
    const output = `dist/${filename}`;
    try {
      await $`node_modules/.bin/tailwindcss -i ${input} -o ${outputTemp}`.quiet();
    } catch (error) {
      // eslint-disable-next-line no-console -- Hush.
      console.error(error);
      return;
    }
    await patchCss(outputTemp, output);
    const size = (await fs.stat(output)).size / 1024;
    outputs.push([output, size.toFixed(2), "KB"]);
  }

  // eslint-disable-next-line no-console -- Hush.
  console.info(tabulate(outputs));
}

async function watchBuild(): Promise<void> {
  await build();
  const watcher = fs.watch(SRC_DIR, { recursive: true });
  for await (const _ of watcher) {
    await build();
  }
}

const { values: options } = parseArgs({
  options: { watch: { type: "boolean", short: "w" } },
});

if (options.watch) {
  // eslint-disable-next-line no-console -- Hush.
  console.info("watching...");
  void watchBuild();
} else {
  void build();
}
