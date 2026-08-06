"""
使用计数器 - 基于文件的简单计数器，MVP够用。
"""

import os
import asyncio
from pathlib import Path
from typing import Optional

# 数据目录
DATA_DIR = Path(__file__).parent.parent.parent / "backend" / "data"
COUNT_FILE = DATA_DIR / "count.txt"

# 文件锁避免并发写入冲突
_lock = asyncio.Lock()


async def increment_counter() -> int:
    """
    原子递增计数器，返回递增后的值。
    
    使用异步锁保证并发安全，文件存储简单可靠。
    """
    async with _lock:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        
        current = _read_count()
        current += 1
        COUNT_FILE.write_text(str(current), encoding="utf-8")
        return current


async def get_count() -> int:
    """获取当前计数（不递增）。"""
    async with _lock:
        return _read_count()


def _read_count() -> int:
    """读取当前计数值。"""
    if not COUNT_FILE.exists():
        return 0
    try:
        return int(COUNT_FILE.read_text(encoding="utf-8").strip())
    except (ValueError, IOError):
        return 0


def generate_share_text(score: int, level: str) -> str:
    """
    根据分数和等级生成分享文案。
    
    Args:
        score: 综合分数 0-100
        level: 等级 green/yellow/orange/red
    
    Returns:
        适合社交媒体分享的文案
    """
    level_labels = {
        "green": "安全",
        "yellow": "轻微",
        "orange": "中等",
        "red": "严重",
    }
    level_emojis = {
        "green": "🟢",
        "yellow": "🟡",
        "orange": "🟠",
        "red": "🔴",
    }
    
    label = level_labels.get(level, "未知")
    emoji = level_emojis.get(level, "❓")
    
    return f'我用TruthLens测了我的AI助手，捧杀指数 {score}/100 {emoji}（{label}）\n\n你的AI有多"舔"？来测测看 👇\n#TruthLens #AI捧杀检测'
