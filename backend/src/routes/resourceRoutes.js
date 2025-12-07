import express from 'express';
import { resourceService } from '../services/resourceService.js';

const router = express.Router();

// GET all accounts with their quotas
router.get('/', async (req, res) => {
    try {
        const accounts = await resourceService.getAllAccountsWithQuotas();
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching resource accounts:', error);
        res.status(500).json({ error: 'Failed to fetch resource accounts' });
    }
});

// POST new account (auto-creates Gemini + Claude quotas)
router.post('/', async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const account = await resourceService.addAccount({ name, email });
        res.status(201).json(account);
    } catch (error) {
        console.error('Error creating resource account:', error);
        res.status(500).json({ error: 'Failed to create resource account' });
    }
});

// POST set active account
router.post('/:id/active', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const account = await resourceService.setActiveAccount(id);
        res.json(account);
    } catch (error) {
        console.error('Error setting active account:', error);
        res.status(500).json({ error: 'Failed to set active account' });
    }
});

// PUT update account info
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const account = await resourceService.updateAccount(Number(id), updates);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        res.json(account);
    } catch (error) {
        console.error('Error updating resource account:', error);
        res.status(500).json({ error: 'Failed to update resource account' });
    }
});

// PUT update a specific quota (mark exhausted/available)
router.put('/quotas/:quotaId', async (req, res) => {
    try {
        const { quotaId } = req.params;
        const updates = req.body; // Expects { status, exhaustedAt, refreshAt }
        const quota = await resourceService.updateQuota(Number(quotaId), updates);
        if (!quota) {
            return res.status(404).json({ error: 'Quota not found' });
        }
        res.json(quota);
    } catch (error) {
        console.error('Error updating quota:', error);
        res.status(500).json({ error: 'Failed to update quota' });
    }
});

// DELETE account
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await resourceService.deleteAccount(Number(id));
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting resource account:', error);
        res.status(500).json({ error: 'Failed to delete resource account' });
    }
});

export default router;
