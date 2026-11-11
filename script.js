const STORAGE_KEY = 'qiuzhao-applications-v1';
const LOG_KEY = `${STORAGE_KEY}-log`;

const stageMeta = {
  '已投简历': { className: 'default' },
  '简历挂': { className: 'failed' },
  '一面': { className: 'interview' },
  '一面挂': { className: 'failed' },
  '二面': { className: 'test' },
  '二面挂': { className: 'failed' },
  'offer': { className: 'passed' },
  '拒绝': { className: 'failed' }
};

const TYPE_MIGRATION = {
  '嵌入式软件': '嵌入式软件开发',
  '驱动开发': '嵌入式linux驱动开发',
  'BSP/底层开发': '嵌入式bsp开发'
};

function migrateTypes() {
  const data = readData();
  let changed = false;
  const next = data.map((item) => {
    const mapped = TYPE_MIGRATION[item.type];
    if (mapped && item.type !== mapped) {
      changed = true;
      return { ...item, type: mapped };
    }
    return item;
  });
  if (changed) {
    saveData(next);
    addLog('migrate', { company: '数据迁移', position: '岗位方向分类更新' });
  }
  return changed;
}

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
const detailModal = document.getElementById('detailModal');
const logsModal = document.getElementById('logsModal');
const openFormBtn = document.getElementById('openFormBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const overviewBtn = document.getElementById('overviewBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const restoreBtn = document.getElementById('restoreBtn');
const logsBtn = document.getElementById('logsBtn');
const closeLogsBtn = document.getElementById('closeLogsBtn');
const logsContent = document.getElementById('logsContent');
const clearLogsBtn = document.getElementById('clearLogsBtn');

function readData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function addLog(action, item) {
  const logs = getLogs();
  logs.unshift({ id: crypto.randomUUID(), ts: Date.now(), action, item });
  if (logs.length > 200) logs.length = 200;
  saveLogs(logs);
}

function openModal() {
  formModal.classList.remove('hidden');
  formModal.setAttribute('aria-hidden', 'false');
}

function openAddForm() {
  appForm.reset();
  document.getElementById('recordId').value = '';
  document.getElementById('date').valueAsDate = new Date();
  setFormMode(false);
  openModal();
}

function openEditForm(item) {
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
  setFormMode(true);
  openModal();
}

function setFormMode(isEdit) {
  document.getElementById('formTitle').textContent = isEdit ? '编辑投递公司' : '新增投递公司';
  document.getElementById('formSubmitBtn').textContent = isEdit ? '保存修改' : '新增';
}

function closeModal() {
  formModal.classList.add('hidden');
  formModal.setAttribute('aria-hidden', 'true');
}

function openDetailModal(item) {
  if (!detailModal) return;
  document.getElementById('d_company').textContent = item.company || '';
  document.getElementById('d_position').textContent = item.position || '';
  document.getElementById('d_city').textContent = item.city || '';
  document.getElementById('d_type').textContent = item.type || '';
  document.getElementById('d_stage').textContent = item.stage || '';
  document.getElementById('d_date').textContent = item.date || '';
  document.getElementById('d_source').textContent = item.source || '';
  const dLink = document.getElementById('d_link');
  if (item.link) {
    dLink.href = item.link;
    dLink.textContent = item.link;
  } else {
    dLink.href = '#';
    dLink.textContent = '暂无链接';
  }
  document.getElementById('d_interviewExp').textContent = item.interviewExp || '暂无面试经验';
  document.getElementById('d_notes').textContent = item.notes || '暂无备注';
  detailModal.classList.remove('hidden');
  detailModal.setAttribute('aria-hidden', 'false');
}

function closeDetailModal() {
  if (!detailModal) return;
  detailModal.classList.add('hidden');
  detailModal.setAttribute('aria-hidden', 'true');
}

function getFilteredData() {
  const keyword = (searchInput.value || '').trim().toLowerCase();
  const selectedStage = filterStage.value;
  const selectedType = filterType.value;
  const currentSort = sortOrder.value;
  let data = readData();

  data = data.filter((item) => {
    const haystack = `${item.company || ''} ${item.position || ''} ${item.city || ''} ${item.type || ''} ${item.notes || ''}`.toLowerCase();
    const matchesKeyword = !keyword || haystack.includes(keyword);
    const matchesStage = selectedStage === '全部' || item.stage === selectedStage;
    const matchesType = selectedType === '全部' || item.type === selectedType;
    return matchesKeyword && matchesStage && matchesType;
  });

  data.sort((a, b) => {
    const t1 = new Date(a.date || '2000-01-01').getTime();
    const t2 = new Date(b.date || '2000-01-01').getTime();
    return currentSort === 'time-asc' ? t1 - t2 : t2 - t1;
  });

  return data;
}

function renderStats() {
  const data = readData();
  const total = data.length;
  const inProgress = data.filter((item) => ['已投简历', '一面', '二面'].includes(item.stage)).length;
  const failed = data.filter((item) => ['简历挂', '一面挂', '二面挂', '拒绝'].includes(item.stage)).length;
  const passed = data.filter((item) => item.stage === 'offer').length;
  const types = new Set(data.map((item) => item.type || '其他')).size;

  const stats = [
    { label: '投递总数', value: total },
    { label: '进行中', value: inProgress },
    { label: '已挂', value: failed },
    { label: 'offer', value: passed },
    { label: '岗位方向', value: types }
  ];

  statsGrid.innerHTML = stats.map((s) => `
    <div class="stat-card">
      <div class="value">${s.value}</div>
      <div class="label">${s.label}</div>
    </div>
  `).join('');
}

function renderAnalytics() {
  const data = readData();
  const total = data.length || 1;
  const stageOrder = ['已投简历', '简历挂', '一面', '一面挂', '二面', '二面挂', 'offer', '拒绝'];
  const stageCounts = stageOrder.map((stage) => ({ stage, count: data.filter((i) => i.stage === stage).length }));
  const maxStage = Math.max(...stageCounts.map((i) => i.count), 1);

  const cityCounts = Object.entries(data.reduce((acc, item) => {
    const key = item.city || '未知';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const stageHtml = stageCounts.map((item) => {
    const pct = Math.round((item.count / maxStage) * 100);
    let fillClass = '';
    if (item.stage === 'offer') fillClass = 'offer';
    else if (['简历挂', '一面挂', '二面挂', '拒绝'].includes(item.stage)) fillClass = 'reject';
    else if (item.stage === '一面' || item.stage === '二面') fillClass = 'warning';
    return `
      <div class="stage-row">
        <span>${item.stage}</span>
        <div class="progress-bar">
          <div class="progress-fill ${fillClass}" style="width:${item.count ? Math.max(pct, 8) : 0}%"></div>
        </div>
        <strong>${item.count}</strong>
      </div>
    `;
  }).join('');

  const cityHtml = cityCounts.map(([city, count]) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="city-row">
        <span>${city}</span>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${Math.max(pct, 8)}%"></div>
        </div>
        <strong>${count}</strong>
      </div>
    `;
  }).join('');

  const offerRate = Math.round((data.filter((i) => i.stage === 'offer').length / total) * 100);
  const inProgress = data.filter((i) => ['已投简历', '一面', '二面'].includes(i.stage)).length;

  analyticsPanel.innerHTML = `
    <div class="analytics-card">
      <h3>阶段分布</h3>
      <div class="stage-list">${stageHtml}</div>
    </div>
    <div class="analytics-card">
      <h3>城市统计</h3>
      <div class="city-list">${cityHtml || '<div class="empty-state">暂无城市数据</div>'}</div>
      <div class="analytics-summary" style="margin-top:16px;">
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
  overviewTableBody.innerHTML = data.map((item) => {
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
  }).join('');

  overviewTableBody.querySelectorAll('.detail-row-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('tr').dataset.id;
      const item = readData().find((it) => it.id === id);
      if (!item) return;
      openDetailModal(item);
    });
  });

  overviewTableBody.querySelectorAll('.edit-row-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('tr').dataset.id;
      const item = readData().find((it) => it.id === id);
      if (!item) return;
      openEditForm(item);
    });
  });
}

function renderCardList() {
  const data = getFilteredData();
  if (!data.length) {
    appList.innerHTML = '<div class="empty-state">没有符合条件的投递记录，试试调整筛选条件或新增一条记录。</div>';
    return;
  }

  appList.innerHTML = data.map((item) => {
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
      </article>
    `;
  }).join('');

  appList.querySelectorAll('.detail-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('.application-card').dataset.id;
      const item = readData().find((it) => it.id === id);
      if (!item) return;
      openDetailModal(item);
    });
  });

  appList.querySelectorAll('.edit-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('.application-card').dataset.id;
      const item = readData().find((it) => it.id === id);
      if (!item) return;
      openEditForm(item);
    });
  });
}

function renderLogs() {
  const logs = getLogs();
  if (!logs.length) {
    logsContent.innerHTML = '<div class="empty-state">暂无日志</div>';
    return;
  }
  logsContent.innerHTML = logs.map((log) => {
    const item = log.item || {};
    return `
      <div style="padding:10px 0; border-bottom:1px solid var(--line);">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
          <strong>${log.action}</strong>
          <small>${new Date(log.ts).toLocaleString()}</small>
        </div>
        <div style="margin-top:6px; color:var(--muted);">${item.company || '未知公司'} — ${item.position || '未知岗位'}</div>
        ${log.action === 'delete' ? `<button class="secondary-btn restore-log-btn" data-id="${log.id}">恢复</button>` : ''}
      </div>
    `;
  }).join('');

  logsContent.querySelectorAll('.restore-log-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const logs = getLogs();
      const entry = logs.find((log) => log.id === id);
      if (!entry) return alert('日志项不存在');
      const data = readData();
      if (data.some((it) => it.id === entry.item.id)) return alert('记录已存在');
      data.unshift(entry.item);
      saveData(data);
      saveLogs(logs.filter((log) => log.id !== id));
      render();
      renderLogs();
      alert('已恢复该条记录');
    });
  });
}

function render() {
  renderStats();
  renderAnalytics();
  renderOverviewTable();
  renderCardList();
}

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
    addLog('edit', item);
  } else {
    next = [item, ...data];
    addLog('add', item);
  }
  saveData(next);
  appForm.reset();
  document.getElementById('date').valueAsDate = new Date();
  closeModal();
  render();
});

openFormBtn.addEventListener('click', openAddForm);
closeFormBtn.addEventListener('click', closeModal);
cancelFormBtn.addEventListener('click', closeModal);
closeDetailBtn.addEventListener('click', closeDetailModal);
detailModal.addEventListener('click', (event) => { if (event.target === detailModal) closeDetailModal(); });

searchInput.addEventListener('input', render);
filterStage.addEventListener('change', render);
filterType.addEventListener('change', render);
sortOrder.addEventListener('change', render);

overviewBtn.addEventListener('click', () => {
  const el = document.querySelector('.table-panel');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

exportBtn.addEventListener('click', async () => {
  const raw = JSON.stringify(readData());
  if (location.protocol !== 'file:') {
    let response;
    try {
      response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: raw,
      });
    } catch (error) {
      alert('导出失败：无法连接本地备份服务。' + error.message);
      return;
    }

    if (![404, 405, 501].includes(response.status)) {
      let result;
      try {
        result = await response.json();
      } catch {
        alert('导出失败：备份服务返回了无效响应');
        return;
      }
      if (!response.ok) {
        alert('导出失败：' + (result.error || '保存备份失败'));
        return;
      }
      alert(`备份已保存到 exe 同目录的 backups 文件夹：\n${result.filename}`);
      return;
    }
  }

  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'qiuzhao-backup.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('数据不是数组');
        const prev = readData();
        if (prev.length) {
          localStorage.setItem(`${STORAGE_KEY}-backup`, JSON.stringify({ ts: Date.now(), data: prev }));
        }
        saveData(parsed);
        render();
        location.reload();
      } catch (e) {
        alert('导入失败：' + e.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

restoreBtn.addEventListener('click', () => {
  const raw = localStorage.getItem(`${STORAGE_KEY}-backup`);
  if (!raw) {
    alert('没有找到备份数据');
    return;
  }
  try {
    const bak = JSON.parse(raw);
    if (!bak || !Array.isArray(bak.data)) {
      alert('备份数据格式异常');
      return;
    }
    if (!confirm('确认恢复到最后一次自动备份？')) return;
    saveData(bak.data);
    render();
    location.reload();
  } catch (e) {
    alert('恢复失败：' + e.message);
  }
});

logsBtn.addEventListener('click', () => {
  renderLogs();
  logsModal.classList.remove('hidden');
  logsModal.setAttribute('aria-hidden', 'false');
});

closeLogsBtn.addEventListener('click', () => {
  logsModal.classList.add('hidden');
  logsModal.setAttribute('aria-hidden', 'true');
});

clearLogsBtn.addEventListener('click', () => {
  if (!confirm('确认清空所有日志？')) return;
  saveLogs([]);
  renderLogs();
});

clearAllBtn.addEventListener('click', () => {
  if (!confirm('确认清空所有投递记录？')) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
});

try {
  const main = localStorage.getItem(STORAGE_KEY);
  const bak = localStorage.getItem(`${STORAGE_KEY}-backup`);
  if ((!main || main === '[]') && bak) {
    const parsed = JSON.parse(bak);
    if (parsed && Array.isArray(parsed.data) && parsed.data.length) {
      if (confirm('检测到自动备份，是否恢复？')) {
        saveData(parsed.data);
        location.reload();
      }
    }
  }
} catch {}

document.getElementById('date').valueAsDate = new Date();
migrateTypes();
render();
