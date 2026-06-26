export const normalizeMessageId = (id) => {
  if (id == null) return "";
  if (typeof id === "object") {
    if (id._id != null) return String(id._id);
    if (typeof id.toString === "function") return id.toString();
  }
  return String(id);
};

export const dedupeMessages = (messages = []) => {
  const seen = new Set();

  return messages.filter((msg) => {
    const id = normalizeMessageId(msg?._id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};
