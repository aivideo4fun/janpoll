import 'server-only';
import { getVoterIdentity } from '@/lib/voter';
import { takeRateLimit } from '@/lib/rate-limit';
export async function creationGuard(creator:{email:string|null;guestHash:string|null}) {
 const identity=await getVoterIdentity();
 if(process.env.NODE_ENV==='production'&&!creator.email&&!identity.ipHash)return 'Guest सुरक्षा उपलब्ध नहीं है। Sign-in करें।';
 const actor=creator.email?`account:${creator.email}`:`guest:${creator.guestHash}`;
 if(!(await takeRateLimit('create-poll',actor,20,3600)).allowed)return 'एक घंटे में बहुत अधिक polls बनाने का प्रयास हुआ है। बाद में प्रयास करें।';
 if(!creator.email&&identity.ipHash&&!(await takeRateLimit('guest-create-network',identity.ipHash,60,3600)).allowed)return 'इस network से बहुत अधिक guest polls आए हैं। Sign-in करें या बाद में प्रयास करें।';
 return null;
}
