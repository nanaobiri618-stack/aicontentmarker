import { prisma } from '@/lib/db';

export interface AIModelConfig {
  provider: string;
  modelName: string;
  apiKey: string;
}

/**
 * Get the default AI model configuration for an institution
 * Falls back to hardcoded Gemini key if no model is configured
 */
export async function getInstitutionAIModel(institutionId: number): Promise<AIModelConfig> {
  try {
    // Try to get the institution's default AI model
    const defaultModel = await (prisma as any).aIModel.findFirst({
      where: {
        institutionId,
        isDefault: true,
      },
    });

    if (defaultModel) {
      return {
        provider: defaultModel.provider,
        modelName: defaultModel.modelName,
        apiKey: defaultModel.apiKey,
      };
    }

    // Fallback: get any configured model
    const anyModel = await (prisma as any).aIModel.findFirst({
      where: { institutionId },
    });

    if (anyModel) {
      return {
        provider: anyModel.provider,
        modelName: anyModel.modelName,
        apiKey: anyModel.apiKey,
      };
    }

    // Ultimate fallback: hardcoded Gemini key
    return {
      provider: 'gemini',
      modelName: 'gemini-1.5-flash',
      apiKey: 'AIzaSyDjHXyOV--SwLixgV9AdnsqtoAuEwNvJ0U',
    };
  } catch (error) {
    console.error('Error fetching AI model config:', error);
    // Fallback to hardcoded Gemini key
    return {
      provider: 'gemini',
      modelName: 'gemini-1.5-flash',
      apiKey: 'AIzaSyDjHXyOV--SwLixgV9AdnsqtoAuEwNvJ0U',
    };
  }
}
