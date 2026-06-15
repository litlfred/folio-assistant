import type { SkillDefinition } from "../framework/types.js";

export const todoReview: SkillDefinition = {
  id: "todo-review",
  name: "Todo Review",
  description: "Todo item lifecycle management, feedback processing, and work-tracking coordination.",
  roles: ["reader", "collaborator", "owner"],
  requiredCapabilities: [
    { capabilityId: "git-read", degradation: "fail" },
  ],
  routingPatterns: ["todo", "process\\s+feedback", "work.*item"],
  schemas: [
    { module: "schemas/types", types: ["TodoItem", "TodoStatus", "TodoPriority"], access: "read-write" },
  ],
  tags: ["todos", "tracking"],
};
