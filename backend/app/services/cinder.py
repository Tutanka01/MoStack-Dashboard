from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_volumes(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("volumev3", "/volumes/detail", cache_key="cinder:volumes")
    return first_list(data, "volumes")


async def create_volume(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("volumev3", "/volumes", method="POST", json={"volume": payload}, expected_status={200, 202})


async def update_volume(client: OpenStackClient, volume_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("volumev3", f"/volumes/{volume_id}", method="PUT", json={"volume": payload}, expected_status={200})


async def delete_volume(client: OpenStackClient, volume_id: str) -> dict[str, Any]:
    return await client.request("volumev3", f"/volumes/{volume_id}", method="DELETE", expected_status={202, 204})


async def extend_volume(client: OpenStackClient, volume_id: str, new_size: int) -> dict[str, Any]:
    return await client.request(
        "volumev3",
        f"/volumes/{volume_id}/action",
        method="POST",
        json={"os-extend": {"new_size": new_size}},
        expected_status={202},
    )


async def set_volume_bootable(client: OpenStackClient, volume_id: str, bootable: bool) -> dict[str, Any]:
    return await client.request(
        "volumev3",
        f"/volumes/{volume_id}/action",
        method="POST",
        json={"os-set_bootable": {"bootable": bootable}},
        expected_status={200},
    )


async def reset_volume_state(client: OpenStackClient, volume_id: str, status: str) -> dict[str, Any]:
    return await client.request(
        "volumev3",
        f"/volumes/{volume_id}/action",
        method="POST",
        json={"os-reset_status": {"status": status}},
        expected_status={202},
    )


async def upload_to_image(
    client: OpenStackClient,
    volume_id: str,
    image_name: str,
    disk_format: str = "raw",
    container_format: str = "bare",
) -> dict[str, Any]:
    return await client.request(
        "volumev3",
        f"/volumes/{volume_id}/action",
        method="POST",
        json={
            "os-volume_upload_image": {
                "image_name": image_name,
                "disk_format": disk_format,
                "container_format": container_format,
                "force": True,
            }
        },
        expected_status={202},
    )


async def list_types(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("volumev3", "/types", cache_key="cinder:types")
    return first_list(data, "volume_types")


async def list_services(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("volumev3", "/os-services", cache_key="cinder:services")
    return first_list(data, "services")


async def list_pools(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request(
        "volumev3",
        "/scheduler-stats/get_pools",
        params={"detail": "True"},
        cache_key="cinder:pools",
    )
    return first_list(data, "pools")


async def list_snapshots(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("volumev3", "/snapshots/detail", cache_key="cinder:snapshots")
    return first_list(data, "snapshots")


async def create_snapshot(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("volumev3", "/snapshots", method="POST", json={"snapshot": payload}, expected_status={202})


async def update_snapshot(client: OpenStackClient, snapshot_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("volumev3", f"/snapshots/{snapshot_id}", method="PUT", json={"snapshot": payload}, expected_status={200})


async def delete_snapshot(client: OpenStackClient, snapshot_id: str) -> dict[str, Any]:
    return await client.request("volumev3", f"/snapshots/{snapshot_id}", method="DELETE", expected_status={202, 204})
