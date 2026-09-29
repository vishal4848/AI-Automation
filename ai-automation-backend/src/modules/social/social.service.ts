import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { encrypt, createSignedOAuthState, verifySignedOAuthState } from '../../common/utils/encryption.util';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generates the official Instagram Login OAuth authorization URL.
   * Directs the user to the native Instagram Login page (instagram.com) with the Instagram logo,
   * username, and password fields.
   * Scopes: instagram_business_basic, instagram_business_content_publish.
   */
  getInstagramConnectUrl(userId: string, flowOverride?: string): string {
    const appId = this.configService.get<string>('INSTAGRAM_APP_ID') || this.configService.get<string>('META_APP_ID') || this.configService.get<string>('FACEBOOK_APP_ID');
    const redirectUri = this.configService.get<string>('META_REDIRECT_URI') || 'http://localhost:3001/api/v1/social/instagram/callback';
    const signingKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || this.configService.get<string>('jwt.secret') || 'dev-token-encryption-key-32-chars-long';
    const version = this.configService.get<string>('META_API_VERSION') || 'v20.0';
    const flow = flowOverride || this.configService.get<string>('INSTAGRAM_AUTH_FLOW') || 'instagram';

    if (!appId || !redirectUri || appId === 'your-meta-app-id') {
      this.logger.warn('Meta OAuth configuration is missing.');
      throw new BadRequestException('INSTAGRAM_NOT_CONFIGURED: Meta App ID or Redirect URI is missing in server environment.');
    }

    const state = createSignedOAuthState(userId, signingKey);
    const cleanRedirectUri = redirectUri.trim();

    // If explicit Facebook dialog flow requested
    if (flow === 'facebook') {
      const fbAppId = this.configService.get<string>('META_APP_ID') || this.configService.get<string>('FACEBOOK_APP_ID') || appId;
      const fbScopes = [
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement',
        'business_management',
        'public_profile',
      ].join(',');
      this.logger.log(`Meta Facebook OAuth URL for Instagram generated for client_id=${fbAppId} with redirect_uri=${cleanRedirectUri}`);
      return `https://www.facebook.com/${version}/dialog/oauth?client_id=${encodeURIComponent(fbAppId)}&redirect_uri=${encodeURIComponent(cleanRedirectUri)}&scope=${encodeURIComponent(fbScopes)}&response_type=code&state=${encodeURIComponent(state)}`;
    }

    // Default: Official Instagram Login page at www.instagram.com/oauth/authorize
    // Clean URL without enable_fb_login=0 so it does not trigger "Invalid platform app"
    const scopes = [
      'instagram_business_basic',
      'instagram_business_content_publish',
    ].join(',');

    this.logger.log(`Instagram Login page URL generated for client_id=${appId} with redirect_uri=${cleanRedirectUri}`);
    return `https://www.instagram.com/oauth/authorize?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(cleanRedirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${encodeURIComponent(state)}`;
  }

  /**
   * Handles the OAuth callback from Meta/Instagram, validates the signed state token,
   * exchanges authorization code for a long-lived access token, discovers the Instagram
   * professional account, encrypts the token, and persists the account to PostgreSQL.
   */
  async handleInstagramCallback(code: string, state: string): Promise<any> {
    const appId = this.configService.get<string>('INSTAGRAM_APP_ID') || this.configService.get<string>('META_APP_ID') || this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('INSTAGRAM_APP_SECRET') || this.configService.get<string>('META_APP_SECRET') || this.configService.get<string>('FACEBOOK_APP_SECRET');
    const redirectUri = this.configService.get<string>('META_REDIRECT_URI');
    const version = this.configService.get<string>('META_API_VERSION') || 'v20.0';
    const encryptionKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || 'dev-token-encryption-key-32-chars-long';

    if (!appId || !appSecret || !redirectUri) {
      throw new BadRequestException('INSTAGRAM_NOT_CONFIGURED: Meta App credentials missing.');
    }

    // 1. Verify and decode HMAC-signed state parameter
    let userId: string;
    try {
      const verifiedState = verifySignedOAuthState(state, encryptionKey);
      userId = verifiedState.userId;
    } catch (stateErr: any) {
      this.logger.error(`OAuth state verification failed: ${stateErr.message}`);
      throw new BadRequestException(`INSTAGRAM_AUTH_FAILED: ${stateErr.message}`);
    }

    const fbAppId = this.configService.get<string>('META_APP_ID') || this.configService.get<string>('FACEBOOK_APP_ID') || appId;
    const fbAppSecret = this.configService.get<string>('META_APP_SECRET') || this.configService.get<string>('FACEBOOK_APP_SECRET') || appSecret;

    try {
      // 2. Exchange authorization code for short-lived access token
      // Strip any trailing hash or fragment (e.g. #_ or #_=_ appended by Instagram)
      const cleanCode = code ? code.replace(/#.*$/, '').trim() : code;

      // Exchange authorization code with api.instagram.com (primary for Instagram Login)
      const tokenFormData = new URLSearchParams();
      tokenFormData.append('client_id', appId);
      tokenFormData.append('client_secret', appSecret);
      tokenFormData.append('grant_type', 'authorization_code');
      tokenFormData.append('redirect_uri', redirectUri);
      tokenFormData.append('code', cleanCode);

      let tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenFormData.toString(),
      });
      let tokenData = await tokenResponse.json();

      // Fallback to graph.facebook.com oauth if code was generated via Facebook dialog
      if (!tokenData.access_token) {
        const fbTokenUrl = `https://graph.facebook.com/${version}/oauth/access_token?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${fbAppSecret}&code=${encodeURIComponent(cleanCode)}`;
        const fbRes = await fetch(fbTokenUrl);
        const fbData = await fbRes.json();
        if (fbData.access_token) {
          tokenData = fbData;
        }
      }

      if (tokenData.error) {
        this.logger.error(`Meta/Instagram token exchange error: ${typeof tokenData.error === 'string' ? tokenData.error : JSON.stringify(tokenData.error)}`);
        const errorMsg = typeof tokenData.error === 'string' ? tokenData.error : tokenData.error.message || 'Failed to exchange authorization code for access token';
        throw new Error(errorMsg);
      }

      const shortLivedToken = tokenData.access_token;
      const userIdFromToken = tokenData.user_id ? String(tokenData.user_id) : null;
      if (!shortLivedToken) {
        throw new Error('No access token returned from Meta/Instagram OAuth.');
      }

      // 3. Exchange short-lived token for 60-day long-lived access token
      let longLivedToken = shortLivedToken;
      let tokenExpiresAt: Date | null = null;

      try {
        // Try fb_exchange_token first (standard for Meta Apps)
        const fbExchangeUrl = `https://graph.facebook.com/${version}/oauth/access_token?grant_type=fb_exchange_token&client_id=${fbAppId}&client_secret=${fbAppSecret}&fb_exchange_token=${shortLivedToken}`;
        const fbExchangeRes = await fetch(fbExchangeUrl);
        const fbExchangeData = await fbExchangeRes.json();
        if (fbExchangeData.access_token) {
          longLivedToken = fbExchangeData.access_token;
          if (fbExchangeData.expires_in) {
            tokenExpiresAt = new Date(Date.now() + fbExchangeData.expires_in * 1000);
          }
        } else {
          // Fallback to graph.instagram.com ig_exchange_token
          const igExchangeUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`;
          const igExchangeRes = await fetch(igExchangeUrl);
          const igExchangeData = await igExchangeRes.json();

          if (igExchangeData.access_token) {
            longLivedToken = igExchangeData.access_token;
            if (igExchangeData.expires_in) {
              tokenExpiresAt = new Date(Date.now() + igExchangeData.expires_in * 1000);
            }
          }
        }
      } catch (e) {
        this.logger.warn(`Long-lived token exchange notice: ${e}`);
      }

      // 4. Retrieve Instagram Professional Account information
      let igAccountId: string | null = null;
      let igUsername: string | null = null;
      let pageId: string | null = null;
      let finalToken = longLivedToken;

      // 4a. Query graph.facebook.com me/accounts (primary for Meta App OAuth flow: discovers Instagram Business accounts linked to FB pages)
      try {
        const pagesUrl = `https://graph.facebook.com/${version}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(longLivedToken)}`;
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        if (Array.isArray(pagesData.data)) {
          for (const page of pagesData.data) {
            if (page.instagram_business_account?.id) {
              igAccountId = page.instagram_business_account.id;
              igUsername = page.instagram_business_account.username || `${page.name} (Instagram)`;
              pageId = page.id;
              finalToken = page.access_token || longLivedToken;
              this.logger.log(`Found linked Instagram business account via page ${page.name}: ${igAccountId} (@${igUsername})`);
              break;
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to inspect me/accounts for Instagram account: ${err.message}`);
      }

      // 4b. Query graph.instagram.com me endpoint (primary for Direct Instagram Login flow)
      if (!igAccountId || !igUsername) {
        try {
          const meUrl = `https://graph.instagram.com/v20.0/me?fields=id,user_id,username,account_type,name&access_token=${longLivedToken}`;
          const meResponse = await fetch(meUrl);
          const meData = await meResponse.json();

          if (meData.id || meData.user_id) {
            igAccountId = String(meData.id || meData.user_id || userIdFromToken);
            igUsername = meData.username || meData.name;
          }
        } catch (err: any) {
          this.logger.warn(`Failed to inspect graph.instagram.com me: ${err.message}`);
        }
      }

      // 4c. Fallback: Query graph.facebook.com me endpoint if necessary
      if (!igAccountId || !igUsername) {
        try {
          const fbMeUrl = `https://graph.facebook.com/${version}/me?fields=id,username,name&access_token=${longLivedToken}`;
          const fbMeResponse = await fetch(fbMeUrl);
          const fbMeData = await fbMeResponse.json();

          if (fbMeData.id) {
            igAccountId = fbMeData.id;
            igUsername = fbMeData.username || fbMeData.name || 'instagram_creator';
          }
        } catch {}
      }

      // 4c. Fallback: Query graph.facebook.com me endpoint if necessary
      if (!igAccountId || !igUsername) {
        try {
          const fbMeUrl = `https://graph.facebook.com/${version}/me?fields=id,username,name&access_token=${longLivedToken}`;
          const fbMeResponse = await fetch(fbMeUrl);
          const fbMeData = await fbMeResponse.json();

          if (fbMeData.id) {
            igAccountId = fbMeData.id;
            igUsername = fbMeData.username || fbMeData.name || 'instagram_creator';
          }
        } catch {}
      }

      if (!igAccountId || !igUsername) {
        throw new BadRequestException('INSTAGRAM_ACCOUNT_NOT_ELIGIBLE: No eligible Instagram Professional (Business or Creator) account found linked to your account.');
      }

      // 5. Encrypt access token before storing in PostgreSQL
      const encryptedToken = encrypt(finalToken, encryptionKey);

      // 6. Upsert SocialAccount in PostgreSQL scoped to the authenticated userId
      const account = await this.prisma.socialAccount.upsert({
        where: {
          platform_platformUserId: {
            platform: 'Instagram',
            platformUserId: igAccountId,
          },
        },
        update: {
          userId,
          pageId,
          username: igUsername,
          accessTokenEncrypted: encryptedToken,
          tokenExpiresAt,
          status: 'CONNECTED',
        },
        create: {
          userId,
          platform: 'Instagram',
          platformUserId: igAccountId,
          pageId,
          username: igUsername,
          accessTokenEncrypted: encryptedToken,
          tokenExpiresAt,
          status: 'CONNECTED',
        },
        select: {
          id: true,
          platform: true,
          username: true,
          pageId: true,
          status: true,
          tokenExpiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return account;
    } catch (error: any) {
      this.logger.error(`Instagram OAuth connection failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`INSTAGRAM_AUTH_FAILED: ${error.message}`);
    }
  }

  /**
   * Generates the Meta Facebook Pages OAuth authorization URL.
   * Scopes: pages_show_list, pages_read_engagement, pages_manage_posts, pages_manage_metadata, public_profile
   */
  getFacebookConnectUrl(userId: string): string {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID') || this.configService.get<string>('META_APP_ID') || this.configService.get<string>('INSTAGRAM_APP_ID');
    let redirectUri = this.configService.get<string>('META_FACEBOOK_REDIRECT_URI');
    
    if (!redirectUri) {
      const igRedirect = this.configService.get<string>('META_REDIRECT_URI') || 'http://localhost:3001/api/v1/social/instagram/callback';
      redirectUri = igRedirect.replace('/instagram/callback', '/facebook/callback');
    }

    const signingKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || this.configService.get<string>('jwt.secret') || 'dev-token-encryption-key-32-chars-long';
    const version = this.configService.get<string>('META_API_VERSION') || 'v20.0';

    if (!appId || !redirectUri || appId === 'your-meta-app-id') {
      this.logger.warn('Facebook Meta OAuth configuration is missing.');
      throw new BadRequestException('FACEBOOK_NOT_CONFIGURED: Meta App ID or Redirect URI is missing in server environment.');
    }

    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'pages_manage_metadata',
      'public_profile',
    ].join(',');

    const state = createSignedOAuthState(userId, signingKey);
    const cleanRedirectUri = redirectUri.trim();

    this.logger.log(`Meta Facebook OAuth URL generated for client_id=${appId} with redirect_uri=${cleanRedirectUri}`);

    return `https://www.facebook.com/${version}/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(cleanRedirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${encodeURIComponent(state)}`;
  }

  /**
   * Handles the Facebook OAuth callback from Meta, exchanges authorization code for
   * User token, discovers the managed Facebook Pages, encrypts Page access tokens,
   * and persists them to PostgreSQL.
   */
  async handleFacebookCallback(code: string, state: string): Promise<any> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID') || this.configService.get<string>('META_APP_ID') || this.configService.get<string>('INSTAGRAM_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET') || this.configService.get<string>('META_APP_SECRET') || this.configService.get<string>('INSTAGRAM_APP_SECRET');
    let redirectUri = this.configService.get<string>('META_FACEBOOK_REDIRECT_URI');
    if (!redirectUri) {
      const igRedirect = this.configService.get<string>('META_REDIRECT_URI') || 'http://localhost:3001/api/v1/social/instagram/callback';
      redirectUri = igRedirect.replace('/instagram/callback', '/facebook/callback');
    }

    const version = this.configService.get<string>('META_API_VERSION') || 'v20.0';
    const encryptionKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || 'dev-token-encryption-key-32-chars-long';

    if (!appId || !appSecret || !redirectUri) {
      throw new BadRequestException('FACEBOOK_NOT_CONFIGURED: Meta App credentials missing.');
    }

    // 1. Verify and decode HMAC-signed state parameter
    let userId: string;
    try {
      const verifiedState = verifySignedOAuthState(state, encryptionKey);
      userId = verifiedState.userId;
    } catch (stateErr: any) {
      this.logger.error(`OAuth state verification failed: ${stateErr.message}`);
      throw new BadRequestException(`FACEBOOK_AUTH_FAILED: ${stateErr.message}`);
    }

    try {
      // 2. Exchange authorization code for short-lived user access token
      const tokenUrl = `https://graph.facebook.com/${version}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`;
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        this.logger.error(`Facebook token exchange error: ${typeof tokenData.error === 'string' ? tokenData.error : JSON.stringify(tokenData.error)}`);
        const errorMsg = typeof tokenData.error === 'string' ? tokenData.error : tokenData.error.message || 'Failed to exchange authorization code for Facebook token';
        throw new Error(errorMsg);
      }

      const shortLivedToken = tokenData.access_token;
      if (!shortLivedToken) {
        throw new Error('No user access token returned from Meta Facebook OAuth.');
      }

      // 3. Exchange short-lived token for long-lived user access token (60 days)
      let longLivedUserToken = shortLivedToken;
      try {
        const exchangeUrl = `https://graph.facebook.com/${version}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();
        if (exchangeData.access_token) {
          longLivedUserToken = exchangeData.access_token;
        }
      } catch (e) {
        this.logger.warn(`Long-lived Facebook token exchange notice: ${e}`);
      }

      // 4. Discover user's managed Facebook Pages
      const pagesUrl = `https://graph.facebook.com/${version}/me/accounts?fields=id,name,access_token,category,tasks,is_published&access_token=${longLivedUserToken}`;
      const pagesRes = await fetch(pagesUrl);
      const pagesData = await pagesRes.json();

      if (pagesData.error) {
        throw new Error(pagesData.error.message || 'Failed to retrieve Facebook Pages from Meta.');
      }

      const pages: any[] = pagesData.data || [];
      if (pages.length === 0) {
        throw new BadRequestException('FACEBOOK_NO_PAGES_FOUND: No Facebook Pages found that you are authorized to manage.');
      }

      // 5. Connect and store all managed Facebook Pages (with encrypted Page access tokens)
      const savedAccounts: any[] = [];
      for (const page of pages) {
        if (!page.id || !page.access_token) continue;

        const encryptedPageToken = encrypt(page.access_token, encryptionKey);

        const savedAccount = await this.prisma.socialAccount.upsert({
          where: {
            platform_platformUserId: {
              platform: 'Facebook',
              platformUserId: page.id,
            },
          },
          update: {
            userId,
            pageId: page.id,
            username: page.name,
            accessTokenEncrypted: encryptedPageToken,
            status: 'CONNECTED',
          },
          create: {
            userId,
            platform: 'Facebook',
            platformUserId: page.id,
            pageId: page.id,
            username: page.name,
            accessTokenEncrypted: encryptedPageToken,
            status: 'CONNECTED',
          },
          select: {
            id: true,
            platform: true,
            username: true,
            pageId: true,
            status: true,
            tokenExpiresAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        savedAccounts.push(savedAccount);
      }

      return savedAccounts;
    } catch (error: any) {
      this.logger.error(`Facebook OAuth connection failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`FACEBOOK_AUTH_FAILED: ${error.message}`);
    }
  }

  /**
   * Directly connects Facebook Pages and Instagram accounts given a Meta User/Page Access Token.
   * Useful for immediate local development, testing, or connecting via Graph API Explorer tokens.
   */
  async connectWithMetaToken(userId: string, accessToken: string): Promise<any[]> {
    if (!accessToken || typeof accessToken !== 'string') {
      throw new BadRequestException('A valid Meta Access Token is required.');
    }

    const cleanToken = accessToken.trim();
    const encryptionKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || 'dev-encryption-key-change-in-production';
    const version = this.configService.get<string>('META_API_VERSION') || 'v20.0';

    const savedAccounts: any[] = [];

    // 1. Check if provided token is a LinkedIn OAuth Access Token
    try {
      const liRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${cleanToken}` },
      });
      if (liRes.ok) {
        const liData = await liRes.json();
        if (liData.sub) {
          const memberUrn = liData.sub.startsWith('urn:li:person:') ? liData.sub : `urn:li:person:${liData.sub}`;
          const memberName = liData.name || `${liData.given_name || ''} ${liData.family_name || ''}`.trim() || 'LinkedIn Member';
          const encryptedToken = encrypt(cleanToken, encryptionKey);
          const savedLi = await this.prisma.socialAccount.upsert({
            where: { platform_platformUserId: { platform: 'LinkedIn', platformUserId: memberUrn } },
            update: { userId, username: memberName, accessTokenEncrypted: encryptedToken, status: 'CONNECTED' },
            create: { userId, platform: 'LinkedIn', platformUserId: memberUrn, username: memberName, accessTokenEncrypted: encryptedToken, status: 'CONNECTED' },
          });
          return [savedLi];
        }
      }
    } catch {}

    try {
      const pagesUrl = `https://graph.facebook.com/${version}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(cleanToken)}`;
      const pagesRes = await fetch(pagesUrl);
      const pagesData = await pagesRes.json();

      if (pagesData.error) {
        const meUrl = `https://graph.facebook.com/${version}/me?fields=id,name&access_token=${encodeURIComponent(cleanToken)}`;
        const meRes = await fetch(meUrl);
        const meData = await meRes.json();
        if (meData.error) {
          throw new BadRequestException(`Meta Token Error: ${meData.error.message || pagesData.error.message}`);
        }

        const encryptedToken = encrypt(cleanToken, encryptionKey);
        const savedAccount = await this.prisma.socialAccount.upsert({
          where: {
            platform_platformUserId: {
              platform: 'Facebook',
              platformUserId: meData.id,
            },
          },
          update: {
            userId,
            pageId: meData.id,
            username: meData.name || 'Facebook Account',
            accessTokenEncrypted: encryptedToken,
            status: 'CONNECTED',
          },
          create: {
            userId,
            platform: 'Facebook',
            platformUserId: meData.id,
            pageId: meData.id,
            username: meData.name || 'Facebook Account',
            accessTokenEncrypted: encryptedToken,
            status: 'CONNECTED',
          },
        });
        savedAccounts.push(savedAccount);
        return savedAccounts;
      }

      const pages: any[] = pagesData.data || [];
      if (pages.length === 0) {
        const meUrl = `https://graph.facebook.com/${version}/me?fields=id,name&access_token=${encodeURIComponent(cleanToken)}`;
        const meRes = await fetch(meUrl);
        const meData = await meRes.json();
        if (meData.id) {
          const encryptedToken = encrypt(cleanToken, encryptionKey);
          const acc = await this.prisma.socialAccount.upsert({
            where: { platform_platformUserId: { platform: 'Facebook', platformUserId: meData.id } },
            update: { userId, pageId: meData.id, username: meData.name, accessTokenEncrypted: encryptedToken, status: 'CONNECTED' },
            create: { userId, platform: 'Facebook', platformUserId: meData.id, pageId: meData.id, username: meData.name, accessTokenEncrypted: encryptedToken, status: 'CONNECTED' },
          });
          savedAccounts.push(acc);
          return savedAccounts;
        }
      }

      for (const page of pages) {
        if (!page.id) continue;
        const pageToken = page.access_token || cleanToken;
        const encryptedPageToken = encrypt(pageToken, encryptionKey);

        const savedPage = await this.prisma.socialAccount.upsert({
          where: { platform_platformUserId: { platform: 'Facebook', platformUserId: page.id } },
          update: { userId, pageId: page.id, username: page.name, accessTokenEncrypted: encryptedPageToken, status: 'CONNECTED' },
          create: { userId, platform: 'Facebook', platformUserId: page.id, pageId: page.id, username: page.name, accessTokenEncrypted: encryptedPageToken, status: 'CONNECTED' },
        });
        savedAccounts.push(savedPage);

        if (page.instagram_business_account?.id) {
          const igId = page.instagram_business_account.id;
          const igUsername = page.instagram_business_account.username || `${page.name} (Instagram)`;
          const savedIg = await this.prisma.socialAccount.upsert({
            where: { platform_platformUserId: { platform: 'Instagram', platformUserId: igId } },
            update: { userId, pageId: page.id, username: igUsername, accessTokenEncrypted: encryptedPageToken, status: 'CONNECTED' },
            create: { userId, platform: 'Instagram', platformUserId: igId, pageId: page.id, username: igUsername, accessTokenEncrypted: encryptedPageToken, status: 'CONNECTED' },
          });
          savedAccounts.push(savedIg);
        }
      }

      return savedAccounts;
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(`Failed to connect token: ${e.message}`);
    }
  }

  /**
   * Generates the LinkedIn OAuth 2.0 authorization URL.
   * Scopes: openid, profile, email, w_member_social (and optionally r_organization_social, w_organization_social)
   */
  getLinkedInConnectUrl(userId: string): string {
    const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
    let redirectUri = this.configService.get<string>('LINKEDIN_REDIRECT_URI');

    if (!redirectUri) {
      const igRedirect = this.configService.get<string>('META_REDIRECT_URI') || 'http://localhost:3001/api/v1/social/instagram/callback';
      redirectUri = igRedirect.replace(/\/social\/(instagram|facebook)\/callback/, '/social/linkedin/callback');
    }

    const signingKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || this.configService.get<string>('jwt.secret') || 'dev-token-encryption-key-32-chars-long';

    if (!clientId || !redirectUri || clientId === 'your-linkedin-client-id') {
      this.logger.warn('LinkedIn OAuth configuration is missing.');
      throw new BadRequestException('LINKEDIN_NOT_CONFIGURED: LinkedIn Client ID or Redirect URI is missing in server environment.');
    }

    const customScopes = this.configService.get<string>('LINKEDIN_SCOPES');
    const scopes = customScopes || 'openid profile email w_member_social';

    const state = createSignedOAuthState(userId, signingKey);
    const cleanRedirectUri = redirectUri.trim();

    this.logger.log(`LinkedIn OAuth URL generated for client_id=${clientId} with redirect_uri=${cleanRedirectUri}`);

    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(cleanRedirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}`;
  }

  /**
   * Handles the LinkedIn OAuth callback, exchanges authorization code for
   * access token, discovers member identity and managed organizations,
   * encrypts tokens, and persists records in PostgreSQL.
   */
  async handleLinkedInCallback(code: string, state: string): Promise<any> {
    const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = this.configService.get<string>('LINKEDIN_CLIENT_SECRET');
    let redirectUri = this.configService.get<string>('LINKEDIN_REDIRECT_URI');

    if (!redirectUri) {
      const igRedirect = this.configService.get<string>('META_REDIRECT_URI') || 'http://localhost:3001/api/v1/social/instagram/callback';
      redirectUri = igRedirect.replace(/\/social\/(instagram|facebook)\/callback/, '/social/linkedin/callback');
    }

    const encryptionKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || 'dev-token-encryption-key-32-chars-long';

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('LINKEDIN_NOT_CONFIGURED: LinkedIn credentials missing in environment.');
    }

    // 1. Verify and decode HMAC-signed state parameter
    let userId: string;
    try {
      const verifiedState = verifySignedOAuthState(state, encryptionKey);
      userId = verifiedState.userId;
    } catch (stateErr: any) {
      this.logger.error(`LinkedIn OAuth state verification failed: ${stateErr.message}`);
      throw new BadRequestException(`LINKEDIN_AUTH_FAILED: ${stateErr.message}`);
    }

    try {
      // 2. Exchange authorization code for access token
      const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
      const tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody.toString(),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error) {
        const errorDesc = tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for LinkedIn token';
        this.logger.error(`LinkedIn token exchange error: ${errorDesc}`);
        throw new Error(errorDesc);
      }

      const accessToken = tokenData.access_token;
      if (!accessToken) {
        throw new Error('No access token returned from LinkedIn OAuth.');
      }

      const expiresInSeconds = tokenData.expires_in || 5184000;
      const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      // 3. Fetch authenticated member identity (OpenID userinfo)
      const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userinfoRes.ok) {
        throw new Error(`Failed to retrieve LinkedIn member profile (Status: ${userinfoRes.status})`);
      }

      const userInfo = await userinfoRes.json();
      const memberSub = userInfo.sub;
      if (!memberSub) {
        throw new Error('Missing member sub ID from LinkedIn userinfo response.');
      }

      const memberUrn = memberSub.startsWith('urn:li:person:') ? memberSub : `urn:li:person:${memberSub}`;
      const memberName = userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || 'LinkedIn Member';

      const encryptedToken = encrypt(accessToken, encryptionKey);

      // 4. Save/Upsert Personal Profile
      const savedAccounts: any[] = [];
      const personalAccount = await this.prisma.socialAccount.upsert({
        where: {
          platform_platformUserId: {
            platform: 'LinkedIn',
            platformUserId: memberUrn,
          },
        },
        update: {
          userId,
          username: memberName,
          accessTokenEncrypted: encryptedToken,
          tokenExpiresAt,
          status: 'CONNECTED',
        },
        create: {
          userId,
          platform: 'LinkedIn',
          platformUserId: memberUrn,
          username: memberName,
          accessTokenEncrypted: encryptedToken,
          tokenExpiresAt,
          status: 'CONNECTED',
        },
        select: {
          id: true,
          platform: true,
          username: true,
          pageId: true,
          status: true,
          tokenExpiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      savedAccounts.push(personalAccount);

      // 5. Discover Organizations (if Community Management permissions are authorized)
      try {
        const orgRes = await fetch('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          const elements = orgData.elements || [];

          for (const elem of elements) {
            const orgUrn = elem.organizationalTarget; // e.g. "urn:li:organization:123456"
            if (!orgUrn) continue;

            const orgId = orgUrn.replace('urn:li:organization:', '');
            let orgName = `LinkedIn Organization (${orgId})`;

            // Try fetching organization name
            try {
              const orgDetailsRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (orgDetailsRes.ok) {
                const orgDetails = await orgDetailsRes.json();
                orgName = orgDetails.localizedName || orgDetails.name || orgName;
              }
            } catch {}

            const orgAccount = await this.prisma.socialAccount.upsert({
              where: {
                platform_platformUserId: {
                  platform: 'LinkedIn',
                  platformUserId: orgUrn,
                },
              },
              update: {
                userId,
                pageId: orgId,
                username: orgName,
                accessTokenEncrypted: encryptedToken,
                tokenExpiresAt,
                status: 'CONNECTED',
              },
              create: {
                userId,
                platform: 'LinkedIn',
                platformUserId: orgUrn,
                pageId: orgId,
                username: orgName,
                accessTokenEncrypted: encryptedToken,
                tokenExpiresAt,
                status: 'CONNECTED',
              },
              select: {
                id: true,
                platform: true,
                username: true,
                pageId: true,
                status: true,
                tokenExpiresAt: true,
                createdAt: true,
                updatedAt: true,
              },
            });
            savedAccounts.push(orgAccount);
          }
        }
      } catch (orgErr: any) {
        this.logger.log(`Organization discovery notice: ${orgErr.message}`);
      }

      return savedAccounts;
    } catch (error: any) {
      this.logger.error(`LinkedIn OAuth connection failed: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`LINKEDIN_AUTH_FAILED: ${error.message}`);
    }
  }

  /**
   * Retrieves connected social accounts strictly for the authenticated user.
   * Access tokens and encryption payloads are NEVER returned.
   */
  async getAccounts(userId: string, platform?: string) {
    try {
      const where: any = { userId };
      if (platform) {
        where.platform = { equals: platform, mode: 'insensitive' };
      }
      return await this.prisma.socialAccount.findMany({
        where,
        select: {
          id: true,
          platform: true,
          username: true,
          pageId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e: any) {
      this.logger.error(`Failed to load social accounts: ${e.message}`);
      return [];
    }
  }

  /**
   * Returns current Instagram & Facebook connection status for the authenticated user.
   */
  async getStatus(userId: string) {
    const accounts = await this.getAccounts(userId);
    const connectedAccounts = accounts.filter((a) => a.status === 'CONNECTED');
    return {
      connected: connectedAccounts.length > 0,
      totalAccounts: accounts.length,
      connectedAccountsCount: connectedAccounts.length,
      accounts,
    };
  }

  /**
   * Disconnects a social account with strict ownership validation (IDOR protection).
   */
  async disconnectAccount(userId: string, accountId: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new BadRequestException('Social account not found or access denied.');
    }

    await this.prisma.socialAccount.delete({
      where: { id: accountId },
    });

    return { success: true, message: 'Account disconnected successfully.' };
  }
}
