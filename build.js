/* oxlint-disable no-console */
/* oxlint-disable @typescript-oxlint/no-var-requires */
/* oxlint-disable no-undef */
const { exec } = require("child_process");
const {
  readdirSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
} = require("fs");
const path = require("path");

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execAsync(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout ? stdout : stderr);
      }
    });
  });
}

/**
 * Recursively removes a directory (cross-platform).
 * @param {string} dir
 */
function rmrf(dir) {
  const fs = require("fs");
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Copies a file, creating the destination directory if needed (cross-platform).
 * @param {string} src
 * @param {string} dest
 */
function cpFile(src, dest) {
  if (!existsSync(src)) {
    return;
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

/**
 * Recursively replaces backslashes inside require() calls with forward slashes
 * in all .js files under the given directory.
 * @param {string} dir
 */
function fixRequirePaths(dir) {
  if (!existsSync(dir)) {
    return;
  }
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixRequirePaths(full);
    } else if (entry.name.endsWith(".js")) {
      let content = readFileSync(full, "utf8");
      // Match require("...") calls that contain backslashes
      const fixed = content.replace(
        /require\("([^"]*\\[^"]*)"\)/g,
        (_match, p) =>
          `require("${p.replace(/\\/g, "/").replace(/\/+/g, "/")}")`
      );
      if (fixed !== content) {
        writeFileSync(full, fixed, "utf8");
      }
    }
  }
}

async function build() {
  // Clean previous build
  console.log("Clean previous build…");

  rmrf("./build/server");
  rmrf("./build/plugins");

  const d = getDirectories("./plugins");

  // Compile server and shared
  console.log("Compiling…");
  await Promise.all([
    execAsync(
      "yarn babel --extensions .ts,.tsx --quiet -d ./build/server ./server"
    ),
    execAsync(
      "yarn babel --extensions .ts,.tsx --quiet -d ./build/shared ./shared"
    ),
  ]);

  for (const plugin of d) {
    const hasServer = existsSync(`./plugins/${plugin}/server`);

    if (hasServer) {
      await execAsync(
        `yarn babel --extensions .ts,.tsx --quiet -d "./build/plugins/${plugin}/server" "./plugins/${plugin}/server"`
      );
    }

    const hasShared = existsSync(`./plugins/${plugin}/shared`);

    if (hasShared) {
      await execAsync(
        `yarn babel --extensions .ts,.tsx --quiet -d "./build/plugins/${plugin}/shared" "./plugins/${plugin}/shared"`
      );
    }
  }

  // Fix Windows backslashes in require() paths (tsconfig-paths-module-resolver
  // emits OS-native separators which break on Windows).
  console.log("Fixing require paths…");
  fixRequirePaths("./build/server");
  fixRequirePaths("./build/plugins");

  // Copy static files
  console.log("Copying static files…");
  cpFile(
    "./server/collaboration/Procfile",
    "./build/server/collaboration/Procfile"
  );
  cpFile("./server/static/error.dev.html", "./build/server/error.dev.html");
  cpFile("./server/static/error.prod.html", "./build/server/error.prod.html");
  cpFile("./package.json", "./build/package.json");

  for (const plugin of d) {
    const src = `./plugins/${plugin}/plugin.json`;
    if (existsSync(src)) {
      cpFile(src, `./build/plugins/${plugin}/plugin.json`);
    }
  }

  console.log("Done!");
}

void build();
