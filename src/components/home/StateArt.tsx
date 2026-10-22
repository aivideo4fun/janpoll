import paths from '@/lib/home/state-paths.json';
const STATE_CODES = ['AP','AR','AS','BR','CG','GA','GJ','HR','HP','JH','KA','KL','MP','MH','MN','ML','MZ','NL','OD','PB','RJ','SK','TN','TS','TR','UP','UK','WB'];
/** Published geographic polygons, never guessed map paths. Artwork is decorative. */
export default function StateArt({ code, variant = 'card' }: { code: string; variant?: string }) {
  const path = (paths as Record<string, string>)[code];
  const index = STATE_CODES.indexOf(code);
  if (!path) return null;
  const clip = `jh-state-${code}-${variant}`;
  return <svg viewBox="0 0 220 220" className="jh-state-art" aria-hidden="true" focusable="false">
    <defs><clipPath id={clip}><path d={path} fillRule="evenodd" /></clipPath><linearGradient id={`${clip}-fill`} x2="1" y2="1"><stop stopColor="#edf8f2" /><stop offset="1" stopColor="#cde8da" /></linearGradient></defs>
    <path d={path} fill={`url(#${clip}-fill)`} />
    {index >= 0 && <g clipPath={`url(#${clip})`}><image href="/images/janpoll-home/heritage-atlas.webp" x={-(index % 7) * 220} y={-Math.floor(index / 7) * 220} width="1540" height="880" preserveAspectRatio="none" /></g>}
    <path d={path} fill="none" stroke="#247151" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>;
}
