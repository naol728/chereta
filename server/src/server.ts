import app from "./app";
import { env } from "./config/env";
app.listen(env.port, () => {
  console.log(`🍓Server Runnig on ${env.port}🚀`);
});
