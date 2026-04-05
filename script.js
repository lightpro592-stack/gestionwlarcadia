// --- Loader ---
const loader = document.getElementById('loader');
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }

// --- SHA-256 utilitaire ---
async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
}

// URL Google Apps Script Web App
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyBZuqzhcVgVljG7mnIxhQcjkhpZlufQ78dfjyI1Wr6ODXQFcgpRhIiiJ5eKjbfgQmRMw/exec';

// --- Utilisateur connecté ---
let currentUser = null;
function setCurrentUser(user) {
    currentUser = user;
    document.getElementById('connectedUser').textContent = user.login;
    if (user.permission === 'admin') {
        document.getElementById('manageAccountsBtn').classList.remove('hidden');
    } else {
        document.getElementById('manageAccountsBtn').classList.add('hidden');
    }
}

// =====================
// --- LOGIN ---
// =====================
const loginModal = document.getElementById('loginModal');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const loginPseudoInput = document.getElementById('loginPseudo');

function handleLogin() {
    const login = loginPseudoInput.value.trim();
    const password = loginPassword.value;
    if (login === "Seven" && password === "arcadiawl.gestion") {
        setCurrentUser({ login: "Seven", permission: "admin" });
        loginModal.classList.add('hidden');
        loginPassword.value = '';
        loginError.classList.add('hidden');
        fetchDossiers();
    } else {
        loginError.classList.remove('hidden');
    }
}

loginBtn.addEventListener('click', handleLogin);
loginPassword.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleLogin();
});

// Afficher le login au départ
loginModal.classList.remove('hidden');

// =====================
// --- DOSSIERS ---
// =====================
let whitelistData = [];

async function fetchDossiers() {
    showLoader();
    try {
        const res = await fetch(WEBAPP_URL);
        whitelistData = await res.json();
        renderTable(whitelistData);
    } catch(e) {
        console.error('Erreur fetchDossiers', e);
    } finally {
        hideLoader();
    }
}

const tableBody = document.getElementById('whitelistTable');
const searchInput = document.getElementById('searchInput');

function renderTable(data) {
    tableBody.innerHTML = '';
    data.forEach(player => {
        const row = document.createElement('tr');
        row.className = "hover:bg-[#1c2030] transition duration-200 text-sm";
        row.innerHTML = `
            <td class="px-6 py-4 font-mono text-xs text-gray-400">${player.discord}</td>
            <td class="px-6 py-4 font-semibold">${player.name}</td>
            <td class="px-6 py-4">
                <span class="badge badge-${player.secteur.toLowerCase()}">${player.secteur}</span>
                <div class="text-[10px] text-gray-500 mt-1">${player.detail}</div>
            </td>
            <td class="px-6 py-4 font-bold ${player.papier ? 'status-true' : 'status-false'}">
                ${player.papier ? '✔ VALIDE' : '✘ NON'}
            </td>
            <td class="px-6 py-4 font-bold ${player.citoyen ? 'status-true' : 'status-false'}">
                ${player.citoyen ? '✔ OUI' : '✘ NON'}
            </td>
            <td class="px-6 py-4 text-gray-300 font-medium">${player.staff}</td>
            <td class="px-6 py-4 text-right">
                <button class="edit-btn text-purple-400 hover:text-white px-2 py-1" data-discord="${player.discord}">Éditer</button>
                <button class="delete-btn text-red-400 hover:text-white px-2 py-1 ml-2" data-discord="${player.discord}">Supprimer</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    updateStats(data);
}

function updateStats(data) {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-citoyens').innerText = data.filter(p => p.citoyen).length;
    document.getElementById('stat-gangs').innerText = data.filter(p => p.secteur === 'Gang').length;
    document.getElementById('stat-lspd').innerText = data.filter(p => p.secteur === 'LSPD').length;
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = whitelistData.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.discord.includes(term) ||
        p.secteur.toLowerCase().includes(term)
    );
    renderTable(filtered);
});

// --- Modal CRUD dossiers ---
const modal = document.getElementById('modalForm');
const closeModalBtn = document.getElementById('closeModal');
const addBtn = document.querySelector('button.bg-purple-600');
const dossierForm = document.getElementById('dossierForm');
const modalTitle = document.getElementById('modalTitle');

const inputDiscord = document.getElementById('inputDiscord');
const inputName = document.getElementById('inputName');
const inputSecteur = document.getElementById('inputSecteur');
const inputDetail = document.getElementById('inputDetail');
const inputPapier = document.getElementById('inputPapier');
const inputCitoyen = document.getElementById('inputCitoyen');
const inputStaff = document.getElementById('inputStaff');

let editMode = false;
let editDiscord = null;

function openModal(edit = false, dossier = null) {
    modal.classList.remove('hidden');
    editMode = edit;
    if (edit && dossier) {
        modalTitle.textContent = 'Éditer le dossier';
        inputDiscord.value = dossier.discord;
        inputDiscord.disabled = true;
        inputName.value = dossier.name;
        inputSecteur.value = dossier.secteur;
        inputDetail.value = dossier.detail;
        inputPapier.checked = dossier.papier === true || dossier.papier === 'TRUE' || dossier.papier === 'true';
        inputCitoyen.checked = dossier.citoyen === true || dossier.citoyen === 'TRUE' || dossier.citoyen === 'true';
        inputStaff.value = dossier.staff;
        editDiscord = dossier.discord;
    } else {
        modalTitle.textContent = 'Ajouter un dossier';
        inputDiscord.value = '';
        inputDiscord.disabled = false;
        inputName.value = '';
        inputSecteur.value = '';
        inputDetail.value = '';
        inputPapier.checked = false;
        inputCitoyen.checked = false;
        inputStaff.value = '';
        editDiscord = null;
    }
}

function closeModal() {
    modal.classList.add('hidden');
}

addBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);

dossierForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const dossier = {
        discord: inputDiscord.value.trim(),
        name: inputName.value.trim(),
        secteur: inputSecteur.value.trim(),
        detail: inputDetail.value.trim(),
        papier: inputPapier.checked,
        citoyen: inputCitoyen.checked,
        staff: inputStaff.value.trim()
    };
    const action = editMode && editDiscord ? 'edit' : 'add';
    showLoader();
    try {
        await fetch(WEBAPP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'data=' + encodeURIComponent(JSON.stringify({ action, dossier }))
        });
        closeModal();
        await fetchDossiers();
    } finally {
        hideLoader();
    }
});

tableBody.addEventListener('click', async function(e) {
    if (e.target.classList.contains('edit-btn')) {
        const discord = e.target.getAttribute('data-discord');
        const dossier = whitelistData.find(p => p.discord === discord);
        if (dossier) openModal(true, dossier);
    }
    if (e.target.classList.contains('delete-btn')) {
        const discord = e.target.getAttribute('data-discord');
        if (confirm('Supprimer ce dossier ?')) {
            showLoader();
            try {
                await fetch(WEBAPP_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'data=' + encodeURIComponent(JSON.stringify({ action: 'delete', discord }))
                });
                await fetchDossiers();
            } finally {
                hideLoader();
            }
        }
    }
});

window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        hideAccountsModal();
    }
});

// =====================
// --- GESTION COMPTES ---
// =====================
let accountsData = [];
let editingAccount = null;

const accountsModal = document.getElementById('accountsModal');
const accountsTable = document.getElementById('accountsTable');
const accountFormContainer = document.getElementById('accountFormContainer');
const accountFormTitle = document.getElementById('accountFormTitle');
const accountLogin = document.getElementById('accountLogin');
const accountPassword = document.getElementById('accountPassword');
const accountPermission = document.getElementById('accountPermission');

function showAccountsModal() {
    accountsModal.classList.remove('hidden');
    accountFormContainer.classList.add('hidden');
    editingAccount = null;
    loadAccounts();
}
function hideAccountsModal() {
    accountsModal.classList.add('hidden');
    accountFormContainer.classList.add('hidden');
    editingAccount = null;
}

document.getElementById('manageAccountsBtn').addEventListener('click', showAccountsModal);
document.getElementById('closeAccountsModal').addEventListener('click', hideAccountsModal);

document.getElementById('addAccountBtn').addEventListener('click', () => {
    editingAccount = null;
    accountFormTitle.textContent = 'Ajouter un compte';
    accountLogin.value = '';
    accountLogin.disabled = false;
    accountPassword.value = '';
    accountPermission.value = 'ecriture';
    accountFormContainer.classList.remove('hidden');
});

document.getElementById('cancelAccountForm').addEventListener('click', () => {
    accountFormContainer.classList.add('hidden');
    editingAccount = null;
});

// CORRECTION PRINCIPALE : bouton simple, pas de <form>, pas de submit
document.getElementById('submitAccountBtn').addEventListener('click', async () => {
    const login = accountLogin.value.trim();
    const password = accountPassword.value;
    const permission = accountPermission.value;

    if (!login) {
        alert('Le login est obligatoire.');
        return;
    }
    if (!editingAccount && !password) {
        alert('Le mot de passe est obligatoire pour un nouveau compte.');
        return;
    }

    let password_hash = '';
    if (password) {
        password_hash = await sha256(password);
    } else if (editingAccount) {
        password_hash = editingAccount.password_hash || '';
    }

    const action = editingAccount ? 'editAccount' : 'addAccount';

    showLoader();
    try {
        const res = await fetch(WEBAPP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'data=' + encodeURIComponent(JSON.stringify({
                action,
                account: { login, password_hash, permission }
            }))
        });
        const result = await res.json();
        if (result.result === 'ok') {
            accountFormContainer.classList.add('hidden');
            editingAccount = null;
            await loadAccounts();
        } else {
            alert('Erreur : ' + (result.message || 'inconnue'));
        }
    } catch(e) {
        alert('Erreur réseau : ' + e.message);
    } finally {
        hideLoader();
    }
});

async function loadAccounts() {
    showLoader();
    try {
        const res = await fetch(WEBAPP_URL + '?comptes=1');
        accountsData = await res.json();
        renderAccountsTable();
    } catch (e) {
        accountsTable.innerHTML = '<tr><td colspan="3" class="text-red-400 px-4 py-2">Erreur de chargement des comptes</td></tr>';
    } finally {
        hideLoader();
    }
}

function renderAccountsTable() {
    accountsTable.innerHTML = '';
    accountsData.forEach(acc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-4 py-2 font-mono">${acc.login}</td>
            <td class="px-4 py-2">${acc.permission}</td>
            <td class="px-4 py-2">
                <button type="button" class="btn btn-edit-account" data-login="${acc.login}">Éditer</button>
                <button type="button" class="btn btn-delete-account ml-2" style="background:linear-gradient(90deg,#dc2626,#b91c1c)" data-login="${acc.login}">Supprimer</button>
            </td>
        `;
        accountsTable.appendChild(tr);
    });

    accountsTable.querySelectorAll('.btn-edit-account').forEach(btn => {
        btn.addEventListener('click', () => {
            const login = btn.getAttribute('data-login');
            const acc = accountsData.find(a => a.login === login);
            if (!acc) return;
            editingAccount = acc;
            accountFormTitle.textContent = 'Éditer le compte';
            accountLogin.value = acc.login;
            accountLogin.disabled = true;
            accountPassword.value = '';
            accountPermission.value = acc.permission;
            accountFormContainer.classList.remove('hidden');
        });
    });

    accountsTable.querySelectorAll('.btn-delete-account').forEach(btn => {
        btn.addEventListener('click', async () => {
            const login = btn.getAttribute('data-login');
            if (!confirm(`Supprimer le compte "${login}" ?`)) return;
            showLoader();
            try {
                await fetch(WEBAPP_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'data=' + encodeURIComponent(JSON.stringify({
                        action: 'deleteAccount',
                        login: login
                    }))
                });
                await loadAccounts();
            } finally {
                hideLoader();
            }
        });
    });
}
