import './style.css';
import { WindowManager } from '../../system/components/WindowManager/WindowManager.js';

export class MediaCenter {
    static currentFilter = 'all';
    static mockMedia = [
        { id: 1, name: 'Summer Vibes', artist: 'Chill Artist', type: 'music', thumb: '#1db954', duration: '3:45' },
        { id: 2, name: 'Night Drive', artist: 'Lo-Fi Beats', type: 'music', thumb: '#8e44ad', duration: '4:21' },
        { id: 3, name: 'Ocean Waves', artist: 'Nature Sounds', type: 'music', thumb: '#3498db', duration: '5:10' },
        { id: 4, name: 'Vacation 2025', artist: 'Home Video', type: 'video', thumb: '#e74c3c', duration: '15:32' },
        { id: 5, name: 'Sunset Beach', artist: 'Photo Album', type: 'photo', thumb: '#e67e22' },
    ];
    static instances = new Map();

    static createNewInstance(options = {}) {
        const icon = '<i class="ph ph-play-circle" style="font-size:16px; color:#ff4081;"></i>';

        const windowContent = this.getWindowContent();

        const windowId = WindowManager.createWindow('media-app', {
            title: 'Media Center',
            width: 900,
            height: 620,
            content: windowContent,
            icon: icon
        });

        this.instances.set(windowId, { currentFilter: 'all' });
        this.initInstance(windowId);

        console.log(`[MediaCenter] Created new instance: ${windowId}`);
        return windowId;
    }

    static getWindowContent() {
        return `
            <div class="media-body" style="display:flex; flex:1; overflow:hidden;">
                <div class="media-sidebar" style="width:200px; background:rgba(0,0,0,0.03); border-right:1px solid rgba(0,0,0,0.1); display:flex; flex-direction:column;">
                    <div class="media-nav-group" style="flex:1; padding:10px;">
                        <div class="media-nav-title">LIBRARY</div>
                        <div class="media-nav-item active" data-filter="all">
                            <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:currentColor; margin-right:8px;"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
                            All Media
                        </div>
                        <div class="media-nav-item" data-filter="music">
                            <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:currentColor; margin-right:8px;"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                            Music
                        </div>
                        <div class="media-nav-item" data-filter="video">
                            <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:currentColor; margin-right:8px;"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
                            Videos
                        </div>
                        <div class="media-nav-item" data-filter="photo">
                            <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:currentColor; margin-right:8px;"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                            Photos
                        </div>
                    </div>
                </div>
                <div class="media-main" style="flex:1; display:flex; flex-direction:column; background:#fff;">
                    <div class="media-toolbar" style="padding:10px 15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-weight:600; font-size:16px;" class="media-current-view">All Media</div>
                        <div style="font-size:12px; color:#666;">Items: <span class="media-count">5</span></div>
                    </div>
                    <div class="media-grid-container media-grid" style="flex:1; overflow-y:auto; padding:20px; display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:15px;"></div>
                </div>
            </div>
            <div class="media-player-bar" style="height:70px; background:#f8f8f8; border-top:1px solid #eee; display:flex; align-items:center; padding:0 15px; gap:20px;">
                <div class="mp-info" style="display:flex; align-items:center; gap:10px; width:200px;">
                    <div class="mp-art" style="width:50px; height:50px; background:#ddd; border-radius:4px;"></div>
                    <div class="mp-text">
                        <div class="mp-title" style="font-weight:500;">Select media...</div>
                        <div class="mp-artist" style="font-size:12px; color:#666;">--</div>
                    </div>
                </div>
                <div class="mp-controls-area" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:5px;">
                    <div class="mp-buttons" style="display:flex; gap:10px;">
                        <button class="mp-btn player-prev">⏮</button>
                        <button class="mp-btn player-play">▶</button>
                        <button class="mp-btn player-next">⏭</button>
                    </div>
                </div>
            </div>
        `;
    }

    static initInstance(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        win.querySelectorAll('.media-nav-item[data-filter]').forEach(item => {
            item.addEventListener('click', () => {
                win.querySelectorAll('.media-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.renderMediaForInstance(windowId, item.dataset.filter);
            });
        });

        this.renderMediaForInstance(windowId, 'all');

        const playBtn = win.querySelector('.player-play');
        if (playBtn) playBtn.onclick = () => this.togglePlayForInstance(windowId);
    }

    static renderMediaForInstance(windowId, filter) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const state = this.instances.get(windowId);
        if (state) state.currentFilter = filter;

        const grid = win.querySelector('.media-grid');
        const viewLabel = win.querySelector('.media-current-view');
        const countEl = win.querySelector('.media-count');

        let filtered = this.mockMedia;
        if (filter !== 'all') {
            filtered = this.mockMedia.filter(m => m.type === filter);
        }

        const labels = { 'all': 'All Media', 'music': 'Music', 'video': 'Videos', 'photo': 'Photos' };
        if (viewLabel) viewLabel.innerText = labels[filter] || 'All Media';
        if (countEl) countEl.innerText = filtered.length;

        if (grid) {
            grid.innerHTML = filtered.map(item => `
                <div class="media-item" data-name="${item.name}" data-artist="${item.artist}" style="cursor:pointer;">
                    <div class="media-thumb" style="background:${item.thumb}; height:120px; border-radius:6px; display:flex; align-items:center; justify-content:center;">
                        ${item.duration ? `<div class="media-duration" style="background:rgba(0,0,0,0.7); color:white; padding:2px 6px; border-radius:3px; font-size:11px;">${item.duration}</div>` : ''}
                    </div>
                    <div class="media-info" style="padding:8px 0;">
                        <div class="media-title" style="font-weight:500; font-size:13px;">${item.name}</div>
                        <div class="media-subtitle" style="font-size:11px; color:#666;">${item.artist}</div>
                    </div>
                </div>
            `).join('');

            grid.querySelectorAll('.media-item').forEach(item => {
                item.addEventListener('click', () => {
                    const title = win.querySelector('.mp-title');
                    const artist = win.querySelector('.mp-artist');
                    const art = win.querySelector('.mp-art');
                    if (title) title.innerText = item.dataset.name;
                    if (artist) artist.innerText = item.dataset.artist;
                    if (art) art.style.background = item.querySelector('.media-thumb').style.background;
                });
            });
        }
    }

    static togglePlayForInstance(windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        const btn = win.querySelector('.player-play');
        if (!btn) return;

        const isPlaying = btn.dataset.playing === 'true';
        btn.dataset.playing = !isPlaying;
        btn.innerText = isPlaying ? '▶' : '⏸';
    }
}
