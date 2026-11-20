import { useFeedback } from '../hooks/useFeedback';
import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
import { getUsersApi, deleteUserApi, updateUserApi } from '../api/users';
import { useAuth } from '../hooks/useAuth';

export default function UserPage() {
  const { notify, confirmAction, feedback } = useFeedback();
  const { role, user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [refreshKey, setRefreshKey] = useState(0);

  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Effect untuk Debounce Pencarian (menunggu 500ms setelah selesai mengetik)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset ke halaman 1 saat pencarian berubah
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getUsersApi(
          page,
          limit,
          debouncedSearch
        );

        if (isMounted) {
          setUsers(response.data || []);
          setTotalPages(response.total_pages || 1);

          // Backend bisa mengoreksi page jika page sebelumnya
          // sudah tidak tersedia setelah search/delete.
          if (response.page && response.page !== page) {
            setPage(response.page);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
            'Gagal mengambil data pengguna'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [page, refreshKey, debouncedSearch]); // Trigger ulang jika page, refreshKey, atau debouncedSearch berubah

  const handleDelete = async (id, name) => {
    if (id === currentUser.id) {
      notify("Anda tidak bisa menghapus akun Anda sendiri.", "error");
      return;
    }
    
    if (await confirmAction(`Apakah Anda yakin ingin menghapus user "${name}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus pengguna', confirmLabel: 'Ya, hapus',
    })) {
      try {
        await deleteUserApi(id);
        notify('Pengguna berhasil dihapus.');
        setRefreshKey(oldKey => oldKey + 1); 
      } catch (err) {
        notify(err.response?.data?.message || 'Gagal menghapus user', 'error');
      }
    }
  };

  const openEditModal = (u) => {
    if (u.id === currentUser.id) {
      notify("Anda tidak bisa mengubah role Anda sendiri dari halaman ini.", "error");
      return;
    }

    const targetRole = u.role?.name || u.role;

    if (role === 'admin') {
      if (targetRole === 'super_admin' || targetRole === 'admin') {
        notify("Admin tidak memiliki izin untuk mengubah akun Super Admin atau sesama Admin.", "error");
        return;
      }
    }
    
    setEditingUser(u);
    setNewRole(targetRole || 'guest');
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setNewRole('');
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSubmitting(true);
    try {
      await updateUserApi(editingUser.id, { role: newRole });
      notify('Role pengguna berhasil diperbarui.');
      setRefreshKey(oldKey => oldKey + 1); // Refresh tabel
      closeEditModal(); // Tutup popup
    } catch (err) {
      notify(err.response?.data?.message || 'Gagal mengubah role user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'super_admin':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 rounded-full">Super Admin</span>;
      case 'admin':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 rounded-full">Admin</span>;
      case 'operator':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 rounded-full">Operator</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 rounded-full">Guest</span>;
    }
  };

  const canManage = role === 'super_admin' || role === 'admin';

  return (
    <div className="flex flex-col h-full relative">
      {feedback}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Manajemen Pengguna</h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari user..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-500 gap-2">
              <ShieldAlert size={32} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <AlertCircle size={32} />
              <p className="text-sm">Belum ada data user.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Perusahaan</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  {canManage && <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const targetRole = u.role?.name || u.role;
                  const isProtected = canManage && (
                    u.id === currentUser.id ||
                    (role === 'admin' && (targetRole === 'super_admin' || targetRole === 'admin'))
                  );
                  return (
                    <tr key={u.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {u.full_name?.slice(0, 2).toUpperCase() || '??'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.company || <span className="text-gray-300 italic">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(targetRole)}
                      </td>

                      {canManage && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isProtected
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-sky-500 hover:bg-sky-50'
                            }`}
                            title={isProtected ? "Tidak memiliki izin untuk mengubah akun ini" : "Edit Role User"}
                            disabled={isProtected}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.full_name)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isProtected
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title={isProtected ? "Tidak memiliki izin untuk menghapus akun ini" : "Hapus User"}
                            disabled={isProtected}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Halaman <span className="font-semibold text-gray-700">{page}</span> dari <span className="font-semibold text-gray-700">{totalPages}</span>
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit Role */}
      {editingUser !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Ubah Role User</h2>
            </div>
            
            <form onSubmit={handleUpdateRole} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pengguna</label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                    {editingUser.full_name} ({editingUser.email})
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Baru</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeEditModal} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}