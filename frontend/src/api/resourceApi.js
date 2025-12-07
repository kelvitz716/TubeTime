import client from './client';

export const resourceApi = {
    getAllAccounts: async () => {
        const response = await client.get('/resources');
        return response.data;
    },
    addAccount: async (data) => {
        const response = await client.post('/resources', data);
        return response.data;
    },
    updateAccount: async (id, data) => {
        const response = await client.put(`/resources/${id}`, data);
        return response.data;
    },
    deleteAccount: async (id) => {
        const response = await client.delete(`/resources/${id}`);
        return response.data;
    }
};
