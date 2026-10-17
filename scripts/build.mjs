import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputDirectory = resolve(projectDirectory, "dist");
const staticFiles = ["index.html", "app.js", "data.js", "styles.css", "tokens.css"];

await mkdir(outputDirectory, { recursive: true });
for (const file of staticFiles) {
  await cp(resolve(projectDirectory, file), resolve(outputDirectory, file));
}

const garmentDirectory = resolve(projectDirectory, "assets/garments");
const garmentFiles = (await readdir(garmentDirectory)).filter((file) => file.endsWith(".avif"));
if (garmentFiles.length !== 21) {
  throw new Error(`Expected 21 optimized garment images; found ${garmentFiles.length}.`);
}
for (const file of garmentFiles) {
  const source = resolve(garmentDirectory, file);
  if (!(await stat(source)).size) throw new Error(`Garment image is empty: ${file}`);
}
await cp(garmentDirectory, resolve(outputDirectory, "assets/garments"), { recursive: true });

process.stdout.write(`Built static site with ${staticFiles.length} app files and ${garmentFiles.length} AVIF garments in dist/.\n`);
