import { useState, useRef, useCallback } from "react";
import Head from "next/head";

// 品質チェックリスト（画角チェック2項目追加済み）
const CHECKS = [
  { id: "light",   label: "光源の位置が自然である" },
  { id: "scale",   label: "被写体同士のサイズ感が適切である" },
  { id: "props",   label: "不自然な小物が存在していない" },
  { id: "shape",   label: "商品の脚・取手など形状が変わっていない" },
  { id: "color",   label: "商品の色味・素材感が変わっていない" },
  { id: "distort", label: "製品自体の画角が不自然に変形していない" },
  { id: "persp",   label: "背景は製品の画角（カメラアングル・消失点）と合っている" },
];

export default function Home() {
  const [uploadedImage,  setUploadedImage]  = useState(null);
  const [uploadedMime,   setUploadedMime]   = useState("image/jpeg");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedMime,  setGeneratedMime]  = useState("image/png");
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [error,          setError]          = useState(null);
  const [checks,         setChecks]         = useState({});
  const [isDragging,     setIsDragging]     = useState(false);
  const fileInputRef = useRef(null);

  const allChecked   = CHECKS.every((c) => checks[c.id]);
  const checkedCount = CHECKS.filter((c) => checks[c.id]).length;
  const progressPct  = Math.round((checkedCount / CHECKS.length) * 100);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setUploadedMime(file.type);
      setGeneratedImage(null);
      setChecks({});
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setChecks({});
    try {
      const base64 = uploadedImage.split(",")[1];
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: uploadedMime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました");
      setGeneratedImage(`data:${data.mimeType};base64,${data.imageBase64}`);
      setGeneratedMime(data.mimeType);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage || !allChecked) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    const ext = generatedMime.split("/")[1] || "png";
    a.download = `harmonic_nordic_${Date.now()}.${ext}`;
    a.click();
  };

  const toggleCheck = (id) =>
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <Head>
        <title>背景差し替えツール — Harmonic House</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Sans+JP:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* ── Header ── */}
      <header style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-default)",
        height: 60,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 30,
        boxShadow: "var(--shadow-sm)",
        gap: 14,
      }}>
        {/* タイトルをメインに、社名はサブ表示 */}
        <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text-heading)" }}>
          背景差し替えツール
        </span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>— Harmonic House</span>
        <div style={{ marginLeft: "auto" }}>
          <span className="badge badge-muted">社内限定ツール</span>
        </div>
      </header>

      {/* ── Page layout ── */}
      <div className="page-layout">

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Upload card */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Step 1</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>商品画像をアップロード</span>
            </div>

            {/* アップロード前 */}
            {!uploadedImage && (
              <div style={{ padding: 16 }}>
                <div
                  className={`upload-zone${isDragging ? " dragging" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0])} />
                  <div style={{ fontSize: 34, marginBottom: 12 }}>📷</div>
                  <div style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    <strong style={{ color: "var(--color-primary-600)" }}>クリック</strong> またはドラッグ&ドロップ
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>JPG / PNG / WEBP</div>
                </div>
              </div>
            )}

            {/* アップロード後：画像をカード内に表示 */}
            {uploadedImage && (
              <div>
                <div
                  style={{ position: "relative", cursor: "pointer", overflow: "hidden" }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0])} />
                  <img
                    src={uploadedImage}
                    alt="元画像"
                    style={{ width: "100%", display: "block", maxHeight: 260, objectFit: "contain", background: "var(--bg-surface-2)" }}
                  />
                </div>
                <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-default)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>元画像</span>
                  <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>🔄 変更</button>
                </div>
              </div>
            )}
          </div>

          {/* Generate button card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-heading)", marginBottom: 4 }}>背景スタイル</div>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px",
                background: "var(--color-primary-50)",
                border: "1.5px solid var(--color-primary-500)",
                borderRadius: "var(--radius-md)",
              }}>
                <span style={{ fontSize: 20 }}>🌿</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-heading)" }}>北欧風リビング</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ライトオーク × ナチュラルホワイト</div>
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating}
              style={{ width: "100%", padding: "14px 20px", fontSize: 16 }}
            >
              {isGenerating
                ? <><span className="spinner" style={{ width: 17, height: 17 }} />生成中...</>
                : <>✨ 背景を生成する</>}
            </button>

            {error && (
              <div className="alert alert-error" style={{ marginTop: 14 }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span style={{ fontSize: 13 }}>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 生成結果 */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-heading)" }}>生成後</span>
              {generatedImage && <span className="badge badge-success">✓ 生成完了</span>}
            </div>
            <div className="img-panel" style={{ minHeight: 340 }}>
              {generatedImage ? (
                /* 右クリック・長押し保存禁止 */
                <img
                  src={generatedImage}
                  alt="生成後の画像"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none", pointerEvents: "none" }}
                />
              ) : (
                !isGenerating && (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 48 }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🎨</div>
                    <div style={{ fontSize: 15, lineHeight: 1.7 }}>
                      左の画像をアップロードし<br />「背景を生成する」を押してください
                    </div>
                  </div>
                )
              )}
              {isGenerating && (
                <div className="generating-overlay">
                  <span className="spinner" style={{ width: 40, height: 40 }} />
                  <span style={{ fontSize: 16, color: "var(--text-body)", fontWeight: 500 }}>背景を生成中...</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>30秒〜1分程度かかります</span>
                </div>
              )}
            </div>
          </div>

          {/* 品質チェックリスト（生成後のみ） */}
          {generatedImage && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-heading)" }}>品質チェックリスト</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>— 全項目確認後にダウンロード可能</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: allChecked ? "var(--color-success)" : "var(--color-primary-500)" }}>
                  {checkedCount} / {CHECKS.length}
                </span>
              </div>

              {/* プログレスバー */}
              <div style={{ padding: "12px 20px 0" }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* チェック項目 — label要素全体がクリック可能 */}
              <div style={{ paddingTop: 4, paddingBottom: 4 }}>
                {CHECKS.map((c, i) => (
                  <div key={c.id}>
                    {/* labelでinputとテキストを包む → テキストクリックでもチェック */}
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={!!checks[c.id]}
                        onChange={() => toggleCheck(c.id)}
                      />
                      <span className="checkbox-label">{c.label}</span>
                    </label>
                    {i < CHECKS.length - 1 && <div className="divider" />}
                  </div>
                ))}
              </div>

              {/* ダウンロードエリア */}
              <div style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                background: allChecked ? "var(--color-success-bg)" : "var(--bg-surface-2)",
                borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
                transition: "background var(--duration-slow)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                    background: allChecked ? "var(--color-success)" : "var(--border-strong)",
                    transition: "background var(--duration-slow)",
                  }} />
                  <span style={{ fontSize: 14, color: allChecked ? "var(--color-success)" : "var(--text-muted)" }}>
                    {allChecked ? "全項目確認済み — ダウンロードできます" : "すべての項目にチェックを入れてください"}
                  </span>
                </div>
                <button
                  className="btn-success"
                  onClick={handleDownload}
                  disabled={!allChecked}
                >
                  ⬇ ダウンロード
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
