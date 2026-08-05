/**
 * asyncHandler
 * Wraps async route handlers so they don't need try/catch blocks.
 * Any thrown error is automatically passed to Express's next() error handler.
 *
 * Usage:
 *   const getUsers = asyncHandler(async (req, res) => {
 *     const users = await User.find();
 *     res.json({ success: true, data: users });
 *   });
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
