const pool = require('./db');

async function forceCleanFulltext() {
  console.log('🔄 Force-cleaning fulltext functions...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find and drop ALL functions named search_fulltext
    const funcs = await client.query(`
      SELECT oid::regprocedure AS function_signature
      FROM pg_proc
      WHERE proname = 'search_fulltext';
    `);

    for (const row of funcs.rows) {
      console.log(`Dropping ${row.function_signature}...`);
      await client.query(`DROP FUNCTION IF EXISTS ${row.function_signature} CASCADE;`);
    }

    // 2. Create EXACTLY ONE single generic function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.search_fulltext(
        p_case_id bigint,
        p_source_type text,
        query_text text,
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
          ts_rank(e.content_tsv, plainto_tsquery('english', query_text))::double precision AS similarity
        FROM public.embeddings e
        WHERE e.case_id = p_case_id
          AND e.source_type = p_source_type::source_type_enum
          AND e.content_tsv @@ plainto_tsquery('english', query_text)
        ORDER BY similarity DESC
        LIMIT top_k;
      END;
      $$;
    `);

    await client.query('COMMIT');
    console.log('✅ Single fulltext search function created successfully!');
    
    // Also run NOTIFY
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ PostgREST schema cache reload notified successfully!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing fulltext functions:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

forceCleanFulltext();
