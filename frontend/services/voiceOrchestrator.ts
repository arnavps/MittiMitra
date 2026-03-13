import { usePathname } from 'next/navigation';

export type VoiceContextMode = 'expert' | 'financial_advisor' | 'co_pilot';

export const getVoiceContextMode = (pathname: string): VoiceContextMode => {
    if (pathname.includes('/dashboard/schemes')) {
        return 'financial_advisor';
    }
    if (pathname.includes('/dashboard/logistics') || pathname.includes('/dashboard/market-maps')) {
        return 'co_pilot';
    }
    return 'expert';
};
