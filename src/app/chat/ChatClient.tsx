"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Mic, Send, Square } from "lucide-react";
import { loadSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import type { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") ?? "photo";
  const [showChoices, setShowChoices] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    setShowChoices(loadSettings().showChoices);
    if (mode !== "photo") {
      setMessages([{ role: "assistant", content: "今日の出来事について教えてください。", choices: ["外出した", "家で過ごした", "人と会った", "その他"] }]);
    }
  }, [mode]);

  async function onPhoto(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setPhoto(dataUrl);
      setBusy(true);
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoDataUrl: dataUrl, messages: [], showChoices }) });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.message, choices: data.choices }]);
      setBusy(false);
    };
    reader.readAsDataURL(file);
  }

  async function send(answer: string) {
    if (!answer.trim() || busy) return;
    const next = [...messages, { role: "user", content: answer } as ChatMessage];
    setMessages(next); setText(""); setBusy(true);
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoDataUrl: photo, messages: next, showChoices }) });
    const data = await res.json();
    setMessages([...next, { role: "assistant", content: data.message, choices: data.choices }]);
    setBusy(false);
  }

  async function startVoice() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream); recorder.current = mr; chunks.current = [];
    mr.ondataavailable = (e) => chunks.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      stream.getTracks().forEach(t => t.stop());
      const fd = new FormData(); fd.append("file", blob, "voice.webm");
      setBusy(true);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json(); setBusy(false);
      if (data.text) await send(data.text);
    };
    mr.start(); setRecording(true);
  }

  function stopVoice() { recorder.current?.stop(); setRecording(false); }

  async function makeDraft() {
    setBusy(true);
    const res = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, photoDataUrl: photo }) });
    const data = await res.json();
    sessionStorage.setItem("diaryDraft", JSON.stringify({ messages, photo, draftText: data.draftText }));
    setBusy(false); router.push("/chat/finish");
  }

  return (
    <main className="phone-shell chat-page">
      <header className="topbar"><button className="back" onClick={()=>router.back()}>←</button><h1>会話で日記</h1><span/></header>

      {mode === "photo" && !photo && (
        <section className="photo-start">
          <Camera size={62}/><h2>写真を選んでください</h2>
          <label className="primary-button">写真を選ぶ<input hidden type="file" accept="image/*" capture="environment" onChange={(e)=>onPhoto(e.target.files?.[0])}/></label>
        </section>
      )}

      {photo && <img className="chat-photo" src={photo} alt="選択した写真"/>}

      <section className="chat-list">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <p>{m.content}</p>
            {m.role === "assistant" && showChoices && m.choices?.length ? (
              <div className="choice-wrap">
                {m.choices.map((c) => <button key={c} onClick={()=>send(c)}>{c}</button>)}
              </div>
            ) : null}
          </div>
        ))}
        {busy && <div className="bubble assistant"><p>考えています…</p></div>}
      </section>

      {(messages.length > 0 || mode !== "photo") && (
        <div className="chat-controls">
          <div className="input-row">
            <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="自分で入力" onKeyDown={(e)=>{ if(e.key==="Enter") send(text); }} />
            <button className="send-button" onClick={()=>send(text)}><Send size={20}/></button>
          </div>
          <div className="voice-row">
            <button className={recording ? "voice-button recording" : "voice-button"} onClick={recording ? stopVoice : startVoice}>
              {recording ? <Square size={20}/> : <Mic size={20}/>} {recording ? "終了" : "音声で話す"}
            </button>
          </div>
          <button className="draft-button" onClick={makeDraft} disabled={messages.length < 2 || busy}>日記のひな型にする</button>
        </div>
      )}
    </main>
  );
}
