const pool = require('./db');

async function createBulletproofRAGFunctions() {
  console.log('🔄 Creating bulletproof RAG search functions...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Drop existing ones to avoid confusion
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, source_type_enum, vector, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, text, vector, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, text, text, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(integer, text, text, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, text, jsonb, integer);`);
    
    // 2. The most generic version that takes everything as basic types, matching how REST JSON payloads are parsed
    // case_id might come as int or bigint depending on JSON parsing
    // query_embedding comes as text or jsonb array
    await client.query(`
      CREATE OR REPLACE FUNCTION public.search_vectors(
        p_case_id bigint,
        p_source_type text,
        query_embedding text,
        top_k integer
      )
      RETURNS TABLE (
        id uuid,
        document_id uuid,
        chunk_index integer,
        content text,
        metadata jsonb,
        similarity double precision
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          e.id,
          e.document_id,
          e.chunk_index,
          e.content,
          e.metadata,
          1 - (e.embedding <=> query_embedding::vector) AS similarity
        FROM public.embeddings e
        WHERE e.case_id = p_case_id
          AND e.source_type = p_source_type::source_type_enum
        ORDER BY e.embedding <=> query_embedding::vector
        LIMIT top_k;
      END;
      $$;
    `);

    // Version taking query_embedding as jsonb
    await client.query(`
      CREATE OR REPLACE FUNCTION public.search_vectors(
        p_case_id bigint,
        p_source_type text,
        query_embedding jsonb,
        top_k integer
      )
      RETURNS TABLE (
        id uuid,
        document_id uuid,
        chunk_index integer,
        content text,
        metadata jsonb,
        similarity double precision
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          e.id,
          e.document_id,
          e.chunk_index,
          e.content,
          e.metadata,
          1 - (e.embedding <=> (query_embedding::text)::vector) AS similarity
        FROM public.embeddings e
        WHERE e.case_id = p_case_id
          AND e.source_type = p_source_type::source_type_enum
        ORDER BY e.embedding <=> (query_embedding::text)::vector
        LIMIT top_k;
      END;
      $$;
    `);

    // Version if case_id is parsed as integer
    await client.query(`
      CREATE OR REPLACE FUNCTION public.search_vectors(
        p_case_id integer,
        p_source_type text,
        query_embedding jsonb,
        top_k integer
      )
      RETURNS TABLE (
        id uuid,
        document_id uuid,
        chunk_index integer,
        content text,
        metadata jsonb,
        similarity double precision
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          e.id,
          e.document_id,
          e.chunk_index,
          e.content,
          e.metadata,
          1 - (e.embedding <=> (query_embedding::text)::vector) AS similarity
        FROM public.embeddings e
        WHERE e.case_id = p_case_id::bigint
          AND e.source_type = p_source_type::source_type_enum
        ORDER BY e.embedding <=> (query_embedding::text)::vector
        LIMIT top_k;
      END;
      $$;
    `);

    // Version with vector type explicitly
    await client.query(`
      CREATE OR REPLACE FUNCTION public.search_vectors(
        p_case_id bigint,
        p_source_type text,
        query_embedding vector,
        top_k integer
      )
      RETURNS TABLE (
        id uuid,
        document_id uuid,
        chunk_index integer,
        content text,
        metadata jsonb,
        similarity double precision
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          e.id,
          e.document_id,
          e.chunk_index,
          e.content,
          e.metadata,
          1 - (e.embedding <=> query_embedding) AS similarity
        FROM public.embeddings e
        WHERE e.case_id = p_case_id
          AND e.source_type = p_source_type::source_type_enum
        ORDER BY e.embedding <=> query_embedding
        LIMIT top_k;
      END;
      $$;
    `);

    await client.query('COMMIT');
    console.log('✅ Functions created successfully!');
    
    // Also run NOTIFY
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ PostgREST schema cache reload notified successfully!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating RAG functions:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

createBulletproofRAGFunctions();
