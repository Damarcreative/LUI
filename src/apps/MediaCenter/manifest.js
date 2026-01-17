export const manifest = {
    id: 'media-app',
    name: 'Media Center',
    shortName: 'Media',
    color: '#ff4081',
    iconPath: '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8 9l7.5 5L8 19V9z"/>',
    iconStyle: 'fill:#ff4081',
    showOnDesktop: true,
    showOnTaskbar: true,
    multiInstance: true,
    permissions: ['filesystem', 'dialog', 'storage', 'network'],

    async createInstance(options = {}, systemAPI) {
        const { MediaCenter } = await import('./MediaCenter.js');
        return MediaCenter.createNewInstance(options, systemAPI);
    }
};
