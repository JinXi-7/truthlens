"""FastAPI 应用入口。"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from backend.config import get_settings
from backend.routes import analyze
from backend.middleware.rate_limit import limiter

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理。"""
    # 启动检查
    if not settings.DEEPSEEK_API_KEY:
        import warnings
        warnings.warn("DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置")
    print(f"[TruthLens] 启动成功，端口 {settings.PORT}")
    yield
    print("[TruthLens] 正在关闭...")
    # 清理资源
    limiter.reset()


app = FastAPI(
    title="TruthLens API",
    description="AI'捧杀'检测器 - 分析AI对话中的阿谀奉承行为",
    version="1.0.0",
    lifespan=lifespan,
)

# 限流
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
        port=settings.PORT,
        reload=True,
    )
