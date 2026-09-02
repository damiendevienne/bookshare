// @ts-nocheck

export default (plugin) => {
  const contentApiRoutes = plugin.routes['content-api']?.routes;
  contentApiRoutes?.push({
    method: 'GET',
    path: '/auth/reset-password/validate',
    handler: 'auth.validateResetPasswordToken',
    config: { auth: false },
  });

  const originalAuthFactory = plugin.controllers.auth;
  plugin.controllers.auth = ({ strapi }) => {
    const originalAuth = originalAuthFactory({ strapi });
    const originalRegister = originalAuth.register;
    const originalEmailConfirmation = originalAuth.emailConfirmation;

    originalAuth.validateResetPasswordToken = async (ctx) => {
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
    };

    originalAuth.register = async (ctx) => {
      const body = ctx.request.body || {};
      const charterAccepted = body.communityCharterAccepted === true || body.communityCharterAccepted === 'true';
      if (!charterAccepted) {
        return ctx.badRequest('You must accept the Community Charter to create an account.');
      }
      body.favoriteBookIds = [];
      await originalRegister(ctx);
    };

    originalAuth.emailConfirmation = async (ctx) => {
      try {
        return await originalEmailConfirmation(ctx);
      } catch (error) {
        const appUrl = strapi.config.get('server.url') || '/';
        ctx.redirect(`${appUrl}/email-confirmed?error=invalid-token`);
      }
    };

    return originalAuth;
  };

  return plugin;
};
