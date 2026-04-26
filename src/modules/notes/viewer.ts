import { InlineKeyboard } from "grammy";
import { MyContext } from "../../core/types.js";
import { getDisciplines, getNotes, deleteNote } from "./database.js";

export function setupNotesViewer(bot: any) {
  
  // 1. The Main Command
  bot.command("viewnotes", async (ctx: MyContext) => {
    await showDisciplinesMenu(ctx);
  });

  // 2. Back Button Handler
  bot.callbackQuery("back_to_disciplines", async (ctx: MyContext) => {
    await showDisciplinesMenu(ctx);
    await ctx.answerCallbackQuery();
  });

  // 3. Select a Discipline Handler
  // Uses regex to extract the discipline name from the callback data
  bot.callbackQuery(/^view_disc:(.+)$/, async (ctx: MyContext) => {
    const discipline = ctx.match![1];
    await showNotesForDiscipline(ctx, discipline);
    await ctx.answerCallbackQuery();
  });

  // 4. Click "Completed" Handler
  bot.callbackQuery(/^complete_note:(\d+):(.+)$/, async (ctx: MyContext) => {
    const noteIndex = parseInt(ctx.match![1], 10);
    const discipline = ctx.match![2];

    const keyboard = new InlineKeyboard()
      .text("✅ Yes, complete it", `confirm_complete:${noteIndex}:${discipline}`)
      .text("❌ Cancel", `view_disc:${discipline}`);

    await ctx.editMessageText(`Are you sure you want to complete and delete Note #${noteIndex + 1} for *${discipline}*?`, {
      reply_markup: keyboard,
      parse_mode: "Markdown"
    });
    await ctx.answerCallbackQuery();
  });

  // 5. Confirm Deletion Handler
  bot.callbackQuery(/^confirm_complete:(\d+):(.+)$/, async (ctx: MyContext) => {
    const noteIndex = parseInt(ctx.match![1], 10);
    const discipline = ctx.match![2];

    // Fetch the current stack of notes
    const notes = await getNotes(ctx.from!.id, discipline);
    const noteToDelete = notes[noteIndex];

    if (noteToDelete) {
      // Remove it from the Redis list
      await deleteNote(ctx.from!.id, discipline, noteToDelete);
    }

    // Refresh the view
    await showNotesForDiscipline(ctx, discipline);
    await ctx.answerCallbackQuery({ text: "Note completed! 🎉" });
  });
}

// --- HELPER FUNCTIONS FOR UI ---

async function showDisciplinesMenu(ctx: MyContext) {
  const disciplines = await getDisciplines(ctx.from!.id);

  if (disciplines.length === 0) {
    const text = "📭 You don't have any disciplines yet. Add one with /addalias";
    if (ctx.callbackQuery) {
      return ctx.editMessageText(text);
    }
    return ctx.reply(text);
  }

  const keyboard = new InlineKeyboard();
  // Create a button for each discipline (max 2 per row for neatness)
  disciplines.forEach((d, index) => {
    keyboard.text(d, `view_disc:${d}`);
    if (index % 2 !== 0) keyboard.row();
  });

  const text = "📂 *Select a discipline to view notes:*";
  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: "Markdown" });
  } else {
    await ctx.reply(text, { reply_markup: keyboard, parse_mode: "Markdown" });
  }
}

async function showNotesForDiscipline(ctx: MyContext, discipline: string) {
  const notes = await getNotes(ctx.from!.id, discipline);

  if (notes.length === 0) {
    const keyboard = new InlineKeyboard().text("🔙 Back to Disciplines", "back_to_disciplines");
    return ctx.editMessageText(`📭 No active notes for *${discipline}*.`, {
      reply_markup: keyboard,
      parse_mode: "Markdown"
    });
  }

  // Build the numbered list
  let messageText = `📚 *Notes for ${discipline}*\n\n`;
  notes.forEach((note, index) => {
    messageText += `*${index + 1}.* ${note}\n\n`;
  });

  // Build the completion buttons underneath
  const keyboard = new InlineKeyboard();
  notes.forEach((_, index) => {
    keyboard.text(`🏁 Complete ${index + 1}`, `complete_note:${index}:${discipline}`);
    if ((index + 1) % 2 === 0) keyboard.row(); // 2 buttons per row
  });
  
  keyboard.row().text("🔙 Back to Disciplines", "back_to_disciplines");

  await ctx.editMessageText(messageText, {
    reply_markup: keyboard,
    parse_mode: "Markdown"
  });
}