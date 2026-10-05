import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.join(scriptDirectory, "..", "src", "renderer");
const outputDirectory = path.join(scriptDirectory, "..", ".build", "renderer");
const resourcesDirectory = path.join(scriptDirectory, "..", "resources");
const outputResourcesDirectory = path.join(scriptDirectory, "..", ".build", "resources");

fs.mkdirSync(outputDirectory, { recursive: true });
fs.mkdirSync(outputResourcesDirectory, { recursive: true });
fs.copyFileSync(path.join(scriptDirectory, "..", "..", "app", "favicon.ico"),
    path.join(outputResourcesDirectory, "tray.ico"));

for (const file of ["index.html", "styles.css"]) {
    fs.copyFileSync(path.join(sourceDirectory, file), path.join(outputDirectory, file));
}

if (fs.existsSync(resourcesDirectory)) {
    fs.cpSync(resourcesDirectory, outputResourcesDirectory, {
        recursive: true,
        filter: (source) => !source.includes(`${path.sep}.venv${path.sep}`) && !source.endsWith(`${path.sep}.venv`),
    });
}
