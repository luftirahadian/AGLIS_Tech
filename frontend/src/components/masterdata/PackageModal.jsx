import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import packageService from '../../services/packageService';

const PackageModal = ({ package: pkg, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = !!pkg;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: pkg || {
      name: '',
      type: 'broadband',
      speed_mbps: '',
      price: '',
      description: ''
    }
  });

  const mutation = useMutation(
    (data) => isEdit ? packageService.update(pkg.id, data) : packageService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('packages');
        toast.success(`Paket berhasil ${isEdit ? 'diupdate' : 'ditambahkan'}`);
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || `Gagal ${isEdit ? 'mengupdate' : 'menambahkan'} paket`);
      }
    }
  );

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      speed_mbps: parseInt(data.speed_mbps),
      price: parseFloat(data.price)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Paket' : 'Tambah Paket Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Paket *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Nama paket wajib diisi' })}
              className="input"
              placeholder="Contoh: Paket Home 10 Mbps"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Paket *
            </label>
            <select
              {...register('type', { required: 'Tipe paket wajib dipilih' })}
              className="input"
            >
              <option value="broadband">Broadband</option>
              <option value="dedicated">Dedicated</option>
              <option value="corporate">Corporate</option>
            </select>
            {errors.type && (
              <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Speed & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kecepatan (Mbps) *
              </label>
              <input
                type="number"
                {...register('speed_mbps', { 
                  required: 'Kecepatan wajib diisi',
                  min: { value: 1, message: 'Minimal 1 Mbps' }
                })}
                className="input"
                placeholder="10"
              />
              {errors.speed_mbps && (
                <p className="text-red-600 text-sm mt-1">{errors.speed_mbps.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga (Rp) *
              </label>
              <input
                type="number"
                {...register('price', { 
                  required: 'Harga wajib diisi',
                  min: { value: 0, message: 'Harga tidak boleh negatif' }
                })}
                className="input"
                placeholder="250000"
              />
              {errors.price && (
                <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="input"
              placeholder="Deskripsi paket (opsional)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline"
              disabled={mutation.isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageModal;

