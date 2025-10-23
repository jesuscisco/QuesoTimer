import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'slider');
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => allowed.has(path.extname(name).toLowerCase()))
      .sort();

    const urls = files.map((name) => `/slider/${name}`);
    return NextResponse.json({ images: urls });
  } catch (err) {
    console.error('Error reading slider images:', err);
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}
