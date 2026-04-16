import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  if (!genAI) genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI;
}

export async function runChatAgent(institutionId: number, userMessage: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []) {
  try {
    // 1. Fetch Institution Data
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        products: { where: { isVisible: true } },
        complaints: { 
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: true }
        }
      },
    });

    if (!institution) {
      return { text: "I'm sorry, I couldn't find information about this business." };
    }

    const productsInfo = institution.products
      .map((p) => `- ${p.name}: GHS ${Number(p.price).toFixed(2)}. ${p.description ?? ''}`)
      .join('\n');

    const complaintsContext = institution.complaints.length > 0 
      ? institution.complaints.map(c => `- Q: ${c.subject} | A: ${c.status === 'resolved' ? 'This has been resolved previously.' : 'Currently working on this.'}`).join('\n')
      : 'No common issues reported yet.';

    const systemPrompt = `You are an expert Live Support Agent for "${institution.name}". 
    Your goal is to provide helpful, human-like assistance.
    
    Business Context: ${institution.description || 'Verified Business'}
    Industry: ${institution.industry}
    
    Available Products:
    ${productsInfo || 'No products listed.'}
    
    Common Issues/FAQs (Learned from history):
    ${complaintsContext}
    
    Your instructions:
    1. Be concise, warm, and helpful. Use a professional but friendly tone.
    2. Answer product questions directly using the prices provided.
    3. If you detect a recurring question from the history above, use that context to provide a more "insider" answer.
    4. If the user is reporting a NEW problem, acknowledge it with empathy.
    5. If a serious complaint is detected, add [INTENT:COMPLAINT] at the end of your response.`;

    const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-pro' });
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    // We prepend the system prompt as a one-time instruction or just in the first message
    // For simplicity with this SDK, we'll just send the user message combined with context if history is empty
    let fullMsg = userMessage;
    if (history.length === 0) {
      fullMsg = `${systemPrompt}\n\nUser Message: ${userMessage}`;
    }

    const result = await chat.sendMessage(fullMsg);
    const text = result.response.text();

    return {
      text,
      isComplaint: text.includes('[INTENT:COMPLAINT]'),
    };
  } catch (error) {
    console.error('Chat Agent Error:', error);
    return { text: "I'm having trouble connecting to my brain right now. Please try again later.", isComplaint: false };
  }
}
