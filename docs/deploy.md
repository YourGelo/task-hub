# Deploy

## Целевая схема

Production/demo deployment использует два публичных домена:

| Домен | Назначение | Внутренний порт |
|---|---|---|
| `https://test.slimebase.ru` | Frontend demo-client | `7802` |
| `https://api.test.slimebase.ru` | Backend API и Swagger | `7801` |

Backend и frontend запускаются отдельными Docker Compose сервисами.

## GitHub Actions

В репозитории есть два workflow:

| Workflow | Назначение |
|---|---|
| `CI` | Проверяет backend, frontend и Docker build |
| `Deploy` | Деплоит проект на сервер через self-hosted runner |

`Deploy` запускается после успешного `CI` на ветке `main`, а также вручную через `workflow_dispatch`.

## Требования к серверу

На сервере должны быть установлены:

- Docker;
- Docker Compose plugin;
- GitHub Actions self-hosted runner с label `slimeserver`.

Workflow `Deploy` использует runner:

```yaml
runs-on:
  - self-hosted
  - slimeserver
```

## GitHub Secrets

В настройках репозитория нужно добавить repository secrets:

| Secret | Пример | Описание |
|---|---|---|
| `POSTGRES_PASSWORD` | `change_me_to_strong_password` | Пароль PostgreSQL |
| `DATABASE_URL` | `postgresql://task_hub:change_me_to_strong_password@db:5432/task_hub?schema=public` | Строка подключения backend к PostgreSQL внутри compose network |

Пароль в `POSTGRES_PASSWORD` и пароль внутри `DATABASE_URL` должны совпадать.

## Production env

Workflow сам создаёт `.env` на runner-сервере перед запуском compose:

```env
NODE_ENV=production
BACKEND_PORT=7801
FRONTEND_PORT=7802
DB_PORT=5433
PORT=7801
POSTGRES_PASSWORD=<secret>
DATABASE_URL=<secret>
CORS_ORIGIN=https://test.slimebase.ru
VITE_API_BASE_URL=https://api.test.slimebase.ru
```

## Reverse proxy

Nginx/Caddy/другой reverse proxy должен направлять домены так:

```text
test.slimebase.ru      -> 127.0.0.1:7802
api.test.slimebase.ru  -> 127.0.0.1:7801
```

## Ручной деплой на сервере

Если нужно выполнить деплой без GitHub Actions:

```bash
git clone https://github.com/YourGelo/task-hub.git
cd task-hub

cat > .env <<'EOF'
NODE_ENV=production
BACKEND_PORT=7801
FRONTEND_PORT=7802
DB_PORT=5433
PORT=7801
POSTGRES_PASSWORD=change_me_to_strong_password
DATABASE_URL=postgresql://task_hub:change_me_to_strong_password@db:5432/task_hub?schema=public
CORS_ORIGIN=https://test.slimebase.ru
VITE_API_BASE_URL=https://api.test.slimebase.ru
EOF

docker compose up -d --build
```

Проверка:

```bash
curl http://127.0.0.1:7801/health
curl http://127.0.0.1:7801/health/db
curl -I http://127.0.0.1:7802
```

После настройки reverse proxy:

```bash
curl https://api.test.slimebase.ru/health
curl https://api.test.slimebase.ru/health/db
```
