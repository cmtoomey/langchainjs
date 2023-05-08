import type { RedisClientType } from "redis";
import { BaseChatMemoryInput } from "../../memory/chat_memory.js";
import {
  BaseChatMessage,
  BaseListChatMessageHistory,
} from "../../schema/index.js";
import { StoredMessage, mapStoredMessagesToChatMessages } from "./utils.js";

export interface RedisMemoryMessage {
  role: string;
  content: string;
}

export type RedisMemoryInput = BaseChatMemoryInput & {
  sessionId: string;
  memoryTTL?: number;
};

export class RedisMemory extends BaseListChatMessageHistory {
  client: RedisClientType;

  sessionId: string;

  memoryTTL = 300;

  constructor(client: RedisClientType, fields: RedisMemoryInput) {
    const { sessionId, memoryTTL } = fields;
    super();
    this.client = client;
    this.sessionId = sessionId;
    this.memoryTTL = memoryTTL ?? this.memoryTTL;
    this.client.connect().catch((err) => {
      console.log(err);
    });
  }

  async getMessages(): Promise<BaseChatMessage[]> {
    const initMessages = await this.client.lRange(this.sessionId, 0, -1);
    const orderedMessages = initMessages
      .reverse()
      .map((message) => JSON.parse(message));
    const previousMessages = orderedMessages
      .map((item) => ({
        type: item.type,
        role: item.role,
        text: item.text,
      }))
      .filter(
        (x): x is StoredMessage => x.type !== undefined && x.text !== undefined
      );
    return mapStoredMessagesToChatMessages(previousMessages);
  }

  async addMessage(message: BaseChatMessage): Promise<void> {
    console.log(message);
    // const messagesToAdd = [
    //   JSON.stringify({ role: "Human", content: `me` }),
    //   JSON.stringify({ role: "AI", content: `${outputValues.response}` }),
    // ];
    // await this.client.lPush(this.sessionId, messagesToAdd).catch((err) => {
    //   console.log(err);
    // });
    await this.client.expire(this.sessionId, this.memoryTTL);
  }

  async clear(): Promise<void> {
    await this.client.del(this.sessionId);
  }
}
