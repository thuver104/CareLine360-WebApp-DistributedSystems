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
        id: 'appointments',
        label: 'Appointments',
        icon: Calendar,
        color: 'indigo',
        gradient: 'from-indigo-500 to-indigo-700',
        lightBg: 'bg-indigo-500/5',
        border: 'border-indigo-500/20',
        activeBorder: 'border-indigo-500',
        iconColor: 'text-indigo-500',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        description: 'Meeting scheduled analytics, consultation types, and completion telemetry',
        includes: [
            'Total appointments scheduled',
            'Consultation type breakdown (Video/In-person)',
            'Completion & Cancellation rates',
            'Daily booking trends & analytics',
        ],
        stats: [
            { label: 'Metrics', value: '8+', icon: BarChart3 },
            { label: 'Daily Data', value: 'Yes', icon: Clock },
        ]
    },
    {
        id: 'emergencies',
        label: 'Emergencies',
        icon: AlertCircle,
        color: 'rose',
        gradient: 'from-rose-500 to-rose-700',
        lightBg: 'bg-rose-500/5',
        border: 'border-rose-500/20',
        activeBorder: 'border-rose-500',
        iconColor: 'text-rose-500',
        badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        description: 'District-wise emergency cases, resolution times, and responder performance',
        includes: [
            'Emergency case frequency by district',
            'Average & max resolution times',
            'Critical case distribution',
            'Responder telemetry & arrival stats',
        ],
        stats: [
            { label: 'Districts', value: 'All', icon: Activity },
            { label: 'Response', value: 'Real-time', icon: Clock },
        ]
    },
    {
        id: 'patients',
        label: 'Patients',
        icon: Users,
        color: 'blue',
        gradient: 'from-blue-500 to-blue-700',
        lightBg: 'bg-blue-500/5',
        border: 'border-blue-500/20',
        activeBorder: 'border-blue-500',
        iconColor: 'text-blue-500',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        description: 'Comprehensive patient demographics and historical medical telemetry',
        includes: [
            'Patient registration demographics',
            'Gender & Age distribution',
            'District distribution of patients',
            'Account status & profile strength',
        ],
        stats: [
            { label: 'Data Points', value: '12+', icon: BarChart3 },
            { label: 'Sections', value: '4', icon: FileText },
        ]
    },
    {
        id: 'doctors',
        label: 'Doctors',
        icon: Stethoscope,
        color: 'green',
        gradient: 'from-green-500 to-teal-600',
        lightBg: 'bg-teal-500/5',
        border: 'border-teal-500/20',
        activeBorder: 'border-teal-500',
        iconColor: 'text-teal-500',
        badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
        description: 'Doctor performance, specialization metrics and consult analytics',
        includes: [
            'Specialization distribution',
            'Appointment completion frequency',
            'Performance ratings & telemetry',
            'Active medical personnel status',
        ],
        stats: [
            { label: 'Metrics', value: '10+', icon: BarChart3 },
            { label: 'Profile', value: 'Full', icon: FileText },
        ]
    },
    {
        id: 'projections',
        label: 'Future Trends',
        icon: TrendingUp,
        color: 'amber',
        gradient: 'from-amber-500 to-amber-700',
        lightBg: 'bg-amber-500/5',
        border: 'border-amber-500/20',
        activeBorder: 'border-amber-500',
        iconColor: 'text-amber-500',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        description: 'Predictive analytics for future case volumes and growth margins',
        includes: [
            'Next 3-month volume projections',
            'Historical growth rate (margins)',
            'Emerging case hotspots',
            'Resource allocation forecasts',
        ],
        stats: [
            { label: 'Projection', value: '90D', icon: TrendingUp },
            { label: 'Accuracy', value: 'Dynamic', icon: Activity },
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
    const [activeTab, setActiveTab] = useState('appointments');
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
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[32px] shadow-sm overflow-hidden transition-colors duration-300">
            {/* Header */}
            <div className="bg-[var(--bg-muted)] px-8 py-7 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500/20 rounded-xl">
                            <Download size={22} className="text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Report Generation Center</h3>
                            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mt-1">Generate detailed analytics reports for patients or doctors</p>
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
                <div className="mb-10">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
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
                                    className={`relative text-left p-6 rounded-3xl border-2 transition-all duration-300 group ${isActive
                                        ? `${tab.lightBg} ${tab.activeBorder} shadow-lg shadow-teal-500/5`
                                        : 'bg-[var(--bg-subtle)] border-[var(--border)] hover:border-teal-500/30'
                                        }`}
                                >
                                    {isActive && (
                                        <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${tab.gradient}`}></div>
                                    )}
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl transition-all ${isActive ? `bg-gradient-to-br ${tab.gradient}` : 'bg-[var(--bg-muted)]'}`}>
                                            <Icon size={22} className={isActive ? 'text-white' : 'text-[var(--text-muted)]'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`font-black text-lg tracking-tight ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                                    {tab.label}
                                                </span>
                                                {isActive && (
                                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${tab.badgeColor}`}>
                                                        Targeted
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                                {tab.description}
                                            </p>
                                            <div className="flex items-center gap-4 mt-3">
                                                {tab.stats.map((stat) => {
                                                    const StatIcon = stat.icon;
                                                    return (
                                                        <div key={stat.label} className="flex items-center gap-2">
                                                            <StatIcon size={13} className={isActive ? tab.iconColor : 'text-[var(--text-muted)]'} />
                                                            <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-muted)]">
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
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
                                Report Includes
                            </p>
                            <div className={`p-6 rounded-3xl border ${activeTabData.border} ${activeTabData.lightBg}`}>
                                <ul className="space-y-3.5">
                                    {activeTabData.includes.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <ChevronRight size={15} className={`mt-0.5 flex-shrink-0 ${activeTabData.iconColor}`} />
                                            <span className="text-sm text-[var(--text-primary)] font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Export Format */}
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
                                Export Format
                            </p>
                            <div className="space-y-2.5">
                                {FORMAT_OPTIONS.map((fmt) => {
                                    const FmtIcon = fmt.icon;
                                    const isSelected = reportFormat === fmt.id;
                                    return (
                                        <label
                                            key={fmt.id}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected
                                                ? 'border-teal-500 bg-teal-500/5'
                                                : 'border-[var(--border)] bg-[var(--bg-subtle)] hover:border-teal-500/20'
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
                                            <FmtIcon size={18} className={fmt.iconColor} />
                                            <div>
                                                <div className="text-sm font-black text-[var(--text-primary)] tracking-tight">{fmt.label}</div>
                                                <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter">{fmt.description}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Middle: Date Range */}
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Calendar size={13} />
                                Date Range
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">From Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="w-full px-4 py-3 border border-[var(--border)] rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-primary)] font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 ml-1">To Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-4 py-3 border border-[var(--border)] rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-primary)] font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Range Presets */}
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Clock size={13} />
                                Quick Presets
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_RANGES.map((range) => (
                                    <button
                                        key={range.days}
                                        onClick={() => applyQuickRange(range.days)}
                                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all"
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period Summary */}
                        <div className="bg-[var(--bg-muted)] rounded-[24px] p-5 border border-[var(--border)]">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3">Selected period telemetry</p>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                                    <Calendar size={16} />
                                </div>
                                <div className="flex items-center gap-2 font-black text-[var(--text-primary)]">
                                    <span>{dateRange.from}</span>
                                    <span className="text-teal-500 opacity-50">/</span>
                                    <span>{dateRange.to}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-teal-600/70 uppercase tracking-widest mt-3 ml-11">
                                {Math.ceil((new Date(dateRange.to) - new Date(dateRange.from)) / (1000 * 60 * 60 * 24))} DAYS OF ANALYTICS
                            </p>
                        </div>
                    </div>

                    {/* Right: Generate */}
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
                                Generate Intelligence
                            </p>

                            {/* Summary Card */}
                            <div className={`p-6 rounded-3xl border-2 ${activeTabData.border} ${activeTabData.lightBg} mb-6`}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${activeTabData.gradient} shadow-lg shadow-teal-500/10`}>
                                        {(() => {
                                            const Icon = activeTabData.icon;
                                            return <Icon size={20} className="text-white" />;
                                        })()}
                                    </div>
                                    <div>
                                        <div className="font-black text-[var(--text-primary)] text-lg tracking-tight leading-none mb-1">{activeTabData.label}</div>
                                        <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{reportFormat.toUpperCase()} COMPILATION</div>
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] opacity-60">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Category</span>
                                        <span className="text-xs font-black uppercase text-[var(--text-primary)]">{activeTab}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] opacity-60">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Format</span>
                                        <span className="text-xs font-black uppercase text-[var(--text-primary)]">{reportFormat}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Telemetry Delta</span>
                                        <span className="text-xs font-black text-[var(--text-primary)]">{dateRange.from} - {dateRange.to}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={generateReport}
                                disabled={generatingReport}
                                className={`w-full bg-gradient-to-r ${activeTabData.gradient} hover:shadow-2xl hover:translate-y-[-2px] text-white px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs active:scale-95`}
                            >
                                {generatingReport ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Compositing {activeTabData.label}
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info Note */}
                        <div className="flex items-start gap-4 p-5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-3xl">
                            <AlertCircle size={18} className="text-teal-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
                                Reports are generated in real-time from live database records. Large date ranges may take a few seconds to composite.
                            </p>
                        </div>

                        {/* Activity Indicator */}
                        <div className="flex items-center gap-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                            <TrendingUp size={14} className="text-teal-500" />
                            <span>Full data registry inclusion</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportGeneration;
