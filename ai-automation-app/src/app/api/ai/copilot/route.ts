export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let message = '';
  try {
    const body = await req.json();
    message = body.message;
    const context = body.context;
    const history = body.history;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const hfToken = process.env.HUGGINGFACE_API_TOKEN;

    if (!hfToken) {
      const lowerMsg = message.toLowerCase();
      let reply = '';

      if (lowerMsg.includes('prompt') || lowerMsg.includes('image')) {
        reply = `Here's a powerful image prompt for you:\n\n"A cinematic portrait of a futuristic city at dusk, neon-lit streets reflecting in rain puddles, ultra-realistic, 8K, dramatic lighting, cyberpunk aesthetic, volumetric fog"\n\nTips:\n• Add "ultra-realistic" or "8K" for photorealism\n• Specify lighting: "golden hour", "neon", "dramatic"\n• Include style: "cinematic", "editorial", "concept art"\n\nWant me to refine this or generate a different style?`;
      } else if (lowerMsg.includes('caption')) {
        reply = `Here are 3 caption ideas:\n\n1️⃣ **Engagement**: "The future belongs to those who create it. What are you building today? 👇"\n\n2️⃣ **Storytelling**: "6 months ago I had zero followers. Here's exactly what changed everything 🧵"\n\n3️⃣ **Value**: "Stop scrolling. This tip will 10x your content reach in 7 days ✨"\n\nWant me to customize these for a specific topic or platform?`;
      } else if (lowerMsg.includes('hashtag')) {
        reply = `Here's a hashtag strategy for maximum reach:\n\n🔥 **Trending (broad):** #ContentCreator #AIGenerated #DigitalMarketing\n\n🎯 **Niche (targeted):** #AIContent #SocialMediaAutomation #CreatorEconomy\n\n✨ **Branded:** #AIAutomation #CreateWithAI\n\n💡 Pro tip: Mix 3-5 trending + 5-7 niche + 2-3 branded for the best reach-to-engagement ratio.`;
      } else if (lowerMsg.includes('video')) {
        reply = `Here's a high-converting video prompt:\n\n"Time-lapse of a sunrise over mountain peaks, cinematic drone shot, golden hour light rays piercing through clouds, 4K, smooth camera movement"\n\n🎬 Video generation tips:\n• Keep prompts under 50 words for best results\n• Specify camera movement: "drone shot", "tracking shot", "zoom in"\n• Add mood: "epic", "serene", "dynamic"\n• Duration of 5-8s produces the best quality`;
      } else if (lowerMsg.includes('schedule') || lowerMsg.includes('post') || lowerMsg.includes('time')) {
        reply = `📅 **Best posting times by platform:**\n\n• **Instagram**: Tue-Fri, 10am-3pm (local time)\n• **LinkedIn**: Tue-Thu, 8am-10am\n• **Twitter/X**: Mon-Wed, 9am-11am\n• **TikTok**: Thu-Sun, 7pm-9pm\n\n💡 **Pro tip**: Post 3-5x/week consistently. Quality beats quantity every time. Use the Scheduler to plan 2 weeks ahead!`;
      } else {
        reply = `Hi! I'm your AI Copilot 🤖\n\nI can help you with:\n• ✍️ Writing image & video prompts\n• 📝 Creating captions for any platform\n• # Generating targeted hashtags\n• 📅 Content scheduling strategy\n• 📊 Growing your social presence\n\nAdd your **HUGGINGFACE_API_TOKEN** to .env.local to unlock the full AI experience. What would you like help with?`;
      }

      return NextResponse.json({ success: true, reply, demo: true });
    }

    const systemPrompt = "You are an AI assistant for the AI Automation platform. You help users create better content, write image prompts, generate captions, find hashtags, and maximize their social media presence. Be concise, helpful and actionable.";
    
    let conversation = `<s>[INST] ${systemPrompt}\n\n`;
    
    if (context) {
      conversation += `Context: ${context}\n`;
    }

    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        if (msg.role === 'user') {
          conversation += `User: ${msg.content}\n`;
        } else {
          conversation += `Assistant: ${msg.content}\n`;
        }
      });
    }

    conversation += `User: ${message} [/INST]`;

    const response = await fetch(`https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: conversation,
        parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.7 }
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to get copilot response' }, { status: 500 });
    }

    const result = await response.json();
    const reply = result[0]?.generated_text?.trim() || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({
      success: true,
      reply
    });
  } catch (error: any) {
    console.error('Error in copilot:', error);
    // Graceful offline fallback
    const lowerMsg = (message || '').toLowerCase();
    let reply = '';

    if (lowerMsg.includes('prompt') || lowerMsg.includes('image')) {
      reply = `Here's a powerful image prompt for you:\n\n"A cinematic portrait of a futuristic city at dusk, neon-lit streets reflecting in rain puddles, ultra-realistic, 8K, dramatic lighting, cyberpunk aesthetic, volumetric fog"\n\nTips:\n• Add "ultra-realistic" or "8K" for photorealism\n• Specify lighting: "golden hour", "neon", "dramatic"\n• Include style: "cinematic", "editorial", "concept art"\n\nWant me to refine this or generate a different style?`;
    } else if (lowerMsg.includes('caption')) {
      reply = `Here are 3 caption ideas:\n\n1️⃣ **Engagement**: "The future belongs to those who create it. What are you building today? 👇"\n\n2️⃣ **Storytelling**: "6 months ago I had zero followers. Here's exactly what changed everything 🧵"\n\n3️⃣ **Value**: "Stop scrolling. This tip will 10x your content reach in 7 days ✨"\n\nWant me to customize these for a specific topic or platform?`;
    } else if (lowerMsg.includes('hashtag')) {
      reply = `Here's a hashtag strategy for maximum reach:\n\n🔥 **Trending (broad):** #ContentCreator #AIGenerated #DigitalMarketing\n\n🎯 **Niche (targeted):** #AIContent #SocialMediaAutomation #CreatorEconomy\n\n✨ **Branded:** #AIAutomation #CreateWithAI\n\n💡 Pro tip: Mix 3-5 trending + 5-7 niche + 2-3 branded for the best reach-to-engagement ratio.`;
    } else if (lowerMsg.includes('video')) {
      reply = `Here's a high-converting video prompt:\n\n"Time-lapse of a sunrise over mountain peaks, cinematic drone shot, golden hour light rays piercing through clouds, 4K, smooth camera movement"\n\n🎬 Video generation tips:\n• Keep prompts under 50 words for best results\n• Specify camera movement: "drone shot", "tracking shot", "zoom in"\n• Add mood: "epic", "serene", "dynamic"\n• Duration of 5-8s produces the best quality`;
    } else if (lowerMsg.includes('schedule') || lowerMsg.includes('post') || lowerMsg.includes('time')) {
      reply = `📅 **Best posting times by platform:**\n\n• **Instagram**: Tue-Fri, 10am-3pm (local time)\n• **LinkedIn**: Tue-Thu, 8am-10am\n• **Twitter/X**: Mon-Wed, 9am-11am\n• **TikTok**: Thu-Sun, 7pm-9pm\n\n💡 **Pro tip**: Post 3-5x/week consistently. Quality beats quantity every time. Use the Scheduler to plan 2 weeks ahead!`;
    } else {
      reply = `Hi! I'm your AI Copilot 🤖\n\nI can help you with:\n• ✍️ Writing image & video prompts\n• 📝 Creating captions for any platform\n• # Generating targeted hashtags\n• 📅 Content scheduling strategy\n• 📊 Growing your social presence\n\nDemo mode activated due to offline environment. What would you like help with?`;
    }

    return NextResponse.json({ success: true, reply, demo: true });
  }
}
