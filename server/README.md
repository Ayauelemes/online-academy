# Online Academy - Server

This folder contains a minimal Express server used by the front-end demo.

Quick start

1. Copy the example env and adjust if needed:
   ```bash
   cp .env.example .env
   # edit .env to suit your environment
   ```

2. Install dependencies (if you haven't already):
   ```bash
   cd server
   npm install
   ```

3. Run migrations (optional):
   ```bash
   npm run migrate
   ```

4. Start the server:
   ```bash
   npm start
   ```

Useful scripts

- `npm run dev` — start with nodemon for development
- `npm run migrate` — run password migration script (migrates plaintext `password` column to `password_hash`)
- `npm run smoke` — quick smoke test (register/login)
- `npm run audit:fix` — run `npm audit fix`
- `npm run audit:fix:force` — run `npm audit fix --force` (may upgrade packages with breaking changes)

Security notes

- Passwords are hashed with bcrypt before storage.
- Move sensitive credentials into `.env` and never commit `.env` to version control (it's in `.gitignore`).
- Consider using migrations or a migration framework (Flyway, knex, or Sequelize migrations) for production.

API Endpoints

- `POST /api/register` — { email, password }
- `POST /api/login` — { email, password }
- `GET /api/students` — debug route returning id/email

