import EnglishInfoPage from '@/components/public/EnglishInfoPage';
import { PUBLIC_PAGES_EN } from '@/lib/public-pages-en';
import { englishMetadata } from '@/lib/english-metadata';
const page=PUBLIC_PAGES_EN.terms;
export const metadata=englishMetadata(page.title,page.description,'/terms');
export default function Page(){return <EnglishInfoPage page={page}/>;}
