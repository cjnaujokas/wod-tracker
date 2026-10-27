export const TEST_DATABASE_URL =
  "postgresql://wod_test:wod_test@localhost:5432/wod_test";
//   Test case for stopping external db for vitest
//   "postgresql://wod_test:wod_test@example.com:5432/wod_test";

export function assertLocalDatabase(url: string | undefined) {
  const problem = !url
    ? "DATABASE_URL is not set for tests"
    : !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
      ? `Refusing to run tests against "${new URL(url).hostname}": tests only run against a local database`
      : null;
  if (problem) {
    console.error(`\n✖ ${problem}\n`);
    throw new Error(problem);
  }
}
