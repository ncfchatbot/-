
import React, { useState, useEffect } from 'react';
import { ViewState, ExamSession, Question, Grade, Language, ReferenceFile, User } from './types.ts';
import Header from './components/Header.tsx';
import SetupForm from './components/SetupForm.tsx';
import Quiz from './components/Quiz.tsx';
import Analysis from './components/Analysis.tsx';
import Login from './components/Login.tsx';
import { generateExamFromFile } from './services/geminiService.ts';

// Helper สำหรับตรวจสอบ Key
const isKeyInvalid = (k: any) => !k || String(k).trim() === "" || String(k) === "undefined" || String(k) === "null";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [session, setSession] = useState<ExamSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  
  const [hasKey, setHasKey] = useState<boolean>(true); // เริ่มต้นเป็น true เพื่อไม่ให้ overlay กระพริบตอนโหลด
  const [isAuthError, setIsAuthError] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string>("");

  useEffect(() => {
    const checkInitialKey = async () => {
      const apiKey = process.env.API_KEY;
      let aistudioHasKey = false;
      
      try {
        if ((window as any).aistudio?.hasSelectedApiKey) {
          aistudioHasKey = await (window as any).aistudio.hasSelectedApiKey();
        }
      } catch (e) {}

      // ถ้าไม่มีทั้งใน env และไม่มีการเลือกผ่าน aistudio dialog
      if (isKeyInvalid(apiKey) && !aistudioHasKey) {
        setHasKey(false);
      } else {
        setHasKey(true);
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
    if (!(window as any).aistudio?.openSelectKey) {
      alert("แอปนี้ต้องรันผ่าน Google AI Studio หรือต้องตั้งค่า API_KEY ใน Environment Variables ของ Host (เช่น Netlify) เท่านั้น");
      return;
    }
    
    try {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
      setIsAuthError(false);
      setErrorDetail("");
    } catch (e) {
      console.error("Failed to open key dialog:", e);
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
    // ตรวจสอบ Key อีกครั้งก่อนเริ่มงาน
    if (isKeyInvalid(process.env.API_KEY)) {
      setHasKey(false);
      setIsAuthError(true);
      setErrorDetail("API Key หายไปจากระบบ (Missing from process.env.API_KEY)");
      return;
    }

    if (!user) return;
    setIsLoading(true);
    setIsAuthError(false);
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
      console.error("Quiz generation failed:", msg);
      
      // ดักจับ Error เฉพาะทางของ SDK
      if (msg.includes("API Key") || msg.includes("set when running in a browser")) {
        setHasKey(false);
        setIsAuthError(true);
        setErrorDetail("SDK แจ้งว่า API Key ยังไม่ได้ถูกติดตั้งใน Browser");
      } else {
        alert("ขออภัย! ไม่สามารถสร้างข้อสอบได้: " + msg);
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
      
      {/* Key Selection Overlay */}
      {!hasKey && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-xl w-full text-center shadow-2xl border-b-[16px] border-indigo-600 animate-slideUp">
            <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-600 mx-auto mb-8 relative">
               <i className="fas fa-key text-4xl"></i>
               <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center border-4 border-white animate-pulse">
                  <i className="fas fa-lock text-[10px]"></i>
               </div>
            </div>
            
            <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter uppercase italic">
              ติดตั้ง API Key
            </h2>
            
            <div className="bg-slate-50 rounded-[2rem] p-8 text-left mb-10 border border-slate-100">
              <p className="text-base text-slate-700 font-bold mb-4 flex items-center gap-3">
                <i className="fas fa-info-circle text-indigo-500"></i> ทำไมถึงเห็นหน้านี้?
              </p>
              <ul className="text-sm text-slate-500 space-y-4 font-medium leading-relaxed">
                <li>• หากคุณรันผ่าน <b>Netlify/Vercel</b>: คุณต้องตั้งค่า Environment Variable ชื่อ <code>API_KEY</code> ในหน้า Admin ของ Host นั้นๆ</li>
                <li>• หากคุณรันเพื่อ <b>Preview</b>: กรุณากดปุ่มด้านล่างเพื่อเลือก Key จากบัญชี Google ของคุณ</li>
              </ul>
              {errorDetail && (
                <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[11px] text-rose-600 font-mono break-all leading-tight">{errorDetail}</p>
                </div>
              )}
            </div>

            <button 
              onClick={handleConnectKey}
              className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-5"
            >
              เลือก API Key <i className="fas fa-bolt"></i>
            </button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {isLoading && (
          <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-3xl font-black text-slate-800 italic">QuestUp AI is Thinking...</h3>
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

      {/* Floating Status */}
      <button 
        onClick={handleConnectKey}
        className="fixed bottom-8 right-8 z-[60] bg-white/90 backdrop-blur-xl border-2 border-slate-200 px-6 py-3 rounded-[2rem] shadow-2xl text-[10px] font-black text-slate-600 hover:text-indigo-600 transition-all flex items-center gap-3"
      >
        <div className={`w-3 h-3 rounded-full ${isAuthError || !hasKey ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></div>
        {isAuthError || !hasKey ? 'KEY MISSING' : 'AI READY'} <i className="fas fa-sync-alt"></i>
      </button>
    </div>
  );
}
