
import { GoogleGenAI, Type } from "@google/genai";
import { ReferenceFile, Grade, Language, Question, AnalysisResult } from "../types.ts";

export async function generateExamFromFile(
  files: ReferenceFile[],
  grade: Grade,
  language: Language,
  count: number,
  weakTopics?: string[]
): Promise<Question[]> {
  // Always create a new instance to use the most recent key from the environment/dialog
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare file data
  const contentParts: any[] = files.map(f => ({
    inlineData: {
      data: f.data.split(',')[1] || f.data,
      mimeType: f.mimeType
    }
  }));

  const systemInstruction = `คุณคือผู้ช่วยติวเตอร์ AI ระดับโลก หน้าที่ของคุณคือวิเคราะห์เนื้อหาจากเอกสารที่ผู้ใช้ส่งมา (เช่น ใบงาน สรุปเนื้อหา หรือหนังสือเรียน) 
เพื่อสร้างข้อสอบปรนัย (4 ตัวเลือก) ที่มีคุณภาพสูงและตรงตามเนื้อหาที่ปรากฏในรูปภาพหรือไฟล์`;

  const userPrompt = `โปรดสร้างข้อสอบปรนัยจำนวน ${count} ข้อ สำหรับนักเรียนระดับชั้น ${grade} สื่อสารด้วยภาษา ${language === 'Thai' ? 'ไทย' : 'อังกฤษ'} 
โดยวิเคราะห์จากเอกสารที่แนบมานี้

ข้อกำหนด:
1. ข้อสอบต้องเน้นเนื้อหาที่สำคัญจากรูปภาพ/ไฟล์ที่ส่งมา
2. ระดับความยากต้องเหมาะสมกับเด็กชั้น ${grade}
3. สำหรับวิชาภาษาไทย (ถ้ามี) ให้เน้นหลักการใช้ภาษา มาตราตัวสะกด และการอ่านตามภาพ
4. ต้องมีเฉลยที่ถูกต้องและคำอธิบายประกอบที่เข้าใจง่ายสำหรับเด็ก
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
    console.error("Failed to parse JSON from AI response:", text);
    throw new Error("AI ส่งข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
  }
}

export async function analyzeExamResults(
  questions: Question[], 
  userAnswers: (number | null)[]
): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const history = questions.map((q, i) => ({
    topic: q.topic,
    correct: q.correctIndex === userAnswers[i],
    question: q.text
  }));

  const prompt = `วิเคราะห์ผลสอบชุดนี้: ${JSON.stringify(history)}
ให้สรุปผลเป็นภาษาไทย บอกจุดแข็ง จุดที่ต้องระวัง และคำแนะนำในการติวเพิ่มเติมให้น้องเก่งขึ้น`;

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
    console.error("Failed to parse analysis JSON:", response.text);
    return {
      summary: "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้",
      strengths: [],
      weaknesses: [],
      readingAdvice: "ลองทำข้อสอบใหม่อีกครั้งเพื่อให้ AI ช่วยวิเคราะห์"
    };
  }
}
