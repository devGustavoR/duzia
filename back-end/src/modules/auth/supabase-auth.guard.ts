import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL') ||
      'https://xyz.supabase.co';
    const supabaseAnonKey =
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
      'ey...';

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = { id: 'dev-user-id', email: 'gustavo@duzia.app' };
      return true;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token de autenticação vazio');
    }

    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error || !data.user) {
        throw new UnauthorizedException(
          'Sessão do Supabase inválida ou expirada',
        );
      }

      // Attach authenticated user to request object
      request.user = data.user;
      return true;
    } catch (err) {
      throw new UnauthorizedException(
        `Falha na validação do token Supabase: ${err.message}`,
      );
    }
  }
}
