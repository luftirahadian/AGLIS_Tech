# API Specification
## ISP Technician Management System

### 📋 **API Overview**

**Base URL**: `https://api.isp-management.com/v1`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`  
**API Version**: v1.0  

### 🔐 **Authentication Flow**

```javascript
// Login Request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "technician",
      "profile": {...}
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 900
    }
  }
}
```

---

## 🔑 **Authentication Endpoints**

### **POST /api/auth/login**
User login dengan email dan password.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "remember_me": "boolean (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "role": "enum",
      "profile": "object"
    },
    "tokens": {
      "access_token": "string",
      "refresh_token": "string",
      "expires_in": "number"
    }
  }
}
```

### **POST /api/auth/refresh**
Refresh access token menggunakan refresh token.

**Request Body:**
```json
{
  "refresh_token": "string (required)"
}
```

### **POST /api/auth/logout**
Logout user dan invalidate tokens.

**Headers:** `Authorization: Bearer <access_token>`

### **POST /api/auth/forgot-password**
Request password reset email.

**Request Body:**
```json
{
  "email": "string (required)"
}
```

### **POST /api/auth/reset-password**
Reset password dengan token dari email.

**Request Body:**
```json
{
  "token": "string (required)",
  "password": "string (required)",
  "password_confirmation": "string (required)"
}
```

---

## 👥 **User Management Endpoints**

### **GET /api/users**
Get list of users dengan pagination dan filtering.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `role`: enum (super_admin, manager, supervisor, customer_service, technician, customer)
- `search`: string (search by name or email)
- `is_active`: boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "string",
        "role": "enum",
        "is_active": "boolean",
        "profile": {
          "full_name": "string",
          "phone": "string",
          "avatar": "string"
        },
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### **POST /api/users**
Create new user.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "role": "enum (required)",
  "profile": {
    "full_name": "string (required)",
    "phone": "string (required)",
    "avatar": "string (optional)"
  }
}
```

### **GET /api/users/:id**
Get user by ID.

### **PUT /api/users/:id**
Update user information.

### **DELETE /api/users/:id**
Soft delete user (set is_active = false).

---

## 👤 **Customer Management Endpoints**

### **GET /api/customers**
Get list of customers dengan pagination dan filtering.

**Query Parameters:**
- `page`: number
- `limit`: number
- `search`: string
- `service_area`: string
- `created_from`: date
- `created_to`: date

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "full_name": "string",
        "phone": "string",
        "nik": "string",
        "address": "string",
        "coordinates": {
          "lat": "number",
          "lng": "number"
        },
        "service_area": "string",
        "created_at": "timestamp"
      }
    ],
    "pagination": {...}
  }
}
```

### **POST /api/customers**
Register new customer.

**Request Body:**
```json
{
  "full_name": "string (required)",
  "phone": "string (required)",
  "email": "string (required)",
  "nik": "string (optional)",
  "address": "string (required)",
  "coordinates": {
    "lat": "number (required)",
    "lng": "number (required)"
  },
  "service_area": "string (required)",
  "service_package": "string (optional)"
}
```

### **GET /api/customers/:id**
Get customer detail by ID.

### **PUT /api/customers/:id**
Update customer information.

### **GET /api/customers/:id/tickets**
Get customer's tickets history.

---

## 🎫 **Ticket Management Endpoints**

### **GET /api/tickets**
Get list of tickets dengan advanced filtering.

**Query Parameters:**
- `page`: number
- `limit`: number
- `status`: enum (new, assigned, in_progress, pending, resolved, closed)
- `priority`: enum (low, normal, high, critical, emergency)
- `type`: enum (new_installation, repair, maintenance, upgrade, disconnection)
- `technician_id`: uuid
- `customer_id`: uuid
- `created_from`: date
- `created_to`: date
- `scheduled_from`: date
- `scheduled_to`: date

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "uuid",
        "ticket_number": "string",
        "customer": {
          "id": "uuid",
          "full_name": "string",
          "phone": "string",
          "address": "string"
        },
        "technician": {
          "id": "uuid",
          "full_name": "string",
          "phone": "string"
        },
        "type": "enum",
        "priority": "enum",
        "status": "enum",
        "title": "string",
        "description": "string",
        "location": {
          "lat": "number",
          "lng": "number"
        },
        "scheduled_at": "timestamp",
        "completed_at": "timestamp",
        "sla_deadline": "timestamp",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "pagination": {...}
  }
}
```

### **POST /api/tickets**
Create new ticket.

**Request Body:**
```json
{
  "customer_id": "uuid (required)",
  "type": "enum (required)",
  "priority": "enum (required)",
  "title": "string (required)",
  "description": "string (required)",
  "location": {
    "lat": "number (required)",
    "lng": "number (required)"
  },
  "scheduled_at": "timestamp (optional)",
  "attachments": ["string"] // Array of file URLs
}
```

### **GET /api/tickets/:id**
Get ticket detail by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "uuid",
      "ticket_number": "string",
      "customer": {...},
      "technician": {...},
      "type": "enum",
      "priority": "enum",
      "status": "enum",
      "title": "string",
      "description": "string",
      "location": {...},
      "scheduled_at": "timestamp",
      "completed_at": "timestamp",
      "sla_deadline": "timestamp",
      "attachments": [
        {
          "id": "uuid",
          "filename": "string",
          "url": "string",
          "type": "string",
          "uploaded_by": "uuid",
          "uploaded_at": "timestamp"
        }
      ],
      "comments": [
        {
          "id": "uuid",
          "user": {...},
          "comment": "string",
          "created_at": "timestamp"
        }
      ],
      "history": [
        {
          "id": "uuid",
          "action": "string",
          "old_value": "string",
          "new_value": "string",
          "user": {...},
          "created_at": "timestamp"
        }
      ]
    }
  }
}
```

### **PUT /api/tickets/:id**
Update ticket information.

### **POST /api/tickets/:id/assign**
Assign ticket to technician.

**Request Body:**
```json
{
  "technician_id": "uuid (required)",
  "scheduled_at": "timestamp (optional)",
  "notes": "string (optional)"
}
```

### **PUT /api/tickets/:id/status**
Update ticket status.

**Request Body:**
```json
{
  "status": "enum (required)",
  "notes": "string (optional)",
  "attachments": ["string"] // Optional file URLs
}
```

### **POST /api/tickets/:id/comments**
Add comment to ticket.

**Request Body:**
```json
{
  "comment": "string (required)",
  "attachments": ["string"] // Optional file URLs
}
```

---

## 🔧 **Technician Management Endpoints**

### **GET /api/technicians**
Get list of technicians.

**Query Parameters:**
- `page`: number
- `limit`: number
- `is_available`: boolean
- `service_area`: string
- `skills`: string (comma-separated)

**Response:**
```json
{
  "success": true,
  "data": {
    "technicians": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "employee_id": "string",
        "full_name": "string",
        "phone": "string",
        "skills": ["string"],
        "service_areas": ["string"],
        "is_available": "boolean",
        "current_location": {
          "lat": "number",
          "lng": "number",
          "updated_at": "timestamp"
        },
        "performance": {
          "total_tickets": "number",
          "completed_tickets": "number",
          "average_rating": "number",
          "completion_rate": "number"
        }
      }
    ],
    "pagination": {...}
  }
}
```

### **GET /api/technicians/:id**
Get technician detail by ID.

### **PUT /api/technicians/:id/location**
Update technician current location.

**Request Body:**
```json
{
  "lat": "number (required)",
  "lng": "number (required)"
}
```

### **GET /api/technicians/:id/tickets**
Get technician's assigned tickets.

**Query Parameters:**
- `status`: enum
- `date_from`: date
- `date_to`: date

### **PUT /api/technicians/:id/availability**
Update technician availability status.

**Request Body:**
```json
{
  "is_available": "boolean (required)",
  "reason": "string (optional)" // Required if setting to false
}
```

### **GET /api/technicians/:id/performance**
Get technician performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "performance": {
      "total_tickets": "number",
      "completed_tickets": "number",
      "pending_tickets": "number",
      "average_completion_time": "number", // in hours
      "average_rating": "number",
      "completion_rate": "number",
      "on_time_rate": "number",
      "first_call_resolution": "number",
      "monthly_stats": [
        {
          "month": "string",
          "completed": "number",
          "average_rating": "number"
        }
      ]
    }
  }
}
```

---

## 📦 **Inventory Management Endpoints**

### **GET /api/inventory/items**
Get inventory items list.

**Query Parameters:**
- `page`: number
- `limit`: number
- `category`: string
- `search`: string
- `low_stock`: boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "category": "string",
        "sku": "string",
        "description": "string",
        "unit_price": "number",
        "stock_quantity": "number",
        "min_stock_level": "number",
        "is_low_stock": "boolean",
        "created_at": "timestamp"
      }
    ],
    "pagination": {...}
  }
}
```

### **POST /api/inventory/items**
Add new inventory item.

**Request Body:**
```json
{
  "name": "string (required)",
  "category": "string (required)",
  "sku": "string (required)",
  "description": "string (optional)",
  "unit_price": "number (required)",
  "stock_quantity": "number (required)",
  "min_stock_level": "number (required)"
}
```

### **PUT /api/inventory/items/:id**
Update inventory item.

### **GET /api/inventory/assignments**
Get equipment assignments.

**Query Parameters:**
- `technician_id`: uuid
- `ticket_id`: uuid
- `status`: enum (assigned, returned)

### **POST /api/inventory/assignments**
Assign equipment to technician for a job.

**Request Body:**
```json
{
  "item_id": "uuid (required)",
  "technician_id": "uuid (required)",
  "ticket_id": "uuid (required)",
  "quantity": "number (required)",
  "serial_numbers": ["string"] // Optional for serialized items
}
```

### **PUT /api/inventory/assignments/:id/return**
Return assigned equipment.

**Request Body:**
```json
{
  "quantity_returned": "number (required)",
  "condition": "enum (good, damaged, lost)",
  "notes": "string (optional)"
}
```

---

## 📊 **Reporting & Analytics Endpoints**

### **GET /api/reports/dashboard**
Get dashboard summary data.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_tickets": "number",
      "pending_tickets": "number",
      "completed_today": "number",
      "overdue_tickets": "number",
      "active_technicians": "number",
      "customer_satisfaction": "number"
    },
    "charts": {
      "tickets_by_status": [...],
      "tickets_by_priority": [...],
      "completion_trend": [...],
      "technician_performance": [...]
    }
  }
}
```

### **GET /api/reports/tickets**
Generate ticket reports.

**Query Parameters:**
- `date_from`: date
- `date_to`: date
- `technician_id`: uuid
- `customer_id`: uuid
- `status`: enum
- `type`: enum
- `format`: enum (json, csv, pdf)

### **GET /api/reports/performance**
Get performance reports.

**Query Parameters:**
- `period`: enum (daily, weekly, monthly, yearly)
- `technician_id`: uuid
- `date_from`: date
- `date_to`: date

### **GET /api/reports/inventory**
Get inventory reports.

**Query Parameters:**
- `category`: string
- `low_stock_only`: boolean
- `date_from`: date
- `date_to`: date

---

## 🔔 **Notification Endpoints**

### **GET /api/notifications**
Get user notifications.

**Query Parameters:**
- `page`: number
- `limit`: number
- `is_read`: boolean
- `type`: string

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "string",
        "title": "string",
        "message": "string",
        "data": "object", // Additional data
        "is_read": "boolean",
        "created_at": "timestamp"
      }
    ],
    "unread_count": "number",
    "pagination": {...}
  }
}
```

### **PUT /api/notifications/:id/read**
Mark notification as read.

### **PUT /api/notifications/mark-all-read**
Mark all notifications as read.

---

## 📱 **Mobile-Specific Endpoints**

### **POST /api/mobile/sync**
Sync data for offline usage.

**Request Body:**
```json
{
  "last_sync": "timestamp (optional)",
  "device_info": {
    "platform": "string",
    "version": "string",
    "device_id": "string"
  }
}
```

### **POST /api/mobile/upload**
Upload files (photos, documents).

**Request:** Multipart form data
- `file`: File
- `type`: string (photo, document, signature)
- `ticket_id`: uuid (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "uuid",
      "filename": "string",
      "url": "string",
      "type": "string",
      "size": "number"
    }
  }
}
```

---

## 🔌 **WebSocket Events**

### **Connection**
```javascript
const socket = io('wss://api.isp-management.com', {
  auth: {
    token: 'Bearer <access_token>'
  }
});
```

### **Events**

#### **Ticket Events**
```javascript
// Ticket created
socket.on('ticket:created', (data) => {
  // data: { ticket: {...}, created_by: {...} }
});

// Ticket assigned
socket.on('ticket:assigned', (data) => {
  // data: { ticket: {...}, technician: {...} }
});

// Ticket status changed
socket.on('ticket:status_changed', (data) => {
  // data: { ticket: {...}, old_status: 'string', new_status: 'string' }
});
```

#### **Technician Events**
```javascript
// Location updated
socket.on('technician:location_updated', (data) => {
  // data: { technician_id: 'uuid', location: {lat, lng}, timestamp }
});

// Availability changed
socket.on('technician:availability_changed', (data) => {
  // data: { technician_id: 'uuid', is_available: boolean }
});
```

#### **Notification Events**
```javascript
// New notification
socket.on('notification:new', (data) => {
  // data: { notification: {...} }
});
```

---

## 📝 **Error Handling**

### **Standard Error Response**
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

### **HTTP Status Codes**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `429`: Rate Limited
- `500`: Internal Server Error

### **Common Error Codes**
- `INVALID_CREDENTIALS`: Login failed
- `TOKEN_EXPIRED`: Access token expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `DUPLICATE_ENTRY`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

**API Version**: 1.0  
**Last Updated**: October 2025  
**Documentation**: Auto-generated via Swagger  
**Postman Collection**: Available upon request