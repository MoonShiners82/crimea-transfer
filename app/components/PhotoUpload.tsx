"use client"

import { useState, useRef } from "react"

type PhotoUploadProps = {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  round?: boolean
}

export default function PhotoUpload({ label, value, onChange, round = false }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError("")
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok) {
        onChange(data.url)
      } else {
        setError(data.error || "Ошибка загрузки")
      }
    } catch {
      setError("Ошибка сервера")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[#1A2332] mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ""
          }}
        />
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt={label}
              className={`w-20 h-20 object-cover border border-[#B8D4E3] ${round ? "rounded-full" : "rounded-lg"}`}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`w-20 h-20 border-2 border-dashed border-[#B8D4E3] flex flex-col items-center justify-center text-[#8B7355] hover:border-[#2D6A8F] hover:text-[#2D6A8F] transition ${round ? "rounded-full" : "rounded-lg"} disabled:opacity-50`}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#2D6A8F] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">Загрузить</span>
              </>
            )}
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-[#2D6A8F] underline hover:text-[#1A2332] disabled:opacity-50"
          >
            Заменить
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
