"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSettings, saveSettings } from "@/lib/settings";

export default function SettingsPage() {
  const [showChoices, setShowChoices] = useState(true);

  useEffect(() => setShowChoices(loadSettings().showChoices), []);

  const change = (value: boolean) => {
    setShowChoices(value);
    saveSettings({ showChoices: value });
  };

  return (
    <main className="phone-shell">
      <header className="topbar"><Link href="/support" className="back">←</Link><h1>設定</h1><span/></header>
      <section className="settings-card">
        <div>
          <h2>回答の選択肢</h2>
          <p>会話中に、AIが回答候補を表示するか選べます。</p>
        </div>
        <label className="switch-row">
          <span>{showChoices ? "表示する" : "表示しない"}</span>
          <input type="checkbox" checked={showChoices} onChange={(e)=>change(e.target.checked)} />
        </label>
      </section>
      <section className="note-card">
        <strong>表示する</strong><p>「家族」「友人」などの候補を押して回答できます。文字・音声入力も同時に使えます。</p>
        <strong>表示しない</strong><p>自由入力と音声入力だけで会話します。</p>
      </section>
    </main>
  );
}
