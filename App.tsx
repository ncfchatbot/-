
import React, { useState, useEffect } from 'react';
import { ViewState, ExamSession, Question, Grade, Language, ReferenceFile, User } from './types.ts';
import Header from './components/Header.tsx';
import SetupForm from './components/SetupForm.tsx';
import Quiz from './components/Quiz.tsx';
import Analysis from './components/Analysis.tsx';
import Login from './components/Login.tsx';
import { generateExamFromFile } from './services/geminiService.ts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [session, setSession] = useState<ExamSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      // ตรวจสอบ API Key
      const key = process.env.API_KEY;
      if (!key || key === "" || key === "undefined") {
        // ถ้าไม่มีใน env ให้ลองเช็ค AI Studio Bridge
        try {
          const selected = await (window as any).aistudio?.hasSelectedApiKey();
          setHasKey(!!selected);
        } catch (e) {
          setHasKey(false);
        }
      } else {
        setHasKey(true);
      }

      // โหลดข้อมูลผู้ใช้
      const saved = sessionStorage.getItem('questup_user');
      if (saved && saved !== 'undefined') {
        try {
          setUser(JSON.parse(saved));
          setView('setup');
        } catch(e) {}
      }
    };
    initApp();
  }, []);

  const handleConnectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
      setError(null);
    } else {
      // ถ้าไม่อยู่ใน AI Studio ให้บอกวิธีเซตใน Netlify
      alert("กรุณาตั้งค่า API_KEY ใน Netlify Environment Variables");
    }
  };

  const handleStartExam = async (files: ReferenceFile[], grade: Grade, lang: Language, count: number, weakTopics?: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const questions = await generateExamFromFile(files, grade, lang, count, weakTopics);
      setSession({
        userId: user?.id || 'guest',
        files,
        grade,
        language: lang,
        questionCount: count,
        questions,
        currentScore: 0,
        weakTopicsFromPrevious: weakTopics
      });
      setUserAnswers(new Array(questions.length).fill(null));
      setView('quiz');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("AUTH_REQUIRED") || err.message?.includes("API key")) {
        setHasKey(false);
      } else {
        setError(err.message || "เกิดข้อผิดพลาดในการติดต่อ AI");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Kanit']">
      <Header 
        user={user} 
        onHome={() => { setView('setup'); setError(null); }} 
        onLogout={() => { setUser(null); sessionStorage.clear(); setView('login'); }} 
        onManageKey={handleConnectKey} 
      />

      {/* หน้ากากป้องกัน API Key หาย (จะไม่ขาวโพลนแล้ว) */}
      {!hasKey && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border-b-[12px] border-indigo-600 animate-slideUp text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-6">
              <i className="fas fa-key text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4">เชื่อมต่อ AI ไม่สำเร็จ</h2>
            <p className="text-slate-500 mb-8 text-sm">เราไม่พบ API Key ในระบบของคุณ กรุณาตรวจสอบการตั้งค่าใน Netlify หรือเลือก Key จาก AI Studio</p>
            
            <div className="grid grid-cols-1 gap-3">
              <button onClick={handleConnectKey} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">
                เชื่อมต่อผ่าน AI Studio
              </button>
              <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black transition-all">
                ฉันตั้งค่าใน Netlify แล้ว (รีโหลด)
              </button>
            </div>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="inline-block mt-6 text-xs text-indigo-500 font-bold underline">อ่านวิธีตั้งค่า API Key</a>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading && (
          <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center animate-fadeIn">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-black text-slate-800 italic">AI กำลังวิเคราะห์ชีทเรียน...</h3>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-between animate-slideUp">
            <span className="font-bold text-sm">⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-rose-400"><i className="fas fa-times"></i></button>
          </div>
        )}

        {view === 'login' && <Login onLogin={(u) => { setUser(u); sessionStorage.setItem('questup_user', JSON.stringify(u)); setView('setup'); }} />}
        {view === 'setup' && user && <SetupForm onStart={handleStartExam} />}
        {view === 'quiz' && session && <Quiz questions={session.questions} language={session.language} onComplete={(ans, sc) => { setUserAnswers(ans); setSession({...session, currentScore: sc}); setView('analysis'); }} />}
        {view === 'analysis' && session && <Analysis questions={session.questions} answers={userAnswers} onRetry={() => setView('setup')} onFocusWeakness={(w) => handleStartExam(session.files, session.grade, session.language, session.questionCount, w)} />}
      </main>
    </div>
  );
}
