import Papa from 'papaparse';

/**
 * Parse a CSV file and return headers + rows.
 */
export function parseCSV(
  file: File,
  options?: { preview?: boolean; maxRows?: number }
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const maxRows = options?.maxRows ?? (options?.preview ? 20 : Infinity);
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: maxRows,
      complete: (result) => {
        const headers = result.meta.fields || [];
        resolve({ headers, rows: result.data as Record<string, string>[] });
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Guess the file category from filename and headers.
 */
export function guessFileCategory(
  filename: string,
  headers: string[]
): string {
  const name = filename.toLowerCase();
  const headerStr = headers.join(' ').toLowerCase();

  if (name.includes('利润') || name.includes('profit') || headerStr.includes('毛利') || headerStr.includes('gross profit'))
    return 'erp_profit';
  if (name.includes('产品分析') || name.includes('product analysis') || headerStr.includes('asin'))
    return 'erp_product';
  if ((name.includes('搜索词') || name.includes('search term')) && (name.includes('sp') || name.includes('商品推广')))
    return 'sp_search_term';
  if ((name.includes('投放') || name.includes('targeting')) && (name.includes('sp') || name.includes('商品推广')))
    return 'sp_targeting';
  if (name.includes('广告活动') || name.includes('campaign'))
    return 'sp_campaign';
  if (name.includes('广告商品') || name.includes('advertised product'))
    return 'sp_advertised_product';
  if (name.includes('bulk') || name.includes('批量'))
    return 'bulk_operation';
  if (name.includes('业务报告') || name.includes('business report'))
    return 'business_report';
  if (name.includes('库存') || name.includes('inventory'))
    return 'inventory_report';
  if (name.includes('退货') || name.includes('return'))
    return 'return_report';
  if (name.includes('差评') || name.includes('negative') || name.includes('voc'))
    return 'negative_review';

  return 'other';
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
