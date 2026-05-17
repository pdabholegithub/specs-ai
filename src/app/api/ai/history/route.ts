import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Explicitly mark as dynamic since this route reads request headers
export const dynamic = 'force-dynamic';

const MAX_HISTORY_ITEMS = 50;

export async function GET(req: Request) {
  try {
    const accessCode = req.headers.get('x-specs-access-code');
    const requiredCode = process.env.SPECS_ACCESS_CODE || 'DemoSpecs2026';

    if (!accessCode || accessCode.trim() !== requiredCode.trim()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const historyDir = path.join(process.cwd(), 'src/data/healing-history');

    if (!fs.existsSync(historyDir)) {
      return NextResponse.json([]);
    }

    // Fix #8: Paginate — only load the last MAX_HISTORY_ITEMS files to prevent memory issues
    const files = fs.readdirSync(historyDir)
      .filter(f => f.endsWith('.json'))
      .sort() // fix-<timestamp>.json sorts chronologically
      .slice(-MAX_HISTORY_ITEMS);

    const history = files.map(file => {
      const filePath = path.join(historyDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { id: file.replace('.json', ''), ...content };
    }).sort((a: { timestamp: string }, b: { timestamp: string }) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(history);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch history.';
    console.error('[FETCH HISTORY ERROR]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
