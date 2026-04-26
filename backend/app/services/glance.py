from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_images(client: OpenStackClient) -> list[dict[str, Any]]:
    # Glance REST: GET /v2/images returns image metadata used by Nova boot operations.
    data = await client.request("image", "/v2/images", cache_key="glance:images")
    return first_list(data, "images")
