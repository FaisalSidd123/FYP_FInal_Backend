const pool = require('./db');

async function createFulltextSearch() {
  console.log('🔄 Creating fulltext search function...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create a single, generic search_fulltext function
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

    // Just in case p_case_id comes in as an integer
    await client.query(`
      CREATE OR REPLACE FUNCTION public.search_fulltext(
        p_case_id integer,
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
        WHERE e.case_id = p_case_id::bigint
          AND e.source_type = p_source_type::source_type_enum
          AND e.content_tsv @@ plainto_tsquery('english', query_text)
        ORDER BY similarity DESC
        LIMIT top_k;
      END;
      $$;
    `);

    await client.query('COMMIT');
    console.log('✅ Fulltext search functions created successfully!');
    
    // Also run NOTIFY to refresh cache
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ PostgREST schema cache reload notified successfully!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating fulltext function:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

createFulltextSearch();
