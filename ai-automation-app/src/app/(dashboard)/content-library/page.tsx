"use client";

import React, { useState } from 'react';
import { Search, Filter, Grid, List, Download, Trash2, Heart, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const CONTENT = [
  { id: 1, type: 'image', url: 'https://picsum.photos/seed/lib1/400/400', date: '2024-03-15' },
  { id: 2, type: 'video', url: 'https://picsum.photos/seed/lib2/400/400', date: '2024-03-14' },
  { id: 3, type: 'caption', text: 'Exciting news! Our new...', date: '2024-03-14' },
  { id: 4, type: 'image', url: 'https://picsum.photos/seed/lib4/400/400', date: '2024-03-13' },
  { id: 5, type: 'video', url: 'https://picsum.photos/seed/lib5/400/400', date: '2024-03-12' },
  { id: 6, type: 'image', url: 'https://picsum.photos/seed/lib6/400/400', date: '2024-03-10' },
];

export default function ContentLibraryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Content Library</h1>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search content..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pb-4 border-b border-gray-200 overflow-x-auto">
        {['All', 'Images', 'Videos', 'Captions', 'Favorites'].map((filter, i) => (
          <button 
            key={filter}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto pb-20 ${
        view === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' 
          : 'space-y-4'
      }`}>
        {CONTENT.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all ${
              view === 'list' ? 'flex items-center p-4 gap-4' : 'flex flex-col'
            }`}
          >
            {/* Content Preview */}
            <div className={`${view === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square'} bg-gray-100 relative`}>
              {item.type === 'caption' ? (
                <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center bg-orange-50 text-orange-700">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs line-clamp-3">{item.text}</p>
                </div>
              ) : (
                <img src={item.url} alt="Content" className="w-full h-full object-cover" />
              )}
              
              <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-md">
                {item.type === 'image' && <ImageIcon className="w-3 h-3 text-white" />}
                {item.type === 'video' && <Video className="w-3 h-3 text-white" />}
                {item.type === 'caption' && <FileText className="w-3 h-3 text-white" />}
              </div>

              {/* Hover Actions - Grid View */}
              {view === 'grid' && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button className="p-2 bg-white/20 hover:bg-white text-white hover:text-blue-600 rounded-full transition-colors">
                    <Download size={18} />
                  </button>
                  <button className="p-2 bg-white/20 hover:bg-white text-white hover:text-red-500 rounded-full transition-colors">
                    <Heart size={18} />
                  </button>
                  <button className="p-2 bg-white/20 hover:bg-white text-white hover:text-gray-900 rounded-full transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Meta Info */}
            <div className={`p-3 ${view === 'list' ? 'flex-1 flex justify-between items-center' : ''}`}>
              <div>
                <p className="text-sm font-medium truncate">Generated {item.type}</p>
                <p className="text-xs text-gray-500">{item.date}</p>
              </div>
              
              {/* List View Actions */}
              {view === 'list' && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-gray-500 hover:text-blue-600"><Download size={18} /></button>
                  <button className="p-2 text-gray-500 hover:text-red-500"><Heart size={18} /></button>
                  <button className="p-2 text-gray-500 hover:text-gray-900"><Trash2 size={18} /></button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
