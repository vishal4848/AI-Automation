import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/html')
  getHello(): string {
    return `<!DOCTYPE html><html><head><title>AI Automation API</title></head><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#fff;"><h1>AI Automation Platform API</h1><p>Status: Healthy & Active</p></body></html>`;
  }

  @Public()
  @Get('privacy')
  @Header('Content-Type', 'text/html')
  getPrivacy(): string {
    return `<!DOCTYPE html><html><head><title>Privacy Policy - AI Automation</title></head><body style="font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6;color:#333;"><h1>Privacy Policy</h1><p>Last updated: August 2026</p><p>AI Automation SaaS respects your privacy. When you connect your Facebook, Instagram, or LinkedIn accounts, we only request the permissions necessary to publish and schedule your approved content. We do not sell or share your personal data.</p></body></html>`;
  }

  @Public()
  @Get('deletion')
  @Header('Content-Type', 'text/html')
  getDeletion(): string {
    return `<!DOCTYPE html><html><head><title>User Data Deletion - AI Automation</title></head><body style="font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6;color:#333;"><h1>User Data Deletion Instructions</h1><p>If you wish to remove your user data and disconnect all connected social accounts from AI Automation:</p><ol><li>Log in to your AI Automation account.</li><li>Go to <strong>Social Accounts</strong> settings.</li><li>Click <strong>Disconnect</strong> on any linked account to immediately remove all stored tokens and data.</li></ol><p>To request full account deletion, email support at admin@ai-automation.com.</p></body></html>`;
  }
}
