import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { messages = [], photoDataUrl, showChoices = true } = await req.json();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const system = `あなたは失語症者向けの日記作成支援AIです。日本語は基本的に漢字を使い、必要以上に平仮名・片仮名へ開かないでください。1回の返答では質問を1つだけしてください。回答を否定・訂正しすぎず、会話を自然に続けてください。日記に必要な「誰と」「どこで」「何をした」「どう感じた」などを少しずつ尋ねてください。\n\n選択肢表示: ${showChoices ? "あり" : "なし"}\n${showChoices ? "返答はJSONで {message:string, choices:string[]}。choicesは2〜4個、短く分かりやすく。自由入力・音声回答も可能なので、選択肢だけに依存しない。" : "返答はJSONで {message:string, choices:[]}。choicesは必ず空配列。"}`;

  const input: any[] = [{ role: "system", content: system }];
  if (photoDataUrl) {
    input.push({ role: "user", content: [{ type: "input_text", text: "この写真をきっかけに会話を始めてください。" }, { type: "input_image", image_url: photoDataUrl }] });
  }
  for (const m of messages) input.push({ role: m.role, content: m.content });

  const response = await client.responses.create({ model, input, text: { format: { type: "json_object" } } as any });
  let result = { message: "もう少し教えてください。", choices: [] as string[] };
  try { result = JSON.parse(response.output_text); } catch {}
  return Response.json(result);
}
