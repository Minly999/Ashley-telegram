import { MyContext, MyConversation } from "../../core/types.js";
import { parseScheduleProtocol } from "./parser.js";
import { saveDaySchedule, getDaySchedule, getFullSchedule } from "./storage.js";
import { getActiveWeekDates, parseUserInputToDate, getWeekdayName } from "../../utils/dateUtils.js";

export async function addScheduleConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Paste the schedule block (Format: Date followed by Index | Discipline | Room):");
  const { message } = await conversation.wait();

  if (!message?.text) return;

  try {
    const schedule = parseScheduleProtocol(message.text);
    for (const day of schedule) {
      await saveDaySchedule(ctx.from!.id, day.date, day.classes);
    }
    await ctx.reply(`Successfully saved ${schedule.length} day(s).`);
  } catch (e) {
    await ctx.reply(`Parsing Error: ${(e as Error).message}`);
  }
}

export async function getDayConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Which day? (e.g., 'Monday' or '04/13'):");
  const { message } = await conversation.wait();
  
  if (!message?.text) return;

  const activeDates = getActiveWeekDates();
  const target = parseUserInputToDate(message.text, activeDates);

  if (!target) {
    return ctx.reply("Invalid day or date for the active week.");
  }

  const classes = await getDaySchedule(ctx.from!.id, target);
  
  if (!classes || classes.length === 0) {
    return ctx.reply(`${target}: No classes found.`);
  }

  const text = classes
    .map((c) => `${c.index}. ${c.discipline} [${c.room}]`)
    .join("\n");

  const weekday = getWeekdayName(target);

  await ctx.reply(`*${target} (${weekday})*\n\n${text}`, { 
    parse_mode: "Markdown" 
  });
}

export function setupScheduleModule(bot: any) {
  bot.command("add", (ctx: MyContext) => ctx.conversation.enter("addScheduleConversation"));
  bot.command("day", (ctx: MyContext) => ctx.conversation.enter("getDayConversation"));

  bot.command("week", async (ctx: MyContext) => {
    const activeDates = getActiveWeekDates();
    const schedule = await getFullSchedule(ctx.from!.id);

    let response = "Active Week Schedule\n\n";
    let found = false;

    for (const date of activeDates) {
      const day = schedule.find((s) => s.date === date);
      if (day) {
        found = true;
        const weekday = getWeekdayName(date);
        const dayText = day.classes
          .map((c) => `  ${c.index}. ${c.discipline} [${c.room}]`)
          .join("\n");
        response += `*${date} (${weekday})*\n${dayText}\n\n`;
      }
    }

    await ctx.reply(found ? response : "Your schedule for the active week is empty.", { 
      parse_mode: "Markdown" 
    });
  });
}