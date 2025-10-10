// Pages Function for Contact Form
// This handles form submissions, stores in D1, and sends ntfy notification

interface Env {
  DB: D1Database;
  CONTACT_FORM_KV: KVNamespace;
  TURNSTILE_SECRET_KEY: string;
  NTFY_TOPIC: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Parse the form data
    const data = await request.json() as {
      name: string;
      email: string;
      message: string;
      'cf-turnstile-response': string;
      website?: string;
    };

    const { name, email, message, 'cf-turnstile-response': turnstileToken } = data;

    // Basic validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      return new Response(
        JSON.stringify({ error: 'Captcha verification required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const turnstileVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const turnstileResponse = await fetch(turnstileVerifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get('CF-Connecting-IP'),
      }),
    });

    const turnstileResult = await turnstileResponse.json() as { success: boolean };
    if (!turnstileResult.success) {
      console.error('Turnstile verification failed:', turnstileResult);
      return new Response(
        JSON.stringify({ error: 'Captcha verification failed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Basic spam detection (honeypot)
    if (data.website) {
      return new Response(
        JSON.stringify({ success: true }), // Fake success for bots
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Rate limiting using client IP
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `ratelimit:${ip}`;

    // Check rate limit (max 10 submissions per hour)
    const rateLimit = await env.CONTACT_FORM_KV.get(rateLimitKey);
    if (rateLimit && parseInt(rateLimit) >= 10) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Increment rate limit counter
    const currentCount = rateLimit ? parseInt(rateLimit) + 1 : 1;
    await env.CONTACT_FORM_KV.put(rateLimitKey, currentCount.toString(), {
      expirationTtl: 3600 // 1 hour
    });

    // Store in D1 database
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    await env.DB.prepare(
      'INSERT INTO submissions (name, email, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, email, message, ip, userAgent).run();

    console.log('Contact form submission stored:', { name, email });

    // Send minimal notification to ntfy.sh (no personal data)
    if (env.NTFY_TOPIC) {
      try {
        await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
          method: 'POST',
          body: 'New contact form submission received',
          headers: {
            'Title': 'Called & Sent Contact',
            'Priority': 'high',
            'Tags': 'email'
          }
        });
      } catch (error) {
        console.error('ntfy notification failed:', error);
        // Don't fail the request if notification fails
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing form:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
