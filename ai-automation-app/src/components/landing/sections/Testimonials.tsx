"use client";

import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  { name: "Sarah Chen", role: "Content Director", company: "TechVision", quote: "AI Automation cut our content production time by 90%. We now publish 10x more content with half the team.", stars: 5 },
  { name: "Marcus Williams", role: "Social Media Manager", company: "GrowthCo", quote: "The AI image generation is absolutely mind-blowing. Our Instagram engagement tripled in one month.", stars: 5 },
  { name: "Priya Sharma", role: "Marketing Lead", company: "StartupHub", quote: "From prompt to published post in under 2 minutes. This platform is the future of social media marketing.", stars: 5 },
  { name: "Alex Rodriguez", role: "Creative Director", company: "BrandX", quote: "The video generation feature alone is worth 10x the price. Our client delivery time went from days to hours.", stars: 5 },
  { name: "Emma Thompson", role: "Influencer", company: "Personal Brand", quote: "I manage 5 social accounts solo. AI Automation makes it feel like I have a whole team behind me.", stars: 5 },
  { name: "David Park", role: "E-commerce Owner", company: "ShopNext", quote: "Automated our entire product marketing pipeline. 500 product photos, captions, and scheduled posts in one afternoon.", stars: 5 },
  { name: "Julia Martinez", role: "Agency Owner", company: "PixelHouse", quote: "We onboarded 20 new clients because AI Automation lets us deliver in days, not weeks.", stars: 5 },
  { name: "Ryan Kim", role: "YouTuber", company: "Tech Reviews", quote: "Thumbnail generation and caption writing is now fully automated. Saves me 15 hours per week.", stars: 5 },
  { name: "Aisha Johnson", role: "Brand Strategist", company: "Momentum", quote: "The analytics dashboard alone changed how we approach content strategy. Real-time insights are invaluable.", stars: 5 },
  { name: "Thomas Brown", role: "Startup Founder", company: "Launchpad", quote: "Built our entire launch campaign using AI Automation. 1M+ impressions in the first week.", stars: 5 },
  { name: "Mei Lin", role: "Content Creator", company: "CreativeStudio", quote: "Finally a platform that understands creators. The AI knows exactly what style I want every time.", stars: 5 },
  { name: "Carlos Silva", role: "Growth Hacker", company: "ScaleUp", quote: "ROI was positive in the first week. The time savings alone pay for the subscription 10 times over.", stars: 5 }
];

export default function Testimonials() {
  const row1 = testimonials.slice(0, 6);
  const row2 = testimonials.slice(6, 12);

  const TestimonialCard = ({ item }: { item: typeof testimonials[0] }) => (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 min-w-[320px] max-w-[320px] transition-colors hover:bg-white/[0.05]">
      <div className="flex gap-1 mb-4">
        {[...Array(item.stars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
        ))}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-6">"{item.quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
          {item.name.charAt(0)}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{item.name}</p>
          <p className="text-gray-500 text-xs">{item.role}, {item.company}</p>
        </div>
      </div>
    </div>
  );

  return (
    <section id="testimonials" className="py-24 bg-[#09090b] overflow-hidden">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee 35s linear infinite reverse;
        }
        .marquee-container:hover .animate-marquee,
        .marquee-container:hover .animate-marquee-reverse {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="text-center mb-16 px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Loved by 50,000+ Creators</h2>
        <p className="text-gray-400 text-lg">Join the thousands of creators scaling their content production.</p>
      </div>

      <div className="space-y-6 marquee-container">
        {/* Row 1 */}
        <div className="flex w-max animate-marquee">
          <div className="flex gap-6 px-3">
            {row1.map((item, i) => <TestimonialCard key={i} item={item} />)}
          </div>
          <div className="flex gap-6 px-3">
            {row1.map((item, i) => <TestimonialCard key={`dup-${i}`} item={item} />)}
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex w-max animate-marquee-reverse">
          <div className="flex gap-6 px-3">
            {row2.map((item, i) => <TestimonialCard key={i} item={item} />)}
          </div>
          <div className="flex gap-6 px-3">
            {row2.map((item, i) => <TestimonialCard key={`dup-${i}`} item={item} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
