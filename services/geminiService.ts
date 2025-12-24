
import { GoogleGenAI, Type } from "@google/genai";
import { ReferenceFile, Grade, Language, Question, AnalysisResult } from "../types.ts";

// Helper สำหรับตรวจสอบ Key อย่างละเอียด
const isValidKey = (key: any): boolean => {
  if (!key) return false;
  const s = String(key).trim();
  return s !== "" && s !== "undefined" && s !== "null" && s.length > 5;
};

export async function generateExamFromFile(
  files: ReferenceFile[],
  grade: Grade,
  language: Language,
  count: number,
  weakTopics?: string[]
): Promise<Question[]> {
  const apiKey = process.env.API_KEY;

  if (!isValidKey(apiKey)) {
    throw new Error("API Key ไม่ถูกต้องหรือยังไม่ได้ติดตั้ง กรุณาเชื่อมต่อ API Key ผ่านเมนู Re-Connect");
  }

  // สร้าง Instance ใหม่ทุกครั้งเพื่อให้ใช้ Key ล่าสุด
  const ai = new GoogleGenAI({ apiKey: apiKey! });

  const contentParts: any[] = files.map(f => ({
    inlineData: {
      data: f.data.split(',')[1] || f.data,
      mimeType: f.mimeType
    }
  }));

  const systemInstruction = `คุณคือผู้ช่วยติวเตอร์ AI ระดับโลก หน้าที่ของคุณคือวิเคราะห์เนื้อหาจากเอกสารที่ผู้ใช้ส่งมา เพื่อสร้างข้อสอบปรนัย (4 ตัวเลือก) ที่มีคุณภาพสูงและตรงตามเนื้อหาที่ปรากฏในรูปภาพหรือไฟล์`;

  const userPrompt = `โปรดสร้างข้อสอบปรนัยจำนวน ${count} ข้อ สำหรับนักเรียนระดับชั้น ${grade} สื่อสารด้วยภาษา ${language === 'Thai' ? 'ไทย' : 'อังกฤษ'} 
โดยวิเคราะห์จากเอกสารที่แนบมานี้

ข้อกำหนด:
1. ข้อสอบต้องเน้นเนื้อหาที่สำคัญจากรูปภาพ/ไฟล์ที่ส่งมา
2. ระดับความยากต้องเหมาะสมกับเด็กชั้น ${grade}
3. ต้องมีเฉลยที่ถูกต้องและคำอธิบายประกอบที่เข้าใจง่าย
${weakTopics ? `เน้นเป็นพิเศษในหัวข้อ: ${weakTopics.join(', ')}` : ''}

ส่งคำตอบกลับเป็น JSON Array ตามโครงสร้างที่กำหนดเท่านั้น`;

  contentParts.push({ text: userPrompt });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: contentParts }],
    config: {
      systemInstruction,
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
  try {
    const parsedQuestions = JSON.parse(text);
    return parsedQuestions.map((q: any, i: number) => ({
      ...q,
      id: `q-${Date.now()}-${i}`
    }));
  } catch (e) {
    throw new Error("AI ส่งข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
  }
}

export async function analyzeExamResults(
  questions: Question[], 
  userAnswers: (number | null)[]
): Promise<AnalysisResult> {
  const apiKey = process.env.API_KEY;
  if (!isValidKey(apiKey)) throw new Error("Missing API Key");

  const ai = new GoogleGenAI({ apiKey: apiKey! });

  const history = questions.map((q, i) => ({
    topic: q.topic,
    correct: q.correctIndex === userAnswers[i],
    question: q.text
  }));

  const prompt = `วิเคราะห์ผลสอบชุดนี้: ${JSON.stringify(history)} ให้สรุปผลเป็นภาษาไทย บอกจุดแข็ง จุดที่ต้องระวัง และคำแนะนำในการติวเพิ่มเติม`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
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
  
  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      summary: "ไม่สามารถวิเคราะห์ข้อมูลได้",
      strengths: [],
      weaknesses: [],
      readingAdvice: "ลองทำข้อสอบใหม่อีกครั้ง"
    };
  }
}
