export { TestFn, test };
type TestFn = () => any;
declare function test(f: TestFn): void;
declare function test(title: string, f: TestFn): void;
