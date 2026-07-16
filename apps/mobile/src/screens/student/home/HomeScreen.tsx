import { useMyStudentProfile } from '@wrsi/api';
import { Screen } from '@wrsi/ui';
import { GreetingHeader } from './GreetingHeader';
import { JourneyCard } from './JourneyCard';
import { HighlightsCarousel } from './HighlightsCarousel';
import { NextEventCard } from './NextEventCard';
import { QuickAccessGrid } from './QuickAccessGrid';
import { FeaturedResourceCard } from './FeaturedResourceCard';
import { BenefitBanner } from './BenefitBanner';
import { SocialLinksRow } from './SocialLinksRow';

/**
 * The designed student dashboard ("Inicio"). Each section owns its own data
 * fetching so one slow/absent query doesn't block the rest of the page; this
 * screen only resolves the profile that several sections key off.
 */
export function HomeScreen() {
  const { data: student } = useMyStudentProfile();

  return (
    <Screen scroll testID="student-home-screen">
      <GreetingHeader firstName={student?.first_name ?? ''} />
      <JourneyCard studentId={student?.id} />
      <HighlightsCarousel student={student} />
      <NextEventCard />
      <QuickAccessGrid />
      <FeaturedResourceCard />
      <BenefitBanner />
      <SocialLinksRow />
    </Screen>
  );
}
