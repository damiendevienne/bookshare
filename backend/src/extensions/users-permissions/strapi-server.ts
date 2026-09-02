// @ts-nocheck

export default (plugin) => {
  const originalAuthFactory = plugin.controllers.auth;
  plugin.controllers.auth = ({ strapi }) => {
    const originalAuth = originalAuthFactory({ strapi });
    const originalRegister = originalAuth.register;
    const originalEmailConfirmation = originalAuth.emailConfirmation;

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
