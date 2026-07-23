# Примеры HTTP-запросов

Ниже приведены примеры ручной проверки API через PowerShell.

Для Windows PowerShell 5.1 тело запроса с кириллицей лучше отправлять как UTF-8 bytes, иначе кириллица может превратиться в `????`.

## Health-check

    Invoke-RestMethod http://localhost:7801/health

## Создание задачи со сроком

    $json = @{
      title = "Подготовить документацию"
      priority = "high"
      status = "todo"
      due_date = "2026-07-29T18:00:00+03:00"
    } | ConvertTo-Json

    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    $response = Invoke-RestMethod -Method POST "http://localhost:7801/tasks" -ContentType "application/json; charset=utf-8" -Body $body

    $response

## Создание задачи без срока

    $json = @{
      title = "Разобрать требования"
      priority = "medium"
    } | ConvertTo-Json

    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    $response = Invoke-RestMethod -Method POST "http://localhost:7801/tasks" -ContentType "application/json; charset=utf-8" -Body $body

    $response

## Сохранение id созданной задачи

    $id = $response.id
    $id

## Получение задачи по id

    Invoke-RestMethod "http://localhost:7801/tasks/$id"

## Получение списка задач

    Invoke-RestMethod "http://localhost:7801/tasks"

## Фильтрация по статусу

    Invoke-RestMethod "http://localhost:7801/tasks?status=todo"

## Пагинация

    Invoke-RestMethod "http://localhost:7801/tasks?offset=0&limit=10"

## Сортировка по приоритету

    $response = Invoke-RestMethod "http://localhost:7801/tasks?sort=priority&order=asc"

    $response.items | Select-Object title, priority

Ожидаемый порядок для `asc`:

    low
    medium
    high

Для `desc`:

    high
    medium
    low

## Сортировка по сроку

    $response = Invoke-RestMethod "http://localhost:7801/tasks?sort=due_date&order=asc"

    $response.items | Select-Object title, due_date

Задачи без `due_date` идут в конце.

## Частичное обновление задачи

    $json = @{
      status = "in_progress"
    } | ConvertTo-Json

    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    Invoke-RestMethod -Method PATCH "http://localhost:7801/tasks/$id" -ContentType "application/json; charset=utf-8" -Body $body

## Очистка due_date

    $json = @{
      due_date = $null
    } | ConvertTo-Json

    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    Invoke-RestMethod -Method PATCH "http://localhost:7801/tasks/$id" -ContentType "application/json; charset=utf-8" -Body $body

## Полная замена изменяемых полей

    $json = @{
      title = "Обновлённая задача"
      status = "done"
      priority = "medium"
      due_date = $null
    } | ConvertTo-Json

    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    Invoke-RestMethod -Method PUT "http://localhost:7801/tasks/$id" -ContentType "application/json; charset=utf-8" -Body $body

## Удаление задачи

    Invoke-WebRequest -Method DELETE "http://localhost:7801/tasks/$id"

Ожидаемый статус:

    204 No Content

## Проверка после удаления

    Invoke-WebRequest "http://localhost:7801/tasks/$id"

Ожидаемый результат:

    404 NOT_FOUND

## Пример ошибки валидации

    $json = @{
      title = "Некорректная задача"
      priority = "urgent"
    } | ConvertTo-Json

    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    Invoke-WebRequest -Method POST "http://localhost:7801/tasks" -ContentType "application/json; charset=utf-8" -Body $body

Ожидаемый результат:

    400 VALIDATION_ERROR

## Пример нарушения бизнес-правила

    $json = @{
      title = "Прошлая задача"
      priority = "low"
      due_date = "2020-01-01T10:00:00Z"
    } | ConvertTo-Json

    $body = [System.Text.Encoding]::UTF8.GetBytes($json)

    Invoke-WebRequest -Method POST "http://localhost:7801/tasks" -ContentType "application/json; charset=utf-8" -Body $body

Ожидаемый результат:

    422 UNPROCESSABLE_ENTITY

## Проверка подключения к базе данных

    Invoke-RestMethod http://localhost:7801/health/db

Ожидаемый результат:

    status database
    ------ --------
    ok     ok


## Проверка подключения к базе данных

    Invoke-RestMethod http://localhost:7801/health/db

Ожидаемый результат:

    status database
    ------ --------
    ok     ok
