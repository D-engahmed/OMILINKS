| Actor               | Type                        | Logs In? | Interacts With                                |
| ------------------- | --------------------------- | -------- | --------------------------------------------- |
| **Tenant Customer** | External end-user           | ❌ No     | WhatsApp, Telegram, IG, FB, SMS, Voice only   |
| **Team Admin**      | Tenant employee             | ✅ Yes    | Dashboard — full team control                 |
| **Manager**         | Tenant employee             | ✅ Yes    | Dashboard — operations + user management      |
| **Supervisor**      | Tenant employee             | ✅ Yes    | Dashboard — live operations monitoring        |
| **Human Agent**     | Tenant employee             | ✅ Yes    | Dashboard — handles conversations AI couldn't |
| **Analyst**         | Tenant employee             | ✅ Yes    | Dashboard — reads data, builds reports        |
| **System Operator** | Platform employee (Omnilix) | ✅ Yes    | Platform admin — multi-tenant infrastructure  |


```mermaid
flowchart TD
    Start((•)) --> A[Customer sends message]

    subgraph L1["📱 CUSTOMER DEVICE"]
        A
    end

    subgraph L2["📡 CHANNEL PLATFORM (WhatsApp / Telegram / IG / FB / SMS / Voice)"]
        B[Deliver via channel]
        C[POST webhook to Omnilix]
    end

    subgraph L3["🧠 OMNILIX AI ENGINE"]
        D["Ingest & normalize<br/><small>Unified event</small>"]
        E["Intent detection<br/><small>Classify request</small>"]
        F["Confidence scoring<br/><small>Can AI handle this?</small>"]
        Score{Score?}
    end

    subgraph L4["👤 AGENT WORKSPACE (Human Agent / Supervisor)"]
        G[">=80% Auto reply"]
        H["Generate AI response<br/><small>LLM + RAG + Memory</small>"]
        I["Guardrails check<br/><small>Safety + Compliance</small>"]

        J["40-80% Human review"]
        K["Generate AI draft<br/><small>Queue for agent</small>"]

        L["<40% Human handoff"]
        M["Escalate to agent<br/><small>Status: escalated</small>"]
        N["Agent receives alert<br/><small>Dashboard notification</small>"]
        O["Agent handles conversation<br/><small>Manual reply or approve draft</small>"]
    end

    subgraph L5["📤 CHANNEL PLATFORM (Outbound)"]
        P["Format outbound<br/><small>Channel-specific payload</small>"]
        Q["Send via channel API<br/><small>Delivery tracking</small>"]
    end

    subgraph L6["📱 CUSTOMER DEVICE "]
        R[Customer receives reply]
    end

    A --> B --> C --> D --> E --> F --> Score
    Score -->|>=80%| G --> H --> I --> P
    Score -->|40-80%| J --> K --> P
    Score -->|<40%| L --> M --> N --> O --> P
    P --> Q --> R --> End((•))

    classDef auto fill:#c8f7c5,stroke:#4caf50,color:#000
    classDef review fill:#ffe0b2,stroke:#ff9800,color:#000
    classDef handoff fill:#ffcdd2,stroke:#f44336,color:#000
    class G auto
    class J review
    class L handoff
```
