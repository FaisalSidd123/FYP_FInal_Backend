const pool = require('./db');

async function createRAGTables() {
  console.log('🔄 Starting RAG tables setup...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Enable uuid-ossp if not already enabled
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Enable pgvector if it exists, otherwise we'll just use jsonb or text for embeddings.
    // Let's try to enable it, ignore if it fails due to permissions/installation.
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension enabled');
    } catch (e) {
      console.log('⚠️ Could not enable pgvector, embeddings will use jsonb fallback');
    }

    // 2. Create ENUMs
    console.log('Creating ENUM types...');
    const enums = [
      `DO $$ BEGIN CREATE TYPE session_type_enum AS ENUM ('clinical_chat', 'image_review', 'diagnostic_assistant', 'treatment_guidance'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE message_role_enum AS ENUM ('user', 'assistant', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'system_event'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE source_type_enum AS ENUM ('patient', 'global'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE document_type_enum AS ENUM ('pdf', 'clinical_note', 'lab_report', 'guideline', 'ocr_text', 'xray', 'ct_scan', 'mri', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;`
    ];
    for (const q of enums) {
      await client.query(q);
    }

    // 3. Create Tables
    console.log('Creating Tables...');
    
    // chat_sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.chat_sessions (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        case_id bigint NOT NULL,
        session_name text,
        session_type session_type_enum NOT NULL DEFAULT 'clinical_chat',
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
        CONSTRAINT chat_sessions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.diagnosis_cases(id) ON DELETE CASCADE
      );
    `);

    // chat_messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.chat_messages (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        case_id bigint NOT NULL,
        session_id uuid NOT NULL,
        role message_role_enum NOT NULL,
        message_type message_type_enum NOT NULL DEFAULT 'text',
        content text NOT NULL,
        retrieval_context jsonb DEFAULT '[]'::jsonb,
        cited_documents jsonb DEFAULT '[]'::jsonb,
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamp with time zone DEFAULT now(),
        CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
        CONSTRAINT chat_messages_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.diagnosis_cases(id) ON DELETE CASCADE,
        CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE
      );
    `);

    // documents
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.documents (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        case_id bigint NOT NULL,
        document_type document_type_enum NOT NULL DEFAULT 'other',
        source_type source_type_enum NOT NULL DEFAULT 'patient',
        title text,
        filename text,
        storage_url text,
        mime_type text,
        extracted_text text,
        generated_report jsonb DEFAULT '{}'::jsonb,
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT documents_pkey PRIMARY KEY (id),
        CONSTRAINT documents_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.diagnosis_cases(id) ON DELETE CASCADE
      );
    `);

    // Check if vector type exists
    const typeCheck = await client.query(`SELECT exists (SELECT 1 FROM pg_type WHERE typname = 'vector')`);
    const hasVector = typeCheck.rows[0].exists;
    const embeddingColType = hasVector ? 'vector(384)' : 'jsonb'; // fallback if pgvector failed

    // embeddings
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.embeddings (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        case_id bigint NOT NULL,
        document_id uuid NOT NULL,
        chunk_index integer NOT NULL,
        content text NOT NULL,
        embedding ${embeddingColType},
        token_count integer,
        content_tsv tsvector,
        source_type source_type_enum NOT NULL DEFAULT 'patient',
        metadata jsonb DEFAULT '{}'::jsonb,
        created_at timestamp with time zone DEFAULT now(),
        CONSTRAINT embeddings_pkey PRIMARY KEY (id),
        CONSTRAINT embeddings_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
        CONSTRAINT embeddings_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.diagnosis_cases(id) ON DELETE CASCADE
      );
    `);

    await client.query('COMMIT');
    console.log('✅ RAG Tables created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up RAG tables:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

createRAGTables();
