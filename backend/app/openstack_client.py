import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import Settings, get_settings

logger = logging.getLogger("openstack-lab")


class OpenStackAPIError(Exception):
    def __init__(self, service: str, message: str, status_code: int | None = None):
        self.service = service
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class OpenStackClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._token: str | None = None
        self._token_expires_at = 0.0
        self._project_id: str | None = None
        self._catalog: list[dict[str, Any]] = []
        self._cache: dict[str, tuple[float, Any]] = {}
        self._auth_lock = asyncio.Lock()

    async def close(self) -> None:
        self._cache.clear()

    async def authenticate(self) -> None:
        async with self._auth_lock:
            if self._token and time.time() < self._token_expires_at - 60:
                return

            auth_url = self.settings.openstack_auth_url.rstrip("/") + "/auth/tokens"
            payload = {
                "auth": {
                    "identity": {
                        "methods": ["password"],
                        "password": {
                            "user": {
                                "name": self.settings.openstack_username,
                                "domain": {"name": self.settings.openstack_user_domain_name},
                                "password": self.settings.openstack_password,
                            }
                        },
                    },
                    "scope": {
                        "project": {
                            "name": self.settings.openstack_project_name,
                            "domain": {"name": self.settings.openstack_project_domain_name},
                        }
                    },
                }
            }

            try:
                async with httpx.AsyncClient(timeout=self.settings.openstack_timeout_seconds) as client:
                    response = await client.post(auth_url, json=payload)
                    response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise OpenStackAPIError("keystone", "Keystone authentication failed", exc.response.status_code) from exc
            except httpx.HTTPError as exc:
                raise OpenStackAPIError("keystone", f"Keystone is unreachable: {exc}") from exc

            token = response.headers.get("X-Subject-Token")
            if not token:
                raise OpenStackAPIError("keystone", "Keystone did not return an auth token")

            body = response.json().get("token", {})
            expires_at = body.get("expires_at")
            self._token = token
            self._catalog = body.get("catalog", [])
            self._project_id = body.get("project", {}).get("id")
            self._token_expires_at = self._parse_expiry(expires_at)
            logger.info("Authenticated to Keystone as project=%s region=%s", self.settings.openstack_project_name, self.settings.openstack_region_name)

    def _parse_expiry(self, expires_at: str | None) -> float:
        if not expires_at:
            return time.time() + 3600
        value = expires_at.replace("Z", "+00:00")
        return datetime.fromisoformat(value).astimezone(timezone.utc).timestamp()

    @property
    def project_id(self) -> str | None:
        return self._project_id

    def endpoint(self, service_type: str) -> str:
        configured = {
            "identity": self.settings.openstack_keystone_url,
            "image": self.settings.openstack_glance_url,
            "placement": self.settings.openstack_placement_url,
            "compute": self.settings.openstack_nova_url,
            "network": self.settings.openstack_neutron_url,
            "volumev3": self.settings.openstack_cinder_url,
        }.get(service_type)
        if configured:
            return configured.rstrip("/")

        for service in self._catalog:
            if service.get("type") != service_type:
                continue
            endpoints = service.get("endpoints", [])
            preferred = [
                endpoint
                for endpoint in endpoints
                if endpoint.get("region") == self.settings.openstack_region_name
                and endpoint.get("interface") == self.settings.openstack_interface
            ]
            fallback = [endpoint for endpoint in endpoints if endpoint.get("region") == self.settings.openstack_region_name]
            selected = (preferred or fallback or endpoints)
            if selected:
                return selected[0]["url"].rstrip("/")
        raise OpenStackAPIError(service_type, f"No endpoint found for service type '{service_type}'")

    def _expand_url(self, base_url: str) -> str:
        if self._project_id:
            return base_url.replace("%(project_id)s", self._project_id).replace("{project_id}", self._project_id)
        return base_url

    async def request(
        self,
        service_type: str,
        path: str = "",
        *,
        method: str = "GET",
        params: dict[str, Any] | None = None,
        json: Any | None = None,
        headers: dict[str, str] | None = None,
        cache_key: str | None = None,
        ttl: int | None = None,
        expected_status: set[int] | None = None,
    ) -> Any:
        method = method.upper()
        if cache_key:
            cached = self._cache.get(cache_key)
            if cached and time.time() < cached[0]:
                return cached[1]

        await self.authenticate()
        assert self._token is not None
        base = self._expand_url(self.endpoint(service_type))
        url = base + (path if path.startswith("/") else f"/{path}" if path else "")
        request_headers = {"X-Auth-Token": self._token, "Accept": "application/json"}
        request_headers.update(headers or {})

        try:
            async with httpx.AsyncClient(timeout=self.settings.openstack_timeout_seconds) as client:
                response = await client.request(method, url, params=params, json=json, headers=request_headers)
                response.raise_for_status()
                if expected_status and response.status_code not in expected_status:
                    raise OpenStackAPIError(service_type, f"{service_type} returned unexpected HTTP {response.status_code}", response.status_code)
                data = response.json() if response.content else {}
        except httpx.HTTPStatusError as exc:
            raise OpenStackAPIError(service_type, f"{service_type} returned HTTP {exc.response.status_code}", exc.response.status_code) from exc
        except httpx.HTTPError as exc:
            raise OpenStackAPIError(service_type, f"{service_type} is unreachable: {exc}") from exc
        except ValueError as exc:
            raise OpenStackAPIError(service_type, f"{service_type} returned invalid JSON") from exc

        if cache_key:
            self._cache[cache_key] = (time.time() + (ttl or self.settings.cache_ttl_seconds), data)
        if method != "GET":
            self._cache.clear()
        return data

    async def service_status(self, service_type: str, path: str = "") -> dict[str, Any]:
        try:
            await self.request(service_type, path, cache_key=f"status:{service_type}:{path}", ttl=5)
            return {"service": service_type, "available": True, "status": "UP", "error": None}
        except OpenStackAPIError as exc:
            return {"service": service_type, "available": False, "status": "DOWN", "error": exc.message}

    def static_lab(self) -> dict[str, Any]:
        return {
            "controller": {"name": self.settings.lab_controller_name, "ip": self.settings.lab_controller_ip},
            "compute01": {"name": self.settings.lab_compute01_name, "ip": self.settings.lab_compute01_ip},
            "compute02": {"name": self.settings.lab_compute02_name, "ip": self.settings.lab_compute02_ip},
            "network": {
                "management_interface": "ens18",
                "provider_interface": "ens19",
                "provider_subnet": self.settings.provider_subnet,
                "ovs_mapping": self.settings.ovs_mapping,
                "provider_bridge": self.settings.ovs_provider_bridge,
                "integration_bridge": self.settings.ovs_integration_bridge,
            },
            "storage": {
                "backend": "LVM + iSCSI via tgt",
                "host": self.settings.cinder_backend_host,
                "volume_group": self.settings.cinder_volume_group,
                "volume_backend_name": "lvm",
            },
            "read_only": self.settings.dashboard_read_only,
            "region": self.settings.openstack_region_name,
        }


client = OpenStackClient(get_settings())


def get_openstack_client() -> OpenStackClient:
    return client
