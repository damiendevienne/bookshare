// @ts-nocheck
import { factories } from '@strapi/strapi';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const idFilter = (value) => (/^\d+$/.test(String(value)) ? { id: Number(value) } : { documentId: value });
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const imageCount = (image) => {
  if (Array.isArray(image)) return image.length;
  if (image && Array.isArray(image.set)) return image.set.length;
  if (image && Array.isArray(image.connect)) return image.connect.length;
  return image ? 1 : 0;
};

const attachCatalogCover = async (strapi, bookId, coverUrl, user) => {
  const response = await fetch(coverUrl, { signal: AbortSignal.timeout(8000), headers: { Accept: 'image/*' } });
  if (!response.ok) throw new Error(`Cover download failed with status ${response.status}`);
  const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error('Catalogue cover is not an image');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_COVER_SIZE) throw new Error('Catalogue cover is larger than 5 MB');
  const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const filepath = path.join(os.tmpdir(), `book-cover-${bookId}-${Date.now()}.${extension}`);
  await fs.writeFile(filepath, buffer);
  try {
    return strapi.plugin('upload').service('upload').upload({
      data: { refId: bookId, ref: 'api::book.book', field: 'image' },
      files: { filepath, originalFilename: `book-cover-${bookId}.${extension}`, mimetype: contentType, size: buffer.length },
    }, { user });
  } finally {
    await fs.rm(filepath, { force: true });
  }
};

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

const markBooksWithActiveLoans = async (strapi, books) => {
  const activeLoans = await strapi.db.query('api::loan.loan').findMany({
    where: { status: 'active' },
    populate: { book: true },
  });
  const activeBookIds = new Set(activeLoans.map((loan) => loan.book?.id).filter(Boolean));
  return books.map((book) => activeBookIds.has(book.id) ? { ...book, available: false } : book);
};

export default factories.createCoreController('api::book.book', ({ strapi }) => ({
  async find(ctx) {
    const response = await super.find(ctx);
    if (Array.isArray(response.data)) {
      response.data = await markBooksWithActiveLoans(strapi, response.data);
      response.data = response.data.map(publicBook);
    }
    return response;
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    if (response.data) {
      response.data = (await markBooksWithActiveLoans(strapi, [response.data]))[0];
      response.data = publicBook(response.data);
    }
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
    if (imageCount(data.image) > 2) {
      return ctx.badRequest('A book can have at most 2 images.');
    }
    data.owner = ctx.state.user.id;
    ctx.request.body = { ...ctx.request.body, data };
    const response = await super.create(ctx);
    // Catalogue covers are initially URLs. Cache a local Strapi copy so future
    // page loads do not depend on Open Library response time or availability.
    if (data.catalogSource === 'openlibrary' && data.coverUrl && response.data?.id) {
      try {
        const uploaded = await attachCatalogCover(strapi, response.data.id, data.coverUrl, ctx.state.user);
        response.data.image = uploaded;
      } catch (error) {
        strapi.log.warn(`Unable to cache catalogue cover for book ${response.data.id}: ${error.message}`);
      }
    }
    return response;
  },

  async update(ctx) {
    const book = await this.findOwnedBook(ctx);
    if (!book) return;
    const data = { ...(ctx.request.body?.data || {}) };
    delete data.owner;
    if (imageCount(data.image) > 2) {
      return ctx.badRequest('A book can have at most 2 images.');
    }

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
      where: { ...idFilter(identifier), publishedAt: { $notNull: true } },
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
