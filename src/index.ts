
import { fail, exit, trai } from 'cli-script-utils'

export {
    TestFn, test, xtest, onlyTest, group, xgroup, onlyGroup
}


/* Types */

type TestFn = () => unknown;

type Progress = Promise<unknown> & { progress?: () => void }

type Group = {
    title: string,
    tests: {
        title: string,
        fn: TestFn,
        mode: 'skip' | 'only' | undefined,

        promise: Promise<unknown> | undefined,
        result: { kind: 'success', value: unknown }
              | { kind: 'fail',    value: unknown }
              | undefined
    }[],
    mode: 'skip' | 'only' | undefined
}

type Suite = {
    parallel: 'all' | 'none',
    groups: Group[],
    defaultGroup: Group,
    currentGroup: Group,
    trigger: Promise<unknown>,
    running: boolean,
    hasOnly: boolean | undefined
}


/* Globals */

const suite = ((): Suite => {
    const defaultGroup: Group = {
        title: 'Tests',
        tests: [],
        mode: undefined
    };

    return {
        parallel: 'none',
        groups: [ defaultGroup ],
        defaultGroup,
        currentGroup: defaultGroup,
        trigger: Promise.resolve(undefined),
        running: false,
        hasOnly: undefined
    };
})();


/* API */

function test(title: string, fn: TestFn, mode?: Group['tests'][0]['mode']) {
    if (suite.running) {
        fail(`${ title } :: Cannot add tests while already running`);
    }

    const test = {
        title,
        fn,
        mode,
        promise: undefined,
        result: undefined
    };
    suite.currentGroup.tests.push(test);
}

function xtest(title: string, fn: TestFn) {
    test(title, fn, 'skip');
}

function onlyTest(title: string, fn: TestFn) {
    test(title, fn, 'only');
}

function group(title: string, fn: TestFn, mode: Group['mode']) {
    if (suite.currentGroup !== suite.defaultGroup) {
        fail(`${title} :: Groups cannot nest!`);
    }

    suite.currentGroup = {
        title,
        tests: [],
        mode
    };

    const result = fn();
    if (result && (<any> result).then) {
        fail(`${title} :: Groups cannot be async!`);
    }

    suite.currentGroup = suite.defaultGroup;
}

function xgroup(title: string, fn: TestFn) {
    group(title, fn, 'skip');
}

function onlyGroup(title: string, fn: TestFn) {
    group(title, fn, 'only');
}

function parallel(): Suite['parallel'];
function parallel(paralell: Suite['parallel']): void;

function parallel(paralell?: Suite['parallel']) {
    if (!paralell) {
        return suite.parallel;
    }

    if (suite.running) {
        fail('Suite already running!');
    }

    suite.parallel = paralell;
    return;
}

function trigger(): Promise<unknown>;
function trigger(p: Promise<unknown>): void;

function trigger(trigger?: Promise<unknown>) {
    if (!trigger) {
        return suite.trigger;
    }

    if (suite.running) {
        fail('Suite already running!');
    }

    suite.trigger = trigger;
    suite.trigger.then(
        () => (suite.trigger === trigger) ? runSuite() : console.debug('Trigger skiped...'),
        e => fail(`Suite trigger must not throw :: ${e}`)
    );

    return;
}


/* Private implementation */

function runSuite(): Progress {
    if (suite.running) {
        fail('Suite already running!')
    }

    suite.running = true;
    switch (suite.parallel) {
        case 'all':  return runParrallel();
        case 'none': return runSync();
    }
}

function runTest(test: Group['tests'][0], progress: () => void) {
    const promise = (test.mode === 'skip')
        ? Promise.resolve(undefined)
        : trai(() => Promise.resolve(test.fn()), Promise.reject());

    promise.then(
        value => { test.result = { kind: 'success', value }; progress(); },
        value => { test.result = { kind: 'fail',    value }; progress(); }
    );

    test.promise = promise;
    return promise;
}

function runParrallel(): Progress {
    const runGroup = (group: Group): Progress => {
        const tests = group.tests.map(t => runTest(t, progress));
        const result = Promise.allSettled(tests) as Progress;
        const progress = () => result.progress && result.progress();

        return result;
    }

    const groups = suite.groups.map(runGroup);
    const result = Promise.allSettled(groups) as Progress;

    const progress = () => result.progress && result.progress();
    for (const g of groups) {
        g.progress = progress
    }

    return result;
}

function runSync(): Progress {
    const group = selectNext();

    if (!group) {
        reportAndExit();
    } else {
        worker(group);
        ++group.idx;
    }

    timeoutToken = undefined;
    dispatch();

}

function selectNext() {
    for (const g of queue) {
        if (globalMode === 'only' && g.mode !== 'only' && g !== defaultGroup) {
            continue;
        }

        if (g.idx < g.tests.length) {
            return g;
        }
    }

    return undefined;
}

function worker(g: Group) {
    const { title: groupTitle, failed, tests, idx, mode: groupMode } = g;

    if (idx === 0 && g !== defaultGroup) {
        console.log('\n\n');
        console.log(groupTitle + ':');
    }

    const { title: testTitle, fn: testFn, mode: testMode } = tests[idx];
    if (groupMode === 'has-only' && testMode !== 'only') {
        return;
    }
    if (groupMode === 'skip' || testMode === 'skip') {
        process.stdout.write('-');
        return;
    }

    try {
        testFn();
        process.stdout.write('.');
    } catch (e) {
        failed.push([testTitle, e]);
        process.stdout.write('!');
    }
}

function reportAndExit() {
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

    if (queue.length) {
        console.log(`\nTests passed: ${ queue.length - failed.length }/${ queue.length }`);
    } else {
        console.log('No tests found!');
    }

    exit((!queue.length || failed.length) && 1);
}

function showDiff(err: any) {
     return err
        && (
            (!('showDiff' in err) || err.showDiff !== false)
            && (('actual' in err) && ('expected' in err))
        );
}
