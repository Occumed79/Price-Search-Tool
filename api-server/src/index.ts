import app from "./app";
import { logger } from "./lib/logger";
import { readConfig } from "./routes/settings";

// Load API keys saved via settings UI into process.env
const savedConfig = readConfig();
for (const [key, value] of Object.entries(savedConfig)) {
  if (!process.env[key] && value) {
    process.env[key] = String(value);
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
