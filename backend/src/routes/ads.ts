import { Hono } from 'hono'
import {
  getDashboardData,
  getCampaigns,
  updateCampaignStatus,
} from '../data'

const ads = new Hono()

// CORS headers
ads.use('*', async (c, next) => {
  await next()
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
})

ads.options('*', (c) => {
  return c.text('OK', 204)
})

// GET /api/dashboard
ads.get('/dashboard', (c) => {
  const data = getDashboardData()
  return c.json(data)
})

// GET /api/campaigns
ads.get('/campaigns', (c) => {
  const data = getCampaigns()
  return c.json(data)
})

// PATCH /api/campaigns/:id/status
ads.patch('/campaigns/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status: 'enabled' | 'paused' | 'archived' }>()
  const updated = updateCampaignStatus(id, body.status)
  if (!updated) {
    return c.json({ error: 'Campaign not found' }, 404)
  }
  return c.json(updated)
})

export default ads
