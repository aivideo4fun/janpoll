import { englishMetadata } from '@/lib/english-metadata';
import VideoSection from '@/components/home/VideoSection';
import '../janpoll-home.css';
export const dynamic = 'force-dynamic';
export const metadata = englishMetadata('Video guides','Learn how to create, share and participate in JanPoll polls.','/videos');
export default function VideosPage() { return <main lang="en" className="jh-home"><div className="jh-shell"><VideoSection all language="en" /></div></main>; }
