import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const configuredKey =
      this.configService.get<string>('API_KEY') || 'duzia-secret-api-key';

    const apiKeyHeader =
      request.headers['x-api-key'] || request.query?.apiKey;

    if (!apiKeyHeader || apiKeyHeader !== configuredKey) {
      throw new UnauthorizedException('API Key inválida ou ausente');
    }

    return true;
  }
}
