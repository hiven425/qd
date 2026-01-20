import re
from typing import Dict, Any

def render_template(template: str, context: Dict[str, Any]) -> str:
    """
    渲染模板字符串，替换 ${var} 格式的变量
    """
    if not template:
        return template

    def replace_var(match):
        var_name = match.group(1)
        value = context.get(var_name, '')
        return str(value) if value is not None else ''

    return re.sub(r'\$\{(\w+)\}', replace_var, template)

def render_dict(data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    递归渲染字典中的所有字符串值
    """
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = render_template(value, context)
        elif isinstance(value, dict):
            result[key] = render_dict(value, context)
        elif isinstance(value, list):
            result[key] = [render_template(v, context) if isinstance(v, str) else v for v in value]
        else:
            result[key] = value
    return result
