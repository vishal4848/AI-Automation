import { Global, Module } from '@nestjs/common';
import { AIGatewayService } from './ai-gateway.service';
import { ProviderManagerService } from './provider-manager.service';
import { HuggingFaceProvider } from '../providers/huggingface/huggingface.provider';
import { FalProvider } from '../providers/fal/fal.provider';
import { OpenAIProvider } from '../providers/openai/openai.provider';
import { GeminiProvider } from '../providers/gemini/gemini.provider';
import { LocalProvider } from '../providers/local/local.provider';
import { ReplicateProvider } from '../ai/providers/replicate.provider';

@Global()
@Module({
  providers: [
    AIGatewayService,
    ProviderManagerService,
    HuggingFaceProvider,
    FalProvider,
    OpenAIProvider,
    GeminiProvider,
    LocalProvider,
    ReplicateProvider,
  ],
  exports: [AIGatewayService, ProviderManagerService, ReplicateProvider],
})
export class AIGatewayModule {}
