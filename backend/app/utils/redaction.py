import re
from typing import Dict, Any

SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-csrf-token', 'x-api-key']

def redact_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """
    脱敏敏感 headers
    """
    redacted = {}
    for key, value in headers.items():
        if key.lower() in SENSITIVE_HEADERS:
            redacted[key] = '***'
        else:
            redacted[key] = value
    return redacted

def redact_response(response_text: str, max_length: int = 500) -> str:
    """
    截断响应文本并脱敏
    """
    if not response_text:
        return ''

    # 截断
    if len(response_text) > max_length:
        return response_text[:max_length] + '...'

    return response_text
