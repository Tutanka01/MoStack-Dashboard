from fastapi import APIRouter, Depends

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import glance
from app.utils.responses import service_payload

router = APIRouter(prefix="/api", tags=["images"])


@router.get("/images")
async def images(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("glance", lambda: glance.list_images(client))
