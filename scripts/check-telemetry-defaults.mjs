import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const source = path.resolve(process.argv[2]);
const ts = createRequire(path.join(source, 'package.json'))('typescript');
const checks = [
  ['src/vs/platform/telemetry/common/telemetryService.ts', '[TELEMETRY_SETTING_ID]', 'TelemetryConfiguration.OFF'],
  ['src/vs/platform/telemetry/common/telemetryService.ts', '[TELEMETRY_OLD_SETTING_ID]', 'false'],
  ['src/vs/workbench/electron-browser/desktop.contribution.ts', "'telemetry.enableCrashReporter'", 'false'],
  ['src/vs/workbench/contrib/editTelemetry/browser/editTelemetry.contribution.ts', '[EDIT_TELEMETRY_SETTING_ID]', 'false'],
  ['src/vs/workbench/services/assignment/common/assignmentService.ts', "'workbench.enableExperiments'", 'false']
];
for (const [file, key, expected] of checks) {
  const ast = ts.createSourceFile(file, fs.readFileSync(path.join(source, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const defaults = [];
  const visit = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === key && ts.isObjectLiteralExpression(node.initializer)) {
      for (const field of node.initializer.properties) {
        if (ts.isPropertyAssignment(field) && field.name.getText(ast).replace(/^['"]|['"]$/g, '') === 'default') {
          defaults.push(field.initializer.getText(ast));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.deepEqual(defaults, [expected], `${file}: ${key} default must remain ${expected}`);
  console.log(`PASS ${key}: ${expected}`);
}
