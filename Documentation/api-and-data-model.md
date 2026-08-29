# API and Data Model

## Data Model

### User

- `id`
- `name`
- `email`
- `role`

### Project

- `id`
- `code`
- `name`
- `description`
- `managerId`
- `ownerId`
- `techLeadId`
- `startDate`
- `endDate`
- `actualEndDate`
- `status`
- `priority`
- `progress`
- timestamps

### Task

- `id`
- `projectId`
- `parentTaskId`
- `wbsCode`
- `name`
- `assigneeId`
- `startDate`
- `endDate`
- `progress`
- `status`
- `priority`
- `isMilestone`
- `remarks`
- timestamps

### Task Dependency

- `taskId`
- `dependsOnTaskId`
- `type`

### Planner Slot

- `id`
- `userId`
- `taskId`
- `date`
- `hour`

## Validation

The app uses Zod schemas for:

- project create/update payloads
- task create/update payloads
- dependency payloads

## Implementation Notes

- The shared store is in-memory and resets with the application process.
- Route handlers delegate to the shared validation and store helpers.
- The mock data set is intentionally small and readable so PRD behavior is easy to inspect.
