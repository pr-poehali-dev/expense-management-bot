import Icon from '@/components/ui/icon';

export const emptyForm = {
  last_name: '',
  first_name: '',
  middle_name: '',
  monthly_cost: '',
  opened_at: '',
  payment_day: '',
};

export type ClientFormData = typeof emptyForm;

interface Props {
  form: ClientFormData;
  setForm: (f: ClientFormData) => void;
  editId: number | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function ClientForm({ form, setForm, editId, saving, onSave, onCancel }: Props) {
  return (
    <div className="stat-card border-primary/30 animate-fade-in">
      <div className="section-title mb-4">
        {editId !== null ? 'Редактирование клиента' : 'Новый клиент'}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Фамилия *</label>
          <input
            type="text"
            placeholder="Иванов"
            className="fin-input"
            value={form.last_name}
            onChange={e => setForm({ ...form, last_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Имя *</label>
          <input
            type="text"
            placeholder="Андрей"
            className="fin-input"
            value={form.first_name}
            onChange={e => setForm({ ...form, first_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Отчество</label>
          <input
            type="text"
            placeholder="Игоревич"
            className="fin-input"
            value={form.middle_name}
            onChange={e => setForm({ ...form, middle_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Стоимость в месяц (₽)</label>
          <input
            type="number"
            placeholder="0"
            className="fin-input font-mono-ibm"
            value={form.monthly_cost}
            onChange={e => setForm({ ...form, monthly_cost: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Дата открытия карточки</label>
          <input
            type="date"
            className="fin-input"
            value={form.opened_at}
            onChange={e => setForm({ ...form, opened_at: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">
            День оплаты <span className="text-muted-foreground/60">(1–31, для напоминания)</span>
          </label>
          <input
            type="number"
            min={1}
            max={31}
            placeholder="например, 5"
            className="fin-input font-mono-ibm"
            value={form.payment_day}
            onChange={e => setForm({ ...form, payment_day: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="fin-btn-secondary">Отмена</button>
        <button
          onClick={onSave}
          disabled={saving || !form.last_name.trim() || !form.first_name.trim()}
          className="fin-btn-primary flex items-center gap-2"
        >
          {saving
            ? <Icon name="Loader2" size={14} className="animate-spin" />
            : <Icon name="Check" size={14} />}
          {saving ? 'Сохранение...' : editId !== null ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </div>
  );
}
