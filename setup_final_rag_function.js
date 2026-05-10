const pool = require('./db');

async function fixPostgrestOverload() {
  console.log('🔄 Cleaning up overloaded RAG search functions...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Drop ALL previously created functions to resolve PGRST203
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, source_type_enum, vector, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, text, vector, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, text, text, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(integer, text, jsonb, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, text, jsonb, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, source_type_enum, jsonb, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(integer, source_type_enum, jsonb, integer);`);

    // 2. Create EXACTLY ONE generic function
    // PostgREST handles JSON automatically. A single function prevents overload confusion.
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

    await client.query('COMMIT');
    console.log('✅ Single search function created successfully!');
    
    // Also run NOTIFY
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ PostgREST schema cache reload notified successfully!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing RAG functions:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixPostgrestOverload();
