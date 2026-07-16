"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>Ошибка загрузки</h1>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>Произошла ошибка. Попробуйте перезагрузить страницу.</p>
            <button
              onClick={reset}
              style={{ background: "#2D6A8F", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none", fontSize: "1rem", cursor: "pointer" }}
            >
              Перезагрузить
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
