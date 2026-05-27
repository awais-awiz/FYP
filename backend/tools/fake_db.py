from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional
from copy import deepcopy
from bson import ObjectId


def _get_value(doc: Dict[str, Any], path: str) -> Any:
    cur: Any = doc
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def _set_value(doc: Dict[str, Any], path: str, value: Any) -> None:
    parts = path.split(".")
    cur: Dict[str, Any] = doc
    for part in parts[:-1]:
        if part not in cur or not isinstance(cur[part], dict):
            cur[part] = {}
        cur = cur[part]
    cur[parts[-1]] = value


def _match_condition(value: Any, condition: Any) -> bool:
    if isinstance(condition, dict):
        for op, expected in condition.items():
            if op == "$gte":
                if value is None or value < expected:
                    return False
            elif op == "$gt":
                if value is None or value <= expected:
                    return False
            elif op == "$lte":
                if value is None or value > expected:
                    return False
            elif op == "$lt":
                if value is None or value >= expected:
                    return False
            elif op == "$ne":
                if value == expected:
                    return False
            elif op == "$in":
                if value not in expected:
                    return False
            elif op == "$nin":
                if value in expected:
                    return False
            else:
                return False
        return True
    return value == condition


def _match_filter(doc: Dict[str, Any], filters: Dict[str, Any]) -> bool:
    if not filters:
        return True
    for key, condition in filters.items():
        value = _get_value(doc, key)
        if not _match_condition(value, condition):
            return False
    return True


def _eval_expr(expr: Any, doc: Dict[str, Any]) -> Any:
    if isinstance(expr, dict):
        if "$cond" in expr:
            cond_expr, then_expr, else_expr = expr["$cond"]
            return _eval_expr(then_expr, doc) if _eval_expr(cond_expr, doc) else _eval_expr(else_expr, doc)
        if "$eq" in expr:
            left, right = expr["$eq"]
            return _eval_expr(left, doc) == _eval_expr(right, doc)
        if "$multiply" in expr:
            left, right = expr["$multiply"]
            return _eval_expr(left, doc) * _eval_expr(right, doc)
        if "$dateToString" in expr:
            params = expr["$dateToString"]
            dt = _eval_expr(params.get("date"), doc)
            fmt = params.get("format", "%Y-%m-%d")
            if isinstance(dt, datetime):
                return dt.strftime(fmt)
            return None
    if isinstance(expr, str) and expr.startswith("$"):
        return _get_value(doc, expr[1:])
    return expr


@dataclass
class InsertOneResult:
    inserted_id: ObjectId


@dataclass
class UpdateResult:
    matched_count: int
    modified_count: int
    upserted_id: Optional[ObjectId] = None


@dataclass
class DeleteResult:
    deleted_count: int


class FakeCursor:
    def __init__(self, docs: Iterable[Dict[str, Any]]):
        self._docs = list(docs)
        self._skip = 0
        self._limit: Optional[int] = None

    def sort(self, key: str, direction: int) -> "FakeCursor":
        reverse = direction < 0
        self._docs.sort(key=lambda d: _get_value(d, key), reverse=reverse)
        return self

    def skip(self, count: int) -> "FakeCursor":
        self._skip = max(0, count)
        return self

    def limit(self, count: int) -> "FakeCursor":
        self._limit = max(0, count)
        return self

    def _iter_docs(self) -> List[Dict[str, Any]]:
        docs = self._docs[self._skip:]
        if self._limit is not None:
            docs = docs[: self._limit]
        return docs

    def __aiter__(self):
        self._iter = iter(self._iter_docs())
        return self

    async def __anext__(self):
        try:
            return deepcopy(next(self._iter))
        except StopIteration:
            raise StopAsyncIteration


class FakeAggCursor:
    def __init__(self, docs: Iterable[Dict[str, Any]]):
        self._docs = list(docs)

    async def to_list(self, length: int) -> List[Dict[str, Any]]:
        if length is None or length <= 0:
            return deepcopy(self._docs)
        return deepcopy(self._docs[:length])


class FakeCollection:
    def __init__(self, name: str):
        self.name = name
        self._docs: List[Dict[str, Any]] = []

    def _ensure_id(self, doc: Dict[str, Any]) -> ObjectId:
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        return doc["_id"]

    def _find_one_internal(self, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self._docs:
            if _match_filter(doc, filters):
                return doc
        return None

    async def find_one(self, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = self._find_one_internal(filters)
        return deepcopy(doc) if doc else None

    def find(self, filters: Dict[str, Any] = None) -> FakeCursor:
        if filters is None:
            filters = {}
        docs = [deepcopy(d) for d in self._docs if _match_filter(d, filters)]
        return FakeCursor(docs)

    async def insert_one(self, doc: Dict[str, Any]) -> InsertOneResult:
        new_doc = deepcopy(doc)
        inserted_id = self._ensure_id(new_doc)
        self._docs.append(new_doc)
        return InsertOneResult(inserted_id=inserted_id)

    async def update_one(self, filters: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> UpdateResult:
        doc = self._find_one_internal(filters)
        if not doc:
            if not upsert:
                return UpdateResult(matched_count=0, modified_count=0)
            doc = deepcopy(filters)
            self._ensure_id(doc)
            self._docs.append(doc)
            matched = 1
            upserted_id = doc["_id"]
        else:
            matched = 1
            upserted_id = None

        modified = 0
        if "$set" in update:
            for k, v in update["$set"].items():
                _set_value(doc, k, v)
            modified = 1
        if "$setOnInsert" in update and upserted_id is not None:
            for k, v in update["$setOnInsert"].items():
                _set_value(doc, k, v)
            modified = 1
        if "$push" in update:
            for k, v in update["$push"].items():
                arr = _get_value(doc, k)
                if arr is None:
                    _set_value(doc, k, [v])
                else:
                    arr.append(v)
            modified = 1
        if "$inc" in update:
            for k, v in update["$inc"].items():
                current = _get_value(doc, k) or 0
                _set_value(doc, k, current + v)
            modified = 1

        return UpdateResult(matched_count=matched, modified_count=modified, upserted_id=upserted_id)

    async def update_many(self, filters: Dict[str, Any], update: Dict[str, Any]) -> UpdateResult:
        matched = 0
        modified = 0
        for doc in self._docs:
            if _match_filter(doc, filters):
                matched += 1
                if "$set" in update:
                    for k, v in update["$set"].items():
                        _set_value(doc, k, v)
                    modified += 1
        return UpdateResult(matched_count=matched, modified_count=modified)

    async def delete_one(self, filters: Dict[str, Any]) -> DeleteResult:
        for i, doc in enumerate(self._docs):
            if _match_filter(doc, filters):
                del self._docs[i]
                return DeleteResult(deleted_count=1)
        return DeleteResult(deleted_count=0)

    async def count_documents(self, filters: Dict[str, Any]) -> int:
        return sum(1 for d in self._docs if _match_filter(d, filters))

    async def distinct(self, field: str) -> List[Any]:
        values = {_get_value(d, field) for d in self._docs}
        return [v for v in values if v is not None]

    def aggregate(self, pipeline: List[Dict[str, Any]]) -> FakeAggCursor:
        docs = [deepcopy(d) for d in self._docs]
        for stage in pipeline:
            if "$match" in stage:
                filters = stage["$match"]
                docs = [d for d in docs if _match_filter(d, filters)]
            elif "$unwind" in stage:
                path = stage["$unwind"]
                if isinstance(path, dict):
                    path = path.get("path", "")
                if isinstance(path, str) and path.startswith("$"):
                    path = path[1:]
                unwound = []
                for d in docs:
                    items = _get_value(d, path)
                    if isinstance(items, list):
                        for item in items:
                            nd = deepcopy(d)
                            _set_value(nd, path, item)
                            unwound.append(nd)
                docs = unwound
            elif "$group" in stage:
                group_spec = stage["$group"]
                key_expr = group_spec.get("_id")
                groups: Dict[Any, Dict[str, Any]] = {}
                avg_meta: Dict[tuple, Dict[str, float]] = {}

                for d in docs:
                    key = _eval_expr(key_expr, d) if key_expr is not None else None
                    if key not in groups:
                        groups[key] = {"_id": key}
                    for out_field, expr in group_spec.items():
                        if out_field == "_id":
                            continue
                        if "$sum" in expr:
                            val = _eval_expr(expr["$sum"], d)
                            groups[key][out_field] = groups[key].get(out_field, 0) + (val or 0)
                        elif "$avg" in expr:
                            val = _eval_expr(expr["$avg"], d)
                            meta_key = (key, out_field)
                            meta = avg_meta.setdefault(meta_key, {"sum": 0.0, "count": 0})
                            if val is not None:
                                meta["sum"] += float(val)
                                meta["count"] += 1

                for (key, out_field), meta in avg_meta.items():
                    groups[key][out_field] = (meta["sum"] / meta["count"]) if meta["count"] else 0

                docs = list(groups.values())
            elif "$sort" in stage:
                sort_spec = stage["$sort"]
                for field, direction in reversed(list(sort_spec.items())):
                    reverse = direction < 0
                    docs.sort(key=lambda d: _get_value(d, field), reverse=reverse)
            elif "$limit" in stage:
                limit = stage["$limit"]
                docs = docs[:limit]

        return FakeAggCursor(docs)

    async def find_one_and_update(self, filters: Dict[str, Any], update: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = self._find_one_internal(filters)
        if not doc:
            return None
        if "$inc" in update:
            for k, v in update["$inc"].items():
                current = _get_value(doc, k) or 0
                _set_value(doc, k, current + v)
        if "$set" in update:
            for k, v in update["$set"].items():
                _set_value(doc, k, v)
        return deepcopy(doc)


class FakeDatabase:
    def __init__(self):
        self._collections: Dict[str, FakeCollection] = {}

    def __getattr__(self, name: str) -> FakeCollection:
        return self._collections.setdefault(name, FakeCollection(name))

    def __getitem__(self, name: str) -> FakeCollection:
        return self.__getattr__(name)


class FakeAdmin:
    async def command(self, _: str) -> Dict[str, Any]:
        return {"ok": 1}


class FakeClient:
    def __init__(self):
        self._db = FakeDatabase()
        self.admin = FakeAdmin()

    def __getitem__(self, _: str) -> FakeDatabase:
        return self._db
