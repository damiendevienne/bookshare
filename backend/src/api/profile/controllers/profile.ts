export default {
  async update(ctx) {
    const current = ctx.state.user;
    const data = ctx.request.body?.data || {};
    const username = String(data.username ?? current.username).trim();
    const email = String(data.email ?? current.email).trim().toLowerCase();
    const firstName = String(data.firstName ?? '').trim();
    const lastName = String(data.lastName ?? '').trim();
    if (username.length < 3 || username.length > 50) return ctx.badRequest('Username must be between 3 and 50 characters.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ctx.badRequest('Please enter a valid email address.');
    const duplicate = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { $or: [{ username }, { email }], id: { $ne: current.id } } });
    if (duplicate) return ctx.badRequest('That username or email address is already in use.');
    const emailChanged = email !== current.email;
    const updated = await strapi.plugin('users-permissions').service('user').edit(current.id, { username, email, firstName, lastName, ...(emailChanged ? { confirmed: false } : {}) });
    if (emailChanged) await strapi.plugin('users-permissions').service('user').sendConfirmationEmail(updated);
    ctx.body = { data: { id: updated.id, documentId: updated.documentId, username: updated.username, email: updated.email, firstName: updated.firstName, lastName: updated.lastName, confirmed: updated.confirmed }, emailConfirmationRequired: emailChanged };
  },
};
