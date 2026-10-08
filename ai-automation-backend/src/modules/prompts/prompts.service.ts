import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService } from '../ai-gateway/ai-gateway.service';

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(
    private prisma: PrismaService,
    private aiGateway: AIGatewayService,
    private configService: ConfigService,
  ) {}

  private getHfToken(): string | undefined {
    return this.configService.get<string>('HUGGINGFACE_API_TOKEN') || this.configService.get<string>('HF_TOKEN');
  }

  async enhance(userId: string, prompt: string, category?: string) {
    const enhanced = await this.aiGateway.enhancePrompt({ prompt, category: category as any });
    try {
      await this.prisma.promptHistory.create({
        data: { userId, originalPrompt: prompt, enhancedPrompt: enhanced, category: category?.toUpperCase(), status: 'ENHANCED' },
      });
    } catch {}
    return { original: prompt, enhanced, improved: enhanced !== prompt };
  }

  async getHistory(userId: string, limit = 20) {
    try {
      return await this.prisma.promptHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch { return []; }
  }

  async generateCaptions(userId: string, topic: string, platform: string, tone?: string, length?: string) {
    if (!topic || !platform) {
      throw new BadRequestException('Topic and platform are required.');
    }

    const cost = 1;
    try {
      await this.prisma.deductCreditsAtomically(
        userId,
        cost,
        `Caption generation for ${platform}`,
        'USAGE',
        { feature: 'caption', platform, topic },
      );
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_CREDITS') {
        throw new BadRequestException({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: 'Insufficient credits for caption generation.',
        });
      }
      throw err;
    }

    const hfToken = this.getHfToken();
    try {
      if (!hfToken) {
        const base = topic.trim();
        return {
          success: true,
          captions: [
            `🌟 Ready to level up your ${base} strategy? Discover the key principles top creators swear by. #GrowthHacks #${base.replace(/\s+/g, '')}`,
            `The truth about ${base}: Most people miss this critical shift. Drop your questions below and let's discuss! 👇`,
            `Consistency in ${base} compounds faster than you think. Start small, stay disciplined, and build the future today. ✨ #Leadership`
          ],
        };
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
        throw new Error(`Hugging Face API returned ${response.status}`);
      }

      const result = await response.json();
      const outputText = result[0]?.generated_text || '';
      let captions: string[] = [];
      const match = outputText.match(/\[(.*?)\]/s);
      if (match) {
        captions = JSON.parse(`[${match[1]}]`);
      } else {
        captions = outputText.split('\n').filter((c: string) => c.trim().length > 10).slice(0, 3);
      }

      return {
        success: true,
        captions: captions.length >= 3 ? captions.slice(0, 3) : [
          `Ready to level up your ${topic} workflow? Here's what works. 🚀`,
          `3 big lessons learned about ${topic} this month. A quick breakdown 👇`,
          `Why ${topic} matters more than ever in 2026. What's your take?`
        ]
      };
    } catch (err: any) {
      this.logger.error(`Caption generation failed: ${err.message}`);
      await this.prisma.refundCreditsAtomically(
        userId,
        cost,
        `Refund for failed caption generation`,
        { error: err.message },
      );
      throw new BadRequestException(`Failed to generate captions: ${err.message}`);
    }
  }

  async generateHashtags(userId: string, topic: string, platform?: string, count: number = 8) {
    if (!topic) {
      throw new BadRequestException('Topic is required.');
    }

    const cost = 1;
    try {
      await this.prisma.deductCreditsAtomically(
        userId,
        cost,
        `Hashtag generation for ${topic}`,
        'USAGE',
        { feature: 'hashtags', topic },
      );
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_CREDITS') {
        throw new BadRequestException({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: 'Insufficient credits for hashtag generation.',
        });
      }
      throw err;
    }

    const hfToken = this.getHfToken();
    try {
      if (!hfToken) {
        const cleanTag = topic.replace(/[^a-zA-Z0-9]/g, '') || 'CreativeAI';
        return {
          success: true,
          hashtags: {
            trending: [`#${cleanTag}Trending`, `#${cleanTag}Viral`, `#Explore${cleanTag}`, `#${cleanTag}Daily`, `#Top${cleanTag}`],
            niche: [`#${cleanTag}Community`, `#${cleanTag}Tips`, `#${cleanTag}Hacks`, `#${cleanTag}Mastery`, `#${cleanTag}Strategy`],
            branded: [`#Official${cleanTag}`, `#CreateWith${cleanTag}`, `#BuildWith${cleanTag}`, `#${cleanTag}Studio`],
          },
        };
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
        throw new Error(`Hugging Face API returned ${response.status}`);
      }

      const result = await response.json();
      const outputText = result[0]?.generated_text || '';
      let hashtags = { trending: [], niche: [], branded: [] };
      const match = outputText.match(/\{[\s\S]*\}/);
      if (match) {
        hashtags = JSON.parse(match[0]);
      }

      return {
        success: true,
        hashtags,
      };
    } catch (err: any) {
      this.logger.error(`Hashtag generation failed: ${err.message}`);
      await this.prisma.refundCreditsAtomically(
        userId,
        cost,
        `Refund for failed hashtag generation`,
        { error: err.message },
      );
      throw new BadRequestException(`Failed to generate hashtags: ${err.message}`);
    }
  }

  async copilot(userId: string, message: string, context?: string, history?: any[]) {
    if (!message) {
      throw new BadRequestException('Message is required.');
    }

    const cost = 1;
    try {
      await this.prisma.deductCreditsAtomically(
        userId,
        cost,
        `AI Copilot query`,
        'USAGE',
        { feature: 'copilot' },
      );
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_CREDITS') {
        throw new BadRequestException({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: 'Insufficient credits for AI Copilot.',
        });
      }
      throw err;
    }

    const hfToken = this.getHfToken();
    try {
      if (!hfToken) {
        const lowerMsg = message.toLowerCase();
        let reply = '';
        if (lowerMsg.includes('prompt') || lowerMsg.includes('image')) {
          reply = `Here's an optimized prompt for high aesthetic quality:\n\n"A cinematic portrait of a futuristic cityscape at dusk, neon-lit streets reflecting in rain puddles, ultra-realistic, 8K, volumetric lighting, cyberpunk aesthetic"\n\nPro-tips:\n• Include camera perspective: "drone shot", "eye-level"\n• Specify lighting: "golden hour", "high contrast"\n• Specify details: "photorealistic, 8k resolution"`;
        } else if (lowerMsg.includes('caption')) {
          reply = `Here are 3 caption hooks:\n\n1️⃣ "The secret to 10x output isn't more hours—it's automated systems."\n2️⃣ "I tested 10 different workflows so you don't have to. Here's what worked."\n3️⃣ "Save this before you plan your next campaign."`;
        } else {
          reply = `I am your AI Copilot. I can help refine image prompts, write viral social captions, structure your content calendar, or answer questions about your automation pipeline. What would you like to build today?`;
        }
        return { success: true, reply };
      }

      const systemPrompt = "You are an AI assistant for the AI Automation platform. You help users create better content, write image prompts, generate captions, find hashtags, and maximize their social media presence. Be concise, helpful and actionable.";
      let conversation = `<s>[INST] ${systemPrompt}\n\n`;
      if (context) conversation += `Context: ${context}\n`;
      if (history && Array.isArray(history)) {
        history.forEach((msg) => {
          conversation += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
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
        throw new Error(`Hugging Face API returned ${response.status}`);
      }

      const result = await response.json();
      const reply = result[0]?.generated_text?.trim() || "I'm sorry, I couldn't generate a response.";
      return { success: true, reply };
    } catch (err: any) {
      this.logger.error(`Copilot query failed: ${err.message}`);
      await this.prisma.refundCreditsAtomically(
        userId,
        cost,
        `Refund for failed copilot query`,
        { error: err.message },
      );
      throw new BadRequestException(`Copilot failed: ${err.message}`);
    }
  }
}
