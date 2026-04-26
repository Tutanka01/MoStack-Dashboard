# MoStack Dashboard

> **Un cockpit complet pour piloter votre lab OpenStack** — sans jamais exposer un seul credential au navigateur.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?style=flat-square&logo=docker)](https://docs.docker.com/compose/)
[![OpenStack](https://img.shields.io/badge/Target-OpenStack-ED1944?style=flat-square&logo=openstack)](https://www.openstack.org)

---

## Pourquoi MoStack Dashboard ?

Administrer un lab OpenStack multi-node depuis Horizon, c'est naviguer dans une interface pensée pour la production, pas pour apprendre. MoStack Dashboard renverse cette logique : il expose **ce qui se passe vraiment** à l'intérieur — chaque service, chaque hyperviseur, chaque flux réseau — avec une interface épurée, des explications contextuelles et une architecture proxy qui garde vos tokens Keystone strictement côté serveur.

**Un seul `docker compose up --build`. C'est tout.**

---

## Ce que vous obtenez

| Vue | Ce qu'elle révèle |
|---|---|
| **Control Plane** | État temps-réel de tous les services OpenStack, compteurs globaux, health global |
| **Compute Fabric** | Instances, hyperviseurs, capacité VCPU/RAM, services Nova et leurs rôles |
| **Network Plane** | Networks, subnets, ports, agents Neutron, mapping OVS provider bridge |
| **Block Storage** | Volumes, types, pools Cinder, backend LVM+iSCSI, scheduler stats |
| **Images** | Catalogue Glance annoté, classification CirrOS / Ubuntu / Debian |
| **Identity & Access** | Projets, utilisateurs, rôles, endpoints — architecture Keystone visualisée |
| **Cloud Topology** | Vue graphique controller → compute → VMs → Cinder backend |
| **Learning Mode** | Flux pédagogiques animés : create server, attach volume, provider network |

---

## Architecture

```
Browser ──► React + Vite (port 5173)
                │
                │  API calls (pas de credentials, pas de token)
                ▼
         FastAPI Proxy (port 8000)
                │
                │  Token Keystone — côté backend uniquement
                ▼
         OpenStack APIs (Keystone, Nova, Neutron, Glance, Cinder, Placement)
```

- **Frontend** : React + TypeScript + Vite + Tailwind CSS + Recharts + Lucide React
- **Backend** : FastAPI, proxy REST vers OpenStack — token Keystone jamais renvoyé au client
- **Déploiement** : `docker-compose.yml` clé-en-main, configurable par variables d'environnement
- **Sécurité** : `DASHBOARD_READ_ONLY=true` par défaut — le backend refuse toute mutation tant que le flag est actif

---

## Démarrage rapide

**1. Cloner et configurer**

```bash
git clone <repo>
cd MoStack-Dashboard
cp .env.example .env
```

Éditez `.env` avec les informations de votre lab :

```env
OPENSTACK_AUTH_URL=http://<controller-ip>:5000/v3
OPENSTACK_USERNAME=admin
OPENSTACK_PASSWORD=your-password
OPENSTACK_PROJECT_NAME=admin
```

**2. Lancer**

```bash
docker compose up --build
```

**3. Ouvrir**

```
http://localhost:5173   →  Dashboard
http://localhost:8000/docs  →  API FastAPI (OpenAPI)
```

> Si un port est déjà pris :
> ```bash
> BACKEND_PORT=8001 FRONTEND_PORT=5174 docker compose up --build
> ```

---

## Mode écriture

Par défaut, le backend est en **read-only** : aucune action destructive n'est possible, même si le frontend l'envoie. Pour activer les opérations de gestion :

```env
DASHBOARD_READ_ONLY=false
```

Les actions destructives demandent une confirmation explicite dans l'interface avant d'être transmises au backend.

---

## Vérification rapide

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/overview
curl http://localhost:8000/api/compute/servers
```

---

## APIs OpenStack couvertes

| Service | Endpoints |
|---|---|
| **Keystone v3** | `POST /auth/tokens` · `GET /projects` · `GET /users` · `GET /roles` · `GET /endpoints` |
| **Nova** | `GET /servers/detail` · `GET /os-hypervisors/detail` · `GET /os-services` |
| **Neutron** | `GET /networks` · `GET /subnets` · `GET /ports` · `GET /agents` |
| **Glance v2** | `GET /images` |
| **Cinder v3** | `GET /volumes/detail` · `GET /types` · `GET /os-services` · `GET /scheduler-stats/get_pools` |
| **Placement** | `GET /resource_providers` |

Les endpoints sont découverts automatiquement via le **service catalog Keystone** selon `OPENSTACK_REGION_NAME` et `OPENSTACK_INTERFACE`.

---

## Sécurité

- Zéro credential hardcodé — tout passe par `.env`, ignoré par Git
- Le token Keystone ne quitte jamais le backend
- `DASHBOARD_READ_ONLY=true` par défaut — verrou serveur, pas seulement UI
- Les erreurs OpenStack sont absorbées proprement sans crasher l'interface

---

## Limitations connues (v1)

- Upload binaire d'images Glance non implémenté (metadata uniquement)
- Pas de gestion avancée des ports Neutron
- Pas de RBAC propre au dashboard
- Refresh manuel ou auto-refresh 30 s — pas de WebSocket temps réel

---

## Roadmap

- [ ] Actions : create server, create volume, attach/detach volume
- [ ] Self-service networking & floating IPs
- [ ] Quotas et gestion multi-projets
- [ ] Monitoring Prometheus intégré
- [ ] Vue backend Ceph
- [ ] RBAC utilisateurs dashboard
