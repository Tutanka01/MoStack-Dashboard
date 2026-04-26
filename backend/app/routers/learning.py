from fastapi import APIRouter, Depends

from app.openstack_client import OpenStackClient, get_openstack_client

router = APIRouter(prefix="/api/learning", tags=["learning"])


@router.get("/flow/create-server")
async def create_server_flow(client: OpenStackClient = Depends(get_openstack_client)):
    return {
        "title": "Quand je cree une VM, que se passe-t-il ?",
        "lab": client.static_lab(),
        "steps": [
            {"service": "Horizon/API client", "detail": "L'utilisateur demande une instance avec une image, un flavor et un reseau."},
            {"service": "Keystone", "detail": "Nova verifie le token et les droits du projet."},
            {"service": "Nova API", "detail": "La requete est acceptee puis placee dans le flux de planification."},
            {"service": "Placement", "detail": "Nova cherche les ressources disponibles chez les compute nodes."},
            {"service": "Nova Scheduler", "detail": "Un hyperviseur compatible est choisi."},
            {"service": "Neutron", "detail": "Les ports reseau sont reserves sur le provider network."},
            {"service": "Glance", "detail": "L'image est telechargee ou mise en cache par le compute node."},
            {"service": "Nova Compute", "detail": "Libvirt/QEMU demarre la VM sur le compute selectionne."},
        ],
    }


@router.get("/flow/attach-volume")
async def attach_volume_flow(client: OpenStackClient = Depends(get_openstack_client)):
    return {
        "title": "Quand j'attache un volume Cinder, que se passe-t-il ?",
        "lab": client.static_lab(),
        "steps": [
            {"service": "Nova API", "detail": "La demande d'attachement est recue pour une instance cible."},
            {"service": "Cinder API", "detail": "Cinder verifie le volume et reserve l'attachement."},
            {"service": "cinder-volume", "detail": "Le backend LVM sur os-comput02 prepare le volume logique."},
            {"service": "tgt/iSCSI", "detail": "Une cible iSCSI est exposee au compute node."},
            {"service": "Nova Compute", "detail": "Le compute connecte l'iSCSI et presente le disque a la VM."},
        ],
    }


@router.get("/flow/provider-network")
async def provider_network_flow(client: OpenStackClient = Depends(get_openstack_client)):
    return {
        "title": "Quand une VM recoit une IP provider, que se passe-t-il ?",
        "lab": client.static_lab(),
        "steps": [
            {"service": "Neutron", "detail": "Un port est cree sur le reseau provider plat."},
            {"service": "OVS agent", "detail": "Le port est cable dans br-int sur le compute node."},
            {"service": "OVS bridge mapping", "detail": "Le mapping provider:br-provider connecte br-int au reseau physique."},
            {"service": "Provider subnet", "detail": "La VM obtient une IP dans 10.3.16.0/23 via le mecanisme configure."},
            {"service": "ens19", "detail": "Le trafic sort vers le reseau provider par l'interface physique."},
        ],
    }
