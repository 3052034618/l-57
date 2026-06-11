import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  Package,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  RotateCcw,
  Eye,
  CalendarRange,
  ChevronRight,
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useUserStore } from '@/store/useUserStore';
import { useUINotificationStore } from '@/store/useUINotificationStore';
import StatCard from '@/components/business/StatCard';
import StatusTag from '@/components/common/StatusTag';
import { mockProducts } from '@/data/mockProducts';
import { mockSuppliers } from '@/data/mockSuppliers';
import { formatNumber, formatEmission, formatDate } from '@/utils/format';
import { sumStageEmissions, sumTotalEmissions } from '@/utils/emission';
import { cn } from '@/lib/utils';
import type { ActivityStage, Task } from '@/types';

interface ProductSummaryRow {
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
  tasks: Task[];
}

export default function SummaryPage() {
  const { tasks } = useTaskStore();
  const { userRole } = useUserStore();
  const showToast = useUINotificationStore((s) => s.showToast);

  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const visibleTasks = useMemo(() => {
    let result = [...tasks];

    if (userRole === 'supplier') {
      result = result.filter((t) => t.supplierId === 'sup-001');
    }

    if (selectedProduct !== 'all') {
      result = result.filter((t) => t.productId === selectedProduct);
    }

    if (selectedSuppliers.length > 0) {
      result = result.filter((t) => selectedSuppliers.includes(t.supplierId));
    }

    if (dateFrom) {
      result = result.filter((t) => t.createdAt >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((t) => t.createdAt <= dateTo + 'T23:59:59Z');
    }

    return result;
  }, [tasks, userRole, selectedProduct, selectedSuppliers, dateFrom, dateTo]);

  const productSummaries = useMemo<ProductSummaryRow[]>(() => {
    const productMap = new Map<string, ProductSummaryRow>();

    visibleTasks.forEach((task) => {
      const latestVersion = task.versions[task.versions.length - 1];
      const activityData = latestVersion?.data ?? [];

      const materialEmission = sumStageEmissions(activityData, 'material');
      const productionEmission = sumStageEmissions(activityData, 'production');
      const transportEmission = sumStageEmissions(activityData, 'transport');
      const totalEmission = sumTotalEmissions(activityData);

      if (!productMap.has(task.productId)) {
        productMap.set(task.productId, {
          productId: task.productId,
          productName: task.productName,
          productCode: task.productCode,
          totalEmission: 0,
          materialEmission: 0,
          productionEmission: 0,
          transportEmission: 0,
          supplierCount: 0,
          hasAnomaly: false,
          status: 'pending',
          tasks: [],
        });
      }

      const summary = productMap.get(task.productId)!;
      summary.totalEmission += totalEmission;
      summary.materialEmission += materialEmission;
      summary.productionEmission += productionEmission;
      summary.transportEmission += transportEmission;
      summary.tasks.push(task);

      if (task.anomalies.length > 0) {
        summary.hasAnomaly = true;
      }
    });

    const supplierSetMap = new Map<string, Set<string>>();
    visibleTasks.forEach((task) => {
      if (!supplierSetMap.has(task.productId)) {
        supplierSetMap.set(task.productId, new Set());
      }
      supplierSetMap.get(task.productId)!.add(task.supplierId);
    });

    productMap.forEach((summary, productId) => {
      summary.supplierCount = supplierSetMap.get(productId)?.size ?? 0;

      const approvedCount = summary.tasks.filter(
        (t) => t.status === 'approved'
      ).length;
      const submittedCount = summary.tasks.filter(
        (t) => t.status === 'submitted' || t.status === 'auditing'
      ).length;

      if (approvedCount === summary.tasks.length && summary.tasks.length > 0) {
        summary.status = 'complete';
      } else if (submittedCount > 0 || approvedCount > 0) {
        summary.status = 'partial';
      } else {
        summary.status = 'pending';
      }
    });

    return Array.from(productMap.values());
  }, [visibleTasks]);

  const stats = useMemo(() => {
    const totalProducts = productSummaries.length;
    const totalEmission = productSummaries.reduce(
      (sum, p) => sum + p.totalEmission,
      0
    );
    const completedProducts = productSummaries.filter(
      (p) => p.status === 'complete'
    ).length;
    const anomalyProducts = productSummaries.filter((p) => p.hasAnomaly).length;

    return { totalProducts, totalEmission, completedProducts, anomalyProducts };
  }, [productSummaries]);

  const stackedBarOption = useMemo(() => {
    const stages: ActivityStage[] = ['material', 'production', 'transport'];
    const stageLabels = ['原材料', '生产', '运输'];
    const colors = ['#2D6A4F', '#7FB394', '#40916C'];

    const series = stages.map((stage, idx) => ({
      name: stageLabels[idx],
      type: 'bar' as const,
      stack: 'total',
      emphasis: { focus: 'series' as const },
      itemStyle: { color: colors[idx] },
      data: productSummaries.map((p) => {
        if (stage === 'material') return Number(p.materialEmission.toFixed(2));
        if (stage === 'production') return Number(p.productionEmission.toFixed(2));
        return Number(p.transportEmission.toFixed(2));
      }),
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' as const },
        formatter: (params: unknown) => {
          const p = params as Array<{ name: string; seriesName: string; value: number }>;
          if (!p || p.length === 0) return '';
          let result = `<div class="font-medium">${p[0].name}</div>`;
          let total = 0;
          p.forEach((item) => {
            result += `<div class="flex justify-between gap-4 mt-1">
              <span>${item.seriesName}：</span>
              <span class="font-medium">${formatNumber(item.value)} kgCO₂e</span>
            </div>`;
            total += item.value;
          });
          result += `<div class="border-t mt-2 pt-2 flex justify-between gap-4">
            <span class="font-medium">总计：</span>
            <span class="font-semibold text-forest-600">${formatNumber(total)} kgCO₂e</span>
          </div>`;
          return result;
        },
      },
      legend: {
        data: stageLabels,
        bottom: 0,
        textStyle: { color: '#475569' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category' as const,
        data: productSummaries.map((p) => p.productName),
        axisLabel: {
          color: '#475569',
          interval: 0,
          rotate: productSummaries.length > 3 ? 20 : 0,
          fontSize: 11,
        },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
      },
      yAxis: {
        type: 'value' as const,
        name: '排放量 (kgCO₂e)',
        nameTextStyle: { color: '#64748B', fontSize: 11 },
        axisLabel: { color: '#64748B' },
        splitLine: { lineStyle: { color: '#E2E8F0' } },
      },
      series,
    };
  }, [productSummaries]);

  const supplierEmissions = useMemo(() => {
    const map = new Map<string, { name: string; material: number; production: number; transport: number; total: number }>();

    visibleTasks.forEach((task) => {
      const latestVersion = task.versions[task.versions.length - 1];
      const activityData = latestVersion?.data ?? [];

      const material = sumStageEmissions(activityData, 'material');
      const production = sumStageEmissions(activityData, 'production');
      const transport = sumStageEmissions(activityData, 'transport');
      const total = material + production + transport;

      if (!map.has(task.supplierId)) {
        map.set(task.supplierId, {
          name: task.supplierName,
          material: 0,
          production: 0,
          transport: 0,
          total: 0,
        });
      }

      const s = map.get(task.supplierId)!;
      s.material += material;
      s.production += production;
      s.transport += transport;
      s.total += total;
    });

    return Array.from(map.values());
  }, [visibleTasks]);

  const radarOption = useMemo(() => {
    if (supplierEmissions.length === 0) {
      return {};
    }

    const maxMaterial = Math.max(...supplierEmissions.map((s) => s.material), 1);
    const maxProduction = Math.max(...supplierEmissions.map((s) => s.production), 1);
    const maxTransport = Math.max(...supplierEmissions.map((s) => s.transport), 1);
    const maxTotal = Math.max(...supplierEmissions.map((s) => s.total), 1);
    const maxEfficiency = 100;

    const indicator = [
      { name: '原材料', max: maxMaterial * 1.2 },
      { name: '生产', max: maxProduction * 1.2 },
      { name: '运输', max: maxTransport * 1.2 },
      { name: '总排放', max: maxTotal * 1.2 },
      { name: '碳效率', max: maxEfficiency },
    ];

    const colors = ['#2D6A4F', '#7FB394', '#40916C', '#1B4332', '#D4B120'];

    const series = supplierEmissions.slice(0, 5).map((s, idx) => ({
      value: [
        Number(s.material.toFixed(2)),
        Number(s.production.toFixed(2)),
        Number(s.transport.toFixed(2)),
        Number(s.total.toFixed(2)),
        s.total > 0 ? Number(Math.min(100, (1 / (s.total / 1000 + 1)) * 100).toFixed(1)) : 50,
      ],
      name: s.name,
      lineStyle: { color: colors[idx % colors.length], width: 2 },
      itemStyle: { color: colors[idx % colors.length] },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors[idx % colors.length] + '40' },
          { offset: 1, color: colors[idx % colors.length] + '10' },
        ]),
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: supplierEmissions.slice(0, 5).map((s) => s.name),
        bottom: 0,
        textStyle: { color: '#475569', fontSize: 11 },
        type: 'scroll',
      },
      radar: {
        indicator,
        axisName: {
          color: '#475569',
          fontSize: 11,
        },
        splitLine: { lineStyle: { color: '#E2E8F0' } },
        splitArea: { areaStyle: { color: ['#FAFAFA', '#FFFFFF'] } },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
      },
      series: [
        {
          type: 'radar',
          data: series,
        },
      ],
    };
  }, [supplierEmissions]);

  const handleReset = () => {
    setSelectedProduct('all');
    setSelectedSuppliers([]);
    setDateFrom('');
    setDateTo('');
    showToast('info', '筛选条件已重置');
  };

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    setExportDropdownOpen(false);
    showToast('success', `正在导出${type === 'pdf' ? 'PDF' : 'Excel'}报告...`);
  };

  const handleViewDetail = (productId: string) => {
    showToast('info', `查看产品详情：${productId}`);
  };

  const hasActiveFilters =
    selectedProduct !== 'all' ||
    selectedSuppliers.length > 0 ||
    dateFrom ||
    dateTo;

  const currentProductLabel =
    selectedProduct === 'all'
      ? '全部产品'
      : mockProducts.find((p) => p.id === selectedProduct)?.name || '全部产品';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forest-800">产品碳排汇总</h1>
          <p className="mt-1 text-slate-500">
            汇总分析各产品在全生命周期的碳排放数据
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-forest-500 to-forest-600 text-sm font-medium text-white hover:from-forest-600 hover:to-forest-700 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            导出报告
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                exportDropdownOpen && 'rotate-180'
              )}
            />
          </button>
          {exportDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 py-1 bg-white border border-forest-100 rounded-lg shadow-card-hover z-20">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-forest-50 transition-colors"
              >
                <FileText className="h-4 w-4 text-forest-600" />
                导出 PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-forest-50 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-forest-600" />
                导出 Excel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight className="h-5 w-5 text-forest-600" />
          <span className="font-semibold text-forest-700">筛选条件</span>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="ml-auto flex items-center gap-1 text-sm text-slate-500 hover:text-clay-500 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[200px]">
            <button
              onClick={() => setProductDropdownOpen(!productDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 hover:border-forest-300 transition-colors"
            >
              <span className="truncate">{currentProductLabel}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 shrink-0 transition-transform',
                  productDropdownOpen && 'rotate-180'
                )}
              />
            </button>
            {productDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white border border-forest-100 rounded-lg shadow-card-hover z-10 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedProduct('all');
                    setProductDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm transition-colors',
                    selectedProduct === 'all'
                      ? 'bg-forest-50 text-forest-700 font-medium'
                      : 'text-slate-600 hover:bg-forest-50/50'
                  )}
                >
                  全部产品
                </button>
                {mockProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product.id);
                      setProductDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors',
                      selectedProduct === product.id
                        ? 'bg-forest-50 text-forest-700 font-medium'
                        : 'text-slate-600 hover:bg-forest-50/50'
                    )}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative min-w-[240px]">
            <button
              onClick={() => setSupplierDropdownOpen(!supplierDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 hover:border-forest-300 transition-colors"
            >
              <span className="truncate">
                {selectedSuppliers.length === 0
                  ? '全部供应商'
                  : `已选 ${selectedSuppliers.length} 个供应商`}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 shrink-0 transition-transform',
                  supplierDropdownOpen && 'rotate-180'
                )}
              />
            </button>
            {supplierDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white border border-forest-100 rounded-lg shadow-card-hover z-10 max-h-60 overflow-y-auto">
                {mockSuppliers.map((supplier) => (
                  <label
                    key={supplier.id}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-forest-50/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.includes(supplier.id)}
                      onChange={() => toggleSupplier(supplier.id)}
                      className="w-4 h-4 rounded border-forest-300 text-forest-500 focus:ring-forest-400"
                    />
                    <span className="truncate">{supplier.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
            />
            <span className="text-slate-400">至</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="产品总数"
          value={stats.totalProducts}
          icon={Package}
          color="green"
          trend="在统计产品"
          trendUp={true}
        />
        <StatCard
          title="总排放量"
          value={formatEmission(stats.totalEmission)}
          icon={Leaf}
          color="teal"
          trend="全生命周期"
          trendUp={false}
        />
        <StatCard
          title="已完成填报"
          value={stats.completedProducts}
          icon={CheckCircle2}
          color="emerald"
          trend="数据完整"
          trendUp={true}
        />
        <StatCard
          title="异常数据数"
          value={stats.anomalyProducts}
          icon={AlertTriangle}
          color="orange"
          trend="需要关注"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="font-semibold text-forest-700 mb-4">
            各阶段排放对比
          </h3>
          {productSummaries.length > 0 ? (
            <ReactECharts
              option={stackedBarOption}
              style={{ height: 360 }}
              opts={{ renderer: 'canvas' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[360px] text-slate-400 text-sm">
              暂无数据
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-forest-700 mb-4">
            供应商碳排表现对比
          </h3>
          {productSummaries.length > 0 ? (
            <ReactECharts
              option={radarOption}
              style={{ height: 360 }}
              opts={{ renderer: 'canvas' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[360px] text-slate-400 text-sm">
              暂无数据
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-forest-700">
            产品汇总列表
            <span className="ml-2 text-sm font-normal text-slate-500">
              共 {productSummaries.length} 条
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-forest-100">
                <th className="text-left py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  产品名称
                </th>
                <th className="text-left py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  产品编码
                </th>
                <th className="text-right py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  总排放量 (kgCO₂e)
                </th>
                <th className="text-right py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  原材料占比
                </th>
                <th className="text-right py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  生产占比
                </th>
                <th className="text-right py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  运输占比
                </th>
                <th className="text-center py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  供应商数量
                </th>
                <th className="text-center py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  异常
                </th>
                <th className="text-center py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  状态
                </th>
                <th className="text-center py-3 px-4 font-semibold text-forest-700 whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {productSummaries.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-12 text-slate-400"
                  >
                    暂无数据
                  </td>
                </tr>
              ) : (
                productSummaries.map((row) => {
                  const total = row.totalEmission || 1;
                  const materialPct = (row.materialEmission / total) * 100;
                  const productionPct = (row.productionEmission / total) * 100;
                  const transportPct = (row.transportEmission / total) * 100;

                  return (
                    <tr
                      key={row.productId}
                      className="border-b border-slate-100 hover:bg-forest-50/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-forest-800 whitespace-nowrap">
                        {row.productName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-xs">
                        {row.productCode}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-forest-700 whitespace-nowrap tabular-nums">
                        {formatNumber(row.totalEmission)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-forest-600" />
                          {formatNumber(materialPct, 1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-forest-300" />
                          {formatNumber(productionPct, 1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-forest-400" />
                          {formatNumber(transportPct, 1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {row.supplierCount}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {row.hasAnomaly && (
                          <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-clay-500 animate-pulse-dot" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            row.status === 'complete' &&
                              'bg-forest-100 text-forest-700',
                            row.status === 'partial' &&
                              'bg-sand-100 text-sand-600',
                            row.status === 'pending' &&
                              'bg-slate-100 text-slate-600'
                          )}
                        >
                          {row.status === 'complete' && '已完成'}
                          {row.status === 'partial' && '进行中'}
                          {row.status === 'pending' && '待填报'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetail(row.productId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-forest-50 text-forest-600 text-xs font-medium hover:bg-forest-100 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
