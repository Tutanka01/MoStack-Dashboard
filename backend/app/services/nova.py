from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_servers(client: OpenStackClient) -> list[dict[str, Any]]:
    # Nova REST: GET /servers/detail lists instances visible to the scoped project.
    data = await client.request("compute", "/servers/detail", cache_key="nova:servers")
    servers = []
    for server in first_list(data, "servers"):
        flavor = server.get("flavor") or {}
        image = server.get("image") or {}
        servers.append(
            {
                "id": server.get("id"),
                "name": server.get("name"),
                "status": server.get("status"),
                "flavor": flavor.get("original_name") or flavor.get("id") if isinstance(flavor, dict) else flavor,
                "image": image.get("id") if isinstance(image, dict) else image,
                "addresses": server.get("addresses", {}),
                "host": server.get("OS-EXT-SRV-ATTR:host"),
                "created_at": server.get("created"),
                "updated_at": server.get("updated"),
            }
        )
    return servers


async def list_hypervisors(client: OpenStackClient) -> list[dict[str, Any]]:
    # Nova REST: GET /os-hypervisors/detail exposes resource usage per compute node.
    data = await client.request("compute", "/os-hypervisors/detail", cache_key="nova:hypervisors")
    hypervisors = []
    for item in first_list(data, "hypervisors"):
        hypervisors.append(
            {
                "id": item.get("id"),
                "hostname": item.get("hypervisor_hostname"),
                "type": item.get("hypervisor_type"),
                "state": item.get("state"),
                "status": item.get("status"),
                "vcpus": item.get("vcpus"),
                "vcpus_used": item.get("vcpus_used"),
                "memory_mb": item.get("memory_mb"),
                "memory_mb_used": item.get("memory_mb_used"),
                "local_gb": item.get("local_gb"),
                "local_gb_used": item.get("local_gb_used"),
                "running_vms": item.get("running_vms"),
            }
        )
    return hypervisors


async def list_services(client: OpenStackClient) -> list[dict[str, Any]]:
    # Nova REST: GET /os-services lists nova-api, scheduler, conductor and compute services.
    data = await client.request("compute", "/os-services", cache_key="nova:services")
    return first_list(data, "services")
