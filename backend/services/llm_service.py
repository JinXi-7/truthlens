"""
DeepSeek LLM 服务封装。

DeepSeek API 兼容 OpenAI 接口格式，使用 openai SDK 调用。
"""

import json
import logging
from openai import OpenAI

from backend.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMService:
    """DeepSeek LLM 调用封装。"""

    def __init__(self):
        self.client = OpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com/v1"
        )
        self.model = "deepseek-chat"

    def analyze(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
    ) -> dict:
        """
       调用 DeepSeek 进行分析，返回解析后的JSON。

        Args:
            system_prompt: 系统提示词
            user_prompt: 用户消息（包含对话文本）
            temperature: 温度参数，越低越确定

        Returns:
            解析后的JSON字典

        Raises:
            ValueError: 当API返回内容无法解析为JSON时
            RuntimeError: 当API调用失败时
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                response_format={"type": "json_object"},
                max_tokens=2000,
            )

            content = response.choices[0].message.content
            logger.debug(f"LLM raw response: {content}")

            try:
                result = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse failed: {e}, content: {content}")
                raise ValueError(f"LLM返回内容无法解析为JSON: {e}")

            return result

        except Exception as e:
            logger.error(f"LLM API call failed: {e}")
            if isinstance(e, ValueError):
                raise
            raise RuntimeError(f"API调用失败: {e}")


# 单例
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """获取LLM服务单例。"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
