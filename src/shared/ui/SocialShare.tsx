import { useState, useRef, useEffect } from 'react';
import {
  Instagram,
  Mail,
  MessageCircle,
  AtSign,
  Newspaper,
  Check,
} from 'lucide-react';

interface SocialShareProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

type Mode = 'intent' | 'mail' | 'copy';

interface Platform {
  key: string;
  label: string;
  color: string;
  icon: typeof Instagram | null;
  isX?: boolean;
  mode: Mode;
  href?: (full: string) => string;
  open?: string;
}

const PLATFORMS: Platform[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    color:
      'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    mode: 'copy',
    open: 'https://instagram.com',
  },
  {
    key: 'threads',
    label: 'Threads',
    icon: AtSign,
    color: 'bg-black hover:bg-gray-800',
    mode: 'intent',
    href: (full) =>
      `https://threads.net/intent/post?text=${encodeURIComponent(full)}`,
  },
  {
    key: 'x',
    label: 'X',
    icon: null,
    isX: true,
    color: 'bg-black hover:bg-gray-800',
    mode: 'intent',
    href: (full) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(full)}`,
  },
  {
    key: 'substack',
    label: 'Substack',
    icon: Newspaper,
    color: 'bg-orange-600 hover:bg-orange-700',
    mode: 'copy',
    open: 'https://substack.com',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500 hover:bg-green-600',
    mode: 'intent',
    href: (full) => `https://wa.me/?text=${encodeURIComponent(full)}`,
  },
  {
    key: 'email',
    label: 'Email',
    icon: Mail,
    color: 'bg-gray-600 hover:bg-gray-700',
    mode: 'mail',
  },
];

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function SocialShare({
  title,
  text,
  url,
  className = '',
}: SocialShareProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timeout on unmount to avoid setState-after-unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const fullText = `${text}\n\n${url || window.location.href}`;

  const flashCopied = (key: string) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setCopiedKey(key);
    timerRef.current = setTimeout(() => {
      setCopiedKey((cur) => (cur === key ? null : cur));
      timerRef.current = null;
    }, 1800);
  };

  const handle = (platform: Platform) => {
    if (platform.mode === 'mail') {
      const subject = encodeURIComponent(title);
      const body = encodeURIComponent(fullText);
      window.open(
        `mailto:?subject=${subject}&body=${body}`,
        '_blank',
        'noopener,noreferrer',
      );
      return;
    }

    if (platform.mode === 'intent' && platform.href) {
      window.open(platform.href(fullText), '_blank', 'noopener,noreferrer');
      return;
    }

    // copy mode (Instagram / Substack): copy the text, then open the app
    // so the user can paste it. Show a confirmation.
    void copyText(fullText).then((ok) => {
      if (platform.open) {
        window.open(platform.open, '_blank', 'noopener,noreferrer');
      }
      if (ok) flashCopied(platform.key);
    });
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Screen-reader-only live region: announces copy confirmation */}
      <span
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {copiedKey
          ? `${PLATFORMS.find((p) => p.key === copiedKey)?.label ?? ''} link copied to clipboard`
          : ''}
      </span>
      {PLATFORMS.map((p) => {
        const Icon = p.icon;
        const copied = copiedKey === p.key;

        return (
          <span key={p.key} className="relative group">
            <button
              type="button"
              onClick={() => handle(p)}
              aria-label={`Share to ${p.label}`}
              title={copied ? 'Copied! Paste into the app' : `Share to ${p.label}`}
              className={`${p.color} text-white p-3 rounded-full transition-all transform hover:scale-110 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mission-500`}
            >
              {p.isX ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              ) : Icon ? (
                <Icon className="w-5 h-5" />
              ) : null}
              {copied && (
                <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <Check className="w-5 h-5" />
                </span>
              )}
            </button>
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg" aria-hidden="true">
              {copied ? 'Copied! Paste into the app' : `Share to ${p.label}`}
            </span>
          </span>
        );
      })}
    </div>
  );
}
