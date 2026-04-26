from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_images(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("image", "/v2/images", cache_key="glance:images")
    return first_list(data, "images")


async def create_image(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("image", "/v2/images", method="POST", json=payload, expected_status={201})


async def update_image(client: OpenStackClient, image_id: str, patch: list[dict[str, Any]]) -> dict[str, Any]:
    return await client.request(
        "image",
        f"/v2/images/{image_id}",
        method="PATCH",
        json=patch,
        headers={"Content-Type": "application/openstack-images-v2.1-json-patch"},
        expected_status={200},
    )


async def delete_image(client: OpenStackClient, image_id: str) -> dict[str, Any]:
    return await client.request("image", f"/v2/images/{image_id}", method="DELETE", expected_status={204})


async def import_from_url(client: OpenStackClient, image_id: str, url: str) -> dict[str, Any]:
    return await client.request(
        "image",
        f"/v2/images/{image_id}/import",
        method="POST",
        json={"method": {"name": "web-download", "uri": url}},
        expected_status={202, 204},
    )


async def deactivate_image(client: OpenStackClient, image_id: str) -> dict[str, Any]:
    return await client.request("image", f"/v2/images/{image_id}/actions/deactivate", method="POST", expected_status={204})


async def reactivate_image(client: OpenStackClient, image_id: str) -> dict[str, Any]:
    return await client.request("image", f"/v2/images/{image_id}/actions/reactivate", method="POST", expected_status={204})
