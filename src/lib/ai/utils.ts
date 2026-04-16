/**
 * Robustly extracts and parses JSON from an AI's text response.
 * Handles markdown code blocks, weird formatting, and leading/trailing text.
 */
export function parseAiJSON<T>(text: string): T {
  try {
    // 1. Try to find JSON block enclosed in ```json ... ```
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch?.[1]) {
      return JSON.parse(jsonBlockMatch[1]);
    }

    // 2. Try to find any markdown code block ``` ... ```
    const genericBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (genericBlockMatch?.[1]) {
      return JSON.parse(genericBlockMatch[1]);
    }

    // 3. Try to find the first '{' or '[' and the last '}' or ']'
    const braceStart = text.indexOf('{');
    const bracketStart = text.indexOf('[');
    
    let startIdx = -1;
    let endIdx = -1;

    if (braceStart !== -1 && (bracketStart === -1 || braceStart < bracketStart)) {
      startIdx = braceStart;
      endIdx = text.lastIndexOf('}');
    } else if (bracketStart !== -1) {
      startIdx = bracketStart;
      endIdx = text.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const candidate = text.substring(startIdx, endIdx + 1);
      return JSON.parse(candidate);
    }

    // 4. Last resort: just try parsing the whole thing
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('[AI-UTILS] JSON Parsing failed:', error);
    console.error('[AI-UTILS] Original text:', text);
    throw new Error('Failed to parse AI response as JSON');
  }
}
