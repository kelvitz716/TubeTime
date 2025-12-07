import { db } from '../db/database.js';
import { resourceAccounts, resourceQuotas } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const RESOURCE_TYPES = ['GEMINI', 'CLAUDE'];

export const resourceService = {
    // Get all accounts with their quotas
    async getAllAccountsWithQuotas() {
        const accounts = await db.select().from(resourceAccounts).orderBy(desc(resourceAccounts.createdAt));
        const quotas = await db.select().from(resourceQuotas);

        // Group quotas by accountId
        return accounts.map(account => ({
            ...account,
            quotas: quotas.filter(q => q.accountId === account.id)
        }));
    },

    // Add a new account with default quotas for all resource types
    async addAccount(data) {
        const { name, email } = data;

        return await db.transaction(async (tx) => {
            // 1. Create the account
            const [account] = await tx.insert(resourceAccounts).values({
                name,
                email,
            }).returning();

            // 2. Create default quotas for each resource type
            const quotaValues = RESOURCE_TYPES.map(type => ({
                accountId: account.id,
                resourceType: type,
                status: 'AVAILABLE'
            }));

            await tx.insert(resourceQuotas).values(quotaValues);

            // 3. Fetch the created quotas
            const quotas = await tx.select().from(resourceQuotas)
                .where(eq(resourceQuotas.accountId, account.id));

            return { ...account, quotas };
        });
    },

    // Update account info (name, email)
    async updateAccount(id, data) {
        const [account] = await db.update(resourceAccounts)
            .set(data)
            .where(eq(resourceAccounts.id, id))
            .returning();
        return account;
    },

    // Delete an account (cascades to quotas)
    async deleteAccount(id) {
        await db.delete(resourceAccounts).where(eq(resourceAccounts.id, id));
        return { success: true };
    },

    // Set an account as active
    async setActiveAccount(id) {
        return await db.transaction(async (tx) => {
            // Deactivate all accounts
            await tx.update(resourceAccounts)
                .set({ isActive: false })
                .where(eq(resourceAccounts.isActive, true));

            // Activate the target account
            const [account] = await tx.update(resourceAccounts)
                .set({
                    isActive: true,
                    startedUsingAt: new Date(),
                })
                .where(eq(resourceAccounts.id, id))
                .returning();

            return account;
        });
    },

    // Update a specific quota (mark exhausted/available)
    async updateQuota(quotaId, data) {
        const updateData = { ...data };
        if (updateData.exhaustedAt) updateData.exhaustedAt = new Date(updateData.exhaustedAt);
        if (updateData.refreshAt) updateData.refreshAt = new Date(updateData.refreshAt);

        const [quota] = await db.update(resourceQuotas)
            .set(updateData)
            .where(eq(resourceQuotas.id, quotaId))
            .returning();
        return quota;
    },

    // Get quotas for a specific account
    async getQuotasByAccount(accountId) {
        return await db.select().from(resourceQuotas)
            .where(eq(resourceQuotas.accountId, accountId));
    }
};
