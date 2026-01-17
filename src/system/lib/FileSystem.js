export const fileSystem = {
    "home": {
        "user": {
            "Documents": {
                "Work": {
                    "Project_Alpha": {
                        "Specs.docx": "file",
                        "Assets": {
                            "Logo.png": "file",
                            "Banner.jpg": "file"
                        }
                    },
                    "Project_Beta": {},
                    "Report_2025.pdf": "file"
                },
                "Personal": {
                    "Resume.pdf": "file"
                },
                "Notes.txt": "file"
            },
            "Downloads": {
                "installer_v2.exe": "file",
                "image_backup.zip": "file"
            },
            "Music": {
                "Playlists": {
                    "Chill_Vibes": {},
                    "Running": {}
                },
                "Song_01.mp3": "file",
                "Song_02.mp3": "file"
            },
            "Pictures": {
                "Vacation_Bali": {
                    "DSC_001.jpg": "file",
                    "DSC_002.jpg": "file",
                    "DSC_003.jpg": "file"
                },
                "Wallpaper.png": "file"
            },
            "Videos": {
                "Movies": {},
                "Tutorials": {
                    "Javascript_Basics.mp4": "file"
                }
            },
            "Desktop": {}
        }
    },
    "mnt": {
        "vol1": {
            "Backup_Data": {},
            "Games": {
                "Steam": {},
                "Epic": {}
            }
        },
        "linux-os": {
            "bin": {},
            "etc": {},
            "usr": {},
            "var": {}
        }
    }
};

export class FileSystem {
    static resolvePath(path) {
        const parts = path.split('/').filter(p => p);
        let current = fileSystem;
        for (const part of parts) {
            if (current[part] && typeof current[part] === 'object') {
                current = current[part];
            } else {
                return null;
            }
        }
        return current;
    }
}
