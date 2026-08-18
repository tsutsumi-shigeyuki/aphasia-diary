"use client";

import BottomNav from "@/components/BottomNav";

export default function MePage() {
  return (
    <main className="phone-shell with-nav">
      <header className="topbar"><div><p className="sub">利用者情報</p><h1>私</h1></div></header>
      <section className="profile-card">
        <div className="avatar">私</div>
        <h2>利用者</h2>
        <p>デモ版では利用者情報を端末内だけで扱います。</p>
      </section>
      <section className="note-card">
        <strong>今後追加できる項目</strong>
        <p>呼び名、よく会う人、よく行く場所、回答しやすい選択肢などを登録すると、会話支援に利用できます。</p>
      </section>
      <BottomNav />
    </main>
  );
}
