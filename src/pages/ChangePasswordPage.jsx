import { useState } from 'react';
import { Mail, Save } from 'lucide-react';
import { changePasswordApi } from '../api/users'; 
import { useAuth } from '../hooks/useAuth';
import PasswordField from '../components/PasswordField';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const currentUserEmail = user?.email || "";

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('Password baru harus minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    try {
      await changePasswordApi({ oldPassword, newPassword, confirmPassword });
      
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah password');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Ubah Password</h2>
        <p className="text-sm text-gray-500">Perbarui password untuk akun Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email (Read-Only) */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Email (Saat ini)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={currentUserEmail}
              disabled
              className="w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed sm:text-sm"
            />
          </div>
        </div>

        <PasswordField
          label="Password Saat Ini"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Masukkan password saat ini"
          visible={showOldPassword}
          onToggle={() => setShowOldPassword(!showOldPassword)}
        />
        <PasswordField
          label="Password Baru"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Masukkan password baru"
          visible={showNewPassword}
          onToggle={() => setShowNewPassword(!showNewPassword)}
        />
        <PasswordField
          label="Konfirmasi Password Baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ulangi password baru"
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">Password berhasil diperbarui!</p>}

        <button
          type="submit"
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Save className="h-4 w-4" />
          Simpan Password Baru
        </button>
      </form>
    </div>
  );
};
