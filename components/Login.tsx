
import React, { useState, useRef } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        avatar: customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      };
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fadeIn">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl mx-auto mb-6 rotate-3">
            <i className="fas fa-bolt text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">เข้าสู่ระบบ Class Hero</h1>
          <p className="text-slate-500">ติวสอบแม่นยำ แยกโปรไฟล์รายบุคคล</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center gap-3">
            <div 
              className="relative w-24 h-24 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-full h-full rounded-full border-4 border-blue-50 overflow-hidden bg-slate-50 flex items-center justify-center shadow-inner transition-all group-hover:border-blue-200">
                {customAvatar ? (
                  <img src={customAvatar} alt="Preview" className="w-full h-full object-cover" />
                ) : name ? (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt="Auto Avatar" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-slate-300 text-3xl"></i>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-white shadow-lg group-hover:scale-110 transition-transform">
                <i className="fas fa-camera"></i>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
              accept="image/*"
            />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">คลิกเพื่อเปลี่ยนรูปถ่าย</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อนักเรียน / ครู</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
              placeholder="เช่น น้องวินเนอร์"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">อีเมล (เพื่อเก็บประวัติแยกคน)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
              placeholder="winner@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            เริ่มต้นใช้งานฟรี <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          ข้อมูลของคุณจะถูกเก็บแยกส่วนตัว รองรับการใช้งานพร้อมกันหลายคนทั่วโลก
        </p>
      </div>
    </div>
  );
};

export default Login;
