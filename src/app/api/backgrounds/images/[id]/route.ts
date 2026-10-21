const OPENVERSE_IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!OPENVERSE_IMAGE_ID.test(id)) {
    return Response.json({ error: "画像IDが正しくありません。" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.openverse.org/v1/images/${id}/thumb/`, {
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`Openverse image download failed with status ${response.status}`);
      return Response.json({ error: "選んだ画像を取得できませんでした。" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (!contentType || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      return Response.json({ error: "選んだ画像の形式に対応していません。" }, { status: 502 });
    }

    const image = await response.arrayBuffer();
    if (image.byteLength === 0 || image.byteLength > 4_000_000) {
      return Response.json({ error: "選んだ画像のサイズが大きすぎます。" }, { status: 502 });
    }

    return new Response(image, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Openverse image download failed:", error);
    return Response.json({ error: "選んだ画像を取得できませんでした。通信を確認して再度お試しください。" }, { status: 502 });
  }
}
