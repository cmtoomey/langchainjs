import { test, expect } from "@jest/globals";
import { RedisMemory } from "../redis_memory.js";
import { HumanChatMessage, AIChatMessage } from "../../schema/index.js";
import { createClient } from "redis";

// TODO Update docs
test("Test Redis memory without messages", async () => {
  const client = createClient();
  //@ts-ignore foo
  const memory = new RedisMemory(client, {
    sessionId: "one",
  });
  await memory.init();
  const result1 = await memory.loadMemoryVariables({});
  expect(result1).toStrictEqual({ history: "" });

  await memory.saveContext(
    { input: "Who is the best vocalist?" },
    { response: "Ozzy Osbourne" }
  );
  const expectedString = "Human: Who is the best vocalist?\nAI: Ozzy Osbourne";
  const result2 = await memory.loadMemoryVariables({});
  expect(result2).toStrictEqual({ history: expectedString });
  await client.flushDb();
});

test("Test Redis memory with messages", async () => {
  const client = createClient();
  //@ts-ignore foo
  const memory = new RedisMemory(client, {
    returnMessages: true,
    sessionId: "two",
  });
  await memory.init();
  const result1 = await memory.loadMemoryVariables({});
  expect(result1).toStrictEqual({ history: [] });

  await memory.saveContext(
    { input: "Who is the best vocalist?" },
    { response: "Ozzy Osbourne" }
  );
  const expectedHuman = new HumanChatMessage("Who is the best vocalist?");
  const expectedAI = new AIChatMessage("Ozzy Osbourne");
  const result2 = await memory.loadMemoryVariables({});
  expect(result2).toStrictEqual({ history: [expectedHuman, expectedAI] });
  await client.flushDb();
});

// TODO Add preloading function
// test("Test Redis memory with pre-loaded history", async () => {
//   const pastMessages = [
//     new AIChatMessage("Nice to meet you, Ozzy!"),
//     new HumanChatMessage("My name is Ozzy"),
//   ];
//   const client = createClient();
//   //@ts-ignore foo
//   const memory = new RedisMemory(client, {
//     returnMessages: true,
//     sessionId: "three",
//   });
//   await memory.init();
//   const result = await memory.loadMemoryVariables({});
//   expect(result).toStrictEqual({ history: pastMessages });
//   await client.flushDb();
// });
