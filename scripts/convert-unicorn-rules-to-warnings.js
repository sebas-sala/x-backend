import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const eslintConfigPath = path.join(__dirname, '..', '.eslintrc.cjs');

const eslintConfigModule = await import(`file://${eslintConfigPath}`);
const eslintConfig = eslintConfigModule.default;

let unicornRules = Object.keys(eslintPluginUnicorn.rules);
const mappedRules = {};

for (const rule of unicornRules) {
  const ruleValue = `unicorn/${rule}`;
  mappedRules[ruleValue] = 'warn';
}

eslintConfig.rules = {
  ...eslintConfig.rules,
  ...mappedRules,
};

fs.writeFileSync(
  eslintConfigPath,
  `module.exports = ${JSON.stringify(eslintConfig, undefined, 2)};`,
);

console.log('Converted all Unicorn rules to warnings.');
