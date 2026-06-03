// ─── 颜色主题系统 ───
import { useState, useEffect } from 'react'

export type ThemeName = 'slate' | 'amber' | 'emerald' | 'blue' | 'rose' | 'violet'

const THEMES: Record<ThemeName, { name: string; accent: string; accentRgb: string }> = {
  slate:  { name: ' Slate', accent: '#94A3B8', accentRgb: '148 163 184' },
  amber:  { name: ' Amber', accent: '#F59E0B', accentRgb: '245 158 11' },
  emerald:{ name: ' Emerald', accent: '#10B981', accentRgb: '16 185 129' },
  blue:   { name: ' Blue', accent: '#3B82F6', accentRgb: '59 130 246' },
  rose:   { name: ' Rose', accent: '#F43F5E', accentRgb: '244 63 94' },
  violet: { name: ' Violet', accent: '#8B5CF6', accentRgb: '139 92 246' },
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(() =>
    (localStorage.getItem('ad_theme') as ThemeName) || 'amber'
  )

  useEffect(() => {
    const t = THEMES[theme]
    document.documentElement.style.setProperty('--color-accent', t.accentRgb)
    localStorage.setItem('ad_theme', theme)
  }, [theme])

  return { theme, setTheme, themes: THEMES }
}

export function ThemePicker({ theme, setTheme, themes }: ReturnType<typeof useTheme>) {
  return (
    <div className="flex items-center gap-1.5">
      {(Object.entries(themes) as [ThemeName, typeof THEMES['amber']][]).map(([key, t]) => (
        <button key={key} onClick={() => setTheme(key)}
          title={t.name}
          className={`w-6 h-6 rounded-full border-2 transition-all ${
            theme === key ? 'border-white scale-110' : 'border-transparent hover:scale-105'
          }`}
          style={{ background: t.accent }}
        />
      ))}
    </div>
  )
}
