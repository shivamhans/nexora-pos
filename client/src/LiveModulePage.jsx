import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, CheckCircle2, ChevronDown, ClipboardList,
  Clock3, Download, Eye, Filter, Package, PackagePlus, Plus, RefreshCw, Search, ShieldCheck,
  Tag, Truck, Users, Wallet, X, RotateCcw, History, CircleCheck, CircleHelp, FileText, Save
} from 'lucide-react';
import { apiRequest, toUiItems } from './lib/api.js';

const cash = value => '₹' + Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const asDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const prettyStatus = value => String(value || 'Unknown').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const isManager = role => ['Admin', 'Manager'].includes(role);

function LiveButton({ children, onClick, variant = 'secondary', icon: Icon, disabled, type = 'button' }) {
  return <button type={type} className={'btn btn-' + variant} onClick={onClick} disabled={disabled}>{Icon && <Icon size={16} strokeWidth={2} />}{children}</button>;
}
function StatusPill({ value }) {
  const status = String(value || '').toUpperCase();
  const tone = ['ACTIVE', 'COMPLETED', 'RECEIVED', 'PAID', 'RESOLVED', 'IN_STOCK'].includes(status) ? 'success'
    : ['OUT_OF_STOCK', 'CANCELLED', 'VOID', 'INACTIVE', 'DAMAGE_WRITE_OFF'].includes(status) ? 'danger'
    : ['ORDERED', 'PARTIALLY_RECEIVED', 'OPEN', 'LOW_STOCK', 'PENDING'].includes(status) ? 'warning' : 'neutral';
  return <span className={'pill pill-' + tone} dot="true"><i />{prettyStatus(value)}</span>;
}
function Field({ label, children, hint }) {
  return <label className="live-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function LiveModal({ title, subtitle, onClose, children, onSubmit, submitLabel = 'Save record', busy = false, wide = false }) {
  return <div className="modal-backdrop" onClick={onClose}><form className={'modal live-modal' + (wide ? ' live-modal-wide' : '')} onClick={e => e.stopPropagation()} onSubmit={onSubmit}>
    <div className="modal-head"><div><div className="eyebrow">NEXORA WORKSPACE</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
    <div className="live-modal-content">{children}</div>
    <div className="modal-actions"><LiveButton onClick={onClose}>Cancel</LiveButton><LiveButton type="submit" variant="primary" icon={Save} disabled={busy}>{busy ? 'Saving…' : submitLabel}</LiveButton></div>
  </form></div>;
}
function BlankState({ title, text, onAdd, addLabel }) {
  return <div className="empty-state live-empty"><div className="empty-icon"><ClipboardList size={21}/></div><h3>{title}</h3><p>{text}</p>{onAdd && <LiveButton variant="primary" icon={Plus} onClick={onAdd}>{addLabel || 'Add first record'}</LiveButton>}</div>;
}

export default function LiveModulePage({ page, auth, items, setItems, notify, onUnauthorized, onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({});
  const [receivePurchase, setReceivePurchase] = useState(null);
  const [receiveQuantities, setReceiveQuantities] = useState({});
  const [transactionDetail, setTransactionDetail] = useState(null);
  const [pageError, setPageError] = useState('');

  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;
  const role = auth?.user?.role || 'Cashier';
  const canManage = isManager(role);
  const token = auth?.token;
  const refresh = () => setRefreshKey(value => value + 1);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setPageError('');
      const get = path => apiRequest(path, { token });
      try {
        if (page === 'Items') {
          const [itemData, categoryData] = await Promise.all([get('/items'), get('/categories')]);
          if (!cancelled) { setItems(toUiItems(itemData.items || [])); setCategories(categoryData.categories || []); }
        } else if (page === 'Inventory') {
          const [itemData, movementData, reconData] = await Promise.all([get('/items'), get('/inventory/movements?limit=100'), get('/inventory/reconciliations')]);
          if (!cancelled) { setItems(toUiItems(itemData.items || [])); setMovements(movementData.movements || []); setReconciliations(reconData.reconciliations || []); }
        } else if (page === 'Categories') {
          const data = await get('/categories?includeInactive=' + (canManage ? '1' : '0'));
          if (!cancelled) setCategories(data.categories || []);
        } else if (page === 'Suppliers') {
          const data = await get('/suppliers?includeInactive=' + (canManage ? '1' : '0'));
          if (!cancelled) setSuppliers(data.suppliers || []);
        } else if (page === 'Customers') {
          const data = await get('/customers?includeInactive=' + (canManage ? '1' : '0'));
          if (!cancelled) setCustomers(data.customers || []);
        } else if (page === 'Purchases') {
          const [purchaseData, supplierData, itemData] = await Promise.all([get('/purchases'), get('/suppliers'), get('/items')]);
          if (!cancelled) { setPurchases(purchaseData.purchases || []); setSuppliers(supplierData.suppliers || []); setItems(toUiItems(itemData.items || [])); }
        } else if (page === 'Transactions') {
          const data = await get('/transactions?limit=100&offset=0');
          if (!cancelled) setTransactions(data.transactions || []);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(error.message || 'Could not load records from the API.');
          if (error.status === 401 && onUnauthorizedRef.current) onUnauthorizedRef.current();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (token) run();
    else { setLoading(false); setPageError('Sign in to access database-backed records.'); }
    return () => { cancelled = true; };
  }, [page, token, refreshKey, canManage, setItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const match = value => String(value ?? '').toLowerCase().includes(q);
    if (page === 'Items' || page === 'Inventory') return items.filter(row => [row.name, row.sku, row.category].some(match));
    if (page === 'Categories') return categories.filter(row => [row.name, row.description].some(match));
    if (page === 'Suppliers') return suppliers.filter(row => [row.name, row.contactName, row.email, row.phone].some(match));
    if (page === 'Customers') return customers.filter(row => [row.name, row.email, row.phone].some(match));
    if (page === 'Purchases') return purchases.filter(row => [row.purchaseNo, row.supplier, row.status].some(match));
    if (page === 'Transactions') return transactions.filter(row => [row.receiptNo, row.customer, row.cashier, row.paymentMethod, row.method, row.status].some(match));
    return [];
  }, [page, query, items, categories, suppliers, customers, purchases, transactions]);

  const currentRows = filtered || (page === 'Items' || page === 'Inventory' ? items : page === 'Categories' ? categories : page === 'Suppliers' ? suppliers : page === 'Customers' ? customers : page === 'Purchases' ? purchases : transactions);
  const setValue = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const openCreate = () => {
    const today = new Date();
    const iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    setForm(page === 'Items' ? { name: '', sku: '', categoryId: '', sellingPrice: '', initialCost: '', initialQty: '0', reorderThreshold: '5', barcode: '' }
      : page === 'Categories' ? { name: '', description: '' }
      : page === 'Suppliers' ? { name: '', contactName: '', email: '', phone: '', address: '', notes: '' }
      : page === 'Customers' ? { name: '', email: '', phone: '', notes: '' }
      : page === 'Purchases' ? { supplierId: '', purchaseDate: iso, notes: '', lines: [{ itemId: items[0]?.apiId || '', quantity: '1', unitCost: '0.00' }] }
      : {});
    setModal('create');
  };

  const runRequest = async (path, method, body, successMessage) => {
    if (busy) return;
    setBusy(true);
    try {
      await apiRequest(path, { method: method || 'GET', token, ...(body === undefined ? {} : { body }) });
      notify(successMessage || 'Saved successfully.', 'success');
      setModal('');
      setRefreshKey(value => value + 1);
      return true;
    } catch (error) {
      notify(error.message || 'Request failed.', 'warning');
      if (error.status === 401 && onUnauthorizedRef.current) onUnauthorizedRef.current();
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitCreate = async event => {
    event.preventDefault();
    if (busy) return;
    let path = '';
    let payload = {};
    if (page === 'Items') {
      payload = {
        name: form.name, sku: form.sku, categoryId: form.categoryId ? Number(form.categoryId) : null,
        sellingPrice: Number(form.sellingPrice), initialCost: Number(form.initialCost || 0),
        initialQty: Number(form.initialQty || 0), reorderThreshold: Number(form.reorderThreshold || 5),
        barcode: form.barcode || null,
      };
      path = '/items';
    } else if (page === 'Categories') {
      payload = { name: form.name, description: form.description || null }; path = '/categories';
    } else if (page === 'Suppliers') {
      payload = { name: form.name, contactName: form.contactName, email: form.email, phone: form.phone, address: form.address, notes: form.notes }; path = '/suppliers';
    } else if (page === 'Customers') {
      payload = { name: form.name, email: form.email, phone: form.phone, notes: form.notes }; path = '/customers';
    } else if (page === 'Purchases') {
      const lines = (form.lines || []).map(line => ({ itemId: Number(line.itemId), quantity: Number(line.quantity), unitCost: Number(line.unitCost) }));
      if (!lines.length || lines.some(line => !Number.isInteger(line.itemId) || line.itemId < 1 || !Number.isInteger(line.quantity) || line.quantity < 1 || !Number.isFinite(line.unitCost) || line.unitCost < 0)) {
        notify('Each purchase line needs an item, a positive whole quantity, and a non-negative unit cost.', 'warning'); return;
      }
      if (new Set(lines.map(line => line.itemId)).size !== lines.length) { notify('Choose each item only once per purchase; combine its quantity.', 'warning'); return; }
      payload = { supplierId: form.supplierId ? Number(form.supplierId) : null, purchaseDate: form.purchaseDate, notes: form.notes || null, additionalCost: 0, lines };
      path = '/purchases';
    } else return;
    if (!String(form.name || '').trim() && page !== 'Purchases') { notify('Please fill in the required name field.', 'warning'); return; }
    await runRequest(path, 'POST', payload, page === 'Purchases' ? 'Purchase order created. Stock will change only when quantities are received.' : ({ Items: 'Item created.', Categories: 'Category created.', Suppliers: 'Supplier created.', Customers: 'Customer created.' }[page] || 'Record created.'));
  };

  const setLine = (index, key, value) => setForm(old => ({ ...old, lines: old.lines.map((line, i) => i === index ? { ...line, [key]: value } : line) }));
  const openReceive = async purchase => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await apiRequest('/purchases/' + purchase.id, { token });
      const selected = data.purchase;
      setReceivePurchase(selected);
      const quantities = {};
      for (const line of selected.lines || []) quantities[line.purchaseItemId] = String(Math.max(0, Number(line.quantityOrdered) - Number(line.quantityReceived)));
      setReceiveQuantities(quantities);
      setModal('receive');
    } catch (error) {
      notify(error.message || 'Could not load purchase details.', 'warning');
      if (error.status === 401 && onUnauthorizedRef.current) onUnauthorizedRef.current();
    } finally { setBusy(false); }
  };
  const submitReceive = async event => {
    event.preventDefault();
    if (!receivePurchase || busy) return;
    const lines = (receivePurchase.lines || []).map(line => ({ purchaseItemId: Number(line.purchaseItemId), quantity: Number(receiveQuantities[line.purchaseItemId] || 0) })).filter(line => line.quantity > 0);
    if (!lines.length || lines.some(line => !Number.isInteger(line.quantity))) { notify('Enter at least one positive whole quantity to receive.', 'warning'); return; }
    const saved = await runRequest('/purchases/' + receivePurchase.id + '/receive', 'POST', { lines }, 'Receipt recorded. On-hand stock and weighted average cost have been updated.');
    if (saved) setReceivePurchase(null);
  };

  const submitAdjustment = async event => {
    event.preventDefault();
    const delta = Number(form.delta);
    if (!Number.isInteger(delta) || delta === 0) { notify('Enter a non-zero whole-number adjustment.', 'warning'); return; }
    if (form.type === 'DAMAGE_WRITE_OFF' && (role !== 'Admin' || delta >= 0)) { notify('Damage write-offs are Admin-only and must reduce stock.', 'warning'); return; }
    await runRequest('/inventory/adjustments', 'POST', { itemId: Number(form.itemId), delta, reason: form.reason, type: form.type || 'ADJUSTMENT' }, 'Stock adjustment saved to the movement ledger.');
  };
  const submitResolve = async event => {
    event.preventDefault();
    const countedQty = Number(form.countedQty);
    if (!Number.isInteger(countedQty) || countedQty < 0 || String(form.reason || '').trim().length < 10) { notify('Enter a non-negative physical count and a reason of at least 10 characters.', 'warning'); return; }
    await runRequest('/inventory/reconciliations/' + form.itemId + '/resolve', 'POST', { countedQty, reason: form.reason }, 'Reconciliation resolved. Historical provisional sale-cost snapshots were preserved.');
  };

  const openTransaction = async row => {
    setBusy(true);
    try {
      const result = await apiRequest('/transactions/' + row.id, { token });
      setTransactionDetail(result.transaction);
      setModal('transaction');
    } catch (error) {
      notify(error.message || 'Could not load transaction details.', 'warning');
      if (error.status === 401 && onUnauthorized) onUnauthorized();
    } finally { setBusy(false); }
  };

  const toggleActive = async (kind, row) => {
    const path = '/' + kind + '/' + row.id;
    await runRequest(path, 'PATCH', { isActive: !Boolean(Number(row.isActive)) }, (Number(row.isActive) ? 'Record deactivated.' : 'Record activated.'));
  };

  const exportData = () => {
    const data = currentRows || [];
    const serialized = data.map(row => Object.fromEntries(Object.entries(row).filter(([, value]) => value == null || ['string', 'number', 'boolean'].includes(typeof value))));
    const csv = serialized.length ? [Object.keys(serialized[0]).join(','), ...serialized.map(row => Object.values(row).map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))].join('\r\n') : '';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nexora-' + page.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  let title = page;
  let subtitle = '';
  let eyebrow = 'LIVE DATA / WORKSPACE';
  let Icon = ClipboardList;
  let addLabel = 'Add record';
  if (page === 'Items') { title = 'Items'; subtitle = 'Your live catalog, SKU list, prices, and opening stock.'; eyebrow = 'CATALOG & STOCK'; Icon = Package; addLabel = 'Add item'; }
  if (page === 'Categories') { subtitle = 'Organize products with database-backed categories.'; eyebrow = 'CATALOG & STOCK'; Icon = Tag; addLabel = 'Add category'; }
  if (page === 'Suppliers') { subtitle = 'Manage supplier contacts used for purchase orders.'; eyebrow = 'RELATIONSHIPS'; Icon = Truck; addLabel = 'Add supplier'; }
  if (page === 'Customers') { subtitle = 'Customer records and purchase totals from saved transactions.'; eyebrow = 'RELATIONSHIPS'; Icon = Users; addLabel = 'Add customer'; }
  if (page === 'Purchases') { subtitle = 'Create orders, receive quantities, and update weighted average cost.'; eyebrow = 'CATALOG & STOCK'; Icon = PackagePlus; addLabel = 'New purchase'; }
  if (page === 'Transactions') { subtitle = 'A searchable history of database-backed sales and payments.'; eyebrow = 'WORKSPACE'; Icon = History; addLabel = 'Export CSV'; }
  if (page === 'Inventory') { subtitle = 'Stock adjustments, immutable movement history, and Admin reconciliation.'; eyebrow = 'CATALOG & STOCK'; Icon = Boxes; addLabel = 'Adjust stock'; }
  const filteredItems = filtered || items;
  const statA = page === 'Items' || page === 'Inventory' ? filteredItems.length
    : page === 'Categories' ? currentRows.length
    : page === 'Suppliers' ? currentRows.length
    : page === 'Customers' ? currentRows.length
    : page === 'Purchases' ? currentRows.length : currentRows.length;
  const statB = page === 'Inventory' ? items.filter(row => row.stock <= 0).length
    : page === 'Items' ? items.filter(row => row.stock > 0 && row.stock <= 8).length
    : page === 'Purchases' ? purchases.filter(row => ['ORDERED', 'PARTIALLY_RECEIVED'].includes(String(row.status).toUpperCase())).length
    : page === 'Transactions' ? transactions.filter(row => String(row.status).toUpperCase() === 'COMPLETED').length
    : page === 'Customers' ? customers.reduce((sum, row) => sum + Number(row.totalSpent || 0), 0)
    : page === 'Suppliers' ? suppliers.reduce((sum, row) => sum + Number(row.purchaseCount || 0), 0)
    : page === 'Categories' ? categories.reduce((sum, row) => sum + Number(row.itemCount || 0), 0) : 0;
  const statBLabel = page === 'Inventory' ? 'Out of stock' : page === 'Items' ? 'Low stock items' : page === 'Purchases' ? 'Awaiting receipt' : page === 'Transactions' ? 'Completed sales' : page === 'Customers' ? 'Total customer spend' : page === 'Suppliers' ? 'Linked purchase orders' : 'Items assigned';
  const liveCreateAllowed = page === 'Customers' || canManage;
  const showCreate = page !== 'Transactions' && liveCreateAllowed;

  const moduleActions = <>
    <LiveButton icon={Download} onClick={exportData}>Export CSV</LiveButton>
    {showCreate && <LiveButton variant="primary" icon={page === 'Purchases' ? PackagePlus : page === 'Inventory' ? Boxes : Plus} onClick={() => {
      if (page === 'Inventory') { setForm({ itemId: items[0]?.apiId || '', delta: '1', type: 'ADJUSTMENT', reason: '' }); setModal('adjust'); }
      else openCreate();
    }}>{addLabel}</LiveButton>}
  </>;

  return <>
    <div className="section-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div><div className="title-actions">{moduleActions}</div></div>
    {pageError && <div className="live-error"><AlertTriangle size={17}/><span>{pageError}</span><LiveButton icon={RefreshCw} onClick={refresh}>Retry</LiveButton></div>}
    <div className="live-metrics">
      <div className="live-metric-card"><span className="live-metric-icon"><Icon size={18}/></span><div><small>{page === 'Transactions' ? 'Matching transactions' : page === 'Purchases' ? 'Purchase orders' : page === 'Inventory' ? 'Active SKUs' : 'Records'}</small><strong>{loading ? '—' : statA}</strong></div></div>
      <div className="live-metric-card"><span className="live-metric-icon metric-icon-amber"><AlertTriangle size={18}/></span><div><small>{statBLabel}</small><strong>{loading ? '—' : page === 'Customers' ? cash(statB) : statB}</strong></div></div>
      <div className="live-metric-card"><span className="live-metric-icon metric-icon-green"><CircleCheck size={18}/></span><div><small>Data source</small><strong className="live-source-label">MySQL via API</strong></div></div>
    </div>

    {page === 'Inventory' && <section className="panel live-section"><div className="panel-head"><div><h2>Negative-stock reconciliation</h2><p>Admin overrides remain visible until physical quantities are reconciled.</p></div><StatusPill value={reconciliations.length ? 'OPEN' : 'RESOLVED'}/></div>
      {reconciliations.length ? <div className="table-wrap"><table><thead><tr><th>ITEM</th><th>RECEIPT</th><th>SHORTAGE</th><th>REASON</th><th>CREATED</th><th></th></tr></thead><tbody>{reconciliations.map(row=><tr key={row.id}><td><b>{row.itemName}</b><small className="live-cell-sub">{row.sku}</small></td><td>{row.receiptNo}</td><td><b>{row.shortageQty} units</b></td><td>{row.reason}</td><td>{asDate(row.createdAt)}</td><td>{role === 'Admin' && <LiveButton variant="primary" onClick={()=>{setForm({itemId:row.itemId,itemName:row.itemName,countedQty:String(Math.max(0, Number(items.find(i=>i.apiId === Number(row.itemId))?.stock ?? 0))),reason:''});setModal('resolve');}}>Reconcile</LiveButton>}</td></tr>)}</tbody></table></div>
      : <BlankState title="No open reconciliations" text="Negative-stock overrides will appear here for physical-count review."/>}
    </section>}

    {page === 'Inventory' && <section className="panel live-section"><div className="panel-head"><div><h2>Stock on hand</h2><p>Adjustments are recorded in the stock movement ledger.</p></div><div className="toolbar-controls"><div className="search-box compact"><Search size={16}/><input placeholder="Search item or SKU…" value={query} onChange={e=>setQuery(e.target.value)}/></div></div></div>
      <div className="table-wrap"><table><thead><tr><th>ITEM</th><th>SKU</th><th>ON HAND</th><th>AVERAGE COST</th><th>STOCK VALUE</th><th>STATUS</th><th></th></tr></thead><tbody>{(filtered || items).map(row=><tr key={row.id}><td><b>{row.name}</b><small className="live-cell-sub">{row.category}</small></td><td>{row.sku}</td><td><b>{row.stock}</b></td><td>{cash(row.cost)}</td><td>{cash(row.stock * row.cost)}</td><td><StatusPill value={row.stock <= 0 ? 'OUT_OF_STOCK' : row.stock <= 8 ? 'LOW_STOCK' : 'IN_STOCK'}/></td><td>{canManage && row.stock >= 0 && <LiveButton onClick={()=>{setForm({itemId:row.apiId,delta:'1',type:'ADJUSTMENT',reason:''});setModal('adjust');}}>Adjust</LiveButton>}</td></tr>)}</tbody></table></div>
    </section>}

    {page === 'Inventory' && <section className="panel live-section"><div className="panel-head"><div><h2>Recent stock movements</h2><p>Append-only history of quantity changes.</p></div></div>
      {movements.length ? <div className="table-wrap"><table><thead><tr><th>DATE</th><th>ITEM</th><th>MOVEMENT</th><th>QUANTITY</th><th>COST AT TIME</th><th>REASON</th><th>USER</th></tr></thead><tbody>{movements.map(row=><tr key={row.id}><td>{asDate(row.createdAt)}</td><td><b>{row.itemName}</b><small className="live-cell-sub">{row.sku}</small></td><td>{prettyStatus(row.movementType)}</td><td className={Number(row.quantityDelta ?? row.qtyDelta) < 0 ? 'live-negative' : 'live-positive'}>{Number(row.quantityDelta ?? row.qtyDelta) > 0 ? '+' : ''}{row.quantityDelta ?? row.qtyDelta}</td><td>{cash(row.unitCostAtTime)}</td><td>{row.reason || '—'}</td><td>{row.userName || row.user || '—'}</td></tr>)}</tbody></table></div> : <BlankState title="No stock movements yet" text="Opening stock, receiving, sales and adjustments will be listed here."/>}
    </section>}

    {page !== 'Inventory' && <section className="panel live-section">
      <div className="panel-head"><div><h2>{page === 'Transactions' ? 'Sales history' : page + ' directory'}</h2><p>{page === 'Purchases' ? 'Purchase orders do not affect stock until received.' : page === 'Items' ? 'Live prices, cost snapshots and stock levels from the database.' : page === 'Transactions' ? 'Open a receipt to review saved line items and payments.' : 'Changes are validated and saved by the API.'}</p></div><div className="toolbar-controls"><div className="search-box compact"><Search size={16}/><input placeholder={'Search ' + page.toLowerCase() + '…'} value={query} onChange={e=>setQuery(e.target.value)}/><button className="icon-button small" onClick={refresh} title="Refresh"><RefreshCw size={14}/></button></div></div></div>
      {loading ? <div className="live-loading"><span className="login-status-pulse"/><span>Loading live records…</span></div>
      : currentRows.length === 0 ? <BlankState title={'No ' + page.toLowerCase() + ' found'} text={query ? 'Try another search term.' : 'Create your first record to start using this workflow.'} onAdd={showCreate ? openCreate : undefined} addLabel={addLabel}/>
      : <div className="table-wrap"><table><thead><tr>
        {page === 'Items' && <><th>ITEM</th><th>SKU</th><th>CATEGORY</th><th>SELLING PRICE</th><th>AVG COST</th><th>ON HAND</th><th>STATUS</th><th></th></>}
        {page === 'Categories' && <><th>CATEGORY</th><th>ITEM COUNT</th><th>DESCRIPTION</th><th>STATUS</th><th></th></>}
        {page === 'Suppliers' && <><th>SUPPLIER</th><th>CONTACT</th><th>EMAIL / PHONE</th><th>PURCHASE ORDERS</th><th>STATUS</th><th></th></>}
        {page === 'Customers' && <><th>CUSTOMER</th><th>CONTACT</th><th>ORDERS</th><th>TOTAL SPENT</th><th>LAST PURCHASE</th><th></th></>}
        {page === 'Purchases' && <><th>PURCHASE</th><th>SUPPLIER</th><th>ORDER DATE</th><th>LINES</th><th>TOTAL</th><th>STATUS</th><th></th></>}
        {page === 'Transactions' && <><th>RECEIPT</th><th>CUSTOMER</th><th>CASHIER</th><th>DATE</th><th>PAYMENT</th><th>TOTAL</th><th>STATUS</th><th></th></>}
      </tr></thead><tbody>
        {page === 'Items' && currentRows.map(row=><tr key={row.id}><td><b>{row.name}</b><small className="live-cell-sub">{row.displayId || row.id}</small></td><td>{row.sku}</td><td>{row.category}</td><td>{cash(row.price)}</td><td>{cash(row.cost)}</td><td>{row.stock}</td><td><StatusPill value={row.stock === 0 ? 'OUT_OF_STOCK' : row.stock <= 8 ? 'LOW_STOCK' : 'IN_STOCK'}/></td><td>{canManage && <button className="icon-button small" onClick={()=>onNavigate('Inventory')} title="Adjust stock"><Boxes size={16}/></button>}</td></tr>)}
        {page === 'Categories' && currentRows.map(row=><tr key={row.id}><td><b>{row.name}</b></td><td>{row.itemCount}</td><td>{row.description || '—'}</td><td><StatusPill value={Number(row.isActive) ? 'ACTIVE' : 'INACTIVE'}/></td><td>{canManage && <LiveButton onClick={()=>toggleActive('categories',row)}>{Number(row.isActive) ? 'Deactivate' : 'Activate'}</LiveButton>}</td></tr>)}
        {page === 'Suppliers' && currentRows.map(row=><tr key={row.id}><td><b>{row.name}</b><small className="live-cell-sub">{row.contactName || 'Supplier'}</small></td><td>{row.contactName || '—'}</td><td>{row.email || '—'}<small className="live-cell-sub">{row.phone || ''}</small></td><td>{row.purchaseCount || 0}</td><td><StatusPill value={Number(row.isActive) ? 'ACTIVE' : 'INACTIVE'}/></td><td>{canManage && <LiveButton onClick={()=>toggleActive('suppliers',row)}>{Number(row.isActive) ? 'Deactivate' : 'Activate'}</LiveButton>}</td></tr>)}
        {page === 'Customers' && currentRows.map(row=><tr key={row.id}><td><b>{row.name}</b><small className="live-cell-sub">{row.email || 'Customer'}</small></td><td>{row.phone || '—'}</td><td>{row.orderCount || 0}</td><td>{cash(row.totalSpent)}</td><td>{asDate(row.lastPurchaseAt)}</td><td>{canManage && <LiveButton onClick={()=>toggleActive('customers',row)}>{Number(row.isActive) ? 'Deactivate' : 'Activate'}</LiveButton>}</td></tr>)}
        {page === 'Purchases' && currentRows.map(row=><tr key={row.id}><td><b>{row.purchaseNo}</b></td><td>{row.supplier || 'No supplier'}</td><td>{asDate(row.purchaseDate)}</td><td>{row.lineCount || 0}</td><td>{cash(row.totalAmount)}</td><td><StatusPill value={row.status}/></td><td>{['ORDERED','PARTIALLY_RECEIVED'].includes(String(row.status).toUpperCase()) && canManage && <LiveButton variant="primary" onClick={()=>openReceive(row)} disabled={busy}>Receive</LiveButton>}</td></tr>)}
        {page === 'Transactions' && currentRows.map(row=><tr key={row.id}><td><b>{row.receiptNo}</b><small className="live-cell-sub">{row.lineCount || 0} item lines</small></td><td>{row.customer || 'Walk-in Customer'}</td><td>{row.cashier || '—'}</td><td>{asDate(row.completedAt)}</td><td>{prettyStatus(row.paymentMethod || row.method)}</td><td>{cash(row.totalAmount)}</td><td><StatusPill value={row.status}/></td><td><button className="icon-button small" onClick={()=>openTransaction(row)} aria-label="View transaction"><Eye size={16}/></button></td></tr>)}
      </tbody></table></div>}
      <div className="table-footer"><span>{loading ? 'Fetching from database…' : 'Showing ' + currentRows.length + ' live record' + (currentRows.length === 1 ? '' : 's')}</span><span className="muted">API connected · {role}</span></div>
    </section>}

    {modal === 'create' && <LiveModal title={page === 'Items' ? 'Add item' : page === 'Categories' ? 'Add category' : page === 'Suppliers' ? 'Add supplier' : page === 'Customers' ? 'Add customer' : 'Create purchase order'} subtitle="Required fields are validated by Nexora's API." onClose={()=>setModal('')} onSubmit={submitCreate} busy={busy} submitLabel={page === 'Purchases' ? 'Create purchase order' : 'Save record'} wide={page === 'Purchases'}>
      {(page === 'Items' || page === 'Categories' || page === 'Suppliers' || page === 'Customers') && <div className="live-form-grid">
        <Field label="Name *"><input className="form-input" required maxLength={180} value={form.name || ''} onChange={e=>setValue('name',e.target.value)} placeholder={page === 'Items' ? 'e.g. Matcha Energy Blend' : page === 'Categories' ? 'e.g. Beverages' : page === 'Suppliers' ? 'Supplier business name' : 'Customer full name'}/></Field>
        {page === 'Items' && <>
          <Field label="SKU *"><input className="form-input" required maxLength={80} value={form.sku || ''} onChange={e=>setValue('sku',e.target.value)} placeholder="NX-1009"/></Field>
          <Field label="Category"><select className="form-input" value={form.categoryId || ''} onChange={e=>setValue('categoryId',e.target.value)}><option value="">Uncategorized</option>{categories.filter(x=>Number(x.isActive)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Selling price *"><input className="form-input" type="number" required min="0" step="0.01" value={form.sellingPrice || ''} onChange={e=>setValue('sellingPrice',e.target.value)}/></Field>
          <Field label="Opening unit cost"><input className="form-input" type="number" min="0" step="0.0001" value={form.initialCost || ''} onChange={e=>setValue('initialCost',e.target.value)}/></Field>
          <Field label="Opening quantity"><input className="form-input" type="number" min="0" step="1" value={form.initialQty ?? '0'} onChange={e=>setValue('initialQty',e.target.value)}/></Field>
          <Field label="Low-stock threshold"><input className="form-input" type="number" min="0" step="1" value={form.reorderThreshold ?? '5'} onChange={e=>setValue('reorderThreshold',e.target.value)}/></Field>
          <Field label="Barcode (optional)"><input className="form-input" value={form.barcode || ''} onChange={e=>setValue('barcode',e.target.value)} /></Field>
        </>}
        {page === 'Categories' && <Field label="Description"><textarea className="form-input textarea" maxLength={500} value={form.description || ''} onChange={e=>setValue('description',e.target.value)} placeholder="What belongs in this category?"/></Field>}
        {(page === 'Suppliers' || page === 'Customers') && <>
          <Field label="Email"><input className="form-input" type="email" value={form.email || ''} onChange={e=>setValue('email',e.target.value)} placeholder="name@example.com"/></Field>
          <Field label="Phone"><input className="form-input" value={form.phone || ''} onChange={e=>setValue('phone',e.target.value)} placeholder="Contact number"/></Field>
          {page === 'Suppliers' && <>
            <Field label="Contact person"><input className="form-input" value={form.contactName || ''} onChange={e=>setValue('contactName',e.target.value)}/></Field>
            <Field label="Address"><input className="form-input" value={form.address || ''} onChange={e=>setValue('address',e.target.value)}/></Field>
          </>}
          <Field label="Notes"><textarea className="form-input textarea" value={form.notes || ''} onChange={e=>setValue('notes',e.target.value)}/></Field>
        </>}
      </div>}
      {page === 'Purchases' && <div className="live-purchase-form">
        <div className="live-form-grid">
          <Field label="Supplier"><select className="form-input" value={form.supplierId || ''} onChange={e=>setValue('supplierId',e.target.value)}><option value="">No supplier selected</option>{suppliers.filter(x=>Number(x.isActive)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Purchase date *"><input className="form-input" type="date" required value={form.purchaseDate || ''} onChange={e=>setValue('purchaseDate',e.target.value)}/></Field>
          <Field label="Notes"><input className="form-input" value={form.notes || ''} onChange={e=>setValue('notes',e.target.value)} /></Field>
        </div>
        <div className="live-purchase-lines"><div className="panel-head"><div><h3>Purchase lines</h3><p>Stock is not changed until receiving is recorded.</p></div><LiveButton icon={Plus} onClick={()=>setForm(old=>({...old,lines:[...(old.lines||[]),{itemId:'',quantity:'1',unitCost:'0.00'}]}))}>Add line</LiveButton></div>
          {(form.lines || []).map((line,index)=><div className="live-purchase-line" key={index}>
            <Field label="Item"><select className="form-input" required value={line.itemId || ''} onChange={e=>setLine(index,'itemId',e.target.value)}><option value="">Choose item</option>{items.map(item=><option key={item.id} value={item.apiId}>{item.name} · {item.sku}</option>)}</select></Field>
            <Field label="Quantity"><input className="form-input" type="number" min="1" step="1" required value={line.quantity} onChange={e=>setLine(index,'quantity',e.target.value)}/></Field>
            <Field label="Unit cost"><input className="form-input" type="number" min="0" step="0.0001" required value={line.unitCost} onChange={e=>setLine(index,'unitCost',e.target.value)}/></Field>
            <button type="button" className="icon-button small" title="Remove line" disabled={(form.lines || []).length === 1} onClick={()=>setForm(old=>({...old,lines:old.lines.filter((_,i)=>i!==index)}))}><X size={15}/></button>
          </div>)}
        </div>
        <div className="info-callout"><CircleHelp size={16}/><span>Additional charges are kept at zero until the freight-capitalization policy is approved. Weighted average cost is updated when items are received.</span></div>
      </div>}
    </LiveModal>}

    {modal === 'receive' && receivePurchase && <LiveModal title={'Receive ' + receivePurchase.purchaseNo} subtitle="Enter the quantities physically received. Leave a line at zero if it is not part of this receipt." onClose={()=>{setModal('');setReceivePurchase(null);}} onSubmit={submitReceive} busy={busy} submitLabel="Confirm receipt" wide>
      <div className="live-receive-list">{(receivePurchase.lines || []).map(line=>{
        const outstanding = Math.max(0,Number(line.quantityOrdered)-Number(line.quantityReceived));
        return <div className="live-receive-line" key={line.purchaseItemId}><div><b>{line.itemName}</b><small>{line.sku} · {line.quantityReceived} received of {line.quantityOrdered}</small><small>{outstanding} still outstanding</small></div><Field label="Receive now"><input className="form-input" type="number" min="0" max={outstanding} step="1" value={receiveQuantities[line.purchaseItemId] ?? '0'} onChange={e=>setReceiveQuantities(old=>({...old,[line.purchaseItemId]:e.target.value}))}/></Field></div>;
      })}</div>
      <div className="warning-callout"><AlertTriangle size={16}/><span>Receiving will update on-hand stock and weighted average cost inside a database transaction. Open negative-stock reconciliations must be resolved first.</span></div>
    </LiveModal>}

    {modal === 'adjust' && <LiveModal title="Adjust stock" subtitle="Every quantity change is written to the stock movement ledger." onClose={()=>setModal('')} onSubmit={submitAdjustment} busy={busy} submitLabel="Save adjustment">
      <Field label="Item"><select className="form-input" required value={form.itemId || ''} onChange={e=>setValue('itemId',e.target.value)}>{items.filter(x=>x.stock >= 0).map(item=><option key={item.id} value={item.apiId}>{item.name} · {item.stock} on hand</option>)}</select></Field>
      <Field label="Quantity change *" hint="Use a positive number to add stock or a negative number to remove it."><input className="form-input" type="number" step="1" required value={form.delta || ''} onChange={e=>setValue('delta',e.target.value)} placeholder="e.g. 12 or -2"/></Field>
      {role === 'Admin' && <Field label="Adjustment type"><select className="form-input" value={form.type || 'ADJUSTMENT'} onChange={e=>setValue('type',e.target.value)}><option value="ADJUSTMENT">Normal adjustment</option><option value="DAMAGE_WRITE_OFF">Damaged stock write-off</option></select></Field>}
      <Field label="Reason *"><textarea className="form-input textarea" minLength={5} maxLength={500} required value={form.reason || ''} onChange={e=>setValue('reason',e.target.value)} placeholder="Reason for changing the stock count"/></Field>
    </LiveModal>}

    {modal === 'resolve' && <LiveModal title="Resolve stock reconciliation" subtitle={'Physical count for ' + (form.itemName || 'selected item') + '. This closes every open reconciliation for that SKU.'} onClose={()=>setModal('')} onSubmit={submitResolve} busy={busy} submitLabel="Confirm physical count">
      <Field label="Counted quantity *"><input className="form-input" type="number" min="0" step="1" required value={form.countedQty || '0'} onChange={e=>setValue('countedQty',e.target.value)}/></Field>
      <Field label="Reason *" hint="At least 10 characters."><textarea className="form-input textarea" required minLength={10} maxLength={500} value={form.reason || ''} onChange={e=>setValue('reason',e.target.value)} placeholder="Explain the physical count and reconciliation"/></Field>
      <div className="warning-callout"><ShieldCheck size={16}/><span>Only an Admin can resolve this queue. Historical sale cost snapshots are retained and will not be silently restated.</span></div>
    </LiveModal>}

    {modal === 'transaction' && transactionDetail && <div className="modal-backdrop" onClick={()=>setModal('')}><div className="modal live-modal live-modal-wide" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">SAVED TRANSACTION</div><h2>{transactionDetail.receiptNo}</h2><p>{asDate(transactionDetail.completedAt)} · {transactionDetail.customer || 'Walk-in Customer'} · {transactionDetail.cashier || 'Unknown cashier'}</p></div><button className="icon-button" onClick={()=>setModal('')}><X size={18}/></button></div>
      <div className="live-detail-summary"><div><small>Subtotal</small><b>{cash(transactionDetail.subtotal)}</b></div><div><small>Discount</small><b>−{cash(transactionDetail.discountTotal)}</b></div><div><small>Tax</small><b>{cash(transactionDetail.taxTotal)}</b></div><div><small>Total paid</small><b>{cash(transactionDetail.totalAmount)}</b></div></div>
      <div className="table-wrap"><table><thead><tr><th>ITEM</th><th>SKU</th><th>QTY</th><th>UNIT PRICE</th><th>COST SNAPSHOT</th><th>LINE TOTAL</th></tr></thead><tbody>{(transactionDetail.lines || []).map(line=><tr key={line.saleItemId}><td><b>{line.itemName}</b>{line.provisionalCost ? <small className="live-negative">Provisional cost</small> : null}</td><td>{line.sku}</td><td>{line.quantity}</td><td>{cash(line.unitPriceActual)}</td><td>{cash(line.unitCostSnapshot)}</td><td>{cash(Number(line.unitPriceActual)*Number(line.quantity)-Number(line.discountAmount||0))}</td></tr>)}</tbody></table></div>
      <div className="live-payments"><b>Payments</b>{(transactionDetail.payments || []).map(payment=><div key={payment.id}><span>{prettyStatus(payment.method)}{payment.referenceNo ? ' · ' + payment.referenceNo : ''}</span><b>{cash(payment.amountReceived)}{Number(payment.changeDue) ? ' (change ' + cash(payment.changeDue) + ')' : ''}</b></div>)}</div>
      {transactionDetail.negativeStockOverride && <div className="warning-callout"><AlertTriangle size={16}/><span>This sale used an Admin negative-stock override. Review it in Inventory → Negative-stock reconciliation.</span></div>}
      <div className="modal-actions"><LiveButton onClick={()=>setModal('')}>Close</LiveButton><LiveButton icon={Download} onClick={()=>window.print()}>Print page</LiveButton></div>
    </div></div>}
  </>;
}
