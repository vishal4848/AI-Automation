import { Controller, Get, Post, Body, Delete, Param, Query, Res, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('social')
@Controller('api/v1/social')
export class SocialController {
  private readonly logger = new Logger(SocialController.name);

  constructor(
    private readonly socialService: SocialService,
    private readonly configService: ConfigService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('instagram/connect')
  connectInstagramRedirect(@CurrentUser() user: any, @Query('flow') flow: string, @Res() res: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    const url = this.socialService.getInstagramConnectUrl(userId, flow);
    return res.redirect(url);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('instagram/connect-url')
  getInstagramConnectUrl(@CurrentUser() user: any, @Query('flow') flow: string) {
    const userId = typeof user === 'string' ? user : user?.id;
    const url = this.socialService.getInstagramConnectUrl(userId, flow);
    return { success: true, url };
  }

  @Public()
  @Get('instagram/callback')
  async handleInstagramCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: any
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (error) {
      this.logger.error(`Instagram OAuth Error from Meta: ${error} - ${errorDescription}`);
      return res.redirect(`${frontendUrl}/social-accounts?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/social-accounts?error=Missing_Authorization_Code`);
    }

    try {
      const cleanCode = code ? code.replace(/#.*$/, '').trim() : code;
      await this.socialService.handleInstagramCallback(cleanCode, state);
      return res.redirect(`${frontendUrl}/social-accounts?success=instagram_connected`);
    } catch (e: any) {
      return res.redirect(`${frontendUrl}/social-accounts?error=${encodeURIComponent(e.message)}`);
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('facebook/connect')
  connectFacebookRedirect(@CurrentUser() user: any, @Res() res: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    const url = this.socialService.getFacebookConnectUrl(userId);
    return res.redirect(url);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('facebook/connect-url')
  getFacebookConnectUrl(@CurrentUser() user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    const url = this.socialService.getFacebookConnectUrl(userId);
    return { success: true, url };
  }

  @Public()
  @Get('facebook/callback')
  async handleFacebookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: any
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (error) {
      this.logger.error(`Facebook OAuth Error from Meta: ${error} - ${errorDescription}`);
      return res.redirect(`${frontendUrl}/social-accounts?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/social-accounts?error=Missing_Authorization_Code`);
    }

    try {
      await this.socialService.handleFacebookCallback(code, state);
      return res.redirect(`${frontendUrl}/social-accounts?success=facebook_connected`);
    } catch (e: any) {
      return res.redirect(`${frontendUrl}/social-accounts?error=${encodeURIComponent(e.message)}`);
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('linkedin/connect')
  connectLinkedInRedirect(@CurrentUser() user: any, @Res() res: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    const url = this.socialService.getLinkedInConnectUrl(userId);
    return res.redirect(url);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('linkedin/connect-url')
  getLinkedInConnectUrl(@CurrentUser() user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    const url = this.socialService.getLinkedInConnectUrl(userId);
    return { success: true, url };
  }

  @Public()
  @Get('linkedin/callback')
  async handleLinkedInCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: any
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (error) {
      this.logger.error(`LinkedIn OAuth Error: ${error} - ${errorDescription}`);
      return res.redirect(`${frontendUrl}/social-accounts?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/social-accounts?error=Missing_Authorization_Code`);
    }

    try {
      await this.socialService.handleLinkedInCallback(code, state);
      return res.redirect(`${frontendUrl}/social-accounts?success=linkedin_connected`);
    } catch (e: any) {
      return res.redirect(`${frontendUrl}/social-accounts?error=${encodeURIComponent(e.message)}`);
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('token-connect')
  async connectWithToken(
    @CurrentUser() user: any,
    @Body('accessToken') accessToken?: string,
    @Body('token') token?: string,
  ) {
    const userId = typeof user === 'string' ? user : user?.id;
    const finalToken = (accessToken || token || '').trim();
    if (!finalToken) {
      throw new BadRequestException('A valid accessToken is required.');
    }
    const accounts = await this.socialService.connectWithMetaToken(userId, finalToken);
    return { success: true, message: `Successfully connected ${accounts.length} account(s).`, data: accounts };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(['accounts', 'instagram/accounts'])
  async getAccounts(@CurrentUser('id') userId: string) {
    const accounts = await this.socialService.getAccounts(userId);
    return { success: true, data: accounts };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('facebook/accounts')
  async getFacebookAccounts(@CurrentUser('id') userId: string) {
    const accounts = await this.socialService.getAccounts(userId, 'Facebook');
    return { success: true, data: accounts };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('linkedin/accounts')
  async getLinkedInAccounts(@CurrentUser('id') userId: string) {
    const accounts = await this.socialService.getAccounts(userId, 'LinkedIn');
    return { success: true, data: accounts };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(['status', 'instagram/status', 'facebook/status', 'linkedin/status'])
  async getStatus(@CurrentUser('id') userId: string) {
    const status = await this.socialService.getStatus(userId);
    return { success: true, data: status };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(['accounts/:id', 'instagram/accounts/:id', 'facebook/accounts/:id', 'linkedin/accounts/:id'])
  async disconnectAccount(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string
  ) {
    return this.socialService.disconnectAccount(userId, accountId);
  }
}
