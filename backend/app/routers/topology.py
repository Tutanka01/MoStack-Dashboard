import asyncio

from fastapi import APIRouter, Depends

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import cinder, nova, neutron
from app.utils.responses import service_payload

router = APIRouter(prefix="/api", tags=["topology"])


@router.get("/topology")
async def topology(client: OpenStackClient = Depends(get_openstack_client)):
    servers_payload, ports_payload, networks_payload, volumes_payload, hypervisors_payload = await asyncio.gather(
        service_payload("nova", lambda: nova.list_servers(client), key="servers"),
        service_payload("neutron", lambda: neutron.list_ports(client), key="ports"),
        service_payload("neutron", lambda: neutron.list_networks(client), key="networks"),
        service_payload("cinder", lambda: cinder.list_volumes(client), key="volumes"),
        service_payload("nova", lambda: nova.list_hypervisors(client), key="hypervisors"),
    )
    return {
        "lab": client.static_lab(),
        "nodes": [
            {"id": "controller", "role": "API/control plane", **client.static_lab()["controller"]},
            {"id": "compute01", "role": "hypervisor", **client.static_lab()["compute01"]},
            {"id": "compute02", "role": "hypervisor + block storage", **client.static_lab()["compute02"]},
            {"id": "provider", "role": "provider flat network", "name": "Provider network", "ip": client.settings.provider_subnet},
            {"id": "cinder", "role": "Cinder LVM backend", "name": client.settings.cinder_backend_host, "ip": client.settings.cinder_volume_group},
        ],
        "servers": servers_payload.get("servers", []),
        "ports": ports_payload.get("ports", []),
        "networks": networks_payload.get("networks", []),
        "volumes": volumes_payload.get("volumes", []),
        "hypervisors": hypervisors_payload.get("hypervisors", []),
        "errors": [
            payload["error"]
            for payload in [servers_payload, ports_payload, networks_payload, volumes_payload, hypervisors_payload]
            if payload.get("error")
        ],
    }
