import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Users, Heart, MapPin, ArrowRight } from 'lucide-react';
import Footer from '../../shared/ui/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Called <span className="text-mission-500">&</span> Sent
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-full border border-gray-600 hover:border-mission-500 transition-all"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-white px-4 py-2 rounded-full bg-mission-600 hover:bg-mission-700 transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl"
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Called <span className="text-mission-500">&</span> Sent
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-4 leading-relaxed">
            A beautiful home on the web for every missionary's calling, work, and story.
          </p>
          <p className="text-lg text-gray-500 mb-10 italic">
            "Therefore go and make disciples of all nations..." — Matthew 28:19-20
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/@k"
              className="inline-flex items-center gap-2 bg-mission-600 hover:bg-mission-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-mission-500/30"
            >
              See a Live Profile
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 border border-gray-600 hover:border-mission-500 text-gray-300 hover:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all"
            >
              What We Offer
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10"
        >
          <p className="text-gray-600 text-sm">Scroll to learn more</p>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">
          Everything a missionary needs, <span className="text-mission-500">in one link</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Globe, title: 'Your Story', desc: 'Share your testimony, calling, and faith journey in a beautiful, customizable profile.' },
            { icon: MapPin, title: 'Trip Portfolio', desc: 'Document every mission trip with photos, maps, stories, and impact stats.' },
            { icon: Heart, title: 'Support Hub', desc: 'Prayer requests, giving links, and a contact form — all in one place.' },
            { icon: Users, title: 'Faith Wall', desc: 'Post updates, testimonies, and prayer requests. Your supporters stay connected.' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-mission-500 hover:shadow-lg hover:shadow-mission-500/10 transition-all"
            >
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-mission-600 to-mission-800 mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Profile Preview */}
      <section className="py-24 px-6 bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">What your profile looks like</h2>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
            See a real missionary profile in action. This is what your supporters will see when you share your link.
          </p>
          <a
            href="/@k"
            className="inline-flex items-center gap-2 bg-mission-600 hover:bg-mission-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105"
          >
            View Example Profile
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-4">
            Share the Gospel. <span className="text-mission-500">Share your story.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Called & Sent gives every missionary a dignified, beautiful home on the web.
            One link. Your entire ministry.
          </p>
          <p className="text-gray-600 text-sm">
            Coming soon. Built for missionaries, by a missionary.
          </p>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
