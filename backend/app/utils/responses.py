from typing import Any, Awaitable, Callable

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
