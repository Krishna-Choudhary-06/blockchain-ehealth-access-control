export const levelLabelMap = {
  L0: 'Prescription',
  L1: 'Lab Report',
  L2: 'Medical History',
  L3: 'Billing'
}

export const rolePrivacyMap = {
  Patient: 'L0',
  Nurse: 'L1',
  Doctor: 'L2',
  Admin: 'L3',
  Accountant: 'L3'
}

export const roleAccessMap = {
  Doctor: ['L0', 'L1', 'L2', 'L3'],
  Nurse: ['L1', 'L2', 'L3'],
  'Lab Technician': ['L1', 'L3'],
  Admin: ['L2', 'L3'],
  Accountant: ['L3']
}

export const categoryLevelMap = {
  prescription: 'L0',
  prescriptions: 'L0',
  laboratory: 'L1',
  'lab report': 'L1',
  lab: 'L1',
  medical_history: 'L2',
  'medical history': 'L2',
  history: 'L2',
  billing: 'L3',
  'billing information': 'L3',
  public: 'L3',
  insurance: 'L2',
  discharge_summary: 'L2',
  administrative: 'L3'
}

export function levelRank(level) {
  const ranks = { L0: 0, L1: 1, L2: 2, L3: 3 }
  if (!(level in ranks)) {
    throw new Error(`Invalid privacy level: ${level}`)
  }
  return ranks[level]
}

export function privacyRank(level) {
  return levelRank(level)
}

export function roleAccessLevels(role) {
  const normalized = String(role || '').trim()
  return Object.prototype.hasOwnProperty.call(roleAccessMap, normalized)
    ? roleAccessMap[normalized]
    : null
}

export function roleCanAccessLevel(role, level) {
  const levels = roleAccessLevels(role)
  return Array.isArray(levels) && levels.includes(level)
}

export function levelLabel(level) {
  return levelLabelMap[level] || 'Not specified'
}

export function deriveRequiredLevel(category, fallbackLevel = 'L0') {
  const key = String(category || '').toLowerCase().trim()
  return categoryLevelMap[key] || fallbackLevel || 'L0'
}

export function roleDefaultPrivacyLevel(role) {
  const normalized = String(role || '').trim()
  if (rolePrivacyMap[normalized]) return rolePrivacyMap[normalized]
  const titleCase = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
  return rolePrivacyMap[titleCase] || 'L2'
}

export function canAccessRecord(userLevel, requiredLevel, { isOwner = false, grantedUsers, revokedUsers, userId = '' } = {}) {
  if (isOwner) return true
  const granted = Array.isArray(grantedUsers) ? grantedUsers : []
  const revoked = Array.isArray(revokedUsers) ? revokedUsers : []
  if (revoked.includes(userId)) return false
  if (granted.includes(userId)) return true
  return roleCanAccessLevel(userLevel, requiredLevel)
}

export function isRecordOwner(record, userId) {
  const normalizedUser = String(userId || '').trim()
  if (!normalizedUser) return false
  const ownerCandidates = [
    record?.ownerId,
    record?.metadata?.ownerId,
    record?.uploadedBy,
    record?.metadata?.uploadedBy,
    record?.patientId
  ]
  return ownerCandidates.some((candidate) => String(candidate || '').trim() === normalizedUser)
}

export function deriveEligibleUsers(users, requiredLevel) {
  return users.filter((user) => {
    if (!user?.userId || user.bgwRecipientId == null || user.bgwRecipientId === '') return false
    return roleCanAccessLevel(user.role, requiredLevel)
  })
}

export function buildRecipientSet(eligibleUsers) {
  const recipientIds = eligibleUsers
    .map((user) => Number(user.bgwRecipientId))
    .filter((id) => Number.isInteger(id) && id > 0)
  const authorizedUsers = eligibleUsers.map((user) => user.userId).filter(Boolean)
  return { recipientIds, authorizedUsers }
}

export function isBgwRecord(record) {
  return Boolean(record?.bgwHeader && record?.updateToken)
}
