import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'slider');
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
    const diskFiles = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => allowed.has(path.extname(name).toLowerCase()));

    // Optional manifest support for ordering, enabling, and metadata
    // public/slider/manifest.json
    const manifestPath = path.join(dir, 'manifest.json');
    let ordered: string[] | null = null;
    try {
      const raw = await fs.readFile(manifestPath, 'utf8');
      const json = JSON.parse(raw) as {
        images?: Array<{
          file: string;
          enabled?: boolean;
          order?: number;
          // metadata fields reserved for future use
          title?: string;
          durationMs?: number;
        }>;
      };
      if (Array.isArray(json.images)) {
        // Filter by enabled and presence on disk, then order by 'order' (asc) or by array index
        const filtered = json.images
          .filter((it) => it && typeof it.file === 'string' && (it.enabled ?? true))
          .filter((it) => diskFiles.includes(it.file));
        filtered.sort((a, b) => {
          const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          return 0; // keep original array order when order ties/missing
        });
        ordered = filtered.map((f) => f.file);
      }
    } catch {}

    // Fallback: alphabetical order, supports prefix-based ordering e.g. 01_, 02_
    const files = ordered ?? diskFiles.sort();
    const urls = files.map((name) => `/slider/${name}`);
    return NextResponse.json({ images: urls });
  } catch (err) {
    console.error('Error reading slider images:', err);
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}
