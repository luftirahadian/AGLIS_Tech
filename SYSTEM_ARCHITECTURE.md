# System Architecture & Technical Design
## ISP Technician Management System

### 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Web Dashboard │   Customer      │   Mobile PWA            │
│   (React/Next)  │   Portal        │   (Technician App)      │
│                 │   (React)       │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                             │
│              (Authentication, Rate Limiting)                │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│   User Service  │   Ticket        │   Notification          │
│                 │   Service       │   Service               │
├─────────────────┼─────────────────┼─────────────────────────┤
│   Technician    │   Inventory     │   Reporting             │
│   Service       │   Service       │   Service               │
└─────────────────┴─────────────────┴─────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
├─────────────────┬─────────────────┬─────────────────────────┤
│   PostgreSQL    │   Redis Cache   │   File Storage          │
│   (Primary DB)  │   (Sessions)    │   (S3/MinIO)           │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 🛠️ **Technology Stack**

#### **Frontend Technologies**
```yaml
Web Dashboard:
  Framework: Next.js 14 (React 18)
  Styling: Tailwind CSS + Shadcn/ui
  State Management: Zustand
  Forms: React Hook Form + Zod
  Charts: Recharts
  Maps: Leaflet/MapBox

Mobile PWA:
  Framework: Next.js PWA
  UI Components: Tailwind + Headless UI
  Offline: Service Workers
  Camera: WebRTC API
  GPS: Geolocation API
```

#### **Backend Technologies**
```yaml
API Server:
  Runtime: Node.js 20 LTS
  Framework: Express.js + TypeScript
  Authentication: JWT + Refresh Tokens
  Validation: Joi/Zod
  Documentation: Swagger/OpenAPI

Database:
  Primary: PostgreSQL 15
  Cache: Redis 7
  Search: PostgreSQL Full-Text Search
  File Storage: AWS S3 / MinIO
```

#### **Infrastructure & DevOps**
```yaml
Containerization: Docker + Docker Compose
Orchestration: Kubernetes (Production)
CI/CD: GitHub Actions
Monitoring: Prometheus + Grafana
Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
Load Balancer: Nginx
SSL: Let's Encrypt
```

#### **Third-Party Services**
```yaml
Maps: Google Maps API / OpenStreetMap
SMS: Twilio / AWS SNS
Email: SendGrid / AWS SES
Push Notifications: Firebase Cloud Messaging
File Upload: AWS S3 / Cloudinary
Analytics: Google Analytics 4
```

---

## 🗄️ **Database Design**

### **Core Tables Structure**

```sql
-- Users and Authentication
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer Information
customers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  full_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  nik VARCHAR UNIQUE,
  address TEXT NOT NULL,
  coordinates POINT, -- PostGIS for GPS
  service_area VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Technician Profiles
technicians (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  employee_id VARCHAR UNIQUE,
  full_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  skills TEXT[], -- Array of skills
  service_areas TEXT[], -- Coverage areas
  is_available BOOLEAN DEFAULT true,
  current_location POINT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ticket Management
tickets (
  id UUID PRIMARY KEY,
  ticket_number VARCHAR UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  technician_id UUID REFERENCES technicians(id),
  type ticket_type NOT NULL,
  priority priority_level NOT NULL,
  status ticket_status NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  location POINT,
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  sla_deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Management
inventory_items (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  sku VARCHAR UNIQUE NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Equipment Assignments
equipment_assignments (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id),
  technician_id UUID REFERENCES technicians(id),
  ticket_id UUID REFERENCES tickets(id),
  serial_number VARCHAR,
  quantity INTEGER NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  returned_at TIMESTAMP
);

-- Activity Logs
activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Enums and Types**
```sql
CREATE TYPE user_role AS ENUM (
  'super_admin', 'manager', 'supervisor', 
  'customer_service', 'technician', 'customer'
);

CREATE TYPE ticket_type AS ENUM (
  'new_installation', 'repair', 'maintenance', 
  'upgrade', 'disconnection'
);

CREATE TYPE priority_level AS ENUM (
  'low', 'normal', 'high', 'critical', 'emergency'
);

CREATE TYPE ticket_status AS ENUM (
  'new', 'assigned', 'in_progress', 'pending', 
  'resolved', 'closed', 'cancelled'
);
```

---

## 🔧 **API Architecture**

### **RESTful API Design**

#### **Authentication Endpoints**
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

#### **User Management**
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
PUT    /api/users/:id/role
```

#### **Customer Management**
```
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
GET    /api/customers/:id/tickets
POST   /api/customers/:id/tickets
```

#### **Ticket Management**
```
GET    /api/tickets
POST   /api/tickets
GET    /api/tickets/:id
PUT    /api/tickets/:id
DELETE /api/tickets/:id
POST   /api/tickets/:id/assign
PUT    /api/tickets/:id/status
POST   /api/tickets/:id/comments
GET    /api/tickets/:id/history
```

#### **Technician Operations**
```
GET    /api/technicians
GET    /api/technicians/:id
PUT    /api/technicians/:id/location
GET    /api/technicians/:id/tickets
PUT    /api/technicians/:id/availability
GET    /api/technicians/:id/performance
```

#### **Inventory Management**
```
GET    /api/inventory/items
POST   /api/inventory/items
PUT    /api/inventory/items/:id
GET    /api/inventory/assignments
POST   /api/inventory/assignments
PUT    /api/inventory/assignments/:id/return
```

### **Real-time Features**
```javascript
// WebSocket Events
const socketEvents = {
  // Ticket Updates
  'ticket:created': (data) => {},
  'ticket:assigned': (data) => {},
  'ticket:status_changed': (data) => {},
  'ticket:completed': (data) => {},
  
  // Technician Updates
  'technician:location_updated': (data) => {},
  'technician:availability_changed': (data) => {},
  
  // Notifications
  'notification:new': (data) => {},
  'notification:read': (data) => {}
};
```

---

## 🔐 **Security Architecture**

### **Authentication & Authorization**
```yaml
Authentication:
  Method: JWT + Refresh Token
  Token Expiry: Access (15min), Refresh (7 days)
  Storage: HttpOnly Cookies (Web), Secure Storage (Mobile)
  
Authorization:
  Method: Role-Based Access Control (RBAC)
  Permissions: Resource + Action based
  Middleware: Express middleware for route protection
```

### **Data Security**
```yaml
Encryption:
  At Rest: AES-256 (Database level)
  In Transit: TLS 1.3
  Passwords: bcrypt (12 rounds)
  
Input Validation:
  Schema Validation: Joi/Zod
  SQL Injection: Parameterized queries
  XSS Protection: Content Security Policy
  
Rate Limiting:
  API: 100 requests/minute per IP
  Auth: 5 login attempts per 15 minutes
  File Upload: 10MB max size
```

### **Audit & Monitoring**
```yaml
Logging:
  Application: Winston + ELK Stack
  Access Logs: Nginx logs
  Database: PostgreSQL query logs
  
Monitoring:
  Metrics: Prometheus + Grafana
  Uptime: Pingdom/UptimeRobot
  Errors: Sentry
  Performance: New Relic/DataDog
```

---

## 📱 **Mobile PWA Architecture**

### **Progressive Web App Features**
```yaml
Core Features:
  - Offline functionality
  - Push notifications
  - Home screen installation
  - Background sync
  - Camera integration
  - GPS tracking

Service Worker:
  - Cache API responses
  - Background data sync
  - Offline form submission
  - Image optimization
  - Update notifications

Local Storage:
  - IndexedDB for offline data
  - LocalStorage for user preferences
  - Cache API for static assets
```

### **Mobile-Specific Optimizations**
```yaml
Performance:
  - Code splitting by routes
  - Lazy loading components
  - Image optimization
  - Bundle size < 250KB initial

UX Optimizations:
  - Touch-friendly interface
  - Swipe gestures
  - Pull-to-refresh
  - Haptic feedback
  - Dark mode support
```

---

## 🚀 **Deployment Architecture**

### **Development Environment**
```yaml
Local Development:
  - Docker Compose setup
  - Hot reload enabled
  - Mock external services
  - Seed data included

Staging Environment:
  - Kubernetes cluster
  - Production-like data
  - External service integration
  - Performance testing
```

### **Production Environment**
```yaml
Infrastructure:
  - Kubernetes cluster (3+ nodes)
  - Load balancer (Nginx/HAProxy)
  - Auto-scaling enabled
  - Multi-AZ deployment

Database:
  - Primary-Replica setup
  - Automated backups
  - Connection pooling
  - Query optimization

Monitoring:
  - Health checks
  - Resource monitoring
  - Error tracking
  - Performance metrics
```

### **CI/CD Pipeline**
```yaml
Source Control: Git (GitHub/GitLab)
Build Process:
  1. Code quality checks (ESLint, Prettier)
  2. Unit tests (Jest)
  3. Integration tests
  4. Security scanning
  5. Docker image build
  6. Deploy to staging
  7. E2E tests
  8. Deploy to production

Deployment Strategy:
  - Blue-Green deployment
  - Database migrations
  - Rollback capability
  - Zero-downtime deployment
```

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Architecture Review**: Quarterly  
**Performance Baseline**: To be established
