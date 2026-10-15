import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ModelRegistryService } from './model-registry.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('models')
@Controller('api/v1/models')
export class ModelsController {
  constructor(private modelRegistry: ModelRegistryService) {}

  @Public()
  @Get()
  getModels(@Query('category') category?: string) {
    return this.modelRegistry.getActiveModels(category);
  }

  @Public()
  @Get('providers')
  getProviders() {
    return [
      { id: 'replicate', name: 'Replicate', categories: ['image', 'video', 'text'] },
      { id: 'openai', name: 'OpenAI / ChatGPT', categories: ['image', 'text', 'multimodal'] },
      { id: 'gemini', name: 'Google Gemini', categories: ['image', 'text', 'multimodal'] },
      { id: 'fal', name: 'Fal.ai', categories: ['image', 'video'] },
      { id: 'huggingface', name: 'HuggingFace', categories: ['image'] },
    ];
  }

  @Public()
  @Get('providers/status')
  getProvidersStatus() {
    return this.modelRegistry.getProvidersStatus();
  }

  @Public()
  @Get('by-provider')
  async getModelsByProvider() {
    const allModels = await this.modelRegistry.getActiveModels();
    const grouped: Record<string, { image: any[]; video: any[]; text: any[] }> = {};
    for (const m of allModels as any[]) {
      const p = m.provider.toLowerCase();
      if (!grouped[p]) {
        grouped[p] = { image: [], video: [], text: [] };
      }
      if (m.category === 'IMAGE') {
        grouped[p].image.push(m);
      } else if (m.category === 'VIDEO') {
        grouped[p].video.push(m);
      } else {
        grouped[p].text.push(m);
      }
    }
    return Object.entries(grouped).map(([provider, types]) => ({
      provider,
      imageModels: types.image,
      videoModels: types.video,
      textModels: types.text,
    }));
  }

  @Public()
  @Get(':name')
  getModelDetails(@Param('name') name: string) {
    return this.modelRegistry.getModelDetails(name);
  }
}
