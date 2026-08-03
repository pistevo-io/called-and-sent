import { motion } from 'framer-motion';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <a href="/" className="text-mission-400 hover:text-mission-300 text-sm mb-8 inline-block">
            ← Back to Called &amp; Sent
          </a>

          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-12">Last updated: August 3, 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-400">
                By creating an account on Called &amp; Sent, you agree to these Terms of Service.
                If you do not agree, do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
              <p className="text-gray-400">
                Called &amp; Sent provides a platform for Christian missionaries to create profile pages
                showcasing their calling, mission trips, faith journey, and support needs. The platform
                is offered on a freemium basis with optional paid features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Account Registration</h2>
              <p className="text-gray-400">
                You must provide accurate information when creating an account. You are responsible
                for maintaining the confidentiality of your login credentials and for all activity
                under your account. Usernames are assigned on a first-come, first-served basis.
                We reserve the right to reclaim usernames that are inactive, impersonating others,
                or violating these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. User Content</h2>
              <p className="text-gray-400 mb-3">
                You retain ownership of all content you publish on Called &amp; Sent (profile information,
                trip stories, photos, wall posts, etc.). By publishing content, you grant us a
                non-exclusive, royalty-free license to display it on the platform as directed by you.
              </p>
              <p className="text-gray-400">
                You are solely responsible for the content you publish. You represent that you have
                the right to share any content you upload, including photos of other people.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Acceptable Use</h2>
              <p className="text-gray-400 mb-3">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>Post content that is illegal, harassing, defamatory, or fraudulent</li>
                <li>Impersonate another person or missionary</li>
                <li>Use the platform for spam, phishing, or unsolicited commercial messages</li>
                <li>Attempt to access other users' accounts or data</li>
                <li>Use the platform in violation of any applicable laws</li>
                <li>Post content that promotes hate speech or violence</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Faith-Based Nature of the Platform</h2>
              <p className="text-gray-400">
                Called &amp; Sent is a platform for Christian missionaries. While we welcome users
                from all Christian traditions, the platform exists to support those who proclaim
                the Gospel of Jesus Christ. We reserve the right to remove content or accounts
                that are fundamentally at odds with this mission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Payments &amp; Subscriptions</h2>
              <p className="text-gray-400">
                Premium features are offered on a subscription basis. Payments are processed through
                Stripe. Subscriptions auto-renew unless canceled. Refund requests are handled on a
                case-by-case basis. The voluntary Supporter tier is non-refundable as it is a donation
                to support the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Termination</h2>
              <p className="text-gray-400">
                You may delete your account at any time. We may suspend or terminate accounts that
                violate these terms. Upon termination, your profile and content will be removed
                from the platform. We may retain certain data as required by law or for legitimate
                business purposes (see Privacy Policy).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Disclaimer of Warranties</h2>
              <p className="text-gray-400">
                The platform is provided "as is" without warranties of any kind, express or implied.
                We do not guarantee uninterrupted access or error-free operation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-400">
                To the fullest extent permitted by law, Called &amp; Sent shall not be liable for
                any indirect, incidental, or consequential damages arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Changes to Terms</h2>
              <p className="text-gray-400">
                We may update these terms. Material changes will be communicated via email or
                a notice on the platform. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">12. Contact</h2>
              <p className="text-gray-400">
                For questions about these terms, use the contact form or reach out through the platform.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
