
pietr
=====

`pietr` is a simple test runner for node.

To use it, just import it like you would any other module and define your tests with the imported `test` function. The resulting file would be a  directly runnable test suite.

## Installation

```bash
npm intsall --save-dev pietr
```

## Why yet another test runner?

I created `pietr` because I wanted a runner that doesn't expose itself through global functions (i.e. no magical `describe` / `it`s). Instead, the user imports `pietr` just like any other module. While there are other test runners that are modules themselves, they tend to bring a lot of dependencies along. That was the second major reason - I wanted a small, lightweight test runner, that does not outweight the code I'm about to test by two magnitudes.

## Usage

 - `test(testFn: Function): void`
 - `test(title: string, testFn: Function): void`

If you don't provide an explicit `title`, or `title` is empty, `pietr` takes the name of `testFn` and uses it as title. It's considered an error, if the so derived title is falsy.


#### example.ts

You can use any assertion library you'd like. Throwing exceptions yourself is fine too.

```ts
import { test } from 'pietr'

// Using arrow functions and explicit `title`
test('Test via arrows', () => {
    assert(1 === 1, 'Math is broken :/');
});

// using function's name as title
test(function shouldBeAlwaysTrue() {
    assert(true, 'Logic is broken too :/');
});

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message);
    }
}
```

To run it: `tsc example.ts && node example.js`

#### example2.js

```js
const assert = require('assert');
const { test } = require('pietr');

test('js example', () => {
    assert.equal(1, 1);
});
```

To run it: `node example2.js`

## Debugging

Debugging is as simple as running the test file under node's built-in debugger. No special incantations required.

```bash
node --inspect-brk <path_to_test.js>
```

## Using the runner

You can bulk-run your tests with the included `pietr` binary. It's usage is

```bash
./node_modules/.bin/pietr --pattern='<glob_to_tests>'
```

Also, as with most other runners, you can pre-include a script:

```bash
./node_modules/.bin/pietr --pattern='<glob_to_tests>' --require=source-map-support/register
```

## Limitations

`pietr` does not support asynchronous functions, yet. I'm planning to add async support via `Promise`s, but don't hold your breath.
