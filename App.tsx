
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
  
  // ปรับให้เริ่มต้นเป็น true เสมอ เพื่อให้ผู้ใช้ได้ลองกดใช้งานก่อน
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isBillingError, setIsBillingError] = useState<boolean>(false);

  useEffect(() => {
    // โหลดข้อมูลผู้ใช้จาก Session
    try {
      const savedUser = sessionStorage.getItem('questup_user');
      if (savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
        setView('setup');
      }
    } catch (e) {
      console.error("Failed to load user session", e);
    }
  }, []);

  const handleConnectKey = async () => {
    try {
      // เรียกหน้าต่างเลือก Key
      if ((window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        // กฎสำคัญ: หลังจาก trigger openSelectKey ให้ถือว่าสำเร็จและไปต่อได้เลย
        setHasKey(true);
        setIsBillingError(false);
        // รีเฟรชหน้าเพื่อให้ Instance ของ Gemini โหลด Key ใหม่
        setTimeout(() => window.location.reload(), 300);
      }
    } catch (e) {
      console.error("Connection failed", e);
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
    setIsBillingError(false);

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
      const msg = err.message || "";
      console.error("API Error Trace:", msg);

      // ถ้าเกิด Error เกี่ยวกับ Key หรือ Billing จริงๆ ค่อยโชว์หน้าแจ้งเตือน
      if (msg.includes("billing") || msg.includes("403") || msg.includes("not found") || msg.includes("API_KEY_INVALID") || msg.includes("project")) {
        setIsBillingError(true);
        setHasKey(false);
      } else {
        alert("ระบบขัดข้องชั่วคราว (ลองเปลี่ยนไปใช้ไฟล์ขนาดเล็กลง): " + msg);
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
      
      {/* หน้าจอแจ้งเตือน (Overlay) - จะปรากฏเฉพาะเมื่อกดแล้ว "พัง" จริงๆ เท่านั้น */}
      {isBillingError && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl border-t-[12px] border-indigo-600 animate-slideUp">
            <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-600 mx-auto mb-8">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">
              ตรวจพบปัญหาการเชื่อมต่อ
            </h2>
            
            <div className="bg-slate-50 rounded-3xl p-6 text-left mb-8 border border-slate-100">
              <p className="text-sm text-slate-700 font-bold mb-4">วิธีแก้ไข:</p>
              <ul className="text-xs text-slate-500 space-y-4 font-medium">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                  <span>ไปที่ <b>Google AI Studio</b> และสร้าง API Key ใหม่ โดยเลือกโปรเจกต์ที่คุณผูกบัตรเครดิตไว้แล้ว (เช่น ตัวที่คุณใช้ในภาพ)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                  <span>กดปุ่ม <b>"อัปเดตการเชื่อมต่อ"</b> แล้วเลือก Key ตัวนั้นครับ</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={handleConnectKey}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4"
            >
              อัปเดตการเชื่อมต่อ <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {isLoading && (
          <div className="fixed inset-0 bg-white/90 z-50 flex flex-col items-center justify-center animate-fadeIn">
            <div className="w-20 h-20 relative mb-6">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-bolt text-indigo-600 animate-pulse text-2xl"></i>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">QuestUp is generating...</h3>
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

      {/* แถบสถานะมุมขวาล่างที่กดได้เสมอ */}
      <button 
        onClick={handleConnectKey}
        className="fixed bottom-6 right-6 z-[60] bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-2xl shadow-xl text-[10px] font-black text-slate-500 hover:bg-white transition-all active:scale-95 flex items-center gap-2"
      >
        <div className={`w-2 h-2 rounded-full ${isBillingError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
        AI KEY MANAGER
      </button>
    </div>
  );
}
