const fs = require("node:fs");
const path = require("node:path");

const backendEnvPath = path.resolve(__dirname, "../../backend/.env");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function getLocalEnv(key) {
  if (process.env[key]) {
    return process.env[key];
  }

  const fileEnv = parseEnvFile(backendEnvPath);
  return fileEnv[key];
}

function requireLocalEnv(key) {
  const value = getLocalEnv(key);
  if (!value) {
    throw new Error(
      `Missing ${key}. Add it to backend/.env or export it in the shell before running the script.`
    );
  }

  return value;
}

module.exports = {
  getLocalEnv,
  requireLocalEnv,
};
