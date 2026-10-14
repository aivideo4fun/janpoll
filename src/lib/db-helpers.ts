import { prisma } from './prisma';

// Safe Poll Count function with Fallback
export async function getSafePollCount() {
  try {
    const count = await prisma.poll.count();
    return count;
  } catch (error) {
    console.error("Database Error in getSafePollCount:", error);
    return 0; // Fallback value agar database down ho
  }
}

// Safe Districts Fetching function with Fallback
export async function getSafeDistricts() {
  try {
    const districts = await prisma.district.findMany();
    return districts;
  } catch (error) {
    console.error("Database Error in getSafeDistricts:", error);
    return []; // Fallback empty array
  }
}