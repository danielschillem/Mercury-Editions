import { useState, useEffect } from 'react';
import { api } from './api';

const statIcons = {
  books: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  authors: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    </svg>
  ),
  orders: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  revenue: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/api/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /><span>Chargement...</span></div>;
  if (!data) return <div className="admin-empty">Impossible de charger le tableau de bord.</div>;

  const { stats, recentOrders, dailyRevenue, topBooks } = data;

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

  const statusBadge = (s) => {
    const map = { completed: 'badge-success', pending: 'badge-warning', failed: 'badge-danger' };
    const labels = { completed: 'Terminee', pending: 'En attente', failed: 'Echouee' };
    return <span className={`badge ${map[s] || 'badge-muted'}`}>{labels[s] || s}</span>;
  };

  const totalOrders = stats.total_orders || 1;
  const completedPct = Math.round((stats.completed_orders / totalOrders) * 100);
  const pendingPct = Math.round((stats.pending_orders / totalOrders) * 100);
  const failedPct = 100 - completedPct - pendingPct;

  return (
    <div>
      {/* KPI cards */}
      <div className="stats-grid stats-grid-4">
        <div className="stat-card stat-card-accent">
          <div className="stat-card-icon stat-icon-blue">{statIcons.books}</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.total_books}</div>
            <div className="stat-card-label">Livres au catalogue</div>
          </div>
        </div>
        <div className="stat-card stat-card-accent">
          <div className="stat-card-icon stat-icon-purple">{statIcons.authors}</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.total_authors}</div>
            <div className="stat-card-label">Auteurs</div>
          </div>
        </div>
        <div className="stat-card stat-card-accent">
          <div className="stat-card-icon stat-icon-orange">{statIcons.orders}</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.total_orders}</div>
            <div className="stat-card-label">Commandes totales</div>
          </div>
        </div>
        <div className="stat-card stat-card-accent">
          <div className="stat-card-icon stat-icon-green">{statIcons.revenue}</div>
          <div className="stat-card-content">
            <div className="stat-card-value stat-value-green">{fmt(stats.total_revenue)}</div>
            <div className="stat-card-label">Revenus (FCFA)</div>
          </div>
        </div>
      </div>

      {/* Order status breakdown */}
      <div className="dashboard-row">
        <div className="admin-card dashboard-chart-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Repartition des commandes</span>
          </div>
          <div className="admin-card-body">
            <div className="order-breakdown">
              <div className="breakdown-bar">
                <div className="breakdown-segment segment-success" style={{ width: `${completedPct}%` }} title={`Terminees: ${completedPct}%`} />
                <div className="breakdown-segment segment-warning" style={{ width: `${pendingPct}%` }} title={`En attente: ${pendingPct}%`} />
                <div className="breakdown-segment segment-danger" style={{ width: `${failedPct}%` }} title={`Echouees: ${failedPct}%`} />
              </div>
              <div className="breakdown-legend">
                <div className="legend-item">
                  <span className="legend-dot dot-success" />
                  <span className="legend-label">Terminees</span>
                  <span className="legend-value">{stats.completed_orders}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-warning" />
                  <span className="legend-label">En attente</span>
                  <span className="legend-value">{stats.pending_orders}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-danger" />
                  <span className="legend-label">Echouees</span>
                  <span className="legend-value">{Math.max(0, stats.total_orders - stats.completed_orders - stats.pending_orders)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card dashboard-summary-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Resume rapide</span>
          </div>
          <div className="admin-card-body">
            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-label">Taux de completion</span>
                <span className="summary-value summary-success">{completedPct}%</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Revenu moyen / commande</span>
                <span className="summary-value">{stats.total_orders > 0 ? fmt(Math.round(stats.total_revenue / stats.total_orders)) : 0} FCFA</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Livres / auteur</span>
                <span className="summary-value">{stats.total_authors > 0 ? (stats.total_books / stats.total_authors).toFixed(1) : 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Commandes en attente</span>
                <span className="summary-value summary-warning">{stats.pending_orders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue chart + Top books */}
      <div className="dashboard-row">
        <div className="admin-card dashboard-chart-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Revenus - 7 derniers jours</span>
          </div>
          <div className="admin-card-body">
            {dailyRevenue && dailyRevenue.length > 0 ? (
              <RevenueChart data={dailyRevenue} fmt={fmt} />
            ) : (
              <div className="admin-empty">Aucune donnée de revenus.</div>
            )}
          </div>
        </div>

        <div className="admin-card dashboard-summary-card">
          <div className="admin-card-header">
            <span className="admin-card-title">Top 5 des ventes</span>
          </div>
          <div className="admin-card-body">
            {topBooks && topBooks.length > 0 ? (
              <div className="top-books-list">
                {topBooks.map((b, i) => (
                  <div key={i} className="top-book-item">
                    <div className="top-book-rank">#{i + 1}</div>
                    <div className="top-book-info">
                      <div className="top-book-title">{b.title}</div>
                      <div className="top-book-author">{b.author}</div>
                    </div>
                    <div className="top-book-stats">
                      <span className="top-book-sales">{b.sales} vente{b.sales > 1 ? 's' : ''}</span>
                      <span className="top-book-revenue">{fmt(b.revenue)} F</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">Aucune vente enregistrée.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Commandes recentes</span>
          <span className="admin-card-count">{recentOrders.length} dernieres</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="admin-empty">Aucune commande pour le moment.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td><span className="ref-code">{order.reference}</span></td>
                    <td>{order.buyer_name || order.customer_name || '-'}</td>
                    <td className="text-bold">{fmt(order.total_amount)} FCFA</td>
                    <td>{statusBadge(order.status)}</td>
                    <td className="text-muted text-sm">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueChart({ data, fmt }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="revenue-chart">
      <div className="revenue-bars">
        {data.map((d, i) => {
          const pct = Math.round((d.revenue / maxRevenue) * 100);
          return (
            <div key={i} className="revenue-bar-col">
              <div className="revenue-bar-value">{d.revenue > 0 ? fmt(d.revenue) : ''}</div>
              <div className="revenue-bar-track">
                <div className="revenue-bar-fill" style={{ height: `${Math.max(pct, 2)}%` }} />
              </div>
              <div className="revenue-bar-label">{d.label}</div>
              <div className="revenue-bar-orders">{d.orders} cmd</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
