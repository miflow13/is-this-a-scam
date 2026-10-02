import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { validateImage } from "../src/lib/upload.ts";
const image = (format: "png" | "jpeg" | "webp") =>
  sharp({ create: { width: 32, height: 32, channels: 3, background: "#fff" } })
    [format]()
    .toBuffer();
test("accepts decoded PNG, JPEG and WebP", async () => {
  for (const format of ["png", "jpeg", "webp"] as const)
    await validateImage(await image(format), `image/${format}`);
});
test("rejects empty, oversized, unsupported, mismatched and corrupt images", async () => {
  for (const [bytes, type] of [
    [Buffer.alloc(0), "image/png"],
    [Buffer.alloc(8 * 1024 * 1024 + 1), "image/png"],
    [await image("png"), "image/jpeg"],
    [await image("png"), "image/gif"],
    [Buffer.from("not an image"), "image/png"],
    [(await image("png")).subarray(0, 30), "image/png"],
  ] as const)
    await assert.rejects(validateImage(bytes, type));
});
test("rejects images over 20 megapixels before decoding pixels", async () => {
  const bytes = await sharp({
    create: { width: 5000, height: 5000, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  await assert.rejects(validateImage(bytes, "image/png"), /too large/i);
});
