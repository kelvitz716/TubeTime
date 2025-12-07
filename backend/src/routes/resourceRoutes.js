import express from 'express';
import { resourceService } from '../services/resourceService.js';

const router = express.Router();

// GET all accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await resourceService.getAllAccounts();
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching resource accounts:', error);
        res.status(500).json({ error: 'Failed to fetch resource accounts' });
    }
});

// POST new account
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

// PUT update account (e.g., mark exhausted/available)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Expects { status, exhaustedAt, refreshAt }
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
