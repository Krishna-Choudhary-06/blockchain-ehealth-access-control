"""
IPFS Metrics Collector & Live Storage Benchmark
Validates local IPFS daemon, measures upload/download latency, and verifies data integrity.
"""

import time
import hashlib
import requests
from typing import Dict, Any

class IPFSMetricsCollector:
    def __init__(self, api_url: str = "http://127.0.0.1:5001", timeout: float = 30.0):
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout

    def check_health(self) -> Dict[str, Any]:
        try:
            resp = requests.post(f"{self.api_url}/api/v0/version", timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "available": True,
                    "version": data.get("Version", "unknown"),
                    "repo": data.get("Repo", "unknown"),
                    "system": data.get("System", "unknown")
                }
        except Exception as e:
            return {"available": False, "error": str(e)}
        return {"available": False, "error": "Non-200 response"}

    def measure_upload_download(self, test_payload: bytes) -> Dict[str, Any]:
        payload_hash = hashlib.sha256(test_payload).hexdigest()
        byte_size = len(test_payload)
        
        # 1. Measure Upload
        t0 = time.perf_counter()
        files = {"file": ("test_blob.bin", test_payload)}
        up_resp = requests.post(f"{self.api_url}/api/v0/add", files=files, timeout=self.timeout)
        upload_ms = (time.perf_counter() - t0) * 1000.0
        
        if up_resp.status_code != 200:
            return {"success": False, "error": f"Upload failed: {up_resp.text}"}
            
        cid = up_resp.json().get("Hash", "")
        
        # 2. Measure Download
        t1 = time.perf_counter()
        down_resp = requests.post(f"{self.api_url}/api/v0/cat?arg={cid}", timeout=self.timeout)
        download_ms = (time.perf_counter() - t1) * 1000.0
        
        if down_resp.status_code != 200:
            return {"success": False, "error": f"Download failed: {down_resp.text}"}
            
        downloaded_bytes = down_resp.content
        downloaded_hash = hashlib.sha256(downloaded_bytes).hexdigest()
        
        return {
            "success": True,
            "cid": cid,
            "byte_size": byte_size,
            "upload_ms": upload_ms,
            "download_ms": download_ms,
            "integrity_verified": payload_hash == downloaded_hash
        }
