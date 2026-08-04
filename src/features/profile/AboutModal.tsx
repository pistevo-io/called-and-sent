import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Globe, MapPin, Instagram } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="relative h-48 sm:h-64 bg-gradient-to-r from-mission-900 via-mission-800 to-mission-900 overflow-hidden">
              <img
                src="/profile.jpeg"
                alt="Profile"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: '50% 15%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-mission-900/80 via-mission-800/70 to-mission-900/80" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-3xl sm:text-5xl font-bold mb-3">About Me</h2>
                  <p className="text-base sm:text-xl text-mission-200">My Journey in Faith & Service</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white bg-opacity-30 hover:bg-opacity-50 backdrop-blur-sm p-2 rounded-full transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-4 sm:p-8 overflow-y-auto max-h-[calc(90vh-12rem)] sm:max-h-[calc(90vh-16rem)]">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6 text-mission-600" fill="currentColor" />
                My Calling
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                My calling to missions was planted early. Growing up, my parents showed me what generous love looks like. Every Sunday after church, my mom would prepare meal packages for about 10 homeless people in our area of rural India, and my dad and I would deliver them by motorcycle. As a child, I traveled miles on that bike to carry water pots for our own family, learning dependence on God's provision. Today, I witness His faithfulness - serving on water trucks in Honduras, once a receiver, now a giver.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                During college, I started a non-profit feeding children, and it satisfied my soul deeply. But I didn't yet understand that I could share the Gospel alongside meeting physical needs. That changed when I heard the true Gospel of grace at Edmond First Baptist Church in Oklahoma - salvation is a gift through faith in Jesus alone, not by works (Ephesians 2:8-9). This revelation transformed everything.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Late in 2024, I asked my mom at dinner, "Why would God let you into Heaven?" Her answer revealed she was trusting in works, not grace. I had to lovingly correct her, pointing to Scripture. I had a similar conversation with my dad in early 2025, and with my best friend. That's when it became clear: <strong>I cannot assume everyone knows the true Gospel, even those who grew up in church.</strong>
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                When I heard my pastor share about missionaries serving around the world, I felt convicted and dedicated my life to missions. But obedience took time - I didn't go on my first trip until July 2025. Now I am called to give generously to the needy and share the Gospel boldly, trusting that the Holy Spirit will give me the words when I need them (Luke 12:11-12). It brings me joy to serve people and share the Good News.
              </p>
              <p className="text-gray-700 leading-relaxed">
                I'm rooted in the Great Commission (Matthew 28:19-20), trusting God's provision (Matthew 6:26-30, Philippians 4:19), and proclaiming that salvation is by grace through faith alone (Ephesians 2:8-9). How beautiful are the feet of those who bring good news (Romans 10:14-15)! In everything I do, I do it all for the glory of God (1 Corinthians 10:31).
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-mission-600" />
                My Mission Work
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                I'm most passionate about combining <strong>humanitarian work with Gospel proclamation</strong> - meeting physical needs (food, water, clothing, medical care) while sharing the Good News of Jesus. I serve in whatever capacity is needed on any given day, whether that's medical support, logistics, or distribution. But I always keep my heart and ears open to share the Gospel, because if God puts me in a situation, He has prepared someone there to hear - whether my testimony or the message of salvation.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                I believe in <strong>partnering with local believers</strong> rather than going solo. God has shown me that I don't have to be present for the work to continue - He provides the workers, He prepares the hearts, and He brings the harvest. My role is obedience and faithfulness.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Medical Missions + Evangelism</h4>
                  <p className="text-gray-600 text-sm">Medical care for underserved communities paired with village-to-village Gospel sharing (Honduras with BMDMI).</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Youth Ministry + Gospel</h4>
                  <p className="text-gray-600 text-sm">Sports camps, mentorship, and teaching the "I Am" statements of Jesus (Paraguay basketball camp).</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Unreached Peoples Evangelism</h4>
                  <p className="text-gray-600 text-sm">Partnering with local missionaries to share Jesus' name with those who have never heard (Southeast Asia).</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Humanitarian Aid + Witness</h4>
                  <p className="text-gray-600 text-sm">Water distribution, food packages, and meeting practical needs while looking for divine appointments.</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">My Faith Journey</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                My faith journey spans generations and continents, marked by moments of courage, revelation, and obedience:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                  <div>
                    <span className="font-semibold">My Uncle's Bold Obedience (Foundation):</span> My dad and his side of the family were non-believers who worshiped idols. My uncle heard the Gospel, believed, and then did something extraordinary - he replaced all the idols in my dad's home with Bibles. He risked being disowned or beaten to share the Good News with our entire family. That's how my dad came to faith, and that's how God's living Word entered our lives. When my uncle passed in early 2023, I fully understood the weight of his sacrifice. His courage reminds me that sharing the Gospel is worth any cost, and there are believers around the world who risk everything to proclaim Jesus.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                  <div>
                    <span className="font-semibold">Grace Revelation (Edmond First Baptist, Oklahoma):</span> During my college years in the US, I attended Edmond First Baptist Church in Oklahoma where I truly understood the Gospel of grace for the first time. Salvation is a gift received through faith in Jesus alone - not earned by works (Ephesians 2:8-9). This changed everything for me.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                  <div>
                    <span className="font-semibold">Full-Circle Gospel Conversations (2024-2025):</span> Late in 2024, I asked my mom a simple question at dinner: "Why would God let you into Heaven?" Her answer revealed she was trusting in her works. I lovingly corrected her with Scripture. I had similar conversations with my dad (early 2025) and my best friend (2025). God used me to share the Gospel with the very people who brought me to church - full circle. This ignited my passion for missions, realizing I can't assume anyone truly knows the Gospel.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                  <div>
                    <span className="font-semibold">First Mission Trip (July 2025 - Paraguay):</span> After hearing my pastor share about missionaries serving globally, I felt convicted and dedicated my life to missions. But obedience took time. I finally went on my first trip to Paraguay in July 2025, and it confirmed everything. God orchestrates divine appointments - not accidents, but intentional encounters where He is already at work. Now I'm committed to go wherever He sends me.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                  <div>
                    <span className="font-semibold">Answered Prayer - Honduras (September 2025):</span> Before my Honduras trip, I prayed specifically to witness at least one salvation. God answered powerfully when a woman came to faith in Christ, tears streaming down her face as she heard the Gospel. Witnessing that moment of transformation reminded me that this work is all for God's glory, not my own. He saves. I'm just obedient.
                  </div>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-6 font-semibold">
                My values: Trust God's provision. Partner with local believers. Expect divine appointments. Meet physical needs AND share the Gospel. Be boldly obedient despite consequences.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Connect With Me</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-mission-600 mt-0.5" />
                  <div>
                    Oklahoma, USA
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Instagram className="w-5 h-5 text-mission-600 mt-0.5" />
                  <div>
                    <a
                      href="https://instagram.com/calledandsent.me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mission-600 hover:text-mission-700 font-semibold hover:underline transition-colors"
                    >
                      @calledandsent.me
                    </a>
                    <p className="text-sm text-gray-600">Follow for mission updates and stories</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Want to connect about missions, partner in prayer, or learn more? Use the "Partner With Me" button to send a message through the contact form.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
