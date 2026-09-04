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
    let badgeCount = 1;
    try {
      badgeCount = await getUnreadCount(strapi, userId);
    } catch (error) {
      strapi.log.warn(`Unable to calculate push badge count: ${error.message}`);
    }
    const subscriptions = await strapi.db.query('api::push-subscription.push-subscription').findMany({ where: { user: userId } });
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ ...payload, badgeCount }));
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

export async function getUnreadCount(strapi, userId, zoneSlug = '') {
  const conversations = await strapi.db.query('api::conversation.conversation').findMany({
    where: { $or: [{ participantOne: userId }, { participantTwo: userId }] },
    populate: { loans: { populate: { lender: true, book: { populate: { zone: true } } } } },
  });
  let total = 0;
  for (const conversation of conversations) {
    if (zoneSlug && !(conversation.loans || []).some((loan) => loan.book?.zone?.slug === zoneSlug)) continue;
    const incoming = await strapi.db.query('api::message.message').findMany({
      where: { conversation: conversation.id, readAt: null }, populate: { sender: true },
    });
    const unreadMessages = incoming.filter((message) => message.sender?.id !== userId).length;
    const pendingRequest = (conversation.loans || []).some((loan) => loan.status === 'requested' && loan.lender?.id === userId);
    const pendingRefusal = (conversation.loans || []).some((loan) => loan.status === 'refused'
      && (loan.lender?.id === userId ? !conversation.lenderArchivedAt : !conversation.borrowerArchivedAt));
    total += Math.max(unreadMessages, pendingRequest ? 1 : 0) + (pendingRefusal ? 1 : 0);
  }
  return total;
}
