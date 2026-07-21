# Galaxy Cue v7 Architecture

```text
Galaxy Cue Platform
├── Admin OS      runs the SaaS platform
├── Business OS   runs an entertainment company
└── Client App    manages client events
        │
        └── Shared Supabase backend and event workflow
```

The v7.0 foundation changes physical boundaries without rewriting the proven feature logic. Features will be migrated from shared legacy modules into domain modules incrementally, keeping each release usable.
