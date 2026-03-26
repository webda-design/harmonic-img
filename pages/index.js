import { useState, useRef, useCallback } from "react";
import Head from "next/head";

const PRESETS = [
  { key: "nordic",       label: "北欧風リビング",   icon: "🌿", desc: "ライトオーク × ホワイト" },
  { key: "natural",      label: "ナチュラル系",     icon: "🪵", desc: "和モダン × ウッドトーン" },
  { key: "modern",       label: "モダン・シック",   icon: "◼",  desc: "ダーク × 真鍮アクセント" },
  { key: "cafe",         label: "カフェスタイル",   icon: "☕", desc: "ヴィンテージ × インダストリアル" },
  { key: "outdoor",      label: "テラス・屋外",     icon: "🌳", desc: "木デッキ × グリーン" },
  { key: "white_studio", label: "ホワイトスタジオ", icon: "⬜", desc: "商品撮影 × シームレス白" },
];

const CHECKS = [
  { id: "light",  label: "光源の位置が自然である" },
  { id: "scale",  label: "被写体同士のサイズ感が適切である" },
  { id: "props",  label: "不自然な小物が存在していない" },
  { id: "shape",  label: "商品の脚・取手など形状が変わっていない" },
  { id: "color",  label: "商品の色味・素材感が変わっていない" },
];

export default function Home() {
  const [uploadedImage, setUploadedImage]   = useState(null);
  const [uploadedMime,  setUploadedMime]    = useState("image/jpeg");
  const [selectedPreset, setSelectedPreset] = useState("nordic");
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
        body: JSON.stringify({ imageBase64: base64, mimeType: uploadedMime, backgroundKey: selectedPreset }),
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
    a.download = `harmonic_${selectedPreset}_${Date.now()}.${ext}`;
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Noto+Sans+JP:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Header */}
      <header style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-default)",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 30,
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text-heading)", letterSpacing: "-0.01em" }}>
            Harmonic House
          </span>
          <span className="badge badge-muted">背景差し替えツール</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em" }}>社内限定ツール</span>
      </header>

      {/* Page layout */}
      <div className="page-layout">

        {/* Left: controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Step 1 */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Step 1</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>商品画像をアップロード</span>
            </div>
            <div style={{ padding: 16 }}>
              <div
                className={`upload-zone${isDragging ? " dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <div style={{ fontSize: 28, marginBottom: 8 }}>{uploadedImage ? "✅" : "📷"}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {uploadedImage
                    ? <><strong style={{ color: "var(--color-primary-600)" }}>クリックで変更</strong> またはドラッグ</>
                    : <><strong style={{ color: "var(--color-primary-600)" }}>クリック</strong> またはドラッグ&ドロップ</>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>JPG / PNG / WEBP</div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Step 2</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>背景スタイルを選択</span>
            </div>
            <div style={{ padding: 16 }}>
              <div className="preset-grid">
                {PRESETS.map((p) => (
                  <div
                    key={p.key}
                    className={`preset-card${selectedPreset === p.key ? " active" : ""}`}
                    onClick={() => setSelectedPreset(p.key)}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-heading)" }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={!uploadedImage || isGenerating}
                style={{ width: "100%", marginTop: 16, padding: "12px 20px" }}
              >
                {isGenerating
                  ? <><span className="spinner" style={{ width: 15, height: 15 }} />生成中...</>
                  : <>✨ 背景を生成する</>}
              </button>

              {error && (
                <div className="alert alert-error" style={{ marginTop: 12 }}>
                  <span style={{ flexShrink: 0 }}>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: preview + checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Preview */}
          <div className="preview-grid">
            <div className="card">
              <div className="card-header">
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>元画像</span>
              </div>
              <div className="img-panel">
                {uploadedImage
                  ? <img src={uploadedImage} alt="元画像" />
                  : <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                      <div style={{ fontSize: 12, lineHeight: 1.7 }}>画像をアップロード<br />すると表示されます</div>
                    </div>}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>生成後</span>
                {generatedImage && <span className="badge badge-success">完了</span>}
              </div>
              <div className="img-panel">
                {generatedImage
                  ? <img src={generatedImage} alt="生成後" />
                  : !isGenerating && (
                      <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎨</div>
                        <div style={{ fontSize: 12, lineHeight: 1.7 }}>背景を生成すると<br />ここに表示されます</div>
                      </div>
                    )}
                {isGenerating && (
                  <div className="generating-overlay">
                    <span className="spinner" style={{ width: 32, height: 32 }} />
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>背景を生成中...</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>しばらくお待ちください</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checklist */}
          {generatedImage && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🔍</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-heading)" }}>品質チェックリスト</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>すべて確認後にダウンロード可能</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: allChecked ? "var(--color-success)" : "var(--color-primary-500)" }}>
                  {checkedCount} / {CHECKS.length}
                </span>
              </div>

              <div style={{ padding: "10px 20px 0" }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div style={{ paddingTop: 4, paddingBottom: 4 }}>
                {CHECKS.map((c, i) => (
                  <div key={c.id}>
                    <label className="checkbox-item" onClick={() => toggleCheck(c.id)}>
                      <input
                        type="checkbox"
                        checked={!!checks[c.id]}
                        onChange={() => toggleCheck(c.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="checkbox-label">{c.label}</span>
                    </label>
                    {i < CHECKS.length - 1 && <div className="divider" />}
                  </div>
                ))}
              </div>

              <div style={{
                padding: "14px 20px",
                borderTop: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                background: allChecked ? "var(--color-success-bg)" : "var(--bg-surface-2)",
                borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
                transition: "background var(--duration-slow)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: allChecked ? "var(--color-success)" : "var(--border-strong)",
                    transition: "background var(--duration-slow)",
                  }} />
                  <span style={{ fontSize: 13, color: allChecked ? "var(--color-success)" : "var(--text-muted)" }}>
                    {allChecked ? "全項目確認済み — ダウンロードできます" : "すべての項目にチェックを入れてください"}
                  </span>
                </div>
                <button
                  className="btn-success"
                  onClick={handleDownload}
                  disabled={!allChecked}
                  style={{ padding: "9px 18px", fontSize: 13 }}
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
