

export class DialogService {
    static dialogContainer = null;


    static init() {
        if (this.dialogContainer) return;

        this.dialogContainer = document.createElement('div');
        this.dialogContainer.id = 'dialog-service-container';
        document.body.appendChild(this.dialogContainer);


        this.injectStyles();
    }


    static injectStyles() {
        if (document.getElementById('dialog-service-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'dialog-service-styles';
        styles.textContent = `

            .ds-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                backdrop-filter: blur(4px);
                animation: dsOverlayIn 0.15s ease-out;
            }
            
            @keyframes dsOverlayIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes dsDialogIn {
                from { 
                    opacity: 0; 
                    transform: scale(0.96) translateY(-8px); 
                }
                to { 
                    opacity: 1; 
                    transform: scale(1) translateY(0); 
                }
            }
            
            @keyframes dsDialogOut {
                from { 
                    opacity: 1; 
                    transform: scale(1); 
                }
                to { 
                    opacity: 0; 
                    transform: scale(0.96); 
                }
            }
            

            .ds-dialog {
                width: 380px;
                max-width: calc(100% - 40px);
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18), 
                            0 0 0 1px rgba(0, 0, 0, 0.05);
                animation: dsDialogIn 0.2s ease-out;
                overflow: hidden;
            }
            
            .ds-dialog.closing {
                animation: dsDialogOut 0.12s ease-in forwards;
            }
            

            .ds-header {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 18px 20px 0 20px;
            }
            
            .ds-icon {
                width: 24px;
                height: 24px;
                flex-shrink: 0;
            }
            
            .ds-icon.info { fill: #0078d4; }
            .ds-icon.warning { fill: #d97706; }
            .ds-icon.error { fill: #dc2626; }
            .ds-icon.success { fill: #16a34a; }
            .ds-icon.question { fill: #6366f1; }
            
            .ds-title {
                font-size: 15px;
                font-weight: 600;
                color: #1a1a1a;
            }
            

            .ds-body {
                padding: 16px 20px 20px 20px;
            }
            
            .ds-message {
                font-size: 14px;
                color: #444;
                line-height: 1.5;
                margin-bottom: 0;
            }
            
            .ds-body.has-input .ds-message {
                margin-bottom: 16px;
            }
            

            .ds-input {
                width: 100%;
                padding: 12px 14px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                background: #fafafa;
                box-sizing: border-box;
                transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
                color: #333;
            }
            
            .ds-input::placeholder {
                color: #aaa;
            }
            
            .ds-input:hover {
                border-color: #ccc;
                background: #fff;
            }
            
            .ds-input:focus {
                outline: none;
                border-color: #0078d4;
                background: #fff;
                box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.1);
            }
            

            .ds-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 0 20px 20px 20px;
            }
            
            .ds-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 10px 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                background: #fff;
                color: #444;
                transition: all 0.12s ease;
                min-width: 80px;
            }
            
            .ds-btn:hover {
                background: #f5f5f5;
                border-color: #ccc;
            }
            
            .ds-btn:active {
                background: #eee;
                transform: scale(0.98);
            }
            
            .ds-btn:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.15);
            }
            
            .ds-btn.primary {
                background: #0078d4;
                border-color: #0078d4;
                color: #fff;
            }
            
            .ds-btn.primary:hover {
                background: #006cc1;
                border-color: #006cc1;
            }
            
            .ds-btn.primary:active {
                background: #005ba3;
            }
            
            .ds-btn.danger {
                background: #dc2626;
                border-color: #dc2626;
                color: #fff;
            }
            
            .ds-btn.danger:hover {
                background: #b91c1c;
                border-color: #b91c1c;
            }
        `;
        document.head.appendChild(styles);
    }


    static getIcon(type) {
        const icons = {
            info: '<i class="ph ph-info ds-icon info"></i>',
            warning: '<i class="ph ph-warning ds-icon warning"></i>',
            error: '<i class="ph ph-x-circle ds-icon error"></i>',
            success: '<i class="ph ph-check-circle ds-icon success"></i>',
            question: '<i class="ph ph-question ds-icon question"></i>'
        };
        return icons[type] || icons.info;
    }


    static createDialog(options) {
        this.init();

        return new Promise((resolve) => {
            const {
                title = '',
                message = '',
                type = 'info',
                buttons = [{ text: 'OK', value: true, primary: true }],
                input = null
            } = options;


            const overlay = document.createElement('div');
            overlay.className = 'ds-overlay';


            const dialog = document.createElement('div');
            dialog.className = 'ds-dialog';


            let html = '';


            if (title) {
                html += `
                    <div class="ds-header">
                        ${this.getIcon(type)}
                        <div class="ds-title">${title}</div>
                    </div>
                `;
            }


            html += `<div class="ds-body${input ? ' has-input' : ''}">`;
            if (message) {
                html += `<div class="ds-message">${message}</div>`;
            }
            if (input) {
                const inputType = input.type || 'text';
                const inputPlaceholder = input.placeholder || '';
                const inputValue = input.value || '';
                html += `<input type="${inputType}" class="ds-input" placeholder="${inputPlaceholder}" value="${inputValue}" autocomplete="off">`;
            }
            html += `</div>`;


            html += `<div class="ds-footer">`;
            buttons.forEach((btn, idx) => {
                const btnClass = btn.primary ? 'ds-btn primary' : (btn.danger ? 'ds-btn danger' : 'ds-btn');
                html += `<button class="${btnClass}" data-idx="${idx}">${btn.text}</button>`;
            });
            html += `</div>`;

            dialog.innerHTML = html;
            overlay.appendChild(dialog);
            this.dialogContainer.appendChild(overlay);


            const inputEl = dialog.querySelector('.ds-input');
            if (inputEl) {
                setTimeout(() => {
                    inputEl.focus();
                    inputEl.select();
                }, 50);
            } else {

                const primaryBtn = dialog.querySelector('.ds-btn.primary');
                if (primaryBtn) {
                    setTimeout(() => primaryBtn.focus(), 50);
                }
            }


            const closeDialog = (value) => {
                dialog.classList.add('closing');
                overlay.style.animation = 'dsOverlayIn 0.12s ease-in reverse';
                setTimeout(() => {
                    overlay.remove();
                    resolve(value);
                }, 120);
            };


            dialog.querySelectorAll('.ds-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    const buttonDef = buttons[idx];

                    if (input && buttonDef.value !== false) {
                        closeDialog(inputEl.value);
                    } else {
                        closeDialog(buttonDef.value);
                    }
                });
            });


            if (inputEl) {
                inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        closeDialog(inputEl.value);
                    } else if (e.key === 'Escape') {
                        closeDialog(null);
                    }
                });
            }


            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleEscape);
                    closeDialog(input ? null : false);
                }
            };
            document.addEventListener('keydown', handleEscape);


            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeDialog(input ? null : false);
                }
            });
        });
    }


    static async alert(message, options = {}) {
        await this.createDialog({
            title: options.title || 'Notice',
            message,
            type: options.type || 'info',
            buttons: [{ text: 'OK', value: true, primary: true }]
        });
    }


    static async confirm(message, options = {}) {
        return await this.createDialog({
            title: options.title || 'Confirm',
            message,
            type: options.type || 'question',
            buttons: [
                { text: options.cancelText || 'Cancel', value: false },
                { text: options.confirmText || 'OK', value: true, primary: true }
            ]
        });
    }


    static async prompt(message, defaultValue = '', options = {}) {
        return await this.createDialog({
            title: options.title || 'Input',
            message,
            type: options.type || 'info',
            buttons: [
                { text: 'Cancel', value: false },
                { text: 'OK', value: true, primary: true }
            ],
            input: {
                type: options.inputType || 'text',
                value: defaultValue,
                placeholder: options.placeholder || ''
            }
        });
    }


    static async danger(message, options = {}) {
        return await this.createDialog({
            title: options.title || 'Warning',
            message,
            type: 'warning',
            buttons: [
                { text: options.cancelText || 'Cancel', value: false },
                { text: options.confirmText || 'Delete', value: true, danger: true }
            ]
        });
    }
}
