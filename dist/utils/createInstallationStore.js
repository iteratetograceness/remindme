"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default();
const createInstallationStore = () => {
    return {
        storeInstallation: async (installation) => {
            if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
                cache.set(installation.enterprise.id, JSON.stringify(installation));
                return;
            }
            if (installation.team !== undefined) {
                cache.set(installation.team.id, JSON.stringify(installation));
                return;
            }
            throw new Error('Failed saving installation data to installationStore.');
        },
        fetchInstallation: async (installQuery) => {
            if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
                return JSON.parse(cache.get(installQuery.enterpriseId) || '');
            }
            if (installQuery.teamId !== undefined) {
                return JSON.parse(cache.get(installQuery.teamId) || '');
            }
            throw new Error('Failed fetching installation.');
        },
        deleteInstallation: async (installQuery) => {
            if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
                cache.del(installQuery.enterpriseId);
                return;
            }
            if (installQuery.teamId !== undefined) {
                cache.del(installQuery.teamId);
                return;
            }
            throw new Error('Failed to delete installation');
        },
    };
};
exports.default = createInstallationStore;
