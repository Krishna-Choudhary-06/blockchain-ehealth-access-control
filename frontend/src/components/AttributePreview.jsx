import React from 'react'
import { Check, X, Shield, Cpu, Lock, HelpCircle } from 'lucide-react'

const rolePermissions = {
  Doctor: [
    { text: 'View Assigned Patient Records', allowed: true },
    { text: 'Update Medical Records', allowed: true },
    { text: 'Access Department Data', allowed: true },
    { text: 'Delete Records', allowed: false }
  ],
  Nurse: [
    { text: 'View Assigned Patient Records', allowed: true },
    { text: 'Update Patient Vitals/Charts', allowed: true },
    { text: 'Access Department Data', allowed: true },
    { text: 'Delete Records', allowed: false }
  ],
  Patient: [
    { text: 'View Personal Health Records', allowed: true },
    { text: 'Grant/Revoke Access Permissions', allowed: true },
    { text: 'Download Medical History', allowed: true },
    { text: 'Update Records directly', allowed: false }
  ],
  Staff: [
    { text: 'View Administrative Records', allowed: true },
    { text: 'Process Patient Registration', allowed: true },
    { text: 'Access Clinic Worklogs', allowed: true },
    { text: 'Access Clinical Diagnostics Data', allowed: false }
  ]
}

export default function AttributePreview({ formData }) {
  const { role, name, organization, department, specialization, patientId, adminId, employeeId, securityLevel, insuranceNo } = formData || {}
  
  const permissions = rolePermissions[role] || [
    { text: 'View Assigned Patient Records', allowed: false },
    { text: 'Update Medical Records', allowed: false },
    { text: 'Access Department Data', allowed: false },
    { text: 'Delete Records', allowed: false }
  ]

  // Construct readable display info
  const displayOrg = organization || department || 'Not specified'
  const displaySubtext = specialization || patientId || adminId || employeeId || 'Pending registration'

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg hover:border-purple-500/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Blockchain Attribute Preview
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            On-chain policy attributes mapped in real time.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          Active Policy
        </div>
      </div>

      {/* Main Attribute Card */}
      <div className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-4.5 space-y-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Identity Role</span>
          <span className={`text-base font-extrabold tracking-wide ${role ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-600 italic'}`}>
            {role ? role : 'No Role Selected'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Organization</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
              {displayOrg}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Identifier / Speciality</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
              {displaySubtext}
            </span>
          </div>
        </div>

        {/* Dynamic Details based on selected attributes */}
        {role === 'Patient' && insuranceNo && (
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-900/50">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Insurance Verification Status</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Enrolled Coverage ({insuranceNo})
            </span>
          </div>
        )}


      </div>

      {/* Permissions List */}
      <div className="mt-5 space-y-3.5">
        <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Generated Consensual Permissions
        </h4>
        
        <div className="space-y-2.5">
          {permissions.map((perm, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                perm.allowed 
                  ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-rose-500/5 border-rose-500/10 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                perm.allowed 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {perm.allowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-semibold leading-normal">
                {perm.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Attribute Map JSON Preview */}
      <div className="mt-6">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">
          Ledger Metadata Mapping
        </span>
        <pre className="p-3 bg-slate-950/90 text-purple-400/90 rounded-xl font-mono text-[9px] leading-relaxed overflow-x-auto max-h-[140px] border border-slate-900">
          {JSON.stringify(
            {
              msp_id: 'Org1MSP',
              attributes: {
                name: name || '',
                role: role || 'UNKNOWN',
                org: organization || 'UNKNOWN',
                ...(department && { dept: department }),
                ...(patientId && { patient_id: patientId }),
                ...(employeeId && { employee_id: employeeId })
              },
              consensus_access_control: role ? 'ABAC_V2' : 'DEFAULT'
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  )
}
