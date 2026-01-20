import re
from typing import Any, Dict
import json

def extract_json_path(data: Any, path: str) -> Any:
    """
    从 JSON 数据中提取指定路径的值
    支持点号分隔的路径，如 'data.user.name'
    """
    if not path:
        return data

    keys = path.split('.')
    current = data

    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
        elif isinstance(current, list) and key.isdigit():
            idx = int(key)
            current = current[idx] if 0 <= idx < len(current) else None
        else:
            return None

        if current is None:
            return None

    return current

def extract_variables(response_data: Any, extract_rules: list, context: Dict[str, Any]) -> None:
    """
    根据提取规则从响应中提取变量到上下文
    """
    for rule in extract_rules:
        var_name = rule.get('var')
        extract_type = rule.get('type', 'json')
        path = rule.get('path', '')

        if extract_type == 'json':
            value = extract_json_path(response_data, path)
            context[var_name] = value
