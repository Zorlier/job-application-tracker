const STORAGE_KEY = 'qiuzhao-applications-v1';

const stageMeta = {
  '已投简历': { className: 'default' },
  '简历筛选中': { className: 'passed' },
  '一面': { className: 'interview' },
  '二面': { className: 'test' },
  'offer': { className: 'passed' },
  '拒绝': { className: 'failed' }
};

const appForm = document.getElementById('appForm');
const appList = document.getElementById('applicationList');
const statsGrid = document.getElementById('statsGrid');
const analyticsPanel = document.getElementById('analyticsPanel');
const overviewTableBody = document.getElementById('overviewTableBody');
const searchInput = document.getElementById('searchInput');
const filterStage = document.getElementById('filterStage');
const filterType = document.getElementById('filterType');
const sortOrder = document.getElementById('sortOrder');
const formModal = document.getElementById('formModal');
const openFormBtn = document.getElementById('openFormBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const overviewBtn = document.getElementById('overviewBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const restoreBtn = document.getElementById('restoreBtn');
const logsBtn = document.getElementById('logsBtn');
const logsModal = document.getElementById('logsModal');
const closeLogsBtn = document.getElementById('closeLogsBtn');
const logsContent = document.getElementById('logsContent');
const clearLogsBtn = document.getElementById('clearLogsBtn');

function readData() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function openModal() {
  formModal.classList.remove('hidden');
  formModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  formModal.classList.add('hidden');
  formModal.setAttribute('aria-hidden', 'true');
}

function getFilteredData() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedStage = filterStage.value;
  const selectedType = filterType.value;
  const currentSort = sortOrder.value;
  let data = readData();

  data = data.filter((item) => {
    const haystack = `${item.company} ${item.position} ${item.city || ''} ${item.type || ''} ${item.notes || ''}`.toLowerCase();
    const matchesKeyword = !keyword || haystack.includes(keyword);
    const matchesStage = selectedStage === '全部' || item.stage === selectedStage;
    const matchesType = selectedType === '全部' || item.type === selectedType;
    return matchesKeyword && matchesStage && matchesType;
  });

  data.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return currentSort === 'time-asc' ? timeA - timeB : timeB - timeA;
  });

  return data;
}

function renderStats() {
  const data = readData();
  const total = data.length;
  const inProgress = data.filter((item) => ['已投简历', '简历筛选中', '一面', '二面'].includes(item.stage)).length;
  const passed = data.filter((item) => item.stage === 'offer').length;
  const failed = data.filter((item) => item.stage === '拒绝').length;
  const screening = data.filter((item) => item.stage === '简历筛选中').length;
  const types = new Set(data.map((item) => item.type || '其他')).size;

  const stats = [
    { label: '投递总数', value: total },
    { label: '进行中', value: inProgress },
    { label: '简历筛选', value: screening },
    { label: 'offer', value: passed },
    { label: '岗位方向', value: types }
  ];

  statsGrid.innerHTML = stats
    .map(
      (item) => `
        <div class="stat-card">
          <div class="value">${item.value}</div>
          <div class="label">${item.label}</div>
        </div>
      `
    )
    .join('');
}

function renderAnalytics() {
  const data = readData();
  const total = data.length || 1;
  const stageOrder = ['已投简历', '简历筛选中', '一面', '二面', 'offer', '拒绝'];
  const stageCounts = stageOrder.map((stage) => ({
    stage,
    count: data.filter((item) => item.stage === stage).length
  }));

  const maxStage = Math.max(...stageCounts.map((item) => item.count), 1);
  const cityCounts = Object.entries(
    data.reduce((acc, item) => {
      const city = item.city || '未知';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const offerRate = Math.round((data.filter((item) => item.stage === 'offer').length / total) * 100);
  const inProgress = data.filter((item) => ['已投简历', '简历筛选中', '一面', '二面'].includes(item.stage)).length;

  const stageHtml = stageCounts
    .map((item) => {
      const percent = Math.round((item.count / maxStage) * 100);
      const fillClass = item.stage === 'offer' ? 'offer' : item.stage === '拒绝' ? 'reject' : item.stage === '一面' || item.stage === '二面' ? 'warning' : '';
      return `
        <div class="stage-row">
          <span>${item.stage}</span>
          <div class="progress-bar">
            <div class="progress-fill ${fillClass}" style="width:${item.count ? Math.max(percent, 8) : 0}%"></div>
          </div>
          <strong>${item.count}</strong>
        </div>
      `;
    })
    .join('');

  const cityHtml = cityCounts
    .map(([city, count]) => {
      const percent = Math.round((count / total) * 100);
      return `
        <div class="city-row">
          <span>${city}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.max(percent, 8)}%"></div>
          </div>
          <strong>${count}</strong>
        </div>
      `;
    })
    .join('');

  analyticsPanel.innerHTML = `
    <div class="analytics-card">
      <h3>阶段分布</h3>
      <div class="stage-list">${stageHtml}</div>
    </div>
    <div class="analytics-card">
      <h3>城市统计</h3>
      <div class="city-list">${cityHtml || '<div class="empty-state">暂无城市数据</div>'}</div>
      <div class="analytics-summary" style="margin-top: 16px;">
        <div class="summary-metric">
          <div class="label">当前流程中</div>
          <div class="number">${inProgress}</div>
          <div class="small">包括投递、筛选和面试阶段</div>
        </div>
        <div class="summary-metric">
          <div class="label">offer 占比</div>
          <div class="number">${offerRate}%</div>
          <div class="small">基于总投递记录计算</div>
        </div>
      </div>
    </div>
  `;
}

function renderOverviewTable() {
  const data = getFilteredData();
  overviewTableBody.innerHTML = data
    .map((item) => {
      const stageClass = stageMeta[item.stage]?.className || 'default';
      return `
        <tr data-id="${item.id}">
          <td>${item.city || '未知'}</td>
          <td>${item.company}</td>
          <td>${item.position}</td>
          <td>${item.type || '其他'}</td>
          <td><span class="tag ${stageClass}">${item.stage}</span></td>
          <td>${item.date}</td>
          <td>${item.source || '官网'}</td>
          <td>
            <button class="header-btn detail-row-btn" type="button">详情</button>
            <button class="header-btn edit-row-btn" type="button">编辑</button>
          </td>
        </tr>
      `;
    })
    .join('');

  // bind row buttons
  overviewTableBody.querySelectorAll('.detail-row-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('tr').dataset.id;
      const item = readData().find((it) => it.id === id);
      if (!item) return;
      // open form for editing (details -> edit)
      document.getElementById('recordId').value = item.id;
      document.getElementById('company').value = item.company || '';
      document.getElementById('position').value = item.position || '';
      document.getElementById('city').value = item.city || '';
      document.getElementById('type').value = item.type || '';
      document.getElementById('source').value = item.source || '';
      document.getElementById('date').value = item.date || '';
      document.getElementById('stage').value = item.stage || '已投简历';
      document.getElementById('link').value = item.link || '';
      document.getElementById('interviewExp').value = item.interviewExp || '';
      document.getElementById('notes').value = item.notes || '';
      openModal();
    });
  });

  overviewTableBody.querySelectorAll('.edit-row-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('tr').dataset.id;
      const item = readData().find((it) => it.id === id);
      if (!item) return;
      document.getElementById('recordId').value = item.id;
      document.getElementById('company').value = item.company || '';
      document.getElementById('position').value = item.position || '';
      document.getElementById('city').value = item.city || '';
      document.getElementById('type').value = item.type || '';
      document.getElementById('source').value = item.source || '';
      document.getElementById('date').value = item.date || '';
      document.getElementById('stage').value = item.stage || '已投简历';
      document.getElementById('link').value = item.link || '';
      document.getElementById('interviewExp').value = item.interviewExp || '';
      document.getElementById('notes').value = item.notes || '';
      openModal();
    });
  });

  // no direct delete from table rows to avoid accidental removals
}

function renderList() {
  const data = getFilteredData();

  if (!data.length) {
    appList.innerHTML = '<div class="empty-state">没有符合条件的投递记录，试试调整筛选条件或新增一条记录。</div>';
    renderOverviewTable();
    return;
  }

  renderOverviewTable();

  appList.innerHTML = data
    .map((item) => {
      const stageClass = stageMeta[item.stage]?.className || 'default';
      return `
        <article class="application-card compact" data-id="${item.id}">
          <div class="card-header">
            <div>
              <strong>${item.company}</strong>
              <div style="color:var(--muted); font-size:0.92rem">${item.position}</div>
            </div>
            <div class="card-actions">
              <button class="icon-btn detail-btn" type="button" title="详情">🔍</button>
              <button class="icon-btn edit-btn" type="button" title="编辑">✏️</button>
            </div>
          </div>

          <div class="card-meta" style="margin-top:10px;">
            <span><span class="meta-dot"></span> ${item.city || '未知'}</span>
            <span> ${item.type || '其他'}</span>
            <span> ${item.date}</span>
            <span><span class="tag ${stageClass}">${item.stage}</span></span>
          </div>

          <div class="card-bottom">
            <label>
              <span>阶段</span>
              <select class="stage-select">
                ${Object.keys(stageMeta)
                  .map((stage) => `<option value="${stage}" ${stage === item.stage ? 'selected' : ''}>${stage}</option>`)
                  .join('')}
              </select>
            </label>
          </div>
        </article>
      `;
    })
    .join('');

  appList.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('.application-card').dataset.id;
      const all = readData();
      const item = all.find((it) => it.id === id);
      if (!item) return;
      // log deletion and remove
      addLog('delete', item);
      const next = all.filter((it) => it.id !== id);
      saveData(next);
      render();
    });
  });

  appList.querySelectorAll('.detail-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('.application-card').dataset.id;
      const item = readData().find((it) => it.id === id);
      if (!item) return;
      document.getElementById('d_company').textContent = item.company;
      document.getElementById('d_position').textContent = item.position;
      document.getElementById('d_city').textContent = item.city || '';
      document.getElementById('d_type').textContent = item.type || '';
      document.getElementById('d_stage').textContent = item.stage;
      document.getElementById('d_date').textContent = item.date;
      document.getElementById('d_source').textContent = item.source || '';
      const linkEl = document.getElementById('d_link');
      if (item.link) {
        linkEl.href = item.link;
        linkEl.textContent = item.link;
      } else {
        linkEl.href = '#';
        linkEl.textContent = '暂无链接';
      }
      document.getElementById('d_interviewExp').textContent = item.interviewExp || '暂无面试经验';
      document.getElementById('d_notes').textContent = item.notes || '暂无备注';
      detailModal.classList.remove('hidden');
      detailModal.setAttribute('aria-hidden', 'false');
    });
  });

  appList.querySelectorAll('.edit-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('.application-card').dataset.id;
      const item = readData().find((it) => it.id === id);
      if (!item) return;
      // populate form for edit
      document.getElementById('recordId').value = item.id;
      document.getElementById('company').value = item.company;
      document.getElementById('position').value = item.position;
      document.getElementById('city').value = item.city || '';
      document.getElementById('type').value = item.type || '';
      document.getElementById('source').value = item.source || '';
      document.getElementById('date').value = item.date || '';
      document.getElementById('stage').value = item.stage || '已投简历';
      document.getElementById('link').value = item.link || '';
      document.getElementById('interviewExp').value = item.interviewExp || '';
      document.getElementById('notes').value = item.notes || '';
      openModal();
    });
  });

  appList.querySelectorAll('.stage-select').forEach((select) => {
    select.addEventListener('change', (event) => {
      const id = event.target.closest('.application-card').dataset.id;
      const stage = event.target.value;
      const data = readData();
      const currentItem = data.find((item) => item.id === id);
      if (currentItem) {
        currentItem.stage = stage;
        if (['一面', '二面', 'offer', '拒绝'].includes(stage)) {
          const input = window.prompt(`请输入 ${stage} 阶段的经验/备注：`, currentItem.interviewExp || '');
          if (input !== null) {
            currentItem.interviewExp = input.trim();
          }
        }
      }
      saveData(data);
      render();
    });
  });
}

function render() {
  renderStats();
  renderAnalytics();
  renderList();
}

// ---- Logs: store actions (add/edit/delete) to allow restore ----
const LOG_KEY = `${STORAGE_KEY}-log`;
function getLogs() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { return []; }
}
function saveLogs(logs) { localStorage.setItem(LOG_KEY, JSON.stringify(logs)); }
function addLog(action, item) {
  const logs = getLogs();
  logs.unshift({ id: crypto.randomUUID(), ts: Date.now(), action, item });
  // keep last 200
  if (logs.length > 200) logs.length = 200;
  saveLogs(logs);
}

function renderLogs() {
  const logs = getLogs();
  if (!logs.length) {
    logsContent.innerHTML = '<div class="empty-state">暂无日志</div>';
    return;
  }
  logsContent.innerHTML = logs
    .map((l) => {
      const time = new Date(l.ts).toLocaleString();
      return `
        <div style="border-bottom:1px solid var(--line); padding:10px">
          <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
            <div><strong>${l.action}</strong> — ${time}</div>
            <div>
              ${l.action === 'delete' ? `<button class="secondary-btn restore-log-btn" data-id="${l.id}">恢复</button>` : ''}
            </div>
          </div>
          <div style="margin-top:8px; color:var(--muted);">${l.item.company || ''} — ${l.item.position || ''}</div>
        </div>
      `;
    })
    .join('');

  // bind restore buttons
  logsContent.querySelectorAll('.restore-log-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const logs = getLogs();
      const entry = logs.find((x) => x.id === id);
      if (!entry) return alert('日志项不存在');
      if (entry.action !== 'delete') return alert('当前仅支持恢复删除项');
      const data = readData();
      // avoid duplicate id collision
      const exists = data.find((it) => it.id === entry.item.id);
      if (exists) return alert('记录已存在，无需恢复');
      data.unshift(entry.item);
      saveData(data);
      // mark log as restored (remove)
      const nextLogs = logs.filter((x) => x.id !== id);
      saveLogs(nextLogs);
      alert('已恢复删除记录');
      render();
      renderLogs();
    });
  });
}

// logs UI handlers
if (logsBtn) logsBtn.addEventListener('click', () => { logsModal.classList.remove('hidden'); logsModal.setAttribute('aria-hidden','false'); renderLogs(); });
if (closeLogsBtn) closeLogsBtn.addEventListener('click', () => { logsModal.classList.add('hidden'); logsModal.setAttribute('aria-hidden','true'); });
if (clearLogsBtn) clearLogsBtn.addEventListener('click', () => { if (!confirm('确认清空所有日志？')) return; saveLogs([]); renderLogs(); alert('已清空日志'); });

appForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const recordId = document.getElementById('recordId').value;
  const item = {
    id: recordId || crypto.randomUUID(),
    company: document.getElementById('company').value.trim(),
    position: document.getElementById('position').value.trim(),
    city: document.getElementById('city').value.trim(),
    type: document.getElementById('type').value,
    source: document.getElementById('source').value,
    date: document.getElementById('date').value,
    stage: document.getElementById('stage').value,
    link: document.getElementById('link').value.trim(),
    interviewExp: document.getElementById('interviewExp').value.trim(),
    notes: document.getElementById('notes').value.trim()
  };

  if (!item.company || !item.position || !item.date) {
    alert('公司、岗位和投递日期不能为空');
    return;
  }

  const data = readData();
  let next;
  if (recordId) {
    next = data.map((it) => (it.id === recordId ? item : it));
  } else {
    next = [item, ...data];
  }
  saveData(next);
  appForm.reset();
  document.getElementById('date').valueAsDate = new Date();
  closeModal();
  render();
});

searchInput.addEventListener('input', renderList);
filterStage.addEventListener('change', renderList);
filterType.addEventListener('change', renderList);
sortOrder.addEventListener('change', renderList);

openFormBtn.addEventListener('click', openModal);
closeFormBtn.addEventListener('click', closeModal);
cancelFormBtn.addEventListener('click', closeModal);

clearAllBtn.addEventListener('click', () => {
  if (window.confirm('确认清空所有投递记录？这会从 0 开始重新记录。')) {
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
});

document.getElementById('date').valueAsDate = new Date();

// 自动尝试从自动备份恢复（仅在主数据为空时提示用户）
try {
  const main = localStorage.getItem(STORAGE_KEY);
  const bakRaw = localStorage.getItem(`${STORAGE_KEY}-backup`);
  if ((!main || main === '[]') && bakRaw) {
    try {
      const bak = JSON.parse(bakRaw);
      if (bak && Array.isArray(bak.data) && bak.data.length) {
        if (confirm('检测到自动备份数据，是否恢复？（恢复会覆盖当前数据）')) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(bak.data));
          alert('已从自动备份恢复，页面将刷新');
          location.reload();
        }
      }
    } catch (e) {
      console.warn('自动备份解析失败', e);
    }
  }
} catch (e) {
  console.warn('恢复检查失败', e);
}

render();

// overview button: scroll to table panel
if (overviewBtn) {
  overviewBtn.addEventListener('click', () => {
    const el = document.querySelector('.table-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// 导出按钮
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'qiuzhao-backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
}

// 导入按钮
if (importBtn) {
  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = () => {
      const f = input.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const parsed = JSON.parse(r.result);
          if (!Array.isArray(parsed)) throw new Error('文件不是记录数组');
          const prev = localStorage.getItem(STORAGE_KEY);
          if (prev) {
            const bak = { ts: Date.now(), data: JSON.parse(prev) };
            localStorage.setItem(`${STORAGE_KEY}-backup`, JSON.stringify(bak));
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          alert('导入成功，页面将刷新以应用新数据');
          location.reload();
        } catch (e) { alert('导入失败：' + e.message); }
      };
      r.readAsText(f);
    };
    document.body.appendChild(input); input.click(); input.remove();
  });
}

// 恢复备份按钮
if (restoreBtn) {
  restoreBtn.addEventListener('click', () => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}-backup`);
      if (!raw) { alert('未找到自动备份记录'); return; }
      const bak = JSON.parse(raw);
      if (!bak || !Array.isArray(bak.data)) { alert('备份格式异常'); return; }
      const ts = bak.ts ? new Date(bak.ts).toLocaleString() : '未知时间';
      if (!confirm(`检测到自动备份（${ts}），确认恢复并覆盖当前数据？`)) return;
      const cur = localStorage.getItem(STORAGE_KEY);
      if (cur) {
        const curBak = { ts: Date.now(), data: JSON.parse(cur) };
        localStorage.setItem(`${STORAGE_KEY}-pre-restore-backup`, JSON.stringify(curBak));
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bak.data));
      alert('已恢复备份，页面将刷新');
      location.reload();
    } catch (e) { alert('恢复失败：' + e.message); }
  });
}
