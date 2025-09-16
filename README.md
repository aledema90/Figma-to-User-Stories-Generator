# Figma to User Stories App

Transform your Figma designs into comprehensive user stories using AI-powered analysis. Perfect for Product Managers who want to streamline their workflow from design to development.

## 🚀 Features

- **Figma Integration**: Import frames directly from Figma files
- **AI-Powered Analysis**: Uses Ollama with Llava model for intelligent story generation
- **Comprehensive Stories**: Generates titles, descriptions, acceptance criteria, and story points
- **Export Options**: Export to JSON, CSV, or copy to clipboard
- **Modern UI**: Clean, warm-toned interface inspired by social apps
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **AI**: Ollama (local) with Llava vision model
- **Testing**: Playwright (E2E), Jest (Unit)
- **Infrastructure**: Vercel, GitHub Actions

## 📋 Prerequisites

1. **Node.js** 18+ and npm
2. **Figma Access Token**: Get one from [Figma Developers](https://www.figma.com/developers/api)
3. **Ollama**: Install locally with Llava model

### Setting up Ollama

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Llava model
ollama pull llava

# Start Ollama service
ollama serve
```

## 🚀 Quick Start

1. **Clone and install**:

   ```bash
   git clone <your-repo-url>
   cd figma-user-stories
   npm install
   ```

2. **Environment setup**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Figma access token
   ```

3. **Run development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

```env
FIGMA_ACCESS_TOKEN=your_figma_token_here
OLLAMA_BASE_URL=http://localhost:11434
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting a Figma Access Token

1. Go to [Figma Settings > Personal Access Tokens](https://www.figma.com/settings)
2. Click "Create new token"
3. Give it a descriptive name and appropriate permissions
4. Copy the token to your `.env.local` file

## 📖 Usage

1. **Import Figma Frames**:

   - Paste a Figma file URL (must be public or accessible with your token)
   - Click "Import" to fetch all frames from the file

2. **Select Frames**:

   - Choose which frames you want to analyze
   - Multiple frame selection is supported

3. **Add Context** (Optional):

   - Provide product context to help AI generate more relevant stories
   - Include information about your users, business goals, etc.

4. **Generate Stories**:

   - Click "Generate Stories" to start AI analysis
   - Wait for processing (typically 10-30 seconds per frame)

5. **Review & Export**:
   - Review generated user stories
   - Edit acceptance criteria if needed
   - Export to CSV, JSON, or copy to clipboard

## 🧪 Testing

### Run All Tests

```bash
# Unit tests
npm run test

# E2E tests (requires app to be running)
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- **Unit Tests**: Service classes, utilities, and component logic
- **E2E Tests**: Complete user workflows from import to export
- **Integration Tests**: API endpoints and external service connections

## 🏗 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── figma/          # Figma integration
│   │   └── ollama/         # AI analysis
│   ├── components/         # React components
│   │   ├── FigmaImporter.tsx
│   │   ├── UserStoryGenerator.tsx
│   │   └── UserStoryCard.tsx
│   ├── lib/                # Core services
│   │   ├── figma.ts        # Figma API client
│   │   ├── ollama.ts       # Ollama AI client
│   │   └── types.ts        # TypeScript definitions
│   └── globals.css         # Global styles
tests/
├── e2e/                    # Playwright tests
└── unit/                   # Jest tests
```

## 🎨 Design Philosophy

The app follows a warm, social-app-inspired design:

- **Warm Color Palette**: Orange-based tones for friendliness
- **Card-Based Layouts**: Familiar social media patterns
- **Progressive Disclosure**: Information revealed contextually
- **Micro-interactions**: Subtle animations and transitions
- **Accessibility First**: Semantic HTML and proper contrast ratios

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to GitHub**:

   - Import your repository in Vercel dashboard
   - Configure environment variables in Vercel settings

2. **Environment Variables in Vercel**:

   ```
   FIGMA_ACCESS_TOKEN=your_token
   OLLAMA_BASE_URL=your_ollama_endpoint
   ```

3. **Deploy**: Automatic deployment on push to main branch

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔄 Development Workflow

### Git Conventions

```bash
# Feature branches
git checkout -b feature/figma-integration
git checkout -b fix/story-parsing-bug
git checkout -b docs/api-documentation

# Commit messages
git commit -m "feat: add figma frame selection"
git commit -m "fix: handle ollama connection timeout"
git commit -m "test: add e2e tests for export functionality"
git commit -m "docs: update setup instructions"
```

### Code Quality

- **ESLint**: Automatic linting on save and pre-commit
- **TypeScript**: Strict mode enabled for type safety
- **Prettier**: Code formatting (if configured)
- **Pre-commit Hooks**: Lint, type-check, and test before commits

## 🐛 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**:

   ```bash
   # Check if Ollama is running
   ollama list

   # Start Ollama if not running
   ollama serve

   # Test connection
   curl http://localhost:11434/api/tags
   ```

2. **Figma Import Errors**:

   - Verify your access token has correct permissions
   - Ensure the Figma file is public or shared with your account
   - Check that the URL format is correct

3. **Build Errors**:

   ```bash
   # Clear Next.js cache
   rm -rf .next

   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Memory Issues with Large Figma Files**:
   - Select fewer frames at a time
   - Consider increasing Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run dev
   ```
