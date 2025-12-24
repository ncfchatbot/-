
import React, { useState } from 'react';
import { SCHOOLS, GRADES } from '../constants';
import { School, ProgramType } from '../types';

interface SchoolSelectorProps {
  onComplete: (school: School, program: ProgramType, grade: string) => void;
}

const SchoolSelector: React.FC<SchoolSelectorProps> = ({ onComplete }) => {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramType | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('');

  const handleNext = () => {
    if (selectedSchool && selectedProgram && selectedGrade) {
      onComplete(selectedSchool, selectedProgram, selectedGrade);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">เลือกโปรไฟล์ของน้อง</h2>
        <p className="text-slate-500">เพื่อปรับความยากและแนวข้อสอบให้ตรงกับโรงเรียนของลูกคุณ</p>
      </div>

      <div className="space-y-6">
        {/* School Select */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">1. ค้นหาโรงเรียน</label>
          <select 
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => {
              const s = SCHOOLS.find(sc => sc.id === e.target.value);
              setSelectedSchool(s || null);
              setSelectedProgram(null); // reset program
            }}
            value={selectedSchool?.id || ''}
          >
            <option value="">-- เลือกโรงเรียน --</option>
            {SCHOOLS.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.affiliation})</option>
            ))}
          </select>
        </div>

        {/* Program Select */}
        {selectedSchool && (
          <div className="animate-slideUp">
            <label className="block text-sm font-semibold text-slate-700 mb-2">2. หลักสูตรที่เรียน</label>
            <div className="grid grid-cols-2 gap-4">
              {selectedSchool.programs.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedProgram(p)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedProgram === p 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' 
                    : 'border-slate-100 hover:border-blue-200 text-slate-600'
                  }`}
                >
                  <div className="font-bold">{p}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grade Select */}
        {selectedProgram && (
          <div className="animate-slideUp">
            <label className="block text-sm font-semibold text-slate-700 mb-2">3. ระดับชั้น</label>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {GRADES.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`py-2 rounded-lg border transition-all ${
                    selectedGrade === g 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          disabled={!selectedSchool || !selectedProgram || !selectedGrade}
          onClick={handleNext}
          className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          เริ่มเก็งข้อสอบกันเลย! <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};

export default SchoolSelector;
