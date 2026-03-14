# Project-Cross-Posting-Social-AI-Enhanced

Setup local pentru n8n folosind Docker Compose.

## Cerinte

- Docker
- Docker Compose (comanda `docker compose`)

## Configurare

Porneste de la template-ul de configurare:

```bash
cp .env.example .env
```

Nota: fisierul `.env` este local si ignorat de Git.

Fisierul `.env` contine variabilele folosite de n8n:

- N8N_HOST=localhost
- N8N_PORT=5678
- N8N_PROTOCOL=http
- N8N_SECURE_COOKIE=false
- TZ=Europe/Bucharest
- GENERIC_TIMEZONE=Europe/Bucharest

Serviciul este definit in `docker-compose.yml` si monteaza volum persistent pentru date:

- `n8n_data:/home/node/.n8n`

## Pornire

```bash
docker compose up -d
```

Acceseaza aplicatia la:

- http://localhost:5678

## Comenzi utile

```bash
# logs live
docker compose logs -f n8n

# opreste containerele
docker compose down

# opreste si sterge volumul de date
docker compose down -v
```