// TODO: import the client instead of instantiating here.
// Let the use decide how they want to do stuff.
// This will / should also help with unit-testing
import { createClient } from "redis";
import type { RedisClientType } from "redis";
import { BaseChatMemory, BaseMemoryInput } from "./chat_memory.js";
import {
  InputValues,
  OutputValues,
  MemoryVariables,
  getBufferString,
} from "./base.js";

export interface RedisMemoryMessage {
  role: string;
  content: string;
}

export type RedisMemoryInput = BaseMemoryInput & {
  sessionId: string;
  redisURL?: string;
  memoryKey?: string;
  memoryTTL?: number;
};

export class RedisMemory extends BaseChatMemory {
  // TODO: Keep
  client: RedisClientType;
  // TODO Remove
  redisURL = "redis://localhost:6379";

  memoryKey = "history";

  sessionId: string;

  memoryTTL: 300;

  constructor(fields: RedisMemoryInput) {
    const {
      sessionId,
      redisURL,
      memoryKey,
      returnMessages,
      inputKey,
      outputKey,
      chatHistory,
    } = fields;
    super({ returnMessages, inputKey, outputKey, chatHistory });
    this.redisURL = redisURL ?? this.redisURL;
    this.memoryKey = memoryKey ?? this.memoryKey;
    this.sessionId = this.memoryKey + sessionId;
    this.memoryTTL = this.memoryTTL ?? this.memoryTTL;
    // TODO Update to client
    this.client = createClient({ url: this.redisURL });
  }

  async init(): Promise<void> {
    await this.client.connect();
    const initMessages = await this.client.lRange(this.sessionId, 0, -1);
    const orderedMessages = initMessages
      .reverse()
      .map((message) => JSON.parse(message));
    orderedMessages.forEach((message: RedisMemoryMessage) => {
      if (message.role === "AI") {
        this.chatHistory.addAIChatMessage(message.content);
      } else {
        this.chatHistory.addUserMessage(message.content);
      }
    });
  }

  async loadMemoryVariables(_values: InputValues): Promise<MemoryVariables> {
    if (this.returnMessages) {
      const result = {
        [this.memoryKey]: this.chatHistory.messages,
      };
      return result;
    }
    const result = {
      [this.memoryKey]: getBufferString(this.chatHistory.messages),
    };
    return result;
  }

  async saveContext(
    inputValues: InputValues,
    outputValues: OutputValues
  ): Promise<void> {
    const messagesToAdd = [
      JSON.stringify({ role: "Human", content: `${inputValues.input}` }),
      JSON.stringify({ role: "AI", content: `${outputValues.response}` }),
    ];
    await Promise.all([
      this.client.lPush(this.sessionId, messagesToAdd),
      this.client.expire(this.sessionId, this.memoryTTL),
      super.saveContext(inputValues, outputValues),
    ]);
  }
}
