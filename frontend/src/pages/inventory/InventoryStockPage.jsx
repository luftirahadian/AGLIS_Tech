import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Package, Search, AlertTriangle, DollarSign, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import inventoryStockService from '../../services/inventoryStockService';
import LoadingSpinner from '../../components/LoadingSpinner';
import KPICard from '../../components/dashboard/KPICard';
import toast from 'react-hot-toast';

const InventoryStockPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('equipment_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [limit, setLimit] = useState(10);

  // Fetch inventory stock
  const { data: inventoryResponse, isLoading } = useQuery(
    ['inventory-stock', categoryFilter, showLowStockOnly, page, limit, sortBy, sortOrder, searchTerm],
    () => inventoryStockService.getAll({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      low_stock: showLowStockOnly ? 'true' : undefined,
      search: searchTerm || undefined,
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true
    }
  );

  // Fetch low stock alerts
  const { data: alertsResponse } = useQuery(
    'low-stock-alerts',
    inventoryStockService.getLowStockAlerts,
    {
      refetchOnWindowFocus: false
    }
  );

  const inventory = Array.isArray(inventoryResponse?.data) ? inventoryResponse.data : [];
  const lowStockAlerts = Array.isArray(alertsResponse?.data) ? alertsResponse.data : [];
  const pagination = inventoryResponse?.pagination || {};

  // Statistics - from all data
  const totalItems = inventoryResponse?.total || 0;
  const totalValue = inventory.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
  const lowStockCount = lowStockAlerts.length;
  const categories = [...new Set(inventory.map(i => i.category))].length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getCategoryColor = (category) => {
    const colors = {
      devices: 'bg-blue-100 text-blue-800',
      cables: 'bg-green-100 text-green-800',
      accessories: 'bg-yellow-100 text-yellow-800',
      tools: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'category') {
      setCategoryFilter(value);
    } else if (filterType === 'lowStock') {
      setShowLowStockOnly(value);
    }
    setPage(1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Stock</h1>
          <p className="text-gray-600">Kelola stok equipment dan tools</p>
        </div>
      </div>

      {/* Statistics Cards using KPICard - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Items"
          value={totalItems}
          icon={Package}
          color="blue"
        />
        <KPICard
          title="Total Nilai"
          value={totalValue}
          icon={DollarSign}
          color="green"
          format="currency"
        />
        <KPICard
          title="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="Kategori"
          value={categories}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">
              Peringatan Stock Menipis ({lowStockAlerts.length} item)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded border border-yellow-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.equipment_name}</p>
                  <p className="text-xs text-gray-600">
                    Stock: {alert.current_stock} {alert.unit} (Min: {alert.minimum_stock})
                  </p>
                </div>
                <span className="text-xs text-red-600 font-semibold">
                  -{alert.shortage}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Cari equipment..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              className="form-input"
              value={categoryFilter}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              <option value="devices">Devices</option>
              <option value="cables">Cables</option>
              <option value="accessories">Accessories</option>
              <option value="tools">Tools</option>
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              className="form-input"
              value="all"
              onChange={(e) => {}}
            >
              <option value="all">Semua Supplier</option>
            </select>
          </div>

          {/* Low Stock Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Stock
            </label>
            <select
              className="form-input"
              value={showLowStockOnly ? 'low' : 'all'}
              onChange={(e) => handleFilterChange('lowStock', e.target.value === 'low')}
            >
              <option value="all">Semua Stock</option>
              <option value="low">Low Stock Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {inventory.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada inventory stock</h3>
          <p className="text-gray-500">Data inventory stock tidak ditemukan</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              All Inventory
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({pagination.totalRecords || 0} total)
              </span>
            </h2>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('equipment_name')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Equipment</span>
                        {getSortIcon('equipment_name')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Kategori</span>
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('current_stock')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Stock</span>
                        {getSortIcon('current_stock')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell text-right cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('unit_cost')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Unit Cost</span>
                        {getSortIcon('unit_cost')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell text-right cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('total_value')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Total Value</span>
                        {getSortIcon('total_value')}
                      </div>
                    </th>
                    <th 
                      className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                      onClick={() => handleSort('supplier_name')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Supplier</span>
                        {getSortIcon('supplier_name')}
                      </div>
                    </th>
                    <th className="table-header-cell text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900">
                          {item.equipment_name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {item.equipment_code}
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="table-cell whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.current_stock} {item.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {item.minimum_stock}
                        </div>
                      </td>
                      <td className="table-cell whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td className="table-cell whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.total_value)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900">{item.supplier_name}</div>
                        <div className="text-xs text-gray-500">{item.supplier_contact}</div>
                      </td>
                      <td className="table-cell whitespace-nowrap text-center">
                        {item.is_low_stock ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Stock OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages || 1, page + 1))}
                disabled={page === (pagination.totalPages || 1)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Show</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(parseInt(e.target.value))
                      setPage(1)
                    }}
                    className="form-input py-1 px-2 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <span className="text-sm text-gray-700">rows</span>
                </div>
                <div className="border-l border-gray-300 h-6"></div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, pagination.totalRecords || 0)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalRecords || 0}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages || 1, 10) }, (_, i) => {
                    const totalPages = pagination.totalPages || 1;
                    if (totalPages <= 10) return i + 1;
                    if (page <= 5) return i + 1;
                    if (page >= totalPages - 4) return totalPages - 9 + i;
                    return page - 5 + i;
                  }).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages || 1, page + 1))}
                    disabled={page === (pagination.totalPages || 1)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryStockPage;
