export default {
  routes: [
    {
      method: 'GET',
      path: '/book-catalog/search',
      handler: 'book.catalogSearch',
      config: { auth: { scope: [] } },
    },
  ],
};
