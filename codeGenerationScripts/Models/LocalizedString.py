from dataclasses import dataclass
from typing import Any, TypeVar, Type, cast, Dict, List
from enum import Enum
  
class ParamTypes(Enum):
    int = 'int'
    string = 'string'

@dataclass
class LocalizedStringParam:
    paramKey: str
    name: str
    paramType: ParamTypes

@dataclass
class LocalizedString:
    group: str
    key: str
    comment: str
    parameters: List[LocalizedStringParam]
    isUniqueMessage: bool
    localizedValues: Dict[str, str]