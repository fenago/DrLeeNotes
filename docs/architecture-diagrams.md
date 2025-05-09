# Architecture Diagrams

## System Architecture Diagram

```mermaid
flowchart TD
    subgraph "Frontend"
        NextApp["Next.js Application"] 
        ClientComponents["Client Components"] 
        ServerComponents["Server Components"] 
        ClerkAuth["Clerk Authentication"] 
    end

    subgraph "Backend Services"
        ConvexBackend["Convex"] 
        WhisperAPI["Replicate - Whisper"] 
        LlamaLLM["Together.ai - Llama-4"] 
    end

    subgraph "Data Storage"
        ConvexDB[("Convex Database")] 
        FileStorage[("File Storage")] 
        VectorStore[("Vector Store")] 
    end
    
    User["User"] -->|"Records Audio"| NextApp
    NextApp --> ClientComponents
    NextApp --> ServerComponents
    NextApp -->|"Auth"| ClerkAuth
    
    ClientComponents -->|"Data Operations"| ConvexBackend
    ServerComponents -->|"Server Functions"| ConvexBackend
    ClerkAuth -->|"JWT Token"| ConvexBackend
    
    ConvexBackend -->|"Store Data"| ConvexDB
    ConvexBackend -->|"Store Files"| FileStorage
    ConvexBackend -->|"Vector Search"| VectorStore
    
    ConvexBackend -->|"Transcribe Audio"| WhisperAPI
    ConvexBackend -->|"Process Text"| LlamaLLM
    
    WhisperAPI -->|"Transcript"| ConvexBackend
    LlamaLLM -->|"Insights/Embeddings"| ConvexBackend
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Auth as Clerk Auth
    participant Backend as Convex Backend
    participant DB as Convex DB
    participant Storage as File Storage
    participant Whisper as Replicate Whisper
    participant LLM as Together.ai LLM
    
    User->>Frontend: Record voice note
    Frontend->>Auth: Authenticate user
    Auth-->>Frontend: Auth token
    Frontend->>Storage: Upload audio file
    Storage-->>Frontend: File URL
    Frontend->>Backend: Create note (with file URL)
    Backend->>DB: Save initial note record
    Backend->>Whisper: Send audio for transcription
    Whisper-->>Backend: Return transcript
    Backend->>DB: Update note with transcript
    Backend->>LLM: Process transcript (extract title/summary/actions)
    LLM-->>Backend: Return processed data
    Backend->>DB: Save title, summary, and actions
    Backend->>LLM: Generate embedding
    LLM-->>Backend: Return vector embedding
    Backend->>DB: Save embedding for search
    DB-->>Frontend: Real-time updates
    Frontend-->>User: Show completed note
```

## Component Architecture

```mermaid
componentDiagram
    component Frontend {
        component Pages {
            component LandingPage
            component DashboardPage
            component RecordPage
            component RecordingViewPage
            component ActionItemsPage
        }
        
        component Components {
            component UI {
                component Header
                component Footer
                component Button
                component UserNav
            }
            component Feature {
                component RecordingComponent
                component NoteCard
                component ActionItemList
                component SearchBar
            }
        }
        
        component Providers {
            component ConvexProvider
            component ClerkProvider
        }
    }
    
    component Backend {
        component ConvexFunctions {
            component NotesFunctions
            component WhisperFunctions
            component TogetherFunctions
            component UtilFunctions
        }
        
        component Database {
            component NotesTable
            component ActionItemsTable
            component VectorIndex
        }
    }
    
    component ExternalServices {
        component ClerkAuth
        component ReplicateAPI
        component TogetherAI
    }
    
    Providers --> ExternalServices
    Pages --> Components
    Frontend --> Backend
    ConvexFunctions --> Database
    ConvexFunctions --> ExternalServices
```

## Database Schema Diagram

```mermaid
erDiagram
    USER {
        string id
        string name
        string email
    }
    
    NOTES {
        id _id
        string userId
        id audioFileId
        string audioFileUrl
        string title
        string transcription
        string summary
        array embedding
        boolean generatingTranscript
        boolean generatingTitle
        boolean generatingActionItems
        timestamp _creationTime
    }
    
    ACTION_ITEMS {
        id _id
        id noteId
        string userId
        string task
        timestamp _creationTime
    }
    
    USER ||--o{ NOTES : creates
    USER ||--o{ ACTION_ITEMS : owns
    NOTES ||--o{ ACTION_ITEMS : contains
```

## Processing Pipeline

```mermaid
graph TD
    A[Record Audio] --> B[Upload to Storage]
    B --> C[Create Note Record]
    C --> D[Send to Whisper API]
    D --> E[Save Transcript]
    E --> F[Delete Audio File]
    E --> G[Process with LLM]
    E --> H[Generate Embedding]
    G --> I[Extract Title]
    G --> J[Generate Summary]
    G --> K[Identify Action Items]
    I --> L[Save Title]
    J --> M[Save Summary]
    K --> N[Create Action Item Records]
    H --> O[Save Embedding]
    
    subgraph "Client Side"
        A
        B
    end
    
    subgraph "Convex Backend"
        C
        E
        F
        G
        H
        I
        J
        K
        L
        M
        N
        O
    end
    
    subgraph "External AI Services"
        D[Whisper API - Replicate]
        G[LLM - Together.ai]
        H[Embeddings - Together.ai]
    end
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
    style G fill:#bbf,stroke:#333,stroke-width:2px
    style H fill:#bbf,stroke:#333,stroke-width:2px
```

## Deployment Architecture

```mermaid
flowchart TB
    subgraph "Development Environment"
        NextDev["Next.js Dev Server"] 
        ConvexDev["Convex Dev"] 
        LocalEnv[".env.local"] 
    end
    
    subgraph "Production Environment"
        NextProd["Next.js Production"] 
        ConvexProd["Convex Production"] 
        EnvVars["Environment Variables"] 
    end
    
    subgraph "External Services"
        Clerk["Clerk Authentication"] 
        Together["Together.ai API"] 
        Replicate["Replicate API"] 
    end
    
    Developer -->|"Development"| NextDev
    Developer -->|"Deploy Backend"| ConvexDev
    LocalEnv -->|"Config"| NextDev
    LocalEnv -->|"Config"| ConvexDev
    
    Developer -->|"Deploy Frontend"| NextProd
    Developer -->|"Deploy Backend"| ConvexProd
    EnvVars -->|"Config"| NextProd
    EnvVars -->|"Config"| ConvexProd
    
    NextDev -.->|"Auth"| Clerk
    ConvexDev -.->|"Auth"| Clerk
    ConvexDev -.->|"LLM/Embeddings"| Together
    ConvexDev -.->|"Transcription"| Replicate
    
    NextProd -.->|"Auth"| Clerk
    ConvexProd -.->|"Auth"| Clerk
    ConvexProd -.->|"LLM/Embeddings"| Together
    ConvexProd -.->|"Transcription"| Replicate
```

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Clerk
    participant Convex
    
    User->>Frontend: Visit protected page
    Frontend->>Clerk: Request authentication
    Clerk->>User: Show sign-in UI
    User->>Clerk: Provide credentials
    Clerk->>Clerk: Validate credentials
    Clerk->>Frontend: Return authentication token
    Frontend->>Convex: API request with token
    Convex->>Clerk: Validate token (using issuer URL)
    Clerk->>Convex: Confirm token validity
    Convex->>Convex: Associate request with user
    Convex->>Frontend: Return authorized data
    Frontend->>User: Display protected content
```
