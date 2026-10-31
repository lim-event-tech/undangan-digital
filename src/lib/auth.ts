import { betterAuth } from "better-auth";
import { db } from "@/db";
import { authOptions } from "@/lib/auth-options";

export const auth = betterAuth(authOptions(db));
