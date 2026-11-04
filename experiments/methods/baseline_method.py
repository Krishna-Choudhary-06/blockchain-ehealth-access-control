"""
Baseline Repeated-Encryption Method (Conventional Architecture)
Implements conventional per-recipient key encapsulation with full file re-encryption on sharing updates.
Demonstrates the empirical computational and communication overhead of repeated re-encryption.
"""

import time
import uuid
from typing import Dict, Any, List, Optional
from experiments.methods.base_method import BaseAccessControlMethod
from experiments.methods.registry import register_method
from experiments.clients.backend_client import BackendClient
from experiments.encryption.baseline_encryption import BaselineEncryption

@register_method
class BaselineMethod(BaseAccessControlMethod):
    def __init__(self, backend_client: Optional[BackendClient] = None):
        super().__init__(
            name="baseline_repeated_encryption",
            display_name="Conventional (Repeated File Re-encryption)",
            description="Conventional hybrid encryption; re-encrypts the underlying file and re-uploads to IPFS when sharing with new recipients"
        )
        self.client = backend_client or BackendClient()
        self.crypto = BaselineEncryption()

    def setup(self) -> Dict[str, Any]:
        return {"success": True, "crypto_engine": self.crypto.algorithm}

    def initial_share(self, 
                      patient_id: str, 
                      file_bytes: bytes, 
                      filename: str, 
                      recipient_ids: List[str], 
                      level: str = "L0") -> Dict[str, Any]:
        data_id = f"base_rec_{uuid.uuid4().hex[:10]}"
        t0 = time.perf_counter()
        
        # 1. Encrypt file with fresh AES key and wrap for all recipients
        crypto_res = self.crypto.benchmark_file(file_bytes, recipient_public_keys=len(recipient_ids) + 1)
        
        # 2. Upload file via backend
        all_recipients = list(set([patient_id] + recipient_ids))
        resp = self.client.upload_file(
            file_bytes=file_bytes,
            filename=filename,
            patient_id=patient_id,
            data_id=data_id,
            level=level,
            authorized_users=all_recipients
        )
        total_time_ms = (time.perf_counter() - t0) * 1000.0

        ipfs_hash = ""
        if resp["success"] and isinstance(resp.get("data"), dict):
            ipfs_hash = resp["data"].get("data", {}).get("ipfsHash", "") or resp["data"].get("ipfsHash", "")

        return {
            "method": self.name,
            "data_id": data_id,
            "success": resp["success"],
            "total_latency_ms": total_time_ms,
            "crypto_encryption_ms": crypto_res["encryption_ms"],
            "crypto_keygen_ms": crypto_res["keygen_ms"],
            "backend_latency_ms": resp["latency_ms"],
            "request_bytes": resp["request_bytes"],
            "response_bytes": resp["response_bytes"],
            "file_size_bytes": len(file_bytes),
            "ciphertext_bytes": crypto_res["ciphertext_bytes"],
            "re_encrypted_file": True,
            "re_uploaded_ipfs": True,
            "ipfs_hash": ipfs_hash,
            "error": resp.get("error")
        }

    def share_with_additional_recipient(self, 
                                        data_id: str, 
                                        current_recipients: List[str], 
                                        new_recipient_id: str,
                                        cached_file_bytes: Optional[bytes] = None) -> Dict[str, Any]:
        t0 = time.perf_counter()
        
        # In baseline architecture:
        # File must be RE-ENCRYPTED with a fresh key and wrapped for N+1 recipients!
        file_payload = cached_file_bytes or b"EHR Medical Report Payload for Re-encryption Test"
        all_recipients = list(set(current_recipients + [new_recipient_id]))
        
        # 1. Measure real re-encryption
        crypto_res = self.crypto.benchmark_file(file_payload, recipient_public_keys=len(all_recipients))
        
        # 2. Upload new encrypted file (new CID)
        new_data_id = f"{data_id}_v2"
        up_resp = self.client.upload_file(
            file_bytes=file_payload,
            filename="re_encrypted_record.bin",
            patient_id=all_recipients[0],
            data_id=new_data_id,
            level="L0",
            authorized_users=all_recipients
        )
        
        # 3. Update authorization on ledger
        auth_resp = self.client.add_authorized(
            data_id=data_id,
            new_users=[new_recipient_id],
            current_users=current_recipients
        )
        total_time_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "method": self.name,
            "data_id": data_id,
            "action": "share_additional_recipient",
            "success": auth_resp["success"],
            "total_latency_ms": total_time_ms,
            "crypto_re_encryption_ms": crypto_res["encryption_ms"] + crypto_res["keygen_ms"],
            "ipfs_re_upload_ms": up_resp["latency_ms"],
            "re_encrypted_file": True,
            "re_uploaded_ipfs": True,
            "request_bytes": auth_resp["request_bytes"] + up_resp["request_bytes"],
            "response_bytes": auth_resp["response_bytes"] + up_resp["response_bytes"],
            "error": auth_resp.get("error") or up_resp.get("error")
        }

    def access_record(self, requester_id: str, data_id: str) -> Dict[str, Any]:
        t0 = time.perf_counter()
        resp = self.client.request_access(requester_id=requester_id, data_id=data_id)
        total_time_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "method": self.name,
            "data_id": data_id,
            "requester_id": requester_id,
            "success": resp["success"],
            "total_latency_ms": total_time_ms,
            "status_code": resp["status_code"],
            "response_bytes": resp["response_bytes"],
            "error": resp.get("error")
        }

    def revoke_recipient(self, data_id: str, revoked_recipient_id: str) -> Dict[str, Any]:
        t0 = time.perf_counter()
        resp = self.client.revoke_access(data_id=data_id, revoked_user_id=revoked_recipient_id)
        total_time_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "method": self.name,
            "data_id": data_id,
            "revoked_id": revoked_recipient_id,
            "success": resp["success"],
            "total_latency_ms": total_time_ms,
            "backend_latency_ms": resp["latency_ms"],
            "error": resp.get("error")
        }
