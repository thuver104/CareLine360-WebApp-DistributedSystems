import { useState } from 'react';
import {
    Download, FileText, Calendar, Users, Stethoscope,
    FileSpreadsheet, BarChart3, CheckCircle, Clock, AlertCircle,
    TrendingUp, Activity, ChevronRight
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const REPORT_TABS = [
    {
        id: 'patients',
        label: 'For Patients',
        icon: Users,
        color: 'blue',
        gradient: 'from-blue-500 to-blue-700',
        lightBg: 'bg-blue-50 dark:bg-blue-900/10',
        border: 'border-blue-200 dark:border-blue-800',
        activeBorder: 'border-blue-500',
        iconColor: 'text-blue-500',
        badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        description: 'Comprehensive patient demographics, appointment history, and health outcome analytics',
        includes: [
            'Patient demographics & registration stats',
            'Appointment history & completion rates',
            'Emergency case records & outcomes',
            'Medical conditions & treatment trends',
        ],
        stats: [
            { label: 'Data Points', value: '12+', icon: BarChart3 },
            { label: 'Sections', value: '4', icon: FileText },
        ]
    },
    {
        id: 'doctors',
        label: 'For Doctors',
        icon: Stethoscope,
        color: 'green',
        gradient: 'from-green-500 to-teal-600',
        lightBg: 'bg-green-50 dark:bg-green-900/10',
        border: 'border-green-200 dark:border-green-800',
        activeBorder: 'border-green-500',
        iconColor: 'text-green-500',
        badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        description: 'Doctor performance metrics, specialization breakdown, and appointment analytics',
        includes: [
            'Doctor profiles & specializations',
            'Performance metrics & appointment stats',
            'Completion & cancellation rates',
            'Active vs pending doctor status',
        ],
        stats: [
            { label: 'Data Points', value: '10+', icon: BarChart3 },
            { label: 'Sections', value: '3', icon: FileText },
        ]
    }
];

const FORMAT_OPTIONS = [
    {
        id: 'pdf',
        label: 'PDF Document',
        description: 'Formatted report with charts',
        icon: FileText,
        iconColor: 'text-red-500',
        ext: 'pdf'
    },
    {
        id: 'excel',
        label: 'Excel Spreadsheet',
        description: 'Multi-sheet workbook with data',
        icon: FileSpreadsheet,
        iconColor: 'text-green-600',
        ext: 'xlsx'
    },
    {
        id: 'csv',
        label: 'CSV Data',
        description: 'Raw data for analysis',
        icon: BarChart3,
        iconColor: 'text-blue-500',
        ext: 'csv'
    }
];

const QUICK_RANGES = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last year', days: 365 },
];

const getDateRange = (days) => {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { from, to };
};

const ReportGeneration = () => {
    const [activeTab, setActiveTab] = useState('patients');
    const [reportFormat, setReportFormat] = useState('pdf');
    const [dateRange, setDateRange] = useState(getDateRange(30));
    const [generatingReport, setGeneratingReport] = useState(false);
    const [lastGenerated, setLastGenerated] = useState(null);

    const activeTabData = REPORT_TABS.find(t => t.id === activeTab);

    const applyQuickRange = (days) => {
        setDateRange(getDateRange(days));
    };

    const generateReport = async () => {
        setGeneratingReport(true);
        try {
            const response = await api.post('/admin/reports/generate', {
                reportType: activeTab,
                format: reportFormat,
                dateRange
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const ext = FORMAT_OPTIONS.find(f => f.id === reportFormat)?.ext || reportFormat;
            const fileName = `${activeTab}_report_${dateRange.from}_to_${dateRange.to}.${ext}`;
            link.setAttribute('download', fileName);

            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setLastGenerated({
                type: activeTab,
                format: reportFormat,
                time: new Date().toLocaleTimeString()
            });

            toast.success(`${activeTabData.label} report downloaded successfully!`);
        } catch (error) {
            console.error('Report generation failed:', error);
            toast.error('Failed to generate report. Please try again.');
        } finally {
            setGeneratingReport(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500/20 rounded-xl">
                            <Download size={22} className="text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Report Generation Center</h3>
                            <p className="text-slate-400 text-sm">Generate detailed analytics reports for patients or doctors</p>
                        </div>
                    </div>
                    {lastGenerated && (
                        <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">
                            <CheckCircle size={14} className="text-green-400" />
                            <span className="text-green-300 text-xs font-medium">
                                Last: {lastGenerated.type} ({lastGenerated.format.toUpperCase()}) at {lastGenerated.time}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-8">
                {/* Tab Selector — For Patients / For Doctors */}
                <div className="mb-8">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                        Select Report Category
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {REPORT_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 group ${
                                        isActive
                                            ? `${tab.lightBg} ${tab.activeBorder} shadow-md`
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    {isActive && (
                                        <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${tab.gradient}`}></div>
                                    )}
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${isActive ? `bg-gradient-to-br ${tab.gradient}` : 'bg-slate-200 dark:bg-slate-700'} transition-all`}>
                                            <Icon size={22} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-bold text-base ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {tab.label}
                                                </span>
                                                {isActive && (
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tab.badgeColor}`}>
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {tab.description}
                                            </p>
                                            <div className="flex items-center gap-4 mt-3">
                                                {tab.stats.map((stat) => {
                                                    const StatIcon = stat.icon;
                                                    return (
                                                        <div key={stat.label} className="flex items-center gap-1.5">
                                                            <StatIcon size={12} className={isActive ? tab.iconColor : 'text-slate-400'} />
                                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                                {stat.value} {stat.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Report Includes */}
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                                Report Includes
                            </p>
                            <div className={`p-4 rounded-xl border ${activeTabData.border} ${activeTabData.lightBg}`}>
                                <ul className="space-y-2.5">
                                    {activeTabData.includes.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5">
                                            <ChevronRight size={14} className={`mt-0.5 flex-shrink-0 ${activeTabData.iconColor}`} />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Export Format */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                                Export Format
                            </p>
                            <div className="space-y-2">
                                {FORMAT_OPTIONS.map((fmt) => {
                                    const FmtIcon = fmt.icon;
                                    const isSelected = reportFormat === fmt.id;
                                    return (
                                        <label
                                            key={fmt.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10'
                                                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="reportFormat"
                                                value={fmt.id}
                                                checked={isSelected}
                                                onChange={() => setReportFormat(fmt.id)}
                                                className="text-teal-600 focus:ring-teal-500"
                                            />
                                            <FmtIcon size={16} className={fmt.iconColor} />
                                            <div>
                                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fmt.label}</div>
                                                <div className="text-xs text-slate-500">{fmt.description}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Middle: Date Range */}
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Calendar size={12} />
                                Date Range
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">From Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">To Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Range Presets */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Clock size={12} />
                                Quick Presets
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_RANGES.map((range) => (
                                    <button
                                        key={range.days}
                                        onClick={() => applyQuickRange(range.days)}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 dark:hover:bg-teal-900/20 dark:hover:border-teal-700 dark:hover:text-teal-300 transition-all"
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period Summary */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Selected Period</p>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar size={14} className="text-teal-500" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {dateRange.from}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {dateRange.to}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {Math.ceil((new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24))} days of data
                            </p>
                        </div>
                    </div>

                    {/* Right: Generate */}
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                                Generate Report
                            </p>

                            {/* Summary Card */}
                            <div className={`p-4 rounded-xl border-2 ${activeTabData.border} ${activeTabData.lightBg} mb-4`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${activeTabData.gradient}`}>
                                        {(() => {
                                            const Icon = activeTabData.icon;
                                            return <Icon size={16} className="text-white" />;
                                        })()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white text-sm">{activeTabData.label}</div>
                                        <div className="text-xs text-slate-500">{reportFormat.toUpperCase()} format</div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                                    <div className="flex justify-between">
                                        <span>Report Type</span>
                                        <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">{activeTab}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Format</span>
                                        <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">{reportFormat}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>From</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{dateRange.from}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>To</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{dateRange.to}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={generateReport}
                                disabled={generatingReport}
                                className={`w-full bg-gradient-to-r ${activeTabData.gradient} hover:opacity-90 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm`}
                            >
                                {generatingReport ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        Generating Report...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Download {activeTabData.label} Report
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info Note */}
                        <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Reports are generated in real-time from live database records. Large date ranges may take a few seconds.
                            </p>
                        </div>

                        {/* Activity Indicator */}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <TrendingUp size={12} className="text-teal-500" />
                            <span>Reports include all records within the selected date range</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportGeneration;
