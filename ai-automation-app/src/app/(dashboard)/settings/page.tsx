"use client";

import React, { useState } from 'react';
import { User, Bell, Lock, CreditCard, Palette, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-8 h-[calc(100vh-4rem)]">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              <div>
                <h2 className="text-xl font-bold">Public Profile</h2>
                <p className="text-gray-500 text-sm mt-1">This is how others will see you on the platform.</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
                  A
                </div>
                <div>
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors">
                    Change Avatar
                  </button>
                  <p className="text-xs text-gray-400 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input type="text" defaultValue="Alex" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input type="text" defaultValue="Johnson" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea className="w-full h-24 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" defaultValue="AI enthusiast and digital creator." />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              <div>
                <h2 className="text-xl font-bold">Billing & Credits</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your subscription plan and AI generation credits.</p>
              </div>

              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 font-medium">Current Plan</p>
                    <h3 className="text-3xl font-bold mt-1 text-white">Pro Creator</h3>
                    <p className="text-sm text-slate-300 mt-4">Renews on April 15, 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 font-medium mb-2">Credits Remaining</p>
                    <div className="flex items-end gap-2 justify-end">
                      <span className="text-4xl font-bold">2,450</span>
                      <span className="text-slate-400 mb-1">/ 5,000</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex gap-3 relative z-10">
                  <button className="px-4 py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors">
                    Top Up Credits
                  </button>
                  <button className="px-4 py-2 border border-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors">
                    Change Plan
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Payment Methods</h3>
                <div className="border border-gray-200 rounded-xl p-4 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center font-bold text-blue-800 italic">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Visa ending in 4242</p>
                      <p className="text-xs text-gray-500">Expires 12/25</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors">Remove</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              <div>
                <h2 className="text-xl font-bold">Appearance</h2>
                <p className="text-gray-500 text-sm mt-1">Customize how the application looks to you.</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', name: 'Light', bg: 'bg-gray-100' },
                    { id: 'dark', name: 'Dark', bg: 'bg-gray-900' },
                    { id: 'system', name: 'System', bg: 'bg-gradient-to-r from-gray-100 to-gray-900' },
                  ].map(theme => (
                    <button key={theme.id} className="flex flex-col items-center gap-2 group">
                      <div className={`w-full aspect-video rounded-lg border-2 ${theme.id === 'light' ? 'border-blue-500' : 'border-gray-200 group-hover:border-gray-300'} ${theme.bg} relative overflow-hidden shadow-sm`}>
                        <div className="absolute inset-4 bg-white rounded shadow-sm opacity-50 flex flex-col gap-2 p-2">
                           <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                           <div className="w-full h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Add basic placeholders for other tabs if selected */}
          {['account', 'notifications'].includes(activeTab) && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 flex flex-col items-center justify-center h-full text-gray-400"
            >
              <Monitor size={48} className="mb-4 opacity-20" />
              <p className="text-lg">Settings for {activeTab} coming soon.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
