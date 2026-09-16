import { useRef, useState } from 'react';
import { useNavigate } from '@/lib/rr';
import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { GuideVideo } from '@/components/landing/GuideVideo';
import { Features } from '@/components/landing/Features';
import { WhyNSAGPT } from '@/components/landing/WhyNSAGPT';
import { AccessControl } from '@/components/landing/AccessControl';
import { OtherProducts } from '@/components/landing/OtherProducts';
import { ReviewsSection } from '@/components/landing/ReviewsSection';
import { Footer } from '@/components/landing/Footer';
import { Reveal } from '@/components/landing/Reveal';
import { PricingSection } from '@/components/landing/PricingSection';
import { FeaturesTicker } from '@/components/landing/FeaturesTicker';
import { SubscriptionPopup } from '@/components/landing/SubscriptionPopup';
import { SupportWidget } from '@/components/landing/SupportWidget';
import { GetStartedModal } from '@/components/landing/GetStartedModal';
import { AnnouncementBar } from '@/components/landing/AnnouncementBar';


export function LandingPage() {
  const navigate = useNavigate();
  const guideRef = useRef<HTMLElement | null>(null);
  const [showGetStarted, setShowGetStarted] = useState(false);

  const scrollToGuide = () => {
    const el = document.getElementById('guide');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToLogin = () => navigate('/login');
  const openGetStarted = () => setShowGetStarted(true);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 scroll-smooth">
      <LandingNav onGetStarted={openGetStarted} />

      <Hero onGetStarted={openGetStarted} onWatchGuide={scrollToGuide} />

      <FeaturesTicker />

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
        <OtherProducts />
      </Reveal>

      <Reveal delay={80}>
        <ReviewsSection />
      </Reveal>

      <Reveal>
        <PricingSection />
      </Reveal>

      <Reveal>
        <AccessControl onLogin={goToLogin} onContact={goToLogin} />
      </Reveal>

      <Footer />

      <SubscriptionPopup />

      <SupportWidget />

      {showGetStarted && (
        <GetStartedModal onClose={() => setShowGetStarted(false)} onSignIn={goToLogin} />
      )}
    </div>
  );
}
