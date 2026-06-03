export interface Campaign {
  id: string
  name: string
  status: 'enabled' | 'paused' | 'archived'
  budget: number
  spent: number
  impressions: number
  clicks: number
  orders: number
  sales: number
  acos: number
  roas: number
  startDate: string
  targeting: 'auto' | 'manual'
}

const CAMPAIGN_NAMES = [
  'US - 蓝牙耳机 Pro',
  'US - 手机支架 360',
  'US - 充电器快充套装',
  'UK - 智能手表表带',
  'DE - LED 台灯',
  'US - 瑜伽垫防滑',
  'JP - 厨房收纳盒',
  'US - 车载手机支架',
  'US - 无线键盘鼠标',
  'CA - 保温杯不锈钢',
]

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function generateCampaigns(): Campaign[] {
  return CAMPAIGN_NAMES.map((name, i) => {
    const budget = rand(500, 5000)
    const spent = rand(budget * 0.3, budget * 0.95)
    const impressions = Math.round(rand(5000, 200000))
    const ctr = rand(0.2, 2.5) / 100
    const clicks = Math.round(impressions * ctr)
    const orders = Math.round(clicks * rand(0.03, 0.15))
    const sales = orders * rand(15, 60)
    const acos = sales > 0 ? (spent / sales) * 100 : 0

    return {
      id: `camp-${String(i + 1).padStart(3, '0')}`,
      name,
      status: (['enabled', 'enabled', 'enabled', 'paused', 'archived'] as const)[i % 5],
      budget: Math.round(budget * 100) / 100,
      spent: Math.round(spent * 100) / 100,
      impressions,
      clicks,
      orders,
      sales: Math.round(sales * 100) / 100,
      acos: Math.round(acos * 100) / 100,
      roas: spent > 0 ? Math.round((sales / spent) * 100) / 100 : 0,
      startDate: `2024-${String(rand(1, 12)).padStart(2, '0')}-${String(Math.round(rand(1, 28))).padStart(2, '0')}`,
      targeting: (['auto', 'manual'] as const)[i % 2],
    }
  })
}

function generateDailyTrend() {
  const data = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const spend = rand(200, 800)
    const sales = rand(spend * 0.5, spend * 5)
    const impressions = Math.round(rand(3000, 15000))
    const clicks = Math.round(impressions * rand(0.003, 0.02))

    data.push({
      date: dateStr,
      spend: Math.round(spend * 100) / 100,
      sales: Math.round(sales * 100) / 100,
      impressions,
      clicks,
    })
  }
  return data
}

let campaigns = generateCampaigns()
const dailyTrend = generateDailyTrend()

export function getDashboardData() {
  const totalSpend = campaigns.reduce((s, c) => s + c.spent, 0)
  const totalSales = campaigns.reduce((s, c) => s + c.sales, 0)
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0)

  return {
    summary: {
      impressions: totalImpressions,
      clicks: totalClicks,
      spend: Math.round(totalSpend * 100) / 100,
      sales: Math.round(totalSales * 100) / 100,
      acos: totalSales > 0 ? Math.round((totalSpend / totalSales) * 10000) / 100 : 0,
      roas: totalSpend > 0 ? Math.round((totalSales / totalSpend) * 100) / 100 : 0,
      ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      cpc: totalClicks > 0 ? Math.round((totalSpend / totalClicks) * 100) / 100 : 0,
      orders: totalOrders,
    },
    dailyTrend,
    campaigns,
  }
}

export function getCampaigns() {
  return campaigns
}

export function updateCampaignStatus(
  id: string,
  status: 'enabled' | 'paused' | 'archived'
): Campaign | null {
  const campaign = campaigns.find((c) => c.id === id)
  if (!campaign) return null
  campaign.status = status
  return campaign
}
