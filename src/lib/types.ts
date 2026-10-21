export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  choices?: string[];
};

export type DiaryBackground =
  | "paper"
  | "sakura"
  | "mint"
  | "lemon"
  | "sky"
  | "flower"
  | "dots"
  | "gingham"
  | "stripe"
  | "illustration";

export type DiaryBackgroundCredit = {
  title: string;
  creator: string;
  license: string;
  licenseVersion: string;
  licenseUrl: string;
  sourceUrl: string;
};

export type AppSettings = {
  showChoices: boolean;
  draftPrompt: string;
  chatPrompt: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  showChoices: true,
  draftPrompt: "",
  chatPrompt: "",
};
