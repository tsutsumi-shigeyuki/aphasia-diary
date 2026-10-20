"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSettings, saveSettings } from "@/lib/settings";

export default function SettingsPage() {
  const [showChoices, setShowChoices] = useState(true);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");

  useEffect(() => {
    const settings = loadSettings();
    setShowChoices(settings.showChoices);
    setDraftPrompt(settings.draftPrompt);
    setChatPrompt(settings.chatPrompt);
  }, []);

  const change = (value: boolean) => {
    setShowChoices(value);
    saveSettings({ showChoices: value });
  };

  const changeDraftPrompt = (value: string) => {
    setDraftPrompt(value);
    saveSettings({ draftPrompt: value });
  };

  const resetDraftPrompt = () => changeDraftPrompt("");

  const changeChatPrompt = (value: string) => {
    setChatPrompt(value);
    saveSettings({ chatPrompt: value });
  };

  const resetChatPrompt = () => changeChatPrompt("");

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
      <section className="settings-card">
        <h2>Chatのプロンプト</h2>
        <p>会話AIへの指示を編集できます。空欄なら現在の標準プロンプトを使い、入力すると標準プロンプト全体を置き換えます。</p>
        <textarea
          className="prompt-editor"
          value={chatPrompt}
          onChange={(event) => changeChatPrompt(event.target.value)}
          maxLength={20000}
          placeholder="現在の標準プロンプトを使用中"
          aria-label="Chatのプロンプト"
        />
        <p className="prompt-count">{chatPrompt.length.toLocaleString()} / 20,000文字</p>
        <button className="prompt-reset" onClick={resetChatPrompt} disabled={!chatPrompt}>
          標準プロンプトに戻す
        </button>
      </section>
      <section className="settings-card">
        <h2>日記下書きのプロンプト</h2>
        <p>日記の下書きを作るAIへの指示を編集できます。空欄なら現在の標準プロンプトを使い、入力すると標準プロンプト全体を置き換えます。</p>
        <textarea
          className="prompt-editor"
          value={draftPrompt}
          onChange={(event) => changeDraftPrompt(event.target.value)}
          maxLength={20000}
          placeholder="現在の標準プロンプトを使用中"
          aria-label="日記下書きのプロンプト"
        />
        <p className="prompt-count">{draftPrompt.length.toLocaleString()} / 20,000文字</p>
        <button className="prompt-reset" onClick={resetDraftPrompt} disabled={!draftPrompt}>
          標準プロンプトに戻す
        </button>
      </section>
    </main>
  );
}
