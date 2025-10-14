import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { 
  Wifi, Check, AlertCircle, Smartphone, User, Mail, MapPin, 
  Home, Calendar, Package, Upload, ArrowRight, ArrowLeft, CheckCircle2,
  Phone, Shield
} from 'lucide-react'
import { useQuery } from 'react-query'
import toast from 'react-hot-toast'
import ReCAPTCHA from 'react-google-recaptcha'
import registrationService from '../../services/registrationService'
import packageService from '../../services/packageService'
import api from '../../services/api'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [whatsappVerified, setWhatsappVerified] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('')
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false)
  const recaptchaRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      service_type: 'broadband',
      preferred_time_slot: 'morning'
    }
  })

  const phone = watch('phone')
  const fullName = watch('full_name')
  const idCardPhoto = watch('id_card_photo')

  // Fetch broadband packages only
  const { data: packages, isLoading: packagesLoading } = useQuery(
    'packages-broadband',
    () => packageService.getAll(),
    {
      select: (data) => {
        // Backend returns { success: true, data: [...], pagination: {...} }
        const pkgs = Array.isArray(data?.data) ? data.data : []
        return pkgs.filter(pkg => pkg.type === 'broadband')
      }
    }
  )

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Fetch reCAPTCHA configuration on mount
  useEffect(() => {
    const fetchRecaptchaConfig = async () => {
      try {
        const response = await api.get('/auth/recaptcha-config')
        if (response.data) {
          setRecaptchaEnabled(response.data.enabled)
          setRecaptchaSiteKey(response.data.siteKey)
        }
      } catch (error) {
        console.error('Failed to fetch reCAPTCHA config:', error)
        setRecaptchaEnabled(false)
      }
    }
    fetchRecaptchaConfig()
  }, [])

  const onCaptchaChange = (token) => {
    setCaptchaToken(token)
  }

  // Handle request OTP
  const handleRequestOTP = async () => {
    const isValid = await trigger(['phone', 'full_name'])
    if (!isValid) {
      toast.error('Mohon lengkapi nama dan nomor WhatsApp')
      return
    }

    try {
      const result = await registrationService.requestOTP(phone, fullName)
      
      if (result.success) {
        setOtpSent(true)
        setCountdown(60) // 60 seconds countdown
        toast.success(result.message || 'Kode OTP telah dikirim ke WhatsApp Anda')
        
        // Auto-fill OTP in dev mode
        if (result.data?.otp) {
          console.log('Dev mode OTP:', result.data.otp)
          toast.info(`Dev mode - OTP: ${result.data.otp}`, { duration: 10000 })
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengirim OTP')
    }
  }

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Kode OTP harus 6 digit')
      return
    }

    try {
      const result = await registrationService.verifyOTP(phone, otpCode)
      
      if (result.success) {
        setWhatsappVerified(true)
        setValue('whatsapp_verified', 'true')
        toast.success('WhatsApp berhasil diverifikasi!')
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Kode OTP salah'
      const attemptsLeft = error.response?.data?.attemptsLeft
      
      if (attemptsLeft !== undefined) {
        toast.error(`${message}. Sisa percobaan: ${attemptsLeft}`)
      } else {
        toast.error(message)
      }
    }
  }

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Handle form submission
  const onSubmit = async (data) => {
    if (!whatsappVerified) {
      toast.error('Mohon verifikasi nomor WhatsApp terlebih dahulu')
      return
    }

    // Check reCAPTCHA if enabled
    if (recaptchaEnabled && !captchaToken) {
      toast.error('Mohon selesaikan verifikasi reCAPTCHA')
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)

    try {
      // Convert KTP photo to base64 if exists
      let ktpPhotoBase64 = null
      if (data.id_card_photo?.[0]) {
        ktpPhotoBase64 = await fileToBase64(data.id_card_photo[0])
      }

      // Clean data: convert empty strings to null for optional fields
      const registrationData = {
        ...data,
        id_card_photo: ktpPhotoBase64,
        whatsapp_verified: 'true',
        recaptchaToken: captchaToken, // Add CAPTCHA token
        // Convert empty strings to null
        id_card_number: data.id_card_number || null,
        rt: data.rt || null,
        rw: data.rw || null,
        kelurahan: data.kelurahan || null,
        kecamatan: data.kecamatan || null,
        postal_code: data.postal_code || null,
        address_notes: data.address_notes || null,
        preferred_installation_date: data.preferred_installation_date || null,
        notes: data.notes || null,
        referral_code: data.referral_code || null,
        // Ensure package_id is number
        package_id: parseInt(data.package_id)
      }

      console.log('🚀 SUBMITTING REGISTRATION - FULL DATA:')
      console.log(JSON.stringify(registrationData, null, 2))
      console.log('📊 Data Keys:', Object.keys(registrationData))
      console.log('📊 package_id type:', typeof registrationData.package_id, '=', registrationData.package_id)

      const result = await registrationService.submitRegistration(registrationData)

      if (result.success) {
        toast.success('Pendaftaran berhasil!')
        navigate(`/track/${result.data.registration_number}`, {
          state: { fromRegistration: true }
        })
      }
    } catch (error) {
      console.error('❌ REGISTRATION SUBMIT ERROR:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset()
        setCaptchaToken(null)
      }
      
      toast.error(error.response?.data?.message || 'Gagal submit pendaftaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle next step
  const handleNextStep = async (e) => {
    // CRITICAL: Prevent form submission!
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    let fieldsToValidate = []

    if (currentStep === 1) {
      fieldsToValidate = ['full_name', 'email', 'phone']
      
      // Validasi form fields terlebih dahulu
      const isValid = await trigger(fieldsToValidate)
      if (!isValid) {
        return
      }
      
      // WAJIB: WhatsApp harus sudah diverifikasi
      if (!whatsappVerified) {
        toast.error('Mohon verifikasi nomor WhatsApp terlebih dahulu!', {
          icon: '⚠️',
          duration: 4000
        })
        return
      }
    } else if (currentStep === 2) {
      fieldsToValidate = ['address', 'city']
      const isValid = await trigger(fieldsToValidate)
      if (!isValid) {
        return
      }
    } else if (currentStep === 3) {
      fieldsToValidate = ['package_id']
      const isValid = await trigger(fieldsToValidate)
      if (!isValid) {
        return
      }
    }

    setCurrentStep(currentStep + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const steps = [
    { number: 1, title: 'Data Pribadi', icon: User },
    { number: 2, title: 'Alamat', icon: MapPin },
    { number: 3, title: 'Pilih Paket', icon: Package },
    { number: 4, title: 'Konfirmasi', icon: CheckCircle2 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/aglis-logo.svg" 
                alt="AGLIS Net" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">AGLIS</h1>
                <p className="text-sm text-gray-500">Daftar Sekarang</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Sudah Terdaftar? Login
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}>
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      h-1 flex-1 mx-2 rounded transition-all
                      ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal Information & WhatsApp Verification */}
            {currentStep === 1 && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Data Pribadi & Verifikasi WhatsApp</h2>
                  <p className="text-gray-600 mt-1">
                    Lengkapi data pribadi dan verifikasi nomor WhatsApp Anda
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.full_name ? 'border-red-500' : ''}`}
                      placeholder="Masukkan nama lengkap sesuai KTP"
                      {...register('full_name', { 
                        required: 'Nama lengkap wajib diisi',
                        minLength: { value: 3, message: 'Nama minimal 3 karakter' }
                      })}
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="contoh@email.com"
                      {...register('email', { 
                        required: 'Email wajib diisi',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Format email tidak valid'
                        }
                      })}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* WhatsApp Number with Verification */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor WhatsApp * 
                      {whatsappVerified && (
                        <span className="ml-2 text-green-600 text-xs font-semibold">
                          <Shield className="inline h-4 w-4 mr-1" />
                          Terverifikasi
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        className={`form-input flex-1 ${errors.phone ? 'border-red-500' : whatsappVerified ? 'border-green-500 bg-green-50' : ''}`}
                        placeholder="08123456789"
                        disabled={whatsappVerified}
                        {...register('phone', { 
                          required: 'Nomor WhatsApp wajib diisi',
                          pattern: {
                            value: /^(\+62|62|0)[0-9]{9,12}$/,
                            message: 'Format nomor tidak valid (contoh: 081234567890)'
                          }
                        })}
                      />
                      {!whatsappVerified && (
                        <button
                          type="button"
                          onClick={handleRequestOTP}
                          disabled={countdown > 0 || !phone}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          {countdown > 0 ? `${countdown}s` : 'Kirim OTP'}
                        </button>
                      )}
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      <Phone className="inline h-3 w-3 mr-1" />
                      Pastikan nomor WhatsApp aktif untuk verifikasi
                    </p>
                  </div>

                  {/* OTP Verification */}
                  {otpSent && !whatsappVerified && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 mb-2">
                            Masukkan kode OTP yang dikirim ke WhatsApp Anda
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="form-input flex-1 text-center text-2xl font-bold tracking-widest"
                              placeholder="000000"
                              maxLength={6}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOTP}
                              disabled={otpCode.length !== 6}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                            >
                              Verifikasi
                            </button>
                          </div>
                          {countdown === 0 && (
                            <button
                              type="button"
                              onClick={handleRequestOTP}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                              Kirim ulang OTP
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ID Card Number (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor KTP (Opsional)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="3201012345678901"
                      {...register('id_card_number', {
                        pattern: {
                          value: /^[0-9]{16}$/,
                          message: 'Nomor KTP harus 16 digit'
                        }
                      })}
                    />
                    {errors.id_card_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.id_card_number.message}</p>
                    )}
                  </div>

                  {/* KTP Photo Upload (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foto KTP (Opsional)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload foto KTP</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              {...register('id_card_photo')}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        {idCardPhoto?.[0] && (
                          <p className="text-sm text-green-600 font-medium">
                            ✓ {idCardPhoto[0].name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {currentStep === 2 && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Alamat Lengkap</h2>
                  <p className="text-gray-600 mt-1">
                    Pastikan alamat yang Anda masukkan adalah lokasi instalasi
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Full Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat Lengkap *
                    </label>
                    <textarea
                      rows={3}
                      className={`form-input ${errors.address ? 'border-red-500' : ''}`}
                      placeholder="Jl. Contoh No. 123"
                      {...register('address', { 
                        required: 'Alamat wajib diisi',
                        minLength: { value: 10, message: 'Alamat terlalu pendek' }
                      })}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>

                  {/* RT/RW */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RT
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="001"
                        {...register('rt')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RW
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="005"
                        {...register('rw')}
                      />
                    </div>
                  </div>

                  {/* Kelurahan/Kecamatan */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelurahan
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nama Kelurahan"
                        {...register('kelurahan')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kecamatan
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nama Kecamatan"
                        {...register('kecamatan')}
                      />
                    </div>
                  </div>

                  {/* City & Postal Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kota *
                      </label>
                      <input
                        type="text"
                        className={`form-input ${errors.city ? 'border-red-500' : ''}`}
                        placeholder="Jakarta"
                        {...register('city', { required: 'Kota wajib diisi' })}
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kode Pos
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="12345"
                        {...register('postal_code', {
                          pattern: {
                            value: /^[0-9]{5}$/,
                            message: 'Kode pos harus 5 digit'
                          }
                        })}
                      />
                      {errors.postal_code && (
                        <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Address Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patokan/Catatan Alamat
                    </label>
                    <textarea
                      rows={2}
                      className="form-input"
                      placeholder="Dekat minimarket, rumah cat biru, dll"
                      {...register('address_notes')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Package Selection */}
            {currentStep === 3 && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Pilih Paket Internet</h2>
                  <p className="text-gray-600 mt-1">
                    Pilih paket yang sesuai dengan kebutuhan Anda
                  </p>
                </div>

                <div className="space-y-4">
                  {packagesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading packages...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {packages?.map((pkg) => (
                        <label
                          key={pkg.id}
                          className={`
                            relative flex cursor-pointer rounded-lg border-2 p-6 transition-all
                            ${watch('package_id') === pkg.id.toString()
                              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300 bg-white'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            value={pkg.id}
                            className="sr-only"
                            {...register('package_id', { required: 'Pilih salah satu paket' })}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {pkg.name || pkg.package_name}
                              </h3>
                              {watch('package_id') === pkg.id.toString() && (
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                              )}
                            </div>
                            <div className="flex items-baseline mb-3">
                              <span className="text-3xl font-bold text-blue-600">
                                {pkg.speed_mbps || pkg.speed}
                              </span>
                              <span className="text-gray-600 ml-2">Mbps</span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="text-2xl font-bold text-gray-900">
                                Rp {(pkg.price || pkg.monthly_price)?.toLocaleString('id-ID')}
                              </span>
                              <span className="text-gray-600 ml-2">/bulan</span>
                            </div>
                            {pkg.description && (
                              <p className="text-sm text-gray-600 mt-3">{pkg.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {errors.package_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.package_id.message}</p>
                  )}

                  {/* Installation Date Preference */}
                  <div className="mt-6 pt-6 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Instalasi yang Diinginkan (Opsional)
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                      {...register('preferred_installation_date')}
                    />
                  </div>

                  {/* Time Slot Preference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waktu Instalasi yang Diinginkan
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'morning', label: 'Pagi (08:00-12:00)' },
                        { value: 'afternoon', label: 'Siang (12:00-16:00)' },
                        { value: 'evening', label: 'Sore (16:00-18:00)' }
                      ].map((slot) => (
                        <label
                          key={slot.value}
                          className={`
                            relative flex cursor-pointer rounded-lg border-2 p-4 text-center transition-all
                            ${watch('preferred_time_slot') === slot.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            value={slot.value}
                            className="sr-only"
                            {...register('preferred_time_slot')}
                          />
                          <span className="text-sm font-medium text-gray-900 w-full">
                            {slot.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      className="form-input"
                      placeholder="Permintaan khusus, pertanyaan, dll"
                      {...register('notes')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Konfirmasi Data</h2>
                  <p className="text-gray-600 mt-1">
                    Periksa kembali data Anda sebelum submit
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Personal Info Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Nama:</dt>
                        <dd className="font-medium text-gray-900">{watch('full_name')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Email:</dt>
                        <dd className="font-medium text-gray-900">{watch('email')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">WhatsApp:</dt>
                        <dd className="font-medium text-green-600 flex items-center">
                          {watch('phone')}
                          <Shield className="inline h-4 w-4 ml-2" />
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Address Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alamat</h3>
                    <p className="text-gray-900">{watch('address')}</p>
                    {(watch('rt') || watch('rw')) && (
                      <p className="text-gray-600 text-sm mt-1">
                        RT {watch('rt') || '-'} / RW {watch('rw') || '-'}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm mt-1">
                      {watch('kelurahan')}, {watch('kecamatan')}, {watch('city')} {watch('postal_code')}
                    </p>
                  </div>

                  {/* Package Summary */}
                  <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Paket yang Dipilih</h3>
                    {(() => {
                      const selectedPkg = packages?.find(p => p.id === parseInt(watch('package_id')))
                      return selectedPkg ? (
                        <div>
                          <p className="text-xl font-bold text-gray-900">{selectedPkg.name || selectedPkg.package_name}</p>
                          <p className="text-2xl font-bold text-blue-600 mt-2">
                            {selectedPkg.speed_mbps || selectedPkg.speed} Mbps
                          </p>
                          <p className="text-xl font-semibold text-gray-900 mt-2">
                            Rp {(selectedPkg.price || selectedPkg.monthly_price)?.toLocaleString('id-ID')}/bulan
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">Belum memilih paket</p>
                      )
                    })()}
                  </div>

                  {/* Terms & Conditions */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-900">Penting!</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                          • Tim kami akan menghubungi Anda untuk verifikasi data<br />
                          • Survey lokasi akan dilakukan sebelum instalasi<br />
                          • Instalasi akan dijadwalkan setelah survey selesai<br />
                          • Pastikan nomor WhatsApp aktif untuk komunikasi
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* reCAPTCHA */}
                  {recaptchaEnabled && recaptchaSiteKey && (
                    <div className="flex justify-center">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={recaptchaSiteKey}
                        onChange={onCaptchaChange}
                        onExpired={() => setCaptchaToken(null)}
                        onErrored={() => {
                          setCaptchaToken(null)
                          toast.error('reCAPTCHA error. Please refresh the page.')
                        }}
                        theme="light"
                      />
                    </div>
                  )}

                  {recaptchaEnabled && !captchaToken && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm text-blue-800">
                            Mohon selesaikan verifikasi reCAPTCHA di atas sebelum submit
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="bg-gray-50 px-8 py-6 border-t flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Kembali
                </button>
              )}

              <div className="ml-auto">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Selanjutnya
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || (recaptchaEnabled && !captchaToken)}
                    className="inline-flex items-center px-8 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Daftar Sekarang
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Butuh bantuan? Hubungi kami di{' '}
            <a href="https://wa.me/6281316003245" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              <Phone className="h-4 w-4" />
              WhatsApp: 0813-1600-3245
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage

