"use client";

import Link from "next/link";
import { Camera, Mic, Grid2X2, Pencil, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { db, type DiaryEntry } from "@/lib/db";
import BottomNav from "@/components/BottomNav";
import { Trash2 } from "lucide-react";
import DiaryBackgroundPicker from "@/components/DiaryBackgroundPicker";
import IllustrationBackgroundSearch from "@/components/IllustrationBackgroundSearch";
import type { DiaryBackground, DiaryBackgroundCredit } from "@/lib/types";

export default function HomePage() {
  const [items, setItems] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    db.diaries.orderBy("createdAt").reverse().limit(5).toArray().then(setItems);
  }, []);

  const updateDiaryBackground = async (
    id: number | undefined,
    updates: Partial<Pick<DiaryEntry, "background" | "backgroundImageDataUrl" | "backgroundCredit">>,
  ) => {
    if (id === undefined) return;
    await db.diaries.update(id, updates);
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  const selectIllustration = (id: number | undefined, image: string, credit: DiaryBackgroundCredit) =>
    updateDiaryBackground(id, { background: "illustration", backgroundImageDataUrl: image, backgroundCredit: credit });

  const deleteDiary = async (id?: number) => {
    if (!id) return;

    const ok = window.confirm("この日記を削除しますか？");
    if (!ok) return;

    await db.diaries.delete(id);

    const updated = await db.diaries
      .orderBy("createdAt")
      .reverse()
      .limit(5)
      .toArray();

    setItems(updated);
  };

  return (
    <main className="phone-shell with-nav">
      <header className="topbar">
        <div><p className="sub">会話で作る日記</p><h1>今日の日記</h1></div>
        <Link href="/settings" className="icon-link" aria-label="設定"><Settings /></Link>
      </header>

      <section className="home-actions">
        <Link href="/chat?mode=photo" className="home-action blue"><Camera size={42}/><span>写真</span></Link>
        <Link href="/chat?mode=voice" className="home-action green"><Mic size={42}/><span>音声</span></Link>
        <Link href="/chat?mode=choice" className="home-action orange"><Grid2X2 size={42}/><span>選ぶ</span></Link>
        <Link href="/chat?mode=text" className="home-action purple"><Pencil size={42}/><span>書く</span></Link>
      </section>

      <section>
        <div className="section-title"><h2>最近の日記</h2></div>
        {items.length === 0 && <div className="empty-card">まだ日記がありません。</div>}
        {items.map((item) => (
          <article
            className={`diary-card diary-background-${item.background ?? "paper"} ${item.background === "illustration" && item.backgroundImageDataUrl ? "has-illustration" : ""}`}
            key={item.id}
            style={item.background === "illustration" && item.backgroundImageDataUrl ? { backgroundImage: `url("${item.backgroundImageDataUrl}")` } : undefined}
          >
            {item.photoDataUrl && <img src={item.photoDataUrl} alt="日記の写真"/>}
            <div className="diary-card-body">
              <small>{new Date(item.createdAt).toLocaleDateString("ja-JP")}</small>
              <p>{item.finalText}</p>
              <DiaryBackgroundPicker
                value={item.background ?? "paper"}
                onChange={(background) => updateDiaryBackground(item.id, { background })}
                label="この日記の背景"
                hasIllustration={Boolean(item.backgroundImageDataUrl)}
              />
              {item.background === "illustration" && item.backgroundCredit && (
                <p className="background-credit">
                  背景素材: <a href={item.backgroundCredit.sourceUrl} target="_blank" rel="noreferrer">{item.backgroundCredit.title}</a>
                  {" "}・{item.backgroundCredit.creator} ・
                  <a href={item.backgroundCredit.licenseUrl} target="_blank" rel="noreferrer">
                    {item.backgroundCredit.license.toUpperCase()} {item.backgroundCredit.licenseVersion}
                  </a>
                </p>
              )}
              <IllustrationBackgroundSearch
                photoDataUrl={item.photoDataUrl}
                onSelect={(image, credit) => selectIllustration(item.id, image, credit)}
              />
            </div>
            <button className="delete-button" onClick={() => deleteDiary(item.id)}><Trash2 size={20} /></button>
          </article>
        ))}
      </section>
      <BottomNav />
    </main>
  );
}
