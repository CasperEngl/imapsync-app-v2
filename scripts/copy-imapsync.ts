import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const sourceDir = path.join(__dirname, "..", "electron", "bin");
const destDir = path.join(__dirname, "..", "resources", "bin");

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy the imapsync script
const source = path.join(sourceDir, "imapsync");
const dest = path.join(destDir, "imapsync");

try {
  fs.copyFileSync(source, dest);
  fs.chmodSync(dest, 0o755); // Make it executable
  console.log("Successfully copied imapsync script to resources directory");
} catch (error) {
  console.error("Error copying imapsync script:", error);
  process.exit(1);
}
