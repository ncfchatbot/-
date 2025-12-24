
import React, { useState, useEffect } from 'react';
import { ViewState, ExamSession, Question, Grade, Language, ReferenceFile, User } from './types';
import Header from './components/Header';
import SetupForm from './components/SetupForm';
import Quiz from './components/Quiz';
import Analysis from './components/Analysis';
import Login from './components/Login';
import { generateExamFromFile } from './services/geminiService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [session, setSession] = useState<ExamSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

  // Simulate persistent login within session
  useEffect(() => {
    const savedUser = sessionStorage.getItem('questupman_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView('setup');
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    sessionStorage.setItem('questupman_user', JSON.stringify(newUser));
    setView('setup');
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('questupman_user');
    setView('login');
  };

  const handleStartExam = async (files: ReferenceFile[], grade: Grade, lang: Language, count: number, weakTopics?: string[]) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const questions = await generateExamFromFile(files, grade, lang, count, weakTopics);
      if (questions.length === 0) {
         throw new Error("Could not generate questions");
      }
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
    } catch (err) {
      alert("AI ไม่สามารถสร้างข้อสอบได้ในขณะนี้เนื่องจากปริมาณการใช้งานสูง (Rate Limit) กรุณาลองใหม่อีกครั้งใน 1 นาที");
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

  const handleRetryWithWeaknesses = (weaknesses: string[]) => {
    if (session) {
      handleStartExam(session.files, session.grade, session.language, session.questionCount, weaknesses);
    }
  };

  const resetToSetup = () => {
    setSession(null);
    setView('setup');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Kanit']">
      <Header user={user} onHome={resetToSetup} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-robot text-blue-600 text-2xl animate-bounce"></i>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">QuestUpMan กำลังประมวลผลให้คุณ</h2>
            <p className="text-slate-500 max-w-sm">
              เรากำลังแยกส่วนประมวลผลสำหรับคิวของคุณ เพื่อรองรับการใช้งานพร้อมกันจำนวนมาก...
            </p>
          </div>
        )}

        {view === 'login' && <Login onLogin={handleLogin} />}
        {view === 'setup' && user && <SetupForm onStart={handleStartExam} />}
        
        {view === 'quiz' && session && (
          <Quiz 
            questions={session.questions} 
            language={session.language}
            onComplete={handleCompleteQuiz} 
          />
        )}
        
        {view === 'analysis' && session && (
          <Analysis 
            questions={session.questions} 
            answers={userAnswers} 
            onRetry={resetToSetup}
            onFocusWeakness={handleRetryWithWeaknesses}
          />
        )}
      </main>
    </div>
  );
}
