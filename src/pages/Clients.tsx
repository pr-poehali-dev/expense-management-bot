import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, Client } from '@/lib/api';
import { formatCurrency } from '@/data/mockData';
import ClientDrawer from '@/components/clients/ClientDrawer';
import ClientForm, { emptyForm, ClientFormData } from '@/components/clients/ClientForm';
import ClientTable from '@/components/clients/ClientTable';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  function loadClients(q = '') {
    setLoading(true);
    api.clients.list(q || undefined)
      .then(res => {
        setClients(res.clients);
        setTotalMonthly(res.total_monthly);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadClients(); }, []);

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm, opened_at: new Date().toISOString().split('T')[0] });
    setShowForm(true);
  }

  function openEdit(c: Client) {
    setSelectedClient(null);
    setEditId(c.id);
    setForm({
      last_name: c.last_name,
      first_name: c.first_name,
      middle_name: c.middle_name,
      monthly_cost: String(c.monthly_cost),
      opened_at: c.opened_at,
      payment_day: c.payment_day != null ? String(c.payment_day) : '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.last_name.trim() || !form.first_name.trim()) return;
    setSaving(true);
    const payload = {
      last_name: form.last_name.trim(),
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim(),
      monthly_cost: parseFloat(form.monthly_cost) || 0,
      opened_at: form.opened_at || new Date().toISOString().split('T')[0],
      payment_day: form.payment_day ? parseInt(form.payment_day) : null,
    };
    try {
      if (editId !== null) {
        const updated = await api.clients.update(editId, payload);
        setClients(prev => prev.map(c => c.id === editId ? updated : c));
        const total = clients.reduce((s, c) => s + (c.id === editId ? updated.monthly_cost : c.monthly_cost), 0);
        setTotalMonthly(total);
      } else {
        const created = await api.clients.create(payload);
        setClients(prev => [...prev, created]);
        setTotalMonthly(prev => prev + created.monthly_cost);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    loadClients(searchInput);
  }

  function clearSearch() {
    setSearchInput('');
    setSearch('');
    loadClients('');
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Клиенты</h1>
          <p className="text-sm text-muted-foreground mt-0.5">База клиентов и тарифы обслуживания</p>
        </div>
        <button onClick={openCreate} className="fin-btn-primary flex items-center gap-2">
          <Icon name="UserPlus" size={14} />
          Добавить клиента
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Всего клиентов</span>
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
              <Icon name="Users" size={13} className="text-primary" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-foreground">{clients.length}</div>
          <div className="text-xs text-muted-foreground mt-1.5">активных карточек</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Выручка в месяц</span>
            <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center">
              <Icon name="CircleDollarSign" size={13} className="text-emerald-400" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-income">{formatCurrency(totalMonthly)}</div>
          <div className="text-xs text-muted-foreground mt-1.5">суммарно по клиентам</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Средний чек</span>
            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
              <Icon name="TrendingUp" size={13} className="text-primary" />
            </div>
          </div>
          <div className="font-mono-ibm text-2xl font-semibold text-foreground">
            {clients.length > 0 ? formatCurrency(totalMonthly / clients.length) : '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">на одного клиента</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <ClientForm
          form={form}
          setForm={setForm}
          editId={editId}
          saving={saving}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}

      {/* Table */}
      <ClientTable
        clients={clients}
        loading={loading}
        search={search}
        searchInput={searchInput}
        totalMonthly={totalMonthly}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        onClearSearch={clearSearch}
        onRowClick={setSelectedClient}
        onEdit={openEdit}
      />

      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={(c) => { openEdit(c); }}
        />
      )}
    </div>
  );
}
