from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_servers(client: OpenStackClient) -> list[dict[str, Any]]:
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
                "power_state": server.get("OS-EXT-STS:power_state"),
                "task_state": server.get("OS-EXT-STS:task_state"),
                "vm_state": server.get("OS-EXT-STS:vm_state"),
                "flavor": flavor.get("original_name") or flavor.get("id") if isinstance(flavor, dict) else flavor,
                "image": image.get("id") if isinstance(image, dict) else image,
                "addresses": server.get("addresses", {}),
                "host": server.get("OS-EXT-SRV-ATTR:host"),
                "key_name": server.get("key_name"),
                "security_groups": server.get("security_groups", []),
                "created_at": server.get("created"),
                "updated_at": server.get("updated"),
            }
        )
    return servers


async def get_server(client: OpenStackClient, server_id: str) -> dict[str, Any]:
    data = await client.request("compute", f"/servers/{server_id}")
    return data.get("server", data)


async def list_flavors(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("compute", "/flavors/detail", cache_key="nova:flavors")
    return first_list(data, "flavors")


async def create_flavor(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("compute", "/flavors", method="POST", json={"flavor": payload}, expected_status={200, 201})


async def delete_flavor(client: OpenStackClient, flavor_id: str) -> dict[str, Any]:
    return await client.request("compute", f"/flavors/{flavor_id}", method="DELETE", expected_status={202, 204})


async def create_server(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("compute", "/servers", method="POST", json={"server": payload}, expected_status={200, 202})


async def update_server(client: OpenStackClient, server_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("compute", f"/servers/{server_id}", method="PUT", json={"server": payload}, expected_status={200})


async def delete_server(client: OpenStackClient, server_id: str) -> dict[str, Any]:
    return await client.request("compute", f"/servers/{server_id}", method="DELETE", expected_status={202, 204})


async def server_action(client: OpenStackClient, server_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("compute", f"/servers/{server_id}/action", method="POST", json=payload, expected_status={200, 202, 204})


async def get_console_output(client: OpenStackClient, server_id: str, length: int = 100) -> dict[str, Any]:
    payload = {"os-getConsoleOutput": {"length": length}}
    return await client.request("compute", f"/servers/{server_id}/action", method="POST", json=payload, expected_status={200})


async def get_vnc_console(client: OpenStackClient, server_id: str, console_type: str = "novnc") -> dict[str, Any]:
    payload = {"os-getVNCConsole": {"type": console_type}}
    return await client.request("compute", f"/servers/{server_id}/action", method="POST", json=payload, expected_status={200})


async def create_server_image(client: OpenStackClient, server_id: str, name: str) -> dict[str, Any]:
    payload = {"createImage": {"name": name, "metadata": {}}}
    return await client.request("compute", f"/servers/{server_id}/action", method="POST", json=payload, expected_status={200, 202})


async def list_server_volumes(client: OpenStackClient, server_id: str) -> list[dict[str, Any]]:
    data = await client.request("compute", f"/servers/{server_id}/os-volume_attachments")
    return first_list(data, "volumeAttachments")


async def attach_volume(client: OpenStackClient, server_id: str, volume_id: str, device: str | None = None) -> dict[str, Any]:
    attachment: dict[str, Any] = {"volumeId": volume_id}
    if device:
        attachment["device"] = device
    return await client.request(
        "compute",
        f"/servers/{server_id}/os-volume_attachments",
        method="POST",
        json={"volumeAttachment": attachment},
        expected_status={200, 202},
    )


async def detach_volume(client: OpenStackClient, server_id: str, attachment_id: str) -> dict[str, Any]:
    return await client.request(
        "compute",
        f"/servers/{server_id}/os-volume_attachments/{attachment_id}",
        method="DELETE",
        expected_status={202, 204},
    )


async def list_keypairs(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("compute", "/os-keypairs", cache_key="nova:keypairs")
    items = first_list(data, "keypairs")
    return [item.get("keypair", item) for item in items]


async def create_keypair(client: OpenStackClient, name: str, public_key: str | None = None) -> dict[str, Any]:
    kp: dict[str, Any] = {"name": name}
    if public_key:
        kp["public_key"] = public_key
    return await client.request("compute", "/os-keypairs", method="POST", json={"keypair": kp}, expected_status={200, 201})


async def delete_keypair(client: OpenStackClient, name: str) -> dict[str, Any]:
    return await client.request("compute", f"/os-keypairs/{name}", method="DELETE", expected_status={202, 204})


async def list_hypervisors(client: OpenStackClient) -> list[dict[str, Any]]:
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
    data = await client.request("compute", "/os-services", cache_key="nova:services")
    return first_list(data, "services")


async def get_limits(client: OpenStackClient) -> dict[str, Any]:
    data = await client.request("compute", "/limits", cache_key="nova:limits")
    return data.get("limits", {}).get("absolute", {})
