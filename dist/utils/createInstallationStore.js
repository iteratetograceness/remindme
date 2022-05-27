var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const createInstallationStore = (cache) => {
    return {
        storeInstallation: (installation) => __awaiter(void 0, void 0, void 0, function* () {
            if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
                cache.set(installation.enterprise.id, JSON.stringify(installation));
                return;
            }
            if (installation.team !== undefined) {
                cache.set(installation.team.id, JSON.stringify(installation));
                return;
            }
            throw new Error('Failed saving installation data to installationStore.');
        }),
        fetchInstallation: (installQuery) => __awaiter(void 0, void 0, void 0, function* () {
            if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
                return JSON.parse(cache.get(installQuery.enterpriseId) || '');
            }
            if (installQuery.teamId !== undefined) {
                return JSON.parse(cache.get(installQuery.teamId) || '');
            }
            throw new Error('Failed fetching installation.');
        }),
        deleteInstallation: (installQuery) => __awaiter(void 0, void 0, void 0, function* () {
            if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
                cache.del(installQuery.enterpriseId);
                return;
            }
            if (installQuery.teamId !== undefined) {
                cache.del(installQuery.teamId);
                return;
            }
            throw new Error('Failed to delete installation');
        }),
    };
};
export default createInstallationStore;
