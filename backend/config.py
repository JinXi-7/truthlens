"""配置加载模块 - 从环境变量读取配置，启动时校验必填项。"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置，从.env文件或环境变量读取。"""

    # DeepSeek API
    DEEPSEEK_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:5500,http://127.0.0.1:5500"

    # 服务
    PORT: int = 8000

    # 限流
    RATE_LIMIT: str = "3/hour"

    @property
    def cors_origins_list(self) -> list[str]:
        """将逗号分隔的CORS字符串转为列表。"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """单例模式获取配置。"""
    return Settings()
