"""
Prompt 回归测试脚本。

用法：
    python -m tests.prompt_regression

功能：
    1. 加载 tests/test_cases.json 中的标注数据
    2. 逐条调用分析服务
    3. 比对实际结果与预期范围
    4. 生成通过率报告

注意：运行前需在 .env 中配置 DEEPSEEK_API_KEY
"""

import json
import time
import sys
import os
from pathlib import Path

# 确保项目根目录在 path 中
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.services.analyzer_service import analyze_text
from backend.config import get_settings


# ANSI颜色码
class Color:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


def load_test_cases() -> list[dict]:
    """加载测试数据集。"""
    test_file = project_root / "tests" / "test_cases.json"
    with open(test_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["test_cases"]


def check_result(actual: dict, expected: dict) -> tuple[bool, str]:
    """
    检查实际结果是否在预期范围内。
    
    等级由分数自动推导（analyzer_service 中 _determine_level），
    所以只需验证分数落在合理区间即可，不单独检查等级字符串。
    
    Returns:
        (是否通过, 失败原因)
    """
    overall = actual.get("overall_score", 0)
    
    score_range = expected.get("overall_score_range", [0, 100])
    
    if not (score_range[0] <= overall <= score_range[1]):
        return False, f"分数 {overall} 不在预期范围 [{score_range[0]}, {score_range[1]}]"
    
    return True, ""


async def run_tests():
    """执行所有测试用例。"""
    settings = get_settings()
    
    if not settings.DEEPSEEK_API_KEY:
        print(f"{Color.RED}错误: DEEPSEEK_API_KEY 未配置{Color.RESET}")
        print(f"请在项目根目录创建 .env 文件并设置 DEEPSEEK_API_KEY")
        sys.exit(1)
    
    test_cases = load_test_cases()
    total = len(test_cases)
    
    print(f"{Color.BOLD}{'=' * 60}{Color.RESET}")
    print(f"{Color.BOLD}TruthLens Prompt 回归测试{Color.RESET}")
    print(f"{Color.BOLD}{'=' * 60}{Color.RESET}")
    print(f"测试用例数: {total}")
    print(f"{'=' * 60}\n")
    
    passed = 0
    failed = 0
    results = []
    
    for i, case in enumerate(test_cases, 1):
        case_id = case["id"]
        category = case["category"]
        text = case["text"]
        expected = case["expected"]
        
        print(f"[{i}/{total}] {case_id} ({category})... ", end="", flush=True)
        
        try:
            result = await analyze_text(text)
            ok, reason = check_result(result, expected)
            
            if ok:
                print(f"{Color.GREEN}PASS{Color.RESET} score={result['overall_score']} level={result['level']}")
                passed += 1
            else:
                print(f"{Color.RED}FAIL{Color.RESET}")
                print(f"       原因: {reason}")
                print(f"       分析: {result.get('brief_analysis', '')[:100]}")
                failed += 1
            
            results.append({
                "id": case_id,
                "category": category,
                "passed": ok,
                "actual_score": result["overall_score"],
                "actual_level": result["level"],
                "expected_range": expected["overall_score_range"],
                "expected_level": expected["level"],
                "reason": reason if not ok else "",
            })
            
        except Exception as e:
            print(f"{Color.RED}ERROR{Color.RESET} {e}")
            failed += 1
            results.append({
                "id": case_id,
                "category": category,
                "passed": False,
                "error": str(e),
            })
        
        # 避免API速率限制
        if i < total:
            time.sleep(1)
    
    # 汇总报告
    print(f"\n{'=' * 60}")
    print(f"{Color.BOLD}测试报告{Color.RESET}")
    print(f"{'=' * 60}")
    print(f"总计: {total}  通过: {Color.GREEN}{passed}{Color.RESET}  失败: {Color.RED}{failed}{Color.RESET}")
    print(f"通过率: {passed / total * 100:.1f}%")
    
    # 按类别统计
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"total": 0, "passed": 0}
        categories[cat]["total"] += 1
        if r["passed"]:
            categories[cat]["passed"] += 1
    
    print(f"\n按类别:")
    for cat, stats in sorted(categories.items()):
        rate = stats["passed"] / stats["total"] * 100
        color = Color.GREEN if rate == 100 else (Color.YELLOW if rate >= 80 else Color.RED)
        print(f"  {cat:20s} {stats['passed']}/{stats['total']} {color}({rate:.0f}%){Color.RESET}")
    
    # 保存详细结果
    report_path = project_root / "tests" / "regression_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({
            "total": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": f"{passed / total * 100:.1f}%",
            "results": results,
        }, f, ensure_ascii=False, indent=2)
    print(f"\n详细报告已保存: {report_path}")
    
    return failed == 0


if __name__ == "__main__":
    import asyncio
    success = asyncio.run(run_tests())
    sys.exit(0 if success else 1)
