export const manifest = {
    id: 'explorer',
    name: 'File Explorer',
    shortName: 'Home',
    color: '#e8b339',
    iconPath: '<path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>',
    iconStyle: 'fill:#e8b339',
    showOnDesktop: true,
    showOnTaskbar: true,
    multiInstance: true,
    permissions: ['filesystem', 'dialog', 'clipboard', 'network', 'storage'],

    async createInstance(options = {}, systemAPI) {
        const { Explorer } = await import('./Explorer.js');
        return Explorer.createNewInstance(options, systemAPI);
    }
};
