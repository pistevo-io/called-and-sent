import { Instagram } from 'lucide-react';

function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`bg-gray-900 border-t border-gray-700 py-4 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com/calledandsent.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-pink-400 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span className="text-sm">Instagram</span>
            </a>
          </div>
          <p className="text-muted-foreground text-sm italic font-[Georgia,serif]">
            "It's not works, it's grace." - Ephesians 2:8-9
          </p>
        </div>
        <div className="flex justify-center gap-6 mt-3 pb-1">
          <a
            href="/privacy"
            className="text-muted-foreground/60 hover:text-muted-foreground text-xs transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-muted-foreground/60 hover:text-muted-foreground text-xs transition-colors"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
