import { Worker } from 'bullmq';
import { PrismaClient } from '@foodmarket/database';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const prisma = new PrismaClient();
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

async function sendTelegram(chatId: string, text: string, retries = 3) {
  if (!TELEGRAM_TOKEN || !chatId) return;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      });
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
}

function resolveChat(event: string): string {
  const map: Record<string, string> = {
    'order.new': process.env.TELEGRAM_CHAT_ORDERS || process.env.TELEGRAM_CHAT_OPERATORS || '',
    'order.status': process.env.TELEGRAM_CHAT_ORDERS || '',
    'courier.assigned': process.env.TELEGRAM_CHAT_COURIERS || '',
    'restaurant.alert': process.env.TELEGRAM_CHAT_RESTAURANTS || '',
    'admin.alert': process.env.TELEGRAM_CHAT_ADMIN || '',
  };
  return map[event] || process.env.TELEGRAM_CHAT_ADMIN || '';
}

const ordersWorker = new Worker(
  'orders',
  async (job) => {
    console.log(`[orders] ${job.name}`, job.data);
  },
  { connection },
);

const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    if (job.name === 'push') {
      const { userId, title, body, data } = job.data as {
        userId: string;
        title: string;
        body: string;
        data?: Record<string, unknown>;
      };
      await prisma.notification.create({
        data: {
          userId,
          type: 'ORDER_UPDATE',
          title,
          body,
          data: data ?? undefined,
          sentAt: new Date(),
        },
      });
    }
  },
  { connection },
);

const telegramWorker = new Worker(
  'telegram',
  async (job) => {
    if (job.name === 'send') {
      const { event, text, chatId } = job.data as {
        event: string;
        text: string;
        chatId?: string;
      };
      const target = chatId || resolveChat(event);
      await sendTelegram(target, text);
    }
  },
  { connection },
);

console.log('Workers: orders, notifications, telegram');
process.on('SIGTERM', async () => {
  await ordersWorker.close();
  await notificationsWorker.close();
  await telegramWorker.close();
  await prisma.$disconnect();
});
