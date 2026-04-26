// src/modules/notes/receiver.ts
import { InlineKeyboard } from "grammy";
import { MyContext } from "../../core/types.js";
import { getDisciplines, addNote } from "./database.js";
import { findSubjectMatch } from "./fuzzy.js";

export function setupNoteReceiver(bot: any) {
  
  // 1. Listen to all text messages (that aren't commands)
  bot.on("message:text", async (ctx: MyContext) => {
    // Ignore commands (they start with /)
    if (ctx.message!.text!.startsWith("/")) return;

    const lines = ctx.message!.text!.split("\n");
    if (lines.length < 2) {
      // It's just one line. We can ignore it or tell them how to format notes.
      return ctx.reply("ℹ️ To add a note, write the discipline name on the first line, and the note content on the following lines.");
    }

    const subjectCandidate = lines[0].trim();
    const noteContent = lines.slice(1).join("\n").trim();
    const disciplines = await getDisciplines(ctx.from!.id);

    if (disciplines.length === 0) {
      return ctx.reply("❌ You don't have any disciplines set up yet. Use /addalias to create one.");
    }

    const result = findSubjectMatch(subjectCandidate, disciplines);

    if (result.matchType === 'exact') {
      // Perfect match. Save immediately.
      await addNote(ctx.from!.id, result.matchName!, noteContent);
      await ctx.reply(`✅ Note added to *${result.matchName}*`, { parse_mode: "Markdown" });
      
    } else if (result.matchType === 'fuzzy') {
      // Close match. Ask for confirmation.
      ctx.session.pendingNote = {
        intendedDiscipline: result.matchName!,
        originalText: subjectCandidate,
        content: noteContent
      };

      const keyboard = new InlineKeyboard()
        .text("✅ Yes", "confirm_note_yes")
        .text("❌ No", "confirm_note_no");

      await ctx.reply(`Did you mean *${result.matchName}* instead of "${subjectCandidate}"?`, {
        reply_markup: keyboard,
        parse_mode: "Markdown"
      });

    } else {
      // No match found
      await ctx.reply(`❌ Could not find a discipline matching "${subjectCandidate}". Please check your spelling or add it using /addalias.`);
    }
  });

  // 2. Handle the Inline Button Clicks
  bot.callbackQuery("confirm_note_yes", async (ctx: MyContext) => {
    const note = ctx.session.pendingNote;
    if (!note) {
      return ctx.answerCallbackQuery({ text: "Session expired or note lost.", show_alert: true });
    }

    // Save to DB
    await addNote(ctx.from!.id, note.intendedDiscipline, note.content);
    
    // Clear session and update UI
    ctx.session.pendingNote = undefined;
    await ctx.editMessageText(`✅ Note successfully added to *${note.intendedDiscipline}*`, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("confirm_note_no", async (ctx: MyContext) => {
    ctx.session.pendingNote = undefined;
    await ctx.editMessageText("❌ Note cancelled. Please correct the discipline name and try again.");
    await ctx.answerCallbackQuery();
  });
}