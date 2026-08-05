# Triage Labels

Kanban has no label strings — the five canonical triage roles map to kanban
state/assignee instead:

| Role | Kanban state |
|---|---|
| `needs-triage` | created with `--triage` (status `triage`) |
| `needs-info` | status `blocked` + comment with the question |
| `ready-for-agent` | status `ready` + assigned to a worker profile |
| `ready-for-human` | status `scheduled` |
| `wontfix` | archived |

When a skill says "apply the `X` triage label", map it through this table.
