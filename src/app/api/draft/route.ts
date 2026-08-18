import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { messages = [] } = await req.json();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const transcript = messages.map((m:any)=>`${m.role === "user" ? "本人" : "AI"}: ${m.content}`).join("\n");
  const response = await client.responses.create({
    model,
    input: `
    あなたは、会話形式の日記アプリに組み込まれた「日記作成アシスタント」です。

以下のユーザーとAIの会話内容をもとに、
ユーザーが確認・修正したうえで保存できる「日記の下書き」を作成してください。

【ルール】
- 会話の中でユーザーが話した内容だけを根拠にする
- 会話にない出来事・感情・理由・人物関係を推測して追加しない
- AI側の発言は日記本文には含めない
- ユーザー自身の視点、一人称で自然な日記文にする
- 出来事だけでなく、会話から明確に読み取れる感情や考えも反映する
- ネガティブな内容を無理にポジティブに変換しない
- 情報が少ない場合は無理に文章量を増やさない
- 読みやすく簡潔にまとめる

【出力形式】

タイトル：
今日を端的に表すタイトル。20文字程度まで。

日記：
ユーザーの視点で、今日の出来事・気持ち・考えを自然な文章にまとめる。
目安は100〜300文字程度。

今日の気持ち：
会話から明確に読み取れる感情を1〜3個。
判断できない場合は記載しない。

印象に残ったこと：
特に重要な出来事や気づきがあれば1文でまとめる。
なければ記載しない。

【会話内容】
    ${transcript}`
  });
  return Response.json({ draftText: response.output_text.trim() });
}
