const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { readFile, utils } = require('xlsx');
const axios = require('axios');
const cheerio = require('cheerio');
const { writeFileSync, existsSync, appendFileSync } = require('fs');

let mainWindow;
const CACHE_FILE = path.join(app.getPath('userData'), 'emails.txt');
const MAX_CONCURRENT = 5;

if (existsSync(CACHE_FILE)) writeFileSync(CACHE_FILE, '');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'mailery.ico'),
    title: 'Mailery - Email Extractor',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function extractRootDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function processWebsite(url, processedPages) {
  const emails = new Set();
  const rootDomain = extractRootDomain(url);

  if (!rootDomain || rootDomain.includes('google') || rootDomain.includes('gstatic')) return [];

  try {
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    const $ = cheerio.load(data);

    $('a[href^="mailto:"]').each((i, el) => {
      const email = $(el).attr('href').split(':')[1];
      if (validateEmail(email)) {
        emails.add(email);
        mainWindow.webContents.send('email-found', email);
      }
    });

    const contentEmails = data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    contentEmails.forEach(email => {
      if (validateEmail(email) && isNotFileName(email)) {
        emails.add(email);
        mainWindow.webContents.send('email-found', email);
      }
    });
    
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const fullUrl = new URL(href, url).toString();
          if (extractRootDomain(fullUrl) === rootDomain) {
            links.push(fullUrl);
          }
        } catch {}
      }
    });

    const pageLimit = 3;
    let pageCount = 0;
    for (const link of links.slice(0, 2)) {
      if (!processedPages.has(link) && pageCount < pageLimit) {
        processedPages.add(link);
        pageCount++;
        await processWebsite(link, processedPages);
      }
    }
  } catch (err) {
    console.error(`Error processing ${url}:`, err.message);
  }

  return Array.from(emails);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email) && !/[\s\(\)]/.test(email);
}

function isNotFileName(value) {
  const fileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
  return !fileExtensions.some(ext => value.includes('@') && value.includes(ext));
}

ipcMain.handle('process-files', async (event, files) => {
  const websites = new Set();
  const allEmails = new Set();
  writeFileSync(CACHE_FILE, '');

  for (const file of files) {
    try {
      const workbook = readFile(file.path);
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = utils.sheet_to_json(worksheet);
        data.forEach(row => {
          Object.values(row).forEach(value => {
            const strVal = String(value).trim();
            if (/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(strVal)) {
              websites.add(strVal);
            }
          });
        });
      });
    } catch (err) {
      console.error(`Error processing file: ${file.path}`, err);
    }
  }

  const processQueue = async () => {
    const queue = Array.from(websites);
    const results = [];

    const processLimitedQueue = async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        if (!url) continue;

        try {
          const emails = await processWebsite(url, new Set());
          emails.forEach(email => {
            if (!allEmails.has(email)) {
              allEmails.add(email);
              appendFileSync(CACHE_FILE, email + '\n');
            }
          });
        } catch (err) {
          console.error(`Error processing ${url}:`, err.message);
        }
      }
    };

    const tasks = [];
    for (let i = 0; i < MAX_CONCURRENT; i++) {
      tasks.push(processLimitedQueue());
    }

    await Promise.all(tasks);
  };

  await processQueue();
  return Array.from(allEmails);
});

ipcMain.handle('open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
    ]
  });

  return result.filePaths;
});

ipcMain.on('min', () => mainWindow.minimize());
ipcMain.on('max', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    mainWindow.webContents.send('unmaximize');
  } else {
    mainWindow.maximize();
    mainWindow.webContents.send('maximize');
  }
});
ipcMain.on('close', () => mainWindow.close());

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
