import { useState, useRef, useCallback } from "react";
import Head from "next/head";

const PRESETS = [
  { key: "nordic", label: "北欧風リビング", icon: "🌿", desc: "ライトオーク×ホワイト" },
  { key: "natural", label: "ナチュラル系", icon: "🪵", desc: "和モダン×ウッドトーン" },
  { key: "modern", label: "モダン・シック", icon: "◼", desc: "ダーク×真鍮アクセント" },
  { key: "cafe", label: "カフェスタイル", icon: "☕", desc: "ヴィンテージ×インダストリアル" },
  { key: "outdoor", label: "テラス・屋外", icon: "🌳", desc: "木デッキ×グリーン" },
  { key: "white_studio", label: "ホワイトスタジオ", icon: "⬜", desc: "商品撮影×シームレス白背景" },
];

const CHECKS = [
  { id: "light", label: "光源の位置が自然である" },
  { id: "scale", label: "被写体同士のサイズ感が適切である" },
  { id: "props", label: "不自然な小物が存在していない" },
  { id: "shape", label: "商品の脚・取手など形状が変わっていない" },
  { id: "color", label: "商品の色味・素材感が変わっていない" },
];

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedMime, setUploadedMime] = useState("image/jpeg");
  const [selectedPreset, setSelectedPreset] = useState("nordic");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedMime, setGeneratedMime] = useState("image/jpeg");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [checks, setChecks] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const allChecked = CHECKS.every((c) => checks[c.id]);

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

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

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
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: uploadedMime,
          backgroundKey: selectedPreset,
        }),
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
    const ext = generatedMime.split("/")[1] || "jpg";
    a.download = `harmonic_bg_${selectedPreset}_${Date.now()}.${ext}`;
    a.click();
  };

  const toggleCheck = (id) => {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <Head>
        <title>Harmonic House — 背景差し替えツール</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Noto+Sans+JP:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f7f5f2;
          --surface: #ffffff;
          --surface2: #f0ede8;
          --border: #e2ddd6;
          --text-primary: #2c2820;
          --text-secondary: #7a7068;
          --accent: #8b6f47;
          --accent-light: #c4a882;
          --accent-bg: #f5efe6;
          --danger: #c0392b;
          --success: #4a7c59;
          --radius: 12px;
          --shadow: 0 2px 20px rgba(44,40,32,0.08);
          --shadow-hover: 0 8px 32px rgba(44,40,32,0.14);
        }

        body {
          font-family: 'Noto Sans JP', sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
          font-weight: 300;
        }

        .header {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0 40px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 0 var(--border);
        }

        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 22px;
          letter-spacing: 0.05em;
          color: var(--text-primary);
        }

        .logo span {
          color: var(--accent);
        }

        .badge {
          font-size: 11px;
          font-weight: 400;
          color: var(--text-secondary);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 40px 80px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 16px;
        }

        /* STEP 1 - Upload */
        .upload-area {
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .upload-area:hover, .upload-area.dragging {
          border-color: var(--accent-light);
          background: var(--accent-bg);
        }
        .upload-area input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }
        .upload-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .upload-text {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .upload-text strong {
          color: var(--accent);
          font-weight: 500;
        }

        /* STEP 2 - Presets */
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media(max-width: 700px) { .preset-grid { grid-template-columns: repeat(2,1fr); } }

        .preset-card {
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          cursor: pointer;
          background: var(--surface);
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .preset-card:hover {
          border-color: var(--accent-light);
          box-shadow: var(--shadow);
          transform: translateY(-1px);
        }
        .preset-card.active {
          border-color: var(--accent);
          background: var(--accent-bg);
          box-shadow: 0 0 0 3px rgba(139,111,71,0.12);
        }
        .preset-icon {
          font-size: 22px;
          line-height: 1;
          flex-shrink: 0;
        }
        .preset-info { flex: 1; min-width: 0; }
        .preset-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .preset-desc {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        /* Generate button */
        .btn-generate {
          width: 100%;
          padding: 16px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: var(--radius);
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 15px;
          font-weight: 400;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }
        .btn-generate:hover:not(:disabled) {
          background: #7a5f3a;
          box-shadow: var(--shadow-hover);
          transform: translateY(-1px);
        }
        .btn-generate:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* Preview panels */
        .preview-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 40px;
        }
        @media(max-width: 800px) { .preview-row { grid-template-columns: 1fr; } }

        .panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
        }
        .panel-header {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface2);
        }
        .panel-title {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .panel-body {
          padding: 0;
          aspect-ratio: 4/3;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9f8f6;
          position: relative;
          overflow: hidden;
        }
        .panel-body img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .panel-empty {
          text-align: center;
          color: var(--text-secondary);
          padding: 40px;
        }
        .panel-empty-icon { font-size: 40px; margin-bottom: 10px; }
        .panel-empty-text { font-size: 13px; line-height: 1.7; }

        /* Generating overlay */
        .generating-overlay {
          position: absolute;
          inset: 0;
          background: rgba(247,245,242,0.92);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 2.5px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .generating-text {
          font-size: 13px;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        /* Error */
        .error-box {
          margin-top: 16px;
          padding: 14px 16px;
          background: #fdf2f0;
          border: 1px solid #f0c0b8;
          border-radius: 8px;
          font-size: 13px;
          color: var(--danger);
          line-height: 1.6;
        }

        /* QC Checklist */
        .checklist-section {
          margin-top: 32px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
        }
        .checklist-header {
          padding: 16px 24px;
          background: var(--surface2);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .checklist-header-icon { font-size: 16px; }
        .checklist-header-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .checklist-sub {
          font-size: 11px;
          color: var(--text-secondary);
          margin-left: auto;
        }
        .checklist-items {
          padding: 8px 0;
        }
        .check-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 24px;
          cursor: pointer;
          transition: background 0.15s;
          user-select: none;
        }
        .check-item:hover { background: var(--accent-bg); }
        .check-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--accent);
          flex-shrink: 0;
        }
        .check-label {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .checklist-divider {
          height: 1px;
          background: var(--border);
          margin: 0 24px;
        }

        /* Download */
        .download-section {
          padding: 20px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .download-status {
          font-size: 13px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .download-status .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--border);
          transition: background 0.3s;
        }
        .download-status .dot.ready { background: var(--success); }

        .btn-download {
          padding: 12px 28px;
          background: var(--success);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        .btn-download:hover:not(:disabled) {
          background: #3d6b4a;
          box-shadow: 0 4px 16px rgba(74,124,89,0.3);
          transform: translateY(-1px);
        }
        .btn-download:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* Layout */
        .controls-col {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 32px;
          align-items: start;
        }
        @media(max-width: 1000px) { .layout { grid-template-columns: 1fr; } }

        .step-block {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .checklist-progress {
          font-size: 12px;
          font-weight: 500;
          color: var(--accent);
        }
      `}</style>

      <header className="header">
        <div className="logo">
          Harmonic <span>House</span>
        </div>
        <span className="badge">背景差し替えツール</span>
      </header>

      <main className="main">
        <div className="layout">
          {/* Left column: controls */}
          <div className="controls-col">
            {/* Step 1 */}
            <div className="step-block">
              <p className="section-title">Step 1 — 画像をアップロード</p>
              <div
                className={`upload-area${isDragging ? " dragging" : ""}`}
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
                <div className="upload-icon">
                  {uploadedImage ? "✅" : "📷"}
                </div>
                <div className="upload-text">
                  {uploadedImage ? (
                    <>
                      <strong>画像を変更するにはクリック</strong>
                      <br />またはここにドラッグ
                    </>
                  ) : (
                    <>
                      <strong>クリックまたはドラッグ</strong>で<br />
                      商品画像をアップロード
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-block">
              <p className="section-title">Step 2 — 背景スタイルを選択</p>
              <div className="preset-grid">
                {PRESETS.map((p) => (
                  <div
                    key={p.key}
                    className={`preset-card${selectedPreset === p.key ? " active" : ""}`}
                    onClick={() => setSelectedPreset(p.key)}
                  >
                    <span className="preset-icon">{p.icon}</span>
                    <div className="preset-info">
                      <div className="preset-name">{p.label}</div>
                      <div className="preset-desc">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-generate"
                onClick={handleGenerate}
                disabled={!uploadedImage || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    生成中...
                  </>
                ) : (
                  <>✨ 背景を生成する</>
                )}
              </button>

              {error && (
                <div className="error-box">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>

          {/* Right column: preview */}
          <div>
            <div className="preview-row" style={{ marginTop: 0 }}>
              {/* Original */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">元画像</span>
                </div>
                <div className="panel-body">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="アップロード画像" />
                  ) : (
                    <div className="panel-empty">
                      <div className="panel-empty-icon">🖼️</div>
                      <div className="panel-empty-text">
                        画像をアップロード<br />すると表示されます
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated */}
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">生成後</span>
                  {generatedImage && (
                    <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 500 }}>
                      ✓ 生成完了
                    </span>
                  )}
                </div>
                <div className="panel-body">
                  {generatedImage ? (
                    <img src={generatedImage} alt="生成後の画像" />
                  ) : (
                    <div className="panel-empty">
                      <div className="panel-empty-icon">
                        {isGenerating ? "" : "🎨"}
                      </div>
                      <div className="panel-empty-text">
                        {isGenerating
                          ? ""
                          : "背景を生成すると\nここに表示されます"}
                      </div>
                    </div>
                  )}
                  {isGenerating && (
                    <div className="generating-overlay">
                      <div className="spinner" />
                      <div className="generating-text">背景を生成中です...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QC Checklist */}
            {generatedImage && (
              <div className="checklist-section">
                <div className="checklist-header">
                  <span className="checklist-header-icon">🔍</span>
                  <span className="checklist-header-text">品質チェックリスト</span>
                  <span className="checklist-sub checklist-progress">
                    {Object.values(checks).filter(Boolean).length} / {CHECKS.length} 完了
                  </span>
                </div>
                <div className="checklist-items">
                  {CHECKS.map((c, i) => (
                    <div key={c.id}>
                      <label className="check-item" onClick={() => toggleCheck(c.id)}>
                        <input
                          type="checkbox"
                          checked={!!checks[c.id]}
                          onChange={() => toggleCheck(c.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="check-label">{c.label}</span>
                      </label>
                      {i < CHECKS.length - 1 && <div className="checklist-divider" />}
                    </div>
                  ))}
                </div>
                <div className="download-section">
                  <div className="download-status">
                    <div className={`dot${allChecked ? " ready" : ""}`} />
                    {allChecked
                      ? "全項目確認済み — ダウンロード可能です"
                      : "すべての項目にチェックを入れてください"}
                  </div>
                  <button
                    className="btn-download"
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
      </main>
    </>
  );
}
