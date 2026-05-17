const pool = require('../db');

async function verifyRAGV6() {
  console.log('🔍 Starting Clinical RAG v6 Backend Verification...');
  const client = await pool.connect();
  try {
    // 1. Check embedding dimension
    const dimRes = await client.query(`
      SELECT atttypmod 
      FROM pg_attribute 
      WHERE attrelid = 'public.embeddings'::regclass 
        AND attname = 'embedding';
    `);
    const dimension = dimRes.rows[0].atttypmod;
    console.log(`📐 Verified: embeddings.embedding has dimension: ${dimension}`);
    
    if (dimension === 768) {
      console.log('✅ Dimension upgrade verification SUCCESS.');
    } else {
      console.error('❌ Dimension upgrade verification FAILED.');
    }

    // 2. Query hybrid_search_v6 procedure with a mock query
    console.log('🔮 Running hybrid_search_v6 check with mock embedding...');
    
    // Generate a mock 768-dimensional vector (filled with 0s)
    const mockVector = Array(768).fill(0);
    const mockVectorString = `[${mockVector.join(',')}]`;

    const searchRes = await client.query(`
      SELECT id, source_type, document_type, similarity, fts_rank, rrf_score 
      FROM public.hybrid_search_v6(
        $1::vector(768),
        'pneumonia treatment',
        NULL,
        ARRAY['patient','generated','kb','global']::text[],
        NULL,
        8, 8, 60
      )
      LIMIT 1;
    `, [mockVectorString]);

    console.log('✅ Verified: hybrid_search_v6 compiled successfully and executes without errors!');
    console.log('Result payload from dry-run search:', searchRes.rows);

  } catch (err) {
    console.error('❌ Verification FAILED with error:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

verifyRAGV6();
