import './style.css';
import { WindowManager } from '../../system/components/WindowManager/WindowManager.js';

export class Settings {
    static currentSection = 'system';
    static instances = new Map();

    static createNewInstance(options = {}) {
        const icon = '<i class="ph ph-gear" style="font-size:16px; color:#666;"></i>';

        const windowContent = this.getWindowContent();

        const windowId = WindowManager.createWindow('settings', {
            title: 'Settings',
            width: 850,
            height: 550,
            content: windowContent,
            icon: icon
        });

        this.instances.set(windowId, { currentSection: 'system' });
        this.initInstance(windowId);

        console.log(`[Settings] Created new instance: ${windowId}`);
        return windowId;
    }

    static getWindowContent() {
        return `
            <div class="settings-body" style="display:flex; height:100%; overflow:hidden;">
                <div class="settings-sidebar" style="width:230px; background:#f3f3f3; padding:10px; border-right:1px solid #e5e5e5; overflow-y:auto; display:flex; flex-direction:column;">
                    <div style="padding:10px 5px; margin-bottom:5px;">
                        <input type="text" placeholder="Find a setting" class="settings-search" autocomplete="off" style="width:100%; padding:8px 12px; border:1px solid #d1d1d1; border-radius:4px; font-size:13px; background:white;">
                    </div>
                    
                    <div class="settings-nav-item active" data-section="system">
                        <i class="ph ph-desktop"></i>
                        System
                    </div>
                    <div class="settings-nav-item" data-section="connection">
                        <i class="ph ph-wifi-high"></i>
                        Connection
                    </div>
                    <div class="settings-nav-item" data-section="personalization">
                        <i class="ph ph-paint-brush"></i>
                        Personalization
                    </div>
                    <div class="settings-nav-item" data-section="apps">
                        <i class="ph ph-squares-four"></i>
                        Apps
                    </div>
                     <div class="settings-nav-item" data-section="time">
                        <i class="ph ph-clock"></i>
                        Time & language
                    </div>
                    <div class="settings-nav-item" data-section="config">
                        <i class="ph ph-gear-six"></i>
                        Config
                    </div>
                    
                    <div style="flex:1"></div>
                    
                    <div class="settings-nav-item" data-section="unsupported">
                        <i class="ph ph-warning-circle"></i>
                        Unsupported
                    </div>
                    <div class="settings-nav-item" data-section="about">
                        <i class="ph ph-info"></i>
                        About
                    </div>
                </div>

                <div class="settings-content" style="flex:1; padding:0; overflow-y:auto; background:#f9f9f9;">
                    <div style="padding:25px; max-width:800px; margin:0 auto;">
                    
                    <div class="settings-section" data-section="system">
                        <h2>System</h2>
                        
                        <div class="system-overview-card" style="margin-top:0; margin-bottom:20px;">
                            <i class="ph ph-desktop" style="font-size:48px; color:#0078d4;"></i>
                            <div class="overview-details">
                                <h3 id="sys-name-main">Linux Desktop</h3>
                                <p id="sys-model-main">Linux WebUI • Administrator</p>
                            </div>
                        </div>

                        <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-item-row" data-action="navigate" data-target="display">
                                <div class="setting-icon"><i class="ph ph-monitor"></i></div>
                                <div class="setting-text"><h4>Display</h4><p>Brightness, night light, scaling</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                            <div class="setting-item-row" data-action="show-toast" data-message="Notifications settings coming soon">
                                <div class="setting-icon"><i class="ph ph-bell"></i></div>
                                <div class="setting-text"><h4>Notifications</h4><p>Alerts from apps and system</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                            <div class="setting-item-row" data-action="show-toast" data-message="Storage management coming soon">
                                <div class="setting-icon"><i class="ph ph-hard-drives"></i></div>
                                <div class="setting-text"><h4>Storage</h4><p>Storage space, drives, cleanup</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section" data-section="connection" style="display:none;">
                        <h2>Connection</h2>
                        <p id="connection-status" style="color:#666; margin-bottom:15px;">Checking connection status...</p>
                        
                        <h3 style="margin-top:10px;">Network</h3>
                        <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-item-row" id="wifi-row" data-action="toggle-wifi">
                                <div class="setting-icon"><i class="ph ph-wifi-high"></i></div>
                                <div class="setting-text"><h4>Wi-Fi</h4><p id="wifi-status">Checking...</p></div>
                                <label class="toggle-switch"><input type="checkbox" id="wifi-toggle"><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item-row" data-action="show-toast" data-message="Ethernet settings coming soon">
                                <div class="setting-icon"><i class="ph ph-plug"></i></div>
                                <div class="setting-text"><h4>Ethernet</h4><p id="ethernet-status">Checking...</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                            <div class="setting-item-row" data-action="show-toast" data-message="Proxy configuration coming soon">
                                <div class="setting-icon"><i class="ph ph-shield"></i></div>
                                <div class="setting-text"><h4>Proxy</h4><p>Configure proxy settings</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                        </div>
                        
                        <h3 style="margin-top:25px;">Bluetooth</h3>
                        <div class="setting-group-container" id="bluetooth-section" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-item-row" id="bluetooth-row" data-action="toggle-bluetooth">
                                <div class="setting-icon"><i class="ph ph-bluetooth"></i></div>
                                <div class="setting-text"><h4>Bluetooth</h4><p id="bluetooth-status">Checking...</p></div>
                                <label class="toggle-switch"><input type="checkbox" id="bluetooth-toggle"><span class="toggle-slider"></span></label>
                            </div>
                        </div>
                        
                        <div id="docker-notice" style="display:none; margin-top:20px; padding:15px; background:#fff3e0; border-radius:8px; border:1px solid #ffcc80;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <i class="ph ph-info" style="font-size:20px; color:#ff9800;"></i>
                                <div>
                                    <strong style="color:#e65100;">Running in Docker</strong>
                                    <p style="margin:0; color:#666; font-size:12px;">Wi-Fi and Bluetooth are not available in containerized environments.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section" data-section="personalization" style="display:none;">
                        <h2>Personalization</h2>
                        
                        <div class="wallpaper-preview-card" style="background:white; border-radius:12px; border:1px solid #e5e5e5; padding:20px; margin-bottom:20px;">
                            <div style="display:flex; gap:20px; align-items:center;">
                                <div class="preview-desktop" style="width:200px; height:120px; background:#f0f0f0; border-radius:8px; background-size:cover; background-position:center; box-shadow:0 4px 12px rgba(0,0,0,0.15); position:relative; overflow:hidden;">
                                    <div style="position:absolute; bottom:0; left:0; right:0; padding:8px; background:linear-gradient(transparent, rgba(0,0,0,0.6)); color:white; font-size:11px;">Desktop</div>
                                </div>
                                <div class="preview-lockscreen" style="width:120px; height:80px; background:#f0f0f0; border-radius:6px; background-size:cover; background-position:center; box-shadow:0 2px 8px rgba(0,0,0,0.1); position:relative; overflow:hidden;">
                                    <div style="position:absolute; bottom:0; left:0; right:0; padding:4px; background:linear-gradient(transparent, rgba(0,0,0,0.6)); color:white; font-size:9px;">Lock Screen</div>
                                </div>
                            </div>
                            <p style="margin-top:15px; margin-bottom:0; color:#666; font-size:13px;">Click a wallpaper to set as <strong>Desktop</strong>, right-click for <strong>Lock Screen</strong></p>
                        </div>
                        
                        <h3>Select a theme to apply</h3>
                        <div style="display:flex; gap:15px; margin:15px 0;">
                            <div class="theme-option selected" style="background:linear-gradient(135deg, #fff 50%, #f0f0f0 50%); border:1px solid #ddd; width:80px; height:60px; border-radius:8px; cursor:pointer; position:relative;">
                                <div style="position:absolute; bottom:5px; left:5px; font-size:10px; font-weight:bold;">Light</div>
                            </div>
                            <div class="theme-option" style="background:linear-gradient(135deg, #1e1e1e 50%, #333 50%); width:80px; height:60px; border-radius:8px; cursor:pointer; position:relative;">
                                <div style="position:absolute; bottom:5px; left:5px; font-size:10px; font-weight:bold; color:white;">Dark</div>
                            </div>
                             <div class="theme-option" style="background:linear-gradient(135deg, #e3f2fd 50%, #bbdefb 50%); width:80px; height:60px; border-radius:8px; cursor:pointer; position:relative;">
                                <div style="position:absolute; bottom:5px; left:5px; font-size:10px; font-weight:bold; color:#0d47a1;">Blue</div>
                            </div>
                        </div>

                         <h3 style="margin-top:25px;">Background</h3>
                         <p style="color:#666; font-size:12px; margin-bottom:10px;">Wallpapers from <code>/storage/wallpaper/</code></p>
                         <div class="wallpaper-grid">
                            <div style="padding:20px; text-align:center; color:#888; grid-column: 1/-1;">
                                <i class="ph ph-spinner" style="font-size:24px; animation: spin 1s linear infinite;"></i>
                                <p>Loading wallpapers...</p>
                            </div>
                         </div>

                        <h3 style="margin-top:25px;">Colors</h3>
                         <div style="display:flex; gap:10px; flex-wrap:wrap; margin:15px 0;">
                            <div class="color-option selected" style="background:#0078d4;"></div>
                            <div class="color-option" style="background:#ff4081;"></div>
                            <div class="color-option" style="background:#4caf50;"></div>
                            <div class="color-option" style="background:#ff9800;"></div>
                            <div class="color-option" style="background:#9c27b0;"></div>
                            <div class="color-option" style="background:#607d8b;"></div>
                        </div>
                    </div>
                    
                     <div class="settings-section" data-section="apps" style="display:none;">
                        <h2>Apps</h2>
                        <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-item-row" data-action="show-toast" data-message="Installed apps management coming soon">
                                <div class="setting-icon"><i class="ph ph-squares-four"></i></div>
                                <div class="setting-text"><h4>Installed apps</h4><p>Uninstall, defaults, optional features</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                             <div class="setting-item-row" data-action="show-toast" data-message="Startup apps configuration coming soon">
                                <div class="setting-icon"><i class="ph ph-rocket-launch"></i></div>
                                <div class="setting-text"><h4>Startup</h4><p>Apps that start automatically</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                        </div>

                        <h3 style="margin-top:25px;">Advanced settings</h3>
                         <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-item-row" data-action="show-toast" data-message="Default apps configuration coming soon">
                                <div class="setting-text" style="margin-left:15px;"><h4>Default apps</h4><p>Defaults for file types and links</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                         </div>
                    </div>

                     <div class="settings-section" data-section="unsupported" style="display:none;">
                        <h2>Unsupported Features</h2>
                        <p style="color:#666; margin-bottom:20px;">The following features are not available on this system due to missing hardware or software.</p>
                        
                        <div id="unsupported-list" class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div style="padding:20px; text-align:center; color:#888;">
                                <i class="ph ph-spinner" style="font-size:24px; animation:spin 1s linear infinite;"></i>
                                <p>Checking system capabilities...</p>
                            </div>
                        </div>
                        
                        <div class="info-group" style="margin-top:25px;">
                            <h3>Installed Packages</h3>
                            <div id="packages-list" class="about-info" style="background:white; border-radius:8px; border:1px solid #e5e5e5; padding:15px;">
                                <p style="color:#888; text-align:center;">Loading package information...</p>
                            </div>
                        </div>
                    </div>

                     <div class="settings-section" data-section="time" style="display:none;">
                        <h2>Time & language</h2>
                         <div style="margin-bottom:20px;">
                            <h1 style="font-size:32px; font-weight:300; margin:0;" id="current-time-big">10:42 AM</h1>
                            <p style="color:#666;" id="current-date-big">Wednesday, January 14, 2026</p>
                        </div>

                        <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-item-row" data-action="show-toast" data-message="Date & time settings coming soon">
                                <div class="setting-icon"><i class="ph ph-clock"></i></div>
                                <div class="setting-text"><h4>Date & time</h4><p>Time zones, automatic clock</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                             <div class="setting-item-row" data-action="show-toast" data-message="Language settings coming soon">
                                <div class="setting-icon"><i class="ph ph-translate"></i></div>
                                <div class="setting-text"><h4>Language & region</h4><p>System language, region format</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section" data-section="config" style="display:none;">
                         <h2>Config</h2>
                         
                         <h3 style="margin-top:10px;">System Settings</h3>
                         <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-item-row" data-action="show-toast" data-message="Startup apps configuration coming soon">
                                <div class="setting-icon"><i class="ph ph-rocket-launch"></i></div>
                                <div class="setting-text"><h4>Startup</h4><p>Apps that launch on boot</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                            <div class="setting-item-row" data-action="show-toast" data-message="Environment variables coming soon">
                                <div class="setting-icon"><i class="ph ph-terminal"></i></div>
                                <div class="setting-text"><h4>Environment</h4><p>Environment variables, PATH</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                        </div>

                         <h3 style="margin-top:25px;">Data & Backup</h3>
                         <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-item-row" data-action="export-settings">
                                <div class="setting-icon"><i class="ph ph-export"></i></div>
                                <div class="setting-text"><h4>Export Settings</h4><p>Download current configuration</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                            <div class="setting-item-row" data-action="import-settings">
                                <div class="setting-icon"><i class="ph ph-upload"></i></div>
                                <div class="setting-text"><h4>Import Settings</h4><p>Restore from backup file</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                            <div class="setting-item-row" data-action="reset-settings">
                                <div class="setting-icon" style="background:#ffebee;"><i class="ph ph-arrow-counter-clockwise" style="color:#d32f2f;"></i></div>
                                <div class="setting-text"><h4>Reset All Settings</h4><p>Restore to defaults</p></div>
                                <div class="arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                         </div>
                    </div>

                    <div class="settings-section" data-section="about" style="display:none;">
                        <h2>About</h2>
                        <div class="system-overview-card">
                             <div style="flex:1;">
                                <h3 id="sys-name-about">Linux Desktop</h3>
                                <p id="sys-uptime" style="color:#666; font-size:12px; margin-top:5px;">Uptime: Loading...</p>
                             </div>
                             <i class="ph ph-desktop" style="font-size:64px; color:#0078d4;"></i>
                        </div>

                        <div class="info-group" style="margin-top:20px;">
                            <h3>Device specifications</h3>
                            <div class="about-info">
                                <div class="about-row"><span>Device name</span><strong id="info-hostname">Loading...</strong></div>
                                <div class="about-row"><span>Processor</span><strong id="info-cpu">Loading...</strong></div>
                                <div class="about-row"><span>CPU Cores</span><strong id="info-cpu-cores">Loading...</strong></div>
                                <div class="about-row"><span>Installed RAM</span><strong id="info-ram">Loading...</strong></div>
                                <div class="about-row"><span>RAM Usage</span><strong id="info-ram-usage">Loading...</strong></div>
                                <div class="about-row"><span>Graphics</span><strong id="info-gpu">Loading...</strong></div>
                                <div class="about-row"><span>System type</span><strong id="info-arch">Loading...</strong></div>
                            </div>
                        </div>
                        
                        <div class="info-group" style="margin-top:20px;">
                            <h3>Storage</h3>
                            <div id="storage-info" class="about-info">
                                <p style="color:#888; text-align:center;">Loading storage information...</p>
                            </div>
                        </div>
                        
                        <div class="info-group" style="margin-top:20px;">
                            <h3>Linux specifications</h3>
                            <div class="about-info">
                                <div class="about-row"><span>OS Type</span><strong id="info-os-type">Loading...</strong></div>
                                <div class="about-row"><span>Platform</span><strong id="info-platform">Loading...</strong></div>
                                <div class="about-row"><span>Kernel</span><strong id="info-kernel">Loading...</strong></div>
                                <div class="about-row"><span>Node.js</span><strong id="info-nodejs">Loading...</strong></div>
                            </div>
                        </div>
                        
                        <div class="info-group" style="margin-top:20px;">
                            <h3>Network</h3>
                            <div id="network-info" class="about-info">
                                <p style="color:#888; text-align:center;">Loading network information...</p>
                            </div>
                        </div>

                        <div class="info-group" style="margin-top:30px; border-top:1px solid #ddd; padding-top:20px;">
                            <h3>Developer</h3>
                            <div class="about-info">
                                <div class="about-row"><span>Developed by</span><strong id="dev-name">LinuxUI Team</strong></div>
                                <div class="about-row"><span>Version</span><strong id="dev-version">1.0.0</strong></div>
                                <div class="about-row"><span>License</span><strong id="dev-license">MIT License</strong></div>
                                <div class="about-row"><span>Built with</span><strong id="dev-tech">Node.js, JavaScript, CSS</strong></div>
                                <div class="about-row"><span>Repository</span><strong id="dev-repo">github.com/linuxui</strong></div>
                            </div>
                            <p style="margin-top:15px; color:#666; font-size:12px; text-align:center;">
                                A modern Linux desktop environment for the web.<br>
                                © 2026 LinuxUI Team. All rights reserved.
                            </p>
                        </div>
                    </div>

                    <div class="settings-section" data-section="display" style="display:none;">
                        <button class="settings-btn" style="margin-bottom:15px; background:none; color:#0078d4; padding-left:0;">&larr; System</button>
                        <h2>Display</h2>
                        
                        <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                            <div class="setting-row" style="padding:15px; border-bottom:1px solid #f0f0f0;">
                                <div style="flex:1">
                                    <span>Scale & layout</span>
                                    <p style="margin:0; font-size:12px; color:#666;">Change the size of text, apps, and other items</p>
                                </div>
                                <select class="settings-select" id="display-scale">
                                    <option value="1">100% (Recommended)</option>
                                    <option value="1.1">110%</option>
                                    <option value="1.25">125%</option>
                                    <option value="0.9">90%</option>
                                </select>
                            </div>
                             <div class="setting-row" style="padding:15px;">
                                <div style="flex:1">
                                    <span>Lock Screen Timeout</span>
                                    <p style="margin:0; font-size:12px; color:#666;">Automatically lock screen after inactivity</p>
                                </div>
                                <select class="settings-select" id="display-autolock">
                                    <option value="0">Never</option>
                                    <option value="1">1 minute</option>
                                    <option value="5">5 minutes</option>
                                    <option value="15">15 minutes</option>
                                </select>
                            </div>
                        </div>
                         
                        <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; margin-top:20px; overflow:hidden;">
                            <div class="setting-row" style="padding:15px;">
                                <div style="flex:1"><span>Night light</span><p style="margin:0; font-size:12px; color:#666;">Use warmer colors to block blue light</p></div>
                                <label class="toggle-switch"><input type="checkbox" id="night-light-toggle"><span class="toggle-slider"></span></label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section" data-section="storage" style="display:none;">
                        <button class="settings-btn" style="margin-bottom:15px; background:none; color:#0078d4; padding-left:0;">&larr; System</button>
                        <h2>Storage</h2>
                        <div id="storage-details">
                            <div style="padding:40px; text-align:center;">
                                <i class="ph ph-spinner" style="animation:spin 1s linear infinite; font-size:24px;"></i>
                                <p style="color:#666;">Calculating storage usage...</p>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section" data-section="sound" style="display:none;">
                        <button class="settings-btn" style="margin-bottom:15px; background:none; color:#0078d4; padding-left:0;">&larr; System</button>
                        <h2>Sound</h2>
                         <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5;">
                             <div class="setting-row" style="padding:15px;">
                                <span>Volume</span>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <input type="range" min="0" max="100" value="65" class="settings-slider" id="volume-slider">
                                    <span id="volume-val">65%</span>
                                </div>
                            </div>
                         </div>
                    </div>

                    </div>
                </div>
            </div>
        `;
    }

    static async initInstance(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const toast = document.createElement('div');
        toast.className = 'settings-toast';
        toast.innerText = 'Settings Saved';
        win.querySelector('.settings-body').appendChild(toast);

        win.showToast = (msg) => {
            toast.innerText = msg;
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 3000);
        };

        win.querySelectorAll('.settings-nav-item[data-section]').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.switchSectionForInstance(windowId, section);
            });
        });

        const searchInput = win.querySelector('.settings-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                win.querySelectorAll('.settings-nav-item').forEach(item => {
                    const text = item.innerText.toLowerCase();
                    item.style.display = text.includes(term) ? 'flex' : 'none';
                });
            });
        }

        win.querySelectorAll('.settings-btn').forEach(btn => {
            if (btn.innerText.includes('System') && btn.innerText.includes('←')) {
                btn.onclick = () => this.switchSectionForInstance(windowId, 'system');
            }
        });

        win.querySelectorAll('button:not([onclick])').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.innerText.includes('Add device')) win.showToast('Scanning for devices...');
                else if (btn.innerText.includes('Rename')) win.showToast('This setting is managed by your organization.');
                else if (btn.innerText.includes('Copy')) {
                    navigator.clipboard.writeText('System Specs Copied');
                    win.showToast('Copied to clipboard');
                }
                else if (btn.innerText.includes('VPN')) win.showToast('Opening VPN Wizard...');
                else if (btn.innerText.includes('Edit')) win.showToast('Edit Config');
                else if (btn.innerHTML.includes('Properties')) this.switchSectionForInstance(windowId, 'about');
                else win.showToast('Action started...');
            });
        });

        const propsBtn = win.querySelector('.system-overview-card button');
        if (propsBtn) propsBtn.onclick = () => this.switchSectionForInstance(windowId, 'about');


        win.querySelectorAll('.setting-item-row, .setting-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                if (e.target.closest('.toggle-switch') || e.target.closest('button')) return;

                const action = card.dataset.action;
                const target = card.dataset.target;
                const text = card.querySelector('h4')?.innerText || '';

                if (action === 'navigate' && target) {
                    this.switchSectionForInstance(windowId, target);
                    return;
                }

                if (action === 'export-settings') {
                    try {
                        const res = await fetch('/api/settings/all');
                        const data = await res.json();
                        if (data.success) {
                            const blob = new Blob([JSON.stringify(data.settings, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'linuxui-settings.json';
                            a.click();
                            URL.revokeObjectURL(url);
                            win.showToast('Settings exported successfully');
                        }
                    } catch (err) {
                        win.showToast('Failed to export settings');
                    }
                    return;
                }

                if (action === 'import-settings') {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                            const text = await file.text();
                            const settings = JSON.parse(text);
                            win.showToast('Settings imported (requires restart)');
                        } catch (err) {
                            win.showToast('Invalid settings file');
                        }
                    };
                    input.click();
                    return;
                }

                if (action === 'reset-settings') {
                    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
                        try {
                            await fetch('/api/settings/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                            win.showToast('Settings reset to defaults');
                            location.reload();
                        } catch (err) {
                            win.showToast('Failed to reset settings');
                        }
                    }
                    return;
                }

                if (action === 'show-toast') {
                    const message = card.dataset.message || 'Feature coming soon';
                    win.showToast(message);
                    return;
                }

                const existingSections = ['system', 'connection', 'personalization', 'apps', 'time', 'config', 'unsupported', 'about', 'display', 'sound', 'storage'];

                if (text.includes('Display')) {
                    this.switchSectionForInstance(windowId, 'display');
                } else if (!action) {
                    win.showToast(`${text || 'Settings'} - Feature coming soon`);
                }
            });
        });

        const scaleSelect = win.querySelector('#display-scale');
        if (scaleSelect) {
            scaleSelect.addEventListener('change', (e) => {
                const scale = e.target.value;
                document.body.style.zoom = scale;
                win.showToast(`Display scale set to ${Math.round(scale * 100)}%`);
            });
        }

        const autoLockSelect = win.querySelector('#display-autolock');
        if (autoLockSelect) {
            autoLockSelect.addEventListener('change', (e) => {
                const text = e.target.options[e.target.selectedIndex].text;
                win.showToast(`Auto-lock set to ${text}`);
            });
        }


        win.querySelectorAll('.toggle-switch input').forEach(input => {
            input.addEventListener('change', (e) => {
                const card = input.closest('.setting-item-row') || input.closest('.setting-card') || input.closest('.setting-row');
                const title = card?.querySelector('h4, span')?.innerText || 'Setting';

                win.showToast(`${title} ${input.checked ? 'Enabled' : 'Disabled'}`);

                if (title.includes('Night light')) {
                    document.body.style.filter = input.checked ? 'sepia(30%)' : 'none';
                }
                if (input.closest('.settings-section[data-section="network"]')) {
                    const wifiStatus = win.querySelector('[data-section="network"] p span');
                    if (wifiStatus && title.includes('Wi-Fi')) {
                        wifiStatus.innerText = input.checked ? 'Connected, secure' : 'Wi-Fi is turned off';
                        wifiStatus.style.color = input.checked ? '#666' : '#999';
                    }
                }
            });
        });


        const handleSlider = (id, suffix = '%') => {
            const el = win.querySelector(`#${id}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    const valDisplay = win.querySelector(`#${id.replace('-slider', '-val')}`);
                    if (valDisplay) valDisplay.innerText = e.target.value + suffix;
                });
            }
        };
        handleSlider('brightness-slider');
        handleSlider('volume-slider');


        win.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', () => win.showToast('Setting applied'));
        });


        const wallpaperGrid = win.querySelector('.wallpaper-grid');
        const previewDesktop = win.querySelector('.preview-desktop');
        const previewLockscreen = win.querySelector('.preview-lockscreen');

        const updatePreviews = (desktopUrl, lockscreenUrl) => {
            if (previewDesktop && desktopUrl) {
                previewDesktop.style.backgroundImage = `url(${desktopUrl})`;
            }
            if (previewLockscreen && lockscreenUrl) {
                previewLockscreen.style.backgroundImage = `url(${lockscreenUrl})`;
            }
        };

        const saveWallpaperToServer = async (type, url) => {
            try {
                await fetch('/api/settings/wallpapers/set', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, url })
                });
            } catch (err) {
                console.error('[Settings] Failed to save wallpaper to server:', err);
            }
        };

        const refreshWallpapers = async () => {
            try {
                const [wallpapersRes, currentRes] = await Promise.all([
                    fetch('/api/settings/wallpapers'),
                    fetch('/api/settings/wallpapers/current')
                ]);

                const wallpapersData = await wallpapersRes.json();
                const currentData = await currentRes.json();

                if (!wallpapersData.success) {
                    throw new Error('Failed to load wallpapers');
                }

                const currentDesktop = currentData.success
                    ? currentData.wallpaper?.desktop
                    : localStorage.getItem('desktop-wallpaper');
                const currentLock = currentData.success
                    ? currentData.wallpaper?.lockscreen
                    : localStorage.getItem('lockscreen-wallpaper');

                updatePreviews(currentDesktop, currentLock);

                wallpaperGrid.innerHTML = '';

                const uploadBtn = document.createElement('div');
                uploadBtn.className = 'wallpaper-item upload-btn';
                uploadBtn.innerHTML = '<i class="ph ph-upload-simple" style="font-size:24px; color:#666;"></i><span style="font-size:11px; margin-top:5px; color:#666;">Upload</span>';
                uploadBtn.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f8f8f8; border:2px dashed #ccc;';

                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';

                uploadBtn.onclick = () => fileInput.click();

                fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append('wallpaper', file);

                    win.showToast('Uploading...');
                    try {
                        const upRes = await fetch('/api/settings/wallpapers/upload', {
                            method: 'POST',
                            body: formData
                        });
                        const upData = await upRes.json();
                        if (upData.success) {
                            win.showToast('Uploaded: ' + upData.file.name);
                            refreshWallpapers();
                        } else {
                            win.showToast('Upload failed: ' + (upData.error || 'Unknown error'));
                        }
                    } catch (err) {
                        console.error(err);
                        win.showToast('Error uploading');
                    }
                };

                wallpaperGrid.appendChild(fileInput);
                wallpaperGrid.appendChild(uploadBtn);

                if (wallpapersData.wallpapers.length === 0) {
                    const emptyMsg = document.createElement('div');
                    emptyMsg.style.cssText = 'grid-column: 2/-1; padding:20px; text-align:center; color:#888;';
                    emptyMsg.innerHTML = '<p>No wallpapers found. Upload an image to get started.</p>';
                    wallpaperGrid.appendChild(emptyMsg);
                    return;
                }

                wallpapersData.wallpapers.forEach(wp => {
                    const div = document.createElement('div');
                    div.className = 'wallpaper-item';
                    if (currentDesktop === wp.url) div.classList.add('selected');
                    div.style.backgroundImage = `url(${wp.url})`;
                    div.dataset.url = wp.url;
                    div.dataset.name = wp.name;
                    div.title = `${wp.name}\nClick: Set as Desktop\nRight-click: Set as Lock Screen`;

                    div.onclick = async () => {
                        win.querySelectorAll('.wallpaper-item').forEach(w => w.classList.remove('selected'));
                        div.classList.add('selected');

                        const desktop = document.getElementById('desktop');
                        if (desktop) {
                            desktop.style.backgroundImage = `url(${wp.url})`;
                        }
                        document.body.style.backgroundImage = `url(${wp.url})`;

                        if (previewDesktop) {
                            previewDesktop.style.backgroundImage = `url(${wp.url})`;
                        }

                        localStorage.setItem('desktop-wallpaper', wp.url);
                        await saveWallpaperToServer('desktop', wp.url);

                        win.showToast('Desktop background updated');
                    };

                    div.oncontextmenu = async (e) => {
                        e.preventDefault();

                        const ls = document.getElementById('lockscreen');
                        if (ls) {
                            ls.style.backgroundImage = `url(${wp.url})`;
                        }

                        if (previewLockscreen) {
                            previewLockscreen.style.backgroundImage = `url(${wp.url})`;
                        }

                        localStorage.setItem('lockscreen-wallpaper', wp.url);
                        await saveWallpaperToServer('lockscreen', wp.url);

                        win.showToast('Lock Screen background updated');
                    };

                    wallpaperGrid.appendChild(div);
                });
            } catch (err) {
                console.error('[Settings] Failed to load wallpapers:', err);
                wallpaperGrid.innerHTML = '<div style="grid-column:1/-1; padding:20px; text-align:center; color:#d32f2f;"><i class="ph ph-warning" style="font-size:24px;"></i><p>Failed to load wallpapers. Is the server running?</p></div>';
            }
        };

        refreshWallpapers();

        win.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', () => {
                win.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                win.showToast('Theme changed (Mock)');
            });
        });

        win.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                win.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                win.showToast('Accent color updated');
            });
        });


        const timeEl = win.querySelector('#current-time-big');
        const dateEl = win.querySelector('#current-date-big');
        if (timeEl && dateEl) {
            const updateTime = () => {
                const now = new Date();
                timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                dateEl.innerText = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            };
            updateTime();


            const interval = setInterval(updateTime, 1000);
            this.instances.get(windowId).timeInterval = interval;
        }

        await this.updateSystemInfo(windowId);
    }

    static switchSectionForInstance(windowId, section) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        if (state) state.currentSection = section;

        win.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
        const target = win.querySelector(`.settings-section[data-section="${section}"]`);
        if (target) target.style.display = 'block';

        win.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
        const navItem = win.querySelector(`.settings-nav-item[data-section="${section}"]`);
        if (navItem) navItem.classList.add('active');
    }

    static async updateSystemInfo(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const setText = (id, text) => {
            const el = win.querySelector(`#${id}`);
            if (el) el.innerText = text || 'N/A';
        };

        const setHtml = (id, html) => {
            const el = win.querySelector(`#${id}`);
            if (el) el.innerHTML = html;
        };

        try {
            const [sysRes, devRes, featRes] = await Promise.all([
                fetch('/api/settings/system/full'),
                fetch('/api/settings/developer'),
                fetch('/api/settings/features')
            ]);

            const sysData = await sysRes.json();
            const devData = await devRes.json();
            const featData = await featRes.json();

            if (sysData.success && sysData.system) {
                const sys = sysData.system;

                const formatUptime = (seconds) => {
                    const hrs = Math.floor(seconds / 3600);
                    const mins = Math.floor((seconds % 3600) / 60);
                    if (hrs > 24) {
                        const days = Math.floor(hrs / 24);
                        return `${days} day${days > 1 ? 's' : ''}, ${hrs % 24}h ${mins}m`;
                    }
                    return `${hrs}h ${mins}m`;
                };

                setText('info-hostname', sys.hostname);
                setText('info-cpu', sys.cpu?.model || 'Unknown');
                setText('info-cpu-cores', `${sys.cpu?.cores || 0} cores @ ${sys.cpu?.speed || 'N/A'}`);
                setText('info-ram', sys.memory?.total || 'Unknown');
                setText('info-ram-usage', `${sys.memory?.used || '?'} used (${sys.memory?.percentUsed || 0}%)`);
                setText('info-gpu', sys.gpu?.model || 'Not detected');
                setText('info-arch', `${sys.arch || 'x64'}-based processor`);

                setText('info-os-type', sys.osType || 'Linux');
                setText('info-platform', sys.platform || 'linux');
                setText('info-kernel', sys.osRelease || 'Unknown');
                setText('info-nodejs', sys.packages?.nodejs || 'Not installed');

                setText('sys-uptime', `Uptime: ${formatUptime(sys.uptime || 0)}`);
                setText('sys-name-about', sys.hostname || 'Linux Desktop');

                setText('sys-name-main', sys.hostname || 'Linux Desktop');
                const cpuShort = (sys.cpu?.model || 'CPU').split(' ').slice(0, 4).join(' ');
                setText('sys-model-main', `${cpuShort} | ${sys.memory?.total || '?'} RAM`);

                if (sys.storage && sys.storage.length > 0) {
                    let storageHtml = '';
                    sys.storage.forEach(s => {
                        storageHtml += `<div class="about-row"><span>${s.mount || s.device}</span><strong>${s.used || '?'} / ${s.size || '?'} (${s.percentUsed || '?'})</strong></div>`;
                    });
                    setHtml('storage-info', storageHtml || '<p style="color:#888;">No storage info</p>');

                    const storageDetails = win.querySelector('#storage-details');
                    if (storageDetails) {
                        let detailsHtml = '<div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">';
                        sys.storage.forEach(s => {
                            const percent = parseInt(s.percentUsed || 0);
                            let color = '#0078d4';
                            if (percent > 75) color = '#f7630c';
                            if (percent > 90) color = '#d13438';

                            detailsHtml += `
                                <div class="setting-row" style="padding:20px; border-bottom:1px solid #f0f0f0; display:block;">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                        <div style="display:flex; align-items:center; gap:12px;">
                                            <div style="width:40px; height:40px; background:#f0f0f0; border-radius:4px; display:flex; align-items:center; justify-content:center;">
                                                <i class="ph ph-hard-drives" style="font-size:24px; color:#555;"></i>
                                            </div>
                                            <div>
                                                <h4 style="margin:0; font-size:15px;">${s.mount || 'Local Disk'} (${s.device})</h4>
                                                <p style="margin:0; font-size:12px; color:#666;">${s.fsType || 'NTFS'} • ${s.used} used of ${s.size}</p>
                                            </div>
                                        </div>
                                        <span style="font-size:14px; font-weight:600; color:${color};">${s.percentUsed}</span>
                                    </div>
                                    <div style="height:6px; background:#e5e5e5; border-radius:3px; overflow:hidden;">
                                        <div style="width:${s.percentUsed}; height:100%; background:${color};"></div>
                                    </div>
                                </div>
                            `;
                        });
                        detailsHtml += '</div>';
                        detailsHtml += `
                            <h3 style="margin-top:20px;">Storage management</h3>
                            <div class="setting-group-container" style="background:white; border-radius:8px; border:1px solid #e5e5e5; overflow:hidden;">
                                <div class="setting-item-row" data-action="cleanup">
                                    <div class="setting-icon"><i class="ph ph-broom"></i></div>
                                    <div class="setting-text"><h4>Storage Sense</h4><p>Automatically free up space</p></div>
                                    <label class="toggle-switch"><input type="checkbox"><span class="toggle-slider"></span></label>
                                </div>
                            </div>
                        `;
                        storageDetails.innerHTML = detailsHtml;
                    }
                }

                if (sys.network) {
                    let netHtml = `<div class="about-row"><span>WiFi</span><strong>${sys.network.wifi ? 'Available' : 'Not detected'}</strong></div>`;
                    netHtml += `<div class="about-row"><span>Ethernet</span><strong>${sys.network.ethernet ? 'Available' : 'Not detected'}</strong></div>`;
                    if (sys.network.interfaces && sys.network.interfaces.length > 0) {
                        sys.network.interfaces.forEach(iface => {
                            netHtml += `<div class="about-row"><span>${iface.name}</span><strong>${iface.address}</strong></div>`;
                        });
                    }
                    setHtml('network-info', netHtml);
                }

                if (sys.packages) {
                    let pkgHtml = '';
                    const pkgOrder = ['nodejs', 'npm', 'python', 'pip', 'git', 'kernel', 'pacman', 'apt', 'docker', 'gcc', 'go', 'rust', 'java'];
                    pkgOrder.forEach(pkg => {
                        const ver = sys.packages[pkg];
                        if (ver && ver !== 'Not installed' && ver !== 'N/A') {
                            pkgHtml += `<div class="about-row"><span style="text-transform:capitalize;">${pkg}</span><strong>${ver}</strong></div>`;
                        }
                    });
                    setHtml('packages-list', pkgHtml || '<p style="color:#888;">No packages detected</p>');
                }

                if (sys.features || featData.success) {
                    const features = sys.features || featData.features;
                    let unsupportedHtml = '';
                    const featureNames = { wifi: 'WiFi', bluetooth: 'Bluetooth', audio: 'Audio', gpu: 'GPU', ethernet: 'Ethernet' };

                    for (const [key, available] of Object.entries(features)) {
                        const navItem = win.querySelector(`.settings-nav-item[data-feature="${key}"]`);
                        if (navItem && !available) {
                            navItem.style.opacity = '0.5';
                            navItem.title = `${featureNames[key] || key} not available on this system`;
                        }

                        if (!available) {
                            unsupportedHtml += `
                                <div class="setting-item-row">
                                    <div class="setting-icon" style="background:#fff3e0;"><i class="ph ph-warning" style="color:#ff9800;"></i></div>
                                    <div class="setting-text"><h4>${featureNames[key] || key}</h4><p>Not available - hardware not detected</p></div>
                                </div>`;
                        }
                    }

                    if (unsupportedHtml) {
                        setHtml('unsupported-list', unsupportedHtml);
                    } else {
                        setHtml('unsupported-list', '<div style="padding:20px; text-align:center; color:#4caf50;"><i class="ph ph-check-circle" style="font-size:32px;"></i><p>All features are available on this system!</p></div>');
                    }

                    const isDocker = features.docker || false;
                    const dockerNotice = win.querySelector('#docker-notice');
                    const wifiToggle = win.querySelector('#wifi-toggle');
                    const bluetoothToggle = win.querySelector('#bluetooth-toggle');
                    const wifiRow = win.querySelector('#wifi-row');
                    const bluetoothRow = win.querySelector('#bluetooth-row');
                    const connectionStatus = win.querySelector('#connection-status');

                    if (dockerNotice && isDocker) {
                        dockerNotice.style.display = 'block';
                    }

                    const wifiStatus = win.querySelector('#wifi-status');
                    if (wifiStatus) {
                        if (isDocker) {
                            wifiStatus.textContent = 'Not available in Docker';
                            if (wifiToggle) { wifiToggle.disabled = true; wifiToggle.checked = false; }
                            if (wifiRow) wifiRow.style.opacity = '0.5';
                        } else if (features.wifi) {
                            wifiStatus.textContent = 'Available';
                            if (wifiToggle) wifiToggle.checked = true;
                        } else {
                            wifiStatus.textContent = 'Not detected';
                            if (wifiToggle) { wifiToggle.disabled = true; wifiToggle.checked = false; }
                            if (wifiRow) wifiRow.style.opacity = '0.5';
                        }
                    }

                    const bluetoothStatus = win.querySelector('#bluetooth-status');
                    if (bluetoothStatus) {
                        if (isDocker) {
                            bluetoothStatus.textContent = 'Not available in Docker';
                            if (bluetoothToggle) { bluetoothToggle.disabled = true; bluetoothToggle.checked = false; }
                            if (bluetoothRow) bluetoothRow.style.opacity = '0.5';
                        } else if (features.bluetooth) {
                            bluetoothStatus.textContent = 'Available';
                            if (bluetoothToggle) bluetoothToggle.checked = true;
                        } else {
                            bluetoothStatus.textContent = 'Not detected';
                            if (bluetoothToggle) { bluetoothToggle.disabled = true; bluetoothToggle.checked = false; }
                            if (bluetoothRow) bluetoothRow.style.opacity = '0.5';
                        }
                    }

                    const ethernetStatus = win.querySelector('#ethernet-status');
                    if (ethernetStatus) {
                        ethernetStatus.textContent = features.ethernet ? 'Connected' : 'Not connected';
                    }

                    if (connectionStatus) {
                        if (isDocker) {
                            connectionStatus.textContent = 'Running in Docker container';
                        } else if (features.wifi || features.ethernet) {
                            connectionStatus.textContent = 'Connected';
                        } else {
                            connectionStatus.textContent = 'No network connection';
                        }
                    }
                }
            }

            if (devData.success && devData.developer) {
                const dev = devData.developer;
                setText('dev-name', dev.name || 'LinuxUI Team');
                setText('dev-version', dev.version || '1.0.0');
                setText('dev-license', dev.license || 'MIT License');
                setText('dev-tech', dev.builtWith?.join(', ') || 'Node.js, JavaScript');
                setText('dev-repo', dev.repository || 'github.com/linuxui');
            }

        } catch (e) {
            console.error('[Settings] Failed to fetch system info:', e);
            setHtml('unsupported-list', '<div style="padding:20px; text-align:center; color:#f44336;"><i class="ph ph-warning" style="font-size:32px;"></i><p>Failed to load system information</p></div>');
        }
    }

    static switchSection(section) {
        this.currentSection = section;
        document.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
        document.getElementById('settings-' + section).style.display = 'block';

        // Update nav
        document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`.settings-nav-item[data-section="${section}"]`)?.classList.add('active');
    }
}
