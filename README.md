# Quillio - Multi-Tenant SaaS Notes Application

A secure, multi-tenant SaaS application for managing notes with role-based access control and subscription-based feature gating. Built with Next.js 14, TypeScript, MongoDB, and deployed on Vercel.

## 🏗️ Architecture Overview

### Multi-Tenancy Approach
This application uses a **shared schema with tenant ID column** approach for multi-tenancy:

- **Data Isolation**: All data models (User, Notes, Tenant) include a `tenantId` field
- **Query Filtering**: Database queries are filtered by `tenantId` to ensure strict data isolation
- **Tenant Identification**: Each tenant is identified by a unique slug (e.g., "acme", "globex")
- **Subscription Management**: Each tenant has its own subscription plan and note limits

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with middleware
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with HTTP-only cookies
- **Deployment**: Vercel (Frontend + Backend)
- **UI Components**: Radix UI with custom styling

## 🚀 Features

### Core Features
- ✅ **Multi-Tenant Architecture** with strict data isolation
- ✅ **JWT Authentication** with secure HTTP-only cookies
- ✅ **Role-Based Access Control** (Admin/Member roles)
- ✅ **Subscription Feature Gating** (Free/Pro plans)
- ✅ **Complete Notes CRUD** with tenant isolation
- ✅ **User Management** (Admin only)
- ✅ **Real-time UI Updates** with loading states
- ✅ **Responsive Design** with modern UI components

### Security Features
- ✅ **Tenant Data Isolation** - Users can only access their tenant's data
- ✅ **Role Enforcement** - API endpoints enforce role-based permissions
- ✅ **Input Validation** - Zod schema validation for all inputs
- ✅ **SQL Injection Protection** - Mongoose ODM prevents injection attacks
- ✅ **CORS Enabled** - For automated testing and external integrations

### Special Features
- 🎯 **Smart Note Assignment** - Notes can be assigned to team members
- 🎯 **Priority System** - Low, Medium, High priority with visual indicators
- 🎯 **Real-time Notifications** - Toast notifications for all actions
- 🎯 **Loading States** - Comprehensive loading indicators for better UX
- 🎯 **Error Handling** - Detailed error messages with user-friendly feedback
- 🎯 **Automatic Note Counting** - Real-time note count tracking per tenant

## 📋 Requirements Compliance

### ✅ Multi-Tenancy
- **Two Tenants**: Acme Corporation and Globex Corporation
- **Strict Isolation**: Data belonging to one tenant is never accessible to another
- **Approach**: Shared schema with tenant ID column (documented above)

### ✅ Authentication & Authorization
- **JWT-based Login**: Secure authentication with HTTP-only cookies
- **Roles Implemented**:
  - **Admin**: Can invite users, upgrade subscriptions, manage all notes
  - **Member**: Can create, view, edit, and delete notes only
- **Test Accounts** (password: "password"):
  - `admin@acme.test` (Admin, Acme)
  - `user@acme.test` (Member, Acme)
  - `admin@globex.test` (Admin, Globex)
  - `user@globex.test` (Member, Globex)

### ✅ Subscription Feature Gating
- **Free Plan**: Limited to 3 notes per tenant
- **Pro Plan**: Unlimited notes
- **Upgrade Endpoint**: `POST /api/tenant/:slug/upgrade` (Admin only)
- **Immediate Effect**: Note limits are lifted immediately after upgrade

### ✅ Notes API (CRUD)
- `POST /api/notes` - Create a note (with tenant isolation)
- `GET /api/notes` - List all notes for current tenant
- `GET /api/notes/:id` - Retrieve specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### ✅ Deployment
- **Vercel Hosted**: Both frontend and backend on Vercel
- **CORS Enabled**: For automated testing and external access
- **Health Endpoint**: `GET /api/health` → `{ "status": "ok" }`

### ✅ Frontend
- **Login System**: Support for all predefined test accounts
- **Notes Management**: Full CRUD operations with modern UI
- **Upgrade Prompts**: "Upgrade to Pro" when Free plan limit reached
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd quillio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quillio
   JWT_SECRET=your-super-secret-jwt-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database Setup**:
   ```bash
   # Clear and seed the database
   npm run fix-db
   npm run seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

6. **Access the Application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run seed         # Seed database with test data
npm run fix-db       # Clear database and fix collections
```

## 🌐 API Documentation

### Base URL
- **Local**: `http://localhost:3000/api`
- **Production**: `https://your-app.vercel.app/api`

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.test",
  "password": "password"
}
```

#### Logout
```http
POST /api/auth/logout
```

### Health Check
```http
GET /api/health
Response: { "status": "ok" }
```

### Notes Endpoints

#### List Notes
```http
GET /api/notes
Authorization: Cookie: auth-token=...
```

#### Create Note
```http
POST /api/notes
Content-Type: application/json
Authorization: Cookie: auth-token=...

{
  "title": "My Note",
  "content": "Note content here",
  "priority": "high",
  "assignedTo": "user-id-optional"
}
```

#### Get Note
```http
GET /api/notes/:id
Authorization: Cookie: auth-token=...
```

#### Update Note
```http
PUT /api/notes/:id
Content-Type: application/json
Authorization: Cookie: auth-token=...

{
  "title": "Updated Note",
  "content": "Updated content",
  "priority": "medium"
}
```

#### Delete Note
```http
DELETE /api/notes/:id
Authorization: Cookie: auth-token=...
```

### User Management (Admin Only)

#### List Users
```http
GET /api/users
Authorization: Cookie: auth-token=...
```

#### Create User
```http
POST /api/users
Content-Type: application/json
Authorization: Cookie: auth-token=...

{
  "email": "newuser@acme.test",
  "firstName": "John",
  "lastName": "Doe",
  "role": "member"
}
```

### Tenant Management (Admin Only)

#### Upgrade Tenant
```http
POST /api/tenant/:slug/upgrade
Authorization: Cookie: auth-token=...
```

## 🚀 Deployment on Vercel

### Prerequisites
- Vercel account
- MongoDB Atlas database
- GitHub repository

### Deployment Steps

1. **Prepare Environment Variables**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quillio
   JWT_SECRET=your-super-secret-jwt-key-here
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   
   # Set environment variables
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add NEXTAUTH_URL
   ```

3. **Seed Production Database**:
   ```bash
   # Run seed script against production database
   npm run seed
   ```

4. **Verify Deployment**:
   - Health check: `GET https://your-app.vercel.app/api/health`
   - Login: `POST https://your-app.vercel.app/api/auth/login`

### Vercel Configuration

The application is configured for Vercel with:
- **Automatic Builds**: Triggered on git push
- **Environment Variables**: Securely stored in Vercel dashboard
- **CORS Headers**: Configured for external API access
- **MongoDB Connection**: Optimized for serverless functions

## 🧪 Testing

### Automated Testing Support
The application is designed to work with automated test scripts:

- **CORS Enabled**: All API endpoints support cross-origin requests
- **Consistent Response Format**: Standardized JSON responses
- **Error Handling**: Proper HTTP status codes and error messages
- **Health Endpoint**: Available for uptime monitoring

### Test Account Access
All test accounts use password: `password`

| Email | Role | Tenant | Access Level |
|-------|------|--------|--------------|
| admin@acme.test | Admin | Acme | Full access + user management |
| user@acme.test | Member | Acme | Notes only |
| admin@globex.test | Admin | Globex | Full access + user management |
| user@globex.test | Member | Globex | Notes only |

## 🔒 Security Features

### Data Protection
- **Tenant Isolation**: Strict data separation between tenants
- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection Prevention**: Mongoose ODM provides protection
- **XSS Protection**: React's built-in XSS protection

### Authentication Security
- **JWT Tokens**: Secure, stateless authentication
- **HTTP-Only Cookies**: Prevents XSS token theft
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Automatic token expiration

### API Security
- **Role-Based Access**: Endpoints enforce user roles
- **Tenant Validation**: All queries filtered by tenant
- **Rate Limiting**: Built-in Next.js rate limiting
- **CORS Configuration**: Controlled cross-origin access

## 📊 Database Schema

### Collections
- **tenants**: Tenant information and subscription plans
- **users**: User accounts with role and tenant association
- **notes**: Notes with tenant isolation and assignment

### Key Indexes
- `tenants.slug` (unique)
- `users.email + tenantId` (unique)
- `notes.tenant` (for tenant isolation)
- `notes.tenant + createdBy` (for user notes)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation above
- Review the test account credentials

---

**Built with ❤️ using Next.js, TypeScript, and MongoDB**
