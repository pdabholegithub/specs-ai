import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const accessCode = req.headers.get('x-specs-access-code');
    const requiredCode = process.env.SPECS_ACCESS_CODE || "DemoSpecs2026";
    
    if (!accessCode || accessCode.trim() !== requiredCode.trim()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const historyDir = path.join(process.cwd(), 'src/data/healing-history');
    
    if (!fs.existsSync(historyDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));
    
    const history = files.map(file => {
      const filePath = path.join(historyDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        id: file.replace('.json', ''),
        ...content
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('[FETCH HISTORY ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
