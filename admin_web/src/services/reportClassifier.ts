// ─── 报表识别器 v3 — 直接用中文表头匹配 ───
import type { SheetRecognition } from '../types'

type Sig = {
  fileKeys: string[]; sheetKeys: string[]
  mustHeaders: string[]; bonusHeaders: string[]; rejectHeaders: string[]
}

const SIGS: Record<string, Sig> = {
  SP_Search_Term_Report: {
    fileKeys: ['商品推广','搜索词'], sheetKeys: ['搜索词'],
    mustHeaders: ['广告活动名称','客户搜索词','展示量','点击量','花费'],
    bonusHeaders: ['匹配类型','7天总销售额','7天总订单数','广告组名称','投放'],
    rejectHeaders: [],
  },
  SP_Targeting_Report: {
    fileKeys: ['商品推广','投放'], sheetKeys: ['投放'],
    mustHeaders: ['广告活动名称','投放','展示量','点击量','花费'],
    bonusHeaders: ['匹配类型','7天总销售额','广告组名称','搜索结果首页首位展示量份额'],
    rejectHeaders: ['客户搜索词','搜索词'],
  },
  SP_Campaign_Report: {
    fileKeys: ['商品推广','广告活动'], sheetKeys: ['广告活动'],
    mustHeaders: ['广告活动名称','展示量','点击量','花费','ACOS'],
    bonusHeaders: ['广告活动类型','预算','竞价策略','7天总销售额','状态'],
    rejectHeaders: ['搜索词','客户搜索词','广告组名称'],
  },
  SB_Search_Term_Report: {
    fileKeys: ['品牌推广','搜索词'], sheetKeys: ['搜索词'],
    mustHeaders: ['广告活动名称','客户搜索词','展示量','点击量','花费'],
    bonusHeaders: ['14天总销售额','14天总订单数','匹配类型','费用类型'],
    rejectHeaders: [],
  },
  SB_Keyword_Report: {
    fileKeys: ['品牌推广','关键词'], sheetKeys: ['关键词'],
    mustHeaders: ['广告活动名称','投放','展示量','点击量','花费'],
    bonusHeaders: ['匹配类型','14天总销售额','搜索结果首页首位展示量份额','5 秒观看次数'],
    rejectHeaders: ['广告位','placement','客户搜索词'],
  },
  SB_Keyword_Placement_Report: {
    fileKeys: ['品牌推广','广告位'], sheetKeys: ['广告位'],
    mustHeaders: ['广告活动名称','投放','展示量','点击量','花费'],
    bonusHeaders: ['匹配类型','投放类型','14天总销售额','14天总订单数'],
    rejectHeaders: [],
  },
  SB_Campaign_Report: {
    fileKeys: ['品牌推广','广告活动'], sheetKeys: ['广告活动'],
    mustHeaders: ['广告活动名称','展示量','点击量','花费'],
    bonusHeaders: ['费用类型','14天总销售额','可查看的展现量','5 秒观看次数'],
    rejectHeaders: ['搜索词','客户搜索词'],
  },
  Business_Report_Child: {
    fileKeys: ['业务报告','子体'], sheetKeys: ['子体'],
    mustHeaders: ['（子）ASIN','（父）ASIN','会话数'],
    bonusHeaders: ['标题','页面浏览量','转化率','已订购商品数量','退款率'],
    rejectHeaders: [],
  },
  Business_Report_Parent: {
    fileKeys: ['业务报告','父体'], sheetKeys: ['父体'],
    mustHeaders: ['（父）ASIN','会话数'],
    bonusHeaders: ['标题','页面浏览量','转化率','已订购商品数量'],
    rejectHeaders: ['（子）ASIN'],
  },
  ABA_Search_Query_Performance_Report: {
    fileKeys: ['搜索查询绩效','ABA','品牌分析'], sheetKeys: [],
    mustHeaders: ['搜索查询','搜索查询'],
    bonusHeaders: ['搜索查询得分','搜索查询量','展示量','点击量','加购','购买'],
    rejectHeaders: [],
  },
  ABA_Top_Search_Terms_Report: {
    fileKeys: ['热门搜索词','ABA','品牌分析'], sheetKeys: [],
    mustHeaders: ['搜索词','搜索频率排名'],
    bonusHeaders: ['点击份额','转化份额','商品标题','ASIN'],
    rejectHeaders: ['搜索查询绩效'],
  },
  ERP_Search_Term_Summary_Report: {
    fileKeys: ['广告搜索词汇总','搜索词汇总'], sheetKeys: ['搜索词汇总'],
    mustHeaders: ['用户搜索词','花费','曝光量','点击量'],
    bonusHeaders: ['订单数','销售额','ACOS','ROAS','CPC均价','CVR'],
    rejectHeaders: [],
  },
  SD_Report: {
    fileKeys: ['展示型推广','SD'], sheetKeys: [],
    mustHeaders: ['广告活动名称','展示量','点击量','花费'],
    bonusHeaders: ['受众','浏览再营销','购买再营销'],
    rejectHeaders: [],
  },
  Audience_AMC_Report: {
    fileKeys: ['受众','Audience','AMC','人群'], sheetKeys: [],
    mustHeaders: [],
    bonusHeaders: ['受众名称','人群包','曝光','点击','花费'],
    rejectHeaders: [],
  },
}

function cntHeaders(headers: string[], words: string[]): number {
  const txt = headers.map(h => h.replace(/\s+/g,'').toLowerCase()).join(' ')
  let n = 0
  for (const w of words) {
    if (txt.includes(w.replace(/\s+/g,'').toLowerCase())) n++
  }
  return n
}

function hasAny(txt: string, words: string[]): boolean {
  const t = txt.replace(/\s+/g,'').toLowerCase()
  return words.some(w => t.includes(w.replace(/\s+/g,'').toLowerCase()))
}

export function classifySheet(
  filename: string, sheetName: string, columns: string[]
): SheetRecognition {
  let bestType = 'UNKNOWN', bestScore = 0, bestReason = ''

  for (const [rtype, sig] of Object.entries(SIGS)) {
    let score = 0; const reasons: string[] = []

    // File name match (weight: 0.30)
    const fileHits = sig.fileKeys.filter(k => hasAny(filename, [k])).length
    if (fileHits > 0) { score += 0.30 * Math.min(fileHits / sig.fileKeys.length, 1); reasons.push(`文件名:${fileHits}个`) }

    // Sheet name match (weight: 0.25)
    const sheetHits = sig.sheetKeys.filter(k => hasAny(sheetName, [k])).length
    if (sheetHits > 0) { score += 0.25 * Math.min(sheetHits, 1); reasons.push(`Sheet:${sheetHits}个`) }

    // Must headers (weight: 0.30)
    if (sig.mustHeaders.length > 0) {
      const mustHits = cntHeaders(columns, sig.mustHeaders)
      const mustRatio = mustHits / sig.mustHeaders.length
      score += 0.30 * mustRatio
      reasons.push(`必须:${mustHits}/${sig.mustHeaders.length}`)
      if (mustRatio < 0.4) continue // skip if too few must headers
    }

    // Bonus headers (weight: 0.15)
    if (sig.bonusHeaders.length > 0) {
      const bonusHits = cntHeaders(columns, sig.bonusHeaders)
      score += 0.15 * Math.min(bonusHits / sig.bonusHeaders.length, 1)
      if (bonusHits > 0) reasons.push(`加分:${bonusHits}个`)
    }

    // Reject penalty
    if (sig.rejectHeaders.length > 0) {
      const rej = cntHeaders(columns, sig.rejectHeaders)
      if (rej > 0) { score -= 0.15 * rej; reasons.push(`排除:${rej}个`) }
    }

    if (score > bestScore) { bestScore = score; bestType = rtype; bestReason = reasons.join(' | ') }
  }

  return {
    sheetName,
    reportType: bestScore >= 0.30 ? bestType : 'UNKNOWN',
    confidence: Math.round(Math.min(bestScore, 0.98) * 100) / 100,
    matchedReason: bestReason || (bestScore < 0.30 ? `得分${(bestScore*100).toFixed(0)}%不足30%` : ''),
    rowCount: 0, asinCount: 0, campaignCount: 0, keywordCount: 0,
    columns,
    status: bestScore >= 0.30 ? 'recognized' : 'unrecognized',
  }
}

export function extractAsin(filename: string): string | null {
  const m = filename.match(/B0[A-Z0-9]{8}/)
  return m ? m[0] : null
}

export function extractDateRange(filename: string): { start?: string; end?: string } {
  const m = filename.match(/(\d{8})\s*[-_到]\s*(\d{8})/)
  if (m) return { start: m[1].slice(0,4)+'-'+m[1].slice(4,6)+'-'+m[1].slice(6,8), end: m[2].slice(0,4)+'-'+m[2].slice(4,6)+'-'+m[2].slice(6,8) }
  return {}
}
