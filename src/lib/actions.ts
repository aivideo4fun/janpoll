'use server';

import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function castVote(pollId: string, optionId: string, anonymousUserId: string) {
  try {
    // 1. User ka real IP address nikalna (Cloudflare / Proxy safe)
    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // 2. Check karein ki is Poll par is IP Address ya is Browser ID se pehle vote ho chuka hai kya?
    const existingVote = await db.vote.findFirst({
      where: {
        pollId,
        OR: [
          { anonymousUserId },
          { ipAddress: realIp }
        ]
      },
    });

    if (existingVote) {
      return { 
        success: false, 
        message: '⚠️ इस डिवाइस या नेटवर्क से इस पोल पर पहले ही वोट दिया जा चुका है! (एक डिवाइस/नेटवर्क से केवल 1 वोट मान्य है)' 
      };
    }

    // 3. Database mein vote save karein (IP aur Browser ID dono ke sath)
    await db.vote.create({
      data: {
        pollId,
        optionId,
        anonymousUserId,
        ipAddress: realIp,
      },
    });

    // 4. Option vote count badhayein
    await db.pollOption.update({
      where: { id: optionId },
      data: { voteCount: { increment: 1 } },
    });

    revalidatePath(`/poll/${pollId}`);
    return { success: true, message: 'आपका वोट सफलतापूर्व दर्ज हो गया!' };
  } catch (error) {
    console.error('Voting error:', error);
    return { success: false, message: 'वोट दर्ज करने में त्रुटि हुई। कृपया पुनः प्रयास करें।' };
  }
}