# 失語症者向け 会話型日記デモ

Next.js + TypeScript + OpenAI API + IndexedDB(Dexie) のサンプルです。

## 主な機能
- 写真を起点にAIと会話
- 1つのチャット内で以下を併用
  - 選択肢から回答
  - 自由入力
  - 音声入力
- 設定画面で「選択肢を表示する / 表示しない」を切り替え
- 日記ごとに背景を選択（単色・柄）
- 「日記のひな型にする」で会話終了
- AIが会話を日記のひな型に変換
- 最後に本人が文字または音声で追記・修正
- IndexedDBへ保存

## 初期設定

### 1. Node.jsを入れる
Node.js 20系以上を推奨します。

確認:
```bash
node -v
npm -v
```

### 2. インストール
```bash
npm install
```

### 3. OpenAI APIキー設定
`.env.example` を `.env.local` にコピーします。

Windows PowerShell:
```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:
```bash
cp .env.example .env.local
```

`.env.local`:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=利用可能な画像入力対応モデル
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

### 4. 起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 選択肢の設定
ホーム右上の「設定」から切り替えます。

- 表示する: AIの質問ごとに2〜4件の回答候補を表示
- 表示しない: 選択肢は出さず、文字・音声のみ

設定値は localStorage に保存します。

## 日記の背景設定
日記の仕上げ画面、またはホーム・カレンダーの日記カードから、日記ごとに背景を選べます。シンプルな色合いに加え、花もよう・水玉・チェック・ストライプを用意しています。柄はCSSで描画するため、外部画像を読み込みません。

写真から「イラストを探す」を選ぶと、OpenAI APIで写真を説明する検索語を作り、OpenverseのCC0・パブリックドメイン・CC BY・CC BY-SA素材から候補を表示します。写真は検索語の作成のためOpenAIへ送信され、Openverseへは検索語だけが送信されます。選んだ素材は作者・ライセンス・出典URLとともに端末内の IndexedDB に保存されます。日記を公開・配布する場合は、各素材のライセンス条件も確認してください。

## 日記下書きプロンプトの設定
設定画面の「日記下書きのプロンプト」で、下書き生成AIへの指示を編集できます。入力した指示はこの端末の localStorage に保存され、次回以降の日記下書き生成に使われます。空欄にするか「初期設定に戻す」を押すと、APIに組み込まれた初期プロンプトを使います。

設定画面の「Chatのプロンプト」では、会話AIへの指示も同様に編集できます。どちらも入力すると標準プロンプト全体を置き換え、空欄に戻すと標準プロンプトを使います。

## 主要ファイル
- `src/app/page.tsx` ホーム
- `src/app/settings/page.tsx` 選択肢設定
- `src/app/chat/page.tsx` 会話画面
- `src/app/chat/finish/page.tsx` 日記追記・保存
- `src/app/api/chat/route.ts` OpenAI会話API
- `src/app/api/draft/route.ts` 日記ひな型生成
- `src/app/api/transcribe/route.ts` 音声文字起こし
- `src/lib/db.ts` IndexedDB
- `src/lib/settings.ts` 端末設定

## 注意
デモ用途です。音声入力にはブラウザのマイク権限が必要です。


## 主要ナビゲーション

チャット機能に加えて、アプリ全体のフッターナビゲーションを復元しています。

- `/` ホーム
- `/calendar` カレンダー
- `/support` サポート
- `/me` 私
- `/settings` 会話設定（サポートから移動）

会話画面では入力欄を優先するためフッターは表示せず、会話終了後に通常ナビゲーションへ戻る設計です。

## PWA対応

この版はアプリ機能を変更せず、PWA対応だけを追加しています。

追加ファイル:
- `src/app/manifest.ts` Web App Manifest
- `src/components/ServiceWorkerRegister.tsx` Service Worker登録
- `public/sw.js` Service Worker
- `public/icon-192.png` PWAアイコン
- `public/icon-512.png` PWAアイコン
- `public/icon-512-maskable.png` maskableアイコン

### 確認方法

開発サーバーを再起動します。

```bash
npm run dev
```

ブラウザで以下を開き、JSONが表示されればManifestは正常です。

```text
http://localhost:3000/manifest.webmanifest
```

Chrome / Edgeでは開発者ツールの `Application` → `Manifest` と `Service Workers` でも確認できます。

スマートフォンなど別端末へPWAとしてインストールする場合は、localhostではなくHTTPSで公開してください。
