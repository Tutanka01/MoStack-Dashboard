from typing import Any

from app.openstack_client import OpenStackClient
from app.utils.responses import first_list


async def list_networks(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("network", "/v2.0/networks", cache_key="neutron:networks")
    return first_list(data, "networks")


async def create_network(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", "/v2.0/networks", method="POST", json={"network": payload}, expected_status={201})


async def update_network(client: OpenStackClient, network_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/networks/{network_id}", method="PUT", json={"network": payload}, expected_status={200})


async def delete_network(client: OpenStackClient, network_id: str) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/networks/{network_id}", method="DELETE", expected_status={204})


async def list_subnets(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("network", "/v2.0/subnets", cache_key="neutron:subnets")
    return first_list(data, "subnets")


async def create_subnet(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", "/v2.0/subnets", method="POST", json={"subnet": payload}, expected_status={201})


async def update_subnet(client: OpenStackClient, subnet_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/subnets/{subnet_id}", method="PUT", json={"subnet": payload}, expected_status={200})


async def delete_subnet(client: OpenStackClient, subnet_id: str) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/subnets/{subnet_id}", method="DELETE", expected_status={204})


async def list_ports(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("network", "/v2.0/ports", cache_key="neutron:ports")
    return first_list(data, "ports")


async def create_port(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", "/v2.0/ports", method="POST", json={"port": payload}, expected_status={201})


async def update_port(client: OpenStackClient, port_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/ports/{port_id}", method="PUT", json={"port": payload}, expected_status={200})


async def delete_port(client: OpenStackClient, port_id: str) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/ports/{port_id}", method="DELETE", expected_status={204})


async def list_agents(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("network", "/v2.0/agents", cache_key="neutron:agents")
    return first_list(data, "agents")


async def list_routers(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("network", "/v2.0/routers", cache_key="neutron:routers")
    return first_list(data, "routers")


async def create_router(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", "/v2.0/routers", method="POST", json={"router": payload}, expected_status={201})


async def update_router(client: OpenStackClient, router_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/routers/{router_id}", method="PUT", json={"router": payload}, expected_status={200})


async def delete_router(client: OpenStackClient, router_id: str) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/routers/{router_id}", method="DELETE", expected_status={204})


async def add_router_interface(client: OpenStackClient, router_id: str, subnet_id: str) -> dict[str, Any]:
    return await client.request(
        "network",
        f"/v2.0/routers/{router_id}/add_router_interface",
        method="PUT",
        json={"subnet_id": subnet_id},
        expected_status={200},
    )


async def remove_router_interface(client: OpenStackClient, router_id: str, subnet_id: str) -> dict[str, Any]:
    return await client.request(
        "network",
        f"/v2.0/routers/{router_id}/remove_router_interface",
        method="PUT",
        json={"subnet_id": subnet_id},
        expected_status={200},
    )


async def list_floatingips(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("network", "/v2.0/floatingips", cache_key="neutron:floatingips")
    return first_list(data, "floatingips")


async def create_floatingip(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", "/v2.0/floatingips", method="POST", json={"floatingip": payload}, expected_status={201})


async def update_floatingip(client: OpenStackClient, floatingip_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/floatingips/{floatingip_id}", method="PUT", json={"floatingip": payload}, expected_status={200})


async def delete_floatingip(client: OpenStackClient, floatingip_id: str) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/floatingips/{floatingip_id}", method="DELETE", expected_status={204})


async def list_security_groups(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("network", "/v2.0/security-groups", cache_key="neutron:security_groups")
    return first_list(data, "security_groups")


async def create_security_group(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request("network", "/v2.0/security-groups", method="POST", json={"security_group": payload}, expected_status={201})


async def delete_security_group(client: OpenStackClient, sg_id: str) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/security-groups/{sg_id}", method="DELETE", expected_status={204})


async def list_security_group_rules(client: OpenStackClient) -> list[dict[str, Any]]:
    data = await client.request("network", "/v2.0/security-group-rules", cache_key="neutron:sg_rules")
    return first_list(data, "security_group_rules")


async def create_security_group_rule(client: OpenStackClient, payload: dict[str, Any]) -> dict[str, Any]:
    return await client.request(
        "network",
        "/v2.0/security-group-rules",
        method="POST",
        json={"security_group_rule": payload},
        expected_status={201},
    )


async def delete_security_group_rule(client: OpenStackClient, rule_id: str) -> dict[str, Any]:
    return await client.request("network", f"/v2.0/security-group-rules/{rule_id}", method="DELETE", expected_status={204})
