"""
Method Registry for Extensible Research Experiments
Allows new access control, encryption, or blockchain schemes to register dynamically.
"""

from typing import Dict, Type, List
from experiments.methods.base_method import BaseAccessControlMethod

class MethodRegistry:
    _registry: Dict[str, BaseAccessControlMethod] = {}

    @classmethod
    def register(cls, method_instance: BaseAccessControlMethod):
        cls._registry[method_instance.name] = method_instance

    @classmethod
    def get(cls, name: str) -> BaseAccessControlMethod:
        if name not in cls._registry:
            raise KeyError(f"Method '{name}' is not registered. Available: {list(cls._registry.keys())}")
        return cls._registry[name]

    @classmethod
    def list_methods(cls) -> List[str]:
        return list(cls._registry.keys())

    @classmethod
    def get_all(cls) -> Dict[str, BaseAccessControlMethod]:
        return dict(cls._registry)

def register_method(method_class):
    instance = method_class()
    MethodRegistry.register(instance)
    return method_class
