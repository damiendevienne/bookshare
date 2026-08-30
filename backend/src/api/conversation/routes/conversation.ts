export default {
  routes: [
    { method: 'GET', path: '/conversations/mine', handler: 'conversation.mine', config: { auth: { scope: [] } } },
    { method: 'GET', path: '/conversations/:id/messages', handler: 'conversation.messages', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/conversations/:id/read', handler: 'conversation.markRead', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/conversations/:id/messages', handler: 'conversation.send', config: { auth: { scope: [] } } },
  ],
};
