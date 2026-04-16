import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';
import { parseAiJSON } from './utils';
import { buildSystemPrompt, buildUserMessage } from './prompts';
import { validateContent } from './validation';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  if (!genAI) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI;
}

export interface GeneratedDraft {
  platform: 'instagram' | 'linkedin' | 'email';
  content_text: string;
  image_suggestion?: string;
}

export interface AgentResult {
  drafts: GeneratedDraft[];
  validationResults: { platform: string; isValid: boolean; issues: string[] }[];
}

export async function executeAgentTask(taskId: number): Promise<AgentResult> {
  // STEP 1: RETRIEVAL - Fetch task, institution, brand guide, and content source
  const task = await prisma.agentTask.findUnique({
    where: { id: taskId },
    include: {
      institution: { include: { brandGuides: true } },
      contentSource: true,
    },
  });

  if (!task || !task.institution.brandGuides[0]) {
    throw new Error('Task or BrandGuide not found');
  }

  // Update task status to "thinking"
  await prisma.agentTask.update({
    where: { id: taskId },
    data: { status: 'thinking' },
  });

  const institution = task.institution;
  const brandGuide = task.institution.brandGuides[0];
  const rawContent = task.contentSource
    ? { content: task.contentSource.sourceUrl, type: task.contentSource.sourceType }
    : { content: 'General content update', type: 'general' };

  // STEP 2: SIMULATION - Build dynamic system prompt with brand context
  const systemPrompt = buildSystemPrompt(
    {
      name: institution.name,
      industry: institution.industry,
    },
    {
      tone_voice: brandGuide.toneVoice,
      target_audience: brandGuide.targetAudience,
      restricted_keywords: JSON.parse(brandGuide.restrictedKeywords || '[]'),
      color_palette: brandGuide.colorPalette || undefined,
    }
  );

  const userMessage = buildUserMessage(rawContent);

  // Update task status to "drafting"
  await prisma.agentTask.update({
    where: { id: taskId },
    data: { status: 'drafting' },
  });

  // STEP 3: DRAFTING - Generate multi-channel content with Gemini
  try {
    const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const rawOutput = parseAiJSON<any>(responseText);

    const drafts: GeneratedDraft[] = [
      {
        platform: 'instagram',
        content_text: rawOutput.instagram || '',
        image_suggestion: rawOutput.instagram_image || '',
      },
      {
        platform: 'linkedin',
        content_text: rawOutput.linkedin || '',
      },
      {
        platform: 'email',
        content_text: rawOutput.email || '',
      },
    ];

    // STEP 4: VALIDATION - Editor Agent reviews each draft
    const validationResults = [];
    for (const draft of drafts) {
      const result = await validateContent(draft.content_text, {
        tone_voice: brandGuide.toneVoice,
        restricted_keywords: JSON.parse(brandGuide.restrictedKeywords || '[]'),
      });
      validationResults.push({ platform: draft.platform, ...result });
    }

    // STEP 5: PERSIST - Save generated posts to database
    for (const draft of drafts) {
      await prisma.generatedPost.create({
        data: {
          institutionId: institution.id,
          agentTaskId: task.id,
          platform: draft.platform,
          contentText: draft.content_text,
          imageUrl: draft.image_suggestion,
          status: 'pending',
        },
      });
    }

    // STEP 6: COMPLETE - Update task status
    await prisma.agentTask.update({
      where: { id: taskId },
      data: { status: 'completed' },
    });

    return { drafts, validationResults };
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    await prisma.agentTask.update({
      where: { id: taskId },
      data: { status: 'failed' },
    });
    
    throw new Error(`Content generation failed: ${error.message}`);
  }
}