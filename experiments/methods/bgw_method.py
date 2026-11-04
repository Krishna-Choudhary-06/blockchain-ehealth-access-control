"""
BGW Broadcast Encryption Method (Proposed Architecture)
Implements true BGW broadcast encryption via the live application backend.
Avoids file re-encryption and IPFS re-uploading when sharing with additional recipients.
"""

import time
import uuid
from typing import Dict, Any, List, Optional
from experiments.methods.base_method import BaseAccessControlMethod
from experiments.methods.registry import register_method
from experiments.clients.backend_client import BackendClient

@register_method
class BGWMethod(BaseAccessControlMethod):
    def __init__(self, backend_client: Optional[BackendClient] = None):
        super().__init__(
            name="bgw_broadcast",
            display_name="Proposed (BGW Broadcast Encryption)",
            description="Dynamic recipient updates via BLS12-381 pairings; avoids file re-encryption and IPFS re-upload"
        )
        self.client = backend_client or BackendClient()

    def setup(self) -> Dict[str, Any]:
        resp = self.client.get_public_key()
        return {
            "success": resp["success"],
            "latency_ms": resp["latency_ms"],
            "public_key_present": "publicKey" in (resp.get("data") or {})
        }

    def initial_share(self, 
                      patient_id: str, 
                      file_bytes: bytes, 
                      filename: str, 
                      recipient_ids: List[str], 
                      level: str = "L0") -> Dict[str, Any]:
        data_id = f"bgw_rec_{uuid.uuid4().hex[:10]}"
        t0 = time.perf_counter()
        
        # Ensure patient is included
        all_recipients = list(set([patient_id] + recipient_ids))
        
        # Call backend upload endpoint (handles IPFS upload and Fabric storeHash)
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
            "backend_latency_ms": resp["latency_ms"],
            "request_bytes": resp["request_bytes"],
            "response_bytes": resp["response_bytes"],
            "file_size_bytes": len(file_bytes),
            "re_encrypted_file": False,
            "re_uploaded_ipfs": False,
            "ipfs_hash": ipfs_hash,
            "error": resp.get("error")
        }

    def share_with_additional_recipient(self, 
                                        data_id: str, 
                                        current_recipients: List[str], 
                                        new_recipient_id: str,
                                        cached_file_bytes: Optional[bytes] = None) -> Dict[str, Any]:
        t0 = time.perf_counter()
        
        # BGW only updates the broadcast header on chain; file is untouched!
        resp = self.client.add_authorized(
            data_id=data_id,
            new_users=[new_recipient_id],
            current_users=current_recipients
        )
        total_time_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "method": self.name,
            "data_id": data_id,
            "action": "share_additional_recipient",
            "success": resp["success"],
            "total_latency_ms": total_time_ms,
            "backend_latency_ms": resp["latency_ms"],
            "crypto_re_encryption_ms": 0.0,      # ZERO file re-encryption!
            "ipfs_re_upload_ms": 0.0,             # ZERO IPFS re-upload!
            "re_encrypted_file": False,
            "re_uploaded_ipfs": False,
            "request_bytes": resp["request_bytes"],
            "response_bytes": resp["response_bytes"],
            "error": resp.get("error")
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
