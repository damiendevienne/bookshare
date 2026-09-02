export default {
  routes: [
    {
      method: 'GET',
      path: '/auth/reset-password/validate',
      handler: 'reset-password.validate',
      config: { auth: false },
    },
  ],
};
