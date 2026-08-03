import { useState } from 'react';
import { motion } from 'framer-motion';

const FONTS = [
  { name: 'Inter', family: "'Inter', sans-serif", style: 'Clean, neutral, highly readable. Current font.', category: 'Google Fonts' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", style: 'Geometric, friendly, warm. Modern startup feel.', category: 'Google Fonts' },
  { name: 'DM Sans', family: "'DM Sans', sans-serif", style: 'Low-contrast geometric sans. Excellent readability.', category: 'Google Fonts' },
  { name: 'Geist', family: "'Geist', sans-serif", style: 'Technical, precise, modern. Vercel\'s font.', category: 'Google Fonts' },
  { name: 'Satoshi', family: "'Satoshi', sans-serif", style: 'Sharp, modern, distinctive. Bold personality.', category: 'Fontshare' },
  { name: 'Cabinet Grotesk', family: "'Cabinet Grotesk', sans-serif", style: 'Bold grotesque. Strong headlines.', category: 'Fontshare' },
  { name: 'General Sans', family: "'General Sans', sans-serif", style: 'Versatile, balanced, elegant. Works everywhere.', category: 'Fontshare' },
  { name: 'Switzer', family: "'Switzer', sans-serif", style: 'Neo-grotesque. Professional but warm.', category: 'Fontshare' },
];

const LOGOS = [
  { id: 'n1', file: 'n1-globe', name: 'N1 — Globe', desc: 'Wireframe globe — global mission, nations.' },
  { id: 'n2', file: 'n2-dove', name: 'N2 — Dove / Flame', desc: 'Holy Spirit dove, flame shape. Pentecost.' },
  { id: 'n3', file: 'n3-hands', name: 'N3 — Open Hands', desc: 'Cupped hands — receiving, giving, serving.' },
  { id: 'n4', file: 'n4-arrow', name: 'N4 — Sent Arrow', desc: 'Upward/downward arrows in circle. Being sent.' },
  { id: 'n5', file: 'n5-pin', name: 'N5 — Map Pin', desc: 'Location pin — mission trips, geography.' },
  { id: 'n6', file: 'n6-book', name: 'N6 — Open Book', desc: 'Bible / Word — the message we carry.' },
  { id: 'n7', file: 'n7-path', name: 'N7 — Journey Path', desc: 'Curving line with nodes. The mission journey.' },
  { id: 'n8', file: 'n8-pure-type', name: 'N8 — Pure Type', desc: 'No icon. Bold wordmark with elegant ampersand.' },
  { id: 'n9', file: 'n9-feet', name: 'N9 — Footprints', desc: 'Beautiful feet (Romans 10:15). Going.' },
  { id: 'n10', file: 'n10-heart-circle', name: 'N10 — Heart in Circle', desc: 'Love encircled. The Gospel in a mark.' },
];

export default function BrandExplorer() {
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedLogo, setSelectedLogo] = useState('n1');

  const font = FONTS.find(f => f.name === selectedFont)!;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <a href="/" className="text-mission-400 hover:text-mission-300 text-sm mb-8 inline-block">
          ← Back
        </a>

        <h1 className="text-4xl font-bold mb-2">Brand Explorer</h1>
        <p className="text-gray-400 mb-16">Font + Logo combinations for Called &amp; Sent</p>

        {/* === LOGOS === */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-2">Logo / Wordmark Styles</h2>
          <p className="text-gray-500 text-sm mb-8">Pick a logo style first. These all use Inter for now — font selection is below.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {LOGOS.map((logo) => (
              <button
                key={logo.id}
                onClick={() => setSelectedLogo(logo.id)}
                className={`p-6 rounded-xl border text-left transition-all ${
                  selectedLogo === logo.id
                    ? 'border-mission-500 bg-mission-600/10 ring-1 ring-mission-500/50'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="bg-gray-900 rounded-lg p-4 mb-3 flex items-center justify-center min-h-[60px]">
                  <img
                    src={`/brand/${logo.file}.svg`}
                    alt={logo.name}
                    className="max-h-10"
                    style={{ filter: 'brightness(1.1)' }}
                  />
                </div>
                <div className="text-sm font-semibold">{logo.name}</div>
                <div className="text-xs text-gray-500 mt-1">{logo.desc}</div>
              </button>
            ))}
          </div>

          {/* Selected logo large preview */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 flex items-center justify-center mb-4">
            <img
              src={`/brand/${LOGOS.find(l => l.id === selectedLogo)!.file}.svg`}
              alt="Selected logo"
              className="h-12 md:h-16"
              style={{ filter: 'brightness(1.1)' }}
            />
          </div>
          <p className="text-center text-xs text-gray-600">Selected: {LOGOS.find(l => l.id === selectedLogo)!.name}</p>
        </section>

        {/* === FONTS === */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-2">Typography</h2>
          <p className="text-gray-500 text-sm mb-8">Select a font. The preview updates with your chosen logo + font together.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {FONTS.map((f) => (
              <button
                key={f.name}
                onClick={() => setSelectedFont(f.name)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedFont === f.name
                    ? 'border-mission-500 bg-mission-600/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-semibold">{f.name}</div>
                <div className="text-xs text-gray-500 mt-1">{f.category}</div>
              </button>
            ))}
          </div>

          {/* Combined preview */}
          <motion.div key={selectedFont + selectedLogo} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            {/* Logo + Font combo */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-10">
              <p className="text-xs text-gray-600 mb-6 uppercase tracking-wider">Logo + Font Preview</p>
              <div className="flex items-center justify-center">
                <img
                  src={`/brand/${LOGOS.find(l => l.id === selectedLogo)!.file}.svg`}
                  alt="Logo preview"
                  className="h-12 md:h-16"
                  style={{ filter: 'brightness(1.1)' }}
                />
              </div>
            </div>

            {/* Headings */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Headline (Bold 700)</p>
              <h2 className="text-5xl font-bold" style={{ fontFamily: font.family }}>
                Share the Gospel. Share your story.
              </h2>
            </div>

            {/* Subheading */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Subheading (Semibold 600)</p>
              <h3 className="text-2xl font-semibold text-gray-200" style={{ fontFamily: font.family }}>
                A beautiful home on the web for every missionary
              </h3>
            </div>

            {/* Body */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Body (Regular 400)</p>
              <p className="text-lg leading-relaxed text-gray-300 max-w-2xl" style={{ fontFamily: font.family }}>
                Called &amp; Sent gives every missionary a dignified, beautiful home on the web. Share your testimony,
                document mission trips with photos and maps, post faith journey updates, and collect prayer and
                financial support — all from one link.
              </p>
            </div>

            {/* Small UI */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">UI / Small Text (500)</p>
              <div className="flex flex-wrap items-center gap-3" style={{ fontFamily: font.family }}>
                <span className="px-3 py-1 bg-mission-600/30 border border-mission-500 text-mission-300 rounded-full text-xs font-medium">
                  Evangelism
                </span>
                <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-medium">
                  Medical
                </span>
                <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-medium">
                  Youth Ministry
                </span>
                <span className="text-sm text-gray-500 ml-2">September 2025 · 1 week</span>
              </div>
            </div>

            {/* Numbers / Stats */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Stats / Numbers</p>
              <div className="flex gap-8" style={{ fontFamily: font.family }}>
                <div>
                  <div className="text-3xl font-bold">3</div>
                  <div className="text-sm text-gray-500">Countries</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4</div>
                  <div className="text-sm text-gray-500">Mission Trips</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">250</div>
                  <div className="text-sm text-gray-500">People Reached</div>
                </div>
              </div>
            </div>

            {/* Font info */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <p className="text-sm font-semibold mb-1" style={{ fontFamily: font.family }}>{font.name}</p>
              <p className="text-sm text-gray-400" style={{ fontFamily: font.family }}>{font.style}</p>
            </div>
          </motion.div>
        </section>

        {/* Summary */}
        <section className="border-t border-gray-800 pt-12">
          <div className="bg-mission-600/10 border border-mission-600/30 rounded-2xl p-8 text-center">
            <p className="text-gray-300 mb-2">
              Currently viewing: <span className="text-white font-semibold">{LOGOS.find(l => l.id === selectedLogo)!.name}</span>
              {' '}+{' '}
              <span className="text-white font-semibold">{selectedFont}</span>
            </p>
            <p className="text-gray-500 text-sm">
              Once you pick a logo + font, I'll apply them across the entire app.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
