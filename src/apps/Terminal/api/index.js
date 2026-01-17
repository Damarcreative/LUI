export const routes = {

    'POST /exec': async (req) => {
        const { command, cwd = '/home/user' } = req.body;

        if (!command) {
            return { success: false, error: 'Command is required' };
        }

        try {
            const { FileSystem } = await import('../../../system/lib/FileSystem.js');

            const parts = command.trim().split(/\s+/);
            const cmd = parts[0];
            const args = parts.slice(1);

            let output = '';
            let exitCode = 0;

            switch (cmd) {
                case 'ls': {
                    const targetPath = args[0] || cwd;
                    const content = FileSystem.resolvePath(targetPath);

                    if (!content) {
                        output = `ls: cannot access '${targetPath}': No such file or directory`;
                        exitCode = 1;
                    } else if (typeof content !== 'object') {
                        output = targetPath.split('/').pop();
                    } else {
                        const items = Object.entries(content);
                        if (items.length === 0) {
                            output = '';
                        } else {
                            const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
                            const filtered = items.filter(([name]) => showHidden || !name.startsWith('.'));

                            if (args.includes('-l') || args.includes('-la') || args.includes('-al')) {
                                output = filtered.map(([name, value]) => {
                                    const isDir = typeof value === 'object';
                                    const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                                    const size = isDir ? '4096' : String(typeof value === 'string' ? value.length : 0).padStart(5);
                                    return `${perm}  1 user user ${size} Jan 12 10:00 ${name}`;
                                }).join('\n');
                            } else {
                                output = filtered.map(([name]) => name).join('  ');
                            }
                        }
                    }
                    break;
                }

                case 'pwd':
                    output = cwd;
                    break;

                case 'cd': {
                    const targetPath = args[0] || '/home/user';
                    let newPath = targetPath;

                    if (!targetPath.startsWith('/')) {
                        newPath = cwd === '/' ? `/${targetPath}` : `${cwd}/${targetPath}`;
                    }

                    if (targetPath === '..') {
                        const parts = cwd.split('/').filter(p => p);
                        parts.pop();
                        newPath = '/' + parts.join('/') || '/';
                    }

                    const content = FileSystem.resolvePath(newPath);
                    if (!content) {
                        output = `cd: ${targetPath}: No such file or directory`;
                        exitCode = 1;
                    } else if (typeof content !== 'object') {
                        output = `cd: ${targetPath}: Not a directory`;
                        exitCode = 1;
                    } else {
                        output = '';

                    }
                    break;
                }

                case 'cat': {
                    if (!args[0]) {
                        output = 'cat: missing operand';
                        exitCode = 1;
                    } else {
                        const filePath = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`;
                        const content = FileSystem.readFile(filePath);
                        if (content === null) {
                            output = `cat: ${args[0]}: No such file or directory`;
                            exitCode = 1;
                        } else {
                            output = content;
                        }
                    }
                    break;
                }

                case 'mkdir': {
                    if (!args[0]) {
                        output = 'mkdir: missing operand';
                        exitCode = 1;
                    } else {
                        const dirPath = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`;
                        const success = FileSystem.mkdir(dirPath);
                        if (!success) {
                            output = `mkdir: cannot create directory '${args[0]}'`;
                            exitCode = 1;
                        }
                    }
                    break;
                }

                case 'touch': {
                    if (!args[0]) {
                        output = 'touch: missing file operand';
                        exitCode = 1;
                    } else {
                        const filePath = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`;
                        FileSystem.writeFile(filePath, '');
                    }
                    break;
                }

                case 'rm': {
                    if (!args[0]) {
                        output = 'rm: missing operand';
                        exitCode = 1;
                    } else {
                        const targetPath = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`;
                        const success = FileSystem.delete(targetPath);
                        if (!success) {
                            output = `rm: cannot remove '${args[0]}': No such file or directory`;
                            exitCode = 1;
                        }
                    }
                    break;
                }

                case 'echo':
                    output = args.join(' ');
                    break;

                case 'whoami':
                    output = 'user';
                    break;

                case 'hostname':
                    output = 'linux-webui';
                    break;

                case 'date':
                    output = new Date().toString();
                    break;

                case 'uname':
                    if (args.includes('-a')) {
                        output = 'Linux linux-webui 5.15.0-generic #1 SMP x86_64 GNU/Linux';
                    } else {
                        output = 'Linux';
                    }
                    break;

                case 'clear':
                    output = '\x1Bc';
                    break;

                case 'history':
                    output = '  1  ls\n  2  pwd\n  3  cd /home/user\n  4  ' + command;
                    break;

                case 'help':
                    output = `Available commands:
  ls [-la] [path]    List directory contents
  cd [path]          Change directory
  pwd                Print working directory
  cat <file>         Display file content
  mkdir <dir>        Create directory
  touch <file>       Create empty file
  rm <file>          Remove file
  echo <text>        Print text
  whoami             Print current user
  hostname           Print hostname
  date               Print current date
  uname [-a]         Print system info
  clear              Clear screen
  history            Show command history
  help               Show this help`;
                    break;

                default:
                    output = `${cmd}: command not found`;
                    exitCode = 127;
            }

            return {
                success: exitCode === 0,
                command: command,
                cwd: cwd,
                output: output,
                exitCode: exitCode
            };
        } catch (error) {
            return {
                success: false,
                command: command,
                output: `Error: ${error.message}`,
                exitCode: 1
            };
        }
    },


    'GET /history': async (req) => {

        return {
            success: true,
            history: []
        };
    },


    'GET /env': async (req) => {
        return {
            success: true,
            env: {
                USER: 'user',
                HOME: '/home/user',
                SHELL: '/bin/bash',
                PWD: '/home/user',
                PATH: '/usr/local/bin:/usr/bin:/bin',
                TERM: 'xterm-256color',
                LANG: 'en_US.UTF-8'
            }
        };
    },


    'GET /sysinfo': async (req) => {
        return {
            success: true,
            system: {
                hostname: 'linux-webui',
                kernel: '5.15.0-generic',
                os: 'Linux WebUI',
                arch: 'x86_64',
                uptime: '2:34:56'
            }
        };
    }
};
