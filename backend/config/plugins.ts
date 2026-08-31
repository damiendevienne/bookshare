export default () => ({
  upload: {
    config: {
      // Keep user-uploaded book images reasonably small (5 MB per file).
      sizeLimit: 5 * 1024 * 1024,
    },
  },
});
