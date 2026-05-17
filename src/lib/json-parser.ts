/**
 * Shared utility: Robustly parses JSON from LLM responses.
 * Strips markdown code fences and uses brace-matching as a fallback
 * to handle cases where the model wraps the output in prose.
 */
export function extractAndParseJson<T = unknown>(text: string): T {
  let cleanText = text.trim();

  // Strip starting ```json or ``` and ending ```
  cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/, '');
  cleanText = cleanText.replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(cleanText) as T;
  } catch (err) {
    // Fallback: find the first '{' and match braces to extract the JSON object
    const firstBrace = cleanText.indexOf('{');
    if (firstBrace !== -1) {
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = firstBrace; i < cleanText.length; i++) {
        const char = cleanText[i];

        if (escapeNext) { escapeNext = false; continue; }
        if (char === '\\') { escapeNext = true; continue; }
        if (char === '"') { inString = !inString; continue; }

        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              const candidate = cleanText.substring(firstBrace, i + 1);
              try {
                return JSON.parse(candidate) as T;
              } catch {
                // continue searching
              }
            }
          }
        }
      }
    }
    throw err;
  }
}
