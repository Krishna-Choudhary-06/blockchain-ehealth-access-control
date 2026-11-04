"""
Fabric Metrics & Live Configuration Verifier
Validates running peer/orderer containers and verifies configured block size (MaxMessageCount).
"""

import subprocess
import yaml
import os
from typing import Dict, Any, List

CONFIGTX_PATH = "/home/krishna/fabric-samples/test-network/configtx/configtx.yaml"

def get_running_fabric_containers() -> List[Dict[str, str]]:
    try:
        res = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}@@{{.Status}}@@{{.Image}}"],
            capture_output=True, text=True, check=True
        )
        containers = []
        for line in res.stdout.strip().split("\n"):
            if not line:
                continue
            parts = line.split("@@")
            if len(parts) >= 3:
                containers.append({
                    "name": parts[0],
                    "status": parts[1],
                    "image": parts[2]
                })
        return containers
    except Exception as e:
        return [{"error": str(e)}]

def verify_fabric_health() -> Dict[str, Any]:
    containers = get_running_fabric_containers()
    names = [c.get("name", "") for c in containers]
    
    required = ["peer0.org1.example.com", "orderer.example.com", "chaincode_health"]
    missing = [req for req in required if not any(req in name for name in names)]
    
    return {
        "healthy": len(missing) == 0,
        "container_count": len(containers),
        "missing_critical": missing,
        "containers": containers
    }

def get_configured_block_size() -> int:
    try:
        if os.path.exists(CONFIGTX_PATH):
            with open(CONFIGTX_PATH, "r") as f:
                content = f.read()
                for line in content.split("\n"):
                    if "MaxMessageCount:" in line:
                        val = line.split("MaxMessageCount:")[1].strip()
                        return int(val)
    except Exception:
        pass
    return 10

def get_fabric_profile() -> Dict[str, Any]:
    return {
        "channel": "healthchannel",
        "chaincode": "healthcontract",
        "block_size": get_configured_block_size(),
        "health": verify_fabric_health()
    }
