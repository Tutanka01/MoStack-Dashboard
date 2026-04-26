from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import nova
from app.utils.responses import ensure_write_enabled, operation_payload, service_payload

router = APIRouter(prefix="/api/compute", tags=["compute"])


class ServerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    image_id: str = Field(min_length=1)
    flavor_id: str = Field(min_length=1)
    network_id: str | None = None
    key_name: str | None = None
    security_groups: list[str] = []


class ServerUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ServerAction(BaseModel):
    action: Literal["start", "stop", "reboot", "pause", "unpause", "shelve", "unshelve", "resume", "confirm_resize", "revert_resize"]
    reboot_type: Literal["SOFT", "HARD"] = "SOFT"


class ServerResize(BaseModel):
    flavor_id: str = Field(min_length=1)


class ServerSnapshot(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class VolumeAttach(BaseModel):
    volume_id: str = Field(min_length=1)
    device: str | None = None


class KeypairCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    public_key: str | None = None


class FlavorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    vcpus: int = Field(ge=1)
    ram: int = Field(ge=128, description="RAM in MB")
    disk: int = Field(ge=0, description="Root disk in GB")
    is_public: bool = True
    ephemeral: int = 0
    swap: int = 0


# ─── servers ─────────────────────────────────────────────────────────────────

@router.get("/servers")
async def servers(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_servers(client))


@router.get("/servers/{server_id}")
async def get_server(server_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.get_server(client, server_id))


@router.post("/servers")
async def create_server(payload: ServerCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    server: dict = {
        "name": payload.name,
        "imageRef": payload.image_id,
        "flavorRef": payload.flavor_id,
    }
    if payload.network_id:
        server["networks"] = [{"uuid": payload.network_id}]
    if payload.key_name:
        server["key_name"] = payload.key_name
    if payload.security_groups:
        server["security_groups"] = [{"name": sg} for sg in payload.security_groups]
    return await operation_payload("nova", "create_server", lambda: nova.create_server(client, server))


@router.patch("/servers/{server_id}")
async def update_server(server_id: str, payload: ServerUpdate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("nova", "update_server", lambda: nova.update_server(client, server_id, {"name": payload.name}))


@router.delete("/servers/{server_id}")
async def delete_server(server_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("nova", "delete_server", lambda: nova.delete_server(client, server_id))


@router.post("/servers/{server_id}/action")
async def mutate_server(server_id: str, payload: ServerAction, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    action_map = {
        "start": {"os-start": None},
        "stop": {"os-stop": None},
        "reboot": {"reboot": {"type": payload.reboot_type}},
        "pause": {"pause": None},
        "unpause": {"unpause": None},
        "shelve": {"shelve": None},
        "unshelve": {"unshelve": None},
        "resume": {"resume": None},
        "confirm_resize": {"confirmResize": None},
        "revert_resize": {"revertResize": None},
    }
    action_body = action_map[payload.action]
    return await operation_payload("nova", payload.action, lambda: nova.server_action(client, server_id, action_body))


@router.post("/servers/{server_id}/resize")
async def resize_server(server_id: str, payload: ServerResize, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload(
        "nova", "resize",
        lambda: nova.server_action(client, server_id, {"resize": {"flavorRef": payload.flavor_id}})
    )


@router.post("/servers/{server_id}/snapshot")
async def snapshot_server(server_id: str, payload: ServerSnapshot, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("nova", "create_image", lambda: nova.create_server_image(client, server_id, payload.name))


@router.get("/servers/{server_id}/console-output")
async def console_output(server_id: str, length: int = 100, client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.get_console_output(client, server_id, length))


@router.post("/servers/{server_id}/console-url")
async def console_url(server_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.get_vnc_console(client, server_id))


@router.get("/servers/{server_id}/volumes")
async def server_volumes(server_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_server_volumes(client, server_id))


@router.post("/servers/{server_id}/volumes")
async def attach_volume(server_id: str, payload: VolumeAttach, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload(
        "nova", "attach_volume",
        lambda: nova.attach_volume(client, server_id, payload.volume_id, payload.device)
    )


@router.delete("/servers/{server_id}/volumes/{attachment_id}")
async def detach_volume(server_id: str, attachment_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("nova", "detach_volume", lambda: nova.detach_volume(client, server_id, attachment_id))


# ─── flavors ─────────────────────────────────────────────────────────────────

@router.get("/flavors")
async def flavors(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_flavors(client))


@router.post("/flavors")
async def create_flavor(payload: FlavorCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    flavor_data = {
        "name": payload.name,
        "vcpus": payload.vcpus,
        "ram": payload.ram,
        "disk": payload.disk,
        "os-flavor-access:is_public": payload.is_public,
        "OS-FLV-EXT-DATA:ephemeral": payload.ephemeral,
        "swap": payload.swap,
    }
    return await operation_payload("nova", "create_flavor", lambda: nova.create_flavor(client, flavor_data))


@router.delete("/flavors/{flavor_id}")
async def delete_flavor(flavor_id: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("nova", "delete_flavor", lambda: nova.delete_flavor(client, flavor_id))


# ─── keypairs ────────────────────────────────────────────────────────────────

@router.get("/keypairs")
async def keypairs(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_keypairs(client))


@router.post("/keypairs")
async def create_keypair(payload: KeypairCreate, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("nova", "create_keypair", lambda: nova.create_keypair(client, payload.name, payload.public_key))


@router.delete("/keypairs/{name}")
async def delete_keypair(name: str, client: OpenStackClient = Depends(get_openstack_client)):
    ensure_write_enabled(client.settings)
    return await operation_payload("nova", "delete_keypair", lambda: nova.delete_keypair(client, name))


# ─── infrastructure ──────────────────────────────────────────────────────────

@router.get("/hypervisors")
async def hypervisors(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_hypervisors(client))


@router.get("/services")
async def services(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.list_services(client))


@router.get("/limits")
async def limits(client: OpenStackClient = Depends(get_openstack_client)):
    return await service_payload("nova", lambda: nova.get_limits(client))
