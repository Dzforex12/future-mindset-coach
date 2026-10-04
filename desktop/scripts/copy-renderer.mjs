import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.join(scriptDirectory, "..", "src", "renderer");
const outputDirectory = path.join(scriptDirectory, "..", ".build", "renderer");

fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of ["index.html", "styles.css"]) {
    fs.copyFileSync(path.join(sourceDirectory, file), path.join(outputDirectory, file));
}
