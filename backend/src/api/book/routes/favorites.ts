export default {
  routes: [
    { method: 'GET', path: '/favorites', handler: 'book.favorites', config: { auth: { scope: [] } } },
    { method: 'POST', path: '/books/:id/favorite', handler: 'book.toggleFavorite', config: { auth: { scope: [] } } },
  ],
};
