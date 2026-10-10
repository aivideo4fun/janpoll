import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body; // 'generate' ya 'push'

    let command = 'npx prisma generate';
    if (action === 'push') {
      command = 'npx prisma db push';
    } else if (action === 'full') {
      command = 'npx prisma generate && npx prisma db push';
    }

    const { stdout, stderr } = await execPromise(command, {
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      message: `Prisma command successfully executed!`,
      output: stdout || stderr,
    });
  } catch (error: any) {
    console.error('Prisma Action Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Command execution failed',
    }, { status: 500 });
  }
}