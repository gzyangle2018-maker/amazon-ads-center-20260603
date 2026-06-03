import type { AttributionResult, AttributionConfidence } from '@/types';

/**
 * Determine ASIN attribution confidence for an ad data row.
 *
 * Priority (highest to lowest):
 * 1. advertisedAsin / asin / sku field present → A
 * 2. campaignName / adGroupName contains ASIN format → A
 * 3. campaignId / adGroupId / keywordId / targetingId mappable → B
 * 4. Keyword / productName semantic match only → C
 * 5. multiAsinMixed = true or can't determine → D
 */

const ASIN_REGEX = /B0[A-Z0-9]{8}/;

interface AttributionInput {
  advertisedAsin?: string;
  asin?: string;
  sku?: string;
  campaignName?: string;
  adGroupName?: string;
  campaignId?: string;
  adGroupId?: string;
  keywordId?: string;
  targetingId?: string;
  keyword?: string;
  productName?: string;
  multiAsinMixed?: boolean;
}

export function getAttributionConfidence(row: AttributionInput): AttributionResult {
  // 1. Direct ASIN/SKU field present
  if (row.advertisedAsin && ASIN_REGEX.test(row.advertisedAsin)) {
    return {
      confidence: 'A',
      reason: `广告商品报告直接提供 ASIN: ${row.advertisedAsin}`,
      allowExecution: true,
      allowBulk: true,
      warning: '',
    };
  }

  if (row.asin && ASIN_REGEX.test(row.asin)) {
    return {
      confidence: 'A',
      reason: `报告字段直接包含 ASIN: ${row.asin}`,
      allowExecution: true,
      allowBulk: true,
      warning: '',
    };
  }

  if (row.sku && row.sku.length > 2) {
    return {
      confidence: 'A',
      reason: `报告字段直接包含 SKU: ${row.sku}`,
      allowExecution: true,
      allowBulk: true,
      warning: '',
    };
  }

  // 2. Campaign/AdGroup name contains ASIN
  const campaignHasAsin = row.campaignName && ASIN_REGEX.test(row.campaignName);
  const adGroupHasAsin = row.adGroupName && ASIN_REGEX.test(row.adGroupName);

  if (campaignHasAsin || adGroupHasAsin) {
    const source = campaignHasAsin ? row.campaignName : row.adGroupName;
    return {
      confidence: 'A',
      reason: `Campaign/AdGroup 名称包含 ASIN: ${source}`,
      allowExecution: true,
      allowBulk: true,
      warning: '',
    };
  }

  // 3. Has IDs that can be mapped via Bulk Operation
  const hasMappableId = row.campaignId || row.adGroupId || row.keywordId || row.targetingId;

  if (hasMappableId) {
    return {
      confidence: 'B',
      reason: '存在可映射的 Campaign/AdGroup/Keyword/Targeting ID',
      allowExecution: true,
      allowBulk: true,
      warning: '需人工复核 Bulk Operation 映射关系',
    };
  }

  // 4. Can only semantically guess via keyword/productName
  if (row.keyword || row.productName) {
    return {
      confidence: 'C',
      reason: '仅能通过关键词/产品名语义推测，无法确认归属',
      allowExecution: false,
      allowBulk: false,
      warning: '该广告数据无法高置信归属 ASIN，禁止生成强执行动作，请先拆分广告结构或补充广告商品报告',
    };
  }

  // 5. Multi-ASIN mixed or can't determine
  if (row.multiAsinMixed) {
    return {
      confidence: 'D',
      reason: '该活动/广告组混投多个 ASIN，无法拆分',
      allowExecution: false,
      allowBulk: false,
      warning: '该广告结构无法高置信归属 ASIN，禁止生成强执行动作，请先拆分广告结构或补充广告商品报告',
    };
  }

  // Default: can't determine
  return {
    confidence: 'D',
    reason: '缺少必要的归属字段，无法判断',
    allowExecution: false,
    allowBulk: false,
    warning: '该广告结构无法高置信归属 ASIN，禁止生成强执行动作，请先拆分广告结构或补充广告商品报告',
  };
}

/**
 * Quick check: is this attribution safe for execution?
 */
export function isAttributionSafe(result: AttributionResult): boolean {
  return result.confidence === 'A' || result.confidence === 'B';
}
