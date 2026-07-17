"use client"

import { useState, useEffect, useRef } from "react"

type CarData = {
  makes: string[]
  models: { make: string; model: string }[]
}

type CarSelectorProps = {
  value: string
  onChange: (value: string) => void
}

export default function CarSelector({ value, onChange }: CarSelectorProps) {
  const [makes, setMakes] = useState<string[]>([])
  const [selectedMake, setSelectedMake] = useState("")
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [year, setYear] = useState("")
  const [color, setColor] = useState("")
  const [search, setSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/cars")
      .then(r => r.json())
      .then((data: CarData) => {
        setMakes(data.makes || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (value) {
      const parts = value.split(", ").map(s => s.trim())
      setSelectedMake(parts[0] || "")
      setSelectedModel(parts[1] || "")
      setYear(parts[2] || "")
      setColor(parts[3] || "")
    } else {
      setSelectedMake("")
      setSelectedModel("")
      setYear("")
      setColor("")
    }
    setSearch("")
  }, [value])

  useEffect(() => {
    if (selectedMake) {
      fetch(`/api/cars?q=${encodeURIComponent(selectedMake)}`)
        .then(r => r.json())
        .then((data: CarData) => {
          if (data.models?.length) {
            setModels(data.models.filter((m: { make: string }) => m.make === selectedMake).map((m: { model: string }) => m.model))
          }
        })
    } else {
      setModels([])
    }
  }, [selectedMake])

  const buildCarInfo = (make: string, model: string, yr: string, clr: string) => {
    const parts = [make, model, yr, clr].filter(Boolean)
    return parts.join(", ")
  }

  const handleMakeSelect = (make: string) => {
    setSelectedMake(make)
    setSelectedModel("")
    setSearch("")
    setShowDropdown(false)
    onChange(buildCarInfo(make, selectedModel, year, color))
  }

  const handleModelSelect = (model: string) => {
    setSelectedModel(model)
    setSearch("")
    setShowDropdown(false)
    onChange(buildCarInfo(selectedMake, model, year, color))
  }

  const handleYearChange = (yr: string) => {
    setYear(yr)
    onChange(buildCarInfo(selectedMake, selectedModel, yr, color))
  }

  const handleColorChange = (clr: string) => {
    setColor(clr)
    onChange(buildCarInfo(selectedMake, selectedModel, year, clr))
  }

  const filteredMakes = makes.filter(m => m.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[#1A2332] mb-1">Марка автомобиля *</label>
        <div className="relative" ref={dropdownRef}>
          <input
            type="text"
            value={selectedMake || search}
            onChange={e => {
              setSearch(e.target.value)
              setSelectedMake("")
              setSelectedModel("")
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Начните вводить марку..."
            className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white"
          />
          {showDropdown && !selectedMake && filteredMakes.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-[#B8D4E3] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredMakes.slice(0, 20).map(make => (
                <button key={make} type="button"
                  onClick={() => handleMakeSelect(make)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F0EB] transition">
                  {make}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedMake && models.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#1A2332] mb-1">Модель *</label>
          <select value={selectedModel} onChange={e => { handleModelSelect(e.target.value) }}
            className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white">
            <option value="">Выберите модель</option>
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      )}

      {selectedMake && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#1A2332] mb-1">Год <span className="text-[#8B7355]">(необязательно)</span></label>
            <input type="number" min="1990" max={new Date().getFullYear() + 1} value={year}
              onChange={e => handleYearChange(e.target.value)} placeholder="2020"
              className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A2332] mb-1">Цвет <span className="text-[#8B7355]">(необязательно)</span></label>
            <input type="text" value={color} onChange={e => handleColorChange(e.target.value)} placeholder="Белый"
              className="w-full px-4 py-3 border border-[#B8D4E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A8F] bg-white" />
          </div>
        </div>
      )}

      {value && (
        <div className="bg-[#F5F0EB] p-3 rounded-lg text-sm">
          <span className="text-[#8B7355]">Выбрано: </span>
          <span className="font-medium text-[#1A2332]">{value}</span>
        </div>
      )}

      <p className="text-xs text-[#8B7355]">Или введите вручную: <button type="button" onClick={() => { setSelectedMake(""); setSelectedModel(""); setSearch(""); onChange("") }}
        className="text-[#2D6A8F] underline">свободный ввод</button></p>
    </div>
  )
}
