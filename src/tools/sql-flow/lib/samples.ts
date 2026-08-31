// ============================================================================
// Consultas de ejemplo.
// ----------------------------------------------------------------------------
// Vienen sin formatear a propósito: enseñan el problema que resuelve la tool.
// El texto SQL no se traduce (es código); la etiqueta sí, vía `sample_<id>`.
// ============================================================================

import type { SqlLanguage } from 'sql-formatter';

export interface Sample {
  id: string;
  dialect: SqlLanguage;
  sql: string;
}

export const SAMPLES: Sample[] = [
  {
    id: 'report',
    dialect: 'postgresql',
    sql: `select c.id, c.name, count(o.id) as orders, sum(o.total)::numeric(10,2) as revenue from customers c left join orders o on o.customer_id = c.id and o.status = 'paid' where c.created_at >= now() - interval '90 days' group by c.id, c.name having count(o.id) > 3 order by revenue desc limit 50;`,
  },
  {
    id: 'cte',
    dialect: 'postgresql',
    sql: `with monthly as (select date_trunc('month', created_at) as month, sum(total) as revenue from orders where status = 'paid' group by 1), growth as (select month, revenue, lag(revenue) over (order by month) as previous from monthly) select month, revenue, round(100.0 * (revenue - previous) / nullif(previous, 0), 1) as pct from growth order by month;`,
  },
  {
    id: 'ddl',
    dialect: 'postgresql',
    sql: `create table if not exists invoices (id bigserial primary key, customer_id bigint not null references customers (id) on delete cascade, issued_on date not null default current_date, amount numeric(12,2) not null check (amount >= 0), notes text, unique (customer_id, issued_on)); create index invoices_customer_idx on invoices (customer_id, issued_on desc);`,
  },
  {
    id: 'params',
    dialect: 'postgresql',
    sql: `select p.sku, p.title, i.quantity from products p join inventory i on i.product_id = p.id where p.category = :category and i.quantity < :threshold and p.updated_at > $1 order by i.quantity asc;`,
  },
  {
    id: 'messy',
    dialect: 'mysql',
    sql: `SELECT * FROM \`users\` u, orders o /* ojo: falta la condicion de union */ WHERE u.email LIKE '%@example.com' -- clientes de prueba
AND o.total > 100 LIMIT 10, 20`,
  },
  {
    id: 'broken',
    dialect: 'sql',
    sql: `update accounts set balance = balance - 100, updated_at = now() where id in (select account_id from transfers where created_at > '2024-01-01';`,
  },
];
