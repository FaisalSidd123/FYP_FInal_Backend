const pool = require('./db');

async function runMigrationV6() {
  console.log('🚀 Starting Clinical RAG v6 Database Schema Migration...');
  const client = await pool.connect();

  try {
    // Step 0: Alter vector column to 768 dimensions (Important first step)
    console.log('📐 Altering embedding dimensions constraint to vector(768)...');
    await client.query(`
      ALTER TABLE public.embeddings 
      ALTER COLUMN embedding TYPE vector(768);
    `);
    console.log('✅ Embedding dimension successfully upgraded to vector(768).');

    // Step 1: Extensions
    console.log('🧱 Creating extensions if not exist...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    await client.query('CREATE EXTENSION IF NOT EXISTS unaccent;');

    // Step 2: Archive legacy case_queries
    console.log('📂 Archiving legacy case_queries...');
    const tableExistsRes = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'case_queries';
    `);
    const legacyExistsRes = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'case_queries_legacy_v5';
    `);

    if (tableExistsRes.rows.length > 0 && legacyExistsRes.rows.length === 0) {
      await client.query('ALTER TABLE public.case_queries RENAME TO case_queries_legacy_v5;');
      await client.query("COMMENT ON TABLE public.case_queries_legacy_v5 IS 'Archived v5 conversational table. Read-only. Replaced by chat_messages.';");
      await client.query('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.case_queries_legacy_v5 FROM PUBLIC;');
      await client.query('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.case_queries_legacy_v5 FROM authenticated, anon, service_role;');
      await client.query('GRANT SELECT ON public.case_queries_legacy_v5 TO authenticated, anon, service_role;');
      console.log('✅ Archived legacy case_queries to case_queries_legacy_v5.');
    } else {
      console.log('⏭️  Skipping case_queries archiving (already processed).');
    }

    // Step 3: Enum values
    // To avoid "ALTER TYPE ... ADD VALUE cannot run inside a transaction block", we run these individually
    console.log('🧬 Normalizing ENUM values...');
    const enumQueries = [
      "DO $$ BEGIN ALTER TYPE document_type_enum ADD VALUE IF NOT EXISTS 'xray'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE document_type_enum ADD VALUE IF NOT EXISTS 'pdf'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE document_type_enum ADD VALUE IF NOT EXISTS 'report'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE document_type_enum ADD VALUE IF NOT EXISTS 'generated'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE document_type_enum ADD VALUE IF NOT EXISTS 'kb_article'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      
      "DO $$ BEGIN ALTER TYPE source_type_enum ADD VALUE IF NOT EXISTS 'patient'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE source_type_enum ADD VALUE IF NOT EXISTS 'generated'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE source_type_enum ADD VALUE IF NOT EXISTS 'global'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE source_type_enum ADD VALUE IF NOT EXISTS 'kb'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE source_type_enum ADD VALUE IF NOT EXISTS 'upload'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      
      "DO $$ BEGIN ALTER TYPE session_type_enum ADD VALUE IF NOT EXISTS 'clinical_chat'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE session_type_enum ADD VALUE IF NOT EXISTS 'diagnosis'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE session_type_enum ADD VALUE IF NOT EXISTS 'followup'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE session_type_enum ADD VALUE IF NOT EXISTS 'multimodal_chat'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      
      "DO $$ BEGIN ALTER TYPE message_type_enum ADD VALUE IF NOT EXISTS 'text'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE message_type_enum ADD VALUE IF NOT EXISTS 'image'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE message_type_enum ADD VALUE IF NOT EXISTS 'pdf'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE message_type_enum ADD VALUE IF NOT EXISTS 'analysis'; EXCEPTION WHEN OTHERS THEN NULL; END $$;",
      "DO $$ BEGIN ALTER TYPE message_type_enum ADD VALUE IF NOT EXISTS 'system'; EXCEPTION WHEN OTHERS THEN NULL; END $$;"
    ];

    for (const eq of enumQueries) {
      await client.query(eq);
    }
    console.log('✅ Normalized all ENUM definitions.');

    // Step 4: Relax constraints (DROP NOT NULL)
    console.log('🔓 Relaxing case_id constraints for KB ingestion...');
    await client.query('ALTER TABLE public.embeddings ALTER COLUMN case_id DROP NOT NULL;');
    await client.query('ALTER TABLE public.documents ALTER COLUMN case_id DROP NOT NULL;');
    console.log('✅ case_id columns are now nullable on embeddings and documents.');

    // Step 5: Table schema upgrades
    console.log('📝 Modifying tables with new schema columns...');
    await client.query(`
      ALTER TABLE public.chat_sessions
        ADD COLUMN IF NOT EXISTS summary text,
        ADD COLUMN IF NOT EXISTS summary_turn_count int DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_intent text,
        ADD COLUMN IF NOT EXISTS total_turns int DEFAULT 0;
    `);

    await client.query(`
      ALTER TABLE public.embeddings
        ADD COLUMN IF NOT EXISTS disease_tag text,
        ADD COLUMN IF NOT EXISTS modality text,
        ADD COLUMN IF NOT EXISTS parent_document_id uuid,
        ADD COLUMN IF NOT EXISTS embedding_model text DEFAULT 'BAAI/bge-base-en-v1.5',
        ADD COLUMN IF NOT EXISTS retrieval_score real;
    `);

    await client.query(`
      ALTER TABLE public.documents
        ADD COLUMN IF NOT EXISTS summarized_context text,
        ADD COLUMN IF NOT EXISTS modality text,
        ADD COLUMN IF NOT EXISTS parent_document_id uuid,
        ADD COLUMN IF NOT EXISTS token_count int,
        ADD COLUMN IF NOT EXISTS disease_tag text;
    `);

    await client.query(`
      ALTER TABLE public.chat_messages
        ADD COLUMN IF NOT EXISTS token_count int,
        ADD COLUMN IF NOT EXISTS intent text;
    `);
    console.log('✅ Columns verified and added.');

    // Step 6: Create/recreate database Indexes
    console.log('⚡ Creating index structures (HNSW, GIN, Btree, Trigram)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS embeddings_embedding_hnsw_idx
      ON public.embeddings USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS embeddings_tsv_gin_idx
      ON public.embeddings USING gin (content_tsv);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS embeddings_case_source_idx
      ON public.embeddings (case_id, source_type);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS embeddings_disease_idx
      ON public.embeddings (disease_tag)
      WHERE disease_tag IS NOT NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx
      ON public.chat_messages (session_id, created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS chat_sessions_case_id_idx
      ON public.chat_sessions (case_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS embeddings_content_trgm_idx
      ON public.embeddings USING gin (content gin_trgm_ops);
    `);
    console.log('✅ Database indexes loaded successfully.');

    // Step 7: Clean legacy functions
    console.log('🧹 Clearing legacy database search procedures...');
    const dropFunctions = [
      "DROP FUNCTION IF EXISTS public.search_vectors(vector, text, bigint, int) CASCADE;",
      "DROP FUNCTION IF EXISTS public.search_vectors(vector, text, integer, int) CASCADE;",
      "DROP FUNCTION IF EXISTS public.search_fulltext(text, text, bigint, int) CASCADE;",
      "DROP FUNCTION IF EXISTS public.search_fulltext(text, text, integer, int) CASCADE;",
      "DROP FUNCTION IF EXISTS public.fetch_session_context(uuid, int) CASCADE;",
      "DROP FUNCTION IF EXISTS public.fetch_case_documents(bigint, text) CASCADE;",
      "DROP FUNCTION IF EXISTS public.fetch_case_documents(integer, text) CASCADE;"
    ];
    for (const df of dropFunctions) {
      await client.query(df);
    }
    console.log('✅ Legacy v5 routines cleaned.');

    // Step 8: Create hybrid_search_v6
    console.log('🔮 Compiling hybrid_search_v6 stored procedure...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.hybrid_search_v6(
          query_embedding  vector(768),
          query_text       text,
          p_case_id        bigint  DEFAULT NULL,
          p_source_types   text[]  DEFAULT ARRAY['patient','generated','kb','global']::text[],
          p_disease_tags   text[]  DEFAULT NULL,
          p_top_k_vec      int     DEFAULT 12,
          p_top_k_fts      int     DEFAULT 12,
          p_rrf_k          int     DEFAULT 60
      )
      RETURNS TABLE (
          id           uuid,
          document_id  uuid,
          case_id      bigint,
          chunk_index  int,
          content      text,
          similarity   real,
          fts_rank     real,
          rrf_score    real,
          source_type  text,
          document_type text,
          disease_tag  text,
          modality     text,
          metadata     jsonb
      )
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        v_tsquery tsquery;
      BEGIN
        v_tsquery := websearch_to_tsquery('english', COALESCE(query_text, ''));

        RETURN QUERY
        WITH vec AS (
          SELECT
            e.id,
            e.document_id,
            e.case_id,
            e.chunk_index,
            e.content,
            (1.0 - (e.embedding <=> query_embedding))::real        AS similarity,
            e.source_type::text                                    AS source_type_t,
            e.disease_tag,
            e.modality,
            e.metadata,
            ROW_NUMBER() OVER (ORDER BY e.embedding <=> query_embedding ASC) AS rnk
          FROM public.embeddings e
          WHERE e.embedding IS NOT NULL
            AND e.source_type::text = ANY (p_source_types)
            AND (
              p_case_id IS NULL
              OR e.case_id = p_case_id
              OR e.source_type::text IN ('global', 'kb')
            )
            AND (
              p_disease_tags IS NULL
              OR e.disease_tag IS NULL
              OR e.disease_tag = ANY (p_disease_tags)
            )
          ORDER BY e.embedding <=> query_embedding
          LIMIT p_top_k_vec
        ),
        fts AS (
          SELECT
            e.id,
            e.document_id,
            e.case_id,
            e.chunk_index,
            e.content,
            ts_rank(e.content_tsv, v_tsquery)::real    AS fts_rank,
            e.source_type::text                        AS source_type_t,
            e.disease_tag,
            e.modality,
            e.metadata,
            ROW_NUMBER() OVER (ORDER BY ts_rank(e.content_tsv, v_tsquery) DESC) AS rnk
          FROM public.embeddings e
          WHERE e.content_tsv @@ v_tsquery
            AND e.source_type::text = ANY (p_source_types)
            AND (
              p_case_id IS NULL
              OR e.case_id = p_case_id
              OR e.source_type::text IN ('global', 'kb')
            )
            AND (
              p_disease_tags IS NULL
              OR e.disease_tag IS NULL
              OR e.disease_tag = ANY (p_disease_tags)
            )
          ORDER BY ts_rank(e.content_tsv, v_tsquery) DESC
          LIMIT p_top_k_fts
        ),
        merged AS (
          SELECT
            COALESCE(v.id,           f.id)           AS id,
            COALESCE(v.document_id,  f.document_id)  AS document_id,
            COALESCE(v.case_id,      f.case_id)      AS case_id,
            COALESCE(v.chunk_index,  f.chunk_index)  AS chunk_index,
            COALESCE(v.content,      f.content)      AS content,
            COALESCE(v.similarity,   0.0)::real      AS similarity,
            COALESCE(f.fts_rank,     0.0)::real      AS fts_rank,
            (
              COALESCE(1.0 / (p_rrf_k + v.rnk), 0.0) +
              COALESCE(1.0 / (p_rrf_k + f.rnk), 0.0)
            )::real                                  AS rrf_score,
            COALESCE(v.source_type_t, f.source_type_t) AS source_type_t,
            COALESCE(v.disease_tag,  f.disease_tag)  AS disease_tag,
            COALESCE(v.modality,     f.modality)     AS modality,
            COALESCE(v.metadata,     f.metadata)     AS metadata
          FROM vec v
          FULL OUTER JOIN fts f ON v.id = f.id
        )
        SELECT
          m.id,
          m.document_id,
          m.case_id,
          m.chunk_index,
          m.content,
          m.similarity,
          m.fts_rank,
          m.rrf_score,
          m.source_type_t                            AS source_type,
          COALESCE((d.document_type)::text, 'unknown') AS document_type,
          m.disease_tag,
          m.modality,
          m.metadata
        FROM merged m
        LEFT JOIN public.documents d ON d.id = m.document_id
        ORDER BY m.rrf_score DESC
        LIMIT GREATEST(p_top_k_vec, p_top_k_fts);
      END;
      $$;
    `);
    console.log('✅ Compiled hybrid_search_v6 procedure.');

    // Step 9: Automatic FTS Trigger
    console.log('⚙️ Registering GIN FTS updates trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.embeddings_tsv_trigger()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        NEW.content_tsv := to_tsvector('english', unaccent(COALESCE(NEW.content, '')));
        RETURN NEW;
      END $$;
    `);

    await client.query(`DROP TRIGGER IF EXISTS embeddings_tsv_update ON public.embeddings;`);
    await client.query(`
      CREATE TRIGGER embeddings_tsv_update
        BEFORE INSERT OR UPDATE OF content ON public.embeddings
        FOR EACH ROW EXECUTE FUNCTION public.embeddings_tsv_trigger();
    `);

    // Backfill NULL content_tsv
    console.log('⚙️ Backfilling null content_tsv rows...');
    await client.query(`
      UPDATE public.embeddings
      SET content_tsv = to_tsvector('english', unaccent(COALESCE(content, '')))
      WHERE content_tsv IS NULL;
    `);
    console.log('✅ Trigger and backfill complete.');

    // Step 10: Grants
    await client.query(`
      GRANT EXECUTE ON FUNCTION public.hybrid_search_v6(
          vector, text, bigint, text[], text[], int, int, int
      ) TO anon, authenticated, service_role;
    `);

    // Notify PostgREST cache reload
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ DDL execution complete. Schema successfully reloaded!');
    console.log('🎉 Clinical RAG v6 Migration Complete!');

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigrationV6();
