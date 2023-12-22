import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as schema from "../../../migrations/schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.log("🛑 Cannot find database url");
}

const client = postgres(process.env.DATABASE_URL as string, {
  max: 1,
  prepare: false,
});
const db = drizzle(client, { schema });
// Everytime the database is updated, this migrateDb would migrate the changes to keep our schema upto date.
const migrateDb = async () => {
  try {
    console.log("🟠 Migrating Client");
    await migrate(db, { migrationsFolder: "migrations" });
    console.log("🟢 Successfully Migrated Client");
  } catch (err) {
    console.log("🛑 Error Mirgrating Client");
  }
};
// migrateDb();
export default db;
