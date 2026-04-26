from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_networks(client: OpenStackClient) -> list[dict[str, Any]]:
    # Neutron REST: GET /v2.0/networks.
    data = await client.request("network", "/v2.0/networks", cache_key="neutron:networks")
    return first_list(data, "networks")


async def list_subnets(client: OpenStackClient) -> list[dict[str, Any]]:
    # Neutron REST: GET /v2.0/subnets.
    data = await client.request("network", "/v2.0/subnets", cache_key="neutron:subnets")
    return first_list(data, "subnets")


async def list_ports(client: OpenStackClient) -> list[dict[str, Any]]:
    # Neutron REST: GET /v2.0/ports.
    data = await client.request("network", "/v2.0/ports", cache_key="neutron:ports")
    return first_list(data, "ports")


async def list_agents(client: OpenStackClient) -> list[dict[str, Any]]:
    # Neutron REST: GET /v2.0/agents.
    data = await client.request("network", "/v2.0/agents", cache_key="neutron:agents")
    return first_list(data, "agents")
