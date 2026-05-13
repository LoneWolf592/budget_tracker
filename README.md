# ClearBudget 💰

An AI-powered personal budget tracker that helps you monitor your finances and get personalized financial advice through a conversational AI assistant.

🔗 **Live Demo:** [budget-tracker-376p.vercel.app](https://budget-tracker-376p.vercel.app)

-----

## Features

- 📊 **Dashboard** — Visual breakdown of income vs expenses by category and month
- 💸 **Transaction Tracking** — Log income and expenses with categories, dates, and notes
- 🤖 **AI Financial Assistant** — Chat with Claude AI for personalized spending advice and insights
- 🔐 **User Authentication** — Secure JWT-based register and login
- 📱 **Responsive Design** — Works across desktop and mobile

-----

## Tech Stack

**Frontend**

- React + TypeScript
- Tailwind CSS
- Recharts (data visualization)
- Axios

**Backend**

- Node.js + Express
- Prisma ORM
- PostgreSQL

**AI & Deployment**

- Claude API (Anthropic) — AI chat assistant
- Vercel — Frontend deployment
- Claude Code — AI-assisted development workflow

-----

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL
- Anthropic API Key

### Installation

**1. Clone the repo**

```bash
git clone https://github.com/LoneWolf592/budget_tracker.git
cd budget_tracker
```

**2. Set up the server**

```bash
cd server
npm install
```

Create a `.env` file in `/server`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/clearbудget"
JWT_SECRET="your_jwt_secret"
ANTHROPIC_API_KEY="your_anthropic_api_key"
PORT=5000
```

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the server:

```bash
npm run dev
```

**3. Set up the client**

```bash
cd ../client
npm install
```

Create a `.env` file in `/client`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the client:

```bash
npm run dev
```

**4. Open the app**

Navigate to `http://localhost:5173`

-----

## Project Structure

```
budget_tracker/
├── client/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── api/
└── server/          # Node.js + Express backend
    ├── src/
    │   ├── routes/
    │   ├── controllers/
    │   ├── middleware/
    │   └── services/
    └── prisma/
        └── schema.prisma
```

-----

## AI Integration

ClearBudget uses the **Claude API** to power a conversational financial assistant. Users can ask questions like:

- *“Where am I overspending this month?”*
- *“Can I afford a $200 purchase this week?”*
- *“Give me tips to reduce my food spending”*

The AI receives the user’s financial context (transactions, budgets, spending trends) with each message to give accurate, personalized advice.

-----

## License

MIT

-----

Built by [Kyshawn Henry](https://kyshawnhenry.com) — [LinkedIn](https://linkedin.com/in/kyshawn-henry) | [Portfolio](https://kyshawnhenry.com)
