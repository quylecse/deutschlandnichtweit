import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppService.name);
  private keepAliveTimer?: ReturnType<typeof setInterval>;

  onModuleInit() {
    const publicUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.BACKEND_PUBLIC_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://deutschlandnichtweit.onrender.com' : '');

    if (!publicUrl) {
      return;
    }

    // Render Free Tier spins down after 15 minutes of inactivity.
    // Ping every 13 minutes to keep the instance warm.
    const intervalMs = 13 * 60 * 1000;
    this.logger.log(`Keep-alive cron enabled for ${publicUrl} (every 13m)`);

    this.keepAliveTimer = setInterval(async () => {
      try {
        const res = await fetch(`${publicUrl.replace(/\/$/, '')}/api/health`);
        this.logger.debug(`Keep-alive ping status: ${res.status}`);
      } catch (err) {
        this.logger.warn(`Keep-alive ping failed: ${(err as Error).message}`);
      }
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }
  }

  getHello(): string {
    return 'Deutschland ist nicht weit!';
  }
}
