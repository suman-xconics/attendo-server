import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";
import { loggerPrint } from "@/utils/logger-print";

export const migrateDB = async () => {
  loggerPrint("Migrating database...");
  await migrate(db, { migrationsFolder: "drizzle" });
  loggerPrint("Database migrated",);
};

migrateDB();
