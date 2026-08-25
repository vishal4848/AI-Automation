"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "50 AI images/mo",
      "10 AI videos/mo",
      "100 captions/mo",
      "1 social account",
      "Basic analytics"
    ],
    cta: "Get Started Free",
    isPopular: false,
    accent: "border-white/[0.08]",
    checkColor: "text-zinc-400",
  },
  {
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 23,
    features: [
      "500 AI images/mo",
      "100 AI videos/mo",
      "Unlimited captions",
      "10 social accounts",
      "Advanced analytics",
      "Priority generation",
      "Team collaboration (3 seats)"
    ],
    cta: "Start Pro Trial",
    isPopular: true,
    accent: "border-purple-500/50 shadow-[0_0_40px_rgba(139,92,246,0.15)] bg-white/[0.04]",
    checkColor: "text-purple-400",
  },
  {
    name: "Enterprise",
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      "Unlimited everything",
      "Custom AI models",
      "Dedicated support",
      "White label",
      "API access",
      "20+ seats",
      "Custom integrations"
    ],
    cta: "Contact Sales",
    isPopular: false,
    accent: "border-amber-500/30 hover:border-amber-500/50",
    checkColor: "text-amber-400",
  }
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-[#09090b] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-4"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-xl mx-auto mb-10"
          >
            Start free. Scale as you grow. No hidden fees.
          </motion.p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-zinc-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 bg-white/10 border border-white/10 rounded-full p-1 cursor-pointer transition-all hover:border-purple-500/50"
              aria-label="Toggle billing period"
            >
              <motion.div
                layout
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="w-5 h-5 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-zinc-500'}`}>
                Yearly
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full uppercase tracking-wide">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className={`relative rounded-3xl p-8 bg-white/[0.02] border backdrop-blur-xl ${plan.accent} ${plan.isPopular ? 'md:-mt-4 md:pb-12' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>

              <div className="flex items-baseline gap-1 mb-6">
                <motion.span
                  key={isYearly ? 'yearly' : 'monthly'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-black text-white"
                >
                  ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </motion.span>
                <span className="text-zinc-500">/mo</span>
              </div>

              <a
                href="/login"
                className={`block w-full py-3 rounded-xl font-semibold mb-8 text-center transition-all ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:-translate-y-0.5'
                    : plan.name === 'Enterprise'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className={`w-4 h-4 shrink-0 ${plan.checkColor}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-zinc-600 text-sm mt-12"
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>
      </div>
    </section>
  );
}
