import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import TicketsPage from './pages/tickets/TicketsPage'
import TicketDetailPage from './pages/tickets/TicketDetailPage'
import CustomersPage from './pages/customers/CustomersPage'
import CustomerDetailPage from './pages/customers/CustomerDetailPage'
import TechniciansPage from './pages/technicians/TechniciansPage'
import TechnicianDetailPage from './pages/technicians/TechnicianDetailPage'
import InventoryPage from './pages/inventory/InventoryPage'
import InventoryStockPage from './pages/inventory/InventoryStockPage'
import PackagesPage from './pages/masterdata/PackagesPage'
import PriceListPage from './pages/masterdata/PriceListPage'
import EquipmentPage from './pages/masterdata/EquipmentPage'
import ODPPage from './pages/masterdata/ODPPage'
import ServiceTypesPage from './pages/masterdata/ServiceTypesPage'
import ServiceCategoriesPage from './pages/masterdata/ServiceCategoriesPage'
import UsersPage from './pages/users/UsersPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/public/RegisterPage'
import TrackingPage from './pages/public/TrackingPage'
import RegistrationsPage from './pages/registrations/RegistrationsPage'
import RegistrationAnalyticsPage from './pages/registrations/RegistrationAnalyticsPage'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <NotificationProvider>
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
        
        {/* Tickets */}
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        
        {/* Customers */}
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        
        {/* Registrations */}
        <Route path="registrations" element={<RegistrationsPage />} />
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
        
        {/* Users (Admin/Supervisor only) */}
        <Route path="users" element={<UsersPage />} />
        
        {/* Profile */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Default redirect */}
        <Route path="" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </NotificationProvider>
  )
}

export default App
