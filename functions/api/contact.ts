// Simplified test version
export async function onRequestPost(context: any) {
  console.log('=== FUNCTION CALLED ===');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { request, env } = context;

    console.log('Has DB:', !!env?.DB);
    console.log('Has KV:', !!env?.CONTACT_FORM_KV);

    const data = await request.json();
    console.log('Received data:', data);

    return new Response(
      JSON.stringify({ success: true, message: 'Test successful!', debug: { hasDB: !!env?.DB, hasKV: !!env?.CONTACT_FORM_KV } }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('ERROR:', error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
