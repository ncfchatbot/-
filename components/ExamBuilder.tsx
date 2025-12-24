
import React, { useState } from 'react';
import { SUBJECTS, CHAPTERS } from '../constants';
import { School, ProgramType, Subject } from '../types';

interface ExamBuilderProps {
  school: School;
  program: ProgramType;
  onGenerate: (subject: Subject, selectedChapters: string[]) => void;
}

const ExamBuilder: React.FC<ExamBuilderProps> = ({ school, program, onGenerate }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

  const toggleChapter = (title: string) => {
    setSelectedChapters(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const currentChapters = selectedSubject 
    ? CHAPTERS.filter(c => c.subjectId === selectedSubject.id)
    : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
        <div>
          <p className="opacity-80 text-sm">โรงเรียน: {school.name}</p>
          <h2 className="text-2xl font-bold">สร้างชุดข้อสอบจำลอง</h2>
        </div>
        <div className="bg-white/20 px-4 py-2 rounded-xl text-sm font-medium">
          {program} Program
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-4">เลือกวิชา</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SUBJECTS.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSubject(s);
                setSelectedChapters([]);
              }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                selectedSubject?.id === s.id 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                : 'border-white bg-white shadow-sm hover:border-indigo-200 text-slate-600'
              }`}
            >
              <div className="w-12 h-12 mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                <i className={`fas ${s.id === 'math' ? 'fa-calculator' : s.id === 'sci' ? 'fa-flask' : s.id === 'eng' ? 'fa-language' : 'fa-book'} text-xl`}></i>
              </div>
              <span className="font-bold">{s.name}</span>
              <span className="text-xs opacity-60">{s.nameEn}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedSubject && (
        <section className="animate-slideUp">
          <h3 className="text-lg font-bold text-slate-800 mb-4">เลือกบทเรียนที่จะสอบ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentChapters.map(c => {
              const title = program === ProgramType.Standard ? c.title : c.titleEn || c.title;
              return (
                <button
                  key={c.id}
                  onClick={() => toggleChapter(title)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    selectedChapters.includes(title)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    selectedChapters.includes(title) ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                  }`}>
                    {selectedChapters.includes(title) && <i className="fas fa-check text-xs"></i>}
                  </div>
                  <span className="font-medium">{title}</span>
                </button>
              );
            })}
          </div>
          
          {currentChapters.length === 0 && (
            <p className="text-slate-400 italic">ขออภัย ยังไม่มีคลังข้อมูลบทเรียนสำหรับวิชานี้</p>
          )}

          <div className="mt-8 flex justify-center">
            <button
              disabled={selectedChapters.length === 0}
              onClick={() => onGenerate(selectedSubject, selectedChapters)}
              className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              สร้างข้อสอบด้วย AI <i className="fas fa-magic ml-2"></i>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ExamBuilder;
