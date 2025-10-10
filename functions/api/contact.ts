interface Env {
  DB: D1Database;
  CONTACT_FORM_KV: KVNamespace;
  NTFY_TOPIC: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  'cf-turnstile-response'?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  console.log('=== CONTACT FORM SUBMISSION START ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const { request, env } = context;

    // Check bindings availability
    console.log('Bindings Check:');
    console.log('- DB available:', !!env.DB);
    console.log('- CONTACT_FORM_KV available:', !!env.CONTACT_FORM_KV);
    console.log('- NTFY_TOPIC available:', !!env.NTFY_TOPIC);
    console.log('- NTFY_TOPIC value:', env.NTFY_TOPIC ? `"${env.NTFY_TOPIC}"` : 'NOT SET');

    // Parse request data
    let data: ContactFormData;
    try {
      data = await request.json();
      console.log('Request data parsed successfully');
      console.log('- Name length:', data.name?.length || 0);
      console.log('- Email length:', data.email?.length || 0);
      console.log('- Message length:', data.message?.length || 0);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { name, email, message } = data;

    // Validate required fields
    if (!name || !email || !message) {
      console.warn('Validation failed: Missing required fields');
      console.log('- Name present:', !!name);
      console.log('- Email present:', !!email);
      console.log('- Message present:', !!message);
      return new Response(
        JSON.stringify({ error: 'Name, email, and message are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    if (!email.includes('@')) {
      console.warn('Validation failed: Invalid email format:', email);
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    console.log('Client info:');
    console.log('- IP:', clientIP);
    console.log('- User-Agent:', userAgent.substring(0, 50) + '...');

    // Rate limiting with KV
    if (env.CONTACT_FORM_KV) {
      console.log('Checking rate limit...');
      const rateLimitKey = `rate_limit:${clientIP}`;
      const submissionCount = await env.CONTACT_FORM_KV.get(rateLimitKey);
      console.log('- Current submission count:', submissionCount || '0');

      if (submissionCount && parseInt(submissionCount) >= 10) {
        console.warn('Rate limit exceeded for IP:', clientIP);
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const newCount = submissionCount ? parseInt(submissionCount) + 1 : 1;
      await env.CONTACT_FORM_KV.put(rateLimitKey, newCount.toString(), {
        expirationTtl: 3600,
      });
      console.log('- Updated submission count to:', newCount);
      console.log('- Rate limit TTL: 3600 seconds (1 hour)');
    } else {
      console.warn('KV namespace not available - rate limiting DISABLED');
    }

    // Store in D1 database
    if (env.DB) {
      console.log('Storing submission in D1...');
      try {
        const result = await env.DB.prepare(
          'INSERT INTO submissions (name, email, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(name, email, message, clientIP, userAgent)
          .run();

        console.log('- D1 insert successful');
        console.log('- Result meta:', JSON.stringify(result.meta));
      } catch (dbError: any) {
        console.error('D1 database error:', dbError);
        console.error('- Error message:', dbError.message);
        console.error('- Error stack:', dbError.stack);
        // Continue execution - don't fail the whole request if DB fails
      }
    } else {
      console.warn('D1 database not available - submission NOT stored');
    }

    // Send ntfy notification
    if (env.NTFY_TOPIC) {
      console.log('Sending ntfy notification...');
      console.log('- Topic:', env.NTFY_TOPIC);
      try {
        const ntfyResponse = await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
          method: 'POST',
          headers: {
            'Title': 'New Contact Form Submission',
            'Priority': 'high',
            'Tags': 'email,envelope_with_arrow',
          },
          body: 'New contact form submission received on Called & Sent',
        });

        console.log('- ntfy response status:', ntfyResponse.status);
        console.log('- ntfy response ok:', ntfyResponse.ok);

        if (!ntfyResponse.ok) {
          const ntfyText = await ntfyResponse.text();
          console.error('- ntfy error response:', ntfyText);
        } else {
          console.log('- ntfy notification sent successfully');
        }
      } catch (notifyError: any) {
        console.error('ntfy notification failed:', notifyError);
        console.error('- Error message:', notifyError.message);
        // Continue execution - don't fail if notification fails
      }
    } else {
      console.warn('NTFY_TOPIC not set - notification NOT sent');
    }

    console.log('=== CONTACT FORM SUBMISSION SUCCESS ===');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message sent successfully!',
        debug: {
          db_stored: !!env.DB,
          notification_sent: !!env.NTFY_TOPIC,
          rate_limit_applied: !!env.CONTACT_FORM_KV
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('=== CONTACT FORM SUBMISSION FAILED ===');
    console.error('Unexpected error:', error);

    if (error instanceof Error) {
      console.error('- Error name:', error.name);
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
    } else {
      console.error('- Error type:', typeof error);
      console.error('- Error value:', JSON.stringify(error));
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestOptions() {
  console.log('CORS preflight request received');
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
