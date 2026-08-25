import { Controller, Get, Query } from '@nestjs/common';
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
      { id: 'huggingface', name: 'HuggingFace', categories: ['image'] },
      { id: 'openai', name: 'OpenAI', categories: ['image'] },
      { id: 'gemini', name: 'Google Gemini', categories: ['image'] },
      { id: 'fal', name: 'Fal.ai', categories: ['video'] },
    ];
  }
}
