import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export async function validateContent(content: string, brandGuide: any): Promise<ValidationResult> {
  const prompt = `Act as an Editor Agent. Review the following content for:
- Grammar and style consistency with brand tone: ${brandGuide.tone_voice}
- Safety: No violations of platform policies
- Length: Appropriate for the platform
- Adherence to restricted keywords: ${brandGuide.restricted_keywords.join(', ')}

Content: "${content}"

Output JSON: { "isValid": boolean, "issues": ["issue1", "issue2"] }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result;
}
