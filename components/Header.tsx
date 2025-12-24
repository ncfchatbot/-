
import React, { useState } from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onHome: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onHome, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-blue-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onHome}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:bg-blue-700 transition-colors">
            <i className="fas fa-bolt text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
            Class Hero
          </h1>
        </div>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 p-1.5 pr-4 rounded-full border border-slate-100 transition-all"
              >
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-white border" />
                <div className="text-left hidden xs:block">
                  <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-500">ID: {user.id.toUpperCase()}</p>
                </div>
                <i className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}></i>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slideUp">
                  <div className="p-3 border-b border-slate-50">
                    <p className="text-xs text-slate-400">เข้าใช้งานเป็น</p>
                    <p className="text-sm font-bold truncate">{user.email}</p>
                  </div>
                  <button onClick={onHome} className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 text-slate-600 flex items-center gap-2">
                    <i className="fas fa-home text-blue-500"></i> หน้าแรก
                  </button>
                  <button onClick={onLogout} className="w-full px-4 py-3 text-left text-sm hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t">
                    <i className="fas fa-sign-out-alt"></i> ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-100">
              เข้าสู่ระบบ
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
