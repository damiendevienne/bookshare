export default {
  async send(ctx) {
    const user = ctx.state.user;
    const message = String(ctx.request.body?.message || '').trim();
    if (!message) return ctx.badRequest('Please write a message.');
    if (message.length > 3000) return ctx.badRequest('Your message cannot exceed 3000 characters.');
    const recipient = process.env.FEEDBACK_RECIPIENT || 'damien2vienne@gmail.com';
    await strapi.plugin('email').service('email').send({
      to: recipient,
      subject: `Maki Books feedback from ${user.username}`,
      text: `From: ${user.username} (${user.email})\n\n${message}`,
    });
    ctx.body = { data: { sent: true } };
  },
};
