
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
    const checkAuth = async () => {
      // 1. ตรวจสอบ API Key ทันที
      const apiKey = process.env.API_KEY;
      const isKeySet = apiKey && apiKey !== "undefined" && apiKey !== "";
      
      if (!isKeySet) {
        try {
          const aiStudioKey = await (window as any).aistudio?.hasSelectedApiKey();
          if (!aiStudioKey) setHasKey(false);
        } catch (e) {
          setHasKey(false);
        }
      }

      // 2. โหลด User
      const saved = sessionStorage.getItem('questup_user');
      if (saved && saved !== 'undefined') {
        try {
          setUser(JSON.parse(saved));
          setView('setup');
        } catch(e) {}
      }
    };
    checkAuth();
  }, []);

  const handleConnectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
      window.location.reload(); // รีโหลดเพื่อให้แอปใช้ Key ใหม่
    } else {
      setHasKey(false);
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
      if (err.message?.includes("AUTH_REQUIRED")) {
        setHasKey(false);
      } else {
        setError(err.message || "เกิดข้อผิดพลาด");
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

      {!hasKey && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-xl w-full shadow-2xl border-b-[16px] border-indigo-600 animate-slideUp text-center">
            <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-600 mx-auto mb-8">
              <i className="fas fa-plug text-4xl"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter italic uppercase">AI ยังไม่พร้อมทำงาน</h2>
            <p className="text-slate-500 mb-8 font-medium">กรุณาตั้งค่า API_KEY ใน Netlify หรือเลือก Key จาก AI Studio ก่อนเริ่มภารกิจ</p>
            
            <div className="space-y-4">
              <button onClick={handleConnectKey} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                เลือก API Key (AI Studio)
              </button>
              <button onClick={() => window.location.reload()} className="w-full py-6 bg-slate-800 text-white rounded-3xl font-black text-xl shadow-xl transition-all active:scale-95">
                ตั้งค่าใน Netlify แล้ว (คลิกเพื่อรีโหลด)
              </button>
            </div>
            <p className="mt-8 text-[10px] text-slate-300 font-black tracking-widest uppercase">
              How to: Netlify > Site Settings > Env Variables > API_KEY
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading && (
          <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center animate-fadeIn">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-black text-slate-800 italic">QuestUp AI กำลังทำงาน...</h3>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-between">
            <span className="font-bold">⚠️ {error}</span>
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
