import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { Wrench, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'
import ReCAPTCHA from 'react-google-recaptcha'
import api from '../../services/api'

const LoginPage = () => {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('')
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false)
  const recaptchaRef = useRef(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

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
        // If fetch fails, disable reCAPTCHA
        setRecaptchaEnabled(false)
      }
    }
    fetchRecaptchaConfig()
  }, [])

  const onCaptchaChange = (token) => {
    setCaptchaToken(token)
  }

  const onSubmit = async (data) => {
    // Check reCAPTCHA if enabled
    if (recaptchaEnabled && !captchaToken) {
      toast.error('Please complete the reCAPTCHA verification')
      return
    }

    setLoading(true)
    try {
      // Add captcha token to login data
      const loginData = {
        ...data,
        recaptchaToken: captchaToken
      }
      
      const result = await login(loginData)
      if (result.success) {
        toast.success('Login successful!')
      } else {
        // Reset reCAPTCHA on failure
        if (recaptchaRef.current) {
          recaptchaRef.current.reset()
          setCaptchaToken(null)
        }
        
        // Show error message with additional info
        if (result.error.includes('locked')) {
          toast.error(result.error, { duration: 5000 })
        } else if (result.error.includes('Too many')) {
          toast.error(result.error, { duration: 5000 })
        } else if (result.error.includes('reCAPTCHA') || result.error.includes('captcha')) {
          toast.error('Security verification failed. Please try again.')
        } else {
          toast.error(result.error)
        }
      }
    } catch (error) {
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset()
        setCaptchaToken(null)
      }
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto flex items-center justify-center">
            <img 
              src="/aglis-logo.svg" 
              alt="AGLIS Net" 
              className="h-16 w-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            AGLIS Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="form-label">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={`form-input ${errors.username ? 'border-red-500' : ''}`}
                placeholder="Enter your username or email"
                {...register('username', {
                  required: 'Username or email is required'
                })}
              />
              {errors.username && (
                <p className="form-error">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter your password"
                  {...register('password', {
                    required: 'Password is required'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
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

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || (recaptchaEnabled && !captchaToken)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Sign In'
              )}
            </button>
            {recaptchaEnabled && !captchaToken && (
              <p className="mt-2 text-sm text-center text-gray-500">
                Please complete the reCAPTCHA verification above
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
