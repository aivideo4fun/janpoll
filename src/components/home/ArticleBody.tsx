/** A small plain-text format: headings, paragraphs, bullet lists and quotes. No raw HTML. */
export default function ArticleBody({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, '\n').split(/\n\s*\n/).filter(Boolean);
  return <div className="space-y-6 break-words">{blocks.map((block, index) => {
    const lines = block.split('\n');
    if (lines[0].startsWith('## ')) return <section key={index}><h2 className="text-xl font-semibold leading-9 text-emerald-900">{lines[0].slice(3)}</h2>{lines.length > 1 && <ArticleBody content={lines.slice(1).join('\n')} />}</section>;
    if (lines.every(line => /^[-•] /.test(line))) return <ul key={index} className="list-disc space-y-2 pl-6 text-base leading-9 text-slate-700">{lines.map((line,i) => <li key={i}>{line.slice(2)}</li>)}</ul>;
    if (lines.every(line => line.startsWith('> '))) return <blockquote key={index} className="border-l-4 border-emerald-500 bg-emerald-50 p-4 text-base leading-9 text-emerald-950">{lines.map(line => line.slice(2)).join('\n')}</blockquote>;
    return <p key={index} className="whitespace-pre-line text-base leading-9 text-slate-700">{block}</p>;
  })}</div>;
}
