"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { db, type DiaryEntry } from "@/lib/db";
import DiaryBackgroundPicker from "@/components/DiaryBackgroundPicker";
import type { DiaryBackground } from "@/lib/types";

export default function CalendarPage() {
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    db.diaries.orderBy("createdAt").reverse().toArray().then(setItems);
  }, []);

  const changeDiaryBackground = async (id: number | undefined, background: DiaryBackground) => {
    if (id === undefined) return;
    await db.diaries.update(id, { background });
    setItems((current) => current.map((item) => item.id === id ? { ...item, background } : item));
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = useMemo(() => {
    const map = new Map<number, DiaryEntry[]>();
    items.forEach((item) => {
      const d = new Date(item.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const list = map.get(d.getDate()) ?? [];
        list.push(item);
        map.set(d.getDate(), list);
      }
    });
    return map;
  }, [items, year, month]);

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const deleteDiary = async (id?: number) => {
    if (!id) return;

    const ok = window.confirm("この日記を削除しますか？");
    if (!ok) return;

    await db.diaries.delete(id);

    const updated = await db.diaries
      .orderBy("createdAt")
      .reverse()
      .toArray();

    setItems(updated);
  };  
  
  return (
    <main className="phone-shell with-nav">
      <header className="topbar">
        <div><p className="sub">保存した日記</p><h1>カレンダー</h1></div>
      </header>

      <section className="calendar-card">
        <div className="calendar-head">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))}>←</button>
          <strong>{year}年{month + 1}月</strong>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))}>→</button>
        </div>
        <div className="week-row">{["日","月","火","水","木","金","土"].map(x => <span key={x}>{x}</span>)}</div>
        <div className="calendar-grid">
          {cells.map((day, idx) => (
            <div className="calendar-day" key={idx}>
              {day && <><span>{day}</span>{byDay.has(day) && <i className="diary-dot" />}</>}
            </div>
          ))}
        </div>
      </section>

      <section className="calendar-list">
        <h2>この月の日記</h2>
        {items.filter(item => {
          const d = new Date(item.createdAt);
          return d.getFullYear() === year && d.getMonth() === month;
        }).map(item => (
          <article className={`diary-card diary-background-${item.background ?? "paper"}`} key={item.id}>
            {item.photoDataUrl && <img src={item.photoDataUrl} alt="日記の写真" />}
            <div className="diary-card-body">
              <small>{new Date(item.createdAt).toLocaleDateString("ja-JP")}</small>
              <p>{item.finalText}</p>
              <DiaryBackgroundPicker
                value={item.background ?? "paper"}
                onChange={(background) => changeDiaryBackground(item.id, background)}
                label="この日記の背景"
              />
            </div>
          </article>
        ))}
      </section>
      <BottomNav />
    </main>
  );
}
