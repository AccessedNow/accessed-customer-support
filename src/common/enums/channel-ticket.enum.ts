export enum ChannelTicketEnum {
  WEB = 'web',
  CORP = 'corp',
  CHAT = 'chat',
  WHATSAPP = 'whatsapp',
  LINKEDIN = 'linkedin',
}

export const ChannelTicket: Record<keyof typeof ChannelTicketEnum, string> = {
  WEB: ChannelTicketEnum.WEB,
  CORP: ChannelTicketEnum.CORP,
  CHAT: ChannelTicketEnum.CHAT,
  WHATSAPP: ChannelTicketEnum.WHATSAPP,
  LINKEDIN: ChannelTicketEnum.LINKEDIN,
};
