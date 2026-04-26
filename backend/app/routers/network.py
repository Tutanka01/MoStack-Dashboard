from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import neutron
from app.utils.responses import ensure_write_enabled, operation_payload, service_payload

router = APIRouter(prefix="/api/network", tags=["network"])


class NetworkCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    admin_state_up: bool = True
    shared: bool = False


class NetworkUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    admin_state_up: bool | None = None
    shared: bool | None = None


class SubnetCreate(BaseModel):
    network_id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=255)
    cidr: str = Field(min_length=1)
    gateway_ip: str | None = None
    enable_dhcp: bool = True
    ip_version: int = Field(default=4, ge=4, le=6)


class SubnetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    gateway_ip: str | None = None
    enable_dhcp: bool | None = None


class PortCreate(BaseModel):
    network_id: str = Field(min_length=1)
    name: str | None = None
    admin_state_up: bool = True


class PortUpdate(BaseModel):
    name: str | None = None
    admin_state_up: bool | None = None


class RouterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    admin_state_up: bool = True
    external_network_id: str | None = None


class RouterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    admin_state_up: bool | None = None
    external_network_id: str | None = None


class RouterInterface(BaseModel):
    subnet_id: str = Field(min_length=1)


class FloatingIPCreate(BaseModel):
    floating_network_id: str = Field(min_length=1)
    port_id: str | None = None
    fixed_ip_address: str | None = None


class FloatingIPUpdate(BaseModel):
    port_id: str | None = None


class SecurityGroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""


class SecurityGroupRuleCreate(BaseModel):
    security_group_id: str = Field(min_length=1)
    direction: str = Field(pattern="^(ingress|egress)$")
    ethertype: str = "IPv4"
    protocol: str | None = None
    port_range_min: int | None = None
    port_range_max: int | None = None
    remote_ip_prefix: str | None = None
    remote_group_id: str | None = None


# ─── networks ────────────────────────────────────────────────────────────────

@router.get("/networks")
async def networks(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_networks(client))


@router.post("/networks")
async def create_network(payload: NetworkCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "create_network", lambda: neutron.create_network(client, payload.model_dump()))


@router.patch("/networks/{network_id}")
async def update_network(network_id: str, payload: NetworkUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "update_network", lambda: neutron.update_network(client, network_id, payload.model_dump(exclude_none=True)))


@router.delete("/networks/{network_id}")
async def delete_network(network_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "delete_network", lambda: neutron.delete_network(client, network_id))


# ─── subnets ─────────────────────────────────────────────────────────────────

@router.get("/subnets")
async def subnets(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_subnets(client))


@router.post("/subnets")
async def create_subnet(payload: SubnetCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "create_subnet", lambda: neutron.create_subnet(client, payload.model_dump(exclude_none=True)))


@router.patch("/subnets/{subnet_id}")
async def update_subnet(subnet_id: str, payload: SubnetUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "update_subnet", lambda: neutron.update_subnet(client, subnet_id, payload.model_dump(exclude_none=True)))


@router.delete("/subnets/{subnet_id}")
async def delete_subnet(subnet_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "delete_subnet", lambda: neutron.delete_subnet(client, subnet_id))


# ─── ports ───────────────────────────────────────────────────────────────────

@router.get("/ports")
async def ports(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_ports(client))


@router.post("/ports")
async def create_port(payload: PortCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "create_port", lambda: neutron.create_port(client, payload.model_dump(exclude_none=True)))


@router.patch("/ports/{port_id}")
async def update_port(port_id: str, payload: PortUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "update_port", lambda: neutron.update_port(client, port_id, payload.model_dump(exclude_none=True)))


@router.delete("/ports/{port_id}")
async def delete_port(port_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "delete_port", lambda: neutron.delete_port(client, port_id))


# ─── agents ──────────────────────────────────────────────────────────────────

@router.get("/agents")
async def agents(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_agents(client))


# ─── routers ─────────────────────────────────────────────────────────────────

@router.get("/routers")
async def routers(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_routers(client))


@router.post("/routers")
async def create_router(payload: RouterCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    router_data: dict = {"name": payload.name, "admin_state_up": payload.admin_state_up}
    if payload.external_network_id:
        router_data["external_gateway_info"] = {"network_id": payload.external_network_id}
    return await operation_payload("neutron", "create_router", lambda: neutron.create_router(client, router_data))


@router.patch("/routers/{router_id}")
async def update_router(router_id: str, payload: RouterUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    data = payload.model_dump(exclude_none=True)
    if "external_network_id" in data:
        ext_net = data.pop("external_network_id")
        data["external_gateway_info"] = {"network_id": ext_net} if ext_net else None
    return await operation_payload("neutron", "update_router", lambda: neutron.update_router(client, router_id, data))


@router.delete("/routers/{router_id}")
async def delete_router(router_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "delete_router", lambda: neutron.delete_router(client, router_id))


@router.post("/routers/{router_id}/add_interface")
async def add_router_interface(router_id: str, payload: RouterInterface, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "add_interface", lambda: neutron.add_router_interface(client, router_id, payload.subnet_id))


@router.post("/routers/{router_id}/remove_interface")
async def remove_router_interface(router_id: str, payload: RouterInterface, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "remove_interface", lambda: neutron.remove_router_interface(client, router_id, payload.subnet_id))


# ─── floating IPs ────────────────────────────────────────────────────────────

@router.get("/floatingips")
async def floatingips(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_floatingips(client))


@router.post("/floatingips")
async def create_floatingip(payload: FloatingIPCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "create_floatingip", lambda: neutron.create_floatingip(client, payload.model_dump(exclude_none=True)))


@router.patch("/floatingips/{floatingip_id}")
async def update_floatingip(floatingip_id: str, payload: FloatingIPUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "update_floatingip", lambda: neutron.update_floatingip(client, floatingip_id, payload.model_dump()))


@router.delete("/floatingips/{floatingip_id}")
async def delete_floatingip(floatingip_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "delete_floatingip", lambda: neutron.delete_floatingip(client, floatingip_id))


# ─── security groups ─────────────────────────────────────────────────────────

@router.get("/security-groups")
async def security_groups(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_security_groups(client))


@router.post("/security-groups")
async def create_security_group(payload: SecurityGroupCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "create_security_group", lambda: neutron.create_security_group(client, payload.model_dump()))


@router.delete("/security-groups/{sg_id}")
async def delete_security_group(sg_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "delete_security_group", lambda: neutron.delete_security_group(client, sg_id))


@router.get("/security-group-rules")
async def security_group_rules(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_security_group_rules(client))


@router.post("/security-group-rules")
async def create_security_group_rule(payload: SecurityGroupRuleCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "create_sg_rule", lambda: neutron.create_security_group_rule(client, payload.model_dump(exclude_none=True)))


@router.delete("/security-group-rules/{rule_id}")
async def delete_security_group_rule(rule_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("neutron", "delete_sg_rule", lambda: neutron.delete_security_group_rule(client, rule_id))
