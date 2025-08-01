# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **uni-app stock trading application** built with Vue 3 and TypeScript. It's designed as a cross-platform mobile application for stock trading, market data, and financial news. The project consists of both a frontend (uni-app) and backend (Node.js/TypeScript) server component.

## Key Technologies

### Frontend (Client)
- **Framework**: uni-app (Vue 3 + TypeScript)
- **State Management**: Pinia stores
- **HTTP Client**: Axios with interceptors
- **Build Tool**: Vite with uni-app plugin
- **UI Components**: Custom components (no external UI library)
- **Real-time Data**: WebSocket ready architecture

### Backend (Server)
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MySQL + Redis
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **Testing**: Jest
- **Containerization**: Docker support

## Development Commands

### Frontend Development
```bash
# Development server (H5)
npm run dev:h5

# Build for production (H5)
npm run build:h5

# Type checking
npm run type-check

# Development for specific platforms
npm run dev:mp-weixin    # WeChat Mini Program
npm run dev:mp-alipay    # Alipay Mini Program
npm run dev:app         # Mobile App
```

### Backend Development (in /server directory)
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Testing
npm test
npm run test:watch
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Database operations
npm run migrate
npm run seed

# Docker operations
npm run docker:build
npm run docker:run
```

## Project Architecture

### Frontend Structure
```
src/
├── components/          # Reusable components
│   ├── common/          # Basic UI components (Loading, Modal, Toast, etc.)
│   ├── layout/          # Layout components (Header, Footer, Sidebar)
│   ├── market/          # Market-specific components
│   └── trade/           # Trading-specific components
├── pages/              # Page modules
│   ├── index/          # Home page with market overview
│   ├── market/         # Market data and stock details
│   ├── trade/          # Trading interface and account management
│   ├── news/           # News and information
│   └── profile/        # User profile and settings
├── stores/             # Pinia state management
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── static/             # Static assets
```

### Backend Structure
```
server/src/
├── config/             # Configuration management
│   ├── database/       # Database configuration
│   ├── env/           # Environment configuration
│   ├── redis/         # Redis configuration
│   └── websocket/     # WebSocket configuration
├── controllers/       # Request handlers
│   ├── api/           # API controllers
│   ├── v1/            # API v1 endpoints
│   └── v2/            # API v2 endpoints
├── middleware/        # Express middleware
│   ├── auth/          # Authentication middleware
│   ├── cache/         # Caching middleware
│   ├── rateLimit/     # Rate limiting middleware
│   └── validation/    # Input validation middleware
├── models/            # Data models and repositories
│   ├── entities/      # Database entities
│   └── repositories/  # Data access layer
├── routes/            # Route definitions
├── services/          # Business logic layer
│   ├── market/        # Market data services
│   ├── news/          # News services
│   ├── notification/  # Notification services
│   ├── trade/         # Trading services
│   └── user/          # User services
├── types/             # TypeScript types
│   ├── api/           # API types
│   ├── dto/           # Data transfer objects
│   └── entities/      # Entity types
├── utils/             # Utility functions
│   ├── database/      # Database utilities
│   ├── logger/        # Logging utilities
│   └── redis/         # Redis utilities
└── tests/             # Test files
    ├── unit/          # Unit tests
    ├── integration/   # Integration tests
    └── e2e/           # End-to-end tests
```

### State Management (Frontend)
- **useMarketStore**: Market data, indices, hot stocks, real-time quotes
- **useTradeStore**: Trading operations, positions, orders, accounts
- **useUserStore**: User authentication and profile
- **useAppStore**: Global app state and configuration

### API Services (Frontend)
- **marketService**: Market data, stock quotes, charts, financial data
- **tradeService**: Trading operations, order management
- **userService**: User authentication, profile management
- **newsService**: News and announcements
- **notificationService**: Push notifications and alerts

### Backend Services
- **Market Service**: Real-time market data processing and distribution
- **Trade Service**: Trading operations, order management, risk assessment
- **User Service**: User management, authentication, authorization
- **News Service**: News aggregation and distribution
- **Notification Service**: Real-time notifications and alerts

## Key Features

### Market Module
- Real-time market indices and stock quotes
- Stock search and screening
- K-line charts and technical analysis
- Market sentiment and capital flow analysis
- Hot stocks and rankings

### Trading Module
- Buy/sell order placement
- Position management and P&L tracking
- Order history and status monitoring
- Account balance and fund management
- Risk assessment and margin calculations

### News Module
- Financial news and market analysis
- Company announcements
- Research reports
- Economic calendar

## Development Patterns

### Frontend Component Architecture
- Components use Vue 3 Composition API with `<script setup>`
- TypeScript for type safety
- Reactive state management with Pinia
- Consistent naming: PascalCase for components, camelCase for functions

### Backend Architecture
- Layered architecture: Controllers → Services → Repositories → Models
- Dependency injection pattern
- Middleware-based request processing
- Repository pattern for data access

### API Integration
- Axios-based HTTP client with retry mechanism
- Request/response interceptors for authentication
- Built-in caching for market data
- Error handling with user-friendly messages

### State Management
- Pinia stores with reactive state
- Computed properties for derived data
- Actions for async operations
- Proper error handling and loading states

## Type System

### Frontend Type Categories
- **Stock Types**: Stock data, quotes, financial information
- **Trade Types**: Orders, positions, accounts, transactions
- **Market Types**: Indices, market data, rankings
- **User Types**: Authentication, profile, preferences
- **API Types**: Request/response structures, pagination

### Backend Type Categories
- **Entity Types**: Database model definitions
- **DTO Types**: Data transfer objects for API requests/responses
- **API Types**: API route parameter and response types
- **Service Types**: Business logic types

### Type Organization
- Frontend types organized by domain in `/src/types/`
- Backend types organized by layer in `/server/src/types/`
- Main exports through respective `index.ts` files
- Strict TypeScript configuration enabled

## Configuration Files

### Frontend Build Configuration
- **vite.config.ts**: Vite configuration with uni-app plugin
- **tsconfig.json**: TypeScript configuration with strict mode
- **pages.json**: uni-app page routing and tab bar configuration

### Backend Configuration
- **server/src/config/index.ts**: Centralized configuration management
- **server/tsconfig.json**: TypeScript configuration for backend
- **server/jest.config.js**: Jest testing configuration

### Environment Setup
- Uses environment variables for API and database configuration
- Development and production environment support
- API base URL and database credentials configurable per environment

## Database Architecture

### Database Schema
- **User Database**: User accounts, profiles, preferences
- **Trade Database**: Orders, positions, transactions, accounts
- **Market Database**: Stock information, market data, indices
- **News Database**: Articles, announcements, research reports

### Caching Strategy
- Redis for session storage and market data caching
- Database query result caching
- API response caching for frequently accessed data

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Session management with Redis

### Data Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting

### Communication Security
- HTTPS for API communication
- WebSocket Secure (WSS) for real-time data
- Data encryption for sensitive information

## Development Guidelines

### Code Style
- Vue 3 Composition API with `<script setup>` for frontend
- TypeScript for all new code
- Consistent import ordering
- Proper error handling and user feedback
- ESLint and Prettier for code formatting

### Testing Strategy
- Frontend: Type checking via `npm run type-check`
- Backend: Unit tests, integration tests, and e2e tests with Jest
- Component testing recommended for new features
- API integration testing for service layer

### Performance Considerations
- Built-in caching for market data
- Lazy loading for components and pages
- Optimized real-time data updates
- Memory management for large datasets
- Database connection pooling
- Redis caching for frequently accessed data

## File Naming Conventions

### Frontend
- **Components**: PascalCase (e.g., `MarketIndices.vue`)
- **Pages**: kebab-case (e.g., `market-detail.vue`)
- **Services**: camelCase (e.g., `marketService.ts`)
- **Stores**: camelCase with `use` prefix (e.g., `useMarketStore.ts`)
- **Types**: PascalCase (e.g., `MarketIndex.ts`)
- **Utils**: camelCase (e.g., `format.ts`)

### Backend
- **Controllers**: PascalCase (e.g., `UserController.ts`)
- **Services**: PascalCase (e.g., `MarketService.ts`)
- **Models/Entities**: PascalCase (e.g., `User.ts`)
- **Repositories**: PascalCase + Repository (e.g., `UserRepository.ts`)
- **Middleware**: camelCase (e.g., `auth.ts`)
- **Types**: PascalCase (e.g., `UserDto.ts`)

## Important Notes

- This is a **uni-app** project, not a standard Vue project
- Uses **uni-app specific APIs** for cross-platform compatibility
- No external UI library - uses custom components
- Real-time data architecture designed for WebSocket integration
- Comprehensive type system for financial data accuracy
- Backend follows enterprise-grade patterns and practices

## Common Development Tasks

### Adding New Market Data
1. Define types in `/src/types/market.ts`
2. Update service methods in `marketService.ts`
3. Add store actions in `useMarketStore.ts`
4. Create/update components to display data
5. Implement backend API endpoints if needed

### Adding New Trading Features
1. Define trade types in `/src/types/trade.ts`
2. Implement API methods in `tradeService.ts`
3. Update store in `useTradeStore.ts`
4. Add trading components and pages
5. Implement backend trading logic and validation

### Adding New Pages
1. Create page component in appropriate `/pages/` folder
2. Add route configuration in `pages.json`
3. Create navigation links in tab bar or menu
4. Update app store if needed for navigation state

### Backend Development
1. Define entity types in `/server/src/types/entities/`
2. Create DTOs in `/server/src/types/dto/`
3. Implement repository pattern in `/server/src/models/repositories/`
4. Add business logic in `/server/src/services/`
5. Create controllers in `/server/src/controllers/`
6. Define routes in `/server/src/routes/`