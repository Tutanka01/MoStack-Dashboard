from fastapi import APIRouter, Depends

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import neutron
from app.utils.responses import service_payload

router = APIRouter(prefix="/api/network", tags=["network"])


@router.get("/networks")
async def networks(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_networks(client))


@router.get("/subnets")
async def subnets(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_subnets(client))


@router.get("/ports")
async def ports(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_ports(client))


@router.get("/agents")
async def agents(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("neutron", lambda: neutron.list_agents(client))
