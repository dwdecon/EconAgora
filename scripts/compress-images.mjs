import sharp from "sharp";
import { copyFileSync, unlinkSync } from "fs";

// Compress hero-halo.webp to temp file
await sharp("public/hero-halo.webp")
  .webp({ quality: 78 })
  .toFile("public/hero-halo-tmp.webp");

// Replace original via copy + delete
unlinkSync("public/hero-halo.webp");
copyFileSync("public/hero-halo-tmp.webp", "public/hero-halo.webp");
unlinkSync("public/hero-halo-tmp.webp");

// Convert logo.png to webp
await sharp("public/logo.png")
  .webp({ quality: 85 })
  .toFile("public/logo.webp");

console.log("Done.");
