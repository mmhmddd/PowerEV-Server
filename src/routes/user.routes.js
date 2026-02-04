const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All user routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getAllUsers).post(createUser);

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

router.put('/:id/password', updateUserPassword);

module.exports = router;