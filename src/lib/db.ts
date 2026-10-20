import Dexie, { type Table } from "dexie";
import type { ChatMessage, DiaryBackground } from "./types";

export type DiaryEntry = {
  id?: number;
  createdAt: string;
  photoDataUrl?: string;
  conversation: ChatMessage[];
  draftText: string;
  finalText: string;
  background?: DiaryBackground;
};

class DiaryDB extends Dexie {
  diaries!: Table<DiaryEntry, number>;
  constructor() {
    super("aphasiaDiary");
    this.version(1).stores({ diaries: "++id,createdAt" });
  }
}

export const db = new DiaryDB();
