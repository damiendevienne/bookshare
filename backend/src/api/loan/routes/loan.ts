export default {
  routes: [
    { method: 'POST', path: '/loans/request', handler: 'loan.request', config: { auth: { scope: [] } } },
    { method: 'GET', path: '/loans/status', handler: 'loan.status', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/loans/:id/accept', handler: 'loan.accept', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/loans/:id/refuse', handler: 'loan.refuse', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/loans/:id/confirm-received', handler: 'loan.confirmReceived', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/loans/:id/confirm-lent', handler: 'loan.confirmLent', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/loans/:id/confirm-returned', handler: 'loan.confirmReturned', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/loans/:id/confirm-received-back', handler: 'loan.confirmReceivedBack', config: { auth: { scope: [] } } },
  ],
};
