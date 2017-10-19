"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_script_utils_1 = require("cli-script-utils");
const toRequire = cli_script_utils_1.getValueOption('--require');
const pattern = cli_script_utils_1.getValueOption('--pattern') || cli_script_utils_1.die(syntax());
async function main() {
    if (toRequire) {
        await Promise.resolve().then(() => require(toRequire));
    }
    const path = await Promise.resolve().then(() => require('path'));
    const importPath = path.resolve('.');
    const files = cli_script_utils_1.glob('.', pattern);
    for (const f of files) {
        await Promise.resolve().then(() => require(importPath + '/' + f));
    }
}
main().catch(e => setTimeout(() => { throw e; }, 0));
function syntax() {
    return 'Syntax: simple-runner [--require=<path>] --pattern=<test-files-glob>';
}
