# Redis Memory

[Redis](https://redis.io/) is an in-memory database, useful for storing multiple different types of data.

## Setup

See instructions at [Redis](https://redis.io/docs/getting-started/) for running the server locally. There are also multiple providers who will manage Redis as a service.

## Usage

```typescript
import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
import { RedisMemory } from "langchain/memory";

const model = new ChatOpenAI({});
const memory = new RedisMemory({
  sessionId: "user-id",
  redisUrl: "redis://localhost:6379",
});

await memory.init(); // Connects and loads previous state from Redis, based on session-id.

const chatPrompt = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.${context}`
  ),
  new MessagesPlaceholder("history"),
  HumanMessagePromptTemplate.fromTemplate("{input}"),
]);

const chain = new ConversationChain({
  memory,
  prompt: chatPrompt,
  llm: chat,
});

const res1 = await chain.call({ input: "Hi! I'm Jim." });
console.log({ res1 });
```

```shell
{response: " Hi Jim! It's nice to meet you. My name is AI. What would you like to talk about?"}
```

```typescript
const res2 = await chain.call({ input: "What's my name?" });
console.log({ res2 });
```

```shell
{response: ' You said your name is Jim. Is there anything else you would like to talk about?'}
```
