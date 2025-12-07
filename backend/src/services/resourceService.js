import { db } from '../db/database.js';
import { resourceAccounts } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const resourceService = {
    async getAllAccounts() {
        return await db.select().from(resourceAccounts).orderBy(desc(resourceAccounts.createdAt));
    },

    async addAccount(data) {
        const { name, email } = data;
        // Default status is AVAILABLE
        const result = await db.insert(resourceAccounts).values({
            name,
            email,
            status: 'AVAILABLE'
        }).returning();
        return result[0];
    },

    async updateAccount(id, data) {
        // data can contain status, exhaustedAt, refreshAt
        const updateData = { ...data };
        if (updateData.exhaustedAt) updateData.exhaustedAt = new Date(updateData.exhaustedAt);
        if (updateData.refreshAt) updateData.refreshAt = new Date(updateData.refreshAt);

        const result = await db.update(resourceAccounts)
            .set(updateData)
            .where(eq(resourceAccounts.id, id))
            .returning();
        return result[0];
    },

    async deleteAccount(id) {
        await db.delete(resourceAccounts).where(eq(resourceAccounts.id, id));
        return { success: true };
    }
};
