from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend
import base64
import os

class CredentialManager:
    """凭证加密管理器"""

    def __init__(self, encryption_key: str):
        # 确保密钥是 32 字节
        key_bytes = encryption_key.encode('utf-8')
        if len(key_bytes) < 32:
            key_bytes = key_bytes.ljust(32, b'0')
        elif len(key_bytes) > 32:
            key_bytes = key_bytes[:32]

        self.aesgcm = AESGCM(key_bytes)

    def encrypt(self, plaintext: str) -> dict:
        """加密明文，返回密文和 nonce"""
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)

        return {
            'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
            'nonce': base64.b64encode(nonce).decode('utf-8')
        }

    def decrypt(self, ciphertext: str, nonce: str) -> str:
        """解密密文"""
        ciphertext_bytes = base64.b64decode(ciphertext)
        nonce_bytes = base64.b64decode(nonce)

        plaintext_bytes = self.aesgcm.decrypt(nonce_bytes, ciphertext_bytes, None)
        return plaintext_bytes.decode('utf-8')

    def resolve_secret(self, auth_config: dict) -> dict:
        """解析认证配置中的凭证"""
        auth_type = auth_config.get('type', 'none')

        if auth_type == 'bearer':
            token_source = auth_config.get('tokenSource', 'manual')

            if token_source == 'manual':
                # 从加密存储中解密
                encrypted = auth_config.get('encrypted')
                if encrypted:
                    token = self.decrypt(encrypted['ciphertext'], encrypted['nonce'])
                else:
                    token = auth_config.get('token', '')

                return {'token': token}

            elif token_source == 'env':
                # 从环境变量读取
                env_key = auth_config.get('envKey', '')
                token = os.getenv(env_key, '')
                return {'token': token}

        return {}
