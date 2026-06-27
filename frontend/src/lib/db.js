import Dexie from "dexie";

// Per-user database cache to prevent cross-account data leakage
// when multiple users log in on the same browser.
const userDbCache = {};

export function getUserDb(userId) {
  if (!userId) {
    // Fallback to the shared database if no userId is available yet
    return db;
  }

  const key = String(userId);
  if (!userDbCache[key]) {
    const userDb = new Dexie(`ChatDB_${key}`);
    userDb.version(1).stores({
      messages: "_id, chatId, senderId, createdAt",
      chats: "_id, updatedAt",
    });
    userDbCache[key] = userDb;
  }
  return userDbCache[key];
}

// Legacy shared database — kept for migration cleanup only
export const db = new Dexie("ChatDatabaseV2");

db.version(1).stores({
  messages: "_id, chatId, senderId, createdAt",
  chats: "_id, updatedAt",
});

// Best-effort cleanup of legacy databases
if (typeof indexedDB !== "undefined") {
  Dexie.delete("ChatDatabase").catch(() => {});
}

