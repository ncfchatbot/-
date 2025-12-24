
import { GoogleGenAI, Type } from "@google/genai";
import { ReferenceFile, Grade, Language, Question, AnalysisResult } from "../types.ts";

/**
 * Helper to retry API calls on rate limits or service unavailability
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || "";
    // ถ้าหาโมเดลไม่เจอ หรือ Key ผิดพลาด ไม่ต้อง Retry
    if (errorMsg.includes("not found") || errorMsg.includes("API key not valid")) {
      throw error;
    }
    
    if (retries > 0 && (error.status === 429 || error.status === 503)) {
      console.warn(`API Rate limit hit, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Generates exam questions using Gemini Flash (More stable and widely available)
 */
export async function generateExamFromFile(
  files: ReferenceFile[],
  grade: Grade,
  language: Language,
  count: number,
  weakTopics?: string[]
): Promise<Question[]> {
  // ดึง Key จาก process.env หรือ window context
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  
  const fileParts = files.map(f => ({
    inlineData: {
      data: f.data.split(',')[1] || f.data,
      mimeType: f.mimeType
    }
  }));

  const targetingPrompt = weakTopics && weakTopics.length > 0 
    ? `เน้นประเด็นที่นักเรียนยังไม่เข้าใจ (Weak topics): ${weakTopics.join(', ')}`
    : "สร้างข้อสอบเก็งแนวสำหรับนักเรียนรายบุคคล";

  const prompt = `คุณคือผู้เชี่ยวชาญด้านหลักสูตรการศึกษาไทย (สพฐ.) สำหรับชั้น ${grade}
  ภารกิจ: ${targetingPrompt}
  ภาษาของข้อสอบ: ${language}
  จำนวนข้อ: ${count}
  
  คำแนะนำพิเศษ:
  - วิเคราะห์ไฟล์แนบอย่างละเอียด
  - ออกข้อสอบแบบเลือกตอบ 4 ตัวเลือก
  - เฉลย (Explanation) ต้องเป็นภาษาไทยที่เข้าใจง่ายสำหรับเด็กชั้น ${grade}
  - กลับค่าเป็น JSON Array เท่านั้น`;

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // เปลี่ยนจาก pro เป็น flash เพื่อความเสถียรสูงสุด
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

    const jsonStr = (response.text || "").trim();
    const data = JSON.parse(jsonStr || "[]");
    return data.map((q: any, i: number) => ({ ...q, id: `q-${Date.now()}-${i}` }));
  });
}

/**
 * Analyzes exam results
 */
export async function analyzeExamResults(
  questions: Question[], 
  userAnswers: (number | null)[]
): Promise<AnalysisResult> {
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const history = questions.map((q, i) => ({
    topic: q.topic,
    correct: q.correctIndex === userAnswers[i]
  }));

  const prompt = `วิเคราะห์ผลสอบชุดนี้: ${JSON.stringify(history)}
  1. สรุปภาพรวมใน 1-2 ประโยค (Thai)
  2. บอกจุดแข็ง (Strengths) เป็นหัวข้อ
  3. บอกจุดที่ควรปรับปรุง (Weaknesses) เป็นหัวข้อ
  4. ให้คำแนะนำในการอ่านหนังสือ (Advice)
  กลับค่าเป็น JSON`;

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
    
    const jsonStr = (response.text || "").trim();
    return JSON.parse(jsonStr || "{}");
  });
}
