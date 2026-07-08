# PayDoc v1

Internal document generator untuk Zatinirt.

## Fitur
- Buat & manage Invoice untuk klien
- Buat Bukti Pembayaran untuk partner/freelancer/vendor
- Upload foto bukti transfer
- Export PDF

## Tech Stack
- Next.js 14+ App Router
- Prisma ORM + PostgreSQL
- Server Actions
- Tailwind CSS
- JWT Auth (HttpOnly cookie)

## Setup

```bash
# Install dependencies
npm install

# Copy env
cp .env.example .env
# Isi DATABASE_URL dan JWT_SECRET di .env

# Generate Prisma client
npx prisma generate

# Jalankan migrasi
npx prisma migrate dev --name init

# Jalankan dev server
npm run dev
```