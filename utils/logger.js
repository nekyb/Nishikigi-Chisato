import chalk from 'chalk';
import moment from 'moment-timezone';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["SUCCESS"] = 4] = "SUCCESS";
})(LogLevel || (LogLevel = {}));
class Logger {
    config;
    logFilePath;
    constructor(config) {
        this.config = {
            level: LogLevel.INFO,
            saveToFile: process.env.NODE_ENV === 'production',
            logDir: path.join(process.cwd(), 'logs'),
            timestampFormat: 'DD/MM/YYYY HH:mm:ss',
            timezone: 'America/Bogota',
            ...config
        };
        if (this.config.saveToFile && !fs.existsSync(this.config.logDir)) {
            fs.mkdirSync(this.config.logDir, { recursive: true });
        }
        const dateStr = moment().format('YYYY-MM-DD');
        this.logFilePath = path.join(this.config.logDir, `bot-${dateStr}.log`);
    }
    getTimestamp() {
        return moment().tz(this.config.timezone).format(this.config.timestampFormat);
    }
    writeToFile(message) {
        if (!this.config.saveToFile)
            return;
        try {
            const logMessage = `[${this.getTimestamp()}] ${message}\n`;
            fs.appendFileSync(this.logFilePath, logMessage, 'utf8');
        }
        catch (error) {
            console.error('Error escribiendo log:', error);
        }
    }
    formatMessage(level, message, ...args) {
        const argsStr = args.length > 0 ? ' ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') : '';
        return `[${level}] ${message}${argsStr}`;
    }
    debug(message, ...args) {
        if (this.config.level > LogLevel.DEBUG)
            return;
        const formatted = this.formatMessage('DEBUG', message, ...args);
        console.log(chalk.gray(`[${this.getTimestamp()}] ${formatted}`));
        this.writeToFile(formatted);
    }
    info(message, ...args) {
        if (this.config.level > LogLevel.INFO)
            return;
        const formatted = this.formatMessage('INFO', message, ...args);
        console.log(chalk.cyan(`[${this.getTimestamp()}] ${formatted}`));
        this.writeToFile(formatted);
    }
    warn(message, ...args) {
        if (this.config.level > LogLevel.WARN)
            return;
        const formatted = this.formatMessage('WARN', message, ...args);
        console.log(chalk.yellow(`[${this.getTimestamp()}] ${formatted}`));
        this.writeToFile(formatted);
    }
    error(message, ...args) {
        if (this.config.level > LogLevel.ERROR)
            return;
        const formatted = this.formatMessage('ERROR', message, ...args);
        console.log(chalk.red(`[${this.getTimestamp()}] ${formatted}`));
        this.writeToFile(formatted);
    }
    success(message, ...args) {
        const formatted = this.formatMessage('SUCCESS', message, ...args);
        console.log(chalk.green(`[${this.getTimestamp()}] ${formatted}`));
        this.writeToFile(formatted);
    }
    command(user, command, group) {
        const groupStr = group ? ` [Grupo: ${group}]` : ' [Privado]';
        const message = `Usuario: ${user}${groupStr} ejecutó: ${command}`;
        console.log(chalk.magenta(`[${this.getTimestamp()}] [COMANDO] ${message}`));
        this.writeToFile(`[COMANDO] ${message}`);
    }
    event(eventName, details) {
        const message = `${eventName}: ${details}`;
        console.log(chalk.blue(`[${this.getTimestamp()}] [EVENTO] ${message}`));
        this.writeToFile(`[EVENTO] ${message}`);
    }
    connection(status, details) {
        const message = `Estado: ${status}${details ? ` - ${details}` : ''}`;
        let color = chalk.white;
        if (status === 'conectado' || status === 'open')
            color = chalk.green;
        if (status === 'desconectado' || status === 'close')
            color = chalk.red;
        if (status === 'conectando' || status === 'connecting')
            color = chalk.yellow;
        console.log(color(`[${this.getTimestamp()}] [CONEXIÓN] ${message}`));
        this.writeToFile(`[CONEXIÓN] ${message}`);
    }
    database(operation, details) {
        const message = `${operation}${details ? `: ${details}` : ''}`;
        console.log(chalk.blueBright(`[${this.getTimestamp()}] [DATABASE] ${message}`));
        this.writeToFile(`[DATABASE] ${message}`);
    }
    separator(char = '─', length = 50) {
        console.log(chalk.gray(char.repeat(length)));
    }
    banner(text) {
        const lines = text.split('\n');
        lines.forEach(line => {
            console.log(chalk.magenta(line));
        });
    }
    cleanOldLogs(daysToKeep = 7) {
        if (!this.config.saveToFile)
            return;
        try {
            const files = fs.readdirSync(this.config.logDir);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
            files.forEach(file => {
                if (!file.startsWith('bot-') || !file.endsWith('.log'))
                    return;
                const filePath = path.join(this.config.logDir, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.mtime.getTime();
                if (age > maxAge) {
                    fs.unlinkSync(filePath);
                    this.info(`Log antiguo eliminado: ${file}`);
                }
            });
        }
        catch (error) {
            this.error('Error limpiando logs antiguos:', error);
        }
    }
    setLevel(level) {
        this.config.level = level;
    }
    getLogFilePath() {
        return this.logFilePath;
    }
}
export const logger = new Logger({
    level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
    saveToFile: true
});
export default Logger;