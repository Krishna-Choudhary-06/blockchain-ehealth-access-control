import React from 'react'
import { 
  User, Mail, Phone, Calendar, Hash, Award, 
  Building, Briefcase, Key, ShieldCheck, Heart, Shield, Lock
} from 'lucide-react'
import ValidationMessage from './ValidationMessage'

export default function DynamicRegistrationForm({ register, errors, role, step }) {
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
                placeholder="e.g. Dr Ram"
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

          {/* Phone - Indian format */}
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
                    value: /^[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit Indian phone number starting with 6-9'
                  }
                })}
                placeholder="e.g. 9876543210"
                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
              />
            </div>
            <ValidationMessage error={errors.phone} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Create Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                {...register('accountPassword', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
                placeholder="Create an account password"
                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
              />
            </div>
            <ValidationMessage error={errors.accountPassword} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Confirm Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                {...register('confirmPassword', { required: 'Confirm your password' })}
                placeholder="Re-enter password"
                className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
              />
            </div>
            <ValidationMessage error={errors.confirmPassword} />
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

  if (step === 3) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          Step 3: Professional Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doctor Specific Fields */}
          {role === 'Doctor' && (
            <>
              {/* Reg No */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Medical Registration Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('regNo', { 
                      required: 'Medical registration number is required',
                      pattern: {
                        value: /^MC-\d{5,8}$/,
                        message: 'Format must be MC-XXXXX (e.g., MC-98472)'
                      }
                    })}
                    placeholder="e.g. MC-98472"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.regNo} />
              </div>

              {/* Specialization */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Specialization
                </label>
                <select
                  {...register('specialization', { required: 'Specialization is required' })}
                  className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm cursor-pointer"
                >
                  <option value="">Select Specialization</option>
                  {['Cardiology', 'Pediatrics', 'Neurology', 'Orthopedics', 'General Medicine', 'Oncology'].map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <ValidationMessage error={errors.specialization} />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Department
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('department', { required: 'Department is required' })}
                    placeholder="e.g. Cardiology Department"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.department} />
              </div>

              {/* Hospital / Organization */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Hospital / Organization
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('organization', { required: 'Organization is required' })}
                    placeholder="e.g. Metro General Hospital"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.organization} />
              </div>

              {/* Experience */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Years of Experience
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Award className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    {...register('experience', { 
                      required: 'Experience is required', 
                      min: { value: 0, message: 'Must be positive' } 
                    })}
                    placeholder="e.g. 8"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.experience} />
              </div>

              {/* License Expiry */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  License Expiry Date
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    {...register('licenseExpiry', { required: 'License Expiry date is required' })}
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.licenseExpiry} />
              </div>
            </>
          )}

          {/* Nurse Specific Fields */}
          {role === 'Nurse' && (
            <>
              {/* Reg No */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Nurse Registration Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('regNo', { 
                      required: 'Nurse registration number is required',
                      pattern: {
                        value: /^NC-\d{5,8}$/,
                        message: 'Format must be NC-XXXXX (e.g., NC-82745)'
                      }
                    })}
                    placeholder="e.g. NC-82745"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.regNo} />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Department
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('department', { required: 'Department is required' })}
                    placeholder="e.g. General Ward / ICU"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.department} />
              </div>

              {/* Shift Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Shift Type
                </label>
                <select
                  {...register('shiftType', { required: 'Shift type is required' })}
                  className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm cursor-pointer"
                >
                  <option value="">Select Shift Type</option>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                  <option value="Rotating">Rotating</option>
                </select>
                <ValidationMessage error={errors.shiftType} />
              </div>

              {/* Organization */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Organization
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('organization', { required: 'Organization is required' })}
                    placeholder="e.g. Metro General Hospital"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.organization} />
              </div>

              {/* Experience */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Experience (Years)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Award className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    {...register('experience', { 
                      required: 'Experience is required',
                      min: { value: 0, message: 'Must be positive' }
                    })}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.experience} />
              </div>
            </>
          )}

          {/* Patient Specific Fields */}
          {role === 'Patient' && (
            <>
              {/* Organization / Hospital */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Hospital / Organization
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('organization', { required: 'Hospital / Organization is required' })}
                    placeholder="e.g. Metro General Hospital"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.organization} />
              </div>

              {/* Patient ID */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Patient ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('patientId', { 
                      required: 'Patient ID is required',
                      pattern: {
                        value: /^PAT-\d{6}$/,
                        message: 'Format must be PAT-XXXXXX (e.g., PAT-109284)'
                      }
                    })}
                    placeholder="e.g. PAT-109284"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.patientId} />
              </div>
            </>
          )}

          {/* Lab Technician Specific Fields */}
          {role === 'Lab Technician' && (
            <>
              {/* Employee ID */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Lab Employee ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('employeeId', { 
                      required: 'Employee ID is required',
                      pattern: {
                        value: /^LAB-\d{5}$/,
                        message: 'Format must be LAB-XXXXX (e.g., LAB-10495)'
                      }
                    })}
                    placeholder="e.g. LAB-10495"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.employeeId} />
              </div>

              {/* Lab Department */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Lab Department
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('department', { required: 'Lab department is required' })}
                    placeholder="e.g. Pathology / Microbiology"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.department} />
              </div>

              {/* Organization */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Organization
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('organization', { required: 'Organization is required' })}
                    placeholder="e.g. Metro General Hospital"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.organization} />
              </div>
            </>
          )}

          {/* Admin Specific Fields */}
          {role === 'Admin' && (
            <>
              {/* Admin ID */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Admin ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('adminId', { 
                      required: 'Admin ID is required',
                      pattern: {
                        value: /^ADM-\d{5}$/,
                        message: 'Format must be ADM-XXXXX (e.g., ADM-00912)'
                      }
                    })}
                    placeholder="e.g. ADM-00912"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.adminId} />
              </div>

              {/* Organization */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Organization
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('organization', { required: 'Organization is required' })}
                    placeholder="e.g. NIT JAMSHEDPUR"
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <ValidationMessage error={errors.organization} />
              </div>

              {/* Security Level */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Security Clearance Level
                </label>
                <select
                  {...register('securityLevel', { required: 'Security Clearance Level is required' })}
                  className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 focus:border-transparent transition-all text-sm cursor-pointer"
                >
                  <option value="">Select Security Level</option>
                  {['1', '2', '3', '4', '5'].map(lvl => (
                    <option key={lvl} value={lvl}>Level {lvl}</option>
                  ))}
                </select>
                <ValidationMessage error={errors.securityLevel} />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return null
}
