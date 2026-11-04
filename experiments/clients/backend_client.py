"""
Backend Client for E-Health Blockchain Application
Communicates strictly via HTTP with the live Node.js backend.
"""

import time
import json
import io
import requests
from typing import Dict, Any, List, Optional, Union

class BackendClient:
    def __init__(self, base_url: str = "http://127.0.0.1:3000", timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

    def _execute(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        t_start = time.perf_counter()
        
        # Estimate request payload bytes
        req_bytes = 0
        if "json" in kwargs:
            req_bytes = len(json.dumps(kwargs["json"]).encode("utf-8"))
        elif "data" in kwargs:
            if isinstance(kwargs["data"], dict):
                req_bytes = sum(len(str(k)) + len(str(v)) for k, v in kwargs["data"].items())
            elif isinstance(kwargs["data"], (bytes, bytearray)):
                req_bytes = len(kwargs["data"])

        if "files" in kwargs:
            for k, v in kwargs["files"].items():
                if isinstance(v, tuple) and len(v) >= 2:
                    content = v[1]
                    if isinstance(content, (bytes, bytearray)):
                        req_bytes += len(content)
                    elif hasattr(content, "getvalue"):
                        req_bytes += len(content.getvalue())

        try:
            resp = self.session.request(method, url, timeout=self.timeout, **kwargs)
            latency_ms = (time.perf_counter() - t_start) * 1000.0
            resp_bytes = len(resp.content)
            
            try:
                data = resp.json()
            except Exception:
                data = resp.text

            return {
                "success": resp.status_code in (200, 201),
                "status_code": resp.status_code,
                "latency_ms": latency_ms,
                "request_bytes": req_bytes,
                "response_bytes": resp_bytes,
                "data": data,
                "error": None if resp.status_code in (200, 201) else str(data)
            }
        except Exception as e:
            latency_ms = (time.perf_counter() - t_start) * 1000.0
            return {
                "success": False,
                "status_code": 0,
                "latency_ms": latency_ms,
                "request_bytes": req_bytes,
                "response_bytes": 0,
                "data": None,
                "error": str(e)
            }

    def health(self) -> Dict[str, Any]:
        return self._execute("GET", "/api/health")

    def get_public_key(self) -> Dict[str, Any]:
        return self._execute("GET", "/api/public-key")

    def register_user(self, user_id: str, role: str) -> Dict[str, Any]:
        return self._execute("POST", "/api/register", json={"userId": user_id, "role": role})

    def assign_level(self, user_id: str, level: str) -> Dict[str, Any]:
        return self._execute("POST", "/api/assign-level", json={"userId": user_id, "level": level})

    def upload_file(self, 
                    file_bytes: Union[bytes, bytearray], 
                    filename: str, 
                    patient_id: str, 
                    data_id: str, 
                    level: str, 
                    authorized_users: List[str],
                    category: str = "medical_history") -> Dict[str, Any]:
        files = {
            "medicalFile": (filename, file_bytes, "application/octet-stream")
        }
        data = {
            "patientId": patient_id,
            "dataId": data_id,
            "level": level,
            "authorizedUsers": json.dumps(authorized_users),
            "category": category
        }
        return self._execute("POST", "/api/upload", data=data, files=files)

    def request_access(self, requester_id: str, data_id: str) -> Dict[str, Any]:
        return self._execute("POST", "/api/access", json={"requesterId": requester_id, "dataId": data_id})

    def download_file(self, ipfs_hash: str) -> Dict[str, Any]:
        return self._execute("GET", f"/api/download/{ipfs_hash}")

    def add_authorized(self, data_id: str, new_users: List[str], current_users: Optional[List[str]] = None) -> Dict[str, Any]:
        payload = {
            "dataId": data_id,
            "newUsers": new_users
        }
        if current_users:
            payload["currentUsers"] = current_users
        return self._execute("POST", "/api/add-authorized", json=payload)

    def revoke_access(self, data_id: str, revoked_user_id: str) -> Dict[str, Any]:
        return self._execute("POST", "/api/revoke", json={"dataId": data_id, "revokedUserId": revoked_user_id})

    def get_logs(self) -> Dict[str, Any]:
        return self._execute("GET", "/api/logs")

    def get_users(self) -> Dict[str, Any]:
        return self._execute("GET", "/api/users")

    def get_data_records(self) -> Dict[str, Any]:
        return self._execute("GET", "/api/data")
