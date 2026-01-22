# Contributing to Payless Cars

Thank you for your interest in contributing to Payless Cars! This document provides guidelines for contributions.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/paylesscars.git
   cd paylesscars
   ```
3. **Run the setup script**
   ```bash
   # Windows
   .\scripts\fresh-setup.ps1
   
   # Mac/Linux
   ./scripts/fresh-setup.sh
   ```

## 📁 Project Structure

```
paylesscars/
├── backend/          # Django REST API
├── frontend/         # Next.js React App
├── docs/             # Technical Documentation
├── scripts/          # Setup & Utility Scripts
└── assets/           # Screenshots & Media
```

## 🔧 Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates

### Code Standards
- **Frontend**: TypeScript, ESLint, Prettier
- **Backend**: Python 3.10+, PEP 8, Black formatter

### Commit Messages
Follow conventional commits:
```
feat: add vehicle comparison feature
fix: resolve negotiation status bug
docs: update API documentation
```

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend type checking
cd frontend
npm run type-check
```

## 📝 Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README if applicable
4. Request review from maintainers

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
