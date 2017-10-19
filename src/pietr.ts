
import { glob, getValueOption, die } from 'cli-script-utils'

declare const setTimeout: any;

const toRequire = getValueOption('--require');
const pattern = getValueOption('--pattern') || die(syntax());

async function main() {
    if (toRequire) {
        await import(toRequire);
    }

    const path = await import('path' as string);
    const importPath = path.resolve('.');

    const files = glob('.', pattern);
    for (const f of files) {
        await import(importPath + '/' + f);
    }
}

main().catch(
    e => setTimeout(() => { throw e }, 0)
);

function syntax() {
    return 'Syntax: simple-runner [--require=<path>] --pattern=<test-files-glob>';
}
