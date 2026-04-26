from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_volumes(client: OpenStackClient) -> list[dict[str, Any]]:
    # Cinder v3 REST: GET /volumes/detail lists block volumes for the scoped project.
    data = await client.request("volumev3", "/volumes/detail", cache_key="cinder:volumes")
    return first_list(data, "volumes")


async def list_types(client: OpenStackClient) -> list[dict[str, Any]]:
    # Cinder v3 REST: GET /types lists configured volume types such as lvm.
    data = await client.request("volumev3", "/types", cache_key="cinder:types")
    return first_list(data, "volume_types")


async def list_services(client: OpenStackClient) -> list[dict[str, Any]]:
    # Cinder v3 REST: GET /os-services lists cinder-api, scheduler, backup and volume workers.
    data = await client.request("volumev3", "/os-services", cache_key="cinder:services")
    return first_list(data, "services")


async def list_pools(client: OpenStackClient) -> list[dict[str, Any]]:
    # Cinder v3 REST: GET /scheduler-stats/get_pools?detail=True exposes backend capacity.
    data = await client.request(
        "volumev3",
        "/scheduler-stats/get_pools",
        params={"detail": "True"},
        cache_key="cinder:pools",
    )
    return first_list(data, "pools")
