const fs = require("node:fs");
const path = require("node:path");
const { onboardTenant, validateTenantOnboardingInput } = require("../src/modules/tenants/tenant-onboarding.service");
const { logError } = require("../src/observability/logger");

function parseArgs(argv) {
  const args = {
    input: "",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (value === "--input" || value === "-i") {
      args.input = argv[index + 1] || "";
      index += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.input) {
    throw new Error("Debes indicar un archivo JSON con --input <ruta>");
  }

  const absoluteInputPath = path.resolve(process.cwd(), args.input);

  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(`No encontramos el archivo de input: ${absoluteInputPath}`);
  }

  const rawContent = fs.readFileSync(absoluteInputPath, "utf8");
  const input = JSON.parse(rawContent);

  if (args.dryRun) {
    const normalized = await validateTenantOnboardingInput(input, {
      checkUniqueness: false,
    });
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          databaseChecksSkipped: true,
          normalized,
        },
        null,
        2
      )
    );
    return;
  }

  const result = await onboardTenant(input);
  console.log(JSON.stringify({ success: true, result }, null, 2));
}

main().catch((error) => {
  logError("tenant.onboarding.cli.failed", {
    scope: "tenant-onboarding",
    message: error?.message || String(error),
    issues: error?.issues || null,
  });
  console.error("[tenant:onboard] Error");
  console.error(error?.message || error);

  if (error?.issues) {
    console.error(JSON.stringify(error.issues, null, 2));
  }

  process.exit(1);
});
