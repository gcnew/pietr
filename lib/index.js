"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_script_utils_1 = require("cli-script-utils");
const queue = [];
const failed = [];
let queueIndex = 0;
let timeoutToken = undefined;
function test(arg1, arg2) {
    const testFn = typeof arg1 === 'function' ? arg1 : arg2;
    const title = typeof arg1 === 'string' ? arg1 : testFn.name;
    title || cli_script_utils_1.fail('Neither test title, nor function name provided', test);
    queue.push([title, testFn]);
    dispatch();
}
exports.test = test;
function dispatch() {
    if (!timeoutToken) {
        timeoutToken = setTimeout(tick, 0);
    }
}
function tick() {
    if (queue.length === queueIndex) {
        reportAndExit();
    }
    else {
        worker();
        queueIndex++;
    }
    timeoutToken = undefined;
    dispatch();
}
function worker() {
    const [title, testFn] = queue[queueIndex];
    try {
        testFn();
        process.stdout.write('.');
    }
    catch (e) {
        failed.push([title, e]);
        process.stdout.write('!');
    }
}
function reportAndExit() {
    console.log(`\nTests passed: ${queue.length - failed.length}/${queue.length}`);
    if (failed.length) {
        for (const [title, err] of failed) {
            console.log(`\n ===== ${title} =====`);
            if (showDiff(err)) {
                err.message && console.log(err.message);
                console.log('  expected:', err.expected);
                console.log('  actual:', err.actual);
            }
            else {
                console.log(err);
            }
        }
    }
    cli_script_utils_1.exit(failed.length && 1);
}
function showDiff(err) {
    return err
        && ((('showDiff' in err) && err.showDiff !== false)
            || (('actual' in err) && ('expected' in err)));
}
