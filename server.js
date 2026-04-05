// server.js
// Serveur Express pour manipuler Google Sheets

const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Charger les credentials du compte de service
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1flhUvwo78H79DblWHQZXffRbStm1EcDKIcOrmOK-0wk';
const SHEET_NAME = 'database';

// Récupérer tous les dossiers
app.get('/dossiers', async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
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
      return obj; // ← CORRECTION : suppression du 'n' parasite
    });
    res.json(dossiers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ajouter un dossier
app.post('/dossiers', async (req, res) => {
  try {
    const dossier = req.body;
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          dossier.discord,
          dossier.name,
          dossier.secteur,
          dossier.detail,
          dossier.papier ? 'TRUE' : 'FALSE',
          dossier.citoyen ? 'TRUE' : 'FALSE',
          dossier.staff
        ]],
      },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modifier un dossier (par discord)
app.put('/dossiers/:discord', async (req, res) => {
  try {
    const discord = req.params.discord;
    const dossier = req.body;
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
    });
    const rows = result.data.values || [];
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === discord) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A${i + 1}:G${i + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              dossier.discord,
              dossier.name,
              dossier.secteur,
              dossier.detail,
              dossier.papier ? 'TRUE' : 'FALSE',
              dossier.citoyen ? 'TRUE' : 'FALSE',
              dossier.staff
            ]],
          },
        });
        found = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ error: 'Dossier non trouvé' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un dossier (par discord)
app.delete('/dossiers/:discord', async (req, res) => {
  try {
    const discord = req.params.discord;
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
    });
    const rows = result.data.values || [];
    let found = false;
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
        found = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ error: 'Dossier non trouvé' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('Serveur démarré sur http://localhost:' + PORT);
});
