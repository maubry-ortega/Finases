export type TaskCategory = 'expense' | 'debt' | 'saving';

export interface BudgetTask {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  category: TaskCategory;
  done: boolean;
}

export interface BudgetHistory {
  id: number;
  date: string;
  income: number;
  debt: number;
  period: string;
}

export interface IncomeRecord {
  id: number;
  date: string;
  amount: number;
  source: string;
  period: string;
}

export interface ExpenseRecord {
  id: number;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface MovementRecord {
  id: number;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  label: string;
  category: string;
}

export interface FinanceState {
  income: number;
  debt: number;
  incomeDate: string;
  tasks: BudgetTask[];
  history: BudgetHistory[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  movements: MovementRecord[];
}

export const STORAGE_KEY = 'finases-finance-state';

export const createTasks = (income: number, doneIds: string[] = []): BudgetTask[] => [
  { id: 'essential', title: 'Gastos esenciales', percentage: 0.55, amount: income * 0.55, category: 'expense', done: doneIds.includes('essential') },
  { id: 'free', title: 'Gastos libres', percentage: 0.05, amount: income * 0.05, category: 'expense', done: doneIds.includes('free') },
  { id: 'debt', title: 'Deuda o inversión', percentage: 0.1, amount: income * 0.1, category: 'debt', done: doneIds.includes('debt') },
  { id: 'saving', title: 'Ahorro', percentage: 0.15, amount: income * 0.15, category: 'saving', done: doneIds.includes('saving') },
  { id: 'emergency', title: 'Fondo de emergencia', percentage: 0.15, amount: income * 0.15, category: 'saving', done: doneIds.includes('emergency') },
];

export const emptyFinanceState: FinanceState = {
  income: 0,
  debt: 0,
  incomeDate: '',
  tasks: createTasks(0),
  history: [],
  incomes: [],
  expenses: [],
  movements: [],
};

export const readFinanceState = (): FinanceState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyFinanceState;
    const parsed = JSON.parse(stored) as Partial<FinanceState>;
    const income = Number(parsed.income) || 0;
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const doneIds = tasks.filter((task) => task.done).map((task) => task.id);
    const history = Array.isArray(parsed.history) ? parsed.history.map((record) => ({
      ...record,
      period: record.period || getPayPeriod(new Date(record.date)),
    })) : [];
    const incomes = Array.isArray(parsed.incomes) ? parsed.incomes : history.map((record) => ({
      id: record.id,
      date: record.date,
      amount: record.income,
      source: 'Nómina',
      period: record.period,
    }));
    const expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
    const movements = Array.isArray(parsed.movements) ? parsed.movements : [
      ...incomes.map((record) => ({ id: record.id, date: record.date, type: 'income' as const, amount: record.amount, label: record.source, category: 'Ingreso' })),
      ...expenses.map((record) => ({ id: record.id, date: record.date, type: 'expense' as const, amount: record.amount, label: record.description, category: record.category })),
    ];
    return {
      income,
      debt: Number(parsed.debt) || 0,
      incomeDate: parsed.incomeDate || '',
      tasks: createTasks(income, doneIds),
      history,
      incomes,
      expenses,
      movements,
    };
  } catch {
    return emptyFinanceState;
  }
};

export const saveFinanceState = (state: FinanceState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getPayPeriod = (date = new Date()): string =>
  date.getDate() <= 15 ? 'Primera quincena' : 'Segunda quincena';

export const getMonthKey = (date: string): string => {
  const parsedDate = new Date(date);
  return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
};

export const getCurrentBalance = (state: FinanceState): number =>
  state.movements.reduce((balance, movement) => movement.type === 'income' ? balance + movement.amount : balance - movement.amount, 0);
