import { Users, Shield, Eye, Edit, Check, X } from 'lucide-react';
import type { UserRole } from '@/types';

interface RoleDef {
  role: UserRole;
  label: string;
  icon: React.ReactNode;
  description: string;
  permissions: string[];
}

const roles: RoleDef[] = [
  {
    role: 'admin', label: '管理员 Leo',
    icon: <Shield size={20} className="text-accent-purple" />,
    description: '查看所有店铺/ASIN/任务，配置模型API，审批高风险动作',
    permissions: ['全部数据访问', '模型API配置', 'Agent启用/关闭', '高风险审批', '团队审计', '权限管理', '系统设置'],
  },
  {
    role: 'operator', label: '运营',
    icon: <Eye size={20} className="text-accent-cyan" />,
    description: '查看负责店铺/ASIN，查看AI建议，提交执行证据',
    permissions: ['负责店铺/ASIN数据', '查看AI建议', '确认任务完成', '提交证据', '每日/每周分析', '数据上传'],
  },
  {
    role: 'assistant', label: '运营助理',
    icon: <Edit size={20} className="text-accent-blue" />,
    description: '查看分配任务，上传证据，不允许修改核心AI决策',
    permissions: ['查看分配任务', '上传证据', '数据补充', '文件上传'],
  },
  {
    role: 'designer', label: '美工',
    icon: <Edit size={20} className="text-accent-green" />,
    description: '查看作图/视频/素材任务，上传设计文件',
    permissions: ['作图任务', '视频任务', '素材任务', '上传设计文件'],
  },
  {
    role: 'safety', label: '店铺安全/合规',
    icon: <Shield size={20} className="text-accent-yellow" />,
    description: '查看店铺安全、合规、申诉、邮件相关任务',
    permissions: ['店铺安全监控', '合规检查', '申诉处理', '账号健康', '邮件跟进'],
  },
];

export function PermissionManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">权限管理</h1>
        <p className="text-sm text-text-secondary mt-1">
          角色权限矩阵 · 管理员可配置各角色访问范围
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.role} className="panel-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                {role.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{role.label}</h3>
                <span className="text-[11px] text-text-muted font-mono">{role.role}</span>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">{role.description}</p>
            <div className="space-y-1">
              <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">权限列表</h4>
              {role.permissions.map((perm) => (
                <div key={perm} className="flex items-center gap-1.5 text-xs text-text-primary">
                  <Check size={12} className="text-accent-green shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Access matrix */}
      <div className="panel-card">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Users size={16} /> 页面访问矩阵
        </h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>页面</th>
                <th>管理员</th>
                <th>运营</th>
                <th>运营助理</th>
                <th>美工</th>
                <th>安全/合规</th>
              </tr>
            </thead>
            <tbody>
              {[
                '总控首页', '每日扫描', '每周诊断', '每月分级',
                'ASIN详情', '广告归属审计', '任务中心', 'Agent路由',
                '数据投喂', '模型配置', '权限管理', '系统设置',
              ].map((page) => (
                <tr key={page}>
                  <td className="text-xs text-text-primary">{page}</td>
                  <td><Check size={14} className="text-accent-green" /></td>
                  <td>{['模型配置', '权限管理', '系统设置'].includes(page) ? <X size={14} className="text-text-muted" /> : <Check size={14} className="text-accent-green" />}</td>
                  <td>{['总控首页', '每日扫描', 'ASIN详情', '任务中心', '数据投喂'].includes(page) ? <Check size={14} className="text-accent-green" /> : <X size={14} className="text-text-muted" />}</td>
                  <td>{['总控首页', '任务中心'].includes(page) ? <Check size={14} className="text-accent-green" /> : <X size={14} className="text-text-muted" />}</td>
                  <td>{['总控首页', '任务中心'].includes(page) ? <Check size={14} className="text-accent-green" /> : <X size={14} className="text-text-muted" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data scope */}
      <div className="panel-card">
        <h2 className="text-sm font-semibold text-text-primary mb-3">数据范围规则</h2>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-accent-purple shrink-0 mt-0.5" />
            <p className="text-text-secondary"><strong className="text-text-primary">管理员:</strong> 全部店铺 · 全部ASIN · 全部任务 · 全部Agent</p>
          </div>
          <div className="flex items-start gap-2">
            <Eye size={14} className="text-accent-cyan shrink-0 mt-0.5" />
            <p className="text-text-secondary"><strong className="text-text-primary">运营:</strong> 仅自己负责的店铺和ASIN · 可查看AI建议但不可修改模型配置</p>
          </div>
          <div className="flex items-start gap-2">
            <Edit size={14} className="text-accent-blue shrink-0 mt-0.5" />
            <p className="text-text-secondary"><strong className="text-text-primary">运营助理:</strong> 仅分配任务 · 可上传证据 · 不可修改AI决策</p>
          </div>
        </div>
      </div>
    </div>
  );
}
