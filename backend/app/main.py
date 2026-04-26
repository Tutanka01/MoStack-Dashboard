import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.openstack_client import client
from app.routers import compute, identity, images, learning, network, overview, storage, topology

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

settings = get_settings()

app = FastAPI(
    title="OpenStack Lab Control API",
    version="0.1.0",
    description="Read-only proxy API for a local OpenStack multi-node lab dashboard.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(overview.router)
app.include_router(compute.router)
app.include_router(network.router)
app.include_router(storage.router)
app.include_router(images.router)
app.include_router(identity.router)
app.include_router(topology.router)
app.include_router(learning.router)


@app.on_event("shutdown")
async def shutdown() -> None:
    await client.close()
