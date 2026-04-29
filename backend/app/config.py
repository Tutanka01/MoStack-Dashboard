from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openstack_auth_url: str = Field(default="http://10.3.17.143:5000/v3", alias="OPENSTACK_AUTH_URL")
    openstack_username: str = Field(default="admin", alias="OPENSTACK_USERNAME")
    openstack_password: str = Field(default="", alias="OPENSTACK_PASSWORD")
    openstack_project_name: str = Field(default="admin", alias="OPENSTACK_PROJECT_NAME")
    openstack_user_domain_name: str = Field(default="Default", alias="OPENSTACK_USER_DOMAIN_NAME")
    openstack_project_domain_name: str = Field(default="Default", alias="OPENSTACK_PROJECT_DOMAIN_NAME")
    openstack_region_name: str = Field(default="RegionOne", alias="OPENSTACK_REGION_NAME")
    openstack_interface: str = Field(default="public", alias="OPENSTACK_INTERFACE")
    openstack_keystone_url: str = Field(default="http://10.3.17.143:5000/v3", alias="OPENSTACK_KEYSTONE_URL")
    openstack_glance_url: str = Field(default="http://10.3.17.143:9292", alias="OPENSTACK_GLANCE_URL")
    openstack_placement_url: str = Field(default="http://10.3.17.143:8778", alias="OPENSTACK_PLACEMENT_URL")
    openstack_nova_url: str = Field(default="http://10.3.17.143:8774/v2.1/{project_id}", alias="OPENSTACK_NOVA_URL")
    openstack_neutron_url: str = Field(default="http://10.3.17.143:9696", alias="OPENSTACK_NEUTRON_URL")
    openstack_cinder_url: str = Field(default="http://10.3.17.143:8776/v3/{project_id}", alias="OPENSTACK_CINDER_URL")
    openstack_console_public_host: str | None = Field(default=None, alias="OPENSTACK_CONSOLE_PUBLIC_HOST")
    openstack_console_host_aliases: str = Field(default="controller,os-controller01,OS-controller01", alias="OPENSTACK_CONSOLE_HOST_ALIASES")

    dashboard_read_only: bool = Field(default=True, alias="DASHBOARD_READ_ONLY")
    backend_cors_origins: str = Field(default="http://localhost:5173", alias="BACKEND_CORS_ORIGINS")
    openstack_timeout_seconds: float = Field(default=8.0, alias="OPENSTACK_TIMEOUT_SECONDS")
    cache_ttl_seconds: int = Field(default=8, alias="CACHE_TTL_SECONDS")

    lab_controller_name: str = Field(default="OS-controller01", alias="LAB_CONTROLLER_NAME")
    lab_controller_ip: str = Field(default="10.3.17.143", alias="LAB_CONTROLLER_IP")
    lab_compute01_name: str = Field(default="OS-compute01", alias="LAB_COMPUTE01_NAME")
    lab_compute01_ip: str = Field(default="10.3.17.144", alias="LAB_COMPUTE01_IP")
    lab_compute02_name: str = Field(default="OS-comput02", alias="LAB_COMPUTE02_NAME")
    lab_compute02_ip: str = Field(default="10.3.17.145", alias="LAB_COMPUTE02_IP")
    provider_subnet: str = Field(default="10.3.16.0/23", alias="PROVIDER_SUBNET")
    ovs_provider_bridge: str = Field(default="br-provider", alias="OVS_PROVIDER_BRIDGE")
    ovs_integration_bridge: str = Field(default="br-int", alias="OVS_INTEGRATION_BRIDGE")
    ovs_mapping: str = Field(default="provider:br-provider", alias="OVS_MAPPING")
    cinder_backend_host: str = Field(default="os-comput02@lvm#lvm", alias="CINDER_BACKEND_HOST")
    cinder_volume_group: str = Field(default="cinder-volumes", alias="CINDER_VOLUME_GROUP")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def console_host_aliases(self) -> set[str]:
        values = {alias.strip().lower() for alias in self.openstack_console_host_aliases.split(",") if alias.strip()}
        values.add(self.lab_controller_name.lower())
        return values

    @property
    def console_public_host(self) -> str:
        return self.openstack_console_public_host or self.lab_controller_ip


@lru_cache
def get_settings() -> Settings:
    return Settings()
