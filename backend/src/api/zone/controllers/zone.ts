// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::zone.zone', ({ strapi }) => ({
  async find(ctx) {
    const zones = await strapi.db.query('api::zone.zone').findMany({
      orderBy: { name: 'asc' },
      select: ['id', 'documentId', 'name', 'slug'],
    });
    ctx.body = { data: zones };
  },
}));
