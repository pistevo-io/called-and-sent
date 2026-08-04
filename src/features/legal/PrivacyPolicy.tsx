import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-muted-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <a href="/" className="text-mission-400 hover:text-mission-300 text-sm mb-8 inline-block">
            ← Back to Called &amp; Sent
          </a>

          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-12">Last updated: August 3, 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
              <p className="mb-3">When you create an account on Called &amp; Sent, we collect:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Your name, email address, and username</li>
                <li>Profile information you choose to share (photo, bio, testimony, location)</li>
                <li>Mission trip details, photos, and stories you publish</li>
                <li>Wall posts, prayer requests, and other content you create</li>
              </ul>
              <p className="mt-3">When someone contacts you through your profile's contact form, we collect their name, email, and message to deliver to you.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>To provide and maintain your missionary profile page</li>
                <li>To deliver contact form messages to you</li>
                <li>To send newsletter updates to your subscribers (if you use this feature)</li>
                <li>To improve the platform and fix issues</li>
                <li>To communicate with you about your account</li>
              </ul>
              <p className="mt-3">We do not sell your data. We do not use your content to train AI models.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Public Profiles</h2>
              <p className="text-muted-foreground">
                Your profile page at <code className="text-mission-400 bg-card px-1 rounded">calledandsent.me/@username</code> is publicly visible.
                This includes your name, photo, bio, testimony, trip stories, wall posts, and any other content you publish.
                You control what appears on your profile.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Contact Form Data</h2>
              <p className="text-muted-foreground">
                When someone submits your contact form, we store their name, email, and message temporarily
                to deliver it to you. We also use Cloudflare Turnstile to prevent spam.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Data Storage &amp; Security</h2>
              <p className="text-muted-foreground">
                Your data is stored on Neon (serverless PostgreSQL) and Cloudflare infrastructure.
                We use industry-standard encryption in transit (HTTPS) and at rest. While we take
                reasonable precautions, no online service can guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Cookies</h2>
              <p className="text-muted-foreground">
                We use essential cookies for authentication (keeping you signed in) and security
                (Cloudflare Turnstile for form spam protection). We do not use tracking cookies
                or third-party analytics cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Your Rights</h2>
              <p className="text-muted-foreground mb-3">You can:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Edit or delete your profile content at any time</li>
                <li>Request a copy of your data</li>
                <li>Request deletion of your account and all associated data</li>
              </ul>
              <p className="mt-3">To exercise these rights, contact us through the platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">8. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Called &amp; Sent is not directed at children under 13. We do not knowingly collect
                information from children under 13. If you believe a child has provided us with
                personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">9. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this policy. Significant changes will be communicated via email
                or a notice on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">10. Contact</h2>
              <p className="text-muted-foreground">
                For privacy questions, use the contact form or reach out through the platform.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
