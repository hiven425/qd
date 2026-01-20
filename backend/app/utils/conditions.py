from simpleeval import simple_eval
from typing import Any, Dict

def evaluate_condition(expression: str, context: Dict[str, Any]) -> bool:
    """
    安全评估条件表达式
    使用 simpleeval 避免任意代码执行
    """
    if not expression or not expression.strip():
        return True

    try:
        result = simple_eval(expression, names=context)
        return bool(result)
    except Exception as e:
        raise ValueError(f"条件评估失败: {expression}, 错误: {str(e)}")
