"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, MessageSquare, Hash, Video } from 'lucide-react';

const showcaseItems = [
  { type: "image", title: "Cyberpunk City", model: "FLUX.1-schnell", src: "https://picsum.photos/seed/cyber/400/400" },
  { type: "image", title: "Abstract Art", model: "FLUX.1-dev", src: "https://picsum.photos/seed/abstract/400/600" },
  { type: "caption", title: "Instagram Caption", platform: "Instagram", text: "✨ The future of content creation is here. AI-powered, human-curated. #AIAutomation" },
  { type: "hashtag", title: "Hashtag Bundle", tags: ["#AIContent", "#ContentCreator", "#DigitalMarketing", "#AI", "#SocialMedia"] },
  { type: "image", title: "Portrait Photo", model: "SD 3.5", src: "https://picsum.photos/seed/portrait/400/500" },
  { type: "video", title: "Product Demo", duration: "5s", thumbnail: "https://picsum.photos/seed/video/400/300" },
  { type: "image", title: "Product Shot", model: "SDXL", src: "https://picsum.photos/seed/product/400/400" },
  { type: "caption", title: "LinkedIn Post", platform: "LinkedIn", text: "We generated 1000 marketing assets in under 60 seconds. Here's how 🧵" }
];

export default function AIShowcase() {
  return (
    <section id="showcase" className="py-24 bg-[#09090b] relative">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            AI-Generated Content Gallery
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Experience the quality of our state-of-the-art AI models. From stunning visuals to engaging copy, generated in seconds.
          </motion.p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-4 gap-6 space-y-6">
          {showcaseItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.03 }}
              animate={{ y: [0, -8, 0] }}
              style={{ transition: 'all 0.3s ease' }}
              // @ts-ignore - custom framer motion transition typing mismatch sometimes
              transition={{
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2
                }
              }}
              className="break-inside-avoid relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] group"
            >
              
              {/* Type Badge */}
              <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs text-white flex items-center gap-1.5 font-medium">
                {item.type === 'image' && <ImageIcon className="w-3 h-3" />}
                {item.type === 'video' && <Video className="w-3 h-3" />}
                {item.type === 'caption' && <MessageSquare className="w-3 h-3" />}
                {item.type === 'hashtag' && <Hash className="w-3 h-3" />}
                <span className="capitalize">{item.type}</span>
              </div>

              {/* Content Rendering based on type */}
              {item.type === 'image' && (
                <div className="relative aspect-auto">
                  <img src={item.src} alt={item.title} className="w-full h-auto rounded-2xl" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div>
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="text-purple-300 text-sm">{item.model}</p>
                    </div>
                  </div>
                </div>
              )}

              {item.type === 'video' && (
                <div className="relative">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-48 object-cover rounded-2xl" loading="lazy" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <div className="w-0 h-0 border-t-6 border-b-6 border-l-10 border-t-transparent border-b-transparent border-l-white ml-1"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white font-semibold">{item.title}</p>
                    <p className="text-cyan-300 text-sm">{item.duration}</p>
                  </div>
                </div>
              )}

              {item.type === 'caption' && (
                <div className="p-6 pt-12">
                  <p className="text-white text-sm mb-4 leading-relaxed">"{item.text}"</p>
                  <p className="text-gray-400 text-xs font-medium">— {item.platform}</p>
                </div>
              )}

              {item.type === 'hashtag' && (
                <div className="p-6 pt-12">
                  <div className="flex flex-wrap gap-2">
                    {item.tags?.map((tag, j) => (
                      <span key={j} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-cyan-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <button className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-lg hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all transform hover:scale-105">
            Generate Your Own Content
          </button>
        </div>

      </div>
    </section>
  );
}
