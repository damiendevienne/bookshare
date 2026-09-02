// @ts-nocheck

export default (plugin) => {
  const originalAuthFactory = plugin.controllers.auth;
  plugin.controllers.auth = ({ strapi }) => {
    const originalAuth = originalAuthFactory({ strapi });
    const originalRegister = originalAuth.register;

    originalAuth.register = async (ctx) => {
      const body = ctx.request.body || {};
      const charterAccepted = body.communityCharterAccepted === true || body.communityCharterAccepted === 'true';
      if (!charterAccepted) {
        return ctx.badRequest('You must accept the Community Charter to create an account.');
      }
      body.favoriteBookIds = [];
      await originalRegister(ctx);
    };

    return originalAuth;
  };

  return plugin;
};
