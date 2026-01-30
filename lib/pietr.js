"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_script_utils_1 = require("cli-script-utils");
const toRequire = (0, cli_script_utils_1.getValueOption)('--require');
const pattern = (0, cli_script_utils_1.getValueOption)('--pattern') || (0, cli_script_utils_1.die)(syntax());
async function main() {
    if (toRequire) {
        await import(toRequire);
    }
    const path = await import('path');
    const importPath = path.resolve('.');
    const files = (0, cli_script_utils_1.glob)('.', pattern);
    for (const f of files) {
        await import(importPath + '/' + f);
    }
}
main().catch(e => setTimeout(() => { throw e; }, 0));
function syntax() {
    return 'Syntax: simple-runner [--require=<path>] --pattern=<test-files-glob>';
}
