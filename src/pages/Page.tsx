import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { BudgetTask, createTasks, ExpenseRecord, FinanceState, getCurrentBalance, getMonthKey, getPayPeriod, IncomeRecord, MovementRecord, readFinanceState, saveFinanceState, TaskCategory } from '../store/financeStore';
import './Page.css';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

const sectionContent: Record<string, { eyebrow: string; title: string; description: string }> = {
  Resumen: {
    eyebrow: 'Centro de control',
    title: 'Tu dinero, con dirección.',
    description: 'Consulta el estado de tu presupuesto y marca cada decisión cuando realmente la hayas cumplido.',
  },
  Ingresos: {
    eyebrow: 'Módulo de ingresos',
    title: 'Primero entra, después repartimos.',
    description: 'Registra el pago de nómina. Ese valor alimenta automáticamente todas las secciones del plan.',
  },
  Gastos: {
    eyebrow: 'Módulo de gastos',
    title: 'Gasta con un límite visible.',
    description: 'Tus gastos esenciales y libres salen del ingreso registrado. Marca cada bolsa cuando ya hayas separado ese dinero.',
  },
  Deudas: {
    eyebrow: 'Módulo de deuda e inversión',
    title: 'Cada pago tiene un propósito.',
    description: 'Registra cuánto debes y controla la asignación del 10% destinada a pagar deuda o invertir.',
  },
  Ahorros: {
    eyebrow: 'Módulo de ahorro',
    title: 'Ahorra antes de gastar.',
    description: 'Separa el ahorro y el fondo de emergencia desde el mismo ingreso. Completa cada tarea cuando el dinero esté apartado.',
  },
  Historial: {
    eyebrow: 'Registro de actividad',
    title: 'Mira cómo has avanzado.',
    description: 'Aquí quedan tus ingresos guardados localmente y el estado del último plan que construiste.',
  },
};

interface TaskListProps {
  tasks: BudgetTask[];
  expenses: ExpenseRecord[];
  onToggle: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, expenses, onToggle }) => (
  <div className="task-list">
    {tasks.map((task) => {
      const categoryExpenses = expenses.filter((expense) => expense.category === task.title).reduce((total, expense) => total + expense.amount, 0);
      const remaining = task.amount - categoryExpenses;
      return <IonItem className={`task-item ${task.done ? 'task-done' : ''} ${remaining < 0 ? 'task-over' : ''}`} key={task.id} lines="none">
        <span className={`task-dot ${task.category}`} slot="start" />
        <IonLabel>
          <h3>{task.title}</h3>
          <p>{Math.round(task.percentage * 100)}% · Gastado: {formatCurrency(categoryExpenses)}</p>
        </IonLabel>
        <div className="task-amount" slot="end">
          <strong>{remaining < 0 ? 'Exceso: ' : 'Queda: '}{formatCurrency(remaining)}</strong>
          <IonCheckbox
            aria-label={`Marcar ${task.title} como completado`}
            checked={task.done}
            onIonChange={() => onToggle(task.id)}
          />
        </div>
      </IonItem>;
    })}
  </div>
);

const Page: React.FC = () => {
  const { name = 'Resumen' } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const section = sectionContent[name] ? name : 'Resumen';
  const [finance, setFinance] = useState<FinanceState>(readFinanceState);
  const [incomeInput, setIncomeInput] = useState('');
  const [incomeSource, setIncomeSource] = useState('Nómina');
  const [debtInput, setDebtInput] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Gastos esenciales');
  const [moveSource, setMoveSource] = useState('');
  const [moveTarget, setMoveTarget] = useState('');
  const [moveAmount, setMoveAmount] = useState('');
  const incomeValue = Number(incomeInput) || 0;
  const debtValue = Number(debtInput) || 0;
  const activeContent = sectionContent[section];
  const completedTasks = finance.tasks.filter((task) => task.done).length;
  const expenseTasks = finance.tasks.filter((task) => task.category === 'expense');
  const debtTasks = finance.tasks.filter((task) => task.category === 'debt');
  const savingTasks = finance.tasks.filter((task) => task.category === 'saving');
  const currentMonth = getMonthKey(new Date().toISOString());
  const monthlyIncome = finance.incomes.filter((record) => getMonthKey(record.date) === currentMonth).reduce((total, record) => total + record.amount, 0);
  const totalIncome = finance.incomes.reduce((total, record) => total + record.amount, 0);
  const totalExpenses = finance.expenses.reduce((total, record) => total + record.amount, 0);
  const availableBalance = getCurrentBalance(finance);
  const allocatedTotal = finance.tasks.reduce((total, task) => total + task.amount, 0);
  const unassigned = Math.max(0, Math.round((finance.income - allocatedTotal) * 100) / 100);

  const persist = (nextFinance: FinanceState) => {
    setFinance(nextFinance);
    saveFinanceState(nextFinance);
  };

  const saveIncome = () => {
    if (incomeValue <= 0) return;
    const doneIds = finance.tasks.filter((task) => task.done).map((task) => task.id);
    const timestamp = Date.now();
    const incomeDate = new Date().toISOString();
    const incomeRecord: IncomeRecord = { id: timestamp, date: incomeDate, amount: incomeValue, source: incomeSource.trim() || 'Ingreso', period: getPayPeriod() };
    const incomeMovement: MovementRecord = { id: timestamp, date: incomeDate, type: 'income', amount: incomeValue, label: incomeRecord.source, category: 'Ingreso' };
    const nextFinance: FinanceState = {
      income: incomeValue,
      debt: debtValue,
      incomeDate,
      tasks: createTasks(incomeValue, doneIds),
      history: [
        { id: timestamp, date: incomeDate, income: incomeValue, debt: debtValue, period: getPayPeriod() },
        ...finance.history,
      ].slice(0, 20),
      incomes: [incomeRecord, ...finance.incomes].slice(0, 100),
      expenses: finance.expenses,
      movements: [incomeMovement, ...finance.movements],
    };
    persist(nextFinance);
    setIncomeInput('');
    setDebtInput('');
  };

  const saveExpense = () => {
    const amount = Number(expenseAmount) || 0;
    if (amount <= 0 || amount > availableBalance || !expenseDescription.trim()) return;
    const expense: ExpenseRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      amount,
      category: expenseCategory,
      description: expenseDescription.trim(),
    };
    const expenseMovement: MovementRecord = { id: expense.id, date: expense.date, type: 'expense', amount, label: expense.description, category: expense.category };
    persist({ ...finance, expenses: [expense, ...finance.expenses], movements: [expenseMovement, ...finance.movements] });
    setExpenseAmount('');
    setExpenseDescription('');
  };

  const moveMoney = () => {
    const amount = Number(moveAmount) || 0;
    if (amount <= 0 || !moveSource || !moveTarget || moveSource === moveTarget) return;
    const source = finance.tasks.find((task) => task.id === moveSource);
    if (!source || amount > source.amount) return;
    const movedTasks = finance.tasks.map((task) => {
      if (task.id === moveSource) return { ...task, amount: task.amount - amount };
      if (task.id === moveTarget) return { ...task, amount: task.amount + amount };
      return task;
    }).map((task) => ({ ...task, percentage: finance.income > 0 ? task.amount / finance.income : 0 }));
    persist({ ...finance, tasks: movedTasks });
    setMoveAmount('');
  };

  const toggleTask = (id: string) => {
    persist({
      ...finance,
      tasks: finance.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task),
    });
  };

  const renderIncome = () => (
    <IonCard className="income-card">
      <IonCardHeader>
        <IonCardTitle>Nuevo pago de nómina</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none" className="input-item">
          <IonLabel position="stacked">¿Cuánto recibiste hoy?</IonLabel>
          <IonInput
            aria-label="Pago de nómina"
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="0"
            value={incomeInput}
            onIonInput={(event) => setIncomeInput(event.detail.value ?? '')}
          />
        </IonItem>
        <IonItem lines="none" className="input-item">
          <IonLabel position="stacked">Origen del ingreso</IonLabel>
          <IonInput aria-label="Origen del ingreso" placeholder="Nómina, freelance, venta..." value={incomeSource} onIonInput={(event) => setIncomeSource(event.detail.value ?? '')} />
        </IonItem>
        <IonItem lines="none" className="input-item">
          <IonLabel position="stacked">Deuda total actual (opcional)</IonLabel>
          <IonInput
            aria-label="Deuda total actual"
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="0"
            value={debtInput}
            onIonInput={(event) => setDebtInput(event.detail.value ?? '')}
          />
        </IonItem>
        <IonButton expand="block" className="save-button" onClick={saveIncome} disabled={incomeValue <= 0}>
          Guardar y recalcular plan
        </IonButton>
        {finance.income > 0 && (
          <p className="connection-note">Último ingreso: <strong>{formatCurrency(finance.income)}</strong> · {getPayPeriod(new Date(finance.incomeDate))}. Esto se guarda como ingreso, todavía no como gasto.</p>
        )}
        {renderIncomeTable()}
      </IonCardContent>
    </IonCard>
  );

  const renderIncomeTable = () => (
    <section className="ledger-section">
      <div className="ledger-heading"><h3>Tabla de ingresos</h3><strong>{formatCurrency(totalIncome)}</strong></div>
      {finance.incomes.length > 0 ? (
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead><tr><th>Fecha</th><th>Origen</th><th>Quincena</th><th className="amount-cell">Valor</th></tr></thead>
            <tbody>{finance.incomes.map((income: IncomeRecord) => <tr key={income.id}><td>{new Date(income.date).toLocaleDateString('es-CO')}</td><td>{income.source}</td><td>{income.period}</td><td className="amount-cell">{formatCurrency(income.amount)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <div className="empty-state compact">No hay ingresos registrados.</div>}
    </section>
  );

  const renderExpenses = () => (
    <>
      <IonCard className="income-card expense-form-card">
        <IonCardHeader><IonCardTitle>Registrar gasto real</IonCardTitle></IonCardHeader>
        <IonCardContent>
          <p className="card-description">Este movimiento sí resta del saldo. El presupuesto de las bolsas solo es una guía.</p>
          <div className="expense-form-grid">
            <IonItem lines="none" className="input-item"><IonLabel position="stacked">¿Qué pagaste?</IonLabel><IonInput aria-label="Descripción del gasto" placeholder="Ej. transporte, mercado..." value={expenseDescription} onIonInput={(event) => setExpenseDescription(event.detail.value ?? '')} /></IonItem>
            <IonItem lines="none" className="input-item"><IonLabel position="stacked">Valor</IonLabel><IonInput aria-label="Valor del gasto" type="number" min="0" inputMode="decimal" placeholder="0" value={expenseAmount} onIonInput={(event) => setExpenseAmount(event.detail.value ?? '')} /></IonItem>
          </div>
          <IonItem lines="none" className="input-item"><IonLabel position="stacked">Categoría</IonLabel><IonSelect aria-label="Categoría del gasto" value={expenseCategory} onIonChange={(event) => setExpenseCategory(event.detail.value)}><IonSelectOption value="Gastos esenciales">Gastos esenciales</IonSelectOption><IonSelectOption value="Gastos libres">Gastos libres</IonSelectOption><IonSelectOption value="Deuda o inversión">Deuda o inversión</IonSelectOption><IonSelectOption value="Otro">Otro</IonSelectOption></IonSelect></IonItem>
          <IonButton expand="block" className="secondary-button" onClick={saveExpense} disabled={!expenseDescription.trim() || !expenseAmount || Number(expenseAmount) > availableBalance}>Guardar gasto real</IonButton>
          <p className="balance-note">Disponible después de gastos: <strong>{formatCurrency(availableBalance)}</strong></p>
        </IonCardContent>
      </IonCard>
      <section className="ledger-section">
        <div className="ledger-heading"><h3>Tabla de gastos</h3><strong>{formatCurrency(totalExpenses)}</strong></div>
        {finance.expenses.length > 0 ? <div className="ledger-table-wrap"><table className="ledger-table"><thead><tr><th>Fecha</th><th>Detalle</th><th>Categoría</th><th className="amount-cell">Valor</th></tr></thead><tbody>{finance.expenses.map((expense) => <tr key={expense.id}><td>{new Date(expense.date).toLocaleDateString('es-CO')}</td><td>{expense.description}</td><td>{expense.category}</td><td className="amount-cell">{formatCurrency(expense.amount)}</td></tr>)}</tbody></table></div> : <div className="empty-state compact">No hay gastos registrados. Registrar un ingreso no crea un gasto automáticamente.</div>}
      </section>
    </>
  );

  const renderMoneyTransfer = () => (
    <IonCard className="transfer-card">
      <IonCardHeader>
        <IonCardTitle>Mover dinero entre bolsas</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p className="card-description">Ajusta tu plan sin perder el control del total. El origen debe tener suficiente saldo.</p>
        <div className="transfer-grid">
          <IonItem lines="none" className="input-item">
            <IonLabel position="stacked">Mover desde</IonLabel>
            <IonSelect aria-label="Bolsa de origen" placeholder="Selecciona" value={moveSource} onIonChange={(event) => setMoveSource(event.detail.value)}>
              {finance.tasks.map((task) => <IonSelectOption key={task.id} value={task.id}>{task.title}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
          <IonItem lines="none" className="input-item">
            <IonLabel position="stacked">Mover hacia</IonLabel>
            <IonSelect aria-label="Bolsa de destino" placeholder="Selecciona" value={moveTarget} onIonChange={(event) => setMoveTarget(event.detail.value)}>
              {finance.tasks.map((task) => <IonSelectOption key={task.id} value={task.id}>{task.title}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
        </div>
        <IonItem lines="none" className="input-item">
          <IonLabel position="stacked">Valor a mover</IonLabel>
          <IonInput aria-label="Valor a mover" type="number" min="0" inputMode="decimal" placeholder="0" value={moveAmount} onIonInput={(event) => setMoveAmount(event.detail.value ?? '')} />
        </IonItem>
        <IonButton expand="block" className="secondary-button" onClick={moveMoney} disabled={!moveSource || !moveTarget || !moveAmount}>
          Confirmar movimiento
        </IonButton>
      </IonCardContent>
    </IonCard>
  );

  const renderTasks = (title: string, tasks: BudgetTask[], category: TaskCategory) => (
    <section className="module-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{category === 'expense' ? '55% + 5% del ingreso' : category === 'debt' ? '10% del ingreso' : '15% + 15% del ingreso'}</p>
          <h2>{title}</h2>
        </div>
        <span className="progress-badge">{tasks.filter((task) => task.done).length}/{tasks.length}</span>
      </div>
      {finance.income > 0 ? <TaskList tasks={tasks} expenses={finance.expenses} onToggle={toggleTask} /> : <div className="empty-state">Registra primero un ingreso en el módulo <strong>Ingresos</strong>.</div>}
    </section>
  );

  const renderSummary = () => (
    <>
      <section className="summary-strip">
        <div><span>Saldo actual</span><strong>{formatCurrency(availableBalance)}</strong></div>
        <div><span>Acumulado del mes</span><strong>{monthlyIncome > 0 ? formatCurrency(monthlyIncome) : 'Sin registrar'}</strong></div>
        <div><span>Tareas cumplidas</span><strong>{completedTasks} de {finance.tasks.length}</strong></div>
      </section>
      {unassigned > 0 && <div className="money-warning">Atención: tienes <strong>{formatCurrency(unassigned)}</strong> sin asignar. Muévelo a una bolsa para que no quede dinero suelto.</div>}
      {finance.income > 0 && renderMoneyTransfer()}
      {renderTasks('Estado de tu plan', finance.tasks, 'expense')}
    </>
  );

  const renderHistory = () => (
    <section className="module-section">
      <div className="section-heading">
        <div><p className="eyebrow">Guardado en este dispositivo</p><h2>Últimos ingresos</h2></div>
      </div>
      {finance.history.length > 0 ? (
        <IonList className="history-list">
          {finance.history.map((record) => (
            <IonItem key={record.id} lines="full">
              <IonLabel>
                <h3>{new Date(record.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</h3>
                <p>{record.period} · {record.debt > 0 ? `Deuda registrada: ${formatCurrency(record.debt)}` : 'Sin deuda registrada'}</p>
              </IonLabel>
              <strong slot="end">{formatCurrency(record.income)}</strong>
            </IonItem>
          ))}
        </IonList>
      ) : <div className="empty-state">Todavía no hay ingresos guardados.</div>}
      <div className="ledger-section">
        <div className="ledger-heading"><h3>Libro general de movimientos</h3><strong>{finance.movements.length} movimientos</strong></div>
        {finance.movements.length > 0 ? <div className="ledger-table-wrap"><table className="ledger-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Detalle</th><th className="amount-cell">Valor</th></tr></thead><tbody>{finance.movements.map((movement: MovementRecord) => <tr key={`${movement.type}-${movement.id}`}><td>{new Date(movement.date).toLocaleDateString('es-CO')}</td><td className={movement.type === 'income' ? 'movement-income' : 'movement-expense'}>{movement.type === 'income' ? 'Entrada' : 'Salida'}</td><td>{movement.label}</td><td className="amount-cell">{movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}</td></tr>)}</tbody></table></div> : <div className="empty-state compact">No hay movimientos todavía.</div>}
      </div>
    </section>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Finases / {section}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense"><IonToolbar><IonTitle size="large">Finases / {section}</IonTitle></IonToolbar></IonHeader>
        <main id="container" className="budget-page">
          <section className="budget-intro">
            <p className="eyebrow">{activeContent.eyebrow}</p>
            <h1>{activeContent.title}</h1>
            <p>{activeContent.description}</p>
          </section>
          {section === 'Ingresos' && renderIncome()}
          {section === 'Resumen' && renderSummary()}
          {section === 'Gastos' && renderExpenses()}
          {section === 'Deudas' && renderTasks('Deuda o inversión', debtTasks, 'debt')}
          {section === 'Ahorros' && renderTasks('Metas de ahorro', savingTasks, 'saving')}
          {section === 'Historial' && renderHistory()}
          {section !== 'Ingresos' && section !== 'Historial' && (
            <button className="quick-income-link" type="button" onClick={() => navigate('/folder/Ingresos')}>
              Actualizar ingreso base <span>→</span>
            </button>
          )}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Page;
