import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const sourceRoot = "src/plugins";
const outputRoot = "dist/plugins";

function copyManifests(sourceDirectory) {
  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = join(sourceDirectory, entry.name);
    if (entry.isDirectory()) {
      copyManifests(sourcePath);
    } else if (entry.isFile() && entry.name === "package.json") {
      const outputPath = join(outputRoot, relative(sourceRoot, sourcePath));
      mkdirSync(join(outputPath, ".."), { recursive: true });
      copyFileSync(sourcePath, outputPath);
    }
  }
}

copyManifests(sourceRoot);
