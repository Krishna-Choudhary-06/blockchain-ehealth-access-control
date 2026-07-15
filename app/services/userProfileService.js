'use strict';

const fs = require('fs');
const path = require('path');
const { roleDefaultPrivacyLevel } = require('./privacyPolicy');

const stateDir = path.join(__dirname, '..', 'data');
const profilesPath = path.join(stateDir, 'user-profiles.json');

function loadProfiles() {
    if (!fs.existsSync(profilesPath)) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
    } catch {
        return {};
    }
}

function saveProfiles(profiles) {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

function upsertProfile({ userId, role, privacyLevel, bgwRecipientId, organization }) {
    if (!userId) {
        throw new Error('userId is required');
    }
    const profiles = loadProfiles();
    const existing = profiles[userId] || {};
    profiles[userId] = {
        userId,
        role: role || existing.role || '',
        privacyLevel: privacyLevel || existing.privacyLevel || roleDefaultPrivacyLevel(role),
        bgwRecipientId: bgwRecipientId ?? existing.bgwRecipientId ?? null,
        organization: organization || existing.organization || '',
        updatedAt: new Date().toISOString()
    };
    saveProfiles(profiles);
    return profiles[userId];
}

function getProfile(userId) {
    return loadProfiles()[userId] || null;
}

function getAllProfiles() {
    return Object.values(loadProfiles());
}

function mergeWithAclLevels(profiles, aclRecords = []) {
    const aclByUser = {};
    aclRecords.forEach((acl) => {
        if (acl.userId) aclByUser[acl.userId] = acl.level;
    });

    return profiles.map((profile) => ({
        ...profile,
        privacyLevel: aclByUser[profile.userId] || profile.privacyLevel || roleDefaultPrivacyLevel(profile.role)
    }));
}

module.exports = {
    upsertProfile,
    getProfile,
    getAllProfiles,
    mergeWithAclLevels
};
