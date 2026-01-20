import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const attendo = pgTable(
  "attendo",
  {
    row_id: text("row_id").primaryKey(),
    id_value: text("id_value").notNull(),
    person_name: text("person_name"),
    rssi: text("rssi"),
    device_time: text("device_time"),
    received_at: timestamp("received_at").defaultNow(),
  },
  (table) => [index("attendo_idValue_idx").on(table.id_value)],
);
