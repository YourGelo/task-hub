process.env.NODE_ENV = "test";
process.env.PORT ??= "7801";
process.env.DATABASE_URL ??= "postgresql://task_hub:task_hub_password@localhost:7804/task_hub_test?schema=public";
process.env.CORS_ORIGIN ??= "http://localhost:7802,http://localhost:5173";

