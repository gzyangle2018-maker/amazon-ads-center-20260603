import type { AiRunRequest, AiRunResponse, Task, DailyIssue, WeeklyPlan, MonthlyGrade } from '@/types';

/**
 * AI Router — frontend mock implementation.
 *
 * This function is a PLACEHOLDER. It does NOT call any real API.
 * In production, this will be replaced by a Cloudflare Worker that
 * proxies through Dataler to GPT/Claude/Gemini/DeepSeek/Qwen/Kimi/GLM.
 *
 * Interface is preserved exactly as specified:
 *
 * POST /api/ai/run
 * {
 *   agentId, modelProvider, modelName, taskType,
 *   inputFiles, inputText, context, options
 * }
 *
 * Returns:
 * {
 *   success, agentId, modelProvider, modelName,
 *   result, tasks, warnings, cost, createdAt
 * }
 */

export async function runAgentTask(params: AiRunRequest): Promise<AiRunResponse> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

  const now = new Date().toISOString();

  // Mock results based on agentId
  const mockResults: Record<string, { result: Record<string, unknown>; tasks: Task[]; warnings: string[] }> = {
    boutique_ops_daily: {
      result: {
        summary: '今日扫描完成：发现 12 个异常，其中 P0 3 个、P1 5 个、P2 4 个。',
        p0Count: 3,
        p1Count: 5,
        p2Count: 4,
        estimatedTime: '45 分钟执行时间',
      },
      tasks: [],
      warnings: ['C/D级归属动作已禁止自动执行，需人工审批'],
    },
    ads_surgery: {
      result: {
        summary: '广告外科手术完成：否词 3 个，降竞价 5 个，新增关键词 4 个。',
        negatedKeywords: 3,
        loweredBids: 5,
        addedKeywords: 4,
        estimatedSavings: '$320/月',
      },
      tasks: [],
      warnings: [],
    },
    bulk_generator: {
      result: {
        summary: 'Bulk文件已生成，共 12 条操作记录。',
        operations: 12,
        fileReady: true,
        downloadUrl: '#',
      },
      tasks: [],
      warnings: ['下载前请人工复核所有操作'],
    },
    listing_writer: {
      result: {
        summary: 'Listing优化建议已生成：标题优化 + BP增强 + 3个A+模块建议。',
        titleSuggestions: 2,
        bpEnhancements: 5,
        aplusModules: 3,
      },
      tasks: [],
      warnings: [],
    },
    default: {
      result: {
        summary: '任务已接收，模型正在处理中...',
        status: 'processing',
        eta: '约 30 秒',
      },
      tasks: [],
      warnings: [],
    },
  };

  const mockResult = mockResults[params.agentId] || mockResults['default'];

  return {
    success: true,
    agentId: params.agentId,
    modelProvider: params.modelProvider,
    modelName: params.modelName,
    result: mockResult.result,
    tasks: mockResult.tasks,
    warnings: mockResult.warnings,
    cost: {
      tokens: Math.floor(2000 + Math.random() * 8000),
      estimatedUsd: parseFloat((0.02 + Math.random() * 0.08).toFixed(4)),
    },
    createdAt: now,
  };
}
