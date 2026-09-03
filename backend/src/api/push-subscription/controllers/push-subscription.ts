// @ts-nocheck
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::push-subscription.push-subscription', ({ strapi }) => ({
  async subscribe(ctx) {
    const userId = ctx.state.user?.id;
    const { endpoint, keys } = ctx.request.body || {};
    if (!userId) return ctx.unauthorized();
    if (!endpoint || !keys?.p256dh || !keys?.auth) return ctx.badRequest('A valid push subscription is required.');
    const existing = await strapi.db.query('api::push-subscription.push-subscription').findOne({ where: { endpoint } });
    const data = { endpoint, p256dh: keys.p256dh, auth: keys.auth, user: userId };
    const subscription = existing
      ? await strapi.db.query('api::push-subscription.push-subscription').update({ where: { id: existing.id }, data })
      : await strapi.db.query('api::push-subscription.push-subscription').create({ data });
    ctx.body = { data: { id: subscription.documentId || subscription.id } };
  },

  async unsubscribe(ctx) {
    const userId = ctx.state.user?.id;
    const { endpoint } = ctx.request.body || {};
    if (!userId) return ctx.unauthorized();
    if (!endpoint) return ctx.badRequest('An endpoint is required.');
    const existing = await strapi.db.query('api::push-subscription.push-subscription').findOne({ where: { endpoint, user: userId } });
    if (existing) await strapi.db.query('api::push-subscription.push-subscription').delete({ where: { id: existing.id } });
    ctx.body = { data: { ok: true } };
  },
}));
