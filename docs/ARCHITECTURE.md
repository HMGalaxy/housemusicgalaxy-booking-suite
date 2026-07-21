# Galaxy Cue Architecture

Galaxy Cue is divided into three independent interfaces backed by one shared platform:

1. Admin OS — platform administration and developer operations.
2. Business OS — entertainment-company operations.
3. Client App — client event booking and planning.

The applications share visual tokens and reusable browser utilities, while feature logic is organized by domain under `modules/`.
