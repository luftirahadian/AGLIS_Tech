import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { PermissionProvider } from './contexts/PermissionContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

// Eager load critical pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'

// Lazy load all other pages for better performance
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'))
const PerformanceDashboard = lazy(() => import('./pages/PerformanceDashboard'))
const TicketsPage = lazy(() => import('./pages/tickets/TicketsPage'))
const TicketDetailPage = lazy(() => import('./pages/tickets/TicketDetailPage'))
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage'))
const CustomerDetailPage = lazy(() => import('./pages/customers/CustomerDetailPage'))
const TechniciansPage = lazy(() => import('./pages/technicians/TechniciansPage'))
const TechnicianDetailPage = lazy(() => import('./pages/technicians/TechnicianDetailPage'))
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage'))
const InventoryStockPage = lazy(() => import('./pages/inventory/InventoryStockPage'))
const PackagesPage = lazy(() => import('./pages/masterdata/PackagesPage'))
const PriceListPage = lazy(() => import('./pages/masterdata/PriceListPage'))
const EquipmentPage = lazy(() => import('./pages/masterdata/EquipmentPage'))
const ODPPage = lazy(() => import('./pages/masterdata/ODPPage'))
const ServiceTypesPage = lazy(() => import('./pages/masterdata/ServiceTypesPage'))
const ServiceCategoriesPage = lazy(() => import('./pages/masterdata/ServiceCategoriesPage'))
const UsersPage = lazy(() => import('./pages/users/UsersPage'))
const PermissionsPage = lazy(() => import('./pages/PermissionsPage'))
const SkillLevelsPage = lazy(() => import('./pages/master-data/SkillLevelsPage'))
const SpecializationsPage = lazy(() => import('./pages/master-data/SpecializationsPage'))
const WhatsAppGroupsPage = lazy(() => import('./pages/master-data/WhatsAppGroupsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'))
const TrackingPage = lazy(() => import('./pages/public/TrackingPage'))
const RegistrationsPage = lazy(() => import('./pages/registrations/RegistrationsPage'))
const RegistrationDetailPage = lazy(() => import('./pages/registrations/RegistrationDetailPage'))
const RegistrationAnalyticsPage = lazy(() => import('./pages/registrations/RegistrationAnalyticsPage'))
const NotificationTemplatesPage = lazy(() => import('./pages/notifications/NotificationTemplatesPage'))
const NotificationAnalyticsPage = lazy(() => import('./pages/notifications/NotificationAnalyticsPage'))
const NotificationSettingsPage = lazy(() => import('./pages/notifications/NotificationSettingsPage'))
const InvoicesPage = lazy(() => import('./pages/billing/InvoicesPage'))
const InvoiceDetailPage = lazy(() => import('./pages/billing/InvoiceDetailPage'))
const InvoiceCreatePage = lazy(() => import('./pages/billing/InvoiceCreatePage'))
const PaymentsPage = lazy(() => import('./pages/billing/PaymentsPage'))

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <PermissionProvider>
      <NotificationProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
            />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/track" element={<TrackingPage />} />
            <Route path="/track/:registrationNumber" element={<TrackingPage />} />

      {/* Protected Routes */}
      <Route 
        path="/*" 
        element={user ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="performance" element={<PerformanceDashboard />} />
        
        {/* Tickets */}
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        
        {/* Customers */}
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        
        {/* Registrations */}
        <Route path="registrations" element={<RegistrationsPage />} />
        <Route path="registrations/:id" element={<RegistrationDetailPage />} />
        <Route path="registration-analytics" element={<RegistrationAnalyticsPage />} />
        
        {/* Technicians */}
        <Route path="technicians" element={<TechniciansPage />} />
        <Route path="technicians/:id" element={<TechnicianDetailPage />} />
        
        {/* Inventory */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory-stock" element={<InventoryStockPage />} />
        
        {/* Master Data */}
        <Route path="master-data/service-types" element={<ServiceTypesPage />} />
        <Route path="master-data/service-categories" element={<ServiceCategoriesPage />} />
        <Route path="master-data/packages" element={<PackagesPage />} />
        <Route path="master-data/price-list" element={<PriceListPage />} />
        <Route path="master-data/equipment" element={<EquipmentPage />} />
        <Route path="master-data/odp" element={<ODPPage />} />
        
        {/* Notifications */}
        <Route path="notifications/templates" element={<NotificationTemplatesPage />} />
        <Route path="notifications/analytics" element={<NotificationAnalyticsPage />} />
        <Route path="notifications/settings" element={<NotificationSettingsPage />} />
        
        {/* Users (Admin/Supervisor only) */}
        <Route path="users" element={<UsersPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        
        {/* Master Data */}
        <Route path="master-data/skill-levels" element={<SkillLevelsPage />} />
        <Route path="master-data/specializations" element={<SpecializationsPage />} />
        <Route path="master-data/whatsapp-groups" element={<WhatsAppGroupsPage />} />

        {/* Billing */}
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/new" element={<InvoiceCreatePage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />

        {/* Profile */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Default redirect */}
        <Route path="" element={<Navigate to="/dashboard" replace />} />
      </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </NotificationProvider>
    </PermissionProvider>
  )
}

export default App
