"use client";

import React from 'react';
import { Share2, Camera, Briefcase, Film, PlayCircle, ArrowUp } from 'lucide-react';

const socialIcons = [Share2, Camera, Briefcase, Film, PlayCircle];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-white/[0.02] border-t border-white/[0.06] pt-20 pb-10 overflow-hidden">
      <style>{`
        .footer-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 50%;
          animation: footer-float var(--fp-dur) linear infinite;
        }
        @keyframes footer-float {
          0% { transform: translateY(100%) scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-200px) scale(1); opacity: 0; }
        }
      `}</style>

      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="footer-particle"
            style={{
              left: `${(i * 5) + 2}%`,
              bottom: 0,
              animationDelay: `${i * 0.5}s`,
              '--fp-dur': `${10 + (i % 8)}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Newsletter */}
        <div className="flex flex-col items-center text-center mb-20">
          <h3 className="text-2xl font-bold text-white mb-4">Stay Ahead of the Curve</h3>
          <p className="text-gray-400 mb-6">Join 50,000+ creators receiving our weekly AI tips.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md gap-2 p-1 rounded-full bg-white/5 border border-white/10 focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent px-4 py-2 text-white outline-none placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm">
                AI
              </div>
              <span className="font-bold text-xl text-white">Automation</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              The ultimate AI-powered content creation and distribution platform for modern creators and teams.
            </p>
            <div className="flex gap-4">
              {socialIcons.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all hover:scale-110"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Products</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">Image Generation</a></li>
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">Video Creation</a></li>
              <li><a href="#social" className="hover:text-cyan-400 transition-colors">Social Scheduling</a></li>
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">Analytics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Press</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Cookie Settings</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm text-gray-500">
          <p>© 2025 AI Automation. All rights reserved.</p>
          <p className="my-4 md:my-0">Made with ❤️ and AI</p>
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/50 transition-all"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
}
