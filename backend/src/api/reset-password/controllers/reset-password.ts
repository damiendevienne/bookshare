export default {
  async validate(ctx) {
    const code = ctx.query?.code;
    if (!code || typeof code !== 'string') {
      return ctx.badRequest('This reset link is invalid or incomplete.');
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { resetPasswordToken: code },
    });
    if (!user) {
      return ctx.badRequest('This reset link is invalid or has expired.');
    }

    ctx.body = { valid: true };
  },
};
