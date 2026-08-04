import { Link } from 'react-router-dom';
import { Share2, Pencil, UserPlus, Check, Info } from 'lucide-react';
import type { ProfileIdentity, ProfileTabDef } from './profileHeader.types';
import './profileHeader.css';

const NAV_LINKS = [
  { label: 'Profile', to: '/dashboard' },
  { label: 'Studio', to: '/dashboard' },
  { label: 'Learn', to: '/dashboard' },
  { label: 'Community', to: '/dashboard' },
];

/* ---------- Top navigation bar (always visible) ---------- */
export function TopBar({
  identity,
  onShare,
  onAbout,
}: {
  identity: ProfileIdentity;
  onShare: () => void;
  onAbout: () => void;
}) {
  return (
    <header className="ph-topbar">
      <Link to="/" className="ph-topbar-brand">
        <span className="ph-topbar-mark">C</span>
        <span>Called &amp; Sent</span>
      </Link>

      <nav className="ph-topbar-links" aria-label="Primary">
        {NAV_LINKS.map((l, i) => (
          <Link key={l.label} to={l.to} className={i === 0 ? 'active' : ''}>
            {l.label}
          </Link>
        ))}
        <button type="button" onClick={onAbout}>
          About
        </button>
      </nav>

      <div className="ph-topbar-end">
        <button
          type="button"
          onClick={onAbout}
          className="ph-topbar-icon"
          aria-label="About"
          title="About"
        >
          <Info className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onShare}
          className="ph-topbar-avatar"
          aria-label={`Share ${identity.name}'s profile`}
          title={`Share ${identity.name}'s profile`}
        >
          {identity.initials}
        </button>
      </div>
    </header>
  );
}

/* ---------- Collapsed scroll header (after 120px scroll, mobile/tablet) ---------- */
export function ScrollHeader({
  identity,
  visible,
  onPartner,
}: {
  identity: ProfileIdentity;
  visible: boolean;
  onPartner: () => void;
}) {
  return (
    <div
      className={`ph-scroll-header${visible ? ' visible' : ''}`}
      aria-hidden={!visible}
    >
      <span className="ph-scroll-avatar">{identity.initials}</span>
      <span className="ph-scroll-name">{identity.name}</span>
      <button type="button" className="ph-scroll-action" onClick={onPartner}>
        Partner
      </button>
    </div>
  );
}

/* ---------- Hero identity block ---------- */
export function ProfileHero({
  identity,
  following,
  onEdit,
  onFollowToggle,
  onShare,
}: {
  identity: ProfileIdentity;
  following: boolean;
  onEdit: () => void;
  onFollowToggle: () => void;
  onShare: () => void;
}) {
  return (
    <section className="ph-hero" aria-label="Profile identity">
      <div className="ph-hero-top">
        <div className="ph-logo" aria-hidden="true">
          {identity.initials}
        </div>
        <div className="ph-meta">
          <h1 className="ph-name">{identity.name}</h1>
          {identity.role && <p className="ph-role">{identity.role}</p>}
          {identity.tags && identity.tags.length > 0 && (
            <div className="ph-tags">
              {identity.tags.map((t) => (
                <span key={t.label} className={`ph-tag${t.blue ? ' blue' : ''}`}>
                  {t.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ph-actions">
        <button type="button" className="ph-btn blue" onClick={onShare}>
          <Share2 className="w-4 h-4" /> Share Profile
        </button>
        <button type="button" className="ph-btn gold" onClick={onEdit}>
          <Pencil className="w-4 h-4" /> Edit Identity
        </button>
        <button
          type="button"
          className={`ph-btn${following ? ' following' : ' ghost'}`}
          onClick={onFollowToggle}
          aria-pressed={following}
        >
          {following ? (
            <>
              <Check className="w-4 h-4" /> Following
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" /> Follow
            </>
          )}
        </button>
      </div>
    </section>
  );
}

/* ---------- Tabs ---------- */
export function ProfileTabs({
  tabs,
  active,
  onSelect,
  pushed,
}: {
  tabs: ProfileTabDef[];
  active: string;
  onSelect: (key: string) => void;
  pushed: boolean;
}) {
  return (
    <div className={`ph-tabs-wrap${pushed ? ' pushed' : ''}`}>
      <div className="ph-tabs" role="tablist" aria-label="Profile sections">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              className={`ph-tab${isActive ? ' active' : ''}`}
              onClick={() => onSelect(t.key)}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
