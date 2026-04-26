import { Context, SessionFlavor } from "grammy";
import { Conversation, ConversationFlavor } from "@grammyjs/conversations";

interface SessionData {
  pendingNote?: PendingNote; 
}

export type BaseContext = Context & SessionFlavor<SessionData>;
export type MyContext = ConversationFlavor<BaseContext>;
export type MyConversation = Conversation<MyContext, MyContext>;

// for holding note during yes/no confirmation
export interface PendingNote {
  intendedDiscipline: string;
  originalText: string;
  content: string;
}

export interface Class {
  index: number;
  discipline: string;
  room: string;
}

export interface Day {
  date: string; // Format: YYYY-MM-DD
  classes: Class[];
}

export type Schedule = Day[];