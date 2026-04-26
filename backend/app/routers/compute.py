from fastapi import APIRouter, Depends

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import nova
from app.utils.responses import service_payload

router = APIRouter(prefix="/api/compute", tags=["compute"])


@router.get("/servers")
async def servers(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_servers(client))


@router.get("/hypervisors")
async def hypervisors(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_hypervisors(client))


@router.get("/services")
async def services(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_services(client))
