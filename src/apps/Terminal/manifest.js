
export const manifest = {
    id: 'cli',
    name: 'Terminal',
    shortName: 'Terminal',
    color: '#333333',
    iconPath: '<rect width="20" height="16" x="2" y="4" rx="2" fill="#444"></rect><path d="M6 8l4 3-4 3M11 14h6" stroke="white" stroke-width="2" stroke-linecap="round"></path>',
    iconStyle: 'fill:#333',
    showOnDesktop: true,
    showOnTaskbar: true,
    multiInstance: true,


    permissions: ['filesystem', 'dialog', 'network', 'storage'],

    async createInstance(options = {}, systemAPI) {
        const { Terminal } = await import('./Terminal.js');
        return Terminal.createNewInstance(options, systemAPI);
    }
};
