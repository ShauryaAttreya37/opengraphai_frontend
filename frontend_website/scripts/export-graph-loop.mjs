// Renders the graph loop frame-by-frame in headless Chromium and encodes it.
//
//   node scripts/export-graph-loop.mjs                       # full 288-frame export
//   node scripts/export-graph-loop.mjs --stills=0,4,8.2,9.9  # PNG stills only
//   options: --out=public/video  --frames-dir=/tmp/frames  --fps=24
//
// Every frame is rendered from its exact timestamp (frame / fps), so the
// last frame flows straight back into the first and the file loops cleanly.

import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";

const WIDTH = 2560;
const HEIGHT = 1080;
const LOOP_SECONDS = 12;

function parseArgs(argv) {
  const args = Object.fromEntries(
    argv.filter((a) => a.startsWith("--")).map((a) => {
      const [key, value = "true"] = a.slice(2).split("=");
      return [key, value];
    }),
  );
  return {
    fps: Number(args.fps ?? 24),
    out: resolve(args.out ?? "public/video"),
    framesDir: resolve(args["frames-dir"] ?? join(tmpdir(), "graph-loop-frames")),
    stills: args.stills ? args.stills.split(",").map(Number) : null,
  };
}

function ffmpeg(args) {
  const result = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`ffmpeg failed: ${args.at(-1)}`);
}

async function openPage(url) {
  const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector("[data-graph-loop]")?.dataset.state);
  const state = await page.evaluate(() => ({ ...document.querySelector("[data-graph-loop]").dataset }));
  if (state.state !== "ready") throw new Error(`Graph loop failed to start: ${state.error ?? state.state}`);
  await page.waitForFunction(() => window.__graphLoop);
  return { browser, page, figure: page.locator("[data-graph-loop]") };
}

async function renderFrame(page, figure, t, path) {
  await page.evaluate((time) => window.__graphLoop.renderAt(time), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
  await figure.screenshot({ path });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const server = await createServer({ server: { port: 5199, strictPort: false }, logLevel: "error" });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  const { browser, page, figure } = await openPage(`${base}graph-loop.html?capture`);

  try {
    rmSync(opts.framesDir, { recursive: true, force: true });
    mkdirSync(opts.framesDir, { recursive: true });

    if (opts.stills) {
      for (const t of opts.stills) {
        const path = join(opts.framesDir, `still-${t.toFixed(2)}.png`);
        await renderFrame(page, figure, t, path);
        process.stdout.write(`${path}\n`);
      }
      return;
    }

    const total = Math.round(opts.fps * LOOP_SECONDS);
    for (let i = 0; i < total; i += 1) {
      await renderFrame(page, figure, i / opts.fps, join(opts.framesDir, `${String(i).padStart(4, "0")}.png`));
      if (i % 24 === 0) process.stdout.write(`frame ${i}/${total}\n`);
    }

    mkdirSync(opts.out, { recursive: true });
    const input = ["-framerate", String(opts.fps), "-i", join(opts.framesDir, "%04d.png"), "-an"];
    const bt709 = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"];
    ffmpeg([
      ...input, "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "animation",
      "-pix_fmt", "yuv420p", ...bt709, "-movflags", "+faststart", join(opts.out, "graph-loop.mp4"),
    ]);
    ffmpeg([
      ...input, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "26", "-row-mt", "1",
      "-pix_fmt", "yuv420p", ...bt709, join(opts.out, "graph-loop.webm"),
    ]);
    ffmpeg(["-i", join(opts.framesDir, "0000.png"), "-quality", "90", join(opts.out, "graph-loop-poster.webp")]);
    process.stdout.write(`wrote ${opts.out}/graph-loop.{mp4,webm} and poster\n`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
