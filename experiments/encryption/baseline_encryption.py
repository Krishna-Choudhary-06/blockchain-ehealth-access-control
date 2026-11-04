"""
baseline encryption implementation used for experimental comparison

This module implements a conventional symmetric file encryption baseline using
AES-256-GCM (Authenticated Encryption with Associated Data).
It encrypts actual files, records timing and payload expansion, decrypts, and verifies integrity.
"""

import os
import sys
import time
import json
import hashlib
from typing import Dict, Any, Union
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

class BaselineEncryption:
    def __init__(self):
        self.algorithm = "AES-256-GCM"

    def benchmark_file(self, file_path_or_bytes: Union[str, bytes], recipient_public_keys: int = 1) -> Dict[str, Any]:
        """
        Accepts a real file, encrypts with fresh AES key, encrypts the key for each recipient (RSA),
        decrypts, and verifies integrity.
        """
        if isinstance(file_path_or_bytes, str):
            with open(file_path_or_bytes, "rb") as f:
                plaintext = f.read()
        else:
            plaintext = bytes(file_path_or_bytes)

        plaintext_bytes = len(plaintext)
        orig_hash = hashlib.sha256(plaintext).hexdigest()

        # 1. Key generation
        t_keygen_0 = time.perf_counter()
        aes_key = AESGCM.generate_key(bit_length=256)
        aesgcm = AESGCM(aes_key)
        nonce = os.urandom(12) # 96-bit nonce
        
        # Simulate RSA wrapping for N recipients
        rsa_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        rsa_public_key = rsa_private_key.public_key()
        
        # Wrap AES key for all recipients
        wrapped_keys = []
        for _ in range(recipient_public_keys):
            wrapped = rsa_public_key.encrypt(
                aes_key,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            wrapped_keys.append(wrapped)
        keygen_ms = (time.perf_counter() - t_keygen_0) * 1000.0

        # 2. File Encryption
        t_enc_0 = time.perf_counter()
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)
        encryption_ms = (time.perf_counter() - t_enc_0) * 1000.0
        ciphertext_bytes = len(ciphertext)

        # 3. Decryption
        t_dec_0 = time.perf_counter()
        # Unwrap AES key
        unwrapped_key = rsa_private_key.decrypt(
            wrapped_keys[0],
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        dec_aesgcm = AESGCM(unwrapped_key)
        decrypted = dec_aesgcm.decrypt(nonce, ciphertext, None)
        decryption_ms = (time.perf_counter() - t_dec_0) * 1000.0

        # 4. Integrity verification
        dec_hash = hashlib.sha256(decrypted).hexdigest()
        verified = (orig_hash == dec_hash)

        return {
            "algorithm": self.algorithm,
            "key_size_bits": 256,
            "nonce_bytes": len(nonce),
            "recipient_count": recipient_public_keys,
            "plaintext_bytes": plaintext_bytes,
            "ciphertext_bytes": ciphertext_bytes,
            "wrapped_key_bytes_total": sum(len(k) for k in wrapped_keys),
            "keygen_ms": keygen_ms,
            "encryption_ms": encryption_ms,
            "decryption_ms": decryption_ms,
            "total_crypto_ms": keygen_ms + encryption_ms + decryption_ms,
            "expansion_ratio": round(ciphertext_bytes / max(1, plaintext_bytes), 4),
            "verified": verified
        }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Baseline encryption benchmark")
    parser.add_argument("--file", type=str, default=None, help="Path to input file")
    parser.add_argument("--size-kb", type=int, default=100, help="Size in KB if generating dummy file")
    parser.add_argument("--recipients", type=int, default=1, help="Number of recipients")
    args = parser.parse_args()

    be = BaselineEncryption()
    if args.file and os.path.exists(args.file):
        with open(args.file, "rb") as f:
            data = f.read()
    else:
        data = os.urandom(args.size_kb * 1024)

    result = be.benchmark_file(data, recipient_public_keys=args.recipients)
    print(json.dumps(result, indent=2))
