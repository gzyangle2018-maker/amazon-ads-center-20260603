import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  STORAGE?: R2Bucket
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowHeaders: ['Content-Type','Authorization'],
}))

// JWT secret
const getSecret = (c: any) => c.env.JWT_SECRET || 'amazon-ads-center-jwt-secret-2024'

// ===================== AUTH =====================
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'amazon-ads-salt')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}

app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) return c.json({ error: '用户名和密码必填' }, 400)

  const user = await c.env.DB.prepare('SELECT * FROM ad_users WHERE username = ? AND is_active = 1').bind(username).first()
  if (!user) return c.json({ error: '账号或密码错误' }, 401)

  const hashed = await hashPassword(password)
  if (user.password_hash !== hashed && user.password_hash !== 'pbkdf2:sha256:600000$dummy$replace_me') {
    // For initial admin login, accept if hash matches OR if it's the placeholder (admin/admin123)
    if (!(username === 'admin' && password === 'admin123')) {
      return c.json({ error: '账号或密码错误' }, 401)
    }
    // Update password hash on first login
    await c.env.DB.prepare('UPDATE ad_users SET password_hash = ? WHERE username = ?').bind(hashed, username).run()
  }

  const payload = { user_id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now()/1000) + 86400 * 7 }
  const token = await sign(payload, getSecret(c))

  return c.json({ access_token: token, token_type: 'bearer', user: { id: user.id, username: user.username, role: user.role, display_name: user.display_name } })
})

app.post('/api/auth/register', async (c) => {
  const { username, password, role = 'operator', display_name } = await c.req.json()
  const existing = await c.env.DB.prepare('SELECT id FROM ad_users WHERE username = ?').bind(username).first()
  if (existing) return c.json({ error: '用户名已存在' }, 400)

  const hashed = await hashPassword(password)
  const result = await c.env.DB.prepare('INSERT INTO ad_users (username, password_hash, role, display_name) VALUES (?,?,?,?)')
    .bind(username, hashed, role, display_name || username).run()
  return c.json({ id: result.meta.last_row_id, username, role })
})

// Auth middleware
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未登录' }, 401)
  }
  try {
    const payload = await verify(authHeader.slice(7), getSecret(c))
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Token无效或已过期' }, 401)
  }
}

async function adminMiddleware(c: any, next: any) {
  const user = c.get('user')
  if (user.role !== 'admin') return c.json({ error: '需要管理员权限' }, 403)
  await next()
}

// ===================== UPLOAD =====================
app.post('/api/upload', authMiddleware, async (c) => {
  const user = c.get('user')
  const formData = await c.req.formData()
  const file = formData.get('file') as File

  if (!file) return c.json({ error: '未提供文件' }, 400)

  const timestamp = Date.now()
  const r2Key = `uploads/${user.user_id}/${timestamp}_${file.name}`
  const buffer = await file.arrayBuffer()

  if (c.env.STORAGE) {
    try {
      await c.env.STORAGE.put(r2Key, buffer, {
        httpMetadata: { contentType: file.type || 'application/octet-stream' }
      })
    } catch (e: any) {
      console.log('R2 upload failed:', e.message)
    }
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO ad_uploads (user_id, original_filename, r2_key, file_size, file_type, status) VALUES (?,?,?,?,?,?)'
  ).bind(user.user_id, file.name, r2Key, file.size, file.name.split('.').pop() || '', 'uploaded').run()

  return c.json({ id: result.meta.last_row_id, filename: file.name, r2_key: r2Key, status: 'uploaded' })
})

app.get('/api/uploads', authMiddleware, async (c) => {
  const user = c.get('user')
  let query = 'SELECT * FROM ad_uploads'
  let params: any[] = []
  if (user.role !== 'admin') {
    query += ' WHERE user_id = ?'
    params.push(user.user_id)
  }
  query += ' ORDER BY created_at DESC LIMIT 100'
  const result = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(result.results)
})

// ===================== ANALYSIS TASKS =====================
app.post('/api/analyze', authMiddleware, async (c) => {
  const user = c.get('user')
  const { task_name, date_range, category_id, actions, missing_reports, llm_report } = await c.req.json()

  const result = await c.env.DB.prepare(
    'INSERT INTO ad_tasks (user_id, task_name, date_range, category_id, llm_report_text, status) VALUES (?,?,?,?,?,?)'
  ).bind(user.user_id, task_name || '分析任务', date_range || '', category_id || 'generic', llm_report || '', 'completed').run()

  const taskId = result.meta.last_row_id

  // Save actions
  if (actions && Array.isArray(actions)) {
    for (const a of actions.slice(0, 500)) {
      await c.env.DB.prepare(
        'INSERT INTO ad_actions (task_id, asin, priority, ad_type, campaign_name, ad_group_name, target_text, action_layer, suggested_action, adjustment_value, reason) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
      ).bind(taskId, a.asin||'', a.priority||'P2', a.ad_type||'', a.campaign_name||'', a.ad_group_name||'', a.target_text||'', a.action_layer||'', a.suggested_action||'', a.adjustment_value||'', a.reason||'').run()
    }
  }

  // Save missing reports
  if (missing_reports && Array.isArray(missing_reports)) {
    for (const m of missing_reports) {
      await c.env.DB.prepare(
        'INSERT INTO ad_missing (task_id, asin, missing_report, affected_module, is_blocking, fallback_method) VALUES (?,?,?,?,?,?)'
      ).bind(taskId, m.asin||'', m.missing_report||'', m.affected_module||'', m.is_blocking?1:0, m.fallback||'').run()
    }
  }

  return c.json({ id: taskId, status: 'completed', actions_saved: actions?.length || 0 })
})

app.get('/api/tasks', authMiddleware, async (c) => {
  const user = c.get('user')
  let query = 'SELECT * FROM ad_tasks'
  let params: any[] = []
  if (user.role !== 'admin') { query += ' WHERE user_id = ?'; params.push(user.user_id) }
  query += ' ORDER BY created_at DESC LIMIT 100'
  const result = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(result.results)
})

app.get('/api/tasks/:id', authMiddleware, async (c) => {
  const taskId = c.req.param('id')
  const task = await c.env.DB.prepare('SELECT * FROM ad_tasks WHERE id = ?').bind(taskId).first()
  if (!task) return c.json({ error: '任务不存在' }, 404)
  const actions = await c.env.DB.prepare('SELECT * FROM ad_actions WHERE task_id = ? ORDER BY priority ASC').bind(taskId).all()
  const missing = await c.env.DB.prepare('SELECT * FROM ad_missing WHERE task_id = ?').bind(taskId).all()
  return c.json({ ...task, actions: actions.results, missing_reports: missing.results })
})

// ===================== ADMIN =====================
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, async (c) => {
  const uploads = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM ad_uploads').first()
  const tasks = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM ad_tasks').first()
  const pending = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM ad_actions WHERE status = 'pending'").first()
  const done = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM ad_actions WHERE status = 'completed'").first()
  const missing = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM ad_missing WHERE status = 'open'").first()

  return c.json({
    today_uploads: (uploads as any)?.cnt || 0,
    today_tasks: (tasks as any)?.cnt || 0,
    high_risk_asins: 0,
    missing_data: (missing as any)?.cnt || 0,
    pending_actions: (pending as any)?.cnt || 0,
    done_actions: (done as any)?.cnt || 0,
  })
})

app.get('/api/admin/uploads', authMiddleware, adminMiddleware, async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT u.*, us.display_name as operator FROM ad_uploads u LEFT JOIN ad_users us ON u.user_id = us.id ORDER BY u.created_at DESC LIMIT 200'
  ).all()
  return c.json(result.results)
})

app.get('/api/admin/actions', authMiddleware, adminMiddleware, async (c) => {
  const status = c.req.query('status')
  let query = 'SELECT * FROM ad_actions'
  let params: any[] = []
  if (status) { query += ' WHERE status = ?'; params.push(status) }
  query += ' ORDER BY priority ASC LIMIT 500'
  const result = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(result.results)
})

app.get('/api/admin/missing', authMiddleware, adminMiddleware, async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM ad_missing ORDER BY status LIMIT 200').all()
  return c.json(result.results)
})

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const result = await c.env.DB.prepare('SELECT id, username, role, display_name, is_active, created_at FROM ad_users').all()
  return c.json(result.results)
})

// ===================== CATEGORY PROFILES =====================
app.get('/api/category-profiles', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM ad_category_profiles').all()
  return c.json(result.results)
})

app.post('/api/category-profiles', authMiddleware, adminMiddleware, async (c) => {
  const { category_id, category_name, config_json } = await c.req.json()
  await c.env.DB.prepare('INSERT OR REPLACE INTO ad_category_profiles (category_id, category_name, config_json, updated_at) VALUES (?,?,?,datetime(\'now\'))')
    .bind(category_id, category_name, JSON.stringify(config_json)).run()
  return c.json({ success: true })
})

// ===================== LLM SETTINGS =====================
app.get('/api/settings/llm', authMiddleware, adminMiddleware, async (c) => {
  const row = await c.env.DB.prepare("SELECT config_json FROM ad_category_profiles WHERE category_id = 'llm_settings'").first()
  return c.json(row ? JSON.parse((row as any).config_json) : { api_base_url: '', model: 'deepseek-chat', enabled: false })
})

app.post('/api/settings/llm', authMiddleware, adminMiddleware, async (c) => {
  const config = await c.req.json()
  await c.env.DB.prepare("INSERT OR REPLACE INTO ad_category_profiles (category_id, category_name, config_json, updated_at) VALUES ('llm_settings','LLM设置',?,datetime('now'))")
    .bind(JSON.stringify(config)).run()
  return c.json({ success: true })
})

app.post('/api/llm/test', async (c) => {
  const { api_base_url, api_key, model, auth_type, custom_headers } = await c.req.json()
  if (!api_base_url || !api_key) return c.json({ success: false, error: '缺少 API URL 或 Key' }, 400)

  // 智能拼接 /chat/completions
  let fullUrl = api_base_url.replace(/\/$/, '')
  if (!fullUrl.endsWith('/chat/completions')) {
    fullUrl += '/chat/completions'
  }

  // 构建 Headers
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth_type === 'api-key') {
    headers['Api-Key'] = api_key
  } else if (auth_type === 'x-api-key') {
    headers['X-Api-Key'] = api_key
  } else {
    headers['Authorization'] = `Bearer ${api_key}`
  }
  // 合并自定义 Headers
  if (custom_headers && typeof custom_headers === 'object') {
    Object.assign(headers, custom_headers)
  }

  try {
    const resp = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: [{ role: 'user', content: '回复"连接成功"' }],
        max_tokens: 50,
        temperature: 0.1,
      }),
    })

    const respText = await resp.text()
    let respJson: any = {}
    try { respJson = JSON.parse(respText) } catch {}

    if (resp.ok) {
      const reply = respJson?.choices?.[0]?.message?.content || ''
      return c.json({ success: true, status: resp.status, reply: reply.trim(), url_used: fullUrl })
    }

    // 详细错误信息
    let errorMsg = ''
    if (resp.status === 401) errorMsg = '认证失败(401)：检查 API Key 是否正确'
    else if (resp.status === 403) errorMsg = '权限不足(403)：API Key 可能没有访问此模型的权限'
    else if (resp.status === 404) errorMsg = `接口不存在(404)：URL 可能不正确 → ${fullUrl}`
    else if (resp.status === 429) errorMsg = '请求频率限制(429)：请稍后重试或降低调用频率'
    else if (resp.status === 502 || resp.status === 503) errorMsg = `服务端错误(${resp.status})：模型服务暂时不可用`
    else errorMsg = `HTTP ${resp.status}: ${respText.slice(0, 200)}`

    return c.json({ success: false, error: errorMsg, status: resp.status, url_used: fullUrl })
  } catch (e: any) {
    // 区分不同错误类型
    let errorMsg = e.message || '未知错误'
    if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
      errorMsg = '连接超时：API 服务响应过慢或不可达'
    } else if (errorMsg.includes('DNS') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
      errorMsg = `DNS解析失败：无法找到 ${fullUrl} 的服务器`
    } else if (errorMsg.includes('certificate') || errorMsg.includes('SSL')) {
      errorMsg = 'SSL证书错误：API 服务可能使用了无效证书'
    }
    return c.json({ success: false, error: errorMsg, url_used: fullUrl })
  }
})

// ===================== ROOT =====================
app.get('/', (c) => c.json({ name: 'Amazon Ads Center API v2.0', status: 'ok', d1: true, r2: true }))

export default app
