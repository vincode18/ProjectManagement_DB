import ExcelJS from 'exceljs';
import { getReportsRows, getAllTasksRaw } from '@/lib/api';
import { formatDate } from '@/lib/date';
import { buildWeekColumns, calculateGanttRange } from '@/lib/workflows';
import { STATUS_COLORS } from '@/lib/date';

function hexToArgb(hex: string) {
  return `FF${hex.replace('#', '').toUpperCase()}`;
}

export async function GET() {
  const [rows, tasks] = await Promise.all([getReportsRows(), getAllTasksRaw()]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Project Management Dashboard';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Code', key: 'code', width: 14 },
    { header: 'Name', key: 'name', width: 32 },
    { header: 'Manager', key: 'manager', width: 20 },
    { header: 'Start Date', key: 'start', width: 14 },
    { header: 'End Date', key: 'end', width: 14 },
    { header: 'Progress (%)', key: 'progress', width: 14 },
    { header: 'Health', key: 'health', width: 14 }
  ];
  summarySheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    summarySheet.addRow({
      code: row.code,
      name: row.name,
      manager: row.manager?.name ?? '—',
      start: formatDate(row.startDate),
      end: formatDate(row.endDate),
      progress: row.overallProgress,
      health: row.health
    });
  }

  const ganttSheet = workbook.addWorksheet('Gantt Detail');

  if (tasks.length === 0) {
    ganttSheet.addRow(['No tasks available']);
  } else {
    const range = calculateGanttRange(tasks.map((task) => task.startDate), tasks.map((task) => task.endDate));
    const weeks = buildWeekColumns(range.start, range.end);
    const projectById = new Map(rows.map((row) => [row.id, row]));

    const baseColumns = [
      { header: 'Project Code', key: 'project_code', width: 14 },
      { header: 'WBS', key: 'wbs', width: 10 },
      { header: 'Task', key: 'task', width: 28 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Progress (%)', key: 'progress', width: 12 },
      { header: 'Start', key: 'start', width: 12 },
      { header: 'End', key: 'end', width: 12 }
    ];
    const weekColumns = weeks.map((week, index) => ({
      header: week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      key: `w${index}`,
      width: 10
    }));
    ganttSheet.columns = [...baseColumns, ...weekColumns];
    ganttSheet.getRow(1).font = { bold: true };

    for (const task of tasks) {
      const project = projectById.get(task.projectId);
      const rowData: Record<string, string | number> = {
        project_code: project?.code ?? task.projectId,
        wbs: task.wbsCode,
        task: task.name,
        status: task.status.replaceAll('_', ' '),
        progress: task.progress,
        start: formatDate(task.startDate),
        end: formatDate(task.endDate)
      };

      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      weeks.forEach((week, index) => {
        if (taskStart <= week.end && taskEnd >= week.start) {
          rowData[`w${index}`] = '';
        }
      });

      const addedRow = ganttSheet.addRow(rowData);

      weeks.forEach((week, index) => {
        if (taskStart <= week.end && taskEnd >= week.start) {
          const cell = addedRow.getCell(`w${index}`);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: hexToArgb(STATUS_COLORS[task.status] ?? '#2563EB') }
          };
        }
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="project-report.xlsx"'
    }
  });
}
