import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

// PUT /api/settings/profile
// Lets the user update their name and/or email.
// If they change their email we check it isn't already taken by someone else.
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const { name, email } = req.body;

  if (!name && !email) {
    res.status(400).json({ message: 'Provide at least a name or email to update' });
    return;
  }

  if (name && typeof name !== 'string') {
    res.status(400).json({ message: 'Name must be a string' });
    return;
  }

  // If the email is changing, make sure no other account already uses it
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.userId) {
      res.status(409).json({ message: 'That email is already in use by another account' });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
    },
    select: { id: true, name: true, email: true },
  });

  res.json({ user });
}

// PUT /api/settings/password
// Changes the user's password. Requires the current password to be correct
// before we allow any change — prevents someone who left their laptop unlocked
// from having their password changed without knowing the old one.
export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Current password and new password are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ message: 'New password must be at least 6 characters' });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ message: 'New password must be different from your current password' });
    return;
  }

  // Fetch the full user record so we can compare the password hash
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'Current password is incorrect' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.userId },
    data: { passwordHash },
  });

  res.json({ message: 'Password updated successfully' });
}
