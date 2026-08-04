import { env } from "../config/env.js";
import { db } from "../database/client.js";
import { app } from "./app.js";

async function bootstrap() {
  await db.query("select 1");
  app.listen(env.PORT, () => {
    console.log(`MiLove backend running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend.", error);
  process.exit(1);
});
