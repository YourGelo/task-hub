# Task Hub API

Task Hub API — REST API сервис для учёта задач.

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
- PostgreSQL-хранилище.
- Prisma migrations.
- Docker-запуск приложения и базы данных.
- OpenAPI-контракт.
- Swagger UI.

## Стек

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma
- Zod
- Docker
- OpenAPI / Swagger UI

## Быстрый запуск через Docker

Требуется установленный Docker Desktop.

    docker compose up --build

После запуска API будет доступен по адресу:

    http://localhost:3000

Проверка состояния:

    http://localhost:3000/health

Swagger UI:

    http://localhost:3000/api-docs

OpenAPI JSON:

    http://localhost:3000/openapi.json

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

## Переменные окружения

Пример находится в `.env.example`.

Основные переменные:

| Переменная | Описание |
|---|---|
| `NODE_ENV` | Окружение приложения: `development`, `test`, `production` |
| `PORT` | HTTP-порт приложения |
| `DATABASE_URL` | Строка подключения к PostgreSQL |

Для локального запуска с базой из docker-compose:

    DATABASE_URL="postgresql://task_hub:task_hub_password@localhost:5433/task_hub?schema=public"

Для запуска приложения внутри docker-compose используется host `db`:

    postgresql://task_hub:task_hub_password@db:5432/task_hub?schema=public

## Скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | Запуск API в режиме разработки |
| `npm run build` | Компиляция TypeScript в `dist` |
| `npm start` | Запуск собранного приложения |
| `npm run typecheck` | Проверка типов без сборки |

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
    prisma/
      schema.prisma
      migrations/
    docs/
      api-decisions.md
      architecture.md
      requirements.md

## Документация

Дополнительные материалы:

- `docs/requirements.md` — требования и границы первой версии.
- `docs/api-decisions.md` — принятые API-решения.
- `docs/architecture.md` — архитектурные решения.
- `docs/http-examples.md` — примеры ручной проверки API.
- `docs/integration.md` — интеграционный подход.
- `openapi.json` — OpenAPI-контракт.
