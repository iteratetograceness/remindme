import { Installation, InstallationQuery, InstallationStore } from '@slack/bolt'
import NodeCache from 'node-cache'

const createInstallationStore = (cache: NodeCache): InstallationStore => {
  return {
    storeInstallation: async (installation: Installation) => {
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        cache.set(installation.enterprise.id, JSON.stringify(installation))
        return
      }
      if (installation.team !== undefined) {
        cache.set(installation.team.id, JSON.stringify(installation))
        return
      }
      throw new Error('Failed saving installation data to installationStore.')
    },
    fetchInstallation: async (installQuery: InstallationQuery<boolean>) => {
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        return JSON.parse(cache.get(installQuery.enterpriseId) || '')
      }
      if (installQuery.teamId !== undefined) {
        return JSON.parse(cache.get(installQuery.teamId) || '')
      }
      throw new Error('Failed fetching installation.')
    },
    deleteInstallation: async (installQuery: InstallationQuery<boolean>) => {
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        cache.del(installQuery.enterpriseId)
        return
      }
      if (installQuery.teamId !== undefined) {
        cache.del(installQuery.teamId)
        return
      }
      throw new Error('Failed to delete installation')
    },
  }
}

export default createInstallationStore
