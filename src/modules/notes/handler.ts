import { Keyboard } from "grammy";
import { MyContext, MyConversation } from "../../core/types.js";
import { addDiscipline, getDisciplines, deleteDiscipline } from "./database.js";

// --- CONVERSATIONS ---

export async function addDisciplineConv(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("📚 Please type the name of the new discipline:");
  
  const { message } = await conversation.waitFor("message:text");
  const name = message.text.trim();

  // Enforce 50-byte length limit for callback data safety
  if (Buffer.byteLength(name, 'utf8') > 50) {
    await ctx.reply("❌ This name is too long for Telegram buttons. Please use a shorter name or an abbreviation.");
    return;
  }

  const success = await addDiscipline(ctx.from!.id, name);
  
  if (success) {
    await ctx.reply(`✅ Added "${name}" to your disciplines.`);
  } else {
    await ctx.reply(`⚠️ The discipline "${name}" already exists!`);
  }
}

export async function deleteDisciplineConv(conversation: MyConversation, ctx: MyContext) {
  const disciplines = await getDisciplines(ctx.from!.id);
  
  if (disciplines.length === 0) {
    await ctx.reply("❌ You don't have any disciplines saved yet.");
    return;
  }

  const keyboard = new Keyboard();
  disciplines.forEach(d => keyboard.text(d).row());

  await ctx.reply("🗑️ Which discipline do you want to delete?\n*(Warning: This deletes all notes inside it too!)*", {
    reply_markup: {
      ...keyboard,
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });

  const { message } = await conversation.waitFor("message:text");
  const selected = message.text.trim();

  if (!disciplines.includes(selected)) {
    await ctx.reply("❌ Invalid discipline selected. Deletion cancelled.", { 
      reply_markup: { remove_keyboard: true } 
    });
    return;
  }

  await deleteDiscipline(ctx.from!.id, selected);
  await ctx.reply(`🗑️ Discipline "${selected}" and all its notes have been wiped.`, { 
    reply_markup: { remove_keyboard: true } 
  });
}

// --- COMMAND HANDLERS ---

export function setupNotesModule(bot: any) {
  bot.command("disciplines", async (ctx: MyContext) => {
    const disciplines = await getDisciplines(ctx.from!.id);
    if (disciplines.length === 0) {
      return ctx.reply("📚 Your discipline list is empty. Use /addalias to add one.");
    }
    const list = disciplines.map((d, i) => `${i + 1}. ${d}`).join("\n");
    await ctx.reply(`📚 *Your Disciplines:*\n\n${list}`, { parse_mode: "Markdown" });
  });

  bot.command("addalias", async (ctx: MyContext) => {
    await ctx.conversation.enter("addDisciplineConv");
  });

  bot.command("deletealias", async (ctx: MyContext) => {
    await ctx.conversation.enter("deleteDisciplineConv");
  });
}