from typing import Any, Awaitable, Callable

from fastapi import HTTPException

from app.config import Settings
from app.openstack_client import OpenStackAPIError


async def service_payload(service: str, loader: Callable[[], Awaitable[Any]], key: str = "items") -> dict[str, Any]:
    try:
        data = await loader()
        return {"service": service, "available": True, key: data, "error": None}
    except OpenStackAPIError as exc:
        return {"service": service, "available": False, key: [], "error": exc.message}


def first_list(payload: dict[str, Any], *keys: str) -> list[dict[str, Any]]:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, list):
            return value
    return []


def ensure_write_enabled(settings: Settings) -> None:
    if settings.dashboard_read_only:
        raise HTTPException(
            status_code=403,
            detail="Dashboard is locked in read-only mode. Set DASHBOARD_READ_ONLY=false on the backend to allow mutations.",
        )


async def operation_payload(service: str, action: str, loader: Callable[[], Awaitable[Any]]) -> dict[str, Any]:
    try:
        data = await loader()
        return {"service": service, "action": action, "ok": True, "result": data, "error": None}
    except OpenStackAPIError as exc:
        raise HTTPException(status_code=exc.status_code or 502, detail=exc.message) from exc
