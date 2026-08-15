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
import { Reveal } from '@/components/landing/Reveal';

export function LandingPage() {
  const navigate = useNavigate();
  const guideRef = useRef<HTMLElement | null>(null);

  const scrollToGuide = () => {
    const el = document.getElementById('guide');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 scroll-smooth">
      <LandingNav onGetStarted={goToLogin} />

      <Hero onGetStarted={goToLogin} onWatchGuide={scrollToGuide} />

      <div id="how-it-works">
        <Reveal>
          <HowItWorks />
        </Reveal>
      </div>

      <div id="guide">
        <Reveal delay={80}>
          <GuideVideo videoRef={(el) => { if (el) guideRef.current = el; }} />
        </Reveal>
      </div>

      <div id="features">
        <Reveal>
          <Features />
        </Reveal>
      </div>

      <div id="why">
        <Reveal delay={80}>
          <WhyNSAGPT />
        </Reveal>
      </div>

      <Reveal>
        <AccessControl onLogin={goToLogin} onContact={goToLogin} />
      </Reveal>

      <Footer />
    </div>
  );
}
