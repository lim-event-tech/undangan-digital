import type { PgDatabase } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

export type AppDb = PgDatabase<any, typeof schema>;
