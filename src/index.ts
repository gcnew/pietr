
import { fail, exit } from 'cli-script-utils'

export {
    TestFn, test
}

/* TS Declarations */

type TimeoutToken = { __timeout_token: 'token' }

declare function setTimeout(f: () => void, time: number): TimeoutToken;

declare const console: {
    log(message: string): void;
    log(message: string, object: any): void;
};

declare const process: {
    stdout: {
        write(s: string): void;
    }
}


/* Types */

type TestFn = () => any;


/* Globals */

const queue: [string, TestFn][] = [];
const failed: [string, any][] = [];

let queueIndex: number = 0;
let timeoutToken: TimeoutToken | undefined = undefined;


/* API */

function test(f: TestFn): void;
function test(title: string, f: TestFn): void;

function test(arg1: string | TestFn, arg2?: TestFn) {
    const testFn = typeof arg1 === 'function' ? arg1 : arg2!;
    const title =  typeof arg1 === 'string'   ? arg1 : testFn.name;

    title || fail('Neither test title, nor function name provided', test);

    queue.push([ title, testFn ]);
    dispatch();
}


/* Private implementation */

function dispatch() {
    if (!timeoutToken) {
        timeoutToken = setTimeout(tick, 0);
    }
}

function tick() {
    if (queue.length === queueIndex) {
        reportAndExit();
    } else {
        worker();
        queueIndex++;
    }

    timeoutToken = undefined;
    dispatch();
}

function worker() {
    const [ title, testFn ] = queue[queueIndex];

    try {
        testFn();
        process.stdout.write('.');
    } catch (e) {
        failed.push([title, e]);
        process.stdout.write('!');
    }
}

function reportAndExit() {
    console.log(`\nTests passed: ${ queue.length - failed.length }/${ queue.length }`);

    if (failed.length) {
        for (const [ title, err ] of failed) {
            console.log(`\n ===== ${ title } =====`);

            if (showDiff(err)) {
                err.message && console.log(err.message);
                console.log('  expected:', err.expected);
                console.log('  actual:', err.actual);
            } else {
                console.log(err)
            }
        }
    }

    exit(failed.length && 1);
}

function showDiff(err: any) {
     return err
        && (
            (!('showDiff' in err) || err.showDiff !== false)
            && (('actual' in err) && ('expected' in err))
        );
}
