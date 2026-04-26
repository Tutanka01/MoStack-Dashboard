from fastapi import APIRouter, Depends

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import keystone
from app.utils.responses import service_payload

router = APIRouter(prefix="/api/identity", tags=["identity"])


@router.get("/projects")
async def projects(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("keystone", lambda: keystone.list_projects(client))


@router.get("/users")
async def users(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("keystone", lambda: keystone.list_users(client))


@router.get("/roles")
async def roles(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("keystone", lambda: keystone.list_roles(client))


@router.get("/endpoints")
async def endpoints(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("keystone", lambda: keystone.list_endpoints(client))
