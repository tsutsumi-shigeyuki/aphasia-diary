import { Suspense } from "react";
import ChatClient from "./ChatClient";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            読み込み中...
          </div>
        </main>
      }
    >
      <ChatClient />
    </Suspense>
  );
}