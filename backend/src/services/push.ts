// @ts-nocheck
import webpush from 'web-push';

let configured = false;

function configure() {
  if (configured) return true;
  const subject = process.env.WEB_PUSH_SUBJECT;
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function notifyUsers(strapi, userIds, payload) {
  if (!configure()) return;
  const ids = [...new Set(userIds.filter(Boolean))];
  for (const userId of ids) {
    const subscriptions = await strapi.db.query('api::push-subscription.push-subscription').findMany({ where: { user: userId } });
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(payload));
      } catch (error) {
        if ([404, 410].includes(error.statusCode)) {
          await strapi.db.query('api::push-subscription.push-subscription').delete({ where: { id: subscription.id } });
        } else {
          strapi.log.warn(`Unable to send push notification: ${error.message}`);
        }
      }
    }
  }
}
