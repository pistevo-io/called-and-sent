import { Instagram, BookOpen, Compass } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-5">
            <a
              href="https://blog.calledandsent.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-mission-400 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-sm">Blog</span>
            </a>
            <a
              href="https://emmaus.calledandsent.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-mission-400 transition-colors"
            >
              <Compass className="w-5 h-5" />
              <span className="text-sm">Emmaus</span>
            </a>
            <a
              href="https://instagram.com/calledandsent.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span className="text-sm">Instagram</span>
            </a>
          </div>
          <p className="text-gray-500 text-sm italic">
            "It's not works, it's grace." - Ephesians 2:8-9
          </p>

        </div>
      </div>
    </footer>
  );
}

export default Footer;
