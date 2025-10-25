# Turing Biosciences Nexus Web

Secure biosciences data management portal with Logto OIDC authentication, resumable (TUS) uploads up to 5GB, and a modern Next.js 15 + TypeScript + Tailwind stack.

## Features

- **Logto Authentication (OIDC)**: Secure token-based auth; server API routes validate sessions
- **Resumable Uploads (TUS)**: Pause/resume large file uploads (up to 5GB) with retry backoff
- **Authenticated API Access**: Access tokens requested for backend resource (`NEXT_PUBLIC_TURING_API`)
- **Modern UI Layer**: Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn-inspired patterns
- **Robust Sign-out**: Multi-path sign-out handling with fallback to manual logout
- **Testing & CI**: Jest + React Testing Library with 80% global coverage thresholds enforced in CI
- **Accessibility Improvements**: Semantic buttons, progress indicators, labeled actions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict) & React 19
- **Styling**: Tailwind CSS v4 (inline @theme, no external config) + clsx + tailwind-merge helper (`cn`)
- **Authentication**: Logto (`@logto/react`, `@logto/next/edge` in API routes)
- **File Upload**: `react-dropzone` + `tus-js-client` (resumable protocol)
- **Data Fetching**: `@tanstack/react-query`
- **Testing**: Jest, React Testing Library, Snapshot tests
- **CI**: GitHub Actions (Node 20, cached npm, coverage enforcement)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Logto account (free tier available)

### Setup Logto Authentication

1. Create a free account at [Logto Cloud](https://cloud.logto.io)
2. Create a new application in your Logto dashboard
3. Copy the endpoint and app ID from your Logto application settings
4. Update the environment variables in `.env.local`

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd turingbiosciences
```

1. Install dependencies:

```bash
npm install
```

1. Set up environment variables:

```bash
cp .env.example .env.local
```

1. Update `.env.local` with your Logto credentials:

```env
NEXT_PUBLIC_LOGTO_ENDPOINT=https://your-logto-endpoint.logto.app
NEXT_PUBLIC_LOGTO_APP_ID=your-app-id
LOGTO_ENDPOINT=https://your-logto-endpoint.logto.app
LOGTO_APP_ID=your-app-id
LOGTO_APP_SECRET=your-app-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key
NEXT_PUBLIC_TURING_API=https://api.example.com
```

1. Run the development server:

```bash
npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```text
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page with authentication
├── components/
│   ├── auth/              # Authentication components (Logto provider & UI)
│   │   ├── auth-provider.tsx
│   │   ├── auth-button.tsx
│   │   ├── auth-guard.tsx
│   │   └── sign-in-prompt.tsx
│   ├── file-upload/       # File upload components
│   │   └── file-uploader.tsx
│   ├── providers/         # React Query provider
│   └── ui/                # Reusable UI components
│       └── button.tsx
├── lib/
│   ├── auth.ts            # (May hold auth helpers / legacy)
│   └── utils.ts           # Utility functions (cn helper)
└── __tests__/             # Jest tests (components & auth flow)

CI workflow lives in `.github/workflows/ci.yml`.
```

## Authentication Flow

1. User clicks `AuthButton` → navigates to `/api/logto/sign-in` (server-side initiation)
2. Logto OIDC redirects back to `/api/logto/sign-in-callback` (session cookies set)
3. Client components derive state from a global auth context that consults server state (via user endpoint) ensuring truthiness beyond client memory
4. `AuthButton` renders loading → sign in → sign out depending on auth state
5. Sign-out attempts standard route, then manual fallback, then reload as a last resort (all paths covered by tests)

## File Upload Features

**Component**: `file-uploader.tsx`

- Drag & drop selection (via `react-dropzone`)
- Real-time progress updates (bytes uploaded vs total)
- Pause/Resume via stored tus upload instance
- Automatic retries with exponential backoff `[0, 3000, 5000, 10000, 20000]`
- Authenticated requests (`Authorization: Bearer <access token>` via Logto resource token)
- Metadata attached (filename, filetype)
- Large file support up to 5GB (TUS chunked)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests (component + snapshot)
- `npm test -- --coverage` - Run tests with coverage output (`coverage/` directory)

### Environment Variables

| Variable                     | Description                                        | Required          |
| ---------------------------- | -------------------------------------------------- | ----------------- |
| `NEXT_PUBLIC_LOGTO_ENDPOINT` | Public Logto endpoint URL                          | Yes               |
| `NEXT_PUBLIC_LOGTO_APP_ID`   | Public Logto application ID                        | Yes               |
| `LOGTO_ENDPOINT`             | Server-side Logto endpoint                         | Yes               |
| `LOGTO_APP_ID`               | Server-side Logto app ID                           | Yes               |
| `LOGTO_APP_SECRET`           | Logto application secret                           | Yes               |
| `NEXTAUTH_URL`               | Base URL for callbacks (must match dev port)       | Yes               |
| `NEXTAUTH_SECRET`            | Cookie/session secret                              | Yes               |
| `NEXT_PUBLIC_TURING_API`     | Backend API resource identifier for token requests | Yes               |
| `MAX_FILE_SIZE`              | Maximum file size in bytes                         | No (default: 5GB) |
| `UPLOAD_CHUNK_SIZE`          | Upload chunk size in bytes                         | No (default: 1MB) |

## Testing & Coverage

### Framework

Jest + React Testing Library.

### What We Test

- Auth button state transitions & sign-out fallbacks
- Provider config passing
- Auth guard context propagation
- Prompt rendering (default & custom)
- Snapshot stability for `Footer`

### Coverage

Global coverage thresholds (80% statements/branches/functions/lines) enforced in `jest.config.js`. CI fails if below.

Run locally:

```bash
npm test -- --coverage
```

### Adding Tests

Place new test files in `src/__tests__/`. Use descriptive names, e.g. `file-uploader.test.tsx`. Avoid brittle snapshot tests except for stable layout fragments.

## Continuous Integration (CI)

GitHub Actions workflow (`.github/workflows/ci.yml`):

- Triggers on pushes and PRs to `main`
- Node 20 environment with npm caching
- Runs `npm ci`, executes tests with coverage
- Uploads coverage artifact (`coverage/`) retained 7 days
- Fails build if coverage threshold not met

Future enhancements: Codecov integration, lint step gating, build previews.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Cost Analysis

- **Logto**: Free up to 50,000 MAUs
- **Vercel**: Free tier available
- **Total**: $0/month on free tiers

## Future Roadmap

1. **Enhanced File Management**: Listing, deletion, tagging
2. **Throughput Metrics**: Upload speed & ETA display
3. **Integration Tests**: MSW-based auth + upload flow validation
4. **Security Hardening**: JWT claim validation, stricter cookie flags
5. **Observability**: Structured logging & tracing in API routes

## Support

For questions or issues, please create an issue in the repository or contact the development team.

## License

MIT License.
