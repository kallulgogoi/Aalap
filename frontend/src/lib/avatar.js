const AVATAR_COLORS = [
  "6366f1",
  "ec4899",
  "f59e0b",
  "10b981",
  "3b82f6",
  "8b5cf6",
  "ef4444",
  "14b8a6",
  "f97316",
  "06b6d4",
];

const hashString = (value = "") => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const generateDefaultAvatar = (name = "User", seed = name) => {
  const displayName = (name || "User").trim() || "User";
  const color =
    AVATAR_COLORS[hashString(seed || displayName) % AVATAR_COLORS.length];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${color}&color=ffffff&bold=true&size=256`;
};

export const getAvatarUrl = (userOrName, fallbackSeed) => {
  if (userOrName && typeof userOrName === "object") {
    if (userOrName.profilePic?.url) return userOrName.profilePic.url;

    const name =
      userOrName.username ||
      userOrName.chatName ||
      userOrName.email?.split("@")[0] ||
      "User";
    const seed = userOrName.email || userOrName._id || fallbackSeed || name;
    return generateDefaultAvatar(name, seed);
  }

  const name =
    typeof userOrName === "string" && userOrName.trim()
      ? userOrName.trim()
      : "User";
  return generateDefaultAvatar(name, fallbackSeed || name);
};
