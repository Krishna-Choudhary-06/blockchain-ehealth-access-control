import React from 'react'
import { 
  User, Mail, Phone, Calendar, Hash, Award, 
  Building, Briefcase, Key, ShieldCheck, Heart, Shield 
} from 'lucide-react'
import ValidationMessage from './ValidationMessage'

export default function DynamicRegistrationForm({ register, errors, role, step, setValue, watch }) {
  if (step === 2) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          Step 2: Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                {...register('name', { required: 'Full Name is required' })}
                placeholder="e.g. Dr. Sarah Miller"
                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
              />
            </div>
            <ValidationMessage error={errors.name} />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="sarah.miller@hospital.com"
                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
              />
            </div>
            <ValidationMessage error={errors.email} />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Phone Number
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^\+?[1-9]\d{1,14}$/,
                    message: 'Invalid phone format (e.g. +1234567890)'
                  }
                })}
                placeholder="e.g. +14155552671"
                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
              />
            </div>
            <ValidationMessage error={errors.phone} />
          </div>

          {/* Account Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Account Password
            </label>
            <div className="relative group">
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required', 
                  minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                })}
                placeholder="••••••••"
                className="w-full bg-slate-50/50 dark:bg-slate-955 border border-slate-202 dark:border-slate-900 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-650 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-955 focus:border-transparent transition-all text-sm"
              />
            </div>
            <ValidationMessage error={errors.password} />
          </div>

          {/* Profile Photo (Avatar) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Profile Photo / Avatar Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setValue('avatar', reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full bg-slate-50/50 dark:bg-slate-955 border border-slate-202 dark:border-slate-900 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-950 dark:file:text-purple-400 cursor-pointer"
            />
            {watch && watch('avatar') && (
              <div className="mt-2 flex items-center gap-2">
                <img src={watch('avatar')} alt="Preview" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
                <span className="text-[10px] text-slate-500">Photo selected</span>
              </div>
            )}
          </div>

          {/* Patient Details (DOB, Gender, Blood Group) */}
          {role === 'Patient' && (
            <>
              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Date of Birth
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    {...register('dob', { required: 'Date of Birth is required' })}
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.dob} />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Gender
                </label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <ValidationMessage error={errors.gender} />
              </div>

              {/* Blood Group */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Blood Group
                </label>
                <select
                  {...register('bloodGroup', { required: 'Blood group is required' })}
                  className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm cursor-pointer"
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
                <ValidationMessage error={errors.bloodGroup} />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return null
}
