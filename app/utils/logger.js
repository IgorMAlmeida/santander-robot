import winston from 'winston';
import path from 'path';
import util from 'util';

// Função para obter informações de linha/arquivo de um erro
const getErrorFileInfo = (error) => {
  if (!error || !error?.stack) return null;
  
  const stackLines = error?.stack.split('\n');
  if (stackLines.length < 2) return null;
  
  // Pegar a linha do erro (normalmente a segunda linha do stack trace)
  // Format: at functionName (/path/to/file.js:line:column)
  const errorLine = stackLines.find(line => line.includes('.js:'));
  if (!errorLine) return null;
  
  const match = errorLine.match(/\((.+?):(\d+):(\d+)\)/) || errorLine.match(/at\s+(.+?):(\d+):(\d+)/);
  if (!match) return null;
  
  const [, filePath, line, column] = match;
  const fileName = path.basename(filePath);
  
  return { fileName, filePath, line, column };
};

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on NODE_ENV
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Formatter personalizado que adiciona mais detalhes
const detailedFormatter = winston.format((info) => {
  // Adiciona informações sobre o local do erro
  if (info.error && info.error instanceof Error) {
    const errorInfo = getErrorFileInfo(info.error);
    if (errorInfo) {
      info.errorLocation = `${errorInfo.fileName}:${errorInfo.line}:${errorInfo.column}`;
    }
    
    // Garantir que temos a stack completa
    info.stack = info.error?.stack;
  }
  
  // Melhorar formatação de objetos data
  if (info.data) {
    if (typeof info.data === 'object') {
      // Não queremos JSON.stringify aqui para manter a formatação melhor
      info.formattedData = util.inspect(info.data, { depth: 3, colors: false });
    } else {
      info.formattedData = info.data;
    }
  }
  
  // Adicionar informações sobre o chamador
  const stack = new Error()?.stack;
  const callerInfo = getErrorFileInfo({ stack });
  if (callerInfo && !info.caller) {
    info.caller = `${callerInfo.fileName}:${callerInfo.line}`;
  }
  
  return info;
});

// Custom format
const format = winston.format.combine(
  detailedFormatter(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    let message = `${info.timestamp} ${info.level}: `;
    
    // Adicionar informações do chamador
    if (info.caller) {
      message += `[${info.caller}] `;
    }
    
    // Mensagem principal
    message += info.message;
    
    // Adicionar detalhes de dados
    if (info.formattedData) {
      message += `\n  Data: ${info.formattedData}`;
    } else if (info.data) {
      message += ` - ${JSON.stringify(info.data)}`;
    }
    
    // Adicionar localização do erro
    if (info.errorLocation) {
      message += `\n  Localização do erro: ${info.errorLocation}`;
    }
    
    // Adicionar stack trace para erros
    if (info.level === 'error' && info?.stack) {
      message += `\n  Stack: ${info?.stack}`;
    }
    
    return message;
  })
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format
    ),
  }),
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // File transport for all logs
  new winston.transports.File({ 
    filename: 'logs/all.log' 
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Adicionar métodos utilitários
logger.logError = (message, error, data = {}) => {
  logger.error(message, {
    error,
    data,
    stack: error?.stack
  });
};

logger.logMethodEntry = (methodName, data = {}) => {
  logger.debug(`Iniciando ${methodName}`, { data });
};

logger.logMethodExit = (methodName, result = null, data = {}) => {
  const logData = { ...data };
  if (result) {
    logData.result = result;
  }
  logger.debug(`Concluído ${methodName}`, { data: logData });
};

export default logger; 