export const manifest = {
    id: 'texteditor',
    name: 'Text Editor',
    shortName: 'Text Edit',
    color: '#1976d2',
    iconPath: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>',
    iconStyle: 'fill:#1976d2',
    showOnDesktop: true,
    showOnTaskbar: true,
    multiInstance: true,

    permissions: ['filesystem', 'dialog', 'clipboard', 'storage'],

    async createInstance(options = {}, systemAPI) {
        const { TextEditor } = await import('./TextEditor.js');
        return TextEditor.createNewInstance(options, systemAPI);
    }
};
