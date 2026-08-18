"use client";

import Link from "next/link";
import { Settings, Volume2, Type, CircleHelp } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function SupportPage() {
  return (
    <main className="phone-shell with-nav">
      <header className="topbar"><div><p className="sub">使いやすさを調整</p><h1>サポート</h1></div></header>
      <section className="support-grid">
        <Link href="/settings" className="support-card"><Settings/><div><strong>会話設定</strong><span>回答の選択肢を表示するか設定します。</span></div></Link>
        <div className="support-card"><Volume2/><div><strong>読み上げ</strong><span>日記の文章を音声で確認する機能を追加できます。</span></div></div>
        <div className="support-card"><Type/><div><strong>文字表示</strong><span>文字の大きさなどを今後調整できます。</span></div></div>
        <div className="support-card"><CircleHelp/><div><strong>使い方</strong><span>写真・選択・文字・音声を同じ会話で利用できます。</span></div></div>
      </section>
      <BottomNav />
    </main>
  );
}
