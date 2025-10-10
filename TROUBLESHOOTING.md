# Contact Form Troubleshooting Guide

## How to View Logs

### Real-Time Logs (Cloudflare Dashboard)
1. Go to **Cloudflare Dashboard** > **Workers & Pages**
2. Click on **called-and-sent** project
3. Click **Functions** tab
4. Click **Real-time Logs**
5. Submit the form and watch logs appear in real-time

### Browser Console Logs
1. Open your browser's Developer Tools (F12)
2. Go to **Console** tab
3. Submit the form
4. Look for log messages starting with "Submitting contact form..."

## What the Logs Tell You

### Success Case
You should see:
```
=== CONTACT FORM SUBMISSION START ===
Bindings Check:
- DB available: true
- CONTACT_FORM_KV available: true
- NTFY_TOPIC available: true
- NTFY_TOPIC value: "your-topic-name"
Request data parsed successfully
...
=== CONTACT FORM SUBMISSION SUCCESS ===
```

### Common Issues

#### Issue 1: DB Not Available
**Logs show:**
```
- DB available: false
- D1 database not available - submission NOT stored
```

**Fix:**
1. Go to Cloudflare Dashboard > Workers & Pages > called-and-sent
2. Go to Settings > Functions
3. Scroll to "D1 database bindings"
4. Click "Add binding"
5. Variable name: `DB`
6. Select database: `contact-submissions`
7. Click Save
8. Redeploy the site (push a commit or use Cloudflare dashboard)

#### Issue 2: KV Not Available
**Logs show:**
```
- CONTACT_FORM_KV available: false
- KV namespace not available - rate limiting DISABLED
```

**Fix:**
1. Go to Cloudflare Dashboard > Workers & Pages > called-and-sent
2. Go to Settings > Functions
3. Scroll to "KV namespace bindings"
4. Click "Add binding"
5. Variable name: `CONTACT_FORM_KV`
6. Select your KV namespace (or create a new one)
7. Click Save
8. Redeploy the site

#### Issue 3: NTFY_TOPIC Not Set
**Logs show:**
```
- NTFY_TOPIC available: false
- NTFY_TOPIC not set - notification NOT sent
```

**Fix:**
1. Go to Cloudflare Dashboard > Workers & Pages > called-and-sent
2. Go to Settings > Functions
3. Scroll to "Environment variables"
4. Click "Add variable"
5. Variable name: `NTFY_TOPIC`
6. Value: Your ntfy topic (e.g., `called-and-sent-contact`)
7. Select "Production" environment
8. Click Save
9. Redeploy the site

#### Issue 4: 404 Not Found
**Browser console shows:**
```
POST https://calledandsent.me/api/contact 404 (Not Found)
```

**Possible causes:**
- Pages Function not deployed yet
- Wrong URL in frontend code
- Cloudflare Pages build failed

**Fix:**
1. Check latest deployment: Cloudflare Dashboard > Workers & Pages > called-and-sent > Deployments
2. Look for green checkmark on latest deployment
3. If failed, click on deployment to see build logs
4. If successful but still 404, verify the file exists at `/functions/api/contact.ts`

#### Issue 5: 500 Internal Server Error
**Browser console shows:**
```
POST https://calledandsent.me/api/contact 500 (Internal Server Error)
```

**Fix:**
1. Check real-time logs in Cloudflare Dashboard
2. Look for error messages in the logs
3. Common causes:
   - D1 table doesn't exist (run schema.sql)
   - Invalid SQL query
   - Missing bindings

**Create D1 table:**
```bash
wrangler d1 execute contact-submissions --file=schema.sql
```

#### Issue 6: Rate Limit Exceeded
**Error message:**
```
Rate limit exceeded. Please try again later.
```

**This is expected behavior!** You can only submit 10 times per hour from the same IP.

**To reset for testing:**
```bash
# Find your KV namespace ID
wrangler kv:namespace list

# Delete the rate limit key (replace YOUR_IP)
wrangler kv:key delete --namespace-id=YOUR_NAMESPACE_ID "rate_limit:YOUR_IP"
```

Or wait 1 hour for automatic reset.

## Verifying Everything Works

### 1. Check D1 Database
```bash
# View all submissions
wrangler d1 execute contact-submissions --command "SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;"

# Count submissions
wrangler d1 execute contact-submissions --command "SELECT COUNT(*) FROM submissions;"
```

### 2. Check ntfy Notification
- Install ntfy app on your phone (iOS/Android)
- Subscribe to your topic
- Submit the form
- You should receive a notification within seconds

### 3. Check Rate Limiting
- Submit the form 10 times in a row
- 11th submission should show "Rate limit exceeded"
- This confirms KV is working

## Debug Mode in Browser

After submitting the form, look at the success/error message. It will show:
- ✓ Database: Stored / ✗ Not stored
- ✓ Notification: Sent / ✗ Not sent
- ✓ Rate limit: Active / ✗ Disabled

This tells you which bindings are working.

## Still Having Issues?

1. Check Cloudflare Dashboard > Workers & Pages > called-and-sent > Functions > Real-time Logs
2. Check browser console for frontend errors
3. Verify all three bindings are configured in "Production" environment
4. Try redeploying: `git commit --allow-empty -m "Trigger redeploy" && git push`
5. Check if D1 table exists: `wrangler d1 execute contact-submissions --command "SELECT * FROM submissions LIMIT 1;"`

## Testing Without Submitting Form

You can test the API directly with curl:

```bash
curl -X POST https://calledandsent.me/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Testing"}'
```

Should return:
```json
{
  "success": true,
  "message": "Message sent successfully!",
  "debug": {
    "db_stored": true,
    "notification_sent": true,
    "rate_limit_applied": true
  }
}
```
