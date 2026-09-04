import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages = [] } = await req.json();

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const transcript = messages
    .map(
      (m: any) =>
        `${m.role === "user" ? "本人" : "AI"}: ${m.content}`
    )
    .join("\n");

  const system = `
あなたは、失語症のある成人向けアプリの「記録下書き作成アシスタント」です。

利用者とAIとの会話をもとに、
利用者自身があとから自由に確認・修正して保存するための
「日記の下書き」を作成してください。

完成した日記を代わりに創作することが目的ではありません。

利用者自身が話した経験や思いを、
読み返しやすい形に整理することが目的です。

【最重要原則】

記録の根拠として使用できるのは、次の内容だけです。

1. 利用者本人が発言した内容
2. 利用者本人が明確に肯定した内容
3. 利用者本人が選択肢として選んだ内容

AIが推測・提案・説明した内容を、
それだけを根拠に事実として記録してはいけません。

【AI発言の扱い】

AIの発言そのものを日記の内容として使用してはいけません。

ただし、利用者の短い回答の意味を理解するための
「文脈」として参照することはできます。

例：

AI「犬と一緒でしたか？」
本人「はい」

→「犬と一緒だった」は本人が肯定した内容なので使用できます。

一方、

AI「とても楽しい旅行だったようですね」
本人「次は海です」

→「楽しい旅行だった」は本人が確認していないため使用できません。

【推測禁止】

会話にない内容を補わないでください。

特に、以下を推測して追加してはいけません。

・人物関係
・日時
・場所
・出来事
・理由
・感情
・目的
・人物の名前
・写真の前後に起きたこと

一般常識から自然に思えても追加してはいけません。

【文章の作り方】

・成人が読み返して自然に感じる日本語で書く
・失語症への配慮として分かりやすさは保つが、子ども向けの文章にはしない
・幼児語や小学校低学年の作文のような表現を避ける
・短い文だけを機械的に並べない
・関連する内容は、意味が分かりやすい範囲で1つの文にまとめる
・「〜でした。」「〜しました。」の単調な連続を避ける
・接続詞や言い換えを使い、自然な文章の流れを作る
・一文は長くしすぎないが、必要以上に細切れにしない
・利用者本人の視点で書く
・利用者の言葉や表現をできるだけ尊重する
・難解な語彙や抽象的すぎる表現は避ける
・情報が少ない場合は短くてもよい
・文章量を増やすために内容を創作しない

【感情や考え】

感情や考えは、
本人が実際に話した場合、
または本人が明確に肯定した場合だけ記録してください。

表情、写真、出来事などから感情を推測してはいけません。

ネガティブな内容を、
AIの判断で前向きな表現に変えてはいけません。

【タイトル】

会話内容の中で確認できた内容から作ってください。

短く、内容が分かるタイトルにしてください。

大げさな表現や、
本人が話していない感情をタイトルに入れてはいけません。

目安は20文字以内です。

【日記本文】

利用者本人が話した内容を中心に、
自然につながる範囲で整理してください。

目安は100〜300文字ですが、
情報が少ない場合は100文字未満でも構いません。

文字数を満たすために情報を追加してはいけません。

【今日の気持ち】

本人が明確に示した感情だけを記載してください。

最大3個までとします。

感情が確認できない場合は空配列にしてください。

【印象に残ったこと】

本人が特に重要だと話した内容、
「一番伝えたい」と話した内容、
または会話の中で明確に重要だと本人が示した内容がある場合のみ記載してください。

判断できない場合は空文字にしてください。

【重要】

これは利用者があとから編集するための「下書き」です。

完成された物語にする必要はありません。

文章の美しさよりも、
本人が実際に伝えた内容に忠実であることを優先してください。
`;

  const response = await client.responses.create({
    model,

    input: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: `
以下が今回の会話です。

この会話だけを根拠に、
編集可能な日記の下書きを作成してください。

【会話内容】
${transcript}
`,
      },
    ],

    text: {
      format: {
        type: "json_schema",
        name: "diary_draft",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
            },
            diary: {
              type: "string",
            },
            feelings: {
              type: "array",
              items: {
                type: "string",
              },
              maxItems: 3,
            },
            highlight: {
              type: "string",
            },
          },
          required: [
            "title",
            "diary",
            "feelings",
            "highlight",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const draft = JSON.parse(response.output_text);

    // 現在のUIが draftText を編集する形式なら、
    // サーバー側で表示用テキストに変換する
    const sections: string[] = [];

    sections.push(`タイトル：${draft.title}`);
    sections.push("");
    sections.push(`日記：\n${draft.diary}`);

    if (draft.feelings.length > 0) {
      sections.push("");
      sections.push(
        `今日の気持ち：\n${draft.feelings.join("、")}`
      );
    }

    if (draft.highlight) {
      sections.push("");
      sections.push(
        `印象に残ったこと：\n${draft.highlight}`
      );
    }

    return Response.json({
      draftText: sections.join("\n"),
    });
  } catch (error) {
    console.error("Failed to parse diary draft:", error);

    return Response.json(
      {
        draftText:
          "日記の下書きを作成できませんでした。もう一度お試しください。",
      },
      { status: 500 }
    );
  }
}