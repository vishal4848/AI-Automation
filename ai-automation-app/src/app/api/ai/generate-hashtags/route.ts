export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let topic = 'AI';
  try {
    const body = await req.json();
    topic = body.topic || topic;
    const { platform, count } = body;

    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 });
    }

    const hfToken = process.env.HUGGINGFACE_API_TOKEN;

    if (!hfToken) {
      const baseTag = topic.replace(/[^a-zA-Z0-9]/g, '');
      return NextResponse.json({
        success: true,
        hashtags: {
          trending: [`#${baseTag}Trending`, `#${baseTag}Viral`, `#ExplorePage`],
          niche: [`#${baseTag}Community`, `#${baseTag}Tips`, `#${baseTag}Hacks`],
          branded: [`#My${baseTag}`, `#${baseTag}Official`, `#${baseTag}Life`]
        },
        demo: true,
        message: 'Add HUGGINGFACE_API_TOKEN to environment variables for real hashtag generation.'
      });
    }

    const systemPrompt = `You are an SEO and social media expert. Generate hashtags for the topic: "${topic}" on platform: "${platform || 'general'}". 
    Count per category: ${count || 5}.
    Categorize them into 'trending', 'niche', and 'branded'.
    Return ONLY valid JSON in this exact format:
    {"trending": ["#tag1", ...], "niche": ["#tag2", ...], "branded": ["#tag3", ...]}`;

    const response = await fetch(`https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<s>[INST] ${systemPrompt} [/INST]`,
        parameters: { max_new_tokens: 300, return_full_text: false, temperature: 0.3 }
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to generate hashtags' }, { status: 500 });
    }

    const result = await response.json();
    const outputText = result[0]?.generated_text || '';
    
    let hashtags = { trending: [], niche: [], branded: [] };
    try {
      const match = outputText.match(/\{[\s\S]*\}/);
      if (match) {
        hashtags = JSON.parse(match[0]);
      }
    } catch (e) {
      console.error('Failed to parse hashtag JSON:', e);
    }

    return NextResponse.json({
      success: true,
      hashtags
    });
  } catch (error: any) {
    console.error('Error generating hashtags:', error);
    // Graceful offline fallback
    const baseTag = topic.replace(/[^a-zA-Z0-9]/g, '') || 'AI';
    return NextResponse.json({
      success: true,
      hashtags: {
        trending: [`#${baseTag}Trending`, `#${baseTag}Viral`, `#ExplorePage`],
        niche: [`#${baseTag}Community`, `#${baseTag}Tips`, `#${baseTag}Hacks`],
        branded: [`#My${baseTag}`, `#${baseTag}Official`, `#${baseTag}Life`]
      },
      demo: true,
      message: 'Demo mode activated due to offline environment.'
    });
  }
}
