const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
function findTests(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? findTests(filename) : /\.test\.(ts|tsx|cjs)$/.test(entry.name) ? [filename] : [];
  });
}

const files = [...findTests(path.join(root, "src")), ...findTests(__dirname)].sort();
if (files.length === 0) throw new Error("No regression tests found.");
const args = ["--require", path.join(__dirname, "register.cjs"), "--test"];
// Recent Node versions also have native type stripping; let our compiler
// handle imports and aliases consistently on both Node 20 and newer releases.
if (process.allowedNodeEnvironmentFlags.has("--no-experimental-strip-types")) {
  args.push("--no-experimental-strip-types");
}
const result = spawnSync(process.execPath, [...args, ...files], { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
