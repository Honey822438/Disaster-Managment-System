# Smart Disaster Response MIS - Frontend

React-based frontend for the Smart Disaster Response Management Information System.

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with JWT interceptors
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization library

## Features

- Role-based authentication and authorization
- Dark emergency operations center theme
- 11 page components for different system functions
- 10 reusable UI components
- Real-time data visualization with charts
- Responsive design (mobile-friendly)

## Pages

1. **Login** - Authentication
2. **Dashboard** - Summary metrics
3. **Emergency Reports** - Report management
4. **Rescue Teams** - Team coordination
5. **Resources** - Inventory management
6. **Hospitals** - Capacity tracking
7. **Finance** - Donations and expenses
8. **Approvals** - Workflow management
9. **Users** - User management (admin only)
10. **Audit Logs** - Activity tracking (admin only)
11. **Analytics** - Data visualization

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Docker

The frontend is containerized and runs on port 3000. It proxies API requests to the backend service.

```bash
# Start all services
docker-compose up --build
```

## Test Credentials

- Admin: admin@disaster.gov / admin123
- Operator: operator@disaster.gov / operator123
- Field Officer: field@disaster.gov / field123
- Warehouse Manager: warehouse@disaster.gov / warehouse123
- Finance Officer: finance@disaster.gov / finance123
