from fastapi import APIRouter, Depends

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import cinder
from app.utils.responses import service_payload

router = APIRouter(prefix="/api/storage", tags=["storage"])


@router.get("/volumes")
async def volumes(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_volumes(client))


@router.get("/types")
async def types(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_types(client))


@router.get("/services")
async def services(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_services(client))


@router.get("/pools")
async def pools(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_pools(client))
