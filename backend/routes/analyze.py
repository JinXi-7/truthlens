"""分析路由 - 接收对话文本，返回阿谀奉承分析结果。"""

import logging
from fastapi import APIRouter, Request, HTTPException
from typing import List
from pydantic import BaseModel, Field, field_validator

from backend.middleware.rate_limit import limiter
from backend.utils.counter import increment_counter, generate_share_text

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
    """分析请求模型。"""
    text: str

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("对话文本不能为空")
        if len(v) > 5000:
            raise ValueError("对话文本不能超过5000字")
        if len(v) < 10:
            raise ValueError("对话文本太短，请至少输入10个字符")
        return v


class Solution(BaseModel):
    """单条解决方案。"""
    category: str
    tip: str


class AnalyzeResponse(BaseModel):
    """分析响应模型。"""
    sycophancy_score: int
    manipulation_score: int
    compliance_risk: int
    truth_distortion: int
    overall_score: int
    level: str
    ai_label: str
    ai_label_description: str
    quote_samples: List[str]
    brief_analysis: str
    solutions: List[Solution]
    share_text: str
    test_count: int


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit("3/hour")
async def analyze_conversation(request: Request, body: AnalyzeRequest):
    """分析AI对话中的阿谀奉承行为。"""
    from backend.services.analyzer_service import analyze_text

    try:
        result = await analyze_text(body.text)
    except Exception as e:
        logger.error(f"分析失败: {e}")
        raise HTTPException(status_code=500, detail="分析失败，请稍后重试")

    # 增加使用计数
    count = await increment_counter()

    # 生成分享文案
    result["share_text"] = generate_share_text(result["overall_score"], result["level"])
    result["test_count"] = count

    return result


@router.get("/count")
async def get_test_count():
    """获取使用次数（前端展示社交证明）。"""
    from backend.utils.counter import get_count
    count = await get_count()
    return {"count": count}
