
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
  const [isAuthError, setIsAuthError] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string>("");

  useEffect(() => {
    // 1. Initial check for API Key availability
    const checkKey = async () => {
      try {
        if ((window as any).aistudio?.hasSelectedApiKey) {
          const selected = await (window as any).aistudio.hasSelectedApiKey();
          setHasKey(selected);
        }
      } catch (e) {
        console.error("Initial key check failed", e);
      }
    };
    checkKey();

    // 2. Load User Session from Storage
    try {
      const savedUser = sessionStorage.getItem('questup_user');
      if (savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
        setView('setup');
      }
    } catch (e) {
      console.error("Session load error", e);
    }
  }, []);

  const handleConnectKey = async () => {
    try {
      if ((window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        // Reset error states immediately after triggering dialog (Race condition handling)
        setHasKey(true);
        setIsAuthError(false);
        setErrorDetail("");
      }
    } catch (e) {
      console.error("Failed to open key selection dialog", e);
      alert("ไม่สามารถเปิดหน้าต่างเลือก Key ได้ กรุณาลองใหม่อีกครั้ง");
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
      const msg = err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      console.error("API Error caught in App:", msg);
      setErrorDetail(msg);

      // Handle specific Google API Errors related to Keys/Billing
      if (
        msg.includes("not found") || 
        msg.includes("API key") || 
        msg.includes("403") || 
        msg.includes("401") || 
        msg.includes("billing")
      ) {
        setIsAuthError(true);
        setHasKey(false);
      } else {
        alert("ไม่สามารถสร้างข้อสอบได้: " + msg);
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
      
      {/* Error Overlay for Key/Billing issues */}
      {(!hasKey || isAuthError) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl border-b-[12px] border-indigo-600 animate-slideUp">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-6">
              <i className="fas fa-plug text-3xl"></i>
            </div>
            
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase italic">
              เชื่อมต่อ AI ติวสอบ
            </h2>
            
            <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8 border border-slate-100">
              <p className="text-sm text-slate-600 font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-info-circle text-indigo-500"></i> วิธีแก้ไข:
              </p>
              <ul className="text-xs text-slate-500 space-y-3">
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>กดปุ่ม <b>"อัปเดตการเชื่อมต่อ"</b> และเลือก API Key จากโปรเจกต์ที่ผูกบัตรเครดิตแล้ว</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>หากยังใช้งานไม่ได้ ให้ตรวจสอบสถานะ Billing ใน Google AI Studio</span>
                </li>
              </ul>
              {errorDetail && (
                <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-400 uppercase mb-1">System Error:</p>
                  <p className="text-[10px] text-rose-600 font-mono break-all leading-tight">{errorDetail}</p>
                </div>
              )}
            </div>

            <button 
              onClick={handleConnectKey}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              อัปเดตการเชื่อมต่อ <i className="fas fa-bolt"></i>
            </button>
            
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noreferrer"
              className="inline-block mt-6 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest"
            >
              ดูวิธีตั้งค่า Billing <i className="fas fa-external-link-alt ml-1"></i>
            </a>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {isLoading && (
          <div className="fixed inset-0 bg-white/90 z-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mt-6">QuestUp is Generating...</h3>
            <p className="text-slate-400 text-sm mt-2 font-bold">กำลังวิเคราะห์เนื้อหาและเก็งข้อสอบให้คุณ</p>
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

      {/* Floating Status / Re-connect Button */}
      {view !== 'login' && (
        <button 
          onClick={handleConnectKey}
          className="fixed bottom-6 right-6 z-[60] bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-2xl shadow-xl text-[10px] font-black text-slate-500 hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-2 group"
        >
          <div className={`w-2 h-2 rounded-full ${isAuthError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          RE-CONNECT AI <i className="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-500"></i>
        </button>
      )}
    </div>
  );
}
