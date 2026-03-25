/**
 * Cleans a JSON string that might be wrapped in Markdown code blocks or contain explanatory text.
 */
export const cleanJsonString = (str: string) => {
  if (!str) return "{}";

  // 1. Try to find markdown JSON block
  const markdownMatch = str.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }

  // 2. Try to find the first '{' and the last '}'
  const firstOpen = str.indexOf('{');
  const lastClose = str.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    return str.substring(firstOpen, lastClose + 1);
  }

  // 3. Fallback: return original if it looks like JSON, otherwise empty object
  return str.trim().startsWith('{') ? str : "{}";
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the Data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};