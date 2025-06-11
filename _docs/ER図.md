# ER図

```mermaid
erDiagram
    USERS {
        bigint id PK
        text username UK
        text email UK
        text password
        text role
        boolean is_active
        timestamp created_at
    }
```
