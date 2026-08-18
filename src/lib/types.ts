export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  choices?: string[];
};

export type AppSettings = {
  showChoices: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  showChoices: true,
};
