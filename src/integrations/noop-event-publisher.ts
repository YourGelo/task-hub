import type { TaskEvent } from "../modules/tasks/task.events.js";
import type { IntegrationEventPublisher } from "./integration-event-publisher.js";

export class NoopIntegrationEventPublisher implements IntegrationEventPublisher {
  async publish(_event: TaskEvent): Promise<void> {
    // Реальный транспорт будет добавлен после появления контрактов интеграций.
  }
}
