// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::conversation.conversation', ({ strapi }) => ({
  async mine(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) return ctx.unauthorized();
    const rows = await strapi.db.query('api::conversation.conversation').findMany({
      where: { $or: [{ participantOne: userId }, { participantTwo: userId }] },
      orderBy: { lastMessageAt: 'desc' },
      populate: { participantOne: true, participantTwo: true, loans: { populate: { book: { populate: { image: true } }, lender: true, borrower: true } } },
    });
    const withUnread = await Promise.all(rows.map(async (row) => {
      const incoming = await strapi.db.query('api::message.message').findMany({
        where: { conversation: row.id, readAt: null },
        populate: { sender: true },
      });
      return { ...row, unreadCount: incoming.filter((message) => message.sender?.id !== userId).length };
    }));
    ctx.body = { data: withUnread.map((row) => ({
      ...row,
      participantOne: this.publicUser(row.participantOne),
      participantTwo: this.publicUser(row.participantTwo),
      loans: (row.loans || []).map((loan) => ({
        ...loan,
        lender: this.publicUser(loan.lender),
        borrower: this.publicUser(loan.borrower),
      })),
    })) };
  },

  async markRead(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) return ctx.unauthorized();
    const conversation = await this.findParticipantConversation(ctx.params.id, userId);
    if (!conversation) return ctx.notFound('Conversation not found.');
    const unread = await strapi.db.query('api::message.message').findMany({
      where: { conversation: conversation.id, readAt: null }, populate: { sender: true },
    });
    for (const message of unread.filter((item) => item.sender?.id !== userId)) {
      await strapi.db.query('api::message.message').update({ where: { id: message.id }, data: { readAt: new Date() } });
    }
    ctx.body = { data: { ok: true } };
  },

  async messages(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) return ctx.unauthorized();
    const conversation = await this.findParticipantConversation(ctx.params.id, userId);
    if (!conversation) return ctx.notFound('Conversation not found.');
    const rows = await strapi.db.query('api::message.message').findMany({
      where: { conversation: conversation.id },
      orderBy: { createdAt: 'asc' },
      populate: { sender: true },
    });
    ctx.body = { data: rows.map((row) => ({ ...row, sender: this.publicUser(row.sender) })) };
  },

  async send(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) return ctx.unauthorized();
    const conversation = await this.findParticipantConversation(ctx.params.id, userId);
    if (!conversation) return ctx.notFound('Conversation not found.');
    const content = String(ctx.request.body?.content || '').trim();
    if (!content) return ctx.badRequest('Message content is required.');
    const purpose = ctx.request.body?.purpose === 'returnArrangement' ? 'returnArrangement' : 'chat';
    const message = await strapi.db.query('api::message.message').create({
      data: { conversation: conversation.id, sender: userId, content, isSystem: false, purpose },
      populate: { sender: true },
    });
    await strapi.db.query('api::conversation.conversation').update({
      where: { id: conversation.id }, data: { lastMessageAt: new Date() },
    });
    ctx.body = { data: { ...message, sender: this.publicUser(message.sender) } };
  },

  async findParticipantConversation(identifier, userId) {
    const where = /^\d+$/.test(String(identifier)) ? { id: Number(identifier) } : { documentId: identifier };
    return strapi.db.query('api::conversation.conversation').findOne({
      where: { ...where, $or: [{ participantOne: userId }, { participantTwo: userId }] },
      populate: { participantOne: true, participantTwo: true },
    });
  },

  publicUser(user) {
    if (!user) return null;
    return { id: user.id, documentId: user.documentId, username: user.username };
  },
}));
