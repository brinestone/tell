import defaultLogger from "@logger/common";

export async function sendTelegramBotMessage(chatId: number, message: string) {
  const url = new URL(`/bot${process.env['TM_BOT_TOKEN']}/sendMessage`, 'https://api.telegram.org');
  url.searchParams.set('chat_id', chatId.toString());
  url.searchParams.set('text', message);
  url.searchParams.set('parse_mode', 'Markdown');

  const response = await fetch(url, { method: 'GET' }).then(res => res.json());
  defaultLogger.info('telegram message sent', 'chat_id', chatId, 'response', response);
}
