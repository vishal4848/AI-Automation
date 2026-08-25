import { ScheduledPost, SocialAccount } from '@prisma/client';

export interface SocialPublisher {
  /**
   * Validates if the account and media are ready for publishing
   */
  validate(account: SocialAccount, post: ScheduledPost): Promise<boolean>;
  
  /**
   * Publishes the content to the specific platform
   * @returns The external post ID
   */
  publish(account: SocialAccount, post: ScheduledPost): Promise<string>;
}
