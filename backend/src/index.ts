// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Keep the authenticated API role in sync for the custom borrowing and
    // messaging routes. This also makes fresh/local databases work without a
    // manual Content Manager permission step.
    const actions = [
      'api::loan.request', 'api::loan.status', 'api::loan.accept', 'api::loan.refuse', 'api::loan.confirmReceived',
      'api::loan.confirmLent', 'api::loan.confirmReturned',
      'api::loan.confirmReceivedBack', 'api::conversation.mine',
      'api::book.catalogSearch', 'api::book.book.catalogSearch',
      'api::conversation.messages', 'api::conversation.send',
      // Strapi 5 may derive the scope with the API UID repeated for custom
      // controllers; keep these aliases for existing development databases.
      'api::loan.loan.request', 'api::loan.loan.status', 'api::loan.loan.accept', 'api::loan.loan.refuse',
      'api::loan.loan.confirmReceived', 'api::loan.loan.confirmLent',
      'api::loan.loan.confirmReturned', 'api::loan.loan.confirmReceivedBack',
      'api::conversation.conversation.mine', 'api::conversation.conversation.messages',
      'api::conversation.conversation.send', 'api::conversation.markRead',
      'api::conversation.conversation.markRead',
    ];
    const role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });
    if (!role) return;
    for (const action of actions) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action }, populate: { role: true },
      });
      if (!existing || existing.role?.id !== role.id) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: role.id },
        });
      }
    }
  },
};
