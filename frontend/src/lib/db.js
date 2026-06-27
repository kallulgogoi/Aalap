import Dexie from "dexie";

const userDbCache = {};

export function getUserDb(userId) {
  if (!userId) {
    // shared database if no userId is available yet
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

// shared database for migration cleanup only
export const db = new Dexie("ChatDatabaseV2");

db.version(1).stores({
  messages: "_id, chatId, senderId, createdAt",
  chats: "_id, updatedAt",
});

// cleanup of legacy databases
if (typeof indexedDB !== "undefined") {
  Dexie.delete("ChatDatabase").catch(() => {});
}
