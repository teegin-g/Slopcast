import { useSearchParams } from 'react-router-dom';

export type Section = 'wells' | 'economics' | 'scenarios';

const VALID_SECTIONS: Section[] = ['wells', 'economics', 'scenarios'];

export function useSidebarNav() {
  const [searchParams, setSearchParams] = useSearchParams();

  const raw = searchParams.get('section');
  const section: Section = raw && VALID_SECTIONS.includes(raw as Section)
    ? (raw as Section)
    : 'wells';

  const setSection = (s: Section) => {
    setSearchParams(prev => {
      prev.set('section', s);
      return prev;
    }, { replace: true });
  };

  return { section, setSection };
}
