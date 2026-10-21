import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const imageDataUrlPattern = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

type OpenverseImage = {
  id: string;
  title: string;
  creator: string | null;
  license: string;
  license_version: string;
  license_url: string;
  foreign_landing_url: string;
  thumbnail: string;
  mature: boolean;
};

export async function POST(request: Request) {
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || !("photoDataUrl" in body)) {
    return Response.json({ error: "検索に使う写真がありません。" }, { status: 400 });
  }

  const photoDataUrl = body.photoDataUrl;
  if (
    typeof photoDataUrl !== "string" ||
    photoDataUrl.length > 8_000_000 ||
    !imageDataUrlPattern.test(photoDataUrl)
  ) {
    return Response.json({ error: "JPEG、PNG、WebP形式の写真を選んでください。" }, { status: 400 });
  }

  let query: string;
  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: "画像に見える物、場所、季節、色、雰囲気だけから、関連するイラストを探すための英語キーワードを5〜8語で作ってください。人物の特定や属性の推測はしないでください。JSONのqueryにキーワードだけを入れてください。",
          },
          { type: "input_image", image_url: photoDataUrl, detail: "auto" },
        ],
      }],
      text: {
        format: {
          type: "json_schema",
          name: "background_search_keywords",
          strict: true,
          schema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed: unknown = JSON.parse(response.output_text);
    if (!parsed || typeof parsed !== "object" || !("query" in parsed) || typeof parsed.query !== "string") {
      return Response.json({ error: "写真から検索語を作成できませんでした。" }, { status: 502 });
    }
    query = parsed.query.trim().slice(0, 160);
    if (!query) {
      return Response.json({ error: "写真から検索語を作成できませんでした。" }, { status: 502 });
    }
  } catch (error) {
    console.error("Background keyword generation failed:", error);
    return Response.json({ error: "写真の説明を作成できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
  }

  const searchUrl = new URL("https://api.openverse.org/v1/images/");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("page_size", "12");
  searchUrl.searchParams.set("category", "illustration");
  searchUrl.searchParams.set("license", "cc0,pdm,by,by-sa");
  searchUrl.searchParams.set("mature", "false");

  try {
    const response = await fetch(searchUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`Openverse search failed with status ${response.status}`);
      return Response.json({ error: "素材サイトから候補を取得できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
    }

    const data: { results?: OpenverseImage[] } = await response.json();
    const results = (data.results ?? [])
      .filter((image) =>
        image.mature === false &&
        ["cc0", "pdm", "by", "by-sa"].includes(image.license) &&
        typeof image.id === "string" &&
        typeof image.thumbnail === "string" &&
        image.thumbnail.startsWith(`https://api.openverse.org/v1/images/${image.id}/thumb/`) &&
        typeof image.foreign_landing_url === "string" &&
        image.foreign_landing_url.startsWith("https://") &&
        typeof image.license_url === "string" &&
        image.license_url.startsWith("https://")
      )
      .map((image) => ({
        id: image.id,
        title: image.title || "タイトルなし",
        creator: image.creator || "作者不明",
        license: image.license,
        licenseVersion: image.license_version,
        licenseUrl: image.license_url,
        sourceUrl: image.foreign_landing_url,
        thumbnail: image.thumbnail,
      }));

    return Response.json({ query, results });
  } catch (error) {
    console.error("Openverse request failed:", error);
    return Response.json({ error: "素材サイトに接続できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
