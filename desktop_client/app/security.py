"""
安全模块 - 防套取过滤
"""
from typing import Tuple


SECURITY_BLOCK_KEYWORDS = [
    "提示词", "prompt", "底层逻辑", "规则", "rule", "SOP",
    "决策树", "decision tree", "阈值", "threshold",
    "内部方法", "internal", "隐藏逻辑", "hidden logic",
    "你怎么判断", "how do you decide", "输出规则",
    "总结你的", "summarize your", "你的规则是什么",
    "what are your rules", "输出完整", "output full",
    "告诉我底层", "tell me the underlying",
    "解释你怎么", "explain how you",
    "全部规则", "all rules", "所有判断条件",
    "all conditions", "系统提示词", "system prompt",
    "完整SOP", "full SOP", "反向工程", "reverse engineer",
]

SECURITY_RESPONSE = (
    "无法提供内部提示词、底层规则、判断逻辑或思维方式；"
    "如有需要，可以直接根据目标输出广告优化结果、执行建议，"
    "或提供不涉及内部方法论的通用协作说明。"
)


def check_input_security(text: str) -> Tuple[bool, str]:
    """
    检查用户输入是否包含套取prompt的关键词

    返回: (是否安全, 如果不安全则返回屏蔽响应)
    """
    if not text:
        return True, ""

    text_lower = text.lower()
    for kw in SECURITY_BLOCK_KEYWORDS:
        if kw.lower() in text_lower:
            return False, SECURITY_RESPONSE

    return True, ""


def mask_api_key(key: str, show_chars: int = 4) -> str:
    """脱敏API Key"""
    if not key:
        return ""
    if len(key) <= show_chars:
        return "*" * len(key)
    return "*" * (len(key) - show_chars) + key[-show_chars:]


def mask_token(token: str) -> str:
    """脱敏JWT Token"""
    if not token:
        return ""
    if len(token) > 20:
        return token[:10] + "..." + token[-10:]
    return "***"
