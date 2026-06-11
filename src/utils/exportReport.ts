import type { ActivityStage, Task } from '@/types';
import { formatNumber, formatDate, formatDateTime } from '@/utils/format';
import { sumStageEmissions, sumTotalEmissions } from '@/utils/emission';

export interface ExportFilters {
  selectedProduct: string;
  selectedProductLabel: string;
  selectedSuppliers: string[];
  selectedSuppliersLabels: string[];
  dateFrom: string;
  dateTo: string;
}

export interface ExportSummaryRow {
  productId: string;
  productName: string;
  productCode: string;
  totalEmission: number;
  materialEmission: number;
  productionEmission: number;
  transportEmission: number;
  supplierCount: number;
  hasAnomaly: boolean;
  status: 'complete' | 'partial' | 'pending';
}

export interface ExportStageData {
  task: Task;
  stageEmissions: {
    material: number;
    production: number;
    transport: number;
    total: number;
  };
}

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function getStatusLabel(status: 'complete' | 'partial' | 'pending'): string {
  const labels = {
    complete: '已完成',
    partial: '进行中',
    pending: '待填报',
  };
  return labels[status];
}

function getStageLabel(stage: ActivityStage): string {
  const labels = {
    material: '原材料获取',
    production: '生产制造',
    transport: '运输配送',
  };
  return labels[stage];
}

function buildFiltersText(filters: ExportFilters): string[] {
  const lines: string[] = [];
  lines.push(`产品：${filters.selectedProductLabel}`);
  if (filters.selectedSuppliersLabels.length > 0) {
    lines.push(`供应商：${filters.selectedSuppliersLabels.join('、')}`);
  } else {
    lines.push('供应商：全部');
  }
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom || '不限';
    const to = filters.dateTo || '不限';
    lines.push(`日期范围：${from} 至 ${to}`);
  } else {
    lines.push('日期范围：全部');
  }
  return lines;
}

export async function exportToPDF(
  filters: ExportFilters,
  summaryData: ExportSummaryRow[],
  stageData: ExportStageData[]
): Promise<void> {
  const now = new Date();
  const filterLines = buildFiltersText(filters);
  const totalEmission = summaryData.reduce((sum, r) => sum + r.totalEmission, 0);
  const totalMaterial = summaryData.reduce((sum, r) => sum + r.materialEmission, 0);
  const totalProduction = summaryData.reduce((sum, r) => sum + r.productionEmission, 0);
  const totalTransport = summaryData.reduce((sum, r) => sum + r.transportEmission, 0);

  const summaryRowsHTML = summaryData.length === 0
    ? `<tr><td colspan="9" style="text-align:center;padding:16px;color:#94a3b8;">暂无数据</td></tr>`
    : summaryData.map((row) => {
        const total = row.totalEmission || 1;
        const matPct = ((row.materialEmission / total) * 100).toFixed(1);
        const prodPct = ((row.productionEmission / total) * 100).toFixed(1);
        const transPct = ((row.transportEmission / total) * 100).toFixed(1);
        const statusColor = row.status === 'complete' ? '#15803d' : row.status === 'partial' ? '#ca8a04' : '#64748b';
        const statusBg = row.status === 'complete' ? '#dcfce7' : row.status === 'partial' ? '#fef9c3' : '#f1f5f9';
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${row.productName}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${row.productCode}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:#166534;">${formatNumber(row.totalEmission)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatNumber(row.materialEmission)} (${matPct}%)</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatNumber(row.productionEmission)} (${prodPct}%)</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatNumber(row.transportEmission)} (${transPct}%)</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${row.supplierCount}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${row.hasAnomaly ? '⚠️' : '-'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;"><span style="display:inline-block;padding:2px 8px;border-radius:9999px;background:${statusBg};color:${statusColor};font-size:12px;">${getStatusLabel(row.status)}</span></td>
          </tr>
        `;
      }).join('');

  const stageDetailsHTML = stageData.length === 0
    ? `<p style="color:#94a3b8;padding:16px;text-align:center;">暂无详细数据</p>`
    : stageData.map((sd) => {
        const task = sd.task;
        const latestVersion = task.versions[task.versions.length - 1];
        const activityData = latestVersion?.data ?? [];
        const stages: ActivityStage[] = ['material', 'production', 'transport'];
        const stageTablesHTML = stages.map((stage) => {
          const items = activityData.filter((d) => d.stage === stage);
          if (items.length === 0) {
            return `
              <div style="margin-top:12px;">
                <h4 style="font-size:13px;color:#334155;margin:0 0 8px 0;">${getStageLabel(stage)}</h4>
                <p style="color:#94a3b8;font-size:12px;margin:0;">暂无数据</p>
              </div>
            `;
          }
          const stageTotal = sumStageEmissions(activityData, stage);
          const rows = items.map((item) => `
            <tr>
              <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;">${item.name || '-'}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:right;">${item.quantity != null ? formatNumber(item.quantity) : '-'}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;">${item.unit || '-'}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:500;color:#166534;">${item.emission != null ? formatNumber(item.emission) : '-'}</td>
            </tr>
          `).join('');
          return `
            <div style="margin-top:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <h4 style="font-size:13px;color:#334155;margin:0;">${getStageLabel(stage)}</h4>
                <span style="font-size:12px;color:#166534;font-weight:600;">阶段合计：${formatNumber(stageTotal)} kgCO₂e</span>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #e2e8f0;color:#475569;">活动名称</th>
                    <th style="padding:6px 10px;text-align:right;border-bottom:1px solid #e2e8f0;color:#475569;">数量</th>
                    <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #e2e8f0;color:#475569;">单位</th>
                    <th style="padding:6px 10px;text-align:right;border-bottom:1px solid #e2e8f0;color:#475569;">排放 (kgCO₂e)</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `;
        }).join('');
        return `
          <div style="margin-top:20px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <h3 style="font-size:15px;color:#166534;margin:0;">${task.productName} - ${task.supplierName}</h3>
              <span style="font-size:12px;color:#64748b;">创建：${formatDate(task.createdAt)}</span>
            </div>
            <div style="display:flex;gap:16px;font-size:12px;color:#475569;margin-bottom:8px;">
              <span>原材料：<strong style="color:#15803d;">${formatNumber(sd.stageEmissions.material)}</strong></span>
              <span>生产：<strong style="color:#15803d;">${formatNumber(sd.stageEmissions.production)}</strong></span>
              <span>运输：<strong style="color:#15803d;">${formatNumber(sd.stageEmissions.transport)}</strong></span>
              <span>总计：<strong style="color:#15803d;">${formatNumber(sd.stageEmissions.total)}</strong> kgCO₂e</span>
            </div>
            ${stageTablesHTML}
          </div>
        `;
      }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <title>碳排放汇总报告</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #ffffff; }
        @media print {
          body { padding: 20px; }
        }
        .report-header { text-align: center; border-bottom: 2px solid #166534; padding-bottom: 20px; margin-bottom: 24px; }
        .report-title { font-size: 24px; font-weight: 700; color: #166534; margin: 0 0 8px 0; }
        .report-subtitle { font-size: 13px; color: #64748b; margin: 0; }
        .section { margin-bottom: 28px; }
        .section-title { font-size: 16px; font-weight: 600; color: #166534; margin: 0 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #d1fae5; }
        .filters-box { background: #f0fdf4; padding: 12px 16px; border-radius: 8px; border: 1px solid #bbf7d0; }
        .filters-box p { margin: 4px 0; font-size: 13px; color: #334155; }
        .summary-total { display: flex; gap: 24px; margin-bottom: 16px; flex-wrap: wrap; }
        .total-item { flex: 1; min-width: 140px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #166534; }
        .total-label { font-size: 12px; color: #64748b; margin: 0 0 4px 0; }
        .total-value { font-size: 18px; font-weight: 700; color: #15803d; margin: 0; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f0fdf4; padding: 10px 12px; text-align: left; border-bottom: 2px solid #86efac; color: #166534; font-weight: 600; }
        th.text-right, td.text-right { text-align: right; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
        tr:hover { background: #f8fafc; }
        .report-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1 class="report-title">产品碳排放汇总报告</h1>
        <p class="report-subtitle">生成时间：${formatDateTime(now.toISOString())}</p>
      </div>

      <div class="section">
        <h2 class="section-title">筛选条件</h2>
        <div class="filters-box">
          ${filterLines.map((l) => `<p>${l}</p>`).join('')}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">汇总统计</h2>
        <div class="summary-total">
          <div class="total-item">
            <p class="total-label">产品总数</p>
            <p class="total-value">${summaryData.length}</p>
          </div>
          <div class="total-item">
            <p class="total-label">原材料排放 (kgCO₂e)</p>
            <p class="total-value">${formatNumber(totalMaterial)}</p>
          </div>
          <div class="total-item">
            <p class="total-label">生产排放 (kgCO₂e)</p>
            <p class="total-value">${formatNumber(totalProduction)}</p>
          </div>
          <div class="total-item">
            <p class="total-label">运输排放 (kgCO₂e)</p>
            <p class="total-value">${formatNumber(totalTransport)}</p>
          </div>
          <div class="total-item" style="border-left-color:#15803d;">
            <p class="total-label">总排放量 (kgCO₂e)</p>
            <p class="total-value" style="color:#166534;">${formatNumber(totalEmission)}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">产品汇总表</h2>
        <table>
          <thead>
            <tr>
              <th>产品名称</th>
              <th>产品编码</th>
              <th style="text-align:right;">总排放 (kgCO₂e)</th>
              <th style="text-align:right;">原材料</th>
              <th style="text-align:right;">生产</th>
              <th style="text-align:right;">运输</th>
              <th style="text-align:center;">供应商数</th>
              <th style="text-align:center;">异常</th>
              <th style="text-align:center;">状态</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRowsHTML}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">各阶段排放明细</h2>
        ${stageDetailsHTML}
      </div>

      <div class="report-footer">
        <p>本报告由碳排放管理系统自动生成 · 仅供参考</p>
        <p style="margin-top:4px;">生成时间戳：${now.getTime()}</p>
      </div>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
  }

  await new Promise<void>((resolve) => {
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 100);
          resolve();
        }
      }, 500);
    };
  });
}

export function exportToExcel(
  filters: ExportFilters,
  summaryData: ExportSummaryRow[],
  stageData: ExportStageData[]
): void {
  const now = new Date();
  const filterLines = buildFiltersText(filters);
  const totalEmission = summaryData.reduce((sum, r) => sum + r.totalEmission, 0);
  const totalMaterial = summaryData.reduce((sum, r) => sum + r.materialEmission, 0);
  const totalProduction = summaryData.reduce((sum, r) => sum + r.productionEmission, 0);
  const totalTransport = summaryData.reduce((sum, r) => sum + r.transportEmission, 0);

  const lines: string[] = [];

  lines.push('产品碳排放汇总报告');
  lines.push(`生成时间：${formatDateTime(now.toISOString())}`);
  lines.push('');

  lines.push('===== 筛选条件 =====');
  filterLines.forEach((l) => lines.push(l));
  lines.push('');

  lines.push('===== 汇总统计 =====');
  lines.push(`产品总数\t${summaryData.length}`);
  lines.push(`原材料排放 (kgCO₂e)\t${formatNumber(totalMaterial)}`);
  lines.push(`生产排放 (kgCO₂e)\t${formatNumber(totalProduction)}`);
  lines.push(`运输排放 (kgCO₂e)\t${formatNumber(totalTransport)}`);
  lines.push(`总排放量 (kgCO₂e)\t${formatNumber(totalEmission)}`);
  lines.push('');

  lines.push('===== 产品汇总表 =====');
  lines.push([
    '产品名称',
    '产品编码',
    '总排放 (kgCO₂e)',
    '原材料排放 (kgCO₂e)',
    '生产排放 (kgCO₂e)',
    '运输排放 (kgCO₂e)',
    '原材料占比 (%)',
    '生产占比 (%)',
    '运输占比 (%)',
    '供应商数量',
    '是否有异常',
    '状态',
  ].join('\t'));

  if (summaryData.length === 0) {
    lines.push('暂无数据');
  } else {
    summaryData.forEach((row) => {
      const total = row.totalEmission || 1;
      const matPct = ((row.materialEmission / total) * 100).toFixed(1);
      const prodPct = ((row.productionEmission / total) * 100).toFixed(1);
      const transPct = ((row.transportEmission / total) * 100).toFixed(1);
      lines.push([
        row.productName,
        row.productCode,
        formatNumber(row.totalEmission),
        formatNumber(row.materialEmission),
        formatNumber(row.productionEmission),
        formatNumber(row.transportEmission),
        matPct,
        prodPct,
        transPct,
        row.supplierCount.toString(),
        row.hasAnomaly ? '是' : '否',
        getStatusLabel(row.status),
      ].join('\t'));
    });
  }
  lines.push('');

  lines.push('===== 各阶段排放明细 =====');
  if (stageData.length === 0) {
    lines.push('暂无详细数据');
  } else {
    stageData.forEach((sd) => {
      const task = sd.task;
      const latestVersion = task.versions[task.versions.length - 1];
      const activityData = latestVersion?.data ?? [];

      lines.push('');
      lines.push(`【任务】${task.productName} - ${task.supplierName}`);
      lines.push(`产品编码：${task.productCode}\t创建时间：${formatDate(task.createdAt)}`);
      lines.push(`原材料：${formatNumber(sd.stageEmissions.material)}\t生产：${formatNumber(sd.stageEmissions.production)}\t运输：${formatNumber(sd.stageEmissions.transport)}\t总计：${formatNumber(sd.stageEmissions.total)} kgCO₂e`);

      const stages: ActivityStage[] = ['material', 'production', 'transport'];
      stages.forEach((stage) => {
        lines.push('');
        lines.push(`--- ${getStageLabel(stage)} ---`);
        const items = activityData.filter((d) => d.stage === stage);
        if (items.length === 0) {
          lines.push('暂无数据');
        } else {
          lines.push(['活动名称', '描述', '数量', '单位', '排放因子ID', '排放 (kgCO₂e)', '备注'].join('\t'));
          items.forEach((item) => {
            lines.push([
              item.name || '-',
              item.description || '-',
              item.quantity != null ? formatNumber(item.quantity) : '-',
              item.unit || '-',
              item.factorId || '-',
              item.emission != null ? formatNumber(item.emission) : '-',
              item.remark || '-',
            ].join('\t'));
          });
          const stageTotal = sumStageEmissions(activityData, stage);
          lines.push(`阶段合计\t\t\t\t\t${formatNumber(stageTotal)}`);
        }
      });
      lines.push('');
      lines.push('----------------------------------------');
    });
  }

  const tsvContent = lines.join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + tsvContent], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = `碳排放汇总报告_${getTimestamp()}.xls`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
