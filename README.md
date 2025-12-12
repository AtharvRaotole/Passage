# Passage

A decentralized digital estate manager with Dead Man's Switch functionality, powered by Web3 and AI agents.

## Architecture

Passage consists of three main components:

1. **`/contracts`** - Hardhat project for the "Dead Man's Switch" smart contract logic and Chainlink Functions integration
2. **`/backend`** - Python FastAPI service running the `browser-use` AI agent for activity verification and will execution
3. **`/frontend`** - Next.js 14 application for the user dashboard

## Technologies

- **Lit Protocol** - Encryption/decryption of estate data
- **Chainlink Functions** - External API verification for heartbeat checks
- **browser-use + Playwright** - AI agent for automated activity verification and will execution
- **Hardhat** - Smart contract development and deployment
- **FastAPI** - Backend API with Pydantic validation
- **Next.js 14** - Frontend with TypeScript and Tailwind CSS
- **Wagmi + RainbowKit** - Web3 wallet integration
- **PostgreSQL** - Database for digital will storage
- **Docker** - Containerization for production deployment

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- Hardhat
- MetaMask or compatible Web3 wallet

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `/backend` directory:

```bash
# API Configuration
API_TITLE=Passage API
API_VERSION=1.0.0
DEBUG=false

# Server Configuration
HOST=0.0.0.0
PORT=8000

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=sk-...  # Your OpenAI API key for GPT-4o

# Browser Configuration
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Blockchain Configuration (REQUIRED)
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PASSAGE_SWITCH_ADDRESS=0x...  # Deployed PassageSwitch contract address

# Database Configuration
POSTGRES_USER=passage
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=passage_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://passage:password@postgres:5432/passage_db

# Lit Protocol Configuration (Optional - for encryption/decryption)
LIT_PROTOCOL_KEY=your_lit_protocol_key_here

# Security
SECRET_KEY=your_secret_key_here  # Generate a secure random key
```

### Frontend Environment Variables

Create a `.env.local` file in the `/frontend` directory:

```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Contract Address
NEXT_PUBLIC_PASSAGE_SWITCH_ADDRESS=0x...  # Deployed contract address

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Contract Environment Variables

Create a `.env` file in the `/contracts` directory:

```bash
# Network RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# OR for Mumbai/Polygon
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Private Key (REQUIRED for deployment)
PRIVATE_KEY=your_private_key_here  # Never commit this!

# Chainlink Functions
CHAINLINK_FUNCTIONS_ROUTER=0x...  # Chainlink Functions Router address
CHAINLINK_DON_ID=0x...  # DON ID for your network
```

## Quick Start

### Option 1: Docker Compose (Recommended for Production)

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create `.env` file** with all required environment variables (see above)

3. **Start services:**
```bash
docker-compose up -d
```

4. **View logs:**
```bash
docker-compose logs -f backend
```

5. **Stop services:**
```bash
docker-compose down
```

### Option 2: Local Development

#### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m playwright install chromium

# Create .env file with environment variables
# Then run:
uvicorn main:app --reload
```

#### Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
# Create .env.local file with environment variables
npm run dev
```

#### Contracts Setup

```bash
cd contracts
npm install
# Create .env file with environment variables
npm run compile
npm run deploy
```

## Project Structure

```
passage/
├── contracts/          # Hardhat smart contracts
│   ├── contracts/      # Solidity contracts
│   ├── scripts/        # Deployment scripts
│   └── test/           # Contract tests
├── backend/            # FastAPI backend
│   ├── agent/          # AI agent executor
│   ├── core/           # Configuration
│   ├── services/       # Blockchain listener, database, etc.
│   ├── Dockerfile      # Backend container definition
│   └── docker-compose.yml  # Docker orchestration
└── frontend/           # Next.js frontend
    ├── app/            # Next.js app directory
    ├── components/     # React components
    └── utils/          # Lit Protocol utilities
```

## Features

- **Dead Man's Switch**: Automatically transfer digital estate to beneficiaries if heartbeat is missed
- **Activity Verification**: Use AI agents to verify user activity via external APIs
- **Encrypted Storage**: Estate data encrypted using Lit Protocol with access control
- **Chainlink Functions**: Decentralized API calls for heartbeat verification
- **Web3 Integration**: Full wallet connectivity and smart contract interaction
- **Digital Will Execution**: Automated execution of digital estate instructions
- **2FA Support**: Automatic TOTP code generation for two-factor authentication
- **Error Handling**: Retry logic with screenshot capture on failures

## Development

### Running Tests

```bash
# Contracts
cd contracts
npm test

# Backend (when tests are added)
cd backend
pytest
```

### Building Docker Images

```bash
cd backend
docker build -t passage-backend .
```

### Database Migrations

When integrating with PostgreSQL, you'll need to create the database schema:

```sql
CREATE TABLE digital_wills (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    website_url TEXT NOT NULL,
    username VARCHAR(255),
    encrypted_password TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    instruction TEXT NOT NULL,
    totp_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_address ON digital_wills(user_address);
```

## Production Deployment

### Docker Compose Production

1. Update environment variables in `.env`
2. Set `DEBUG=false` and `BROWSER_HEADLESS=true`
3. Use production RPC URLs and contract addresses
4. Configure proper CORS origins
5. Set secure `SECRET_KEY` and database passwords

### Environment-Specific Configuration

- **Development**: Use local RPC URLs, testnet contracts
- **Staging**: Use testnet with production-like setup
- **Production**: Use mainnet contracts, secure keys, monitoring

## Security Notes

- **Never commit `.env` files** or private keys
- Use test networks for development
- Review access conditions for Lit Protocol encryption
- Validate all user inputs on both frontend and backend
- Use strong, randomly generated `SECRET_KEY`
- Keep database credentials secure
- Rotate API keys regularly
- Monitor blockchain listener logs for suspicious activity

## Monitoring

### Health Checks

- Backend: `http://localhost:8000/health`
- Database: Check via `docker-compose ps`

### Logs

- Backend logs: `docker-compose logs -f backend`
- Screenshots: Saved to `backend/screenshots/` on failures
- Application logs: `backend/logs/`

## Troubleshooting

### Backend Issues

- **Playwright browsers not found**: Run `playwright install chromium`
- **OpenAI API errors**: Check API key and rate limits
- **Database connection errors**: Verify DATABASE_URL and PostgreSQL is running
- **Blockchain listener not working**: Check RPC_URL and contract address

### Frontend Issues

- **Wallet connection fails**: Check WalletConnect project ID
- **Contract calls fail**: Verify contract address and network
- **Lit Protocol errors**: Ensure browser environment and wallet signature

### Docker Issues

- **Build fails**: Check Dockerfile and dependencies
- **Container won't start**: Check environment variables and logs
- **Port conflicts**: Change ports in docker-compose.yml

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
