import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'बंद polls और परिणाम | JanPoll India', description: 'JanPoll India पर बंद polls और परिणाम।', alternates: { canonical: '/closed-polls' }, keywords: ['JanPoll closed polls', 'opinion poll results'], };
export default function Layout({children}:{children:React.ReactNode}) { return <>{children}</>; }
