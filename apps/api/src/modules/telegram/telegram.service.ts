import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type TelegramEvent =
  | 'order.new'
  | 'order.status'
  | 'courier.assigned'
  | 'restaurant.alert'
  | 'admin.alert';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string;
  private readonly chats: Record<string, string>;

  constructor(private config: ConfigService) {
    this.token = this.config.get('TELEGRAM_BOT_TOKEN', '');
    this.chats = {
      admin: this.config.get('TELEGRAM_CHAT_ADMIN', ''),
      orders: this.config.get('TELEGRAM_CHAT_ORDERS', ''),
      couriers: this.config.get('TELEGRAM_CHAT_COURIERS', ''),
      restaurants: this.config.get('TELEGRAM_CHAT_RESTAURANTS', ''),
      operators: this.config.get('TELEGRAM_CHAT_OPERATORS', ''),
    };
  }

  isEnabled(): boolean {
    return Boolean(this.token);
  }

  resolveChat(event: TelegramEvent): string {
    switch (event) {
      case 'order.new':
      case 'order.status':
        return this.chats.orders || this.chats.operators || this.chats.admin;
      case 'courier.assigned':
        return this.chats.couriers || this.chats.operators;
      case 'restaurant.alert':
        return this.chats.restaurants || this.chats.operators;
      case 'admin.alert':
      default:
        return this.chats.admin || this.chats.operators;
    }
  }

  async send(event: TelegramEvent, text: string, chatId?: string): Promise<boolean> {
    if (!this.token) return false;
    const target = chatId || this.resolveChat(event);
    if (!target) {
      this.logger.warn(`No Telegram chat for event ${event}`);
      return false;
    }
    return this.sendRaw(target, text);
  }

  async sendRaw(chatId: string, text: string, retries = 3): Promise<boolean> {
    if (!this.token) return false;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        });
        if (res.ok) return true;
        const err = await res.text();
        this.logger.warn(`Telegram attempt ${i + 1} failed: ${err}`);
      } catch (e) {
        this.logger.warn(`Telegram error: ${e}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
    return false;
  }

  formatOrderAlert(order: {
    orderNumber: string;
    total: number;
    status: string;
    vendorName?: string;
    address?: string;
  }): string {
    return [
      '🛵 <b>FoodMarket</b>',
      `Buyurtma: <b>${order.orderNumber}</b>`,
      order.vendorName ? `Do'kon: ${order.vendorName}` : '',
      `Holat: ${order.status}`,
      `Summa: ${formatUzs(order.total)}`,
      order.address ? `Manzil: ${order.address}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
}

export function formatUzs(amount: number): string {
  return `${Math.round(amount).toLocaleString('uz-UZ')} so'm`;
}
