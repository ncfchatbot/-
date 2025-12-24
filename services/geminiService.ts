
import { GoogleGenAI, Type } from "@google/genai";
import { ReferenceFile, Grade, Language, Question, AnalysisResult } from "../types.ts";

// ฟังก์ชันดึง Key ที่อัปเดตที่สุด
const getApiKey = () => {
  return process.env.API_KEY || (window as any).process?.env?.API_KEY;
};

async function withRetry<T>(fn: () => Promise<T>, retries = 1, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    
    // ถ้าเป็น Error เกี่ยวกับ Billing หรือ Key ให้รีบส่ง Error ออกไปเพื่อให้ UI จัดการ
    if (
      errorMsg.includes("billing") || 
      errorMsg.includes("403") || 
      errorMsg.includes("404") || 
      errorMsg.includes("not found") || 
      errorMsg.includes("api_key") ||
      errorMsg.includes("project")
    ) {
      throw error;
    }
    
    if (retries > 0 && (error.status === 429 || error.status === 503)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function generateExamFromFile(
  files: ReferenceFile[],
  grade: Grade,
  language: Language,
  count: number,
  weakTopics?: string[]
): Promise<Question[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_INVALID: ไม่พบ API Key");
  
  const fileParts = files.map(f => ({
    inlineData: {
      data: f.data.split(',')[1] || f.data,
      mimeType: f.mimeType
    }
  }));

  const targetingPrompt = weakTopics && weakTopics.length > 0 
    ? `FOCUS AREAS: ${weakTopics.join(', ')}`
    : "Generate realistic exam questions based on the attached files.";

  const prompt = `Act as an expert Thai curriculum educator for Grade ${grade}.
  Task: ${targetingPrompt}
  Output Language: ${language}
  Total Questions: ${count}
  
  Requirements:
  - Analyze the attached materials deeply.
  - Create 4 multiple choice options.
  - Explanation MUST be in THAI.
  - Return ONLY a JSON Array.`;

  return withRetry(async () => {
    // สร้าง Instance ใหม่ทุกครั้งที่เรียกใช้ เพื่อใช้ Key ล่าสุด
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [...fileParts, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              topic: { type: Type.STRING }
            },
            required: ["text", "options", "correctIndex", "explanation", "topic"]
          }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text).map((q: any, i: number) => ({ ...q, id: `q-${Date.now()}-${i}` }));
  });
}

export async function analyzeExamResults(
  questions: Question[], 
  userAnswers: (number | null)[]
): Promise<AnalysisResult> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_INVALID");

  const history = questions.map((q, i) => ({
    topic: q.topic,
    correct: q.correctIndex === userAnswers[i]
  }));

  const prompt = `Analyze this performance: ${JSON.stringify(history)}
  Return JSON with: summary (Thai), strengths (array), weaknesses (array), readingAdvice (Thai)`;

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            readingAdvice: { type: Type.STRING }
          },
          required: ["summary", "strengths", "weaknesses", "readingAdvice"]
        }
      }
    });
    const text = response.text || "{}";
    return JSON.parse(text);
  });
}
