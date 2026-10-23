"use client";

/** กรณี root layout พัง (ไม่มี CSS/ฟอนต์) — ใช้ inline style ล้วน */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070708", color: "#F3EBD8", fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <div style={{ textAlign: "center", border: "2px solid #E2B857", borderRadius: 32, padding: "40px 28px", maxWidth: 420 }}>
          <div style={{ letterSpacing: "0.35em", fontSize: 12, color: "#E2B857", fontWeight: 700 }}>ROYAL CASINO</div>
          <h1 style={{ fontSize: 22, margin: "12px 0 8px" }}>ระบบขัดข้องชั่วคราว</h1>
          <p style={{ color: "#C9BC9F", fontSize: 14, lineHeight: 1.7 }}>กรุณาลองใหม่อีกครั้งในอีกสักครู่</p>
          <button onClick={reset} style={{ marginTop: 16, height: 48, padding: "0 28px", borderRadius: 999, border: 0, background: "linear-gradient(135deg,#8A6A2B,#FFF1BF 28%,#E2B857 50%,#FFF1BF 72%,#8A6A2B)", color: "#1A1206", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
            ลองใหม่
          </button>
        </div>
      </body>
    </html>
  );
}
