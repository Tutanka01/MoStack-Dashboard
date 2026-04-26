import asyncio
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends

from app.openstack_client import OpenStackClient, get_openstack_client
from app.services import cinder, glance, nova, neutron, placement
from app.utils.responses import service_payload

router = APIRouter(prefix="/api", tags=["overview"])


@router.get("/health")
async def health(client: OpenStackClient = Depends(get_openstack_client)):
    services = await asyncio.gather(
        client.service_status("identity", "/"),
        client.service_status("compute", "/"),
        client.service_status("network", "/"),
        client.service_status("image", "/v2/images"),
        client.service_status("volumev3", "/volumes/detail"),
        client.service_status("placement", "/resource_providers"),
    )
    return {
        "status": "UP" if all(service["available"] for service in services) else "DEGRADED",
        "region": client.settings.openstack_region_name,
        "read_only": client.settings.dashboard_read_only,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "services": services,
        "lab": client.static_lab(),
    }


@router.get("/overview")
async def overview(client: OpenStackClient = Depends(get_openstack_client)):
    loaders = await asyncio.gather(
        service_payload("nova", lambda: nova.list_servers(client), key="servers"),
        service_payload("nova", lambda: nova.list_hypervisors(client), key="hypervisors"),
        service_payload("nova", lambda: nova.list_services(client), key="nova_services"),
        service_payload("neutron", lambda: neutron.list_networks(client), key="networks"),
        service_payload("neutron", lambda: neutron.list_agents(client), key="neutron_agents"),
        service_payload("glance", lambda: glance.list_images(client), key="images"),
        service_payload("cinder", lambda: cinder.list_volumes(client), key="volumes"),
        service_payload("placement", lambda: placement.list_resource_providers(client), key="resource_providers"),
    )
    merged: dict[str, Any] = {}
    errors = []
    for payload in loaders:
        merged.update(payload)
        if not payload.get("available") and payload.get("error"):
            errors.append({"service": payload.get("service"), "error": payload.get("error")})

    service_states = await health(client)
    return {
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "region": client.settings.openstack_region_name,
        "read_only": client.settings.dashboard_read_only,
        "status": service_states["status"],
        "service_states": service_states["services"],
        "counts": {
            "instances": len(merged.get("servers", [])),
            "images": len(merged.get("images", [])),
            "volumes": len(merged.get("volumes", [])),
            "networks": len(merged.get("networks", [])),
            "hypervisors": len(merged.get("hypervisors", [])),
            "neutron_agents": len(merged.get("neutron_agents", [])),
            "resource_providers": len(merged.get("resource_providers", [])),
        },
        "latest": {
            "servers": merged.get("servers", [])[:6],
            "volumes": merged.get("volumes", [])[:6],
            "networks": merged.get("networks", [])[:6],
        },
        "errors": errors,
        "lab": client.static_lab(),
    }
