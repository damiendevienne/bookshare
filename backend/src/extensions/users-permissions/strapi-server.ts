// @ts-nocheck

export default (plugin) => {
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    const body = ctx.request.body || {};
    const charterAccepted = body.communityCharterAccepted === true || body.communityCharterAccepted === 'true';
    delete body.communityCharterAccepted;

    await originalRegister(ctx);

    const createdUserId = ctx.body?.user?.id;
    if (charterAccepted && createdUserId) {
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: createdUserId },
        data: { communityCharterAccepted: true },
      });
    }
  };

  return plugin;
};
