export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let topic = 'AI tools';
  try {
    const body = await req.json();
    topic = body.topic || topic;
    const { platform, tone, length } = body;

    if (!topic || !platform) {
      return NextResponse.json({ success: false, error: 'Topic and platform are required' }, { status: 400 });
    }

    const hfToken = process.env.HUGGINGFACE_API_TOKEN;

    if (!hfToken) {
      return NextResponse.json({
        success: true,
        captions: [
          `🌟 Ready to level up your ${topic} game? Discover the secrets that top creators are using today! #GrowthHacks #${topic.replace(/\s+/g, '')}`,
          `Why does everyone keep talking about ${topic}? I finally found out and it's mind-blowing. Check the link in bio for the full scoop. 👇`,
          `Daily reminder: Your journey with ${topic} doesn't have to be perfect, it just has to start. Let's grow together! ✨ #Inspiration`
        ],
        demo: true,
        message: 'Add HUGGINGFACE_API_TOKEN to environment variables for real caption generation.'
      });
    }

    const systemPrompt = `You are a social media expert. Generate 3 engaging, distinct captions for ${platform}. 
    Topic: ${topic}
    Tone: ${tone || 'engaging'}
    Length: ${length || 'medium'}
    
    Output ONLY a JSON array of 3 string captions. Example: ["caption 1", "caption 2", "caption 3"]`;

    const response = await fetch(`https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<s>[INST] ${systemPrompt} [/INST]`,
        parameters: { max_new_tokens: 500, return_full_text: false, temperature: 0.7 }
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to generate captions' }, { status: 500 });
    }

    const result = await response.json();
    const outputText = result[0]?.generated_text || '';
    
    let captions = [];
    try {
      const match = outputText.match(/\[(.*?)\]/s);
      if (match) {
        captions = JSON.parse(`[${match[1]}]`);
      } else {
        captions = outputText.split('\n').filter((c: string) => c.trim().length > 10).slice(0, 3);
      }
    } catch (e) {
      captions = outputText.split('\n').filter((c: string) => c.trim().length > 10).slice(0, 3);
    }

    return NextResponse.json({
      success: true,
      captions: captions.length >= 3 ? captions.slice(0, 3) : [
        "Check out this amazing content! 🚀", 
        "Something big is coming soon...", 
        "What are your thoughts on this? Let me know below! 👇"
      ]
    });
  } catch (error: any) {
    console.error('Error generating captions:', error);
    // Graceful offline fallback
    const demoTopic = topic || 'AI tools';
    return NextResponse.json({
      success: true,
      captions: [
        `🌟 Ready to level up your ${demoTopic} game? Discover the secrets that top creators are using today! #GrowthHacks #${demoTopic.replace(/\s+/g, '')}`,
        `Why does everyone keep talking about ${demoTopic}? I finally found out and it's mind-blowing. Check the link in bio for the full scoop. 👇`,
        `Daily reminder: Your journey with ${demoTopic} doesn't have to be perfect, it just has to start. Let's grow together! ✨ #Inspiration`
      ],
      demo: true,
      message: 'Demo mode activated due to offline environment.'
    });
  }
}
