import AdminGuard from '@/components/auth/AdminGuard';
import AdminAudioAlerts from '@/components/admin/AdminAudioAlerts';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminAudioAlerts />
      {children}
    </AdminGuard>
  );
}
