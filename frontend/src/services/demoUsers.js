import { generateUserKeyPair, generateSalt, hashPassword } from './cryptoService'
import { registerUser, assignLevel, getBGWState, generateBGWPrivateKey, registerUserProfile } from './apiService'

export const DEMO_PASSWORD = 'Demo123!'

export const DEMO_USERS = []

function cleanExistingDemoUsers() {
  const currentUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
  const demoNames = new Set(DEMO_USERS.map(user => user.name))

  localStorage.setItem(
    'registered_users',
    JSON.stringify(currentUsers.filter(user => !demoNames.has(user.name)))
  )

  DEMO_USERS.forEach(user => {
    localStorage.removeItem(`user_keys_${user.name}`)
  })
}

function getPrivacyLevel(role) {
  if (role === 'Doctor') return 'L2'
  if (role === 'Nurse') return 'L1'
  if (role === 'Patient') return 'L0'
  if (role === 'Admin') return 'L3'
  return 'L2'
}

export async function seedDemoUsers() {
  cleanExistingDemoUsers()

  let bgwPublicKey = ''
  try {
    const bgwState = await getBGWState()
    bgwPublicKey = bgwState?.data?.publicKey || bgwState?.publicKey || ''
  } catch (error) {
    console.warn('BGW state unavailable; continuing with local demo seed.', error)
  }

  const seededUsers = []
  const warnings = []

  for (const profile of DEMO_USERS) {
    const keyPair = await generateUserKeyPair()
    const passwordSalt = generateSalt()
    const passwordHash = await hashPassword(DEMO_PASSWORD, passwordSalt)
    const identityId = profile.name
    const privacyLevel = getPrivacyLevel(profile.role)

    try {
      const apiResult = await registerUser(identityId, keyPair.publicKey, profile.role)
      if (!apiResult.success) {
        warnings.push(`Fabric register skipped for ${profile.name}`)
      }
    } catch (error) {
      warnings.push(`Fabric register skipped for ${profile.name}`)
      console.warn(`Demo user ${profile.name} could not be registered on Fabric.`, error)
    }

    try {
      await assignLevel(identityId, privacyLevel)
    } catch (error) {
      warnings.push(`Privacy level skipped for ${profile.name}`)
      console.warn(`Privacy level could not be assigned for ${profile.name}.`, error)
    }

    let bgwPrivateKeyResult = { data: '' }
    if (profile.bgwRecipientId && bgwPublicKey) {
      try {
        bgwPrivateKeyResult = await generateBGWPrivateKey(profile.bgwRecipientId, undefined, bgwPublicKey)
      } catch (error) {
        warnings.push(`BGW key skipped for ${profile.name}`)
        console.warn(`BGW key could not be generated for ${profile.name}.`, error)
      }
    }

    try {
      await registerUserProfile({
        userId: identityId,
        role: profile.role,
        privacyLevel,
        bgwRecipientId: profile.bgwRecipientId,
        organization: profile.organization || ''
      })
    } catch (error) {
      warnings.push(`Profile sync skipped for ${profile.name}`)
      console.warn(`User profile could not be synced for ${profile.name}.`, error)
    }

    const keyRecord = {
      userId: identityId,
      name: profile.name,
      email: profile.name,
      phone: '',
      role: profile.role,
      organization: profile.organization,
      department: profile.department,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      bgwRecipientId: profile.bgwRecipientId,
      bgwPrivateKey: bgwPrivateKeyResult.data,
      bgwPublicKey,
      privacyLevel,
      passwordSalt,
      passwordHash,
      demoSeeded: true
    }

    localStorage.setItem(`user_keys_${profile.name}`, JSON.stringify(keyRecord))

    seededUsers.push({
      userId: identityId,
      name: profile.name,
      email: profile.name,
      phone: '',
      role: profile.role,
      organization: profile.organization,
      department: profile.department,
      publicKey: keyPair.publicKey,
      bgwRecipientId: profile.bgwRecipientId,
      privacyLevel,
      passwordSalt,
      passwordHash,
      demoSeeded: true
    })
  }

  localStorage.setItem('registered_users', JSON.stringify([
    ...JSON.parse(localStorage.getItem('registered_users') || '[]'),
    ...seededUsers
  ]))

  window.dispatchEvent(new Event('demo:users-updated'))

  return {
    users: seededUsers,
    password: DEMO_PASSWORD,
    warnings
  }
}

export function getDemoUsersFromStorage() {
  try {
    return (JSON.parse(localStorage.getItem('registered_users') || '[]') || []).filter(user => user.demoSeeded)
  } catch {
    return []
  }
}
