import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useNavigate ? useRef(null) : null;
  const navigate = useNavigate();

  const fetchNotifications = () => {
    notificationAPI.list({ limit: 10 })
      .then((r) => {
        setItems(r.data.data.items);
        setUnreadCount(r.data.data.unreadCount);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = async (n) => {
    if (!n.read) {
      await notificationAPI.markRead(n._id).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: 8, position: 'relative',
          background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text)" strokeWidth="2">
          <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
            borderRadius: 99, minWidth: 16, height: 16, padding: '0 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42, width: 320, maxHeight: 420,
          overflowY: 'auto', background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderBottom: '1px solid var(--clr-border)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{
                fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 13, color: 'var(--clr-text-muted)' }}>
              No notifications yet
            </div>
          ) : items.map((n) => (
            <div
              key={n._id}
              onClick={() => handleItemClick(n)}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--clr-border)',
                background: n.read ? 'transparent' : 'rgba(99,102,241,0.06)',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--clr-text)' }}>{n.title}</div>
              {n.body && <div style={{ fontSize: 11.5, color: 'var(--clr-text-muted)', marginTop: 2 }}>{n.body}</div>}
              <div style={{ fontSize: 10.5, color: 'var(--clr-text-muted)', marginTop: 4 }}>
                {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}