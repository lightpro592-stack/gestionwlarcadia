// --- Login système simple ---
const loginModal = document.getElementById('loginModal');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const PASSWORD = 'arcadiawl.gestion'; // Change ce mot de passe ici

function showLogin() {
    loginModal.classList.remove('hidden');
}
function hideLogin() {
    loginModal.classList.add('hidden');
}

loginBtn.addEventListener('click', tryLogin);
loginPassword.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') tryLogin();
});

function tryLogin() {
    if (loginPassword.value === PASSWORD) {
        hideLogin();
        loginError.classList.add('hidden');
        // On charge la whitelist
        fetchDossiers();
    } else {
        loginError.classList.remove('hidden');
        loginPassword.value = '';
        loginPassword.focus();
    }
}

// On cache tout sauf le login au départ
document.addEventListener('DOMContentLoaded', function() {
    showLogin();
});

let whitelistData = [];

// Charger les données depuis Google Sheets via Apps Script Web App
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyBZuqzhcVgVljG7mnIxhQcjkhpZlufQ78dfjyI1Wr6ODXQFcgpRhIiiJ5eKjbfgQmRMw/exec';

const loader = document.getElementById('loader');
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }

async function fetchDossiers() {
    showLoader();
    try {
        const res = await fetch(WEBAPP_URL);
        whitelistData = await res.json();
        renderTable(whitelistData);
    } finally {
        hideLoader();
    }
}

const tableBody = document.getElementById('whitelistTable');
const searchInput = document.getElementById('searchInput');

// Fonction pour afficher les données
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

// Mise à jour des compteurs
function updateStats(data) {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-citoyens').innerText = data.filter(p => p.citoyen).length;
    document.getElementById('stat-gangs').innerText = data.filter(p => p.secteur === 'Gang').length;
    document.getElementById('stat-lspd').innerText = data.filter(p => p.secteur === 'LSPD').length;
}

// Logique de recherche
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = whitelistData.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.discord.includes(term) || 
        p.secteur.toLowerCase().includes(term)
    );
    renderTable(filtered);
});


// Initialisation
// fetchDossiers() sera appelé après login

// --- Gestion du Modal et CRUD ---
const modal = document.getElementById('modalForm');
const closeModalBtn = document.getElementById('closeModal');
const addBtn = document.querySelector('button.bg-purple-600');
const dossierForm = document.getElementById('dossierForm');
const modalTitle = document.getElementById('modalTitle');

// Champs du formulaire
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
        // Gestion robuste des cases à cocher
        inputPapier.checked = dossier.papier === true || dossier.papier === 'TRUE' || dossier.papier === 'true' || dossier.papier === 1 || dossier.papier === '1';
        inputCitoyen.checked = dossier.citoyen === true || dossier.citoyen === 'TRUE' || dossier.citoyen === 'true' || dossier.citoyen === 1 || dossier.citoyen === '1';
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
    let action = editMode && editDiscord ? 'edit' : 'add';
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

// Délégation pour les boutons Éditer/Supprimer
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

// Fermer le modal avec Echap
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});