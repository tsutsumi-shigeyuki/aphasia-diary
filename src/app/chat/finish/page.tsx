"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square } from "lucide-react";
import { db } from "@/lib/db";
import type { ChatMessage } from "@/lib/types";

export default function FinishPage() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [finalText, setFinalText] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("diaryDraft");
    if (!raw) return;
    const data = JSON.parse(raw);
    setDraft(data.draftText); setFinalText(data.draftText); setPhoto(data.photo); setMessages(data.messages);
  }, []);

  async function startVoice() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream); recorder.current = mr; chunks.current = [];
    mr.ondataavailable = (e) => chunks.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" }); stream.getTracks().forEach(t=>t.stop());
      const fd = new FormData(); fd.append("file", blob, "voice.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) setFinalText((v) => `${v}\n${data.text}`.trim());
    };
    mr.start(); setRecording(true);
  }
  function stopVoice(){ recorder.current?.stop(); setRecording(false); }

  async function save() {
    await db.diaries.add({ createdAt: new Date().toISOString(), photoDataUrl: photo, conversation: messages, draftText: draft, finalText });
    sessionStorage.removeItem("diaryDraft"); router.push("/");
  }

  return (
    <main className="phone-shell">
      <header className="topbar"><button className="back" onClick={()=>router.back()}>←</button><h1>日記を仕上げる</h1><span/></header>
      {photo && <img className="chat-photo" src={photo} alt="日記の写真"/>}
      <div className="draft-card"><h2>AIが作ったひな型</h2><p>{draft}</p></div>
      <h2>自分の言葉で追記・修正</h2>
      <textarea className="final-editor" value={finalText} onChange={(e)=>setFinalText(e.target.value)} />
      <button className={recording ? "voice-button recording full" : "voice-button full"} onClick={recording ? stopVoice : startVoice}>
        {recording ? <Square size={20}/> : <Mic size={20}/>} {recording ? "音声入力を終了" : "音声で追記"}
      </button>
      <button className="primary-button full" onClick={save}>保存する</button>
    </main>
  );
}
