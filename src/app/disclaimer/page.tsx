import EnglishInfoPage from '@/components/public/EnglishInfoPage';
import { PUBLIC_PAGES_EN } from '@/lib/public-pages-en';
import { englishMetadata } from '@/lib/english-metadata';
const page=PUBLIC_PAGES_EN["disclaimer"];
export const metadata=englishMetadata(page.title,page.description,"/disclaimer");
export default function Page(){ return <EnglishInfoPage page={page}/>; }
