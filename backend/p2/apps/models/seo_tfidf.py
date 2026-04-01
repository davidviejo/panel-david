from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


class TfidfConfig(BaseModel):
    model_config = ConfigDict(extra='forbid')

    min_df: float | int = Field(default=1)
    max_df: float | int = Field(default=1.0)
    max_features: int = Field(default=500, ge=1, le=50000)
    ngram_range: tuple[int, int] = Field(default=(1, 2))

    @field_validator('min_df')
    @classmethod
    def validate_min_df(cls, value: float | int) -> float | int:
        if isinstance(value, float):
            if value <= 0 or value > 1:
                raise ValueError('min_df como float debe estar en rango (0, 1].')
            return value
        if value < 1:
            raise ValueError('min_df como entero debe ser >= 1.')
        return value

    @field_validator('max_df')
    @classmethod
    def validate_max_df(cls, value: float | int) -> float | int:
        if isinstance(value, float):
            if value <= 0 or value > 1:
                raise ValueError('max_df como float debe estar en rango (0, 1].')
            return value
        if value < 1:
            raise ValueError('max_df como entero debe ser >= 1.')
        return value

    @field_validator('ngram_range')
    @classmethod
    def validate_ngram_range(cls, value: tuple[int, int]) -> tuple[int, int]:
        if len(value) != 2:
            raise ValueError('ngram_range debe tener exactamente 2 elementos.')
        ngram_min, ngram_max = value
        if ngram_min < 1 or ngram_max < 1:
            raise ValueError('ngram_range debe contener valores >= 1.')
        if ngram_min > ngram_max:
            raise ValueError('ngram_range inválido: min no puede ser mayor que max.')
        if ngram_max > 5:
            raise ValueError('ngram_range max soportado es 5.')
        return value

    @model_validator(mode='after')
    def validate_df_relationship(self) -> 'TfidfConfig':
        if isinstance(self.min_df, float) != isinstance(self.max_df, float):
            raise ValueError('min_df y max_df deben usar el mismo tipo (ambos int o ambos float).')
        if self.min_df > self.max_df:
            raise ValueError('min_df no puede ser mayor que max_df.')
        return self


class CreateProjectRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)


class CreateProjectResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')

    project_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime


class AddDocumentsRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    project_id: str = Field(min_length=1)
    urls: List[HttpUrl] = Field(min_length=1, max_length=100)


class AddDocumentsResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')

    project_id: str
    added_count: int
    total_count: int


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    target_url: HttpUrl
    reference_urls: List[HttpUrl] = Field(min_length=1, max_length=100)
    tfidf: TfidfConfig = Field(default_factory=TfidfConfig)


class TermScore(BaseModel):
    model_config = ConfigDict(extra='forbid')

    term: str
    score: float


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')

    run_id: str
    summary: Dict[str, Any]
    recommendations: List[str]
    terms: List[TermScore]


class RunDetailResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')

    run_id: str
    status: str
    target_url: HttpUrl
    reference_urls: List[HttpUrl]
    tfidf: TfidfConfig
    summary: Dict[str, Any]
    recommendations: List[str]
    terms: List[TermScore]
    created_at: datetime


class ProjectListItem(BaseModel):
    model_config = ConfigDict(extra='forbid')

    project_id: str
    name: str
    description: Optional[str] = None
    document_count: int
    created_at: datetime


class RunListItem(BaseModel):
    model_config = ConfigDict(extra='forbid')

    run_id: str
    status: str
    target_url: HttpUrl
    created_at: datetime


class ListProjectsResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')

    projects: List[ProjectListItem]


class ListRunsResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')

    runs: List[RunListItem]
