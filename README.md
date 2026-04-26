# OpenStack Lab Control

Dashboard local read-only pour comprendre et piloter un lab OpenStack multi-node sans exposer les credentials au navigateur.

## Objectif

OpenStack Lab Control fournit une interface claire, pédagogique et architecturale pour observer Keystone, Nova, Neutron, Glance, Cinder et Placement. Le frontend React parle uniquement au backend FastAPI local. Le backend s'authentifie auprès de Keystone, récupère un token, découvre le service catalog et interroge les APIs OpenStack.

## Architecture

- `frontend/` : React + TypeScript + Vite + Tailwind CSS + Recharts + Lucide React.
- `backend/` : FastAPI, proxy read-only vers OpenStack via REST direct.
- `docker-compose.yml` : lance le backend sur `8000` et le frontend sur `5173`.
- `.env` : toute la configuration sensible et lab-specific.

Le token Keystone reste côté backend. Il n'est jamais renvoyé au frontend.

## Configuration

Créez votre `.env` depuis l'exemple :

```bash
cp .env.example .env
```

Puis remplacez au minimum :

```env
OPENSTACK_USERNAME=admin
OPENSTACK_PASSWORD=your-password
OPENSTACK_PROJECT_NAME=admin
DASHBOARD_READ_ONLY=true
```

Les valeurs par défaut ciblent le lab décrit :

- Controller : `OS-controller01 / 10.3.17.143`
- Compute 1 : `OS-compute01 / 10.3.17.144`
- Compute 2 / Storage : `OS-comput02 / 10.3.17.145`
- Provider subnet : `10.3.16.0/23`
- OVS mapping : `provider:br-provider`
- Cinder backend : `os-comput02@lvm#lvm`, VG `cinder-volumes`

## Lancement

```bash
docker compose up --build
```

Frontend :

```text
http://localhost:5173
```

Backend :

```text
http://localhost:8000
```

Si un port est deja occupe localement :

```bash
BACKEND_PORT=8001 FRONTEND_PORT=5174 docker compose up --build
```

## Tester le backend

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/overview
curl http://localhost:8000/api/compute/servers
```

La documentation OpenAPI FastAPI est disponible ici :

```text
http://localhost:8000/docs
```

## APIs OpenStack utilisees

- Keystone v3 : `POST /auth/tokens`, `GET /projects`, `GET /users`, `GET /roles`, `GET /endpoints`
- Nova : `GET /servers/detail`, `GET /os-hypervisors/detail`, `GET /os-services`
- Neutron : `GET /v2.0/networks`, `GET /v2.0/subnets`, `GET /v2.0/ports`, `GET /v2.0/agents`
- Glance v2 : `GET /v2/images`
- Cinder v3 : `GET /volumes/detail`, `GET /types`, `GET /os-services`, `GET /scheduler-stats/get_pools?detail=True`
- Placement : `GET /resource_providers`

Les endpoints sont decouverts via le service catalog Keystone selon `OPENSTACK_REGION_NAME` et `OPENSTACK_INTERFACE`.

## Fonctionnalites v1

- Overview / Control Plane : etat des services, compteurs, dernier etat observe.
- Compute Fabric : instances, hyperviseurs, services Nova, explication des roles Nova.
- Network Plane : networks, subnets, ports, agents Neutron, provider network et mapping OVS.
- Persistent Block Storage : volumes, volume types, services, pools, backend LVM+iSCSI.
- Images : catalogue Glance et classification CirrOS/Ubuntu/Debian.
- Identity & Access : projets, utilisateurs, roles, endpoints, vue architecture Keystone.
- Cloud Topology : controller, compute nodes, provider network, VMs, Cinder backend.
- Learning Mode : flux pedagogiques create server, attach volume, provider network.

## Securite

- Aucun mot de passe hardcode.
- `.env` est ignore par Git.
- Le frontend ne recoit jamais les credentials ni le token Keystone.
- `DASHBOARD_READ_ONLY=true` par defaut.
- Aucune action destructive n'est exposee en v1.
- Les erreurs OpenStack sont affichees sans rendre l'interface brutale.

## Limitations v1

- Lecture seule uniquement.
- Pas de creation/suppression de VM, volume, reseau ou port.
- Pas de gestion RBAC propre au dashboard.
- Pas de monitoring temps reel, uniquement refresh manuel ou auto-refresh 30 secondes.
- La qualite des donnees depend des droits du compte OpenStack configure.

## Roadmap

- Actions controlees : create server, create volume, attach volume.
- Self-service networking.
- Floating IP.
- Quotas/projects.
- Monitoring Prometheus.
- Vue backend Ceph.
- RBAC dashboard users.
