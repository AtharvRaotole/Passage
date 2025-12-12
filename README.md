# Passage

<div align="center">

**A decentralized digital estate management platform with Dead Man's Switch functionality**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)

*Securely manage and transfer your digital legacy using blockchain technology and AI automation*

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring & Logging](#monitoring--logging)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Passage is a comprehensive decentralized platform that enables users to securely manage and automatically transfer their digital estate in the event of incapacitation or death. Built on blockchain technology and powered by AI agents, Passage provides a trustless, automated solution for digital legacy management.

### Problem Statement

In today's digital age, individuals accumulate vast amounts of digital assets across multiple platforms—cryptocurrency wallets, social media accounts, cloud storage, email services, and more. Traditional estate planning fails to address these digital assets, leaving families with the difficult task of accessing accounts, recovering assets, and managing digital legacies without proper authorization or documentation.

### Solution

Passage solves this problem by:

- **Automated Estate Transfer**: Smart contracts automatically execute estate transfers when predefined conditions are met
- **AI-Powered Execution**: Intelligent agents handle complex tasks like account access, asset transfers, and message delivery
- **Secure Encryption**: Sensitive data is encrypted using threshold cryptography, ensuring privacy until authorized access
- **Decentralized Verification**: Chainlink Functions provide trustless verification of user activity and status
- **Comprehensive Management**: Single platform to manage all digital assets and instructions

---

## Key Features

### 🔐 Dead Man's Switch
Automatically triggers estate transfer when heartbeat signals are missed, ensuring timely execution without manual intervention.

### 🤖 AI Agent Automation
Intelligent browser automation agents execute complex digital will instructions, including:
- Account login and authentication
- Asset transfers and transactions
- Message composition and delivery
- Form submissions and data management

### 🔒 Threshold Encryption
Estate data is encrypted using Lit Protocol's threshold encryption, ensuring that sensitive information remains private until authorized decryption conditions are met.

### ⛓️ Decentralized Verification
Chainlink Functions enable trustless, decentralized verification of user activity through external API calls, eliminating single points of failure.

### 👥 Guardian System
Multi-signature guardian confirmation system provides additional verification layers for estate activation.

### 🔑 Two-Factor Authentication
Automatic TOTP code generation for seamless handling of 2FA-protected accounts.

### 📸 Error Recovery
Comprehensive error handling with automatic retry logic and screenshot capture for debugging and recovery.

### 💾 IPFS Storage
Decentralized storage for memory books and digital assets using IPFS.

---

## Architecture

Passage is built as a modular, three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js 14 + TypeScript + Tailwind CSS + Web3 Integration  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                       Backend Layer                          │
│  FastAPI + AI Agents + Blockchain Listener + Database       │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Blockchain Layer                          │
│  Smart Contracts + Chainlink Functions + Lit Protocol         │
└─────────────────────────────────────────────────────────────┘
```

### Component Overview

#### 1. Smart Contracts (`/contracts`)
- **Dead Man's Switch Contract**: Core logic for heartbeat tracking and estate activation
- **Chainlink Functions Integration**: Decentralized API verification
- **Guardian Management**: Multi-signature confirmation system
- **Estate Transfer Logic**: Automated asset and data transfer mechanisms

#### 2. Backend Service (`/backend`)
- **FastAPI REST API**: High-performance API server with automatic documentation
- **AI Agent Executor**: Browser automation using browser-use and Playwright
- **Blockchain Listener**: Real-time event monitoring and processing
- **Recovery Agent**: Automated search for unclaimed assets
- **Database Service**: PostgreSQL integration for estate data management
- **WebSocket Manager**: Real-time communication for status updates

#### 3. Frontend Application (`/frontend`)
- **Next.js 14 Application**: Modern React framework with App Router
- **Web3 Integration**: Wallet connectivity via Wagmi and Privy
- **Estate Dashboard**: Comprehensive management interface
- **Onboarding Flow**: User-friendly setup process
- **Real-time Updates**: WebSocket integration for live status

---

## Technology Stack

### Blockchain & Web3
- **Solidity** (^0.8.20) - Smart contract development
- **Hardhat** - Development environment and testing framework
- **Chainlink Functions** - Decentralized oracle network
- **Lit Protocol** - Threshold encryption and access control
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **Ethers.js** - Ethereum JavaScript library

### Backend
- **Python** (3.11+) - Core backend language
- **FastAPI** - Modern, fast web framework
- **browser-use** - AI-powered browser automation
- **Playwright** - Browser automation framework
- **OpenAI GPT-4** - Language model for AI agents
- **Web3.py** - Python blockchain interaction
- **Celery** - Distributed task queue
- **Redis** - Message broker and caching
- **PostgreSQL** - Relational database

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Privy** - Wallet authentication
- **React Query** - Data fetching and state management

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **WebSockets** - Real-time communication
- **IPFS** - Decentralized storage

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Frontend and contract development |
| **npm** | Latest | Package management |
| **Python** | 3.11+ | Backend services |
| **Docker** | Latest | Containerization (optional) |
| **Docker Compose** | Latest | Multi-container orchestration (optional) |
| **MetaMask** | Latest | Web3 wallet for testing |

### Additional Requirements

- **OpenAI API Key**: Required for AI agent functionality
- **Blockchain RPC URL**: Alchemy or Infura endpoint
- **WalletConnect Project ID**: For wallet connectivity
- **Testnet Tokens**: For contract deployment and testing

---

## Quick Start

### Option 1: Docker Compose (Recommended)

The fastest way to get started with Passage is using Docker Compose:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create .env file with required variables
cp .env.example .env
# Edit .env with your configuration

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f backend

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser
python -m playwright install chromium

# Create .env file (see Configuration section)
# Then start the server
uvicorn main:app --reload
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Create .env.local file (see Configuration section)
# Then start development server
npm run dev
```

#### Smart Contracts Setup

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Create .env file (see Configuration section)

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to network
npm run deploy
```

---

## Configuration

### Backend Environment Variables

Create a `.env` file in the `/backend` directory:

```bash
# ============================================
# API Configuration
# ============================================
API_TITLE=Passage API
API_VERSION=1.0.0
DEBUG=false

# ============================================
# Server Configuration
# ============================================
HOST=0.0.0.0
PORT=8000

# ============================================
# CORS Configuration
# ============================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# ============================================
# OpenAI Configuration (REQUIRED)
# ============================================
OPENAI_API_KEY=sk-...  # Your OpenAI API key
OPENAI_MODEL=gpt-4o

# ============================================
# Browser Configuration
# ============================================
BROWSER_HEADLESS=true
BROWSER_TIMEOUT=30000

# ============================================
# Blockchain Configuration (REQUIRED)
# ============================================
RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PASSAGE_SWITCH_ADDRESS=0x...  # Deployed contract address

# ============================================
# Database Configuration
# ============================================
POSTGRES_USER=passage
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=passage_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://passage:password@postgres:5432/passage_db

# ============================================
# Lit Protocol Configuration (Optional)
# ============================================
LIT_PROTOCOL_KEY=your_lit_protocol_key_here

# ============================================
# Security
# ============================================
SECRET_KEY=your_secret_key_here  # Generate with: openssl rand -hex 32
```

### Frontend Environment Variables

Create a `.env.local` file in the `/frontend` directory:

```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Contract Address (must match backend)
NEXT_PUBLIC_PASSAGE_SWITCH_ADDRESS=0x...

# WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Contract Environment Variables

Create a `.env` file in the `/contracts` directory:

```bash
# Network RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# OR
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Private Key (REQUIRED for deployment)
# ⚠️ NEVER commit this! Use a test wallet only!
PRIVATE_KEY=your_private_key_here

# Chainlink Functions (Optional)
CHAINLINK_FUNCTIONS_ROUTER=0x...
CHAINLINK_DON_ID=0x...
```

> **⚠️ Security Warning**: Never commit `.env` files or private keys to version control. All `.env` files are already included in `.gitignore`.

---

## Project Structure

```
passage/
├── contracts/                 # Smart contract development
│   ├── contracts/            # Solidity source files
│   │   ├── DeadMansSwitch.sol
│   │   ├── CharonSwitch.sol
│   │   └── ChainlinkOracle.sol
│   ├── scripts/              # Deployment scripts
│   ├── test/                 # Contract tests
│   ├── hardhat.config.ts     # Hardhat configuration
│   └── package.json
│
├── backend/                  # FastAPI backend service
│   ├── agent/                # AI agent modules
│   │   ├── executor.py      # Main agent executor
│   │   ├── recovery_agent.py # Asset recovery agent
│   │   └── memory_scraper.py # Memory extraction
│   ├── app/                  # Application modules
│   ├── core/                 # Core configuration
│   │   ├── config.py        # Settings management
│   │   └── celery_app.py    # Celery configuration
│   ├── services/             # Service modules
│   │   ├── blockchain_listener.py
│   │   ├── database.py
│   │   ├── ipfs_service.py
│   │   ├── websocket_manager.py
│   │   └── ...
│   ├── main.py              # FastAPI application entry
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Backend container
│   └── docker-compose.yml   # Docker orchestration
│
└── frontend/                 # Next.js frontend application
    ├── app/                  # Next.js App Router
    │   ├── dashboard/       # Dashboard pages
    │   ├── onboarding/      # Onboarding flow
    │   └── ...
    ├── components/           # React components
    │   ├── ui/              # UI components
    │   ├── onboarding/      # Onboarding components
    │   └── ...
    ├── hooks/                # Custom React hooks
    ├── lib/                  # Utility libraries
    ├── utils/                # Helper functions
    ├── package.json
    └── next.config.js
```

---

## Development

### Running Tests

```bash
# Smart Contract Tests
cd contracts
npm test

# Backend Tests
cd backend
pytest

# Frontend Tests (when configured)
cd frontend
npm test
```

### Building Docker Images

```bash
# Build backend image
cd backend
docker build -t passage-backend:latest .

# Build frontend image (if Dockerfile exists)
cd frontend
docker build -t passage-frontend:latest .
```

### Database Schema

When setting up PostgreSQL, create the following schema:

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_address ON digital_wills(user_address);
CREATE INDEX idx_created_at ON digital_wills(created_at);
```

### Code Quality

```bash
# Format Python code
cd backend
black .
isort .

# Lint TypeScript/JavaScript
cd frontend
npm run lint

# Format Solidity
cd contracts
npx prettier --write "contracts/**/*.sol"
```

---

## Deployment

### Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] `DEBUG=false` in production
- [ ] `BROWSER_HEADLESS=true` enabled
- [ ] Production RPC URLs configured
- [ ] Mainnet contract addresses set
- [ ] Secure `SECRET_KEY` generated
- [ ] Database credentials secured
- [ ] CORS origins properly configured
- [ ] SSL/TLS certificates configured
- [ ] Monitoring and logging enabled

### Environment-Specific Configuration

| Environment | RPC Network | Contracts | Keys |
|------------|-------------|-----------|------|
| **Development** | Local/Testnet | Test contracts | Development keys |
| **Staging** | Testnet | Test contracts | Staging keys |
| **Production** | Mainnet | Production contracts | Production keys |

### Docker Compose Production

```bash
# Update environment variables
# Set production values in .env

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Monitor services
docker-compose logs -f
```

---

## Security

### Best Practices

1. **Never commit sensitive data**
   - All `.env` files are gitignored
   - Private keys should never be committed
   - Use environment variables for all secrets

2. **Use test networks for development**
   - Always use testnets (Sepolia, Mumbai) for development
   - Never use mainnet private keys in development

3. **Secure key management**
   - Use strong, randomly generated `SECRET_KEY`
   - Rotate API keys regularly
   - Use different keys for each environment

4. **Access control**
   - Review Lit Protocol access conditions
   - Implement proper authentication
   - Validate all user inputs

5. **Monitoring**
   - Monitor blockchain listener logs
   - Set up alerts for suspicious activity
   - Regular security audits

### Security Considerations

- **Smart Contract Security**: Contracts are immutable once deployed. Extensive testing and audits are required.
- **Encryption**: Sensitive data is encrypted using Lit Protocol's threshold encryption.
- **API Security**: All API endpoints require proper authentication and validation.
- **Database Security**: Use strong passwords and restrict database access.

---

## Monitoring & Logging

### Health Checks

```bash
# Backend health endpoint
curl http://localhost:8000/health

# Database status
docker-compose ps
```

### Log Management

```bash
# View backend logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs -f backend | grep ERROR

# View logs from file
tail -f backend/logs/app.log
```

### Screenshot Storage

Failed AI agent executions automatically capture screenshots for debugging:
- Location: `backend/screenshots/raw/`
- Blurred versions: `backend/screenshots/blurred/`

### Metrics

Monitor the following metrics:
- API response times
- Blockchain event processing
- AI agent success rates
- Database query performance
- WebSocket connection status

---

## API Documentation

### Interactive Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/execute` | POST | Execute AI agent task |
| `/api/status/{task_id}` | GET | Get task status |
| `/ws` | WebSocket | Real-time updates |

---

## Troubleshooting

### Common Issues

#### Backend Issues

**Playwright browsers not found**
```bash
cd backend
python -m playwright install chromium
```

**OpenAI API errors**
- Verify API key is correct and has sufficient credits
- Check rate limits and usage quotas
- Ensure model name matches available models

**Database connection errors**
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database credentials are correct

**Blockchain listener not working**
- Verify `RPC_URL` is accessible
- Check contract address is correct
- Ensure network matches contract deployment

#### Frontend Issues

**Wallet connection fails**
- Verify WalletConnect project ID
- Check network configuration
- Ensure wallet is unlocked

**Contract calls fail**
- Verify contract address matches backend
- Check network (testnet vs mainnet)
- Ensure wallet is on correct network

**Lit Protocol errors**
- Verify browser environment
- Check wallet signature requirements
- Ensure proper network configuration

#### Docker Issues

**Build fails**
- Check Dockerfile syntax
- Verify all dependencies are available
- Review build logs for specific errors

**Container won't start**
- Check environment variables
- Review container logs: `docker-compose logs`
- Verify port availability

**Port conflicts**
- Change ports in `docker-compose.yml`
- Check for running services on same ports

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For issues, questions, or contributions:

- **GitHub Issues**: [Open an issue](https://github.com/yourusername/passage/issues)
- **Documentation**: See [docs/](docs/) directory


---

<div align="center">

**Built with ❤️ for the decentralized future**

[Documentation](./docs/) • [Changelog](./CHANGELOG.md) • [Contributing](./CONTRIBUTING.md)

</div>
