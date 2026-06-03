import { create } from 'zustand';
import type { User, UserRole, ModelConfig } from '@/types';

// ─── localStorage persistence helpers ─────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded, ignore */ }
}

// ─── Default model configs (Dataler pre-filled) ──────────

const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'm-datater-gpt4',
    provider: 'datater',
    apiBaseUrl: 'https://dataler.com/v1',
    apiKey: '',
    modelName: 'gpt-4.1',
    enabled: true,
    purpose: ['total_control', 'ads_deep', 'listing_writing', 'audit'],
    maxContext: 128000,
    priceLevel: 'high',
    speedLevel: 'medium',
    stabilityLevel: 'high',
    isDefault: true,
  },
  {
    id: 'm-datater-claude',
    provider: 'datater',
    apiBaseUrl: 'https://dataler.com/v1',
    apiKey: '',
    modelName: 'claude-sonnet-4-20250514',
    enabled: true,
    purpose: ['audit', 'ads_deep', 'total_control'],
    maxContext: 200000,
    priceLevel: 'high',
    speedLevel: 'medium',
    stabilityLevel: 'high',
    isDefault: false,
  },
  {
    id: 'm-deepseek',
    provider: 'deepseek',
    apiBaseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    modelName: 'deepseek-chat',
    enabled: true,
    purpose: ['ads_deep', 'data_cleaning', 'low_cost_batch', 'audit'],
    maxContext: 64000,
    priceLevel: 'low',
    speedLevel: 'fast',
    stabilityLevel: 'medium',
    isDefault: false,
  },
  {
    id: 'm-qwen',
    provider: 'qwen',
    apiBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    modelName: 'qwen-max',
    enabled: true,
    purpose: ['listing_writing', 'low_cost_batch', 'data_cleaning'],
    maxContext: 32000,
    priceLevel: 'low',
    speedLevel: 'fast',
    stabilityLevel: 'medium',
    isDefault: false,
  },
  {
    id: 'm-kimi',
    provider: 'kimi',
    apiBaseUrl: 'https://api.moonshot.cn/v1',
    apiKey: '',
    modelName: 'moonshot-v1-128k',
    enabled: true,
    purpose: ['data_cleaning', 'low_cost_batch'],
    maxContext: 128000,
    priceLevel: 'low',
    speedLevel: 'fast',
    stabilityLevel: 'medium',
    isDefault: false,
  },
  {
    id: 'm-glm',
    provider: 'glm',
    apiBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '',
    modelName: 'glm-4-flash',
    enabled: false,
    purpose: ['data_cleaning', 'low_cost_batch'],
    maxContext: 128000,
    priceLevel: 'low',
    speedLevel: 'fast',
    stabilityLevel: 'low',
    isDefault: false,
  },
  {
    id: 'm-openai',
    provider: 'openai',
    apiBaseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    modelName: 'gpt-4o',
    enabled: false,
    purpose: ['total_control', 'listing_writing', 'image_prompt'],
    maxContext: 128000,
    priceLevel: 'high',
    speedLevel: 'fast',
    stabilityLevel: 'high',
    isDefault: false,
  },
  {
    id: 'm-google',
    provider: 'google',
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1',
    apiKey: '',
    modelName: 'gemini-2.0-flash',
    enabled: false,
    purpose: ['listing_writing', 'data_cleaning', 'low_cost_batch'],
    maxContext: 1000000,
    priceLevel: 'low',
    speedLevel: 'fast',
    stabilityLevel: 'medium',
    isDefault: false,
  },
];

// ─── Agent-to-model bindings ─────────────────────────────

export interface AgentModelBinding {
  agentId: string;
  modelConfigId: string;
}

const DEFAULT_AGENT_BINDINGS: AgentModelBinding[] = [
  { agentId: 'boutique_ops_total', modelConfigId: 'm-datater-gpt4' },
  { agentId: 'ads_surgery', modelConfigId: 'm-deepseek' },
  { agentId: 'bulk_generator', modelConfigId: 'm-deepseek' },
  { agentId: 'listing_writer', modelConfigId: 'm-datater-claude' },
  { agentId: 'image_prompt_expert', modelConfigId: 'm-datater-gpt4' },
  { agentId: 'video_script_expert', modelConfigId: 'm-datater-claude' },
  { agentId: 'inventory_master', modelConfigId: 'm-deepseek' },
  { agentId: 'monthly_profit_analyzer', modelConfigId: 'm-datater-claude' },
  { agentId: 'reactivation_master', modelConfigId: 'm-datater-gpt4' },
  { agentId: 'launch_master', modelConfigId: 'm-datater-claude' },
  { agentId: 'store_safety_assistant', modelConfigId: 'm-datater-gpt4' },
  { agentId: 'compliance_scanner', modelConfigId: 'm-deepseek' },
  { agentId: 'qa_collector', modelConfigId: 'm-google' },
];

// ─── Store interface ─────────────────────────────────────

interface AppState {
  // Current user
  currentUser: User;
  setUser: (user: User) => void;
  setRole: (role: UserRole) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Global search
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Model configs
  modelConfigs: ModelConfig[];
  setModelConfigs: (configs: ModelConfig[]) => void;
  addModelConfig: (config: ModelConfig) => void;
  updateModelConfig: (id: string, patch: Partial<ModelConfig>) => void;
  removeModelConfig: (id: string) => void;
  toggleModelEnabled: (id: string) => void;

  // Agent-to-model bindings
  agentBindings: AgentModelBinding[];
  setAgentBinding: (agentId: string, modelConfigId: string) => void;
  getModelForAgent: (agentId: string) => ModelConfig | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── User ──
  currentUser: {
    id: 'u-leo',
    name: 'Leo (管理员)',
    role: 'admin',
    stores: [],
    asins: [],
  },
  setUser: (user) => set({ currentUser: user }),
  setRole: (role) => set((s) => ({ currentUser: { ...s.currentUser, role } })),

  // ── Sidebar ──
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ── Search ──
  globalSearch: '',
  setGlobalSearch: (q) => set({ globalSearch: q }),

  // ── Model Configs (with localStorage persistence) ──
  modelConfigs: loadFromStorage<ModelConfig[]>('ly-ops-model-configs', DEFAULT_MODELS),
  setModelConfigs: (configs) => {
    saveToStorage('ly-ops-model-configs', configs);
    set({ modelConfigs: configs });
  },
  addModelConfig: (config) => {
    const configs = [...get().modelConfigs, config];
    saveToStorage('ly-ops-model-configs', configs);
    set({ modelConfigs: configs });
  },
  updateModelConfig: (id, patch) => {
    const configs = get().modelConfigs.map((m) =>
      m.id === id ? { ...m, ...patch } : m
    );
    saveToStorage('ly-ops-model-configs', configs);
    set({ modelConfigs: configs });
  },
  removeModelConfig: (id) => {
    const configs = get().modelConfigs.filter((m) => m.id !== id);
    saveToStorage('ly-ops-model-configs', configs);
    set({ modelConfigs: configs });
  },
  toggleModelEnabled: (id) => {
    const configs = get().modelConfigs.map((m) =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    saveToStorage('ly-ops-model-configs', configs);
    set({ modelConfigs: configs });
  },

  // ── Agent bindings (with localStorage persistence) ──
  agentBindings: loadFromStorage<AgentModelBinding[]>('ly-ops-agent-bindings', DEFAULT_AGENT_BINDINGS),
  setAgentBinding: (agentId, modelConfigId) => {
    const bindings = get().agentBindings.filter((b) => b.agentId !== agentId);
    bindings.push({ agentId, modelConfigId });
    saveToStorage('ly-ops-agent-bindings', bindings);
    set({ agentBindings: bindings });
  },
  getModelForAgent: (agentId) => {
    const binding = get().agentBindings.find((b) => b.agentId === agentId);
    if (!binding) return undefined;
    return get().modelConfigs.find((m) => m.id === binding.modelConfigId);
  },
}));
