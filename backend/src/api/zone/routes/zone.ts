export default {
  routes: [
    { method: 'GET', path: '/zones', handler: 'zone.find', config: { auth: false } },
  ],
};
