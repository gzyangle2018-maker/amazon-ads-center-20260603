import type { CategoryProfile } from '../types'
import generic from '../config/category_profiles/generic.json'
import electronics from '../config/category_profiles/electronics.json'
import homeKitchen from '../config/category_profiles/home_kitchen.json'
import beauty from '../config/category_profiles/beauty.json'
import apparel from '../config/category_profiles/apparel.json'
import pet from '../config/category_profiles/pet.json'
import toy from '../config/category_profiles/toy.json'
import autoParts from '../config/category_profiles/auto_parts.json'
import office from '../config/category_profiles/office.json'
import custom from '../config/category_profiles/custom.json'

const profilesMap: Record<string, CategoryProfile> = {
  generic: generic as CategoryProfile,
  electronics: electronics as CategoryProfile,
  home_kitchen: homeKitchen as CategoryProfile,
  beauty: beauty as CategoryProfile,
  apparel: apparel as CategoryProfile,
  pet: pet as CategoryProfile,
  toy: toy as CategoryProfile,
  auto_parts: autoParts as CategoryProfile,
  office: office as CategoryProfile,
  custom: custom as CategoryProfile,
}

export function getProfile(id: string): CategoryProfile {
  return profilesMap[id] || profilesMap['generic']
}

export function getAllProfiles(): CategoryProfile[] {
  return Object.values(profilesMap)
}

export function classifyTermIntent(term: string, profile: CategoryProfile): string {
  const t = term.toLowerCase().trim()
  if (!t) return '未识别词'
  if (new RegExp(profile.asin_regex).test(t)) return 'ASIN投放'
  if (profile.b2b_roots.some(r => t.includes(r.toLowerCase()))) return 'B2B/批量采购词'
  if (profile.brand_competitor_roots.some(r => t.includes(r.toLowerCase()))) return '品牌/竞品词'
  if (t.length <= 5 && !t.includes(' ')) return '防守词'
  if (profile.pain_value_roots.some(r => t.includes(r.toLowerCase()))) return '痛点/价值词'
  if (profile.scenario_intent_roots.some(r => t.includes(r.toLowerCase()))) return '场景/用途词'
  if (profile.attribute_intent_roots.some(r => t.includes(r.toLowerCase()))) return '属性/规格词'
  if (profile.core_intent_roots.some(r => t.includes(r.toLowerCase()))) return '核心需求词'
  return '未识别词'
}

export function classifyWordLevel(term: string, profile: CategoryProfile): string {
  const t = term.toLowerCase().trim()
  const words = t.split(/\s+/)
  if (new RegExp(profile.asin_regex).test(t)) return '竞品ASIN'
  if (profile.brand_competitor_roots.some(r => t.includes(r.toLowerCase()))) return '品牌词'
  if (profile.attribute_intent_roots.some(r => t.includes(r.toLowerCase()))) return '型号词/规格词'
  if (profile.scenario_intent_roots.some(r => t.includes(r.toLowerCase()))) return '场景词'
  if (profile.b2b_roots.some(r => t.includes(r.toLowerCase()))) return 'B2B词'
  if (words.length === 1) return '核心词'
  if (words.length === 2) return '一级大词'
  if (words.length === 3) return '二级大词'
  if (words.length <= 5) return '长尾词'
  return '小词/属性词'
}

export function isHighRelevance(term: string, profile: CategoryProfile): boolean {
  const t = term.toLowerCase().trim()
  if (profile.high_relevance_roots.length === 0) return false
  return profile.high_relevance_roots.some(r => t.includes(r.toLowerCase()))
}

export function isIrrelevant(term: string, profile: CategoryProfile): boolean {
  const t = term.toLowerCase().trim()
  return profile.negative_irrelevant_roots.some(r => t.includes(r.toLowerCase()))
}
