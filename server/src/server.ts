import app from "./app";
import { env } from "./config/env";

import type { Server } from "node:http";

let server: Server | undefined;
let shuttingDown = false;

const startServer = (): void => {
  server = app.listen(env.port, () => {
    console.log(`🍓 Server running on port ${env.port} 🚀`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    console.error("❌ Server startup/runtime error:", error);
    process.exitCode = 1;
    void shutdown("server error");
  });
};

const shutdown = (reason: string): Promise<void> => {
  if (shuttingDown) return Promise.resolve();

  shuttingDown = true;
  console.log(`🛑 Shutting down: ${reason}`);

  if (!server || !server.listening) {
    process.exit(process.exitCode || 0);
  }

  return new Promise<void>((resolve) => {
    const forceExit = setTimeout(() => {
      console.error("❌ Graceful shutdown timed out.");
      process.exit(1);
    }, 10_000);

    forceExit.unref();

    server!.close((error) => {
      clearTimeout(forceExit);

      if (error) {
        console.error("❌ Error closing server:", error);
        process.exitCode = 1;
      } else {
        console.log("✅ Server closed successfully.");
      }

      resolve();
    });
  });
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM received");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT received");
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exitCode = 1;
  void shutdown("uncaught exception");
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled promise rejection:", reason);
  process.exitCode = 1;
  void shutdown("unhandled rejection");
});

startServer();
