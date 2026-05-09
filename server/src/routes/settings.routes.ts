import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { updateProfile, changePassword } from '../controllers/settings.controller';

const router = Router();

router.use(authenticate);

router.put('/profile', updateProfile);    // PUT /api/settings/profile
router.put('/password', changePassword);  // PUT /api/settings/password

export default router;
