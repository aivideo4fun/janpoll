import { db } from '@/lib/db';
import AnnouncementTicker from './AnnouncementTicker';
export default async function AnnouncementBar(){
 const items=await db.announcement.findMany({where:{active:true,ticker:true},orderBy:[{tickerOrder:'asc'},{createdAt:'desc'}],take:20,select:{id:true,title:true,body:true,href:true,tickerSpeed:true}}).catch(()=>[]);
 return <AnnouncementTicker items={items}/>;
}
