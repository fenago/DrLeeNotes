# Database Schema Documentation

## Overview

The Notes application uses Convex as its database and backend service. The schema defines the structure of the data stored in the application, including tables (collections) and indexes for efficient data retrieval.

## Tables

### `notes` Table

Stores voice recordings and their processed data.

#### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `userId` | `string` | The ID of the user who owns the note |
| `audioFileId` | `id ('_storage')` | Reference to the audio file in Convex storage |
| `audioFileUrl` | `string` | URL to access the audio file |
| `title` | `string?` | Generated title for the note (optional) |
| `transcription` | `string?` | Text transcription of the audio (optional) |
| `summary` | `string?` | AI-generated summary of the note (optional) |
| `embedding` | `float64[]?` | Vector embedding for semantic search (optional) |
| `generatingTranscript` | `boolean` | Flag indicating if transcription is in progress |
| `generatingTitle` | `boolean` | Flag indicating if title generation is in progress |
| `generatingActionItems` | `boolean` | Flag indicating if action item extraction is in progress |

#### Indexes

- **by_userId**: Enables efficient querying of notes by user ID
- **by_embedding**: Vector index for semantic search with 768 dimensions, filtered by userId

### `actionItems` Table

Stores action items extracted from voice notes.

#### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `noteId` | `id ('notes')` | Reference to the parent note |
| `userId` | `string` | The ID of the user who owns the action item |
| `task` | `string` | The action item text |

#### Indexes

- **by_noteId**: Enables efficient querying of action items by note ID
- **by_userId**: Enables efficient querying of action items by user ID

## Relationships

- One-to-many relationship between a user and their notes
- One-to-many relationship between a note and its action items
- Many-to-one relationship between action items and a user

## Schema Definition Code

```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  notes: defineTable({
    userId: v.string(),
    audioFileId: v.id('_storage'),
    audioFileUrl: v.string(),
    title: v.optional(v.string()),
    transcription: v.optional(v.string()),
    summary: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    generatingTranscript: v.boolean(),
    generatingTitle: v.boolean(),
    generatingActionItems: v.boolean(),
  })
    .index('by_userId', ['userId'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 768,
      filterFields: ['userId'],
    }),
  actionItems: defineTable({
    noteId: v.id('notes'),
    userId: v.string(),
    task: v.string(),
  })
    .index('by_noteId', ['noteId'])
    .index('by_userId', ['userId']),
});
```

## Notes

- The vector index for embeddings allows for semantic searching of notes based on content similarity
- The `generatingTranscript`, `generatingTitle`, and `generatingActionItems` fields are used to track the asynchronous processing state
- All data is user-scoped for privacy and security
