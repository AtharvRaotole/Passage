# Project Charon Backend

Production-ready FastAPI service with browser-use AI agent integration for digital estate management.

## Quick Start with Docker

```bash
# 1. Create .env file (see Environment Variables section)
# 2. Start services
docker-compose up -d

# 3. View logs
docker-compose logs -f backend

# 4. Stop services
docker-compose down
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Required Variables

```bash
# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-...  # Your OpenAI API key for GPT-4o

# Blockchain Configuration (REQUIRED)
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CHARON_SWITCH_ADDRESS=0x...  # Deployed CharonSwitch contract address

# Database Configuration
POSTGRES_USER=charon
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=charon_db
DATABASE_URL=postgresql://charon:password@postgres:5432/charon_db
```

### Optional Variables

```bash
# API Configuration
API_TITLE=Project Charon API
API_VERSION=1.0.0
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# OpenAI Model
OPENAI_MODEL=gpt-4o

# Browser
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Lit Protocol (Optional)
LIT_PROTOCOL_KEY=your_lit_protocol_key_here

# Security
SECRET_KEY=your_secret_key_here  # Generate with: openssl rand -hex 32
```

## Local Development Setup

1. **Create virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
python -m playwright install chromium
```

3. **Create `.env` file** with environment variables

4. **Run the server:**
```bash
uvicorn main:app --reload
```

## Docker Build

```bash
# Build image
docker build -t charon-backend .

# Run container
docker run -p 8000:8000 --env-file .env charon-backend
```

## Services

### Blockchain Listener

Automatically starts when the backend starts. Monitors for `StatusChanged` events and processes DECEASED status changes.

See `README_LISTENER.md` for details.

### Digital Executor

AI agent that executes tasks using browser automation. Includes:
- Retry logic (3 attempts)
- Screenshot capture on failures
- 2FA/TOTP support
- Session management

### Database Service

Mock database service (replace with Supabase/Postgres in production).

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health check
- `POST /execute` - Execute a task using the AI agent

See `http://localhost:8000/docs` for interactive API documentation.

## Error Handling

The agent includes robust error handling:
- **Retry Logic**: Automatically retries failed operations up to 3 times
- **Screenshot Capture**: Saves screenshots to `screenshots/` directory on failures
- **Logging**: Comprehensive logging for debugging

## Production Deployment

1. Set `DEBUG=false`
2. Use production RPC URLs
3. Configure secure database credentials
4. Set `BROWSER_HEADLESS=true`
5. Use environment-specific contract addresses
6. Configure proper CORS origins
7. Set secure `SECRET_KEY`

## Monitoring

- Health check: `http://localhost:8000/health`
- Logs: `docker-compose logs -f backend`
- Screenshots: `backend/screenshots/` (on failures)

## Troubleshooting

See main `README.md` for troubleshooting guide.
