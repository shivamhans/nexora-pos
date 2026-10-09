import React, { useEffect, useMemo, useState } from 'react';
import LoginScreen from './LoginScreen.jsx';
import { apiRequest, toUiItems } from './lib/api.js';
import LiveModulePage from './LiveModulePage.jsx';
import {
  Activity, ArrowDownRight, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3,
  Bell, Boxes, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, Command, CreditCard, Download, Ellipsis, FileBarChart,
  FileClock, Filter, Gauge, LayoutDashboard, LifeBuoy, LogOut, Menu, Moon, MoreHorizontal,
  Package, PackageCheck, PackagePlus, Plus, Search, Settings, ShieldCheck, ShoppingBag,
  ShoppingCart, SlidersHorizontal, Sparkles, Sun, Tag, Truck, Users, Wallet, X, Zap,
  ReceiptText, ScanBarcode, RotateCcw, TrendingUp, CircleDollarSign, Warehouse, UserRound, RefreshCw,
  ChevronUp, AlertTriangle, CheckCheck, Printer, Banknote, Smartphone, CreditCard as CardIcon
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const navGroups = [
  { label: 'WORKSPACE', items: [
    { id: 'Dashboard', icon: LayoutDashboard }, { id: 'Point of Sale', icon: ShoppingCart, badge: '⌘K' },
    { id: 'Transactions', icon: ReceiptText },
  ]},
  { label: 'CATALOG & STOCK', items: [
    { id: 'Inventory', icon: Boxes }, { id: 'Items', icon: Package }, { id: 'Categories', icon: Tag },
    { id: 'Purchases', icon: PackagePlus }, { id: 'Suppliers', icon: Truck },
  ]},
  { label: 'RELATIONSHIPS', items: [ { id: 'Customers', icon: Users }, { id: 'Staff & Roles', icon: ShieldCheck } ]},
  { label: 'INSIGHTS', items: [ { id: 'Reports', icon: FileBarChart }, { id: 'Returns & Refunds', icon: RotateCcw } ]},
];
const initialItems = [
  { id: 'NX-1001', name: 'Cloud Nine Sparkling Water', category: 'Beverages', sku: 'CW-240-01', price: 2.8, cost: 1.24, stock: 142, status: 'In stock', color: 'mint', icon: '◉' },
  { id: 'NX-1002', name: 'Morning Ritual Coffee', category: 'Beverages', sku: 'CF-100-02', price: 14.5, cost: 7.1, stock: 8, status: 'Low stock', color: 'amber', icon: '◌' },
  { id: 'NX-1003', name: 'Almond Butter Bites', category: 'Snacks', sku: 'SN-320-03', price: 6.25, cost: 2.6, stock: 64, status: 'In stock', color: 'rose', icon: '◈' },
  { id: 'NX-1004', name: 'Ceramic Travel Mug', category: 'Accessories', sku: 'AC-510-04', price: 22, cost: 11.8, stock: 0, status: 'Out of stock', color: 'lavender', icon: '◐' },
  { id: 'NX-1005', name: 'Matcha Energy Blend', category: 'Beverages', sku: 'CW-240-05', price: 9.8, cost: 4.4, stock: 31, status: 'In stock', color: 'mint', icon: '✳' },
  { id: 'NX-1006', name: 'Dark Cocoa Granola', category: 'Snacks', sku: 'SN-320-06', price: 8.4, cost: 3.25, stock: 5, status: 'Low stock', color: 'amber', icon: '✦' },
  { id: 'NX-1007', name: 'Oat Milk Original', category: 'Dairy alternatives', sku: 'DA-210-07', price: 4.2, cost: 1.95, stock: 92, status: 'In stock', color: 'blue', icon: '◍' },
  { id: 'NX-1008', name: 'Reusable Tote Bag', category: 'Accessories', sku: 'AC-510-08', price: 5.5, cost: 1.1, stock: 3, status: 'Low stock', color: 'rose', icon: '▱' },
];
const salesData = [
  { day: 'Mon', sales: 3200, orders: 44 }, { day: 'Tue', sales: 4100, orders: 51 }, { day: 'Wed', sales: 3600, orders: 47 },
  { day: 'Thu', sales: 5100, orders: 63 }, { day: 'Fri', sales: 4700, orders: 58 }, { day: 'Sat', sales: 6800, orders: 82 }, { day: 'Sun', sales: 5900, orders: 73 },
];
const recentSales = [
  { id: '#NX-00842', customer: 'Olivia Rhye', initials: 'OR', color: 'purple', date: 'Today, 10:42 AM', amount: 128.5, method: 'Card', status: 'Completed' },
  { id: '#NX-00841', customer: 'Phoenix Baker', initials: 'PB', color: 'blue', date: 'Today, 10:31 AM', amount: 74.2, method: 'UPI', status: 'Completed' },
  { id: '#NX-00840', customer: 'Lana Steiner', initials: 'LS', color: 'pink', date: 'Today, 10:18 AM', amount: 216.0, method: 'Cash', status: 'Completed' },
  { id: '#NX-00839', customer: 'Demi Wilkinson', initials: 'DW', color: 'amber', date: 'Today, 09:56 AM', amount: 42.8, method: 'Card', status: 'Completed' },
];
const formatMoney = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatShort = (n) => `₹${(n / 1000).toFixed(1)}k`;

function BrandMark() { return <div className="brand-mark"><span></span><span></span><span></span><span></span></div>; }
function Pill({ children, tone = 'neutral', dot = false }) { return <span className={`pill pill-${tone}`}>{dot && <i />}{children}</span>; }
function Button({ children, variant = 'secondary', icon: Icon, onClick, className = '', ...props }) { return <button className={`btn btn-${variant} ${className}`} onClick={onClick} {...props}>{Icon && <Icon size={16} strokeWidth={2} />}{children}</button>; }
function SectionTitle({ eyebrow, title, subtitle, action }) { return <div className="section-title"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="title-actions">{action}</div>}</div>; }
function StatCard({ icon: Icon, label, value, change, trend = 'up', note, accent = 'violet' }) { return <div className="stat-card glass-card"><div className="stat-top"><div className={`stat-icon icon-${accent}`}><Icon size={19} /></div>{change && <span className={`trend trend-${trend}`}>{trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{change}</span>}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function Avatar({ initials, color = 'purple', size = '' }) { return <span className={`avatar avatar-${color} ${size}`}>{initials}</span>; }
function EmptyState({ icon: Icon = Package, title, text, action }) { return <div className="empty-state"><div className="empty-icon"><Icon size={24} /></div><h3>{title}</h3><p>{text}</p>{action}</div>; }

function Dashboard({ items, onNavigate, isLive = false, auth, currency = 'INR' }) {
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(Boolean(isLive));
  const [reportError, setReportError] = useState('');
  const [rangeDays, setRangeDays] = useState(7);
  const [refreshKey, setRefreshKey] = useState(0);
  const paymentColors = ['#7968e8', '#4fbda0', '#f3b65f', '#5e9de7', '#d17abc'];
  const currencySymbol = reportData?.currency?.currencySymbol || ({ INR: '₹', USD: '$', GBP: '£', EUR: '€' }[currency] || currency + ' ');
  const formatAmount = value => currencySymbol + Number(value || 0).toLocaleString(reportData?.currency?.locale || 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const localDate = value => {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (!isLive || !auth?.token) {
      setReportLoading(false);
      setReportError('');
      setReportData(null);
      return;
    }
    let cancelled = false;
    const to = localDate(new Date());
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (rangeDays - 1));
    const from = localDate(fromDate);
    setReportLoading(true);
    setReportError('');
    setReportData(null);
    apiRequest('/reports/summary?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to), { token: auth.token })
      .then(data => {
        if (cancelled) return;
        setReportData(data);
        setReportError('');
      })
      .catch(error => {
        if (cancelled) return;
        setReportData(null);
        const detail = error.message || 'Could not load dashboard metrics.';
        setReportError(detail.includes("doesn't exist") || detail.includes('does not exist')
          ? detail + '. Apply database/phase4-migration.sql in MySQL Workbench, then retry.'
          : detail);
      })
      .finally(() => { if (!cancelled) setReportLoading(false); });
    return () => { cancelled = true; };
  }, [isLive, auth?.token, rangeDays, refreshKey]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = auth?.user?.name?.trim().split(/\s+/)[0] || (isLive ? 'there' : 'Alex');
  const headingDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const summary = reportData?.summary;
  const demo = !isLive;
  const loading = isLive && reportLoading;
  const hasData = demo || Boolean(reportData);
  const revenue = demo ? 24580 : summary?.netRevenue;
  const orders = demo ? 384 : summary?.completedSales;
  const grossProfit = demo ? 8426.5 : summary?.grossProfit;
  const inventoryValue = demo ? 182940 : summary?.inventoryCostValue;
  const dailyRows = demo ? salesData.map(row => ({ ...row, dayLabel: row.day, refunds: 0 })) :
    (reportData?.daily || []).map(row => ({ ...row, dayLabel: new Date(row.day + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }));
  const totalPeriodSales = demo ? 33400 : (reportData?.daily || []).reduce((sum, row) => sum + Number(row.sales || 0), 0);
  const livePaymentTotal = (reportData?.payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const paymentRows = demo
    ? [{ method: 'Card', value: 48, percentage: 48, amount: 11784 }, { method: 'UPI', value: 32, percentage: 32, amount: 7856 }, { method: 'Cash', value: 20, percentage: 20, amount: 4916 }]
    : (reportData?.payments || []).map(row => ({ ...row, value: Number(row.amount || 0), percentage: livePaymentTotal ? Number(row.amount || 0) / livePaymentTotal * 100 : 0 }));
  const recentRows = demo ? recentSales : (reportData?.recentTransactions || []).map(row => ({
    ...row,
    id: row.receiptNo,
    date: row.completedAt ? new Date(row.completedAt).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—',
    amount: Number(row.totalAmount || 0),
    method: String(row.paymentMethod || '').toUpperCase() === 'UPI' ? 'UPI' : String(row.paymentMethod || '').toUpperCase() === 'CASH' ? 'Cash' : String(row.paymentMethod || '').toUpperCase() === 'CARD' ? 'Card' : '—',
    initials: String(row.customer || 'Walk-in').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join(''),
    color: 'purple',
  }));
  const isLow = item => Number(item.stock) > 0 && Number(item.stock) <= Number(item.reorderThreshold ?? 8);
  const isOut = item => Number(item.stock) <= 0;
  const stockAttention = items.filter(item => isLow(item) || isOut(item)).sort((a, b) => Number(a.stock) - Number(b.stock)).slice(0, 4);
  const stockAlertCount = demo ? lowStockCountForDemo(items) : Number(summary?.lowStockCount || 0) + Number(summary?.outOfStockCount || 0);
  const unavailable = message => <EmptyState icon={reportError ? AlertTriangle : Package} title={reportError ? 'Dashboard data unavailable' : 'No data for this period'} text={message}/>;

  return <>
    <SectionTitle eyebrow={headingDate} title={greeting + ', ' + firstName + ' ✨'} subtitle="Here's what's happening with your store today." action={<><select className="select-control dashboard-range" value={rangeDays} onChange={event => setRangeDays(Number(event.target.value))} aria-label="Reporting period"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select><Button variant="primary" icon={Plus} onClick={() => onNavigate('Point of Sale')}>New sale</Button></>} />
    {demo && <div className="live-info-banner"><CircleHelp size={17}/><span><b>Demo workspace.</b> The figures below are illustrative sample data and are not saved to your database. Sign in to view live figures.</span></div>}
    {isLive && reportError && <div className="live-error"><AlertTriangle size={17}/><span>{reportError}</span><Button icon={RefreshCw} onClick={() => setRefreshKey(value => value + 1)}>Retry</Button></div>}
    {isLive && !reportError && reportData && <div className="live-info-banner"><CircleCheck size={17}/><span><b>Live business data.</b> Metrics below come from saved records for {reportData.period.from} through {reportData.period.to}. Figures are not estimated.</span></div>}
    <div className="stats-grid">
      <StatCard icon={Wallet} label={isLive ? 'Net revenue' : 'Total revenue'} value={loading ? '—' : hasData ? formatAmount(revenue) : '—'} change={demo ? '12.8%' : undefined} note={demo ? <span className="muted">Illustrative demo value</span> : <span className="muted">Sales less recorded refunds</span>}/>
      <StatCard icon={ShoppingBag} label="Completed sales" value={loading ? '—' : hasData ? String(orders ?? 0) : '—'} change={demo ? '8.2%' : undefined} note={demo ? <span className="muted">Illustrative demo value</span> : <span className="muted">Voided sales excluded</span>} accent="blue"/>
      <StatCard icon={TrendingUp} label="Gross profit" value={loading ? '—' : !hasData ? '—' : demo ? formatAmount(grossProfit) : summary?.grossProfitAvailable ? formatAmount(grossProfit) : 'Unavailable'} change={demo ? '6.4%' : undefined} note={demo ? <span className="muted">Illustrative demo value</span> : <span className="muted">{summary?.grossProfitAvailable ? 'Based on saved cost snapshots' : 'Provisional costs prevent a reliable figure'}</span>} accent="green"/>
      <StatCard icon={Package} label="Inventory cost value" value={loading ? '—' : hasData ? formatAmount(inventoryValue) : '—'} change={demo ? '2.1%' : undefined} trend="down" note={demo ? <span className="muted">Illustrative demo value</span> : <span className="muted">Quantity on hand × average cost</span>} accent="amber"/>
    </div>
    <div className="dashboard-main-grid">
      <section className="panel chart-panel">
        <div className="panel-head"><div><h2>Sales overview</h2><p>{demo ? 'Illustrative sample revenue by day.' : 'Saved sales and refunds for the selected period.'}</p></div><button className="icon-button" aria-label="Reporting period">{reportLoading ? <RefreshCw size={18}/> : <CalendarDays size={18}/>}</button></div>
        <div className="chart-legend"><span><i className="legend-dot violet-dot"/> Sales</span><span className="legend-meta">{demo ? 'Sample total' : 'Sales in range'} <b>{loading ? '—' : hasData ? formatAmount(totalPeriodSales) : '—'}</b></span></div>
        <div className="sales-chart">{hasData && dailyRows.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={dailyRows} margin={{top:10,right:8,left:-18,bottom:0}}><defs><linearGradient id="dashboardSalesGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8171ee" stopOpacity={0.23}/><stop offset="95%" stopColor="#8171ee" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)"/><XAxis dataKey="dayLabel" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:12}} dy={10}/><YAxis axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}} tickFormatter={value => Number(value) >= 1000 ? currencySymbol + (Number(value)/1000).toFixed(1) + 'k' : currencySymbol + Number(value).toFixed(0)}/><Tooltip contentStyle={{background:'var(--popover)',border:'1px solid var(--line)',borderRadius:12,color:'var(--text)',boxShadow:'0 8px 30px #0001'}} formatter={value => [formatAmount(value), 'Sales']} cursor={{stroke:'#b7aff7',strokeDasharray:'4 4'}}/><Area type="monotone" dataKey="sales" stroke="#7968e8" strokeWidth={2.7} fill="url(#dashboardSalesGradient)" activeDot={{r:5,strokeWidth:3,stroke:'var(--panel)'}}/></AreaChart></ResponsiveContainer> : unavailable(reportError ? 'Fix the database/schema issue above, then retry.' : 'No completed sales were found in this period.')}</div>
        <div className="chart-footer"><span><span className="tiny-dot"/>{demo ? 'Sample data only — no real sales trend is implied.' : reportData ? 'Period: ' + reportData.period.from + ' → ' + reportData.period.to : 'Waiting for live report data.'}</span><Button variant="text" onClick={() => onNavigate('Reports')}>View report <ArrowRight size={14}/></Button></div>
      </section>
      <section className="panel payment-panel">
        <div className="panel-head"><div><h2>Payment methods</h2><p>{demo ? 'Illustrative sample shares.' : 'Breakdown from saved completed sales.'}</p></div><button className="icon-button" aria-label="Payment methods"><Wallet size={18}/></button></div>
        <div className="donut-wrap">{hasData && paymentRows.length ? <><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentRows} dataKey="value" nameKey="method" cx="50%" cy="50%" innerRadius="65%" outerRadius="84%" paddingAngle={4} stroke="none">{paymentRows.map((row,index)=><Cell key={row.method} fill={paymentColors[index % paymentColors.length]}/>)}</Pie><Tooltip contentStyle={{background:'var(--popover)',border:'1px solid var(--line)',borderRadius:10,color:'var(--text)'}} formatter={(value,name) => [demo ? String(Number(value)) + '%' : formatAmount(value), name]}/></PieChart></ResponsiveContainer><div className="donut-center"><span>{loading ? '—' : formatAmount(demo ? 24556 : livePaymentTotal)}</span><small>{demo ? 'Sample total paid' : 'Recorded payments'}</small></div></> : unavailable(reportError ? 'Payment totals are unavailable until the database schema is updated.' : 'No recorded payments in this period.')}</div>
        <div className="payment-legend">{hasData && paymentRows.length ? paymentRows.map((row,index)=><div key={row.method}><span><i className="legend-dot" style={{background:paymentColors[index % paymentColors.length]}}/> {String(row.method).charAt(0).toUpperCase()+String(row.method).slice(1).toLowerCase()}</span><b>{demo ? row.percentage + '%' : formatAmount(row.amount)}</b></div>) : <span className="muted">No payment breakdown available.</span>}</div>
      </section>
    </div>
    <div className="dashboard-bottom-grid">
      <section className="panel recent-panel"><div className="panel-head"><div><h2>Recent transactions</h2><p>{demo ? 'Illustrative examples, not actual transactions.' : 'Latest saved transactions from the database.'}</p></div><Button variant="text" onClick={() => onNavigate('Transactions')}>View all <ArrowRight size={14}/></Button></div>
        {hasData && recentRows.length ? <div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>CUSTOMER</th><th>PAYMENT</th><th>AMOUNT</th><th>STATUS</th><th></th></tr></thead><tbody>{recentRows.slice(0,5).map(row => <tr key={row.id}><td><span className="transaction-id">{row.id}</span><small>{row.date || '—'}</small></td><td><div className="customer-cell"><Avatar initials={row.initials || 'WC'} color={row.color || 'purple'}/><span>{row.customer || 'Walk-in Customer'}</span></div></td><td><span className="payment-method">{row.method === 'Cash' ? <Banknote size={15}/> : row.method === 'UPI' ? <Smartphone size={15}/> : <CardIcon size={15}/>} {row.method || '—'}</span></td><td className="amount-cell">{formatAmount(row.amount)}</td><td><Pill tone={String(row.status || 'COMPLETED').toUpperCase()==='COMPLETED'?'success':'neutral'} dot>{String(row.status || 'COMPLETED').replace(/_/g,' ')}</Pill></td><td><button className="icon-button small" onClick={() => onNavigate('Transactions')} aria-label="Open transactions"><Ellipsis size={17}/></button></td></tr>)}</tbody></table></div> : <EmptyState icon={ReceiptText} title={reportError ? 'Transactions unavailable' : 'No transactions yet'} text={reportError ? 'Correct the database schema error above, then retry.' : 'Saved sales will appear here as you use the POS.'}/>}
      </section>
      <section className="panel low-stock-panel"><div className="panel-head"><div><h2>Stock attention</h2><p>Items that need a restock.</p></div><span className="count-badge">{hasData ? stockAlertCount : '—'}</span></div>
        <div className="stock-attention-list">{hasData && stockAttention.length ? stockAttention.map(it => <div className="stock-attention-item" key={it.id}><div className={'product-mini mini-' + it.color}>{it.icon}</div><div className="stock-item-copy"><b>{it.name}</b><span>{it.sku}</span></div><div className="stock-item-right"><b className={isOut(it)?'danger-text':'warning-text'}>{it.stock} left</b><span>{isOut(it)?'Out of stock':'Low stock'}</span></div></div>) : <EmptyState icon={Boxes} title={hasData ? 'Stock levels look good' : 'Stock data unavailable'} text={hasData ? 'There are no items below their reorder threshold.' : 'Load database-backed inventory to view alerts.'}/>}</div>
        <Button className="full-width" onClick={() => onNavigate('Inventory')}>Review inventory <ArrowRight size={15}/></Button>
      </section>
    </div>
  </>;
}

function lowStockCountForDemo(items) {
  return items.filter(item => Number(item.stock) > 0 && Number(item.stock) <= Number(item.reorderThreshold ?? 8)).length
    + items.filter(item => Number(item.stock) <= 0).length;
}

function Inventory({ items, setItems, notify, onNavigate }) {
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('All items'); const [category, setCategory] = useState('All categories'); const [selected, setSelected] = useState([]);
  const categories = ['All categories', ...new Set(items.map(i=>i.category))];
  const filtered = items.filter(i => (i.name.toLowerCase().includes(query.toLowerCase()) || i.sku.toLowerCase().includes(query.toLowerCase())) && (status==='All items' || (status==='Low stock' && i.stock>0 && i.stock<=8) || (status==='Out of stock' && i.stock===0) || (status==='In stock' && i.stock>8)) && (category==='All categories' || i.category===category));
  const toggle = id => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
  return <><SectionTitle eyebrow="CATALOG & STOCK" title="Inventory" subtitle="Keep your stock accurate, organized, and ready to sell." action={<><Button icon={Download} onClick={()=>notify('Inventory export is a demo action in this phase.')}>Export</Button><Button variant="primary" icon={Plus} onClick={()=>onNavigate('Items')}>Add item</Button></>}/><div className="stats-grid inventory-stats"><StatCard icon={Boxes} label="Total items" value={String(items.length).padStart(2,'0')} note="Across all categories" accent="violet"/><StatCard icon={PackageCheck} label="In stock" value={String(items.filter(i=>i.stock>8).length).padStart(2,'0')} note="Healthy stock levels" accent="green"/><StatCard icon={AlertTriangle} label="Low stock" value={String(items.filter(i=>i.stock>0&&i.stock<=8).length).padStart(2,'0')} note="At or below reorder level" accent="amber"/><StatCard icon={Package} label="Out of stock" value={String(items.filter(i=>i.stock===0).length).padStart(2,'0')} note="Requires attention" accent="blue"/></div><section className="panel inventory-panel"><div className="inventory-toolbar"><div className="tabs"><button className={status==='All items'?'tab active':'tab'} onClick={()=>setStatus('All items')}>All items <span>{items.length}</span></button><button className={status==='Low stock'?'tab active':'tab'} onClick={()=>setStatus('Low stock')}>Low stock <span>{items.filter(i=>i.stock>0&&i.stock<=8).length}</span></button><button className={status==='Out of stock'?'tab active':'tab'} onClick={()=>setStatus('Out of stock')}>Out of stock <span>{items.filter(i=>i.stock===0).length}</span></button></div><div className="toolbar-controls"><div className="search-box compact"><Search size={16}/><input placeholder="Search items or SKU..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>⌘ K</kbd></div><select className="select-control" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><Button icon={SlidersHorizontal} onClick={()=>notify('Advanced inventory filters are planned for the next phase.')}>Filters</Button></div></div>{selected.length>0&&<div className="bulk-bar"><span>{selected.length} item{selected.length>1?'s':''} selected</span><Button variant="text" onClick={()=>setSelected([])}>Clear selection</Button><Button icon={Download} onClick={()=>notify('Bulk export queued in the demo.')}>Export selected</Button></div>}<div className="table-wrap inventory-table"><table><thead><tr><th className="check-col"><input type="checkbox" checked={filtered.length>0&&filtered.every(i=>selected.includes(i.id))} onChange={e=>setSelected(e.target.checked?filtered.map(i=>i.id):[])}/></th><th>ITEM</th><th>SKU</th><th>CATEGORY</th><th>SELLING PRICE</th><th>ON HAND</th><th>STOCK STATUS</th><th></th></tr></thead><tbody>{filtered.map(it=><tr key={it.id}><td><input type="checkbox" checked={selected.includes(it.id)} onChange={()=>toggle(it.id)}/></td><td><div className="inventory-product"><div className={`product-mini mini-${it.color}`}>{it.icon}</div><div><b>{it.name}</b><small>{it.displayId || it.id}</small></div></div></td><td className="sku-cell">{it.sku}</td><td><span className="category-label">{it.category}</span></td><td className="amount-cell">{formatMoney(it.price)}</td><td><b>{it.stock}</b><span className="muted"> units</span></td><td>{it.stock===0?<Pill tone="danger" dot>Out of stock</Pill>:it.stock<=8?<Pill tone="warning" dot>Low stock</Pill>:<Pill tone="success" dot>In stock</Pill>}</td><td><button className="icon-button small" onClick={()=>notify(`${it.name} · Item actions will be connected in the next phase.`)}><Ellipsis size={18}/></button></td></tr>)}</tbody></table>{filtered.length===0&&<EmptyState icon={Search} title="No items found" text="Try changing your search or filters." action={<Button onClick={()=>{setQuery('');setStatus('All items');setCategory('All categories')}}>Clear filters</Button>}/>}</div><div className="table-footer"><span>Showing <b>{filtered.length===0?0:1}–{filtered.length}</b> of <b>{items.length}</b> items</span><div className="pagination"><button disabled><ChevronLeft size={16}/></button><button className="page-current">1</button><button disabled><ChevronRight size={16}/></button></div></div></section></>;
}

function POS({ items, setItems, notify, role, currency, auth, onUnauthorized }) {
  const [cart, setCart] = useState([]); const [query, setQuery] = useState(''); const [category, setCategory] = useState('All'); const [step, setStep] = useState('cart'); const [method, setMethod] = useState('Cash'); const [received, setReceived] = useState(''); const [customer, setCustomer] = useState('Walk-in Customer'); const [customerId, setCustomerId] = useState(''); const [customerOptions, setCustomerOptions] = useState([]); const [showPrice, setShowPrice] = useState(null); const [priceDraft, setPriceDraft] = useState(''); const [priceReason, setPriceReason] = useState(''); const [showDiscount, setShowDiscount] = useState(false); const [discount, setDiscount] = useState(''); const [discountReason, setDiscountReason] = useState(''); const [showStockOverride, setShowStockOverride] = useState(null); const [stockReason, setStockReason] = useState(''); const [success, setSuccess] = useState(null); const [submitting, setSubmitting] = useState(false); const [referenceNo, setReferenceNo] = useState(''); const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    if (!auth?.token) { setCustomerOptions([]); setCustomerId(''); return; }
    let cancelled = false;
    apiRequest('/customers', { token: auth.token }).then(data => {
      if (!cancelled) setCustomerOptions((data.customers || []).filter(customer => Boolean(Number(customer.isActive))));
    }).catch(error => {
      if (!cancelled) notify(error.message || 'Could not load customer directory.', 'warning');
      if (error.status === 401 && onUnauthorized) onUnauthorized();
    });
    return () => { cancelled = true; };
  }, [auth?.token]);
  const money = n => currency==='INR'?formatMoney(n):`${currency} ${Number(n).toFixed(2)}`;
  const cats = ['All', ...new Set(items.map(i=>i.category))];
  const products = items.filter(i=>(i.name.toLowerCase().includes(query.toLowerCase())||i.sku.toLowerCase().includes(query.toLowerCase()))&&(category==='All'||i.category===category));
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0); const discountNum = Math.min(subtotal,Math.max(0,Number(discount)||0)); const total = Math.max(0,subtotal-discountNum); const change = Math.max(0,(Number(received)||0)-total);
  const addItem = item => { if(item.stock===0 && role!=='Admin'){notify('This item is out of stock. Only an Admin can override stock.','warning');return;} setCart(prev=>{const found=prev.find(x=>x.id===item.id);if(found){if(found.qty+1>item.stock && role!=='Admin'){notify(`Only ${item.stock} units available.`,'warning');return prev;}return prev.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x);}return [...prev,{...item,qty:1,defaultPrice:item.price,override:false}];}); };
  const changeQty = (id, delta) => setCart(prev=>prev.map(line=>{if(line.id!==id)return line;const next=line.qty+delta;if(next<1)return line;if(next>items.find(i=>i.id===id).stock && role!=='Admin'){notify(`Only ${items.find(i=>i.id===id).stock} units available.`,'warning');return line;}return {...line,qty:next};}));
  const removeLine = id => setCart(prev=>prev.filter(x=>x.id!==id));
  const complete = async () => {
    if (!cart.length || submitting) return;
    if (method === 'Cash' && (received === '' || Number(received) < total)) { notify('Amount received must cover the total.', 'warning'); return; }
    const overrideLines = cart.filter(line => line.qty > (items.find(i => i.id === line.id)?.stock ?? 0));
    if (overrideLines.length && role !== 'Admin') { notify('Resolve stock issues before checkout.', 'warning'); return; }
    if (overrideLines.length && !overrideLines.every(line => line.stockOverride && String(line.stockReason || '').trim().length >= 5)) {
      setShowStockOverride(overrideLines[0].id);
      notify('Admin stock override requires a reason for every oversold item.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      let sale;
      if (auth) {
        const result = await apiRequest('/sales', {
          method: 'POST',
          token: auth.token,
          body: {
            customerId: customerId ? Number(customerId) : null,
            paymentMethod: method,
            amountReceived: method === 'Cash' ? Number(received) : total,
            referenceNo: referenceNo.trim() || null,
            discountAmount: discountNum,
            discountReason: discountNum > 0 ? discountReason.trim() : null,
            negativeStockOverride: overrideLines.length > 0,
            stockOverrideReason: overrideLines.length ? overrideLines.map(line => line.stockReason).join('; ') : null,
            idempotencyKey,
            lines: cart.map(line => ({
              itemId: line.apiId,
              quantity: line.qty,
              unitPrice: line.price,
              ...(line.override ? { overrideReason: line.overrideReason } : {}),
            })),
          },
        });
        sale = {
          id: result.sale.receiptNo,
          customer,
          amount: Number(result.sale.total),
          method: result.sale.paymentMethod || method,
          date: new Date().toLocaleString(),
          items: cart.map(line => ({ ...line })),
          change: Number(result.sale.changeDue || 0),
          persisted: true,
        };
      } else {
        sale = {
          id: '#NX-' + String(Date.now()).slice(-5),
          customer,
          amount: total,
          method,
          date: new Date().toLocaleString(),
          items: cart.map(line => ({ ...line })),
          change: method === 'Cash' ? change : 0,
          persisted: false,
        };
      }
      setItems(prev => prev.map(item => {
        const line = cart.find(c => c.id === item.id);
        if (!line) return item;
        const nextStock = item.stock - line.qty;
        return { ...item, stock: nextStock, status: nextStock <= 0 ? 'Out of stock' : nextStock <= 8 ? 'Low stock' : 'In stock' };
      }));
      setSuccess(sale);
      setStep('done');
      notify(auth ? 'Sale saved to the database.' : 'Demo sale completed in local state.', 'success');
    } catch (error) {
      notify(error.message || 'Sale could not be completed.', 'warning');
      if (error.status === 401 && onUnauthorized) onUnauthorized();
    } finally {
      setSubmitting(false);
    }
  };
  const reset = () => {setCart([]);setQuery('');setReceived('');setReferenceNo('');setDiscount('');setDiscountReason('');setCustomer('Walk-in Customer');setCustomerId('');setStep('cart');setSuccess(null);setIdempotencyKey(crypto.randomUUID());};
  const openPrice = line => {setShowPrice(line.id);setPriceDraft(String(line.price));setPriceReason('');};
  const savePrice = () => {if(priceReason.trim().length<5){notify('Please enter a reason of at least 5 characters.','warning');return;}const value=Number(priceDraft);if(!Number.isFinite(value)||value<0){notify('Enter a valid price.','warning');return;}setCart(prev=>prev.map(x=>x.id===showPrice?{...x,price:value,override:true,overrideReason:priceReason}:x));setShowPrice(null);notify('Price override applied to this cart line.','success');};
  const saveDiscount = () => {if(discountReason.trim().length<5){notify('Please enter a discount reason of at least 5 characters.','warning');return;}if(Number(discount)<0||Number(discount)>subtotal){notify('Discount must be between zero and subtotal.','warning');return;}setShowDiscount(false);notify('Order discount applied.','success');};
  const overrideStock = () => {if(stockReason.trim().length<5){notify('A reason of at least 5 characters is required.','warning');return;}const item=items.find(i=>i.id===showStockOverride);if(item){setCart(prev=>{const line=prev.find(x=>x.id===item.id);return line?prev.map(x=>x.id===item.id?{...x,stockOverride:true,stockReason}:x):[...prev,{...item,qty:1,defaultPrice:item.price,override:false,stockOverride:true,stockReason}];});}setShowStockOverride(null);setStockReason('');notify('Admin stock override noted for this demo session.','warning');};
  if(step==='done'&&success) return <div className="pos-success panel"><div className="success-orbit"><CheckCheck size={32}/></div><Pill tone="success" dot>{success.persisted ? 'Sale saved' : 'Sale completed · Demo'}</Pill><h1>Payment received!</h1><p>{success.persisted ? 'Your transaction has been saved to the Nexora database.' : 'Your transaction has been recorded in this demo session.'}</p><div className="receipt-card"><div className="receipt-brand"><BrandMark/><div><b>NEXORA</b><small>YOUR STORE, IN SYNC.</small></div></div><div className="receipt-number"><span>Transaction</span><b>{success.id}</b></div><div className="receipt-number"><span>Date</span><b>{success.date}</b></div><div className="receipt-lines">{success.items.map(i=><div key={i.id}><span>{i.name} × {i.qty}</span><b>{money(i.price*i.qty)}</b></div>)}</div><div className="receipt-number"><span>Subtotal</span><b>{money(success.items.reduce((s,i)=>s+i.price*i.qty,0))}</b></div>{discountNum>0&&<div className="receipt-number"><span>Discount</span><b>−{money(discountNum)}</b></div>}<div className="receipt-total"><span>Total paid</span><b>{money(success.amount)}</b></div><div className="receipt-number"><span>Payment method</span><b>{success.method}</b></div>{success.method==='Cash'&&<div className="receipt-number"><span>Change due</span><b>{money(success.change)}</b></div>}<div className="receipt-foot">Thank you for shopping with us ✦</div></div><div className="success-actions"><Button icon={Printer} onClick={()=>window.print()}>Print receipt</Button><Button variant="primary" icon={Plus} onClick={reset}>New sale</Button></div><p className="demo-note">{success.persisted ? 'This receipt references a database-backed sale.' : 'Demo mode: refreshing the app resets sample data. No database record was created.'}</p></div>;
  return <div className="pos-page"><div className="pos-heading"><div><div className="eyebrow">WORKSPACE / CHECKOUT</div><h1>Point of Sale</h1><p>Build a cart, collect payment, and keep the line moving.</p></div><div className="pos-session"><span className="live-dot"/> Register 01 <span className="session-separator"/> {role}</div></div><div className="pos-layout"><section className="pos-catalog panel"><div className="pos-search-row"><div className="search-box pos-search"><ScanBarcode size={18}/><input autoFocus placeholder="Search products or scan barcode..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>⌘ K</kbd></div><button className="icon-button" onClick={()=>notify('Barcode scanner input is ready for a connected scanner.')} title="Barcode"><ScanBarcode size={19}/></button></div><div className="category-chips">{cats.map(c=><button key={c} className={category===c?'category-chip active':'category-chip'} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="pos-product-grid">{products.map(it=><button key={it.id} className={`pos-product ${it.stock===0?'product-unavailable':''}`} onClick={()=>it.stock===0&&role==='Admin'?setShowStockOverride(it.id):addItem(it)}><div className={`product-art art-${it.color}`}><span>{it.icon}</span>{it.stock===0&&<em>OUT</em>}</div><div className="pos-product-info"><b>{it.name}</b><span>{it.category}</span><div><strong>{money(it.price)}</strong><small className={it.stock<=8?'warning-text':''}>{it.stock} in stock</small></div></div><span className="add-product"><Plus size={16}/></span></button>)}</div>{products.length===0&&<EmptyState icon={Search} title="No products found" text="Try a different name, SKU, or category."/>}<div className="catalog-footer"><span><span className="live-dot"/> {products.length} products available</span><span>Tap a product to add it</span></div></section><section className="pos-cart panel"><div className="cart-heading"><div><div className="eyebrow">CURRENT ORDER</div><h2>Cart <span>{cart.reduce((s,i)=>s+i.qty,0)}</span></h2></div><button className="icon-button" onClick={()=>{setCart([]);setDiscount('');notify('Cart cleared.')}} title="Clear cart"><RotateCcw size={17}/></button></div><label className="field-label">Customer</label><div className="customer-select"><UserRound size={16}/><select value={auth ? customerId : customer} onChange={e=>{if(auth){const selected=customerOptions.find(row=>String(row.id)===e.target.value);setCustomerId(e.target.value);setCustomer(selected?.name||'Walk-in Customer');}else setCustomer(e.target.value);}}><option value="">Walk-in Customer</option>{auth ? customerOptions.map(row=><option key={row.id} value={row.id}>{row.name}</option>) : <><option>Olivia Rhye</option><option>Phoenix Baker</option><option>Lana Steiner</option><option>Demi Wilkinson</option></>}</select><ChevronDown size={15}/></div><div className="cart-items">{cart.length===0?<div className="cart-empty"><div className="cart-empty-icon"><ShoppingCart size={24}/></div><b>Your cart is waiting</b><p>Add products from the catalog to start a sale.</p></div>:cart.map(line=><div className="cart-line" key={line.id}><div className={`cart-line-art art-${line.color}`}>{line.icon}</div><div className="cart-line-main"><b>{line.name}</b><span>{money(line.price)} each {line.override&&<Pill tone="warning">Price adjusted</Pill>}</span><div className="qty-control"><button onClick={()=>changeQty(line.id,-1)} aria-label="Decrease quantity">−</button><span>{line.qty}</span><button onClick={()=>changeQty(line.id,1)} aria-label="Increase quantity">+</button></div></div><div className="cart-line-end"><b>{money(line.price*line.qty)}</b><button className="remove-line" onClick={()=>removeLine(line.id)} aria-label="Remove item"><X size={14}/></button>{['Admin','Manager'].includes(role)&&<button className="edit-price" onClick={()=>openPrice(line)}>Edit price</button>}</div>{line.stockOverride&&<div className="line-warning"><AlertTriangle size={13}/> Admin stock override — requires reconciliation</div>}</div>)}</div><div className="cart-bottom"><div className="cart-subtotal"><span>Subtotal</span><b>{money(subtotal)}</b></div>{['Admin','Manager'].includes(role)&&<button className="discount-trigger" onClick={()=>setShowDiscount(true)}><Tag size={15}/> {discountNum>0?'Edit order discount':'Add discount'} <Plus size={14}/></button>}{discountNum>0&&<div className="cart-subtotal discount-line"><span>Discount</span><b>−{money(discountNum)}</b></div>}<div className="cart-total"><span>Total due</span><b>{money(total)}</b></div><Button variant="primary" className="checkout-btn" icon={ArrowRight} disabled={!cart.length} onClick={()=>{setStep('payment');setReceived('');}}>Continue to payment</Button><div className="secure-note"><ShieldCheck size={13}/> Full payment required · No credit sales</div></div></section></div>
    {step==='payment'&&<div className="modal-backdrop" onClick={()=>setStep('cart')}><div className="modal payment-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">STEP 2 OF 2</div><h2>Collect payment</h2><p>Confirm payment before completing the sale.</p></div><button className="icon-button" onClick={()=>setStep('cart')}><X size={18}/></button></div><div className="payment-total-box"><span>Amount due</span><b>{money(total)}</b></div><label className="field-label">Payment method</label><div className="payment-method-grid">{[{name:'Cash',icon:Banknote},{name:'UPI',icon:Smartphone},{name:'Card',icon:CreditCard}].map(({name,icon:Icon})=><button key={name} className={`payment-option ${method===name?'selected':''}`} onClick={()=>setMethod(name)}><Icon size={20}/><span>{name}</span>{method===name&&<Check size={15}/>}</button>)}</div>{method==='Cash'?<><label className="field-label">Amount received</label><div className="money-input"><span>₹</span><input autoFocus type="number" min="0" step="0.01" placeholder={total.toFixed(2)} value={received} onChange={e=>setReceived(e.target.value)}/></div><div className="quick-cash">{[total,100,500,1000].filter((v,i,a)=>a.indexOf(v)===i).map(v=><button key={v} onClick={()=>setReceived(v.toFixed(2))}>{v===total?'Exact':money(v)}</button>)}</div><div className="change-box"><span>Change due</span><b>{money(change)}</b></div>{received!==''&&Number(received)<total&&<p className="field-error">Amount received must cover the full total.</p>}</>:<><label className="field-label">Reference number <span className="optional-label">Optional</span></label><input className="form-input" value={referenceNo} onChange={e=>setReferenceNo(e.target.value)} placeholder={`Enter ${method} reference (optional)`}/><div className="info-callout"><CircleHelp size={16}/><span>This records the payment method only. No payment gateway is connected in this phase.</span></div></>}<div className="modal-actions"><Button onClick={()=>setStep('cart')}>Back to cart</Button><Button variant="primary" icon={CheckCircle2} disabled={submitting|| (method==='Cash'&&(received===''||Number(received)<total))} onClick={complete}>{submitting?'Saving sale…':`Complete sale · ${money(total)}`}</Button></div></div></div>}
    {showPrice&&<div className="modal-backdrop" onClick={()=>setShowPrice(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">AUTHORIZED ACTION</div><h2>Override selling price</h2><p>Changes apply to this sale line only.</p></div><button className="icon-button" onClick={()=>setShowPrice(null)}><X size={18}/></button></div><label className="field-label">New unit price</label><div className="money-input"><span>₹</span><input type="number" min="0" value={priceDraft} onChange={e=>setPriceDraft(e.target.value)}/></div>{Number(priceDraft)<(cart.find(x=>x.id===showPrice)?.cost||0)&&<div className="warning-callout"><AlertTriangle size={16}/> Below cost — review the margin before continuing.</div>}<label className="field-label">Reason <span className="required-label">Required</span></label><textarea className="form-input textarea" placeholder="Why is this price being changed? (min 5 characters)" value={priceReason} onChange={e=>setPriceReason(e.target.value)}/><div className="modal-actions"><Button onClick={()=>setShowPrice(null)}>Cancel</Button><Button variant="primary" onClick={savePrice}>Apply override</Button></div></div></div>}
    {showDiscount&&<div className="modal-backdrop" onClick={()=>setShowDiscount(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">AUTHORIZED ACTION</div><h2>Order discount</h2><p>Discounts are available to Managers and Admins.</p></div><button className="icon-button" onClick={()=>setShowDiscount(false)}><X size={18}/></button></div><label className="field-label">Discount amount</label><div className="money-input"><span>₹</span><input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0.00"/></div><label className="field-label">Reason <span className="required-label">Required</span></label><textarea className="form-input textarea" value={discountReason} onChange={e=>setDiscountReason(e.target.value)} placeholder="Reason for discount (min 5 characters)"/><div className="modal-actions"><Button onClick={()=>{setDiscount('');setShowDiscount(false)}}>Remove discount</Button><Button variant="primary" onClick={saveDiscount}>Apply discount</Button></div></div></div>}
    {showStockOverride&&<div className="modal-backdrop" onClick={()=>setShowStockOverride(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="warning-modal-icon"><AlertTriangle size={24}/></div><div className="modal-head"><div><div className="eyebrow">ADMIN OVERRIDE</div><h2>Insufficient stock</h2><p>{items.find(i=>i.id===showStockOverride)?.name} has {items.find(i=>i.id===showStockOverride)?.stock ?? 0} units available. Continuing will create a reconciliation exception.</p></div><button className="icon-button" onClick={()=>setShowStockOverride(null)}><X size={18}/></button></div><div className="warning-callout"><AlertTriangle size={17}/> This sale will be flagged for stock reconciliation. The cost basis policy is not yet implemented.</div><label className="field-label">Reason <span className="required-label">Required</span></label><textarea className="form-input textarea" value={stockReason} onChange={e=>setStockReason(e.target.value)} placeholder="Enter the reason for this override (min 5 characters)"/><div className="modal-actions"><Button onClick={()=>setShowStockOverride(null)}>Cancel</Button><Button variant="primary" onClick={overrideStock}>Override & continue</Button></div></div></div>}
  </div>;
}

function PlannedModule({ page, onNavigate }) {
  const details = {
    'Staff & Roles': { title: 'Staff & access control', subtitle: 'Manage store accounts, role assignments, and account status.', icon: ShieldCheck, next: 'Staff APIs and invite/reset flows will be connected here.' },
    Reports: { title: 'Reports & analytics', subtitle: 'Review completed sales, cost-aware gross profit, and stock movement.', icon: FileBarChart, next: 'Reports will use database-backed metrics only; net profit requires an expense module.' },
    'Returns & Refunds': { title: 'Returns & refunds', subtitle: 'Refund eligible sale lines while preserving the original transaction history.', icon: RotateCcw, next: 'The return workflow and refund settlement rules are still being implemented.' },
    Settings: { title: 'Business settings', subtitle: 'Configure currency, tax, receipt details, and store preferences.', icon: Settings, next: 'Settings will be persisted via the API once the rules are complete.' },
  };
  const data = details[page] || details.Reports;
  const Icon = data.icon;
  return <><SectionTitle eyebrow="NEXT IMPLEMENTATION SLICE" title={data.title} subtitle={data.subtitle}/><section className="panel planned-module-panel"><div className="planned-module-orb"><Icon size={26}/></div><h2>{data.title}</h2><p>{data.next}</p><div className="planned-module-note"><ShieldCheck size={17}/><span>No illustrative transaction totals are shown here in the authenticated workspace.</span></div><Button variant="primary" icon={Boxes} onClick={()=>onNavigate(page==='Returns & Refunds'?'Transactions':page==='Reports'?'Transactions':'Items')}>{page==='Returns & Refunds'?'View transactions':page==='Reports'?'Open saved transactions':'Return to catalog'}</Button></section></>;
}

function GenericPage({ page, onNavigate, items, notify, setItems, currency }) {
  const [query, setQuery] = useState('');
  const configs = {
    Items:{eyebrow:'CATALOG & STOCK',title:'Items',subtitle:'Manage your product catalog, pricing, and SKUs.',icon:Package,action:'Add item',columns:['ITEM','SKU','CATEGORY','SELLING PRICE','COST BASIS','STATUS']},
    Categories:{eyebrow:'CATALOG & STOCK',title:'Categories',subtitle:'Organize your products into clear, searchable groups.',icon:Tag,action:'Add category',columns:['CATEGORY','ITEMS','DESCRIPTION','STATUS']},
    Purchases:{eyebrow:'CATALOG & STOCK',title:'Purchases',subtitle:'Record incoming stock and keep supplier costs up to date.',icon:PackagePlus,action:'New purchase',columns:['PURCHASE','SUPPLIER','DATE','ITEMS','TOTAL','STATUS']},
    Suppliers:{eyebrow:'RELATIONSHIPS',title:'Suppliers',subtitle:'Keep supplier details and purchasing relationships organized.',icon:Truck,action:'Add supplier',columns:['SUPPLIER','CONTACT','EMAIL','PRODUCTS','STATUS']},
    Customers:{eyebrow:'RELATIONSHIPS',title:'Customers',subtitle:'View customer profiles and purchase history.',icon:Users,action:'Add customer',columns:['CUSTOMER','CONTACT','TOTAL SPENT','ORDERS','LAST PURCHASE']},
    'Staff & Roles':{eyebrow:'SYSTEM',title:'Staff & roles',subtitle:'Manage access to the parts of Nexora each person can use.',icon:ShieldCheck,action:'Invite staff',columns:['TEAM MEMBER','ROLE','LAST ACTIVE','STATUS']},
    Transactions:{eyebrow:'WORKSPACE',title:'Transactions',subtitle:'A clear record of completed sales and payment methods.',icon:ReceiptText,action:'Export',columns:['TRANSACTION','CUSTOMER','DATE','PAYMENT','AMOUNT','STATUS']},
    Reports:{eyebrow:'INSIGHTS',title:'Reports & analytics',subtitle:'Understand sales performance, margins, and stock movement.',icon:FileBarChart,action:'Export report',columns:[]},
    'Returns & Refunds':{eyebrow:'INSIGHTS',title:'Returns & refunds',subtitle:'Review returned items and keep the original sale history intact.',icon:RotateCcw,action:'Start return',columns:['RETURN','ORIGINAL SALE','CUSTOMER','DATE','REFUND','STATUS']},
    Settings:{eyebrow:'SYSTEM',title:'Settings',subtitle:'Configure your store profile and business preferences.',icon:Settings,action:'Save changes',columns:[]},
  };
  const config=configs[page]||configs.Items; const Icon=config.icon;
  const [currencySetting,setCurrencySetting]=useState(currency||'INR'); const [taxEnabled,setTaxEnabled]=useState(false); const [storeName,setStoreName]=useState('Nexora Store'); const [locale,setLocale]=useState('en-IN');
  const rows = page==='Items'?items.filter(i=>i.name.toLowerCase().includes(query.toLowerCase())||i.sku.toLowerCase().includes(query.toLowerCase())).map(i=>[<div className="inventory-product"><div className={`product-mini mini-${i.color}`}>{i.icon}</div><div><b>{i.name}</b><small>{i.id}</small></div></div>,i.sku,i.category,formatMoney(i.price),formatMoney(i.cost),<Pill tone={i.stock===0?'danger':i.stock<=8?'warning':'success'} dot>{i.stock===0?'Out of stock':i.stock<=8?'Low stock':'Active'}</Pill>]):page==='Categories'?['Beverages','Snacks','Accessories','Dairy alternatives'].map((name,i)=>[<b>{name}</b>,[3,2,2,1][i],['Drinks and refreshments','Packaged snacks and treats','Everyday reusable goods','Plant-based alternatives'][i],<Pill tone="success" dot>Active</Pill>]):page==='Transactions'?recentSales.filter(s=>s.id.toLowerCase().includes(query.toLowerCase())||s.customer.toLowerCase().includes(query.toLowerCase())).map(s=>[<b className="transaction-id">{s.id}</b>,s.customer,s.date,s.method,formatMoney(s.amount),<Pill tone="success" dot>Completed</Pill>]):[];
  const actionClick=()=>{if(page==='Items')notify('Add item form will be connected in the next phase.');else if(page==='Settings')notify('Settings saved for this demo session.');else notify(`${config.action} is part of the next implementation slice.`);};
  return <><SectionTitle eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} action={<><Button icon={Download} onClick={()=>notify('Export is planned for a later phase.')}>Export</Button><Button variant="primary" icon={Plus} onClick={actionClick}>{config.action}</Button></>}/>{page==='Settings'?<div className="settings-layout"><div className="settings-nav panel"><button className="settings-nav-item active"><BriefcaseBusiness size={16}/> Business profile</button><button className="settings-nav-item"><CircleDollarSign size={16}/> Currency & tax</button><button className="settings-nav-item"><ReceiptText size={16}/> Receipts</button><button className="settings-nav-item"><ShieldCheck size={16}/> Security</button></div><div className="settings-content panel"><div className="panel-head"><div><h2>Business profile</h2><p>These details appear across your workspace and receipts.</p></div><Pill tone="neutral">Admin only</Pill></div><div className="settings-form"><div className="form-field"><label>Business name</label><input className="form-input" value={storeName} onChange={e=>setStoreName(e.target.value)}/></div><div className="form-field"><label>Business currency</label><select className="form-input" value={currencySetting} onChange={e=>setCurrencySetting(e.target.value)}><option value="INR">INR · Indian Rupee (₹)</option><option value="USD">USD · US Dollar ($)</option><option value="GBP">GBP · British Pound (£)</option><option value="EUR">EUR · Euro (€)</option></select><small>One currency for the business. Changing this relabels historical amounts; it does not convert them.</small></div><div className="form-field"><label>Number format locale</label><select className="form-input" value={locale} onChange={e=>setLocale(e.target.value)}><option value="en-IN">English (India)</option><option value="en-US">English (United States)</option><option value="en-GB">English (United Kingdom)</option></select></div><div className="settings-divider"/><div className="setting-toggle-row"><div><b>Enable tax</b><p>Tax is off by default. Tax calculation rules require final approval before implementation.</p></div><button className={`toggle ${taxEnabled?'on':''}`} onClick={()=>setTaxEnabled(!taxEnabled)} aria-label="Toggle tax"><span/></button></div>{taxEnabled&&<div className="info-callout"><CircleHelp size={16}/> Tax is enabled in this prototype, but tax calculation is not yet connected. Do not use for real transactions.</div>}<div className="settings-divider"/><div className="setting-toggle-row"><div><b>Negative stock override</b><p>Admin-only, with a mandatory reason and reconciliation record.</p></div><Pill tone="warning">Policy enforced in design</Pill></div><div className="settings-actions"><Button variant="primary" onClick={()=>notify('Settings updated in this demo session. No database is connected yet.','success')}>Save changes</Button></div></div></div></div>:page==='Reports'?<><div className="stats-grid"><StatCard icon={Wallet} label="Net sales revenue" value="₹24,580" change="12.8%" note="After recorded returns and discounts"/><StatCard icon={TrendingUp} label="Gross profit" value="₹8,426" change="6.4%" note="Based on weighted average cost" accent="green"/><StatCard icon={ShoppingBag} label="Completed orders" value="384" change="8.2%" note="Voided sales excluded" accent="blue"/><StatCard icon={Boxes} label="Inventory cost value" value="₹1,82,940" change="2.1%" trend="down" note="Quantity on hand × average cost" accent="amber"/></div><div className="reports-grid"><div className="panel chart-panel"><div className="panel-head"><div><h2>Sales performance</h2><p>Revenue by day · Illustrative demo data</p></div><Button icon={CalendarDays}>Last 7 days</Button></div><div className="sales-chart report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={salesData} margin={{top:10,right:8,left:-12,bottom:0}}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:12}} dy={10}/><YAxis axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}} tickFormatter={formatShort}/><Tooltip contentStyle={{background:'var(--popover)',border:'1px solid var(--line)',borderRadius:12,color:'var(--text)'}} formatter={v=>[formatMoney(v),'Sales']}/><Bar dataKey="sales" fill="#7968e8" radius={[6,6,0,0]} maxBarSize={38}/></BarChart></ResponsiveContainer></div></div><div className="panel report-note"><div className="stat-icon icon-violet"><Sparkles size={18}/></div><h2>Reliable numbers, no guesswork.</h2><p>Nexora reports gross profit using each sale line's saved cost snapshot. Net profit is intentionally unavailable until expense tracking exists.</p><Pill tone="success" dot>Cost-aware reporting</Pill></div></div></>:<><div className="stats-grid"><StatCard icon={Icon} label={page==='Transactions'?'Completed sales':'Total records'} value={page==='Transactions'?'384':String(rows.length||'08')} note="Demo data for interface review" accent="violet"/><StatCard icon={TrendingUp} label="This month" value="₹24,580" change="12.8%" note="Illustrative only" accent="green"/><StatCard icon={Clock3} label="Needs attention" value={page==='Items'?'03':'02'} note="Requires review" accent="amber"/><StatCard icon={CheckCircle2} label="Active" value={page==='Staff & Roles'?'06':'98%'} note="Current workspace" accent="blue"/></div><section className="panel generic-table-panel"><div className="panel-head"><div><h2>{page} overview</h2><p>Review and manage your {page.toLowerCase()}.</p></div><div className="toolbar-controls"><div className="search-box compact"><Search size={16}/><input placeholder={`Search ${page.toLowerCase()}...`} value={query} onChange={e=>setQuery(e.target.value)}/></div><Button icon={Filter} onClick={()=>notify('Additional filters will be available in the next phase.')}>Filter</Button></div></div>{config.columns.length&&rows.length?<div className="table-wrap"><table><thead><tr>{config.columns.map(c=><th key={c}>{c}</th>)}<th></th></tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}<td><button className="icon-button small" onClick={()=>notify('Record details will be connected to the backend in a later phase.')}><Ellipsis size={18}/></button></td></tr>)}</tbody></table></div>:<EmptyState icon={Icon} title={`Your ${page.toLowerCase()} workspace is ready`} text="This screen is scaffolded with the Nexora design system. Connect the backend in the next phase to manage real records." action={<Button variant="primary" icon={Plus} onClick={actionClick}>{config.action}</Button>}/>}<div className="table-footer"><span>Demo mode · Data is illustrative</span><span className="muted">Live database integration is next</span></div></section></>}</>;
}

export default function App() {
  const [auth, setAuth] = useState(() => { try { return JSON.parse(sessionStorage.getItem('nexora.auth') || 'null'); } catch { return null; } }); const [demoMode, setDemoMode] = useState(false); const [apiLoading, setApiLoading] = useState(Boolean(auth)); const [active, setActive] = useState('Dashboard'); const [dark, setDark] = useState(false); const [sidebarOpen, setSidebarOpen] = useState(false); const [role, setRole] = useState(() => { try { return JSON.parse(sessionStorage.getItem('nexora.auth') || 'null')?.user?.role || 'Admin'; } catch { return 'Admin'; } }); const [items, setItems] = useState(initialItems); const [searchOpen, setSearchOpen] = useState(false); const [globalSearch, setGlobalSearch] = useState(''); const [notificationsOpen, setNotificationsOpen] = useState(false); const [toast, setToast] = useState(null); const [currency, setCurrency] = useState('INR');
  useEffect(() => {
    if (!auth) return;
    let cancelled = false;
    setApiLoading(true);
    Promise.all([
      apiRequest('/items', { token: auth.token }),
      apiRequest('/settings', { token: auth.token }),
      apiRequest('/auth/me', { token: auth.token }),
    ])
      .then(([itemData, settingsData, sessionData]) => {
        if (cancelled) return;
        setItems(toUiItems(itemData.items || []));
        if (settingsData.settings?.currencyCode) setCurrency(settingsData.settings.currencyCode);
        if (sessionData.user) {
          setRole(sessionData.user.role);
          if (auth.user?.role !== sessionData.user.role || auth.user?.name !== sessionData.user.name || auth.user?.email !== sessionData.user.email) {
            const currentSession = { ...auth, user: sessionData.user };
            sessionStorage.setItem('nexora.auth', JSON.stringify(currentSession));
            setAuth(currentSession);
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        sessionStorage.removeItem('nexora.auth');
        setAuth(null);
        setApiLoading(false);
      })
      .finally(() => { if (!cancelled) setApiLoading(false); });
    return () => { cancelled = true; };
  }, [auth]);
  const login = async credentials => {
    const result = await apiRequest('/auth/login', { method: 'POST', body: credentials });
    const session = { token: result.token, user: result.user };
    sessionStorage.setItem('nexora.auth', JSON.stringify(session));
    setRole(result.user.role);
    setApiLoading(true);
    setAuth(session);
    setDemoMode(false);
  };
  const logout = () => {
    sessionStorage.removeItem('nexora.auth');
    setAuth(null);
    setDemoMode(false);
    setApiLoading(false);
    setItems(initialItems);
    setCurrency('INR');
    setActive('Dashboard');
    setRole('Admin');
  };
  const userName = auth?.user?.name || 'Alex Rivera';
  const userInitials = userName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'AR';
  if (!auth && !demoMode) return <LoginScreen onLogin={login} onDemo={() => setDemoMode(true)} />;
  if (auth && apiLoading) return <div className="app-loading-screen"><div className="login-brand-mark"><i /><i /><i /><i /></div><h2>Preparing your workspace</h2><p>Connecting your store catalog…</p></div>;
  const notify = (message, type='info') => { setToast({message,type}); window.clearTimeout(window.__nexoraToast); window.__nexoraToast=window.setTimeout(()=>setToast(null),3600); };
  const go = page => {setActive(page);setSidebarOpen(false);};
  const allPages = navGroups.flatMap(g=>g.items.map(i=>i.id)).concat(['Settings']);
  const searchResults = allPages.filter(p=>p.toLowerCase().includes(globalSearch.toLowerCase()));
  return <div className={`app-shell ${dark?'theme-dark':''}`}>
    {sidebarOpen&&<button className="mobile-scrim" onClick={()=>setSidebarOpen(false)} aria-label="Close navigation"/>}
    <aside className={`sidebar ${sidebarOpen?'sidebar-open':''}`}><div className="brand-row"><BrandMark/><div className="brand-wordmark"><b>NEXORA</b><span>POINT OF SALE</span></div><button className="sidebar-close icon-button" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div><button className="workspace-switch"><span className="workspace-avatar"><BriefcaseBusiness size={16}/></span><span className="workspace-copy"><b>Nexora Store</b><small>Retail workspace</small></span><ChevronDown size={15}/></button><nav className="main-nav">{navGroups.map(group=><div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>go(item.id)} className={`nav-item ${active===item.id?'nav-active':''}`}><Icon size={18} strokeWidth={1.8}/><span>{item.id}</span>{item.badge&&<kbd>{item.badge}</kbd>}{item.id==='Inventory'&&<span className="nav-alert">3</span>}</button>})}</div>)}</nav><div className="sidebar-bottom"><button className={`nav-item ${active==='Settings'?'nav-active':''}`} onClick={()=>go('Settings')}><Settings size={18}/><span>Settings</span></button>{auth&&<button className="nav-item" onClick={logout}><LogOut size={18}/><span>Sign out</span></button>}<div className="sidebar-help"><div className="help-orb"><LifeBuoy size={18}/></div><b>Need a hand?</b><p>Our help center is always open.</p><button onClick={()=>notify('Help center link will be added in a later phase.')}>Visit help center <ArrowRight size={13}/></button></div><div className="profile-row"><Avatar initials={userInitials} color="purple"/><div className="profile-copy"><b>{userName}</b><small>{role}</small></div><button className="icon-button small" onClick={()=>notify('Profile settings are planned for a later phase.')}><MoreHorizontal size={18}/></button></div></div></aside>
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={()=>setSidebarOpen(true)}><Menu size={20}/></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><b>{active}</b></div></div><div className="topbar-actions"><button className="global-search" onClick={()=>setSearchOpen(true)}><Search size={16}/><span>Search anything...</span><kbd>⌘ K</kbd></button><span className="topbar-divider"/><button className="icon-button theme-switch" onClick={()=>setDark(!dark)} title={dark?'Switch to light theme':'Switch to dark theme'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><div className="notification-wrap"><button className={`icon-button notification-button ${notificationsOpen?'button-selected':''}`} onClick={()=>setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell size={18}/><i/></button>{notificationsOpen&&<div className="notification-popover"><div className="popover-title"><b>Notifications</b><Pill tone="neutral">3 new</Pill></div><div className="notification-item"><span className="notification-icon warning-bg"><AlertTriangle size={16}/></span><div><b>Stock running low</b><p>3 items are below their reorder level.</p><small>12 minutes ago</small></div></div><div className="notification-item"><span className="notification-icon success-bg"><CheckCircle2 size={16}/></span><div><b>Daily summary ready</b><p>Yesterday's sales report is available.</p><small>1 hour ago</small></div></div><button className="popover-link" onClick={()=>{setNotificationsOpen(false);go('Inventory')}}>Review stock alerts <ArrowRight size={14}/></button></div>}</div><span className="topbar-divider"/>{auth ? <div className="role-switch"><span>Signed in as</span><b>{role}</b></div> : <div className="role-switch"><span>Preview as</span><select value={role} onChange={e=>{setRole(e.target.value);notify(`Preview role changed to ${e.target.value}. Demo mode only; server permissions are not connected.`)}}><option>Admin</option><option>Manager</option><option>Cashier</option></select></div>}<Avatar initials={userInitials} color="purple"/></div></header><div className="page-content">{active==='Dashboard'?<Dashboard items={items} onNavigate={go} isLive={Boolean(auth)} auth={auth} currency={currency}/>:active==='Point of Sale'?<POS items={items} setItems={setItems} notify={notify} role={role} currency={currency} auth={auth} onUnauthorized={logout}/>:auth && ['Inventory','Items','Categories','Purchases','Suppliers','Customers','Transactions','Staff & Roles','Reports','Returns & Refunds','Settings'].includes(active)?<LiveModulePage page={active} auth={auth} items={items} setItems={setItems} notify={notify} onUnauthorized={logout} onNavigate={go} currency={currency} onCurrencyChange={setCurrency}/>:<GenericPage page={active} onNavigate={go} items={items} setItems={setItems} notify={notify} currency={currency}/>}<footer className="app-footer"><span>© 2026 Nexora POS <span className="footer-separator">·</span> Built for better business.</span><span><span className="live-dot"/> {auth ? 'API connected' : 'Demo workspace'} <span className="footer-separator">·</span> <button onClick={()=>notify('Nexora POS · Phase 2 integration branch')}>v0.2.0</button></span></footer></div></main>
    {searchOpen&&<div className="modal-backdrop search-backdrop" onClick={()=>setSearchOpen(false)}><div className="global-search-modal" onClick={e=>e.stopPropagation()}><div className="global-search-input"><Search size={19}/><input autoFocus placeholder="Search pages..." value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)}/><kbd>ESC</kbd><button className="icon-button small" onClick={()=>setSearchOpen(false)}><X size={17}/></button></div><div className="search-results-label">NAVIGATION</div>{searchResults.length?searchResults.map(p=><button className="search-result" key={p} onClick={()=>{go(p);setSearchOpen(false);setGlobalSearch('')}}><span className="search-result-icon"><Command size={16}/></span><span>{p}</span><ArrowRight size={15}/></button>):<div className="search-no-results">No pages match “{globalSearch}”.</div>}<div className="search-modal-footer"><span>Navigate to a page</span><span><kbd>↑</kbd> <kbd>↓</kbd> to browse <kbd>↵</kbd> to open</span></div></div></div>}
    {toast&&<div className={`toast toast-${toast.type}`}><span className="toast-icon">{toast.type==='success'?<CheckCircle2 size={18}/>:toast.type==='warning'?<AlertTriangle size={18}/>:<Activity size={18}/>}</span><span>{toast.message}</span><button onClick={()=>setToast(null)}><X size={15}/></button></div>}
  </div>;
}
