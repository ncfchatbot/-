
import React, { useState } from 'react';
import { Grade, Language, ReferenceFile } from '../types';

interface SetupFormProps {
  onStart: (files: ReferenceFile[], grade: Grade, lang: Language, count: number) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
  const [files, setFiles] = useState<ReferenceFile[]>([]);
  const [grade, setGrade] = useState<Grade>('G1');
  const [lang, setLang] = useState<Language>('Thai');
  const [count, setCount] = useState(10);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: ReferenceFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const f = e.target.files[i];
        const base64 = await toBase64(f);
        newFiles.push({ name: f.name, data: base64, mimeType: f.type });
      }
      setFiles([...files, ...newFiles]);
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const primaryGrades: Grade[] = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'];
  const secondaryGrades: Grade[] = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-slate-800 mb-2">เก็งข้อสอบตรงจุด 🚀</h1>
        <p className="text-slate-500">อัปโหลดแนวข้อสอบหรือชีทเรียน แล้วให้ AI ช่วยติวให้ตรงประเด็น</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="space-y-8">
          {/* File Upload Section */}
          <div className="relative group">
            <label className="block text-sm font-bold text-slate-700 mb-3">1. อัปโหลดไฟล์แนวข้อสอบ / หนังสือเรียน</label>
            <div className="border-2 border-dashed border-slate-200 group-hover:border-blue-400 rounded-2xl p-10 transition-all bg-slate-50/50 text-center relative overflow-hidden">
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
              />
              <div className="space-y-2">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-blue-600 border border-slate-100">
                  <i className="fas fa-file-upload text-2xl"></i>
                </div>
                <p className="text-slate-600 font-medium">ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์</p>
                <p className="text-xs text-slate-400">PDF, รูปถ่ายหน้าหนังสือ, Word, Excel</p>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm border border-blue-100 animate-slideUp">
                    <i className="far fa-file-alt"></i>
                    <span className="truncate max-w-[150px]">{f.name}</span>
                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">2. ระดับชั้น (Grade / Matayom)</label>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Primary (ประถม)</p>
                  <div className="grid grid-cols-6 gap-2">
                    {primaryGrades.map(g => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`py-2 rounded-lg border-2 text-sm transition-all font-bold ${
                          grade === g ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Secondary (มัธยม)</p>
                  <div className="grid grid-cols-6 gap-2">
                    {secondaryGrades.map(g => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`py-2 rounded-lg border-2 text-sm transition-all font-bold ${
                          grade === g ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">3. ภาษาของข้อสอบ</label>
                <div className="flex gap-2">
                  {(['Thai', 'English'] as Language[]).map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${
                        lang === l ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {l === 'Thai' ? 'ภาษาไทย' : 'English'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">* เฉลยจะเป็นภาษาไทยเสมอเพื่อความเข้าใจง่าย</p>
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                   <label className="block text-sm font-bold text-slate-700">4. จำนวนข้อสอบ</label>
                   <span className="text-xl font-black text-blue-600">{count} ข้อ</span>
                </div>
                <input 
                  type="range" min="1" max="50" value={count} 
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 uppercase">
                  <span>1 ข้อ</span>
                  <span>50 ข้อ</span>
                </div>
              </div>
            </div>
          </div>

          <button
            disabled={files.length === 0}
            onClick={() => onStart(files, grade, lang, count)}
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            สร้างชุดข้อสอบ QuestUpMan <i className="fas fa-bolt ml-2"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupForm;
