"""FastAPI 应用入口。"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import get_settings
from backend.routes import analyze

settings = get_settings()

# 限流 - 放在try-except中，避免slowapi版本兼容问题导致启动失败
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    USE_RATE_LIMIT = True
except ImportError as e:
    print(f"[TruthLens] slowapi未安装，限流功能不可用: {e}")
    limiter = None
    USE_RATE_LIMIT = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理。"""
    if not settings.DEEPSEEK_API_KEY:
        import warnings
        warnings.warn("DEEPSEEK_API_KEY 未配置")
    print(f"[TruthLens] 启动成功，端口 {os.environ.get('PORT', settings.PORT)}")
    yield
    print("[TruthLens] 正在关闭...")


app = FastAPI(
    title="TruthLens API",
    description="AI捧杀检测器 - 分析AI对话中的阿谀奉承行为",
    version="1.0.0",
    lifespan=lifespan,
)

# 限流
if USE_RATE_LIMIT:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "truthlens", "version": "1.0.0"}


# 路由注册
app.include_router(analyze.router, prefix="/api", tags=["analyze"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", settings.PORT)),
    )
