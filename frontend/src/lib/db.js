import Dexie from "dexie";

// Dexie does not support changing a table's primary key on upgrade.
// Use a fresh database name with _id as the key from the start.
export const db = new Dexie("ChatDatabaseV2");

db.version(1).stores({
  messages: "_id, chatId, senderId, createdAt",
  chats: "_id, updatedAt",
});

// Best-effort cleanup of the legacy DB that failed the v1 -> v2 migration.
if (typeof indexedDB !== "undefined") {
  Dexie.delete("ChatDatabase").catch(() => {});
}
