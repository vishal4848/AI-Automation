import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-extrabold mb-4">Welcome to AI Automation Dashboard</h1>
      <p className="text-slate-400 mb-8">You have successfully logged in.</p>
      <button 
        onClick={() => navigate('/login')}
        className="px-6 py-2.5 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition"
      >
        Sign Out
      </button>
    </div>
  );
}