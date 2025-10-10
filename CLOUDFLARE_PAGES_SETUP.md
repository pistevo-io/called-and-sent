# Cloudflare Pages Setup Guide

## Contact Form Configuration

The contact form requires three bindings to be configured in the Cloudflare Pages dashboard.

### Required Bindings

#### 1. D1 Database Binding
- **Type**: D1 Database
- **Variable name**: `DB`
- **D1 database**: `contact-submissions`
- **Purpose**: Stores all contact form submissions

#### 2. KV Namespace Binding
- **Type**: KV Namespace
- **Variable name**: `CONTACT_FORM_KV`
- **KV namespace**: Your existing KV namespace for rate limiting
- **Purpose**: Rate limiting (10 submissions per hour per IP)

#### 3. Environment Variable
- **Variable name**: `NTFY_TOPIC`
- **Value**: Your ntfy.sh topic name (e.g., `called-and-sent-contact`)
- **Purpose**: Sends push notifications when someone submits the form

### How to Configure in Cloudflare Dashboard

1. Go to **Cloudflare Dashboard** > **Workers & Pages**
2. Click on your **called-and-sent** Pages project
3. Go to **Settings** > **Functions**
4. Scroll to **Bindings** section

#### Add D1 Binding
1. Click **Add binding** under "D1 database bindings"
2. Variable name: `DB`
3. Select your `contact-submissions` database
4. Click **Save**

#### Add KV Binding
1. Click **Add binding** under "KV namespace bindings"
2. Variable name: `CONTACT_FORM_KV`
3. Select your existing KV namespace
4. Click **Save**

#### Add Environment Variable
1. Click **Add variable** under "Environment variables"
2. Variable name: `NTFY_TOPIC`
3. Value: Your ntfy.sh topic (e.g., `called-and-sent-contact`)
4. Select **Production** environment
5. Click **Save**

### Testing the Setup

After deploying:

1. Visit your site: `https://calledandsent.me`
2. Click the "Partner With Me" button
3. Fill out the contact form
4. Submit
5. Check:
   - Form should show success message
   - You should receive ntfy notification on your phone
   - Data should be in D1 database

### Viewing Submissions

Query the D1 database to see submissions:

```bash
# List all submissions
wrangler d1 execute contact-submissions --command "SELECT * FROM submissions ORDER BY created_at DESC LIMIT 10;"

# Count total submissions
wrangler d1 execute contact-submissions --command "SELECT COUNT(*) as total FROM submissions;"

# View recent submissions with formatting
wrangler d1 execute contact-submissions --command "SELECT name, email, created_at FROM submissions ORDER BY created_at DESC LIMIT 5;"
```

### Setting Up ntfy Notifications on Your Phone

1. Install the ntfy app:
   - iOS: https://apps.apple.com/us/app/ntfy/id1625396347
   - Android: https://play.google.com/store/apps/details?id=io.heckel.ntfy

2. Open the app and subscribe to your topic:
   - Click the "+" button
   - Enter your topic name (same as `NTFY_TOPIC` variable)
   - Click Subscribe

3. You'll now receive instant notifications when someone submits the form

### Troubleshooting

**Form shows error on submit:**
- Check that all three bindings are configured correctly
- Make sure bindings are on "Production" environment
- Check browser console for error messages
- View real-time logs: Visit **Workers & Pages** > **called-and-sent** > **Functions** > **Logs**

**No ntfy notification received:**
- Verify `NTFY_TOPIC` environment variable is set
- Check that the topic name in the app matches exactly
- Try sending a test notification: `curl -d "Test" ntfy.sh/your-topic-name`

**Submissions not appearing in D1:**
- Verify D1 binding is configured with variable name `DB`
- Make sure the database has the schema created (see `schema.sql`)
- Query the database to check: `wrangler d1 execute contact-submissions --command "SELECT * FROM submissions;"`

### Rate Limiting

The form has built-in rate limiting:
- 10 submissions per hour per IP address
- Uses Cloudflare KV for tracking
- Resets automatically after 1 hour

### Security Features

- CORS headers configured for API endpoint
- Email validation (must contain @)
- Required fields: name, email, message
- IP address and User-Agent logged for spam prevention
- Rate limiting prevents abuse
