# Task Hub API

Task Hub — REST API сервис для учёта задач и отдельный frontend demo-client.

Сервис позволяет создавать, получать, обновлять, удалять и искать задачи. Данные хранятся в PostgreSQL и переживают перезапуск приложения. Удаление реализовано мягко через `deleted_at`, поэтому публичные endpoints больше не возвращают удалённые задачи.

## Возможности

- Создание задач.
- Получение задачи по id.
- Получение списка задач.
- Фильтрация списка по статусу.
- Пагинация через `offset` и `limit`.
- Сортировка по `due_date` и `priority`.
- Бизнес-сортировка priority: `low -> medium -> high`.
- Soft-delete задач.
- Валидация входных данных через Zod.
- Единый формат ошибок.
- Request ID для трассировки ошибок.
- Доменные события и интерфейс publisher для будущих интеграций.
- PostgreSQL-хранилище.
- Prisma migrations.
- Docker-запуск приложения и базы данных.
- OpenAPI-контракт.
- Swagger UI.
- Отдельный React demo-client, работающий с реальным REST API.

## Стек

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma
- Zod
- Docker
- OpenAPI / Swagger UI
- React
- Vite
- Nginx

## Быстрый запуск через Docker

Требуется установленный Docker Desktop.

    docker compose up --build

После запуска доступны:

| Сервис | URL |
|---|---|
| Frontend demo-client | http://localhost:7802 |
| Backend API | http://localhost:7801 |
| API health | http://localhost:7801/health |
| DB health | http://localhost:7801/health/db |
| Swagger UI | http://localhost:7801/api-docs |
| OpenAPI JSON | http://localhost:7801/openapi.json |

Frontend и backend запускаются разными сервисами Docker Compose. Статические файлы
frontend обслуживает Nginx; frontend не встраивается в Express.

Demo-client позволяет проверить без Postman:

- создание через `POST`;
- получение списка с одновременными фильтрами, сортировкой и пагинацией;
- получение актуальной задачи по id перед редактированием;
- быстрые частичные изменения через `PATCH`;
- полную замену изменяемых полей через `PUT`;
- очистку `due_date` через `null`;
- soft-delete через `DELETE`;
- единый формат ошибок, включая `details` и `request_id`.

## Локальный запуск для разработки

Установить зависимости:

    npm install

Создать `.env` по примеру `.env.example`.

Поднять PostgreSQL:

    docker compose up -d db

Применить миграции:

    npx prisma migrate dev

Сгенерировать Prisma Client:

    npx prisma generate

Запустить API в dev-режиме:

    npm run dev

В отдельном терминале установить зависимости и запустить frontend:

    cd frontend
    npm install
    npm run dev

Frontend будет доступен на `http://localhost:7802` и по умолчанию отправляет
запросы на `http://localhost:7801`.

## Переменные окружения

Пример находится в `.env.example`.

Основные переменные:

| Переменная | Описание |
|---|---|
| `NODE_ENV` | Окружение приложения: `development`, `test`, `production` |
| `PORT` | HTTP-порт приложения |
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `CORS_ORIGIN` | Список разрешённых frontend origin через запятую |
| `VITE_API_BASE_URL` | Backend URL, встраиваемый в frontend при сборке |

Для локального запуска с базой из docker-compose:

    DATABASE_URL="postgresql://task_hub:task_hub_password@localhost:5433/task_hub?schema=public"

Для запуска приложения внутри docker-compose используется host `db`:

    postgresql://task_hub:task_hub_password@db:5432/task_hub?schema=public

Локальная настройка frontend находится в `frontend/.env.development`:

    VITE_API_BASE_URL=http://localhost:7801

Для production-сборки можно передать:

    VITE_API_BASE_URL=https://api.test.slimebase.ru docker compose up --build

## Скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | Запуск API в режиме разработки |
| `npm run build` | Компиляция TypeScript в `dist` |
| `npm start` | Запуск собранного приложения |
| `npm run typecheck` | Проверка типов без сборки |

Frontend-команды запускаются из папки `frontend`:

| Команда | Назначение |
|---|---|
| `npm run dev` | Vite dev server на порту `7802` |
| `npm run typecheck` | Проверка типов frontend |
| `npm run build` | Production-сборка frontend |

## Модель задачи

Задача содержит:

| Поле | Описание |
|---|---|
| `id` | UUID задачи, создаётся сервером |
| `title` | Название задачи |
| `status` | Статус: `todo`, `in_progress`, `done` |
| `priority` | Приоритет: `low`, `medium`, `high` |
| `due_date` | Опциональный timestamp with timezone |
| `created_at` | Дата создания |
| `updated_at` | Дата обновления |

Поле `deleted_at` хранится в базе данных, но не возвращается через публичный API.

## Правила работы с due_date

`due_date` принимается как ISO 8601 timestamp с timezone offset или `Z`.

Корректные значения:

    2026-07-29T18:00:00+03:00
    2026-07-29T15:00:00Z

Некорректные значения:

    2026-07-29
    2026-07-29T18:00:00

При создании задачи `due_date` можно не передавать. Если поле передано, оно должно быть timestamp with timezone и не должно быть в прошлом.

При `PATCH` и `PUT` значение `due_date: null` разрешено и означает очистку срока.

В ответах API дата возвращается в UTC с суффиксом `Z`.

## Основные endpoints

| Метод | Endpoint | Описание |
|---|---|---|
| `GET` | `/health` | Проверка состояния сервиса |
| `GET` | `/openapi.json` | OpenAPI-контракт |
| `GET` | `/api-docs` | Swagger UI |
| `POST` | `/tasks` | Создать задачу |
| `GET` | `/tasks` | Получить список задач |
| `GET` | `/tasks/:id` | Получить задачу по id |
| `PATCH` | `/tasks/:id` | Частично обновить задачу |
| `PUT` | `/tasks/:id` | Полностью заменить изменяемые поля задачи |
| `DELETE` | `/tasks/:id` | Мягко удалить задачу |

## Параметры списка задач

`GET /tasks` поддерживает параметры:

| Параметр | Описание |
|---|---|
| `offset` | Смещение, по умолчанию `0` |
| `limit` | Размер страницы, от `1` до `100`, по умолчанию `20` |
| `status` | Фильтр по статусу |
| `sort` | Поле сортировки: `due_date` или `priority` |
| `order` | Направление сортировки: `asc` или `desc` |

Пример:

    GET /tasks?status=todo&sort=priority&order=asc&offset=0&limit=10

## Формат ошибок

Ошибки возвращаются в едином формате:

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Request data is invalid",
        "details": [
          {
            "field": "priority",
            "message": "Invalid option"
          }
        ],
        "request_id": "550e8400-e29b-41d4-a716-446655440000"
      }
    }

Основные коды:

| HTTP | Код | Когда используется |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Некорректные параметры, body или id |
| `400` | `INVALID_JSON` | Некорректный JSON |
| `404` | `NOT_FOUND` | Задача не найдена или удалена |
| `422` | `UNPROCESSABLE_ENTITY` | Нарушение бизнес-правила |
| `500` | `INTERNAL_SERVER_ERROR` | Непредвиденная ошибка сервера |

## Структура проекта

    src/
      app.ts
      server.ts
      config/
      common/
        errors/
        middleware/
      docs/
      infrastructure/
        database/
      modules/
        tasks/
          task.events.ts
      integrations/
        integration-event-publisher.ts
        noop-event-publisher.ts
    prisma/
      schema.prisma
      migrations/
    docs/
      api-decisions.md
      architecture.md
      requirements.md
    frontend/
      src/
      Dockerfile
      nginx.conf
      package.json

## Документация

Дополнительные материалы:

- `docs/requirements.md` — требования и границы первой версии.
- `docs/api-decisions.md` — принятые API-решения.
- `docs/architecture.md` — архитектурные решения.
- `docs/http-examples.md` — примеры ручной проверки API.
- `docs/integration.md` — интеграционный подход.
- `openapi.json` — OpenAPI-контракт.



## CORS

Backend поддерживает настройку разрешённых frontend origin через переменную окружения `CORS_ORIGIN`.

Пример для локальной разработки и будущего demo frontend:

    CORS_ORIGIN="http://localhost:7802,http://localhost:5173,https://test.slimebase.ru"

Запросы без браузерного `Origin`, например из curl, PowerShell, Postman или Swagger, разрешаются.

## Автоматические тесты

Для интеграционных тестов используется отдельная PostgreSQL-база `db_test`, которая запускается через compose profile `test`.

Запустить тестовую базу:

    docker compose --profile test up -d db_test

Запустить тесты:

    npm test

Что проверяется:

- `/health`;
- `/health/db`;
- создание задачи;
- валидация ошибок;
- бизнес-правило `due_date` в прошлом;
- фильтрация, сортировка и пагинация списка;
- обновление задачи;
- soft-delete.
- строгая семантика `PUT` и `PATCH`;
- обязательный timezone в `due_date`;
- разрешение прошедшего срока при обновлении;
- совместная работа фильтрации, сортировки и пагинации;
- порядок приоритетов и `NULLS LAST` для срока;
- доменные события задач;
- единый JSON-ответ для неизвестных маршрутов.
