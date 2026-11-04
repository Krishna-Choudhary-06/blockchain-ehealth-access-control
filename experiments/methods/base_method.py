"""
Abstract Base Class for Modular Access Control Methods
Enables plug-and-play evaluation of BGW, Baseline, and Future Research Schemes.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAccessControlMethod(ABC):
    def __init__(self, name: str, display_name: str, description: str):
        self.name = name
        self.display_name = display_name
        self.description = description

    @abstractmethod
    def setup(self) -> Dict[str, Any]:
        """Bootstrap any system parameters, keys, or pre-requisites."""
        pass

    @abstractmethod
    def initial_share(self, 
                      patient_id: str, 
                      file_bytes: bytes, 
                      filename: str, 
                      recipient_ids: List[str], 
                      level: str = "L0") -> Dict[str, Any]:
        """
        Initial secure storage and sharing of a file with an initial recipient set.
        Must return timing, payload size, CID, and success flag.
        """
        pass

    @abstractmethod
    def share_with_additional_recipient(self, 
                                        data_id: str, 
                                        current_recipients: List[str], 
                                        new_recipient_id: str,
                                        cached_file_bytes: Optional[bytes] = None) -> Dict[str, Any]:
        """
        Evaluates the crucial research question: sharing with another doctor later.
        - For BGW: Recomputes the broadcast header without re-encrypting the file or re-uploading to IPFS.
        - For Baseline: Re-encrypts the file under a new symmetric key and re-uploads to IPFS.
        """
        pass

    @abstractmethod
    def access_record(self, requester_id: str, data_id: str) -> Dict[str, Any]:
        """Requests access through blockchain policy checks and retrieves/decrypts the data."""
        pass

    @abstractmethod
    def revoke_recipient(self, data_id: str, revoked_recipient_id: str) -> Dict[str, Any]:
        """Revokes a recipient's access to a shared medical record."""
        pass
