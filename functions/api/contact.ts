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

  try {
    const { request, env } = context;

    let data: ContactFormData;
    try {
      data = await request.json();
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

    const { name, email, message, 'cf-turnstile-response': turnstileToken } = data;

    // Verify Turnstile token
    if (env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return new Response(
          JSON.stringify({ error: 'Security verification required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      try {
        const turnstileResponse = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              secret: env.TURNSTILE_SECRET_KEY,
              response: turnstileToken,
            }),
          }
        );

        const turnstileResult = await turnstileResponse.json();

        if (!turnstileResult.success) {
          console.error('Turnstile verification failed:', turnstileResult);
          return new Response(
            JSON.stringify({ error: 'Security verification failed. Please try again.' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (turnstileError) {
        console.error('Turnstile verification error:', turnstileError);
        // Continue execution - don't fail if Turnstile service is down
      }
    }

    // Validate required fields
    if (!name || !email || !message) {
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

    // Rate limiting with KV
    if (env.CONTACT_FORM_KV) {
      const rateLimitKey = `rate_limit:${clientIP}`;
      const submissionCount = await env.CONTACT_FORM_KV.get(rateLimitKey);

      if (submissionCount && parseInt(submissionCount) >= 10) {
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
    }

    // Store in D1 database
    if (env.DB) {
      try {
        await env.DB.prepare(
          'INSERT INTO submissions (name, email, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(name, email, message, clientIP, userAgent)
          .run();
      } catch (dbError) {
        console.error('D1 database error:', dbError);
        // Continue execution - don't fail the whole request if DB fails
      }
    }

    // Send ntfy notification
    if (env.NTFY_TOPIC) {
      try {
        await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
          method: 'POST',
          headers: {
            'Title': 'New Contact Form Submission',
            'Priority': 'high',
            'Tags': 'email,envelope_with_arrow',
          },
          body: 'New contact form submission received on Called & Sent',
        });
      } catch (notifyError) {
        console.error('ntfy notification failed:', notifyError);
        // Continue execution - don't fail if notification fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully!' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Contact form error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    },
  });
}
