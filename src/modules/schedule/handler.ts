import { MyContext, MyConversation } from "../../core/types.js";
import { parseScheduleProtocol } from "./parser.js";
import { saveDaySchedule, getDaySchedule, getFullSchedule } from "./storage.js";
import { 
  getActiveWeekDates, 
  parseUserInputToDate, 
  getWeekdayName, 
  formatDisplayDate 
} from "../../utils/dateUtils.js";

export async function addScheduleConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply(
    "📝 *Надішліть блок розкладу*\n\n" +
    "Формат: рядок з датою, після якого йдуть пари у форматі `Номер | Дисципліна | Аудиторія`:",
    { parse_mode: "Markdown" }
  );

  const { message } = await conversation.wait();
  if (!message?.text) return;

  try {
    const schedule = parseScheduleProtocol(message.text);
    for (const day of schedule) {
      await saveDaySchedule(ctx.from!.id, day.date, day.classes);
    }
    await ctx.reply(`✅ Успішно збережено ${schedule.length} день(днів)!`);
  } catch (e) {
    await ctx.reply(`❌ Помилка обробки: ${(e as Error).message}`);
  }
}

export async function getDayConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply(
    "🗓 *Оберіть день або введіть дату:*\n\n" +
    "• День тижня: `Понеділок`, `Пн`, `Friday`\n" +
    "• Точна дата: `14-09` або `14-09-2026`",
    { parse_mode: "Markdown" }
  );
  
  const { message } = await conversation.wait();
  if (!message?.text) return;

  const activeDates = getActiveWeekDates();
  const target = parseUserInputToDate(message.text, activeDates);

  if (!target) {
    return ctx.reply(
      "❌ *Невірний день або формат дати.*\n\n" +
      "Введіть день тижня (наприклад, `Вівторок` чи `Ср`) або дату у форматі `ДД-ММ` (`14-09`).",
      { parse_mode: "Markdown" }
    );
  }

  const classes = await getDaySchedule(ctx.from!.id, target);
  const displayDate = formatDisplayDate(target);
  const weekday = getWeekdayName(target);
  
  if (!classes || classes.length === 0) {
    return ctx.reply(
      `🏖️ *${displayDate} (${weekday})*\n\n` +
      "Занять немає! Можна відпочивати. 🎉",
      { parse_mode: "Markdown" }
    );
  }

  const text = classes
    .map((c) => `🔹 *Пара ${c.index}*:${c.discipline}\n   📍 *Аудиторія*: \`${c.room}\``)
    .join("\n\n");

  await ctx.reply(
    `📅 *${displayDate} (${weekday})*\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `${text}`,
    { parse_mode: "Markdown" }
  );
}

export function setupScheduleModule(bot: any) {
  bot.command("add", (ctx: MyContext) => ctx.conversation.enter("addScheduleConversation"));
  bot.command("day", (ctx: MyContext) => ctx.conversation.enter("getDayConversation"));

  bot.command("week", async (ctx: MyContext) => {
    const activeDates = getActiveWeekDates();
    const schedule = await getFullSchedule(ctx.from!.id);

    let response = "🗓️ *Розклад на активний тиждень*\n━━━━━━━━━━━━━━━━━━\n\n";
    let found = false;

    for (const date of activeDates) {
      const day = schedule.find((s) => s.date === date);
      if (day && day.classes.length > 0) {
        found = true;
        const displayDate = formatDisplayDate(date);
        const weekday = getWeekdayName(date);
        const dayText = day.classes
          .map((c) => `  🔹 *Пара ${c.index}*: ${c.discipline} [\`${c.room}\`]`)
          .join("\n");
        response += `📅 *${displayDate} (${weekday})*\n${dayText}\n\n`;
      }
    }

    await ctx.reply(
      found ? response : "🏖️ На цей тиждень пар немає або розклад порожній!", 
      { parse_mode: "Markdown" }
    );
  });
}