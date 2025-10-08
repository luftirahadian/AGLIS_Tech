import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit2, Trash2, Wifi, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import packageService from '../../services/packageService';
import LoadingSpinner from '../../components/LoadingSpinner';
import PackageModal from '../../components/masterdata/PackageModal';

const PackagesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Fetch packages
  const { data: packagesResponse, isLoading, error } = useQuery(
    'packages',
    packageService.getAll,
    {
      refetchOnWindowFocus: false
    }
  );

  // Ensure packages is always an array
  const packages = Array.isArray(packagesResponse) ? packagesResponse : (packagesResponse?.data || []);

  // Delete mutation
  const deleteMutation = useMutation(packageService.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('packages');
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

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus paket ini?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter packages
  const filteredPackages = packages?.filter(pkg => {
    const matchesSearch = pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || pkg.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paket Langganan</h1>
          <p className="text-gray-600 mt-1">Kelola paket internet untuk pelanggan</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Tambah Paket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari paket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">Semua Tipe</option>
            <option value="broadband">Broadband</option>
            <option value="dedicated">Dedicated</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paket</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{packages?.length || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wifi className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Broadband</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {packages?.filter(p => p.type === 'broadband').length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Wifi className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dedicated</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {packages?.filter(p => p.type === 'dedicated').length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Wifi className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Corporate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {packages?.filter(p => p.type === 'corporate').length || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Wifi className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${
                    pkg.type === 'broadband' ? 'bg-green-100 text-green-700' :
                    pkg.type === 'dedicated' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {pkg.type ? (pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)) : 'Unknown'}
                  </span>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wifi className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              {/* Speed */}
              <div className="mb-4">
                <p className="text-3xl font-bold text-blue-600">
                  {pkg.speed_mbps} <span className="text-lg text-gray-600">Mbps</span>
                </p>
              </div>

              {/* Description */}
              {pkg.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>
              )}

              {/* Price */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  }).format(pkg.price)}
                  <span className="text-sm text-gray-500 font-normal">/bulan</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="flex-1 btn-outline text-sm py-2"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="btn-danger text-sm py-2"
                  disabled={deleteMutation.isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPackages.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada paket</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Tidak ada paket yang sesuai dengan filter'
              : 'Mulai dengan menambahkan paket langganan pertama'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <button onClick={handleCreate} className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Tambah Paket
            </button>
          )}
        </div>
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

