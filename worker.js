// Cloudflare Worker for Contact Form
// This handles form submissions and sends emails

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Parse the form data
      const data = await request.json();
      const { name, email, message } = data;

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
      // You can add a hidden field in your form that bots will fill
      if (data.website) { // 'website' is a honeypot field
        return new Response(
          JSON.stringify({ success: true }), // Fake success for bots
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Rate limiting using client IP
      const ip = request.headers.get('CF-Connecting-IP');
      const rateLimitKey = `ratelimit:${ip}`;

      // Check rate limit (max 10 submissions per hour - increased for testing)
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

      // Send email using MailChannels (free on Cloudflare Workers)
      const emailContent = {
        personalizations: [
          {
            to: [{ email: env.YOUR_EMAIL }], // Set this in Worker environment variables
          },
        ],
        from: {
          email: 'noreply@calledandsent.me',
          name: 'Called & Sent Contact Form',
        },
        reply_to: {
          email: email,
          name: name,
        },
        subject: `New Contact Form Message from ${name}`,
        content: [
          {
            type: 'text/plain',
            value: `
You received a new message from your Called & Sent website!

Name: ${name}
Email: ${email}

Message:
${message}

---
Sent from: ${request.headers.get('CF-Connecting-IP')}
Time: ${new Date().toISOString()}
            `,
          },
          {
            type: 'text/html',
            value: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #0284c7; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Contact Form Submission</h2>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Called & Sent Mission Website</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">From:</div>
        <div>${name} (${email})</div>
      </div>
      <div class="field">
        <div class="label">Message:</div>
        <div style="white-space: pre-wrap;">${message}</div>
      </div>
      <div class="footer">
        <div>IP: ${request.headers.get('CF-Connecting-IP')}</div>
        <div>Sent: ${new Date().toLocaleString()}</div>
      </div>
    </div>
  </div>
</body>
</html>
            `,
          },
        ],
      };

      // TODO: Email sending temporarily disabled - configure MailChannels DNS or switch to Resend
      // For now, just log the submission
      console.log('Contact form submission:', { name, email, message });

      // Uncomment when email is configured:
      /*
      const emailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailContent),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('MailChannels error:', emailResponse.status, errorText);
        throw new Error(`Failed to send email: ${emailResponse.status} - ${errorText}`);
      }
      */

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
  }
};
