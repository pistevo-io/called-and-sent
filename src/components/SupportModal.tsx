import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, DollarSign, ShoppingBag, Copy, Check, Share2, Facebook, Mail, Instagram, MessageCircle, Users } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
      }) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');

  useEffect(() => {
    if (isOpen && turnstileRef.current && window.turnstile && !widgetIdRef.current) {
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAAB5vVKg7Y7twKuIb',
        callback: (token: string) => {
          setTurnstileToken(token);
        },
      });
    }
  }, [isOpen]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setFormStatus('error');
      setErrorMessage('Please complete the security check');
      setTimeout(() => {
        setFormStatus('idle');
        setErrorMessage('');
      }, 5000);
      return;
    }

    setFormStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          'cf-turnstile-response': turnstileToken,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setFormStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setTurnstileToken('');
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setTimeout(() => {
          setFormStatus('idle');
        }, 5000);
      } else {
        setFormStatus('error');
        setErrorMessage(responseData.error || 'Something went wrong. Please try again.');
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setTurnstileToken('');
        setTimeout(() => {
          setFormStatus('idle');
          setErrorMessage('');
        }, 5000);
      }
    } catch (error) {
      setFormStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      setTurnstileToken('');
      setTimeout(() => {
        setFormStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = 'Support my mission work and help me share the Gospel around the world!';
    const fullMessage = `${text}\n\n${url}`;

    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'x':
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'instagram':
        handleCopy(url, 'instagram');
        alert('Link copied! Open Instagram and paste in your story or bio.');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
        break;
      case 'copy':
        handleCopy(fullMessage, 'sharelink');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent('Support My Mission')}&body=${encodeURIComponent(fullMessage)}`;
        break;
    }
  };

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
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="relative h-64 bg-gradient-to-r from-mission-900 via-mission-800 to-mission-900">
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Heart className="w-16 h-16 mx-auto mb-4 animate-pulse" fill="currentColor" />
                  <h2 className="text-5xl font-bold mb-3">Partner With Me</h2>
                  <p className="text-xl text-mission-200">Join me in sharing the Good News of Jesus</p>
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

          <div className="p-8 overflow-y-auto max-h-[calc(90vh-16rem)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-mission-600 rounded-full mb-4">
                    <Heart className="w-8 h-8 text-white" fill="currentColor" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Prayer is My Greatest Need</h3>
                  <p className="text-lg text-gray-700">
                    Your prayers are the foundation of this ministry. Please pray that the Good News about Jesus is shared clearly and that hearts are opened to receive Him.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-xl">Please Pray For:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                      <div>
                        <span className="font-semibold">Gospel Impact:</span> That people would hear and understand the Good News of Jesus Christ
                      </div>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                      <div>
                        <span className="font-semibold">Open Doors:</span> For divine appointments and meaningful conversations about faith
                      </div>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                      <div>
                        <span className="font-semibold">Spiritual Strength:</span> Wisdom, boldness, and compassion as I serve
                      </div>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                      <div>
                        <span className="font-semibold">Local Partners:</span> For the churches and believers serving alongside me
                      </div>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                      <span className="text-mission-600 font-bold text-xl flex-shrink-0">+</span>
                      <div>
                        <span className="font-semibold">Safety & Health:</span> Protection during travel and ministry
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-3 text-xl flex items-center gap-2">
                  <Users className="w-6 h-6 text-mission-600" />
                  Let's Have a Conversation
                </h4>
                <p className="text-gray-700 mb-4">
                  I'd love to share more about what God is doing through these mission trips and hear how I can pray for you too. Send me a message!
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mission-500 focus:border-mission-500 outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mission-500 focus:border-mission-500 outline-none transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mission-500 focus:border-mission-500 outline-none transition-colors resize-none"
                      placeholder="How can we connect? Are you interested in prayer partnership, financial support, or just want to learn more?"
                    />
                  </div>

                  <div className="flex justify-center">
                    <div ref={turnstileRef}></div>
                  </div>

                  <button
                    type="submit"
                    disabled={formStatus === 'sending' || !turnstileToken}
                    className="w-full bg-mission-600 hover:bg-mission-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {formStatus === 'sending' && (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
                  </button>

                  {formStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold">✓ Message sent successfully!</div>
                      <div className="text-xs mt-1">I'll get back to you soon.</div>
                    </div>
                  )}

                  {formStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold">✗ {errorMessage || 'Something went wrong'}</div>
                      <div className="text-xs mt-1">Please try again.</div>
                    </div>
                  )}
                </form>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  Share:
                </span>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
                  aria-label="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" fill="currentColor" />
                </button>
                <button
                  onClick={() => handleShare('instagram')}
                  className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-2 rounded-full transition-colors"
                  aria-label="Share on Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" fill="currentColor" />
                </button>
                <button
                  onClick={() => handleShare('x')}
                  className="bg-black hover:bg-gray-800 text-white p-2 rounded-full transition-colors"
                  aria-label="Share on X"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
                  aria-label="Share via Email"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="bg-mission-600 hover:bg-mission-700 text-white p-2 rounded-full transition-colors"
                  aria-label="Copy link"
                >
                  {copiedField === 'sharelink' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <DollarSign className="w-12 h-12 text-mission-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Financial Partnership
                </h3>
                <p className="text-gray-700 mb-4 max-w-2xl mx-auto">
                  If God leads you to give financially toward mission trip costs, please use the contact form above and I'll share giving options with you personally.
                </p>
                <p className="text-sm text-gray-600">
                  This allows me to share the best option for your situation and discuss tax-deductible giving through my church or ministry partner.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="border-t border-gray-200 pt-8 mb-8"
            >
              <div className="text-center">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Mission Merchandise
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-2xl mx-auto">
                  <p className="text-gray-700 text-lg mb-2">
                    Coming Soon!
                  </p>
                  <p className="text-gray-600 text-sm">
                    Mission-themed apparel and products will be available soon. All profits will support mission trips and sharing the Gospel.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-8 border-t border-gray-200 pt-6 text-center"
            >
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <p className="text-gray-700 font-semibold mb-2">
                  Thank you for partnering with me in prayer!
                </p>
                <p className="text-gray-600 text-sm">
                  Your prayers are the most valuable support. Through them, God opens doors, changes hearts, and makes it possible to share Christ's transformative love with communities around the world.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
