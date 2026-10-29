import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = createClient(env.supabse_url,env.supabse_service_key);
