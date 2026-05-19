import '../css/admin.css';
import { createRoot } from 'react-dom/client';
import AdminApp from './admin/AdminApp';

createRoot(document.getElementById('admin')).render(<AdminApp />);
