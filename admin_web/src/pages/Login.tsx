import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ChartBar } from '@phosphor-icons/react'

const SCENES = ['yosemite','grand-canyon','yellowstone','zion','mountain-lake','pacific-coast','monument-valley','glacier','grand-tetons','rocky-mountains','oregon-coast','autumn-forest','desert-sunset','lake-tahoe','smoky-mountains','arches']

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [bgIdx, setBgIdx] = useState(() => Math.floor(Math.random() * SCENES.length))
  const [fading, setFading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 100) }, [])

  useEffect(() => {
    const t = setInterval(() => { setFading(true); setTimeout(() => { setBgIdx(i => (i+1) % SCENES.length); setFading(false) }, 1000) }, 12000)
    return () => clearInterval(t)
  }, [])

  const bgUrl = `https://source.unsplash.com/featured/?${SCENES[bgIdx]},nature,america`

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { setError('请输入账号和密码'); return }
    setLoading(true); setError('')
    try {
      const resp = await fetch('https://amazon-ads-center-api.gzyangle2018.workers.dev/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
      })
      const data = await resp.json()
      if (data.access_token) { localStorage.setItem('token', data.access_token); localStorage.setItem('user', JSON.stringify(data.user)); navigate('/') }
      else setError(data.error || data.detail || '登录失败')
    } catch { setError('网络错误') } finally { setLoading(false) }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      {/* Background with crossfade */}
      <div className={`absolute inset-0 bg-cover bg-center transition-all duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${fading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
        style={{ backgroundImage: `url(${bgUrl})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />

      {/* Content */}
      <div className={`relative z-10 w-full max-w-md mx-4 transition-all duration-[1000ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Double-Bezel card */}
        <div className="rounded-[2.5rem] p-[2px] bg-gradient-to-b from-white/20 to-white/5 shadow-2xl">
          <div className="rounded-[calc(2.5rem-2px)] p-8 sm:p-10"
            style={{ background: 'rgba(20,20,30,0.7)', backdropFilter: 'blur(60px) saturate(200%)', WebkitBackdropFilter: 'blur(60px) saturate(200%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)' }}>

            {/* Logo */}
            <div className="text-center mb-10">
              <div className="inline-flex mx-auto mb-6 h-[72px] w-[72px] items-center justify-center rounded-[1.75rem]"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.6), rgba(249,115,22,0.2))', boxShadow: '0 8px 32px rgba(249,115,22,0.3), inset 0 1px 1px rgba(255,255,255,0.2)' }}>
                <ChartBar className="h-8 w-8 text-white" weight="fill" />
              </div>
              <h1 className="text-[28px] font-bold tracking-[-0.02em] text-white" style={{ fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Amazon Ads Center</h1>
              <p className="text-sm text-white/40 mt-2 tracking-wide">广告执行中枢</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-3.5 text-sm text-red-300" style={{ backdropFilter: 'blur(20px)' }}>{error}</div>}
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-2 ml-2 uppercase tracking-widest">Account</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] px-5 py-3.5 text-[15px] text-white placeholder-white/20 focus:border-white/30 focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
                  placeholder="输入账号" autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-2 ml-2 uppercase tracking-widest">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.08] px-5 py-3.5 text-[15px] text-white placeholder-white/20 focus:border-white/30 focus:outline-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
                  placeholder="输入密码" />
              </div>
              {/* Button-in-Button */}
              <button type="submit" disabled={loading} className="group w-full rounded-2xl py-4 text-[15px] font-semibold text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 mt-2 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.8), rgba(249,115,22,0.4))', boxShadow: '0 4px 24px rgba(249,115,22,0.3), inset 0 1px 1px rgba(255,255,255,0.2)' }}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '登 录'}
                </span>
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/20 mt-8 tracking-wider">Amazon Ads Center v2.0 · 仅限授权用户</p>
        <p className="text-center text-[10px] text-white/15 mt-1">Designed by Leo Young in Shenzhen, China</p>
      </div>

      {/* Scene dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
        {Array.from({length:6}).map((_,i) => (
          <div key={i} className={`rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${i === bgIdx % 6 ? 'bg-white/80 w-5 h-1.5' : 'bg-white/20 w-1.5 h-1.5'}`} />
        ))}
      </div>
    </div>
  )
}
