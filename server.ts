import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type MatchLevel = 'Sangat Sesuai' | 'Sesuai' | 'Direkomendasikan' | 'Penunjang';

interface CatalogInputItem {
  id: string;
  code: string;
  title: string;
  type: string;
  category: string;
  targetRole: string;
  targetRoles: string[];
  durationJp: number;
  method: string;
  level: string;
  summary: string;
}

interface ProfileInput {
  position: string;
  developmentNeeds: string[];
  ownedCompetencies?: string[];
}

interface GeminiRecommendationRaw {
  trainingId?: string;
  competencyGroup?: string;
  reason?: string;
  matchPercentage?: number;
  matchLevel?: string;
}

interface ValidatedRecommendation {
  trainingId: string;
  competencyGroup: string;
  reason: string;
  matchPercentage: number;
  matchLevel: MatchLevel;
}

const VALID_MATCH_LEVELS: MatchLevel[] = [
  'Sangat Sesuai',
  'Sesuai',
  'Direkomendasikan',
  'Penunjang',
];

function normalizeMatchLevel(rawLevel: string | undefined, pct: number): MatchLevel {
  if (rawLevel) {
    const found = VALID_MATCH_LEVELS.find(
      (level) => level.toLowerCase() === rawLevel.trim().toLowerCase()
    );
    if (found) return found;
  }
  if (pct >= 90) return 'Sangat Sesuai';
  if (pct >= 80) return 'Sesuai';
  if (pct >= 70) return 'Direkomendasikan';
  return 'Penunjang';
}

function normalizeSingleSentence(text: string | undefined, fallback: string): string {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  const firstSentenceMatch = cleaned.match(/^[^.!?]+[.!?]/);
  const sentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : cleaned;
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      const isRetryable = status === 429 || status === 503 || status === 500 || status === 0;
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/rekomendasi', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(500).json({
        error:
          'GEMINI_API_KEY belum tersedia di server. Silakan periksa konfigurasi pada panel Settings > Secrets.',
      });
      return;
    }

    const body = req.body as {
      profile?: ProfileInput;
      catalog?: CatalogInputItem[];
    };

    const profile = body?.profile;
    const catalog = Array.isArray(body?.catalog) ? body.catalog : [];

    if (!profile || !profile.position || !Array.isArray(profile.developmentNeeds)) {
      res.status(400).json({ error: 'Data profil pengguna tidak lengkap.' });
      return;
    }

    if (catalog.length === 0) {
      res.status(400).json({ error: 'Data koleksi katalog_pelatihan masih kosong.' });
      return;
    }

    const catalogById = new Map<string, CatalogInputItem>();
    const catalogByCode = new Map<string, CatalogInputItem>();
    for (const item of catalog) {
      if (item && typeof item.id === 'string') {
        catalogById.set(item.id.trim(), item);
      }
      if (item && typeof item.code === 'string') {
        catalogByCode.set(item.code.trim().toLowerCase(), item);
      }
    }

    const compactCatalog = catalog.map((item) => ({
      id: item.id,
      code: item.code,
      title: item.title,
      type: item.type,
      category: item.category,
      targetRole: item.targetRole,
      targetRoles: item.targetRoles,
      durationJp: item.durationJp,
      method: item.method,
      level: item.level,
      summary: item.summary,
    }));

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = [
      'Anda adalah sistem kurasi pengembangan kompetensi ASN untuk portal KOMPAS.',
      'Tugas Anda:',
      '1. Baca profil pengguna: jabatan dan daftar kompetensi yang perlu dikembangkan.',
      '2. Pilih pelatihan HANYA dari daftar koleksi katalog_pelatihan yang diberikan dalam input JSON.',
      '3. DILARANG KERAS mengarang, mengubah, atau menambahkan pelatihan, ID, atau kode di luar koleksi katalog_pelatihan.',
      '4. Utamakan pelatihan yang kategorinya sesuai dengan kompetensi yang perlu dikembangkan dan jabatan sasarannya cocok dengan jabatan pengguna (abaikan jenjang seperti Ahli Pertama/Muda/Madya/Utama) atau berstatus "Semua Jabatan".',
      '5. Untuk setiap pelatihan terpilih, jelaskan alasan pemilihannya dalam TEPAT 1 kalimat bahasa Indonesia yang ringkas, spesifik terhadap jabatan dan kebutuhan kompetensi pengguna.',
      '6. Tetapkan competencyGroup sesuai nama kompetensi pada daftar developmentNeeds pengguna (atau kategori pelatihan bila diperlukan) agar hasil dapat dikelompokkan per kompetensi.',
    ].join('\n');

    const userPrompt = JSON.stringify(
      {
        profil_pengguna: {
          jabatan: profile.position,
          kompetensi_perlu_dikembangkan: profile.developmentNeeds,
          kompetensi_dimiliki: profile.ownedCompetencies ?? [],
        },
        katalog_pelatihan: compactCatalog,
      },
      null,
      2
    );

    try {
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: userPrompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendations: {
                  type: Type.ARRAY,
                  description:
                    'Daftar pelatihan terpilih dari katalog_pelatihan saja yang relevan dengan profil pengguna.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      trainingId: {
                        type: Type.STRING,
                        description:
                          'ID persis dari katalog_pelatihan (misal PL-01). Dilarang mengarang ID.',
                      },
                      competencyGroup: {
                        type: Type.STRING,
                        description:
                          'Nama kompetensi kelompok dari daftar kompetensi_perlu_dikembangkan.',
                      },
                      reason: {
                        type: Type.STRING,
                        description:
                          'Alasan pemilihan pelatihan untuk pengguna dalam tepat 1 kalimat bahasa Indonesia.',
                      },
                      matchPercentage: {
                        type: Type.INTEGER,
                        description: 'Persentase kecocokan profil (0 hingga 100).',
                      },
                      matchLevel: {
                        type: Type.STRING,
                        description:
                          'Kategori kesesuaian: Sangat Sesuai, Sesuai, Direkomendasikan, atau Penunjang.',
                      },
                    },
                    required: [
                      'trainingId',
                      'competencyGroup',
                      'reason',
                      'matchPercentage',
                      'matchLevel',
                    ],
                  },
                },
              },
              required: ['recommendations'],
            },
          },
        })
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'Gemini API tidak mengembalikan isi rekomendasi.',
        });
        return;
      }

      let parsed: { recommendations?: GeminiRecommendationRaw[] };
      try {
        parsed = JSON.parse(rawText) as { recommendations?: GeminiRecommendationRaw[] };
      } catch {
        res.status(502).json({
          error: 'Format respons Gemini API tidak valid.',
        });
        return;
      }

      const rawList = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
      const seenIds = new Set<string>();
      const validated: ValidatedRecommendation[] = [];

      for (const item of rawList) {
        const candidateKey = (item.trainingId || '').trim();
        const catalogItem =
          catalogById.get(candidateKey) ?? catalogByCode.get(candidateKey.toLowerCase());

        // Tolak setiap pelatihan yang tidak ada di koleksi katalog_pelatihan
        if (!catalogItem) continue;
        if (seenIds.has(catalogItem.id)) continue;
        seenIds.add(catalogItem.id);

        const rawPct =
          typeof item.matchPercentage === 'number' && Number.isFinite(item.matchPercentage)
            ? Math.round(item.matchPercentage)
            : 85;
        const matchPercentage = Math.max(0, Math.min(100, rawPct));

        const matchedNeed = profile.developmentNeeds.find(
          (need) =>
            need.toLowerCase() === (item.competencyGroup || '').trim().toLowerCase() ||
            need.toLowerCase() === catalogItem.category.toLowerCase()
        );

        const competencyGroup = matchedNeed || catalogItem.category;
        const fallbackReason = `Pelatihan ini relevan untuk mengembangkan kompetensi ${competencyGroup} bagi jabatan ${profile.position}.`;

        validated.push({
          trainingId: catalogItem.id,
          competencyGroup,
          reason: normalizeSingleSentence(item.reason, fallbackReason),
          matchPercentage,
          matchLevel: normalizeMatchLevel(item.matchLevel, matchPercentage),
        });
      }

      res.json({ recommendations: validated });
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : 500;
      const message = err instanceof Error ? err.message : 'Gagal menghubungi Gemini API.';

      console.error('Gemini recommendation error:', status, message);

      if (status === 400 || status === 403) {
        res.status(status).json({
          error:
            'Kunci API Gemini tidak valid atau tidak memiliki izin akses. Silakan periksa Settings > Secrets.',
        });
        return;
      }

      if (status === 429) {
        res.status(429).json({
          error: 'Batas permintaan Gemini API tercapai sementara. Silakan coba beberapa saat lagi.',
        });
        return;
      }

      if (status === 503) {
        res.status(503).json({
          error:
            'Layanan Gemini API sedang mengalami kepadatan sementara. Silakan tekan Coba Lagi beberapa saat lagi.',
        });
        return;
      }

      res.status(status >= 400 && status < 600 ? status : 502).json({
        error: `Terjadi kendala saat meminta rekomendasi Gemini API: ${message}`,
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  const eqPortArg = process.argv.find((arg) => arg.startsWith('--port='));
  const portFlagIdx = process.argv.indexOf('--port');
  const cliPort = eqPortArg
    ? Number(eqPortArg.slice('--port='.length))
    : portFlagIdx !== -1
      ? Number(process.argv[portFlagIdx + 1])
      : NaN;
  const port = Number.isFinite(cliPort) && cliPort > 0 ? cliPort : 3000;

  app.listen(port, '0.0.0.0', () => {
    console.log(`KOMPAS server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
