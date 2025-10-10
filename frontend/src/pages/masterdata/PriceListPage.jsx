import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { DollarSign, Search, Tag, Gift, CreditCard, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import pricelistService from '../../services/pricelistService';
import LoadingSpinner from '../../components/LoadingSpinner';
import KPICard from '../../components/dashboard/KPICard';

const PriceListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const [isFreeFilter, setIsFreeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('base_price');
  const [sortOrder, setSortOrder] = useState('desc');
  const [serviceTypePages, setServiceTypePages] = useState({});
  const [limit, setLimit] = useState(10);

  const serviceTypes = [
    { code: 'installation', name: 'Installation' },
    { code: 'repair', name: 'Repair' },
    { code: 'maintenance', name: 'Maintenance' },
    { code: 'upgrade', name: 'Upgrade' },
    { code: 'downgrade', name: 'Downgrade' },
    { code: 'wifi_setup', name: 'WiFi Setup' },
    { code: 'dismantle', name: 'Dismantle' }
  ];

  // Fetch ALL price list data (no pagination at API level, we paginate per service type in frontend)
  const { data: pricelistResponse, isLoading } = useQuery(
    ['pricelist-all', serviceTypeFilter, packageFilter, isFreeFilter, searchTerm, sortBy, sortOrder],
    () => pricelistService.getAll({
      is_active: 'true',
      service_type: serviceTypeFilter !== 'all' ? serviceTypeFilter : undefined,
      package_type: packageFilter !== 'all' ? packageFilter : undefined,
      is_free: isFreeFilter !== 'all' ? isFreeFilter : undefined,
      search: searchTerm || undefined,
      page: 1,
      limit: 1000, // Get all data
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    {
      refetchOnWindowFocus: false
    }
  );

  const allPricelist = pricelistResponse?.data || [];
  const summary = pricelistResponse?.summary || [];

  // Statistics
  const totalItems = allPricelist.length;
  const freeItems = allPricelist.filter(p => p.is_free).length;
  const paidItems = allPricelist.filter(p => !p.is_free).length;
  const serviceTypesCount = [...new Set(allPricelist.map(p => p.service_type_code))].length;

  // Group by service type for display
  const groupedData = allPricelist.reduce((acc, item) => {
    if (!acc[item.service_type_code]) {
      acc[item.service_type_code] = {
        type_name: item.type_name,
        items: []
      };
    }
    acc[item.service_type_code].items.push(item);
    return acc;
  }, {});

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'serviceType') {
      setServiceTypeFilter(value);
    } else if (filterType === 'package') {
      setPackageFilter(value);
    } else if (filterType === 'isFree') {
      setIsFreeFilter(value);
    }
  };

  const getServiceTypePage = (typeCode) => {
    return serviceTypePages[typeCode] || 1;
  };

  const setServiceTypePage = (typeCode, page) => {
    setServiceTypePages(prev => ({
      ...prev,
      [typeCode]: page
    }));
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Price List</h1>
          <p className="text-gray-600">Daftar harga service dan biaya tambahan</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Items"
          value={totalItems}
          icon={Tag}
          color="blue"
        />
        <KPICard
          title="Service Types"
          value={serviceTypesCount}
          icon={DollarSign}
          color="purple"
        />
        <KPICard
          title="Gratis"
          value={freeItems}
          icon={Gift}
          color="green"
        />
        <KPICard
          title="Berbayar"
          value={paidItems}
          icon={CreditCard}
          color="yellow"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Cari harga service..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type
            </label>
            <select
              className="form-input"
              value={serviceTypeFilter}
              onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            >
              <option value="all">Semua Service Type</option>
              {serviceTypes.map(type => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package
            </label>
            <select
              className="form-input"
              value={packageFilter}
              onChange={(e) => handleFilterChange('package', e.target.value)}
            >
              <option value="all">Semua Paket</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga
            </label>
            <select
              className="form-input"
              value={isFreeFilter}
              onChange={(e) => handleFilterChange('isFree', e.target.value)}
            >
              <option value="all">Semua Harga</option>
              <option value="true">Gratis</option>
              <option value="false">Berbayar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rows Per Table
            </label>
            <select
              className="form-input"
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value))
                setServiceTypePages({}) // Reset all pages
              }}
            >
              <option value="5">5 rows</option>
              <option value="10">10 rows</option>
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
            </select>
          </div>
        </div>
      </div>

      {/* Price List Table - Grouped by Service Type */}
      {Object.keys(groupedData).length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada price list</h3>
          <p className="text-gray-500">Data price list tidak ditemukan</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedData).map(([typeCode, data]) => {
            const currentPage = getServiceTypePage(typeCode);
            const totalInType = data.items.length;
            const totalPages = Math.ceil(totalInType / limit);
            const startIdx = (currentPage - 1) * limit;
            const endIdx = startIdx + limit;
            const displayedItems = data.items.slice(startIdx, endIdx);

            return (
              <div key={typeCode} className="card">
                {/* Service Type Header */}
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {data.type_name}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({totalInType} items)
                    </span>
                  </h3>
                </div>

                {/* Price Items Table */}
                <div className="card-body p-0">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th 
                            className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => handleSort('price_name')}
                          >
                            <div className="flex items-center justify-between">
                              <span>Nama Service</span>
                              {getSortIcon('price_name')}
                            </div>
                          </th>
                          <th 
                            className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => handleSort('category_name')}
                          >
                            <div className="flex items-center justify-between">
                              <span>Kategori</span>
                              {getSortIcon('category_name')}
                            </div>
                          </th>
                          <th className="table-header-cell">Deskripsi</th>
                          <th className="table-header-cell">Paket</th>
                          <th 
                            className="table-header-cell text-right cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => handleSort('base_price')}
                          >
                            <div className="flex items-center justify-between">
                              <span>Harga</span>
                              {getSortIcon('base_price')}
                            </div>
                          </th>
                          <th className="table-header-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="table-body">
                        {displayedItems.map((item) => (
                          <tr key={item.id}>
                            <td className="table-cell">
                              <div className="text-sm font-medium text-gray-900">
                                {item.price_name}
                              </div>
                            </td>
                            <td className="table-cell whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {item.category_name || '-'}
                              </div>
                            </td>
                            <td className="table-cell">
                              <div className="text-sm text-gray-900 truncate" style={{ maxWidth: '200px' }} title={item.description}>
                                {item.description || '-'}
                              </div>
                            </td>
                            <td className="table-cell whitespace-nowrap">
                              {item.applies_to_package && item.applies_to_package !== 'all' ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 uppercase">
                                  {item.applies_to_package}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500">All</span>
                              )}
                            </td>
                            <td className="table-cell whitespace-nowrap text-right">
                              {item.is_free ? (
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  🆓 GRATIS
                                </span>
                              ) : (
                                <div className="text-sm font-bold text-gray-900">
                                  {formatCurrency(item.base_price)}
                                </div>
                              )}
                            </td>
                            <td className="table-cell">
                              <div className="text-xs text-gray-600 italic truncate" style={{ maxWidth: '150px' }} title={item.notes}>
                                {item.notes || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination per Service Type */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setServiceTypePage(typeCode, Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setServiceTypePage(typeCode, Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startIdx + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(endIdx, totalInType)}</span> of{' '}
                            <span className="font-medium">{totalInType}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setServiceTypePage(typeCode, Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => setServiceTypePage(typeCode, pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                            <button
                              onClick={() => setServiceTypePage(typeCode, Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Informasi Price List</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Price list ini dapat dilihat oleh public untuk transparansi harga</li>
              <li>• Harga dapat berbeda tergantung paket yang dilanggan customer</li>
              <li>• Service yang ditandai GRATIS tidak dikenakan biaya tambahan</li>
              <li>• Biaya kabel tambahan dan spare part dikenakan terpisah jika diperlukan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceListPage;
