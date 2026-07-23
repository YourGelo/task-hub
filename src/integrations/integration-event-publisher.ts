import type { TaskEvent } from "../modules/tasks/task.events.js";

export interface IntegrationEventPublisher {
  publish(event: TaskEvent): Promise<void>;
}
