import { useState } from 'react';
import { motion } from 'framer-motion';

const FONTS = [
  { name: 'Inter', family: "'Inter', sans-serif", style: 'Clean, neutral, highly readable. Current font.' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", style: 'Geometric, friendly, warm. Modern startup feel.' },
  { name: 'DM Sans', family: "'DM Sans', sans-serif", style: 'Low-contrast geometric sans. Great at small sizes.' },
  { name: 'Satoshi', family: "'Satoshi', sans-serif", style: 'Sharp, modern, distinctive. Bold personality.' },
  { name: 'Cabinet Grotesk', family: "'Cabinet Grotesk', sans-serif", style: 'Bold grotesque. Strong headlines, lots of character.' },
  { name: 'General Sans', family: "'General Sans', sans-serif", style: 'Versatile, balanced, elegant. Works everywhere.' },
  { name: 'Switzer', family: "'Switzer', sans-serif", style: 'Neo-grotesque. Professional but warm.' },
  { name: 'Geist', family: "'Geist', sans-serif", style: 'Vercel\'s font. Technical, precise, modern.' },
];

const SAMPLE_HEADLINE = 'Called & Sent';
const SAMPLE_BODY = 'A beautiful home on the web for every missionary\'s calling, work, and story. Share the Gospel. Share your story. One link — your entire ministry.';
const SAMPLE_TAGLINE = '"Therefore go and make disciples of all nations..." — Matthew 28:19-20';

export default function FontPreview() {
  const [selected, setSelected] = useState('Inter');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <a href="/" className="text-mission-400 hover:text-mission-300 text-sm mb-8 inline-block">
          ← Back
        </a>

        <h1 className="text-4xl font-bold mb-2">Font Selection</h1>
        <p className="text-gray-400 mb-12">Choose the primary font for Called &amp; Sent</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {FONTS.map((font) => (
            <button
              key={font.name}
              onClick={() => setSelected(font.name)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected === font.name
                  ? 'border-mission-500 bg-mission-600/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="text-sm font-semibold">{font.name}</div>
              <div className="text-xs text-gray-500 mt-1">{font.style.split('.')[0]}</div>
            </button>
          ))}
        </div>

        {FONTS.filter(f => f.name === selected).map((font) => (
          <motion.div
            key={font.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Headline */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Headline (Bold 700)</p>
              <h2 className="text-5xl font-bold" style={{ fontFamily: font.family }}>
                {SAMPLE_HEADLINE}
              </h2>
            </div>

            {/* Body */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Body (Regular 400)</p>
              <p className="text-lg leading-relaxed text-gray-300" style={{ fontFamily: font.family }}>
                {SAMPLE_BODY}
              </p>
            </div>

            {/* Tagline / Quote */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Italic / Quote</p>
              <p className="text-lg italic text-gray-400" style={{ fontFamily: font.family }}>
                {SAMPLE_TAGLINE}
              </p>
            </div>

            {/* UI Elements — Small text */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">UI / Small Text</p>
              <div className="flex gap-3" style={{ fontFamily: font.family }}>
                <span className="px-3 py-1 bg-mission-600/30 border border-mission-500 text-mission-300 rounded-full text-xs font-medium">
                  Evangelism
                </span>
                <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-medium">
                  Medical
                </span>
                <span className="text-sm text-gray-500">September 2025 · 1 week · 100 reached</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <p className="text-sm font-semibold mb-1" style={{ fontFamily: font.family }}>About {font.name}</p>
              <p className="text-sm text-gray-400" style={{ fontFamily: font.family }}>{font.style}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
