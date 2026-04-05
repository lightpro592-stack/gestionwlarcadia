// server.js
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.options('*', cors());
app.use(express.json());

// =====================
// GOOGLE SETUP
// =====================
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1flhUvwo78H79DblWHQZXffRbStm1EcDKIcOrmOK-0wk';
const DOSSIER_SHEET = 'database';
const ACCOUNT_SHEET = 'accounts'; // ⚠️ crée cet onglet dans ton Google Sheet

// =====================
// LOGIN
// =====================
app.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: ACCOUNT_SHEET,
    });

    const rows = result.data.values || [];

    for (let i = 1; i < rows.length; i++) {
      const [accLogin, accPassword, permission] = rows[i];

      if (accLogin === login && accPassword === password) {
        return res.json({
          success: true,
          user: { login: accLogin, permission }
        });
      }
    }

    res.json({ success: false });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// GET ACCOUNTS
// =====================
app.get('/accounts', async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: ACCOUNT_SHEET,
    });

    const rows = result.data.values || [];
    const accounts = rows.slice(1).map(row => ({
      login: row[0],
      password: row[1],
      permission: row[2]
    }));

    res.json(accounts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// ADD ACCOUNT
// =====================
app.post('/accounts', async (req, res) => {
  try {
    const { login, password, permission } = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: ACCOUNT_SHEET,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[login, password, permission]],
      },
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// DELETE ACCOUNT
// =====================
app.delete('/accounts/:login', async (req, res) => {
  try {
    const login = req.params.login;

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: ACCOUNT_SHEET,
    });

    const rows = result.data.values || [];

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === login) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          resource: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 1, // ⚠️ sheetId de "accounts" (souvent 1)
                  dimension: 'ROWS',
                  startIndex: i,
                  endIndex: i + 1,
                },
              },
            }],
          },
        });
        return res.json({ success: true });
      }
    }

    res.status(404).json({ error: 'Compte non trouvé' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// DOSSIERS
// =====================

// GET
app.get('/dossiers', async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: DOSSIER_SHEET,
    });

    const rows = result.data.values || [];
    const headers = rows[0];

    const dossiers = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || '';
      });
      obj.papier = obj.papier === 'TRUE';
      obj.citoyen = obj.citoyen === 'TRUE';
      return obj;
    });

    res.json(dossiers);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST
app.post('/dossiers', async (req, res) => {
  try {
    const d = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: DOSSIER_SHEET,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          d.discord,
          d.name,
          d.secteur,
          d.detail,
          d.papier ? 'TRUE' : 'FALSE',
          d.citoyen ? 'TRUE' : 'FALSE',
          d.staff
        ]],
      },
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT
app.put('/dossiers/:discord', async (req, res) => {
  try {
    const discord = req.params.discord;
    const d = req.body;

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: DOSSIER_SHEET,
    });

    const rows = result.data.values || [];

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === discord) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${DOSSIER_SHEET}!A${i + 1}:G${i + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              d.discord,
              d.name,
              d.secteur,
              d.detail,
              d.papier ? 'TRUE' : 'FALSE',
              d.citoyen ? 'TRUE' : 'FALSE',
              d.staff
            ]],
          },
        });
        return res.json({ success: true });
      }
    }

    res.status(404).json({ error: 'Dossier non trouvé' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/dossiers/:discord', async (req, res) => {
  try {
    const discord = req.params.discord;

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: DOSSIER_SHEET,
    });

    const rows = result.data.values || [];

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === discord) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          resource: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: 'ROWS',
                  startIndex: i,
                  endIndex: i + 1,
                },
              },
            }],
          },
        });
        return res.json({ success: true });
      }
    }

    res.status(404).json({ error: 'Dossier non trouvé' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
const PORT = 3001;
app.listen(PORT, () => {
  console.log('Serveur lancé sur http://localhost:' + PORT);
});