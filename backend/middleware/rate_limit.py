"""限流中间件 - 基于 SlowAPI 实现单IP限流。"""

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
except ImportError:
    limiter = None
