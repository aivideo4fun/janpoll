import EnglishInfoPage from '@/components/public/EnglishInfoPage';
import { PUBLIC_PAGES_EN } from '@/lib/public-pages-en';
import { englishMetadata } from '@/lib/english-metadata';
const page=PUBLIC_PAGES_EN["how-it-works"];
export const metadata=englishMetadata(page.title,page.description,"/how-it-works");
export default function Page(){ return <EnglishInfoPage page={page}/>; }
