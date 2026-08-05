# Issue Tracker — Hermes Kanban

Cards on the shared Hermes kanban board `calledandsent` (SQLite:
`~/.hermes/kanban/boards/calledandsent/kanban.db`). **Kanban is the source of
truth.** Open cards can be mirrored one-way to GitHub issues via the
`kanban-github-sync` skill — GitHub is for visibility, never the tracker. Don't
hand-edit mirrored issues; the next sync overwrites them.

All commands take `--board calledandsent`, or switch once with
`hermes kanban boards switch calledandsent`.

| Need | Command |
|---|---|
| Create a ticket (agent-ready, own worktree) | `hermes kanban create "<title>" --body "<spec>" --workspace worktree --branch wt/<NN>-<slug> --priority <n> [--assignee coder] [--skill <skill>]` |
| Declare a blocking edge | `--parent <id>` (repeatable) on create, or `hermes kanban link <parent_id> <child_id>` |
| Park for triage | `--triage` on create |
| List / frontier | `hermes kanban list --json`; takeable = `--status todo\|ready` with no open parents |
| Show one | `hermes kanban show <id>` |
| Comment (triage notes, resolutions) | `hermes kanban comment <id> "<text>"` |
| Make agent-grabbable | `hermes kanban assign <id> coder` (→ `ready`; `hermes kanban dispatch` spawns the worker) |
| Block (needs-info) | `hermes kanban block <id>` |
| Unblock | `hermes kanban unblock <id>` |
| Close | `hermes kanban complete <id>` |
| Wontfix | `hermes kanban archive <id>` |

## Triage roles → kanban state

- `needs-triage` → created with `--triage` (status `triage`)
- `ready-for-agent` → status `ready` + assigned to a worker profile
- `needs-info` → status `blocked` + a comment carrying the question
- `ready-for-human` → status `scheduled`
- `wontfix` → `archive`

## Wayfinding operations

- **The map** = one card `Map: <name>`; **decision tickets** = children via
  `--parent <map-id>`; **blocking** = `--parent`/`link`; **frontier** = open
  children whose parents are all closed.
- **Resolution** = `comment <id> "<answer>"`, then `complete <id>`, then append
  the context pointer to the map card via `comment <map-id>`.

## Implement per ticket

One card = one worker session = one worktree
(`--workspace worktree --branch wt/<NN>-<slug>`). Build, test, review, commit,
then `complete <id>`. Never batch several tickets into one worker session.

Full seed template:
`~/.hermes/skills/software-development/setup-repo-skills/references/issue-tracker-kanban.md`
