'use client';
import { useState } from 'react';
import { Play } from 'lucide-react';
export default function YouTubeCard({ video, language = 'hi' }: { video: { title: string; videoId: string; description: string }; language?:'hi'|'en' }) {
  const [playing, setPlaying] = useState(false);
  return <article className="jh-video-card">
    <div className="jh-video-screen">
      {playing ? <iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId)}?rel=0`} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> :
        <button type="button" className="jh-video-play" onClick={() => setPlaying(true)} aria-label={`${language==='en'?'Open video':'वीडियो खोलें'}: ${video.title}`}><span className="jh-play-circle"><Play aria-hidden="true" /></span><span>{language==='en'?'Watch video':'वीडियो देखें'}</span><small>{language==='en'?'JanPoll • Learn & understand':'JanPoll • सीखें और समझें'}</small></button>}
    </div>
    <div className="jh-video-copy"><h3>{video.title}</h3>{video.description && <p>{video.description}</p>}<a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer">{language==='en'?'Open on YouTube ↗':'YouTube पर खोलें ↗'}</a></div>
  </article>;
}
