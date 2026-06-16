# Adda Ludo - Multi-Player Online Ludo Game Platform

A complete full-stack application for playing Ludo online with real-time multiplayer features, wallet management, KYC verification, and battle modes.

---

## 📋 Project Overview

**Adda Ludo** is a comprehensive gaming platform that allows users to:
- Play Ludo in real-time multiplayer battles
- Manage wallets and handle deposits/withdrawals
- Participate in tournaments and match-making
- Complete KYC verification for secure transactions
- Track game history and earnings
- Refer friends and earn rewards

---

## 🏗️ Architecture

The project is divided into three main modules:

### 1. **Frontend (adda-ludo/)**
   - **Framework**: React with Vite
   - **Styling**: Tailwind CSS, PostCSS
   - **Build Tool**: Vite
   - **Real-time**: Socket.io for multiplayer communication

**Key Features:**
- Game board and dice components
- Multiple pages: Home, Game, Battle, Lobby, Profile, Wallet, KYC, History, Refer, Redeem, Support
- Real-time game state management via WebSockets
- Responsive UI with Tailwind CSS
- Firebase integration for authentication

**Directory Structure:**
```
src/
├── components/       # Reusable UI components
├── pages/            # Page components for different routes
├── styles/           # CSS stylesheets
├── assets/           # Images, fonts, etc.
├── App.jsx           # Main app component
├── socket.js         # Socket.io client setup
└── main.jsx          # Entry point
```

---

### 2. **Admin Panel (admin/)**
   - **Framework**: React
   - **Build Tool**: Create React App
   - **Purpose**: Admin dashboard for managing users, battles, transactions, and platform settings

**Key Features:**
- User management and monitoring
- Battle and match oversight
- Transaction and payment management
- KYC verification approval/rejection
- Platform analytics and reporting

**Directory Structure:**
```
src/
├── components/       # Admin UI components
├── Pages/            # Admin page components
├── api.js            # API integration
├── App.jsx           # Main admin app
└── Main.jsx          # Router setup
```

---

### 3. **Backend (backend/)**
   - **Framework**: Node.js + Express
   - **Database**: MongoDB (via models)
   - **Caching**: Redis
   - **Real-time**: Socket.io server
   - **Authentication**: JWT tokens

**Key Features:**
- RESTful API endpoints for all operations
- User authentication and authorization
- Game logic and match-making engine
- Wallet and transaction management
- KYC verification workflow
- Battle and tournament management
- Payment processing integration
- Real-time game socket handling
- Admin operations and oversight

**Directory Structure:**
```
├── controllers/      # Business logic for routes
│   ├── usercontroller.js
│   ├── gameController.js
│   ├── battleController.js
│   ├── walletController.js
│   ├── kycController.js
│   ├── withdrawController.js
│   ├── redeemController.js
│   └── ... (more controllers)
├── models/          # MongoDB schemas
│   ├── user.js
│   ├── match.js
│   ├── battle.js
│   ├── wallet.js
│   ├── Transaction.js
│   └── ... (more models)
├── routes/          # API route definitions
│   ├── userAuth.js
│   ├── gameRoutes.js
│   ├── battleRoutes.js
│   ├── walletRoutes.js
│   └── ... (more routes)
├── middleware/      # Auth and validation middleware
│   └── auth.js
├── socket/          # Real-time game logic
│   ├── gameSocket.js
│   └── matchmaking.js
├── utils/           # Helper functions
│   ├── gameLogic.js
│   └── generateToken.js
├── config/          # Database and Redis configuration
│   ├── db.js
│   └── redis.js
└── server.js        # Express server setup
```

---

## 🔧 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React, Vite, Tailwind CSS, Socket.io Client, Firebase |
| **Admin** | React, CRA, Tailwind CSS |
| **Backend** | Node.js, Express, MongoDB, Redis, Socket.io Server |
| **Authentication** | JWT Tokens, Firebase |
| **Real-time** | WebSocket (Socket.io) |
| **Deployment** | Vercel (Frontend & Admin), Backend Server |

---

## 📦 Core Features

### 🎮 Game Management
- Real-time multiplayer Ludo game
- Game room creation and joining
- Match-making system
- Game history tracking
- Battle tournaments with entry fees

### 💰 Wallet System
- User wallet balance management
- Deposit functionality
- Withdrawal and redemption
- Transaction history
- Payment integration

### ✅ KYC Verification
- User identity verification
- Document submission
- Admin approval workflow
- Account verification status

### 🏆 Battle System
- Head-to-head battles
- Entry fees and prizes
- Proof of match submission
- Battle history and statistics

### 👥 Social Features
- User referral program
- Refer and earn rewards
- Friend connections
- Profile management

### 🛡️ Security
- JWT-based authentication
- Role-based access control
- Secure password handling
- Transaction verification

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- Redis
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd addaludo
   ```

2. **Frontend Setup**
   ```bash
   cd adda-ludo
   npm install
   npm run dev
   ```

3. **Admin Setup**
   ```bash
   cd admin
   npm install
   npm start
   ```

4. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start
   ```

---

## 📝 Environment Variables

### Backend (.env)
```
MONGODB_URI=<your-mongodb-uri>
REDIS_URL=<your-redis-url>
JWT_SECRET=<your-jwt-secret>
FIREBASE_CONFIG=<your-firebase-config>
PORT=5000
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Game
- `POST /api/game/create-room` - Create game room
- `GET /api/game/rooms` - Get available rooms
- `POST /api/game/join` - Join a game

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/deposit` - Deposit money
- `POST /api/wallet/withdraw` - Withdraw money

### Battle
- `POST /api/battle/create` - Create battle
- `POST /api/battle/join` - Join battle
- `POST /api/battle/submit-proof` - Submit match proof

### KYC
- `POST /api/kyc/submit` - Submit KYC documents
- `GET /api/kyc/status` - Check KYC status

---

## 🔄 Real-time Communication

Socket.io events handle:
- Game state updates
- Player movements and actions
- Match-making notifications
- Battle result broadcasting
- Live notifications

---

## 📊 Database Schema

Key collections in MongoDB:
- **users**: User accounts and profiles
- **matches**: Game match records
- **battles**: Battle competition records
- **wallets**: User wallet data
- **transactions**: Payment transactions
- **kyc**: KYC verification documents
- **deposits**: Deposit history
- **withdrawals**: Withdrawal requests
- **gameRooms**: Active game rooms

---

## 🛠️ Development

### Project Structure Summary
- **Monorepo**: Single repository with three independent applications
- **Separation of Concerns**: Frontend, Admin, and Backend are independently deployable
- **Real-time Features**: Socket.io enables live multiplayer experience
- **Scalable**: Modular architecture supports feature expansion

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 👥 Support

For issues, feature requests, or support, please contact the development team.

---

**Last Updated**: June 2026
