import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { products, validateCatalogue } from "../data.js";

const projectDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputDirectory = resolve(projectDirectory, "dist");
const staticFiles = ["index.html", "app.js", "data.js", "styles.css", "tokens.css"];

validateCatalogue();

for (const product of products) {
  if (typeof product.imageUrl === "string" && product.imageUrl.startsWith("/") && !product.imageUrl.startsWith("/assets/garments/")) {
    throw new Error(`Local product images must live under assets/garments: ${product.imageUrl}`);
  }
}

await mkdir(outputDirectory, { recursive: true });
for (const file of staticFiles) {
  await cp(resolve(projectDirectory, file), resolve(outputDirectory, file));
}

const garmentDirectory = resolve(projectDirectory, "assets/garments");
const referencedLocalImages = [...new Set(products
  .map((product) => product.imageUrl)
  .filter((imageUrl) => typeof imageUrl === "string" && imageUrl.startsWith("/assets/garments/")))];
for (const imageUrl of referencedLocalImages) {
  const source = resolve(garmentDirectory, imageUrl.slice("/assets/garments/".length));
  if (!source.startsWith(garmentDirectory + "/")) throw new Error(`Product image path escapes assets/garments: ${imageUrl}`);
  let imageStats;
  try { imageStats = await stat(source); }
  catch { throw new Error(`Product image does not exist: ${imageUrl}`); }
  if (!imageStats.isFile() || !imageStats.size) throw new Error(`Product image is empty or not a file: ${imageUrl}`);
}

let assetCount = 0;
try {
  const garmentFiles = await readdir(garmentDirectory);
  assetCount = garmentFiles.length;
  await cp(garmentDirectory, resolve(outputDirectory, "assets/garments"), { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  if (referencedLocalImages.length) throw new Error("The catalogue references local garment images, but assets/garments is missing.");
}

process.stdout.write(`Built static site with ${staticFiles.length} app files and ${assetCount} local garment assets in dist/.\n`);
