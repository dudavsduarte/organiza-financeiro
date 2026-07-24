export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const shortDate = (date: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`))
export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
export const uid = () => crypto.randomUUID()
