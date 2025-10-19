# Turing Biosciences - Secure File Upload Platform

A modern React-based web application with authentication and resumable file upload capabilities.

## Features

- **Authentication**: Secure authentication using Logto (OIDC/OAuth)
- **File Upload**: Drag-and-drop file uploader supporting files up to 5GB
- **Resumable Uploads**: Uploads can be paused and resumed
- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Logto
- **File Upload**: React Dropzone + TUS protocol support
- **State Management**: React Query
- **UI Components**: Custom components with Radix UI primitives

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

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Logto credentials:
```env
NEXT_PUBLIC_LOGTO_ENDPOINT=https://your-logto-endpoint.logto.app
NEXT_PUBLIC_LOGTO_APP_ID=your-app-id
LOGTO_APP_SECRET=your-app-secret
NEXTAUTH_SECRET=your-random-secret-key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page with authentication
├── components/
│   ├── auth/              # Authentication components
│   │   ├── auth-provider.tsx
│   │   └── auth-button.tsx
│   ├── file-upload/       # File upload components
│   │   └── file-uploader.tsx
│   ├── providers/         # React Query provider
│   └── ui/                # Reusable UI components
│       └── button.tsx
└── lib/
    ├── auth.ts            # Logto configuration
    └── utils.ts           # Utility functions
```

## Authentication Flow

1. User clicks "Sign In" button
2. Redirected to Logto authentication page
3. After successful authentication, user is redirected back
4. Authenticated users see the file upload dashboard
5. Unauthenticated users see a welcome page with sign-in option

## File Upload Features

- **Drag & Drop**: Intuitive file selection
- **Progress Tracking**: Real-time upload progress
- **Pause/Resume**: Uploads can be paused and resumed
- **Error Handling**: Clear error messages and retry options
- **File Validation**: File type and size validation
- **Large File Support**: Up to 5GB file size limit

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_LOGTO_ENDPOINT` | Logto endpoint URL | Yes |
| `NEXT_PUBLIC_LOGTO_APP_ID` | Logto application ID | Yes |
| `LOGTO_APP_SECRET` | Logto application secret | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `MAX_FILE_SIZE` | Maximum file size in bytes | No (default: 5GB) |
| `UPLOAD_CHUNK_SIZE` | Upload chunk size in bytes | No (default: 1MB) |

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

## Next Steps

1. **Backend Integration**: Set up a backend API for file storage
2. **TUS Protocol**: Implement proper resumable uploads with TUS
3. **File Management**: Add file listing, deletion, and sharing features
4. **User Management**: Add user profiles and permissions
5. **Analytics**: Add upload analytics and usage tracking

## Support

For questions or issues, please create an issue in the repository or contact the development team.

## License

This project is licensed under the MIT License.
