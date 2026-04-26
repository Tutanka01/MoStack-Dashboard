from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_projects(client: OpenStackClient) -> list[dict[str, Any]]:
    # Keystone REST: GET /projects.
    data = await client.request("identity", "/projects", cache_key="keystone:projects")
    return first_list(data, "projects")


async def list_users(client: OpenStackClient) -> list[dict[str, Any]]:
    # Keystone REST: GET /users.
    data = await client.request("identity", "/users", cache_key="keystone:users")
    return first_list(data, "users")


async def list_roles(client: OpenStackClient) -> list[dict[str, Any]]:
    # Keystone REST: GET /roles.
    data = await client.request("identity", "/roles", cache_key="keystone:roles")
    return first_list(data, "roles")


async def list_endpoints(client: OpenStackClient) -> list[dict[str, Any]]:
    # Keystone REST: GET /endpoints.
    data = await client.request("identity", "/endpoints", cache_key="keystone:endpoints")
    return first_list(data, "endpoints")
