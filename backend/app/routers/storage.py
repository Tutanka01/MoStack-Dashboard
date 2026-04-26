from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import cinder
from app.utils.responses import ensure_write_enabled, operation_payload, service_payload

router = APIRouter(prefix="/api/storage", tags=["storage"])


class VolumeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    size: int = Field(ge=1)
    description: str | None = None
    volume_type: str | None = None
    snapshot_id: str | None = None
    imageRef: str | None = None


class VolumeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class VolumeExtend(BaseModel):
    new_size: int = Field(ge=1)


class VolumeSetBootable(BaseModel):
    bootable: bool


class VolumeResetState(BaseModel):
    status: str


class VolumeUploadToImage(BaseModel):
    image_name: str = Field(min_length=1, max_length=255)
    disk_format: str = "raw"
    container_format: str = "bare"


class SnapshotCreate(BaseModel):
    volume_id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    force: bool = False


class SnapshotUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


# ─── volumes ─────────────────────────────────────────────────────────────────

@router.get("/volumes")
async def volumes(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_volumes(client))


@router.post("/volumes")
async def create_volume(payload: VolumeCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "create_volume", lambda: cinder.create_volume(client, payload.model_dump(exclude_none=True)))


@router.patch("/volumes/{volume_id}")
async def update_volume(volume_id: str, payload: VolumeUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "update_volume", lambda: cinder.update_volume(client, volume_id, payload.model_dump(exclude_none=True)))


@router.delete("/volumes/{volume_id}")
async def delete_volume(volume_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "delete_volume", lambda: cinder.delete_volume(client, volume_id))


@router.post("/volumes/{volume_id}/extend")
async def extend_volume(volume_id: str, payload: VolumeExtend, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "extend_volume", lambda: cinder.extend_volume(client, volume_id, payload.new_size))


@router.post("/volumes/{volume_id}/set-bootable")
async def set_bootable(volume_id: str, payload: VolumeSetBootable, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "set_bootable", lambda: cinder.set_volume_bootable(client, volume_id, payload.bootable))


@router.post("/volumes/{volume_id}/reset-state")
async def reset_state(volume_id: str, payload: VolumeResetState, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "reset_state", lambda: cinder.reset_volume_state(client, volume_id, payload.status))


@router.post("/volumes/{volume_id}/upload-to-image")
async def upload_to_image(volume_id: str, payload: VolumeUploadToImage, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload(
        "cinder", "upload_to_image",
        lambda: cinder.upload_to_image(client, volume_id, payload.image_name, payload.disk_format, payload.container_format)
    )


# ─── snapshots ───────────────────────────────────────────────────────────────

@router.get("/snapshots")
async def snapshots(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_snapshots(client))


@router.post("/snapshots")
async def create_snapshot(payload: SnapshotCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "create_snapshot", lambda: cinder.create_snapshot(client, payload.model_dump(exclude_none=True)))


@router.patch("/snapshots/{snapshot_id}")
async def update_snapshot(snapshot_id: str, payload: SnapshotUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "update_snapshot", lambda: cinder.update_snapshot(client, snapshot_id, payload.model_dump(exclude_none=True)))


@router.delete("/snapshots/{snapshot_id}")
async def delete_snapshot(snapshot_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("cinder", "delete_snapshot", lambda: cinder.delete_snapshot(client, snapshot_id))


# ─── metadata ────────────────────────────────────────────────────────────────

@router.get("/types")
async def types(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_types(client))


@router.get("/services")
async def services(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_services(client))


@router.get("/pools")
async def pools(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("cinder", lambda: cinder.list_pools(client))
