import { z } from 'zod';

export const TelegramUpdateType = z.enum(['text_message', 'bot_command']);
export const TelegramBotCommandUpdateSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    from: z.object({
      id: z.number(),
      is_bot: z.boolean(),
      first_name: z.string(),
      username: z.string(),
      language_code: z.string()
    }),
    chat: z.object({
      id: z.number(),
      first_name: z.string(),
      username: z.string(),
      type: z.string()
    }),
    date: z.number(),
    text: z.string(),
    entities: z.array(
      z.object({ offset: z.number(), length: z.number(), type: z.enum(['bot_command']) })
    ).length(1)
  }),
});
export const TelegramBotMessageSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    from: z.object({
      id: z.number(),
      is_bot: z.literal(false),
      first_name: z.string(),
      username: z.string(),
      language_code: z.string()
    }),
    chat: z.object({
      id: z.number(),
      first_name: z.string(),
      username: z.string(),
      type: z.string()
    }),
    date: z.number(),
    text: z.string()
  }),
  updateType: z.string().optional().default('text_message')
});


export type TelegramUpdate = z.infer<typeof TelegramBotCommandUpdateSchema>['message'];
export type TelegramChatInfo = TelegramUpdate['chat'];
export type TelegramUserInfo = TelegramUpdate['from'];

export const TelegramAccountConnectionDataSchema = z.object({
  chatId: TelegramBotCommandUpdateSchema.shape.message.shape.chat.shape.id.and(TelegramBotMessageSchema.shape.message.shape.chat.shape.id),
  userInfo: TelegramBotCommandUpdateSchema.shape.message.shape.from.or(TelegramBotMessageSchema.shape.message.shape.from)
});

export type TelegramAccountConnectionData = z.infer<typeof TelegramAccountConnectionDataSchema>;
