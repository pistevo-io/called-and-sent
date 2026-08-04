import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Compass,
  ExternalLink,
  Globe,
  Heart,
  Home,
  MapPin,
  Plus,
  User,
} from 'lucide-react';
import ContentState from './ContentState';
import { useMissionaryProfile } from '../../shared/data/useMissionaryProfile';
import type { MissionaryProfile, ProfileUpdate, ThemeColor } from '../../shared/types/MissionaryProfile';
import type { MissionTrip } from '../../shared/types/MissionTrip';
import { useChromeGuard } from '../../shared/ui/useChromeGuard';
import './ProfilePage.css';

type TabKey = 'missions' | 'updates' | 'about';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'missions', label: 'Missions' },
  { key: 'updates', label: 'Updates' },
  { key: 'about', label: 'About' },
];

/**
 * Accent palettes keyed by the profile's `themeColor`. Applied as CSS custom
 * properties on the page root so every accent-driven surface (primary CTA,
 * active tab, badges, progress) follows the missionary's chosen palette.
 * Mission blue remains the default when no themeColor is set.
 */
const THEME_PALETTES: Record<ThemeColor, { accent: string; bright: string; soft: string }> = {
  ocean: { accent: '#0284c7', bright: '#0ea5e9', soft: 'rgba(2, 132, 199, 0.16)' },
  sage: { accent: '#9ca986', bright: '#b9c3a5', soft: 'rgba(156, 169, 134, 0.18)' },
  terracotta: { accent: '#c2703d', bright: '#d98a55', soft: 'rgba(194, 112, 61, 0.18)' },
  lavender: { accent: '#8b7ec8', bright: '#a99de0', soft: 'rgba(139, 126, 200, 0.18)' },
  rose: { accent: '#cf6a87', bright: '#e08aa5', soft: 'rgba(207, 106, 135, 0.18)' },
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Mobile-only scroll collapse for the large-title hero (mirrors the mockup's
 * `hero.offsetTop + hero.offsetHeight - topbar height - 8` threshold). Returns
 * a boolean + a 0..1 fade progress used for the subtle parallax on the hero.
 * No-op on desktop (>=1024px) where the persistent identity rail replaces the
 * hero entirely.
 */
function useHeroCollapse() {
  const topbarRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [fade, setFade] = useState(0);

  useEffect(() => {
    let raf = 0;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = () => {
      raf = 0;
      const topbar = topbarRef.current;
      const hero = heroRef.current;
      if (!topbar || !hero) return;
      if (window.innerWidth >= 1024) {
        setCollapsed(false);
        setFade(0);
        return;
      }
      const threshold = hero.offsetTop + hero.offsetHeight - topbar.offsetHeight - 8;
      setCollapsed(window.scrollY > threshold);
      if (reduced) {
        setFade(0);
        return;
      }
      const prog = Math.min(
        1,
        Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight - topbar.offsetHeight)),
      );
      setFade(prog);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { topbarRef, heroRef, collapsed, fade };
}

export default function ProfilePage({ slug }: { slug: string }) {
  const { profile, missions, loading, error } = useMissionaryProfile(slug);
  const chromeRef = useChromeGuard('ProfilePage', { expectHeader: true, expectFooter: false });
  const { topbarRef, heroRef, collapsed, fade } = useHeroCollapse();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('missions');
  const [partnerOpen, setPartnerOpen] = useState(false);

  const theme = profile?.themeColor ?? 'ocean';
  const palette = THEME_PALETTES[theme];

  const heroStyle: CSSProperties = {
    opacity: 1 - fade * 0.85,
    transform: fade > 0 ? `translateY(${(-fade * 24).toFixed(1)}px)` : undefined,
  };

  const onTabKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    const idx = TABS.findIndex((t) => t.key === activeTab);
    let next: TabKey | null = null;
    if (e.key === 'ArrowRight') next = TABS[(idx + 1) % TABS.length].key;
    else if (e.key === 'ArrowLeft') next = TABS[(idx - 1 + TABS.length) % TABS.length].key;
    else if (e.key === 'Home') next = TABS[0].key;
    else if (e.key === 'End') next = TABS[TABS.length - 1].key;
    if (next) {
      e.preventDefault();
      setActiveTab(next);
    }
  };

  const stats = [
    { n: profile?.partners ?? 0, l: 'Partners' },
    { n: missions.length, l: 'Missions' },
    { n: profile?.updates?.length ?? 0, l: 'Updates' },
  ];

  return (
    <div
      className="pp-page"
      data-theme-color={theme}
      ref={chromeRef}
      style={
        {
          '--pp-accent': palette.accent,
          '--pp-accent-bright': palette.bright,
          '--pp-accent-soft': palette.soft,
        } as CSSProperties
      }
    >
      {/* 1. Slim opaque top bar (always visible) */}
      <header className={`pp-topbar${collapsed ? ' collapsed' : ''}`} ref={topbarRef}>
        <button
          type="button"
          className="pp-back"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <Link to="/" className="pp-brand">
          <span className="pp-brand-mark">C&amp;S</span>
          <span className="pp-brand-name">Called &amp; Sent</span>
        </Link>
        <div className="pp-inline-name">{profile?.name}</div>
        <div className="pp-spacer" />
        <Link to={`/${slug}`} className="pp-ghost-link pp-desktop-only">
          <ExternalLink size={16} />
          View public profile
        </Link>
        <div className="pp-avatar" aria-hidden="true">
          {profile ? initialsOf(profile.name) : 'C'}
        </div>
      </header>

      <ContentState loading={loading} error={error} empty={!profile} emptyMessage="Profile not found.">
        {profile && (
          <>
            <div className="pp-page-inner">
              {/* 2. Mobile hero — collapsible large-title (hidden on desktop) */}
              <section className="pp-hero" ref={heroRef} aria-label="Profile identity">
                <div className="pp-hero-inner" style={heroStyle}>
                  <div className="pp-large-title">Profile</div>
                  <div className="pp-hero-head">
                    <AvatarBlock name={profile.name} avatar={profile.avatar} size="lg" />
                    <div className="pp-hero-meta">
                      <h1 className="pp-hero-name">{profile.name}</h1>
                      <div className="pp-hero-handle">
                        @{profile.slug} · {profile.location}
                      </div>
                      <div className="pp-badges">
                        <span className="pp-badge missionary">
                          <Heart size={14} /> Missionary
                        </span>
                        <span className="pp-badge global">
                          <Globe size={14} /> Global
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="pp-bio">{profile.bio}</p>
                  {profile.verse && <p className="pp-verse">{profile.verse}</p>}
                  <div className="pp-stats">
                    {stats.map((s) => (
                      <div className="pp-stat" key={s.l}>
                        <div className="pp-stat-n">{s.n}</div>
                        <div className="pp-stat-l">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pp-actions">
                    <button
                      type="button"
                      className="pp-btn pp-btn-primary"
                      onClick={() => setPartnerOpen(true)}
                    >
                      <Heart size={18} /> Partner With Me
                    </button>
                  </div>
                </div>
              </section>

              {/* 3. Desktop identity rail (persistent, sticky) */}
              <aside className="pp-rail" aria-label="Profile identity">
                <div className="pp-rail-sticky">
                  <AvatarBlock name={profile.name} avatar={profile.avatar} size="xl" />
                  <h2 className="pp-rail-name">{profile.name}</h2>
                  <div className="pp-rail-handle">
                    @{profile.slug} · {profile.location}
                  </div>
                  <div className="pp-badges">
                    <span className="pp-badge missionary">
                      <Heart size={14} /> Missionary
                    </span>
                    <span className="pp-badge global">
                      <Globe size={14} /> Global
                    </span>
                  </div>
                  <p className="pp-bio">{profile.bio}</p>
                  <div className="pp-stats">
                    {stats.map((s) => (
                      <div className="pp-stat" key={s.l}>
                        <div className="pp-stat-n">{s.n}</div>
                        <div className="pp-stat-l">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pp-actions">
                    <button
                      type="button"
                      className="pp-btn pp-btn-primary"
                      onClick={() => setPartnerOpen(true)}
                    >
                      <Heart size={18} /> Partner With Me
                    </button>
                    <button
                      type="button"
                      className="pp-btn pp-btn-ghost"
                      onClick={() => navigate('/settings')}
                    >
                      Edit profile
                    </button>
                  </div>
                </div>
              </aside>

              {/* 4. Tabbed content */}
              <main className="pp-content">
                <nav
                  className="pp-tabs"
                  role="tablist"
                  aria-label="Profile sections"
                  onKeyDown={onTabKeyDown}
                >
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      role="tab"
                      id={`pp-tab-${t.key}`}
                      aria-selected={activeTab === t.key}
                      aria-controls={`pp-panel-${t.key}`}
                      tabIndex={activeTab === t.key ? 0 : -1}
                      className={`pp-tab${activeTab === t.key ? ' active' : ''}`}
                      onClick={() => setActiveTab(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </nav>

                {activeTab === 'missions' && (
                  <section
                    className="pp-panel"
                    role="tabpanel"
                    id="pp-panel-missions"
                    aria-labelledby="pp-tab-missions"
                  >
                    <div className="pp-section-title">Missions</div>
                    <div className="pp-section-sub">Current and recent field work you can partner with.</div>
                    <ContentState empty={missions.length === 0} emptyMessage="No missions yet — check back soon.">
                      <div className="pp-mission-grid">
                        {missions.map((m) => (
                          <MissionCard key={m.id} trip={m} />
                        ))}
                      </div>
                    </ContentState>
                  </section>
                )}

                {activeTab === 'updates' && (
                  <section
                    className="pp-panel"
                    role="tabpanel"
                    id="pp-panel-updates"
                    aria-labelledby="pp-tab-updates"
                  >
                    <div className="pp-section-title">Updates</div>
                    <div className="pp-section-sub">Field notes and stories from {profile.name.split(' ')[0]}.</div>
                    <ContentState
                      empty={!profile.updates || profile.updates.length === 0}
                      emptyMessage="No updates yet — subscribe to be the first to know."
                    >
                      <div className="pp-updates">
                        {(profile.updates ?? []).map((u) => (
                          <UpdateRow key={u.id} profile={profile} update={u} />
                        ))}
                      </div>
                    </ContentState>
                  </section>
                )}

                {activeTab === 'about' && (
                  <section
                    className="pp-panel"
                    role="tabpanel"
                    id="pp-panel-about"
                    aria-labelledby="pp-tab-about"
                  >
                    <div className="pp-section-title">About</div>
                    <div className="pp-about-card">
                      <h3>Calling &amp; mission</h3>
                      <p>{profile.about ?? profile.bio}</p>
                      <div className="pp-about-row">
                        <span className="pp-about-k">Field</span>
                        <span>{profile.location}</span>
                      </div>
                      {profile.tags.length > 0 && (
                        <div className="pp-about-row">
                          <span className="pp-about-k">Focus</span>
                          <span>{profile.tags.join(' · ')}</span>
                        </div>
                      )}
                      {profile.verse && (
                        <div className="pp-about-row">
                          <span className="pp-about-k">Verse</span>
                          <span>{profile.verse}</span>
                        </div>
                      )}
                      {profile.socials.length > 0 && (
                        <div className="pp-about-row">
                          <span className="pp-about-k">Connect</span>
                          <span className="pp-about-links">
                            {profile.socials.map((s, i) => (
                              <a
                                key={s.url}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pp-about-link"
                              >
                                {s.label}
                                {i < profile.socials.length - 1 && <span className="pp-about-sep"> · </span>}
                              </a>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </main>
            </div>

            {/* 5. Bottom nav (mobile only) */}
            <nav className="pp-bottomnav" aria-label="Primary">
              <Link to="/">
                <Home size={20} />
                Home
              </Link>
              <Link to="/dashboard">
                <Compass size={20} />
                Trips
              </Link>
              <Link to="/dashboard">
                <Plus size={20} />
                New
              </Link>
              <Link to="/dashboard">
                <Bell size={20} />
                Alerts
              </Link>
              <Link to={`/${slug}`} aria-current="page">
                <User size={20} />
                Profile
              </Link>
            </nav>

            {/* 6. Partner sheet */}
            {partnerOpen && <PartnerModal name={profile.name} onClose={() => setPartnerOpen(false)} />}
          </>
        )}
      </ContentState>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function AvatarBlock({
  name,
  avatar,
  size,
}: {
  name: string;
  avatar?: string;
  size: 'sm' | 'lg' | 'xl';
}) {
  if (avatar) {
    return (
      <img
        className={`pp-avatar-img ${size}`}
        src={avatar}
        alt={`${name}'s avatar`}
        loading="lazy"
      />
    );
  }
  return (
    <div className={`pp-avatar-block ${size}`} aria-hidden="true">
      {initialsOf(name)}
    </div>
  );
}

function MissionCard({ trip }: { trip: MissionTrip }) {
  const done = trip.status === 'completed';
  const when = [trip.date, trip.duration].filter(Boolean).join(' · ');
  return (
    <article className="pp-mission">
      <div className="pp-mission-thumb">
        {trip.images[0] && <img src={trip.images[0]} alt="" loading="lazy" />}
        <span className={`pp-mission-tag${done ? ' done' : ''}`}>
          {done ? 'Completed' : 'Upcoming'}
        </span>
      </div>
      <div className="pp-mission-body">
        <h3>{trip.title}</h3>
        <div className="pp-mission-loc">
          <MapPin size={14} /> {trip.location}, {trip.country}
        </div>
        <div className="pp-mission-when">{when}</div>
        <p className="pp-mission-desc">{trip.description}</p>
      </div>
    </article>
  );
}

function UpdateRow({ profile, update }: { profile: MissionaryProfile; update: ProfileUpdate }) {
  return (
    <article className="pp-update">
      <AvatarBlock name={profile.name} avatar={profile.avatar} size="sm" />
      <div className="pp-update-body">
        <div className="pp-update-who">
          {profile.name} <span className="pp-update-time">· {formatDate(update.date)}</span>
        </div>
        <div className="pp-update-title">{update.title}</div>
        <p className="pp-update-tx">{update.excerpt}</p>
        {update.image && (
          <img className="pp-update-img" src={update.image} alt="" loading="lazy" />
        )}
      </div>
    </article>
  );
}

function PartnerModal({ name, onClose }: { name: string; onClose: () => void }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="pp-modal-scrim show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pp-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Partner with ${name}`}
      >
        <h3>Partner With Me</h3>
        <div className="pp-modal-sub">
          Send {name.split(' ')[0]} a note — they&apos;ll follow up with next steps to partner in the
          work.
        </div>
        <div className="pp-modal-field">
          <textarea
            ref={textareaRef}
            placeholder="I'd love to partner with you…"
            aria-label="Message"
          />
        </div>
        <div className="pp-modal-foot">
          <button type="button" className="pp-btn pp-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          {/* Submission is intentionally a UI-only flow for now — wire to the
              give/prayer-commit backend when it lands (annotations §10 #3). */}
          <button type="button" className="pp-btn pp-btn-primary" onClick={onClose}>
            Send message
          </button>
        </div>
      </div>
    </div>
  );
}
