import { useRef } from 'react';
import { useNavigate } from '@/lib/rr';
import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { GuideVideo } from '@/components/landing/GuideVideo';
import { Features } from '@/components/landing/Features';
import { WhyNSAGPT } from '@/components/landing/WhyNSAGPT';
import { AccessControl } from '@/components/landing/AccessControl';
import { Footer } from '@/components/landing/Footer';

export function LandingPage() {
  const navigate = useNavigate();
  const guideRef = useRef<HTMLElement | null>(null);

  const scrollToGuide = () => {
    const el = document.getElementById('guide');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <LandingNav onGetStarted={goToLogin} />

      <Hero onGetStarted={goToLogin} onWatchGuide={scrollToGuide} />

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="guide">
        <GuideVideo videoRef={(el) => { if (el) guideRef.current = el; }} />
      </div>

      <div id="features">
        <Features />
      </div>

      <div id="why">
        <WhyNSAGPT />
      </div>

      <AccessControl onLogin={goToLogin} onContact={goToLogin} />

      <Footer />
    </div>
  );
}
