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
    const existingHeraklion = await strapi.db.query('api::zone.zone').findOne({ where: { slug: 'heraklion' } });
    if (existingHeraklion && (existingHeraklion.enabled !== true || !existingHeraklion.countryCode)) {
      await strapi.db.query('api::zone.zone').update({ where: { id: existingHeraklion.id }, data: { enabled: true, countryCode: existingHeraklion.countryCode || 'GR' } });
    }
    const lyon = await strapi.db.query('api::zone.zone').findOne({ where: { slug: 'lyon' } });
    if (!lyon) {
      await strapi.db.query('api::zone.zone').create({ data: { name: 'Lyon', slug: 'lyon', countryCode: 'FR', enabled: false } });
    }
    const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5174';
    const usersPermissionsStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
    const advancedSettings = await usersPermissionsStore.get({ key: 'advanced' }) || {};
    const emailConfirmationEnabled = process.env.ENABLE_EMAIL_CONFIRMATION === 'true';
    await usersPermissionsStore.set({ key: 'advanced', value: {
      ...advancedSettings,
      email_confirmation: emailConfirmationEnabled,
      email_confirmation_redirection: `${appUrl}/email-confirmed`,
      email_reset_password: `${appUrl}/reset-password`,
    } });

    // The first deployment starts with one active area. Existing books are
    // assigned to it so adding the required book.zone relation is backwards
    // compatible with the local catalogue.
    let heraklion = await strapi.db.query('api::zone.zone').findOne({ where: { slug: 'heraklion' } });
    if (!heraklion) {
      heraklion = await strapi.db.query('api::zone.zone').create({
        data: { name: 'Heraklion', slug: 'heraklion', countryCode: 'GR', enabled: true },
      });
    }
    const booksWithoutZone = await strapi.db.query('api::book.book').findMany({
      where: { zone: { $null: true } },
      select: ['id'],
    });
    for (const book of booksWithoutZone) {
      await strapi.db.query('api::book.book').update({ where: { id: book.id }, data: { zone: heraklion.id } });
    }
    // Age categories changed from the former kids/adults split to the more
    // precise Kids (0-10), Teenagers (11-15), Adults (16+) split.
    const formerKidsBooks = await strapi.db.query('api::book.book').findMany({
      where: { age: 'kids' },
      select: ['id'],
    });
    for (const book of formerKidsBooks) {
      await strapi.db.query('api::book.book').update({ where: { id: book.id }, data: { age: 'teenagers' } });
    }

    // Keep the authenticated API role in sync for the custom borrowing and
    // messaging routes. This also makes fresh/local databases work without a
    // manual Content Manager permission step.
    const actions = [
      'api::book.book.find', 'api::book.book.findOne',
      'api::book.book.create',
      'api::book.book.update', 'api::book.book.delete',
      'plugin::upload.upload.upload',
      'api::loan.request', 'api::loan.status', 'api::loan.accept', 'api::loan.refuse', 'api::loan.confirmReceived',
      'api::loan.confirmLent', 'api::loan.confirmReturned',
      'api::loan.confirmReceivedBack', 'api::conversation.mine',
      'api::book.catalogSearch', 'api::book.book.catalogSearch',
      'api::book.favorites', 'api::book.toggleFavorite',
      'api::book.book.favorites', 'api::book.book.toggleFavorite',
      'api::conversation.messages', 'api::conversation.send',
      'api::conversation.archive',
      // Strapi 5 may derive the scope with the API UID repeated for custom
      // controllers; keep these aliases for existing development databases.
      'api::loan.loan.request', 'api::loan.loan.status', 'api::loan.loan.accept', 'api::loan.loan.refuse',
      'api::loan.loan.confirmReceived', 'api::loan.loan.confirmLent',
      'api::loan.loan.confirmReturned', 'api::loan.loan.confirmReceivedBack',
      'api::conversation.conversation.mine', 'api::conversation.conversation.messages',
      'api::conversation.conversation.send', 'api::conversation.markRead',
      'api::conversation.conversation.markRead',
      'api::conversation.conversation.archive', 'api::conversation.archive',
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
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
    if (publicRole) {
      const publicActions = ['api::zone.zone.find', 'api::book.book.find', 'api::book.book.findOne'];
      for (const action of publicActions) {
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action }, populate: { role: true } });
        if (!existing || existing.role?.id !== publicRole.id) {
          await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: publicRole.id } });
        }
      }
    }
  },
};
