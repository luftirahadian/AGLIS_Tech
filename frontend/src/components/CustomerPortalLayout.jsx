import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Ticket, FileText, User, LogOut, HelpCircle,
  MessageCircle, Home
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerPortalLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const customerData = JSON.parse(localStorage.getItem('customerData') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    toast.success('Logout berhasil');
    navigate('/customer/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/customer/dashboard' },
    { name: 'Tiket Saya', icon: Ticket, path: '/customer/tickets' },
    { name: 'Invoice', icon: FileText, path: '/customer/invoices' },
    { name: 'Profil', icon: User, path: '/customer/profile' },
    { name: 'FAQ', icon: HelpCircle, path: '/customer/faq' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AGLIS Customer Portal</h1>
                <p className="text-sm text-gray-600">Hi, {customerData.name}!</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="https://wa.me/6281316003245"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Hubungi CS</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2025 AGLIS Net. All rights reserved. | 
            <a href="https://wa.me/6281316003245" className="text-blue-600 hover:text-blue-700 ml-1">
              Customer Service
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerPortalLayout;

