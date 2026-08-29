# CreatorOS

CreatorOS is an AI creative workspace for creators and brands.

## Core flow

Brief → AI Creative Concepts → Editor → Multi-platform Repurposing → Asset Studio → Share

## Stack

- Next.js 16
- React 19
- MongoDB Atlas
- JWT + HTTP-only session cookie
- Ollama for local AI
- Pexels for stock media

## Free usage

- Normal user: 1 initial AI content pack per day
- Admin-granted free user: unlimited
- Admin: unlimited

## Deployment

CreatorOS is designed to run as a Node.js web service on Render with GitHub Actions handling CI. Secrets belong in the hosting provider's environment variables, never in GitHub.

## Environment

See `.env.example`.
