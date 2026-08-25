import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const createMockContext = (headers: Record<string, string> = {}, isPublic = false): ExecutionContext => {
    const mockRequest = { headers };
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('canActivate & handleRequest', () => {
    it('should allow access without authentication for @Public() routes', () => {
      const context = createMockContext({}, true);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException when no user is resolved from token', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when passport error occurs', () => {
      const error = new Error('Token expired');
      expect(() => {
        guard.handleRequest(error, null, null);
      }).toThrow();
    });

    it('should return authenticated user when valid user is resolved', () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'USER',
        isActive: true,
      };

      const result = guard.handleRequest(null, mockUser, null);
      expect(result).toEqual(mockUser);
    });

    it('should never return a mock user or fallback user on unauthenticated request', () => {
      expect(() => {
        guard.handleRequest(null, false, { message: 'No auth token' });
      }).toThrow(UnauthorizedException);
    });
  });
});
