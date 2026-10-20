import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'अपना पोल बनाएँ | JanPoll India', description: 'JanPoll India पर अपना पोल बनाएँ।', alternates: { canonical: '/create' }, robots: { index: false, follow: false }, };
export default function Layout({children}:{children:React.ReactNode}) { return <>{children}</>; }
