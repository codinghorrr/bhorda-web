-- Remove development-only test manager fixture (seeded in 0002).
-- Safe on fresh production D1: INSERT OR IGNORE in 0002 may never have run with real admins.
-- CASCADE removes any sessions/otp rows tied to this user.

DELETE FROM users
WHERE id = 'usr_test_manager'
   OR email = 'manager.test@sevatirthbhorda.org';
