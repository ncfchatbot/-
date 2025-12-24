
import React, { useState, useEffect } from 'react';
import { ViewState, ExamSession, Question, Grade, Language, ReferenceFile, User } from './types.ts';
import Header from './components/Header.tsx';
import SetupForm from './components/SetupForm.tsx';
import Quiz from './components/Quiz.tsx';
import Analysis from './components/Analysis.tsx';
import Login from './components/Login.tsx';
import { generateExamFromFile } from './services/geminiService.ts';

const isKeyEmpty = (k: any) => !k || String(k).trim() === "" || String(k) === "undefined" || String(k) === "null";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [session, setSession] = useState<ExamSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [errorDetail, setErrorDetail] = useState<string>("");

  useEffect(() => {
    const checkInitialKey = async () => {
      const envKey = process.env.API_KEY;
      
      // 1. ตรวจสอบใน Environment Variable ก่อน (สำหรับ Netlify)
      if (!isKeyEmpty(envKey)) {
        setHasKey(true);
        return;
      }

      // 2. ถ้าไม่มี ให้เช็คว่าอยู่ใน AI Studio หรือไม่
      try {
        if ((window as any).aistudio?.hasSelectedApiKey) {
          const selected = await (window as any).aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } else {
          // ถ้าไม่มีทั้งคู่และไม่ใช่ AI Studio
          setHasKey(false);
        }
      } catch (e) {
        setHasKey(false);
      }
    };
    
    checkInitialKey();

    try {
      const savedUser = sessionStorage.getItem('questup_user');
      if (savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
        setView('setup');
      }
    } catch (e) {}
  }, []);

  const handleConnectKey = async () => {
    // ถ้ามีฟังก์ชัน openSelectKey ให้เรียก (กรณีรันใน AI Studio)
    if ((window as any).aistudio?.openSelectKey) {
      try {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
        setErrorDetail("");
      } catch (e) {
        console.error("Failed to open key dialog:", e);
      }
    } else {
      // กรณีรันบน Netlify ให้แสดงคำแนะนำแทนการใช้ Alert
      setErrorDetail("แอปตรวจไม่พบ API Key ใน Environment Variables ของ Netlify กรุณาเพิ่มตัวแปร 'API_KEY' ในหน้า Admin ของคุณ");
      setHasKey(false);
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    sessionStorage.setItem('questup_user', JSON.stringify(newUser));
    setView('setup');
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('questup_user');
    setView('login');
  };

  const handleStartExam = async (files: ReferenceFile[], grade: Grade, lang: Language, count: number, weakTopics?: string[]) => {
    if (isKeyEmpty(process.env.API_KEY)) {
      // ลองเช็ค fallback อีกรอบ
      let aistudioHasKey = false;
      try { aistudioHasKey = await (window as any).aistudio?.hasSelectedApiKey(); } catch(e) {}
      
      if (!aistudioHasKey) {
        setHasKey(false);
        return;
      }
    }

    if (!user) return;
    setIsLoading(true);
    setErrorDetail("");

    try {
      const questions = await generateExamFromFile(files, grade, lang, count, weakTopics);
      setSession({
        userId: user.id,
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
      const msg = err.message || "Unknown Error";
      if (msg.includes("MISSING_KEY") || msg.includes("API key")) {
        setHasKey(false);
      } else {
        alert("ขออภัย! ระบบขัดข้อง: " + msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteQuiz = (finalAnswers: (number | null)[], finalScore: number) => {
    setUserAnswers(finalAnswers);
    if (session) {
      setSession({ ...session, currentScore: finalScore });
    }
    setView('analysis');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Kanit']">
      <Header 
        user={user} 
        onHome={() => setView('setup')} 
        onLogout={handleLogout} 
        onManageKey={handleConnectKey}
      />
      
      {/* Key Missing Overlay - สวยงามและไม่ขวางกั้นถ้าไม่ได้รันใน AI Studio */}
      {!hasKey && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-xl w-full text-center shadow-2xl border-b-[16px] border-indigo-600 animate-slideUp">
            <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-600 mx-auto mb-8">
               <i className="fas fa-satellite-dish text-4xl"></i>
            </div>
            
            <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter uppercase italic">
              ขาดการเชื่อมต่อ AI
            </h2>
            
            <div className="bg-slate-50 rounded-[2rem] p-8 text-left mb-10 border border-slate-100">
              <p className="text-base text-slate-700 font-bold mb-4">
                <i className="fas fa-exclamation-triangle text-amber-500 mr-2"></i> กรุณาตั้งค่าตามสถานะของคุณ:
              </p>
              <ul className="text-sm text-slate-500 space-y-4 font-medium">
                <li className="flex gap-3">
                  <span className="text-indigo-600 font-black">●</span>
                  <span><b>สำหรับ Netlify:</b> ไปที่ <i>Site Settings > Environment Variables</i> แล้วเพิ่ม <code>API_KEY</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-600 font-black">●</span>
                  <span><b>สำหรับ AI Studio:</b> กดปุ่มเลือก Key ด้านล่างนี้</span>
                </li>
              </ul>
              {errorDetail && (
                <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-100 text-[11px] text-rose-600 font-mono italic">
                  {errorDetail}
                </div>
              )}
            </div>

            {(window as any).aistudio?.openSelectKey ? (
              <button 
                onClick={handleConnectKey}
                className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-5"
              >
                เชื่อมต่อ API Key <i className="fas fa-bolt"></i>
              </button>
            ) : (
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                กรุณาตั้งค่า Environment Variable บนโฮสต์ของคุณ
              </div>
            )}
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {isLoading && (
          <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-3xl font-black text-slate-800 italic">QuestUp AI is Analysing...</h3>
          </div>
        )}

        {view === 'login' && <Login onLogin={handleLogin} />}
        {view === 'setup' && user && <SetupForm onStart={handleStartExam} />}
        {view === 'quiz' && session && (
          <Quiz questions={session.questions} language={session.language} onComplete={handleCompleteQuiz} />
        )}
        {view === 'analysis' && session && (
          <Analysis 
            questions={session.questions} 
            answers={userAnswers} 
            onRetry={() => setView('setup')}
            onFocusWeakness={(w) => handleStartExam(session.files, session.grade, session.language, session.questionCount, w)}
          />
        )}
      </main>

      <button 
        onClick={handleConnectKey}
        className="fixed bottom-8 right-8 z-[60] bg-white/90 backdrop-blur-xl border-2 border-slate-200 px-6 py-3 rounded-[2rem] shadow-2xl text-[10px] font-black text-slate-600 hover:text-indigo-600 transition-all flex items-center gap-3"
      >
        <div className={`w-3 h-3 rounded-full ${!hasKey ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></div>
        {!hasKey ? 'CONNECT AI' : 'AI READY'} <i className="fas fa-sync-alt"></i>
      </button>
    </div>
  );
}
