import { execSync } from "node:child_process";
import { TEST_DATABASE_URL, assertLocalDatabase } from "./test-db";

export default function setup() {
  assertLocalDatabase(TEST_DATABASE_URL);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      DATABASE_URL_UNPOOLED: TEST_DATABASE_URL,
    },
  });
}
