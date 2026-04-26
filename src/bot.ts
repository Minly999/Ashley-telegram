// src/bot.ts
import { Bot, session } from "grammy";
import { RedisAdapter } from "@grammyjs/storage-redis";
import { conversations, createConversation } from "@grammyjs/conversations";

// Core
import redisInstance from "./core/redis.js";
import { config } from "./core/config.js";
import { MyContext } from "./core/types.js"; 

// Modules: Schedule
import { addScheduleConversation, getDayConversation, setupScheduleModule } from "./modules/schedule/handler.js";

// Modules: Notes
import { addDisciplineConv, deleteDisciplineConv, setupNotesModule } from "./modules/notes/handler.js"; // Note: you spelled it handler.js in your imports, adjust if it's handlers.js
import { setupNotesViewer } from "./modules/notes/viewer.js";
import { setupNoteReceiver } from "./modules/notes/receiver.js";

const bot = new Bot<MyContext>(config.BOT_TOKEN);

// --- 1. MIDDLEWARE ---
bot.use(
  session({
    initial: () => ({}),
    storage: new RedisAdapter({ instance: redisInstance }),
  })
);
bot.use(conversations());

// --- 2. CONVERSATIONS ---
// Schedule
bot.use(createConversation(addScheduleConversation));
bot.use(createConversation(getDayConversation));
// Notes
bot.use(createConversation(addDisciplineConv));
bot.use(createConversation(deleteDisciplineConv));

// --- 3. COMMANDS & UI ---
setupScheduleModule(bot);
setupNotesModule(bot);
setupNotesViewer(bot);

// --- 4. THE INTERCEPTOR (MUST BE LAST) ---
setupNoteReceiver(bot);

// --- 5. ERROR HANDLING ---
bot.catch((err) => {
  console.error(`Update ${err.ctx.update.update_id} error:`, err.error);
});

export default bot;