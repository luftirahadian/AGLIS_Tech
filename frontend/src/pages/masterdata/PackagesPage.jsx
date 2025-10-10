import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, Wifi, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import packageService from '../../services/packageService';
import LoadingSpinner from '../../components/LoadingSpinner';
import PackageModal from '../../components/masterdata/PackageModal';
import KPICard from '../../components/dashboard/KPICard';

const PackagesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [sortBy, setSortBy] = useState('type');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const limit = 5;

  // Fetch packages with pagination and sorting
  const { data: packagesResponse, isLoading } = useQuery(
    ['packages', filterType, searchTerm, sortBy, sortOrder, page],
    () => packageService.getAll({
      type: filterType !== 'all' ? filterType : undefined,
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

  const packages = packagesResponse?.data || [];
  const pagination = packagesResponse?.pagination || {};

  // Fetch all packages for statistics
  const { data: allPackagesResponse } = useQuery(
    'all-packages-stats',
    () => packageService.getAll({ page: 1, limit: 100 }),
    {
      refetchOnWindowFocus: false
    }
  );

  const allPackages = allPackagesResponse?.data || [];
  const totalPackages = allPackages.length;
  const broadbandPackages = allPackages.filter(p => p.type === 'broadband').length;
  const dedicatedPackages = allPackages.filter(p => p.type === 'dedicated').length;
  const corporatePackages = allPackages.filter(p => p.type === 'corporate').length;

  // Delete mutation
  const deleteMutation = useMutation(packageService.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('packages');
      queryClient.invalidateQueries('all-packages-stats');
      toast.success('Paket berhasil dihapus');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus paket');
    }
  });

  const handleCreate = () => {
    setSelectedPackage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pkg) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus paket "${name}"?`)) {
      deleteMutation.mutate(id);
    }
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
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setFilterType(value);
    setPage(1);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getTypeColor = (type) => {
    const colors = {
      broadband: 'bg-green-100 text-green-800',
      dedicated: 'bg-purple-100 text-purple-800',
      corporate: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paket Langganan</h1>
          <p className="text-gray-600 mt-1">Kelola paket internet untuk pelanggan</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Paket
        </button>
      </div>

      {/* Statistics Cards - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Wifi}
          title="Total Paket"
          value={totalPackages}
          color="blue"
        />
        <KPICard
          icon={Wifi}
          title="Broadband"
          value={broadbandPackages}
          color="green"
        />
        <KPICard
          icon={Wifi}
          title="Dedicated"
          value={dedicatedPackages}
          color="purple"
        />
        <KPICard
          icon={Wifi}
          title="Corporate"
          value={corporatePackages}
          color="orange"
        />
      </div>

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
                placeholder="Cari paket..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Paket
            </label>
            <select
              className="form-input"
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">Semua Tipe</option>
              <option value="broadband">Broadband</option>
              <option value="dedicated">Dedicated</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          {/* Placeholder filters for consistency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speed Range
            </label>
            <select
              className="form-input"
              value="all"
              onChange={(e) => {}}
            >
              <option value="all">Semua Kecepatan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <select
              className="form-input"
              value="all"
              onChange={(e) => {}}
            >
              <option value="all">Semua Harga</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packages Table */}
      {packages.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada paket</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Tidak ada paket yang sesuai dengan filter'
              : 'Mulai dengan menambahkan paket langganan pertama'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <button onClick={handleCreate} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Paket
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                All Packages
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({pagination.total || 0} total)
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
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Package Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Type</span>
                          {getSortIcon('type')}
                        </div>
                      </th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors" 
                        onClick={() => handleSort('speed_mbps')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Speed</span>
                          {getSortIcon('speed_mbps')}
                        </div>
                      </th>
                      <th className="table-header-cell">Description</th>
                      <th 
                        className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors text-right" 
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center justify-between">
                          <span>Monthly Price</span>
                          {getSortIcon('price')}
                        </div>
                      </th>
                      <th className="table-header-cell text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {packages.map((pkg) => (
                      <tr key={pkg.id}>
                        <td className="table-cell">
                          <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(pkg.type)}`}>
                            {pkg.type ? (pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)) : 'Unknown'}
                          </span>
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            {pkg.speed_mbps} Mbps
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-gray-900 truncate" title={pkg.description} style={{ maxWidth: '300px' }}>
                            {pkg.description || '-'}
                          </div>
                        </td>
                        <td className="table-cell whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(pkg.price)}
                          </div>
                          <div className="text-xs text-gray-500">/bulan</div>
                        </td>
                        <td className="table-cell text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(pkg)}
                              className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Package"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(pkg.id, pkg.name)}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Package"
                              disabled={deleteMutation.isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages || 1, page + 1))}
                    disabled={page === (pagination.pages || 1)}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(page * limit, pagination.total || 0)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total || 0}</span> results
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
                      {Array.from({ length: pagination.pages || 1 }, (_, i) => i + 1).map((pageNum) => (
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
                        onClick={() => setPage(Math.min(pagination.pages || 1, page + 1))}
                        disabled={page === (pagination.pages || 1)}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <PackageModal
          package={selectedPackage}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPackage(null);
          }}
        />
      )}
    </div>
  );
};

export default PackagesPage;
