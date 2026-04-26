from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import glance
from app.utils.responses import ensure_write_enabled, operation_payload, service_payload

router = APIRouter(prefix="/api", tags=["images"])


class ImageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    disk_format: str = "qcow2"
    container_format: str = "bare"
    visibility: str = "private"


class ImageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    visibility: str | None = None


class ImageImport(BaseModel):
    url: str = Field(min_length=1)


@router.get("/images")
async def images(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("glance", lambda: glance.list_images(client))


@router.post("/images")
async def create_image(payload: ImageCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("glance", "create_image", lambda: glance.create_image(client, payload.model_dump()))


@router.patch("/images/{image_id}")
async def update_image(image_id: str, payload: ImageUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    patch = [{"op": "replace", "path": f"/{key}", "value": value} for key, value in payload.model_dump(exclude_none=True).items()]
    return await operation_payload("glance", "update_image", lambda: glance.update_image(client, image_id, patch))


@router.delete("/images/{image_id}")
async def delete_image(image_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("glance", "delete_image", lambda: glance.delete_image(client, image_id))


@router.post("/images/{image_id}/import")
async def import_image(image_id: str, payload: ImageImport, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("glance", "import_image", lambda: glance.import_from_url(client, image_id, payload.url))


@router.post("/images/{image_id}/deactivate")
async def deactivate_image(image_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("glance", "deactivate_image", lambda: glance.deactivate_image(client, image_id))


@router.post("/images/{image_id}/reactivate")
async def reactivate_image(image_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("glance", "reactivate_image", lambda: glance.reactivate_image(client, image_id))
