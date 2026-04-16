import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseAiJSON } from '../utils';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;
function getGemini() {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not defined');
  if (!genAI) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export async function runWebsiteAgent(institutionId: number): Promise<{ slug: string }> {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    include: {
      products: { where: { isVisible: true } },
      brandGuides: true,
      socialHandles: true,
    },
  });

  if (!institution) throw new Error('Institution not found');
  if (institution.verificationStatus !== 'verified') {
    throw new Error('Institution must be verified before a site can be generated');
  }

  // Log agent task
  const task = await prisma.agentTask.create({
    data: { institutionId, taskType: 'website_generation', status: 'thinking' },
  });

  let aiContent = {
    tagline: 'Empowering your brand with intelligent solutions.',
    aboutUs: institution.description || 'Welcome to our platform.',
    heroText: `Welcome to ${institution.name}`,
    heroSubtext: 'The future of business in Ghana.',
  };

  if (GEMINI_API_KEY) {
    try {
      const productList = institution.products.map(p => `- ${p.name}: ${p.description || ''}`).join('\n');
      const prompt = `You are an expert Website Copywriter for ${institution.name}, a ${institution.industry} business.
Brand Tone: ${institution.brandGuides[0]?.toneVoice ?? 'Professional and reliable'}
Business Description: ${institution.description || 'Not provided'}
Products:
${productList}

Generate high-converting website copy for the homepage. 
Respond ONLY with valid JSON in this exact format:
{
  "tagline": "short catchy tagline (5-7 words)",
  "aboutUs": "compelling 2-3 paragraph about section that highlights the unique value proposition",
  "heroText": "impactful 3-6 word main heading for the homepage",
  "heroSubtext": "persuasive sub-heading (10-15 words) to drive engagement"
}

Important: Return ONLY the JSON object, no explanation, no backticks.`;

      const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const parsed = parseAiJSON<any>(response);
      
      if (parsed.tagline) aiContent = { ...aiContent, ...parsed };
      console.log('[WEBSITE-AGENT] AI content generated successfully');
    } catch (e) {
      console.error('[WEBSITE-AGENT] Gemini failed, using fallbacks:', e);
    }
  }

  const baseSlug = toSlug(institution.name);
  const slug = `${baseSlug}-${institution.id}`;

  // Build theme config stored as JSON
  const themeData = JSON.stringify({
    institutionName: institution.name,
    industry: institution.industry,
    description: institution.description,
    logo: institution.logoBase64,
    colorPrimary: institution.colorPrimary ?? '#00D4FF',
    colorSecondary: institution.colorSecondary ?? '#B026FF',
    socialHandles: institution.socialHandles,
    brandGuide: institution.brandGuides[0] ?? null,
    productCount: institution.products.length,
    // New AI Generated Content
    ...aiContent,
  });

  // Upsert generated site
  await prisma.generatedSite.upsert({
    where: { institutionId },
    update: { slug, status: 'live', themeData },
    create: { institutionId, slug, status: 'live', themeData },
  });

  // Update institution slug
  await prisma.institution.update({
    where: { id: institutionId },
    data: { slug },
  });

  await prisma.agentTask.update({
    where: { id: task.id },
    data: { status: 'completed' },
  });

  return { slug };
}
