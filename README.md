# Project-Cross-Posting-Social-AI-Enhanced

Sistem local cu:

- n8n (workflow AI pentru formatare idei social media)
- pagina web de upload documente (TXT, PDF, Word, Excel)

## Cerinte

- Docker
- Docker Compose (`docker compose`)
- Fara API key (ruleaza local cu Ollama)

## Structura

- `docker-compose.yml` - ruleaza n8n + frontend web
- `docker-compose.yml` - ruleaza n8n + frontend web + Ollama local
- `n8n/Dockerfile` - imagine n8n custom cu librarii de parsare documente
- `web/` - pagina de upload si afisare rezultat
- `workflows/social-media-doc-formatter.json` - workflow importabil in n8n

## Configurare

1. Creeaza fisierul local de configurare:

```bash
cp .env.example .env
```

2. Seteaza modelul local in `.env`.

Exemplu variabile folosite:

- `N8N_HOST=localhost`
- `N8N_PORT=5678`
- `N8N_PROTOCOL=http`
- `N8N_SECURE_COOKIE=false`
- `TZ=Europe/Bucharest`
- `GENERIC_TIMEZONE=Europe/Bucharest`
- `OLLAMA_MODEL=qwen2.5:7b`

## Pornire

```bash
docker compose up -d --build
```

3. Descarca modelul Ollama local (prima data dureaza):

```bash
docker compose exec ollama ollama pull qwen2.5:7b
```

Optional, pentru viteza mai mare poti adauga si modelul 3b:

```bash
docker compose exec ollama ollama pull qwen2.5:3b
```

Interfete disponibile:

- n8n: http://localhost:5678
- pagina web upload: http://localhost:8080
- Ollama API local: http://localhost:11434

## Import workflow n8n

1. Deschide n8n la http://localhost:5678
2. Creeaza un workflow nou
3. Import din fisier: `workflows/social-media-doc-formatter.json`
4. Salveaza si activeaza workflow-ul

Webhook-ul workflow-ului este:

- `POST /webhook/social-media-doc-formatter` (cand workflow-ul este activ)

Pagina web este deja preconfigurata cu acest URL.

## Ce face workflow-ul

1. Primeste fisierele uploadate prin webhook
2. Extrage text din:
	- TXT
	- PDF
	- DOCX (DOC are fallback text)
	- XLS/XLSX/CSV
3. Trimite textul consolidat la model local Ollama (`OLLAMA_MODEL`)
4. Genereaza pentru fiecare platforma 2 variante de postare (A/B)
5. Aplica automat filtre de lungime pe caption per platforma:
	- Instagram: 2200 caractere
	- Facebook: 63206 caractere
	- LinkedIn: 3000 caractere
	- TikTok: 2200 caractere
	- X: 280 caractere
6. Intoarce raspuns cu:
	- export text ready-to-publish (copy/paste direct)
	- JSON structurat (summary + posts A/B + calendar)

## Output in pagina web

In cardul de rezultat ai:

- `Text Ready` - continut final copy/paste pentru publicare
- `JSON` - structura completa, utila pentru automatizari
- `Copiaza Text` - copiaza rapid varianta text gata de postare
- `Model Ollama` - alegi modelul direct din UI (ex: `qwen2.5:7b` sau `qwen2.5:3b`)

Nota model:

- daca selectezi model in UI, workflow-ul foloseste acel model
- daca nu trimiti model, foloseste fallback din `.env`: `OLLAMA_MODEL`

## Test rapid

1. Activeaza workflow-ul in n8n
2. Deschide http://localhost:8080
3. Incarca unul sau mai multe documente
4. Alege ton, limba, audienta, platforme
5. Apasa `Genereaza postari ready-to-publish`

## Comenzi utile

```bash
# logs n8n
docker compose logs -f n8n

# logs frontend web
docker compose logs -f web

# logs ollama
docker compose logs -f ollama

# opreste containerele
docker compose down

# opreste si sterge si volumul n8n
docker compose down -v
```