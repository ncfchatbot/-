
import React, { useEffect, useState } from 'react';
import { Question, AnalysisResult } from '../types';
import { analyzeExamResults } from '../services/geminiService';

interface AnalysisProps {
  questions: Question[];
  answers: (number | null)[];
  onRetry: () => void;
  onFocusWeakness: (weaknesses: string[]) => void;
}

const Analysis: React.FC<AnalysisProps> = ({ questions, answers, onRetry, onFocusWeakness }) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  const correctCount = questions.reduce((acc, q, i) => acc + (q.correctIndex === answers[i] ? 1 : 0), 0);
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  useEffect(() => {
    async function init() {
      const res = await analyzeExamResults(questions, answers);
      setResult(res);
      setLoading(false);
    }
    init();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
          <i className="fas fa-chart-line text-blue-600 text-4xl"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-2">{scorePercent}%</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Hero Score</p>
        <p className="mt-4 text-slate-600">ทำถูกต้อง {correctCount} จาก {questions.length} ข้อ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
          <h3 className="text-lg font-black text-emerald-700 mb-4 uppercase flex items-center gap-2">
            <i className="fas fa-shield-alt"></i> จุดแข็ง (Hero Strengths)
          </h3>
          <div className="space-y-2">
            {loading ? <div className="h-20 animate-pulse bg-emerald-100/50 rounded-xl"></div> : 
              result?.strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-emerald-800 font-medium bg-white/50 px-3 py-2 rounded-lg">
                  <i className="fas fa-check text-xs"></i> {s}
                </div>
              ))
            }
          </div>
        </div>

        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
          <h3 className="text-lg font-black text-rose-700 mb-4 uppercase flex items-center gap-2">
            <i className="fas fa-heartbeat"></i> จุดอ่อน (Gap Areas)
          </h3>
          <div className="space-y-2">
            {loading ? <div className="h-20 animate-pulse bg-rose-100/50 rounded-xl"></div> : 
              result?.weaknesses.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-rose-800 font-medium bg-white/50 px-3 py-2 rounded-lg">
                  <i className="fas fa-exclamation-triangle text-xs text-rose-400"></i> {w}
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-xl shadow-indigo-100">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">AI แนะนำให้น้องโฟกัสจุดนี้!</h3>
            <p className="text-indigo-100 leading-relaxed mb-6">
              {loading ? "กำลังวิเคราะห์คำแนะนำ..." : result?.readingAdvice}
            </p>
            {!loading && result?.weaknesses.length! > 0 && (
              <button
                onClick={() => onFocusWeakness(result!.weaknesses)}
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3"
              >
                <i className="fas fa-crosshairs"></i> เก็งข้อสอบใหม่เพื่อแก้จุดอ่อน
              </button>
            )}
          </div>
          <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <i className="fas fa-user-ninja text-6xl"></i>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onRetry}
          className="text-slate-400 font-bold hover:text-slate-600 transition-colors"
        >
          <i className="fas fa-home mr-2"></i> กลับสู่หน้าแรก
        </button>
      </div>
    </div>
  );
};

export default Analysis;
