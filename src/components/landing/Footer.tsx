import { useEffect, useState } from 'react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Link } from '@/lib/rr';
import { fetchSiteSettings, type SiteSettings } from '@/lib/site';




export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    void fetchSiteSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const contact = settings?.show_contact ? settings : null;
  const hasContact =
    !!contact &&
    Boolean(contact.contact_address || contact.contact_phone || contact.contact_whatsapp || contact.contact_email);

  return (

    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo size="sm" />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
              AI-powered educational platform for generating questions and building professional exam papers.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-3">Workflow</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Upload Study Material</li>
              <li>Customize Settings</li>
              <li>AI Generates Questions</li>
              <li>Build & Export Paper</li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>MCQ, Short & Long Questions</li>
              <li>Urdu & English Support</li>
              <li>Question Bank & History</li>
              <li>PDF & Word Export</li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-primary-600 dark:hover:text-primary-400">About</Link></li>
              <li><Link to="/contact" className="hover:text-primary-600 dark:hover:text-primary-400">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-primary-600 dark:hover:text-primary-400">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} NSAGPT. All rights reserved.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Developed by
            <span className="font-semibold text-slate-700 dark:text-slate-300">ZK SOLUTIONS</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
