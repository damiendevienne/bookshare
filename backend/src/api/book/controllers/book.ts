// @ts-nocheck
import { factories } from '@strapi/strapi';

const idFilter = (value) => (/^\d+$/.test(String(value)) ? { id: Number(value) } : { documentId: value });

export default factories.createCoreController('api::book.book', ({ strapi }) => ({
  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    const data = { ...(ctx.request.body?.data || {}) };
    if (!String(data.title || '').trim() || !String(data.author || '').trim()) {
      return ctx.badRequest('Title and author are required.');
    }
    data.owner = ctx.state.user.id;
    ctx.request.body = { ...ctx.request.body, data };
    return super.create(ctx);
  },

  async update(ctx) {
    const book = await this.findOwnedBook(ctx);
    if (!book) return;
    const data = { ...(ctx.request.body?.data || {}) };
    delete data.owner;

    // A book involved in an active loan cannot be made available manually.
    // It becomes available again only after the return is confirmed by both
    // participants in the loan workflow.
    if (data.available === true) {
      const activeLoan = await strapi.db.query('api::loan.loan').findOne({
        where: { book: book.id, status: 'active' },
        populate: { borrower: true, conversation: true },
      });
      if (activeLoan) {
        return ctx.badRequest(
          'This book is currently lent. Confirm its return before making it available.',
          {
            conversationId: activeLoan.conversation?.documentId ?? activeLoan.conversation?.id,
            borrower: activeLoan.borrower?.username,
          }
        );
      }
    }
    ctx.request.body = { ...ctx.request.body, data };
    return super.update(ctx);
  },

  async delete(ctx) {
    const book = await this.findOwnedBook(ctx);
    if (!book) return;
    const loan = await strapi.db.query('api::loan.loan').findOne({
      where: { book: book.id, status: { $in: ['requested', 'active'] } },
      populate: { borrower: true, conversation: true },
    });
    if (loan) {
      return ctx.badRequest(
        'This book is currently requested or lent. Recover it before removing it.',
        { conversationId: loan.conversation?.documentId ?? loan.conversation?.id, borrower: loan.borrower?.username }
      );
    }
    return super.delete(ctx);
  },

  async findOwnedBook(ctx) {
    if (!ctx.state.user) {
      ctx.unauthorized();
      return null;
    }
    const identifier = ctx.params.documentId ?? ctx.params.id;
    const book = await strapi.db.query('api::book.book').findOne({
      where: idFilter(identifier),
      populate: { owner: true },
    });
    if (!book) {
      ctx.notFound('Book not found.');
      return null;
    }
    if (book.owner?.id !== ctx.state.user.id) {
      ctx.forbidden('You can only manage your own books.');
      return null;
    }
    return book;
  },
}));
