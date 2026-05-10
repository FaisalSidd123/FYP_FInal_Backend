const pool = require('./db');

async function createRAGFunctions() {
  console.log('🔄 Creating RAG search function...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Make sure we have the vector extension
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    } catch(e) {}

    // Drop it if it exists to replace it cleanly
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, source_type_enum, vector, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, text, vector, integer);`);
    await client.query(`DROP FUNCTION IF EXISTS public.search_vectors(bigint, source_type_enum, jsonb, integer);`);

    // Create the search_vectors function
    // We assume query_embedding is of type 'vector' since pgvector is used
    await client.query(`
      CREATE OR REPLACE FUNCTION public.search_vectors(
        p_case_id bigint,
        p_source_type source_type_enum,
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
          AND e.source_type = p_source_type
        ORDER BY e.embedding <=> query_embedding
        LIMIT top_k;
      END;
      $$;
    `);

    // We also create an overloaded version taking text for the source_type just in case the API passes a string instead of an enum cast
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

    // Also just in case the embedding is passed as text instead of a vector type
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


    await client.query('COMMIT');
    console.log('✅ RAG search functions created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating RAG functions:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

createRAGFunctions();
