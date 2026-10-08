import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { UsersService } = require('../dist/users/users.service.js');
const { AuthService } = require('../dist/auth/auth.service.js');
const bcrypt = require('bcryptjs');
const { Types } = require('mongoose');

function fixture(existing) {
  let account = existing;
  let tokenCount = 0;
  let welcomeCount = 0;
  let resetMail;
  const users = new UsersService({
    findOne(query) {
      return { exec: async () => {
        if (query.passwordResetTokenHash) return account?.passwordResetTokenHash === query.passwordResetTokenHash
          && account.passwordResetExpiresAt > new Date() ? account : null;
        return account?.email === query.email ? account : null;
      } };
    },
    async create(input) { account = { ...input, id: new Types.ObjectId().toString(), createdAt: new Date() }; return account; },
    findByIdAndUpdate(id, update) {
      return { exec: async () => {
        assert.equal(id, account.id);
        const { $unset, ...fields } = update;
        Object.assign(account, fields);
        for (const key of Object.keys($unset ?? {})) delete account[key];
        return account;
      } };
    },
  });
  const auth = new AuthService(users, { sign() { tokenCount++; return 'signed-token'; } }, { get() {} }, {
    async sendWelcomeEmail() { welcomeCount++; },
    async sendPasswordResetEmail(input) { resetMail = input; },
  }, {});
  return { auth, account: () => account, tokenCount: () => tokenCount, welcomeCount: () => welcomeCount, resetMail: () => resetMail };
}

for (const role of ['student', 'admin']) {
  test(`signup cannot add a password or obtain a token for an existing Google ${role}`, async () => {
    const account = { id: new Types.ObjectId().toString(), fullName: 'Owner', email: 'owner@example.invalid',
      role, authProvider: 'google', createdAt: new Date() };
    const f = fixture(account);
    await assert.rejects(f.auth.register({ fullName: 'Attacker', email: account.email,
      password: 'attacker-password', role: 'student' }), /already registered/);
    assert.equal(account.passwordHash, undefined);
    assert.equal(account.fullName, 'Owner');
    assert.equal(account.role, role);
    assert.equal(account.authProvider, 'google');
    assert.equal(f.tokenCount(), 0);
    assert.equal(f.welcomeCount(), 0);
  });
}

test('new password signup still succeeds and stores a hashed password', async () => {
  const f = fixture();
  const result = await f.auth.register({ fullName: 'Student', email: 'NEW@example.invalid', password: 'new-password', role: 'student' });
  assert.equal(result.user.email, 'new@example.invalid');
  assert.equal(result.user.role, 'student');
  assert.equal(result.accessToken, 'signed-token');
  assert.equal(await bcrypt.compare('new-password', f.account().passwordHash), true);
  assert.equal(f.welcomeCount(), 1);
});

test('Google users can set a password only with the valid emailed reset token', async () => {
  const account = { id: new Types.ObjectId().toString(), fullName: 'Owner', email: 'owner@example.invalid',
    role: 'admin', authProvider: 'google', createdAt: new Date() };
  const f = fixture(account);
  await f.auth.requestPasswordReset({ email: account.email });
  const mail = f.resetMail();
  assert.equal(mail.email, account.email);
  assert.equal(account.passwordResetTokenHash, createHash('sha256').update(mail.token).digest('hex'));
  await assert.rejects(f.auth.resetPassword({ token: 'unverified', password: 'attacker-password' }), /invalid or expired/);
  assert.equal(account.passwordHash, undefined);
  await f.auth.resetPassword({ token: mail.token, password: 'owner-password' });
  assert.equal(await bcrypt.compare('owner-password', account.passwordHash), true);
  assert.equal(account.role, 'admin');
  assert.equal(account.passwordResetTokenHash, undefined);
  await assert.rejects(f.auth.resetPassword({ token: mail.token, password: 'another-password' }), /invalid or expired/);
});
