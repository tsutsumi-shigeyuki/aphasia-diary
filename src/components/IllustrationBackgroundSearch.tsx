"use client";

import { useState } from "react";
import type { DiaryBackgroundCredit } from "@/lib/types";

type SearchResult = {
  id: string;
  title: string;
  creator: string;
  license: string;
  licenseVersion: string;
  licenseUrl: string;
  sourceUrl: string;
  thumbnail: string;
};

type IllustrationBackgroundSearchProps = {
  photoDataUrl?: string;
  onSelect: (imageDataUrl: string, credit: DiaryBackgroundCredit) => void;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("写真を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

export default function IllustrationBackgroundSearch({
  photoDataUrl,
  onSelect,
}: IllustrationBackgroundSearchProps) {
  const [referencePhoto, setReferencePhoto] = useState(photoDataUrl ?? "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string>();
  const [error, setError] = useState("");

  async function search() {
    if (!referencePhoto || searching) return;
    setSearching(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/backgrounds/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl: referencePhoto }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "イラストを検索できませんでした。");
      setQuery(data.query);
      setResults(data.results);
      if (data.results.length === 0) setError("関連する候補が見つかりませんでした。別の写真でお試しください。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "イラストを検索できませんでした。");
    } finally {
      setSearching(false);
    }
  }

  async function select(result: SearchResult) {
    setDownloadingId(result.id);
    setError("");
    try {
      const response = await fetch(`/api/backgrounds/images/${result.id}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "選んだ画像を保存できませんでした。");
      }
      const imageDataUrl = await readFileAsDataUrl(
        new File([await response.blob()], "background-image", {
          type: response.headers.get("content-type") ?? "image/jpeg",
        }),
      );
      onSelect(imageDataUrl, {
        title: result.title,
        creator: result.creator,
        license: result.license,
        licenseVersion: result.licenseVersion,
        licenseUrl: result.licenseUrl,
        sourceUrl: result.sourceUrl,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "選んだ画像を保存できませんでした。");
    } finally {
      setDownloadingId(undefined);
    }
  }

  async function chooseReferencePhoto(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 6_000_000) {
      setError("JPEG、PNG、WebP形式で6MB以下の写真を選んでください。");
      return;
    }
    try {
      setReferencePhoto(await readFileAsDataUrl(file));
      setError("");
      setResults([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "写真を読み込めませんでした。");
    }
  }

  return (
    <section className="illustration-search">
      <button
        className="illustration-search-toggle"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? "イラスト検索を閉じる" : "写真からイラストを探す"}
      </button>
      {expanded && (
        <div className="illustration-search-panel">
          <p>写真の内容から検索語を作り、Openverseの利用条件を確認できる素材を探します。写真は検索語を作るためOpenAIに送信され、素材サイトには検索語だけが送られます。</p>
          {!photoDataUrl && (
            <label className="reference-photo-picker">
              検索に使う写真を選ぶ
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => chooseReferencePhoto(event.target.files?.[0])}
              />
            </label>
          )}
          {referencePhoto && <img className="reference-photo-preview" src={referencePhoto} alt="イラスト検索に使う写真" />}
          <button
            className="prompt-reset"
            type="button"
            onClick={search}
            disabled={!referencePhoto || searching || Boolean(downloadingId)}
          >
            {searching ? "写真を確認して検索中..." : "関連するイラストを検索"}
          </button>
          {query && <p className="search-query">検索語: {query}</p>}
          {error && <p className="illustration-search-error" role="alert">{error}</p>}
          {results.length > 0 && (
            <div className="illustration-results" aria-busy={Boolean(downloadingId)}>
              {results.map((result) => (
                <article className="illustration-result" key={result.id}>
                  <img src={result.thumbnail} alt="" loading="lazy" />
                  <div className="illustration-result-info">
                    <strong>{result.title}</strong>
                    <span>{result.creator}</span>
                    <a href={result.licenseUrl} target="_blank" rel="noreferrer">
                      {result.license.toUpperCase()} {result.licenseVersion}
                    </a>
                    <a href={result.sourceUrl} target="_blank" rel="noreferrer">素材ページ</a>
                    <button
                      className="prompt-reset"
                      type="button"
                      onClick={() => select(result)}
                      disabled={Boolean(downloadingId)}
                    >
                      {downloadingId === result.id ? "保存中..." : "この背景を使う"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
