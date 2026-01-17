
export const manifest = {
    id: 'taskmanager',
    name: 'Task Manager',
    shortName: 'TaskMgr',
    color: '#4caf50',
    iconPath: '<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>',
    iconStyle: 'fill:#4caf50',
    showOnDesktop: true,
    showOnTaskbar: true,
    multiInstance: true,

    permissions: ['dialog', 'storage'],

    async createInstance(options = {}, systemAPI) {
        const { TaskManager } = await import('./TaskManager.js');
        return TaskManager.createNewInstance(options, systemAPI);
    }
};
