const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "src", "tweaksCatalog.ts");
const source = fs.readFileSync(sourcePath, "utf8").replace(/^import type .*?;\s*/m, "");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const sandbox = { exports: {}, require, console };

vm.createContext(sandbox);
vm.runInContext(output, sandbox, { filename: sourcePath });

const tweaks = sandbox.exports.tweaks;
const ids = tweaks.map((tweak) => tweak.id);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const selectable = tweaks.filter((tweak) => !tweak.blocked);
const blocked = tweaks.filter((tweak) => tweak.blocked);
const missingCommands = selectable.filter((tweak) => !tweak.command || !String(tweak.command).trim());
const commandPayload = selectable.map((tweak) => ({
  id: tweak.id,
  name: tweak.name,
  command: tweak.command
}));

let failed = false;

if (duplicateIds.length > 0) {
  failed = true;
  console.error(`Duplicate tweak ids: ${duplicateIds.join(", ")}`);
}

if (missingCommands.length > 0) {
  failed = true;
  console.error(`Selectable tweaks without commands: ${missingCommands.map((tweak) => tweak.id).join(", ")}`);
}

const payloadPath = path.join(os.tmpdir(), `mini-hub-tweak-audit-${Date.now()}.json`);
fs.writeFileSync(payloadPath, JSON.stringify(commandPayload), "utf8");

const ps = spawnSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `
      $commands = Get-Content -Path '${payloadPath.replace(/'/g, "''")}' -Raw | ConvertFrom-Json
      $results = foreach ($item in $commands) {
        $tokens = $null
        $errors = $null
        [System.Management.Automation.Language.Parser]::ParseInput([string]$item.command, [ref]$tokens, [ref]$errors) | Out-Null
        if ($errors.Count -gt 0) {
          [pscustomobject]@{
            id = $item.id
            name = $item.name
            errors = ($errors | ForEach-Object { $_.Message }) -join ' | '
          }
        }
      }
      $results | ConvertTo-Json -Depth 4
    `
  ],
  { encoding: "utf8" }
);

fs.rmSync(payloadPath, { force: true });

if (ps.status !== 0) {
  failed = true;
  console.error(ps.stderr || ps.stdout);
} else if (ps.stdout.trim()) {
  failed = true;
  console.error(`PowerShell syntax errors:\n${ps.stdout}`);
}

console.log(
  JSON.stringify(
    {
      total: tweaks.length,
      selectable: selectable.length,
      blocked: blocked.length,
      duplicateIds: duplicateIds.length,
      missingCommands: missingCommands.length,
      powershellSyntax: ps.stdout.trim() ? "error" : "ok"
    },
    null,
    2
  )
);

if (failed) {
  process.exit(1);
}
