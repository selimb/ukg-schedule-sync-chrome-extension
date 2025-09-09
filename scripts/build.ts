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

  // tailwind
  {
    const input = "src/content-script/content-script.css";
    const output = "dist/content-script.css";
    try {
      await $`node_modules/.bin/tailwindcss -i ${input} -o ${output}`.quiet();
    } catch (error) {
      console.error(error);
      return;
    }
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
