import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT,
  jwt_secrete: process.env.JWTSECRETE!,
  bot_token: process.env.BOT_TOKEN!,
  supabse_url: process.env.SUPABASE_URL as string,
  supabse_service_key: process.env.SUPABASE_SERVICE_KEY as string,
};
