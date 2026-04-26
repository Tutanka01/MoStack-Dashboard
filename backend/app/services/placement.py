from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_resource_providers(client: OpenStackClient) -> list[dict[str, Any]]:
    # Placement REST: GET /resource_providers lists providers Nova reports inventory against.
    data = await client.request("placement", "/resource_providers", cache_key="placement:providers")
    return first_list(data, "resource_providers")
