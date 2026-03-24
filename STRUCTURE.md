suzuki-fuel-log/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── fillups/
│   │   │       ├── route.ts
│   │   │       └── import/route.ts
│   │   ├── entry/page.tsx
│   │   ├── login/page.tsx
│   │   ├── upload/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── FuelCharts.tsx
│   │   ├── FillupTable.tsx
│   │   ├── Nav.tsx
│   │   └── StatCards.tsx
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   └── lib/
│       ├── auth.ts
│       └── utils.ts
├── drizzle/           # auto-generated migration files
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
