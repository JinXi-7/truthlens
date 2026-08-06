"""限流中间件 - 基于 SlowAPI 实现单IP限流。"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# 使用远程IP作为限流key
limiter = Limiter(key_func=get_remote_address)
