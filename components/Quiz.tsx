
import React, { useState } from 'react';
import { Question, Language } from '../types';

interface QuizProps {
  questions: Question[];
  language: Language;
  onComplete: (answers: (number | null)[], score: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, language, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = idx;
    setAnswers(newAnswers);

    if (idx === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
    } else {
      onComplete(answers, score);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
            {currentIndex + 1}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">กำลังทำข้อสอบ</h3>
            <p className="text-xs text-slate-400">โหมด: {language}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-blue-600">คะแนน: {score}</p>
          <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full mb-3 uppercase tracking-tighter">
              TOPIC: {currentQuestion.topic}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
              {currentQuestion.text}
            </h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              let btnClass = "border-slate-100 hover:border-blue-200 text-slate-600";
              let icon = null;

              if (isAnswered) {
                if (idx === currentQuestion.correctIndex) {
                  btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700";
                  icon = <i className="fas fa-check-circle text-emerald-500"></i>;
                } else if (idx === selectedIdx) {
                  btnClass = "border-rose-500 bg-rose-50 text-rose-700";
                  icon = <i className="fas fa-times-circle text-rose-500"></i>;
                } else {
                  btnClass = "opacity-40 grayscale pointer-events-none";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center group relative overflow-hidden ${btnClass}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black mr-4 ${
                    isAnswered && idx === currentQuestion.correctIndex ? 'bg-emerald-500 text-white' : 
                    isAnswered && idx === selectedIdx ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-bold flex-1">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-slideUp">
              <div className="flex items-center gap-2 mb-2">
                <i className={`fas ${selectedIdx === currentQuestion.correctIndex ? 'fa-lightbulb text-amber-500' : 'fa-exclamation-circle text-blue-500'}`}></i>
                <span className="font-black text-slate-800 uppercase tracking-wide">
                  {selectedIdx === currentQuestion.correctIndex ? 'ทำไมถึงถูก?' : 'มาดูเฉลยกัน'}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {currentQuestion.explanation}
              </p>
              
              <button
                onClick={handleNext}
                className="w-full mt-6 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {currentIndex === questions.length - 1 ? 'ดูผลวิเคราะห์รวม' : 'ทำข้อต่อไป'} 
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
