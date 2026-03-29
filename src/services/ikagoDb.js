export const DB_NAME = "nexus-chat-db";
export const DB_VERSION = 1;

export const DB_SCHEMA = {
  contacts: {
    keyPath: "id",
    autoIncrement: true,
    fields: {
      userId:    {},
      email:     { unique: true },
      name:      {},
      profilePic:{},
      unread:    {},
      isRequest: {}
    }
  },
  messages: {
    keyPath: "id",
    autoIncrement: true,
    fields: {
      conversationId: {},
      fromUserId:     {},
      toUserId:       {},
      text:           {},
      type:           {},
      timestamp:      {},
      isMe:           {}
    }
  }
};

/** Returns a stable conversation ID for any two user IDs */
export const getConversationId = (uid1, uid2) => [uid1, uid2].sort().join("_");
