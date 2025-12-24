
import { GoogleGenAI, Type } from "@google/genai";
import { ReferenceFile, Grade, Language, Question, AnalysisResult } from "../types";

// Function to handle exponential backoff retry for high volume traffic
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status === 503)) {
      console.warn(`API Rate limit hit, retrying in ${delay}ms...`);
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fileParts = files.map(f => ({
    inlineData: {
      data: f.data.split(',')[1] || f.data,
      mimeType: f.mimeType
    }
  }));

  const targetingPrompt = weakTopics && weakTopics.length > 0 
    ? `IMPORTANT: This is a RECOVERY EXAM for a specific student profile. Specifically focus on these weak topics: ${weakTopics.join(', ')}.`
    : "Generate a personalized exam based on the provided study materials for a single student.";

  const prompt = `You are a Thai curriculum expert and tutor for Grade ${grade}.
  Task: ${targetingPrompt}
  Exam Language: ${language}
  Question Count: ${count}

  Context: The attached files are study materials. 
  
  CRITICAL INSTRUCTION:
  - Generate exactly ${count} multiple choice questions.
  - The "explanation" field MUST be written in Thai. 
  - The Thai explanation should be very easy to understand (ภาษาเข้าใจง่าย) for a student at the ${grade} level.
  - If the Exam Language is English, the questions/options must be English, but the EXPLANATION must be Thai.

  Return a JSON array of objects.`;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          ...fileParts,
          { text: prompt }
        ]
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

    const data = JSON.parse(response.text || "[]");
    return data.map((q: any, i: number) => ({ ...q, id: `q-${Date.now()}-${i}-${Math.random()}` }));
  });
}

export async function analyzeExamResults(
  questions: Question[], 
  userAnswers: (number | null)[]
): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const history = questions.map((q, i) => ({
    topic: q.topic,
    correct: q.correctIndex === userAnswers[i]
  }));

  const prompt = `Analyze these exam results for a specific student: ${JSON.stringify(history)}.
  1. Summarize performance in Thai.
  2. Identify specific strengths (topics).
  3. Identify weak topics (critical for recovery).
  4. Provide reading advice to improve.
  
  Everything must be in friendly, easy-to-read Thai language.
  Return as JSON.`;

  return withRetry(async () => {
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
    return JSON.parse(response.text || "{}");
  });
}
