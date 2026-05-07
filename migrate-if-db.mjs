import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

try {
const config = readFileSync("wrangler.jsonc", "utf8");
if (!config.includes('"DB"')) process.exit(0);
} catch {
process.exit(0);
}

execSync("wrangler d1 migrations apply DB --local --config wrangler.jsonc", {
stdio: "inherit",
});
