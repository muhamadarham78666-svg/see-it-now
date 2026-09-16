import { useEffect, useState } from 'react';
import { Megaphone, Wrench, X } from 'lucide-react';
import { fetchSiteSettings, type SiteSettings } from '@/lib/site';

/** Owner-controlled announcement / maintenance strip above the homepage. */
export function AnnouncementBar() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    void fetchSiteSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  if (!settings || hidden) return null;

  const maintenance = settings.maintenance_mode && settings.maintenance_message.trim().length > 0;
  const announcement = settings.announcement_enabled && settings.announcement.trim().length > 0;
  if (!maintenance && !announcement) return null;

  const text = maintenance ? settings.maintenance_message : settings.announcement;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium text-white shadow-md ${
        maintenance
          ? 'bg-gradient-to-r from-amber-600 to-orange-600'
          : 'bg-gradient-to-r from-primary-600 to-accent-600'
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {maintenance ? <Wrench size={15} /> : <Megaphone size={15} />}
        {text}
      </span>
      <button
        onClick={() => setHidden(true)}
        aria-label="Hide notice"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
      >
        <X size={15} />
      </button>
    </div>
  );
}
