let library = [
    { id: 1, name: 'Summer Vibes', artist: 'Chill Artist', type: 'music', duration: 225, album: 'Summer Collection', year: 2024 },
    { id: 2, name: 'Night Drive', artist: 'Lo-Fi Beats', type: 'music', duration: 261, album: 'Night Sessions', year: 2024 },
    { id: 3, name: 'Ocean Waves', artist: 'Nature Sounds', type: 'music', duration: 310, album: 'Relaxation', year: 2023 },
    { id: 4, name: 'Jazz Evening', artist: 'Jazz Ensemble', type: 'music', duration: 480, album: 'Jazz Collection', year: 2023 },
    { id: 5, name: 'Vacation 2024', artist: 'Home Video', type: 'video', duration: 932, resolution: '1920x1080', year: 2024 },
    { id: 6, name: 'Tutorial 01', artist: 'Learning Channel', type: 'video', duration: 525, resolution: '1920x1080', year: 2024 },
    { id: 7, name: 'Sunset Beach', artist: 'Photo Album', type: 'photo', dimensions: '4000x3000', year: 2024 },
    { id: 8, name: 'Mountain View', artist: 'Photo Album', type: 'photo', dimensions: '3840x2160', year: 2024 },
    { id: 9, name: 'City Lights', artist: 'Urban Photos', type: 'photo', dimensions: '5000x3333', year: 2023 },
];

let playlists = [
    { id: 1, name: 'Favorites', items: [1, 2, 3], created: '2024-01-01' },
    { id: 2, name: 'Chill Mix', items: [2, 3, 4], created: '2024-01-15' },
];

export const routes = {
    'GET /library': async (req) => {
        const { type = 'all', sort = 'name', order = 'asc' } = req.query;

        let items = [...library];

        if (type !== 'all') {
            items = items.filter(m => m.type === type);
        }

        items.sort((a, b) => {
            const aVal = a[sort] || '';
            const bVal = b[sort] || '';
            const cmp = String(aVal).localeCompare(String(bVal));
            return order === 'desc' ? -cmp : cmp;
        });

        return {
            success: true,
            type: type,
            count: items.length,
            items: items
        };
    },

    'GET /item/:id': async (req) => {
        const { id } = req.params;
        const item = library.find(m => m.id === parseInt(id));

        if (!item) {
            return { success: false, error: `Media not found: ${id}` };
        }

        return {
            success: true,
            item: {
                ...item,
                path: `/media/${item.type}s/${item.name}`,
                size: Math.floor(Math.random() * 50) + 1 + ' MB',
                addedDate: '2024-01-01'
            }
        };
    },

    'POST /add': async (req) => {
        const { name, artist, type } = req.body;

        if (!name || !type) {
            return { success: false, error: 'Name and type are required' };
        }

        const newItem = {
            id: Math.max(...library.map(m => m.id)) + 1,
            name,
            artist: artist || 'Unknown',
            type,
            ...req.body
        };

        library.push(newItem);

        return {
            success: true,
            added: newItem
        };
    },

    'POST /remove': async (req) => {
        const { id } = req.body;

        const index = library.findIndex(m => m.id === parseInt(id));
        if (index === -1) {
            return { success: false, error: `Media not found: ${id}` };
        }

        const removed = library.splice(index, 1)[0];

        return {
            success: true,
            removed: removed
        };
    },

    'GET /playlists': async (req) => {
        return {
            success: true,
            count: playlists.length,
            playlists: playlists.map(p => ({
                ...p,
                itemCount: p.items.length
            }))
        };
    },

    'GET /playlist/:id': async (req) => {
        const { id } = req.params;
        const playlist = playlists.find(p => p.id === parseInt(id));

        if (!playlist) {
            return { success: false, error: `Playlist not found: ${id}` };
        }

        const items = playlist.items
            .map(itemId => library.find(m => m.id === itemId))
            .filter(Boolean);

        return {
            success: true,
            playlist: {
                ...playlist,
                items: items
            }
        };
    },

    'POST /playlist': async (req) => {
        const { name, items = [] } = req.body;

        if (!name) {
            return { success: false, error: 'Playlist name is required' };
        }

        const newPlaylist = {
            id: Math.max(...playlists.map(p => p.id), 0) + 1,
            name,
            items,
            created: new Date().toISOString().split('T')[0]
        };

        playlists.push(newPlaylist);

        return {
            success: true,
            created: newPlaylist
        };
    },

    'POST /playlist/:id/update': async (req) => {
        const { id } = req.params;
        const playlist = playlists.find(p => p.id === parseInt(id));

        if (!playlist) {
            return { success: false, error: `Playlist not found: ${id}` };
        }

        if (req.body.name) playlist.name = req.body.name;
        if (req.body.items) playlist.items = req.body.items;

        return {
            success: true,
            updated: playlist
        };
    },

    'POST /playlist/:id/delete': async (req) => {
        const { id } = req.params;
        const index = playlists.findIndex(p => p.id === parseInt(id));

        if (index === -1) {
            return { success: false, error: `Playlist not found: ${id}` };
        }

        const removed = playlists.splice(index, 1)[0];

        return {
            success: true,
            deleted: removed
        };
    },

    'GET /search': async (req) => {
        const { q, type } = req.query;

        if (!q) {
            return { success: false, error: 'Search query is required', results: [] };
        }

        const query = q.toLowerCase();
        let results = library.filter(m =>
            m.name.toLowerCase().includes(query) ||
            (m.artist && m.artist.toLowerCase().includes(query)) ||
            (m.album && m.album.toLowerCase().includes(query))
        );

        if (type && type !== 'all') {
            results = results.filter(m => m.type === type);
        }

        return {
            success: true,
            query: q,
            count: results.length,
            results: results
        };
    }
};
