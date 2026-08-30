// @ts-nocheck
import { factories } from '@strapi/strapi';

const idFilter = (value) => (/^\d+$/.test(String(value)) ? { id: Number(value) } : { documentId: value });

const publicBook = (book) => {
  if (!book) return book;
  return {
    ...book,
    owner: book.owner ? {
      id: book.owner.id,
      documentId: book.owner.documentId,
      username: book.owner.username,
    } : null,
  };
};

export default factories.createCoreController('api::book.book', ({ strapi }) => ({
  async find(ctx) {
    const response = await super.find(ctx);
    if (Array.isArray(response.data)) response.data = response.data.map(publicBook);
    return response;
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    response.data = publicBook(response.data);
    return response;
  },

  async catalogSearch(ctx) {
    const query = String(ctx.query.q || '').trim();
    if (query.length < 2) return ctx.badRequest('Enter at least two characters to search.');
    const params = new URLSearchParams({ q: query, limit: '8', fields: 'key,title,author_name,first_publish_year,isbn,cover_i,language' });
    try {
      const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } });
      if (!response.ok) return ctx.badGateway('The external book catalogue is temporarily unavailable.');
      const payload = await response.json();
      const languageMap = { fre: 'FR', fra: 'FR', eng: 'EN', gre: 'GR', ell: 'GR' };
      ctx.body = { data: (payload.docs || []).filter((book) => book.title).map((book) => ({
        id: book.key, title: book.title, author: book.author_name?.[0] || '', year: book.first_publish_year || null,
        isbn: book.isbn?.[0] || null, language: languageMap[book.language?.[0]] || null,
        coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
      })) };
    } catch (error) {
      return ctx.badGateway('The external book catalogue is temporarily unavailable.');
    }
  },

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
