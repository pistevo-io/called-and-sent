# Cloudflare Worker Setup Guide
Contact Form with DDoS Protection & Bot Filtering

> **DEPRECATED** — this guide describes the original standalone Worker
> (`worker.js`) approach. The current contact form is a **Pages Function** at
> `functions/api/contact.ts` (`POST /api/contact`) with Turnstile verification
> and email delivery via MailChannels/Resend. See `FUNCTIONS_ENV.md` and
> `CLOUDFLARE_PAGES_SETUP.md` for the current setup. The steps below are kept
> for historical reference only.

## Prerequisites
- Cloudflare account (free tier works)
- Domain connected to Cloudflare (or use workers.dev subdomain)
- Node.js installed

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate.

## Step 3: Create KV Namespace (for rate limiting)

```bash
wrangler kv:namespace create "CONTACT_FORM_KV"
```

You'll get output like:
```
Created KV namespace with id "abc123..."
```

**Copy that ID** and update `wrangler.toml` line 13:
```toml
id = "abc123..." # Replace with your actual ID
```

## Step 4: Set Your Email Address

In the Cloudflare dashboard:

1. Go to **Workers & Pages** > **Overview**
2. After deploying (next step), click your worker
3. Go to **Settings** > **Variables**
4. Add environment variable:
   - **Variable name**: `YOUR_EMAIL`
   - **Value**: `your-actual-email@example.com`
   - Click **Encrypt** (recommended)
   - Click **Save**

## Step 5: Deploy the Worker

```bash
cd called-and-sent
wrangler deploy
```

You'll get a URL like: `https://called-and-sent-contact-form.YOUR_SUBDOMAIN.workers.dev`

## Step 6: Update Your React App

Open `src/components/SupportModal.tsx` and update line 37:

```typescript
const response = await fetch('https://called-and-sent-contact-form.YOUR_SUBDOMAIN.workers.dev', {
```

Replace with your actual Worker URL.

## Step 7: Set Up Custom Route (Optional but Recommended)

If you have a custom domain on Cloudflare:

1. Go to **Workers & Pages** > Click your worker
2. Go to **Triggers** > **Routes** > **Add Route**
3. Add route: `yourdomain.com/api/contact`
4. Select your worker
5. Click **Save**

Now update `SupportModal.tsx` line 37 to use:
```typescript
const response = await fetch('/api/contact', {
```

This keeps the form submission on your domain (cleaner).

## Step 8: Test Your Form

1. Build and run your React app:
   ```bash
   npm run build
   npm run preview
   ```

2. Click the "Partner With Me" button
3. Fill out and submit the contact form
4. Check your email!

## Security Features Included

### Bot Protection
- **Honeypot field**: Add this to your form (bots will fill it):
  ```tsx
  <input type="text" name="website" style={{ display: 'none' }} />
  ```

- **Rate limiting**: Max 5 submissions per IP per hour
- **Email validation**: Rejects invalid email formats
- **CORS protection**: Only allows requests from your domain

### DDoS Protection
- Cloudflare's edge network handles DDoS automatically
- Rate limiting prevents spam floods
- KV storage for efficient request tracking

## Monitoring & Logs

View your Worker logs:
```bash
wrangler tail
```

Or in the dashboard: **Workers & Pages** > Your worker > **Logs**

## Troubleshooting

### "KV namespace not found"
Make sure you:
1. Created the KV namespace
2. Updated `wrangler.toml` with the correct ID
3. Redeployed the worker

### "Email not sending"
Check:
1. Environment variable `YOUR_EMAIL` is set in dashboard
2. Worker logs for errors (`wrangler tail`)
3. MailChannels is working (it's free but sometimes has delays)

### "CORS error in browser"
Make sure:
1. The Worker URL in SupportModal.tsx is correct
2. You're not blocking cross-origin requests in browser
3. The Worker is deployed and accessible

### Form submission fails
1. Open browser DevTools > Network tab
2. Submit the form and check the request
3. Look at the response for error details
4. Check Worker logs with `wrangler tail`

## Alternative Email Service

If MailChannels doesn't work, you can use:

**Resend** (5,000 emails/month free):
1. Sign up at resend.com
2. Get API key
3. Replace MailChannels code in `worker.js` with Resend API
4. Add `RESEND_API_KEY` environment variable

## Cost

**Everything is FREE:**
- Cloudflare Workers: 100,000 requests/day
- KV Storage: 100,000 reads/day, 1,000 writes/day
- MailChannels: Unlimited emails via Cloudflare
- DDoS Protection: Included

You won't pay anything unless you exceed these limits (which is very unlikely for a personal mission site).

## Privacy Notes

- Your email address is **never exposed** to the public
- It's stored securely in Cloudflare environment variables
- Form submissions are rate-limited to prevent spam
- Visitor IPs are logged for security but not shared

## Next Steps

1. Deploy your React app to Cloudflare Pages
2. Test the contact form thoroughly
3. Monitor submissions in your email
4. Adjust rate limits if needed (in `worker.js` line 66)

## Support

If you run into issues:
- Check Cloudflare Worker docs: https://developers.cloudflare.com/workers/
- Wrangler CLI docs: https://developers.cloudflare.com/workers/wrangler/
- Create an issue in your repo

---

**Your privacy is protected, and your site is DDoS-proof!**
