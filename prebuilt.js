const GITHUB_USER = 'palmarinich';
const GITHUB_REPO = 'prebuilt-courses';
const GITHUB_FILE = 'index.html';
const GITHUB_BRANCH = 'main';

let cardCounter = 0;
let cachedSha = null;
let isSaving = false;

// ── Card management ──────────────────────────────────────────────────────────

window.addCard = function() {
  const title = prompt('Card title:');
  if (!title || !title.trim()) return;

  cardCounter++;
  const cardId = 'card-new-' + cardCounter;
  const stepsId = 'steps-new-' + cardCounter;

  const div = document.createElement('div');
  div.className = 'card';
  div.id = cardId;
  div.innerHTML =
    '<div class="card-collapse-bar" onclick="toggleCollapse(this)" title="Collapse / expand">' +
      '<span class="card-collapse-chevron">&#9650;</span>' +
    '</div>' +
    '<div class="card-inner">' +
      '<div class="card-header">' +
        '<span class="card-drag-grip" title="Drag to reorder card">⠿</span>' +
        '<div class="card-title" contenteditable="true">' + title.trim() + '</div>' +
        '<span class="card-delete" onclick="deleteCard(this)" title="Remove card">&times;</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<span class="add-card-detail" onclick="addCardDetail(this)">+ detail</span>' +
        '<ul class="steps" id="' + stepsId + '"></ul>' +
        '<div class="add-step" onclick="addStep(this)">+ Add step</div>' +
      '</div>' +
    '</div>';

  document.getElementById('cards-container').appendChild(div);
  initStepsSortable(stepsId);
  addStep(div.querySelector('.add-step'));

  // Add a matching TOC entry
  var toc = document.getElementById('toc');
  if (toc) {
    var link = document.createElement('a');
    link.className = 'toc-item';
    link.href = '#' + cardId;
    link.id = 'toc-' + cardId;
    link.textContent = title.trim();
    toc.appendChild(link);
  }
};

window.toggleCollapse = function(bar) {
  var card = bar.closest('.card');
  card.classList.toggle('collapsed');
};

window.deleteCard = function(btn) {
  if (confirm('Remove this card?')) {
    var card = btn.closest('.card');
    var cardId = card.id;
    card.remove();
    var tocEntry = document.getElementById('toc-' + cardId);
    if (tocEntry) tocEntry.remove();
  }
};

function initCardsSortable() {
  var container = document.getElementById('cards-container');
  if (!container || !window.Sortable) return;
  Sortable.create(container, {
    handle: '.card-drag-grip',
    animation: 200,
    ghostClass: 'sortable-ghost'
  });
}

// ── Step management ──────────────────────────────────────────────────────────

function initStepsSortable(listId) {
  var el = document.getElementById(listId);
  if (!el || !window.Sortable) return;
  Sortable.create(el, {
    handle: '.drag-grip',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: function() { renumberSteps(listId); }
  });
}

function renumberSteps(listId) {
  var list = document.getElementById(listId);
  if (!list) return;
  list.querySelectorAll('.step-num').forEach(function(num, i) {
    num.textContent = i + 1;
    num.onclick = function() { this.closest('.step').classList.toggle('done'); };
  });
}

window.addStep = function(trigger) {
  var list;
  if (typeof trigger === 'string') {
    list = document.getElementById(trigger);
  } else {
    list = trigger.closest('.card').querySelector('.steps');
  }
  if (!list) return;

  var count = list.querySelectorAll('.step').length + 1;
  var li = document.createElement('li');
  li.className = 'step';
  li.innerHTML =
    '<span class="drag-grip" title="Drag to reorder">⠿</span>' +
    '<div class="step-num" onclick="this.closest(\'.step\').classList.toggle(\'done\')" title="Mark complete">' + count + '</div>' +
    '<div class="step-body">' +
      '<div class="step-text-wrapper">' +
        '<div class="step-text" contenteditable="true">New step</div>' +
        '<span class="step-title-delete" onclick="deleteStep(this)" title="Remove step">&times;</span>' +
      '</div>' +
      '<span class="add-detail" onclick="addDetail(this)">+ detail</span>' +
    '</div>';

  list.appendChild(li);
  li.querySelector('[contenteditable]').focus();
};

window.deleteStep = function(btn) {
  var step = btn.closest('.step');
  var list = step.closest('.steps');
  step.style.visibility = 'hidden';
  setTimeout(function() {
    step.remove();
    renumberSteps(list.id);
  }, 150);
};

// ── Detail management ────────────────────────────────────────────────────────

window.addDetail = function(btn) {
  var body = btn.closest('.step-body');
  btn.remove();
  var row = document.createElement('div');
  row.className = 'detail-row';
  row.innerHTML =
    '<div class="step-detail" contenteditable="true">Detail</div>';
  body.appendChild(row);
  row.querySelector('[contenteditable]').focus();
};

window.removeDetail = function(btn) {
  var body = btn.closest('.step-body');
  btn.closest('.detail-row').remove();
  var link = document.createElement('span');
  link.className = 'add-detail';
  link.textContent = '+ detail';
  link.onclick = function() { addDetail(this); };
  body.appendChild(link);
};

window.addCardDetail = function(btn) {
  var card = btn.closest('.card');
  btn.remove();
  var row = document.createElement('div');
  row.className = 'card-detail-row';
  row.innerHTML =
    '<div class="card-detail" contenteditable="true">Detail</div>';
  var steps = card.querySelector('.steps');
  card.querySelector('.card-body').insertBefore(row, steps);
  row.querySelector('[contenteditable]').focus();
};

window.removeCardDetail = function(btn) {
  var card = btn.closest('.card');
  btn.closest('.card-detail-row').remove();
  var link = document.createElement('span');
  link.className = 'add-card-detail';
  link.textContent = '+ detail';
  link.onclick = function() { addCardDetail(this); };
  var steps = card.querySelector('.steps');
  card.querySelector('.card-body').insertBefore(link, steps);
};

// ── Token management ─────────────────────────────────────────────────────────

function getToken() {
  var token = localStorage.getItem('gh_prebuilt_token');
  if (!token) {
    token = prompt('Enter your GitHub personal access token:');
    if (token) localStorage.setItem('gh_prebuilt_token', token.trim());
  }
  return token;
}

window.resetToken = function() {
  localStorage.removeItem('gh_prebuilt_token');
  alert('Token cleared. You will be prompted for a new token on next save.');
};

// ── Build & Save ─────────────────────────────────────────────────────────────

function buildHTML() {
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  var stamp = 'Last updated: ' + dateStr + ' &nbsp;·&nbsp; Managed with Claude';
  document.getElementById('footer').innerHTML = stamp;
  document.getElementById('subtitle').innerHTML = stamp;

  // Rebuild TOC to match current card order
  var toc = document.getElementById('toc');
  if (toc) {
    toc.innerHTML = '';
    document.querySelectorAll('#cards-container .card').forEach(function(card) {
      var cardId = card.id;
      if (!cardId) return;
      var titleEl = card.querySelector('.card-title');
      var titleText = titleEl ? titleEl.textContent.trim() : cardId;
      var link = document.createElement('a');
      link.className = 'toc-item';
      link.href = '#' + cardId;
      link.id = 'toc-' + cardId;
      link.textContent = titleText;
      toc.appendChild(link);
    });
  }

  var clone = document.documentElement.cloneNode(true);

  // Strip browser extension injections from clone FIRST
  // so they don't corrupt the contenteditable index sync below
  clone.querySelectorAll('[id^="give-freely"], [class^="give-freely"], #ctre_styles, #ctre_wnd').forEach(function(el) { el.remove(); });
  clone.querySelectorAll('.edit-hint').forEach(function(el) { el.remove(); });

  // Sync contenteditable content by matching each card's editables individually
  // (avoids index corruption from extension-injected elements)
  document.querySelectorAll('.card').forEach(function(liveCard) {
    var cardId = liveCard.id;
    if (!cardId) return;
    var cloneCard = clone.querySelector('#' + cardId);
    if (!cloneCard) return;

    // Sync collapsed state
    if (liveCard.classList.contains('collapsed')) {
      cloneCard.classList.add('collapsed');
      cloneCard.setAttribute('data-collapsed', 'true');
    } else {
      cloneCard.classList.remove('collapsed');
      cloneCard.setAttribute('data-collapsed', 'false');
    }

    // Sync contenteditable fields within this card
    var liveEdits = liveCard.querySelectorAll('[contenteditable]');
    var cloneEdits = cloneCard.querySelectorAll('[contenteditable]');
    liveEdits.forEach(function(el, i) {
      if (cloneEdits[i]) cloneEdits[i].innerHTML = el.innerHTML;
    });

    // Sync .done steps
    var liveSteps = liveCard.querySelectorAll('.step');
    var cloneSteps = cloneCard.querySelectorAll('.step');
    liveSteps.forEach(function(liveStep, i) {
      if (!cloneSteps[i]) return;
      if (liveStep.classList.contains('done')) {
        cloneSteps[i].classList.add('done');
      } else {
        cloneSteps[i].classList.remove('done');
      }
    });
  });

  // Clean up SortableJS artifacts
  clone.querySelectorAll('[draggable="false"]').forEach(function(el) { el.removeAttribute('draggable'); });
  clone.querySelectorAll('[style=""]').forEach(function(el) { el.removeAttribute('style'); });
  clone.querySelectorAll('.sortable-ghost').forEach(function(el) { el.classList.remove('sortable-ghost'); });

  // Always save the button in its resting state
  var cloneSaveBtn = clone.querySelector('.btn-save');
  if (cloneSaveBtn) {
    cloneSaveBtn.textContent = 'Save';
    cloneSaveBtn.removeAttribute('disabled');
  }

  return '<!DOCTYPE html>\n' + clone.outerHTML;
}

window.savePage = async function() {
  if (isSaving) return;
  var token = getToken();
  if (!token) return;

  isSaving = true;
  var saveBtn = document.querySelector('.btn-save');
  saveBtn.textContent = 'Saving\u2026';
  saveBtn.disabled = true;

  try {
    var apiBase = 'https://api.github.com/repos/' + GITHUB_USER + '/' + GITHUB_REPO + '/contents/' + GITHUB_FILE;
    var headers = {
      'Authorization': 'token ' + token,
      'Content-Type': 'application/json'
    };

    var sha = cachedSha;
    if (!sha) {
      var getRes = await fetch(apiBase + '?ref=' + GITHUB_BRANCH, { headers: headers });
      if (!getRes.ok) throw new Error('Could not fetch file: ' + getRes.status + ' ' + getRes.statusText);
      var fileData = await getRes.json();
      sha = fileData.sha;
    }

    var html = buildHTML();
    var encoded = btoa(unescape(encodeURIComponent(html)));

    var putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({
        message: 'PreBuilt Courses update ' + new Date().toLocaleString(),
        content: encoded,
        sha: sha,
        branch: GITHUB_BRANCH
      })
    });

    if (!putRes.ok) {
      var errData = await putRes.json();
      if (putRes.status === 409) {
        cachedSha = null;
        throw new Error('SHA conflict \u2014 please try saving again.');
      }
      throw new Error(errData.message || putRes.statusText);
    }

    var putData = await putRes.json();
    cachedSha = (putData.content && putData.content.sha) ? putData.content.sha : null;

    saveBtn.textContent = 'Saved \u2713';
    setTimeout(function() {
      saveBtn.textContent = 'Save';
      saveBtn.disabled = false;
    }, 2500);

  } catch (err) {
    console.error('Save error:', err);
    alert('Save failed: ' + err.message + '\n\nIf your token has expired, use "Reset Token" to re-enter it.');
    saveBtn.textContent = 'Error \u2014 try again';
    setTimeout(function() {
      saveBtn.textContent = 'Save';
      saveBtn.disabled = false;
    }, 3000);
  } finally {
    isSaving = false;
  }
};

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  // Suppress transitions on load so collapsed cards don't animate open-then-closed
  document.body.classList.add('no-transition');
  setTimeout(function() { document.body.classList.remove('no-transition'); }, 50);

  document.querySelectorAll('.steps').forEach(function(list) {
    if (list.id) initStepsSortable(list.id);
  });
  initCardsSortable();
  document.querySelectorAll('[id^="card-new-"]').forEach(function(el) {
    var n = parseInt(el.id.replace('card-new-', ''), 10);
    if (n > cardCounter) cardCounter = n;
  });

  // .collapsed class is already in saved HTML; CSS handles display on load.
});
