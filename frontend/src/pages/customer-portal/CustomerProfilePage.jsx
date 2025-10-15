import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { User, Mail, Phone, MapPin, Package, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';

const CustomerProfilePage = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: profileData, isLoading } = useQuery(
    'customer-profile',
    async () => {
      const token = localStorage.getItem('customerToken');
      const response = await api.get('/customer-portal/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setFormData(data.data);
      }
    }
  );

  const updateProfileMutation = useMutation(
    async (data) => {
      const token = localStorage.getItem('customerToken');
      return api.put('/customer-portal/profile', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    {
      onSuccess: () => {
        toast.success('Profil berhasil diperbarui!');
        setIsEditing(false);
        queryClient.invalidateQueries('customer-profile');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
      }
    }
  );

  const profile = profileData || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      province: formData.province
    });
  };

  if (isLoading) {
    return (
      <CustomerPortalLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </CustomerPortalLayout>
    );
  }

  return (
    <CustomerPortalLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <User className="h-7 w-7 mr-2 text-blue-600" />
              Profil Saya
            </h1>
            <p className="text-gray-600">Kelola informasi profil Anda</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Profil</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={profile.customer_id}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Hubungi CS untuk mengubah nama</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Alamat Lengkap
                  </label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kota/Kabupaten
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={formData.province || ''}
                    onChange={(e) => setFormData({...formData, province: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(profile);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{updateProfileMutation.isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer ID</p>
                  <p className="font-semibold text-gray-900">{profile.customer_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nama Lengkap</p>
                  <p className="font-semibold text-gray-900">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">WhatsApp</p>
                  <p className="font-semibold text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {profile.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {profile.email || '-'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Alamat</p>
                  <p className="font-semibold text-gray-900 flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                    <span>{profile.address}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kota/Kabupaten</p>
                  <p className="font-semibold text-gray-900">{profile.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Provinsi</p>
                  <p className="font-semibold text-gray-900">{profile.province || '-'}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Layanan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Paket</p>
                    <p className="font-semibold text-gray-900 flex items-center">
                      <Package className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.package_name || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bandwidth</p>
                    <p className="font-semibold text-gray-900">
                      {profile.bandwidth_down ? `${profile.bandwidth_down} Mbps` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Harga Bulanan</p>
                    <p className="font-semibold text-gray-900">
                      Rp {(profile.monthly_price || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status Layanan</p>
                    <p className={`font-semibold ${
                      profile.account_status === 'active' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {profile.account_status || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerProfilePage;

