"""
Language / Multilingual Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List


class SupportedLanguage(BaseModel):
    code: str
    name: str
    native_name: str
    is_available: bool = True


class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    target_language: str = Field(..., description="Target language code: en, ur, de, fr, es, it, ja, ar, ko, ru")
    source_language: Optional[str] = Field(None, description="Source language code (auto-detect if omitted)")


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    success: bool = True


class LanguageDetectRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


class LanguageDetectResponse(BaseModel):
    text: str
    detected_language: str
    confidence: Optional[float] = None
    success: bool = True
