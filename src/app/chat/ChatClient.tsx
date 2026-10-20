"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Camera, Mic, Send, Square } from "lucide-react";
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
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    setShowChoices(loadSettings().showChoices);
    if (mode !== "photo") {
      setMessages([{ role: "assistant", content: "今日の出来事について教えてください。", choices: ["外出した", "家で過ごした", "人と会った", "その他"] }]);
    }
  }, [mode]);

  async function requestChat(body: object, baseMessages: ChatMessage[]) {
    setMessages(baseMessages);
    setStreamingText("");
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, prompt: loadSettings().chatPrompt }) });
    if (!res.body) throw new Error("ストリームを受信できませんでした。");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamingOutput = "";
    let result: ChatMessage | undefined;

    const processEvent = (raw: string) => {
      const line = raw.split("\n").find((item) => item.startsWith("data: "));
      if (!line) return;
      const event = JSON.parse(line.slice(6));
      if (event.type === "delta") {
        streamingOutput += event.text;
        const messageMatch = streamingOutput.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)/);
        if (messageMatch) {
          try {
            setStreamingText(JSON.parse(`"${messageMatch[1]}"`));
          } catch {
            setStreamingText(messageMatch[1]);
          }
        }
      }
      if (event.type === "result") result = { role: "assistant", content: event.data.message, choices: event.data.choices };
      if (event.type === "error") throw new Error(event.message);
    };

    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        events.forEach(processEvent);
        if (done) break;
      }
      if (buffer.trim()) processEvent(buffer);
      if (result) setMessages([...baseMessages, result]);
    } finally {
      setStreamingText(null);
      setBusy(false);
    }
  }

  async function onPhoto(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setPhoto(dataUrl);
      setBusy(true);
      await requestChat({ photoDataUrl: dataUrl, messages: [], showChoices }, []);
    };
    reader.readAsDataURL(file);
  }

  async function send(answer: string) {
    if (!answer.trim() || busy) return;
    const next = [...messages, { role: "user", content: answer } as ChatMessage];
    setText(""); setBusy(true);
    await requestChat({ photoDataUrl: photo, messages: next, showChoices }, next);
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
    const { draftPrompt } = loadSettings();
    const res = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, photoDataUrl: photo, prompt: draftPrompt }) });
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
          <label className="primary-button">写真を選ぶ<input hidden type="file" accept="image/*" onChange={(e)=>onPhoto(e.target.files?.[0])}/></label>
        </section>
      )}

      {photo && <img className="chat-photo" src={photo} alt="選択した写真"/>}

      <section className="chat-list">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "assistant" ? "assistant-row" : "user-row"}>
            {m.role === "assistant" && <div className="assistant-avatar" aria-hidden="true"><Bot size={25} strokeWidth={2.2}/></div>}
            <div className={`bubble ${m.role}`}>
              <p>{m.content}</p>
              {m.role === "assistant" && showChoices && m.choices?.length ? (
                <div className="choice-wrap">
                  {m.choices.map((c) => <button key={c} onClick={()=>send(c)}>{c}</button>)}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {streamingText !== null && <div className="assistant-row"><div className="assistant-avatar" aria-hidden="true"><Bot size={25} strokeWidth={2.2}/></div><div className="bubble assistant"><p>{streamingText || <span className="thinking-dots" aria-label="考えています"><i/><i/><i/></span>}</p></div></div>}
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
