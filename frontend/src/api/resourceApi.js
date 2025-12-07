import client from './client';

export const resourceApi = {
    // Get all accounts with their nested quotas
    getAllAccounts: async () => {
        const response = await client.get('/resources');
        return response.data;
    },

    // Add a new account (backend auto-creates Gemini + Claude quotas)
    addAccount: async (data) => {
        const response = await client.post('/resources', data);
        return response.data;
    },

    // Update account info (name, email)
    updateAccount: async (id, data) => {
        const response = await client.put(`/resources/${id}`, data);
        return response.data;
    },

    // Delete an account (cascades to quotas)
    deleteAccount: async (id) => {
        const response = await client.delete(`/resources/${id}`);
        return response.data;
    },

    // Set an account as active
    setActiveAccount: async (id) => {
        const response = await client.post(`/resources/${id}/active`);
        return response.data;
    },

    // Update a specific quota (mark exhausted/available)
    updateQuota: async (quotaId, data) => {
        const response = await client.put(`/resources/quotas/${quotaId}`, data);
        return response.data;
    }
};
